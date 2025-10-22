import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import Product from '../../../models/Product';
import TopFarmersConfig, { ITopFarmersConfig } from '../../../models/TopFarmersConfig';

// Types for better type safety
interface FarmerDocument {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
  specialties?: string[];
  averageRating: number;
  totalSales: number;
  productCount: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ProductDocument {
  _id: string;
  category: string;
  salesCount: number;
  averageRating: number;
}

interface FilterCriteria {
  performance?: string | null;
  category?: string | null;
  rating?: number;
}

interface SortOption {
  id: string;
  name: string;
  field: string;
  direction: 'asc' | 'desc';
  enabled: boolean;
  order: number;
}

interface PerformanceFilter {
  id: string;
  name: string;
  enabled: boolean;
  order: number;
}

interface CategoryFilter {
  id: string;
  name: string;
  slug: string;
  enabled: boolean;
  order: number;
}

interface FilterWithCount {
  id: string;
  name: string;
  count: number;
}

interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  count: number;
}

// Cache for configuration and computed rankings
let configCache: ITopFarmersConfig | null = null;
let configCacheTime = 0;
let rankingsCache: Record<string, number> | null = null;
let rankingsCacheTime = 0;

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const performance = searchParams.get('performance');
    const category = searchParams.get('category');
    const rating = searchParams.get('rating');
    const sort = searchParams.get('sort');
    const page = parseInt(searchParams.get('page') || '1');
    const requestedLimit = parseInt(searchParams.get('limit') || '10');

    // Load configuration from database with caching
    const config = await loadTopFarmersConfig();
    if (!config) {
      return NextResponse.json(
        { error: 'Top farmers configuration not found' },
        { status: 404 }
      );
    }

    // Validate and limit the requested items per page
    const limit = Math.min(requestedLimit, config.pagination.maxItemsPerPage);
    const effectiveSort = sort || config.sorting.defaultSort;

    // Build the dynamic MongoDB query based on configuration
    const query = await buildTopFarmersQuery(config, {
      performance,
      category,
      rating: rating ? parseFloat(rating) : undefined
    });

    // Build sort object based on configuration
    const sortObject = buildSortObject(config, effectiveSort);

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get or compute top farmer rankings
    const rankings = await getTopFarmerRankings(config);

    // Get farmers with their computed statistics
    const farmers = await User.find(query)
      .sort(sortObject)
      .skip(skip)
      .limit(limit)
      .select('firstName lastName email profilePicture specialties averageRating totalSales productCount reviewCount createdAt updatedAt')
      .lean();

    // Enhance farmers with computed statistics and rankings
    const enhancedFarmers = await Promise.all(
      farmers.map(async (farmer: any, index: number) => {
        const farmerId = farmer._id.toString();
        const farmerProducts = await Product.find({ 
          farmerId: farmer._id,
          status: 'active'
        }).select('category salesCount averageRating').lean();

        const categories = [...new Set(farmerProducts.map((p: any) => p.category))];
        const totalProductSales = farmerProducts.reduce((sum: number, p: any) => sum + (p.salesCount || 0), 0);
        const avgProductRating = farmerProducts.length > 0 
          ? farmerProducts.reduce((sum: number, p: any) => sum + (p.averageRating || 0), 0) / farmerProducts.length
          : 0;

        return {
          ...farmer,
          rank: skip + index + 1,
          categories: categories.slice(0, 3), // Show top 3 categories
          productCount: farmerProducts.length,
          totalSales: totalProductSales,
          averageRating: avgProductRating,
          topFarmerScore: rankings ? rankings[farmerId] || 0 : 0,
          profilePicture: farmer.profilePicture || '/images/default-farmer.png'
        };
      })
    );

    // Get total count for pagination
    const totalFarmers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalFarmers / limit);

    // Get dynamic performance filters with counts
    const performanceFilters = await getDynamicPerformanceFilters(config, query);

    // Get dynamic categories with counts
    const categoryFilters = await getDynamicCategoryFilters(config, query);

    return NextResponse.json({
      farmers: enhancedFarmers,
      performanceFilters,
      categoryFilters,
      banner: config.banner.enabled ? config.banner : null,
      sorting: {
        options: config.sorting.options.filter((opt: SortOption) => opt.enabled).sort((a: SortOption, b: SortOption) => a.order - b.order),
        current: effectiveSort
      },
      filters: {
        performance: config.filters.performance.filter((perf: PerformanceFilter) => perf.enabled).sort((a: PerformanceFilter, b: PerformanceFilter) => a.order - b.order),
        categories: config.filters.categories.filter((cat: CategoryFilter) => cat.enabled).sort((a: CategoryFilter, b: CategoryFilter) => a.order - b.order),
        ratings: config.filters.ratings
      },
      pagination: {
        totalFarmers,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      message: 'Top farmers fetched successfully'
    });

  } catch (error) {
    console.error('Error fetching top farmers:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to fetch top farmers'
      },
      { status: 500 }
    );
  }
}

// Load configuration with caching
async function loadTopFarmersConfig() {
  const now = Date.now();
  const cacheValid = configCache && (now - configCacheTime) < (configCache?.cacheSettings?.ttlMinutes || 30) * 60 * 1000;
  
  if (cacheValid) {
    return configCache;
  }

  const config = await TopFarmersConfig.findOne({ isActive: true }).lean();
  
  if (!config) {
    // Create default configuration if none exists
    const defaultConfig = await createDefaultTopFarmersConfig();
    configCache = defaultConfig;
    configCacheTime = now;
    return defaultConfig;
  }

  configCache = config;
  configCacheTime = now;
  return config;
}

// Create default configuration
async function createDefaultTopFarmersConfig() {
  const defaultConfig = new TopFarmersConfig({
    banner: {
      title: 'Top Farmers',
      subtitle: 'Meet our highest-rated and most productive farmers',
      buttonText: 'Explore Farmers',
      buttonLink: '#farmers',
      heroImage: process.env.DEFAULT_TOP_FARMERS_HERO_IMAGE || '/images/top-farmers-hero.jpg',
      backgroundColor: 'linear-gradient(135deg, #DCFCE7 0%, #F0FDF4 50%, #ECFDF5 100%)',
      textColor: '#1E3A2F',
      enabled: true
    },
    filters: {
      performance: [
        { id: 'all', name: 'All', enabled: true, order: 0 },
        { id: 'top_rated', name: 'Top Rated', enabled: true, order: 1 },
        { id: 'top_sellers', name: 'Top Sellers', enabled: true, order: 2 },
        { id: 'most_productive', name: 'Most Productive', enabled: true, order: 3 },
        { id: 'trending', name: 'Trending', enabled: true, order: 4 },
        { id: 'most_reviewed', name: 'Most Reviewed', enabled: true, order: 5 }
      ],
      categories: [
        { id: 'all', name: 'All', slug: 'all', enabled: true, order: 0 },
        { id: 'leafy-greens', name: 'Leafy Greens', slug: 'leafy-greens', enabled: true, order: 1 },
        { id: 'root-crops', name: 'Root Crops', slug: 'root-crops', enabled: true, order: 2 },
        { id: 'fruits', name: 'Fruits', slug: 'fruits', enabled: true, order: 3 },
        { id: 'spices-aromatics', name: 'Spices & Aromatics', slug: 'spices-aromatics', enabled: true, order: 4 },
        { id: 'eggplant-gourds', name: 'Eggplants & Gourds', slug: 'eggplant-gourds', enabled: true, order: 5 },
        { id: 'grains-rice', name: 'Grains & Rice', slug: 'grains-rice', enabled: true, order: 6 }
      ],
      ratings: { enabled: true, minRating: 1, maxRating: 5 }
    },
    sorting: {
      options: [
        { id: 'top_rated', name: 'Top Rated', field: 'averageRating', direction: 'desc', enabled: true, order: 0 },
        { id: 'most_reviewed', name: 'Most Reviewed', field: 'reviewCount', direction: 'desc', enabled: true, order: 1 },
        { id: 'newest', name: 'Newest', field: 'createdAt', direction: 'desc', enabled: true, order: 2 },
        { id: 'name', name: 'Name', field: 'firstName', direction: 'asc', enabled: true, order: 3 }
      ],
      defaultSort: 'top_rated'
    },
    topFarmersCriteria: {
      salesWeight: 0.3,
      ratingWeight: 0.3,
      productCountWeight: 0.2,
      reviewCountWeight: 0.1,
      recentActivityWeight: 0.1,
      minSalesForTopFarmer: 5,
      minRatingForTopFarmer: 4.0,
      minProductsForTopFarmer: 3,
      timeframeDays: 30
    },
    pagination: { itemsPerPage: 10, maxItemsPerPage: 50 },
    cacheSettings: { ttlMinutes: 30, enabled: true },
    isActive: true
  });

  await defaultConfig.save();
  return defaultConfig.toObject();
}

// Build top farmers query based on configuration
async function buildTopFarmersQuery(config: ITopFarmersConfig, filters: FilterCriteria) {
  const { topFarmersCriteria } = config;
  const query: Record<string, any> = {
    role: 'farmer',
    status: 'active',
    isVerified: true
  };

  // Apply performance filter
  if (filters.performance && filters.performance !== 'all') {
    switch (filters.performance) {
      case 'top_rated':
        query.averageRating = { $gte: topFarmersCriteria.minRatingForTopFarmer };
        break;
      case 'top_sellers':
        query.totalSales = { $gte: topFarmersCriteria.minSalesForTopFarmer };
        break;
      case 'most_productive':
        query.productCount = { $gte: topFarmersCriteria.minProductsForTopFarmer };
        break;
      case 'trending':
        const recentDate = new Date(Date.now() - topFarmersCriteria.timeframeDays * 24 * 60 * 60 * 1000);
        query.updatedAt = { $gte: recentDate };
        break;
      case 'most_reviewed':
        query.reviewCount = { $gte: 5 };
        break;
    }
  }

  // Apply rating filter
  if (filters.rating !== undefined) {
    query.averageRating = { $gte: filters.rating };
  }

  return query;
}

// Build sort object based on configuration
function buildSortObject(config: ITopFarmersConfig, sortId: string): Record<string, 1 | -1> {
  const sortOption = config.sorting.options.find((opt: SortOption) => opt.id === sortId);
  
  if (!sortOption) {
    return { averageRating: -1, totalSales: -1, createdAt: -1 };
  }

  return { [sortOption.field]: sortOption.direction === 'asc' ? 1 : -1 };
}

// Compute and cache top farmer rankings
async function getTopFarmerRankings(config: ITopFarmersConfig) {
  const now = Date.now();
  const cacheValid = rankingsCache && (now - rankingsCacheTime) < config.cacheSettings.ttlMinutes * 60 * 1000;
  
  if (cacheValid && config.cacheSettings.enabled) {
    return rankingsCache;
  }

  const { topFarmersCriteria } = config;
  
  const farmers = await User.find({
    role: 'farmer',
    status: 'active',
    isVerified: true
  }).select('averageRating totalSales productCount reviewCount updatedAt').lean();

  // Compute top farmer scores
  const rankings: Record<string, number> = {};
  
  farmers.forEach((farmer: FarmerDocument) => {
    const salesScore = Math.min(farmer.totalSales || 0, 1000) / 1000;
    const ratingScore = Math.min(farmer.averageRating || 0, 5) / 5;
    const productScore = Math.min(farmer.productCount || 0, 100) / 100;
    const reviewScore = Math.min(farmer.reviewCount || 0, 100) / 100;
    
    const daysSinceUpdate = (Date.now() - new Date(farmer.updatedAt).getTime()) / (24 * 60 * 60 * 1000);
    const recentScore = Math.max(0, 1 - (daysSinceUpdate / topFarmersCriteria.timeframeDays));
    
    const topFarmerScore = 
      salesScore * topFarmersCriteria.salesWeight +
      ratingScore * topFarmersCriteria.ratingWeight +
      productScore * topFarmersCriteria.productCountWeight +
      reviewScore * topFarmersCriteria.reviewCountWeight +
      recentScore * topFarmersCriteria.recentActivityWeight;
    
    rankings[farmer._id.toString()] = topFarmerScore;
  });

  rankingsCache = rankings;
  rankingsCacheTime = now;
  
  return rankings;
}

// Get dynamic performance filters with counts
async function getDynamicPerformanceFilters(config: ITopFarmersConfig, baseQuery: Record<string, any>) {
  const performanceFilters = config.filters.performance.filter((perf: PerformanceFilter) => perf.enabled);
  
  const filtersWithCounts = await Promise.all(
    performanceFilters.map(async (filter: PerformanceFilter) => {
      let count = 0;
      
      if (filter.id === 'all') {
        count = await User.countDocuments(baseQuery);
      } else {
        const filterQuery = { ...baseQuery };
        
        switch (filter.id) {
          case 'top_rated':
            filterQuery.averageRating = { $gte: 4.0 };
            break;
          case 'top_sellers':
            filterQuery.totalSales = { $gte: 5 };
            break;
          case 'most_productive':
            filterQuery.productCount = { $gte: 3 };
            break;
          case 'trending':
            const recentDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            filterQuery.updatedAt = { $gte: recentDate };
            break;
          case 'most_reviewed':
            filterQuery.reviewCount = { $gte: 5 };
            break;
        }
        
        count = await User.countDocuments(filterQuery);
      }
      
      return {
        id: filter.id,
        name: filter.name,
        count
      };
    })
  );

  return filtersWithCounts.filter((filter: FilterWithCount) => filter.count > 0 || filter.id === 'all');
}

// Get dynamic category filters with counts
async function getDynamicCategoryFilters(config: ITopFarmersConfig, baseQuery: Record<string, any>) {
  const categoryFilters = config.filters.categories.filter((cat: CategoryFilter) => cat.enabled);
  
  const filtersWithCounts = await Promise.all(
    categoryFilters.map(async (category: CategoryFilter) => {
      let count = 0;
      
      if (category.id === 'all') {
        count = await User.countDocuments(baseQuery);
      } else {
        // Count farmers who have products in this category
        const farmersWithCategory = await Product.distinct('farmerId', {
          category: category.slug,
          status: 'active'
        });
        
        const categoryQuery = {
          ...baseQuery,
          _id: { $in: farmersWithCategory }
        };
        
        count = await User.countDocuments(categoryQuery);
      }
      
      return {
        id: category.id,
        name: category.name,
        slug: category.slug,
        count
      };
    })
  );

  return filtersWithCounts.filter((category: CategoryWithCount) => category.count > 0 || category.id === 'all');
}
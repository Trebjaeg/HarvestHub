import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import Product from '../../../models/Product';
import TopFarmersConfig, { ITopFarmersConfig } from '../../../models/TopFarmersConfig';
import { applyRateLimit } from '@/lib/app-rate-limiter';

// Types for better type safety
interface FarmerStats {
  totalSales: number;
  averageRating: number;
  productCount: number;
  reviewCount: number;
  categories: string[];
  score: number;
  firstName: string;
  createdAt: Date;
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
  // Apply rate limiting: 150 requests per 15 minutes for top farmers browsing
  const rateLimitResponse = await applyRateLimit(request, {
    windowMs: 15 * 60 * 1000,
    max: 150,
  });
  if (rateLimitResponse) return rateLimitResponse;

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

    // Get or compute top farmer rankings with real-time data
    const rankings = await getTopFarmerRankingsRealTime(config);

    // Apply sorting based on user selection
    const sortOption = config.sorting.options.find((opt: SortOption) => opt.id === effectiveSort);
    let farmerIds: string[];
    
    if (sortOption) {
      farmerIds = Object.entries(rankings)
        .sort(([, a], [, b]) => {
          const aValue = (a as any)[sortOption.field];
          const bValue = (b as any)[sortOption.field];
          
          // Handle different field types
          if (sortOption.field === 'firstName' || sortOption.field === 'name') {
            // String comparison for name sorting
            const aStr = String(aValue || '').toLowerCase();
            const bStr = String(bValue || '').toLowerCase();
            const result = aStr.localeCompare(bStr);
            return sortOption.direction === 'asc' ? result : -result;
          } else {
            // Numeric comparison for other fields
            const aNum = Number(aValue) || 0;
            const bNum = Number(bValue) || 0;
            const result = aNum - bNum;
            return sortOption.direction === 'asc' ? result : -result;
          }
        })
        .map(([id]) => id);
    } else {
      // Fallback to default sorting if option not found
      farmerIds = Object.entries(rankings)
        .sort(([, a], [, b]) => (b as any).totalSales - (a as any).totalSales)
        .map(([id]) => id);
    }

    // Apply additional filters but maintain ranking order
    const filteredQuery = { ...query, _id: { $in: farmerIds } };

    // Get farmers with their computed statistics
    const farmers = await User.find(filteredQuery)
      .select('firstName lastName name email profilePicture profileImage specialties createdAt updatedAt')
      .lean();

    // Create a map for quick lookup
    const farmerMap = new Map(farmers.map((f: any) => [f._id.toString(), f]));

    // Enhance farmers with real-time computed statistics from their products
    const enhancedFarmers = farmerIds
      .filter(id => {
        const stats = rankings[id];
        // Only show farmers with at least 1 product
        return farmerMap.has(id) && stats && stats.productCount > 0;
      })
      .slice(skip, skip + limit)
      .map((farmerId: string, index: number) => {
        const farmer: any = farmerMap.get(farmerId);
        const stats = rankings[farmerId];
        
        if (!farmer || !stats) return null;

        // Use name field if firstName/lastName are not available
        const firstName = farmer.firstName || farmer.name || 'Unknown';
        const lastName = farmer.lastName || '';

        // Get profile picture - check both fields and provide fallback
        const profilePicture = farmer.profilePicture || 
                              farmer.profileImage || 
                              '/images/default-farmer.png';

        return {
          ...farmer,
          firstName,
          lastName,
          rank: skip + index + 1,
          categories: stats.categories || [],
          productCount: stats.productCount || 0,
          totalSales: stats.totalSales || 0,
          averageRating: stats.averageRating || 0,
          reviewCount: stats.reviewCount || 0,
          topFarmerScore: stats.score || 0,
          profilePicture // Use the resolved profile picture
        };
      })
      .filter(f => f !== null);

    // Get total count for pagination (only farmers with products)
    const totalFarmers = farmerIds.filter(id => {
      const stats = rankings[id];
      return farmerMap.has(id) && stats && stats.productCount > 0;
    }).length;

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
        totalPages: Math.ceil(totalFarmers / limit),
        currentPage: page,
        itemsPerPage: limit,
        hasNextPage: page < Math.ceil(totalFarmers / limit),
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
        { id: 'best_seller_rank', name: 'Best Sellers (Most Sales)', field: 'totalSales', direction: 'desc', enabled: true, order: 0 },
        { id: 'top_rated', name: 'Top Rated', field: 'averageRating', direction: 'desc', enabled: true, order: 1 },
        { id: 'most_reviewed', name: 'Most Reviewed', field: 'reviewCount', direction: 'desc', enabled: true, order: 2 },
        { id: 'newest', name: 'Newest', field: 'createdAt', direction: 'desc', enabled: true, order: 3 },
        { id: 'name', name: 'Name', field: 'firstName', direction: 'asc', enabled: true, order: 4 }
      ],
      defaultSort: 'best_seller_rank'
    },
    topFarmersCriteria: {
      salesWeight: 0.5,
      ratingWeight: 0.25,
      productCountWeight: 0.15,
      reviewCountWeight: 0.05,
      recentActivityWeight: 0.05,
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
  const query: Record<string, any> = {
    role: { $in: ['farmer', 'seller'] },  // ✅ Include both farmers AND sellers
    status: 'active',
    isVerified: true
  };

  // NO MINIMUM REQUIREMENTS - Show all farmers with products
  // They will compete based on actual sales, ratings, etc.

  // Apply performance filter ONLY if user selects specific filter
  if (filters.performance && filters.performance !== 'all') {
    const { topFarmersCriteria } = config;
    
    switch (filters.performance) {
      case 'top_rated':
        // Only filter if user specifically wants top rated
        query.averageRating = { $gte: topFarmersCriteria.minRatingForTopFarmer };
        break;
      case 'top_sellers':
        // Only filter if user specifically wants top sellers
        query.totalSales = { $gte: topFarmersCriteria.minSalesForTopFarmer };
        break;
      case 'most_productive':
        // Only filter if user specifically wants most productive
        query.productCount = { $gte: topFarmersCriteria.minProductsForTopFarmer };
        break;
      case 'trending':
        const recentDate = new Date(Date.now() - topFarmersCriteria.timeframeDays * 24 * 60 * 60 * 1000);
        query.updatedAt = { $gte: recentDate };
        break;
      case 'most_reviewed':
        // Only filter if user specifically wants most reviewed
        query.reviewCount = { $gte: 1 }; // At least 1 review
        break;
    }
  }

  // Apply rating filter ONLY if user selects it
  if (filters.rating !== undefined && filters.rating > 0) {
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
  
  farmers.forEach((farmer: any) => {
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

// Compute top farmer rankings in real-time from actual product sales
async function getTopFarmerRankingsRealTime(config: ITopFarmersConfig): Promise<Record<string, FarmerStats>> {
  const { topFarmersCriteria } = config;
  
  // Get all verified active farmers/sellers
  const farmers = await User.find({
    role: { $in: ['farmer', 'seller'] },  // ✅ Include both farmers AND sellers
    status: 'active',
    isVerified: true
  }).select('_id firstName updatedAt createdAt').lean();

  const rankings: Record<string, FarmerStats> = {};
  
  // Import Order model for computing sales
  const Order = (await import('../../../models/Order')).default;
  
  // Compute real-time stats for each farmer from their products AND orders
  await Promise.all(
    farmers.map(async (farmer) => {
      const farmerId = farmer._id.toString();
      
      // Get all active products for this farmer
      const farmerProducts = await Product.find({ 
        farmerId: farmer._id,
        isActive: true
      }).select('_id category rating reviews').lean();

      if (farmerProducts.length === 0) {
        rankings[farmerId] = {
          totalSales: 0,
          averageRating: 0,
          productCount: 0,
          reviewCount: 0,
          categories: [],
          score: 0,
          firstName: (farmer as any).firstName || '',
          createdAt: (farmer as any).createdAt || farmer.updatedAt
        };
        return;
      }

      // Get product IDs for this farmer
      const productIds = farmerProducts.map(p => (p._id as any).toString());

      // Compute REAL sales from completed orders
      const completedOrders = await Order.find({
        sellerId: farmerId,
        status: { $in: ['completed', 'delivered'] }
      }).select('products').lean();

      // Calculate total items sold across all orders
      let totalSales = 0;
      completedOrders.forEach((order) => {
        const orderProducts = (order as any).products || [];
        orderProducts.forEach((item: any) => {
          if (productIds.includes(item.productId)) {
            totalSales += item.quantity || 0;
          }
        });
      });
      
      // Compute average rating across all products
      const productsWithRating = farmerProducts.filter((p: any) => p.rating && p.rating > 0);
      const averageRating = productsWithRating.length > 0
        ? productsWithRating.reduce((sum, p: any) => sum + (p.rating || 0), 0) / productsWithRating.length
        : 0;
      
      // Count total reviews across all products
      const reviewCount = farmerProducts.reduce((sum, p: any) => sum + ((p.reviews as any)?.length || 0), 0);
      
      // Get unique categories
      const categories = [...new Set(farmerProducts.map((p: any) => p.category as string))].slice(0, 3);
      
      // Compute weighted score
      const salesScore = Math.min(totalSales, 1000) / 1000;
      const ratingScore = Math.min(averageRating, 5) / 5;
      const productScore = Math.min(farmerProducts.length, 100) / 100;
      const reviewScore = Math.min(reviewCount, 100) / 100;
      
      const daysSinceUpdate = (Date.now() - new Date((farmer as any).updatedAt).getTime()) / (24 * 60 * 60 * 1000);
      const recentScore = Math.max(0, 1 - (daysSinceUpdate / topFarmersCriteria.timeframeDays));
      
      const score = 
        salesScore * topFarmersCriteria.salesWeight +
        ratingScore * topFarmersCriteria.ratingWeight +
        productScore * topFarmersCriteria.productCountWeight +
        reviewScore * topFarmersCriteria.reviewCountWeight +
        recentScore * topFarmersCriteria.recentActivityWeight;
      
      rankings[farmerId] = {
        totalSales,
        averageRating: Number(averageRating.toFixed(1)),
        productCount: farmerProducts.length,
        reviewCount,
        categories,
        score,
        firstName: (farmer as any).firstName || '',
        createdAt: (farmer as any).createdAt || farmer.updatedAt
      };
    })
  );

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


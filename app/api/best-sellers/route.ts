import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import Product from '../../../models/Product';
import BestSellerConfig from '../../../models/BestSellerConfig';

// Cache for configuration and computed rankings
let configCache: any = null;
let configCacheTime = 0;
let rankingsCache: any = null;
let rankingsCacheTime = 0;

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const category = searchParams.get('category');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sort = searchParams.get('sort');
    const rating = searchParams.get('rating');
    const page = parseInt(searchParams.get('page') || '1');
    const requestedLimit = parseInt(searchParams.get('limit') || '12');

    // Load configuration from database with caching
    const config = await loadBestSellerConfig();
    if (!config) {
      return NextResponse.json(
        { error: 'Best seller configuration not found' },
        { status: 404 }
      );
    }

    // Validate and limit the requested items per page
    const limit = Math.min(requestedLimit, config.pagination.maxItemsPerPage);
    const effectiveSort = sort || config.sorting.defaultSort;

    // Build the dynamic MongoDB query based on configuration
    const query = await buildBestSellerQuery(config, {
      category,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      rating: rating ? parseFloat(rating) : undefined
    });

    // Build sort object based on configuration
    const sortObject = buildSortObject(config, effectiveSort);

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get or compute best seller rankings
    const rankings = await getBestSellerRankings(config);

    // Apply rankings to query if using best seller rank sort
    if (effectiveSort === 'best_seller_rank') {
      // Add computed best seller score to products
      const rankedProductIds = Object.keys(rankings).slice(skip, skip + limit);
      
      if (rankedProductIds.length > 0) {
        query._id = { $in: rankedProductIds };
        
        // Execute query and sort by pre-computed rankings
        const products = await Product.find(query)
          .select('name category currentPrice basePrice unit stock averageRating salesCount views image images imageUrl createdAt updatedAt')
          .lean();

        // Sort products by their ranking score
        const sortedProducts = products
          .map(product => ({
            ...product,
            bestSellerScore: rankings[product._id.toString()] || 0
          }))
          .sort((a, b) => b.bestSellerScore - a.bestSellerScore);

        // Get total count for pagination
        const totalProducts = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / limit);

        // Get dynamic categories with counts
        const categories = await getDynamicCategories(config, query);

        return NextResponse.json({
          products: sortedProducts,
          categories,
          banner: config.banner.enabled ? config.banner : null,
          sorting: {
            options: config.sorting.options.filter(opt => opt.enabled).sort((a, b) => a.order - b.order),
            current: effectiveSort
          },
          filters: {
            priceRange: config.filters.priceRange,
            ratings: config.filters.ratings,
            categories: config.filters.categories.filter(cat => cat.enabled).sort((a, b) => a.order - b.order)
          },
          pagination: {
            totalProducts,
            totalPages,
            currentPage: page,
            itemsPerPage: limit,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          },
          message: 'Best sellers fetched successfully'
        });
      }
    }

    // For non-best-seller-rank sorts, execute standard query
    const products = await Product.find(query)
      .sort(sortObject)
      .skip(skip)
      .limit(limit)
      .select('name category currentPrice basePrice unit stock averageRating salesCount views image images imageUrl createdAt updatedAt')
      .lean();

    // Add best seller scores for reference
    const productsWithScores = products.map(product => ({
      ...product,
      bestSellerScore: rankings[product._id.toString()] || 0
    }));

    // Get total count for pagination
    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);

    // Get dynamic categories with counts
    const categories = await getDynamicCategories(config, query);

    return NextResponse.json({
      products: productsWithScores,
      categories,
      banner: config.banner.enabled ? config.banner : null,
      sorting: {
        options: config.sorting.options.filter(opt => opt.enabled).sort((a, b) => a.order - b.order),
        current: effectiveSort
      },
      filters: {
        priceRange: config.filters.priceRange,
        ratings: config.filters.ratings,
        categories: config.filters.categories.filter(cat => cat.enabled).sort((a, b) => a.order - b.order)
      },
      pagination: {
        totalProducts,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      message: 'Best sellers fetched successfully'
    });

  } catch (error) {
    console.error('Error fetching best sellers:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to fetch best sellers'
      },
      { status: 500 }
    );
  }
}

// Load configuration with caching
async function loadBestSellerConfig() {
  const now = Date.now();
  const cacheValid = configCache && (now - configCacheTime) < (configCache?.cacheSettings?.ttlMinutes || 30) * 60 * 1000;
  
  if (cacheValid) {
    return configCache;
  }

  const config = await BestSellerConfig.findOne({ isActive: true }).lean();
  
  if (!config) {
    // Create default configuration if none exists
    const defaultConfig = await createDefaultBestSellerConfig();
    configCache = defaultConfig;
    configCacheTime = now;
    return defaultConfig;
  }

  configCache = config;
  configCacheTime = now;
  return config;
}

// Create default configuration
async function createDefaultBestSellerConfig() {
  const defaultConfig = new BestSellerConfig({
    banner: {
      title: 'Our Best Sellers',
      subtitle: 'Most loved farm-fresh picks by our customers this season',
      buttonText: 'Shop Now',
      buttonLink: '#products',
      heroImage: '/images/best-sellers-hero.jpg',
      backgroundColor: 'linear-gradient(135deg, #DCFCE7 0%, #F0FDF4 50%, #ECFDF5 100%)',
      textColor: '#1E3A2F',
      enabled: true
    },
    filters: {
      categories: [
        { id: 'all', name: 'All', slug: 'all', enabled: true, order: 0 },
        { id: 'leafy-greens', name: 'Leafy Greens', slug: 'leafy-greens', enabled: true, order: 1 },
        { id: 'root-crops', name: 'Root Crops', slug: 'root-crops', enabled: true, order: 2 },
        { id: 'fruits', name: 'Fruits', slug: 'fruits', enabled: true, order: 3 },
        { id: 'spices-aromatics', name: 'Spices & Aromatics', slug: 'spices-aromatics', enabled: true, order: 4 },
        { id: 'eggplant-gourds', name: 'Eggplant & Gourds', slug: 'eggplant-gourds', enabled: true, order: 5 },
        { id: 'grains-rice', name: 'Grains & Rice', slug: 'grains-rice', enabled: true, order: 6 }
      ],
      priceRange: { min: 10, max: 1500, step: 10 },
      ratings: { enabled: true, minRating: 1, maxRating: 5 }
    },
    sorting: {
      options: [
        { id: 'best_seller_rank', name: 'Best Seller Rank', field: 'bestSellerScore', direction: 'desc', enabled: true, order: 0 },
        { id: 'price_asc', name: 'Price: Low to High', field: 'currentPrice', direction: 'asc', enabled: true, order: 1 },
        { id: 'price_desc', name: 'Price: High to Low', field: 'currentPrice', direction: 'desc', enabled: true, order: 2 },
        { id: 'newest', name: 'Newest', field: 'createdAt', direction: 'desc', enabled: true, order: 3 },
        { id: 'name', name: 'Name', field: 'name', direction: 'asc', enabled: true, order: 4 }
      ],
      defaultSort: 'best_seller_rank'
    },
    bestSellerCriteria: {
      salesCountWeight: 0.4,
      ratingWeight: 0.3,
      viewsWeight: 0.2,
      recentSalesWeight: 0.1,
      minSalesForBestSeller: 10,
      minRatingForBestSeller: 4.0,
      minViewsForBestSeller: 100,
      timeframeDays: 30
    },
    pagination: { itemsPerPage: 12, maxItemsPerPage: 50 },
    cacheSettings: { ttlMinutes: 30, enabled: true },
    isActive: true
  });

  await defaultConfig.save();
  return defaultConfig.toObject();
}

// Build best seller query based on configuration
async function buildBestSellerQuery(config: any, filters: any) {
  const { bestSellerCriteria } = config;
  const query: Record<string, any> = {
    status: 'active',
    stock: { $gt: 0 },
    $or: [
      { salesCount: { $gte: bestSellerCriteria.minSalesForBestSeller } },
      { averageRating: { $gte: bestSellerCriteria.minRatingForBestSeller } },
      { views: { $gte: bestSellerCriteria.minViewsForBestSeller } }
    ]
  };

  // Apply category filter
  if (filters.category && filters.category !== 'all') {
    query.category = filters.category;
  }

  // Apply price range filter
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    query.currentPrice = {};
    if (filters.minPrice !== undefined) query.currentPrice.$gte = filters.minPrice;
    if (filters.maxPrice !== undefined) query.currentPrice.$lte = filters.maxPrice;
  }

  // Apply rating filter
  if (filters.rating !== undefined) {
    query.averageRating = { $gte: filters.rating };
  }

  return query;
}

// Build sort object based on configuration
function buildSortObject(config: any, sortId: string): Record<string, 1 | -1> {
  const sortOption = config.sorting.options.find((opt: any) => opt.id === sortId);
  
  if (!sortOption) {
    // Fallback to best seller rank
    return { 
      salesCount: -1, 
      averageRating: -1, 
      views: -1,
      createdAt: -1 
    };
  }

  if (sortOption.id === 'best_seller_rank') {
    return { 
      salesCount: -1, 
      averageRating: -1, 
      views: -1,
      createdAt: -1 
    };
  }

  return { [sortOption.field]: sortOption.direction === 'asc' ? 1 : -1 };
}

// Compute and cache best seller rankings
async function getBestSellerRankings(config: any) {
  const now = Date.now();
  const cacheValid = rankingsCache && (now - rankingsCacheTime) < config.cacheSettings.ttlMinutes * 60 * 1000;
  
  if (cacheValid && config.cacheSettings.enabled) {
    return rankingsCache;
  }

  const { bestSellerCriteria } = config;
  const timeframeDays = bestSellerCriteria.timeframeDays;
  const cutoffDate = new Date(Date.now() - timeframeDays * 24 * 60 * 60 * 1000);

  // Get products with best seller potential
  const products = await Product.find({
    status: 'active',
    stock: { $gt: 0 },
    $or: [
      { salesCount: { $gte: bestSellerCriteria.minSalesForBestSeller } },
      { averageRating: { $gte: bestSellerCriteria.minRatingForBestSeller } },
      { views: { $gte: bestSellerCriteria.minViewsForBestSeller } }
    ]
  }).select('salesCount averageRating views createdAt updatedAt').lean();

  // Compute best seller scores
  const rankings: Record<string, number> = {};
  
  products.forEach((product: any) => {
    const salesScore = Math.min(product.salesCount || 0, 1000) / 1000; // Normalize to 0-1
    const ratingScore = Math.min(product.averageRating || 0, 5) / 5; // Normalize to 0-1
    const viewsScore = Math.min(product.views || 0, 10000) / 10000; // Normalize to 0-1
    
    // Recent activity bonus (products updated recently get a boost)
    const daysSinceUpdate = (Date.now() - new Date(product.updatedAt).getTime()) / (24 * 60 * 60 * 1000);
    const recentScore = Math.max(0, 1 - (daysSinceUpdate / timeframeDays));
    
    // Weighted best seller score
    const bestSellerScore = 
      salesScore * bestSellerCriteria.salesCountWeight +
      ratingScore * bestSellerCriteria.ratingWeight +
      viewsScore * bestSellerCriteria.viewsWeight +
      recentScore * bestSellerCriteria.recentSalesWeight;
    
    rankings[product._id.toString()] = bestSellerScore;
  });

  // Sort rankings by score
  const sortedRankings = Object.fromEntries(
    Object.entries(rankings).sort(([,a], [,b]) => (b as number) - (a as number))
  );

  rankingsCache = sortedRankings;
  rankingsCacheTime = now;
  
  return sortedRankings;
}

// Get dynamic categories with counts
async function getDynamicCategories(config: any, baseQuery: any) {
  const configCategories = config.filters.categories.filter((cat: any) => cat.enabled);
  
  // Get actual product counts per category
  const categoryPipeline = [
    { $match: baseQuery },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ];

  const actualCounts = await Product.aggregate(categoryPipeline);
  const countMap = actualCounts.reduce((acc: any, item: any) => {
    acc[item._id] = item.count;
    return acc;
  }, {});

  // Get total count for "All" category
  const totalCount = await Product.countDocuments(baseQuery);

  // Build categories array with actual counts
  const categories = configCategories.map((configCat: any) => ({
    id: configCat.id,
    name: configCat.name,
    slug: configCat.slug,
    count: configCat.id === 'all' ? totalCount : (countMap[configCat.slug] || 0)
  })).filter((cat: any) => cat.count > 0 || cat.id === 'all');

  return categories;
}
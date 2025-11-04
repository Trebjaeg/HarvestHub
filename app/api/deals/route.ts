import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Deal from '@/models/Deal';
import Product from '@/models/Product';
import { applyRateLimit } from '@/lib/app-rate-limiter';

interface ProductQuery {
  isActive: boolean;
  stock: { $gt: number };
  price?: { $gte: number; $lte: number };
  rating?: { $gte: number };
  category?: string | { $in: string[] };
  _id?: { $in: string[] };
  $or?: Array<{
    category?: string | { $in: string[] };
    _id?: { $in: string[] };
  }>;
}

export async function GET(request: NextRequest) {
  // Apply rate limiting: 150 requests per 15 minutes for deals browsing
  const rateLimitResponse = await applyRateLimit(request, {
    windowMs: 15 * 60 * 1000,
    max: 150,
  });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const category = searchParams.get('category');
    const minPrice = parseFloat(searchParams.get('minPrice') || '0');
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '999999');
    const sort = searchParams.get('sort') || 'newest';
    const rating = parseFloat(searchParams.get('rating') || '0');

    // Get active deals
    const now = new Date();
    const activeDeals = await Deal.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      $or: [
        { maxUsage: { $exists: false } },
        { $expr: { $lt: ['$currentUsage', '$maxUsage'] } }
      ]
    }).sort({ priority: -1, startDate: -1 });

    // Build product query for deals
    const productQuery: ProductQuery = {
      isActive: true,
      stock: { $gt: 0 }
    };

    // Apply price filter
    if (minPrice > 0 || maxPrice < 999999) {
      productQuery.price = { $gte: minPrice, $lte: maxPrice };
    }

    // Apply rating filter
    if (rating > 0) {
      productQuery.rating = { $gte: rating };
    }

    // Apply category filter based on deals
    // Note: Removed unused dealProducts variable
    
    if (activeDeals.length > 0) {
      const categoryDeals = activeDeals.filter(deal => 
        deal.applicableCategories && deal.applicableCategories.length > 0
      );
      
      const productDeals = activeDeals.filter(deal => 
        deal.applicableProducts && deal.applicableProducts.length > 0
      );

      // Get products from category-based deals
      if (categoryDeals.length > 0) {
        const dealCategories = categoryDeals.flatMap(deal => deal.applicableCategories);
        if (category && category !== 'all') {
          productQuery.category = { $in: [category, ...dealCategories] };
        } else {
          productQuery.category = { $in: dealCategories };
        }
      }

      // Get products from product-specific deals
      if (productDeals.length > 0) {
        const dealProductIds = productDeals.flatMap(deal => deal.applicableProducts);
        if (Object.keys(productQuery).includes('category')) {
          productQuery.$or = [
            { category: productQuery.category },
            { _id: { $in: dealProductIds } }
          ];
          delete productQuery.category;
        } else {
          productQuery._id = { $in: dealProductIds };
        }
      }
    } else {
      // No active deals, return empty result
      return NextResponse.json({
        products: [],
        deals: [],
        totalPages: 0,
        currentPage: page,
        totalProducts: 0
      });
    }

    // Apply category filter if specified
    if (category && category !== 'all') {
      if (productQuery.$or) {
        productQuery.$or = productQuery.$or.map((condition) => ({
          ...condition,
          category: category
        }));
      } else {
        productQuery.category = category;
      }
    }

    // Build sort query
    let sortQuery: Record<string, 1 | -1> = {};
    switch (sort) {
      case 'price_asc':
        sortQuery = { price: 1 };
        break;
      case 'price_desc':
        sortQuery = { price: -1 };
        break;
      case 'name':
        sortQuery = { name: 1 };
        break;
      case 'createdAt':
        sortQuery = { createdAt: 1 };
        break;
      default:
        sortQuery = { createdAt: -1 };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get products with pagination
    const products = await Product.find(productQuery)
      .sort(sortQuery)
      .skip(skip)
      .limit(limit)
      .select('name category price stock rating reviews imageUrl image images unit farmerId farmerName farmer isOrganic tags createdAt updatedAt')
      .lean();

    console.log('[Deals API] First 3 products:', products.slice(0, 3).map(p => ({
      name: p.name,
      image: p.image,
      images: p.images,
      imageUrl: p.imageUrl
    })));

    // Apply deal discounts to products
    const productsWithDeals = products.map(product => {
      // Find applicable deals for this product
      const applicableDeals = activeDeals.filter(deal => {
        const categoryMatch = deal.applicableCategories?.includes(product.category);
        const productMatch = deal.applicableProducts?.some((id: string) => id.toString() === (product._id as string).toString());
        return categoryMatch || productMatch;
      });

      // Ensure image field is properly set - check multiple possible fields
      let productImage = '/images/placeholder-product.jpg';
      
      // Priority order: image (main field) > images array > imageUrl
      if (product.image && product.image.trim() !== '' && product.image !== '/images/placeholder-product.jpg') {
        productImage = product.image;
      } else if (product.images && Array.isArray(product.images) && product.images.length > 0 && product.images[0] !== '/images/placeholder-product.jpg') {
        productImage = product.images[0];
      } else if (product.imageUrl && product.imageUrl.trim() !== '' && product.imageUrl !== '/images/placeholder-product.jpg') {
        productImage = product.imageUrl;
      }

      console.log('[Deals API] Product image mapping:', {
        name: product.name,
        original: { image: product.image, images: product.images, imageUrl: product.imageUrl },
        mapped: productImage
      });

      if (applicableDeals.length > 0) {
        // Apply the best deal (highest discount)
        const bestDeal = applicableDeals.reduce((best, current) => 
          current.discountPercentage > best.discountPercentage ? current : best
        );

        let discountedPrice = product.price;
        if (bestDeal.discountType === 'percentage') {
          discountedPrice = product.price * (1 - bestDeal.discountPercentage / 100);
        } else {
          discountedPrice = Math.max(0, product.price - bestDeal.discountValue);
        }

        return {
          _id: product._id,
          name: product.name,
          category: product.category,
          price: product.price,
          stock: product.stock,
          rating: product.rating || 0,
          reviews: product.reviews || 0,
          unit: product.unit || 'kg',
          imageUrl: productImage,
          image: productImage,
          images: [productImage],
          farmerId: product.farmerId,
          farmerName: product.farmerName,
          farmer: product.farmer,
          isOrganic: product.isOrganic,
          tags: product.tags,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
          currentPrice: Math.round(discountedPrice * 100) / 100,
          basePrice: product.price,
          dealId: bestDeal._id,
          dealTitle: bestDeal.title,
          discountPercentage: bestDeal.discountPercentage
        };
      }

      return {
        _id: product._id,
        name: product.name,
        category: product.category,
        price: product.price,
        stock: product.stock,
        rating: product.rating || 0,
        reviews: product.reviews || 0,
        unit: product.unit || 'kg',
        imageUrl: productImage,
        image: productImage,
        images: [productImage],
        farmerId: product.farmerId,
        farmerName: product.farmerName,
        farmer: product.farmer,
        isOrganic: product.isOrganic,
        tags: product.tags,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        currentPrice: product.price,
        basePrice: product.price
      };
    });

    // Get total count for pagination
    const totalProducts = await Product.countDocuments(productQuery);
    const totalPages = Math.ceil(totalProducts / limit);

    // Get categories with deal counts
    const categoryPipeline = [
      {
        $match: productQuery
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 as -1 }
      }
    ];

    const categoryStats = await Product.aggregate(categoryPipeline);
    const totalCount = await Product.countDocuments(productQuery);

    const categories = [
      { id: 'all', name: 'All Deals', count: totalCount },
      ...categoryStats.map(cat => ({
        id: cat._id.toLowerCase().replace(/\s+/g, '-'),
        name: cat._id,
        count: cat.count
      }))
    ];

    return NextResponse.json({
      products: productsWithDeals,
      deals: activeDeals,
      categories,
      totalPages,
      currentPage: page,
      totalProducts
    });

  } catch (error) {
    console.error('Error fetching deals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deals' },
      { status: 500 }
    );
  }
}
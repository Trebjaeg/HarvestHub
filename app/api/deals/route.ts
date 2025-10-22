import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Deal from '@/models/Deal';
import Product from '@/models/Product';

export async function GET(request: NextRequest) {
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
    let productQuery: any = {
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
    let dealProducts: any[] = [];
    
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
        productQuery.$or = productQuery.$or.map((condition: any) => ({
          ...condition,
          category: category
        }));
      } else {
        productQuery.category = category;
      }
    }

    // Build sort query
    let sortQuery: any = {};
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
      .lean();

    // Apply deal discounts to products
    const productsWithDeals = products.map(product => {
      // Find applicable deals for this product
      const applicableDeals = activeDeals.filter(deal => {
        const categoryMatch = deal.applicableCategories?.includes(product.category);
        const productMatch = deal.applicableProducts?.some(id => id.toString() === product._id.toString());
        return categoryMatch || productMatch;
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
          ...product,
          currentPrice: Math.round(discountedPrice * 100) / 100,
          basePrice: product.price,
          dealId: bestDeal._id,
          dealTitle: bestDeal.title,
          discountPercentage: bestDeal.discountPercentage
        };
      }

      return {
        ...product,
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
        $sort: { count: -1 }
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
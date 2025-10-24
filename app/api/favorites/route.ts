import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Favorite from '@/models/Favorite';
import Product from '@/models/Product';
import { verifyToken } from '@/lib/auth-middleware';

interface ProductData {
  _id: string;
  name: string;
  price: number;
  imageUrl: string;
  description: string;
  category: string;
  availability: string;
  weight: string;
  location: string;
  farmerName: string;
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Verify authentication
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authResult.user.id;
    const { searchParams } = new URL(request.url);

    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Sorting parameters
    const sortBy = searchParams.get('sortBy') || 'dateAdded';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Filtering parameters
    const category = searchParams.get('category');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const search = searchParams.get('search');

    // Build query
    const query: Record<string, unknown> = { buyerId: userId, isActive: true };

    if (category) {
      query.productCategory = category;
    }

    if (minPrice || maxPrice) {
      query.productPrice = {};
      if (minPrice) (query.productPrice as Record<string, number>).$gte = parseFloat(minPrice);
      if (maxPrice) (query.productPrice as Record<string, number>).$lte = parseFloat(maxPrice);
    }

    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { sellerName: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sortObject: Record<string, 1 | -1> = {};
    sortObject[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute queries
    const [favorites, totalCount] = await Promise.all([
      Favorite.find(query)
        .sort(sortObject)
        .skip(skip)
        .limit(limit)
        .lean(),
      Favorite.countDocuments(query)
    ]);

    // Get product details for each favorite
    const enrichedFavorites = await Promise.all(
      favorites.map(async (favorite) => {
        try {
          const product = await Product.findById(favorite.productId).lean() as ProductData | null;
          return {
            ...favorite,
            productDetails: product ? {
              _id: product._id,
              name: product.name,
              price: product.price,
              imageUrl: product.imageUrl,
              description: product.description,
              category: product.category,
              availability: product.availability,
              weight: product.weight,
              location: product.location,
              farmerName: product.farmerName
            } : null
          };
        } catch (error) {
          console.error(`Error fetching product ${favorite.productId}:`, error);
          return {
            ...favorite,
            productDetails: null
          };
        }
      })
    );

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        favorites: enrichedFavorites,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage,
          hasPrevPage
        }
      }
    });

  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Verify authentication
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authResult.user.id;
    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Get product details
    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if already favorited
    const existingFavorite = await Favorite.findOne({
      buyerId: userId,
      productId: productId
    });

    if (existingFavorite) {
      return NextResponse.json({ error: 'Product already in favorites' }, { status: 409 });
    }

    // Create new favorite
    const favorite = new Favorite({
      buyerId: userId,
      productId: productId,
      productName: product.name,
      productPrice: product.price,
      productImage: product.imageUrl,
      productCategory: product.category,
      sellerId: product.sellerId,
      sellerName: product.farmerName,
      isActive: true,
      dateAdded: new Date()
    });

    await favorite.save();

    return NextResponse.json({
      success: true,
      message: 'Product added to favorites',
      data: favorite
    });

  } catch (error) {
    console.error('Error adding to favorites:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { verifyBuyerAuth } from '@/lib/auth-middleware';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    // Verify buyer authentication
    const authResult = await verifyBuyerAuth(request);
    if (!authResult.success) {
      return NextResponse.json(authResult, { status: 401 });
    }

    const { db } = await connectToDatabase();
    const userId = new ObjectId(authResult.userId);

    // Get current date info
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);

    // Aggregate favorites data
    const pipeline = [
      {
        $match: {
          userId: userId,
          createdAt: { $exists: true }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $unwind: '$product'
      },
      {
        $lookup: {
          from: 'users',
          localField: 'product.userId',
          foreignField: '_id',
          as: 'seller'
        }
      },
      {
        $unwind: '$seller'
      }
    ];

    const favorites = await db.collection('favorites').aggregate(pipeline).toArray();

    // Calculate basic stats
    const totalFavorites = favorites.length;
    const favoritesThisMonth = favorites.filter(fav => 
      new Date(fav.createdAt) >= firstDayOfMonth
    ).length;

    // Get unique sellers count
    const uniqueSellers = new Set(favorites.map(fav => fav.seller._id.toString()));
    const favoritesSellersCount = uniqueSellers.size;

    // Calculate category breakdown
    const categoryCount: { [key: string]: number } = {};
    favorites.forEach(fav => {
      const category = fav.product.category || 'other';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    const categoryBreakdown = Object.entries(categoryCount)
      .map(([category, count]) => ({
        category,
        count,
        percentage: Math.round((count / totalFavorites) * 100)
      }))
      .sort((a, b) => b.count - a.count);

    const topCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0].category : 'none';

    // Calculate price range stats
    const prices = favorites
      .map(fav => fav.product.price)
      .filter(price => typeof price === 'number' && price > 0);

    let averagePriceRange = {
      min: 0,
      max: 0,
      average: 0
    };

    if (prices.length > 0) {
      averagePriceRange = {
        min: Math.min(...prices),
        max: Math.max(...prices),
        average: Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length)
      };
    }

    // Calculate price range distribution
    const priceRanges = [
      { range: '₱0 - ₱100', min: 0, max: 100 },
      { range: '₱100 - ₱500', min: 100, max: 500 },
      { range: '₱500 - ₱1,000', min: 500, max: 1000 },
      { range: '₱1,000 - ₱5,000', min: 1000, max: 5000 },
      { range: '₱5,000+', min: 5000, max: Infinity }
    ];

    const priceRangeDistribution = priceRanges.map(range => {
      const count = prices.filter(price => 
        price >= range.min && (range.max === Infinity ? true : price < range.max)
      ).length;
      
      return {
        range: range.range,
        count,
        percentage: prices.length > 0 ? Math.round((count / prices.length) * 100) : 0
      };
    }).filter(range => range.count > 0);

    // Calculate monthly trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const nextDate = new Date(currentYear, currentMonth - i + 1, 1);
      
      const count = favorites.filter(fav => {
        const favDate = new Date(fav.createdAt);
        return favDate >= date && favDate < nextDate;
      }).length;

      monthlyTrend.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        count
      });
    }

    const stats = {
      totalFavorites,
      favoritesThisMonth,
      favoritesSellersCount,
      topCategory,
      averagePriceRange,
      monthlyTrend,
      categoryBreakdown: categoryBreakdown.slice(0, 8), // Limit to top 8 categories
      priceRangeDistribution
    };

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching favorites analytics:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch favorites analytics' 
      },
      { status: 500 }
    );
  }
}
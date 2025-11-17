import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';
import Order from '@/models/Order';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get token from headers
    const authHeader = req.headers.authorization;
    let token = authHeader?.replace('Bearer ', '');
    
    // Fallback to cookies
    if (!token) {
      token = req.cookies['auth-token'] || 
              req.cookies['userToken'] || 
              req.cookies['hh_token'];
    }

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as any;
    const sellerId = decoded.userId || decoded.id;

    await dbConnect();

    // Get ALL completed/delivered orders for this seller (ALL TIME for true best sellers)
    const orders = await Order.find({
      sellerId: sellerId.toString(),
      status: { $in: ['delivered', 'completed'] },
      paymentStatus: 'paid'
    }).select('products orderDate').lean();

    // Calculate ALL-TIME sales metrics per product
    const salesMetrics: Record<string, { 
      totalSold: number, 
      totalRevenue: number, 
      orderCount: number,
      avgOrderValue: number,
      firstSaleDate: Date | null,
      lastSaleDate: Date | null,
      daysSinceLastOrder: number
    }> = {};

    // Process ALL-TIME orders
    orders.forEach(order => {
      order.products.forEach(item => {
        const productId = item.productId;
        if (!salesMetrics[productId]) {
          salesMetrics[productId] = { 
            totalSold: 0, 
            totalRevenue: 0, 
            orderCount: 0,
            avgOrderValue: 0,
            firstSaleDate: null,
            lastSaleDate: null,
            daysSinceLastOrder: 0
          };
        }
        
        const orderValue = item.price * item.quantity;
        salesMetrics[productId].totalSold += item.quantity;
        salesMetrics[productId].totalRevenue += orderValue;
        salesMetrics[productId].orderCount++;
        
        // Track first and last sale dates
        const orderDate = new Date(order.orderDate);
        if (!salesMetrics[productId].firstSaleDate || orderDate < salesMetrics[productId].firstSaleDate!) {
          salesMetrics[productId].firstSaleDate = orderDate;
        }
        if (!salesMetrics[productId].lastSaleDate || orderDate > salesMetrics[productId].lastSaleDate!) {
          salesMetrics[productId].lastSaleDate = orderDate;
        }
      });
    });

    // Calculate additional metrics
    Object.keys(salesMetrics).forEach(productId => {
      const metrics = salesMetrics[productId];
      metrics.avgOrderValue = metrics.orderCount > 0 ? metrics.totalRevenue / metrics.orderCount : 0;
      
      // Calculate days since last order
      if (metrics.lastSaleDate) {
        const daysSince = Math.floor((Date.now() - metrics.lastSaleDate.getTime()) / (1000 * 60 * 60 * 24));
        metrics.daysSinceLastOrder = daysSince;
      }
    });

    // Get seller's active products
    const products = await Product.find({
      farmerId: sellerId.toString(),
      isActive: true,
      stock: { $gt: 0 }
    }).select('name category unit price stock lowStockAlert images rating reviews createdAt updatedAt').lean();

    // Calculate sales statistics to determine top performers only
    const salesValues = Object.values(salesMetrics);
    const totalOrders = orders.length;
    const totalProductsWithSales = salesValues.length;
    
    // Only show TOP PERFORMERS as best sellers - strict criteria
    // Calculate percentile thresholds to only show top 20-30% of products
    const sortedBySales = salesValues.sort((a, b) => b.totalSold - a.totalSold);
    const sortedByRevenue = salesValues.sort((a, b) => b.totalRevenue - a.totalRevenue);
    
    // Best sellers must be in top 30% of sales OR top 30% of revenue
    const top30PercentIndex = Math.floor(totalProductsWithSales * 0.3);
    const salesThreshold = totalProductsWithSales > 3 ? 
      sortedBySales[Math.min(top30PercentIndex, sortedBySales.length - 1)]?.totalSold || 1 : 1;
    const revenueThreshold = totalProductsWithSales > 3 ? 
      sortedByRevenue[Math.min(top30PercentIndex, sortedByRevenue.length - 1)]?.totalRevenue || 0 : 0;
    
    // Minimum absolute thresholds for quality control
    const minAbsoluteSold = Math.max(totalOrders >= 20 ? 5 : 2, 1); // Higher standards for active sellers
    const minAbsoluteRevenue = totalOrders >= 20 ? 1000 : 200;

    // Calculate best seller scores based on REAL sales data
    const productsWithScores = products.map((product) => {
      const productId = product._id?.toString() || '';
      const sales = salesMetrics[productId] || { totalSold: 0, totalRevenue: 0, orderCount: 0, avgOrderValue: 0, firstSaleDate: null, lastSaleDate: null, daysSinceLastOrder: 999 };
      
      // Simplified ALL-TIME sales-based scoring algorithm
      // Focus purely on historical performance - no recent bias
      const maxSold = Math.max(...Object.values(salesMetrics).map(s => s.totalSold), 1);
      const maxRevenue = Math.max(...Object.values(salesMetrics).map(s => s.totalRevenue), 1);
      const maxOrders = Math.max(...Object.values(salesMetrics).map(s => s.orderCount), 1);
      
      // Pure all-time performance scoring
      const salesScore = sales.totalSold / maxSold; // Relative to seller's best-selling product
      const revenueScore = sales.totalRevenue / maxRevenue; // Relative revenue performance
      const frequencyScore = sales.orderCount / maxOrders; // Relative order frequency
      const ratingScore = Math.min((product.rating || 0) / 5, 1); // Quality indicator
      
      // ALL-TIME performance score (no recency bias)
      const bestSellerScore = 
        salesScore * 0.50 +        // Total quantity sold ALL-TIME (50%)
        revenueScore * 0.30 +      // Total revenue generated ALL-TIME (30%)
        frequencyScore * 0.15 +    // Order frequency ALL-TIME (15%)
        ratingScore * 0.05;        // Product rating (5%)"
      
      return {
        ...product,
        bestSellerScore,
        // ALL-TIME sales metrics for display
        totalSold: sales.totalSold,
        totalRevenue: sales.totalRevenue,
        orderCount: sales.orderCount,
        daysSinceLastOrder: sales.daysSinceLastOrder,
        avgOrderValue: sales.avgOrderValue,
        salesRank: 0, // Will be set after sorting
        // Only TOP PERFORMERS qualify as best sellers
        isBestSeller: sales.totalSold > 0 && (
          (sales.totalSold >= salesThreshold && sales.totalSold >= minAbsoluteSold) ||
          (sales.totalRevenue >= revenueThreshold && sales.totalRevenue >= minAbsoluteRevenue)
        ),
        sku: `${product.category?.slice(0, 3).toUpperCase()}-${product._id?.toString().slice(-4) || '0000'}`
      };
    });

    // Get TOP PERFORMERS ONLY - sorted by ALL-TIME sales performance
    let bestSellerProducts = productsWithScores
      .filter(p => p.totalSold > 0) // Must have sales to be considered
      .sort((a, b) => {
        // Primary sort: Total units sold ALL-TIME (DESC)
        if (b.totalSold !== a.totalSold) {
          return b.totalSold - a.totalSold;
        }
        // Secondary sort: Total revenue ALL-TIME (DESC)
        if (b.totalRevenue !== a.totalRevenue) {
          return b.totalRevenue - a.totalRevenue;
        }
        // Tertiary sort: Order frequency (DESC)
        return b.orderCount - a.orderCount;
      });

    // Only show products that qualify as best sellers (top performers)
    const qualifiedBestSellers = bestSellerProducts
      .filter(p => p.isBestSeller)
      .slice(0, 8); // Maximum 8 best sellers

    // If we have qualified best sellers, use them. Otherwise show top 5 by sales.
    bestSellerProducts = qualifiedBestSellers.length > 0 ? 
      qualifiedBestSellers : bestSellerProducts.slice(0, 5);

    // Add sales rank to final products
    bestSellerProducts = bestSellerProducts.map((product, index) => ({
      ...product,
      salesRank: index + 1,
      isBestSeller: true // Mark for display
    }));

    res.status(200).json({ 
      products: bestSellerProducts,
      totalBestSellers: bestSellerProducts.length,
      // Summary metrics for the seller
      summaryMetrics: {
        totalProductsWithSales: Object.keys(salesMetrics).length,
        totalOrdersProcessed: orders.length,
        totalRevenueGenerated: Object.values(salesMetrics).reduce((sum, metric) => sum + metric.totalRevenue, 0),
        totalUnitsSold: Object.values(salesMetrics).reduce((sum, metric) => sum + metric.totalSold, 0),
        // Debug info
        thresholds: {
          salesThreshold,
          revenueThreshold,
          minAbsoluteSold,
          minAbsoluteRevenue,
          totalOrders,
          totalProductsWithSales,
          qualifiedCount: qualifiedBestSellers.length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching best seller products:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
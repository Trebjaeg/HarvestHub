import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import CartItem from '@/models/CartItem';
import Product from '@/models/Product';
import jwt from 'jsonwebtoken';
import { cache, cacheKeys } from '@/lib/redis';

interface DecodedToken {
  userId: string;
  email: string;
  role: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // Get token from cookies
    const token = req.cookies['auth-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
    const userId = decoded.userId;

    // Try to get from cache first
    const cachedCart = await cache.get(cacheKeys.cart(userId));
    if (cachedCart) {
      return res.status(200).json(cachedCart);
    }

    // Get all cart items for this user
    const cartItems = await CartItem.find({
      userId: userId
    })
    .sort({ createdAt: -1 })
    .lean() // Use lean for better performance
    .exec();

    // Get product IDs to fetch stock information
    const productIds = cartItems.map(item => item.productId);
    
    // Fetch products to get current stock and check if they still exist
    const products = await Product.find({
      _id: { $in: productIds }
    })
    .select('_id stock farmerId farmerName')
    .lean()
    .exec();

    // Create a map of productId to product data
    const productMap = new Map(
      products.map(p => [p._id.toString(), p])
    );

    // Create a set of existing product IDs
    const existingProductIds = new Set(products.map(p => p._id.toString()));
    
    // Get unique seller IDs that need name lookup
    const sellerIdsToLookup = new Set<string>();
    cartItems.forEach(item => {
      if (!item.sellerName || item.sellerName === 'Unknown Farmer' || item.sellerName === 'Unknown Seller') {
        const product = productMap.get(item.productId);
        if (product?.farmerId) {
          sellerIdsToLookup.add(product.farmerId.toString());
        } else if (item.sellerId) {
          sellerIdsToLookup.add(item.sellerId.toString());
        }
      }
    });
    
    // Fetch seller names if needed
    const sellerNamesMap = new Map<string, string>();
    if (sellerIdsToLookup.size > 0) {
      const User = (await import('@/models/User')).default;
      const sellers = await User.find({
        _id: { $in: Array.from(sellerIdsToLookup) }
      })
      .select('_id name firstName lastName')
      .lean()
      .exec();
      
      sellers.forEach(seller => {
        const name = seller.name || `${seller.firstName || ''} ${seller.lastName || ''}`.trim() || 'Seller';
        sellerNamesMap.set(seller._id.toString(), name);
      });
    }

    // Format cart items with stock information and availability status
    const items = cartItems.map(item => {
      const product = productMap.get(item.productId);
      const sellerId = product?.farmerId?.toString() || item.sellerId;
      
      // Get seller name: use stored name, or lookup, or fallback
      let sellerName = item.sellerName;
      if (!sellerName || sellerName === 'Unknown Farmer' || sellerName === 'Unknown Seller') {
        sellerName = sellerNamesMap.get(sellerId) || 'Seller';
      }
      
      return {
        _id: item._id.toString(),
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        pricePerUnit: item.price,
        totalPrice: item.quantity * item.price,
        productImage: item.imageUrl,
        unit: item.unit,
        sellerId: sellerId,
        sellerName: sellerName,
        stock: product?.stock || 0,
        isAvailable: existingProductIds.has(item.productId)
      };
    });

    const responseData = {
      success: true,
      items,
      count: items.length
    };

    // Cache for 2 minutes
    await cache.set(cacheKeys.cart(userId), responseData, 120);

    return res.status(200).json(responseData);

  } catch (error) {
    console.error('Error fetching cart:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

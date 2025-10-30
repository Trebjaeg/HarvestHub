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

  // Add timeout protection
  const timeoutId = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({ error: 'Request timeout - cart loading is taking too long' });
    }
  }, 10000); // 10 second timeout

  try {
    await dbConnect();

    // Get token from cookies
    const token = req.cookies['auth-token'];
    if (!token) {
      clearTimeout(timeoutId);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
    const userId = decoded.userId;

    // Try to get from cache first (with timeout)
    try {
      const cachedCart = await Promise.race([
        cache.get(cacheKeys.cart(userId)),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Cache timeout')), 1000))
      ]);
      if (cachedCart) {
        clearTimeout(timeoutId);
        return res.status(200).json(cachedCart);
      }
    } catch (cacheError) {
      console.log('Cache read skipped:', cacheError instanceof Error ? cacheError.message : 'unknown');
    }

    // Get all cart items for this user with timeout
    const cartItems = await CartItem.find({
      userId: userId
    })
    .sort({ createdAt: -1 })
    .maxTimeMS(3000) // 3 second timeout
    .lean()
    .exec();

    // If no cart items, return early
    if (cartItems.length === 0) {
      clearTimeout(timeoutId);
      const emptyResponse = { success: true, items: [], count: 0 };
      await cache.set(cacheKeys.cart(userId), emptyResponse, 120).catch(() => {});
      return res.status(200).json(emptyResponse);
    }

    // Get product IDs to fetch stock information
    const productIds = cartItems.map(item => item.productId);
    
    // Fetch products to get current stock and check if they still exist with timeout
    const products = await Product.find({
      _id: { $in: productIds }
    })
    .select('_id stock farmerId farmerName')
    .maxTimeMS(3000) // 3 second timeout
    .lean()
    .exec();

    // Create a map of productId to product data
    const productMap = new Map(
      products.map(p => [p._id.toString(), p])
    );

    // Create a set of existing product IDs
    const existingProductIds = new Set(products.map(p => p._id.toString()));
    
    // Find cart items with deleted products
    const deletedProductItems = cartItems.filter(item => !existingProductIds.has(item.productId));
    
    // Auto-cleanup: Remove cart items for deleted products
    if (deletedProductItems.length > 0) {
      const deletedItemIds = deletedProductItems.map(item => item._id);
      await CartItem.deleteMany({
        _id: { $in: deletedItemIds }
      }).exec();
      
      // Clear cache since we modified the cart
      await cache.del(cacheKeys.cart(userId)).catch(() => {});
    }
    
    // Filter out deleted products from the response
    const validCartItems = cartItems.filter(item => existingProductIds.has(item.productId));
    
    // Get unique seller IDs that need name lookup
    const sellerIdsToLookup = new Set<string>();
    validCartItems.forEach(item => {
      if (!item.sellerName || item.sellerName === 'Unknown Farmer' || item.sellerName === 'Unknown Seller') {
        const product = productMap.get(item.productId);
        if (product?.farmerId) {
          sellerIdsToLookup.add(product.farmerId.toString());
        } else if (item.sellerId) {
          sellerIdsToLookup.add(item.sellerId.toString());
        }
      }
    });
    
    // Fetch seller names if needed with timeout
    const sellerNamesMap = new Map<string, string>();
    if (sellerIdsToLookup.size > 0) {
      try {
        const User = (await import('@/models/User')).default;
        const sellers = await User.find({
          _id: { $in: Array.from(sellerIdsToLookup) }
        })
        .select('_id name firstName lastName')
        .maxTimeMS(2000) // 2 second timeout
        .lean()
        .exec();
        
        sellers.forEach(seller => {
          const name = seller.name || `${seller.firstName || ''} ${seller.lastName || ''}`.trim() || 'Seller';
          sellerNamesMap.set(seller._id.toString(), name);
        });
      } catch (userError) {
        console.error('Error fetching seller names:', userError);
        // Continue without seller names if this fails
      }
    }

    // Format cart items with stock information and availability status
    const items = validCartItems.map(item => {
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
        isAvailable: true // All items here are valid since we filtered out deleted ones
      };
    });

    const responseData = {
      success: true,
      items,
      count: items.length,
      removedItems: deletedProductItems.length // Let frontend know items were removed
    };

    // Cache for 2 minutes (with timeout protection)
    try {
      await Promise.race([
        cache.set(cacheKeys.cart(userId), responseData, 120),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Cache write timeout')), 1000))
      ]);
    } catch (cacheError) {
      console.log('Cache write skipped:', cacheError instanceof Error ? cacheError.message : 'unknown');
    }

    clearTimeout(timeoutId);
    return res.status(200).json(responseData);

  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Error fetching cart:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

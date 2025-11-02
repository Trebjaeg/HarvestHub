import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import CartItem from '@/models/CartItem';
import Product from '@/models/Product';
import jwt from 'jsonwebtoken';

interface DecodedToken {
  userId: string;
  email: string;
  role: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Set cache-control headers to prevent stale reads
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // Add timeout protection
  const timeoutId = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({ error: 'Request timeout - cart loading is taking too long' });
    }
  }, 15000); // Increase to 15 seconds to match frontend timeout

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

    // Get all cart items for this user with timeout - use projection to limit data
    const cartItems = await CartItem.find({
      userId: userId
    })
    .select('_id userId productId productName quantity price imageUrl unit sellerId sellerName createdAt')
    .sort({ createdAt: -1 })
    .maxTimeMS(5000) // Increase to 5 seconds
    .lean()
    .exec();

    // If no cart items, return early
    if (cartItems.length === 0) {
      clearTimeout(timeoutId);
      const emptyResponse = { success: true, items: [], count: 0 };
      return res.status(200).json(emptyResponse);
    }

    // Get product IDs to fetch stock information
    const productIds = cartItems.map(item => item.productId);
    
    // Fetch products to get current stock and check if they still exist with timeout
    // Only fetch essential fields
    const products = await Product.find({
      _id: { $in: productIds }
    })
    .select('_id stock farmerId farmerName isActive')
    .maxTimeMS(5000) // Increase to 5 seconds
    .lean()
    .exec();

    // Create a map of productId to product data
    const productMap = new Map(
      products.map(p => [(p as any)._id.toString(), p])
    );

    // Create a set of existing product IDs
    const existingProductIds = new Set(products.map(p => (p as any)._id.toString()));
    
    // Find cart items with deleted products
    const deletedProductItems = cartItems.filter(item => !existingProductIds.has(item.productId));
    
    // Auto-cleanup: Remove cart items for deleted products (do in background)
    if (deletedProductItems.length > 0) {
      const deletedItemIds = deletedProductItems.map(item => item._id);
      // Don't await - let this run in background
      CartItem.deleteMany({
        _id: { $in: deletedItemIds }
      }).exec().catch(err => console.error('Background cleanup error:', err));
    }
    
    // Filter out deleted products from the response
    const validCartItems = cartItems.filter(item => existingProductIds.has(item.productId));
    
    // Batch fetch seller names only if needed
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
    
    // Fetch seller names in one query if needed
    const sellerNamesMap = new Map<string, string>();
    if (sellerIdsToLookup.size > 0) {
      try {
        const User = (await import('@/models/User')).default;
        const sellers = await User.find({
          _id: { $in: Array.from(sellerIdsToLookup) }
        })
        .select('_id name firstName lastName')
        .maxTimeMS(3000) // Increase to 3 seconds
        .lean()
        .exec();
        
        sellers.forEach(seller => {
          const name = seller.name || `${seller.firstName || ''} ${seller.lastName || ''}`.trim() || 'Seller';
          sellerNamesMap.set(seller._id.toString(), name);
        });
      } catch (userError) {
        console.error('Error fetching seller names:', userError);
        // Continue without seller names if this fails - don't block cart load
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
        _id: (item as any)._id.toString(),
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        pricePerUnit: item.price,
        totalPrice: item.quantity * item.price,
        productImage: item.imageUrl,
        unit: item.unit,
        sellerId: sellerId,
        sellerName: sellerName,
        stock: (product as any)?.stock || 0,
        isAvailable: true // All items here are valid since we filtered out deleted ones
      };
    });

    const responseData = {
      success: true,
      items,
      count: items.length,
      removedItems: deletedProductItems.length // Let frontend know items were removed
    };

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

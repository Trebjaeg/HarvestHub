import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CartItem from '@/models/CartItem';
import Product from '@/models/Product';
import { verifyToken } from '@/lib/auth-middleware';
import { cache, cacheKeys } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Verify authentication
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is suspended - buyers cannot add to cart when suspended
    if (authResult.user.status === 'suspended') {
      return NextResponse.json({ 
        error: 'Account suspended',
        code: 'SUSPENDED',
        message: 'Your account is suspended and you cannot make purchases. You can view your account but buying is disabled. Please submit an appeal to request account restoration.',
        canAppeal: true,
        appealUrl: '/appeals/new'
      }, { status: 403 });
    }

    const userId = authResult.user.id;
    const body = await request.json();
    const { productId, quantity = 1 } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Try to get product from cache first
    let product = await cache.get(cacheKeys.product(productId));
    
    if (!product) {
      // Get product details from database - use lean() for faster reads
      product = await Product.findById(productId)
        .select('_id name price unit stock isActive farmerId farmerName image imageUrl images')
        .maxTimeMS(2000)
        .lean();
      
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }
      
      // Cache product for 10 minutes
      await cache.set(cacheKeys.product(productId), product, 600).catch(() => {});
    }

    // Use inventory_available for stock checks (real-time availability)
    const availableStock = product.inventory_available ?? product.stock ?? 0;

    // Check if product is available (using status field and inventory_available)
    if (!product.isActive || availableStock <= 0) {
      return NextResponse.json({ error: 'Product is not available' }, { status: 400 });
    }

    // Check cart item limit (100 items max)
    const currentCartCount = await CartItem.countDocuments({ userId }).maxTimeMS(2000);
    
    // Check if item already exists in cart
    const existingCartItem = await CartItem.findOne({
      userId: userId,
      productId: productId
    }).maxTimeMS(2000);

    // If adding a new item (not updating existing), check the 100 limit
    if (!existingCartItem && currentCartCount >= 100) {
      return NextResponse.json({ 
        error: 'Cart limit reached',
        code: 'CART_LIMIT',
        message: 'Your cart has reached the maximum limit of 100 items. Please remove some items before adding new ones.'
      }, { status: 400 });
    }

    if (existingCartItem) {
      // Calculate new quantity
      const newQuantity = existingCartItem.quantity + quantity;
      
      // Check if new quantity exceeds available stock
      if (newQuantity > availableStock) {
        return NextResponse.json({ 
          error: 'Insufficient stock',
          code: 'INSUFFICIENT_STOCK',
          message: `Cannot add ${quantity} more. Only ${availableStock} available, and you already have ${existingCartItem.quantity} in your cart.`,
          availableStock: availableStock,
          currentCartQuantity: existingCartItem.quantity,
          maxCanAdd: Math.max(0, availableStock - existingCartItem.quantity)
        }, { status: 400 });
      }

      // Update existing cart item quantity
      existingCartItem.quantity = newQuantity;
      await existingCartItem.save();

      // Get total cart count
      const totalCount = await CartItem.countDocuments({ userId }).maxTimeMS(2000);

      // Invalidate cart cache (don't wait for completion)
      cache.del(cacheKeys.cart(userId)).catch(() => {});
      cache.del(cacheKeys.cartCount(userId)).catch(() => {});

      return NextResponse.json({
        success: true,
        message: 'Cart updated successfully',
        data: existingCartItem,
        count: totalCount
      });
    } else {
      // Check if requested quantity exceeds available stock for new items
      if (quantity > availableStock) {
        return NextResponse.json({ 
          error: 'Insufficient stock',
          code: 'INSUFFICIENT_STOCK',
          message: `Cannot add ${quantity} items. Only ${availableStock} available in stock.`,
          availableStock: availableStock
        }, { status: 400 });
      }

      // Get seller name from User model if product.farmerName is missing or "Unknown"
      let sellerName = product.farmerName;
      if (!sellerName || sellerName === 'Unknown Farmer' || sellerName === 'Unknown Seller') {
        try {
          const User = (await import('@/models/User')).default;
          const seller = await User.findById(product.farmerId)
            .select('name firstName lastName')
            .maxTimeMS(1500)
            .lean();
          if (seller) {
            sellerName = seller.name || `${seller.firstName || ''} ${seller.lastName || ''}`.trim() || 'Seller';
          }
        } catch (err) {
          console.error('Error fetching seller name:', err);
          sellerName = 'Seller';
        }
      }
      
      // Create new cart item
      const cartItem = new CartItem({
        userId: userId,
        productId: productId,
        productName: product.name,
        quantity: quantity,
        price: product.price,
        unit: product.unit || 'kg',
        imageUrl: product.image || product.images?.[0] || product.imageUrl,
        sellerId: product.farmerId,
        sellerName: sellerName
      });

      await cartItem.save();

      // Get total cart count
      const totalCount = await CartItem.countDocuments({ userId }).maxTimeMS(2000);

      // Invalidate cart cache (don't wait for completion)
      cache.del(cacheKeys.cart(userId)).catch(() => {});
      cache.del(cacheKeys.cartCount(userId)).catch(() => {});

      return NextResponse.json({
        success: true,
        message: 'Product added to cart successfully',
        data: cartItem,
        count: totalCount
      });
    }

  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
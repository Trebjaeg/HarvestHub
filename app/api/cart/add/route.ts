import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';
import { verifyToken } from '@/lib/auth-middleware';

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
    const { productId, quantity = 1 } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Get product details
    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if product is available
    if (product.availability !== 'Available') {
      return NextResponse.json({ error: 'Product is not available' }, { status: 400 });
    }

    // Check if there's already a pending order for this product by this buyer
    const existingOrder = await Order.findOne({
      buyerId: userId,
      productId: productId,
      status: 'Pending'
    });

    if (existingOrder) {
      // Update existing order quantity
      existingOrder.quantity += quantity;
      existingOrder.totalPrice = existingOrder.quantity * product.price;
      await existingOrder.save();

      return NextResponse.json({
        success: true,
        message: 'Cart updated successfully',
        data: existingOrder
      });
    } else {
      // Create new order
      const order = new Order({
        buyerId: userId,
        sellerId: product.sellerId,
        productId: productId,
        productName: product.name,
        quantity: quantity,
        pricePerUnit: product.price,
        totalPrice: quantity * product.price,
        status: 'Pending',
        orderDate: new Date()
      });

      await order.save();

      return NextResponse.json({
        success: true,
        message: 'Product added to cart successfully',
        data: order
      });
    }

  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
import Product from '@/models/Product';
import mongoose from 'mongoose';
import { cache } from './memory-cache';

/**
 * Inventory Manager - Handles all inventory transitions atomically
 * 
 * Inventory Flow:
 * 1. On Checkout: inventory_available → inventory_reserved
 * 2. On Seller Confirm: inventory_reserved → inventory_committed
 * 3. On Seller/Buyer Cancel (pre-confirm): inventory_reserved → inventory_available
 * 4. On Order Complete/Delivered: inventory_committed is removed from on_hand
 */

interface InventoryItem {
  productId: string;
  quantity: number;
}

interface InventoryOperationResult {
  success: boolean;
  message: string;
  failedItems?: Array<{ productId: string; reason: string }>;
}

/**
 * Clear product caches for real-time inventory updates
 */
function clearProductCaches(productIds: string[]) {
  const patterns = [
    'products:*',
    'best-sellers:*',
    'deals:*',
    'top-farmers:*',
    ...productIds.map(id => `product:${id}`)
  ];
  
  for (const pattern of patterns) {
    try {
      cache.delPattern(pattern);
    } catch (e) {
      // Silent fail
    }
  }
}

/**
 * Reserve inventory when order is placed (checkout)
 * Decreases inventory_available, increases inventory_reserved
 * inventory_on_hand remains unchanged
 */
export async function reserveInventory(
  items: InventoryItem[],
  session?: mongoose.ClientSession
): Promise<InventoryOperationResult> {
  const failedItems: Array<{ productId: string; reason: string }> = [];
  
  try {
    for (const item of items) {
      // First, ensure the product has inventory fields initialized
      await Product.findByIdAndUpdate(
        item.productId,
        {
          $setOnInsert: {
            inventory_on_hand: 0,
            inventory_available: 0,
            inventory_reserved: 0,
            inventory_committed: 0
          }
        },
        { 
          upsert: false, 
          session,
          setDefaultsOnInsert: false 
        }
      );
      
      // Migrate old stock field to new inventory system if needed
      const productCheck = await Product.findById(item.productId).session(session);
      if (productCheck && (productCheck.inventory_on_hand === undefined || productCheck.inventory_on_hand === 0) && productCheck.stock > 0) {
        await Product.findByIdAndUpdate(
          item.productId,
          {
            $set: {
              inventory_on_hand: productCheck.stock,
              inventory_available: productCheck.stock,
              inventory_reserved: 0,
              inventory_committed: 0
            }
          },
          { session }
        );
      }
      
      const result = await Product.findOneAndUpdate(
        {
          _id: item.productId,
          inventory_available: { $gte: item.quantity }, // Ensure enough available stock
          isActive: true
        },
        {
          $inc: {
            inventory_available: -item.quantity,
            inventory_reserved: item.quantity
          }
        },
        {
          new: true,
          session,
          runValidators: true
        }
      );

      if (!result) {
        // Check if product exists and get current inventory
        const product = await Product.findById(item.productId).session(session);
        if (!product) {
          failedItems.push({ 
            productId: item.productId, 
            reason: 'Product not found' 
          });
        } else if (!product.isActive) {
          failedItems.push({ 
            productId: item.productId, 
            reason: 'Product is not active' 
          });
        } else {
          failedItems.push({ 
            productId: item.productId, 
            reason: `Insufficient stock. Available: ${product.inventory_available}, Requested: ${item.quantity}` 
          });
        }
      }
    }

    if (failedItems.length > 0) {
      return {
        success: false,
        message: 'Some items could not be reserved',
        failedItems
      };
    }

    // Clear caches for real-time updates
    clearProductCaches(items.map(i => i.productId));

    return {
      success: true,
      message: 'Inventory reserved successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to reserve inventory',
      failedItems: items.map(item => ({ 
        productId: item.productId, 
        reason: 'System error' 
      }))
    };
  }
}

/**
 * Commit reserved inventory when seller confirms order
 * Moves from inventory_reserved to inventory_committed
 */
export async function commitInventory(
  items: InventoryItem[],
  session?: mongoose.ClientSession
): Promise<InventoryOperationResult> {
  const failedItems: Array<{ productId: string; reason: string }> = [];
  
  try {
    for (const item of items) {
      // First, ensure the product has inventory fields initialized and migrate if needed
      const productCheck = await Product.findById(item.productId).session(session);
      
      if (!productCheck) {
        failedItems.push({ 
          productId: item.productId, 
          reason: 'Product not found'
        });
        continue;
      }
      
      // Migrate old stock field to new inventory system if needed
      if ((productCheck.inventory_on_hand === undefined || productCheck.inventory_on_hand === 0) && productCheck.stock > 0) {
        await Product.findByIdAndUpdate(
          item.productId,
          {
            $set: {
              inventory_on_hand: productCheck.stock,
              inventory_available: productCheck.stock,
              inventory_reserved: 0,
              inventory_committed: 0
            }
          },
          { session }
        );
      }
      
      // Get current state after potential migration
      const currentProduct = await Product.findById(item.productId)
        .select('name inventory_reserved inventory_committed inventory_available inventory_on_hand')
        .session(session)
        .lean();
      
      const result = await Product.findOneAndUpdate(
        {
          _id: item.productId,
          inventory_reserved: { $gte: item.quantity } // Ensure reserved stock exists
        },
        {
          $inc: {
            inventory_reserved: -item.quantity,
            inventory_committed: item.quantity
          }
        },
        {
          new: true,
          session,
          runValidators: true
        }
      );

      if (!result) {
        failedItems.push({ 
          productId: item.productId, 
          reason: currentProduct 
            ? `Insufficient reserved stock. Reserved: ${currentProduct.inventory_reserved ?? 0}, Need: ${item.quantity}, Product: ${currentProduct.name}`
            : 'Product not found'
        });
      }
    }

    if (failedItems.length > 0) {
      return {
        success: false,
        message: 'Some items could not be committed',
        failedItems
      };
    }

    // Clear caches for real-time updates
    clearProductCaches(items.map(i => i.productId));

    return {
      success: true,
      message: 'Inventory committed successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to commit inventory',
      failedItems: items.map(item => ({ 
        productId: item.productId, 
        reason: 'System error' 
      }))
    };
  }
}

/**
 * Release reserved inventory back to available (on cancellation before seller confirms)
 * Moves from inventory_reserved to inventory_available
 */
export async function releaseReservedInventory(
  items: InventoryItem[],
  session?: mongoose.ClientSession
): Promise<InventoryOperationResult> {
  const failedItems: Array<{ productId: string; reason: string }> = [];
  
  try {
    for (const item of items) {
      // Check if product has inventory reserved (may be 0 for old orders)
      const product = await Product.findById(item.productId).session(session);
      
      if (!product) {
        failedItems.push({ 
          productId: item.productId, 
          reason: 'Product not found'
        });
        continue;
      }
      
      // If no reserved inventory exists (old order before migration), skip silently
      if ((product.inventory_reserved ?? 0) === 0) {
        continue; // Nothing to release
      }
      
      const result = await Product.findOneAndUpdate(
        {
          _id: item.productId,
          inventory_reserved: { $gte: item.quantity }
        },
        {
          $inc: {
            inventory_reserved: -item.quantity,
            inventory_available: item.quantity
          }
        },
        {
          new: true,
          session,
          runValidators: true
        }
      );

      if (!result) {
        failedItems.push({ 
          productId: item.productId, 
          reason: `Insufficient reserved stock. Reserved: ${product.inventory_reserved ?? 0}, Requested: ${item.quantity}`
        });
      }
    }

    if (failedItems.length > 0) {
      return {
        success: false,
        message: 'Some items could not be released',
        failedItems
      };
    }

    // Clear caches for real-time updates
    clearProductCaches(items.map(i => i.productId));

    return {
      success: true,
      message: 'Reserved inventory released successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to release reserved inventory',
      failedItems: items.map(item => ({ 
        productId: item.productId, 
        reason: 'System error' 
      }))
    };
  }
}

/**
 * Release committed inventory back to available (on cancellation after seller confirms)
 * This should rarely happen - only in exceptional cases
 * Moves from inventory_committed to inventory_available
 */
export async function releaseCommittedInventory(
  items: InventoryItem[],
  session?: mongoose.ClientSession
): Promise<InventoryOperationResult> {
  const failedItems: Array<{ productId: string; reason: string }> = [];
  
  try {
    for (const item of items) {
      const result = await Product.findOneAndUpdate(
        {
          _id: item.productId,
          inventory_committed: { $gte: item.quantity }
        },
        {
          $inc: {
            inventory_committed: -item.quantity,
            inventory_available: item.quantity
          }
        },
        {
          new: true,
          session,
          runValidators: true
        }
      );

      if (!result) {
        const product = await Product.findById(item.productId).session(session);
        failedItems.push({ 
          productId: item.productId, 
          reason: product 
            ? `Insufficient committed stock. Committed: ${product.inventory_committed}, Requested: ${item.quantity}`
            : 'Product not found'
        });
      }
    }

    if (failedItems.length > 0) {
      return {
        success: false,
        message: 'Some items could not be released',
        failedItems
      };
    }

    // Clear caches for real-time updates
    clearProductCaches(items.map(i => i.productId));

    return {
      success: true,
      message: 'Committed inventory released successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to release committed inventory',
      failedItems: items.map(item => ({ 
        productId: item.productId, 
        reason: 'System error' 
      }))
    };
  }
}

/**
 * Fulfill order - remove committed inventory from on_hand
 * This happens when order is completed/delivered
 */
export async function fulfillOrder(
  items: InventoryItem[],
  session?: mongoose.ClientSession
): Promise<InventoryOperationResult> {
  const failedItems: Array<{ productId: string; reason: string }> = [];
  
  try {
    for (const item of items) {
      const result = await Product.findOneAndUpdate(
        {
          _id: item.productId,
          inventory_committed: { $gte: item.quantity },
          inventory_on_hand: { $gte: item.quantity }
        },
        {
          $inc: {
            inventory_committed: -item.quantity,
            inventory_on_hand: -item.quantity,
            stock: -item.quantity // Keep legacy stock field in sync
          }
        },
        {
          new: true,
          session,
          runValidators: true
        }
      );

      if (!result) {
        const product = await Product.findById(item.productId).session(session);
        failedItems.push({ 
          productId: item.productId, 
          reason: product 
            ? `Insufficient inventory. Committed: ${product.inventory_committed}, On Hand: ${product.inventory_on_hand}`
            : 'Product not found'
        });
      }
    }

    if (failedItems.length > 0) {
      return {
        success: false,
        message: 'Some items could not be fulfilled',
        failedItems
      };
    }

    // Clear caches for real-time updates
    clearProductCaches(items.map(i => i.productId));

    return {
      success: true,
      message: 'Order fulfilled successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to fulfill order',
      failedItems: items.map(item => ({ 
        productId: item.productId, 
        reason: 'System error' 
      }))
    };
  }
}

/**
 * Check if inventory is available for purchase
 */
export async function checkInventoryAvailability(
  items: InventoryItem[]
): Promise<{ available: boolean; unavailableItems: Array<{ productId: string; available: number; requested: number }> }> {
  const unavailableItems: Array<{ productId: string; available: number; requested: number }> = [];
  
  for (const item of items) {
    const product = await Product.findById(item.productId).select('inventory_available').lean();
    
    if (!product) {
      unavailableItems.push({ productId: item.productId, available: 0, requested: item.quantity });
    } else if (product.inventory_available < item.quantity) {
      unavailableItems.push({ 
        productId: item.productId, 
        available: product.inventory_available, 
        requested: item.quantity 
      });
    }
  }
  
  return {
    available: unavailableItems.length === 0,
    unavailableItems
  };
}

export default {
  reserveInventory,
  commitInventory,
  releaseReservedInventory,
  releaseCommittedInventory,
  fulfillOrder,
  checkInventoryAvailability
};

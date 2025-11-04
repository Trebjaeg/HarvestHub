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
      const productCheck = await Product.findById(item.productId).session(session || null);
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
        const product = await Product.findById(item.productId).session(session || null);
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
      const productCheck = await Product.findById(item.productId).session(session || null);
      
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
        .session(session || null)
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
            ? `Cannot commit inventory - insufficient reserved stock. Reserved: ${(currentProduct as any).inventory_reserved ?? 0}, Required: ${item.quantity}, Product: ${(currentProduct as any).name}. Please ensure inventory was properly reserved during checkout.`
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
      const product = await Product.findById(item.productId).session(session || null);
      
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
        const product = await Product.findById(item.productId).session(session || null);
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
      // First, try the normal path: deduct from committed inventory
      let result = await Product.findOneAndUpdate(
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

      // If that fails, check if it's because inventory wasn't committed
      if (!result) {
        const product = await Product.findById(item.productId).session(session || null);
        
        if (!product) {
          failedItems.push({ 
            productId: item.productId, 
            reason: 'Product not found'
          });
          continue;
        }

        // Check if we have enough total inventory (committed + available)
        const hasEnoughTotal = product.inventory_on_hand >= item.quantity;
        
        if (!hasEnoughTotal) {
          failedItems.push({ 
            productId: item.productId, 
            reason: `Insufficient total inventory. Available on hand: ${product.inventory_on_hand}, Required: ${item.quantity}. Please check stock levels.`
          });
          continue;
        }

        // Try fallback: deduct from available inventory if committed is insufficient
        if (product.inventory_committed < item.quantity && product.inventory_available >= item.quantity) {
          console.warn(`⚠️ Fulfilling order by deducting from available inventory (inventory wasn't properly committed). Product: ${product.name}, Committed: ${product.inventory_committed}, Available: ${product.inventory_available}, Required: ${item.quantity}`);
          
          result = await Product.findOneAndUpdate(
            {
              _id: item.productId,
              inventory_available: { $gte: item.quantity },
              inventory_on_hand: { $gte: item.quantity }
            },
            {
              $inc: {
                inventory_available: -item.quantity,
                inventory_on_hand: -item.quantity,
                stock: -item.quantity
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
              reason: `Failed to fulfill order - could not deduct from available inventory. Available: ${product.inventory_available}, On Hand: ${product.inventory_on_hand}, Required: ${item.quantity}`
            });
          }
        } else {
          // Mixed scenario: some committed, some available
          const fromCommitted = Math.min(product.inventory_committed, item.quantity);
          const fromAvailable = item.quantity - fromCommitted;
          
          if (fromAvailable > product.inventory_available) {
            failedItems.push({ 
              productId: item.productId, 
              reason: `Cannot fulfill order - insufficient mixed inventory. Committed: ${product.inventory_committed}, Available: ${product.inventory_available}, Total Required: ${item.quantity}`
            });
            continue;
          }

          console.warn(`⚠️ Fulfilling order from mixed inventory (partial commitment detected). Product: ${product.name}, From Committed: ${fromCommitted}, From Available: ${fromAvailable}`);
          
          result = await Product.findOneAndUpdate(
            {
              _id: item.productId,
              inventory_on_hand: { $gte: item.quantity }
            },
            {
              $inc: {
                inventory_committed: -fromCommitted,
                inventory_available: -fromAvailable,
                inventory_on_hand: -item.quantity,
                stock: -item.quantity
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
              reason: `Failed to fulfill order with mixed inventory - database update failed. On Hand: ${product.inventory_on_hand}, Required: ${item.quantity}`
            });
          }
        }
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
    console.error('Error in fulfillOrder:', error);
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
    // @ts-ignore - Complex type inference issue with lean() query
    } else if (product?.inventory_available && product.inventory_available < item.quantity) {
      unavailableItems.push({ 
        productId: item.productId, 
        // @ts-ignore - Complex type inference issue with lean() query
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

const inventoryManager = {
  reserveInventory,
  commitInventory,
  releaseReservedInventory,
  releaseCommittedInventory,
  fulfillOrder,
  checkInventoryAvailability
};

export default inventoryManager;

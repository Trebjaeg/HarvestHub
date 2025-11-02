/**
 * Migration script to fix products with stock but missing inventory fields
 * Run this to populate inventory_on_hand and inventory_available for existing products
 * 
 * Usage: npx ts-node scripts/fix-product-inventory.ts
 */

import dbConnect from '../lib/mongodb';
import Product from '../models/Product';

async function fixProductInventory() {
  try {
    console.log('🔄 Connecting to database...');
    await dbConnect();

    console.log('📦 Finding products with missing inventory fields...');
    
    // Find all products
    const products = await Product.find({}).select('_id name stock inventory_on_hand inventory_available inventory_reserved inventory_committed');
    
    console.log(`Found ${products.length} products to check\n`);

    let fixedCount = 0;
    let skippedCount = 0;

    for (const product of products) {
      const needsUpdate = 
        product.stock > 0 && 
        (product.inventory_on_hand === undefined || 
         product.inventory_on_hand === null || 
         product.inventory_available === undefined || 
         product.inventory_available === null ||
         product.inventory_available === 0);

      if (needsUpdate) {
        const stockValue = product.stock || 0;
        const reserved = product.inventory_reserved || 0;
        const committed = product.inventory_committed || 0;
        const available = Math.max(0, stockValue - reserved - committed);

        console.log(`📝 Fixing: ${product.name}`);
        console.log(`   Stock: ${stockValue}`);
        console.log(`   Reserved: ${reserved}, Committed: ${committed}`);
        console.log(`   Setting inventory_on_hand: ${stockValue}, inventory_available: ${available}`);

        await Product.findByIdAndUpdate(product._id, {
          $set: {
            inventory_on_hand: stockValue,
            inventory_available: available,
            inventory_reserved: reserved,
            inventory_committed: committed
          }
        });

        fixedCount++;
        console.log(`   ✅ Fixed!\n`);
      } else {
        skippedCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   Total products: ${products.length}`);
    console.log(`   Fixed: ${fixedCount}`);
    console.log(`   Skipped (already correct): ${skippedCount}`);
    console.log('\n✅ Migration completed successfully!');
    
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error fixing product inventory:', error);
    process.exit(1);
  }
}

// Run the script
fixProductInventory();

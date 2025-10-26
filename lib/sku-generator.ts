import Product from '@/models/Product';

/**
 * Category code mapping for SKU generation
 */
const CATEGORY_CODES: { [key: string]: string } = {
  'Vegetables': 'VEG',
  'Fruits': 'FRU',
  'Grains': 'GRN',
  'Herbs': 'HRB',
  'Dairy': 'DRY',
  'Poultry': 'PLT',
  'Livestock': 'LVS',
  'Seafood': 'SEA',
  'Others': 'OTH'
};

/**
 * Get category code from category name
 */
function getCategoryCode(category: string): string {
  return CATEGORY_CODES[category] || category.slice(0, 3).toUpperCase();
}

/**
 * Get farmer ID short code (last 4 digits of farmerId)
 */
function getFarmerCode(farmerId: string): string {
  return farmerId.slice(-4).toUpperCase();
}

/**
 * Generate a unique SKU based on category and farmer ID
 * Format: {CATEGORY_CODE}-{FARMER_CODE}-{SEQUENCE}
 * Example: VEG-A1B2-0001
 */
export async function generateSKU(category: string, farmerId: string): Promise<string> {
  const categoryCode = getCategoryCode(category);
  const farmerCode = getFarmerCode(farmerId);
  
  // Find the highest sequence number for this farmer and category
  const existingProducts = await Product.find({
    farmerId: farmerId,
    category: category,
    sku: { $exists: true, $ne: null }
  })
  .select('sku')
  .lean()
  .exec();

  // Extract sequence numbers
  const sequences = existingProducts
    .map(p => p.sku)
    .filter(sku => sku && sku.startsWith(`${categoryCode}-${farmerCode}-`))
    .map(sku => {
      const parts = sku!.split('-');
      return parseInt(parts[2] || '0', 10);
    })
    .filter(num => !isNaN(num));

  // Get next sequence number
  const nextSequence = sequences.length > 0 ? Math.max(...sequences) + 1 : 1;
  
  // Format as 4-digit sequence
  const sequenceStr = nextSequence.toString().padStart(4, '0');
  
  return `${categoryCode}-${farmerCode}-${sequenceStr}`;
}

/**
 * Validate SKU format
 * Format: XXX-XXXX-XXXX (letters/numbers-alphanumeric-numbers)
 */
export function validateSKUFormat(sku: string): boolean {
  if (!sku || typeof sku !== 'string') return false;
  
  // Must be between 8 and 50 characters
  if (sku.length < 8 || sku.length > 50) return false;
  
  // Basic format validation: at least one dash
  if (!sku.includes('-')) return false;
  
  // Only allow alphanumeric and dashes
  return /^[A-Z0-9-]+$/.test(sku);
}

/**
 * Check if SKU is unique
 */
export async function isSKUUnique(sku: string, excludeProductId?: string): Promise<boolean> {
  if (!sku) return true; // Empty SKU is allowed (will be auto-generated)
  
  const query: any = { sku: sku.toUpperCase() };
  
  // Exclude current product when editing
  if (excludeProductId) {
    query._id = { $ne: excludeProductId };
  }
  
  const existing = await Product.findOne(query).lean().exec();
  return !existing;
}

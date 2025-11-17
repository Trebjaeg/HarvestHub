/**
 * Currency Formatting Utilities
 * Ensures consistent decimal formatting across the entire application
 */

/**
 * Formats a number as Philippine Peso currency with exactly 2 decimal places
 * @param amount - The amount to format
 * @returns Formatted currency string (e.g., "₱1,234.56")
 */
export function formatCurrency(amount: number): string {
  if (amount === 0) return '₱0.00';
  
  try {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    // Fallback if Intl is not supported
    return `₱${amount.toFixed(2)}`;
  }
}

/**
 * Formats a number with 2 decimal places without currency symbol
 * @param amount - The amount to format
 * @returns Formatted number string with 2 decimals (e.g., "1234.56")
 */
export function formatDecimal(amount: number): string {
  return amount.toFixed(2);
}

/**
 * Formats a number as percentage with 2 decimal places
 * @param value - The value to format (0.1234 = 12.34%)
 * @returns Formatted percentage string (e.g., "12.34%")
 */
export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

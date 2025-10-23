'use client';

import Image from 'next/image';
import { IProduct } from '../types/product';

// Extended interface to handle both IProduct and DealProduct types
interface FlexibleProduct {
  _id: string;
  name: string;
  category: string;
  currentPrice: number;
  basePrice?: number;
  unit: string;
  stock: number;
  // Optional fields that may not exist in all product types
  description?: string;
  imageUrl?: string;
  image?: string; // Alternative image field name
  images?: string[]; // Array of images
  farmer?: {
    name: string;
    location: string;
    contact: string;
  };
  isOrganic?: boolean;
  isFeatured?: boolean;
  tags?: string[];
  rating?: number;
  reviews?: number;
  dealId?: string;
  dealTitle?: string;
  discountPercentage?: number;
  nutritionalInfo?: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fiber: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProductCardProps {
  product: IProduct | FlexibleProduct;
  className?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, className = '' }) => {
  const hasDiscount = product.basePrice && product.basePrice > product.currentPrice;

  // Get image URL - check multiple possible fields with proper typing
  const flexProduct = product as FlexibleProduct;
  const rawImageUrl = flexProduct.image || 
                      flexProduct.images?.[0] || 
                      flexProduct.imageUrl;
  
  // Filter out invalid URLs (blob, data, empty strings) and ensure it's from Spaces
  const imageUrl = rawImageUrl && 
                   !rawImageUrl.startsWith('blob:') && 
                   !rawImageUrl.startsWith('data:') &&
                   rawImageUrl.trim() !== '' &&
                   rawImageUrl !== '/images/products/default.png' // Don't use local default if Spaces URL exists
    ? rawImageUrl
    : null;

  // Debug logging only in development
  if (process.env.NODE_ENV === 'development') {
    console.log('ProductCard image URL:', imageUrl, 'for product:', product.name);
  }

  return (
    <div className={`bg-white rounded-3xl border-2 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] ${className}`} style={{ width: '218px', height: '275px', borderColor: '#40613D' }}>
      {/* Product Image - Takes remaining space after info section (275px - 89px = 186px) */}
      <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6" style={{ height: '186px' }}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-contain p-3"
            sizes="218px"
            unoptimized={imageUrl.includes('digitaloceanspaces.com')}
            onError={(e) => {
              if (process.env.NODE_ENV === 'development') {
                console.error('Image failed to load from Spaces:', imageUrl);
              }
              // Hide broken image - show placeholder SVG instead
              (e.target as HTMLImageElement).style.display = 'none';
            }}
            priority={false}
            loading="lazy"
          />
        ) : (
          // SVG placeholder when no image available
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="120" height="120" fill="#F5ECDE" opacity="0.3"/>
            <path d="M 32 56 L 40 96 L 80 96 L 88 56 Z" fill="#40613D" opacity="0.2"/>
            <ellipse cx="60" cy="48" rx="18" ry="20" fill="#8FB78E"/>
            <ellipse cx="58" cy="46" rx="16" ry="18" fill="#A8D5A8"/>
            <path d="M 60 32 Q 66 34 64 40" fill="#40613D" opacity="0.7"/>
            <text x="60" y="108" fontFamily="Arial" fontSize="8" fill="#40613D" textAnchor="middle" opacity="0.5">No Image</text>
          </svg>
        )}
      </div>

      {/* Product Info - Beige/Cream Background - Fixed height 89px */}
      <div className="bg-[#F5ECDE] flex flex-col" style={{ height: '89px', padding: '8px 12px' }}>
        {/* Category - 12px height */}
        <p className="text-[11px] text-gray-600 font-normal mb-0.5" style={{ fontFamily: 'Poppins, sans-serif', lineHeight: '12px', height: '12px' }}>
          {product.category}
        </p>

        {/* Product Name - 33px height */}
        <h3 className="text-[17px] font-bold text-[#1E3A2F] mb-1 line-clamp-1" style={{ fontFamily: 'Poppins, sans-serif', lineHeight: '22px', height: '33px', display: 'flex', alignItems: 'center' }}>
          {product.name}
        </h3>

        {/* Price Section with Cart Button */}
        <div className="flex items-end justify-between mt-auto">
          <div className="flex items-center gap-1.5" style={{ height: '24px' }}>
            <span className="text-[16px] font-bold text-[#1E3A2F]" style={{ fontFamily: 'Poppins, sans-serif', lineHeight: '24px' }}>
              ₱{product.currentPrice}/{product.unit}
            </span>
            {hasDiscount && product.basePrice && (
              <span className="text-[12px] text-gray-500 line-through" style={{ fontFamily: 'Poppins, sans-serif', lineHeight: '24px' }}>
                ₱{product.basePrice}/{product.unit}
              </span>
            )}
          </div>

          {/* Add to Cart Button - 28x28px Rounded Square - Positioned 2px higher */}
          <button 
            className={`flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
              product.stock > 0
                ? 'bg-[#1E3A2F] hover:bg-[#2D5240] text-white hover:scale-105'
                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
            }`}
            style={{ 
              width: '28px', 
              height: '28px', 
              minWidth: '28px',
              minHeight: '28px',
              borderRadius: '6px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              marginBottom: '2px'
            }}
            disabled={product.stock === 0}
            aria-label="Add to cart"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" style={{ width: '14px', height: '14px' }}>
              <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useRef } from 'react';
import { IProduct } from '../types/product';
import AlertDialog from './ui/AlertDialog';

// Extended interface to handle both IProduct and DealProduct types
interface FlexibleProduct {
  _id: string;
  name: string;
  category: string;
  currentPrice?: number;
  price?: number; // Add price as alternative field
  basePrice?: number;
  originalPrice?: number; // Add originalPrice as alternative field
  unit: string;
  stock: number;
  // Optional fields that may not exist in all product types
  description?: string;
  imageUrl?: string;
  image?: string; // Alternative image field name
  images?: string[]; // Array of images
  farmerId?: string; // ID of the farmer/seller
  farmerName?: string; // Name of the farmer/seller
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
  const [isAnimating, setIsAnimating] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);
  const [alertDialog, setAlertDialog] = useState({
    isOpen: false,
    title: '',
    message: ''
  });

  // Handle both currentPrice/basePrice and price/originalPrice formats
  const flexProduct = product as FlexibleProduct;
  const displayPrice = flexProduct.currentPrice ?? flexProduct.price ?? 0;
  const displayOriginalPrice = flexProduct.basePrice ?? flexProduct.originalPrice;
  const hasDiscount = displayOriginalPrice && displayOriginalPrice > displayPrice;

  // Get image URL - check multiple possible fields with proper typing
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
    <>
    <Link href={`/product/${product._id}`} className="block">
      <div className={`bg-white rounded-3xl border-2 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] ${className}`} style={{ width: '218px', height: '275px', borderColor: '#40613D' }}>
        {/* Product Image - Takes remaining space after info section (275px - 89px = 186px) */}
        <div ref={imageRef} className="relative bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden" style={{ height: '186px' }}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover"
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

      {/* Product Info - Beige/Cream Background */}
      <div className="bg-[#F5ECDE] flex flex-col" style={{ height: '89px', padding: '8px 12px' }}>
        {/* Category - 12px height */}
        <p className="text-[11px] text-gray-600 font-normal mb-0.5" style={{ fontFamily: 'Poppins, sans-serif', lineHeight: '12px', height: '12px' }}>
          {product.category}
        </p>

        {/* Product Name - 33px height with ellipsis for long names */}
        <h3 
          className="text-[17px] font-bold text-[#1E3A2F] mb-1 overflow-hidden text-ellipsis whitespace-nowrap" 
          style={{ 
            fontFamily: 'Poppins, sans-serif', 
            lineHeight: '22px', 
            height: '33px', 
            display: 'flex', 
            alignItems: 'center' 
          }}
          title={product.name} // Show full name on hover
        >
          {product.name}
        </h3>

        {/* Price Section with Cart Button */}
        <div className="flex items-end justify-between mt-auto">
          <div className="flex items-center gap-1.5" style={{ height: '24px' }}>
            <span className="text-[16px] font-bold text-[#1E3A2F]" style={{ fontFamily: 'Poppins, sans-serif', lineHeight: '24px' }}>
              ₱{displayPrice.toFixed(2)}/{product.unit}
            </span>
            {hasDiscount && displayOriginalPrice && (
              <span className="text-[12px] text-gray-500 line-through" style={{ fontFamily: 'Poppins, sans-serif', lineHeight: '24px' }}>
                ₱{displayOriginalPrice.toFixed(2)}/{product.unit}
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
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              
              // Don't allow multiple clicks during animation
              if (isAnimating) return;
              
              try {
                const response = await fetch('/api/cart/add', {
                  method: 'POST',
                  credentials: 'include',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    productId: product._id, 
                    quantity: 1 
                  })
                });

                const data = await response.json();

                if (response.ok) {
                  // Start jump animation
                  setIsAnimating(true);
                  
                  // Get cart icon position - find the visible cart icon
                  let cartIcon: Element | null = null;
                  
                  // Check if we're on mobile or desktop by window width
                  const isMobile = window.innerWidth < 768;
                  
                  // Try to find the cart icon that's actually visible
                  if (isMobile) {
                    cartIcon = document.querySelector('.md\\:hidden [data-cart-icon] svg') || 
                               document.querySelector('.md\\:hidden [data-cart-icon]');
                  } else {
                    cartIcon = document.querySelector('.hidden.md\\:flex [data-cart-icon] svg') || 
                               document.querySelector('.hidden.md\\:flex [data-cart-icon]');
                  }
                  
                  // Fallback to any cart icon
                  if (!cartIcon) {
                    cartIcon = document.querySelector('[data-cart-icon] svg') || 
                               document.querySelector('[data-cart-icon]') || 
                               document.querySelector('a[href="/cart"] svg') ||
                               document.querySelector('a[href="/cart"]');
                  }
                  
                  const imageElement = imageRef.current;
                  
                  if (cartIcon && imageElement) {
                    // Get positions
                    const imageRect = imageElement.getBoundingClientRect();
                    const cartRect = cartIcon.getBoundingClientRect();
                    
                    // Calculate the distance to travel to center of cart icon
                    const deltaX = (cartRect.left + cartRect.width / 2) - (imageRect.left + imageRect.width / 2);
                    const deltaY = (cartRect.top + cartRect.height / 2) - (imageRect.top + imageRect.height / 2);
                    
                    // Create clone for animation
                    const clone = imageElement.cloneNode(true) as HTMLElement;
                    clone.style.position = 'fixed';
                    clone.style.left = imageRect.left + 'px';
                    clone.style.top = imageRect.top + 'px';
                    clone.style.width = imageRect.width + 'px';
                    clone.style.height = imageRect.height + 'px';
                    clone.style.zIndex = '9999';
                    clone.style.transition = 'all 1.2s cubic-bezier(0.4, 0.0, 0.2, 1)';
                    clone.style.pointerEvents = 'none';
                    clone.style.borderRadius = '12px';
                    clone.style.boxShadow = '0 10px 40px rgba(0,0,0,0.3)';
                    document.body.appendChild(clone);
                    
                    // Trigger animation after a small delay
                    setTimeout(() => {
                      clone.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.15)`;
                      clone.style.opacity = '0.3';
                    }, 50);
                    
                    // Remove clone and trigger cart shake
                    setTimeout(() => {
                      document.body.removeChild(clone);
                      setIsAnimating(false);
                      
                      // Trigger cart shake animation with updated count
                      window.dispatchEvent(new CustomEvent('cart-updated', { 
                        detail: { count: data.count || data.cartCount }
                      }));
                    }, 1250); // Wait for jump animation to complete
                  } else {
                    // Fallback if cart icon not found
                    setIsAnimating(false);
                    window.dispatchEvent(new CustomEvent('cart-updated', { 
                      detail: { count: data.count || data.cartCount }
                    }));
                  }
                } else {
                  // Handle errors (cart limit, etc.)
                  setIsAnimating(false);
                  setAlertDialog({
                    isOpen: true,
                    title: data.code === 'CART_LIMIT' ? 'Cart Limit Reached' : 'Error',
                    message: data.message || data.error || 'Failed to add to cart'
                  });
                }
              } catch (error) {
                console.error('Error adding to cart:', error);
                setIsAnimating(false);
                setAlertDialog({
                  isOpen: true,
                  title: 'Error',
                  message: 'Failed to add to cart. Please try again.'
                });
              }
            }}
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" style={{ width: '14px', height: '14px' }}>
              <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
    </Link>
      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ isOpen: false, title: '', message: '' })}
        title={alertDialog.title}
        message={alertDialog.message}
      />
    </>
  );
};

export default ProductCard;
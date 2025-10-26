'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Star, MapPin, ShoppingCart, Heart, Share2, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import LoadingDots from '@/components/ui/LoadingDots';
import { useAuthUserData } from '@/hooks/useAuthUserData';
import LanguageSwitcher from '@/components/LanguageSwitcher';

interface ProductDetailsProps {
  productId: string;
}

export default function ProductDetails({ productId }: ProductDetailsProps) {
  const router = useRouter();
  const { isAuthenticated, cartCount: initialCartCount, notificationCount } = useAuthUserData();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewsPagination, setReviewsPagination] = useState<any>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);
  const [cartCount, setCartCount] = useState(initialCartCount);
  const [cartShake, setCartShake] = useState(false);

  useEffect(() => {
    fetchProductDetails();
    fetchReviews();
  }, [productId]);

  // Update cart count when initial value changes
  useEffect(() => {
    setCartCount(initialCartCount);
  }, [initialCartCount]);

  // Listen for cart update events
  useEffect(() => {
    const handleCartUpdate = (event: any) => {
      setCartShake(true);
      setTimeout(() => setCartShake(false), 600);
      
      if (event.detail?.count !== undefined) {
        setCartCount(event.detail.count);
      }
    };
    
    window.addEventListener('cart-updated', handleCartUpdate);
    return () => window.removeEventListener('cart-updated', handleCartUpdate);
  }, []);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products/${productId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch product');
      }

      const data = await response.json();
      if (data.success && data.data) {
        setProduct(data.data);
        setSeller(data.data.seller);
      } else {
        throw new Error(data.message || 'Failed to load product');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (page = 1) => {
    try {
      setReviewsLoading(true);
      const response = await fetch(`/api/products/${productId}/reviews?page=${page}&limit=10`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }

      const data = await response.json();
      if (data.success && data.data) {
        setReviews(data.data.reviews);
        setReviewsPagination(data.data.pagination);
        setReviewPage(page);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleAddToCart = async () => {
    // Check if product is available (has stock and is active)
    if (!product || product.stock <= 0 || !product.isActive) return;
    
    // Don't allow multiple clicks during animation
    if (isAnimating) return;
    
    try {
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          productId: product._id, 
          quantity 
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Start jump animation
        setIsAnimating(true);
        
        // Get cart icon position - find the cart button/link
        const isMobile = window.innerWidth < 768;
        let cartIcon: Element | null = null;
        
        if (isMobile) {
          // On mobile, find the cart link by ID
          cartIcon = document.getElementById('mobile-cart-icon');
        } else {
          // On desktop, find the Link by ID
          cartIcon = document.getElementById('desktop-cart-icon');
        }
        
        console.log('Cart icon found:', cartIcon ? 'Yes' : 'No', 'isMobile:', isMobile);
        
        const imageElement = imageRef.current;
        
        if (cartIcon && imageElement) {
          // Get positions
          const imageRect = imageElement.getBoundingClientRect();
          const cartRect = cartIcon.getBoundingClientRect();
          
          console.log('Image position:', { left: imageRect.left, top: imageRect.top, width: imageRect.width, height: imageRect.height });
          console.log('Cart position:', { left: cartRect.left, top: cartRect.top, width: cartRect.width, height: cartRect.height });
          
          // Calculate the distance to travel to center of cart icon
          const deltaX = (cartRect.left + cartRect.width / 2) - (imageRect.left + imageRect.width / 2);
          const deltaY = (cartRect.top + cartRect.height / 2) - (imageRect.top + imageRect.height / 2);
          
          console.log('Delta:', { deltaX, deltaY });
          
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
            
            // Trigger cart shake animation
            if (cartIcon) {
              cartIcon.classList.add('animate-shake');
              setTimeout(() => {
                cartIcon.classList.remove('animate-shake');
              }, 500);
            }
            
            // Update cart count via custom event
            window.dispatchEvent(new CustomEvent('cart-updated', { 
              detail: { count: data.count || data.cartCount }
            }));
          }, 1250); // Wait for jump animation to complete
        } else {
          // Fallback if cart icon not found
          console.log('Cart icon not found, skipping animation');
          setIsAnimating(false);
          window.dispatchEvent(new CustomEvent('cart-updated', { 
            detail: { count: data.count || data.cartCount }
          }));
        }
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      setIsAnimating(false);
    }
  };

  const handleBuyNow = () => {
    // Check if product is available (has stock and is active)
    if (!product || product.stock <= 0 || !product.isActive) return;
    // Buy now functionality - could navigate to checkout
    router.push('/checkout');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
        {/* Loading Dots */}
        <div className="flex items-center justify-center py-12">
          <LoadingDots size="lg" color="#40613D" />
        </div>

        {/* Content Skeleton */}
        <div className="container mx-auto px-4 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Image Gallery Skeleton */}
            <div className="space-y-4">
              <div className="w-full h-96 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-20 h-20 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            </div>

            {/* Product Info Skeleton */}
            <div className="space-y-6">
              <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-1/4 bg-gray-200 rounded animate-pulse"></div>
              <div className="flex items-center gap-4">
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="flex items-center gap-4 pt-4">
                <div className="h-12 w-32 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-12 flex-1 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-12 flex-1 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Seller Section Skeleton */}
          <div className="bg-[#E8F4F8] rounded-lg p-6 mb-8">
            <div className="h-6 w-48 bg-gray-300 rounded animate-pulse mb-4"></div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-300 rounded-full animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-5 w-40 bg-gray-300 rounded animate-pulse"></div>
                <div className="h-4 w-32 bg-gray-300 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Reviews Section Skeleton */}
          <div className="mb-8">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <div className="h-20 w-32 bg-gray-200 rounded animate-pulse"></div>
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
                      <div className="flex-1 h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Review Cards Skeleton */}
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-full bg-gray-200 rounded animate-pulse mt-4"></div>
                      <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8" style={{ fontFamily: 'Poppins, sans-serif' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <p className="text-red-600 text-lg mb-4">{error || 'Product not found'}</p>
            <button
              onClick={() => router.back()}
              className="text-[#40613D] hover:underline"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const images = product.image 
    ? [product.image, ...(product.images || [])] 
    : product.images || ['/images/products/default.png'];
  const discountPercentage = product.originalPrice && product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
      {/* Header - Same as home page */}
      <header className="bg-[#103C2E] text-white py-3 md:py-4">
        <div className="container mx-auto px-4">
          {/* Mobile Header */}
          <div className="flex md:hidden items-center justify-between">
            <div className="flex items-center">
              <Link href="/home" className="text-xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <span style={{ color: '#6CD75A' }}>Harvest</span>
                <span style={{ color: '#D4DB69' }}> Hub</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-3">
              <Link href="/my-profile" className="flex items-center space-x-1" title="Profile">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              </Link>
              
              <Link href="/cart" data-cart-icon className="relative" id="mobile-cart-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${cartShake ? 'animate-shake' : ''}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center z-10 animate-pulse">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
              
              <button className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
                {isAuthenticated && notificationCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
              </button>
              
              <div className="relative">
                <LanguageSwitcher variant="header" />
              </div>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/home" className="text-2xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <span style={{ color: '#6CD75A' }}>Harvest</span>
                <span style={{ color: '#D4DB69' }}> Hub</span>
              </Link>
            </div>
            
            <div className="flex-1 max-w-2xl mx-6">
              <div className="relative">
                <svg className="absolute left-5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search for products..."
                  className="w-full pl-14 pr-6 py-3 rounded-2xl text-gray-800 bg-white border-0 focus:outline-none focus:ring-2 focus:ring-green-400/50 placeholder-gray-500 shadow-sm"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Link href="/my-profile" className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-[#0d3123] transition-colors" title="Profile">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
                <span className="text-sm font-medium text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>Profile</span>
              </Link>
              
              <Link href="/cart" data-cart-icon className={`relative px-4 py-2 rounded-lg hover:bg-[#0d3123] transition-colors flex items-center space-x-2`} id="desktop-cart-icon">
                <ShoppingCart className={`w-5 h-5 ${cartShake ? 'animate-shake' : ''}`} />
                <span className="text-sm font-medium text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center z-10 animate-pulse">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
              
              <button className="relative px-4 py-2 rounded-lg hover:bg-[#0d3123] transition-colors flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
                <span className="text-sm font-medium text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>Notifications</span>
                {isAuthenticated && notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
              </button>
              
              <div className="relative">
                <LanguageSwitcher variant="header" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
          <Link href="/home" className="text-gray-500 hover:text-gray-700">Home</Link>
          <span className="mx-2 text-gray-400">/</span>
          <Link href="/shop" className="text-gray-500 hover:text-gray-700">Shop</Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div ref={imageRef} className="relative aspect-square bg-white rounded-lg overflow-hidden shadow-lg">
              <Image
                src={images[selectedImage]}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
                priority
              />
              {product.isOrganic && (
                <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  Organic
                </div>
              )}
              {discountPercentage > 0 && (
                <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  -{discountPercentage}%
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === idx
                        ? 'border-[#40613D] ring-2 ring-[#40613D]/20'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {product.name}
              </h1>
              
              {/* Rating */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.round(product.rating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {product.rating > 0 ? product.rating.toFixed(1) : 'No ratings yet'}
                </span>
                <span className="text-sm text-gray-400" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  ({product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'})
                </span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-6">
                {product.price != null && (
                  <>
                    <span className="text-4xl font-bold text-[#40613D]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      ₱{product.price.toFixed(2)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-xl text-gray-400 line-through" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        ₱{product.originalPrice.toFixed(2)}
                      </span>
                    )}
                    {product.unit && (
                      <span className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        / {product.unit}
                      </span>
                    )}
                  </>
                )}
                {product.price == null && (
                  <span className="text-2xl text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Price not available
                  </span>
                )}
              </div>
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              {product.stock > 0 && (!seller || !seller.isSuspended) ? (
                <>
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="text-green-600 font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    In Stock ({product.stock} {product.unit} available)
                  </span>
                </>
              ) : (
                <>
                  <X className="w-5 h-5 text-red-600" />
                  <span className="text-red-600 font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {seller?.isSuspended ? 'Seller Suspended' : 'Out of Stock'}
                  </span>
                </>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Description
                </h3>
                <p className="text-gray-600 leading-relaxed" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {product.description}
                </p>
              </div>
            )}

            {/* Quantity Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Quantity
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1 || !product || product.stock <= 0}
                  className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))}
                  disabled={!product || product.stock <= 0}
                  className="w-20 h-10 text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40613D]"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                />
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={!product || quantity >= product.stock || product.stock <= 0}
                  className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleAddToCart}
                disabled={!product || product.stock <= 0 || !product.isActive}
                className="flex-1 bg-[#40613D] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#2f4a2d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                <ShoppingCart className="w-5 h-5" />
                Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                disabled={!product || product.stock <= 0 || !product.isActive}
                className="flex-1 bg-[#F5A623] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#e09617] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                Buy Now
              </button>
            </div>

            {/* Additional Actions */}
            <div className="flex gap-4 pt-4 border-t">
              <button className="flex items-center gap-2 text-gray-600 hover:text-[#40613D]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <Heart className="w-5 h-5" />
                Add to Wishlist
              </button>
              <button className="flex items-center gap-2 text-gray-600 hover:text-[#40613D]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <Share2 className="w-5 h-5" />
                Share
              </button>
            </div>
          </div>
        </div>

        {/* Seller Card - Light blue background like home page */}
        {seller && (
          <div className="rounded-lg p-6 mb-8" style={{ backgroundColor: '#E8F4F8' }}>
            <h2 className="text-xl font-bold text-gray-900 mb-4 pb-3 border-b border-gray-300" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Seller Information
            </h2>
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                {seller.profileImage ? (
                  <Image
                    src={seller.profileImage}
                    alt={seller.name}
                    width={80}
                    height={80}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {seller.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Link
                    href={`/seller/${seller.id}`}
                    className="text-xl font-bold text-gray-900 hover:text-[#40613D]"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    {seller.name}
                  </Link>
                  {seller.isVerified && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Verified
                    </span>
                  )}
                  {seller.isSuspended && (
                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Suspended
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {seller.location}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-6 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= Math.round(seller.rating)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {seller.rating > 0 ? seller.rating.toFixed(1) : 'No'} Rating
                    </p>
                    <p className="text-xs text-gray-400" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {seller.reviewCount} reviews
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#40613D]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {seller.responseRate}%
                    </p>
                    <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Response Rate
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#40613D]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      &lt; 2h
                    </p>
                    <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Response Time
                    </p>
                  </div>
                </div>
                <Link
                  href={`/seller/${seller.id}`}
                  className="inline-block bg-gray-100 text-gray-900 px-6 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  Visit Store
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Shipping Info */}
        <div className="bg-white rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-3 border-b border-gray-300" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Shipping Information
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#40613D] rounded-full mt-2"></div>
              <div>
                <p className="font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Standard Delivery
                </p>
                <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  3-5 business days
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#40613D] rounded-full mt-2"></div>
              <div>
                <p className="font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Express Delivery
                </p>
                <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  1-2 business days (Additional fee applies)
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#40613D] rounded-full mt-2"></div>
              <div>
                <p className="font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Free Shipping
                </p>
                <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  On orders over ₱1,000
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-3 border-b border-gray-300" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Reviews & Ratings
          </h2>
          
          {/* Rating Summary */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-8">
              {/* Big Rating Number */}
              <div className="text-center">
                <div className="text-5xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {product.rating ? product.rating.toFixed(1) : '0.0'}
                </div>
                <div className="text-sm text-gray-600 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  out of 5
                </div>
                <div className="flex items-center justify-center mb-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.round(product.rating || 0)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-xs text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  ({product.reviewCount || 0} {product.reviewCount === 1 ? 'review' : 'reviews'})
                </div>
              </div>

              {/* Rating Distribution */}
              <div className="flex-1">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = product.ratingDistribution?.[rating] || 0;
                  const percentage = product.reviewCount > 0 ? (count / product.reviewCount) * 100 : 0;
                  return (
                    <div key={rating} className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-medium w-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {rating}
                      </span>
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
                        <div
                          className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-12 text-right" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        ({count})
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            {product.reviewCount > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.round(product.rating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-lg font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {product.rating.toFixed(1)} out of 5
                </span>
              </div>
            )}
          </div>

          {/* Rating Distribution */}
          {product.reviewCount > 0 && (
            <div className="mb-8">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = product.ratingDistribution[rating] || 0;
                const percentage = product.reviewCount > 0 ? (count / product.reviewCount) * 100 : 0;
                return (
                  <div key={rating} className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-medium w-8" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {rating} ★
                    </span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Reviews List */}
          <div className="pt-6 border-t border-gray-300">
            {reviewsLoading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingDots size="md" color="#40613D" />
              </div>
            ) : reviews.length > 0 ? (
              <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b pb-6 last:border-0">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                      {review.buyer.profileImage ? (
                        <Image
                          src={review.buyer.profileImage}
                          alt={review.buyer.name}
                          width={48}
                          height={48}
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg font-bold text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {review.buyer.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {review.buyer.name}
                        </span>
                        {review.verified && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            Verified Purchase
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= review.rating
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="text-sm text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {review.title && (
                        <h4 className="font-semibold text-gray-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {review.title}
                        </h4>
                      )}
                      <p className="text-gray-600 mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {review.comment}
                      </p>
                      {review.images && review.images.length > 0 && (
                        <div className="flex gap-2 mb-3">
                          {review.images.map((img: string, idx: number) => (
                            <div key={idx} className="w-20 h-20 rounded-lg overflow-hidden">
                              <Image
                                src={img}
                                alt={`Review image ${idx + 1}`}
                                width={80}
                                height={80}
                                className="object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      {review.sellerResponse && (
                        <div className="bg-gray-50 rounded-lg p-4 mt-3">
                          <p className="text-sm font-semibold text-gray-900 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            Seller Response
                          </p>
                          <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {review.sellerResponse.comment}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {reviewsPagination && reviewsPagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-6">
                  <button
                    onClick={() => fetchReviews(reviewPage - 1)}
                    disabled={reviewPage === 1}
                    className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Page {reviewPage} of {reviewsPagination.totalPages}
                  </span>
                  <button
                    onClick={() => fetchReviews(reviewPage + 1)}
                    disabled={!reviewsPagination.hasMore}
                    className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg font-medium mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                No reviews yet
              </p>
              <p className="text-gray-400" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Be the first to review this product
              </p>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}

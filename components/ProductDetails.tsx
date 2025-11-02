'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Star, MapPin, ShoppingCart, Share2, ChevronLeft, ChevronRight, Check, X, ShieldAlert, MessageCircle } from 'lucide-react';
import LoadingDots from '@/components/ui/LoadingDots';
import { useAuthUserData } from '@/hooks/useAuthUserData';
import { useAuth } from '@/contexts/AuthContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import FavoriteButton from '@/components/FavoriteButton';
import ReviewItem from '@/components/ReviewItem';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ProductDetailsProps {
  productId: string;
}

export default function ProductDetails({ productId }: ProductDetailsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const { cartCount: initialCartCount, notificationCount } = useAuthUserData();
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
  const [reviewSort, setReviewSort] = useState<'recent' | 'helpful' | 'high' | 'low'>('recent');
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);
  const [cartCount, setCartCount] = useState(initialCartCount);
  const [cartShake, setCartShake] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false); // Prevent duplicate clicks
  const [errorModal, setErrorModal] = useState<{ show: boolean; message: string; title?: string }>({ 
    show: false, 
    message: '',
    title: 'Error'
  });
  const [reportInfo, setReportInfo] = useState<any>(null);
  const [takingDown, setTakingDown] = useState(false);
  const [showTakedownDialog, setShowTakedownDialog] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const reportId = searchParams?.get('reportId');

  useEffect(() => {
    fetchProductDetails();
    fetchReviews();
    if (isAdmin && reportId) {
      fetchReportInfo(reportId);
    }
  }, [productId, reportId, isAdmin]);

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

  const fetchReportInfo = async (reportId: string) => {
    try {
      const response = await fetch(`/api/admin/product-reports?reportId=${reportId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.reports && data.reports.length > 0) {
          setReportInfo(data.reports[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching report info:', err);
    }
  };

  const handleTakedownClick = () => {
    setShowTakedownDialog(true);
  };

  const confirmTakedown = async () => {
    setShowTakedownDialog(false);
    setTakingDown(true);
    
    try {
      const response = await fetch(`/api/admin/products/${productId}/takedown`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to take down product');
      }

      const data = await response.json();
      
      // Show success modal
      setErrorModal({
        show: true,
        title: 'Success',
        message: 'Product has been taken down successfully. The seller can appeal this decision.'
      });
      
      fetchProductDetails();
      
      // If came from reports, go back to reports after showing success
      setTimeout(() => {
        if (reportId) {
          router.push('/admin');
        }
      }, 2000);
    } catch (error) {
      console.error('Error taking down product:', error);
      setErrorModal({
        show: true,
        title: 'Error',
        message: 'Failed to take down product. Please try again.'
      });
    } finally {
      setTakingDown(false);
    }
  };

  const fetchReviews = async (page = 1, sort?: string, star?: number | null) => {
    try {
      setReviewsLoading(true);
      const sortParam = sort !== undefined ? sort : reviewSort;
      const starParam = star !== undefined ? star : starFilter;
      
      let url = `/api/products/${productId}/reviews?page=${page}&limit=10&sort=${sortParam}`;
      if (starParam !== null) {
        url += `&star=${starParam}`;
      }
      
      console.log('Fetching reviews with:', { page, sortParam, starParam, url });
      
      const response = await fetch(url, {
        cache: 'no-store'
      });
      
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

  const handleSortChange = (newSort: 'recent' | 'helpful' | 'high' | 'low') => {
    setReviewSort(newSort);
    setReviewPage(1);
    fetchReviews(1, newSort, starFilter);
  };

  const handleStarFilter = (star: number | null) => {
    setStarFilter(star);
    setReviewPage(1);
    fetchReviews(1, reviewSort, star);
  };

  const handleChatWithSeller = async () => {
    if (!seller) return;
    
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    
    setStartingChat(true);
    
    try {
      // Check if conversation already exists
      const response = await fetch('/api/chat/conversations', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        
        // Look for existing conversation with this seller
        const existingConversation = data.conversations?.find(
          (conv: any) => conv.userId === seller.id
        );

        if (existingConversation) {
          // Navigate to existing conversation
          router.push(`/inbox?userId=${seller.id}`);
        } else {
          // No existing conversation, open inbox to start new chat
          router.push(`/inbox?userId=${seller.id}`);
        }
      } else {
        // If can't fetch conversations, just open inbox
        router.push(`/inbox?userId=${seller.id}`);
      }
    } catch (error) {
      // Fallback to just opening inbox
      router.push(`/inbox?userId=${seller.id}`);
    } finally {
      setStartingChat(false);
    }
  };

  const handleAddToCart = async () => {
    // Check if product is available (has stock and is active)
    if (!product || product.stock <= 0 || !product.isActive) return;
    
    // Don't allow multiple clicks during animation
    if (isAnimating) return;
    
    // Start animation immediately for instant feedback
    setIsAnimating(true);
    
    // Get cart icon position early
    const isMobile = window.innerWidth < 768;
    let cartIcon: Element | null = null;
    
    if (isMobile) {
      cartIcon = document.getElementById('mobile-cart-icon');
    } else {
      cartIcon = document.getElementById('desktop-cart-icon');
    }
    
    const imageElement = imageRef.current;
    
    // Start visual animation immediately
    if (cartIcon && imageElement) {
      const imageRect = imageElement.getBoundingClientRect();
      const cartRect = cartIcon.getBoundingClientRect();
      
      const deltaX = (cartRect.left + cartRect.width / 2) - (imageRect.left + imageRect.width / 2);
      const deltaY = (cartRect.top + cartRect.height / 2) - (imageRect.top + imageRect.height / 2);
      
      const clone = imageElement.cloneNode(true) as HTMLElement;
      clone.style.position = 'fixed';
      clone.style.left = imageRect.left + 'px';
      clone.style.top = imageRect.top + 'px';
      clone.style.width = imageRect.width + 'px';
      clone.style.height = imageRect.height + 'px';
      clone.style.zIndex = '9999';
      clone.style.transition = 'all 0.8s cubic-bezier(0.4, 0.0, 0.2, 1)';
      clone.style.pointerEvents = 'none';
      clone.style.borderRadius = '12px';
      clone.style.boxShadow = '0 10px 40px rgba(0,0,0,0.3)';
      document.body.appendChild(clone);
      
      setTimeout(() => {
        clone.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.15)`;
        clone.style.opacity = '0.3';
      }, 10);
      
      setTimeout(() => {
        if (document.body.contains(clone)) {
          document.body.removeChild(clone);
        }
        if (cartIcon) {
          cartIcon.classList.add('animate-shake');
          setTimeout(() => cartIcon.classList.remove('animate-shake'), 500);
        }
      }, 850);
    }
    
    try {
      // Make API call in parallel with animation
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({ 
          productId: product._id, 
          quantity 
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Update cart count via custom event
        window.dispatchEvent(new CustomEvent('cart-updated', { 
          detail: { count: data.count || data.cartCount }
        }));
        
        // Broadcast to other tabs
        try {
          const channel = new BroadcastChannel('cart-sync');
          channel.postMessage({ type: 'cart-changed' });
          channel.close();
        } catch (e) {
          // BroadcastChannel not supported
        }
        
        setTimeout(() => setIsAnimating(false), 900);
      } else {
        setIsAnimating(false);
        // Handle error if needed
      }
    } catch (error) {
      setIsAnimating(false);
    }
  };

  const handleBuyNow = async () => {
    // Prevent duplicate clicks
    if (isBuyingNow) return;
    
    // Check if product is available (has stock and is active)
    if (!product || product.stock <= 0 || !product.isActive) return;
    
    // Check if user is authenticated
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    setIsBuyingNow(true);

    try {
      // Add to cart with optimized request
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({
          productId: product._id,
          quantity,
          farmerId: product.farmerId
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Dispatch cart update event
        window.dispatchEvent(new CustomEvent('cart-updated', {
          detail: { count: data.count || data.cartCount }
        }));
        
        // Broadcast to other tabs
        try {
          const channel = new BroadcastChannel('cart-sync');
          channel.postMessage({ type: 'cart-changed' });
          channel.close();
        } catch (e) {
          // BroadcastChannel not supported
        }

        // Navigate to cart for checkout
        router.push('/cart');
      } else {
        const errorData = await response.json();
        
        // Show user-friendly error messages using modal
        if (errorData.code === 'INSUFFICIENT_STOCK') {
          setErrorModal({
            show: true,
            title: 'Error',
            message: errorData.message || 'Not enough stock available'
          });
        } else if (errorData.code === 'SUSPENDED') {
          setErrorModal({
            show: true,
            title: 'Account Suspended',
            message: errorData.message || 'Your account is suspended'
          });
        } else {
          console.error('Failed to add to cart:', errorData.message);
          setErrorModal({
            show: true,
            title: 'Error',
            message: 'Failed to add to cart. Please try again.'
          });
        }
        setIsBuyingNow(false);
      }
    } catch (error: any) {
      setIsBuyingNow(false);
      console.error('Error during buy now:', error);
      setErrorModal({
        show: true,
        title: 'Network Error',
        message: 'Network error. Please check your connection and try again.'
      });
    }
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
              <Link href="/my-profile" className="flex items-center space-x-1 p-2 rounded-lg hover:bg-white/10 transition-all duration-200" title="Profile">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              </Link>
              
              <Link href="/cart" data-cart-icon className="relative p-2 rounded-lg hover:bg-white/10 transition-all duration-200" id="mobile-cart-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${cartShake ? 'animate-shake' : ''}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                </svg>
                {isAuthenticated && cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center z-10 animate-pulse">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
              
              <button className="relative p-2 rounded-lg hover:bg-white/10 transition-all duration-200">
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
                {isAuthenticated && cartCount > 0 && (
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
        {/* Back Button - Mobile */}
        <button
          onClick={() => router.back()}
          className="md:hidden flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          <span className="text-sm font-medium">Back</span>
        </button>

        {/* Breadcrumb - Desktop */}
        <nav className="hidden md:block mb-6 text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
          <Link href="/home" className="text-gray-500 hover:text-gray-700">Home</Link>
          <span className="mx-2 text-gray-400">/</span>
          <Link href="/shop" className="text-gray-500 hover:text-gray-700">Shop</Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>

        {/* Admin Report Banner */}
        {isAdmin && reportInfo && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-lg p-4 md:p-6 shadow-md">
            <div className="flex flex-col md:flex-row items-start gap-3 md:gap-4">
              <div className="flex-shrink-0">
                <ShieldAlert className="w-6 h-6 md:w-8 md:h-8 text-red-600" />
              </div>
              <div className="flex-1 w-full">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
                  <h3 className="text-lg md:text-xl font-bold text-red-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Product Reported
                  </h3>
                  <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                    reportInfo.priority === 'urgent' ? 'bg-red-600 text-white' :
                    reportInfo.priority === 'high' ? 'bg-orange-600 text-white' :
                    reportInfo.priority === 'medium' ? 'bg-yellow-600 text-white' :
                    'bg-gray-600 text-white'
                  }`}>
                    {reportInfo.priority.toUpperCase()} PRIORITY
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-4">
                  <div>
                    <p className="text-xs md:text-sm font-semibold text-red-700">Reported by:</p>
                    <p className="text-sm md:text-base text-red-900 font-medium break-words">{reportInfo.reporterName}</p>
                    <p className="text-xs md:text-sm text-red-800 break-all">{reportInfo.reporterEmail}</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm font-semibold text-red-700">Reason:</p>
                    <p className="text-sm md:text-base text-red-900 font-bold">{reportInfo.reason.replace(/_/g, ' ').toUpperCase()}</p>
                  </div>
                </div>
                
                {reportInfo.description && (
                  <div className="mb-4">
                    <p className="text-xs md:text-sm font-semibold text-red-700">Details:</p>
                    <p className="text-sm md:text-base text-red-900 break-words">{reportInfo.description}</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                  {product.isActive && (
                    <Button
                      onClick={handleTakedownClick}
                      disabled={takingDown}
                      className="bg-red-600 hover:bg-red-700 text-white font-semibold w-full sm:w-auto text-sm md:text-base"
                      style={{ fontFamily: 'Poppins, sans-serif' }}
                    >
                      {takingDown ? 'Taking Down...' : 'Take Down Product'}
                    </Button>
                  )}
                  <Button
                    onClick={() => router.push('/admin')}
                    variant="outline"
                    className="border-red-600 text-red-600 hover:bg-red-50 w-full sm:w-auto text-sm md:text-base"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    Back to Reports
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Admin Takedown Button (when no report but admin viewing) */}
        {isAdmin && !reportInfo && product.isActive && (
          <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-3 md:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>Admin Controls</p>
              <p className="text-xs text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>Take action on this product listing</p>
            </div>
            <Button
              onClick={handleTakedownClick}
              disabled={takingDown}
              variant="outline"
              className="border-red-600 text-red-600 hover:bg-red-50 w-full sm:w-auto text-sm md:text-base whitespace-nowrap"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              {takingDown ? 'Taking Down...' : 'Take Down Product'}
            </Button>
          </div>
        )}

        {/* Product Inactive Notice */}
        {!product.isActive && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-bold text-yellow-900" style={{ fontFamily: 'Poppins, sans-serif' }}>Product Unavailable</p>
                <p className="text-sm text-yellow-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  This product has been deactivated and is not available for purchase.
                  {!isAdmin && ' You can submit an appeal to restore this listing.'}
                </p>
              </div>
            </div>
          </div>
        )}

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
                {images.map((img: string, idx: number) => (
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
                <ShoppingCart className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">Add to Cart</span>
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
              {product && (
                <FavoriteButton 
                  productId={product._id} 
                  showText={true}
                  size="md"
                  className="text-gray-600 hover:text-red-500"
                />
              )}
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
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 flex items-center justify-center">
                {seller.profileImage ? (
                  <Image
                    src={seller.profileImage}
                    alt={seller.name}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                    <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                    <path d="M12 10m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
                    <path d="M6.168 18.849a4 4 0 0 1 3.832 -2.849h4a4 4 0 0 1 3.834 2.855" />
                  </svg>
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
                      {seller.responseRate !== null && seller.responseRate !== undefined ? `${seller.responseRate}%` : 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Response Rate
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#40613D]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {seller.responseTime || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Response Time
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Link
                    href={`/seller/${seller.id}`}
                    className="flex-1 bg-gray-100 text-gray-900 px-6 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-center"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    Visit Store
                  </Link>
                  {isAuthenticated && (user?.role === 'user' || user?.role === 'admin') && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleChatWithSeller();
                      }}
                      disabled={startingChat}
                      className="flex items-center justify-center gap-2 bg-[#40613D] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#2d4429] transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10 cursor-pointer"
                      style={{ fontFamily: 'Poppins, sans-serif' }}
                      type="button"
                    >
                      {startingChat ? (
                        <>
                          <LoadingDots size="sm" color="#FFFFFF" />
                          <span>Opening...</span>
                        </>
                      ) : (
                        <>
                          <MessageCircle className="w-5 h-5" />
                          <span>Chat</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
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

              {/* Rating Distribution - Clickable to filter */}
              <div className="flex-1">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = product.ratingDistribution?.[rating] || 0;
                  const percentage = product.reviewCount > 0 ? (count / product.reviewCount) * 100 : 0;
                  const isActive = starFilter === rating;
                  return (
                    <button
                      key={rating}
                      onClick={() => handleStarFilter(isActive ? null : rating)}
                      className={`flex items-center gap-3 mb-2 w-full rounded-lg p-2 transition-all ${
                        isActive 
                          ? 'bg-green-50 border-2 border-green-500 shadow-sm' 
                          : 'hover:bg-gray-50 border-2 border-transparent'
                      }`}
                    >
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
                    </button>
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
            {/* Filter and Sort Controls */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-4 flex-wrap">
                {/* Star Filter Status */}
                {starFilter && (
                  <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-sm border border-green-200">
                    <span style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {starFilter} star reviews
                    </span>
                    <button
                      onClick={() => handleStarFilter(null)}
                      className="hover:text-green-900"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                
                {/* View All Button */}
                {(starFilter || reviewSort !== 'recent') && (
                  <button
                    onClick={() => {
                      setStarFilter(null);
                      setReviewSort('recent');
                      fetchReviews(1, 'recent', null);
                    }}
                    className="text-sm text-gray-600 hover:text-gray-900 underline"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    View All Reviews
                  </button>
                )}
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Sort by:
                </span>
                <select
                  value={reviewSort}
                  onChange={(e) => handleSortChange(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  <option value="recent">Most Recent</option>
                  <option value="helpful">Most Helpful</option>
                  <option value="high">Highest Rating</option>
                  <option value="low">Lowest Rating</option>
                </select>
              </div>
            </div>

            {reviewsLoading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingDots size="md" color="#40613D" />
              </div>
            ) : reviews.length > 0 ? (
              <div className="space-y-6">
              {reviews.map((review) => {
                const userId = (user as any)?._id?.toString() || (user as any)?.id?.toString();
                const reviewBuyerId = review.buyerId?.toString();
                const sellerId = seller?._id?.toString() || seller?.id?.toString();
                
                const isBuyerOwnReview = !!(userId && reviewBuyerId && userId === reviewBuyerId);
                const isSellerView = !!(userId && sellerId && userId === sellerId && !isBuyerOwnReview);
                
                return (
                  <ReviewItem 
                    key={review.id} 
                    review={review} 
                    isSellerView={isSellerView}
                    isBuyerOwnReview={isBuyerOwnReview}
                    onReplySubmitted={() => {
                      fetchReviews(reviewPage, reviewSort, starFilter);
                      fetchProductDetails();
                    }}
                  />
                );
              })}

              {/* Pagination */}
              {reviewsPagination && reviewsPagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-6">
                  <button
                    onClick={() => fetchReviews(reviewPage - 1, reviewSort, starFilter)}
                    disabled={reviewPage === 1}
                    className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Page {reviewPage} of {reviewsPagination.totalPages}
                  </span>
                  <button
                    onClick={() => fetchReviews(reviewPage + 1, reviewSort, starFilter)}
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
              {starFilter ? (
                <>
                  <p className="text-gray-500 text-lg font-medium mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    No {starFilter} star reviews found
                  </p>
                  <button
                    onClick={() => handleStarFilter(null)}
                    className="text-green-600 hover:text-green-700 underline text-sm"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    View all reviews
                  </button>
                </>
              ) : (
                <p className="text-gray-500 text-lg font-medium mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  No reviews yet
                </p>
              )}
              <p className="text-gray-400" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Be the first to review this product
              </p>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Error Modal with Blur Background */}
      {errorModal.show && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)'
          }}
          onClick={() => setErrorModal({ show: false, message: '', title: 'Error' })}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-auto overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            {/* Icon */}
            <div className="flex justify-center pt-8 pb-4">
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-red-200 flex items-center justify-center">
                  <svg 
                    className="w-10 h-10 text-red-600" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="px-6 pb-2">
              <h3 className="text-xl font-bold text-gray-900 text-center">
                {errorModal.title}
              </h3>
            </div>

            {/* Message */}
            <div className="px-6 pb-6">
              <p className="text-gray-600 text-center text-sm leading-relaxed">
                {errorModal.message}
              </p>
            </div>

            {/* Button */}
            <div className="px-6 pb-6">
              <button
                onClick={() => setErrorModal({ show: false, message: '', title: 'Error' })}
                className="w-full py-3.5 rounded-xl font-semibold text-white transition-colors duration-200"
                style={{ 
                  backgroundColor: '#40613D',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2d4429'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#40613D'}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Takedown Confirmation Dialog */}
      <Dialog open={showTakedownDialog} onOpenChange={setShowTakedownDialog}>
        <DialogContent className="sm:max-w-md" style={{ fontFamily: 'Poppins, sans-serif' }}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Confirm Product Takedown
            </DialogTitle>
            <DialogDescription className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
              This action will deactivate the product listing.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Are you sure you want to take down this product?
                  </p>
                  <ul className="text-xs text-red-800 space-y-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    <li>• Product will be unavailable to buyers</li>
                    <li>• Seller will be notified</li>
                    <li>• Seller can submit an appeal to restore it</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowTakedownDialog(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 w-full sm:w-auto"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmTakedown}
              className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              Yes, Take Down Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

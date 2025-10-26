'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageCircle, Users, Star, Calendar } from 'lucide-react';
import LoadingDots from '@/components/ui/LoadingDots';
import ProductCard from '@/components/ProductCard';
import { useAuthUserData } from '@/hooks/useAuthUserData';
import LanguageSwitcher from '@/components/LanguageSwitcher';

interface SellerProfileProps {
  sellerId: string;
}

export default function SellerProfile({ sellerId }: SellerProfileProps) {
  const router = useRouter();
  const { cartCount: initialCartCount, notificationCount } = useAuthUserData();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seller, setSeller] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('popular');
  const [cartShake, setCartShake] = useState(false);
  const [cartCount, setCartCount] = useState(initialCartCount);

  useEffect(() => {
    fetchSellerProfile();
  }, [sellerId, currentPage, sortBy]);

  // Update cart count when initial value changes
  useEffect(() => {
    setCartCount(initialCartCount);
  }, [initialCartCount]);

  // Listen for cart update events (for shake animation and count update)
  useEffect(() => {
    const handleCartUpdate = (event: any) => {
      setCartShake(true);
      setTimeout(() => setCartShake(false), 600);
      
      // Update cart count if provided in event
      if (event.detail?.count !== undefined) {
        setCartCount(event.detail.count);
      }
    };
    
    window.addEventListener('cart-updated', handleCartUpdate);
    return () => window.removeEventListener('cart-updated', handleCartUpdate);
  }, []);

  const fetchSellerProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/sellers/${sellerId}?page=${currentPage}&sort=${sortBy}&limit=20`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        setSeller(data.data.seller);
        setProducts(data.data.products.items || []);
        setPagination(data.data.products.pagination);
      } else {
        throw new Error(data.message || 'Failed to load seller profile');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load seller profile');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - d.getTime());
    const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
    
    if (diffYears > 0) return `${diffYears} Year${diffYears > 1 ? 's' : ''} Ago`;
    const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30));
    if (diffMonths > 0) return `${diffMonths} Month${diffMonths > 1 ? 's' : ''} Ago`;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} Day${diffDays !== 1 ? 's' : ''} Ago`;
  };

  if (loading && !seller) {
    return (
      <div className="min-h-screen bg-[#EFF9F0] py-12 px-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <LoadingDots size="lg" color="#40613D" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !seller) {
    return (
      <div className="min-h-screen bg-[#EFF9F0] py-12 px-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <p className="text-red-600 text-lg mb-4">{error || 'Seller not found'}</p>
            <button
              onClick={() => router.back()}
              className="text-[#40613D] hover:underline font-medium"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EFF9F0]" style={{ fontFamily: 'Poppins, sans-serif' }}>
      {/* Header - Same as Cart Page */}
      <header className="bg-[#103C2E] text-white py-3 md:py-4">
        <div className="container mx-auto px-4">
          {/* Mobile Header */}
          <div className="flex md:hidden items-center justify-between">
            <div className="flex items-center space-x-3">
              <button onClick={() => router.back()}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </button>
              <span className="text-lg font-bold">
                <span style={{ color: '#6CD75A' }}>Harvest</span>
                <span style={{ color: '#D4DB69' }}> Hub</span>
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <Link href="/my-profile" title="Profile">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              </Link>
              
              <Link href="/cart" data-cart-icon className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${cartShake ? 'animate-shake' : ''}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
              
              <button className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
                {notificationCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
              </button>
              
              <LanguageSwitcher variant="header" />
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={() => router.back()}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </button>
              <span className="text-2xl font-bold">
                <span style={{ color: '#6CD75A' }}>Harvest</span>
                <span style={{ color: '#D4DB69' }}> Hub</span>
                <span className="ml-3 text-lg">| Visit Store</span>
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <Link href="/my-profile" className="flex items-center space-x-2 hover:bg-white/10 px-3 py-2 rounded-lg transition-all" title="Profile">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
                <span className="text-sm font-medium">Profile</span>
              </Link>
              
              <Link href="/cart" data-cart-icon className="relative hover:bg-white/10 px-3 py-2 rounded-lg transition-all flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${cartShake ? 'animate-shake' : ''}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                </svg>
                <span className="text-sm font-medium">Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
              
              <button className="relative hover:bg-white/10 px-3 py-2 rounded-lg transition-all flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
                <span className="text-sm font-medium">Notifications</span>
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
              </button>
              
              <LanguageSwitcher variant="header" />
            </div>
          </div>
        </div>
      </header>

      {/* Store Header */}
      <div className="bg-gradient-to-br from-[#2d5016] to-[#40613D] text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Store Logo */}
            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-white flex-shrink-0 border-4 border-white shadow-xl">
              {seller.profileImage || seller.profilePicture ? (
                <Image
                  src={seller.profileImage || seller.profilePicture}
                  alt={seller.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-[#40613D] bg-green-100">
                  {seller.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Store Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{seller.name}</h1>
              {seller.isSuspended && (
                <span className="inline-block bg-red-600 text-white text-xs px-3 py-1 rounded-full mb-3">
                  Suspended
                </span>
              )}
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mt-4">
                <button className="flex items-center gap-2 bg-white text-[#40613D] px-6 py-2 rounded-lg hover:bg-gray-100 transition font-semibold shadow-md">
                  <Users className="w-5 h-5" />
                  Follow
                </button>
                <button className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/30 text-white px-6 py-2 rounded-lg hover:bg-white/20 transition font-semibold">
                  <MessageCircle className="w-5 h-5" />
                  Chat
                </button>
              </div>
            </div>

            {/* Store Stats Grid */}
            <div className="grid grid-cols-3 gap-4 w-full md:w-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20">
                <p className="text-sm opacity-90 mb-1">Products</p>
                <p className="text-2xl font-bold">{formatNumber(seller.totalProducts || 0)}</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20">
                <p className="text-sm opacity-90 mb-1">Followers</p>
                <p className="text-2xl font-bold">{formatNumber(seller.followers || 0)}</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-white/20">
                <p className="text-sm opacity-90 mb-1">Following</p>
                <p className="text-2xl font-bold">{seller.following || 0}</p>
              </div>
            </div>
          </div>

          {/* Store Details Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/20">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <span className="text-lg font-bold">{seller.rating?.average?.toFixed(1) || '0.0'}</span>
                <span className="text-sm opacity-75">({formatNumber(seller.rating?.total || 0)} Rating)</span>
              </div>
              <p className="text-sm opacity-90">Rating</p>
            </div>
            
            <div className="text-center">
              <p className="text-lg font-bold mb-2 text-green-300">{seller.responseRate || '100%'}</p>
              <p className="text-sm opacity-90">Chat Performance</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <Calendar className="w-5 h-5" />
                <span className="text-lg font-bold">{formatDate(seller.memberSince || seller.createdAt)}</span>
              </div>
              <p className="text-sm opacity-90">Joined</p>
            </div>
            
            <div className="text-center">
              <p className="text-lg font-bold mb-2">{seller.totalProducts || 0}</p>
              <p className="text-sm opacity-90">Total Products</p>
            </div>
          </div>
        </div>
      </div>


      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Section Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {seller.name}&apos;s Products ({seller.totalProducts || 0})
          </h2>
        </div>

        {/* Filter and Sort Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600 font-semibold">Sort by:</span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSortBy('popular');
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  sortBy === 'popular'
                    ? 'bg-[#40613D] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Popular
              </button>
              <button
                onClick={() => {
                  setSortBy('recent');
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  sortBy === 'recent'
                    ? 'bg-[#40613D] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Latest
              </button>
              <button
                onClick={() => {
                  setSortBy('low-price');
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  sortBy === 'low-price'
                    ? 'bg-[#40613D] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Price: Low to High
              </button>
              <button
                onClick={() => {
                  setSortBy('high-price');
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  sortBy === 'high-price'
                    ? 'bg-[#40613D] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Price: High to Low
              </button>
            </div>
          </div>
          {pagination && (
            <div className="text-sm text-gray-600 font-semibold">
              Page {pagination.currentPage} / {pagination.totalPages}
            </div>
          )}
        </div>

        {loading && products.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <LoadingDots size="md" color="#40613D" />
          </div>
        ) : products.length > 0 ? (
          <>
            {/* Products Grid using ProductCard */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {products.map((product) => (
                <ProductCard
                  key={product._id || product.id}
                  product={{
                    _id: product._id || product.id,
                    name: product.name,
                    category: product.category || 'General',
                    price: product.price,
                    currentPrice: product.price,
                    basePrice: product.originalPrice || product.price,
                    unit: product.unit || 'kg',
                    stock: product.stock || 0,
                    images: product.images || [product.image],
                    image: product.image || product.images?.[0],
                    imageUrl: product.image || product.images?.[0],
                    isOrganic: product.isOrganic || false,
                    isFeatured: product.featured || false,
                    rating: product.rating || 0,
                    reviews: product.reviews || 0,
                  }}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || loading}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition bg-white"
                >
                  Previous
                </button>
                
                <div className="flex gap-2">
                  {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        disabled={loading}
                        className={`w-12 h-12 rounded-lg font-bold transition ${
                          currentPage === pageNum
                            ? 'bg-[#40613D] text-white shadow-md'
                            : 'bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                  disabled={currentPage === pagination.totalPages || loading}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition bg-white"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-white rounded-lg shadow-sm">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <p className="text-gray-500 text-lg font-semibold">No products available</p>
            <p className="text-gray-400 text-sm mt-2">This seller hasn&apos;t listed any products yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}


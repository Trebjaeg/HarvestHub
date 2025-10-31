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
  const { cartCount: initialCartCount, notificationCount, isAuthenticated, user } = useAuthUserData();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seller, setSeller] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('popular');
  const [cartShake, setCartShake] = useState(false);
  const [cartCount, setCartCount] = useState(initialCartCount);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  useEffect(() => {
    fetchSellerProfile();
  }, [sellerId, currentPage, sortBy]);

  // Check follow status when seller data loads
  useEffect(() => {
    if (seller) {
      setFollowerCount(seller.followers || 0);
      checkFollowStatus();
    }
  }, [seller?.id]);

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

  const checkFollowStatus = async () => {
    if (!isAuthenticated || !user) {
      setIsFollowing(false);
      return;
    }

    try {
      const response = await fetch(`/api/users/${sellerId}/follow-status`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.isFollowing || false);
      } else if (response.status === 401) {
        setIsFollowing(false);
      }
    } catch (err) {
      console.error('Error checking follow status:', err);
      setIsFollowing(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }

    try {
      setFollowLoading(true);

      const response = await fetch(`/api/users/${sellerId}/follow`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.isFollowing);
        
        // Update follower count
        setFollowerCount(prev => data.isFollowing ? prev + 1 : Math.max(0, prev - 1));
      } else if (response.status === 401) {
        router.push('/auth/login');
      } else {
        const errorData = await response.json();
        console.error('Follow error:', errorData.message);
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
    } finally {
      setFollowLoading(false);
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
              <button 
                onClick={() => router.back()}
                className="hover:bg-white/10 p-1 rounded-lg transition-all duration-200"
                title="Go back"
              >
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
                {isAuthenticated && cartCount > 0 && (
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
                {isAuthenticated && cartCount > 0 && (
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

      {/* Store Header - Clean & Simple */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
          {/* Main Profile Section */}
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
            {/* Store Logo */}
            <div className="relative flex-shrink-0">
              <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden shadow-lg border-4 border-gray-200 bg-gray-100 flex items-center justify-center">
                {seller.profileImage || seller.profilePicture ? (
                  <Image
                    src={seller.profileImage || seller.profilePicture}
                    alt={seller.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                    <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                    <path d="M12 10m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
                    <path d="M6.168 18.849a4 4 0 0 1 3.832 -2.849h4a4 4 0 0 1 3.834 2.855" />
                  </svg>
                )}
              </div>
              {/* Verified Badge */}
              <div className="absolute -bottom-2 -right-2 bg-[#40613D] text-white rounded-full p-2 shadow-lg">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            {/* Store Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">{seller.name}</h1>
                  {seller.isSuspended && (
                    <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 text-xs font-semibold px-3 py-1.5 rounded-lg mb-3 border border-red-200">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      Suspended
                    </span>
                  )}
                  
                  {/* Stats Row */}
                  <div className="flex items-center gap-6 mt-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
                      <span className="font-semibold text-gray-900">{seller.rating?.average?.toFixed(1) || '0.0'}</span>
                      <span className="text-gray-500">({formatNumber(seller.rating?.total || 0)} Rating{(seller.rating?.total || 0) !== 1 ? 's' : ''})</span>
                    </div>
                    {(seller.responseRate !== null && seller.responseRate !== undefined) && (
                      <>
                        <div className="h-4 w-px bg-gray-300"></div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <MessageCircle className="w-4 h-4" />
                          <span className="font-medium">{Math.round(seller.responseRate)}%</span>
                          <span className="text-gray-500 hidden sm:inline">Response Rate</span>
                        </div>
                      </>
                    )}
                    {seller.responseTime && (
                      <>
                        <div className="h-4 w-px bg-gray-300"></div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">{seller.responseTime}</span>
                          <span className="text-gray-500 hidden sm:inline">Response</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Joined Date */}
                  <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {formatDate(seller.memberSince || seller.createdAt)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                    className={`flex items-center gap-2 ${
                      isFollowing 
                        ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' 
                        : 'bg-[#40613D] hover:bg-[#2d5016] text-white'
                    } px-6 py-2.5 rounded-lg font-semibold shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <Users className="w-5 h-5" />
                    {followLoading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
                  </button>
                  <button className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-6 py-2.5 rounded-lg font-semibold shadow-sm hover:shadow-md transition-all duration-200 border border-gray-300">
                    <MessageCircle className="w-5 h-5" />
                    Chat
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards - Simple & Clean */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            {/* Products Card */}
            <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-[#EFF9F0] rounded-xl flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 md:w-7 md:h-7 text-[#40613D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <p className="text-xs md:text-sm text-gray-600 mb-1 font-medium">Products</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900">
                  {formatNumber(seller.totalProducts || 0)}
                </p>
              </div>
            </div>

            {/* Followers Card */}
            <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-[#EFF9F0] rounded-xl flex items-center justify-center mb-3">
                  <Users className="w-6 h-6 md:w-7 md:h-7 text-[#40613D]" />
                </div>
                <p className="text-xs md:text-sm text-gray-600 mb-1 font-medium">Followers</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900">
                  {formatNumber(followerCount)}
                </p>
              </div>
            </div>

            {/* Following Card */}
            <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-[#EFF9F0] rounded-xl flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 md:w-7 md:h-7 text-[#40613D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-xs md:text-sm text-gray-600 mb-1 font-medium">Following</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900">
                  {seller.following || 0}
                </p>
              </div>
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 px-2 sm:px-0">
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


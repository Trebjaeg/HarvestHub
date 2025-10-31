"use client";

import Link from "next/link";
import { useState } from "react";
import I18nProvider from '../../components/I18nProvider';
import ProductCard from '../../components/ProductCard';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { useAuthUserData } from '../../hooks/useAuthUserData';
import { useDeals } from '../../hooks/useDeals';
import { usePromoBanner } from '../../hooks/usePromoBanner';
import { ChevronDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

const DealsPageContent = () => {
  const { isAuthenticated, cartCount, notificationCount } = useAuthUserData();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState([10, 1500]);
  const [selectedRating, setSelectedRating] = useState(0);
  const [priceSortBy, setPriceSortBy] = useState<'price_asc' | 'price_desc'>('price_asc');
  const [generalSortBy, setGeneralSortBy] = useState<'newest' | 'name' | 'createdAt'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Get promotional banner data
  const { banner, timeRemaining } = usePromoBanner();

  const [activeSortType, setActiveSortType] = useState<'price' | 'general'>('general');
  const activeSortBy: 'price_asc' | 'price_desc' | 'name' | 'newest' | 'createdAt' = 
    activeSortType === 'price' ? priceSortBy : generalSortBy;

  const { 
    products, 
    loading, 
    error,
    totalPages,
    totalProducts,
    setCurrentPage: setApiCurrentPage,
    setFilters,
    refetch
  } = useDeals({
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    page: currentPage,
    limit: 12,
    minPrice: priceRange[0],
    maxPrice: priceRange[1],
    sort: activeSortBy,
    rating: selectedRating > 0 ? selectedRating : undefined
  });

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setFilters({ 
      category: category === 'all' ? undefined : category,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      sort: activeSortBy,
      rating: selectedRating > 0 ? selectedRating : undefined
    });
    setCurrentPage(1);
    setApiCurrentPage(1);
  };

  const handlePriceRangeChange = (newRange: number[]) => {
    setPriceRange(newRange);
    setFilters({
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      minPrice: newRange[0],
      maxPrice: newRange[1],
      sort: activeSortBy,
      rating: selectedRating > 0 ? selectedRating : undefined
    });
    setCurrentPage(1);
    setApiCurrentPage(1);
  };

  const handleRatingChange = (rating: number) => {
    setSelectedRating(rating);
    setFilters({
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      sort: activeSortBy,
      rating: rating > 0 ? rating : undefined
    });
    setCurrentPage(1);
    setApiCurrentPage(1);
  };

  const handlePriceSortChange = (newSort: string) => {
    const validSort = newSort as 'price_asc' | 'price_desc';
    setPriceSortBy(validSort);
    setActiveSortType('price');
    setFilters({
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      sort: validSort,
      rating: selectedRating > 0 ? selectedRating : undefined
    });
    setCurrentPage(1);
    setApiCurrentPage(1);
  };

  const handleGeneralSortChange = (newSort: string) => {
    const validSort = newSort as 'newest' | 'name' | 'createdAt';
    setGeneralSortBy(validSort);
    setActiveSortType('general');
    setFilters({
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      sort: validSort,
      rating: selectedRating > 0 ? selectedRating : undefined
    });
    setCurrentPage(1);
    setApiCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setApiCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoadMore = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  return (
    <div className="min-h-screen bg-[#ECFDF5]" style={{ fontFamily: 'Poppins, sans-serif' }}>
      <header className="bg-[#103C2E] text-white py-3 md:py-4">
        <div className="container mx-auto px-4">
          <div className="flex md:hidden items-center justify-between">
            <div className="flex items-center">
              <span className="text-xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <span style={{ color: '#6CD75A' }}>Harvest</span>
                <span style={{ color: '#D4DB69' }}> Hub</span>
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <Link href="/my-profile" className="flex items-center space-x-1" title="Profile">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              </Link>
              
              <button className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                </svg>
                {isAuthenticated && cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </button>
              
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

          <div className="hidden md:flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-2xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <span style={{ color: '#6CD75A' }}>Harvest</span>
                <span style={{ color: '#D4DB69' }}> Hub</span>
              </span>
            </div>
            
            <div className="flex-1 max-w-2xl mx-6">
              <div className="relative">
                <svg className="absolute left-5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search fresh produce..."
                  className="w-full pl-14 pr-6 py-3 rounded-2xl text-gray-800 bg-white border-0 focus:outline-none focus:ring-2 focus:ring-green-400/50 placeholder-gray-500 shadow-sm"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Link href="/my-profile" className="flex items-center space-x-2 hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105" title="Profile">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
                <span className="text-white text-sm font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>Profile</span>
              </Link>
              
              <button className="relative hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105 flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a .75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                </svg>
                <span className="text-white text-sm font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>Cart</span>
                {isAuthenticated && cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </button>
              
              <button className="relative hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105 flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
                <span className="text-white text-sm font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>Notifications</span>
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

          <div className="md:hidden mt-3">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search fresh produce..."
                className="w-full pl-10 pr-4 py-2.5 rounded-full text-gray-800 bg-white border-0 focus:outline-none focus:ring-2 focus:ring-white/30 placeholder-gray-400"
              />
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-gray-100 py-3 border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          {/* Mobile Navigation */}
          <div className="md:hidden">
            <div className="flex items-center justify-center text-sm">
              <div className="flex items-center space-x-3 text-xs overflow-x-auto">
                <Link href="/home" className="py-2 whitespace-nowrap" style={{ color: '#614124' }}>Home</Link>
                <Link href="/shop" className="py-2 whitespace-nowrap" style={{ color: '#614124' }}>Shop</Link>
                <Link href="/deals" className="font-medium py-2 border-b-2 whitespace-nowrap" style={{ color: '#614124', borderColor: '#614124' }}>Deals</Link>
                <Link href="/best-seller" className="py-2 whitespace-nowrap" style={{ color: '#614124' }}>Best Seller</Link>
                <Link href="/top-farmers" className="py-2 whitespace-nowrap" style={{ color: '#614124' }}>Top Farmers</Link>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center justify-center text-sm">
            <div className="flex items-center space-x-16">
              <Link href="/home" className="py-2 hover:border-b-2 transition-all" style={{ color: '#614124' }}>Home</Link>
              <Link href="/shop" className="py-2 hover:border-b-2 transition-all" style={{ color: '#614124' }}>Shop</Link>
              <Link href="/deals" className="font-medium py-2 border-b-2" style={{ color: '#614124', borderColor: '#614124' }}>Deals</Link>
              <Link href="/best-seller" className="py-2 hover:border-b-2 transition-all" style={{ color: '#614124' }}>Best Seller</Link>
              <Link href="/top-farmers" className="py-2 hover:border-b-2 transition-all" style={{ color: '#614124' }}>Top Farmers</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Dynamic Promotional Banner */}
      {banner && timeRemaining && !timeRemaining.expired && (
        <div 
          className="relative overflow-hidden border-b border-green-200"
          style={{ 
            background: banner.backgroundColor || 'linear-gradient(135deg, #DCFCE7 0%, #F0FDF4 50%, #ECFDF5 100%)'
          }}
        >
          {/* Organic Abstract Shapes */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-4 left-8 w-32 h-32 bg-green-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
            <div className="absolute top-12 right-12 w-24 h-24 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
            <div className="absolute bottom-8 left-1/3 w-20 h-20 bg-lime-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-500"></div>
            <div className="absolute bottom-12 right-1/4 w-28 h-28 bg-green-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-700"></div>
          </div>
          
          <div className="relative px-4 md:px-12 py-8 md:py-12">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                
                {/* Left Content */}
                <div className="flex-1 text-center lg:text-left">
                  <h1 
                    className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight" 
                    style={{ 
                      fontFamily: 'Poppins, sans-serif',
                      color: banner.textColor || '#1E3A2F'
                    }}
                  >
                    {banner.title}
                  </h1>
                  <p 
                    className="text-lg md:text-xl lg:text-2xl mb-6 max-w-2xl" 
                    style={{ 
                      fontFamily: 'Poppins, sans-serif',
                      color: banner.textColor || '#15803D'
                    }}
                  >
                    {banner.subtitle}
                  </p>
                  
                  {/* Mobile Countdown Timer */}
                  <div className="lg:hidden mb-6">
                    <p className="text-sm font-medium mb-3" style={{ 
                      fontFamily: 'Poppins, sans-serif',
                      color: banner.textColor || '#15803D'
                    }}>
                      Deal ends in:
                    </p>
                    <div className="flex justify-center gap-2">
                      {[
                        { label: 'Days', value: timeRemaining.days },
                        { label: 'Hours', value: timeRemaining.hours },
                        { label: 'Min', value: timeRemaining.minutes },
                        { label: 'Sec', value: timeRemaining.seconds }
                      ].map((item) => (
                        <div key={item.label} className="text-center">
                          <div className="bg-white rounded-lg px-2 py-2 shadow-md border border-green-200 min-w-[50px]">
                            <div className="text-lg font-bold text-green-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
                              {item.value.toString().padStart(2, '0')}
                            </div>
                          </div>
                          <div className="text-xs mt-1" style={{ 
                            fontFamily: 'Poppins, sans-serif',
                            color: banner.textColor || '#15803D'
                          }}>
                            {item.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Link href={banner.buttonLink}>
                    <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-full transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {banner.buttonText}
                    </button>
                  </Link>
                </div>

                {/* Right Content - Desktop Countdown */}
                <div className="hidden lg:block">
                  <div className="text-center">
                    <p className="text-lg font-medium mb-4" style={{ 
                      fontFamily: 'Poppins, sans-serif',
                      color: banner.textColor || '#15803D'
                    }}>
                      Deal ends in:
                    </p>
                    <div className="flex gap-4">
                      {[
                        { label: 'Days', value: timeRemaining.days },
                        { label: 'Hours', value: timeRemaining.hours },
                        { label: 'Minutes', value: timeRemaining.minutes },
                        { label: 'Seconds', value: timeRemaining.seconds }
                      ].map((item) => (
                        <div key={item.label} className="text-center">
                          <div className="bg-white rounded-xl px-4 py-4 shadow-lg border border-green-200 min-w-[80px]">
                            <div className="text-2xl font-bold text-green-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
                              {item.value.toString().padStart(2, '0')}
                            </div>
                          </div>
                          <div className="text-sm mt-2" style={{ 
                            fontFamily: 'Poppins, sans-serif',
                            color: banner.textColor || '#15803D'
                          }}>
                            {item.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Deals Content */}
      <div className="px-4 md:px-12 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 flex items-center justify-between text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
                Filter Options
              </span>
              <ChevronDown className={`w-5 h-5 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Filter Sidebar */}
          <div className={`lg:block ${showFilters ? 'block' : 'hidden'} w-full lg:w-64 flex-shrink-0`}>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Filter Options
              </h2>

              {/* Category Filter */}
              <div className="mb-8">
                <h3 className="text-base font-medium text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Category
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCategory === 'all'}
                      onChange={() => handleCategoryChange('all')}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="ml-3 text-sm text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      All Deals
                    </span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCategory === 'leafy-greens'}
                      onChange={() => handleCategoryChange('leafy-greens')}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="ml-3 text-sm text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Leafy Greens
                    </span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCategory === 'root-crops'}
                      onChange={() => handleCategoryChange('root-crops')}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="ml-3 text-sm text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Root Crops
                    </span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCategory === 'fruits'}
                      onChange={() => handleCategoryChange('fruits')}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="ml-3 text-sm text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Fruits
                    </span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCategory === 'spices-aromatics'}
                      onChange={() => handleCategoryChange('spices-aromatics')}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="ml-3 text-sm text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Spices & Aromatics
                    </span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCategory === 'eggplant-gourds'}
                      onChange={() => handleCategoryChange('eggplant-gourds')}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="ml-3 text-sm text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Eggplant & Gourds
                    </span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCategory === 'grains-rice'}
                      onChange={() => handleCategoryChange('grains-rice')}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="ml-3 text-sm text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Grains & Rice
                    </span>
                  </label>
                </div>
              </div>

              {/* Price Filter */}
              <div className="mb-8">
                <h3 className="text-base font-medium text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Price
                </h3>
                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-3">
                    ₱10 — ₱1500
                  </div>
                  <div className="relative">
                    <input
                      type="range"
                      min="10"
                      max="1500"
                      value={priceRange[1]}
                      onChange={(e) => handlePriceRangeChange([priceRange[0], parseInt(e.target.value)])}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                </div>
              </div>

              {/* Customer Ratings Filter */}
              <div className="mb-6">
                <h3 className="text-base font-medium text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Customer Ratings
                </h3>
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <label key={rating} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="rating"
                        checked={selectedRating === rating}
                        onChange={() => handleRatingChange(rating)}
                        className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                      />
                      <div className="ml-3 flex items-center">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <svg 
                              key={i}
                              xmlns="http://www.w3.org/2000/svg" 
                              width="16" 
                              height="16" 
                              viewBox="0 0 24 24" 
                              fill="currentColor" 
                              className={`${i < rating ? "text-yellow-400" : "text-gray-300"} mr-1`}
                            >
                              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                              <path d="M8.243 7.34l-6.38 .925l-.113 .023a1 1 0 0 0 -.44 1.684l4.622 4.499l-1.09 6.355l-.013 .11a1 1 0 0 0 1.464 .944l5.706 -3l5.693 3l.1 .046a1 1 0 0 0 1.352 -1.1l-1.091 -6.355l4.624 -4.5l.078 -.085a1 1 0 0 0 -.633 -1.62l-6.38 -.926l-2.852 -5.78a1 1 0 0 0 -1.794 0l-2.853 5.78z" />
                            </svg>
                          ))}
                        </div>
                        <span className="ml-2 text-sm text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          & Up
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            
            {/* Header with Sort Options and Small Countdown */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="mb-4 md:mb-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 mb-2">
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Special Deals
                  </h1>
                  
                  {/* Small Countdown Timer */}
                  {timeRemaining && !timeRemaining.expired && (
                    <div className="flex items-center gap-2 mt-2 sm:mt-0">
                      <span className="text-sm text-red-600 font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Ends in:
                      </span>
                      <div className="flex gap-1">
                        {[
                          { value: timeRemaining.days, label: 'd' },
                          { value: timeRemaining.hours, label: 'h' },
                          { value: timeRemaining.minutes, label: 'm' },
                          { value: timeRemaining.seconds, label: 's' }
                        ].map((item) => (
                          <div key={item.label} className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {item.value.toString().padStart(2, '0')}{item.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-sm md:text-base text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {loading ? 'Loading...' : `${totalProducts} deals found`}
                </p>
              </div>
              
              {/* Dual Sort Dropdowns */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="hidden sm:flex items-center gap-2">
                  <label className="text-sm text-gray-600 whitespace-nowrap" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Sort by:
                  </label>
                </div>
                
                <Select value={priceSortBy} onValueChange={handlePriceSortChange}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Price: Low to High" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price_asc">Price: Low to High</SelectItem>
                    <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={generalSortBy} onValueChange={handleGeneralSortChange}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Newest Deals" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest Deals</SelectItem>
                    <SelectItem value="createdAt">Oldest</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Products Grid - Updated to match Home page responsive patterns */}
            <div className="min-h-[600px]">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
                  {[...Array(12)].map((_, idx) => (
                    <div key={idx} className="border-2 border-gray-200 rounded-2xl bg-white shadow-sm overflow-hidden animate-pulse w-full max-w-[280px] mx-auto">
                      <div className="bg-gray-200 aspect-[4/3]"></div>
                      <div className="p-4 space-y-2 h-20">
                        <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-12 px-4">
                  <div className="text-red-600 mb-4">
                    <svg className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-lg md:text-xl font-semibold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Error Loading Deals
                    </h3>
                    <p className="text-sm md:text-base text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {error}
                    </p>
                  </div>
                  <button 
                    onClick={() => refetch()}
                    className="min-h-[44px] px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm md:text-base"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    Try Again
                  </button>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="text-gray-500 mb-4">
                    <svg className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <h3 className="text-lg md:text-xl font-semibold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      No Deals Found
                    </h3>
                    <p className="text-sm md:text-base text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {selectedCategory === 'all' 
                        ? "No deals available at the moment." 
                        : `No deals found matching your filters.`
                      }
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedCategory('all');
                      setPriceRange([10, 1500]);
                      setSelectedRating(0);
                      handleCategoryChange('all');
                    }}
                    className="min-h-[44px] px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm md:text-base"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8 justify-items-center">
                    {products.map((product) => (
                      <ProductCard key={product._id} product={product} />
                    ))}
                  </div>
                  
                  {currentPage < totalPages && (
                    <div className="text-center mt-8 md:mt-12">
                      <button 
                        onClick={handleLoadMore}
                        className="min-h-[44px] bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 md:px-8 rounded-lg transition-colors text-sm md:text-base"
                        style={{ fontFamily: 'Poppins, sans-serif' }}
                      >
                        Load More
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 md:space-x-4 mt-12">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 md:px-4 py-2 text-sm md:text-base bg-gray-200 text-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">Prev</span>
                </button>
                
                <div className="flex space-x-1 md:space-x-2">
                  {[...Array(Math.min(5, totalPages))].map((_, index) => {
                    const page = index + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-2 md:px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                        style={{ fontFamily: 'Poppins, sans-serif' }}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 md:px-4 py-2 text-sm md:text-base bg-gray-200 text-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const DealsPage = () => {
  return (
    <ProtectedRoute>
      <I18nProvider>
        <DealsPageContent />
      </I18nProvider>
    </ProtectedRoute>
  );
};

export default DealsPage;
"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from 'react-i18next';
import I18nProvider from '../../components/I18nProvider';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { useAuthUserData } from '../../hooks/useAuthUserData';
import { useTopFarmers } from '../../hooks/useTopFarmers';
import { ChevronDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Star } from 'lucide-react';

const TopFarmersPageContent = () => {
  const { t } = useTranslation();
  const { isAuthenticated, cartCount, notificationCount } = useAuthUserData();
  const [selectedPerformance, setSelectedPerformance] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string[]>([]);
  const [selectedRating, setSelectedRating] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [currentSort, setCurrentSort] = useState<string>('top_rated');

  const { 
    farmers, 
    performanceFilters,
    categoryFilters,
    sorting,
    filters: filtersConfig,
    loading, 
    error,
    totalPages,
    totalFarmers,
    setCurrentPage: setApiCurrentPage,
    setFilters,
    refetch
  } = useTopFarmers({
    performance: selectedPerformance.length > 0 ? selectedPerformance.join(',') : undefined,
    category: selectedCategory.length > 0 ? selectedCategory.join(',') : undefined,
    page: currentPage,
    limit: 10,
    sort: currentSort,
    rating: selectedRating > 0 ? selectedRating : undefined
  });

  // Update currentSort when sorting configuration is loaded
  React.useEffect(() => {
    if (sorting?.current && currentSort === 'top_rated') {
      setCurrentSort(sorting.current);
    }
  }, [sorting, currentSort]);

  const handlePerformanceChange = (performance: string) => {
    let newSelection: string[];
    if (performance === 'all') {
      newSelection = [];
    } else {
      if (selectedPerformance.includes(performance)) {
        newSelection = selectedPerformance.filter(p => p !== performance);
      } else {
        newSelection = [...selectedPerformance, performance];
      }
    }
    
    setSelectedPerformance(newSelection);
    setFilters({ 
      performance: newSelection.length > 0 ? newSelection.join(',') : undefined,
      category: selectedCategory.length > 0 ? selectedCategory.join(',') : undefined,
      sort: currentSort,
      rating: selectedRating > 0 ? selectedRating : undefined
    });
    setCurrentPage(1);
    setApiCurrentPage(1);
  };

  const handleCategoryChange = (category: string) => {
    let newSelection: string[];
    if (category === 'all') {
      newSelection = [];
    } else {
      if (selectedCategory.includes(category)) {
        newSelection = selectedCategory.filter(c => c !== category);
      } else {
        newSelection = [...selectedCategory, category];
      }
    }
    
    setSelectedCategory(newSelection);
    setFilters({ 
      performance: selectedPerformance.length > 0 ? selectedPerformance.join(',') : undefined,
      category: newSelection.length > 0 ? newSelection.join(',') : undefined,
      sort: currentSort,
      rating: selectedRating > 0 ? selectedRating : undefined
    });
    setCurrentPage(1);
    setApiCurrentPage(1);
  };

  const handleRatingChange = (rating: number) => {
    setSelectedRating(rating);
    setFilters({
      performance: selectedPerformance.length > 0 ? selectedPerformance.join(',') : undefined,
      category: selectedCategory.length > 0 ? selectedCategory.join(',') : undefined,
      sort: currentSort,
      rating: rating > 0 ? rating : undefined
    });
    setCurrentPage(1);
    setApiCurrentPage(1);
  };

  const handleSortChange = (newSort: string) => {
    setCurrentSort(newSort);
    setFilters({
      performance: selectedPerformance.length > 0 ? selectedPerformance.join(',') : undefined,
      category: selectedCategory.length > 0 ? selectedCategory.join(',') : undefined,
      sort: newSort,
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

  const clearFilters = () => {
    setSelectedPerformance([]);
    setSelectedCategory([]);
    setSelectedRating(0);
    setCurrentSort(sorting?.current || 'top_rated');
    setFilters({
      performance: undefined,
      category: undefined,
      sort: sorting?.current || 'top_rated',
      rating: undefined
    });
    setCurrentPage(1);
    setApiCurrentPage(1);
  };

  // Get available rating range from configuration
  const ratingRange = filtersConfig?.ratings.enabled 
    ? Array.from({ length: filtersConfig.ratings.maxRating - filtersConfig.ratings.minRating + 1 }, 
        (_, i) => filtersConfig.ratings.maxRating - i)
    : [5, 4, 3, 2, 1];

  return (
    <div className="min-h-screen bg-[#ECFDF5]" style={{ fontFamily: 'Poppins, sans-serif' }}>
      {/* Header - Same as existing pages */}
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
                  placeholder={t('topFarmers.searchPlaceholder')}
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
                placeholder={t('topFarmers.searchPlaceholder')}
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
                <Link href="/deals" className="py-2 whitespace-nowrap" style={{ color: '#614124' }}>Deals</Link>
                <Link href="/best-seller" className="py-2 whitespace-nowrap" style={{ color: '#614124' }}>Best Seller</Link>
                <Link href="/top-farmers" className="font-medium py-2 border-b-2 whitespace-nowrap" style={{ color: '#614124', borderColor: '#614124' }}>Top Farmers</Link>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center justify-center text-sm">
            <div className="flex items-center space-x-16">
              <Link href="/home" className="py-2 hover:border-b-2 transition-all" style={{ color: '#614124' }}>Home</Link>
              <Link href="/shop" className="py-2 hover:border-b-2 transition-all" style={{ color: '#614124' }}>Shop</Link>
              <Link href="/deals" className="py-2 hover:border-b-2 transition-all" style={{ color: '#614124' }}>Deals</Link>
              <Link href="/best-seller" className="py-2 hover:border-b-2 transition-all" style={{ color: '#614124' }}>Best Seller</Link>
              <Link href="/top-farmers" className="font-medium py-2 border-b-2" style={{ color: '#614124', borderColor: '#614124' }}>Top Farmers</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Top Farmers Content */}
      <div className="px-4 md:px-12 py-6" id="farmers">
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
                {t('topFarmers.filterOptions')}
              </span>
              <ChevronDown className={`w-5 h-5 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Dynamic Filter Sidebar */}
          <div className={`lg:block ${showFilters ? 'block' : 'hidden'} w-full lg:w-64 flex-shrink-0`}>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Filter Options
              </h2>

              {/* Performance Filter */}
              <div className="mb-8">
                <h3 className="text-base font-medium text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Performance
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPerformance.includes('top-rated')}
                      onChange={() => handlePerformanceChange('top-rated')}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="ml-3 text-sm text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Top Rated
                    </span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPerformance.includes('top-sellers')}
                      onChange={() => handlePerformanceChange('top-sellers')}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="ml-3 text-sm text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Top Sellers
                    </span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPerformance.includes('most-productive')}
                      onChange={() => handlePerformanceChange('most-productive')}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="ml-3 text-sm text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Most Productive
                    </span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPerformance.includes('trending')}
                      onChange={() => handlePerformanceChange('trending')}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="ml-3 text-sm text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Trending
                    </span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPerformance.includes('most-reviewed')}
                      onChange={() => handlePerformanceChange('most-reviewed')}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="ml-3 text-sm text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Most Reviewed
                    </span>
                  </label>
                </div>
              </div>

              {/* Category Filter */}
              <div className="mb-8">
                <h3 className="text-base font-medium text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Category
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCategory.includes('leafy-greens')}
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
                      checked={selectedCategory.includes('root-crops')}
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
                      checked={selectedCategory.includes('fruits')}
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
                      checked={selectedCategory.includes('spices-aromatics')}
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
                      checked={selectedCategory.includes('eggplant-gourds')}
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
                      checked={selectedCategory.includes('grains-rice')}
                      onChange={() => handleCategoryChange('grains-rice')}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="ml-3 text-sm text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Grains & Rice
                    </span>
                  </label>
                </div>
              </div>

              {/* Rating Filter */}
              {filtersConfig?.ratings.enabled && (
                <div className="mb-6">
                  <h3 className="text-base font-medium text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Minimum Rating
                  </h3>
                  <div className="space-y-2">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="rating"
                        checked={selectedRating === 0}
                        onChange={() => handleRatingChange(0)}
                        className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                      />
                      <span className="ml-3 text-sm text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        All Ratings
                      </span>
                    </label>
                    {ratingRange.map((rating) => (
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
                            {[...Array(rating)].map((_, i) => (
                              <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            ))}
                            {[...Array(5-rating)].map((_, i) => (
                              <Star key={i} className="w-4 h-4 text-gray-300" />
                            ))}
                          </div>
                          <span className="ml-2 text-sm text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {rating}+ stars
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Clear Filters Button */}
              <button
                onClick={clearFilters}
                className="w-full px-4 py-3 text-sm font-medium text-green-700 bg-white border border-green-300 rounded-lg hover:bg-green-50 hover:border-green-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            
            {/* Header with Dynamic Sort Options */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="mb-4 md:mb-0">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {t('topFarmers.title')}
                </h1>
                <p className="text-sm md:text-base text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {loading ? t('topFarmers.loading') : `${totalFarmers} ${t('topFarmers.farmersFound')}`}
                </p>
              </div>
              
              {/* Dynamic Sort Dropdown */}
              {sorting && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="hidden sm:flex items-center gap-2">
                    <label className="text-sm text-gray-600 whitespace-nowrap" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {t('topFarmers.sortBy')}
                    </label>
                  </div>
                  
                  <Select value={sorting.current} onValueChange={handleSortChange}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent>
                      {sorting.options.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Farmers Table/Grid - Enhanced mobile responsiveness */}
            <div className="min-h-[600px]">
              {loading ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-green-600">
                        <tr>
                          <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {t('topFarmers.rank')}
                          </th>
                          <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {t('topFarmers.farmer')}
                          </th>
                          <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {t('topFarmers.category')}
                          </th>
                          <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {t('topFarmers.feedbackRating')}
                          </th>
                          <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {t('topFarmers.actions')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {[...Array(10)].map((_, index) => (
                          <tr key={index} className="animate-pulse">
                            <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                              <div className="h-4 bg-gray-200 rounded w-8"></div>
                            </td>
                            <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-3">
                                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                                <div>
                                  <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                              <div className="h-4 bg-gray-200 rounded w-20"></div>
                            </td>
                            <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                              <div className="h-4 bg-gray-200 rounded w-16"></div>
                            </td>
                            <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                              <div className="flex space-x-2">
                                <div className="h-8 bg-gray-200 rounded w-20"></div>
                                <div className="h-8 bg-gray-200 rounded w-20"></div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : error ? (
                <div className="text-center py-12 px-4">
                  <div className="text-red-600 mb-4">
                    <svg className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-lg md:text-xl font-semibold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {t('topFarmers.errorLoadingFarmers')}
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
                    {t('topFarmers.tryAgain')}
                  </button>
                </div>
              ) : farmers.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="text-gray-500 mb-4">
                    <svg className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h3 className="text-lg md:text-xl font-semibold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {t('topFarmers.noFarmersFound')}
                    </h3>
                    <p className="text-sm md:text-base text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {selectedPerformance.length === 0 && selectedCategory.length === 0
                        ? t('topFarmers.noFarmersAvailable')
                        : t('topFarmers.noFarmersFiltered')
                      }
                    </p>
                  </div>
                  <button 
                    onClick={clearFilters}
                    className="min-h-[44px] px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm md:text-base"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    {t('topFarmers.clearFilters')}
                  </button>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-green-600">
                          <tr>
                            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider" style={{ fontFamily: 'Poppins, sans-serif' }}>
                              {t('topFarmers.rank')}
                            </th>
                            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider" style={{ fontFamily: 'Poppins, sans-serif' }}>
                              {t('topFarmers.farmer')}
                            </th>
                            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider" style={{ fontFamily: 'Poppins, sans-serif' }}>
                              {t('topFarmers.category')}
                            </th>
                            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider" style={{ fontFamily: 'Poppins, sans-serif' }}>
                              {t('topFarmers.feedbackRating')}
                            </th>
                            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider" style={{ fontFamily: 'Poppins, sans-serif' }}>
                              {t('topFarmers.actions')}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {farmers.map((farmer) => (
                            <tr key={farmer._id} className="hover:bg-gray-50 transition-colors">
                              {/* Rank */}
                              <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center justify-center">
                                  <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-white text-sm ${
                                    farmer.rank === 1 ? 'bg-yellow-500' : 
                                    farmer.rank === 2 ? 'bg-gray-400' : 
                                    farmer.rank === 3 ? 'bg-amber-600' : 'bg-green-600'
                                  }`} style={{ fontFamily: 'Poppins, sans-serif' }}>
                                    {farmer.rank}
                                  </div>
                                </div>
                              </td>
                              
                              {/* Farmer Info */}
                              <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-3">
                                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                                    {farmer.profilePicture && farmer.profilePicture !== '/images/default-farmer.png' ? (
                                      <Image
                                        src={farmer.profilePicture}
                                        alt={`${farmer.firstName} ${farmer.lastName}`}
                                        fill
                                        className="object-cover"
                                        sizes="40px"
                                      />
                                    ) : (
                                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                        <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                                        <path d="M12 10m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
                                        <path d="M6.168 18.849a4 4 0 0 1 3.832 -2.849h4a4 4 0 0 1 3.834 2.855" />
                                      </svg>
                                    )}
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                      {farmer.firstName} {farmer.lastName}
                                    </div>
                                    <div className="text-sm text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                      {farmer.productCount} {t('topFarmers.products')}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              
                              {/* Category */}
                              <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                  {farmer.categories.length > 0 ? farmer.categories.join(', ') : t('topFarmers.various')}
                                </div>
                              </td>
                              
                              {/* Rating & Reviews */}
                              <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-2">
                                  <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                      <svg 
                                        key={i}
                                        xmlns="http://www.w3.org/2000/svg" 
                                        width="16" 
                                        height="16" 
                                        viewBox="0 0 24 24" 
                                        fill="currentColor" 
                                        className={i < Math.floor(farmer.averageRating) ? "text-yellow-400" : "text-gray-300"}
                                      >
                                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                        <path d="M8.243 7.34l-6.38 .925l-.113 .023a1 1 0 0 0 -.44 1.684l4.622 4.499l-1.09 6.355l-.013 .11a1 1 0 0 0 1.464 .944l5.706 -3l5.693 3l.1 .046a1 1 0 0 0 1.352 -1.1l-1.091 -6.355l4.624 -4.5l.078 -.085a1 1 0 0 0 -.633 -1.62l-6.38 -.926l-2.852 -5.78a1 1 0 0 0 -1.794 0l-2.853 5.78z" />
                                      </svg>
                                    ))}
                                  </div>
                                  <div className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                    {farmer.averageRating.toFixed(1)} ({farmer.reviewCount} {t('topFarmers.reviews')})
                                  </div>
                                </div>
                              </td>
                              
                              {/* Actions - Enhanced touch targets */}
                              <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                <div className="flex space-x-2">
                                  <Link href={`/seller/${farmer._id}`}>
                                    <button className="inline-flex items-center min-h-[44px] px-3 py-2 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                      </svg>
                                      {t('topFarmers.viewShop')}
                                    </button>
                                  </Link>
                                  <button 
                                    onClick={() => alert('Messaging feature coming soon! For now, you can contact the seller through their shop page.')}
                                    className="inline-flex items-center min-h-[44px] px-3 py-2 border border-green-600 text-xs font-medium rounded-md text-green-600 bg-white hover:bg-green-50 transition-colors" 
                                    style={{ fontFamily: 'Poppins, sans-serif' }}
                                  >
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    {t('topFarmers.message')}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile Card View - Enhanced responsive design */}
                  <div className="md:hidden grid grid-cols-1 gap-4">
                    {farmers.map((farmer) => (
                      <div key={farmer._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start space-x-4">
                          <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-white text-sm flex-shrink-0 ${
                            farmer.rank === 1 ? 'bg-yellow-500' : 
                            farmer.rank === 2 ? 'bg-gray-400' : 
                            farmer.rank === 3 ? 'bg-amber-600' : 'bg-green-600'
                          }`} style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {farmer.rank}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="relative w-12 h-12 flex-shrink-0">
                                <Image
                                  src={farmer.profilePicture}
                                  alt={`${farmer.firstName} ${farmer.lastName}`}
                                  fill
                                  className="rounded-full object-cover"
                                  sizes="48px"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/images/default-farmer.png';
                                  }}
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-base font-medium text-gray-900 truncate" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                  {farmer.firstName} {farmer.lastName}
                                </div>
                                <div className="text-sm text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                  {farmer.productCount} {t('topFarmers.products')}
                                </div>
                              </div>
                            </div>
                            
                            <div className="mb-3">
                              <div className="text-sm text-gray-600 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                <span className="font-medium">{t('topFarmers.category')}:</span> {farmer.categories.length > 0 ? farmer.categories.join(', ') : t('topFarmers.various')}
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="flex items-center">
                                  {[...Array(5)].map((_, i) => (
                                    <svg 
                                      key={i}
                                      xmlns="http://www.w3.org/2000/svg" 
                                      width="16" 
                                      height="16" 
                                      viewBox="0 0 24 24" 
                                      fill="currentColor" 
                                      className={i < Math.floor(farmer.averageRating) ? "text-yellow-400" : "text-gray-300"}
                                    >
                                      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                      <path d="M8.243 7.34l-6.38 .925l-.113 .023a1 1 0 0 0 -.44 1.684l4.622 4.499l-1.09 6.355l-.013 .11a1 1 0 0 0 1.464 .944l5.706 -3l5.693 3l.1 .046a1 1 0 0 0 1.352 -1.1l-1.091 -6.355l4.624 -4.5l.078 -.085a1 1 0 0 0 -.633 -1.62l-6.38 -.926l-2.852 -5.78a1 1 0 0 0 -1.794 0l-2.853 5.78z" />
                                    </svg>
                                  ))}
                                </div>
                                <div className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                  {farmer.averageRating.toFixed(1)} ({farmer.reviewCount} {t('topFarmers.reviews')})
                                </div>
                              </div>
                            </div>
                            
                            {/* Mobile action buttons with proper touch targets */}
                            <div className="flex flex-col sm:flex-row gap-2">
                              <Link href={`/seller/${farmer._id}`} className="flex-1">
                                <button className="w-full inline-flex items-center justify-center min-h-[44px] px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                  </svg>
                                  {t('topFarmers.viewShop')}
                                </button>
                              </Link>
                              <button 
                                onClick={() => alert('Messaging feature coming soon! For now, you can contact the seller through their shop page.')}
                                className="flex-1 inline-flex items-center justify-center min-h-[44px] px-4 py-3 border border-green-600 text-sm font-medium rounded-md text-green-600 bg-white hover:bg-green-50 transition-colors" 
                                style={{ fontFamily: 'Poppins, sans-serif' }}
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                {t('topFarmers.message')}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 md:space-x-4 mt-12">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 md:px-4 py-2 text-sm md:text-base bg-gray-200 text-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  <span className="hidden sm:inline">{t('topFarmers.previous')}</span>
                  <span className="sm:hidden">{t('topFarmers.prev')}</span>
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
                  {t('topFarmers.next')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const TopFarmersPage = () => {
  return (
    <ProtectedRoute>
      <I18nProvider>
        <TopFarmersPageContent />
      </I18nProvider>
    </ProtectedRoute>
  );
};

export default TopFarmersPage;
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import I18nProvider from '../../components/I18nProvider';
import ProductCard from '../../components/ProductCard';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { useAuthUserData } from '../../hooks/useAuthUserData';
import { useProducts } from '../../hooks/useProducts';
import { IProduct } from '../../types/product';
import { ChevronDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

const ShopPageContent = () => {
  const { t } = useTranslation();
  const { isAuthenticated, cartCount, notificationCount } = useAuthUserData();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState([10, 1500]);
  const [selectedRating, setSelectedRating] = useState(0);
  const [priceSortBy, setPriceSortBy] = useState<'price_asc' | 'price_desc'>('price_asc');
  const [generalSortBy, setGeneralSortBy] = useState<'newest' | 'name' | 'createdAt'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const [activeSortType, setActiveSortType] = useState<'price' | 'general'>('general');
  const activeSortBy: 'price_asc' | 'price_desc' | 'name' | 'newest' | 'createdAt' = 
    activeSortType === 'price' ? priceSortBy : generalSortBy;

  const { 
    products, 
    loading, 
    error,
    totalPages,
    currentPage: apiCurrentPage,
    setCurrentPage: setApiCurrentPage,
    setFilters,
    refetch
  } = useProducts({
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    page: currentPage,
    limit: 12,
    minPrice: priceRange[0],
    maxPrice: priceRange[1],
    sort: activeSortBy
  });

  const categories = [
    { id: 'all', name: 'All', count: 156 },
    { id: 'leafy-greens', name: 'Leafy Greens', count: 45 },
    { id: 'root-crops', name: 'Root Crops', count: 32 },
    { id: 'fruits', name: 'Fruits', count: 28 },
    { id: 'spices-aromatics', name: 'Spices & Aromatics', count: 24 },
    { id: 'eggplant-gourds', name: 'Eggplant & Gourds', count: 18 },
    { id: 'grains-rice', name: 'Grains & Rice', count: 9 }
  ];

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setFilters({ 
      category: category === 'all' ? undefined : category,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      sort: activeSortBy
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
      sort: activeSortBy
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
      sort: validSort
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
      sort: validSort
    });
    setCurrentPage(1);
    setApiCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setApiCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
              <Link href="/my-profile" className="flex items-center space-x-1 hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105" title="Profile">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              </Link>
              
              <button className="relative hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                </svg>
                {isAuthenticated && cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </button>
              
              <button className="relative hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
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
                <Link href="/shop" className="font-medium py-2 border-b-2 whitespace-nowrap" style={{ color: '#614124', borderColor: '#614124' }}>Shop</Link>
                <Link href="/deals" className="py-2 whitespace-nowrap" style={{ color: '#614124' }}>Deals</Link>
                <Link href="/new-arrivals" className="py-2 whitespace-nowrap" style={{ color: '#614124' }}>New Arrivals</Link>
                <Link href="/best-seller" className="py-2 whitespace-nowrap" style={{ color: '#614124' }}>Best Seller</Link>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center justify-center text-sm">
            <div className="flex items-center space-x-16">
              <Link href="/home" className="py-2 hover:border-b-2 transition-all" style={{ color: '#614124' }}>Home</Link>
              <Link href="/shop" className="font-medium py-2 border-b-2" style={{ color: '#614124', borderColor: '#614124' }}>Shop</Link>
              <Link href="/deals" className="py-2 hover:border-b-2 transition-all" style={{ color: '#614124' }}>Deals</Link>
              <Link href="/new-arrivals" className="py-2 hover:border-b-2 transition-all" style={{ color: '#614124' }}>New Arrivals</Link>
              <Link href="/best-seller" className="py-2 hover:border-b-2 transition-all" style={{ color: '#614124' }}>Best Seller</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Shop Content */}
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

              <div className="mb-8">
                <h3 className="text-base font-medium text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Category
                </h3>
                <div className="space-y-3">
                  {categories.map((category) => (
                    <label key={category.id} className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCategory === category.id}
                        onChange={() => handleCategoryChange(category.id)}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="ml-3 text-sm text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {category.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-base font-medium text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Price
                </h3>
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>₱{priceRange[0]}</span>
                    <span>₱{priceRange[1]}</span>
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
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>₱10</span>
                      <span>₱1500</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Ratings Filter */}
              <div className="mb-6">
                <h3 className="text-base font-medium text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Customer Ratings
                </h3>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <label key={rating} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="rating"
                        checked={selectedRating === rating}
                        onChange={() => setSelectedRating(rating)}
                        className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                      />
                      <div className="ml-3 flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="w-4 h-4 mr-1">
                            {i < rating ? (
                              // Filled/Shaded Star
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                width="16" 
                                height="16" 
                                viewBox="0 0 24 24" 
                                fill="currentColor" 
                                className="text-yellow-400"
                              >
                                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                <path d="M8.243 7.34l-6.38 .925l-.113 .023a1 1 0 0 0 -.44 1.684l4.622 4.499l-1.09 6.355l-.013 .11a1 1 0 0 0 1.464 .944l5.706 -3l5.693 3l.1 .046a1 1 0 0 0 1.352 -1.1l-1.091 -6.355l4.624 -4.5l.078 -.085a1 1 0 0 0 -.633 -1.62l-6.38 -.926l-2.852 -5.78a1 1 0 0 0 -1.794 0l-2.853 5.78z" />
                              </svg>
                            ) : (
                              // Outline/Not Shaded Star
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                width="16" 
                                height="16" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                className="text-gray-300"
                              >
                                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                <path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z" />
                              </svg>
                            )}
                          </div>
                        ))}
                        <span className="ml-2 text-sm text-gray-600">& Up</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            
            {/* Header with Sort Options */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="mb-4 md:mb-0">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  All Fresh Produce
                </h1>
                <p className="text-sm md:text-base text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {loading ? 'Loading...' : `${products.length} products found`}
                </p>
              </div>
              
              {/* Dual Sort Dropdowns */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="hidden sm:flex items-center gap-2">
                  <label className="text-sm text-gray-600 whitespace-nowrap" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Sort by:
                  </label>
                </div>
                
                {/* Price Sort Dropdown using Radix UI */}
                <Select value={priceSortBy} onValueChange={handlePriceSortChange}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Price sorting" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price_asc">Price: Low to High</SelectItem>
                    <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>

                {/* General Sort Dropdown using Radix UI */}
                <Select value={generalSortBy} onValueChange={handleGeneralSortChange}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="General sorting" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="createdAt">Oldest</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Products Grid */}
            <div className="min-h-[600px]">
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4 justify-items-center">
                  {[...Array(12)].map((_, index) => (
                    <div key={index} className="border-2 border-gray-200 rounded-3xl bg-white shadow-sm overflow-hidden animate-pulse" style={{ width: '218px', height: '275px' }}>
                      <div className="bg-gray-200" style={{ height: '186px' }}></div>
                      <div className="p-4 space-y-2 bg-[#F5ECDE]" style={{ height: '89px' }}>
                        <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <div className="text-red-600 mb-4">
                    <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Error Loading Products
                    </h3>
                    <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {error}
                    </p>
                  </div>
                  <button 
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    Try Again
                  </button>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-500 mb-4">
                    <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8V9a4 4 0 11-8 0V5" />
                    </svg>
                    <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      No Products Found
                    </h3>
                    <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {selectedCategory === 'all' 
                        ? "No products available at the moment." 
                        : `No products found matching your filters.`
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
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4 justify-items-center">
                    {products.map((product) => (
                      <ProductCard key={product._id} product={product} />
                    ))}
                  </div>
                  
                  <div className="text-center mt-12">
                    <button className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-8 rounded-lg transition-colors" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Load More
                    </button>
                  </div>
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

const ShopPage = () => {
  return (
    <ProtectedRoute>
      <I18nProvider>
        <ShopPageContent />
      </I18nProvider>
    </ProtectedRoute>
  );
};

export default ShopPage;
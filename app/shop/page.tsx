"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import I18nProvider from '../../components/I18nProvider';
import ProductCard from '../../components/ProductCard';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { useAuthUserData } from '../../hooks/useAuthUserData';
import { useProducts } from '../../hooks/useProducts';
import { ChevronDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import NotificationsPanel from '../../components/NotificationsPanel';
import { useNotificationSocket } from '../../hooks/useNotificationSocket';
import { useNotificationShake } from '../../hooks/useNotificationShake';

const ShopPageContent = () => {
  const { isAuthenticated, cartCount: initialCartCount, notificationCount } = useAuthUserData();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState([10, 1500]);
  const [selectedRating, setSelectedRating] = useState(0);
  const [priceSortBy, setPriceSortBy] = useState<'price_asc' | 'price_desc'>('price_asc');
  const [generalSortBy, setGeneralSortBy] = useState<'newest' | 'name' | 'createdAt'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<Array<{type: 'product' | 'seller', name: string, id?: string}>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  const mobileNotificationButtonRef = useRef<HTMLButtonElement>(null);
  const [cartShake, setCartShake] = useState(false);
  const [cartCount, setCartCount] = useState(initialCartCount);
  const [notificationsPanelOpen, setNotificationsPanelOpen] = useState(false);
  const { unreadCount, setUnreadCount } = useNotificationSocket();
  const { shouldShake: notificationShake } = useNotificationShake();
  
  // Debounce timer for search suggestions
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [activeSortType, setActiveSortType] = useState<'price' | 'general'>('general');
  const activeSortBy: 'price_asc' | 'price_desc' | 'name' | 'newest' | 'createdAt' = 
    activeSortType === 'price' ? priceSortBy : generalSortBy;

  const { 
    products, 
    loading, 
    error,
    totalPages,
    setCurrentPage: setApiCurrentPage,
    setFilters
  } = useProducts({
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    page: currentPage,
    limit: 12,
    minPrice: priceRange[0],
    maxPrice: priceRange[1],
    sort: activeSortBy,
    search: searchQuery
  });

  // Filter products by rating on the client side (since API doesn't support it yet)
  const filteredProducts = selectedRating > 0 
    ? products.filter(p => ((p as any).rating || 0) >= selectedRating)
    : products;

  const categories = [
    { id: 'all', name: 'All Products' },
    { id: 'Leafy Greens', name: 'Leafy Greens' },
    { id: 'Root Crops', name: 'Root Crops' },
    { id: 'Fruits', name: 'Fruits' },
    { id: 'Spices & Aromatics', name: 'Spices & Aromatics' },
    { id: 'Eggplant & Gourds', name: 'Eggplant & Gourds' },
    { id: 'Grains & Rice', name: 'Grains & Rice' }
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
      sort: validSort,
      search: searchQuery
    });
    setCurrentPage(1);
    setApiCurrentPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setFilters({
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      sort: activeSortBy,
      search: searchInput
    });
    setCurrentPage(1);
    setApiCurrentPage(1);
  };

  const handleSearchInputChange = (value: string) => {
    setSearchInput(value);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Show suggestions when typing (debounced)
    if (value.trim().length > 1) {
      // Debounce the API call by 500ms
      searchTimeoutRef.current = setTimeout(() => {
        fetchSearchSuggestions(value);
        setShowSuggestions(true);
      }, 500);
    } else {
      setShowSuggestions(false);
      setSearchSuggestions([]);
    }
    
    // Auto-search when input is cleared
    if (value === '') {
      setSearchQuery('');
      setFilters({
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        minPrice: priceRange[0],
        maxPrice: priceRange[1],
        sort: activeSortBy,
        search: ''
      });
    }
  };

  const fetchSearchSuggestions = async (query: string) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const response = await fetch(`/api/products/suggestions?q=${encodeURIComponent(query)}`, {
        signal: controller.signal,
        cache: 'no-store'
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        setSearchSuggestions(data.suggestions || []);
      }
    } catch (err) {
      // Silently handle all errors including timeout
      console.warn('Search suggestions failed:', err);
      setSearchSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion: {type: 'product' | 'seller', name: string}) => {
    setSearchInput(suggestion.name);
    setSearchQuery(suggestion.name);
    setShowSuggestions(false);
    setFilters({
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      sort: activeSortBy,
      search: suggestion.name
    });
    setCurrentPage(1);
    setApiCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setApiCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Update cart count when initial value changes
  useEffect(() => {
    setCartCount(initialCartCount);
  }, [initialCartCount]);

  // Listen for cart update events
  useEffect(() => {
    const handleCartUpdate = (event: CustomEvent<{count?: number}>) => {
      setCartShake(true);
      setTimeout(() => setCartShake(false), 600);
      
      if (event.detail?.count !== undefined) {
        setCartCount(event.detail.count);
      }
    };
    
    window.addEventListener('cart-updated', handleCartUpdate as EventListener);
    
    // Cleanup debounce timer on unmount
    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate as EventListener);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#ECFDF5]" style={{ fontFamily: 'Poppins, sans-serif' }}>
      <header className="bg-[#103C2E] text-white py-3 md:py-4 relative z-40">
        <div className="container mx-auto px-4">
          <div className="flex md:hidden items-center justify-between">
            <div className="flex items-center">
              <span className="text-xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <span style={{ color: '#6CD75A' }}>Harvest</span>
                <span style={{ color: '#D4DB69' }}> Hub</span>
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <Link href="/my-profile" className="flex items-center space-x-1 p-2 rounded-lg hover:bg-white/10 transition-all duration-200" title="Profile">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              </Link>
              
              <Link href="/cart" data-cart-icon className="relative p-2 rounded-lg hover:bg-white/10 transition-all duration-200" title="Cart">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${cartShake ? 'animate-shake' : ''}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                </svg>
                {isAuthenticated && cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
              
              <div className="relative">
                <button 
                  ref={mobileNotificationButtonRef}
                  onClick={() => setNotificationsPanelOpen(!notificationsPanelOpen)}
                  className="relative p-2 rounded-lg hover:bg-white/10 transition-all duration-200" 
                  title="Notifications"
                  aria-label={`Notifications${isAuthenticated && unreadCount > 0 ? ` (${unreadCount > 99 ? '99+' : unreadCount} unread)` : ''}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${notificationShake ? 'animate-shake' : ''}`}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                  </svg>
                  {isAuthenticated && unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
              </div>
              
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
              <form onSubmit={handleSearch} className="relative">
                <svg className="absolute left-5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search fresh produce or sellers..."
                  value={searchInput}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                  onFocus={() => searchInput.length > 1 && searchSuggestions.length > 0 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="w-full pl-14 pr-6 py-3 rounded-2xl text-gray-800 bg-white border-0 focus:outline-none focus:ring-2 focus:ring-green-400/50 placeholder-gray-500 shadow-sm"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                />
              </form>
            </div>
            
            <div className="flex items-center space-x-3">
              <Link href="/my-profile" className="flex items-center space-x-2 hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105" title="Profile">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
                <span className="text-white text-sm font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>Profile</span>
              </Link>
              
              <Link href="/cart" data-cart-icon className="relative hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105 flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${cartShake ? 'animate-shake' : ''}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                </svg>
                <span className="text-white text-sm font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>Cart</span>
                {isAuthenticated && cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
              
              <div className="relative">
                <button 
                  ref={notificationButtonRef}
                  onClick={() => setNotificationsPanelOpen(!notificationsPanelOpen)}
                  className="relative hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105 flex items-center space-x-2"
                  aria-label={`Notifications${isAuthenticated && unreadCount > 0 ? ` (${unreadCount > 99 ? '99+' : unreadCount} unread)` : ''}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${notificationShake ? 'animate-shake' : ''}`}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                  </svg>
                  <span className="text-white text-sm font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>Notifications</span>
                  {isAuthenticated && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
              </div>
              
              <div className="relative">
                <LanguageSwitcher variant="header" />
              </div>
            </div>
          </div>

          <div className="md:hidden mt-3">
            <form onSubmit={handleSearch} className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={mobileSearchInputRef}
                type="text"
                placeholder="Search products or sellers..."
                value={searchInput}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                onFocus={() => searchInput.length > 1 && searchSuggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="w-full pl-10 pr-4 py-2.5 rounded-full text-gray-800 bg-white border-0 focus:outline-none focus:ring-2 focus:ring-white/30 placeholder-gray-400"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              />
            </form>
          </div>
        </div>
      </header>

      {/* Desktop Search Suggestions Dropdown - Fixed positioning */}
      {showSuggestions && searchSuggestions.length > 0 && searchInput.trim().length > 1 && searchInputRef.current && (
        <div 
          className="hidden md:block fixed bg-white rounded-xl shadow-2xl border border-gray-200 max-h-80 overflow-y-auto z-[9999]"
          style={{
            top: `${searchInputRef.current.getBoundingClientRect().bottom + 8}px`,
            left: `${searchInputRef.current.getBoundingClientRect().left}px`,
            width: `${searchInputRef.current.getBoundingClientRect().width}px`
          }}
        >
          {searchSuggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-5 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-0 transition-colors"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              {suggestion.type === 'product' ? (
                <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{suggestion.name}</div>
                <div className="text-xs text-gray-500">
                  {suggestion.type === 'product' ? 'Product' : 'Seller'}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Mobile Search Suggestions Dropdown - Fixed positioning */}
      {showSuggestions && searchSuggestions.length > 0 && searchInput.trim().length > 1 && mobileSearchInputRef.current && (
        <div 
          className="md:hidden fixed bg-white rounded-lg shadow-2xl border border-gray-200 max-h-60 overflow-y-auto z-[9999]"
          style={{
            top: `${mobileSearchInputRef.current.getBoundingClientRect().bottom + 8}px`,
            left: `${mobileSearchInputRef.current.getBoundingClientRect().left}px`,
            width: `${mobileSearchInputRef.current.getBoundingClientRect().width}px`
          }}
        >
          {searchSuggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100 last:border-0"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              {suggestion.type === 'product' ? (
                <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{suggestion.name}</div>
                <div className="text-xs text-gray-500">{suggestion.type === 'product' ? 'Product' : 'Seller'}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Notifications Panel - Works for both Desktop & Mobile */}
      {notificationsPanelOpen && (notificationButtonRef.current || mobileNotificationButtonRef.current) && (
        <NotificationsPanel 
          isOpen={notificationsPanelOpen}
          onClose={() => setNotificationsPanelOpen(false)}
          onUnreadCountChange={setUnreadCount}
          buttonRef={(notificationButtonRef.current ? notificationButtonRef : mobileNotificationButtonRef) as React.RefObject<HTMLButtonElement>}
        />
      )}

      <nav className="bg-gray-100 py-3 border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          {/* Mobile Navigation */}
          <div className="md:hidden">
            <div className="flex items-center justify-center text-sm">
              <div className="flex items-center space-x-3 text-xs overflow-x-auto">
                <Link href="/" className="py-2 whitespace-nowrap" style={{ color: '#614124' }}>Home</Link>
                <Link href="/shop" className="font-medium py-2 border-b-2 whitespace-nowrap" style={{ color: '#614124', borderColor: '#614124' }}>Shop</Link>
                <Link href="/deals" className="py-2 whitespace-nowrap" style={{ color: '#614124' }}>Deals</Link>
                <Link href="/best-seller" className="py-2 whitespace-nowrap" style={{ color: '#614124' }}>Best Seller</Link>
                <Link href="/top-farmers" className="py-2 whitespace-nowrap" style={{ color: '#614124' }}>Top Farmers</Link>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center justify-center text-sm">
            <div className="flex items-center space-x-16">
              <Link href="/" className="py-2 hover:border-b-2 transition-all" style={{ color: '#614124' }}>Home</Link>
              <Link href="/shop" className="font-medium py-2 border-b-2" style={{ color: '#614124', borderColor: '#614124' }}>Shop</Link>
              <Link href="/deals" className="py-2 hover:border-b-2 transition-all" style={{ color: '#614124' }}>Deals</Link>
              <Link href="/best-seller" className="py-2 hover:border-b-2 transition-all" style={{ color: '#614124' }}>Best Seller</Link>
              <Link href="/top-farmers" className="py-2 hover:border-b-2 transition-all" style={{ color: '#614124' }}>Top Farmers</Link>
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
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                  <path d="M14 6m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
                  <path d="M4 6l8 0" />
                  <path d="M16 6l4 0" />
                  <path d="M8 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
                  <path d="M4 12l2 0" />
                  <path d="M10 12l10 0" />
                  <path d="M17 18m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
                  <path d="M4 18l11 0" />
                  <path d="M19 18l1 0" />
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
                    <label key={category.id} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors">
                      <input
                        type="radio"
                        name="category"
                        checked={selectedCategory === category.id}
                        onChange={() => handleCategoryChange(category.id)}
                        className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
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
                  Price Range
                </h3>
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                    <span className="font-medium">₱{priceRange[0]}</span>
                    <span className="text-gray-400">-</span>
                    <span className="font-medium">₱{priceRange[1]}</span>
                  </div>
                  
                  {/* Min Price Slider */}
                  <div className="mb-3">
                    <label className="text-xs text-gray-500 mb-1 block">Minimum Price</label>
                    <input
                      type="range"
                      min="10"
                      max={priceRange[1] - 10}
                      value={priceRange[0]}
                      onChange={(e) => handlePriceRangeChange([parseInt(e.target.value), priceRange[1]])}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                    />
                  </div>
                  
                  {/* Max Price Slider */}
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Maximum Price</label>
                    <input
                      type="range"
                      min={priceRange[0] + 10}
                      max="1500"
                      value={priceRange[1]}
                      onChange={(e) => handlePriceRangeChange([priceRange[0], parseInt(e.target.value)])}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                    />
                  </div>
                  
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>₱10</span>
                    <span>₱1500</span>
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
                                <path d="M8.243 7.34l-6.38 .925l-.113 .023a1 1 0 0 0 -.44 1.684l4.622 4.499l-1.09 6.355l-.013 .10a1 1 0 0 0 1.464 .944l5.706 -3l5.693 3l.1 .046a1 1 0 0 0 1.352 -1.1l-1.091 -6.355l4.624 -4.5l.078 -.085a1 1 0 0 0 -.633 -1.62l-6.38 -.926l-2.852 -5.78a1 1 0 0 0 -1.794 0l-2.853 5.78z" />
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
              
              {/* Clear All Filters Button */}
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setPriceRange([10, 1500]);
                  setSelectedRating(0);
                  setSearchQuery('');
                  setSearchInput('');
                  setFilters({
                    category: undefined,
                    minPrice: 10,
                    maxPrice: 1500,
                    sort: activeSortBy,
                    search: ''
                  });
                  setCurrentPage(1);
                  setApiCurrentPage(1);
                }}
                className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
                Clear All Filters
              </button>
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
                  {loading ? 'Loading...' : `${filteredProducts.length} products found`}
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 lg:gap-10 justify-items-center">
                  {[...Array(12)].map((_, index) => (
                    <div key={index} className="w-full max-w-[218px] border-2 border-gray-200 rounded-2xl bg-white shadow-sm overflow-hidden animate-pulse" style={{ height: '275px' }}>
                      <div className="bg-gray-200" style={{ height: '186px' }}></div>
                      <div className="p-4 space-y-2" style={{ height: '89px' }}>
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
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-500 mb-4">
                    <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8V9a4 4 0 11-8 0V5" />
                    </svg>
                    <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      No Products Found
                    </h3>
                    <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {selectedCategory === 'all' && selectedRating === 0 && priceRange[0] === 10 && priceRange[1] === 1500
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
                      setSearchQuery('');
                      setSearchInput('');
                      setFilters({
                        category: undefined,
                        minPrice: 10,
                        maxPrice: 1500,
                        sort: activeSortBy,
                        search: ''
                      });
                      setCurrentPage(1);
                      setApiCurrentPage(1);
                    }}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 lg:gap-10 justify-items-center">
                    {filteredProducts.map((product) => (
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
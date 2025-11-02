"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Heart, BarChart3, RefreshCw, Search, ShoppingCart, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import FavoritesAnalytics from '@/components/FavoritesAnalytics';
import LoadingDots from '@/components/ui/LoadingDots';
import Image from 'next/image';

// Custom Filter Icon
const Filter = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
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
);

interface ProductDetails {
  _id: string;
  name: string;
  price: number;
  imageUrl: string;
  description: string;
  category: string;
  availability: string;
  weight: string;
  location: string;
  farmerName: string;
}

interface Favorite {
  _id: string;
  buyerId: string;
  productId: string;
  productName: string;
  productPrice: number;
  productImage?: string;
  productCategory: string;
  sellerId: string;
  sellerName: string;
  isActive: boolean;
  dateAdded: string;
  productDetails: ProductDetails | null;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Filter and sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('dateAdded');
  const [sortOrder, setSortOrder] = useState('desc');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Categories for filtering
  const categories = ['Vegetables', 'Fruits', 'Grains', 'Herbs', 'Dairy', 'Meat'];

  const fetchFavorites = useCallback(async (page: number = 1) => {
    try {
      setError(null);
      if (page === 1) setLoading(true);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder
      });

      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);

      const response = await fetch(`/api/favorites?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch favorites');
      }

      const result = await response.json();
      
      if (result.success) {
        setFavorites(result.data.favorites);
        setPagination(result.data.pagination);
        setCurrentPage(result.data.pagination.currentPage);
      } else {
        throw new Error(result.error || 'Failed to fetch favorites');
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setError('Failed to load favorites. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [pagination.limit, sortBy, sortOrder, searchTerm, selectedCategory, minPrice, maxPrice]);

  const removeFavorite = async (productId: string) => {
    try {
      const response = await fetch(`/api/favorites/${productId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to remove favorite');
      }

      const result = await response.json();
      
      if (result.success) {
        // Refresh the favorites list
        await fetchFavorites(currentPage);
      } else {
        throw new Error(result.error || 'Failed to remove favorite');
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      alert('Failed to remove from favorites. Please try again.');
    }
  };

  const addToCart = async (productId: string) => {
    try {
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({ productId, quantity: 1 })
      });

      if (!response.ok) {
        throw new Error('Failed to add to cart');
      }

      const result = await response.json();
      
      if (result.success) {
        alert('Product added to cart successfully!');
        
        // Broadcast cart change to other tabs
        try {
          const channel = new BroadcastChannel('cart-sync');
          channel.postMessage({ type: 'cart-changed' });
          channel.close();
        } catch (e) {
          // BroadcastChannel not supported, skip
        }
        
        // Dispatch custom event for cart update
        window.dispatchEvent(new CustomEvent('cart-updated', { 
          detail: { count: result.count } 
        }));
      } else {
        throw new Error(result.error || 'Failed to add to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add to cart. Please try again.');
    }
  };

  const refreshFavorites = async () => {
    setRefreshing(true);
    await fetchFavorites(currentPage);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchFavorites(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('dateAdded');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    fetchFavorites(page);
  };

  // Initial load
  useEffect(() => {
    fetchFavorites(1);
  }, [fetchFavorites]);

  // Trigger search when filters change (with debounce)
  useEffect(() => {
    if (!loading) {
      const timeoutId = setTimeout(() => {
        setCurrentPage(1);
        fetchFavorites(1);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [sortBy, sortOrder, selectedCategory, minPrice, maxPrice, fetchFavorites, loading]);

  const FavoriteCard = ({ favorite }: { favorite: Favorite }) => {
    const product = favorite.productDetails;
    
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        <div className="relative h-48">
          {product?.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">No Image</span>
            </div>
          )}
          <button
            onClick={() => removeFavorite(favorite.productId)}
            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
          >
            <Heart className="w-4 h-4 text-red-500 fill-current" />
          </button>
        </div>
        
        <div className="p-4">
          <h3 className="font-semibold text-lg text-gray-900 mb-1">
            {product?.name || favorite.productName}
          </h3>
          <p className="text-[#4A7C59] font-bold text-xl mb-2">
            ₱{(product?.price || favorite.productPrice).toFixed(2)}
          </p>
          <p className="text-sm text-gray-600 mb-2">
            by {product?.farmerName || favorite.sellerName}
          </p>
          <p className="text-sm text-gray-500 mb-3">
            Category: {product?.category || favorite.productCategory}
          </p>
          {product?.availability && (
            <div className={`inline-block px-2 py-1 rounded text-xs mb-3 ${
              product.availability === 'Available' 
                ? 'bg-[#4A7C59]/10 text-[#4A7C59]' 
                : 'bg-red-100 text-red-800'
            }`}>
              {product.availability}
            </div>
          )}
          
          <div className="flex gap-2">
            <button
              onClick={() => addToCart(favorite.productId)}
              disabled={product?.availability !== 'Available'}
              className="flex-1 flex items-center justify-center gap-2 bg-[#4A7C59] text-white px-4 py-2 rounded-lg hover:bg-[#3d6549] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-4 h-4" />
              Add to Cart
            </button>
            <button
              onClick={() => removeFavorite(favorite.productId)}
              className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Heart className="w-8 h-8 text-red-500" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  My Favorites
                </h1>
                <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {pagination.totalCount} favorite products
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  showAnalytics 
                    ? 'bg-[#4A7C59] text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                <BarChart3 className="w-4 h-4" />
                {showAnalytics ? 'Hide Analytics' : 'View Analytics'}
              </button>
              
              <button
                onClick={refreshFavorites}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Analytics Section */}
        {showAnalytics && (
          <div className="mb-6">
            <FavoritesAnalytics />
          </div>
        )}

        {/* Search and Filter Controls */}
        {!loading && !error && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search products or farmers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [newSortBy, newSortOrder] = e.target.value.split('-');
                    setSortBy(newSortBy);
                    setSortOrder(newSortOrder);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="dateAdded-desc">Newest First</option>
                  <option value="dateAdded-asc">Oldest First</option>
                  <option value="productPrice-asc">Price: Low to High</option>
                  <option value="productPrice-desc">Price: High to Low</option>
                  <option value="productName-asc">Name: A to Z</option>
                  <option value="productName-desc">Name: Z to A</option>
                </select>
              </div>
            </div>

            {/* Price Range */}
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  placeholder="Min Price"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <span>to</span>
                <input
                  type="number"
                  placeholder="Max Price"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSearch}
                  className="flex items-center gap-2 px-4 py-2 bg-[#4A7C59] text-white rounded-lg hover:bg-[#3d6549] transition-colors"
                >
                  <Search className="w-4 h-4" />
                  Search
                </button>
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <LoadingDots size="lg" color="#103C2E" />
            <span className="mt-4 text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>Loading favorites...</span>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-red-600 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={refreshFavorites}
                className="px-6 py-2 bg-[#4A7C59] text-white rounded-lg hover:bg-[#3d6549] transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : favorites.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <Heart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No favorites yet</h3>
            <p className="text-gray-600 mb-4">
              Start browsing products and add them to your favorites to see them here.
            </p>
            <a
              href="/shop"
              className="inline-block px-6 py-2 bg-[#4A7C59] text-white rounded-lg hover:bg-[#3d6549] transition-colors"
            >
              Browse Products
            </a>
          </div>
        ) : (
          <>
            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {favorites.map((favorite) => (
                <FavoriteCard key={favorite._id} favorite={favorite} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of{' '}
                    {pagination.totalCount} favorites
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => goToPage(pagination.currentPage - 1)}
                      disabled={!pagination.hasPrevPage}
                      className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>
                    
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => goToPage(page)}
                            className={`px-3 py-2 rounded-lg ${
                              page === pagination.currentPage
                                ? 'bg-[#4A7C59] text-white'
                                : 'border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => goToPage(pagination.currentPage + 1)}
                      disabled={!pagination.hasNextPage}
                      className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
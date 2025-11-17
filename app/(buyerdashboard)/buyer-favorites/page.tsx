"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import LoadingDots from '@/components/ui/LoadingDots';
import ProductCard from '@/components/ProductCard';
import { 
  Heart, 
  Search, 
  ShoppingCart, 
  ChevronDown, 
  Eye, 
  Package,
  RefreshCw,
  Grid3X3,
  List,
  AlertCircle
} from 'lucide-react';

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

interface FavoriteItem {
  _id: string;
  productId: string;
  productName: string;
  productPrice: number;
  productImage?: string;
  productCategory: string;
  sellerId: string;
  sellerName: string;
  dateAdded: string;
  isAvailable: boolean;
  needsUpdate: boolean;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalFavorites: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  startIndex: number;
  endIndex: number;
}

interface Filters {
  category: string;
  search: string;
  sortBy: string;
  sortOrder: string;
}

interface Meta {
  timestamp: string;
  buyerId: string;
}

interface ApiResponse {
  success: boolean;
  data: {
    favorites: FavoriteItem[];
    pagination: Pagination;
    filters: Filters;
    meta: Meta;
  };
  message?: string;
}

const sortOptions = [
  { value: 'dateAdded-desc', label: 'Newest First' },
  { value: 'dateAdded-asc', label: 'Oldest First' },
  { value: 'productPrice-asc', label: 'Price: Low to High' },
  { value: 'productPrice-desc', label: 'Price: High to Low' },
  { value: 'productName-asc', label: 'Name: A to Z' },
  { value: 'productName-desc', label: 'Name: Z to A' }
];

const categories = [
  { value: 'all', label: 'All Categories' },
  { value: 'leafy-greens', label: 'Leafy Greens' },
  { value: 'root-crops', label: 'Root Crops' },
  { value: 'fruits', label: 'Fruits' },
  { value: 'spices-aromatics', label: 'Spices & Aromatics' },
  { value: 'eggplant-gourds', label: 'Eggplant & Gourds' },
  { value: 'grains-rice', label: 'Grains & Rice' }
];

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // View and filter states
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('dateAdded-desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Cart and favorites operations
  const [addingToCart, setAddingToCart] = useState<Set<string>>(new Set());
  const [removingFavorites, setRemovingFavorites] = useState<Set<string>>(new Set());

  // Debounce search
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);

  // Ensure client-side only rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchFavorites = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setError(null);

      const [sortField, sortOrder] = sortBy.split('-');
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        sortBy: sortField,
        sortOrder: sortOrder
      });

      if (selectedCategory !== 'all') queryParams.set('category', selectedCategory);
      if (searchTerm.trim()) queryParams.set('search', searchTerm.trim());

      const response = await fetch(`/api/buyer/favorites?${queryParams.toString()}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in to view your favorites');
        } else if (response.status === 403) {
          throw new Error('You do not have permission to view favorites');
        } else {
          throw new Error('Failed to fetch favorites');
        }
      }

      const data: ApiResponse = await response.json();

      if (data.success) {
        setFavorites(data.data.favorites);
        setPagination(data.data.pagination);
      } else {
        throw new Error(data.message || 'Failed to fetch favorites');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load favorites');
      setFavorites([]);
      setPagination(null);
    } finally {
      if (showLoader) setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, sortBy, selectedCategory, searchTerm]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Debounced search effect
  useEffect(() => {
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }
    
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      fetchFavorites();
    }, 500);

    setSearchDebounce(timeoutId);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const refreshFavorites = async () => {
    setRefreshing(true);
    await fetchFavorites(false);
  };

  const handleRemoveFromFavorites = async (productId: string) => {
    if (!confirm('Remove this product from your favorites?')) return;

    try {
      setRemovingFavorites(prev => new Set(prev).add(productId));

      const response = await fetch(`/api/buyer/favorites?productId=${productId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        await fetchFavorites(false);
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to remove from favorites');
      }
    } catch (err) {
      console.error('Error removing from favorites:', err);
      alert('Error removing from favorites. Please try again.');
    } finally {
      setRemovingFavorites(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const handleAddToCart = async (productId: string) => {
    try {
      setAddingToCart(prev => new Set(prev).add(productId));

      // Implementation would depend on your cart API
      const response = await fetch('/api/buyer/cart', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId, quantity: 1 })
      });

      if (response.ok) {
        // Could show success message or update cart count
        alert('Product added to cart!');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to add to cart');
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      alert('Error adding to cart. Please try again.');
    } finally {
      setAddingToCart(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Prevent hydration mismatch - only show loading on client
  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <LoadingDots size="lg" color="#103C2E" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Loading your favorites
          </h3>
          <p className="text-gray-500 font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Please wait
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Error Loading Favorites
            </h2>
            <p className="text-gray-600 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>{error}</p>
            <button
              onClick={() => fetchFavorites()}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 truncate" style={{ fontFamily: 'Poppins, sans-serif' }}>
                My Favorites
              </h1>
              <p className="text-sm sm:text-base text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Products you&apos;ve saved for later
              </p>
            </div>
            <button
              onClick={refreshFavorites}
              disabled={refreshing}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 text-sm sm:text-base touch-manipulation"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
              <span className="sm:hidden">Refresh</span>
            </button>
          </div>
        </div>

        {/* Search, Filters, and View Controls */}
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col gap-3 sm:gap-4 mb-3 sm:mb-4">
            {/* Search and Filter Toggle */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 flex-1">
              <div className="relative flex-1 max-w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type="text"
                  placeholder="Search favorites..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base touch-manipulation"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
                Filters
                <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* View Mode, Sort, and Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              {/* View Mode Toggle */}
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 flex-1 sm:flex-none ${viewMode === 'grid' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'} transition-colors touch-manipulation`}
                  title="Grid View"
                >
                  <Grid3X3 className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="ml-1 text-xs sm:text-sm hidden sm:inline">Grid</span>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 flex-1 sm:flex-none ${viewMode === 'list' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'} transition-colors touch-manipulation`}
                  title="List View"
                >
                  <List className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="ml-1 text-xs sm:text-sm hidden sm:inline">List</span>
                </button>
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2 flex-1 sm:flex-none">
                <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Sort:
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flex-1 sm:flex-none px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-xs sm:text-sm"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="border-t pt-3 sm:pt-4 mt-3 sm:mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-xs sm:text-sm"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    {categories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-start-1 lg:col-start-3 flex items-end">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('all');
                      setSortBy('dateAdded-desc');
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 sm:px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-xs sm:text-sm touch-manipulation"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        {pagination && (
          <div className="mb-3 sm:mb-4">
            <p className="text-xs sm:text-sm text-gray-600 px-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Showing {pagination.startIndex} to {pagination.endIndex} of {pagination.totalFavorites} favorites
              {(selectedCategory !== 'all' || searchTerm) ? ' (filtered)' : ''}
            </p>
          </div>
        )}

        {/* Favorites Display */}
        {favorites.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 lg:p-12 text-center">
            <Heart className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 px-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {pagination?.totalFavorites === 0 ? "You haven't added any favorites yet" : "No favorites found"}
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-6 px-2 max-w-md mx-auto" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {pagination?.totalFavorites === 0 
                ? "Start browsing products and add them to your favorites for easy access later" 
                : "Try adjusting your filters to find what you're looking for"
              }
            </p>
            {pagination?.totalFavorites === 0 ? (
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-colors touch-manipulation text-sm sm:text-base"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                <Package className="w-4 h-4 sm:w-5 sm:h-5" />
                Browse Products
              </Link>
            ) : (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                  setCurrentPage(1);
                }}
                className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-colors touch-manipulation text-sm sm:text-base"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
                {favorites.map((favorite) => {
                  // Transform favorite data to match ProductCard's expected format
                  const productData = {
                    _id: favorite.productId,
                    name: favorite.productName,
                    category: favorite.productCategory,
                    price: favorite.productPrice,
                    unit: 'pack', // Default unit if not available
                    stock: favorite.isAvailable ? 10 : 0, // Assume in stock if available
                    image: favorite.productImage,
                    farmerName: favorite.sellerName,
                    farmerId: favorite.sellerId,
                  };

                  return (
                    <div key={favorite._id} className="relative">
                      <ProductCard product={productData} />
                      {/* Overlay remove button */}
                      <button
                        onClick={() => handleRemoveFromFavorites(favorite.productId)}
                        disabled={removingFavorites.has(favorite.productId)}
                        className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50 z-10"
                        title="Remove from favorites"
                      >
                        {removingFavorites.has(favorite.productId) ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
                <div className="divide-y divide-gray-200">
                  {favorites.map((favorite) => (
                    <div key={favorite._id} className="p-6 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                      {/* Product Image */}
                      <div className="relative w-20 h-20 flex-shrink-0">
                        {favorite.productImage ? (
                          <Image
                            src={favorite.productImage}
                            alt={favorite.productName}
                            fill
                            className="object-cover rounded-lg"
                            sizes="80px"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                            <Package className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <Link href={`/shop/${favorite.productId}`}>
                          <h3 className="font-medium text-gray-900 hover:text-green-600 transition-colors truncate" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {favorite.productName}
                          </h3>
                        </Link>
                        <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          by {favorite.sellerName} • {favorite.productCategory}
                        </p>
                        <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          Added on {formatDate(favorite.dateAdded)}
                        </p>
                      </div>

                      {/* Price and Status */}
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {formatCurrency(favorite.productPrice)}
                        </div>
                        {!favorite.isAvailable && (
                          <span className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                            Unavailable
                          </span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 ml-4">
                        <Link
                          href={`/shop/${favorite.productId}`}
                          className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          style={{ fontFamily: 'Poppins, sans-serif' }}
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Link>
                        
                        {favorite.isAvailable && (
                          <button
                            onClick={() => handleAddToCart(favorite.productId)}
                            disabled={addingToCart.has(favorite.productId)}
                            className="inline-flex items-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                            style={{ fontFamily: 'Poppins, sans-serif' }}
                          >
                            {addingToCart.has(favorite.productId) ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <ShoppingCart className="w-4 h-4" />
                            )}
                            Add to Cart
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleRemoveFromFavorites(favorite.productId)}
                          disabled={removingFavorites.has(favorite.productId)}
                          className="inline-flex items-center gap-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          style={{ fontFamily: 'Poppins, sans-serif' }}
                        >
                          {removingFavorites.has(favorite.productId) ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                            <Heart className="w-4 h-4 fill-current" />
                          )}
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Showing {pagination.startIndex} to {pagination.endIndex} of {pagination.totalFavorites} favorites
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                    className="px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    Previous
                  </button>
                  
                  <div className="flex space-x-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-2 text-sm font-medium rounded-lg ${
                            pagination.currentPage === page
                              ? 'bg-green-600 text-white'
                              : 'text-gray-600 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                          style={{ fontFamily: 'Poppins, sans-serif' }}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className="px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
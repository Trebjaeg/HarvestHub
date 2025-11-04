'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { IProduct } from '../types/product';

interface TopProductsProps {
  title?: string;
  maxItems?: number;
  minRating?: number;
  minReviews?: number;
  refreshInterval?: number; // Auto-refresh interval in milliseconds
}

const TopProducts: React.FC<TopProductsProps> = ({ 
  title = 'Top Rated Products',
  maxItems = 4,
  minRating = 4.0,
  minReviews = 1,
  refreshInterval = 60000 // Default: refresh every 60 seconds
}) => {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTopProducts = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const response = await fetch(
        `${baseUrl}/api/products/top-rated?limit=${maxItems * 3}&minRating=${minRating}&minReviews=${minReviews}`,
        {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.products || []);
      } else {
        setError(data.message || 'Failed to load top products');
      }
    } catch (error) {
      console.error('Error fetching top-rated products:', error);
      setError('Failed to load top products');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [maxItems, minRating, minReviews]);

  useEffect(() => {
    fetchTopProducts();
    
    // Set up auto-refresh if interval is provided
    if (refreshInterval > 0) {
      const intervalId = setInterval(() => {
        fetchTopProducts(true); // Silent refresh
      }, refreshInterval);
      
      return () => clearInterval(intervalId);
    }
  }, [refreshInterval, fetchTopProducts]);

  const handleNext = () => {
    if (currentIndex + maxItems < products.length) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const visibleProducts = products.slice(currentIndex, currentIndex + maxItems);

  // Render star rating display
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <svg key={i} className="w-3.5 h-3.5 text-yellow-400 fill-current" viewBox="0 0 20 20">
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <svg key={i} className="w-3.5 h-3.5 text-yellow-400" viewBox="0 0 20 20">
            <defs>
              <linearGradient id={`half-${i}`}>
                <stop offset="50%" stopColor="currentColor" className="text-yellow-400" />
                <stop offset="50%" stopColor="currentColor" className="text-gray-300" />
              </linearGradient>
            </defs>
            <path fill={`url(#half-${i})`} d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        );
      } else {
        stars.push(
          <svg key={i} className="w-3.5 h-3.5 text-gray-300 fill-current" viewBox="0 0 20 20">
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        );
      }
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="bg-[#F5ECDE] pt-4 px-4 pb-0 overflow-hidden" style={{ height: '509px', borderTopLeftRadius: '1.5rem', borderTopRightRadius: '1.5rem', borderBottomLeftRadius: '1.5rem', borderBottomRightRadius: '1.5rem' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3" style={{ height: '36px' }}>
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="flex gap-1 items-center">
            <div className="w-6 h-6 bg-gray-200 rounded"></div>
            <div className="w-px h-4 bg-gray-300"></div>
            <div className="w-6 h-6 bg-gray-200 rounded"></div>
          </div>
        </div>
        {/* White container */}
        <div 
          className="bg-white border-2 p-4"
          style={{ 
            height: 'calc(100% - 52px)', 
            borderColor: '#40613D', 
            overflow: 'auto', 
            marginLeft: '-1rem', 
            marginRight: '-1rem', 
            marginBottom: '-10px', 
            paddingLeft: '1.5rem', 
            paddingRight: '1.5rem',
            paddingBottom: '2rem',
            borderTopLeftRadius: '1.5rem',
            borderTopRightRadius: '1.5rem',
            borderBottomLeftRadius: '1.5rem',
            borderBottomRightRadius: '1.5rem'
          }}
        >
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 pb-3 border-b last:border-b-0 border-gray-200">
                <div className="w-24 h-24 bg-gray-200 rounded-2xl animate-pulse border-2" style={{ borderColor: '#40613D' }}></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 bg-gray-200 rounded"></div>
                  <div className="h-5 w-28 bg-gray-200 rounded"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F5ECDE] pt-4 px-4 pb-0 w-full overflow-hidden" style={{ height: '509px', borderTopLeftRadius: '1.5rem', borderTopRightRadius: '1.5rem', borderBottomLeftRadius: '1.5rem', borderBottomRightRadius: '1.5rem' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3" style={{ height: '36px' }}>
        <h3 
          className="font-bold"
          style={{ 
            color: '#1E3A2F',
            fontFamily: 'Poppins, sans-serif',
            fontSize: '24px',
            lineHeight: '36px'
          }}
        >
          {title}
        </h3>
        <div className="flex gap-1 items-center">
          {/* Next Button */}
          <button 
            onClick={handleNext}
            disabled={currentIndex + maxItems >= products.length}
            className={`transition-all ${
              currentIndex + maxItems >= products.length
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-[#40613D] hover:text-[#2D5240]'
            }`}
            aria-label="Next products"
            style={{ width: '24px', height: '24px' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M5 12l14 0" />
              <path d="M15 16l4 -4" />
              <path d="M15 8l4 4" />
            </svg>
          </button>
          
          {/* Separator */}
          <svg width="2" height="24" viewBox="0 0 2 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="1" y1="0" x2="1" y2="24" stroke="#9CA3AF" strokeWidth="1"/>
          </svg>
          
          {/* Previous Button */}
          <button 
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`transition-all ${
              currentIndex === 0
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            aria-label="Previous products"
            style={{ width: '24px', height: '24px' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M5 12l14 0" />
              <path d="M5 12l4 4" />
              <path d="M5 12l4 -4" />
            </svg>
          </button>
        </div>
      </div>

      {/* White Products Container */}
      <div 
        className="bg-white border-2 p-4 overflow-y-auto"
        style={{ 
          height: 'calc(100% - 52px)', 
          borderColor: '#40613D',
          marginLeft: '-1rem',
          marginRight: '-1rem', 
          marginBottom: '-10px',
          paddingLeft: '1.5rem',
          paddingRight: '1.5rem',
          paddingBottom: '2rem',
          borderTopLeftRadius: '1.5rem',
          borderTopRightRadius: '1.5rem',
          borderBottomLeftRadius: '1.5rem',
          borderBottomRightRadius: '1.5rem'
        }}
      >
        {error ? (
          <div className="text-center py-8 text-red-500">
            <p style={{ fontFamily: 'Poppins, sans-serif' }}>{error}</p>
            <button
              onClick={() => fetchTopProducts()}
              className="mt-4 px-4 py-2 bg-[#40613D] text-white rounded-lg hover:bg-[#2D5240] transition-colors"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              Retry
            </button>
          </div>
        ) : visibleProducts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p style={{ fontFamily: 'Poppins, sans-serif' }}>No top-rated products available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleProducts.map((product, index) => {
              const hasDiscount = product.basePrice && product.basePrice > product.currentPrice;

              return (
                <Link 
                  href={`/product/${product._id}`}
                  key={product._id}
                  className={`flex items-start gap-3 pb-3 ${
                    index !== visibleProducts.length - 1 ? 'border-b border-gray-200' : ''
                  } hover:bg-gray-50 transition-colors rounded-lg p-2 -mx-2`}
                >
                  {/* Product Image */}
                  <div 
                    className="relative flex-shrink-0 bg-white rounded-2xl border-2 overflow-hidden"
                    style={{ width: '115px', height: '115px', borderColor: '#40613D' }}
                  >
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-contain p-2"
                      sizes="115px"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 flex flex-col justify-start pt-1">
                    {/* Category */}
                    <p 
                      className="text-sm text-gray-600 mb-1"
                      style={{ 
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: '13px',
                        lineHeight: '18px'
                      }}
                    >
                      {product.category}
                    </p>

                    {/* Product Name */}
                    <h4 
                      className="font-semibold mb-1 line-clamp-2"
                      style={{ 
                        color: '#1E3A2F',
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: '17px',
                        lineHeight: '22px'
                      }}
                    >
                      {product.name}
                    </h4>

                    {/* Rating Display */}
                    {product.rating && product.rating > 0 && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-0.5">
                          {renderStars(product.rating)}
                        </div>
                        <span 
                          className="text-sm font-semibold"
                          style={{ 
                            color: '#1E3A2F',
                            fontFamily: 'Poppins, sans-serif',
                            fontSize: '13px'
                          }}
                        >
                          {product.rating.toFixed(1)}
                        </span>
                        {product.totalReviews && product.totalReviews > 0 && (
                          <span 
                            className="text-xs text-gray-500"
                            style={{ 
                              fontFamily: 'Poppins, sans-serif',
                              fontSize: '12px'
                            }}
                          >
                            ({product.totalReviews} {product.totalReviews === 1 ? 'review' : 'reviews'})
                          </span>
                        )}
                      </div>
                    )}

                    {/* Price Section */}
                    <div className="flex items-baseline gap-2">
                      <p 
                        className="font-bold"
                        style={{ 
                          color: '#1E3A2F',
                          fontFamily: 'Poppins, sans-serif',
                          fontSize: '18px',
                          lineHeight: '24px'
                        }}
                      >
                        ₱{product.currentPrice}/{product.unit}
                      </p>
                      {hasDiscount && product.basePrice && (
                        <span 
                          className="text-gray-400 line-through"
                          style={{ 
                            fontFamily: 'Poppins, sans-serif',
                            fontSize: '13px',
                            lineHeight: '18px'
                          }}
                        >
                          ₱{product.basePrice}/{product.unit}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TopProducts;

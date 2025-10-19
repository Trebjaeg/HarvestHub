'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { IProduct } from '../types/product';

interface TopProductsProps {
  title?: string;
  maxItems?: number;
}

const TopProducts: React.FC<TopProductsProps> = ({ 
  title = 'Top Products',
  maxItems = 4 
}) => {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopProducts();
  }, []);

  const fetchTopProducts = async () => {
    try {
      setLoading(true);
      // Fetch products sorted by some criteria (e.g., most popular, best sellers, highest rated)
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const response = await fetch(`${baseUrl}/api/products?limit=20&sortBy=popular`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      
      if (data.success) {
        // Filter products with discounts or featured products
        const topProducts = data.products
          .filter((p: IProduct) => p.basePrice && p.basePrice > p.currentPrice)
          .slice(0, maxItems * 3); // Get more for rotation
        setProducts(topProducts);
      }
    } catch (error) {
      console.error('Error fetching top products:', error);
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="bg-[#F5ECDE] pt-4 px-4 pb-0 overflow-hidden" style={{ height: '509px', borderTopLeftRadius: '1.5rem', borderTopRightRadius: '1.5rem', borderBottomLeftRadius: '1.5rem', borderBottomRightRadius: '1.5rem' }}>
        {/* Header outside - 313 x 36 */}
        <div className="flex items-center justify-between mb-3" style={{ height: '36px' }}>
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="flex gap-1 items-center">
            <div className="w-6 h-6 bg-gray-200 rounded"></div>
            <div className="w-px h-4 bg-gray-300"></div>
            <div className="w-6 h-6 bg-gray-200 rounded"></div>
          </div>
        </div>
        {/* White container - expanded to edges */}
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
      {/* Header - Outside the white box - 313 x 36 */}
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
          {/* Next Button - Green Arrow */}
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
          
          {/* Previous Button - Gray Arrow */}
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

      {/* White Products Container - Expanded to edges on left, right, bottom */}
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
        {visibleProducts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p style={{ fontFamily: 'Poppins, sans-serif' }}>No products available</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleProducts.map((product, index) => {
              const hasDiscount = product.basePrice && product.basePrice > product.currentPrice;

              return (
                <div 
                  key={product._id}
                  className={`flex items-start gap-3 pb-3 ${
                    index !== visibleProducts.length - 1 ? 'border-b border-gray-200' : ''
                  }`}
                >
                  {/* Product Image - Square with border */}
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
                      className="font-semibold mb-2 line-clamp-2"
                      style={{ 
                        color: '#1E3A2F',
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: '17px',
                        lineHeight: '22px'
                      }}
                    >
                      {product.name}
                    </h4>

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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TopProducts;

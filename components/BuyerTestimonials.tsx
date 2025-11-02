'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Testimonial {
  _id: string;
  productId: string;
  rating: number;
  title?: string;
  comment: string;
  createdAt: string;
  avatarUrl: string | null;
  fullName: string;
  city: string;
  verified: boolean;
  productName: string;
  productImage: string | null;
}

interface BuyerTestimonialsProps {
  minRating?: number;
  limit?: number;
}

const BuyerTestimonials: React.FC<BuyerTestimonialsProps> = ({
  minRating = 4,
  limit = 20
}) => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Fetch testimonials from API
  const fetchTestimonials = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const response = await fetch(
        `${baseUrl}/api/reviews/buyer-testimonials?limit=${limit}&minRating=${minRating}`,
        {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        setTestimonials(data.testimonials || []);
      } else {
        setError(data.message || 'Failed to load testimonials');
      }
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      setError('Failed to load testimonials');
    } finally {
      setLoading(false);
    }
  }, [minRating, limit]);

  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  // Check scroll position to show/hide arrows
  const checkScrollPosition = useCallback(() => {
    if (containerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  useEffect(() => {
    checkScrollPosition();
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      return () => container.removeEventListener('scroll', checkScrollPosition);
    }
  }, [checkScrollPosition, testimonials]);

  // Scroll functions
  const scrollLeft = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({
        left: -250,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({
        left: 250,
        behavior: 'smooth'
      });
    }
  };

  // Auto-generate initials from full name
  const getInitials = (fullName: string): string => {
    const names = fullName.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  // Render star rating
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300 fill-current'}`}
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
      </svg>
    ));
  };

  // Skeleton loader - Fixed card dimensions: 233 × 276 px
  if (loading) {
    return (
      <div className="mt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold" style={{ color: '#614124', fontFamily: 'Poppins, sans-serif' }}>
            What Our Buyer Says
          </h2>
        </div>
        
        <div className="relative overflow-hidden">
          <div className="flex gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div 
                key={i} 
                className="flex-shrink-0 bg-white rounded-2xl shadow-sm animate-pulse"
                style={{ width: '233px', height: '276px' }}
              >
                <div className="flex flex-col items-center p-6">
                  <div className="w-16 h-16 bg-gray-200 rounded-full mb-3"></div>
                  <div className="h-5 w-32 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded mb-4"></div>
                  <div className="space-y-2 w-full">
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-3 bg-gray-200 rounded w-4/6"></div>
                  </div>
                  <div className="flex gap-1 mt-auto">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <div key={s} className="w-4 h-4 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (error || testimonials.length === 0) {
    return (
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-6" style={{ color: '#614124', fontFamily: 'Poppins, sans-serif' }}>
          What Our Buyer Says
        </h2>
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
          <div className="max-w-md mx-auto">
            <svg 
              className="w-20 h-20 mx-auto mb-4 text-gray-300" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
              />
            </svg>
            <h3 className="text-xl font-semibold mb-2 text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
              No Reviews Yet
            </h3>
            <p className="text-gray-500 mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {error || 'Be the first to share your experience! Your feedback helps other buyers make informed decisions.'}
            </p>
            <Link 
              href="/shop" 
              className="inline-block bg-green-600 text-white px-6 py-3 rounded-full font-medium hover:bg-green-700 transition-colors"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 
          className="text-2xl font-bold"
          style={{ color: '#614124', fontFamily: 'Poppins, sans-serif' }}
        >
          What Our Buyer Says
        </h2>
      </div>

      {/* Horizontal Carousel with Navigation */}
      <div className="relative">
        {/* Left Arrow */}
        {canScrollLeft && (
          <button
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-100 transition-all duration-200 hover:scale-110"
            style={{ marginLeft: '-20px' }}
            aria-label="Scroll left"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="text-gray-700"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M15 6l-6 6l6 6" />
            </svg>
          </button>
        )}

        {/* Right Arrow */}
        {canScrollRight && (
          <button
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-100 transition-all duration-200 hover:scale-110"
            style={{ marginRight: '-20px' }}
            aria-label="Scroll right"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="text-gray-700"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M9 6l6 6l-6 6" />
            </svg>
          </button>
        )}

        <div
          ref={containerRef}
          className="overflow-x-auto scrollbar-hide"
        >
          <div className="flex gap-4 pb-4">
            {testimonials.map((testimonial) => (
              <Link
                key={testimonial._id}
                href={`/product/${testimonial.productId}?ref=reviews_section`}
                className="flex-shrink-0 bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                style={{ width: '233px', height: '276px' }}
              >
                <div className="flex flex-col items-center p-6 h-full">
                  {/* Avatar - 60px circular */}
                  <div className="relative w-[60px] h-[60px] mb-3 flex-shrink-0">
                    <div className="w-full h-full rounded-full overflow-hidden bg-gray-200 border-2 border-gray-100">
                      {testimonial.avatarUrl ? (
                        <Image
                          src={testimonial.avatarUrl}
                          alt={`${testimonial.fullName}'s avatar`}
                          fill
                          className="object-cover"
                          sizes="60px"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-400 to-green-600 text-white text-xl font-bold">${getInitials(testimonial.fullName)}</div>`;
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-400 to-green-600 text-white text-xl font-bold">
                          {getInitials(testimonial.fullName)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Full Name - Bold */}
                  <div className="flex items-center gap-1.5 mb-1 flex-shrink-0">
                    <h3
                      className="font-bold text-base leading-tight text-center"
                      style={{ color: '#614124', fontFamily: 'Poppins, sans-serif' }}
                    >
                      {testimonial.fullName}
                    </h3>
                    {testimonial.verified && (
                      <svg
                        className="w-4 h-4 text-green-600 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        aria-label="Verified Purchase"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>

                  {/* City - Muted */}
                  <p
                    className="text-xs text-gray-500 mb-3 flex-shrink-0"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    {testimonial.city}
                  </p>

                  {/* Review Text - Clamped to 3-4 lines with ellipsis */}
                  <p
                    className="text-sm text-gray-700 leading-relaxed text-center flex-grow overflow-hidden"
                    style={{ 
                      fontFamily: 'Poppins, sans-serif',
                      display: '-webkit-box',
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: '1.4'
                    }}
                  >
                    {testimonial.comment}
                  </p>

                  {/* Star Rating Row - At bottom */}
                  <div 
                    className="flex items-center justify-center gap-1 mt-auto pt-3 flex-shrink-0" 
                    role="img" 
                    aria-label={`Rated ${testimonial.rating} out of 5 stars`}
                  >
                    {renderStars(testimonial.rating)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Custom scrollbar styling */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default BuyerTestimonials;

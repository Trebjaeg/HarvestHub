"use client";

import Image from "next/image";
import React, { useState, useEffect } from "react";
import { Star, MessageSquare, TrendingUp, Package, Filter, Search } from "lucide-react";
import ReviewItem from "@/components/ReviewItem";
import LoadingDots from "@/components/ui/LoadingDots";

interface Review {
  _id: string;
  id: string;
  productId: string;
  productName: string;
  buyerId: string;
  buyerName: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  verified: boolean;
  createdAt: string;
  buyer?: {
    name: string;
    profileImage?: string;
  };
  sellerResponse?: {
    comment: string;
    respondedAt: Date;
  };
  followUpReviews?: Array<{
    comment: string;
    createdAt: Date;
  }>;
}

interface Stats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  responseRate: number;
}

const Reviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    responseRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, [currentPage, filterRating]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });
      
      if (filterRating !== 'all') {
        params.append('rating', filterRating.toString());
      }
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/seller/reviews?${params.toString()}`, {
        credentials: 'include',
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        setReviews(data.data.reviews);
        setTotalPages(data.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/seller/reviews/stats', {
        credentials: 'include',
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchReviews();
  };

  const getRatingPercentage = (rating: number) => {
    if (stats.totalReviews === 0) return 0;
    return (stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution] / stats.totalReviews) * 100;
  };

  return (
    <div className="bg-[#ECFDF5] mt-3 sm:mt-4 mb-3 sm:mb-4 mx-2 sm:mx-3 p-3 sm:p-4 rounded-lg shadow-gray-400 shadow-sm min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-2 mt-4 sm:mt-6 ml-1 sm:ml-2 mb-4 sm:mb-6">
        <Image
          src="/images/seller/Review.png"
          alt="Reviews"
          width={30}
          height={30}
          className="w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 mt-1"
        />
        <h1 className="text-[#103C2E] font-bold text-xl sm:text-2xl lg:text-3xl ml-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Reviews & Ratings
        </h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Average Rating
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-[#4A7C59] mt-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {stats.averageRating.toFixed(1)}
              </p>
              <div className="flex items-center mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3 h-3 sm:w-4 sm:h-4 ${
                      star <= Math.round(stats.averageRating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-[#4A7C59] opacity-20 flex-shrink-0" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Total Reviews
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-[#4A7C59] mt-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {stats.totalReviews}
              </p>
              <p className="text-xs text-gray-500 mt-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                All time
              </p>
            </div>
            <MessageSquare className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-[#4A7C59] opacity-20 flex-shrink-0" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Response Rate
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-[#4A7C59] mt-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {stats.responseRate.toFixed(0)}%
              </p>
              <p className="text-xs text-gray-500 mt-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Replied to reviews
              </p>
            </div>
            <Package className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-[#4A7C59] opacity-20 flex-shrink-0" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
          <p className="text-xs sm:text-sm text-gray-600 mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Rating Distribution
          </p>
          {[5, 4, 3, 2, 1].map((rating) => (
            <div key={rating} className="flex items-center gap-2 mb-1">
              <span className="text-xs text-gray-600 w-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {rating}
              </span>
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#4A7C59]"
                  style={{ width: `${getRatingPercentage(rating)}%` }}
                />
              </div>
              <span className="text-xs text-gray-600 w-8 text-right" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search reviews by product or buyer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-9 sm:pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A7C59] text-sm sm:text-base"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A7C59] text-sm sm:text-base"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
            <button
              onClick={handleSearch}
              className="px-4 sm:px-6 py-2 bg-[#4A7C59] text-white rounded-lg hover:bg-[#3d6849] active:bg-[#3d6849] transition-colors touch-manipulation text-sm sm:text-base"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-8 sm:py-12">
            <LoadingDots size="md" color="#4A7C59" />
          </div>
        ) : reviews.length > 0 ? (
          <div className="space-y-4 sm:space-y-6">
            {reviews.map((review) => (
              <ReviewItem
                key={review._id}
                review={review}
                isSellerView={true}
                isBuyerOwnReview={false}
                onReplySubmitted={fetchReviews}
              />
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {searchTerm || filterRating !== 'all' 
                ? 'No reviews match your filters' 
                : 'No reviews yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reviews;

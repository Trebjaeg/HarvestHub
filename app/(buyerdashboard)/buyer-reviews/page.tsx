"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LoadingDots from '@/components/ui/LoadingDots';

interface Review {
  _id: string;
  productId: string;
  productName: string;
  productImage?: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  verified: boolean;
  createdAt: string;
  status: string;
  sellerResponse?: {
    comment: string;
    respondedAt: Date;
  };
  followUpReviews?: Array<{
    comment: string;
    createdAt: Date;
  }>;
}

function BuyerReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/buyer/reviews', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6 max-w-6xl mx-auto">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
          My Reviews
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
          View all your product reviews and add follow-ups
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <LoadingDots size="lg" color="#4A7C59" />
        </div>
      ) : reviews.length === 0 ? (
        <Card className="p-6 sm:p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <Star className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
              No reviews yet
            </h3>
            <p className="text-sm sm:text-base text-gray-600 max-w-md" style={{ fontFamily: 'Poppins, sans-serif' }}>
              You haven&apos;t written any reviews yet. Complete an order to leave your first review!
            </p>
            <Link href="/buyer-orders">
              <Button className="bg-[#4A7C59] hover:bg-[#3d6849] active:bg-[#3d6849] touch-manipulation">
                View My Orders
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {reviews.map((review) => (
            <Card key={review._id} className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Product Image */}
                {review.productImage && (
                  <div className="flex-shrink-0 self-center sm:self-start">
                    <img
                      src={review.productImage}
                      alt={review.productName}
                      className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg"
                    />
                  </div>
                )}

                {/* Review Content */}
                <div className="flex-1 min-w-0">
                  {/* Product Name */}
                  <Link href={`/product/${review.productId}`}>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 hover:text-[#4A7C59] mb-2 break-words" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {review.productName}
                    </h3>
                  </Link>

                  {/* Rating */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 sm:w-5 sm:h-5 ${
                              star <= review.rating
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      {review.verified && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          Verified
                        </span>
                      )}
                    </div>
                    <span className="text-xs sm:text-sm text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Review Title */}
                  {review.title && (
                    <h4 className="font-semibold text-gray-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {review.title}
                    </h4>
                  )}

                  {/* Review Comment */}
                  <p className="text-sm sm:text-base text-gray-700 mb-3 break-words" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {review.comment}
                  </p>

                  {/* Review Images */}
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 mb-3 flex-wrap">
                      {review.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`Review image ${idx + 1}`}
                          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  )}

                  {/* Seller Response */}
                  {review.sellerResponse && review.sellerResponse.comment && (
                    <div className="bg-blue-50 rounded-lg p-4 mb-3 border-l-4 border-blue-500">
                      <p className="text-sm font-semibold text-gray-900 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        💬 Seller Response
                      </p>
                      <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {review.sellerResponse.comment}
                      </p>
                      <p className="text-xs text-gray-400 mt-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {new Date(review.sellerResponse.respondedAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {/* Follow-up Reviews */}
                  {review.followUpReviews && review.followUpReviews.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {review.followUpReviews.map((followUp, idx) => (
                        <div key={idx} className="bg-green-50 rounded-lg p-3 border-l-4 border-green-500">
                          <p className="text-sm font-semibold text-gray-900 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            📝 Your Follow-up Review
                          </p>
                          <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {followUp.comment}
                          </p>
                          <p className="text-xs text-gray-400 mt-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {new Date(followUp.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Button */}
                  {review.status === 'active' && review.productId && (
                    <div className="flex justify-center sm:justify-end mt-4">
                      <Link href={`/product/${review.productId}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[#4A7C59] border-[#4A7C59] hover:bg-[#4A7C59]/10 active:bg-[#4A7C59]/10 touch-manipulation text-xs sm:text-sm"
                        >
                          View Product & Add Follow-up
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BuyerReviewsPage() {
  return (
    <ProtectedRoute>
      <BuyerReviews />
    </ProtectedRoute>
  );
}

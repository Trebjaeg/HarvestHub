"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Star } from 'lucide-react';

interface Review {
  _id?: string;
  id?: string;
  buyerId?: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  verified: boolean;
  createdAt: string;
  buyerName?: string;
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

interface ReviewItemProps {
  review: Review;
  isSellerView: boolean;
  isBuyerOwnReview?: boolean;
  onReplySubmitted: () => void;
}

export default function ReviewItem({ review, isSellerView, isBuyerOwnReview = false, onReplySubmitted }: ReviewItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [replyError, setReplyError] = useState('');
  
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [followUpText, setFollowUpText] = useState('');
  const [submittingFollowUp, setSubmittingFollowUp] = useState(false);
  const [followUpError, setFollowUpError] = useState('');

  const handleSubmitReply = async () => {
    if (!replyText.trim()) {
      setReplyError('Please enter a response');
      return;
    }

    if (replyText.length > 1000) {
      setReplyError('Response must not exceed 1000 characters');
      return;
    }

    try {
      setSubmittingReply(true);
      setReplyError('');

      const reviewId = review._id || review.id;
      const response = await fetch(`/api/reviews/${reviewId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          sellerResponse: replyText
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setShowReplyForm(false);
        setReplyText('');
        onReplySubmitted();
      } else {
        setReplyError(data.message || 'Failed to submit reply');
      }
    } catch (error) {
      console.error('Error submitting reply:', error);
      setReplyError('Failed to submit reply. Please try again.');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleSubmitFollowUp = async () => {
    if (!followUpText.trim()) {
      setFollowUpError('Please enter your follow-up comment');
      return;
    }

    if (followUpText.length > 500) {
      setFollowUpError('Follow-up must not exceed 500 characters');
      return;
    }

    try {
      setSubmittingFollowUp(true);
      setFollowUpError('');

      const reviewId = review._id || review.id;
      const response = await fetch(`/api/reviews/${reviewId}/follow-up`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          comment: followUpText
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setShowFollowUpForm(false);
        setFollowUpText('');
        onReplySubmitted();
      } else {
        setFollowUpError(data.message || 'Failed to submit follow-up');
      }
    } catch (error) {
      console.error('Error submitting follow-up:', error);
      setFollowUpError('Failed to submit follow-up. Please try again.');
    } finally {
      setSubmittingFollowUp(false);
    }
  };

  return (
    <div className="border-b pb-6 last:border-0">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
          {review.buyer?.profileImage && review.buyer ? (
            <Image
              src={review.buyer.profileImage}
              alt={review.buyer.name || 'Buyer'}
              width={48}
              height={48}
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg font-bold text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {(review.buyer?.name || review.buyerName || 'B').charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {review.buyer?.name || review.buyerName || 'Anonymous'}
            </span>
            {review.verified && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Verified Purchase
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= review.rating
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
            <span className="text-sm text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {new Date(review.createdAt).toLocaleDateString()}
            </span>
          </div>
          {review.title && (
            <h4 className="font-semibold text-gray-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {review.title}
            </h4>
          )}
          <p className="text-gray-600 mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {review.comment}
          </p>
          {review.images && review.images.length > 0 && (
            <div className="flex gap-2 mb-3 flex-wrap">
              {review.images.map((img: string, idx: number) => (
                <div key={idx} className="w-20 h-20 rounded-lg overflow-hidden">
                  <Image
                    src={img}
                    alt={`Review image ${idx + 1}`}
                    width={80}
                    height={80}
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
          
          {/* Seller Response */}
          {review.sellerResponse?.comment && (
            <div className="bg-blue-50 rounded-lg p-4 mt-3 border-l-4 border-blue-500">
              <p className="text-sm font-semibold text-gray-900 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                💬 Seller Response
              </p>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {review.sellerResponse.comment}
              </p>
              {review.sellerResponse.respondedAt && (
                <p className="text-xs text-gray-400 mt-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {new Date(review.sellerResponse.respondedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          {/* Follow-up Reviews (buyer additional comments) */}
          {review.followUpReviews && review.followUpReviews.length > 0 && (
            <div className="mt-3 space-y-2">
              {review.followUpReviews.map((followUp, idx) => (
                <div key={idx} className="bg-green-50 rounded-lg p-3 border-l-4 border-green-500">
                  <p className="text-sm font-semibold text-gray-900 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    📝 Follow-up Review
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

          {/* Reply Button (for sellers only - NOT for buyers on their own reviews) */}
          {isSellerView && !isBuyerOwnReview && !review.sellerResponse?.comment && !showReplyForm && (
            <button
              onClick={() => setShowReplyForm(true)}
              className="mt-3 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
              style={{ 
                backgroundColor: '#4A7C59',
                fontFamily: 'Poppins, sans-serif'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d6849'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4A7C59'}
            >
              Reply to Review
            </button>
          )}

          {/* Reply Form */}
          {isSellerView && showReplyForm && (
            <div className="mt-3 bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Your Response
              </label>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a thoughtful response to this review..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent resize-none"
                style={{ fontFamily: 'Poppins, sans-serif' }}
                rows={4}
                maxLength={1000}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {replyText.length}/1000 characters
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowReplyForm(false);
                      setReplyText('');
                      setReplyError('');
                    }}
                    disabled={submittingReply}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitReply}
                    disabled={submittingReply || !replyText.trim()}
                    className="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    style={{ 
                      backgroundColor: '#4A7C59',
                      fontFamily: 'Poppins, sans-serif'
                    }}
                    onMouseEnter={(e) => !submittingReply && (e.currentTarget.style.backgroundColor = '#3d6849')}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4A7C59'}
                  >
                    {submittingReply ? 'Submitting...' : 'Submit Reply'}
                  </button>
                </div>
              </div>
              {replyError && (
                <p className="text-sm text-red-600 mt-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {replyError}
                </p>
              )}
            </div>
          )}

          {/* Follow-up Review Button (for buyers on their own reviews) */}
          {isBuyerOwnReview && !showFollowUpForm && (
            <button
              onClick={() => setShowFollowUpForm(true)}
              className="mt-3 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
              style={{ 
                backgroundColor: '#4A7C59',
                fontFamily: 'Poppins, sans-serif'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d6849'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4A7C59'}
            >
              Add Follow-up Review
            </button>
          )}

          {/* Follow-up Review Form */}
          {isBuyerOwnReview && showFollowUpForm && (
            <div className="mt-3 bg-green-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Follow-up Review
              </label>
              <textarea
                value={followUpText}
                onChange={(e) => setFollowUpText(e.target.value)}
                placeholder="Add additional feedback about this product..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent resize-none"
                style={{ fontFamily: 'Poppins, sans-serif' }}
                rows={3}
                maxLength={500}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {followUpText.length}/500 characters
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowFollowUpForm(false);
                      setFollowUpText('');
                      setFollowUpError('');
                    }}
                    disabled={submittingFollowUp}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitFollowUp}
                    disabled={submittingFollowUp || !followUpText.trim()}
                    className="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    style={{ 
                      backgroundColor: '#4A7C59',
                      fontFamily: 'Poppins, sans-serif'
                    }}
                    onMouseEnter={(e) => !submittingFollowUp && (e.currentTarget.style.backgroundColor = '#3d6849')}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4A7C59'}
                  >
                    {submittingFollowUp ? 'Submitting...' : 'Submit Follow-up'}
                  </button>
                </div>
              </div>
              {followUpError && (
                <p className="text-sm text-red-600 mt-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {followUpError}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

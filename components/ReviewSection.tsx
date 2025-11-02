"use client";

import React, { useState, useEffect } from 'react';
import { Package, Star, CheckCircle, XCircle, Sparkles, ThumbsUp, Heart, Upload, X } from 'lucide-react';
import LoadingDots from '@/components/ui/LoadingDots';

interface Product {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  unit: string;
  category: string;
  subtotal: number;
  image?: string;
}

interface ReviewSectionProps {
  orderId: string;
  products: Product[];
}

interface ReviewData {
  [productId: string]: {
    rating: number;
    title: string;
    comment: string;
    quickReview?: string;
    images?: File[];
  };
}

const quickReviewOptions = {
  positive: [
    { id: 'excellent', label: 'Excellent Quality', emoji: '⭐', color: 'bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100', rating: 5 },
    { id: 'fresh', label: 'Very Fresh', emoji: '💚', color: 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100', rating: 5 },
    { id: 'recommended', label: 'Highly Recommended', emoji: '👍', color: 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100', rating: 5 }
  ],
  neutral: [
    { id: 'okay', label: 'It\'s Okay', emoji: '😐', color: 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100', rating: 3 },
    { id: 'average', label: 'Average Quality', emoji: '👌', color: 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100', rating: 3 },
    { id: 'acceptable', label: 'Acceptable', emoji: '🤷', color: 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100', rating: 3 }
  ],
  negative: [
    { id: 'poor', label: 'Poor Quality', emoji: '😞', color: 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100', rating: 2 },
    { id: 'notfresh', label: 'Not Fresh', emoji: '🥀', color: 'bg-orange-50 border-orange-300 text-orange-700 hover:bg-orange-100', rating: 2 },
    { id: 'disappointed', label: 'Disappointed', emoji: '👎', color: 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100', rating: 1 }
  ]
};

export default function ReviewSection({ orderId, products }: ReviewSectionProps) {
  const [reviewData, setReviewData] = useState<ReviewData>({});
  const [existingReviews, setExistingReviews] = useState<{ [productId: string]: any }>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogState, setDialogState] = useState<{
    success: boolean;
    message: string;
  }>({ success: false, message: '' });

  // Fetch existing reviews on mount
  useEffect(() => {
    const fetchExistingReviews = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/buyer/orders/${orderId}/reviews`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const reviewsMap: { [productId: string]: any } = {};
            data.data.forEach((review: any) => {
              reviewsMap[review.productId] = review;
            });
            setExistingReviews(reviewsMap);
          }
        }
      } catch (error) {
        console.error('Failed to fetch existing reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExistingReviews();
  }, [orderId]);

  const handleRatingClick = (productId: string, rating: number) => {
    setReviewData(prev => ({
      ...prev,
      [productId]: {
        rating,
        title: '', // Clear title when rating changes
        comment: '', // Clear comment when rating changes
        quickReview: undefined // Clear quick review selection
      }
    }));
  };

  const handleQuickReview = (productId: string, quickReviewId: string) => {
    // Find option in all categories
    const allOptions = [...quickReviewOptions.positive, ...quickReviewOptions.neutral, ...quickReviewOptions.negative];
    const option = allOptions.find(opt => opt.id === quickReviewId);
    if (!option) return;

    setReviewData(prev => ({
      ...prev,
      [productId]: {
        rating: option.rating, // Use the rating from the quick review option
        title: option.label,
        comment: `${option.label}! ${option.emoji}`, // Always update comment when quick review changes
        quickReview: quickReviewId
      }
    }));
  };

  const getQuickReviewOptionsForRating = (rating: number) => {
    if (rating >= 4) return quickReviewOptions.positive;
    if (rating === 3) return quickReviewOptions.neutral;
    if (rating <= 2 && rating > 0) return quickReviewOptions.negative;
    return quickReviewOptions.positive; // Default to positive if no rating yet
  };

  const handleInputChange = (productId: string, field: 'title' | 'comment', value: string) => {
    setReviewData(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        rating: prev[productId]?.rating || 0,
        [field]: value,
        title: prev[productId]?.title || '',
        comment: prev[productId]?.comment || ''
      }
    }));
  };

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimensions for review images
          const maxWidth = 1920;
          const maxHeight = 1920;
          
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Canvas to Blob conversion failed'));
              }
            },
            'image/jpeg',
            0.85 // 85% quality - good balance between quality and size
          );
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleImageUpload = async (productId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;

    const review = reviewData[productId] || { rating: 0, title: '', comment: '', images: [] };
    const currentImages = review.images || [];

    // Max 5 images
    if (currentImages.length + files.length > 5) {
      setDialogState({
        success: false,
        message: 'You can only upload up to 5 images per review.'
      });
      setShowDialog(true);
      return;
    }

    // Validate file types and sizes, then compress
    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        setDialogState({
          success: false,
          message: 'Please upload only image files.'
        });
        setShowDialog(true);
        return;
      }
      // Allow images up to 50MB on client, but bypass heavy client-side compression for
      // HEIC files or files larger than 10MB to avoid OOM in mobile browsers.
      const CLIENT_MAX = 50 * 1024 * 1024; // 50MB client-side cap
      const SKIP_COMPRESSION_THRESHOLD = 10 * 1024 * 1024; // 10MB
      const lowerName = (file.name || '').toLowerCase();
      const isHeic = lowerName.endsWith('.heic') || lowerName.endsWith('.heif');
      if (file.size > CLIENT_MAX) {
        setDialogState({
          success: false,
          message: 'Each image must be less than 50MB.'
        });
        setShowDialog(true);
        return;
      }

      // If file is HEIC/HEIF or large, skip client compression and upload original file.
      if (isHeic || file.size >= SKIP_COMPRESSION_THRESHOLD) {
        validFiles.push(file);
      } else {
        // Compress image before adding
        try {
          const compressedFile = await compressImage(file);
          validFiles.push(compressedFile);
        } catch (error) {
          console.error('Image compression failed:', error);
          validFiles.push(file); // Use original if compression fails
        }
      }
    }

    setReviewData(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        rating: prev[productId]?.rating || 0,
        title: prev[productId]?.title || '',
        comment: prev[productId]?.comment || '',
        images: [...currentImages, ...validFiles]
      }
    }));
  };

  const removeImage = (productId: string, index: number) => {
    setReviewData(prev => {
      const review = prev[productId];
      if (!review || !review.images) return prev;

      const newImages = review.images.filter((_, i) => i !== index);
      return {
        ...prev,
        [productId]: {
          ...review,
          images: newImages
        }
      };
    });
  };

  const handleSubmit = async (productId: string, productName: string) => {
    const review = reviewData[productId];
    
    if (!review || !review.rating) {
      setDialogState({
        success: false,
        message: 'Please select a rating before submitting.'
      });
      setShowDialog(true);
      return;
    }

    if (!review.comment || review.comment.trim().length < 10) {
      setDialogState({
        success: false,
        message: 'Please write a review with at least 10 characters.'
      });
      setShowDialog(true);
      return;
    }

    try {
      setSubmitting(true);
      
      // Upload images first if any
      let imageUrls: string[] = [];
      if (review.images && review.images.length > 0) {
        setUploadingImages(true);
        const formData = new FormData();
        review.images.forEach((image) => {
          // Preserve original filename when appending
          formData.append('images', image, (image as File).name || `image-${Date.now()}`);
        });
        formData.append('folder', 'reviews');

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          credentials: 'include',
          body: formData
        });

        const uploadData = await uploadResponse.json();
        if (uploadResponse.ok && uploadData.success) {
          imageUrls = uploadData.urls;
        } else {
          throw new Error('Failed to upload images');
        }
        setUploadingImages(false);
      }
      
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          orderId,
          productId,
          rating: review.rating,
          title: review.title || undefined,
          comment: review.comment,
          images: imageUrls,
          verified: true
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setDialogState({
          success: true,
          message: `Thank you for reviewing ${productName}! Your feedback helps other buyers.`
        });
        setShowDialog(true);
        
        // Mark this product as reviewed with the submitted data
        setExistingReviews(prev => ({
          ...prev,
          [productId]: {
            _id: data.data.reviewId,
            productId: productId,
            rating: review.rating,
            title: review.title || '',
            comment: review.comment,
            images: imageUrls,
            createdAt: new Date().toISOString()
          }
        }));
        
        // Clear the review data for this product
        setReviewData(prev => {
          const newData = { ...prev };
          delete newData[productId];
          return newData;
        });
      } else {
        throw new Error(data.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      setDialogState({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to submit review. Please try again.'
      });
      setShowDialog(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="flex items-center justify-center py-12">
            <LoadingDots size="md" color="#4A7C59" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-6 h-6 text-[#4A7C59]" />
          <h2 className="text-2xl font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Write a Review
          </h2>
        </div>
        <p className="text-gray-600 mb-8" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Share your experience with the products you received
        </p>
        
        <div className="space-y-8">
          {products.map((product) => {
            const review = reviewData[product.productId] || { rating: 0, title: '', comment: '', quickReview: '' };
            const existingReview = existingReviews[product.productId];
            const hasReview = !!existingReview;
            
            return (
              <div key={product.productId} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                {/* Product Info */}
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-50 to-green-100 rounded-lg overflow-hidden flex-shrink-0">
                    {product.image ? (
                      <img 
                        src={product.image} 
                        alt={product.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-10 h-10 text-[#4A7C59]" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900 text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {product.productName}
                      </h3>
                      {hasReview && (
                        <span className="bg-green-100 text-green-800 text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Reviewed
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {product.quantity} {product.unit} • {product.category}
                    </p>
                  </div>
                </div>
                
                {hasReview ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Review Submitted!
                    </h3>
                    <p className="text-gray-600 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Thank you for your feedback on {product.productName}
                    </p>
                    <div className="flex items-center justify-center gap-1 mt-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${
                            star <= existingReview.rating
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {existingReview.rating}/5 stars
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                {/* Rating */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Rating <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingClick(product.productId, star)}
                        className="group p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-10 h-10 transition-colors ${
                            star <= review.rating
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300 group-hover:text-yellow-200'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  {review.rating > 0 && (
                    <p className="text-sm text-gray-600 mt-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      You rated this product {review.rating} out of 5 stars
                    </p>
                  )}
                </div>

                {/* Quick Review Options - Shows based on rating */}
                {review.rating > 0 && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Quick Review (Optional)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {getQuickReviewOptionsForRating(review.rating).map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => handleQuickReview(product.productId, option.id)}
                          className={`flex items-center gap-2 px-4 py-2 border-2 rounded-lg font-medium text-sm transition-all ${
                            review.quickReview === option.id
                              ? 'ring-2 ring-[#4A7C59] ring-offset-2'
                              : ''
                          } ${option.color}`}
                          style={{ fontFamily: 'Poppins, sans-serif' }}
                        >
                          <span className="text-lg">{option.emoji}</span>
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Review Title */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Review Title (Optional)
                  </label>
                  <input
                    type="text"
                    maxLength={200}
                    value={review.title}
                    onChange={(e) => handleInputChange(product.productId, 'title', e.target.value)}
                    placeholder="e.g., Fresh and delicious!"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent transition-all"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  />
                  <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {review.title.length}/200 characters
                  </p>
                </div>
                
                {/* Review Comment */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Your Review <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={6}
                    maxLength={2000}
                    value={review.comment}
                    onChange={(e) => handleInputChange(product.productId, 'comment', e.target.value)}
                    placeholder="Tell us about your experience with this product..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent resize-none transition-all"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  />
                  <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {review.comment.length}/2000 characters • Minimum 10 characters
                  </p>
                </div>

                {/* Image Upload */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Add Photos (Optional)
                  </label>
                  <div className="space-y-3">
                    {/* Upload Button */}
                    <label className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#4A7C59] hover:bg-green-50 transition-colors cursor-pointer">
                      <Upload className="w-5 h-5 text-gray-500" />
                      <span className="text-gray-600 font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Upload Images
                      </span>
                      <input
                        type="file"
                        accept="image/*,.heic,.heif"
                        multiple
                        className="hidden"
                        onChange={(e) => handleImageUpload(product.productId, e.target.files)}
                      />
                    </label>
                    
                    {/* Image Previews */}
                    {review.images && review.images.length > 0 && (
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {review.images.map((image, index) => (
                          <div key={index} className="relative group aspect-square">
                            <img
                              src={URL.createObjectURL(image)}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-full object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(product.productId, index)}
                              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {review.images ? review.images.length : 0}/5 images • Max 10MB each
                    </p>
                  </div>
                </div>
                
                {/* Submit Button */}
                <button
                  type="button"
                  onClick={() => handleSubmit(product.productId, product.productName)}
                  disabled={submitting || uploadingImages || !review.rating || review.comment.length < 10}
                  className="w-full bg-[#4A7C59] hover:bg-[#3d6849] text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  {submitting || uploadingImages ? (
                    <>
                      <LoadingDots size="sm" color="#ffffff" />
                      {uploadingImages ? 'Uploading images...' : 'Submitting review...'}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Submit Review
                    </>
                  )}
                </button>
                </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDialog(false)}
          ></div>
          
          {/* Dialog */}
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center gap-4">
              {/* Icon */}
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                dialogState.success ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {dialogState.success ? (
                  <CheckCircle className="w-10 h-10 text-green-600" />
                ) : (
                  <XCircle className="w-10 h-10 text-red-600" />
                )}
              </div>
              
              {/* Title */}
              <h3 className="text-xl font-semibold text-gray-900 text-center" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {dialogState.success ? 'Review Submitted!' : 'Oops!'}
              </h3>
              
              {/* Message */}
              <p className="text-gray-600 text-center" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {dialogState.message}
              </p>
              
              {/* Button */}
              <button
                onClick={() => setShowDialog(false)}
                className="w-full bg-[#4A7C59] hover:bg-[#3d6849] text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

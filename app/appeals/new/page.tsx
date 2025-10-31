'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, FileText, Send, ImagePlus, X } from 'lucide-react';
import Image from 'next/image';

export default function NewAppealPage() {
  const router = useRouter();
  const { user } = useAuth();
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const appealType = searchParams.get('type') || 'suspension';
  const productId = searchParams.get('productId');
  const productName = searchParams.get('productName');
  
  const [formData, setFormData] = useState({
    subject: productName ? `Appeal for product: ${productName}` : '',
    explanation: ''
  });
  
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Compress image before upload
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = document.createElement('img');
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Max dimensions (resize if larger)
          const MAX_WIDTH = 1920;
          const MAX_HEIGHT = 1920;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Convert to blob with compression (0.85 quality = good balance)
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Compression failed'));
              }
            },
            'image/jpeg',
            0.85
          );
        };
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Limit to 5 images total
    if (images.length + files.length > 5) {
      setError('You can upload a maximum of 5 images');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const uploadedUrls: string[] = [];
      let uploadErrors: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          uploadErrors.push(`${file.name}: Only image files are allowed`);
          continue;
        }

        // Validate file size BEFORE compression (max 25MB original)
        if (file.size > 25 * 1024 * 1024) {
          uploadErrors.push(`${file.name}: File must be less than 25MB`);
          continue;
        }

        try {
          // Compress image (will reduce to ~200-500KB typically)
          const compressedFile = await compressImage(file);

          const formData = new FormData();
          formData.append('file', compressedFile);
          formData.append('folder', 'appeals');

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to upload image');
          }

          const data = await response.json();
          uploadedUrls.push(data.url);
        } catch (fileError: any) {
          uploadErrors.push(`${file.name}: ${fileError.message}`);
        }
      }

      if (uploadedUrls.length > 0) {
        setImages(prev => [...prev, ...uploadedUrls]);
      }

      if (uploadErrors.length > 0) {
        setError(`Some files failed to upload:\n${uploadErrors.join('\n')}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload images');
    } finally {
      setUploading(false);
      // Reset file input
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Prepare evidence array from uploaded images
      const evidence = images.map(url => ({
        type: 'image',
        content: url,
        description: 'Supporting evidence'
      }));

      const requestBody: any = {
        ...formData,
        evidence,
        appealType
      };

      // Add product info for listing_removal appeals
      if (appealType === 'listing_removal' && productId) {
        requestBody.productId = productId;
        requestBody.productName = productName;
      }

      const response = await fetch('/api/appeals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit appeal');
      }

      setSuccess(true);
      
      // Redirect to profile page after 2 seconds
      setTimeout(() => {
        router.push('/my-profile');
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'An error occurred while submitting your appeal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // Only check suspension status for non-product appeals
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2 font-poppins">
            Please Log In
          </h2>
          <p className="text-gray-600 mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
            You must be logged in to submit an appeal.
          </p>
          <Button onClick={() => router.push('/auth/login')} className="w-full font-poppins">
            Log In
          </Button>
        </div>
      </div>
    );
  }

  // For account suspension appeals, check if user is actually suspended
  if (appealType !== 'listing_removal' && user.status !== 'suspended') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2 font-poppins">
            No Appeal Needed
          </h2>
          <p className="text-gray-600 mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Your account is not currently suspended. You can only submit an account appeal if your account has been suspended.
          </p>
          <Button onClick={() => router.push('/home')} className="w-full font-poppins">
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-lg w-full text-center">
          {/* Success Icon */}
          <div className="mb-6">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-12 w-12 md:h-14 md:w-14 text-green-600" strokeWidth={2.5} />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 font-poppins">
            Appeal Submitted Successfully!
          </h2>

          {/* Description */}
          <div className="space-y-3 mb-8" style={{ fontFamily: 'Poppins, sans-serif' }}>
            <p className="text-base md:text-lg text-gray-700 leading-relaxed">
              Your {appealType === 'listing_removal' ? 'product appeal' : 'account appeal'} has been received and will be reviewed by our team within{' '}
              <span className="font-semibold text-green-700">24-48 hours</span>.
            </p>
            <p className="text-sm md:text-base text-gray-600">
              You will be notified via email about the outcome.
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
            <p className="text-sm text-green-800">
              <strong>What's next?</strong> Our team will carefully review your {appealType === 'listing_removal' ? 'product listing appeal' : 'appeal'} and supporting evidence. 
              Check your email regularly for updates.
            </p>
          </div>

          {/* Button */}
          <Button 
            onClick={() => router.push(appealType === 'listing_removal' ? '/seller/products' : '/my-profile')} 
            className="w-full bg-green-600 hover:bg-green-700 text-white font-poppins py-6 text-base md:text-lg rounded-lg shadow-lg hover:shadow-xl transition-all"
          >
            {appealType === 'listing_removal' ? 'Go to My Products' : 'Go to My Profile'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-8 w-8 text-[#40613D]" />
            <h1 className="text-3xl font-bold text-gray-800 font-poppins">
              {appealType === 'listing_removal' ? 'Appeal Product Takedown' : 'Submit Account Appeal'}
            </h1>
          </div>
          <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {appealType === 'listing_removal' 
              ? 'Use this form to appeal the takedown of your product listing. Explain why your product should be restored.'
              : 'Use this form to appeal your account suspension. Please provide a detailed explanation of why you believe your account should be restored.'}
          </p>
        </div>

        {/* Suspension Info or Product Info */}
        {appealType === 'listing_removal' && productName ? (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>
            <h3 className="font-semibold text-blue-800 mb-2">Product Takedown Details</h3>
            <p className="text-sm text-blue-700">
              <strong>Product:</strong> {productName}
            </p>
            <p className="text-sm text-blue-700 mt-1">
              <strong>Status:</strong> Deactivated by Administrator
            </p>
            <p className="text-sm text-blue-600 mt-2">
              Your product has been taken down. Please explain why it should be restored and provide any supporting evidence.
            </p>
          </div>
        ) : (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>
            <h3 className="font-semibold text-red-800 mb-2">Current Suspension Details</h3>
            <p className="text-sm text-red-700">
              <strong>Reason:</strong> {user.suspendReason || 'No specific reason provided'}
            </p>
            {user.suspendedAt && (
              <p className="text-sm text-red-700 mt-1">
                <strong>Suspended on:</strong>{' '}
                {new Date(user.suspendedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            )}
          </div>
        )}

        {/* Appeal Form */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Subject (Optional) */}
            <div style={{ fontFamily: 'Poppins, sans-serif' }}>
              <Label htmlFor="subject" className="text-gray-700 font-medium">
                Subject (Optional)
              </Label>
              <Input
                id="subject"
                name="subject"
                type="text"
                placeholder="Brief summary of your appeal"
                value={formData.subject}
                onChange={handleChange}
                maxLength={200}
                className="mt-2"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional: A brief one-line summary
              </p>
            </div>

            {/* Explanation (Required) */}
            <div style={{ fontFamily: 'Poppins, sans-serif' }}>
              <Label htmlFor="explanation" className="text-gray-700 font-medium">
                Explanation <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="explanation"
                name="explanation"
                placeholder={appealType === 'listing_removal' 
                  ? "Please explain why your product listing should be restored. Provide details about the product, why it was incorrectly taken down, and any evidence that supports your case..."
                  : "Please explain why you believe your account should be restored. Include any relevant details, context, or evidence that supports your case..."}
                value={formData.explanation}
                onChange={handleChange}
                required
                minLength={20}
                maxLength={2000}
                rows={10}
                className="mt-2 resize-none"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Minimum 20 characters required</span>
                <span>{formData.explanation.length} / 2000</span>
              </div>
            </div>

            {/* Supporting Evidence (Images) */}
            <div style={{ fontFamily: 'Poppins, sans-serif' }}>
              <Label className="text-gray-700 font-medium">
                Supporting Evidence (Optional)
              </Label>
              <p className="text-xs text-gray-500 mt-1 mb-3">
                Upload images that support your appeal (e.g., screenshots, receipts). Max 5 images, 25MB each. Images will be automatically compressed for faster upload.
              </p>

              {/* Image Preview Grid */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-3">
                  {images.map((url, index) => (
                    <div key={index} className="relative group">
                      <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                        <Image
                          src={url}
                          alt={`Evidence ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Remove image"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button */}
              {images.length < 5 && (
                <div>
                  <input
                    type="file"
                    id="evidence-upload"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <label htmlFor="evidence-upload">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-dashed border-2 h-24 hover:bg-gray-50 cursor-pointer"
                      disabled={uploading}
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById('evidence-upload')?.click();
                      }}
                    >
                      <div className="flex flex-col items-center gap-2">
                        {uploading ? (
                          <>
                            <div className="flex gap-1">
                              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                            <span className="text-sm">Uploading...</span>
                          </>
                        ) : (
                          <>
                            <ImagePlus className="h-8 w-8 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              Click to upload images ({images.length}/5)
                            </span>
                          </>
                        )}
                      </div>
                    </Button>
                  </label>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <p className="text-sm text-red-800 font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>{error}</p>
                </div>
              </div>
            )}

            {/* Guidelines */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
              <h4 className="font-medium text-gray-800 mb-2">Appeal Guidelines</h4>
              <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                <li>Be honest and provide complete information</li>
                <li>Explain what happened from your perspective</li>
                <li>Acknowledge any mistakes if applicable</li>
                <li>Describe what steps you'll take to prevent future issues</li>
                <li>Appeals are typically reviewed within 24-48 hours</li>
              </ul>
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isSubmitting || uploading || formData.explanation.length < 20}
                className="flex-1 bg-[#40613D] hover:bg-[#355230] font-poppins"
              >
                {isSubmitting ? (
                  <>
                    <div className="flex gap-1 mr-2">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Appeal
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
                className="font-poppins"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

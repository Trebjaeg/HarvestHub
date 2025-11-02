'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useRef, useEffect } from 'react';
import { Upload, X } from 'lucide-react';
import Image from 'next/image';

interface Product {
  _id?: string;
  name: string;
  category: string;
  unit: string;
  status: string;
  description: string;
  price: number;
  stock: number;
  lowStockAlert: number;
  images: string[];
  harvestDate?: string;
  sku?: string;
}

interface AddEditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  onSave: (product: Product) => void;
  verificationError?: string;
}

export default function AddEditProductModal({ isOpen, onClose, product, onSave, verificationError }: AddEditProductModalProps) {
  
  const [formData, setFormData] = useState<Product>({
    name: '',
    category: '',
    unit: 'kg',
    status: 'Available',
    description: '',
    price: 0,
    stock: 0,
    lowStockAlert: 10,
    images: [],
    harvestDate: '',
    sku: ''
  });

  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [autoGenerateSKU, setAutoGenerateSKU] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update form data when product prop changes
  useEffect(() => {
    if (product) {
      setFormData({
        ...product,
        harvestDate: product.harvestDate || '',
        sku: product.sku || ''
      });
      setPreviewImages(product.images || []);
      setAutoGenerateSKU(!product.sku); // If product has SKU, disable auto-generation
    } else {
      setFormData({
        name: '',
        category: '',
        unit: 'kg',
        status: 'Available',
        description: '',
        price: '' as any,
        stock: '' as any,
        lowStockAlert: 10,
        images: [],
        harvestDate: '',
        sku: ''
      });
      setPreviewImages([]);
      setAutoGenerateSKU(true);
    }
  }, [product]);

  const categories = [
    "Leafy Greens",
    "Root Crops", 
    "Fruits",
    "Spices & Aromatics",
    "Eggplant & Gourds",
    "Grains & Rice"
  ];

  const units = ["kg", "piece", "bundle", "pack"];
  const statusOptions = ["Available", "Unavailable"];

  const handleInputChange = (field: keyof Product, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Clear previous errors
    setUploadError('');
    setUploading(true);
    const uploadedUrls: string[] = [];
    const failedFiles: string[] = [];

    try {
      const totalFiles = files.length;
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Uploading ${i + 1} of ${totalFiles}...`);
        
        // Validate file type - be permissive for mobile camera uploads
        const lowerName = file.name.toLowerCase();
        const isImageFile = file.type.startsWith('image/') || 
                           lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') ||
                           lowerName.endsWith('.png') || lowerName.endsWith('.webp') ||
                           lowerName.endsWith('.heic') || lowerName.endsWith('.heif');
        
        if (!isImageFile) {
          failedFiles.push(`${file.name}: Not an image file`);
          continue;
        }

        // Validate file size (50MB limit for reliable upload)
        if (file.size > 50 * 1024 * 1024) {
          failedFiles.push(`${file.name}: File too large (max 50MB)`);
          continue;
        }

        try {
          // Upload via backend API with proper streaming
            const formData = new FormData();
            // Preserve original filename when appending
            formData.append('file', file, file.name);
          formData.append('folder', 'products');

          const response = await fetch('/api/upload/product-image', {
            method: 'POST',
            body: formData,
            credentials: 'include'
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
            throw new Error(errorData.message || errorData.error || `Upload failed (${response.status})`);
          }

          const data = await response.json();
          
          if (data.url) {
            uploadedUrls.push(data.url);
          } else {
            throw new Error(data.message || data.error || 'No URL returned from upload');
          }
        } catch (fileError: any) {
          console.error('Upload error for file:', file.name, fileError);
          const errorMsg = fileError.message || 'Network error';
          failedFiles.push(`${file.name}: ${errorMsg}`);
        }
      }

      // Add successfully uploaded URLs to images
      if (uploadedUrls.length > 0) {
        setPreviewImages(prev => [...prev, ...uploadedUrls]);
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...uploadedUrls]
        }));
      }

      // Show results
      if (failedFiles.length > 0) {
        setUploadError(`Failed to upload ${failedFiles.length} file(s):\n${failedFiles.join('\n')}`);
      }
      
      if (uploadedUrls.length > 0) {
        setUploadProgress(`✓ Successfully uploaded ${uploadedUrls.length} image(s)`);
        setTimeout(() => setUploadProgress(''), 3000);
      } else if (failedFiles.length > 0) {
        setUploadProgress('');
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      setUploadError('An unexpected error occurred while uploading images. Please try again.');
    } finally {
      setUploading(false);
      if (!uploadedUrls.length && !failedFiles.length) {
        setUploadProgress('');
      }
    }
  };

  const removeImage = (index: number) => {
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    // Clear previous errors
    const errors: Record<string, string> = {};

    // Validate required fields
    if (!formData.name || formData.name.trim() === '') {
      errors.name = 'Product name is required';
    } else if (formData.name.length > 100) {
      errors.name = 'Product name cannot exceed 100 characters';
    }

    if (!formData.category) {
      errors.category = 'Please select a category';
    }

    if (!formData.unit) {
      errors.unit = 'Please select a unit';
    }

    // Check if price is empty or invalid
    if (!formData.price || (formData.price as any) === '' || formData.price <= 0) {
      errors.price = 'Please enter a valid price greater than 0';
    }

    // Check if stock is empty or invalid
    if (formData.stock === undefined || formData.stock === null || (formData.stock as any) === '' || formData.stock < 0) {
      errors.stock = 'Please enter a valid stock quantity (0 or more)';
    }

    if (formData.lowStockAlert !== undefined && (formData.lowStockAlert as any) !== '' && formData.lowStockAlert < 0) {
      errors.lowStockAlert = 'Low stock alert must be 0 or greater';
    }

    if (formData.description && formData.description.length > 500) {
      errors.description = 'Description cannot exceed 500 characters';
    }

    // Validate harvest date is not in the future
    if (formData.harvestDate) {
      const selectedDate = new Date(formData.harvestDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day for fair comparison
      
      if (selectedDate > today) {
        errors.harvestDate = 'Harvest date cannot be in the future';
      }
    }

    // Validate SKU format if manually entered
    if (!autoGenerateSKU && formData.sku) {
      const sku = formData.sku.trim();
      if (sku.length < 8 || sku.length > 50) {
        errors.sku = 'SKU must be between 8 and 50 characters';
      } else if (!sku.includes('-')) {
        errors.sku = 'SKU must contain at least one dash (e.g., VEG-F123-0001)';
      } else if (!/^[A-Z0-9-]+$/.test(sku)) {
        errors.sku = 'SKU can only contain uppercase letters, numbers, and dashes';
      }
    }

    if (formData.images.length === 0) {
      errors.images = 'Please upload at least one product image';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      // Scroll to first error
      setTimeout(() => {
        const firstError = document.querySelector('.border-red-500');
        firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return;
    }

    setValidationErrors({});
    onSave(formData);
    
    // Reset form after successful save
    resetForm();
    onClose();
  };
  
  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      unit: 'kg',
      status: 'Available',
      description: '',
      price: 0,
      stock: 0,
      lowStockAlert: 10,
      images: [],
      harvestDate: '',
      sku: ''
    });
    setPreviewImages([]);
    setValidationErrors({});
    setAutoGenerateSKU(true);
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-[95vw] sm:w-full max-w-4xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-3 sm:p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-xl max-h-[90vh] overflow-y-auto" style={{ fontFamily: 'Poppins, sans-serif' }}>
        <DialogHeader className="pb-3 sm:pb-6 border-b border-gray-200">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-[#103C2E] text-center">
            {product ? 'Edit Product' : 'Add New Product'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8">
          {/* Product Images Section */}
          <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <h3 className="text-lg font-semibold text-[#103C2E] border-b border-gray-200 pb-2 font-poppins">
              Product Images
            </h3>
            <div className="bg-gray-50 p-4 sm:p-6 rounded-xl border border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Main Image Upload Area */}
                <div 
                  className={`w-full sm:w-48 h-48 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center transition-all duration-300 bg-white ${
                    verificationError ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-green-500'
                  }`}
                  onClick={() => !verificationError && fileInputRef.current?.click()}
                >
                  {previewImages.length > 0 ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={previewImages[0]}
                        alt="Product preview"
                        fill
                        className="object-cover rounded-xl"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!verificationError) removeImage(0);
                        }}
                        disabled={!!verificationError}
                        className={`absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors duration-200 ${verificationError ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center px-4">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 font-medium mb-1 font-poppins text-sm sm:text-base">Upload Product Image</p>
                      <p className="text-xs sm:text-sm text-gray-500">PNG, JPG, WEBP, HEIC up to 50MB</p>
                      <p className="text-xs text-gray-400 mt-1">Tap to take photo or choose file</p>
                    </div>
                  )}
                </div>

                {/* Additional Images */}
                <div className="flex-1 w-full">
                  <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-3">
                    {previewImages.slice(1).map((image, index) => (
                      <div key={index + 1} className="relative w-full aspect-square border border-gray-200 rounded-lg overflow-hidden">
                        <Image
                          src={image}
                          alt={`Product preview ${index + 2}`}
                          fill
                          className="object-cover"
                        />
                        <button
                          onClick={() => !verificationError && removeImage(index + 1)}
                          disabled={!!verificationError}
                          className={`absolute -top-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors duration-200 ${verificationError ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  {previewImages.length > 0 && previewImages.length < 5 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-3 border-green-500 text-green-600 hover:bg-green-50"
                      disabled={uploading || !!verificationError}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? 'Uploading...' : 'Add More Images'}
                    </Button>
                  )}
                </div>
              </div>

              {/* Upload Progress */}
              {uploadProgress && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 mt-0.5">
                      {uploading ? (
                        <svg className="animate-spin w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <p className="text-sm text-blue-700 font-poppins">{uploadProgress}</p>
                  </div>
                </div>
              )}

              {/* Upload Error */}
              {uploadError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-red-700 font-poppins whitespace-pre-line">{uploadError}</p>
                      <button 
                        onClick={() => setUploadError('')}
                        className="text-xs text-red-600 hover:text-red-800 mt-2 underline"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Validation Error */}
              {validationErrors.images && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-sm text-red-700 font-poppins">{validationErrors.images}</p>
                  </div>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.heic,.heif"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Basic Information Section */}
          <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-lg font-semibold text-[#103C2E] border-b border-gray-200 pb-2 font-poppins">
              Basic Information
            </h3>
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-6">
              
              {/* Product Name and Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 font-poppins">
                    Product Name *
                  </label>
                  <Input
                    placeholder="e.g., Fresh Organic Tomatoes"
                    value={formData.name}
                    onChange={(e) => {
                      handleInputChange('name', e.target.value);
                      if (validationErrors.name) {
                        setValidationErrors(prev => ({ ...prev, name: '' }));
                      }
                    }}
                    disabled={!!verificationError}
                    className={`bg-white transition-all duration-200 font-poppins ${
                      validationErrors.name
                        ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300 focus:border-green-500 focus:ring-green-500"
                    } ${verificationError ? "opacity-50 cursor-not-allowed" : ""}`}
                  />
                  {validationErrors.name && (
                    <div className="flex items-center space-x-1 mt-1">
                      <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm text-red-500">{validationErrors.name}</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 font-poppins">
                    Category *
                  </label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => {
                      handleInputChange('category', value);
                      if (validationErrors.category) {
                        setValidationErrors(prev => ({ ...prev, category: '' }));
                      }
                    }}
                    disabled={!!verificationError}
                  >
                    <SelectTrigger className={`bg-white transition-all duration-200 font-poppins ${
                      validationErrors.category
                        ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300 focus:border-green-500 focus:ring-green-500"
                    } ${verificationError ? "opacity-50 cursor-not-allowed" : ""}`}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="font-poppins">
                      {categories.map(category => (
                        <SelectItem key={category} value={category} className="font-poppins">{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validationErrors.category && (
                    <div className="flex items-center space-x-1 mt-1">
                      <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm text-red-500">{validationErrors.category}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 font-poppins">
                  Description
                </label>
                <Textarea
                  placeholder="Describe your product, its quality, and benefits..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  disabled={!!verificationError}
                  className={`bg-white border-gray-300 focus:border-green-500 focus:ring-green-500 transition-all duration-200 font-poppins ${verificationError ? "opacity-50 cursor-not-allowed" : ""}`}
                />
              </div>

              {/* Harvest Date and Unit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 font-poppins">
                    Harvest Date (Optional)
                  </label>
                  <Input
                    type="date"
                    value={formData.harvestDate}
                    onChange={(e) => handleInputChange('harvestDate', e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    disabled={!!verificationError}
                    className={`bg-white border-gray-300 focus:border-green-500 focus:ring-green-500 transition-all duration-200 ${verificationError ? "opacity-50 cursor-not-allowed" : ""} ${validationErrors.harvestDate ? "border-red-500" : ""}`}
                  />
                  {validationErrors.harvestDate && (
                    <p className="text-xs text-red-500 mt-1">{validationErrors.harvestDate}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 font-poppins">
                    Unit *
                  </label>
                  <Select 
                    value={formData.unit} 
                    onValueChange={(value) => handleInputChange('unit', value)}
                    disabled={!!verificationError}
                  >
                    <SelectTrigger className={`bg-white border-gray-300 focus:border-green-500 focus:ring-green-500 transition-all duration-200 font-poppins ${verificationError ? "opacity-50 cursor-not-allowed" : ""}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="font-poppins">
                      {units.map(unit => (
                        <SelectItem key={unit} value={unit} className="font-poppins">{unit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & Inventory Section */}
          <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <h3 className="text-lg font-semibold text-[#103C2E] border-b border-gray-200 pb-2 font-poppins">
              Pricing & Inventory
            </h3>
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-6">
              
              {/* Price and Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 font-poppins">
                    Price (₱) *
                  </label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => {
                      const value = e.target.value === '' ? '' : parseFloat(e.target.value);
                      handleInputChange('price', value);
                      if (validationErrors.price) {
                        setValidationErrors(prev => ({ ...prev, price: '' }));
                      }
                    }}
                    placeholder="0.00"
                    disabled={!!verificationError}
                    className={`bg-white transition-all duration-200 font-poppins [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                      validationErrors.price
                        ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300 focus:border-green-500 focus:ring-green-500"
                    } ${verificationError ? "opacity-50 cursor-not-allowed" : ""}`}
                    min="0"
                    step="0.01"
                  />
                  {validationErrors.price && (
                    <div className="flex items-center space-x-1 mt-1">
                      <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm text-red-500">{validationErrors.price}</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 font-poppins">
                    Status
                  </label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => handleInputChange('status', value)}
                    disabled={!!verificationError}
                  >
                    <SelectTrigger className={`bg-white border-gray-300 focus:border-green-500 focus:ring-green-500 transition-all duration-200 font-poppins ${verificationError ? "opacity-50 cursor-not-allowed" : ""}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="font-poppins">
                      {statusOptions.map(status => (
                        <SelectItem key={status} value={status} className="font-poppins">{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Stock and Low Stock Alert */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 font-poppins">
                    Stock Quantity *
                  </label>
                  <Input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => {
                      const value = e.target.value === '' ? '' : parseInt(e.target.value);
                      handleInputChange('stock', value);
                      if (validationErrors.stock) {
                        setValidationErrors(prev => ({ ...prev, stock: '' }));
                      }
                    }}
                    placeholder="0"
                    disabled={!!verificationError}
                    className={`bg-white transition-all duration-200 font-poppins [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                      validationErrors.stock
                        ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300 focus:border-green-500 focus:ring-green-500"
                    } ${verificationError ? "opacity-50 cursor-not-allowed" : ""}`}
                    min="0"
                  />
                  {validationErrors.stock && (
                    <div className="flex items-center space-x-1 mt-1">
                      <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm text-red-500">{validationErrors.stock}</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 font-poppins">
                    Low Stock Alert
                  </label>
                  <Input
                    type="number"
                    value={formData.lowStockAlert}
                    onChange={(e) => {
                      const value = e.target.value === '' ? '' : parseInt(e.target.value);
                      handleInputChange('lowStockAlert', value);
                    }}
                    placeholder="10"
                    disabled={!!verificationError}
                    className={`bg-white border-gray-300 focus:border-green-500 focus:ring-green-500 transition-all duration-200 font-poppins [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${verificationError ? "opacity-50 cursor-not-allowed" : ""}`}
                    min="0"
                  />
                </div>
              </div>

              {/* SKU Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 font-poppins">
                    SKU (Stock Keeping Unit)
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="autoGenerateSKU"
                      checked={autoGenerateSKU}
                      onChange={(e) => {
                        setAutoGenerateSKU(e.target.checked);
                        if (e.target.checked) {
                          handleInputChange('sku', '');
                        }
                      }}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <label htmlFor="autoGenerateSKU" className="text-xs text-gray-600 font-poppins cursor-pointer">
                      Auto-generate
                    </label>
                  </div>
                </div>
                <Input
                  type="text"
                  value={formData.sku || ''}
                  onChange={(e) => handleInputChange('sku', e.target.value.toUpperCase())}
                  placeholder={autoGenerateSKU ? "Will be auto-generated (e.g., VEG-A1B2-0001)" : "Enter custom SKU"}
                  disabled={!!verificationError || autoGenerateSKU}
                  className={`bg-white border-gray-300 focus:border-green-500 focus:ring-green-500 transition-all duration-200 font-poppins uppercase ${verificationError || autoGenerateSKU ? "opacity-50 cursor-not-allowed bg-gray-50" : ""} ${validationErrors.sku ? "border-red-500" : ""}`}
                  maxLength={50}
                />
                {validationErrors.sku && (
                  <p className="text-xs text-red-500 mt-1">{validationErrors.sku}</p>
                )}
                {!autoGenerateSKU && !validationErrors.sku && (
                  <p className="text-xs text-gray-500 mt-1">
                    Format: XXX-XXXX-XXXX (e.g., VEG-F123-0001). Must be unique.
                  </p>
                )}
                {autoGenerateSKU && (
                  <p className="text-xs text-gray-500 mt-1">
                    SKU will be automatically generated based on category and farmer ID
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Verification Error Banner */}
        {verificationError && (
          <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg animate-fade-in">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-red-800 mb-1 font-poppins">Verification Required</h4>
                <p className="text-sm text-red-700 font-poppins">{verificationError}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = '/profile'}
                  className="mt-3 border-red-500 text-red-600 hover:bg-red-50 font-poppins"
                >
                  Complete Verification
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <Button 
            variant="outline" 
            onClick={handleCancel}
            className="px-8 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            className="px-8 py-2 bg-[#103C2E] hover:bg-[#0d2e23] text-white transition-all duration-200"
            disabled={uploading || !!verificationError}
          >
            {product ? 'Update Product' : 'Save Product'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
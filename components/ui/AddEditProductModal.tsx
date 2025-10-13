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
}

interface AddEditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  onSave: (product: Product) => void;
}

export default function AddEditProductModal({ isOpen, onClose, product, onSave }: AddEditProductModalProps) {
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
    harvestDate: ''
  });

  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update form data when product prop changes
  useEffect(() => {
    if (product) {
      setFormData({
        ...product,
        harvestDate: product.harvestDate || ''
      });
      setPreviewImages(product.images || []);
    } else {
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
        harvestDate: ''
      });
      setPreviewImages([]);
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
    if (!files) return;

    setUploading(true);
    const newImages: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!file.type.startsWith('image/')) {
        alert('Please select only image files');
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        continue;
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      newImages.push(previewUrl);
    }

    setPreviewImages(prev => [...prev, ...newImages]);
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newImages]
    }));
    
    setUploading(false);
  };

  const removeImage = (index: number) => {
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    if (!formData.name || !formData.category || !formData.price || !formData.stock) {
      alert('Please fill in all required fields');
      return;
    }

    onSave(formData);
    onClose();
  };

  const handleCancel = () => {
    // Reset form
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
      harvestDate: ''
    });
    setPreviewImages([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-4xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-6 border-b border-gray-200">
          <DialogTitle className="text-2xl font-bold text-[#103C2E] text-center font-poppins">
            {product ? 'Edit Product' : 'Add New Product'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8">
          {/* Product Images Section */}
          <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <h3 className="text-lg font-semibold text-[#103C2E] border-b border-gray-200 pb-2 font-poppins">
              Product Images
            </h3>
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <div className="flex gap-4">
                {/* Main Image Upload Area */}
                <div 
                  className="w-48 h-48 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center cursor-pointer hover:border-green-500 transition-all duration-300 bg-white"
                  onClick={() => fileInputRef.current?.click()}
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
                          removeImage(0);
                        }}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors duration-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 font-medium mb-1 font-poppins">Upload Product Image</p>
                      <p className="text-sm text-gray-500">PNG, JPG up to 5MB</p>
                    </div>
                  )}
                </div>

                {/* Additional Images */}
                <div className="flex-1">
                  <div className="grid grid-cols-3 gap-3">
                    {previewImages.slice(1).map((image, index) => (
                      <div key={index + 1} className="relative w-20 h-20 border border-gray-200 rounded-lg overflow-hidden">
                        <Image
                          src={image}
                          alt={`Product preview ${index + 2}`}
                          fill
                          className="object-cover"
                        />
                        <button
                          onClick={() => removeImage(index + 1)}
                          className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors duration-200"
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
                      disabled={uploading}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Add More Images
                    </Button>
                  )}
                </div>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
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
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="bg-white border-gray-300 focus:border-green-500 focus:ring-green-500 transition-all duration-200 font-poppins"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 font-poppins">
                    Category *
                  </label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger className="bg-white border-gray-300 focus:border-green-500 focus:ring-green-500 transition-all duration-200 font-poppins">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="font-poppins">
                      {categories.map(category => (
                        <SelectItem key={category} value={category} className="font-poppins">{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  className="bg-white border-gray-300 focus:border-green-500 focus:ring-green-500 transition-all duration-200 font-poppins"
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
                    className="bg-white border-gray-300 focus:border-green-500 focus:ring-green-500 transition-all duration-200"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 font-poppins">
                    Unit *
                  </label>
                  <Select value={formData.unit} onValueChange={(value) => handleInputChange('unit', value)}>
                    <SelectTrigger className="bg-white border-gray-300 focus:border-green-500 focus:ring-green-500 transition-all duration-200 font-poppins">
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
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="bg-white border-gray-300 focus:border-green-500 focus:ring-green-500 transition-all duration-200 font-poppins"
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 font-poppins">
                    Status
                  </label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger className="bg-white border-gray-300 focus:border-green-500 focus:ring-green-500 transition-all duration-200 font-poppins">
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
                    onChange={(e) => handleInputChange('stock', parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="bg-white border-gray-300 focus:border-green-500 focus:ring-green-500 transition-all duration-200 font-poppins"
                    min="0"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 font-poppins">
                    Low Stock Alert
                  </label>
                  <Input
                    type="number"
                    value={formData.lowStockAlert}
                    onChange={(e) => handleInputChange('lowStockAlert', parseInt(e.target.value) || 0)}
                    placeholder="10"
                    className="bg-white border-gray-300 focus:border-green-500 focus:ring-green-500 transition-all duration-200 font-poppins"
                    min="0"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <Button 
            variant="outline" 
            onClick={handleCancel}
            className="px-8 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200 font-poppins"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            className="px-8 py-2 bg-green-600 hover:bg-green-700 text-white transition-all duration-200 font-poppins"
            disabled={uploading}
          >
            {product ? 'Update Product' : 'Save Product'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useRef, useEffect } from 'react';
import { Upload, X, Camera, User } from 'lucide-react';
import Image from 'next/image';

interface ProfileData {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  profileImage?: string;
  farmName?: string;
  farmDescription?: string;
}

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ProfileData | null;
  onSave: (profile: ProfileData) => void;
}

export default function EditProfileModal({ isOpen, onClose, profile, onSave }: EditProfileModalProps) {
  const [formData, setFormData] = useState<ProfileData>({
    _id: profile?._id || '',
    name: profile?.name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    profileImage: profile?.profileImage || '',
    farmName: profile?.farmName || '',
    farmDescription: profile?.farmDescription || ''
  });

  const [previewImage, setPreviewImage] = useState<string | null>(profile?.profileImage || null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Partial<ProfileData>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form data and errors when profile changes or modal opens
  useEffect(() => {
    if (profile) {
      setFormData({
        _id: profile._id,
        name: profile.name,
        email: profile.email,
        phone: profile.phone || '',
        address: profile.address || '',
        profileImage: profile.profileImage || '',
        farmName: profile.farmName || '',
        farmDescription: profile.farmDescription || ''
      });
      setPreviewImage(profile.profileImage || null);
      setErrors({});
    }
  }, [profile, isOpen]);

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    let filteredValue = value;
    
    // Special handling for phone number - only allow digits and limit to 11
    if (field === 'phone') {
      filteredValue = value.replace(/\D/g, '');
      if (filteredValue.length > 11) {
        return; // Don't update if more than 11 digits
      }
    }
    
    // Special handling for full name - only allow letters and spaces
    if (field === 'name') {
      if (!/^[a-zA-Z\s]*$/.test(value)) {
        return; // Don't update if contains invalid characters
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: filteredValue
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<ProfileData> = {};

    // Required fields validation
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (!/^[a-zA-Z\s]+$/.test(formData.name.trim())) {
      newErrors.name = 'Full name should only contain letters and spaces';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone number validation - must be exactly 11 digits
    if (formData.phone && !/^\d{11}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Phone number must be exactly 11 digits';
    }

    if (formData.farmName && formData.farmName.trim().length < 2) {
      newErrors.farmName = 'Farm name must be at least 2 characters';
    }

    if (formData.farmDescription && formData.farmDescription.trim().length < 10) {
      newErrors.farmDescription = 'Farm description must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('profileImage', file);

      const token = localStorage.getItem('hh_token') || localStorage.getItem('auth-token');
      const response = await fetch('/api/seller/upload-profile-image', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formDataUpload
      });

      if (response.ok) {
        const data = await response.json();
        setPreviewImage(data.imageUrl);
        setFormData(prev => ({ ...prev, profileImage: data.imageUrl }));
      } else {
        alert('Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image');
    } finally {
      setUploading(false);
    }
  };

  const getDefaultAvatar = (name: string) => {
    const initials = name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
    
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-purple-500',
      'bg-red-500',
      'bg-yellow-500',
      'bg-indigo-500',
      'bg-pink-500',
      'bg-teal-500'
    ];
    
    const colorIndex = name.length % colors.length;
    const bgColor = colors[colorIndex];
    
    return { initials, bgColor };
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const token = localStorage.getItem('hh_token') || localStorage.getItem('auth-token');
      const response = await fetch('/api/seller/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        onSave(data.seller);
        onClose();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile');
    }
  };

  const handleCancel = () => {
    // Reset form to original profile data
    setFormData({
      _id: profile?._id || '',
      name: profile?.name || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
      address: profile?.address || '',
      profileImage: profile?.profileImage || '',
      farmName: profile?.farmName || '',
      farmDescription: profile?.farmDescription || ''
    });
    setPreviewImage(profile?.profileImage || null);
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl w-[90vw] max-h-[90vh] overflow-y-auto bg-gray-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] duration-300">
        <DialogHeader className="pb-6 border-b border-gray-200">
          <DialogTitle className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Edit Profile
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Profile Image Section */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm transform transition-all duration-500 ease-in-out opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
            <div className="flex items-center gap-6">
              {/* Profile Avatar */}
              <div className="relative group">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100 transition-all duration-300 ease-in-out group-hover:border-green-300">
                  {previewImage ? (
                    <Image
                      src={previewImage}
                      alt={formData.name}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  ) : formData.name ? (
                    <div className={`w-full h-full flex items-center justify-center text-white text-xl font-bold ${getDefaultAvatar(formData.name).bgColor}`}>
                      {getDefaultAvatar(formData.name).initials}
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                      <User className="w-8 h-8 text-gray-500" />
                    </div>
                  )}
                </div>
                
                {/* Upload Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-green-600 hover:bg-green-700 rounded-full flex items-center justify-center text-white shadow-lg disabled:opacity-50"
                >
                  {uploading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              
              {/* Profile Info */}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Profile Photo
                </h3>
                <p className="text-gray-600 text-sm mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Update your profile photo. Recommended size: 400x400px
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="transition-all duration-200 ease-in-out transform hover:scale-105"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Upload New Photo'}
                </Button>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm transform transition-all duration-500 ease-in-out opacity-0 animate-fade-in-up" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
            <h3 className="text-lg font-semibold mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Full Name *
                </Label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Juan Dela Cruz (letters only)"
                  className={`h-11 px-4 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                    errors.name ? 'border-red-500 focus:border-red-500' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                  required
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {errors.name}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Email Address *
                </Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`h-11 px-4 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                    errors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                  required
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {errors.email}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Phone Number
                </Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="09123456789 (11 digits)"
                  className={`h-11 px-4 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                    errors.phone ? 'border-red-500 focus:border-red-500' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                  maxLength={11}
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {errors.phone}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Farm Name
                </Label>
                <Input
                  value={formData.farmName}
                  onChange={(e) => handleInputChange('farmName', e.target.value)}
                  placeholder="Green Valley Farm"
                  className={`h-11 px-4 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                    errors.farmName ? 'border-red-500 focus:border-red-500' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                />
                {errors.farmName && (
                  <p className="text-red-500 text-xs mt-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {errors.farmName}
                  </p>
                )}
              </div>
            </div>
            
            <div className="mt-6 space-y-2">
              <Label className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Address
              </Label>
              <Textarea
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Complete address including barangay, city, and province"
                className="min-h-[80px] px-4 py-3 border border-gray-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-gray-400 resize-none"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              />
            </div>
            
            <div className="mt-6 space-y-2">
              <Label className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Farm Description
              </Label>
              <Textarea
                value={formData.farmDescription}
                onChange={(e) => handleInputChange('farmDescription', e.target.value)}
                placeholder="Brief description about your farm and farming practices..."
                className={`min-h-[100px] px-4 py-3 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none ${
                  errors.farmDescription ? 'border-red-500 focus:border-red-500' : 'border-gray-300 hover:border-gray-400'
                }`}
                style={{ fontFamily: 'Poppins, sans-serif' }}
              />
              {errors.farmDescription && (
                <p className="text-red-500 text-xs mt-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {errors.farmDescription}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 transform transition-all duration-500 ease-in-out opacity-0 animate-fade-in-up" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
          <Button 
            variant="outline" 
            onClick={handleCancel}
            className="px-8 py-2.5 h-11 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200 ease-in-out transform hover:scale-105"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            className="px-8 py-2.5 h-11 bg-green-600 hover:bg-green-700 text-white transition-all duration-200 ease-in-out transform hover:scale-105"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
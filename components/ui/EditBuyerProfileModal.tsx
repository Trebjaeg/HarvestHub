'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useRef, useEffect } from 'react';
import { Upload, Camera, User } from 'lucide-react';
import Image from 'next/image';

interface BuyerProfileData {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  profileImage?: string;
}

interface EditBuyerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: BuyerProfileData | null;
  onSave: (profile: BuyerProfileData) => void;
}

export default function EditBuyerProfileModal({ isOpen, onClose, profile, onSave }: EditBuyerProfileModalProps) {
  const [formData, setFormData] = useState<BuyerProfileData>({
    _id: profile?._id || '',
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    profileImage: profile?.profileImage || ''
  });

  const [previewImage, setPreviewImage] = useState<string | null>(profile?.profileImage || null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Partial<BuyerProfileData>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form data and errors when profile changes or modal opens
  useEffect(() => {
    if (profile) {
      setFormData({
        _id: profile._id,
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone || '',
        address: profile.address || '',
        profileImage: profile.profileImage || ''
      });
      setPreviewImage(profile.profileImage || null);
      setErrors({});
    }
  }, [profile, isOpen]);

  const handleInputChange = (field: keyof BuyerProfileData, value: string) => {
    let filteredValue = value;
    
    // Special handling for phone number - only allow digits and limit to 11
    if (field === 'phone') {
      filteredValue = value.replace(/\D/g, '');
      if (filteredValue.length > 11) {
        return; // Don't update if more than 11 digits
      }
    }
    
    // Special handling for names - only allow letters and spaces
    if (field === 'firstName' || field === 'lastName') {
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
    const newErrors: Partial<BuyerProfileData> = {};

    // Required fields validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (!/^[a-zA-Z\s]+$/.test(formData.firstName.trim())) {
      newErrors.firstName = 'First name should only contain letters and spaces';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (!/^[a-zA-Z\s]+$/.test(formData.lastName.trim())) {
      newErrors.lastName = 'Last name should only contain letters and spaces';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
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
      const response = await fetch('/api/buyer/upload-profile-image', {
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

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const token = localStorage.getItem('hh_token') || localStorage.getItem('auth-token');
      const response = await fetch('/api/buyer/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        onSave(data.buyer);
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
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
      address: profile?.address || '',
      profileImage: profile?.profileImage || ''
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
            Edit Buyer Profile
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Profile Image Section */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm transform transition-all duration-500 ease-in-out opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
            <div className="flex items-center gap-6">
              {/* Profile Avatar */}
              <div className="relative group">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100 transition-all duration-300 ease-in-out group-hover:border-green-300 flex items-center justify-center">
                  {previewImage ? (
                    <Image
                      src={previewImage}
                      alt={`${formData.firstName} ${formData.lastName}`}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                      <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                      <path d="M12 10m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
                      <path d="M6.168 18.849a4 4 0 0 1 3.832 -2.849h4a4 4 0 0 1 3.834 2.855" />
                    </svg>
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
                  accept="image/*,.heic,.heif"
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
                  First Name *
                </Label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Juan (letters only)"
                  className={`h-11 px-4 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                    errors.firstName ? 'border-red-500 focus:border-red-500' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                  required
                />
                {errors.firstName && (
                  <p className="text-red-500 text-xs mt-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Last Name *
                </Label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Dela Cruz (letters only)"
                  className={`h-11 px-4 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                    errors.lastName ? 'border-red-500 focus:border-red-500' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                  required
                />
                {errors.lastName && (
                  <p className="text-red-500 text-xs mt-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {errors.lastName}
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
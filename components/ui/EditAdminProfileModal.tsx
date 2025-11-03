'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useRef, useEffect } from 'react';
import { Upload, Camera, Mail, CheckCircle, Clock } from 'lucide-react';
import Image from 'next/image';

interface AdminProfileData {
  _id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  phone?: string;
  profileImage?: string;
}

interface EditAdminProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: AdminProfileData | null;
  onSave: (profile: AdminProfileData) => void;
}

export default function EditAdminProfileModal({ isOpen, onClose, profile, onSave }: EditAdminProfileModalProps) {
  const [formData, setFormData] = useState<AdminProfileData>({
    _id: profile?._id || '',
    name: profile?.name || '',
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    email: profile?.email || '',
    role: profile?.role || '',
    status: profile?.status || '',
    phone: profile?.phone || '',
    profileImage: profile?.profileImage || ''
  });

  const [previewImage, setPreviewImage] = useState<string | null>(profile?.profileImage || null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Partial<AdminProfileData>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Email verification states
  const [emailChanged, setEmailChanged] = useState(false);
  const [verificationCodeSent, setVerificationCodeSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Reset form data and errors when profile changes or modal opens
  useEffect(() => {
    if (profile) {
      setFormData({
        _id: profile._id,
        name: profile.name,
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        role: profile.role,
        status: profile.status,
        phone: profile.phone || '',
        profileImage: profile.profileImage || ''
      });
      setPreviewImage(profile.profileImage || null);
      setErrors({});
      setEmailChanged(false);
      setVerificationCodeSent(false);
      setVerificationCode('');
      setCodeError('');
      setCountdown(0);
    }
  }, [profile, isOpen]);

  // Countdown timer for code expiry
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && verificationCodeSent) {
      setVerificationCodeSent(false);
      setCodeError('Verification code expired. Please request a new one.');
    }
  }, [countdown, verificationCodeSent]);

  const handleInputChange = (field: keyof AdminProfileData, value: string) => {
    let filteredValue = value;
    
    // Special handling for phone number - only allow digits and limit to 11
    if (field === 'phone') {
      filteredValue = value.replace(/\D/g, '');
      if (filteredValue.length > 11) {
        return;
      }
    }
    
    // Special handling for names - only allow letters and spaces
    if (field === 'firstName' || field === 'lastName') {
      if (!/^[a-zA-Z\s]*$/.test(value)) {
        return;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: filteredValue
    }));

    // Check if email changed
    if (field === 'email' && value !== profile?.email) {
      setEmailChanged(true);
      setVerificationCodeSent(false);
      setVerificationCode('');
      setCodeError('');
    } else if (field === 'email' && value === profile?.email) {
      setEmailChanged(false);
      setVerificationCodeSent(false);
      setVerificationCode('');
      setCodeError('');
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<AdminProfileData> = {};

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

    if (formData.phone && !/^\d{11}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Phone number must be exactly 11 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendVerificationCode = async () => {
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setCodeError('Please enter a valid email address');
      return;
    }

    setSendingCode(true);
    setCodeError('');

    try {
      const response = await fetch('/api/admin/request-email-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ newEmail: formData.email })
      });

      const data = await response.json();

      if (response.ok) {
        setVerificationCodeSent(true);
        setCountdown(600); // 10 minutes
        alert('Verification code sent to your new email address. Please check your inbox.');
      } else {
        setCodeError(data.message || 'Failed to send verification code');
      }
    } catch (error) {
      console.error('Error sending verification code:', error);
      setCodeError('Error sending verification code. Please try again.');
    } finally {
      setSendingCode(false);
    }
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

      const response = await fetch('/api/admin/upload-profile-image', {
        method: 'POST',
        credentials: 'include',
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

    // If email changed, verify the code first
    if (emailChanged) {
      if (!verificationCodeSent) {
        setCodeError('Please send a verification code to your new email first');
        return;
      }

      if (!verificationCode.trim()) {
        setCodeError('Please enter the verification code');
        return;
      }

      setVerifying(true);
      setCodeError('');

      try {
        const response = await fetch('/api/admin/verify-email-change', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ verificationCode: verificationCode.trim() })
        });

        const data = await response.json();

        if (response.ok) {
          // Email verified and updated
          alert('Email updated successfully!');
          
          // Now update other profile fields
          await updateOtherFields();
        } else {
          setCodeError(data.message || 'Invalid verification code');
          setVerifying(false);
        }
      } catch (error) {
        console.error('Error verifying email:', error);
        setCodeError('Error verifying code. Please try again.');
        setVerifying(false);
      }
    } else {
      // No email change, just update other fields
      await updateOtherFields();
    }
  };

  const updateOtherFields = async () => {
    try {
      const response = await fetch('/api/admin/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          profileImage: formData.profileImage
        })
      });

      if (response.ok) {
        const data = await response.json();
        onSave(data.admin);
        onClose();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile');
    } finally {
      setVerifying(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      _id: profile?._id || '',
      name: profile?.name || '',
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      email: profile?.email || '',
      role: profile?.role || '',
      status: profile?.status || '',
      phone: profile?.phone || '',
      profileImage: profile?.profileImage || ''
    });
    setPreviewImage(profile?.profileImage || null);
    setErrors({});
    setEmailChanged(false);
    setVerificationCodeSent(false);
    setVerificationCode('');
    setCodeError('');
    setCountdown(0);
    onClose();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl w-[90vw] max-h-[90vh] overflow-y-auto bg-gray-50">
        <DialogHeader className="pb-6 border-b border-gray-200">
          <DialogTitle className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Edit Admin Profile
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Profile Image Section */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-6">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100 group-hover:border-green-300 flex items-center justify-center">
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
                  accept="image/*,.heic,.heif,.img"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              
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
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Upload New Photo'}
                </Button>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Basic Information
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-gray-700 font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className={`${errors.firstName ? 'border-red-500' : ''}`}
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                  placeholder="Enter your first name"
                />
                {errors.firstName && (
                  <p className="text-red-500 text-sm mt-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-gray-700 font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className={`${errors.lastName ? 'border-red-500' : ''}`}
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                  placeholder="Enter your last name"
                />
                {errors.lastName && (
                  <p className="text-red-500 text-sm mt-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {errors.lastName}
                  </p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="phone" className="text-gray-700 font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Phone Number (11 digits)
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={`${errors.phone ? 'border-red-500' : ''}`}
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                  placeholder="09123456789"
                  maxLength={11}
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {errors.phone}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Email Change with Verification */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Email Address
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`${errors.email ? 'border-red-500' : ''}`}
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {errors.email}
                  </p>
                )}
              </div>

              {emailChanged && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-amber-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Email Verification Required
                      </p>
                      <p className="text-sm text-amber-700 mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        For security, you must verify your new email address before saving changes.
                      </p>
                      
                      {!verificationCodeSent ? (
                        <Button
                          onClick={handleSendVerificationCode}
                          disabled={sendingCode}
                          className="bg-amber-600 hover:bg-amber-700 text-white"
                          size="sm"
                        >
                          {sendingCode ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                              Sending Code...
                            </>
                          ) : (
                            <>
                              <Mail className="w-4 h-4 mr-2" />
                              Send Verification Code
                            </>
                          )}
                        </Button>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-green-700">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>
                              Code sent! Check your new email inbox.
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-amber-700">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
                              Code expires in: {formatTime(countdown)}
                            </span>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="verificationCode" className="text-gray-700 font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>
                              Enter Verification Code
                            </Label>
                            <Input
                              id="verificationCode"
                              type="text"
                              value={verificationCode}
                              onChange={(e) => {
                                setVerificationCode(e.target.value);
                                setCodeError('');
                              }}
                              className="font-mono text-lg tracking-widest"
                              placeholder="000000"
                              maxLength={6}
                            />
                            {codeError && (
                              <p className="text-red-500 text-sm mt-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                {codeError}
                              </p>
                            )}
                          </div>

                          <Button
                            onClick={handleSendVerificationCode}
                            variant="outline"
                            size="sm"
                            disabled={sendingCode || countdown > 540}
                          >
                            Resend Code
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={verifying}
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={verifying || (emailChanged && !verificationCodeSent)}
            className="bg-[#103C2E] hover:bg-[#0d2f23] text-white"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            {verifying ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

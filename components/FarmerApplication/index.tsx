'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import LoadingDots from '../ui/LoadingDots';

const FarmerApplication: React.FC = () => {
  const [formData, setFormData] = useState({
    farmName: '',
    farmAddress: '',
    contactNumber: ''
  });
  const [governmentIdFile, setGovernmentIdFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type (images and PDFs)
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload a valid government ID (JPEG, PNG, or PDF)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      
      setGovernmentIdFile(file);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!governmentIdFile) {
      setError('Please upload your government ID');
      return;
    }

    if (!formData.farmName.trim()) {
      setError('Please provide your farm name');
      return;
    }

    if (!formData.contactNumber.trim()) {
      setError('Please provide your contact number');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('governmentId', governmentIdFile);
      submitData.append('farmName', formData.farmName);
      submitData.append('farmAddress', formData.farmAddress);
      submitData.append('contactNumber', formData.contactNumber);

      const response = await fetch('/api/farmer/apply', {
        method: 'POST',
        credentials: 'include',
        body: submitData // Don't set Content-Type header for FormData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit application');
      }

      setSuccess(true);
      // Reset form
      setFormData({
        farmName: '',
        farmAddress: '',
        contactNumber: ''
      });
      setGovernmentIdFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('governmentId') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error('Application submission error:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-6 text-center">
          <div className="text-green-500 text-5xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Application Submitted!</h2>
          <p className="text-gray-600 mb-4">
            Your farmer verification application has been submitted successfully. 
            Our admin team will review your application and notify you of the decision.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            This usually takes 1-3 business days. You can continue using HarvestHub as a buyer while we process your application.
          </p>
          <Button onClick={() => setSuccess(false)} variant="outline">
            Submit Another Application
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-green-700">Become a Verified Farmer</CardTitle>
        <CardDescription>
          Submit your application to become a verified farmer on HarvestHub. 
          You'll be able to sell your products once approved.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {error && (
          <Alert>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Government ID Upload */}
          <div>
            <Label htmlFor="governmentId" className="text-base font-semibold">
              Government ID * <span className="text-sm font-normal text-gray-500">(Required for verification)</span>
            </Label>
            <Input
              id="governmentId"
              type="file"
              accept="image/jpeg,image/jpg,image/png,application/pdf"
              onChange={handleFileChange}
              className="mt-2"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Upload a clear photo of your government-issued ID (Driver's License, National ID, Passport, etc.)
              <br />
              Accepted formats: JPEG, PNG, PDF • Max size: 5MB
            </p>
            {governmentIdFile && (
              <p className="text-sm text-green-600 mt-2">
                ✓ {governmentIdFile.name} ({(governmentIdFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {/* Farm Name */}
          <div>
            <Label htmlFor="farmName" className="text-base font-semibold">
              Farm Name *
            </Label>
            <Input
              id="farmName"
              name="farmName"
              type="text"
              value={formData.farmName}
              onChange={handleInputChange}
              placeholder="e.g., Green Valley Farm"
              className="mt-2"
              required
            />
          </div>

          {/* Contact Number */}
          <div>
            <Label htmlFor="contactNumber" className="text-base font-semibold">
              Contact Number *
            </Label>
            <Input
              id="contactNumber"
              name="contactNumber"
              type="tel"
              value={formData.contactNumber}
              onChange={handleInputChange}
              placeholder="e.g., +63 912 345 6789"
              className="mt-2"
              required
            />
          </div>

          {/* Farm Address */}
          <div>
            <Label htmlFor="farmAddress" className="text-base font-semibold">
              Farm Address <span className="text-sm font-normal text-gray-500">(Optional)</span>
            </Label>
            <Textarea
              id="farmAddress"
              name="farmAddress"
              value={formData.farmAddress}
              onChange={handleInputChange}
              placeholder="e.g., Barangay San Jose, Municipality, Province"
              className="mt-2"
              rows={3}
            />
          </div>

          {/* Important Notes */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Important Notes:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Your government ID is only used for verification purposes</li>
              <li>• All information will be kept confidential</li>
              <li>• You can continue buying while your application is being reviewed</li>
              <li>• Once approved, you'll be able to list and sell your farm products</li>
            </ul>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full bg-green-600 hover:bg-green-700 flex items-center justify-center"
            disabled={loading}
          >
            {loading ? (
              <>
                <LoadingDots size="sm" color="#ffffff" className="mr-2" />
                Submitting Application...
              </>
            ) : (
              'Submit Farmer Application'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default FarmerApplication;
'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

interface VerificationStatus {
  sellerStatus: 'none' | 'pending' | 'verified' | 'rejected';
  hasApplication: boolean;
  application?: {
    id: string;
    status: 'pending' | 'approved' | 'rejected';
    submittedAt: string;
    reviewedAt?: string;
    rejectionReason?: string;
  };
}

interface SellerVerificationProps {
  initialStatus?: VerificationStatus;
  onStatusChange?: () => void;
}

export default function SellerVerification({ 
  initialStatus, 
  onStatusChange 
}: SellerVerificationProps) {
  const [status, setStatus] = useState<VerificationStatus | null>(initialStatus || null);
  const [loading, setLoading] = useState(!initialStatus);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // File states - separate for front, back, and BIR
  const [govIdFrontFile, setGovIdFrontFile] = useState<File | null>(null);
  const [govIdBackFile, setGovIdBackFile] = useState<File | null>(null);
  const [birFile, setBirFile] = useState<File | null>(null);
  const [govIdFrontPreview, setGovIdFrontPreview] = useState<string | null>(null);
  const [govIdBackPreview, setGovIdBackPreview] = useState<string | null>(null);
  
  // State for showing update form (for verified sellers)
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [birPreview, setBirPreview] = useState<string | null>(null);

  // Fetch verification status
  React.useEffect(() => {
    if (!initialStatus) {
      fetchStatus();
    }
  }, [initialStatus]);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/seller/verification/status');
      
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      } else {
        throw new Error('Failed to fetch status');
      }
    } catch (err) {
      console.error('Error fetching verification status:', err);
      setError('Failed to load verification status');
    } finally {
      setLoading(false);
    }
  };

  // Handle file selection for three separate documents
  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'gov_id_front' | 'gov_id_back' | 'bir'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only JPEG, PNG, WEBP, and PDF files are allowed');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    if (type === 'gov_id_front') {
      setGovIdFrontFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setGovIdFrontPreview(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setGovIdFrontPreview(null);
      }
    } else if (type === 'gov_id_back') {
      setGovIdBackFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setGovIdBackPreview(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setGovIdBackPreview(null);
      }
    } else {
      setBirFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setBirPreview(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setBirPreview(null);
      }
    }

    setError(null);
  };

  // Upload and submit verification - handles all three documents
  const handleSubmit = async () => {
    if (!govIdFrontFile || !govIdBackFile || !birFile) {
      setError('Please select all three required documents: Government ID (front and back) and BIR certificate');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      console.log('Starting direct upload through backend...');

      // Step 1: Upload all three files directly through backend
      const uploadFile = async (file: File, documentType: string) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('documentType', documentType);

        const response = await fetch('/api/seller/verification/upload-direct', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to upload ${documentType}`);
        }

        return response.json();
      };

      console.log('Uploading government ID (front)...');
      const govIdFrontData = await uploadFile(govIdFrontFile, 'government_id_front');
      console.log('Gov ID Front uploaded:', govIdFrontData.key);

      console.log('Uploading government ID (back)...');
      const govIdBackData = await uploadFile(govIdBackFile, 'government_id_back');
      console.log('Gov ID Back uploaded:', govIdBackData.key);

      console.log('Uploading BIR document...');
      const birData = await uploadFile(birFile, 'bir_document');
      console.log('BIR document uploaded:', birData.key);

      console.log('All files uploaded successfully, submitting verification application...');

      // Step 2: Submit verification application
      const submitResponse = await fetch('/api/seller/verification/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          governmentIdFrontKey: govIdFrontData.key,
          governmentIdFrontOriginalName: govIdFrontData.fileName,
          governmentIdFrontSize: govIdFrontData.size,
          governmentIdFrontMimeType: govIdFrontData.mimeType,
          governmentIdBackKey: govIdBackData.key,
          governmentIdBackOriginalName: govIdBackData.fileName,
          governmentIdBackSize: govIdBackData.size,
          governmentIdBackMimeType: govIdBackData.mimeType,
          birDocumentKey: birData.key,
          birDocumentOriginalName: birData.fileName,
          birDocumentSize: birData.size,
          birDocumentMimeType: birData.mimeType,
        }),
      });

      if (!submitResponse.ok) {
        const errorData = await submitResponse.json();
        throw new Error(errorData.message || 'Failed to submit verification');
      }

      setSuccess('Verification submitted successfully! Your application is under review.');
      setGovIdFrontFile(null);
      setGovIdBackFile(null);
      setBirFile(null);
      setGovIdFrontPreview(null);
      setGovIdBackPreview(null);
      setBirPreview(null);
      
      // Refresh status
      await fetchStatus();
      onStatusChange?.();
    } catch (err: any) {
      console.error('Error submitting verification:', err);
      setError(err.message || 'Failed to submit verification');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
      </Card>
    );
  }

  // Verified seller
  if (status?.sellerStatus === 'verified') {
    if (showUpdateForm) {
      // Show update form (same as initial verification)
      return (
        <>
          <Card className="p-6 mb-4 bg-green-50 border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <span className="text-green-900 font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Currently Verified
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowUpdateForm(false);
                  setGovIdFrontFile(null);
                  setGovIdBackFile(null);
                  setBirFile(null);
                  setGovIdFrontPreview(null);
                  setGovIdBackPreview(null);
                  setBirPreview(null);
                  setError(null);
                }}
              >
                Cancel Update
              </Button>
            </div>
          </Card>
          
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Update Verification Documents
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Upload new documents to update your verification. Your current verification status will remain active during review.
            </p>

            {error && (
              <Alert className="mb-4 bg-red-50 border-red-200">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-4 bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-6">
              {/* Government ID - FRONT Side Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valid Government ID - Front Side <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Upload the FRONT side of your Driver's License, Passport, National ID, or other government-issued ID
                </p>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
                  {govIdFrontPreview ? (
                    <div className="relative">
                      <img src={govIdFrontPreview} alt="Government ID Front" className="max-h-48 mx-auto rounded" />
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => {
                          setGovIdFrontFile(null);
                          setGovIdFrontPreview(null);
                        }}
                      >
                        Change File
                      </Button>
                    </div>
                  ) : govIdFrontFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="w-8 h-8 text-green-600" />
                      <div className="text-left">
                        <p className="text-sm font-medium">{govIdFrontFile.name}</p>
                        <p className="text-xs text-gray-500">
                          {(govIdFrontFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setGovIdFrontFile(null)}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP, HEIC, IMG or PDF (max 50MB)</p>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,image/img,application/pdf"
                        onChange={(e) => handleFileSelect(e, 'gov_id_front')}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Government ID - BACK Side Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valid Government ID - Back Side <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Upload the BACK side of your Driver's License, National ID, or other government-issued ID
                </p>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
                  {govIdBackPreview ? (
                    <div className="relative">
                      <img src={govIdBackPreview} alt="Government ID Back" className="max-h-48 mx-auto rounded" />
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => {
                          setGovIdBackFile(null);
                          setGovIdBackPreview(null);
                        }}
                      >
                        Change File
                      </Button>
                    </div>
                  ) : govIdBackFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="w-8 h-8 text-green-600" />
                      <div className="text-left">
                        <p className="text-sm font-medium">{govIdBackFile.name}</p>
                        <p className="text-xs text-gray-500">
                          {(govIdBackFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setGovIdBackFile(null)}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP, HEIC, IMG or PDF (max 50MB)</p>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,image/img,application/pdf"
                        onChange={(e) => handleFileSelect(e, 'gov_id_back')}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* BIR Document Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  BIR Certificate of Registration <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Upload your BIR Certificate of Registration or DTI/SEC Registration
                </p>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
                  {birPreview ? (
                    <div className="relative">
                      <img src={birPreview} alt="BIR Document" className="max-h-48 mx-auto rounded" />
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => {
                          setBirFile(null);
                          setBirPreview(null);
                        }}
                      >
                        Change File
                      </Button>
                    </div>
                  ) : birFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="w-8 h-8 text-green-600" />
                      <div className="text-left">
                        <p className="text-sm font-medium">{birFile.name}</p>
                        <p className="text-xs text-gray-500">
                          {(birFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBirFile(null)}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP, HEIC, IMG or PDF (max 50MB)</p>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,image/img,application/pdf"
                        onChange={(e) => handleFileSelect(e, 'bir')}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!govIdFrontFile || !govIdBackFile || !birFile || uploading}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating Documents...
                  </>
                ) : (
                  'Submit Updated Documents'
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Your current verification will remain active while new documents are reviewed.
              </p>
            </div>
          </Card>
        </>
      );
    }

    // Verified status view with update button
    return (
      <Card className="p-6 bg-green-50 border-green-200">
        <div className="flex items-start gap-4">
          <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-green-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Verified Seller
                </h3>
                <p className="text-green-700 mt-1">
                  Your seller account has been verified. You have full access to all seller features.
                </p>
                {status.application && (
                  <p className="text-sm text-green-600 mt-2">
                    Verified on: {new Date(status.application.reviewedAt || status.application.submittedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUpdateForm(true)}
                className="ml-4 flex-shrink-0"
              >
                <Upload className="w-4 h-4 mr-2" />
                Update Documents
              </Button>
            </div>
            <Badge className="mt-3 bg-green-600">
              <CheckCircle className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          </div>
        </div>
      </Card>
    );
  }

  // Pending verification
  if (status?.sellerStatus === 'pending') {
    return (
      <Card className="p-6 bg-yellow-50 border-yellow-200">
        <div className="flex items-start gap-4">
          <Clock className="w-8 h-8 text-yellow-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-yellow-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Verification Pending
            </h3>
            <p className="text-yellow-700 mt-1">
              Your verification application is under review. This typically takes 1-3 business days.
            </p>
            {status.application && (
              <p className="text-sm text-yellow-600 mt-2">
                Submitted: {new Date(status.application.submittedAt).toLocaleDateString()}
              </p>
            )}
            <Badge className="mt-3 bg-yellow-600">
              <Clock className="w-3 h-3 mr-1" />
              Pending Review
            </Badge>
          </div>
        </div>
      </Card>
    );
  }

  // Rejected - allow resubmission
  if (status?.sellerStatus === 'rejected') {
    return (
      <Card className="p-6 bg-red-50 border-red-200">
        <div className="flex items-start gap-4">
          <XCircle className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Verification Rejected
            </h3>
            <p className="text-red-700 mt-1">
              Your verification application was rejected. Please review the reason below and submit new documents.
            </p>
            {status.application?.rejectionReason && (
              <Alert className="mt-3 bg-red-100 border-red-300">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Reason:</strong> {status.application.rejectionReason}
                </AlertDescription>
              </Alert>
            )}
            <Button
              onClick={() => setStatus({ ...status, sellerStatus: 'none' })}
              className="mt-4 bg-red-600 hover:bg-red-700"
            >
              Submit New Application
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Not verified - show upload form
  return (
    <Card className="p-6">
      <div className="flex items-start gap-4 mb-6">
        <AlertTriangle className="w-8 h-8 text-orange-600 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Seller Verification Required
          </h3>
          <p className="text-gray-600 mt-1">
            To access seller features (post products, manage orders), you need to verify your identity.
            Please upload the following documents:
          </p>
        </div>
      </div>

      {error && (
        <Alert className="mb-4 bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {/* Government ID - Front Side Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Government ID - Front Side <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Upload the front side of your valid government-issued ID (Driver's License, Passport, National ID, etc.)
          </p>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
            {govIdFrontPreview ? (
              <div className="relative">
                <img src={govIdFrontPreview} alt="Government ID - Front" className="max-h-48 mx-auto rounded" />
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    setGovIdFrontFile(null);
                    setGovIdFrontPreview(null);
                  }}
                >
                  Change File
                </Button>
              </div>
            ) : govIdFrontFile ? (
              <div className="flex items-center justify-center gap-2">
                <FileText className="w-8 h-8 text-green-600" />
                <div className="text-left">
                  <p className="text-sm font-medium">{govIdFrontFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(govIdFrontFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setGovIdFrontFile(null)}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <label className="cursor-pointer">
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP, IMG or PDF (max 10MB)</p>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/img,application/pdf"
                  onChange={(e) => handleFileSelect(e, 'gov_id_front')}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Government ID - Back Side Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Government ID - Back Side <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Upload the back side of your government-issued ID
          </p>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
            {govIdBackPreview ? (
              <div className="relative">
                <img src={govIdBackPreview} alt="Government ID - Back" className="max-h-48 mx-auto rounded" />
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    setGovIdBackFile(null);
                    setGovIdBackPreview(null);
                  }}
                >
                  Change File
                </Button>
              </div>
            ) : govIdBackFile ? (
              <div className="flex items-center justify-center gap-2">
                <FileText className="w-8 h-8 text-green-600" />
                <div className="text-left">
                  <p className="text-sm font-medium">{govIdBackFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(govIdBackFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setGovIdBackFile(null)}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <label className="cursor-pointer">
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP, IMG or PDF (max 10MB)</p>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/img,application/pdf"
                  onChange={(e) => handleFileSelect(e, 'gov_id_back')}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* BIR Document Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            BIR Certificate of Registration <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Upload your BIR Certificate of Registration or DTI/SEC Registration
          </p>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
            {birPreview ? (
              <div className="relative">
                <img src={birPreview} alt="BIR Document" className="max-h-48 mx-auto rounded" />
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    setBirFile(null);
                    setBirPreview(null);
                  }}
                >
                  Change File
                </Button>
              </div>
            ) : birFile ? (
              <div className="flex items-center justify-center gap-2">
                <FileText className="w-8 h-8 text-green-600" />
                <div className="text-left">
                  <p className="text-sm font-medium">{birFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(birFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBirFile(null)}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <label className="cursor-pointer">
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP, IMG or PDF (max 10MB)</p>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/img,application/pdf"
                  onChange={(e) => handleFileSelect(e, 'bir')}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!govIdFrontFile || !govIdBackFile || !birFile || uploading}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit for Verification'
          )}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          Your documents will be reviewed within 1-3 business days. All information is kept confidential.
        </p>
      </div>
    </Card>
  );
}

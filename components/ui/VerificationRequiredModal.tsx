'use client';

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ShieldAlert, FileCheck, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface VerificationRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export default function VerificationRequiredModal({ 
  isOpen, 
  onClose, 
  message 
}: VerificationRequiredModalProps) {
  const router = useRouter();

  const handleGoToVerification = () => {
    onClose();
    router.push('/profile'); // Navigate to profile where verification section is
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-0">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Verification Required
            </h2>
          </div>
          <p className="text-white/90 text-sm ml-14">
            Complete your seller verification to access this feature
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Main message */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-900 mb-1">
                  {message || 'You need to be a verified seller to perform this action'}
                </p>
                <p className="text-xs text-orange-700">
                  For security and trust, all sellers must complete identity verification before listing products.
                </p>
              </div>
            </div>
          </div>

          {/* What you need */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-green-600" />
              What You'll Need
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Valid Government ID (Front and Back)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>BIR Certificate of Registration or DTI/SEC Registration</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>5-10 minutes to complete the process</span>
              </li>
            </ul>
          </div>

          {/* Info box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-xs text-blue-800">
              <strong className="font-semibold">⏱️ Quick Review:</strong> Most verifications are completed within 1-3 business days. You'll receive an email notification once approved.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Maybe Later
            </Button>
            <Button
              onClick={handleGoToVerification}
              className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all"
            >
              Get Verified Now
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Footer note */}
          <p className="text-xs text-center text-gray-500">
            🔒 Your information is encrypted and kept confidential
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

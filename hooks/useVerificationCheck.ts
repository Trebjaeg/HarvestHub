import { useState } from 'react';

interface VerificationError {
  isVerificationError: boolean;
  message: string;
}

/**
 * Hook to handle seller verification errors
 * Checks API responses for 403 errors with verification messages
 * Returns state and function to show verification modal
 */
export function useVerificationCheck() {
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<string>('');

  /**
   * Check if a response is a verification error
   * @param response - Fetch response object
   * @param errorData - Parsed error JSON from response
   * @returns true if verification error, false otherwise
   */
  const checkVerificationError = async (response: Response, errorData?: any): Promise<boolean> => {
    if (response.status === 403) {
      const error = errorData || await response.json();
      if (error.error === 'Insufficient permissions' || error.message?.includes('verification')) {
        setVerificationMessage(error.message || 'You must be a verified seller to perform this action');
        setShowVerificationModal(true);
        return true;
      }
    }
    return false;
  };

  /**
   * Handle a fetch response and check for verification errors
   * @param response - Fetch response object
   * @returns true if verification error, false otherwise
   */
  const handleVerificationError = async (response: Response): Promise<boolean> => {
    if (!response.ok) {
      try {
        const error = await response.json();
        return await checkVerificationError(response, error);
      } catch {
        return false;
      }
    }
    return false;
  };

  /**
   * Close the verification modal
   */
  const closeVerificationModal = () => {
    setShowVerificationModal(false);
    setVerificationMessage('');
  };

  return {
    showVerificationModal,
    verificationMessage,
    checkVerificationError,
    handleVerificationError,
    closeVerificationModal,
    setShowVerificationModal,
    setVerificationMessage,
  };
}

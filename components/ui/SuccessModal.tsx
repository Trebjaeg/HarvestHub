import React, { FC } from "react";

interface SuccessModalProps {
  open: boolean;
  onClose: () => void;
}

const SuccessModal: FC<SuccessModalProps> = ({ open, onClose }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full text-center">
        <h2 className="text-xl font-bold mb-4 text-green-700">Account Created!</h2>
        <p className="mb-6 text-gray-700">Your account was created successfully. You can now log in.</p>
        <button
          className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default SuccessModal;

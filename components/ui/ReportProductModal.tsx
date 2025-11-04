'use client';

import { useState } from 'react';
import LoadingDots from './LoadingDots';

interface ReportProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  onReportSubmitted: () => void;
}

const ReportProductModal: React.FC<ReportProductModalProps> = ({
  isOpen,
  onClose,
  productId,
  productName,
  onReportSubmitted
}) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const reasons = [
    { 
      value: 'scam', 
      label: 'Scam / Fraudulent',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 1.67c.955 0 1.845 .467 2.39 1.247l.105 .16l8.114 13.548a2.914 2.914 0 0 1 -2.307 4.363l-.195 .008h-16.225a2.914 2.914 0 0 1 -2.582 -4.2l.099 -.185l8.11 -13.538a2.914 2.914 0 0 1 2.491 -1.403zm.01 13.33l-.127 .007a1 1 0 0 0 0 1.986l.117 .007l.127 -.007a1 1 0 0 0 0 -1.986l-.117 -.007zm-.01 -7a1 1 0 0 0 -.993 .883l-.007 .117v4l.007 .117a1 1 0 0 0 1.986 0l.007 -.117v-4l-.007 -.117a1 1 0 0 0 -.993 -.883z" /></svg>
    },
    { 
      value: 'fake_product', 
      label: 'Fake Product',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M17 3.34a10 10 0 1 1 -14.995 8.984l-.005 -.324l.005 -.324a10 10 0 0 1 14.995 -8.336zm-1.293 4.953a1 1 0 0 0 -1.414 0l-6 6l-.083 .094a1 1 0 0 0 1.497 1.32l6 -6l.083 -.094a1 1 0 0 0 -.083 -1.32z" /></svg>
    },
    { 
      value: 'misleading_info', 
      label: 'Misleading Information',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg>
    },
    { 
      value: 'poor_quality', 
      label: 'Poor Quality',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M13 21.008a3 3 0 0 0 2.995 -2.823l.005 -.177v-4h2a3 3 0 0 0 2.98 -2.65l.015 -.173l.005 -.177l-.02 -.196l-1.006 -5.032c-.381 -1.625 -1.502 -2.796 -2.81 -2.78l-.164 .008h-8a1 1 0 0 0 -.993 .884l-.007 .116l.001 9.536a1 1 0 0 0 .5 .866a2.998 2.998 0 0 1 1.492 2.396l.007 .202v1a3 3 0 0 0 3 3z" /><path d="M5 14.008a1 1 0 0 0 .993 -.883l.007 -.117v-9a1 1 0 0 0 -.883 -.993l-.117 -.007h-1a2 2 0 0 0 -1.995 1.852l-.005 .15v7a2 2 0 0 0 1.85 1.994l.15 .005h1z" /></svg>
    },
    { 
      value: 'counterfeit', 
      label: 'Counterfeit Item',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 3.072a8 8 0 0 1 2.32 11.834l5.387 5.387a1 1 0 0 1 -1.414 1.414l-5.388 -5.387a8 8 0 0 1 -12.905 -6.32l.005 -.285a8 8 0 0 1 11.995 -6.643m-4 8.928a1 1 0 0 0 -1 1l.007 .127a1 1 0 0 0 1.993 -.117l-.007 -.127a1 1 0 0 0 -.993 -.883m0 -6a1 1 0 0 0 -1 1v3a1 1 0 0 0 2 0v-3a1 1 0 0 0 -1 -1" /></svg>
    },
    { 
      value: 'other', 
      label: 'Other',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M17.997 4.17a3 3 0 0 1 2.003 2.83v12a3 3 0 0 1 -3 3h-10a3 3 0 0 1 -3 -3v-12a3 3 0 0 1 2.003 -2.83a4 4 0 0 0 3.997 3.83h4a4 4 0 0 0 3.98 -3.597zm-2.997 10.83h-6a1 1 0 0 0 0 2h6a1 1 0 0 0 0 -2m0 -4h-6a1 1 0 0 0 0 2h6a1 1 0 0 0 0 -2m-1 -9a2 2 0 1 1 0 4h-4a2 2 0 1 1 0 -4z" /></svg>
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!reason) {
      setError('Please select a reason');
      return;
    }

    if (!description.trim()) {
      setError('Please provide a description');
      return;
    }

    if (description.length > 1000) {
      setError('Description must be less than 1000 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/reports/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          productId,
          reason,
          description
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit report');
      }

      // Reset form
      setReason('');
      setDescription('');
      onReportSubmitted();
    } catch (err: any) {
      setError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setReason('');
      setDescription('');
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#4A7C59] to-[#5C9168] text-white p-5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold font-poppins">Report Product</h2>
              <p className="text-xs text-white/90 mt-1 font-poppins truncate max-w-[280px]">{productName}</p>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors disabled:opacity-50 flex-shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Form - Scrollable Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-4">
            {/* Reason Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-poppins">
                Why are you reporting this product? <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {reasons.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setReason(r.value)}
                    className={`p-3 rounded-xl border-2 transition-all font-poppins text-left flex flex-col items-start gap-1.5 ${
                      reason === r.value
                        ? 'border-[#4A7C59] bg-[#4A7C59]/10 shadow-md'
                        : 'border-gray-200 hover:border-[#4A7C59]/50 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`transition-colors ${reason === r.value ? 'text-[#4A7C59]' : 'text-gray-600'}`}>
                      {r.icon}
                    </div>
                    <div className="text-[11px] font-medium text-gray-700 leading-tight">{r.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 font-poppins">
                Please describe the issue <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide details about why you're reporting this product..."
                rows={4}
                maxLength={1000}
                className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4A7C59] focus:border-transparent font-poppins text-sm resize-none transition-all"
                disabled={isSubmitting}
              />
              <div className="flex justify-between items-center mt-1.5">
                <p className="text-[11px] text-gray-500 font-poppins">
                  Be specific to help us investigate faster
                </p>
                <p className="text-[11px] text-gray-400 font-poppins">
                  {description.length}/1000
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-lg">
                <p className="text-xs text-red-700 font-poppins">{error}</p>
              </div>
            )}

            {/* Disclaimer */}
            <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-lg">
              <p className="text-[11px] text-amber-800 font-poppins leading-snug">
                False reports may result in account suspension. Please ensure your report is accurate and truthful.
              </p>
            </div>
          </div>

          {/* Actions - Sticky Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-5 flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-poppins font-semibold disabled:opacity-50 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason || !description.trim()}
              className="flex-1 px-6 py-2.5 bg-[#4A7C59] text-white rounded-xl hover:bg-[#3d6449] transition-colors font-poppins font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              {isSubmitting ? (
                <>
                  <LoadingDots />
                  <span>Submitting</span>
                </>
              ) : (
                'Submit Report'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportProductModal;

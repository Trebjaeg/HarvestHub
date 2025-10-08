import React from 'react';

export const SkeletonLoader: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
  );
};

export const StatCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <SkeletonLoader className="h-4 w-24 mb-2" />
          <SkeletonLoader className="h-8 w-16 mb-1" />
          <SkeletonLoader className="h-3 w-20" />
        </div>
        <div className="ml-4">
          <SkeletonLoader className="h-12 w-12 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export const ActivitySkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((index) => (
        <div key={index} className="flex items-center justify-between py-3 border-b last:border-b-0">
          <div className="flex items-center space-x-3">
            <SkeletonLoader className="w-2 h-2 rounded-full" />
            <div>
              <SkeletonLoader className="h-4 w-48 mb-1" />
              <SkeletonLoader className="h-3 w-20" />
            </div>
          </div>
          <SkeletonLoader className="h-6 w-12 rounded-full" />
        </div>
      ))}
    </div>
  );
};

export const ChartSkeleton: React.FC = () => {
  return (
    <div className="h-64 flex items-center justify-center">
      <div className="text-center">
        <SkeletonLoader className="w-12 h-12 mx-auto mb-4 rounded" />
        <SkeletonLoader className="h-4 w-32 mx-auto" />
      </div>
    </div>
  );
};
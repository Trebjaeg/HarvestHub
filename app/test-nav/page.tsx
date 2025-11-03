"use client";

import React from 'react';
import { useSmartNavigation } from '@/hooks/useSmartNavigation';
import { SmartBackButton } from '@/components/ui/SmartBackButton';

export default function NavigationTestPage() {
  const { navigationState, navigateToMessages } = useSmartNavigation();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Navigation Test Page
          </h1>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h2 className="font-semibold text-blue-900 mb-2">Navigation State</h2>
              <pre className="text-sm text-blue-800 whitespace-pre-wrap">
                {JSON.stringify(navigationState, null, 2)}
              </pre>
            </div>
            
            <div className="flex gap-4">
              <SmartBackButton 
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                showText={true}
              />
              
              <button
                onClick={navigateToMessages}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Go to Messages
              </button>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h2 className="font-semibold text-yellow-900 mb-2">Test Instructions</h2>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>1. Access this page via notification link: <code>?userId=123</code></li>
                <li>2. Test back button behavior</li>
                <li>3. Check role preservation</li>
                <li>4. Verify console logs</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
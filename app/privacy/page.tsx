"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Search,
  FileText,
  Shield,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

const policyCategories = [
  {
    id: 'platform-policies',
    title: 'Platform Policies',
    policies: [
      {
        id: 'terms-service',
        title: 'Harvest Hub Terms and Conditions',
        href: '/privacy/terms-of-service'
      },
      {
        id: 'privacy-policy',
        title: 'Harvest Hub Privacy Policy',
        href: '/privacy/privacy-policy'
      }
    ]
  }
];

export default function HarvestHubPolicies() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPolicies = policyCategories.map(category => ({
    ...category,
    policies: category.policies.filter(policy =>
      policy.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.policies.length > 0);

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation Bar */}
      <div className="bg-[#103C2E] border-b border-gray-200 py-3">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Link href="/home" className="flex items-center space-x-2">
                <span className="font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  <span style={{ color: '#6CD75A'}}>Harvest</span>
                  <span style={{ color: '#D4DB69' }}>Hub</span>
                </span>
              </Link>
              <span className="text-gray-400">|</span>
              <span className="text-white/80 font-bold" style={{ fontFamily: 'Poppins, sans-serif'}}>
                HarvestHub Help Center
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link 
                href="/privacy" 
                className="text-white hover:text-white transition-colors font-bold"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                Policies
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Header with Search */}
      <div 
        className="text-white py-16 relative overflow-hidden"
        style={{
          backgroundImage: 'url(/images/KALI/unnamed2.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Hi, how can we help?
            </h1>
            
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for help topics, guides, or questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-6 py-4 pr-16 text-gray-800 rounded-full border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 text-lg shadow-lg"
                  style={{ 
                    fontFamily: 'Poppins, sans-serif',
                    background: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 4px 12px rgba(0, 0, 0, 0.15)',
                    borderColor: 'rgba(255, 255, 255, 0.25)'
                  }}
                />
                <button 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-green-500 hover:bg-green-600 text-white p-3 rounded-full transition-colors border border-green-400/30"
                  style={{
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)'
                  }}
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Left Sidebar - Categories */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-6">
                <div className="mb-6">
                  <Link 
                    href="/help" 
                    className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors mb-4"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Back to Help Center
                    </span>
                  </Link>
                </div>

                <div className="space-y-2">
                  <button className="w-full flex items-center space-x-3 p-3 rounded-lg text-left bg-green-50 text-green-700 border border-green-200">
                    <Shield className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Policies
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3">
              <div className="bg-white border border-gray-200 rounded-lg p-8">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Shield className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Harvest Hub Policies
                    </h2>
                    <p className="text-gray-600 mt-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Important terms, conditions, and policies for using our platform
                    </p>
                  </div>
                </div>

                {/* Policies List */}
                <div className="space-y-6">
                  {filteredPolicies.map((category) => (
                    <div key={category.id}>
                      <div className="space-y-2">
                        {category.policies.map((policy, index) => (
                          <div key={policy.id}>
                            <Link
                              href={policy.href}
                              className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors group"
                            >
                              <div className="flex items-center space-x-3">
                                <FileText className="w-5 h-5 text-gray-500 group-hover:text-green-600" />
                                <span 
                                  className="text-gray-800 font-medium group-hover:text-green-700" 
                                  style={{ fontFamily: 'Poppins, sans-serif' }}
                                >
                                  {policy.title}
                                </span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-green-600" />
                            </Link>
                            {index < category.policies.length - 1 && (
                              <div className="border-b border-gray-200 ml-12"></div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {filteredPolicies.length === 0 && searchQuery && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        No policies found
                      </h3>
                      <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Try searching with different keywords
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Support Section */}
              <div className="bg-white border border-gray-200 rounded-lg p-8 mt-8">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Need More Help?
                  </h3>
                  <p className="text-gray-600 mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Contact our support team for additional assistance
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                    <Link 
                      href="/help" 
                      className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-colors font-medium"
                      style={{ fontFamily: 'Poppins, sans-serif' }}
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to Help Center</span>
                    </Link>
                    
                    <a 
                      href="mailto:contactharvesthub2025@gmail.com"
                      className="flex items-center justify-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                      style={{ fontFamily: 'Poppins, sans-serif' }}
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Contact Support</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

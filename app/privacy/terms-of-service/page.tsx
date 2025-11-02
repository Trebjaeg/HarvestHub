"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, ExternalLink } from 'lucide-react';

export default function TermsOfService() {
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
                className="text-white/80 hover:text-white transition-colors font-bold"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                Policies
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div 
        className="text-white py-12 relative overflow-hidden"
        style={{
          backgroundImage: 'url(/images/KALI/unnamed2.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-black/30"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center mb-6">
            <Link 
              href="/privacy" 
              className="flex items-center space-x-2 text-white hover:text-green-100 transition-colors mr-6"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Policies</span>
            </Link>
          </div>

          <div className="max-w-4xl">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Harvest Hub – Terms and Conditions
                </h1>
                <p className="text-green-100 text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Last updated: November 1, 2025
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                1. Account Registration & Responsibilities
              </h2>
              <div className="text-gray-700 leading-relaxed" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <p className="mb-4">By creating an account, you agree to:</p>
                <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                  <li>Provide accurate, current, and complete information.</li>
                  <li>Maintain the confidentiality of your login credentials.</li>
                  <li>Be fully responsible for all activities under your account.</li>
                </ul>
                <p className="mb-4">
                  Harvest Hub facilitates the purchase and delivery of fresh produce and products directly 
                  from local farms. You must be at least 18 years old or have the consent of a legal 
                  guardian to use our services.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                2. Orders & Payments
              </h2>
              <div className="text-gray-700 leading-relaxed" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>All prices displayed include applicable taxes and may include delivery fees.</li>
                  <li>Payments are processed securely through trusted third-party providers.</li>
                  <li>Due to the perishable nature of our products, orders cannot be canceled, modified, or refunded once confirmed.</li>
                  <li>Ensure your order details are accurate before finalizing your purchase.</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                3. Delivery & Returns
              </h2>
              <div className="text-gray-700 leading-relaxed" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                  <li>Delivery schedules are provided as estimates and may vary based on location and availability.</li>
                  <li>We only offer refunds or replacements for:
                    <ul className="list-disc list-inside space-y-1 ml-6 mt-2">
                      <li>Spoiled, damaged, or incorrect items.</li>
                      <li>Claims made within 24 hours of delivery, with supporting photo evidence.</li>
                    </ul>
                  </li>
                  <li>It is your responsibility to provide a complete and accurate delivery address. Harvest Hub is not liable for failed deliveries due to incorrect or incomplete information.</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                4. User Conduct
              </h2>
              <div className="text-gray-700 leading-relaxed" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <p className="mb-4">You agree not to:</p>
                <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                  <li>Use the platform for unlawful, fraudulent, or harmful activities.</li>
                  <li>Impersonate any person or entity.</li>
                  <li>Attempt to gain unauthorized access or disrupt the security of the platform.</li>
                </ul>
                <p>Violation of these terms may result in suspension or termination of your account.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                5. Privacy and Intellectual Property
              </h2>
              <div className="text-gray-700 leading-relaxed" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    We value your privacy and handle your data in accordance with our{" "}
                    <Link href="/privacy/privacy-policy" className="text-green-600 hover:text-green-800 underline">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>All content, including trademarks, logos, and media, is the property of Harvest Hub or its licensors.</li>
                  <li>By continuing to use our services, you accept any updates to these Terms.</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                6. Limitation of Liability & Contact
              </h2>
              <div className="text-gray-700 leading-relaxed" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                  <li>Harvest Hub is not liable for any indirect, incidental, or consequential damages arising from your use of the platform.</li>
                  <li>
                    For support or inquiries, contact us at:{" "}
                    <a href="mailto:admin@harvesthubph.app" className="text-green-600 hover:text-green-800 underline">
                      admin@harvesthubph.app
                    </a>
                  </li>
                </ul>
              </div>
            </section>
          </div>

          {/* Navigation */}
          <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            <Link
              href="/privacy"
              className="inline-flex items-center text-green-600 hover:text-green-800 font-medium"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Policies
            </Link>
            
            <Link
              href="/privacy/privacy-policy"
              className="inline-flex items-center text-gray-600 hover:text-gray-800 font-medium"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              Privacy Policy
              <ExternalLink className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
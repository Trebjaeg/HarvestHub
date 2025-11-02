"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, ExternalLink } from 'lucide-react';

export default function PrivacyPolicy() {
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
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Harvest Hub – Privacy Policy
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
                1. Information We Collect
              </h2>
              <div className="text-gray-700 leading-relaxed" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <p className="mb-4">We collect personal and transactional data when you:</p>
                <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                  <li>Create or update your account</li>
                  <li>Browse, post, or purchase products</li>
                  <li>Communicate with other users or our support team</li>
                </ul>
                <p className="mb-4">This may include:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Your name, email address, phone number, and delivery address</li>
                  <li>Login credentials and account preferences</li>
                  <li>Payment and transaction details (handled via secure payment gateways)</li>
                  <li>Any other information you choose to provide</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                2. How we Use Your Information
              </h2>
              <div className="text-gray-700 leading-relaxed" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <p className="mb-4">We use your information to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Operate and maintain the platform</li>
                  <li>Facilitate transactions and deliveries</li>
                  <li>Connect buyers with farmers and sellers</li>
                  <li>Send service-related notifications (e.g. order updates)</li>
                  <li>Enhance user experience and improve platform functionality</li>
                  <li>Detect and prevent fraud, abuse, or unauthorized access</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                3. Information Sharing
              </h2>
              <div className="text-gray-700 leading-relaxed" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <p className="mb-4">We may share your data in the following situations:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>With other users:</strong> Public profile details and product listings are visible to others on the platform.</li>
                  <li><strong>With service providers:</strong> We work with third-party partners (e.g. payment processors, logistics providers) to deliver our services.</li>
                  <li><strong>For legal or business reasons:</strong> We may disclose data when required by law, to enforce our terms, or during a business transfer (e.g. merger, acquisition).</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                4. Data Security
              </h2>
              <div className="text-gray-700 leading-relaxed" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <p>
                  We implement industry-standard safeguards to protect your data against unauthorized access, 
                  loss, or misuse. However, please note that no method of transmission over the internet is 
                  100% secure. We encourage you to use strong passwords and keep your login credentials confidential.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                5. Your Rights & Choices
              </h2>
              <div className="text-gray-700 leading-relaxed" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <p className="mb-4">You have the right to:</p>
                <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                  <li>Access, correct, or delete your personal information</li>
                  <li>Manage your communication preferences (e.g. opt out of marketing emails)</li>
                  <li>Request limitations on how your data is used</li>
                </ul>
                <p>
                  To exercise these rights, contact us at{" "}
                  <a href="mailto:privacy@harvesthub.com" className="text-green-600 hover:text-green-800 underline">
                    privacy@harvesthub.com
                  </a>
                  {" "}or{" "}
                  <a href="mailto:support@harvesthub.com" className="text-green-600 hover:text-green-800 underline">
                    support@harvesthub.com
                  </a>
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                6. Cookies & Tracking
              </h2>
              <div className="text-gray-700 leading-relaxed" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <p className="mb-4">We use cookies and similar tools to:</p>
                <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                  <li>Analyze usage and performance</li>
                  <li>Personalize content and recommendations</li>
                  <li>Remember your preferences</li>
                </ul>
                <p>
                  You can manage or disable cookies through your browser settings, though some features 
                  may be limited as a result.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                7. Third-Party Services & External Links
              </h2>
              <div className="text-gray-700 leading-relaxed" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <p>
                  Our platform may contain links to third-party websites or services. We are not responsible 
                  for the privacy practices or content of those external sites. Additionally, our platform 
                  is not intended for children under the age of 13. We do not knowingly collect data from minors.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                8. Policy Updates
              </h2>
              <div className="text-gray-700 leading-relaxed" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <p>
                  We may update this Privacy Policy periodically to reflect changes in our practices or 
                  legal requirements. When we do, we will update the "Effective Date" above. Continued 
                  use of our services after any changes indicates your acceptance of the updated policy.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                9. Contact Us
              </h2>
              <div className="text-gray-700 leading-relaxed" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <p className="mb-4">
                  If you have questions, concerns, or requests regarding this Privacy Policy, please reach out to us:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>
                      <a href="mailto:privacy@harvesthub.com" className="text-green-600 hover:text-green-800 underline">
                        privacy@harvesthub.com
                      </a>
                    </li>
                    <li>
                      <a href="mailto:support@harvesthub.com" className="text-green-600 hover:text-green-800 underline">
                        support@harvesthub.com
                      </a>
                    </li>
                  </ul>
                </div>
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
              href="/privacy/terms-of-service"
              className="inline-flex items-center text-gray-600 hover:text-gray-800 font-medium"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              Terms of Service
              <ExternalLink className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeft, 
  User, 
  Shield, 
  CreditCard, 
  Edit3, 
  Trash2, 
  Lock, 
  Key, 
  AlertTriangle,
  MapPin,
  Plus,
  CheckCircle,
  Eye,
  EyeOff,
  Smartphone,
  Building2,
  Users,
  Settings,
  Banknote
} from 'lucide-react';

interface GuideSection {
  id: string;
  title: string;
  icon: any;
  description: string;
  guides: Guide[];
}

interface Guide {
  id: string;
  title: string;
  steps: string[];
  tips?: string[];
}

const accountGuides: GuideSection[] = [
  {
    id: 'account-management',
    title: 'Account Management',
    icon: User,
    description: 'Learn how to create, update, and manage your HarvestHub seller account',
    guides: [
      {
        id: 'create-account',
        title: 'How to Create a Seller Account',
        steps: [
          'Go to the harvesthubph.app',
          'Click "Sign Up," type in your information and verify your email address by clicking the link on your inbox or typing in the 6 digits one-time passcode.',
          'Select "Seller" as the account role then click on "Create Account" button.',
          'Once logged in, navigate to your "Seller Profile" section from the dashboard',
          'In your Seller Profile, upload required business documents: DTI/SEC registration, BIR registration, and/or (1) valid ID',
          'Fill in your complete business information and contact details',
          'Submit your verification documents for review. Wait for account approval (typically 2-3 business days)',
          'Once approved, complete your business profile and start selling!',
        ],
        tips: [
          'Role selection happens during the sign-up process, not on a separate registration page',
          'Document upload is done within your Seller Profile after account creation',
          'Ensure all business documents are clear and up-to-date for faster approval',
          'Use a professional business email address for verification',
          'Complete your profile thoroughly to improve approval chances'
        ]
      },
      {
        id: 'update-details',
        title: 'How to Update Business Information',
        steps: [
          'Log in to your HarvestHub seller account',
          'Go to "Profile Dashboard" from the main menu',
          'Click "Store Settings" to modify your business information',
          'Update your business name, description, contact details, or address',
          'Upload new business documents if needed',
          'Save your changes by clicking "Update Store Information"',
          'Changes may require verification and take 1-2 business days to reflect'
        ],
        tips: [
          'Business name changes require additional verification',
          'Keep your contact information current for customer communication',
          'Update your business address if you move locations'
        ]
      },
      {
        id: 'deactivate-account',
        title: 'How to Deactivate Your Seller Account',
        steps: [
          'Log in to your HarvestHub seller account',
          'Go to "Seller Dashboard" and select "Account Settings"',
          'Complete all pending orders and fulfill customer requests',
          'Withdraw any remaining balance from your seller wallet',
          'Scroll down to find "Deactivate Account" option',
          'Choose between temporary deactivation or permanent closure',
          'Enter your password to confirm deactivation',
          'Click "Deactivate My Seller Account" to complete the process'
        ],
        tips: [
          'Account deactivation is reversible within 30 days',
          'Permanent closure cannot be undone after 30 days',
          'Download important sales data before deactivating',
          'Cancel any active promotional campaigns before deactivation'
        ]
      }
    ]
  },
  {
    id: 'security-privacy',
    title: 'Security & Privacy',
    icon: Shield,
    description: 'Protect your seller account with security features and privacy settings',
    guides: [
      {
        id: 'password-recovery',
        title: 'Password Recovery for Sellers',
        steps: [
          'Go to the HarvestHub login page',
          'Click "Forgot Password?" below the login form',
          'Enter the business email address associated with your seller account',
          'Check your email for a password reset link',
          'Click the link in the email (valid for 15 minutes)',
          'Create a new strong password for your seller account',
          'Log in with your new password to access seller dashboard'
        ],
        tips: [
          'Use a unique password different from other business accounts',
          'Check your business email spam folder if reset email is delayed',
          'The reset link expires after 15 minutes for security reasons'
        ]
      },
      {
        id: 'two-factor-auth',
        title: 'Setting Up Two-Factor Authentication',
        steps: [
          'Log in to your seller account and go to "Security Settings"',
          'Find the "Two-Factor Authentication" section',
          'Click "Enable 2FA" to start the setup process',
          'Download an authenticator app (Google Authenticator, Authy, etc.)',
          'Scan the QR code shown on screen with your authenticator app',
          'Enter the 6-digit code from your app to verify setup',
          'Save your backup codes in a secure business location',
          'Two-factor authentication is now active on your seller account'
        ],
        tips: [
          'Store backup codes securely - you\'ll need them if you lose access',
          '2FA is highly recommended for seller accounts handling transactions',
          'Use a business phone or tablet for the authenticator app'
        ]
      },
      {
        id: 'security-tips',
        title: 'Seller Account Security Best Practices',
        steps: [
          'Use a strong, unique password for your HarvestHub seller account',
          'Enable two-factor authentication for enhanced protection',
          'Log out of seller dashboard when using shared business computers',
          'Regularly review your sales reports and account activity',
          'Keep your business email account secure as it\'s linked to your seller account',
          'Be cautious of phishing emails claiming to be from HarvestHub',
          'Update your password regularly (every 3-6 months)',
          'Never share your seller login credentials with unauthorized personnel',
        ],
        tips: [
          'HarvestHub will never ask for your password via email',
          'Use a business password manager for secure credential storage',
          'Report suspicious activity immediately',
          'Keep business devices and software updated for security'
        ]
      }
    ]
  },
  {
    id: 'addresses-payments',
    title: 'Addresses & Payment Methods',
    icon: CreditCard,
    description: 'Manage your business addresses and payout methods for seller operations',
    guides: [
      {
        id: 'business-address',
        title: 'Managing Business and Return Addresses',
        steps: [
          'Log in and go to "Seller Dashboard" > "Pickup Locations"',
          'Click "Manage Addresses" to view your address settings',
          'Update your primary business address used for verification',
          'Add a separate return address if different from business location',
          'Fill in complete address details: street, city, province, postal code',
          'Add special instructions for courier pickups if needed',
          'Set your default pickup address for order fulfillment',
          'Save changes and verify address accuracy for smooth operations'
        ],
        tips: [
          'Business address must match your registered business location',
          'Return address helps customers send products back easily',
          'Add landmarks or building details for courier convenience',
          'Keep addresses updated if you move business locations'
        ]
      },
      {
        id: 'payout-methods',
        title: 'Setting Up Payout Methods',
        steps: [
          'Go to "Seller Dashboard" > "Financial Settings"',
          'Click "Payout Methods" to manage your payment accounts',
          'Choose your payout type: Bank Transfer, GCash, or PayMaya',
          'For bank transfer: enter account number, bank name, and account holder name',
          'For digital wallets: link and verify your GCash or PayMaya account',
          'Upload required bank documents or wallet verification as needed',
          'Set your preferred default payout method for faster processing',
          'Test your payout method with a small transaction if available'
        ],
        tips: [
          'Bank transfers are processed weekly every Friday',
          'Digital wallets may offer faster payout processing',
          'Ensure payout account name matches your business registration',
          'Keep payout methods updated to avoid payment delays'
        ]
      },
      {
        id: 'seller-preferences',
        title: 'Configuring Seller Preferences',
        steps: [
          'Navigate to "Profile Dashboard" > "Edit Profile"',
          'Set your default business address for order fulfillment',
          'Choose your preferred payout method and schedule',
          'Configure your business hours and availability for orders',
          'Set notification preferences for new orders and messages',
          'Choose your preferred language for the seller interface',
          'Enable or disable promotional participation notifications',
          'Save your preferences by clicking "Save Changes"'
        ],
        tips: [
          'Default preferences streamline your daily seller operations',
          'Business hours help customers know when you\'re available',
          'Order notifications ensure you never miss a sale',
          'Review and update preferences as your business grows'
        ]
      }
    ]
  }
];

export default function SellerAccountProfileHelp() {
  const [selectedSection, setSelectedSection] = useState<string | null>('account-management');
  const [selectedGuide, setSelectedGuide] = useState<string | null>(null);

  const currentSection = accountGuides.find(section => section.id === selectedSection);

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
          backgroundImage: 'url(/images/KALI/unnamed4.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Optional overlay for better text readability */}
        <div className="absolute inset-0 bg-black/30"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center mb-6">
            <Link 
              href="/help" 
              className="flex items-center space-x-2 text-white hover:text-green-100 transition-colors mr-6"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Help Center</span>
            </Link>
          </div>

          <div className="max-w-4xl">
            <div className="mb-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Account & Profile Help
                </h1>
                <p className="text-green-100 text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Manage your seller account, verification, and business information
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-6">
                <h3 className="font-bold text-gray-800 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Categories
                </h3>
                
                <div className="space-y-2">
                  {accountGuides.map((section) => {
                    const Icon = section.icon;
                    return (
                      <button
                        key={section.id}
                        onClick={() => {
                          setSelectedSection(section.id);
                          setSelectedGuide(null);
                        }}
                        className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-colors ${
                          selectedSection === section.id
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${selectedSection === section.id ? 'text-green-600' : 'text-gray-500'}`} />
                        <span className="font-medium text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {section.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3">
              {currentSection && (
                <div className="animate-fadeIn">
                  {/* Section Header */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {currentSection.title}
                      </h2>
                      <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {currentSection.description}
                      </p>
                    </div>
                  </div>

                  {/* Guides Grid */}
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                    {currentSection.guides.map((guide) => (
                      <div
                        key={guide.id}
                        className={`bg-white border border-gray-200 rounded-lg p-6 cursor-pointer transition-all duration-200 hover:shadow-md ${
                          selectedGuide === guide.id ? 'border-green-300 bg-green-50' : 'hover:border-green-200'
                        }`}
                        onClick={() => setSelectedGuide(selectedGuide === guide.id ? null : guide.id)}
                      >
                        <h3 className="font-semibold text-gray-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {guide.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          Click to view step-by-step instructions
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-green-600 font-medium">
                            {guide.steps.length} steps
                          </span>
                          <div className="text-green-600">
                            {selectedGuide === guide.id ? '−' : '+'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Selected Guide Details */}
                  {selectedGuide && (
                    <div className="bg-white border border-gray-200 rounded-lg p-8 animate-slideDown">
                      {(() => {
                        const guide = currentSection.guides.find(g => g.id === selectedGuide);
                        if (!guide) return null;

                        return (
                          <div>
                            <div className="flex items-center space-x-3 mb-6">
                              <CheckCircle className="w-8 h-8 text-green-600" />
                              <h3 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                {guide.title}
                              </h3>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                              <div>
                                <h4 className="font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                  Step-by-Step Instructions
                                </h4>
                                <div className="space-y-3">
                                  {guide.steps.map((step, index) => (
                                    <div key={index} className="flex items-start space-x-3">
                                      <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                        {index + 1}
                                      </div>
                                      <p className="text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                        {step}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {guide.tips && (
                                <div>
                                  <h4 className="font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                    Helpful Tips
                                  </h4>
                                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                                    <div className="space-y-3">
                                      {guide.tips.map((tip, index) => (
                                        <div key={index} className="flex items-start space-x-2">
                                          <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                                          <p className="text-sm text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                            {tip}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Contact Support Section */}
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <Link href="/help" className="flex items-center space-x-4 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl hover:from-green-100 hover:to-emerald-100 transition-colors">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <ArrowLeft className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Back to Help Center
                </h4>
                <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Browse other help topics
                </p>
              </div>
            </Link>

            <div className="flex items-center space-x-4 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
              <div>
                <h4 className="font-semibold text-gray-800 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Contact Support
                </h4>
                <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  admin@harvesthubph.app
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#103C2E] text-white mt-0">
        <div className="container mx-auto px-4 py-8 md:py-12">
          {/* Logo Section */}
          <div className="text-center mb-6 md:mb-8">
            <div className="mb-4 md:mb-6">
              <span className="text-2xl md:text-4xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <span style={{ color: '#6CD75A'}}>Harvest</span>
                <span style={{ color: '#D4DB69' }}>Hub</span>
              </span>
            </div>
            <div className="w-full h-px bg-white/20 max-w-5xl mx-auto"></div>
          </div>

          {/* Main Footer Content */}
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-6 md:mb-8">
              {/* Customer Care */}
              <div className="text-center md:text-left">
                <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-[#6CD75A]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Customer Care
                </h3>
                <div className="space-y-2 md:space-y-3">
                  <div className="flex items-center justify-center md:justify-start space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 flex-shrink-0 text-[#D4DB69]">
                      <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
                      <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
                    </svg>
                    <a href="mailto:admin@harvesthubph.app" className="text-white/90 hover:text-white transition-colors text-xs md:text-sm break-all">
                      admin@harvesthubph.app
                    </a>
                  </div>
                  <div className="flex items-center justify-center md:justify-start space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 flex-shrink-0 text-[#D4DB69]">
                      <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z" clipRule="evenodd" />
                    </svg>
                    <a href="tel:09762926130" className="text-white/90 hover:text-white transition-colors text-xs md:text-sm">
                      09762926130
                    </a>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="text-center md:text-left">
                <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-[#6CD75A]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Payment Methods
                </h3>
                <div className="space-y-2 md:space-y-3 flex flex-col items-center md:items-start">
                  <div className="flex items-center">
                    <Image
                      src="/images/lalamove.svg"
                      alt="Lalamove"
                      width={100}
                      height={20}
                      className="md:w-[100px] md:h-[20px]"
                    />
                  </div>
                  <div className="flex items-center">
                    <Image
                      src="/images/cod.svg"
                      alt="Cash on Delivery"
                      width={140}
                      height={24}
                      className="md:w-[140px] md:h-[24px]"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="text-center md:text-left">
                <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-[#6CD75A]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Quick Links
                </h3>
                <div className="space-y-1.5 md:space-y-2">
                  <Link href="/about" className="block text-white/90 hover:text-white transition-colors text-xs md:text-sm">
                    About Us
                  </Link>
                  <Link href="/help/seller/contact-support" className="block text-white/90 hover:text-white transition-colors text-xs md:text-sm">
                    Contact Us
                  </Link>
                  <Link href="/help" className="block text-white/90 hover:text-white transition-colors text-xs md:text-sm">
                    Hot Questions
                  </Link>
                </div>
              </div>

              {/* Policies */}
              <div className="text-center md:text-left">
                <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-[#6CD75A]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Policies
                </h3>
                <div className="space-y-1.5 md:space-y-2">
                  <Link href="/privacy/privacy-policy" className="block text-white/90 hover:text-white transition-colors text-xs md:text-sm">
                    Privacy Policy
                  </Link>
                  <Link href="/privacy/terms-of-service" className="block text-white/90 hover:text-white transition-colors text-xs md:text-sm">
                    Terms & Conditions
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="pt-6 md:pt-8 border-t border-white/20 text-center max-w-5xl mx-auto">
            <p className="text-white/80 text-xs md:text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
              © 2025 Harvest Hub. All Rights Reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
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
          'Go to harvesthubph.app/seller/register to start your application',
          'Enter your business email address and create a strong password',
          'Fill in your business information (business name, registration details)',
          'Upload required documents: DTI/SEC registration, BIR registration, valid ID',
          'Verify your email address by clicking the link sent to your inbox',
          'Wait for account approval (typically 2-3 business days)',
          'Complete your business profile and start selling!'
        ],
        tips: [
          'Ensure all business documents are clear and up-to-date',
          'Use a professional business email address for verification',
          'Complete your profile thoroughly for faster approval'
        ]
      },
      {
        id: 'update-details',
        title: 'How to Update Business Information',
        steps: [
          'Log in to your HarvestHub seller account',
          'Go to "Seller Dashboard" from the main menu',
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
          'Go to the HarvestHub seller login page',
          'Click "Forgot Password?" below the login form',
          'Enter the business email address associated with your seller account',
          'Check your email for a password reset link',
          'Click the link in the email (valid for 24 hours)',
          'Create a new strong password for your seller account',
          'Log in with your new password to access seller dashboard'
        ],
        tips: [
          'Use a unique password different from other business accounts',
          'Check your business email spam folder if reset email is delayed',
          'The reset link expires after 24 hours for security reasons'
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
          'Monitor team member access and permissions regularly'
        ],
        tips: [
          'HarvestHub will never ask for your password via email',
          'Use a business password manager for secure credential storage',
          'Report suspicious seller account activity immediately',
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
          'Log in and go to "Seller Dashboard" > "Business Information"',
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
          'Navigate to "Seller Dashboard" > "Settings & Preferences"',
          'Set your default business address for order fulfillment',
          'Choose your preferred payout method and schedule',
          'Configure your business hours and availability for orders',
          'Set notification preferences for new orders and messages',
          'Choose your preferred language for the seller interface',
          'Enable or disable promotional participation notifications',
          'Save your preferences by clicking "Update Seller Settings"'
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
      <div className="bg-white border-b border-gray-200 py-3">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Link href="/home" className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#008236' }}>
                  <span className="text-white font-bold text-sm">H</span>
                </div>
                <span className="font-bold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif', color: '#008236' }}>
                  HarvestHub
                </span>
              </Link>
              <span className="text-gray-400">|</span>
              <Link href="/help" className="text-gray-600 hover:text-gray-800 transition-colors" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Help Center
              </Link>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Seller Account & Profile
              </span>
            </div>
            
            <div className="text-right">
              <Link 
                href="/privacy" 
                className="text-gray-600 hover:text-gray-800 transition-colors text-sm"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                Policies
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="text-white py-12" style={{ background: 'linear-gradient(135deg, #008236 0%, #00a644 100%)' }}>
        <div className="container mx-auto px-4">
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
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Seller Account & Profile Help
                </h1>
                <p className="text-green-100 text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Manage your seller account settings, business security, and payout information
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
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <currentSection.icon className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {currentSection.title}
                        </h2>
                        <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {currentSection.description}
                        </p>
                      </div>
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
          <div className="bg-white border border-gray-200 rounded-lg p-8 mt-12">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Need More Help?
              </h3>
              <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Can't find what you're looking for? Our seller support team is here to help
              </p>
            </div>

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
                    Browse all help categories
                  </p>
                </div>
              </Link>

              <div className="flex items-center space-x-4 p-6 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Seller Support
                  </h4>
                  <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    seller-support@harvesthubph.app
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
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
  Smartphone
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
    description: 'Learn how to create, update, and manage your HarvestHub account',
    guides: [
      {
        id: 'create-account',
        title: 'How to Create an Account',
        steps: [
          'Go to the HarvestHub homepage and click "Sign Up"',
          'Enter your email address and create a strong password',
          'Fill in your personal information (name, phone number)',
          'Verify your email address by clicking the link sent to your inbox',
          'Complete your profile by adding additional details',
          'Start shopping on HarvestHub!'
        ],
        tips: [
          'Use a strong password with at least 8 characters',
          'Make sure to verify your email to activate all features',
          'Complete your profile for a better shopping experience'
        ]
      },
      {
        id: 'update-details',
        title: 'How to Update Account Details',
        steps: [
          'Log in to your HarvestHub account',
          'Go to "My Profile" from the main menu',
          'Click "Edit Profile" to modify your information',
          'Update your name, email, phone number, or other details',
          'Save your changes by clicking "Update Profile"',
          'You\'ll receive a confirmation message when changes are saved'
        ],
        tips: [
          'Keep your contact information up to date for order notifications',
          'If changing your email, verify the new email address',
          'Profile updates take effect immediately'
        ]
      },
      {
        id: 'delete-account',
        title: 'How to Delete Your Account',
        steps: [
          'Log in to your HarvestHub account',
          'Go to "My Profile" and select "Account Settings"',
          'Scroll down to find "Delete Account" option',
          'Read the information about account deletion carefully',
          'Enter your password to confirm deletion',
          'Click "Delete My Account" to permanently remove your account'
        ],
        tips: [
          'Account deletion is permanent and cannot be undone',
          'Download any important order history before deletion',
          'Cancel any active orders before deleting your account',
          'Consider deactivating instead of deleting if you might return'
        ]
      }
    ]
  },
  {
    id: 'security-privacy',
    title: 'Security & Privacy',
    icon: Shield,
    description: 'Protect your account with security features and privacy settings',
    guides: [
      {
        id: 'password-recovery',
        title: 'Password Recovery',
        steps: [
          'Go to the HarvestHub login page',
          'Click "Forgot Password?" below the login form',
          'Enter the email address associated with your account',
          'Check your email for a password reset link',
          'Click the link in the email (valid for 24 hours)',
          'Create a new strong password',
          'Log in with your new password'
        ],
        tips: [
          'Check your spam folder if you don\'t see the reset email',
          'Use a unique password that you haven\'t used before',
          'The reset link expires after 24 hours for security'
        ]
      },
      {
        id: 'two-factor-auth',
        title: 'Setting Up Two-Factor Authentication',
        steps: [
          'Log in to your account and go to "Security Settings"',
          'Find the "Two-Factor Authentication" section',
          'Click "Enable 2FA" to start the setup process',
          'Download an authenticator app (Google Authenticator, Authy, etc.)',
          'Scan the QR code shown on screen with your authenticator app',
          'Enter the 6-digit code from your app to verify setup',
          'Save your backup codes in a secure location',
          'Two-factor authentication is now active on your account'
        ],
        tips: [
          'Keep your backup codes safe - you\'ll need them if you lose your phone',
          'Use a trusted authenticator app for the best security',
          '2FA adds an extra layer of protection to your account'
        ]
      },
      {
        id: 'security-tips',
        title: 'Account Security Tips',
        steps: [
          'Use a strong, unique password for your HarvestHub account',
          'Enable two-factor authentication for added security',
          'Log out of your account when using shared computers',
          'Regularly review your order history and account activity',
          'Keep your email account secure as it\'s linked to HarvestHub',
          'Be cautious of phishing emails claiming to be from HarvestHub',
          'Update your password regularly (every 3-6 months)',
          'Never share your login credentials with others'
        ],
        tips: [
          'HarvestHub will never ask for your password via email',
          'Use a password manager to create and store strong passwords',
          'Report suspicious activity to our support team immediately',
          'Keep your device\'s software updated for security'
        ]
      }
    ]
  },
  {
    id: 'addresses-payments',
    title: 'Addresses & Payment Methods',
    icon: CreditCard,
    description: 'Manage your shipping addresses and payment options',
    guides: [
      {
        id: 'add-address',
        title: 'Adding or Editing Shipping Addresses',
        steps: [
          'Log in and go to "My Profile" > "Addresses"',
          'Click "Add New Address" to create a new shipping address',
          'Fill in all required fields: name, phone, complete address',
          'Select your region, province, city, and barangay',
          'Add any special delivery instructions if needed',
          'Choose if this should be your default address',
          'Click "Save Address" to add it to your account',
          'To edit: click the edit icon next to any saved address'
        ],
        tips: [
          'Ensure your address details are accurate for successful delivery',
          'Add landmarks or special instructions for easier delivery',
          'You can have multiple addresses for different locations',
          'Set a default address for faster checkout'
        ]
      },
      {
        id: 'payment-methods',
        title: 'Managing Payment Methods',
        steps: [
          'Go to "My Profile" > "Payment Methods"',
          'Click "Add Payment Method" to add a new option',
          'Choose your payment type: Credit/Debit Card or Digital Wallet',
          'For cards: enter card number, expiry date, and CVV',
          'For digital wallets: link your GCash or PayMaya account',
          'Verify your payment method as prompted',
          'Set a default payment method for quicker checkout',
          'To remove: click the delete icon next to any saved method'
        ],
        tips: [
          'Your payment information is encrypted and secure',
          'You can save multiple payment methods for convenience',
          'Digital wallets often offer faster transaction processing',
          'Cash on Delivery (COD) is available without saving payment methods'
        ]
      },
      {
        id: 'default-preferences',
        title: 'Setting Default Preferences',
        steps: [
          'Navigate to "My Profile" > "Preferences"',
          'Set your default shipping address from your saved addresses',
          'Choose your preferred payment method for checkout',
          'Select your preferred delivery time slots if available',
          'Set notification preferences for order updates',
          'Choose your preferred language for the interface',
          'Enable or disable promotional email notifications',
          'Save your preferences by clicking "Update Preferences"'
        ],
        tips: [
          'Default preferences speed up the checkout process',
          'You can always change preferences for individual orders',
          'Keep notification preferences updated for important order info',
          'Review and update preferences periodically'
        ]
      }
    ]
  }
];

export default function AccountProfileHelp() {
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
                Account & Profile
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
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Account & Profile Help
                </h1>
                <p className="text-green-100 text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Manage your account settings, security, and personal information
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
                Can't find what you're looking for? Our support team is here to help
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <Link href="/help" className="flex items-center space-x-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl hover:from-blue-100 hover:to-indigo-100 transition-colors">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
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

              <div className="flex items-center space-x-4 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
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
      </div>
    </div>
  );
}
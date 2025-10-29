"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Settings, 
  Monitor, 
  Smartphone, 
  AlertCircle, 
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  Wifi,
  Globe,
  Chrome,
  Info,
  Mail,
  MessageSquare
} from 'lucide-react';

interface GuideSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  guides: Guide[];
}

interface Guide {
  id: string;
  title: string;
  steps: string[];
  tips?: string[];
  warnings?: string[];
}

const technicalGuides: GuideSection[] = [
  {
    id: 'website-issues',
    title: 'Website Issues',
    icon: Monitor,
    description: 'Resolve browser compatibility, login problems, and common website errors',
    guides: [
      {
        id: 'browser-compatibility',
        title: 'Browser Compatibility & Performance Issues',
        steps: [
          'Check if you\'re using a supported browser: Chrome (v90+), Firefox (v88+), Safari (v14+), or Edge (v90+)',
          'Clear your browser cache and cookies by pressing Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)',
          'Disable browser extensions temporarily to identify conflicts with HarvestHub',
          'Update your browser to the latest version through browser settings',
          'Enable JavaScript in your browser settings (required for full functionality)',
          'Check if your internet connection is stable and has sufficient bandwidth',
          'Try accessing HarvestHub in an incognito/private browsing window',
          'Disable ad blockers or add HarvestHub to your whitelist',
          'Reset browser zoom level to 100% for optimal display',
          'Restart your browser completely and try accessing the site again'
        ],
        tips: [
          'Chrome and Firefox typically offer the best performance with HarvestHub',
          'Keep your browser updated for security and compatibility improvements',
          'Use incognito mode to test if extensions are causing issues',
          'A stable internet connection of at least 5 Mbps is recommended for smooth browsing'
        ],
        warnings: [
          'Internet Explorer is not supported and may cause functionality issues',
          'Very old browser versions may not display the website correctly'
        ]
      },
      {
        id: 'common-errors',
        title: 'Common Error Messages & Solutions',
        steps: [
          'If you see "Page Not Found (404)" - check the URL spelling or navigate from the homepage',
          'For "Server Error (500)" - wait a few minutes and refresh the page, or clear your cache',
          'When encountering "Payment Processing Error" - verify your payment details and try a different payment method',
          'If "Session Expired" appears - log out completely and log back in to refresh your session',
          'For "Network Connection Error" - check your internet connection and try refreshing',
          'When seeing "Product Unavailable" - the item may be out of stock, check back later or contact the seller',
          'If "Upload Failed" errors occur - check file size (max 10MB) and format (JPG, PNG, PDF only)',
          'For "Access Denied" messages - ensure you\'re logged into the correct account type',
          'When "Checkout Error" appears - verify all required fields are filled and payment method is valid',
          'If pages load slowly - try clearing cache, check internet speed, or try a different browser'
        ],
        tips: [
          'Screenshot error messages to help our support team assist you faster',
          'Note the time and specific action you were performing when the error occurred',
          'Try the same action again after waiting 5-10 minutes - temporary issues often resolve themselves',
          'Keep your account information up to date to avoid authentication errors'
        ],
        warnings: [
          'Never share your login credentials when reporting errors to support',
          'Avoid refreshing payment pages multiple times to prevent duplicate charges'
        ]
      },
      {
        id: 'login-signup-issues',
        title: 'Login & Signup Difficulties',
        steps: [
          'Verify you\'re using the correct email address associated with your account',
          'Check that Caps Lock is off and you\'re entering your password correctly',
          'Use the "Forgot Password" link to reset your password if you can\'t remember it',
          'Clear your browser cache and cookies, then try logging in again',
          'Disable autofill temporarily and manually enter your login credentials',
          'Check if your account has been suspended by looking for email notifications',
          'Ensure your email address is verified - check for verification emails in spam/junk folders',
          'Try logging in from a different browser or incognito mode',
          'If creating a new account, ensure your email isn\'t already registered',
          'Contact support if you continue having issues after trying these steps'
        ],
        tips: [
          'Use a strong, unique password with at least 8 characters including numbers and symbols',
          'Save your login credentials in a secure password manager',
          'Keep your email address up to date to receive important account notifications',
          'Enable two-factor authentication for enhanced account security'
        ],
        warnings: [
          'Multiple failed login attempts may temporarily lock your account for security',
          'Never share your login credentials or click suspicious password reset links'
        ]
      },
      {
        id: 'website-navigation',
        title: 'Website Navigation & Feature Access',
        steps: [
          'Use the main navigation menu at the top of the page to access different sections',
          'Click the HarvestHub logo to return to the homepage from any page',
          'Access your account by clicking the profile icon in the top right corner',
          'Use the search bar to quickly find specific products or farmers',
          'Check the breadcrumb navigation to see your current location on the site',
          'Use browser back/forward buttons or the site\'s navigation arrows',
          'Access your shopping cart by clicking the cart icon in the header',
          'Find help resources in the "Help Center" link in the main navigation or footer',
          'Use filters and sorting options on product pages to narrow down results',
          'Bookmark frequently visited pages for quick access in the future'
        ],
        tips: [
          'Use keyboard shortcuts: Ctrl+F to search on page, Ctrl+R to refresh',
          'The mobile menu (hamburger icon) contains the same options as the desktop menu',
          'Hover over navigation items to see dropdown menus with additional options',
          'Use the "Recently Viewed" section to return to products you looked at earlier'
        ]
      }
    ]
  },
  {
    id: 'mobile-app-support',
    title: 'Mobile App Support',
    icon: Smartphone,
    description: 'Download, install, and troubleshoot the HarvestHub mobile app',
    guides: [
      {
        id: 'app-download-install',
        title: 'Downloading & Installing the App',
        steps: [
          'Visit the Google Play Store (Android) or App Store (iOS) on your mobile device',
          'Search for "HarvestHub" in the store\'s search bar',
          'Verify the app publisher is "HarvestHub Philippines" before downloading',
          'Tap "Install" (Android) or "Get" (iOS) to begin the download',
          'Wait for the app to download and install automatically',
          'Find the HarvestHub app icon on your home screen or app drawer',
          'Tap the app icon to launch HarvestHub for the first time',
          'Grant necessary permissions when prompted (camera, location, notifications)',
          'Log in with your existing account or create a new account',
          'Complete the setup process by verifying your phone number and email'
        ],
        tips: [
          'Ensure you have at least 100MB of free storage space before downloading',
          'Connect to Wi-Fi for faster download, especially on slower mobile data',
          'Enable automatic app updates to receive the latest features and security fixes',
          'The app is compatible with Android 7.0+ and iOS 12.0+ devices'
        ],
        warnings: [
          'Only download the app from official app stores to avoid security risks',
          'Fake HarvestHub apps may exist - verify the publisher name before installing'
        ]
      },
      {
        id: 'app-crashes-bugs',
        title: 'Fixing App Crashes & Bugs',
        steps: [
          'Force close the app completely by swiping up (iOS) or using recent apps (Android)',
          'Restart the HarvestHub app and check if the issue persists',
          'Restart your mobile device to clear memory and refresh system processes',
          'Check if you have the latest version of the app in your device\'s app store',
          'Update the app if a newer version is available',
          'Clear the app cache: Android Settings > Apps > HarvestHub > Storage > Clear Cache',
          'Free up device storage space - apps need at least 500MB free space to function properly',
          'Check your internet connection - switch between Wi-Fi and mobile data to test',
          'Disable battery optimization for HarvestHub in your device settings',
          'If crashes continue, uninstall and reinstall the app (you won\'t lose your account data)'
        ],
        tips: [
          'Take screenshots of error messages to help our support team identify issues',
          'Note what specific action caused the crash (viewing products, placing orders, etc.)',
          'Keep your device\'s operating system updated for better app compatibility',
          'Close other apps running in the background to free up memory for HarvestHub'
        ],
        warnings: [
          'Clearing app data will log you out and remove saved preferences',
          'Only reinstall the app from official app stores to maintain security'
        ]
      },
      {
        id: 'app-features-navigation',
        title: 'Navigating App Features',
        steps: [
          'Use the bottom navigation bar to switch between Home, Shop, Orders, and Profile',
          'Tap the search icon to find specific products, farmers, or categories',
          'Access your shopping cart by tapping the cart icon in the top right',
          'Pull down on most screens to refresh content and check for updates',
          'Use the hamburger menu (three lines) to access additional features and settings',
          'Tap and hold product images to quick-add items to favorites or cart',
          'Swipe left or right on product carousels to browse more items',
          'Use the filter and sort options at the top of product listings',
          'Access your order history and tracking from the "Orders" tab',
          'Update your profile, addresses, and payment methods in the "Profile" section'
        ],
        tips: [
          'Enable push notifications to receive updates on orders, deals, and new products',
          'Use the "Quick Order" feature to reorder frequently purchased items',
          'Set up Touch ID or Face ID for faster and secure app access',
          'Customize your home screen by following your favorite farmers and categories'
        ]
      },
      {
        id: 'app-performance',
        title: 'Optimizing App Performance',
        steps: [
          'Close unused apps running in the background to free up RAM memory',
          'Ensure you have at least 1GB of free storage space on your device',
          'Connect to a stable Wi-Fi network when possible for faster loading',
          'Update your device\'s operating system to the latest version',
          'Restart your device at least once a week to clear temporary files',
          'Clear the HarvestHub app cache regularly through device settings',
          'Disable unnecessary visual effects and animations in your device settings',
          'Turn off location services for other apps to prioritize HarvestHub\'s performance',
          'Enable "High Performance" or "Gaming Mode" on your device if available',
          'Monitor your data usage and switch to Wi-Fi for data-intensive activities'
        ],
        tips: [
          'The app performs best on devices with at least 3GB of RAM',
          'Image loading is optimized for mobile data - high-quality images load on Wi-Fi',
          'Use the app\'s offline mode to browse previously viewed products without internet',
          'Regular app updates include performance improvements and bug fixes'
        ]
      },
      {
        id: 'app-connectivity',
        title: 'Connectivity & Sync Issues',
        steps: [
          'Check your internet connection by trying to browse other websites or apps',
          'Switch between Wi-Fi and mobile data to identify connection-specific issues',
          'Move to a location with stronger signal strength if using mobile data',
          'Restart your Wi-Fi router if experiencing connectivity issues at home',
          'Forget and reconnect to your Wi-Fi network in device settings',
          'Check if other apps are using excessive bandwidth and close them',
          'Enable "Background App Refresh" for HarvestHub in your device settings',
          'Synchronize your account data by pulling down to refresh in the app',
          'Log out and log back in to refresh your account sync',
          'Contact your internet service provider if connectivity issues persist across all apps'
        ],
        tips: [
          'HarvestHub automatically syncs your cart and favorites when connection is restored',
          'Download product images and details while on Wi-Fi for offline browsing',
          'The app uses minimal data - roughly 2-5MB per typical shopping session',
          'Enable data compression in your device settings to reduce bandwidth usage'
        ],
        warnings: [
          'Avoid making purchases or payments when connection is unstable',
          'Some features may not work properly without a stable internet connection'
        ]
      }
    ]
  }
];

export default function TechnicalSupportHelp() {
  const [selectedSection, setSelectedSection] = useState<string | null>('website-issues');
  const [selectedGuide, setSelectedGuide] = useState<string | null>(null);

  const currentSection = technicalGuides.find(section => section.id === selectedSection);

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
                Technical Support
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
                <Settings className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Technical Support
                </h1>
                <p className="text-green-100 text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Resolve website and mobile app issues quickly and efficiently
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
                  Support Categories
                </h3>
                
                <div className="space-y-2">
                  {technicalGuides.map((section) => {
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
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${selectedSection === section.id ? 'text-blue-600' : 'text-gray-500'}`} />
                        <span className="font-medium text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {section.title}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Quick Actions */}
                <div className="mt-8 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2 text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Quick Actions
                  </h4>
                  <div className="space-y-2">
                    <button className="w-full text-left text-xs text-blue-600 hover:text-blue-700 transition-colors">
                      Clear Browser Cache
                    </button>
                    <button className="w-full text-left text-xs text-blue-600 hover:text-blue-700 transition-colors">
                      Update Mobile App
                    </button>
                    <button className="w-full text-left text-xs text-blue-600 hover:text-blue-700 transition-colors">
                      Contact Live Support
                    </button>
                  </div>
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
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <currentSection.icon className="w-6 h-6 text-blue-600" />
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
                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {currentSection.guides.map((guide) => (
                      <div
                        key={guide.id}
                        className={`bg-white border border-gray-200 rounded-lg p-6 cursor-pointer transition-all duration-200 hover:shadow-md ${
                          selectedGuide === guide.id ? 'border-blue-300 bg-blue-50' : 'hover:border-blue-200'
                        }`}
                        onClick={() => setSelectedGuide(selectedGuide === guide.id ? null : guide.id)}
                      >
                        <h3 className="font-semibold text-gray-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {guide.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          Click to view troubleshooting steps
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-blue-600 font-medium">
                            {guide.steps.length} steps
                          </span>
                          <div className="text-blue-600">
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

                            <div className="space-y-8">
                              {/* Steps */}
                              <div>
                                <h4 className="font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                  Troubleshooting Steps
                                </h4>
                                <div className="space-y-3">
                                  {guide.steps.map((step, index) => (
                                    <div key={index} className="flex items-start space-x-3">
                                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                        {index + 1}
                                      </div>
                                      <p className="text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                        {step}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Tips and Warnings Grid */}
                              <div className="grid md:grid-cols-2 gap-6">
                                {guide.tips && (
                                  <div>
                                    <h4 className="font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                      💡 Helpful Tips
                                    </h4>
                                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                                      <div className="space-y-3">
                                        {guide.tips.map((tip, index) => (
                                          <div key={index} className="flex items-start space-x-2">
                                            <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                            <p className="text-sm text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                              {tip}
                                            </p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {guide.warnings && (
                                  <div>
                                    <h4 className="font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                      ⚠️ Important Warnings
                                    </h4>
                                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                                      <div className="space-y-3">
                                        {guide.warnings.map((warning, index) => (
                                          <div key={index} className="flex items-start space-x-2">
                                            <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                                            <p className="text-sm text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                              {warning}
                                            </p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
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

          {/* Browser Compatibility Banner */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg p-8 mb-8 text-white mt-12">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Supported Browsers & Devices
              </h3>
              <p className="text-blue-100" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Ensure you&apos;re using compatible browsers and devices for the best experience
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-white/10 backdrop-blur rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Chrome className="w-6 h-6" />
                </div>
                <h4 className="font-semibold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Chrome 90+
                </h4>
                <p className="text-sm text-blue-100" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Recommended browser
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Globe className="w-6 h-6" />
                </div>
                <h4 className="font-semibold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Firefox 88+
                </h4>
                <p className="text-sm text-blue-100" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Fully supported
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Globe className="w-6 h-6" />
                </div>
                <h4 className="font-semibold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Safari 14+
                </h4>
                <p className="text-sm text-blue-100" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  iOS & macOS
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h4 className="font-semibold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Mobile App
                </h4>
                <p className="text-sm text-blue-100" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Android 7.0+ & iOS 12.0+
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-red-100 rounded-lg mb-4 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-red-600" />
              </div>
              <h4 className="font-semibold text-gray-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Clear Cache & Cookies
              </h4>
              <p className="text-sm text-gray-600 mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Resolve loading and login issues
              </p>
              <p className="text-xs text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Press Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg mb-4 flex items-center justify-center">
                <Download className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Update Your App
              </h4>
              <p className="text-sm text-gray-600 mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Get the latest features and fixes
              </p>
              <p className="text-xs text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Check Google Play Store or App Store for updates
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg mb-4 flex items-center justify-center">
                <Wifi className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Check Connection
              </h4>
              <p className="text-sm text-gray-600 mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Ensure stable internet connectivity
              </p>
              <p className="text-xs text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Try switching between Wi-Fi and mobile data
              </p>
            </div>
          </div>

          {/* Still Need Help Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Still Having Technical Issues?
              </h3>
              <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Our technical support team is ready to help you resolve any remaining issues
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="flex items-center space-x-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Live Chat Support
                  </h4>
                  <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Get instant technical help
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Email Support
                  </h4>
                  <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    admin@harvesthubph.app
                  </p>
                </div>
              </div>

              <Link href="/help" className="flex items-center space-x-4 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl hover:from-purple-100 hover:to-pink-100 transition-colors">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
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
            </div>

            {/* Emergency Contact Info */}
            <div className="mt-8 p-6 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border-l-4 border-red-400">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Critical System Issues
                  </h4>
                  <p className="text-sm text-gray-700 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    For urgent technical problems affecting orders, payments, or account security:
                  </p>
                  <p className="text-sm font-medium text-red-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    📧 urgent@harvesthubph.app | 🕒 24/7 Emergency Response
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
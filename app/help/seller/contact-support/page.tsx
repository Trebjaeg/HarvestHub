"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  MessageCircle, 
  Shield, 
  Package, 
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
  Banknote,
  Clock,
  XCircle,
  RefreshCw,
  Bell,
  ExternalLink,
  Camera,
  Calendar,
  ThumbsUp,
  Award,
  Monitor,
  Bug,
  Chrome,
  Mail,
  HeadphonesIcon
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

const supportGuides: GuideSection[] = [
  {
    id: 'contact-options',
    title: 'Contact Options',
    icon: MessageCircle,
    description: 'Get quick assistance through multiple support channels designed for sellers',
    guides: [
      {
        id: 'live-chat',
        title: 'Live Chat with Kali (Virtual Assistant)',
        steps: [
          'Look for the chat bubble icon in the bottom-right corner of your seller dashboard',
          'Click on the chat icon to open the conversation window with Kali',
          'Type "Hello" or describe your issue to start the conversation',
          'Kali will provide instant responses to common seller questions and concerns',
          'Ask about order management, payment issues, shipping problems, or account settings',
          'If Kali cannot resolve your issue, she will connect you to a human support agent',
          'Chat history is saved so you can refer back to previous conversations',
          'Live chat is available 24/7 for immediate assistance with urgent matters'
        ],
        tips: [
          'Be specific about your issue to get the most accurate help from Kali',
          'Use simple, clear language when describing technical problems',
          'Have your seller account information ready for faster assistance',
          'Live chat is the fastest way to get help with urgent seller issues'
        ]
      },
      {
        id: 'email-support',
        title: 'Email Support for Detailed Inquiries',
        steps: [
          'Compose a new email to admin@harvesthubph.app for comprehensive support',
          'Use a clear, descriptive subject line that summarizes your issue or inquiry',
          'Include your seller account email address and business name in the message',
          'Provide detailed information about your problem, including specific error messages',
          'Attach relevant screenshots, documents, or files that help explain your issue',
          'Mention any troubleshooting steps you have already tried',
          'Expect a response within 24-48 hours during business days',
          'Follow up if you don\'t receive a response within the expected timeframe'
        ],
        tips: [
          'Email support is best for complex issues that require detailed explanations',
          'Include order numbers, product IDs, or transaction details when relevant',
          'Be patient as email responses may take longer than live chat',
          'Keep copies of your email communications for your records'
        ]
      }
    ]
  }
];

export default function SellerContactSupportHelp() {
  const [selectedSection, setSelectedSection] = useState<string | null>('contact-options');
  const [selectedGuide, setSelectedGuide] = useState<string | null>(null);

  const currentSection = supportGuides.find(section => section.id === selectedSection);

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
                Seller Contact Support
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
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Seller Contact Support Help
                </h1>
                <p className="text-green-100 text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Get assistance through live chat or email support for all your seller needs
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
                  {supportGuides.map((section) => {
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
                  <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {currentSection.guides.map((guide) => (
                      <div
                        key={guide.id}
                        className={`bg-white border border-gray-200 rounded-lg p-6 cursor-pointer transition-all duration-200 hover:shadow-md ${
                          selectedGuide === guide.id ? 'border-green-300 bg-green-50' : 'hover:border-green-200'
                        }`}
                        onClick={() => setSelectedGuide(selectedGuide === guide.id ? null : guide.id)}
                      >
                        <div className="flex items-center space-x-3 mb-3">
                          {guide.id === 'live-chat' ? (
                            <HeadphonesIcon className="w-6 h-6 text-green-600" />
                          ) : (
                            <Mail className="w-6 h-6 text-green-600" />
                          )}
                          <h3 className="font-semibold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {guide.title}
                          </h3>
                        </div>
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

                  {/* Quick Contact Cards */}
                  <div className="grid md:grid-cols-2 gap-6 mt-8">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <HeadphonesIcon className="w-8 h-8 text-blue-600" />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            Live Chat with Kali
                          </h3>
                          <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            Instant support 24/7
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-700 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Get immediate help with common seller questions, order management, and technical issues.
                      </p>
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <p className="text-sm text-blue-800 font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          💬 Look for the chat bubble in your seller dashboard
                        </p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <Mail className="w-8 h-8 text-orange-600" />
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            Email Support
                          </h3>
                          <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            Detailed assistance
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-700 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Send detailed inquiries and get comprehensive responses within 24-48 hours.
                      </p>
                      <div className="bg-orange-100 p-3 rounded-lg">
                        <p className="text-sm text-orange-800 font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          📧 admin@harvesthubph.app
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Need More Help Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-8 mt-12">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Still Need Help?
              </h3>
              <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Our support team is here to assist you with any seller-related questions
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

              <div className="flex items-center space-x-4 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Priority Support
                  </h4>
                  <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Available for premium sellers
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
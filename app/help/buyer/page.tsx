"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  User, 
  ShoppingBag, 
  CreditCard, 
  Truck, 
  Star, 
  HelpCircle, 
  MessageCircle, 
  Mail,
  ChevronDown,
  ChevronUp,
  Search
} from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

interface HelpSection {
  id: string;
  title: string;
  icon: any;
  description: string;
  topics: string[];
  faqs: FAQItem[];
}

const helpSections: HelpSection[] = [
  {
    id: 'account',
    title: 'Account & Profile Management',
    icon: User,
    description: 'Manage your account settings, profile information, and security',
    topics: [
      'Creating a new account',
      'Updating profile information',
      'Password recovery and reset',
      'Managing delivery addresses',
      'Account verification',
      'Privacy settings',
      'Deleting your account'
    ],
    faqs: [
      {
        question: 'How do I reset my password?',
        answer: 'Click on "Forgot Password" on the login page, enter your email address, and follow the instructions sent to your email.'
      },
      {
        question: 'How can I update my delivery address?',
        answer: 'Go to your Profile settings, select "Addresses," and add or edit your delivery addresses. You can set a default address for faster checkout.'
      }
    ]
  },
  {
    id: 'orders',
    title: 'Orders & Tracking',
    icon: ShoppingBag,
    description: 'Track your orders, manage returns, and handle order issues',
    topics: [
      'How to place an order',
      'Tracking your order status',
      'Modifying or canceling orders',
      'Order history and receipts',
      'Returns and exchanges',
      'Refund process',
      'Order delivery issues'
    ],
    faqs: [
      {
        question: 'How can I track my order?',
        answer: 'You can track your order in the "My Orders" section of your account. You\'ll also receive SMS and email updates with tracking information.'
      },
      {
        question: 'Can I cancel my order after placing it?',
        answer: 'Yes, you can cancel orders that haven\'t been processed yet. Go to "My Orders" and click "Cancel Order" if the option is available.'
      }
    ]
  },
  {
    id: 'payments',
    title: 'Payments & Billing',
    icon: CreditCard,
    description: 'Payment methods, billing, and transaction support',
    topics: [
      'Accepted payment methods',
      'Credit and debit card payments',
      'Digital wallet payments (GCash, PayMaya)',
      'Cash on Delivery (COD)',
      'Failed transaction troubleshooting',
      'Payment security',
      'Invoice and receipt downloads'
    ],
    faqs: [
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept credit/debit cards (Visa, Mastercard), digital wallets (GCash, PayMaya), and Cash on Delivery for eligible areas.'
      },
      {
        question: 'What should I do if my payment fails?',
        answer: 'Check your card details and account balance. If the issue persists, try a different payment method or contact your bank.'
      }
    ]
  },
  {
    id: 'shipping',
    title: 'Shipping & Delivery',
    icon: Truck,
    description: 'Delivery options, shipping costs, and delivery support',
    topics: [
      'Available shipping options',
      'Delivery timeframes',
      'Shipping costs and fees',
      'Delivery area coverage',
      'What to do if package is lost',
      'Damaged items upon delivery',
      'Special delivery instructions'
    ],
    faqs: [
      {
        question: 'How long does delivery take?',
        answer: 'Standard delivery takes 2-5 business days within Metro Manila, and 5-7 business days for provincial areas. Express delivery options are available.'
      },
      {
        question: 'What if my package arrives damaged?',
        answer: 'Take photos of the damaged package and contact us immediately through the app or email. We\'ll arrange a replacement or refund.'
      }
    ]
  },
  {
    id: 'products',
    title: 'Products & Reviews',
    icon: Star,
    description: 'Product information, warranties, and review system',
    topics: [
      'Understanding product details',
      'Product availability and stock',
      'Product warranties and guarantees',
      'How to write product reviews',
      'Photo and video reviews',
      'Reporting inappropriate content',
      'Product comparison features'
    ],
    faqs: [
      {
        question: 'How do I leave a product review?',
        answer: 'After receiving your order, go to "My Orders," find the product, and click "Write Review." You can add text, photos, and rate the product.'
      },
      {
        question: 'Are products covered by warranty?',
        answer: 'Fresh produce quality is guaranteed upon delivery. For processed goods, warranty terms vary by seller and are listed on the product page.'
      }
    ]
  },
  {
    id: 'technical',
    title: 'Technical Support',
    icon: HelpCircle,
    description: 'App issues, website problems, and technical troubleshooting',
    topics: [
      'App crashes and freezing',
      'Website loading issues',
      'Login and authentication problems',
      'Notification settings',
      'App updates and features',
      'Browser compatibility',
      'Mobile app installation'
    ],
    faqs: [
      {
        question: 'The app keeps crashing, what should I do?',
        answer: 'Try restarting the app, clearing the cache, or updating to the latest version. If issues persist, contact our technical support team.'
      },
      {
        question: 'Why am I not receiving notifications?',
        answer: 'Check your notification settings in the app and ensure notifications are enabled in your device settings for HarvestHub.'
      }
    ]
  }
];

export default function BuyerHelpCenter() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const filteredSections = helpSections.filter(section =>
    section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.topics.some(topic => topic.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <Link 
              href="/help" 
              className="flex items-center space-x-2 text-white hover:text-blue-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Help Center</span>
            </Link>
            
            <div className="text-right">
              <div className="flex items-center space-x-2 text-blue-100 text-sm">
                <span className="font-semibold">Buyer</span>
                <span>Help Center</span>
              </div>
            </div>
          </div>

          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Buyer Help Center
            </h1>
            <p className="text-blue-100 text-lg mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Find answers about shopping, orders, payments, and more
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto">
              <input
                type="text"
                placeholder="Search buyer help topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-6 py-3 pr-12 rounded-lg text-gray-800 border-0 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              />
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Help Sections Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {filteredSections.map((section) => {
              const Icon = section.icon;
              return (
                <div
                  key={section.id}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 cursor-pointer border-2 border-transparent hover:border-blue-200"
                  onClick={() => setSelectedSection(selectedSection === section.id ? null : section.id)}
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {section.title}
                    </h3>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {section.description}
                  </p>
                  
                  <div className="space-y-2">
                    {section.topics.slice(0, 3).map((topic, index) => (
                      <div key={index} className="flex items-center text-sm text-gray-500">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></div>
                        {topic}
                      </div>
                    ))}
                    {section.topics.length > 3 && (
                      <div className="text-sm text-blue-600 font-medium">
                        +{section.topics.length - 3} more topics
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Expanded Section Details */}
          {selectedSection && (
            <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
              {(() => {
                const section = helpSections.find(s => s.id === selectedSection);
                if (!section) return null;
                const Icon = section.icon;
                
                return (
                  <div>
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {section.title}
                      </h3>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          Help Topics
                        </h4>
                        <div className="space-y-3">
                          {section.topics.map((topic, index) => (
                            <div key={index} className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                              <span className="text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                {topic}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          Frequently Asked Questions
                        </h4>
                        <div className="space-y-3">
                          {section.faqs.map((faq, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg">
                              <button
                                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                                onClick={() => setExpandedFAQ(expandedFAQ === `${section.id}-${index}` ? null : `${section.id}-${index}`)}
                              >
                                <span className="font-medium text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                  {faq.question}
                                </span>
                                {expandedFAQ === `${section.id}-${index}` ? (
                                  <ChevronUp className="w-5 h-5 text-gray-500" />
                                ) : (
                                  <ChevronDown className="w-5 h-5 text-gray-500" />
                                )}
                              </button>
                              {expandedFAQ === `${section.id}-${index}` && (
                                <div className="p-4 border-t bg-gray-50">
                                  <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                    {faq.answer}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Contact Support Section */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Still Need Help?
              </h3>
              <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Our support team is here to assist you
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-center space-x-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Live Chat with Kali
                  </h4>
                  <p className="text-sm text-gray-600 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Get instant help from our AI assistant
                  </p>
                  <button className="text-blue-600 font-medium text-sm hover:text-blue-700 transition-colors">
                    Start Chat →
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-4 p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Contact Support
                  </h4>
                  <p className="text-sm text-gray-600 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    admin@harvesthubph.app
                  </p>
                  <p className="text-xs text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    We typically respond within 24 hours
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
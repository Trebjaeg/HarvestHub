"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Truck, 
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
  Calendar
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

const shippingGuides: GuideSection[] = [
  {
    id: 'delivery-information',
    title: 'Delivery Information',
    icon: Truck,
    description: 'Learn about shipping options, packaging requirements, and delivery timeframes',
    guides: [
      {
        id: 'shipping-options',
        title: 'Available Shipping Options for Sellers',
        steps: [
          'Standard Delivery: 3-5 business days, most cost-effective for regular orders',
          'Express Delivery: 1-2 business days, premium option for urgent shipments',
          'Same-Day Delivery: Available in Metro Manila for orders placed before 12 PM',
          'Next-Day Delivery: Guaranteed delivery by next business day in major cities',
          'Bulk Shipping: Special rates for orders over 20kg or multiple items',
          'COD (Cash on Delivery): Available for all shipping options in eligible areas',
          'Scheduled Delivery: Allows customers to choose specific delivery time slots',
          'Partner with LBC, J&T Express, Grab Express, and other reliable couriers'
        ],
        tips: [
          'Choose shipping options based on your product type and customer needs',
          'Fresh produce works best with express or same-day delivery options',
          'Offer free shipping by including costs in your product pricing',
          'Same-day delivery helps compete with traditional markets for fresh goods'
        ]
      },
      {
        id: 'packaging-tips',
        title: 'Packaging Guidelines for Safe Delivery',
        steps: [
          'Use sturdy, food-grade packaging materials for all agricultural products',
          'For fresh produce: Use breathable bags, ventilated boxes, or mesh containers',
          'Add ice packs or cooling gel for temperature-sensitive items like leafy greens',
          'Wrap fragile items (eggs, glass containers) with bubble wrap or newspaper',
          'Use eco-friendly packaging materials to support sustainable practices',
          'Include absorbent materials for items that may release moisture',
          'Seal packages properly to prevent contamination during transport',
          'Label packages clearly with "FRAGILE" or "PERISHABLE" when appropriate'
        ],
        tips: [
          'Invest in quality packaging to reduce damage claims and returns',
          'Consider branded packaging to enhance your professional image',
          'Take photos of packed items before shipping for quality documentation',
          'Use appropriate box sizes to minimize shipping costs while ensuring protection'
        ]
      },
      {
        id: 'delivery-times',
        title: 'Understanding Estimated Delivery Times',
        steps: [
          'Metro Manila: Same-day to 2 business days depending on shipping option',
          'Major Cities (Cebu, Davao, Iloilo): 1-3 business days for express delivery',
          'Provincial Areas: 2-5 business days for standard delivery options',
          'Remote/Island Areas: 3-7 business days, subject to weather conditions',
          'Fresh Produce: Prioritized for fastest available shipping method',
          'Bulk Orders: May require additional 1-2 days for processing and packaging',
          'Holiday Seasons: Expect delays of 1-2 additional business days',
          'Weather Conditions: May affect delivery times, especially during typhoons'
        ],
        tips: [
          'Communicate realistic delivery expectations to customers upfront',
          'Update estimated times during peak seasons or weather disturbances',
          'Offer expedited shipping for customers who need faster delivery',
          'Consider delivery times when setting product availability and pricing'
        ]
      }
    ]
  },
  {
    id: 'tracking-shipments',
    title: 'Tracking Shipments',
    icon: Eye,
    description: 'Monitor your shipments and keep customers informed about delivery progress',
    guides: [
      {
        id: 'order-dashboard',
        title: 'Using the Order Dashboard for Tracking',
        steps: [
          'Navigate to your Seller Dashboard and click on "Orders" section',
          'View all active shipments in the "Shipped" tab with real-time status',
          'Click on any order to see detailed tracking information and timeline',
          'Check courier pickup confirmation and estimated delivery dates',
          'Monitor delivery attempts and any delivery exceptions or delays',
          'View customer delivery confirmations and proof of delivery photos',
          'Track multiple orders simultaneously using the bulk tracking view',
          'Export tracking reports for your business records and analysis'
        ],
        tips: [
          'Check your dashboard regularly to stay updated on delivery progress',
          'Use tracking information to proactively communicate with customers',
          'Monitor delivery patterns to optimize your shipping strategies',
          'Keep tracking records for customer service and dispute resolution'
        ]
      },
      {
        id: 'courier-links',
        title: 'Accessing External Courier Tracking',
        steps: [
          'From your order details page, locate the "Tracking Number" section',
          'Click on the courier name or tracking number to open external tracking',
          'LBC: Redirects to LBC tracking portal with pre-filled tracking number',
          'J&T Express: Opens J&T tracking page with real-time GPS location',
          'Grab Express: Shows live tracking map and rider contact information',
          'Use courier mobile apps for push notifications and detailed updates',
          'Contact courier customer service directly through provided hotlines',
          'Screenshot tracking updates for your records and customer communication'
        ],
        tips: [
          'Familiarize yourself with each courier\'s tracking system features',
          'Download courier apps on your phone for mobile tracking convenience',
          'Share tracking links directly with customers for transparency',
          'Use external tracking to verify delivery completion and timing'
        ]
      },
      {
        id: 'shipping-notifications',
        title: 'Setting Up Shipping Notifications',
        steps: [
          'Go to "Account Settings" > "Notification Preferences" in your dashboard',
          'Enable "Order Shipped" notifications to get alerts when couriers pick up',
          'Turn on "Delivery Confirmation" notifications for completed deliveries',
          'Set up "Delivery Exception" alerts for failed or delayed deliveries',
          'Choose notification methods: Email, SMS, or push notifications through the app',
          'Configure notification timing: Real-time, hourly summaries, or daily reports',
          'Enable customer communication notifications for delivery-related messages',
          'Test notification settings with a sample order to ensure proper setup'
        ],
        tips: [
          'Enable all delivery-related notifications to stay informed',
          'Use SMS notifications for urgent delivery issues requiring immediate action',
          'Set up email summaries for daily business tracking and record-keeping',
          'Adjust notification frequency based on your order volume and preferences'
        ]
      }
    ]
  },
  {
    id: 'delivery-issues',
    title: 'Delivery Issues',
    icon: AlertTriangle,
    description: 'Handle common shipping problems and resolve delivery complications effectively',
    guides: [
      {
        id: 'lost-packages',
        title: 'Reporting and Resolving Lost Packages',
        steps: [
          'Monitor tracking status daily and identify packages overdue by 2+ days',
          'Contact the courier directly using their customer service hotline first',
          'Report lost packages to HarvestHub Support within 7 days of expected delivery',
          'Provide order number, tracking number, and last known package location',
          'Submit courier communication records and tracking screenshot evidence',
          'Work with HarvestHub Support to initiate courier investigation process',
          'Offer immediate replacement or refund to affected customers while investigation proceeds',
          'Follow up weekly with courier and HarvestHub until resolution is achieved'
        ],
        tips: [
          'Report lost packages promptly to avoid exceeding reporting deadlines',
          'Maintain good relationships with courier partners for faster resolution',
          'Document all communication attempts for insurance and reimbursement claims',
          'Consider insurance coverage for high-value or frequently shipped items'
        ]
      },
      {
        id: 'damaged-items',
        title: 'Handling Damaged Item Claims',
        steps: [
          'Instruct customers to take photos of damaged items and packaging immediately',
          'Document the extent of damage and assess if items are salvageable',
          'Contact the courier within 24 hours to report packaging or handling damage',
          'Submit damage report with photos to both courier and HarvestHub Support',
          'Determine fault: packaging inadequacy vs. courier mishandling vs. transit conditions',
          'Process customer refund or replacement based on damage assessment',
          'Work with courier for reimbursement if damage is due to improper handling',
          'Review and improve packaging methods to prevent similar future incidents'
        ],
        tips: [
          'Take photos of your packaging before shipment as comparison evidence',
          'Use adequate packaging to minimize damage claims and disputes',
          'Respond quickly to damage reports to maintain customer satisfaction',
          'Learn from damage patterns to improve your packaging and shipping processes'
        ]
      },
      {
        id: 'failed-deliveries',
        title: 'Managing Failed Delivery Attempts',
        steps: [
          'Receive notification of failed delivery attempt from courier or tracking system',
          'Contact the customer immediately to reconfirm delivery address and availability',
          'Verify customer contact information and update if necessary',
          'Coordinate with courier to schedule redelivery at customer\'s preferred time',
          'For multiple failed attempts, arrange alternative delivery location or pickup',
          'Consider changing delivery instructions or adding landmark details',
          'If customer is unreachable, follow HarvestHub\'s abandoned order procedures',
          'Document all redelivery attempts and customer communication for records'
        ],
        tips: [
          'Proactively contact customers before first delivery attempt to confirm availability',
          'Collect detailed delivery instructions including landmarks and contact preferences',
          'Be flexible with delivery arrangements to accommodate customer schedules',
          'Use failed deliveries as opportunities to improve your delivery communication process'
        ]
      }
    ]
  }
];

export default function SellerShippingDeliveryHelp() {
  const [selectedSection, setSelectedSection] = useState<string | null>('delivery-information');
  const [selectedGuide, setSelectedGuide] = useState<string | null>(null);

  const currentSection = shippingGuides.find(section => section.id === selectedSection);

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
                Seller Shipping & Delivery
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
                <Truck className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Seller Shipping & Delivery Help
                </h1>
                <p className="text-green-100 text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Manage shipments, track deliveries, and resolve shipping issues efficiently
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
                  {shippingGuides.map((section) => {
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
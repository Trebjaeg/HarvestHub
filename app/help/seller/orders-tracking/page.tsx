"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeft, 
  ShoppingBag, 
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
  Banknote,
  Package,
  Clock,
  XCircle,
  RefreshCw,
  Truck
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

const orderGuides: GuideSection[] = [
  {
    id: 'order-placement',
    title: 'Order Placement',
    icon: ShoppingBag,
    description: 'Learn how to manage incoming orders and prepare shipments for your customers',
    guides: [
      {
        id: 'confirm-orders',
        title: 'How to Confirm New Orders',
        steps: [
          'Log in to your Seller Dashboard and go to "Orders" section',
          'Review new orders in the "Pending Confirmation" tab',
          'Check order details: items, quantities, delivery address, and payment status',
          'Verify stock availability for all items in your inventory',
          'Click "Confirm Order" to accept and verify you can fulfill the order',
          'Order status automatically changes to "To Ship" after confirmation',
          'Download or print the shipping label from the order details page',
          'Prepare and pack the items securely for shipment',
          'Mark the order as "Ready for Pickup" when package is prepared',
          'Hand over the package to the courier and update status to "Shipped"',
          'Order progresses to "In Transit" and eventually "Delivered" once completed'
        ],
        tips: [
          'Confirm orders within 6-12 hours to avoid automatic cancellations',
          'Double-check inventory levels before confirmation to prevent overselling',
          'Prepare packages immediately after confirmation to maintain smooth operations',
          'Keep shipping labels and tracking information readily accessible for customers'
        ]
      },
      {
        id: 'prepare-shipments',
        title: 'How to Prepare Shipments Properly',
        steps: [
          'Go to "Orders" > "Processing" to view confirmed orders ready for shipment',
          'Gather all items listed in the order and verify quantities',
          'Pack items securely using appropriate packaging materials',
          'For fresh produce: use insulated bags and ice packs if needed',
          'Print the shipping label from your dashboard or courier partner app',
          'Attach the shipping label clearly on the package',
          'Schedule pickup with your chosen courier partner',
          'Mark the order as "Shipped" once the courier collects the package'
        ],
        tips: [
          'Use proper packaging to prevent damage during transit',
          'Include packing slips for easy order verification',
          'Take photos of packaged items for quality assurance',
          'Ensure fresh products are properly refrigerated until pickup'
        ]
      },
    ]
  },
  {
    id: 'order-status',
    title: 'Order Status Management',
    icon: Clock,
    description: 'Understand and manage different order statuses throughout the fulfillment process',
    guides: [
      {
        id: 'status-stages',
        title: 'Understanding Order Status Stages',
        steps: [
          'Pending Confirmation: New orders waiting for your acceptance within 6-12 hours',
          'To Ship: Orders you\'ve confirmed and are preparing for shipment with printed labels',
          'Ready for Pickup: Orders packed and ready for courier collection',
          'Shipped/In Transit: Orders picked up by courier and currently being delivered',
          'Delivered/Completed: Orders successfully received by the customer',
          'On Hold: Orders temporarily paused due to payment, inventory, or other issues',
          'Cancelled: Orders that have been cancelled before shipment by seller, customer, or system',
          'Returned: Orders that have been sent back by the customer after delivery'
        ],
        tips: [
          'Status automatically progresses after each confirmation action by the seller',
          'Each status change triggers automatic notifications to customers via email/SMS',
          'Monitor "To Ship" orders closely to maintain fast fulfillment times',
          'Completed orders after the return period contribute to your seller performance metrics'
        ]
      },
      {
        id: 'update-status',
        title: 'How to Update Order Status',
        steps: [
          'Navigate to "Orders" in your Seller Dashboard',
          'Find the order you need to update using order number or customer name',
          'Click on the order to view detailed information',
          'Look for the "Update Status" button or dropdown menu',
          'Select the appropriate new status based on current order progress',
          'Add tracking information if marking as "Shipped"',
          'Include any relevant notes for the customer (optional)',
          'Click "Update Status" to save changes and notify the customer'
        ],
        tips: [
          'Only update to the next logical status in the fulfillment process',
          'Provide tracking numbers when marking orders as shipped',
          'Add delivery notes for special instructions or delays',
          'Status updates are permanent, so double-check before confirming'
        ]
      },
      {
        id: 'handle-delays',
        title: 'Managing Order Delays and Issues',
        steps: [
          'Identify potential delays early (weather, supply issues, courier problems)',
          'Contact affected customers immediately through the messaging system',
          'Explain the reason for the delay and provide a realistic new timeline',
          'Offer alternatives: partial fulfillment, product substitution, or cancellation',
          'Update the order status to "On Hold" if significant delays are expected',
          'Keep customers updated with regular progress messages',
          'Consider offering compensation (discounts, free shipping) for major delays',
          'Resume normal processing once issues are resolved'
        ],
        tips: [
          'Proactive communication prevents negative reviews and complaints',
          'Be honest about delays rather than making unrealistic promises',
          'Document all customer communications for future reference',
          'Learn from delays to improve your fulfillment processes'
        ]
      }
    ]
  },
  {
    id: 'cancellations',
    title: 'Order Cancellations',
    icon: XCircle,
    description: 'Handle order cancellations efficiently while maintaining customer satisfaction',
    guides: [
      {
        id: 'seller-cancellation',
        title: 'How to Cancel Orders Before Shipping',
        steps: [
          'Go to your Seller Dashboard and navigate to "Orders"',
          'Find the order you need to cancel in "Pending" or "Processing" status',
          'Click on the order to view full details',
          'Select "Cancel Order" from the available actions',
          'Choose a cancellation reason from the dropdown menu',
          'Provide additional explanation in the comment field if needed',
          'Confirm the cancellation by clicking "Cancel Order"',
          'The customer will be notified automatically'
        ],
        tips: [
          'Only cancel orders that haven\'t been shipped yet',
          'Provide clear reasons to help customers understand the situation',
          'Frequent cancellations may affect your seller performance rating',
          'Consider offering alternatives before cancelling completely'
        ]
      },
      {
        id: 'shipped-cancellation',
        title: 'Managing Cancellations for Shipped Orders',
        steps: [
          'Contact HarvestHub Support immediately if you need to cancel a shipped order',
          'Provide the order number and reason for cancellation request',
          'Work with support to coordinate with the courier for package return',
          'If the package can be intercepted, provide return instructions',
          'If the package is already delivered, guide the customer through return process',
          'Document all communications with support and courier partners',
          'Monitor the return process and update customers on progress',
          'Refund will be processed once the returned package is received and verified'
        ],
        tips: [
          'Act quickly as shipped orders are harder to cancel',
          'Coordinate closely with courier partners for package interception',
          'Keep detailed records of all cancellation-related communications',
          'Consider the cost implications of cancelling shipped orders'
        ]
      },
    ]
  },
  {
    id: 'returns-exchanges',
    title: 'Returns & Exchanges',
    icon: RefreshCw,
    description: 'Manage customer return requests and exchange processes effectively',
    guides: [
      {
        id: 'manage-returns',
        title: 'How to Manage Return Requests',
        steps: [
          'Monitor return requests in your "Orders" > "Returns" section',
          'Review each return request details: reason, photos, and customer comments',
          'Check if the return meets your return policy conditions',
          'For valid returns, click "Approve Return" and provide return instructions',
          'For invalid returns, click "Decline Return" with a clear explanation',
          'Approved returns will generate a return shipping label for the customer',
          'Track the return shipment until you receive the returned items',
          'Inspect returned items and process refund once verified'
        ],
        tips: [
          'Respond to return requests within 24-48 hours',
          'Have clear return policies displayed on your product pages',
          'Take photos of returned items for quality verification',
          'Be fair but firm with return policy enforcement'
        ]
      },
      {
        id: 'return-conditions',
        title: 'Understanding Return Conditions',
        steps: [
          'Items must be unused and in original packaging condition',
          'Fresh produce returns are limited to quality issues upon delivery',
          'Sealed products should remain unopened unless defective',
          'Time limits apply: typically 7 days for fresh goods, 15 days for packaged items',
          'Custom or personalized products are generally non-returnable',
          'Items must include all original accessories and documentation',
          'Return shipping costs may be customer\'s responsibility unless item is defective',
          'Photos or videos may be required as proof of item condition'
        ],
        tips: [
          'Clearly communicate return conditions in product descriptions',
          'Be flexible with return conditions for quality issues',
          'Consider the customer\'s purchase history when making return decisions',
          'Document return conditions to avoid future disputes'
        ]
      },
      {
        id: 'handle-exchanges',
        title: 'Processing Exchanges for Defective Items',
        steps: [
          'Review exchange requests in your dashboard under "Returns & Exchanges"',
          'Verify the defect or quality issue through customer-provided photos',
          'Check your inventory for suitable replacement items',
          'Approve the exchange and arrange pickup of the defective item',
          'Ship the replacement item using expedited delivery if possible',
          'Update the customer with tracking information for both pickup and delivery',
          'Follow up to ensure the replacement meets customer expectations',
          'Close the exchange case once the customer confirms satisfaction'
        ],
        tips: [
          'Prioritize exchanges over refunds to maintain customer relationships',
          'Offer upgrades or additional items as goodwill gestures when appropriate',
          'Use exchanges as opportunities to improve product quality',
          'Keep detailed records of exchange patterns to identify recurring issues'
        ]
      }
    ]
  }
];

export default function SellerOrdersTrackingHelp() {
  const [selectedSection, setSelectedSection] = useState<string | null>('order-placement');
  const [selectedGuide, setSelectedGuide] = useState<string | null>(null);

  const currentSection = orderGuides.find(section => section.id === selectedSection);

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
                  Orders & Tracking Help
                </h1>
                <p className="text-green-100 text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Process orders, manage fulfillment, and handle customer requests
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
                  {orderGuides.map((section) => {
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
                    Browse all help topics
                  </p>
                </div>
              </Link>

              <div className="flex items-center space-x-4 p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl">
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
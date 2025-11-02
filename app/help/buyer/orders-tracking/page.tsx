"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeft, 
  ShoppingBag, 
  MapPin, 
  XCircle, 
  RefreshCw, 
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  Truck,
  Calendar,
  CreditCard,
  MessageSquare,
  Phone,
  User
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
    description: 'Learn how to place and modify orders on HarvestHub',
    guides: [
      {
        id: 'place-order',
        title: 'How to Place an Order',
        steps: [
          'Browse products on HarvestHub homepage or use the search function',
          'Click on a product to view detailed information and pricing',
          'Select quantity and any available product variations',
          'Click "Add to Cart" to add the item to your shopping cart',
          'Continue shopping or click the cart icon to review your items',
          'In your cart, verify quantities and remove unwanted items',
          'Click "Proceed to Checkout" when ready to place your order',
          'Select your delivery address or add a new one',
          'Review your order summary including items, total, and delivery details',
          'Apply any promo codes or vouchers if available',
          'Click "Place Order" to confirm and complete your purchase',
          'You\'ll receive an order confirmation with your order number'
        ],
        tips: [
          'Double-check product details and quantities before adding to cart',
          'Look for fresh produce delivery time slots during checkout',
          'Check for available promotions and discounts before placing order',
        ]
      },
      {
        id: 'modify-order',
        title: 'How to Modify an Order Before Checkout',
        steps: [
          'While in your shopping cart, review all added items',
          'To change quantity: Click the + or - buttons next to each item',
          'To remove items: Click the trash icon or "Remove" button',
          'To add more items: Continue shopping and add products to cart',
          'To add special instructions: Use the "Delivery Notes" field',
          'Review the updated order total and delivery fees',
          'Proceed to payment only when you\'re satisfied with all details'
        ],
        tips: [
          'You can modify orders freely before completing payment',
          'Check minimum order requirements for your delivery area',
          'Consider bundling items from the same seller to save on delivery fees',
          'Add delivery instructions for better service (e.g., gate codes, landmarks)'
        ]
      }
    ]
  },
  {
    id: 'order-status',
    title: 'Order Status & Tracking',
    icon: MapPin,
    description: 'Track your orders and resolve status-related issues',
    guides: [
      {
        id: 'track-order',
        title: 'How to Track Your Order',
        steps: [
          'Log in to your HarvestHub account',
          'Go to "My Orders" from your account menu',
          'Find the order you want to track from the list',
          'Click on the order number or "View Details" button',
          'View the current order status and tracking information',
          'Check the estimated delivery date and time slot',
          'Track real-time updates as your order progresses',
          'Receive SMS and email notifications for status changes',
          'Contact the delivery partner directly if provided with their details'
        ],
        tips: [
          'Order statuses include: Confirmed, Processing, Packed, Out for Delivery, Delivered',
          'Fresh produce orders may have shorter processing times',
          'Save the tracking number for easy reference',
          'Enable push notifications for real-time order updates'
        ]
      },
      {
        id: 'order-confirmation-issues',
        title: 'Resolving Order Confirmation Issues',
        steps: [
          'Check your email inbox and spam folder for order confirmation',
          'Log in to your HarvestHub account',
          'Verify that payment was successfully processed',
          'If no confirmation received, screenshot your payment receipt',
          'Contact HarvestHub support with your order details',
          'Provide your email address, phone number, and approximate order time',
          'Include payment reference number if payment was deducted',
          'Wait for support team to investigate and provide order status',
          'Keep all transaction records until issue is resolved'
        ],
        tips: [
          'Order confirmations are usually sent within 5-10 minutes',
          'Multiple attempts to place the same order may result in duplicate charges',
          'Contact support immediately if you suspect payment issues'
        ]
      },
      {
        id: 'delayed-orders',
        title: 'What to Do About Delayed Orders',
        steps: [
          'Check the estimated delivery time in your order details',
          'Allow for potential delays due to weather or high demand',
          'Check for any delivery notifications or updates from the seller',
          'Contact the seller directly through the platform messaging',
          'If no response from seller, escalate to HarvestHub support',
          'Document the delay and any communication attempts',
          'Consider cancelling if delay is unreasonable (case-by-case basis)',
          'Leave feedback about the experience after resolution'
        ],
        tips: [
          'Fresh produce deliveries may be delayed due to sourcing or weather',
          'Peak seasons (holidays, weekends) may experience longer delivery times',
          'Sellers usually communicate delays proactively for transparency',
          'You may be eligible for delivery fee refunds on significant delays'
        ]
      }
    ]
  },
  {
    id: 'cancellations',
    title: 'Order Cancellations',
    icon: XCircle,
    description: 'Learn how to cancel orders before and after shipment',
    guides: [
      {
        id: 'cancel-before-shipment',
        title: 'How to Cancel an Order Before Shipment',
        steps: [
          'Log in to your HarvestHub account',
          'Navigate to "My Orders" section',
          'Find the order you want to cancel',
          'Check the order status - cancellation is only available for certain statuses',
          'Click "Cancel Order" button if available',
          'Select a reason for cancellation from the dropdown menu',
          'Provide additional details if required',
          'Confirm the cancellation request'
        ],
        tips: [
          'Once order is "Processing" or "Packed", cancellation may not be possible',
          'COD orders don\'t require refund processing'
        ]
      },
      {
        id: 'cancel-after-shipment',
        title: 'Cancelling After Order Has Been Shipped',
        steps: [
          'Understand that shipped orders cannot be traditionally "cancelled"',
          'You can refuse delivery when the order arrives',
          'Inform the delivery person that you\'re rejecting the order',
          'The order will be returned to the seller',
          'Contact HarvestHub support to report the rejection',
          'Provide your order number and reason for rejection',
          'Wait for the seller to confirm receipt of returned items',
          'Monitor your refund status in the "My Orders" section'
        ],
        tips: [
          'Refusing delivery may incur return shipping fees in some cases',
          'Fresh produce orders should be rejected immediately upon delivery',
          'Document the condition of returned items with photos if possible',
          'Communicate with seller about the reason for rejection'
        ]
      }
    ]
  },
  {
    id: 'returns-exchanges',
    title: 'Returns & Exchanges',
    icon: RefreshCw,
    description: 'Process returns and exchanges for your orders',
    guides: [
      {
        id: 'request-return',
        title: 'How to Request a Return',
        steps: [
          'Go to "My Orders" and find the delivered order',
          'Click "Request Return" within the return window (usually 7 days)',
          'Select the items you want to return from your order',
          'Choose a reason for return from the provided options',
          'Upload clear photos showing the item condition or defect',
          'Provide detailed description of the issue',
          'Submit the return request for seller review',
          'Wait for seller approval (usually 24-48 hours)',
          'Follow pickup instructions or return shipping guidelines',
          'Track your return status until refund is processed'
        ],
        tips: [
          'Take photos immediately upon delivery if items are damaged',
          'Keep original packaging when possible for returns',
          'Fresh produce returns must be reported within 24 hours of delivery',
          'Some items may not be eligible for return due to hygiene reasons'
        ]
      },
      {
        id: 'return-guidelines',
        title: 'Return Guidelines and Policies',
        steps: [
          'Returns must be initiated within 7 days of delivery',
          'Items must be in original condition with packaging intact',
          'Fresh produce returns accepted only for quality issues',
          'Perishable items must be reported within 24 hours',
          'Take photos of damaged or defective items before use',
          'Keep all original tags, labels, and packaging materials',
          'Items must not show signs of use or damage by customer',
          'Seller reserves the right to inspect returned items',
          'Refunds processed after seller confirms item condition',
          'Return shipping may be paid by customer or seller depending on reason'
        ],
        tips: [
          'Read individual seller return policies as they may vary',
          'Quality issues with fresh produce are usually fully refunded',
          'Non-perishable items have more flexible return timeframes',
          'Document everything with photos for smoother return process'
        ]
      },
      {
        id: 'exchange-procedures',
        title: 'Product Exchange Procedures',
        steps: [
          'Contact the seller directly through platform messaging',
          'Explain what you received vs. what you expected',
          'Provide photos of the incorrect or defective item',
          'Request an exchange for the correct item',
          'Await seller response and exchange approval',
          'Follow seller instructions for returning the incorrect item',
          'Seller will arrange delivery of the correct replacement',
          'No additional payment required for like-for-like exchanges',
          'Confirm receipt and satisfaction with the exchanged item',
          'Leave appropriate feedback after the exchange process'
        ],
        tips: [
          'Exchanges are usually faster than return + new order process',
          'Some sellers offer direct replacement without requiring return first',
          'Size or variety exchanges may require price adjustments',
          'Document the entire exchange process for future reference'
        ]
      }
    ]
  }
];

export default function OrderTrackingHelp() {
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
                  Learn how to place orders, track shipments, and manage your purchases
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
                          selectedGuide === guide.id ? 'border-blue-300 bg-blue-50' : 'hover:border-blue-200'
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
                              <CheckCircle className="w-8 h-8 text-blue-600" />
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
                                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                        {index + 1}
                                      </div>
                                      <div className="flex-1">
                                        <p className="text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                          {step}
                                        </p>
                                        {step === 'Log in to your HarvestHub account' && (
                                          <Link 
                                            href="/auth" 
                                            className="inline-flex items-center mt-2 px-3 py-1.5 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-200 transition-colors"
                                            style={{ fontFamily: 'Poppins, sans-serif' }}
                                          >
                                            Go to Login Page →
                                          </Link>
                                        )}
                                      </div>
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

          {/* Quick Actions Section */}
          <div 
            className="rounded-xl shadow-lg p-8 mb-8 text-white mt-12 relative overflow-hidden"
            style={{
              backgroundImage: 'url(/images/KALI/unnamed.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          >
            {/* Optional overlay for better text readability */}
            <div className="absolute inset-0 bg-black/30 rounded-xl"></div>
            
            <div className="relative z-10">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Quick Order Actions
                </h3>
                <p className="text-white/90" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Fast access to common order management tasks
                </p>
              </div>

              <div className="grid md:grid-cols-4 gap-6">
                <Link href="/my-orders" className="bg-white/15 backdrop-blur-sm rounded-xl p-6 text-center hover:bg-white/25 transition-all duration-300 hover:transform hover:scale-105">
                  <div className="w-12 h-12 bg-white/25 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Package className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    My Orders
                  </h4>
                  <p className="text-sm text-white/90" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    View all your orders
                  </p>
                </Link>

                <div className="bg-white/15 backdrop-blur-sm rounded-xl p-6 text-center hover:bg-white/25 transition-all duration-300 hover:transform hover:scale-105">
                  <div className="w-12 h-12 bg-white/25 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Truck className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Track Order
                  </h4>
                  <p className="text-sm text-white/90" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Real-time tracking
                  </p>
                </div>

                <div className="bg-white/15 backdrop-blur-sm rounded-xl p-6 text-center hover:bg-white/25 transition-all duration-300 hover:transform hover:scale-105">
                  <div className="w-12 h-12 bg-white/25 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <RefreshCw className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Cancelled
                  </h4>
                  <p className="text-sm text-white/90" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Orders Cancellation
                  </p>
                </div>

                <div className="bg-white/15 backdrop-blur-sm rounded-xl p-6 text-center hover:bg-white/25 transition-all duration-300 hover:transform hover:scale-105">
                  <div className="w-12 h-12 bg-white/25 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Contact Seller
                  </h4>
                  <p className="text-sm text-white/90" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Message directly
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Support Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Need More Help with Your Order?
              </h3>
              <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Our support team is ready to assist with any order-related questions
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
                  <Link href="/help/buyer/contact-support" className="block text-white/90 hover:text-white transition-colors text-xs md:text-sm">
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
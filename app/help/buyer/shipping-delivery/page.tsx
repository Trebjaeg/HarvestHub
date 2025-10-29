"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Truck, 
  MapPin, 
  AlertCircle, 
  Package, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Search,
  Phone,
  Camera,
  FileText,
  Navigation,
  Calendar,
  DollarSign
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
    description: 'Learn about delivery times, shipping options, and fees',
    guides: [
      {
        id: 'delivery-times',
        title: 'Estimated Delivery Times',
        steps: [
          'Metro Manila: 1-2 business days for standard delivery',
          'Nearby Provinces (Cavite, Laguna, Rizal, Bulacan): 2-3 business days',
          'Major Cities (Cebu, Davao, Iloilo, Baguio): 3-5 business days',
          'Provincial Areas: 5-7 business days depending on location',
          'Remote/Island Areas: 7-10 business days (subject to weather conditions)',
          'Same-Day Delivery: Available in select Metro Manila areas (order before 12 PM)',
          'Next-Day Delivery: Available for Metro Manila and nearby provinces',
          'Fresh produce may have priority processing for faster delivery',
          'Delivery times may extend during peak seasons and holidays'
        ],
        tips: [
          'Order early in the day for faster processing and potential same-day delivery',
          'Fresh produce orders are prioritized to ensure quality upon delivery',
          'Weather conditions and traffic may affect delivery schedules',
          'Holiday seasons (Christmas, New Year) may experience longer delivery times'
        ]
      },
      {
        id: 'shipping-options',
        title: 'Available Shipping Options',
        steps: [
          'Standard Delivery: Regular shipping with 2-5 business days delivery',
          'Express Delivery: Faster shipping with 1-2 business days delivery',
          'Same-Day Delivery: Available in Metro Manila for orders placed before 12 PM',
          'Scheduled Delivery: Choose your preferred delivery date and time slot',
          'Contactless Delivery: Leave packages at your door with photo confirmation',
          'Pickup Points: Collect orders from designated partner locations',
          'Fresh Produce Delivery: Temperature-controlled transport for perishables',
          'Bulk Order Delivery: Special arrangements for large quantity orders',
          'Select your preferred option during checkout process'
        ],
        tips: [
          'Express and same-day delivery options have additional fees',
          'Scheduled delivery allows you to choose convenient time slots',
          'Contactless delivery is perfect for maintaining social distancing',
          'Pickup points offer flexible collection times and secure storage'
        ]
      },
      {
        id: 'shipping-fees',
        title: 'Shipping Fees and Charges',
        steps: [
          'Standard Delivery: ₱30-₱80 within Metro Manila, ₱80-₱150 for provinces',
          'Express Delivery: Additional ₱50-₱100 on top of standard rates',
          'Same-Day Delivery: ₱150-₱250 depending on distance and order size',
          'Fresh Produce Delivery: May include ₱20-₱50 cold chain handling fee',
          'Free Delivery: Available for orders above minimum threshold (varies by area)',
          'Bulk Orders: Discounted rates for orders above ₱5,000',
          'Remote Areas: Additional ₱50-₱200 surcharge may apply',
          'All fees are calculated and displayed at checkout before payment',
          'Promotional periods may offer reduced or waived delivery fees'
        ],
        tips: [
          'Combine orders to reach free delivery thresholds and save on fees',
          'Check for ongoing promotions that include free delivery offers',
          'Delivery fees help ensure proper handling and timely delivery of your orders',
          'Remote area surcharges cover additional logistics costs for far locations'
        ]
      }
    ]
  },
  {
    id: 'tracking-shipments',
    title: 'Tracking Shipments',
    icon: MapPin,
    description: 'Monitor your orders and track delivery progress in real-time',
    guides: [
      {
        id: 'track-order-id',
        title: 'How to Track Using Order ID',
        steps: [
          'Log in to your HarvestHub account',
          'Go to "My Orders" section from the main menu',
          'Locate the order you want to track using your Order ID',
          'Click "Track Order" or "View Details" next to the order',
          'View real-time tracking information and delivery status',
          'Check estimated delivery date and current location of your package',
          'Monitor status updates: Processing → Packed → Shipped → Out for Delivery → Delivered',
          'Receive automatic SMS and email notifications for status changes',
          'Screenshot tracking details for your records if needed'
        ],
        tips: [
          'Order ID format: HH-YYYYMMDD-XXXXX (e.g., HH-20241028-00123)',
          'Tracking updates occur every few hours during transit',
          'Fresh produce orders may show temperature monitoring information',
          'Save your Order ID for easy reference and customer support inquiries'
        ]
      },
      {
        id: 'courier-information',
        title: 'Courier and Delivery Partner Information',
        steps: [
          'Check your order details to see assigned courier partner',
          'Common partners: LBC, 2GO, J&T Express, Grab Express, Lalamove',
          'Each courier provides their own tracking system and contact details',
          'Use the provided tracking number with the courier\'s website or app',
          'Contact courier directly for delivery-specific inquiries',
          'Courier contact information is available in your order tracking page',
          'Some couriers offer SMS tracking updates directly from them',
          'For same-day delivery, you may receive the driver\'s contact number',
          'Fresh produce may use specialized cold-chain delivery partners'
        ],
        tips: [
          'Download courier apps for more detailed tracking and notifications',
          'Each courier has different delivery time windows and policies',
          'Keep courier contact numbers handy for direct communication about delivery',
          'Some couriers allow you to reschedule delivery or change delivery address'
        ]
      },
      {
        id: 'delivery-notifications',
        title: 'Delivery Notifications and Updates',
        steps: [
          'Enable push notifications in the HarvestHub app for real-time updates',
          'Check your SMS for delivery status updates and tracking information',
          'Monitor your email for detailed order progress reports',
          'Receive notification when your order is packed and ready for shipment',
          'Get alerts when your package is out for delivery with estimated time',
          'Confirmation notification sent upon successful delivery with photo proof',
          'Set notification preferences in your account settings',
          'Allow location access for more accurate delivery time estimates',
          'Contact support if you\'re not receiving expected notifications'
        ],
        tips: [
          'Ensure your phone number and email are up to date for notifications',
          'Check spam/junk folders if you don\'t receive email updates',
          'Delivery photos help confirm successful package receipt',
          'Customize notification frequency to avoid being overwhelmed with updates'
        ]
      }
    ]
  },
  {
    id: 'delivery-issues',
    title: 'Delivery Issues & Resolution',
    icon: AlertCircle,
    description: 'Resolve common delivery problems and report delivery issues',
    guides: [
      {
        id: 'lost-packages',
        title: 'Reporting Lost or Missing Packages',
        steps: [
          'Wait 24-48 hours past expected delivery date before reporting as lost',
          'Check with household members, neighbors, or building security',
          'Verify delivery address is correct in your order details',
          'Look for delivery confirmation photo or signature in tracking',
          'Contact the courier directly using provided contact information',
          'If courier confirms delivery but you haven\'t received it, report to HarvestHub',
          'Go to "My Orders" and click "Report Issue" next to the affected order',
          'Select "Package Not Received" and provide detailed information',
          'Upload any relevant photos or documentation',
          'Wait for investigation results and resolution from support team'
        ],
        tips: [
          'Check common hiding spots: behind planters, with security, alternate entrances',
          'Delivery drivers sometimes leave packages in safe but unexpected locations',
          'Report missing packages within 7 days of expected delivery for best resolution',
          'Keep all communication records with couriers for faster investigation'
        ]
      },
      {
        id: 'damaged-items',
        title: 'Handling Damaged Items Upon Delivery',
        steps: [
          'Inspect packages immediately upon delivery before signing/accepting',
          'Take photos of damaged packaging from multiple angles',
          'Open packages carefully and document any internal damage',
          'Take clear photos of damaged items with order details visible',
          'Do not throw away damaged packaging - keep for investigation',
          'Report damage immediately through the HarvestHub app or website',
          'Go to "My Orders" > "Report Issue" > "Damaged Item"',
          'Upload all photos and provide detailed description of damage',
          'Follow any additional instructions provided by customer support',
          'Keep damaged items until resolution is provided by support team'
        ],
        tips: [
          'Fresh produce should be reported within 2 hours for quality issues',
          'Document everything - photos are crucial for damage claims',
          'Don\'t accept delivery if outer packaging shows severe damage',
          'Some damage may not be visible until unpackaging - report as soon as discovered'
        ]
      },
      {
        id: 'missed-deliveries',
        title: 'Managing Missed Delivery Attempts',
        steps: [
          'Check for delivery attempt notification via SMS, email, or app',
          'Review any delivery attempt notice left at your address',
          'Contact the courier immediately to reschedule delivery',
          'Provide alternative delivery instructions or authorized recipient',
          'Some couriers allow address changes for the next delivery attempt',
          'If multiple attempts fail, package may be returned to sender',
          'Contact HarvestHub support if courier is unresponsive',
          'Consider alternative delivery options like pickup points',
          'Update your delivery preferences to avoid future missed deliveries',
          'Ensure someone is available during scheduled delivery windows'
        ],
        tips: [
          'Leave clear delivery instructions and alternative contact numbers',
          'Authorize neighbors or security to receive packages on your behalf',
          'Consider delivery to your workplace if home delivery is problematic',
          'Most couriers make 2-3 delivery attempts before returning packages'
        ]
      }
    ]
  }
];

export default function ShippingDeliveryHelp() {
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
                Shipping & Delivery
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
                  Shipping & Delivery Help
                </h1>
                <p className="text-green-100 text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Track orders, understand delivery times, and resolve shipping issues
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
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${selectedSection === section.id ? 'text-purple-600' : 'text-gray-500'}`} />
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
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <currentSection.icon className="w-6 h-6 text-purple-600" />
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
                          selectedGuide === guide.id ? 'border-purple-300 bg-purple-50' : 'hover:border-purple-200'
                        }`}
                        onClick={() => setSelectedGuide(selectedGuide === guide.id ? null : guide.id)}
                      >
                        <h3 className="font-semibold text-gray-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {guide.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          Click to view detailed information
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-purple-600 font-medium">
                            {guide.steps.length} points
                          </span>
                          <div className="text-purple-600">
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
                              <CheckCircle className="w-8 h-8 text-purple-600" />
                              <h3 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                {guide.title}
                              </h3>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                              <div>
                                <h4 className="font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                  Detailed Information
                                </h4>
                                <div className="space-y-3">
                                  {guide.steps.map((step, index) => (
                                    <div key={index} className="flex items-start space-x-3">
                                      <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
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

          {/* Delivery Status Tracker */}
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl shadow-lg p-8 mb-8 text-white mt-12">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Track Your Delivery Status
              </h3>
              <p className="text-purple-100" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Monitor your order progress through each delivery stage
              </p>
            </div>

            <div className="grid md:grid-cols-5 gap-4">
              {[
                { icon: Package, label: 'Processing', desc: 'Order confirmed' },
                { icon: CheckCircle, label: 'Packed', desc: 'Ready for pickup' },
                { icon: Truck, label: 'Shipped', desc: 'On the way' },
                { icon: Navigation, label: 'Out for Delivery', desc: 'With courier' },
                { icon: CheckCircle, label: 'Delivered', desc: 'Successfully delivered' }
              ].map((status, index) => (
                <div key={index} className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
                  <div className="w-12 h-12 bg-white/20 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <status.icon className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold mb-1 text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {status.label}
                  </h4>
                  <p className="text-xs text-purple-100" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {status.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions Section */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Link href="/my-orders" className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg mb-4 flex items-center justify-center">
                <Search className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Track My Order
              </h4>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Check real-time delivery status
              </p>
            </Link>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="w-12 h-12 bg-red-100 rounded-lg mb-4 flex items-center justify-center">
                <Camera className="w-6 h-6 text-red-600" />
              </div>
              <h4 className="font-semibold text-gray-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Report Damage
              </h4>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Report damaged or missing items
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg mb-4 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Schedule Delivery
              </h4>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Choose convenient delivery times
              </p>
            </div>
          </div>

          {/* Contact Support Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Need Help with Delivery?
              </h3>
              <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Our shipping team is ready to assist with any delivery concerns
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <Link href="/help" className="flex items-center space-x-4 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl hover:from-purple-100 hover:to-indigo-100 transition-colors">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
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

              <div className="flex items-center space-x-4 p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Delivery Support
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
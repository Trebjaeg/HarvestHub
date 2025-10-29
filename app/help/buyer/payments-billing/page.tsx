"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  CreditCard, 
  Smartphone, 
  Banknote, 
  AlertCircle, 
  RefreshCw, 
  Receipt,
  Download,
  Calculator,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  FileText,
  Shield,
  Clock
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

const paymentGuides: GuideSection[] = [
  {
    id: 'payment-methods',
    title: 'Payment Methods',
    icon: CreditCard,
    description: 'Learn about available payment options for your HarvestHub orders',
    guides: [
      {
        id: 'credit-debit-cards',
        title: 'Credit & Debit Cards',
        steps: [
          'Go to checkout and select "Credit/Debit Card" as payment method',
          'Enter your card number (16 digits without spaces)',
          'Fill in the expiration date (MM/YY format)',
          'Enter the CVV/CVC code (3 digits on back, 4 for Amex)',
          'Provide the cardholder name as it appears on the card',
          'Choose to save the card for future purchases (optional)',
          'Review card details and billing address',
          'Complete the payment by clicking "Pay Now"',
          'Wait for payment confirmation and order processing'
        ],
        tips: [
          'We accept Visa, Mastercard, and American Express cards',
          'Ensure your card has international transactions enabled',
          'Your card information is encrypted and secure with 256-bit SSL',
          'Check with your bank if payment is declined repeatedly'
        ]
      },
      {
        id: 'digital-wallets',
        title: 'Digital Wallets & UPI',
        steps: [
          'At checkout, select your preferred digital wallet option',
          'Choose from GCash, PayMaya, or other available wallets',
          'You\'ll be redirected to your wallet app or website',
          'Log in to your digital wallet account if prompted',
          'Verify the payment amount and merchant details',
          'Confirm the payment using your wallet PIN or biometric',
          'Wait for the payment confirmation from your wallet',
          'You\'ll be redirected back to HarvestHub with order confirmation',
          'Check your wallet for transaction receipt'
        ],
        tips: [
          'Ensure sufficient balance in your digital wallet before payment',
          'Digital wallet payments are usually processed instantly',
          'Keep your wallet app updated for smooth transactions',
          'Contact your wallet provider if payment fails'
        ]
      },
      {
        id: 'cash-on-delivery',
        title: 'Cash on Delivery (COD)',
        steps: [
          'Select "Cash on Delivery" during checkout',
          'Verify your delivery address is correct and complete',
          'Confirm the order total including delivery fees',
          'Submit your order - no payment required at this stage',
          'Receive order confirmation with estimated delivery time',
          'Prepare exact cash amount for delivery (change may be limited)',
          'Be available during the scheduled delivery window',
          'Pay the delivery person upon receiving your order',
          'Get your receipt and verify order completeness'
        ],
        tips: [
          'COD is available in select delivery areas only',
          'Small change is provided but exact amount is preferred',
          'COD orders may have additional service fees',
          'Verify order contents before making payment to delivery person'
        ]
      }
    ]
  },
  {
    id: 'payment-issues',
    title: 'Payment Issues & Troubleshooting',
    icon: AlertCircle,
    description: 'Resolve payment failures and request refunds for payment issues',
    guides: [
      {
        id: 'failed-payments',
        title: 'Troubleshooting Failed Payments',
        steps: [
          'Check your internet connection and try again',
          'Verify that all card details are entered correctly',
          'Ensure your card has sufficient available balance or credit limit',
          'Confirm that your card is enabled for online transactions',
          'Check if your card has expired or is blocked',
          'Try using a different payment method (card, wallet, or COD)',
          'Clear your browser cache and cookies, then retry',
          'Disable VPN or proxy if you\'re using one',
          'Contact your bank if the card is being declined',
          'Reach out to HarvestHub support if issues persist'
        ],
        tips: [
          'Payment failures are often due to bank security measures',
          'International cards may need to be enabled for Philippines transactions',
          'Try payment during bank business hours for better success rates',
          'Screenshot error messages to help support diagnose issues'
        ]
      },
      {
        id: 'refund-requests',
        title: 'How to Request Payment Refunds',
        steps: [
          'Log in to your HarvestHub account',
          'Go to "My Orders" and find the problematic order',
          'Click on "Request Refund" or "Report Payment Issue"',
          'Select the reason for refund request from the dropdown',
          'Provide detailed description of the payment issue',
          'Upload screenshots of error messages or bank statements if applicable',
          'Submit the refund request for review',
          'Wait for support team response (usually within 24-48 hours)',
          'Provide additional information if requested by support',
          'Track refund status in your order history'
        ],
        tips: [
          'Refunds typically process within 5-7 business days',
          'Refund will be credited to your original payment method',
          'Keep transaction receipts and screenshots for faster processing',
          'Contact support immediately if charged multiple times for same order'
        ]
      },
      {
        id: 'payment-security',
        title: 'Payment Security & Protection',
        steps: [
          'Always shop on the official HarvestHub website or app',
          'Look for the padlock icon and "https://" in the URL',
          'Never share your card details via email or phone',
          'Use secure networks when making online payments',
          'Enable two-factor authentication on your account',
          'Regularly monitor your bank and card statements',
          'Report suspicious transactions to your bank immediately',
          'Use strong, unique passwords for your HarvestHub account',
          'Log out of your account when using shared computers',
          'Keep your devices and browsers updated with security patches'
        ],
        tips: [
          'HarvestHub uses industry-standard encryption for all payments',
          'We never store complete card numbers on our servers',
          'Your CVV code is never saved for future transactions',
          'Report phishing attempts or suspicious emails to our security team'
        ]
      }
    ]
  },
  {
    id: 'billing-invoices',
    title: 'Billing & Invoices',
    icon: Receipt,
    description: 'Understand charges, download invoices, and learn about taxes and fees',
    guides: [
      {
        id: 'understanding-charges',
        title: 'Understanding Your Charges',
        steps: [
          'Product Cost: Base price of items in your order',
          'Delivery Fee: Shipping cost based on location and order size',
          'Service Fee: Platform fee for using HarvestHub services',
          'Packaging Fee: Cost for eco-friendly packaging materials',
          'VAT/Tax: Government-mandated taxes (12% VAT in Philippines)',
          'Discount/Promo: Savings from applied vouchers or promotions',
          'Total Amount: Final amount charged to your payment method',
          'View detailed breakdown in your order confirmation email',
          'All fees are clearly displayed before payment confirmation'
        ],
        tips: [
          'Delivery fees may vary based on distance and order weight',
          'Minimum order amounts may apply for free delivery',
          'Service fees help maintain platform quality and security',
          'Bulk orders may qualify for reduced per-item costs'
        ]
      },
      {
        id: 'download-invoices',
        title: 'How to Download Invoices',
        steps: [
          'Log in to your HarvestHub account',
          'Navigate to "My Orders" from the main menu',
          'Find the order for which you need an invoice',
          'Click "View Details" next to the specific order',
          'Scroll down to find the "Invoice" or "Receipt" section',
          'Click "Download Invoice" or "Download Receipt"',
          'Choose PDF format for easy printing and storage',
          'Save the file to your device or cloud storage',
          'The invoice includes all order details, taxes, and payment information'
        ],
        tips: [
          'Invoices are generated after successful payment confirmation',
          'Digital receipts are environmentally friendly and secure',
          'Keep invoices for warranty claims and business expense tracking',
          'Contact support if you need invoices for orders older than 1 year'
        ]
      },
      {
        id: 'taxes-fees',
        title: 'Taxes and Fees Breakdown',
        steps: [
          'Value Added Tax (VAT): 12% applied to most products',
          'Delivery Fee: Varies by location (₱30-₱150 typical range)',
          'Service Fee: 2-5% of order value for platform services',
          'Payment Processing Fee: May apply for certain payment methods',
          'Packaging Fee: ₱5-₱20 depending on order size and eco-packaging',
          'Rush Delivery Fee: Additional cost for same-day or express delivery',
          'Remote Area Surcharge: Extra fee for deliveries to distant locations',
          'All fees are calculated and displayed at checkout before payment',
          'Taxes and fees comply with Philippine government regulations'
        ],
        tips: [
          'VAT-registered businesses can request VAT invoices for tax credits',
          'Some promotional items may have different tax treatments',
          'Delivery fees help ensure fresh produce reaches you in optimal condition',
          'Bulk orders may qualify for reduced service fees'
        ]
      }
    ]
  }
];

export default function PaymentsBillingHelp() {
  const [selectedSection, setSelectedSection] = useState<string | null>('payment-methods');
  const [selectedGuide, setSelectedGuide] = useState<string | null>(null);

  const currentSection = paymentGuides.find(section => section.id === selectedSection);

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
                Payments & Billing
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
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Payments & Billing Help
                </h1>
                <p className="text-green-100 text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Manage your payments, understand charges, and resolve billing issues
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
                  {paymentGuides.map((section) => {
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
                            ? 'bg-orange-50 text-orange-700 border border-orange-200'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${selectedSection === section.id ? 'text-orange-600' : 'text-gray-500'}`} />
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
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <currentSection.icon className="w-6 h-6 text-orange-600" />
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
                          selectedGuide === guide.id ? 'border-orange-300 bg-orange-50' : 'hover:border-orange-200'
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
                          <span className="text-xs text-orange-600 font-medium">
                            {guide.steps.length} steps
                          </span>
                          <div className="text-orange-600">
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
                              <CheckCircle className="w-8 h-8 text-orange-600" />
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
                                      <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
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

          {/* Payment Security Banner */}
          <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl shadow-lg p-8 mb-8 text-white mt-12">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Your Payments Are Secure
              </h3>
              <p className="text-orange-100" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Advanced encryption and security measures protect your financial information
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-white/10 backdrop-blur rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Shield className="w-6 h-6" />
                </div>
                <h4 className="font-semibold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  SSL Encryption
                </h4>
                <p className="text-sm text-orange-100" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  256-bit security
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h4 className="font-semibold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  PCI Compliant
                </h4>
                <p className="text-sm text-orange-100" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Industry standards
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
                <h4 className="font-semibold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Real-time Processing
                </h4>
                <p className="text-sm text-orange-100" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Instant verification
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <h4 className="font-semibold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Refund Protection
                </h4>
                <p className="text-sm text-orange-100" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Buyer guarantee
                </p>
              </div>
            </div>
          </div>

          {/* Contact Support Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Need Help with Payments?
              </h3>
              <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Our payment specialists are here to help resolve any billing issues
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <Link href="/help" className="flex items-center space-x-4 p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl hover:from-orange-100 hover:to-red-100 transition-colors">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
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
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Payment Support
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
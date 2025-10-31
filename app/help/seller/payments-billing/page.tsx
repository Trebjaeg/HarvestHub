"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  CreditCard, 
  Shield, 
  DollarSign, 
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
  Truck,
  Wallet,
  Receipt,
  FileText,
  Calculator
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
    description: 'Understand accepted payment methods and how to manage your payout preferences',
    guides: [
      {
        id: 'accepted-payments',
        title: 'Accepted Payment Methods from Customers',
        steps: [
          'Cash on Delivery (COD): Available in eligible delivery areas',
          'Gift Cards: HarvestHub gift card redemptions',
          'All payment methods are processed securely through our payment gateway'
        ],
        tips: [
          'You receive the same payout regardless of customer payment method',
          'COD orders may have slightly longer payout processing times',
          'All transactions are encrypted and PCI DSS compliant'
        ]
      },
      {
        id: 'seller-payouts',
        title: 'Managing Seller Payouts',
        steps: [
          'Go to your Seller Dashboard and navigate to "Financial Settings"',
          'Click on "Payout Methods" to view your current setup',
          'Add or update your bank account details for direct transfers',
          'Link your GCash or PayMaya account for faster digital payouts',
          'Verify your payout method by completing the authentication process',
          'Set your preferred payout frequency: weekly or bi-weekly',
          'Payouts are automatically processed after successful order deliveries',
          'Funds are typically available within 1-3 business days after processing'
        ],
        tips: [
          'Bank transfers are processed every Friday for the previous week',
          'Digital wallet payouts may be available faster than bank transfers',
          'Ensure your payout account name matches your seller registration',
          'Keep your payout methods updated to avoid payment delays'
        ]
      },
      {
        id: 'change-method',
        title: 'How to Change Payout Methods',
        steps: [
          'Log in to your Seller Dashboard and go to "Financial Settings"',
          'Select "Payout Methods" from the menu options',
          'Click "Edit" next to your current payout method',
          'Choose a new payout type: Bank Transfer or Digital Wallet',
          'Enter the new account details and verify ownership',
          'Upload required verification documents if requested',
          'Test the new method with a small payout if available',
          'Set the new method as your default for future payouts'
        ],
        tips: [
          'Changes take effect for the next payout cycle',
          'Keep at least one verified payout method active at all times',
          'You can have multiple payout methods but only one default',
          'Contact support if you need help with verification documents'
        ]
      }
    ]
  },
  {
    id: 'payment-issues',
    title: 'Payment Issues',
    icon: AlertTriangle,
    description: 'Troubleshoot common payment problems and understand processing timelines',
    guides: [
      {
        id: 'failed-transactions',
        title: 'Handling Failed Payout Transactions',
        steps: [
          'Check your email for payout failure notifications from HarvestHub',
          'Log in to your dashboard and review the "Financial Activity" section',
          'Verify your bank account or e-wallet details are correct and up-to-date',
          'Ensure your payout account is active and not frozen or suspended',
          'Check if your bank has any restrictions on incoming transfers',
          'Update your payout method if the account details have changed',
          'Contact your bank or e-wallet provider to resolve account issues',
          'Retry the payout once account issues are resolved'
        ],
        tips: [
          'Failed payouts are automatically retried after 24-48 hours',
          'Keep your contact information updated for important notifications',
          'Multiple failed attempts may temporarily suspend payout processing',
          'Document any bank-related issues for faster resolution'
        ]
      },
      {
        id: 'pending-payouts',
        title: 'Understanding Pending Payouts',
        steps: [
          'Pending payouts appear after orders are marked as "Delivered"',
          'There\'s a 7-day holding period for quality assurance and returns',
          'During this period, customers can report issues or request returns',
          'After the holding period, payouts are processed in the next cycle',
          'Weekly payouts are processed every Friday for eligible earnings',
          'Processing time varies: 1-2 days for e-wallets, 2-3 days for banks',
          'You can track payout status in your "Financial Dashboard"',
          'Contact support if payouts are delayed beyond normal timeframes'
        ],
        tips: [
          'The 7-day holding period protects both sellers and buyers',
          'Faster delivery confirmation can reduce the holding period',
          'Quality issues during holding period may affect payout timing',
          'Regular sellers may qualify for reduced holding periods'
        ]
      },
    ]
  },
  {
    id: 'billing-invoices',
    title: 'Billing & Invoices',
    icon: Receipt,
    description: 'Access your billing information, download invoices, and understand fee structures',
    guides: [
      {
        id: 'billing-summary',
        title: 'How to View Your Billing Summary',
        steps: [
          'Navigate to your Seller Dashboard and click on "Financial Reports"',
          'Select "Billing Summary" to view your account overview',
          'Review total sales, commission fees, and net earnings for each period',
          'Filter by date range to see specific time period performance',
          'View breakdown of successful orders, refunds, and adjustments',
          'Check payout history and pending payment amounts',
          'Export summary data for your own record-keeping purposes',
          'Use filters to analyze performance by product category or time period'
        ],
        tips: [
          'Billing summaries are updated in real-time as orders are processed',
          'Use date filters to prepare monthly or quarterly business reports',
          'Compare different periods to track your business growth',
          'Screenshot or download summaries for tax preparation'
        ]
      },
      {
        id: 'download-invoices',
        title: 'Downloading Invoices for Records',
        steps: [
          'Go to "Financial Reports" > "Invoices & Receipts" in your dashboard',
          'Select the billing period you need invoices for',
          'Click "Generate Invoice" for the selected time period',
          'Review the invoice details before downloading',
          'Download the invoice as PDF for your business records',
          'Save invoices in an organized folder structure by month/year',
          'Use invoices for tax filing and business expense tracking',
          'Keep both digital and physical copies for accounting purposes'
        ],
        tips: [
          'Invoices are generated monthly and available for 2 years',
          'Include HarvestHub invoices in your business tax filings',
          'Organize invoices by fiscal year for easier accounting',
          'Contact support if you need invoices older than 2 years'
        ]
      },
      {
        id: 'taxes-deductions',
        title: 'Understanding Taxes & Deductions',
        steps: [
          'Commission Fee: 3-8% of sale price depending on product category',
          'Payment Processing Fee: 3.5% + ₱15 for credit card transactions',
          'VAT (Value Added Tax): 12% applied to commission and processing fees',
          'Shipping Fee: Retained by seller if charged to customer',
          'Promotional Fees: Deducted when participating in campaigns',
          'Refund Processing: No additional fees for approved refunds',
          'Chargeback Fee: ₱500 for disputed transactions (if seller at fault)',
          'All fees are clearly itemized in your billing statements'
        ],
        tips: [
          'Commission rates vary by product category - check your seller agreement',
          'VAT is calculated on HarvestHub\'s service fees, not your product sales',
          'Keep detailed records of all fees for business tax purposes',
          'Consider fees when setting your product prices for profitability'
        ]
      }
    ]
  }
];

export default function SellerPaymentsBillingHelp() {
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
                Seller Payments & Billing
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
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Seller Payments & Billing Help
                </h1>
                <p className="text-green-100 text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Manage payouts, understand fees, and access your billing information
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
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import LoadingDots from '@/components/ui/LoadingDots';
import { 
  Search, 
  Settings, 
  Mail, 
  Phone, 
  Home,
  User,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  CreditCard,
  Truck,
  Star,
  Package,
  ShoppingCart,
  Store,
  MessageCircle
} from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

interface HelpSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  topics: string[];
  faqs: FAQItem[];
}

interface HotQuestion {
  question: string;
  answer: string;
}

const buyerSections: HelpSection[] = [
  {
    id: 'account-profile',
    title: 'Account & Profile',
    icon: User,
    description: 'Manage your account settings, profile information, and security',
    topics: [
      'Creating a new account',
      'Updating profile information',
      'Password recovery and reset',
      'Managing delivery addresses',
      'Account verification',
      'Privacy settings',
      'Deleting your account',
      'Two-factor authentication'
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
    id: 'orders-tracking',
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
      'Order delivery issues',
      'Bulk ordering options'
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
    id: 'payments-billing',
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
      'Invoice and receipt downloads',
      'Installment payment options'
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
    id: 'shipping-delivery',
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
      'Special delivery instructions',
      'Same-day delivery options'
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
    id: 'products-services',
    title: 'Products & Services',
    icon: Star,
    description: 'Product information, warranties, and review system',
    topics: [
      'Understanding product details',
      'Product availability and stock',
      'Product warranties and guarantees',
      'How to write product reviews',
      'Photo and video reviews',
      'Reporting inappropriate content',
      'Product comparison features',
      'Freshness guarantee policy'
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
    id: 'technical-support',
    title: 'Technical Support',
    icon: Settings,
    description: 'App issues, website problems, and technical troubleshooting',
    topics: [
      'App crashes and freezing',
      'Website loading issues',
      'Login and authentication problems',
      'Notification settings',
      'App updates and features',
      'Browser compatibility',
      'Mobile app installation',
      'Performance optimization'
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
  },
  {
    id: 'contact-support',
    title: 'Contact Support',
    icon: Phone,
    description: 'Get in touch with our support team for personalized help',
    topics: [
      'Live chat with Kali (AI Assistant)',
      'Email support options',
      'Support ticket system',
      'Priority support for issues',
      'Escalation procedures',
      'Feedback and suggestions',
      'Report bugs or issues',
      'Business hours and response times'
    ],
    faqs: [
      {
        question: 'How can I contact HarvestHub support?',
        answer: 'You can reach us through live chat with Kali (our AI assistant) or email us at admin@harvesthubph.app. We typically respond within 24 hours.'
      },
      {
        question: 'What information should I include when contacting support?',
        answer: 'Please include your order number (if applicable), a detailed description of the issue, and any relevant screenshots or error messages.'
      }
    ]
  }
];

const hotQuestions: HotQuestion[] = [
  {
    question: "How do I track my order?",
    answer: "Go to 'My Orders' in your account dashboard. You'll see real-time tracking information and receive SMS/email updates on your order status."
  },
  {
    question: "How can I cancel my order after payment?",
    answer: "You can cancel orders within 1 hour of placement if they haven't been processed yet. Go to 'My Orders' and click 'Cancel Order' if available."
  },
  {
    question: "Why did my payment fail?",
    answer: "Payment failures can occur due to insufficient funds, expired cards, network issues, or bank restrictions. Please check your payment details and try again."
  },
  {
    question: "How can I request a refund?",
    answer: "Go to 'My Orders', select the order, and click 'Request Refund'. Provide a reason and any supporting photos. Refunds are processed within 3-5 business days."
  },
  {
    question: "What should I do if I received a damaged item?",
    answer: "Take photos of the damaged item immediately and report it through 'My Orders' or contact support. We'll arrange a replacement or full refund."
  }
];

const sellerSections: HelpSection[] = [
  {
    id: 'account-profile',
    title: 'Account & Profile',
    icon: User,
    description: 'Manage your seller account settings, profile information, and business verification',
    topics: [
      'Creating a seller account',
      'Business profile setup',
      'Account verification process',
      'Password recovery and reset',
      'Managing business information',
      'Store profile and branding',
      'Privacy and security settings',
      'Account deactivation'
    ],
    faqs: [
      {
        question: 'How do I verify my seller account?',
        answer: 'Upload your business registration documents, valid ID, and bank account information. Verification typically takes 2-3 business days.'
      },
      {
        question: 'What documents do I need to register as a seller?',
        answer: 'You need a valid government ID, business registration (DTI/SEC), BIR registration, and bank account details for payouts.'
      }
    ]
  },
  {
    id: 'orders-tracking',
    title: 'Orders & Tracking',
    icon: ShoppingBag,
    description: 'Process orders, handle shipping, and manage customer requests',
    topics: [
      'Viewing and processing orders',
      'Order fulfillment workflow',
      'Shipping and delivery management',
      'Order status updates',
      'Handling order modifications',
      'Order tracking information',
      'Managing order cancellations',
      'Customer communication'
    ],
    faqs: [
      {
        question: 'How quickly do I need to process orders?',
        answer: 'Orders should be processed within 24-48 hours. Mark orders as "Processing" when you start preparing them and "Shipped" when dispatched.'
      },
      {
        question: 'How do I update order status?',
        answer: 'Go to your order management dashboard, select the order, and update the status. Customers will receive automatic notifications.'
      }
    ]
  },
  {
    id: 'payments-billing',
    title: 'Payments & Billing',
    icon: CreditCard,
    description: 'Understand payouts, commissions, and financial processes',
    topics: [
      'Seller payout schedule',
      'Commission and fee structure',
      'Payment methods for sellers',
      'Tax reporting and compliance',
      'Processing returns and refunds',
      'Financial reporting and statements',
      'Promotional fee management',
      'Payment dispute resolution'
    ],
    faqs: [
      {
        question: 'When do I receive my payments?',
        answer: 'Seller payouts are processed weekly every Friday for orders completed 7 days prior. Funds are transferred to your registered bank account.'
      },
      {
        question: 'What commission does HarvestHub charge?',
        answer: 'Commission rates vary by category, typically ranging from 3-8%. You can view the exact rates in your seller agreement and dashboard.'
      }
    ]
  },
  {
    id: 'shipping-delivery',
    title: 'Shipping & Delivery',
    icon: Truck,
    description: 'Manage shipping options, delivery partners, and logistics',
    topics: [
      'Available shipping partners',
      'Setting up shipping rates',
      'Delivery timeframes and coverage',
      'Packaging requirements',
      'Handling damaged packages',
      'Special delivery instructions',
      'Shipping insurance options',
      'International shipping (if applicable)'
    ],
    faqs: [
      {
        question: 'Which shipping partners can I use?',
        answer: 'You can use our integrated shipping partners including LBC, J&T Express, and Grab Express. Set your preferred options in your seller dashboard.'
      },
      {
        question: 'How do I handle shipping costs?',
        answer: 'You can offer free shipping and include costs in product prices, or set shipping rates based on weight, distance, or flat rates.'
      }
    ]
  },
  {
    id: 'products-services',
    title: 'Products & Services',
    icon: Package,
    description: 'Learn how to manage your product listings effectively',
    topics: [
      'Adding new products',
      'Product listing guidelines',
      'Managing product images and descriptions',
      'Inventory and stock management',
      'Product categorization',
      'Pricing strategies',
      'Bulk product uploads',
      'Product variations and options'
    ],
    faqs: [
      {
        question: 'How do I add a new product to my store?',
        answer: 'Go to your Seller Dashboard, click "Add Product," fill in the product details, upload high-quality images, and set your price and inventory levels.'
      },
      {
        question: 'What are the image requirements for products?',
        answer: 'Use high-resolution images (minimum 800x800px), clear product shots, and ensure good lighting. You can upload up to 10 images per product.'
      }
    ]
  },
  {
    id: 'technical-support',
    title: 'Technical Support',
    icon: Settings,
    description: 'Resolve technical issues with the seller platform',
    topics: [
      'Seller app troubleshooting',
      'Website and dashboard issues',
      'Upload and sync problems',
      'Payment processing errors',
      'Notification settings',
      'Mobile app features',
      'Integration and API support',
      'Performance optimization'
    ],
    faqs: [
      {
        question: 'Why are my product updates not showing?',
        answer: 'Product changes may take up to 30 minutes to reflect. Clear your browser cache or refresh the app if updates don\'t appear.'
      },
      {
        question: 'How do I enable seller notifications?',
        answer: 'Go to your account settings, select "Notifications," and enable alerts for orders, messages, and important updates.'
      }
    ]
  },
  {
    id: 'contact-support',
    title: 'Contact Support',
    icon: Phone,
    description: 'Get in touch with our seller support team for personalized help',
    topics: [
      'Live chat with Kali (AI Assistant)',
      'Seller support email',
      'Priority support for sellers',
      'Support ticket system',
      'Escalation procedures',
      'Business growth consultation',
      'Report technical issues',
      'Feedback and suggestions'
    ],
    faqs: [
      {
        question: 'How can I contact seller support?',
        answer: 'You can reach our seller support team through live chat with Kali or email us at seller-support@harvesthubph.app. Priority support within 12 hours.'
      },
      {
        question: 'Do sellers get priority support?',
        answer: 'Yes! Sellers receive priority support with faster response times and dedicated assistance for business-critical issues.'
      }
    ]
  }
];

export default function HelpCenterPage() {
  const [activeTab, setActiveTab] = useState<'buyer' | 'seller'>('buyer');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [selectedHotQuestion, setSelectedHotQuestion] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSectionLoading, setIsSectionLoading] = useState(false);
  const [isNavigatingProfile, setIsNavigatingProfile] = useState(false);

  const currentSections = activeTab === 'buyer' ? buyerSections : sellerSections;
  
  // Simulate search loading
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (value.trim()) {
      setIsSearching(true);
      setTimeout(() => setIsSearching(false), 500);
    } else {
      setIsSearching(false);
    }
  };

  // Simulate section loading
  const handleSectionClick = (sectionId: string) => {
    setIsSectionLoading(true);
    setTimeout(() => {
      setSelectedSection(selectedSection === sectionId ? null : sectionId);
      setIsSectionLoading(false);
    }, 300);
  };

  const handleProfileNavigation = () => {
    setIsNavigatingProfile(true);
    setTimeout(() => {
      window.location.href = '/my-profile';
    }, 500);
  };

  const filteredSections = currentSections.filter(section =>
    section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.topics.some(topic => topic.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
                href="/home"
                className="flex items-center space-x-2 px-4 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 font-medium"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline font-black"style={{ fontFamily: 'Poppins, sans-serif'}}>Back to Home</span>
              </Link>
              <span className="text-gray-400">|</span>
              <button 
                onClick={handleProfileNavigation}
                className="flex items-center space-x-2 px-4 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 font-medium"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                {isNavigatingProfile ? (
                  <LoadingDots />
                ) : (
                  <>
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline font-bold" style={{ fontFamily: 'Poppins, sans-serif'}}>Profile</span>
                  </>
                )}
              </button>
              <span className="text-gray-400">|</span>
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
      <div className="text-white py-16" style={{ background: 'linear-gradient(135deg, #008236 0%, #00a644 100%)' }}>
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-8" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Hi, how can we help?
            </h1>
            
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto mb-8">
              <div className="flex rounded-lg overflow-hidden shadow-lg">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="flex-1 px-4 py-3 text-gray-600 text-base border-0 focus:outline-none focus:ring-0 bg-white"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                />
                <button 
                  className="px-6 py-3 text-white transition-colors hover:opacity-90"
                  style={{ backgroundColor: '#008236' }}
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
              {isSearching && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
                  <LoadingDots />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        {/* Toggle Buttons */}
        <div className="flex justify-center mb-12">
          <div className="bg-white rounded-2xl shadow-lg p-2 flex">
            <button
              onClick={() => {
                setActiveTab('buyer');
                setSelectedSection(null);
                setExpandedFAQ(null);
                setSelectedHotQuestion(null);
              }}
              className={`flex items-center space-x-3 px-8 py-4 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === 'buyer'
                  ? 'text-black shadow-lg transform scale-105'
                  : 'text-gray-600 hover:bg-blue-50'
              }`}
              style={{
                 fontFamily: 'Poppins, sans-serif', 
                 backgroundColor: activeTab === 'buyer' ? 'oklch(0.967 0.003 264.542)' : 'transparent'
                }}
            >
              <ShoppingCart className={`w-6 h-6 ${activeTab === 'buyer' ? 'text-black' : 'oklch(0.967 0.003 264.542)'}`} />
              <span className="text-lg">Buyer Help Center</span>
            </button>
            
            <button
              onClick={() => {
                setActiveTab('seller');
                setSelectedSection(null);
                setExpandedFAQ(null);
                setSelectedHotQuestion(null);
              }}
              className={`flex items-center space-x-3 px-8 py-4 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === 'seller'
                  ? 'bg-green-500 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:bg-green-50 hover:text-green-600'
              }`}
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              <Store className={`w-6 h-6 ${activeTab === 'seller' ? 'text-white' : 'text-green-500'}`} />
              <span className="text-lg">Seller Help Center</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="max-w-6xl mx-auto">
          {activeTab === 'buyer' && (
            <div key="buyer" className="animate-fadeIn">
              {/* Categories Section */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-800 mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Categories
                </h2>
                
                {/* Categories Grid - Clean Shopee Style */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredSections.map((section) => {
                    const Icon = section.icon;
                    
                    return (
                      <div
                        key={section.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-orange-300 hover:shadow-sm transition-all duration-200"
                        onClick={() => {
                          if (section.id === 'account-profile') {
                            // Navigate to the detailed Account & Profile page
                            window.location.href = '/help/buyer/account-profile';
                          } else if (section.id === 'orders-tracking') {
                            // Navigate to the detailed Orders & Tracking page
                            window.location.href = '/help/buyer/orders-tracking';
                          } else if (section.id === 'payments-billing') {
                            // Navigate to the detailed Payments & Billing page
                            window.location.href = '/help/buyer/payments-billing';
                          } else if (section.id === 'shipping-delivery') {
                            // Navigate to the detailed Shipping & Delivery page
                            window.location.href = '/help/buyer/shipping-delivery';
                          } else if (section.id === 'products-services') {
                            // Navigate to the detailed Products & Services page
                            window.location.href = '/help/buyer/products-services';
                          } else if (section.id === 'technical-support') {
                            // Navigate to the detailed Technical Support page
                            window.location.href = '/help/buyer/technical-support';
                          } else if (section.id === 'contact-support') {
                            // Navigate to the detailed Contact Support page
                            window.location.href = '/help/buyer/contact-support';
                          } else {
                            handleSectionClick(section.id);
                          }
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                              <Icon className="w-5 h-5 text-orange-500" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 text-base" style={{ fontFamily: 'Poppins, sans-serif' }}>
                              {section.title}
                            </h3>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Hot Questions Section */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Hot Questions
                </h2>
                
                <div className="space-y-4">
                  {hotQuestions.map((hotQ, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                      <button
                        className="text-left w-full text-blue-600 hover:text-blue-800 font-medium transition-colors"
                        style={{ fontFamily: 'Poppins, sans-serif' }}
                        onClick={() => setSelectedHotQuestion(selectedHotQuestion === index ? null : index)}
                      >
                        {hotQ.question}
                      </button>
                      {selectedHotQuestion === index && (
                        <div className="mt-3 p-4 bg-blue-50 rounded-lg animate-fadeIn">
                          <p className="text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {hotQ.answer}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'seller' && (
            <div key="seller" className="animate-fadeIn">
              {/* Categories Section */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-800 mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Categories
                </h2>
                
                {/* Categories Grid - Clean Shopee Style */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredSections.map((section) => {
                    const Icon = section.icon;
                    
                    return (
                      <div
                        key={section.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-green-300 hover:shadow-sm transition-all duration-200"
                        onClick={() => {
                          if (section.id === 'account-profile') {
                            // Navigate to the detailed Account & Profile page
                            window.location.href = '/help/seller/account-profile';
                          } else if (section.id === 'orders-tracking') {
                            // Navigate to the detailed Orders & Tracking page
                            window.location.href = '/help/seller/orders-tracking';
                          } else if (section.id === 'payments-billing') {
                            // Navigate to the detailed Payments & Billing page
                            window.location.href = '/help/seller/payments-billing';
                          } else if (section.id === 'shipping-delivery') {
                            // Navigate to the detailed Shipping & Delivery page
                            window.location.href = '/help/seller/shipping-delivery';
                          } else if (section.id === 'products-services') {
                            // Navigate to the detailed Products & Services page
                            window.location.href = '/help/seller/products-services';
                          } else if (section.id === 'technical-support') {
                            // Navigate to the detailed Technical Support page
                            window.location.href = '/help/seller/technical-support';
                          } else if (section.id === 'contact-support') {
                            // Navigate to the detailed Contact Support page
                            window.location.href = '/help/seller/contact-support';
                          } else {
                            handleSectionClick(section.id);
                          }
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <Icon className="w-5 h-5 text-green-500" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 text-base" style={{ fontFamily: 'Poppins, sans-serif' }}>
                              {section.title}
                            </h3>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Hot Questions Section for Sellers */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Hot Questions
                </h2>
                
                <div className="space-y-4">
                  {[
                    {
                      question: "How do I verify my seller account?",
                      answer: "Upload your business registration documents, valid ID, and bank account information through your seller dashboard. Verification typically takes 2-3 business days, and you'll receive email updates on the status."
                    },
                    {
                      question: "When do I receive my payments?",
                      answer: "Seller payouts are processed weekly every Friday for orders completed 7 days prior. Funds are transferred to your registered bank account within 1-2 business days after processing."
                    },
                    {
                      question: "How do I add products to my store?",
                      answer: "Go to your Seller Dashboard, click 'Add Product,' fill in the product details with high-quality images (minimum 800x800px), set your price and inventory levels, then publish your listing."
                    },
                    {
                      question: "What commission does HarvestHub charge?",
                      answer: "Commission rates vary by category, typically ranging from 3-8% of the sale price. You can view the exact rates for your products in your seller agreement and dashboard analytics."
                    },
                    {
                      question: "How quickly do I need to process orders?",
                      answer: "Orders should be processed within 24-48 hours. Mark orders as 'Processing' when you start preparing them and 'Shipped' when dispatched to maintain good seller ratings."
                    }
                  ].map((hotQ, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                      <button
                        className="text-left w-full text-blue-600 hover:text-blue-800 font-medium transition-colors"
                        style={{ fontFamily: 'Poppins, sans-serif' }}
                        onClick={() => setSelectedHotQuestion(selectedHotQuestion === index ? null : index)}
                      >
                        {hotQ.question}
                      </button>
                      {selectedHotQuestion === index && (
                        <div className="mt-3 p-4 bg-blue-50 rounded-lg animate-fadeIn">
                          <p className="text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {hotQ.answer}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Expanded Section Details */}
          {selectedSection && (
            <div className="bg-white rounded-xl shadow-lg p-8 mb-12 animate-slideDown">
              {(() => {
                const section = currentSections.find(s => s.id === selectedSection);
                if (!section) return null;
                const Icon = section.icon;
                const colorScheme = activeTab === 'buyer' 
                  ? { bg: 'bg-blue-500', bgLight: 'bg-blue-50', bgHover: 'bg-blue-100', dot: 'bg-blue-500' }
                  : { bg: 'bg-green-500', bgLight: 'bg-green-50', bgHover: 'bg-green-100', dot: 'bg-green-500' };
                
                return (
                  <div>
                    <div className="flex items-center space-x-3 mb-6">
                      <div className={`w-12 h-12 ${colorScheme.bg} rounded-lg flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {section.title}
                      </h3>
                    </div>

                    {isSectionLoading ? (
                      <div className="flex justify-center items-center h-32">
                        <LoadingDots />
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-2 gap-8">
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            Help Topics
                          </h4>
                          <div className="space-y-3">
                            {section.topics.map((topic, index) => (
                              <div key={index} className={`flex items-center p-3 ${colorScheme.bgLight} rounded-lg hover:${colorScheme.bgHover} transition-colors cursor-pointer`}>
                                <div className={`w-2 h-2 ${colorScheme.dot} rounded-full mr-3`}></div>
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
                                  <div className="p-4 border-t bg-gray-50 animate-fadeIn">
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
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Contact Support Section */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {activeTab === 'buyer' ? 'Still Need Help?' : 'Need Help Growing Your Business?'}
              </h3>
              <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {activeTab === 'buyer' ? 'Our support team is here to assist you' : 'Our seller support team is ready to help you succeed'}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className={`flex items-center space-x-4 p-6 bg-gradient-to-r ${
                activeTab === 'buyer' ? 'from-blue-50 to-indigo-50' : 'from-green-50 to-emerald-50'
              } rounded-xl`}>
                <div className={`w-12 h-12 ${
                  activeTab === 'buyer' ? 'bg-blue-500' : 'bg-green-500'
                } rounded-full flex items-center justify-center`}>
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Live Chat with Kali
                  </h4>
                  <p className="text-sm text-gray-600 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Get instant help from our AI assistant
                  </p>
                  <button className={`${
                    activeTab === 'buyer' ? 'text-blue-600 hover:text-blue-700' : 'text-green-600 hover:text-green-700'
                  } font-medium text-sm transition-colors`}>
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
                    {activeTab === 'buyer' ? 'Email Support' : 'Seller Support Email'}
                  </h4>
                  <p className="text-sm text-gray-600 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    admin@harvesthubph.app
                  </p>
                  <p className="text-xs text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {activeTab === 'buyer' 
                      ? 'We typically respond within 24 hours' 
                      : 'Priority support for sellers within 12 hours'}
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
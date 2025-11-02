"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
    answer: "Go to 'My Orders' in your buyer dashboard to see real-time tracking information. Each order shows its current status (Pending, Confirmed, Preparing, Shipped, Delivered, or Completed). You'll receive automatic notifications through the app when your order status changes. Click on any order to view detailed tracking steps, estimated delivery date, and seller information."
  },
  {
    question: "Can I cancel my order after placing it?",
    answer: "Yes, you can cancel orders that haven't been processed by the seller yet. Go to 'My Orders', find the order you want to cancel, and click the 'Cancel Order' button if it's available. Orders can typically be cancelled within the first hour or before the seller marks them as 'Processing'. Once the order is cancelled, you won't be charged since payment is collected upon delivery (COD)."
  },
  {
    question: "What payment method is accepted?",
    answer: "HarvestHub currently accepts Cash on Delivery (COD) only. You pay for your order in cash when it's delivered to your address. Make sure to have the exact amount ready or sufficient cash for change. Your order total will be shown during checkout and in your order confirmation."
  },
  {
    question: "How long does delivery take?",
    answer: "Delivery times depend on your location and the seller's location. Orders are delivered through Lalamove, our trusted delivery partner. Typical delivery takes 1-3 days for nearby areas within the same city, and 3-6 days for farther locations. You can track your Lalamove rider in real-time once your order is shipped."
  },
  {
    question: "What should I do if my order arrives damaged?",
    answer: "Inspect your order before accepting it from the Lalamove rider. If items arrive damaged or spoiled, you have the right to refuse the delivery. Take clear photos immediately and contact us through the 'My Orders' section by clicking 'Report Issue' or email admin@harvesthubph.app with your order number and photos. We'll work with the seller to resolve the issue."
  },
  {
    question: "Do you offer refunds?",
    answer: "HarvestHub does not process refunds. Since we use Cash on Delivery (COD), you only pay when you receive your order. Always inspect items before accepting delivery. If products are damaged, spoiled, or not as described, refuse the delivery and report the issue immediately. We'll coordinate with the seller for a replacement or resolution."
  },
  {
    question: "How do I add or change my delivery address?",
    answer: "Go to your Profile settings, select 'My Addresses', and click 'Add Address'. Fill in the complete address details including street, barangay, city, province, and postal code. You can save multiple addresses and set one as your default for faster checkout. Make sure your address is accurate and accessible for Lalamove delivery."
  },
  {
    question: "How do I contact a seller about my order?",
    answer: "You can message sellers directly through your order page. Go to 'My Orders', click on the specific order, and select 'Contact Seller'. You can ask questions about product details, delivery schedules, or order concerns. Sellers typically respond within 24 hours. For urgent matters, you can also call the seller if they've provided a contact number."
  },
  {
    question: "What is the return and exchange policy?",
    answer: "Since HarvestHub uses Cash on Delivery, you should inspect all items before paying the Lalamove rider. Refuse delivery if items are damaged, spoiled, or not as described. Fresh produce quality is guaranteed upon delivery - do not accept items that don't meet quality standards. For processed goods, check packaging and product condition before payment. Once you accept and pay for delivery, sales are final."
  },
  {
    question: "How do I leave a product review?",
    answer: "After your order is delivered and marked as completed, go to 'My Orders', find the product, and click 'Write Review'. Rate the product from 1-5 stars and share your experience. You can upload up to 5 photos. Reviews help other buyers make informed decisions and help sellers improve their products. You can add follow up review within."
  },
  {
    question: "Why can't I checkout my cart?",
    answer: "Checkout issues usually occur when: 1) Items are out of stock (remove them from cart), 2) You haven't selected a delivery address (add one in your profile), 3) Minimum order value isn't met (some sellers have minimum purchase requirements), or 4) Items are from sellers who don't deliver to your area via Lalamove. Check these factors and try again. If the problem persists, clear your browser cache or try a different browser."
  },
  {
    question: "How do I use discount codes or vouchers?",
    answer: "During checkout, look for the 'Apply Voucher' or 'Discount Code' field. Enter your code and click 'Apply'. The discount will be calculated and shown in your order summary. The discounted amount will be reflected in your total COD payment. Vouchers may have conditions like minimum purchase amounts, specific product categories, or expiration dates. Check your 'My Vouchers' section to see all available vouchers and their terms."
  },
  {
    question: "What does each order status mean?",
    answer: "Order statuses guide you through the process: 'Confirmed' – Your order has been placed and automatically confirmed; 'Preparing' – The seller is packing your items; 'Shipped' – The Lalamove rider has picked up your order and is on the way; 'Delivered' – The package has reached your address and payment has been collected; 'Completed' – The order is finalized after a successful COD delivery; 'Cancelled' – The order was cancelled by either the buyer or the seller."
  },
  {
    question: "How does Lalamove delivery work?",
    answer: "Once the seller ships your order, a Lalamove rider will be assigned to pick it up and deliver to your address. You'll receive notifications with the rider's details. The rider will contact you when nearby. Prepare the exact cash amount for COD payment. Inspect your items before paying and accepting delivery."
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
      'Contact support',
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
        answer: 'You can reach our seller support team through live chat with Kali or email us at admin@harvesthubph.app. Priority support within 12 hours.'
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
  const [isSectionLoading, setIsSectionLoading] = useState(false);
  const [isNavigatingProfile, setIsNavigatingProfile] = useState(false);

  const currentSections = activeTab === 'buyer' ? buyerSections : sellerSections;
  
  // Simulate search loading
  const handleSearch = (value: string) => {
    setSearchTerm(value);
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
      <div className="bg-[#103C2E] border-b border-gray-200 py-3 px-2 sm:px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-1 sm:space-x-2 min-w-0">
              <Link href="/home" className="flex items-center space-x-1 sm:space-x-2">
                <span className="font-bold text-white text-sm sm:text-base" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  <span style={{ color: '#6CD75A'}}>Harvest</span>
                  <span style={{ color: '#D4DB69' }}>Hub</span>
                </span>
              </Link>
              <span className="text-gray-400 text-xs sm:text-base">|</span>
              <span className="text-white/80 font-bold text-xs sm:text-base truncate" style={{ fontFamily: 'Poppins, sans-serif'}}>
                Help Center
              </span>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <Link 
                href="/home"
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1.5 sm:py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 font-medium"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                <Home className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline font-black text-sm">Back to Home</span>
              </Link>
              <span className="text-gray-400 hidden sm:inline">|</span>
              <button 
                onClick={handleProfileNavigation}
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1.5 sm:py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 font-medium"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                {isNavigatingProfile ? (
                  <LoadingDots />
                ) : (
                  <>
                    <User className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline font-bold text-sm">Profile</span>
                  </>
                )}
              </button>
              <span className="text-gray-400 hidden sm:inline">|</span>
              <Link 
                href="/privacy" 
                className="text-white/80 hover:text-white transition-colors font-bold text-xs sm:text-sm"
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
        className="text-white py-8 sm:py-12 md:py-16 relative overflow-hidden"
        style={{
          backgroundImage: 'url(/images/KALI/unnamed.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Optional overlay for better text readability */}
        <div className="absolute inset-0 bg-black/30"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 md:mb-8" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Hi, how can we help?
            </h1>
            
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto mb-4 sm:mb-6 md:mb-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for help..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 pr-12 sm:pr-16 text-gray-800 rounded-full border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 text-sm sm:text-base md:text-lg shadow-lg"
                  style={{ 
                    fontFamily: 'Poppins, sans-serif',
                    background: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 4px 12px rgba(0, 0, 0, 0.15)',
                    borderColor: 'rgba(255, 255, 255, 0.25)'
                  }}
                />
                <button 
                  className="absolute right-1.5 sm:right-2 top-1/2 transform -translate-y-1/2 bg-green-500 hover:bg-green-600 text-white p-2 sm:p-3 rounded-full transition-colors border border-green-400/30"
                  style={{
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)'
                  }}
                >
                  <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-10 md:py-16">
        {/* Toggle Buttons */}
        <div className="flex justify-center mb-6 sm:mb-8 md:mb-12 px-4">
          <div className="bg-white rounded-2xl shadow-lg p-1.5 sm:p-2 flex w-full sm:w-auto max-w-md sm:max-w-none">
            <button
              onClick={() => {
                setActiveTab('buyer');
                setSelectedSection(null);
                setExpandedFAQ(null);
                setSelectedHotQuestion(null);
              }}
              className={`flex items-center justify-center space-x-2 sm:space-x-3 px-4 sm:px-6 md:px-8 py-3 sm:py-4 rounded-xl font-semibold transition-all duration-300 flex-1 sm:flex-initial ${
                activeTab === 'buyer'
                  ? 'text-black shadow-lg scale-105'
                  : 'text-gray-600 hover:bg-blue-50'
              }`}
              style={{
                 fontFamily: 'Poppins, sans-serif', 
                 backgroundColor: activeTab === 'buyer' ? 'oklch(0.967 0.003 264.542)' : 'transparent'
                }}
            >
              <ShoppingCart className={`w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 ${activeTab === 'buyer' ? 'text-black' : 'oklch(0.967 0.003 264.542)'}`} />
              <span className="text-sm sm:text-base md:text-lg whitespace-nowrap">Buyer Help</span>
            </button>
            
            <button
              onClick={() => {
                setActiveTab('seller');
                setSelectedSection(null);
                setExpandedFAQ(null);
                setSelectedHotQuestion(null);
              }}
              className={`flex items-center justify-center space-x-2 sm:space-x-3 px-4 sm:px-6 md:px-8 py-3 sm:py-4 rounded-xl font-semibold transition-all duration-300 flex-1 sm:flex-initial ${
                activeTab === 'seller'
                  ? 'bg-green-500 text-white shadow-lg scale-105'
                  : 'text-gray-600 hover:bg-green-50 hover:text-green-600'
              }`}
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              <Store className={`w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 ${activeTab === 'seller' ? 'text-white' : 'text-green-500'}`} />
              <span className="text-sm sm:text-base md:text-lg whitespace-nowrap">Seller Help</span>
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
                      answer: "Upload your business registration documents and valid ID through your seller dashboard. Verification typically takes 2-3 business days, and you'll receive the updates on the seller dashboard."
                    },
                    {
                      question: "How do I add products to my store?",
                      answer: "Go to your Seller Dashboard, go to 'Products,' click 'Add Product,' fill in the product details with images, set your price and inventory levels, then publish your listing."
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
            <div 
              className="rounded-xl shadow-lg p-8 mb-12 animate-slideDown relative overflow-hidden"
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
                {(() => {
                  const section = currentSections.find(s => s.id === selectedSection);
                  if (!section) return null;
                  const colorScheme = activeTab === 'buyer' 
                    ? { bg: 'bg-blue-500', bgLight: 'bg-white/15', bgHover: 'bg-white/25', dot: 'bg-blue-500' }
                    : { bg: 'bg-green-500', bgLight: 'bg-white/15', bgHover: 'bg-white/25', dot: 'bg-green-500' };
                  
                  return (
                    <div>
                      <div className="mb-6">
                        <h3 className="text-2xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
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
                            <h4 className="font-semibold text-white mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                              Help Topics
                            </h4>
                            <div className="space-y-3">
                              {section.topics.map((topic, index) => (
                                <div key={index} className={`p-3 ${colorScheme.bgLight} backdrop-blur-sm rounded-lg hover:${colorScheme.bgHover} transition-all duration-200 cursor-pointer`}>
                                  <span className="text-white/90" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                    {topic}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold text-white mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                              Frequently Asked Questions
                            </h4>
                            <div className="space-y-3">
                              {section.faqs.map((faq, index) => (
                                <div key={index} className="border border-white/30 rounded-lg backdrop-blur-sm bg-white/10">
                                  <button
                                    className="w-full flex items-center justify-between p-4 text-left hover:bg-white/20 transition-all duration-200 rounded-lg"
                                    onClick={() => setExpandedFAQ(expandedFAQ === `${section.id}-${index}` ? null : `${section.id}-${index}`)}
                                  >
                                    <span className="font-medium text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                      {faq.question}
                                    </span>
                                    {expandedFAQ === `${section.id}-${index}` ? (
                                      <ChevronUp className="w-5 h-5 text-white/70" />
                                    ) : (
                                      <ChevronDown className="w-5 h-5 text-white/70" />
                                    )}
                                  </button>
                                  {expandedFAQ === `${section.id}-${index}` && (
                                    <div className="p-4 border-t border-white/30 bg-white/10 animate-fadeIn rounded-b-lg">
                                      <p className="text-white/90" style={{ fontFamily: 'Poppins, sans-serif' }}>
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-white" aria-hidden="true">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {activeTab === 'buyer' ? 'Contact Support' : 'Contact Support'}
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
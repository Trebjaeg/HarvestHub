"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Package2, 
  Info, 
  Shield, 
  Star, 
  AlertCircle, 
  CheckCircle,
  AlertTriangle,
  Search,
  Camera,
  FileText,
  MessageSquare,
  Heart,
  Eye,
  ThumbsUp,
  Award,
  Clock,
  Users
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

const productsGuides: GuideSection[] = [
  {
    id: 'product-information',
    title: 'Product Information',
    icon: Info,
    description: 'Find detailed product specifications and availability information',
    guides: [
      {
        id: 'product-details',
        title: 'Understanding Product Details & Specifications',
        steps: [
          'Navigate to any product page to view comprehensive product information',
          'Check the "Product Details" section for specifications, dimensions, and features',
          'View origin information including farm location and harvest dates',
          'Check packaging details including weight, size, and eco-friendly materials used',
          'Read cultivation method information (organic, conventional, hydroponic)',
          'View shelf life and storage recommendations for perishable items',
          'Check preparation suggestions and cooking instructions if applicable',
          'Review allergen information and dietary restrictions clearly marked'
        ],
        tips: [
          'Use the zoom feature on product images to see fine details',
          'Check the "More Info" tab for additional specifications and features',
          'Fresh produce displays harvest date to ensure maximum freshness'
        ]
      },
      {
        id: 'product-availability',
        title: 'Product Availability & Stock Updates',
        steps: [
          'Check real-time stock levels displayed on each product page',
          'View availability status: "In Stock", "Limited Stock", or "Out of Stock"',
          'See estimated restocking dates for temporarily unavailable items',
          'Check seasonal availability calendar for fresh produce items',
          'View alternative similar products when your preferred item is unavailable',
          'Monitor price changes and stock updates through your wishlist',
          'Check delivery availability in your area for specific products',
          'View bulk ordering availability and minimum quantity requirements'
        ],
        tips: [
          'Fresh produce availability varies by season - check our seasonal guide',
          'Enable notifications to never miss restocks of your favorite products',
          'Pre-order seasonal items to guarantee availability during peak times'
        ]
      },
      {
        id: 'product-categories',
        title: 'Navigating Product Categories',
        steps: [
          'Browse the main categories: Leafy Greens, Root Crops, Fruits, Spices & Aromatics, Eggplant & Gourds, Grains & Rice',
          'Use sub-categories to narrow down your search (Leafy Greens, Root Vegetables)',
          'Filter products by price range, rating, delivery time, or farm location',
          'Sort results by popularity, newest arrivals, price, or customer ratings',
          'Use the search bar with specific keywords for quick product discovery',
          'Check "Featured Products" section for seasonal highlights and promotions',
          'Explore "Deals" to discover popular items in your area',
          'Browse "New Arrivals" to find recently added products from farmers',
          'Use "Advanced Filters" for specific dietary needs or preferences'
        ],
        tips: [
          'Save your favorite search filters for quicker future browsing',
          'Use the "Compare Products" feature to evaluate similar items',
          'Check "Trending Now" section for popular seasonal products',
          'Local products often have faster delivery times and better freshness'
        ]
      }
    ]
  },
  {
    id: 'warranty-guarantee',
    title: 'Warranty & Guarantee',
    icon: Shield,
    description: 'Learn about product warranties and how to file claims',
    guides: [
      {
        id: 'freshness-guarantee',
        title: 'Freshness Guarantee Policy',
        steps: [
          'All fresh produce comes with HarvestHub\'s Freshness Guarantee',
          'Products are guaranteed fresh for the period specified on the product page',
          'Guarantee covers quality issues: wilting, spoilage, or damage during transit',
          'Take photos of any quality issues immediately upon delivery',
          'Report freshness concerns within 24 hours of delivery for fresh produce',
          'Report within 48 hours for packaged goods and processed items',
          'Use the "Report Issue" button in your order history',
          'Provide clear photos showing the quality issue or damage',
          'Receive automatic refund or replacement based on the severity of issue'
        ],
        tips: [
          'Store products according to provided storage instructions to maintain quality',
          'Check delivery photos to confirm condition at time of delivery',
          'Fresh produce quality can vary slightly - minor variations are normal',
          'Contact farmers directly through the platform for product care tips'
        ]
      },
      {
        id: 'warranty-claims',
        title: 'How to File Warranty Claims',
        steps: [
          'Log in to your HarvestHub account and go to "My Orders"',
          'Find the order containing the product with issues',
          'Click "Report Issue" or "File Warranty Claim" next to the product',
          'Select the type of issue: Quality, Damage, Missing Item, or Other',
          'Upload clear photos showing the problem from multiple angles',
          'Provide a detailed description of the issue and when you discovered it',
          'Submit any relevant documentation (receipt, delivery photos, etc.)',
          'Wait for initial response from our quality assurance team (usually 2-4 hours)',
          'Follow up with additional information if requested by the support team',
          'Receive resolution: refund, replacement, or store credit as appropriate'
        ],
        tips: [
          'Take photos immediately when you discover issues for best claim processing',
          'Keep original packaging until your claim is resolved',
          'Be specific in your description - this helps us process claims faster',
          'Multiple photos from different angles provide better documentation'
        ]
      },
      {
        id: 'return-policy',
        title: 'Return & Exchange Policy',
        steps: [
          'Fresh produce can be returned within 24 hours if quality standards aren\'t met',
          'Packaged goods can be returned within 3 days if unopened and undamaged',
          'Initiate returns through "My Orders" by clicking "Return Item"',
          'Select reason for return: Quality Issue, Wrong Item, Damaged, or Changed Mind',
          'Schedule pickup for returnable items or drop off at designated locations',
          'Ensure items are in original packaging with all labels intact',
          'Include order receipt and any promotional materials received',
          'Wait for quality inspection confirmation (1-2 business days)',
          'Receive refund processed to original payment method within 3-5 business days'
        ],
        tips: [
          'Some items like cut fruits or prepared foods may not be returnable for health reasons',
          'Return shipping is free for quality issues but may apply for other reasons',
          'Store credit returns are processed faster than refunds to payment methods',
          'Keep photos of returned items until refund is confirmed'
        ]
      }
    ]
  },
  {
    id: 'reviews-recommendations',
    title: 'Reviews & Recommendations',
    icon: Star,
    description: 'Learn how to read, write, and share product reviews and recommendations',
    guides: [
      {
        id: 'reading-reviews',
        title: 'How to Read and Interpret Product Reviews',
        steps: [
          'Scroll to the "Customer Reviews" section on any product page',
          'Check the overall rating (1-5 stars) and total number of reviews',
          'Read the rating breakdown to see distribution across all star levels',
          'Look for "Verified Purchase" badges to identify genuine buyer reviews',
          'Sort reviews by Most Recent, Most Helpful, Highest Rating, or Lowest Rating',
          'Read both positive and negative reviews for balanced perspective',
          'Check reviewer profiles to see their review history and credibility',
          'Look for photos and videos in reviews for visual product confirmation',
          'Pay attention to recent reviews for current product quality trends'
        ],
        tips: [
          'Focus on reviews from buyers with similar needs or preferences as yours',
          'Recent reviews are more reliable for fresh produce quality assessment',
          'Look for detailed reviews that mention specific product attributes',
          'Consider the reviewer\'s location for delivery and freshness insights'
        ]
      },
      {
        id: 'writing-reviews',
        title: 'Writing Helpful Product Reviews',
        steps: [
          'Wait until you\'ve received and used the product before reviewing',
          'Go to "My Orders" and find the product you want to review',
          'Click "Write Review" next to the delivered product',
          'Rate the product on a 5-star scale based on your overall experience',
          'Write a detailed review covering quality, freshness, packaging, and value',
          'Add high-quality photos showing the actual product you received',
          'Include videos if helpful (especially for cooking or preparation tips)',
          'Mention specific details like taste, texture, size, and appearance',
          'Be honest and constructive - help other buyers make informed decisions',
          'Submit your review and wait for moderation approval (usually 24 hours)'
        ],
        tips: [
          'Include photos with good lighting to show true product appearance',
          'Mention storage tips or preparation suggestions in your review',
          'Be specific about quantities and measurements when relevant',
          'Update your review if your experience changes over time'
        ]
      },
      {
        id: 'recommendations-feedback',
        title: 'Sharing Recommendations & Product Feedback',
        steps: [
          'Use the "Recommend to Friends" feature on product pages to share favorites',
          'Create and share custom product lists for different occasions or recipes',
          'Rate farmers and provide feedback on their product quality and service',
          'Participate in the "Product Suggestion" program to request new items',
          'Submit feedback through the "Suggest Improvement" button on product pages',
          'Join community discussions about products in the HarvestHub forum',
          'Share recipe ideas and cooking tips using HarvestHub products',
          'Report any misleading product information to help improve accuracy',
          'Follow your favorite farmers to get updates on their new products'
        ],
        tips: [
          'Your product recommendations earn points in our loyalty program',
          'Constructive feedback helps farmers improve their products and services',
          'Join the HarvestHub community to connect with other food enthusiasts',
          'Share seasonal recipes to help others discover new ways to use products'
        ]
      }
    ]
  }
];

export default function ProductsServicesHelp() {
  const [selectedSection, setSelectedSection] = useState<string | null>('product-information');
  const [selectedGuide, setSelectedGuide] = useState<string | null>(null);

  const currentSection = productsGuides.find(section => section.id === selectedSection);

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
                Products & Services
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
                <Package2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Products & Services Help
                </h1>
                <p className="text-green-100 text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Discover products, understand warranties, and learn about our review system
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
                  {productsGuides.map((section) => {
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
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${selectedSection === section.id ? 'text-emerald-600' : 'text-gray-500'}`} />
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
                      <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <currentSection.icon className="w-6 h-6 text-emerald-600" />
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
                          selectedGuide === guide.id ? 'border-emerald-300 bg-emerald-50' : 'hover:border-emerald-200'
                        }`}
                        onClick={() => setSelectedGuide(selectedGuide === guide.id ? null : guide.id)}
                      >
                        <h3 className="font-semibold text-gray-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {guide.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          Click to view detailed guide
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-emerald-600 font-medium">
                            {guide.steps.length} steps
                          </span>
                          <div className="text-emerald-600">
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
                              <CheckCircle className="w-8 h-8 text-emerald-600" />
                              <h3 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                {guide.title}
                              </h3>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                              <div>
                                <h4 className="font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                                  Step-by-Step Guide
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
                                        {(step === 'Log in to your HarvestHub account' || step === 'Log in to your HarvestHub account and go to "My Orders"') && (
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

          {/* Product Features Banner */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl shadow-lg p-8 mb-8 text-white mt-12">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Discover HarvestHub Product Features
              </h3>
              <p className="text-emerald-100" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Everything you need to make informed purchasing decisions
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-white/10 backdrop-blur rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Eye className="w-6 h-6" />
                </div>
                <h4 className="font-semibold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Detailed Views
                </h4>
                <p className="text-sm text-emerald-100" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  High-res images & specs
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Shield className="w-6 h-6" />
                </div>
                <h4 className="font-semibold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Quality Guarantee
                </h4>
                <p className="text-sm text-emerald-100" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Freshness assured
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <h4 className="font-semibold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Community Reviews
                </h4>
                <p className="text-sm text-emerald-100" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Real buyer feedback
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Award className="w-6 h-6" />
                </div>
                <h4 className="font-semibold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Farm-to-Table
                </h4>
                <p className="text-sm text-emerald-100" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Direct from farmers
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions Section */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Link href="/shop" className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg mb-4 flex items-center justify-center">
                <Search className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Browse Products
              </h4>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Explore our fresh produce catalog
              </p>
            </Link>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg mb-4 flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <h4 className="font-semibold text-gray-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Write a Review
              </h4>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Share your product experience
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="w-12 h-12 bg-red-100 rounded-lg mb-4 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-red-600" />
              </div>
              <h4 className="font-semibold text-gray-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Product Feedback
              </h4>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Suggest improvements or new products
              </p>
            </div>
          </div>

          {/* Contact Support Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Need Help with Products?
              </h3>
              <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Our product specialists are here to help you find what you need
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <Link href="/help" className="flex items-center space-x-4 p-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl hover:from-emerald-100 hover:to-teal-100 transition-colors">
                <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
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

              <div className="flex items-center space-x-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <Package2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Product Support
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
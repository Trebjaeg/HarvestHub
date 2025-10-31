"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Star, 
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
  Calendar,
  MessageSquare,
  ThumbsUp,
  Award
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

const productGuides: GuideSection[] = [
  {
    id: 'product-information',
    title: 'Product Information',
    icon: Package,
    description: 'Learn how to create and manage effective product listings that attract buyers',
    guides: [
      {
        id: 'add-products',
        title: 'How to Add New Products',
        steps: [
          'Navigate to your Seller Dashboard and click on "Product"',
          'Select "Add New Product" to start creating your listing',
          'Choose the appropriate product category (vegetables, fruits, grains, etc.)',
          'Upload high-quality photos showing the product from multiple angles',
          'Write a clear, descriptive product title that includes key details',
          'Add detailed product description including origin, variety, and benefits',
          'Set competitive pricing based on market research and your costs',
          'Specify quantity available, unit of measurement, and stock levels'
        ],
        tips: [
          'Use natural lighting for product photos to show true colors',
          'Include size reference objects (coins, hands) for scale in photos',
          'Research competitor pricing to ensure your products are competitively priced',
          'Update stock levels regularly to avoid overselling'
        ]
      },
      {
        id: 'edit-listings',
        title: 'Editing Product Listings',
        steps: [
          'Go to "Product" > "My Products" in your seller dashboard',
          'Find the product you want to edit and click on "Edit Product"',
          'Update product photos by uploading new images or rearranging existing ones',
          'Modify product descriptions to reflect seasonal changes or new information',
          'Adjust pricing based on market conditions, costs, or promotional strategies',
          'Update stock quantities and availability status as inventory changes',
          'Edit product specifications, measurements, or packaging details',
          'Save changes and review the updated listing before publishing'
        ],
        tips: [
          'Edit listings during off-peak hours to minimize impact on active shoppers',
          'Keep product URLs consistent when editing to maintain SEO rankings',
          'Update seasonal products regularly to reflect current harvest information',
          'Use A/B testing by making small changes and monitoring performance'
        ]
      },
      {
        id: 'product-visibility',
        title: 'Ensuring Product Visibility and Compliance',
        steps: [
          'Review HarvestHub\'s product listing guidelines and marketplace policies',
          'Ensure product photos meet quality standards: clear, well-lit, and accurate',
          'Write descriptions that are truthful, detailed, and free of prohibited content',
          'Use relevant keywords naturally in titles and descriptions for better searchability',
          'Maintain appropriate product categorization for accurate search results',
          'Keep product information up-to-date to avoid policy violations',
          'Monitor listing performance and make improvements based on analytics',
          'Respond promptly to any policy violation notifications from HarvestHub'
        ],
        tips: [
          'Use specific keywords that buyers commonly search for in your product category',
          'Avoid using misleading claims or exaggerated language in descriptions',
          'Regularly check your product visibility in search results',
          'Follow seasonal trends to optimize product timing and visibility'
        ]
      }
    ]
  },
  {
    id: 'warranty-guarantee',
    title: 'Warranty & Guarantee',
    icon: Shield,
    description: 'Manage product warranties and guarantees to build customer trust and satisfaction',
    guides: [
      {
        id: 'add-warranty',
        title: 'Adding Warranty Information',
        steps: [
          'Access your product editing page and locate the "Warranty & Guarantee" section',
          'Select the appropriate warranty type: Quality Guarantee, Freshness Guarantee, or Satisfaction Guarantee',
          'Specify warranty duration: 24 hours for fresh produce, 7 days for processed goods',
          'Define what the warranty covers: quality issues, freshness, or customer satisfaction',
          'List any warranty exclusions or conditions that apply to your products',
          'Include clear instructions for customers on how to claim warranty coverage',
          'Add contact information for warranty-related inquiries and claims',
          'Save warranty information and ensure it displays prominently on product pages'
        ],
        tips: [
          'Be realistic with warranty terms to avoid excessive claims and disputes',
          'Clearly communicate warranty conditions to set proper customer expectations',
          'Consider your product type when setting warranty duration and coverage',
          'Use warranty as a competitive advantage to build customer confidence'
        ]
      },
      {
        id: 'warranty-claims',
        title: 'Handling Warranty Claims',
        steps: [
          'Monitor your seller dashboard for incoming warranty claim notifications',
          'Review customer-submitted evidence: photos, descriptions, and order details',
          'Assess the validity of the claim based on your warranty terms and conditions',
          'Respond to customers within 24 hours acknowledging receipt of their claim',
          'For valid claims, offer appropriate remedies: replacement, refund, or store credit',
          'For invalid claims, politely explain why the claim doesn\'t meet warranty criteria',
          'Process approved remedies promptly to maintain customer satisfaction',
          'Document all warranty interactions for future reference and pattern analysis'
        ],
        tips: [
          'Be generous with warranty claims to build long-term customer relationships',
          'Use warranty claims as feedback to improve product quality and packaging',
          'Train customer service staff on proper warranty claim handling procedures',
          'Keep detailed records of warranty claims for business improvement insights'
        ]
      },
      {
        id: 'guarantee-periods',
        title: 'Setting Guarantee Periods',
        steps: [
          'Analyze your product types to determine appropriate guarantee timeframes',
          'Fresh Leafy Vegetables: 24-48 hours quality guarantee from delivery',
          'Root Vegetables and Fruits: 3-5 days freshness guarantee',
          'Custom/Bulk Orders: Negotiate guarantee terms based on order specifics',
          'Seasonal Products: Adjust guarantee periods based on harvest timing',
          'Communicate guarantee periods clearly in product descriptions and checkout',
          'Review and adjust guarantee periods based on customer feedback and return patterns'
        ],
        tips: [
          'Align guarantee periods with realistic product shelf life expectations',
          'Consider shipping time when setting guarantee periods for distant customers',
          'Offer extended guarantees for premium or high-value products',
          'Use guarantee periods as a marketing tool to differentiate from competitors'
        ]
      }
    ]
  },
  {
    id: 'reviews-recommendations',
    title: 'Reviews & Recommendations',
    icon: Star,
    description: 'Build and maintain a strong reputation through effective review management',
    guides: [
      {
        id: 'view-reviews',
        title: 'Viewing and Analyzing Customer Reviews',
        steps: [
          'Navigate to "Seller Dashboard" > "Reviews & Ratings" to view all feedback',
          'Filter reviews by rating, date, product, or customer to analyze patterns',
          'Read individual reviews carefully to understand customer experiences',
          'Identify common themes in positive reviews to understand your strengths',
          'Analyze negative reviews to pinpoint areas needing improvement',
          'Track your overall rating trends over time to monitor performance',
          'Export review data for detailed analysis and business improvement planning',
          'Use review insights to make informed decisions about product and service improvements'
        ],
        tips: [
          'Check reviews regularly to stay connected with customer sentiment',
          'Look for actionable feedback in reviews rather than just focusing on ratings',
          'Use positive review themes in your marketing and product descriptions',
          'Address recurring issues mentioned in multiple reviews promptly'
        ]
      },
      {
        id: 'respond-reviews',
        title: 'Responding to Reviews Professionally',
        steps: [
          'Respond to all reviews, both positive and negative, within 48 hours',
          'Thank customers for positive reviews and express appreciation for their feedback',
          'For negative reviews, acknowledge the customer\'s concerns and apologize sincerely',
          'Offer specific solutions or remedies for problems mentioned in negative reviews',
          'Keep responses professional, friendly, and focused on customer satisfaction',
          'Avoid defensive language or arguments with customers in public responses',
          'Invite customers to contact you directly for complex issues requiring detailed resolution',
          'Follow up privately with dissatisfied customers to ensure their concerns are resolved'
        ],
        tips: [
          'Use the customer\'s name in responses to personalize your interaction',
          'Keep responses concise but thorough in addressing customer concerns',
          'Show other potential customers that you care about customer satisfaction',
          'Use negative reviews as opportunities to demonstrate excellent customer service'
        ]
      },
      {
        id: 'boost-ratings',
        title: 'Strategies to Improve Your Ratings',
        steps: [
          'Maintain consistent product quality by implementing strict quality control measures',
          'Ensure accurate product descriptions to set proper customer expectations',
          'Package products carefully to prevent damage during shipping and delivery',
          'Communicate proactively with customers about order status and any potential delays',
          'Provide excellent customer service by responding quickly to inquiries and concerns',
          'Follow up with customers after delivery to ensure satisfaction and encourage reviews',
          'Offer small incentives for customers to leave honest reviews (discounts on future orders)',
          'Continuously improve based on customer feedback and market trends'
        ],
        tips: [
          'Focus on consistency rather than perfection - reliable quality builds trust',
          'Exceed customer expectations whenever possible to generate positive reviews',
          'Address issues proactively before they result in negative reviews',
          'Build relationships with repeat customers who are more likely to leave positive reviews'
        ]
      }
    ]
  }
];

export default function SellerProductsServicesHelp() {
  const [selectedSection, setSelectedSection] = useState<string | null>('product-information');
  const [selectedGuide, setSelectedGuide] = useState<string | null>(null);

  const currentSection = productGuides.find(section => section.id === selectedSection);

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
                Seller Products & Services
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
                <Star className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Seller Products & Services Help
                </h1>
                <p className="text-green-100 text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Manage your product listings, warranties, and customer reviews effectively
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
                  {productGuides.map((section) => {
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
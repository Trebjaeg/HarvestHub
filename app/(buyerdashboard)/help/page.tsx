"use client";

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MessageCircle, 
  RefreshCw, 
  Package, 
  CreditCard, 
  Truck, 
  Bell, 
  HelpCircle, 
  ShoppingCart, 
  FileText, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp,
  Mail,
  Phone,
  Clock,
  CheckCircle,
  AlertTriangle,
  Star,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

interface HelpCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  articles: HelpArticle[];
}

interface HelpArticle {
  id: string;
  title: string;
  content: string;
  tags: string[];
  popular?: boolean;
  lastUpdated: string;
}

export default function HelpCenterPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<HelpArticle[]>([]);
  const [loading, setLoading] = useState(false);

  const helpCategories: HelpCategory[] = [
    {
      id: 'refunds-returns',
      title: 'Refunds & Returns',
      description: 'Learn about our refund policy, return process, and how to handle damaged orders',
      icon: RefreshCw,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      articles: [
        {
          id: 'request-refund',
          title: 'How do I request a refund?',
          content: `You can request a refund for your HarvestHub order in several ways:

**Online Process:**
1. Go to your Orders page in your buyer dashboard
2. Find the order you want to refund
3. Click "Request Refund" button
4. Fill out the refund form with reason
5. Submit photos if items were damaged
6. Wait for seller/admin approval

**Refund Timeline:**
• Processing: 1-3 business days
• Approval: 2-5 business days
• Money back: 3-7 business days (depending on payment method)

**Refundable Items:**
✅ Damaged or spoiled products
✅ Wrong items delivered
✅ Orders not delivered within promised time
✅ Quality issues (with photo proof)

**Non-Refundable:**
❌ Items consumed or used
❌ Orders cancelled after 24 hours
❌ Perishable items after 2 days of delivery

**Contact Support:**
If you need immediate assistance, contact our support team at support@harvesthub.ph or call +63-XXX-XXXX.`,
          tags: ['refund', 'money back', 'return', 'damaged'],
          popular: true,
          lastUpdated: '2024-10-15'
        },
        {
          id: 'damaged-orders',
          title: 'What to do with damaged orders?',
          content: `If you receive damaged products, follow these steps:

**Immediate Actions:**
1. **Take Photos:** Document the damage immediately upon delivery
2. **Don't Consume:** Avoid using or consuming damaged items
3. **Contact Seller:** Reach out to the farmer/seller first
4. **Report to HarvestHub:** Use our platform if seller doesn't respond

**Photo Requirements:**
• Clear images of damaged items
• Include packaging if relevant
• Show delivery receipt/label
• Multiple angles if possible

**Resolution Options:**
🔄 **Replacement:** New items sent at no charge
💰 **Refund:** Full or partial money back
🎁 **Store Credit:** Credit for future purchases
📞 **Direct Contact:** Speak with farmer for custom solution

**Response Time:**
• Seller response: Within 24 hours
• HarvestHub intervention: Within 48 hours
• Resolution: 3-7 business days

**Prevention Tips:**
• Check items upon delivery
• Report issues within 2 hours of delivery
• Keep delivery packaging for 24 hours`,
          tags: ['damaged', 'quality', 'replacement', 'photos'],
          lastUpdated: '2024-10-10'
        },
        {
          id: 'return-policy',
          title: 'Return Policy Guidelines',
          content: `Understanding our return policy helps ensure smooth transactions:

**Return Window:**
• Fresh Produce: 24 hours from delivery
• Packaged Goods: 48 hours from delivery
• Processed Items: 72 hours from delivery

**Return Conditions:**
✅ Items in original condition
✅ Packaging intact (where applicable)
✅ Valid reason for return
✅ Photos of any quality issues

**Return Process:**
1. Contact seller within return window
2. Explain reason for return
3. Provide supporting evidence
4. Arrange pickup/return method
5. Receive refund/replacement

**Seller Responsibilities:**
• Respond to return requests promptly
• Provide clear return instructions
• Honor legitimate return claims
• Process refunds within policy timeframe

**Your Rights:**
• Fair treatment in return process
• Timely responses from sellers
• Platform protection for valid claims
• Escalation to HarvestHub support`,
          tags: ['policy', 'guidelines', 'return window', 'conditions'],
          lastUpdated: '2024-10-12'
        }
      ]
    },
    {
      id: 'shipping-payments',
      title: 'Shipping & Payments',
      description: 'Information about delivery options, payment methods, and transaction security',
      icon: CreditCard,
      color: 'text-green-600',
      bgColor: 'bg-green-50 hover:bg-green-100',
      articles: [
        {
          id: 'shipping-options',
          title: 'Available shipping options',
          content: `HarvestHub offers flexible delivery options to meet your needs:

**Standard Delivery:**
• Timeline: 1-3 business days
• Cost: ₱50-150 (depending on distance)
• Available: Monday to Saturday
• Time slots: 8AM-12PM, 1PM-5PM, 6PM-9PM

**Express Delivery:**
• Timeline: Same day or next day
• Cost: ₱150-300 (premium rates)
• Available: 7 days a week
• Time slots: Flexible scheduling

**Farmer Direct:**
• Timeline: As arranged with farmer
• Cost: Varies by farmer/location
• Available: Farmer's schedule
• Benefits: Freshest products, direct communication

**Pickup Options:**
• Self-pickup from farmer's location
• Pickup from designated collection points
• Market day collections (weekends)
• Cost: Usually free or minimal

**Delivery Areas:**
🌆 **Metro Manila:** Full coverage
🏘️ **Nearby Provinces:** Limited areas
🚛 **Special Areas:** Custom arrangements

**Tracking:**
• Real-time delivery updates
• SMS notifications
• In-app tracking
• Delivery confirmation photos`,
          tags: ['delivery', 'shipping', 'timeline', 'cost', 'tracking'],
          popular: true,
          lastUpdated: '2024-10-18'
        },
        {
          id: 'payment-methods',
          title: 'Accepted payment methods',
          content: `We accept various payment methods for your convenience:

**Digital Payments:**
💳 **Credit/Debit Cards**
• Visa, Mastercard, American Express
• Secure 256-bit SSL encryption
• No additional fees

💰 **Digital Wallets**
• GCash, PayMaya, GrabPay
• Instant payment confirmation
• Mobile-friendly checkout

🏦 **Online Banking**
• BPI, BDO, Metrobank, UnionBank
• Direct bank transfers
• Secure banking protocols

**Traditional Methods:**
💵 **Cash on Delivery (COD)**
• Pay when you receive your order
• Available in most delivery areas
• Small COD fee may apply (₱20-50)

🏪 **Over-the-Counter**
• 7-Eleven, MLhuillier, Cebuana
• Payment confirmation within 24 hours
• Service fee applies

**Payment Security:**
🔒 PCI DSS compliant payment processing
🔐 End-to-end encryption
🛡️ Fraud protection monitoring
📱 Two-factor authentication available

**Payment Tips:**
• Always check payment confirmation
• Keep transaction receipts
• Report suspicious activity immediately
• Use secure networks for online payments`,
          tags: ['payment', 'credit card', 'gcash', 'cod', 'security'],
          popular: true,
          lastUpdated: '2024-10-16'
        }
      ]
    },
    {
      id: 'orders-tracking',
      title: 'Status Updates',
      description: 'Track your orders, check delivery status, and understand our notification system',
      icon: Truck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 hover:bg-purple-100',
      articles: [
        {
          id: 'track-orders',
          title: 'How to track your orders',
          content: `Stay updated on your order status with our comprehensive tracking system:

**Order Tracking Steps:**
1. **Go to Orders Page:** Navigate to "My Orders" in your dashboard
2. **Find Your Order:** Use order number or browse recent orders
3. **View Status:** Check current status and estimated delivery
4. **Track Live:** Click "Track Order" for real-time updates

**Order Statuses:**
📝 **Order Placed:** Seller received your order
⏳ **Processing:** Seller is preparing your items
📦 **Packed:** Items are packed and ready for pickup
🚚 **In Transit:** Order is on the way to you
📍 **Out for Delivery:** Delivery partner is nearby
✅ **Delivered:** Order completed successfully

**Tracking Features:**
• Real-time GPS tracking (when available)
• Estimated delivery times
• Delivery partner contact info
• Photo confirmation of delivery
• SMS and email notifications

**Notification Settings:**
🔔 **Push Notifications:** Instant updates on your phone
📧 **Email Updates:** Detailed status changes
📱 **SMS Alerts:** Critical delivery updates
📞 **Call Notifications:** For delivery issues

**Tracking Issues:**
• No tracking updates for 24+ hours
• Delivery delayed without notification  
• Cannot contact delivery partner
• Order shows delivered but not received

**Contact for Help:**
Support Team: support@harvesthub.ph
Phone: +63-XXX-XXXX (24/7 for delivery issues)`,
          tags: ['tracking', 'orders', 'delivery', 'status', 'notifications'],
          popular: true,
          lastUpdated: '2024-10-20'
        },
        {
          id: 'delivery-status',
          title: 'Understanding delivery status',
          content: `Learn what each delivery status means and what to expect:

**Status Breakdown:**

**🔄 Order Processing (0-24 hours)**
• Seller reviewing your order
• Checking product availability
• Preparing items for packing
• May contact you for clarifications

**📦 Ready for Pickup (24-48 hours)**
• Items packed and labeled
• Delivery partner assigned
• Pickup scheduled from seller
• You'll get pickup notification

**🚚 In Transit (Varies by distance)**
• Order picked up from seller
• En route to your location
• GPS tracking available
• Estimated delivery time provided

**📍 Out for Delivery (2-4 hours)**
• Final delivery phase
• Delivery partner in your area
• You can contact delivery partner
• Prepare to receive your order

**✅ Delivered**
• Order successfully delivered
• Photo confirmation taken
• Delivery receipt generated
• Rate your experience

**⚠️ Delivery Issues:**
• **Failed Delivery:** Not home, wrong address
• **Delayed:** Traffic, weather, high volume
• **Rescheduled:** By your request or circumstances
• **Returned:** Unclaimed or refused

**What You Can Do:**
• Update delivery preferences
• Reschedule delivery times
• Add special delivery instructions
• Contact delivery partner directly`,
          tags: ['delivery', 'status', 'timeline', 'issues', 'updates'],
          lastUpdated: '2024-10-19'
        }
      ]
    },
    {
      id: 'general-faqs',
      title: 'General FAQs',
      description: 'Common questions about accounts, features, and getting started with HarvestHub',
      icon: HelpCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 hover:bg-orange-100',
      articles: [
        {
          id: 'create-account',
          title: 'How to create an account',
          content: `Getting started with HarvestHub is easy and free:

**Registration Steps:**
1. **Visit Website:** Go to harvesthub.ph
2. **Click Sign Up:** Choose "Create Account" 
3. **Choose Role:** Select "I'm a Buyer"
4. **Fill Details:** Enter your information
5. **Verify Email:** Check your email and click verification link
6. **Complete Profile:** Add delivery address and preferences

**Required Information:**
📝 **Personal Details**
• Full name (first and last)
• Valid email address
• Phone number
• Date of birth

📍 **Address Information**
• Complete delivery address
• Landmark/reference points
• Preferred delivery times
• Alternative contact person (optional)

**Account Benefits:**
✅ Browse fresh local produce
✅ Direct communication with farmers
✅ Order tracking and history
✅ Favorites and wishlist
✅ Exclusive deals and promotions
✅ Loyalty rewards program

**Security Setup:**
🔐 Create a strong password (8+ characters)
📱 Enable two-factor authentication (recommended)
🔔 Set notification preferences
💳 Add payment methods securely

**Verification Process:**
• Email verification (required)
• Phone number confirmation
• Address validation (for first order)
• Identity verification (for large orders)

**Need Help?**
Contact our onboarding team at hello@harvesthub.ph for assistance with account creation.`,
          tags: ['account', 'registration', 'sign up', 'getting started'],
          popular: true,
          lastUpdated: '2024-10-21'
        },
        {
          id: 'contact-support',
          title: 'How to contact support',
          content: `We're here to help! Multiple ways to reach our support team:

**Contact Methods:**

**📧 Email Support**
• Address: support@harvesthub.ph
• Response time: Within 24 hours
• Best for: Detailed issues, order problems
• Available: 24/7

**📞 Phone Support**
• Number: +63-XXX-XXXX
• Hours: 8AM - 8PM (Mon-Sun)
• Best for: Urgent issues, delivery problems
• Languages: English, Filipino

**💬 Live Chat**
• Available: On website and app
• Hours: 9AM - 6PM (Mon-Fri)
• Best for: Quick questions, account issues
• Response time: Under 5 minutes

**📱 In-App Messaging**
• Go to Messages in your dashboard
• Send message to "HarvestHub Support"
• Attach screenshots/photos
• Track conversation history

**📍 Social Media**
• Facebook: @HarvestHubPH
• Twitter: @HarvestHub_PH
• Instagram: @harvesthubph
• Response time: During business hours

**What to Include:**
• Your account email/phone
• Order number (if applicable)
• Clear description of issue
• Screenshots (if relevant)
• Steps you've already tried

**Priority Levels:**
🔴 **Urgent:** Delivery issues, payment problems
🟡 **Medium:** Account access, order questions  
🟢 **Low:** General inquiries, feature requests

**Support Categories:**
• Order and delivery issues
• Payment and billing questions
• Account and technical problems
• Product quality concerns
• Seller-related issues`,
          tags: ['support', 'contact', 'help', 'customer service'],
          popular: true,
          lastUpdated: '2024-10-22'
        }
      ]
    },
    {
      id: 'products-orders',
      title: 'Products & Orders',
      description: 'Learn how to browse products, place orders, and manage your purchases effectively',
      icon: ShoppingCart,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50 hover:bg-teal-100',
      articles: [
        {
          id: 'place-order',
          title: 'How to place an order',
          content: `Follow these simple steps to order fresh produce:

**Step-by-Step Ordering:**

**1. Browse Products**
• Visit our Shop page or browse by category
• Use filters: location, price, availability
• Read product descriptions and seller info
• Check ratings and reviews

**2. Select Items**
• Click on products you want
• Choose quantity and specifications
• Check pricing and availability
• Add to cart or favorites

**3. Review Cart**
• Go to your shopping cart
• Verify items, quantities, and prices
• Apply promo codes if available
• Calculate delivery fees

**4. Checkout Process**
• Enter delivery address
• Choose delivery time slot
• Select payment method
• Add special instructions
• Review order summary

**5. Place Order**
• Confirm all details are correct
• Click "Place Order" button
• Make payment (if not COD)
• Receive order confirmation

**Order Tips:**
💡 **Best Practices**
• Order early for better availability
• Check delivery schedules
• Communicate with sellers
• Keep order confirmations

⚠️ **Common Issues**
• Items out of stock after ordering
• Delivery time conflicts
• Payment processing delays
• Address validation errors

**After Ordering:**
📧 Confirmation email sent
📱 Order tracking available
🔔 Status update notifications
📞 Seller may contact you for details

**Order Limits:**
• Minimum order: ₱200 (may vary by seller)
• Maximum order: ₱10,000 (security measure)
• Bulk orders: Contact seller directly`,
          tags: ['order', 'purchase', 'checkout', 'cart', 'buying'],
          popular: true,
          lastUpdated: '2024-10-17'
        },
        {
          id: 'manage-orders',
          title: 'Managing your purchases',
          content: `Take control of your orders with these management features:

**Order Management Dashboard:**

**📋 Order History**
• View all past orders
• Filter by date, seller, or status
• Download order receipts
• Reorder previous purchases

**🔄 Active Orders**
• Track current order status
• Modify delivery instructions
• Reschedule deliveries
• Cancel orders (if eligible)

**💰 Payment Management**
• View payment status
• Update payment methods
• Handle payment issues
• Request payment receipts

**📱 Communication**
• Message sellers directly
• Receive order updates
• Get delivery notifications
• Contact support when needed

**Order Actions:**

**✏️ Modify Orders**
• Add items (before processing)
• Change quantities (seller approval required)
• Update delivery address
• Reschedule delivery time

**❌ Cancel Orders**
• Cancel within 2 hours of placing
• Reason required for cancellation
• Refund processing (if paid)
• Seller notification sent

**🔁 Repeat Orders**
• Quick reorder from history
• Save favorite combinations
• Set up recurring deliveries
• Bulk order templates

**⭐ After Delivery**
• Rate your experience (1-5 stars)
• Leave detailed reviews
• Report any issues
• Recommend to friends

**Account Benefits:**
• Order history tracking
• Loyalty points earning
• Personalized recommendations
• Priority customer support
• Exclusive member deals`,
          tags: ['manage', 'orders', 'history', 'cancel', 'modify'],
          lastUpdated: '2024-10-14'
        }
      ]
    },
    {
      id: 'policies',
      title: 'Policies',
      description: 'Review our terms of service, privacy policy, and community guidelines',
      icon: FileText,
      color: 'text-red-600',
      bgColor: 'bg-red-50 hover:bg-red-100',
      articles: [
        {
          id: 'terms-service',
          title: 'Terms of Service',
          content: `Please read our Terms of Service carefully:

**Agreement Overview:**
By using HarvestHub, you agree to these terms and conditions. These terms govern your use of our platform, services, and interactions with sellers.

**User Responsibilities:**
✅ **Account Security**
• Keep login credentials secure
• Report unauthorized access immediately
• Use accurate personal information
• Don't share your account

✅ **Fair Usage**
• Respect other users and sellers
• Provide honest reviews and ratings
• Follow community guidelines
• Report inappropriate behavior

✅ **Payment Obligations**
• Pay for confirmed orders
• Use legitimate payment methods
• Report payment issues promptly
• Honor payment commitments

**Platform Rules:**

**🚫 Prohibited Activities**
• Creating fake accounts
• Manipulating reviews or ratings
• Harassing sellers or other users
• Using platform for illegal activities
• Violating intellectual property rights

**📝 Order Terms**
• Orders are binding once confirmed
• Prices may vary by seller and location
• Delivery times are estimates
• Quality standards apply to all products

**🔒 Privacy Protection**
• We protect your personal information
• Data used only for platform services
• Third-party sharing limited and disclosed
• You control your privacy settings

**⚖️ Dispute Resolution**
• First resolve directly with seller
• Platform mediation available
• Legal disputes subject to Philippine law
• Arbitration may be required

**Changes to Terms:**
We may update these terms periodically. Continued use constitutes acceptance of new terms. Major changes will be communicated in advance.

**Contact:** legal@harvesthub.ph for questions about terms.`,
          tags: ['terms', 'legal', 'rules', 'conditions', 'agreement'],
          lastUpdated: '2024-09-15'
        },
        {
          id: 'privacy-policy',
          title: 'Privacy Policy',
          content: `Your privacy is important to us. Here's how we protect your information:

**Information We Collect:**

**📝 Personal Information**
• Name, email, phone number
• Delivery addresses
• Payment information (encrypted)
• Birth date and preferences

**📊 Usage Data**
• App/website usage patterns
• Order history and preferences
• Device information
• Location data (with permission)

**🤝 Interaction Data**
• Messages with sellers
• Reviews and ratings
• Support conversations
• Feedback and surveys

**How We Use Your Data:**

**✅ Service Delivery**
• Process and fulfill orders
• Facilitate communication with sellers
• Provide customer support
• Send order updates and notifications

**📈 Improvement**
• Analyze usage patterns
• Improve platform features
• Personalize recommendations
• Develop new services

**🔐 Data Protection:**

**Security Measures**
• 256-bit SSL encryption
• Secure payment processing
• Regular security audits
• Access controls and monitoring

**Your Rights**
• Access your personal data
• Correct inaccurate information
• Delete your account and data
• Control privacy settings
• Opt out of marketing communications

**Data Sharing:**
We don't sell your personal information. Limited sharing occurs with:
• Payment processors (for transactions)
• Delivery partners (for order fulfillment)
• Legal authorities (when required by law)

**Retention Policy:**
• Active account data: Kept while account is active
• Order history: 7 years for tax/legal purposes
• Marketing data: Until you opt out
• Deleted accounts: Data removed within 30 days

**Contact:** privacy@harvesthub.ph for privacy concerns.`,
          tags: ['privacy', 'data', 'protection', 'rights', 'security'],
          lastUpdated: '2024-09-15'
        }
      ]
    }
  ];

  const searchArticles = (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const results: HelpArticle[] = [];
      
      helpCategories.forEach(category => {
        category.articles.forEach(article => {
          const searchContent = `${article.title} ${article.content} ${article.tags.join(' ')}`.toLowerCase();
          if (searchContent.includes(term.toLowerCase())) {
            results.push(article);
          }
        });
      });
      
      setSearchResults(results);
      setLoading(false);
    }, 300);
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchArticles(searchTerm);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedArticle(null);
    setSearchTerm('');
    setSearchResults([]);
  };

  const handleArticleClick = (article: HelpArticle) => {
    setSelectedArticle(article);
  };

  const handleBack = () => {
    if (selectedArticle) {
      setSelectedArticle(null);
    } else if (selectedCategory) {
      setSelectedCategory(null);
    }
  };

  const getPopularArticles = () => {
    const popular: HelpArticle[] = [];
    helpCategories.forEach(category => {
      category.articles.forEach(article => {
        if (article.popular) {
          popular.push(article);
        }
      });
    });
    return popular.slice(0, 6);
  };

  const ContactUsButton = () => (
    <Link
      href="/messages"
      className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
      style={{ fontFamily: 'Poppins, sans-serif' }}
    >
      <MessageCircle className="w-5 h-5" />
      Contact Us
    </Link>
  );

  // Article View
  if (selectedArticle) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Help Center</span>
              </button>
              <ContactUsButton />
            </div>
            
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {selectedArticle.title}
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>Updated {new Date(selectedArticle.lastUpdated).toLocaleDateString()}</span>
                  </div>
                  {selectedArticle.popular && (
                    <div className="flex items-center gap-1 text-orange-600">
                      <Star className="w-4 h-4 fill-current" />
                      <span>Popular Article</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Article Content */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="prose max-w-none">
              {selectedArticle.content.split('\n\n').map((section, index) => (
                <div key={index} className="mb-6">
                  {section.split('\n').map((paragraph, pIndex) => {
                    if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                      return (
                        <h3 key={pIndex} className="text-xl font-semibold text-gray-900 mb-3 mt-6">
                          {paragraph.replace(/\*\*/g, '')}
                        </h3>
                      );
                    }
                    if (paragraph.startsWith('•') || paragraph.startsWith('✅') || paragraph.startsWith('❌')) {
                      return (
                        <li key={pIndex} className="mb-2 ml-4">
                          {paragraph.substring(2).trim()}
                        </li>
                      );
                    }
                    if (paragraph.trim()) {
                      return (
                        <p key={pIndex} className="mb-4 text-gray-700 leading-relaxed">
                          {paragraph}
                        </p>
                      );
                    }
                    return null;
                  })}
                </div>
              ))}
            </div>

            {/* Tags */}
            <div className="mt-8 pt-6 border-t">
              <h4 className="text-sm font-medium text-gray-600 mb-3">Related Tags:</h4>
              <div className="flex flex-wrap gap-2">
                {selectedArticle.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Helpful Section */}
            <div className="mt-8 pt-6 border-t bg-gray-50 -mx-8 -mb-8 px-8 pb-8 rounded-b-lg">
              <div className="text-center">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Was this article helpful?</h4>
                <div className="flex items-center justify-center gap-3 mb-4">
                  <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    <CheckCircle className="w-4 h-4" />
                    Yes, helpful
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                    <AlertTriangle className="w-4 h-4" />
                    Needs improvement
                  </button>
                </div>
                <p className="text-gray-600 text-sm">
                  Still need help? <Link href="/messages" className="text-green-600 hover:text-green-700 font-medium">Contact our support team</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Category View
  if (selectedCategory) {
    const category = helpCategories.find(cat => cat.id === selectedCategory);
    if (!category) return null;

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Help Center</span>
              </button>
              <ContactUsButton />
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-lg ${category.bgColor}`}>
                <category.icon className={`w-8 h-8 ${category.color}`} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {category.title}
                </h1>
                <p className="text-gray-600 mt-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {category.description}
                </p>
              </div>
            </div>
          </div>

          {/* Articles List */}
          <div className="space-y-4">
            {category.articles.map((article) => (
              <div
                key={article.id}
                onClick={() => handleArticleClick(article)}
                className="bg-white rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-all duration-200 border-l-4 border-transparent hover:border-green-500"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {article.title}
                      </h3>
                      {article.popular && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-600 rounded-full text-xs font-medium">
                          <Star className="w-3 h-3 fill-current" />
                          Popular
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {article.content.substring(0, 200)}...
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>Updated {new Date(article.lastUpdated).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {article.tags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 ml-4 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Main Help Center View
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg shadow-lg text-white p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="text-center md:text-left">
              <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Help Center
              </h1>
              <p className="text-green-100 text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Find answers to common questions and get the support you need
              </p>
            </div>
            <ContactUsButton />
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search for help articles, FAQs, or ask a question..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              />
            </div>
            
            {/* Search Results */}
            {searchTerm && (
              <div className="mt-4">
                {loading ? (
                  <div className="flex items-center justify-center py-4">
                    <RefreshCw className="w-5 h-5 animate-spin text-gray-400 mr-2" />
                    <span className="text-gray-600">Searching...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 font-medium">
                      Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}:
                    </p>
                    {searchResults.map((article) => (
                      <div
                        key={article.id}
                        onClick={() => handleArticleClick(article)}
                        className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        <h4 className="font-semibold text-gray-900 mb-1">{article.title}</h4>
                        <p className="text-gray-600 text-sm line-clamp-1">
                          {article.content.substring(0, 100)}...
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-600">No articles found matching "{searchTerm}"</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Try using different keywords or <Link href="/messages" className="text-green-600 hover:text-green-700">contact support</Link>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Popular Articles */}
        {!searchTerm && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Popular Articles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getPopularArticles().map((article) => (
                <div
                  key={article.id}
                  onClick={() => handleArticleClick(article)}
                  className="bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 line-clamp-2 flex-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {article.title}
                    </h4>
                    <Star className="w-4 h-4 text-orange-500 fill-current ml-2 flex-shrink-0" />
                  </div>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                    {article.content.substring(0, 80)}...
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Updated {new Date(article.lastUpdated).toLocaleDateString()}</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Help Categories */}
        {!searchTerm && (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Browse Help Categories
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {helpCategories.map((category) => (
                <div
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className={`bg-white rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 ${category.bgColor} border-l-4 border-transparent hover:border-green-500`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`p-3 rounded-lg ${category.bgColor.replace('hover:', '')}`}>
                      <category.icon className={`w-8 h-8 ${category.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {category.title}
                      </h3>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                  
                  <p className="text-gray-600 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {category.description}
                  </p>
                  
                  <div className="text-sm text-gray-500">
                    {category.articles.length} article{category.articles.length !== 1 ? 's' : ''} available
                  </div>
                  
                  {/* Preview of articles */}
                  <div className="mt-3 space-y-1">
                    {category.articles.slice(0, 2).map((article) => (
                      <div key={article.id} className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        <span className="truncate">{article.title}</span>
                      </div>
                    ))}
                    {category.articles.length > 2 && (
                      <div className="text-xs text-gray-500 ml-3">
                        +{category.articles.length - 2} more articles
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Contact Section */}
        <div className="mt-12 bg-white rounded-lg shadow-sm p-8">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Still Need Help?
            </h2>
            <p className="text-gray-600 mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Can't find what you're looking for? Our support team is here to help you with any questions or concerns.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-green-50 p-4 rounded-lg w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Mail className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Email Support</h4>
                <p className="text-gray-600 text-sm mb-3">Get detailed help via email</p>
                <a href="mailto:support@harvesthub.ph" className="text-green-600 hover:text-green-700 font-medium">
                  support@harvesthub.ph
                </a>
              </div>
              
              <div className="text-center">
                <div className="bg-blue-50 p-4 rounded-lg w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <Phone className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Phone Support</h4>
                <p className="text-gray-600 text-sm mb-3">Call us for immediate assistance</p>
                <a href="tel:+63-XXX-XXXX" className="text-blue-600 hover:text-blue-700 font-medium">
                  +63-XXX-XXXX
                </a>
              </div>
              
              <div className="text-center">
                <div className="bg-purple-50 p-4 rounded-lg w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <MessageCircle className="w-8 h-8 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Live Chat</h4>
                <p className="text-gray-600 text-sm mb-3">Chat with our support team</p>
                <Link href="/messages" className="text-purple-600 hover:text-purple-700 font-medium">
                  Start Chat
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
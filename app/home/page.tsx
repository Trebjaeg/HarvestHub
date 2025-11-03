"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import I18nProvider from '../../components/I18nProvider';
import ProductCard from '../../components/ProductCard';
import TopProducts from '../../components/TopProducts';
import PromoBanner from '../../components/PromoBanner';
import BuyerTestimonials from '../../components/BuyerTestimonials';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import NotificationsPanel from '../../components/NotificationsPanel';
import AuthModal from '../../components/AuthModal';
import { useAuthUserData } from '../../hooks/useAuthUserData';
import { useProducts } from '../../hooks/useProducts';

const HomePageContent = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { isAuthenticated, cartCount: initialCartCount, notificationCount, user } = useAuthUserData();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [cartShake, setCartShake] = useState(false);
  const [cartCount, setCartCount] = useState(initialCartCount);
  const [searchInput, setSearchInput] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<Array<{type: 'product' | 'seller', name: string, id?: string}>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(notificationCount);
  const notifButtonRef = useRef<HTMLButtonElement>(null);
  const mobileNotifButtonRef = useRef<HTMLButtonElement>(null);
  
  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMessage, setAuthModalMessage] = useState("You need to be logged in to access this feature.");
  const [authModalAction, setAuthModalAction] = useState("Please log in or sign up to continue.");

  // Function to show auth modal with custom message
  const showAuthRequired = (message?: string, actionDescription?: string) => {
    if (message) setAuthModalMessage(message);
    if (actionDescription) setAuthModalAction(actionDescription);
    setShowAuthModal(true);
  };

  // Function to handle protected actions
  const handleProtectedAction = (action: string, callback?: () => void) => {
    if (!isAuthenticated) {
      let message = "You need to be logged in to access this feature.";
      let actionDesc = "Please log in or sign up to continue.";
      
      switch (action) {
        case 'cart':
          message = "You need to be logged in to add items to your cart.";
          actionDesc = "Please log in or sign up to start shopping.";
          break;
        case 'profile':
          message = "You need to be logged in to access your profile.";
          actionDesc = "Please log in or sign up to manage your account.";
          break;
        case 'notifications':
          message = "You need to be logged in to view notifications.";
          actionDesc = "Please log in or sign up to stay updated.";
          break;
        case 'shop':
          message = "You need to be logged in to access the shop.";
          actionDesc = "Please log in or sign up to start shopping.";
          break;
        case 'deals':
          message = "You need to be logged in to view deals.";
          actionDesc = "Please log in or sign up to access exclusive deals.";
          break;
        case 'best-seller':
          message = "You need to be logged in to view best sellers.";
          actionDesc = "Please log in or sign up to discover our best selling products.";
          break;
        case 'top-farmers':
          message = "You need to be logged in to view top farmers.";
          actionDesc = "Please log in or sign up to connect with our top farmers.";
          break;
        case 'category':
          message = "You need to be logged in to browse categories.";
          actionDesc = "Please log in or sign up to explore our product categories.";
          break;
        case 'search':
          message = "You need to be logged in to search products.";
          actionDesc = "Please log in or sign up to search and discover products.";
          break;
        case 'contact':
          message = "You need to be logged in to contact support.";
          actionDesc = "Please log in or sign up to get help and support.";
          break;
        case 'help':
          message = "You need to be logged in to view help resources.";
          actionDesc = "Please log in or sign up to access our help center.";
          break;
        default:
          break;
      }
      
      showAuthRequired(message, actionDesc);
    } else if (callback) {
      callback();
    }
  };
  
  // Fetch cart count on initial load
  useEffect(() => {
    const fetchCartCount = async () => {
      try {
        const response = await fetch('/api/cart', { credentials: 'include' });
        const data = await response.json();
        if (data.success) {
          setCartCount(data.count || 0);
        }
      } catch (error) {
        console.error('Failed to fetch cart count:', error);
      }
    };

    if (isAuthenticated) {
      fetchCartCount();
    }
  }, [isAuthenticated]);
  
  // Update cart count when initial value changes
  useEffect(() => {
    setCartCount(initialCartCount);
  }, [initialCartCount]);

  // Update notification count when initial value changes
  useEffect(() => {
    setUnreadCount(notificationCount);
  }, [notificationCount]);
  
  // Listen for cart update events
  useEffect(() => {
    const handleCartUpdate = (event: CustomEvent<{ count?: number }>) => {
      setCartShake(true);
      setTimeout(() => setCartShake(false), 600);
      
      // Update cart count if provided in event
      if (event.detail?.count !== undefined) {
        setCartCount(event.detail.count);
      } else {
        // Fetch updated cart count if not provided
        fetch('/api/cart', { credentials: 'include' })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              setCartCount(data.count || 0);
            }
          })
          .catch(err => console.error('Failed to fetch cart count:', err));
      }
    };
    
    window.addEventListener('cart-updated', handleCartUpdate as EventListener);
    return () => window.removeEventListener('cart-updated', handleCartUpdate as EventListener);
  }, []);
  
  // Use real API data via useProducts hook
  const { 
    products, 
    loading, 
    error,
    totalPages,
    setCurrentPage: setApiCurrentPage,
    setFilters
  } = useProducts({
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    page: currentPage,
    limit: 12
  });

  // Use products directly from API - all mock data removed
  const filteredProducts = products;

  // Handle category filter change  
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    // Map display categories to API categories
    let apiCategory: string | undefined;
    if (category === 'all') {
      apiCategory = undefined;
    } else if (category === 'vegetables') {
      // API will handle showing all vegetable categories
      apiCategory = 'vegetables';
    } else if (category === 'fruits') {
      apiCategory = 'Fruits';
    } else if (category === 'spices') {
      apiCategory = 'Spices & Aromatics';
    } else if (category === 'grains') {
      apiCategory = 'Grains & Rice';
    } else {
      apiCategory = category;
    }
    
    setFilters({ category: apiCategory });
    setCurrentPage(1);
    setApiCurrentPage(1);
  };

  const heroSlides = [
    {
      id: 1,
      image: "/images/hero/hero1.jpg",
      title: "Fresh & Healthy",
      subtitle: "Farm to table quality",
      buttonText: "Shop Now",
      link: "/"
    },
    {
      id: 2,
      image: "/images/hero/hero2.png",
      title: "20% Off Vegetables",
      subtitle: "Healthy Vegetables Starting at ₱1,499",
      buttonText: "Shop Vegetables",
      link: "/home/vegetables"
    },
    {
      id: 3,
      image: "/images/hero/hero3.png",
      title: "40% Off Fresh Produce",
      subtitle: "Everyday Fresh Starting at ₱1,899",
      buttonText: "Shop Fresh",
      link: "/home/fresh"
    }
  ];

  // Auto-slide effect
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(slideInterval);
  }, [heroSlides.length]);

  // Keyboard navigation for carousel
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as Element;
      if (target && target.closest && target.closest('[data-carousel]')) {
        switch (event.key) {
          case 'ArrowLeft':
            event.preventDefault();
            setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
            break;
          case 'ArrowRight':
            event.preventDefault();
            setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
            break;
          case 'Home':
            event.preventDefault();
            setCurrentSlide(0);
            break;
          case 'End':
            event.preventDefault();
            setCurrentSlide(heroSlides.length - 1);
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [heroSlides.length]);

  // Search handlers
  const handleSearchInputChange = (value: string) => {
    setSearchInput(value);
    if (value.trim().length > 1) {
      fetchSearchSuggestions(value);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const fetchSearchSuggestions = async (query: string) => {
    try {
      const response = await fetch(`/api/products/suggestions?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (data.success && data.suggestions) {
        setSearchSuggestions(data.suggestions);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    }
  };

  const handleSuggestionClick = (suggestion: {type: 'product' | 'seller', name: string, id?: string}) => {
    if (!isAuthenticated) {
      handleProtectedAction('search', () => {});
      return;
    }
    setSearchInput(suggestion.name);
    setShowSuggestions(false);
    // Navigate to shop with search query
    router.push(`/shop?search=${encodeURIComponent(suggestion.name)}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      handleProtectedAction('search', () => {});
      return;
    }
    if (searchInput.trim()) {
      setShowSuggestions(false);
      router.push(`/shop?search=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  // Get contact support link based on user role
  const getContactSupportLink = () => {
    if (!user) return '/help/buyer/contact-support'; // Default to buyer if no user
    
    // Check if user has seller role
    const isSeller = user.role === 'seller' || user.role === 'farmer';
    return isSeller ? '/help/seller/contact-support' : '/help/buyer/contact-support';
  };

  const getHotQuestionsLink = () => {
    return '/help';
  };

  const categories = [
    { 
      id: 1, 
      name: t('home.categoryNames.leafyGreens'), 
      image: "/images/categories/leafygreens.png", 
      description: t('home.categoryDesc.leafyGreens')
    },
    { 
      id: 2, 
      name: t('home.categoryNames.rootCrops'), 
      image: "/images/categories/rootcrops.png", 
      description: t('home.categoryDesc.rootCrops')
    },
    { 
      id: 3, 
      name: t('home.categoryNames.fruits'), 
      image: "/images/categories/fruits.png", 
      description: t('home.categoryDesc.fruits')
    },
    { 
      id: 4, 
      name: t('home.categoryNames.spicesAndAromatics'), 
      image: "/images/categories/spicesandaromatics.png", 
      description: t('home.categoryDesc.spicesAndAromatics')
    },
    { 
      id: 5, 
      name: t('home.categoryNames.eggplantAndGourds'), 
      image: "/images/categories/eggplantandgourds.png", 
      description: t('home.categoryDesc.eggplantAndGourds')
    },
    { 
      id: 6, 
      name: t('home.categoryNames.grainsAndRice'), 
      image: "/images/categories/grainsandrice.png", 
      description: t('home.categoryDesc.grainsAndRice')
    }
  ];

  const benefits = [
    { 
      icon: "/images/benefits/farmer.png", 
      title: t('home.benefits.directFarmerConnection'), 
      description: t('home.benefits.directFarmerConnectionDesc')
    },
    { 
      icon: "/images/benefits/box.png", 
      title: t('home.benefits.liveHarvestUpdates'), 
      description: t('home.benefits.liveHarvestUpdatesDesc')
    },
    { 
      icon: "/images/benefits/truck.png", 
      title: t('home.benefits.easyDeliveryCoordination'), 
      description: t('home.benefits.easyDeliveryCoordinationDesc')
    },
    { 
      icon: "/images/benefits/sprout.png", 
      title: t('home.benefits.upliftingLocalAgriculture'), 
      description: t('home.benefits.upliftingLocalAgricultureDesc')
    }
  ];

  return (
    <div className="min-h-screen bg-[#ECFDF5]" style={{ fontFamily: 'Poppins, sans-serif' }}>
      {/* Header */}
      <header className="bg-[#103C2E] text-white py-3 md:py-4">
        <div className="container mx-auto px-4">
          {/* Mobile Header */}
          <div className="flex md:hidden items-center justify-between">
            <div className="flex items-center">
              <span className="text-xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <span style={{ color: '#6CD75A' }}>Harvest</span>
                <span style={{ color: '#D4DB69' }}> Hub</span>
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              {isAuthenticated ? (
                <Link href="/my-profile" className="flex items-center space-x-1" title="Profile">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                </Link>
              ) : (
                <button 
                  onClick={() => handleProtectedAction('profile')}
                  className="flex items-center space-x-1" 
                  title="Profile"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                </button>
              )}
              
              {isAuthenticated ? (
                <Link href="/cart" data-cart-icon className={`relative transition-transform ${cartShake ? 'animate-shake' : ''}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                  </svg>
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </Link>
              ) : (
                <button 
                  onClick={() => handleProtectedAction('cart')}
                  className="relative transition-transform"
                  title="Cart"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                  </svg>
                </button>
              )}
              
              {isAuthenticated && (
                <button 
                  ref={mobileNotifButtonRef}
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
              )}
              
              <div className="relative">
                <LanguageSwitcher variant="header" />
              </div>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-2xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <span style={{ color: '#6CD75A' }}>Harvest</span>
                <span style={{ color: '#D4DB69' }}> Hub</span>
              </span>
            </div>
            
            <div className="flex-1 max-w-2xl mx-6">
              <form onSubmit={handleSearch} className="relative">
                <svg className="absolute left-5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={t('home.searchPlaceholder')}
                  value={searchInput}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                  onFocus={() => searchInput.length > 1 && searchSuggestions.length > 0 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="w-full pl-14 pr-6 py-3 rounded-2xl text-gray-800 bg-white border-0 focus:outline-none focus:ring-2 focus:ring-green-400/50 placeholder-gray-500 shadow-sm"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                />
              </form>
            </div>
            
            <div className="flex items-center space-x-3">
              {isAuthenticated ? (
                <Link href="/my-profile" className="flex items-center space-x-2 hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105" title="Profile">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                  <span className="text-white text-sm font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>Profile</span>
                </Link>
              ) : (
                <button 
                  onClick={() => handleProtectedAction('profile')}
                  className="flex items-center space-x-2 hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105" 
                  title="Login"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                  <span className="text-white text-sm font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>Login/Sign Up</span>
                </button>
              )}
              
              {isAuthenticated ? (
                <Link href="/cart" data-cart-icon className={`relative hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105 flex items-center space-x-2 ${cartShake ? 'animate-shake' : ''}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                  </svg>
                  <span className="text-white text-sm font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>Cart</span>
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </Link>
              ) : (
                <button 
                  onClick={() => handleProtectedAction('cart')}
                  className="relative hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105 flex items-center space-x-2"
                  title="Cart"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                  </svg>
                  <span className="text-white text-sm font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>Shop</span>
                </button>
              )}
              
              {isAuthenticated && (
                <button 
                  ref={notifButtonRef}
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105 flex items-center space-x-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                  </svg>
                  <span className="text-white text-sm font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
              )}              <div className="relative">
                <LanguageSwitcher variant="header" />
              </div>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="md:hidden mt-3">
            <form onSubmit={handleSearch} className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={mobileSearchInputRef}
                type="text"
                placeholder={t('home.searchPlaceholder')}
                value={searchInput}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                onFocus={() => searchInput.length > 1 && searchSuggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="w-full pl-10 pr-4 py-2.5 rounded-full text-gray-800 bg-white border-0 focus:outline-none focus:ring-2 focus:ring-white/30 placeholder-gray-400"
              />
            </form>
          </div>
        </div>
      </header>

      {/* Desktop Search Suggestions Dropdown - Fixed positioning */}
      {showSuggestions && searchSuggestions.length > 0 && searchInput.trim().length > 1 && searchInputRef.current && (
        <div 
          className="hidden md:block fixed bg-white rounded-xl shadow-2xl border border-gray-200 max-h-80 overflow-y-auto z-[9999]"
          style={{
            top: `${searchInputRef.current.getBoundingClientRect().bottom + 8}px`,
            left: `${searchInputRef.current.getBoundingClientRect().left}px`,
            width: `${searchInputRef.current.getBoundingClientRect().width}px`
          }}
        >
          {searchSuggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-5 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-0 transition-colors"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              {suggestion.type === 'product' ? (
                <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{suggestion.name}</div>
                <div className="text-xs text-gray-500">
                  {suggestion.type === 'product' ? 'Product' : 'Seller'}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Mobile Search Suggestions Dropdown - Fixed positioning */}
      {showSuggestions && searchSuggestions.length > 0 && searchInput.trim().length > 1 && mobileSearchInputRef.current && (
        <div 
          className="md:hidden fixed bg-white rounded-lg shadow-2xl border border-gray-200 max-h-60 overflow-y-auto z-[9999]"
          style={{
            top: `${mobileSearchInputRef.current.getBoundingClientRect().bottom + 8}px`,
            left: `${mobileSearchInputRef.current.getBoundingClientRect().left}px`,
            width: `${mobileSearchInputRef.current.getBoundingClientRect().width}px`
          }}
        >
          {searchSuggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100 last:border-0"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              {suggestion.type === 'product' ? (
                <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{suggestion.name}</div>
                <div className="text-xs text-gray-500">{suggestion.type === 'product' ? 'Product' : 'Seller'}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Navigation Bar */}
      <nav className="bg-gray-100 py-3 border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          {/* Mobile Navigation */}
          <div className="md:hidden">
            <div className="flex items-center justify-center text-sm">
              <div className="flex items-center space-x-3 text-xs overflow-x-auto">
                <Link href="/" className="font-medium py-2 border-b-2 whitespace-nowrap" style={{ color: '#614124', borderColor: '#614124' }}>Home</Link>
                {isAuthenticated ? (
                  <Link href="/shop" className="py-2 whitespace-nowrap" style={{ color: '#614124' }}>Shop</Link>
                ) : (
                  <button onClick={() => handleProtectedAction('shop')} className="py-2 whitespace-nowrap" style={{ color: '#614124' }}>Shop</button>
                )}
                {isAuthenticated ? (
                  <Link href="/deals" className="py-2 whitespace-nowrap" style={{ color: '#614124' }}>Deals</Link>
                ) : (
                  <button onClick={() => handleProtectedAction('deals', () => {})} className="py-2 whitespace-nowrap" style={{ color: '#614124' }}>Deals</button>
                )}
                {isAuthenticated ? (
                  <Link href="/best-seller" className="py-2 whitespace-nowrap" style={{ color: '#614124' }}>Best Seller</Link>
                ) : (
                  <button onClick={() => handleProtectedAction('best-seller', () => {})} className="py-2 whitespace-nowrap" style={{ color: '#614124' }}>Best Seller</button>
                )}
                {isAuthenticated ? (
                  <Link href="/top-farmers" className="py-2 whitespace-nowrap" style={{ color: '#614124' }}>Top Farmers</Link>
                ) : (
                  <button onClick={() => handleProtectedAction('top-farmers', () => {})} className="py-2 whitespace-nowrap" style={{ color: '#614124' }}>Top Farmers</button>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center justify-center text-sm">
            <div className="flex items-center space-x-16">
              <Link href="/" className="font-medium py-2 border-b-2" style={{ color: '#614124', borderColor: '#614124' }}>Home</Link>
              {isAuthenticated ? (
                <Link href="/shop" className="py-2 hover:border-b-2 transition-all" style={{ color: '#614124' }}>Shop</Link>
              ) : (
                <button onClick={() => handleProtectedAction('shop')} className="py-2 hover:border-b-2 transition-all" style={{ color: '#614124' }}>Shop</button>
              )}
              {isAuthenticated ? (
                <Link href="/deals" className="py-2 hover:border-b-2 transition-all" style={{ color: '#614124' }}>Deals</Link>
              ) : (
                <button onClick={() => handleProtectedAction('deals', () => {})} className="py-2 hover:border-b-2 transition-all" style={{ color: '#614124' }}>Deals</button>
              )}
              {isAuthenticated ? (
                <Link href="/best-seller" className="py-2 hover:border-b-2 transition-all" style={{ color: '#614124' }}>Best Seller</Link>
              ) : (
                <button onClick={() => handleProtectedAction('best-seller', () => {})} className="py-2 hover:border-b-2 transition-all" style={{ color: '#614124' }}>Best Seller</button>
              )}
              {isAuthenticated ? (
                <Link href="/top-farmers" className="py-2 hover:border-b-2 transition-all" style={{ color: '#614124' }}>Top Farmers</Link>
              ) : (
                <button onClick={() => handleProtectedAction('top-farmers', () => {})} className="py-2 hover:border-b-2 transition-all" style={{ color: '#614124' }}>Top Farmers</button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-4 md:py-8">
        {/* Mobile Hero */}
        <div className="md:hidden space-y-4">
          {/* Main Mobile Carousel */}
          <div 
            className="relative h-48 rounded-xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
            data-carousel
            role="region"
            aria-label="Hero image carousel"
            aria-live="polite"
            tabIndex={0}
          >
            {heroSlides.map((slide, index) => (
              <Link href={slide.link} key={slide.id}>
                <div 
                  className={`absolute inset-0 transition-transform duration-1000 ease-in-out ${
                    index === currentSlide ? 'translate-x-0' : 
                    index < currentSlide ? '-translate-x-full' : 'translate-x-full'
                  }`}
                >
                  <Image
                    src={slide.image}
                    alt={slide.title}
                    fill
                    className="object-cover"
                    priority={index === 0}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent flex items-center">
                    <div className="text-white p-6">
                      <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>{slide.title}</h2>
                      <p className="text-sm mb-3 opacity-90">{slide.subtitle}</p>
                      <button className="bg-white text-green-700 px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors">
                        {slide.buttonText}
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            
            {/* Mobile Slide Indicators */}
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {heroSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  aria-label={`Go to slide ${index + 1} of ${heroSlides.length}`}
                  aria-current={index === currentSlide ? "true" : "false"}
                  className={`w-2 h-2 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black/20 ${
                    index === currentSlide ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Mobile Static Promotional Banners */}
          <div className="grid grid-cols-2 gap-3">
            <div className="relative h-24 rounded-xl overflow-hidden">
              <Image
                src="/images/hero/hero2.png"
                alt="Healthy Vegetables Offer"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent flex items-center">
                <div className="text-white p-3">
                  <p className="text-sm font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>20% off!</p>
                  <p className="text-xs">Vegetables</p>
                </div>
              </div>
            </div>

            <div className="relative h-24 rounded-xl overflow-hidden">
              <Image
                src="/images/hero/hero3.png"
                alt="Everyday Fresh Offer"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent flex items-center">
                <div className="text-white p-3">
                  <p className="text-sm font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>40% off!</p>
                  <p className="text-xs">Fresh Produce</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Hero */}
        <div className="hidden md:grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Hero Carousel */}
          <div 
            className="lg:col-span-2 relative h-80 lg:h-96 rounded-xl overflow-hidden group focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
            data-carousel
            role="region"
            aria-label="Hero image carousel"
            aria-live="polite"
            tabIndex={0}
          >
            {heroSlides.map((slide, index) => (
              <Link href={slide.link} key={slide.id}>
                <div 
                  className={`absolute inset-0 transition-transform duration-1000 ease-in-out ${
                    index === currentSlide ? 'translate-x-0' : 
                    index < currentSlide ? '-translate-x-full' : 'translate-x-full'
                  }`}
                >
                  <Image
                    src={slide.image}
                    alt={slide.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    priority={index === 0}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent flex items-center">
                    <div className="text-white p-8">
                      <h2 className="text-3xl lg:text-4xl font-bold mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>{slide.title}</h2>
                      <p className="text-lg mb-6">{slide.subtitle}</p>
                      <button className="bg-white text-green-700 px-6 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {slide.buttonText} →
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            
            {/* Slide Indicators */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {heroSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  aria-label={`Go to slide ${index + 1} of ${heroSlides.length}`}
                  aria-current={index === currentSlide ? "true" : "false"}
                  className={`w-3 h-3 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black/20 hover:scale-110 ${
                    index === currentSlide ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
          
          {/* Side Promotional Banners */}
          <div className="flex flex-col gap-4">
            <div className="relative h-[185px] rounded-xl overflow-hidden group">
              <Image
                src="/images/hero/hero2.png"
                alt="Healthy Vegetables Offer"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent flex items-center">
                <div className="text-white p-6">
                  <p className="text-xl font-bold mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>20% off!</p>
                  <h3 className="text-lg font-medium mb-1">Healthy Vegetables</h3>
                  <p className="text-sm opacity-90">Start at ₱1,499</p>
                </div>
              </div>
            </div>

            <div className="relative h-[185px] rounded-xl overflow-hidden group">
              <Image
                src="/images/hero/hero3.png"
                alt="Everyday Fresh Offer"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent flex items-center">
                <div className="text-white p-6">
                  <p className="text-xl font-bold mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>40% off!</p>
                  <h3 className="text-lg font-medium mb-1">Everyday Fresh</h3>
                  <p className="text-sm opacity-90">Start at ₱1,899</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-[#103C2E] text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="w-20 h-16 mx-auto flex items-center justify-center">
                  <Image
                    src={benefit.icon}
                    alt={benefit.title}
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                </div>
                <h4 className="font-bold text-lg mb-2 text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>{benefit.title}</h4>
                <p className="text-sm text-white/80 leading-relaxed max-w-xs mx-auto" style={{ fontFamily: 'Poppins, sans-serif' }}>{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12" style={{ backgroundColor: '#ECFDF5' }}>
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-normal text-center mb-12" style={{ color: '#614124', fontWeight: '500' }}>{t('home.categories')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-12 mx-auto">
            {categories.map((category) => (
              isAuthenticated ? (
                <Link 
                  key={category.id} 
                  href={`/home/category/${category.id}`} 
                  className="text-center group"
                >
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-gray-200 group-hover:border-[#103C2E] transition-all duration-300 group-hover:scale-105">
                    <Image
                      src={category.image}
                      alt={category.name}
                      width={96}
                      height={96}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <h3 className="mb-2 group-hover:text-[#103C2E] transition-colors font-semibold text-sm" style={{ color: '#614124' }}>
                    {category.name}
                  </h3>
                  <p className="text-xs leading-relaxed" style={{ color: '#614124' }}>{category.description}</p>
                </Link>
              ) : (
                <button 
                  key={category.id} 
                  onClick={() => handleProtectedAction('category', () => {})}
                  className="text-center group cursor-pointer"
                >
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-gray-200 group-hover:border-[#103C2E] transition-all duration-300 group-hover:scale-105">
                    <Image
                      src={category.image}
                      alt={category.name}
                      width={96}
                      height={96}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <h3 className="mb-2 group-hover:text-[#103C2E] transition-colors font-semibold text-sm" style={{ color: '#614124' }}>
                    {category.name}
                  </h3>
                  <p className="text-xs leading-relaxed" style={{ color: '#614124' }}>{category.description}</p>
                </button>
              )
            ))}
          </div>
        </div>
      </section>

      {/* Special Menu Section */}
      <section className="py-12" style={{ backgroundColor: '#ECFDF5' }}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Side - Special Menu Card & Top Products */}
            <div className="lg:col-span-1 space-y-6">
              {/* Special Menu Card */}
              <div 
                className="relative rounded-2xl overflow-hidden text-center bg-[#C8956D] h-[500px] flex items-center justify-center"
              >
                {/* Background image */}
                <Image
                  src="/images/hero/hero4.jpeg"
                  alt="Fresh fruits background"
                  fill
                  className="object-cover w-full h-full absolute top-0 left-0 z-0"
                />
                {/* Content */}
                <div className="absolute top-0 left-0 right-0 z-10 w-full px-6 pt-12">
                  <div className="mb-4 text-[#103C2E] font-medium text-sm" style={{ fontFamily: 'Poppins, sans-serif', fontWeight: '500' }}>
                    Hot This Week
                  </div>
                  <h3 
                    className="text-white text-3xl mb-2"
                    style={{ fontFamily: 'Pacifico, cursive' }}
                  >
                    Special Menu
                  </h3>
                  <p className="text-white/90 text-sm mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    On all weekend sale
                  </p>
                  <button 
                    className="text-white px-5 py-2 rounded-full font-medium text-base transition-colors mx-auto mb-4 shadow-lg"
                    style={{ 
                      fontFamily: 'Poppins, sans-serif',
                      background: 'linear-gradient(90deg, #FFB347 5%, #FF7D29 57%)',
                      boxShadow: '0 2px 12px 0 rgba(255, 179, 71, 0.15)'
                    }}
                  >
                    Shop now
                  </button>
                </div>
              </div>

              {/* Top Products Section - Dynamic Component */}
              <TopProducts title={t('home.bestOffers')} maxItems={4} />
            </div>

            {/* Right Side - Featured Products Grid */}
            <div className="lg:col-span-3">
              <div className="mb-6">
                <h2 
                  className="text-2xl font-semibold inline-block border-b-2 border-green-600 pb-1"
                  style={{ color: '#614124', fontFamily: 'Poppins, sans-serif' }}
                >
                  Featured Products
                </h2>
              </div>

              <div className="flex gap-2 mb-6 overflow-x-auto">
                <button 
                  onClick={() => handleCategoryChange('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                    selectedCategory === 'all' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  All Products
                </button>
                <button 
                  onClick={() => handleCategoryChange('vegetables')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                    selectedCategory === 'vegetables' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  Fresh Vegetables
                </button>
                <button 
                  onClick={() => handleCategoryChange('fruits')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                    selectedCategory === 'fruits' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  Fruits
                </button>
                <button 
                  onClick={() => handleCategoryChange('spices')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                    selectedCategory === 'spices' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  Roots & Spice
                </button>
                <button 
                  onClick={() => handleCategoryChange('grains')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                    selectedCategory === 'grains' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  Grains & Rice
                </button>
              </div>

              {/* Products Grid */}
              <div className="min-h-[400px]">
                {loading ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 lg:gap-10 justify-items-center">
                    {/* Loading skeleton cards */}
                    {[...Array(8)].map((_, index) => (
                      <div key={index} className="w-full max-w-[218px] border-2 border-gray-200 rounded-2xl bg-white shadow-sm overflow-hidden animate-pulse" style={{ height: '275px' }}>
                        <div className="bg-gray-200" style={{ height: '186px' }}></div>
                        <div className="p-4 space-y-2" style={{ height: '89px' }}>
                          <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <div className="text-red-600 mb-4">
                      <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 1 0-18 0 9 9 0 0 0 18 0z" />
                      </svg>
                      <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Error Loading Products
                      </h3>
                      <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {error}
                      </p>
                    </div>
                    <button 
                      onClick={() => window.location.reload()}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      style={{ fontFamily: 'Poppins, sans-serif' }}
                    >
                      Try Again
                    </button>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-500 mb-4">
                      <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8V9a4 4 0 11-8 0V5" />
                      </svg>
                      <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        No Products Found
                      </h3>
                      <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {selectedCategory === 'all' 
                          ? "No products available at the moment." 
                          : `No products found in the ${selectedCategory} category.`
                        }
                      </p>
                    </div>
                    {selectedCategory !== 'all' && (
                      <button 
                        onClick={() => handleCategoryChange('all')}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        style={{ fontFamily: 'Poppins, sans-serif' }}
                      >
                        View All Products
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 lg:gap-10 justify-items-center">
                      {filteredProducts.map((product) => (
                        <ProductCard key={product._id} product={product} />
                      ))}
                    </div>
                    
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex justify-center items-center space-x-4 mt-8">
                        <button
                          onClick={() => {
                            const newPage = Math.max(1, currentPage - 1);
                            setCurrentPage(newPage);
                            setApiCurrentPage(newPage);
                          }}
                          disabled={currentPage === 1}
                          className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
                          style={{ fontFamily: 'Poppins, sans-serif' }}
                        >
                          Previous
                        </button>
                        
                        <div className="flex space-x-2">
                          {[...Array(totalPages)].map((_, index) => {
                            const page = index + 1;
                            return (
                              <button
                                key={page}
                                onClick={() => {
                                  setCurrentPage(page);
                                  setApiCurrentPage(page);
                                }}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                  currentPage === page
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                }`}
                                style={{ fontFamily: 'Poppins, sans-serif' }}
                              >
                                {page}
                              </button>
                            );
                          })}
                        </div>
                        
                        <button
                          onClick={() => {
                            const newPage = Math.min(totalPages, currentPage + 1);
                            setCurrentPage(newPage);
                            setApiCurrentPage(newPage);
                          }}
                          disabled={currentPage === totalPages}
                          className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
                          style={{ fontFamily: 'Poppins, sans-serif' }}
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Promo Banner - Below Products */}
              <div className="mt-12 flex justify-center">
                <PromoBanner />
              </div>

              {/* Buyer Testimonials - Directly Below Promo Banner */}
              <div className="mt-0">
                <BuyerTestimonials minRating={4} limit={20} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Farmers Showcase Section */}
      <section className="bg-white py-8 md:py-12 overflow-hidden">
        <div className="relative">
          <div className="flex animate-scroll md:animate-scroll-desktop" style={{ gap: '12px' }}>
            {/* First set of images */}
            {[
              'kalabaw.svg',
              'lolafarmer.svg',
              'nakayuko.svg',
              'palay1.svg',
              'palay2.svg',
              'palaygirl.svg',
              'pineapplefarmer.svg',
              'saging.svg'
            ].map((image, index) => (
              <div
                key={`first-${index}`}
                className="flex-shrink-0"
                style={{ 
                  width: '180px', 
                  height: '240px' 
                }}
              >
                <div className="relative w-full h-full rounded-xl md:rounded-2xl overflow-hidden shadow-md md:shadow-lg">
                  <Image
                    src={`/images/farmers-pic/${image}`}
                    alt={`Farmer ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            ))}
            
            {/* Duplicate set for seamless loop */}
            {[
              'kalabaw.svg',
              'lolafarmer.svg',
              'nakayuko.svg',
              'palay1.svg',
              'palay2.svg',
              'palaygirl.svg',
              'pineapplefarmer.svg',
              'saging.svg'
            ].map((image, index) => (
              <div
                key={`second-${index}`}
                className="flex-shrink-0"
                style={{ 
                  width: '180px', 
                  height: '240px' 
                }}
              >
                <div className="relative w-full h-full rounded-xl md:rounded-2xl overflow-hidden shadow-md md:shadow-lg">
                  <Image
                    src={`/images/farmers-pic/${image}`}
                    alt={`Farmer ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Notifications Panel */}
      {isAuthenticated && (
        <NotificationsPanel
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
          onUnreadCountChange={setUnreadCount}
          buttonRef={(notifButtonRef.current ? notifButtonRef : mobileNotifButtonRef) as React.RefObject<HTMLButtonElement>}
        />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        message={authModalMessage}
        actionDescription={authModalAction}
      />
      
      {/* Cart Shake Animation */}
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
          20%, 40%, 60%, 80% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.6s ease-in-out !important;
        }
        
        /* Mobile animation */
        @keyframes scroll-left-mobile {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-180px * 8 - 12px * 8));
          }
        }
        
        /* Desktop animation */
        @keyframes scroll-left-desktop {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-180px * 8 - 12px * 8));
          }
        }
        
        .animate-scroll {
          animation: scroll-left-mobile 30s linear infinite;
          will-change: transform;
        }
        
        @media (min-width: 768px) {
          .animate-scroll-desktop {
            animation: scroll-left-desktop 35s linear infinite;
          }
        }
        
        .animate-scroll:hover,
        .animate-scroll-desktop:hover {
          animation-play-state: paused;
        }
      `}</style>

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
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 36 36" className="flex-shrink-0 text-[#D4DB69]"><path fill="currentColor" d="M32.33 6a2 2 0 0 0-.41 0h-28a2 2 0 0 0-.53.08l14.45 14.39Z" className="clr-i-solid clr-i-solid-path-1"/><path fill="currentColor" d="m33.81 7.39l-14.56 14.5a2 2 0 0 1-2.82 0L2 7.5a2 2 0 0 0-.07.5v20a2 2 0 0 0 2 2h28a2 2 0 0 0 2-2V8a2 2 0 0 0-.12-.61M5.3 28H3.91v-1.43l7.27-7.21l1.41 1.41Zm26.61 0h-1.4l-7.29-7.23l1.41-1.41l7.27 7.21Z" className="clr-i-solid clr-i-solid-path-2"/><path fill="none" d="M0 0h36v36H0z"/></svg>
                    <a href="mailto:admin@harvesthubph.app" className="text-white/90 hover:text-white transition-colors text-xs md:text-sm break-all">
                      admin@harvesthubph.app
                    </a>
                  </div>
                  <div className="flex items-center justify-center md:justify-start space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" className="flex-shrink-0 text-[#D4DB69]"><path fill="currentColor" d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24c1.12.37 2.33.57 3.57.57c.55 0 1 .45 1 1V20c0 .55-.45 1-1 1c-9.39 0-17-7.61-17-17c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1c0 1.25.2 2.45.57 3.57c.11.35.03.74-.25 1.02z"/></svg>
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
                  <Link href="/about-us" className="block text-white/90 hover:text-white transition-colors text-xs md:text-sm">
                    About Us
                  </Link>
                  {isAuthenticated ? (
                    <Link href={getContactSupportLink()} className="block text-white/90 hover:text-white transition-colors text-xs md:text-sm">
                      Contact Us
                    </Link>
                  ) : (
                    <button onClick={() => handleProtectedAction('contact', () => {})} className="block text-white/90 hover:text-white transition-colors text-xs md:text-sm text-left">
                      Contact Us
                    </button>
                  )}
                  {isAuthenticated ? (
                    <Link href={getHotQuestionsLink()} className="block text-white/90 hover:text-white transition-colors text-xs md:text-sm">
                      Hot Questions
                    </Link>
                  ) : (
                    <button onClick={() => handleProtectedAction('help', () => {})} className="block text-white/90 hover:text-white transition-colors text-xs md:text-sm text-left">
                      Hot Questions
                    </button>
                  )}
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
};

const HomePage = () => {
  return (
    <I18nProvider>
      <HomePageContent />
    </I18nProvider>
  );
};

export default HomePage;
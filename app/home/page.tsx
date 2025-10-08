"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import I18nProvider from '../../components/I18nProvider';
import ProductCard from '../../components/ProductCard';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { useUserData } from '../../hooks/useUserData';
import { IProduct } from '../../types/product';
// import { useProducts } from '../../hooks/useProducts'; // Will be used later when API is synced

const HomePageContent = () => {
  const { t } = useTranslation();
  const { isAuthenticated, cartCount, notificationCount } = useUserData();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Mock products for demonstration (matching our IProduct interface)
  const mockProducts: IProduct[] = [
    {
      _id: '1',
      name: "Bitter Gourd",
      description: "Fresh organic bitter gourd, perfect for traditional Filipino dishes.",
      category: 'vegetables' as const,
      basePrice: 55,
      currentPrice: 40,
      unit: 'kg' as const,
      stock: 25,
      imageUrl: "/images/products/bittergourd.png",
      farmer: {
        name: "Juan Dela Cruz",
        location: "Laguna",
        contact: "+639123456789"
      },
      isOrganic: true,
      isFeatured: true,
      tags: ["healthy", "traditional", "bitter", "vegetable"],
      nutritionalInfo: {
        calories: 17,
        protein: 1,
        carbohydrates: 3.7,
        fiber: 2.8
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: '2',
      name: "Fresh Lemon",
      description: "Juicy and tangy lemons freshly picked from our organic farms.",
      category: 'fruits' as const,
      basePrice: 130,
      currentPrice: 105,
      unit: 'kg' as const,
      stock: 40,
      imageUrl: "/images/products/lemon.png",
      farmer: {
        name: "Maria Santos",
        location: "Batangas",
        contact: "+639987654321"
      },
      isOrganic: true,
      isFeatured: true,
      tags: ["citrus", "vitamin-c", "fresh", "organic"],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: '3',
      name: "Roma Tomato",
      description: "Fresh, ripe Roma tomatoes perfect for sauces and salads.",
      category: 'vegetables' as const,
      basePrice: 66,
      currentPrice: 50,
      unit: 'kg' as const,
      stock: 35,
      imageUrl: "/images/products/tomato.png",
      farmer: {
        name: "Pedro Reyes",
        location: "Nueva Ecija",
        contact: "+639555123456"
      },
      isOrganic: false,
      isFeatured: true,
      tags: ["red", "juicy", "cooking", "salad"],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: '4',
      name: "Fresh Ginger",
      description: "Premium quality ginger root, perfect for cooking and tea.",
      category: 'spices' as const,
      basePrice: 130,
      currentPrice: 120,
      unit: 'kg' as const,
      stock: 20,
      imageUrl: "/images/products/ginger.png",
      farmer: {
        name: "Rosa Garcia",
        location: "Ilocos Norte",
        contact: "+639777888999"
      },
      isOrganic: true,
      isFeatured: false,
      tags: ["spicy", "aromatic", "medicinal", "root"],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: '5',
      name: "Sweet Banana",
      description: "Fresh, sweet bananas perfect for snacking or cooking.",
      category: 'fruits' as const,
      basePrice: 75,
      currentPrice: 60,
      unit: 'kg' as const,
      stock: 50,
      imageUrl: "/images/products/banana.png",
      farmer: {
        name: "Carlos Mendoza",
        location: "Davao",
        contact: "+639333222111"
      },
      isOrganic: false,
      isFeatured: true,
      tags: ["sweet", "potassium", "energy", "tropical"],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: '6',
      name: "Spring Onion",
      description: "Fresh spring onions with green tops, perfect for garnishing.",
      category: 'vegetables' as const,
      basePrice: 45,
      currentPrice: 30,
      unit: 'bunch' as const,
      stock: 30,
      imageUrl: "/images/products/springonion.png",
      farmer: {
        name: "Elena Villanueva",
        location: "Benguet",
        contact: "+639111222333"
      },
      isOrganic: true,
      isFeatured: false,
      tags: ["green", "mild", "garnish", "fresh"],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: '7',
      name: "Fresh Carrots",
      description: "Crisp and sweet carrots, perfect for salads and cooking.",
      category: 'vegetables' as const,
      basePrice: 65,
      currentPrice: 55,
      unit: 'kg' as const,
      stock: 45,
      imageUrl: "/images/products/carrot.png",
      farmer: {
        name: "Roberto Cruz",
        location: "Baguio",
        contact: "+639444555666"
      },
      isOrganic: false,
      isFeatured: true,
      tags: ["orange", "sweet", "crunchy", "beta-carotene"],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: '8',
      name: "Sweet Pineapple",
      description: "Tropical pineapples at peak ripeness, sweet and juicy.",
      category: 'fruits' as const,
      basePrice: 85,
      currentPrice: 70,
      unit: 'kg' as const,
      stock: 25,
      imageUrl: "/images/products/pineapple.png",
      farmer: {
        name: "Ana Fernandez",
        location: "Bukidnon",
        contact: "+639666777888"
      },
      isOrganic: false,
      isFeatured: true,
      tags: ["tropical", "sweet", "juicy", "vitamin-c"],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  // Fetch products with fallback to mock data for now
  const { 
    products = [], 
    loading = false, 
    error = null, 
    totalPages = 1,
    currentPage = 1,
    setCurrentPage = () => {},
    setFilters = () => {}
  } = {
    products: mockProducts,
    loading: false,
    error: null,
    totalPages: 1,
    currentPage: 1,
    setCurrentPage: () => {},
    setFilters: () => {}
  };

  // Filter products based on selected category
  const filteredProducts = selectedCategory === 'all' 
    ? mockProducts 
    : mockProducts.filter(product => product.category === selectedCategory);

  // Handle category filter change
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setFilters({ category: category === 'all' ? undefined : category });
    setCurrentPage(1);
  };

  const heroSlides = [
    {
      id: 1,
      image: "/images/hero/hero1.jpg",
      title: "Fresh & Healthy",
      subtitle: "Farm to table quality",
      buttonText: "Shop Now",
      link: "/home"
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
              <button className="flex items-center space-x-1">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              </button>
              
              <button className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                </svg>
                {isAuthenticated && cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </button>
              
              <button className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
                {isAuthenticated && notificationCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
              </button>
              
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
              <div className="relative">
                <svg className="absolute left-5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder={t('home.searchPlaceholder')}
                  className="w-full pl-14 pr-6 py-3 rounded-2xl text-gray-800 bg-white border-0 focus:outline-none focus:ring-2 focus:ring-green-400/50 placeholder-gray-500 shadow-sm"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-1 hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              </button>
              
              <button className="relative hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                </svg>
                {isAuthenticated && cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </button>
              
              <button className="relative hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
                {isAuthenticated && notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
              </button>
              
              <div className="relative">
                <LanguageSwitcher variant="header" />
              </div>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="md:hidden mt-3">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder={t('home.searchPlaceholder')}
                className="w-full pl-10 pr-4 py-2.5 rounded-full text-gray-800 bg-white border-0 focus:outline-none focus:ring-2 focus:ring-white/30 placeholder-gray-400"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Bar */}
      <nav className="bg-gray-100 py-3 border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          {/* Mobile Navigation */}
          <div className="md:hidden">
            <div className="flex items-center justify-center text-sm">
              <div className="flex items-center space-x-3 text-xs overflow-x-auto">
                <Link href="/" className="font-medium py-2 border-b-2 whitespace-nowrap" style={{ color: '#614124', borderColor: '#614124' }}>Home</Link>
                <Link href="/home" className="py-2 whitespace-nowrap" style={{ color: '#614124' }}>Shop</Link>
                <Link href="/deals" className="py-2 whitespace-nowrap" style={{ color: '#614124' }}>Deals</Link>
                <Link href="/new-arrivals" className="py-2 whitespace-nowrap" style={{ color: '#614124' }}>New Arrivals</Link>
                <Link href="/best-seller" className="py-2 whitespace-nowrap" style={{ color: '#614124' }}>Best Seller</Link>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center justify-center text-sm">
            <div className="flex items-center space-x-16">
              <Link href="/" className="font-medium py-2 border-b-2" style={{ color: '#614124', borderColor: '#614124' }}>Home</Link>
              <Link href="/home" className="py-2 hover:border-b-2 transition-all" style={{ color: '#614124' }}>Shop</Link>
              <Link href="/deals" className="py-2 hover:border-b-2 transition-all" style={{ color: '#614124' }}>Deals</Link>
              <Link href="/new-arrivals" className="py-2 hover:border-b-2 transition-all" style={{ color: '#614124' }}>New Arrivals</Link>
              <Link href="/best-seller" className="py-2 hover:border-b-2 transition-all" style={{ color: '#614124' }}>Best Seller</Link>
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

              {/* Top Products Section */}
              <div className="bg-white rounded-2xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 
                    className="text-lg font-semibold"
                    style={{ color: '#614124', fontFamily: 'Poppins, sans-serif' }}
                  >
                    {t('home.bestOffers')}
                  </h3>
                  <div className="flex gap-1">
                    <button className="w-6 h-6 bg-green-600 text-white rounded flex items-center justify-center">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <button className="w-6 h-6 bg-gray-300 text-gray-600 rounded flex items-center justify-center">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Bitter Gourd */}
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-12 h-12 relative">
                      <Image
                        src="/images/products/bittergourd.png"
                        alt="Bitter Gourd"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>Fresh Vegetables</p>
                      <h4 className="font-medium text-sm" style={{ color: '#614124', fontFamily: 'Poppins, sans-serif' }}>Bitter Gourd</h4>
                      <p className="font-bold text-green-600 text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>₱40.00/kg <span className="text-xs text-gray-400 line-through">₱55/kg</span></p>
                    </div>
                  </div>

                  {/* Lemon */}
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-12 h-12 relative">
                      <Image
                        src="/images/products/lemon.png"
                        alt="Lemon"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>Fruits & Harvest</p>
                      <h4 className="font-medium text-sm" style={{ color: '#614124', fontFamily: 'Poppins, sans-serif' }}>Lemon</h4>
                      <p className="font-bold text-green-600 text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>₱105/kg <span className="text-xs text-gray-400 line-through">₱130/kg</span></p>
                    </div>
                  </div>

                  {/* Tomato */}
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-12 h-12 relative">
                      <Image
                        src="/images/products/tomato.png"
                        alt="Tomato"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>Fresh Vegetables</p>
                      <h4 className="font-medium text-sm" style={{ color: '#614124', fontFamily: 'Poppins, sans-serif' }}>Tomato</h4>
                      <p className="font-bold text-green-600 text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>₱50/kg <span className="text-xs text-gray-400 line-through">₱60/kg</span></p>
                    </div>
                  </div>

                  {/* Carrots */}
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                    <div className="w-12 h-12 relative">
                      <Image
                        src="/images/products/carrot.png"
                        alt="Carrots"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>Fresh Vegetables</p>
                      <h4 className="font-medium text-sm" style={{ color: '#614124', fontFamily: 'Poppins, sans-serif' }}>Carrots</h4>
                      <p className="font-bold text-green-600 text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>₱55/kg <span className="text-xs text-gray-400 line-through">₱65/kg</span></p>
                    </div>
                  </div>
                </div>
              </div>
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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    {/* Loading skeleton cards */}
                    {[...Array(8)].map((_, index) => (
                      <div key={index} className="border-2 border-gray-200 rounded-2xl bg-white shadow-sm overflow-hidden h-80 animate-pulse">
                        <div className="h-48 bg-gray-200"></div>
                        <div className="p-4 space-y-2">
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <div className="text-red-600 mb-4">
                      <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                      {filteredProducts.map((product) => (
                        <ProductCard key={product._id} product={product} />
                      ))}
                    </div>
                    
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex justify-center items-center space-x-4 mt-8">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
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
                                onClick={() => setCurrentPage(page)}
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
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
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
            </div>
          </div>
        </div>
      </section>
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
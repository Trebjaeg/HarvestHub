"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

const ShopPage = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const heroSlides = [
    {
      id: 1,
      image: "/images/hero/hero1.jpg",
      title: "Fresh & Healthy",
      subtitle: "Farm to table quality",
      buttonText: "Shop Now",
      link: "/shop"
    },
    {
      id: 2,
      image: "/images/hero/hero2.png",
      title: "20% Off Vegetables",
      subtitle: "Healthy Vegetables Starting at ₱1,499",
      buttonText: "Shop Vegetables",
      link: "/shop/vegetables"
    },
    {
      id: 3,
      image: "/images/hero/hero3.png",
      title: "40% Off Fresh Produce",
      subtitle: "Everyday Fresh Starting at ₱1,899",
      buttonText: "Shop Fresh",
      link: "/shop/fresh"
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
      name: "Leafy Greens", 
      image: "/images/categories/leafygreens.png", 
      description: "Fresh and crisp harvest daily"
    },
    { 
      id: 2, 
      name: "Root Crops", 
      image: "/images/categories/rootcrops.png", 
      description: "Farm-grown staples for every dish"
    },
    { 
      id: 3, 
      name: "Fruits", 
      image: "/images/categories/fruits.png", 
      description: "Juicy, sweets, and packed with flavor"
    },
    { 
      id: 4, 
      name: "Spices & Aromatics", 
      image: "/images/categories/spicesandaromatics.png", 
      description: "Add aroma and spice to your meals"
    },
    { 
      id: 5, 
      name: "Eggplant & Gourds", 
      image: "/images/categories/eggplantandgourds.png", 
      description: "Filipino kitchen essentials"
    },
    { 
      id: 6, 
      name: "Grains & Rice", 
      image: "/images/categories/grainsandrice.png", 
      description: "Locally milled, farm-fresh quality"
    }
  ];

  const benefits = [
    { 
      icon: "/images/benefits/farmer.png", 
      title: "Direct Farmer Connection", 
      description: "Connects you directly to local farmers for fresh produce daily"
    },
    { 
      icon: "/images/benefits/box.png", 
      title: "Live Harvest Updates", 
      description: "Real-time updates on fresh harvest from partnered farms"
    },
    { 
      icon: "/images/benefits/truck.png", 
      title: "Easy Delivery Coordination", 
      description: "Hassle-free delivery coordination between farmers and customers"
    },
    { 
      icon: "/images/benefits/sprout.png", 
      title: "Uplifting Local Agriculture", 
      description: "Every order helps support local farmers and promotes sustainable growth"
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
                <span className="absolute -top-2 -right-2 text-white text-xs font-bold">2</span>
              </button>
              
              <button className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
                <span className="absolute -top-2 -right-2 text-white text-xs font-bold">99+</span>
              </button>
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
                  placeholder="Search fresh produce..."
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
                <span className="absolute -top-1 -right-1 text-white text-xs font-bold">2</span>
              </button>
              
              <button className="relative hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
                <span className="absolute -top-1 -right-1 text-white text-xs font-bold">99+</span>
              </button>
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
                placeholder="Search fresh produce..."
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
                <Link href="/shop" className="py-2 whitespace-nowrap" style={{ color: '#614124' }}>Shop</Link>
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
              <Link href="/shop" className="py-2 hover:border-b-2 transition-all" style={{ color: '#614124' }}>Shop</Link>
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
          <h2 className="text-3xl font-normal text-center mb-12" style={{ color: '#614124', fontWeight: '500' }}>Explore Categories</h2>
          <div className="grid grid-cols-6 gap-12 mx-auto">
            {categories.map((category) => (
              <Link 
                key={category.id} 
                href={`/shop/category/${category.id}`} 
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
                    Top Products
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
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium whitespace-nowrap"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  All Products
                </button>
                <button 
                  className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg text-sm font-medium whitespace-nowrap"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  Fresh Vegetables
                </button>
                <button 
                  className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg text-sm font-medium whitespace-nowrap"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  Fruits
                </button>
                <button 
                  className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg text-sm font-medium whitespace-nowrap"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  Roots & Spice
                </button>
                <button 
                  className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg text-sm font-medium whitespace-nowrap"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  Grains & Rice
                </button>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-4 gap-6">
                {/* Bitter Gourd */}
                <div className="border-2 border-green-700 rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col h-80">
                  {/* Image Area */}
                  <div className="h-48 flex items-center justify-center p-0 bg-white">
                    <Image
                      src="/images/products/bittergourd.png"
                      alt="Bitter Gourd"
                      width={300}
                      height={300}
                      className="object-contain max-w-full max-h-full"
                    />
                  </div>
                  
                  {/* Bottom Section */}
                  <div className="flex-1 bg-orange-50 p-4 flex flex-col">
                    <p className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>Fresh Vegetables</p>
                    <h4 className="text-lg font-semibold text-amber-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>Bitter Gourd</h4>
                    
                    <div className="flex justify-between items-end mt-auto">
                      <div className="flex items-baseline">
                        <span className="text-lg font-bold text-green-600" style={{ fontFamily: 'Poppins, sans-serif' }}>₱40/kg</span>
                        <span className="text-sm text-gray-400 line-through ml-1" style={{ fontFamily: 'Poppins, sans-serif' }}>₱55/kg</span>
                      </div>
                      <button className="w-8 h-8 bg-green-600 text-white border-none rounded-lg flex items-center justify-center cursor-pointer text-lg font-bold hover:bg-green-700">
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Lemon */}
                <div className="border-2 border-green-700 rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col h-80">
                  {/* Image Area */}
                  <div className="h-[60rem] w-full bg-white overflow-hidden">
                    <Image
                      src="/images/products/lemon.png"
                      alt="Lemon"
                      width={1000}
                      height={1000}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  
                  {/* Bottom Section */}
                  <div className="flex-1 bg-orange-50 p-4 flex flex-col">
                    <p className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>Fruits & Harvest</p>
                    <h4 className="text-lg font-semibold text-amber-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>Lemon</h4>
                    
                    <div className="flex justify-between items-end mt-auto">
                      <div className="flex items-baseline">
                        <span className="text-lg font-bold text-green-600" style={{ fontFamily: 'Poppins, sans-serif' }}>₱105/kg</span>
                        <span className="text-sm text-gray-400 line-through ml-1" style={{ fontFamily: 'Poppins, sans-serif' }}>₱120/kg</span>
                      </div>
                      <button className="w-8 h-8 bg-green-600 text-white border-none rounded-lg flex items-center justify-center cursor-pointer text-lg font-bold hover:bg-green-700">
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tomato */}
                <div className="border-2 border-green-700 rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col h-80">
                  {/* Image Area */}
                  <div className="h-48 flex items-center justify-center p-4 bg-white">
                    <Image
                      src="/images/products/tomato.png"
                      alt="Tomato"
                      width={150}
                      height={150}
                      className="object-contain max-w-full max-h-full"
                    />
                  </div>
                  
                  {/* Bottom Section */}
                  <div className="flex-1 bg-orange-50 p-4 flex flex-col">
                    <p className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>Fresh Vegetables</p>
                    <h4 className="text-lg font-semibold text-amber-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>Tomato</h4>
                    
                    <div className="flex justify-between items-end mt-auto">
                      <div className="flex items-baseline">
                        <span className="text-lg font-bold text-green-600" style={{ fontFamily: 'Poppins, sans-serif' }}>₱50/kg</span>
                        <span className="text-sm text-gray-400 line-through ml-1" style={{ fontFamily: 'Poppins, sans-serif' }}>₱66/kg</span>
                      </div>
                      <button className="w-8 h-8 bg-green-600 text-white border-none rounded-lg flex items-center justify-center cursor-pointer text-lg font-bold hover:bg-green-700">
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Ginger */}
                <div className="border-2 border-green-700 rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col h-80">
                  {/* Image Area */}
                  <div className="h-48 flex items-center justify-center p-4 bg-white">
                    <Image
                      src="/images/products/ginger.png"
                      alt="Ginger"
                      width={150}
                      height={150}
                      className="object-contain max-w-full max-h-full"
                    />
                  </div>
                  
                  {/* Bottom Section */}
                  <div className="flex-1 bg-orange-50 p-4 flex flex-col">
                    <p className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>Roots & Spice</p>
                    <h4 className="text-lg font-semibold text-amber-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>Ginger</h4>
                    
                    <div className="flex justify-between items-end mt-auto">
                      <div className="flex items-baseline">
                        <span className="text-lg font-bold text-green-600" style={{ fontFamily: 'Poppins, sans-serif' }}>₱120/kg</span>
                        <span className="text-sm text-gray-400 line-through ml-1" style={{ fontFamily: 'Poppins, sans-serif' }}>₱130/kg</span>
                      </div>
                      <button className="w-8 h-8 bg-green-600 text-white border-none rounded-lg flex items-center justify-center cursor-pointer text-lg font-bold hover:bg-green-700">
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Second Row */}
                {/* Banana */}
                <div className="border-2 border-green-700 rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col h-80">
                  {/* Image Area */}
                  <div className="h-48 flex items-center justify-center p-4 bg-white">
                    <Image
                      src="/images/products/banana.png"
                      alt="Banana"
                      width={150}
                      height={150}
                      className="object-contain max-w-full max-h-full"
                    />
                  </div>
                  
                  {/* Bottom Section */}
                  <div className="flex-1 bg-orange-50 p-4 flex flex-col">
                    <p className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>Fruits & Harvest</p>
                    <h4 className="text-lg font-semibold text-amber-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>Banana</h4>
                    
                    <div className="flex justify-between items-end mt-auto">
                      <div className="flex items-baseline">
                        <span className="text-lg font-bold text-green-600" style={{ fontFamily: 'Poppins, sans-serif' }}>₱60/kg</span>
                        <span className="text-sm text-gray-400 line-through ml-1" style={{ fontFamily: 'Poppins, sans-serif' }}>₱75/kg</span>
                      </div>
                      <button className="w-8 h-8 bg-green-600 text-white border-none rounded-lg flex items-center justify-center cursor-pointer text-lg font-bold hover:bg-green-700">
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Spring Onion */}
                <div className="border-2 border-green-700 rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col h-80">
                  {/* Image Area */}
                  <div className="h-48 flex items-center justify-center p-4 bg-white">
                    <Image
                      src="/images/products/springonion.png"
                      alt="Spring Onion"
                      width={150}
                      height={150}
                      className="object-contain max-w-full max-h-full"
                    />
                  </div>
                  
                  {/* Bottom Section */}
                  <div className="flex-1 bg-orange-50 p-4 flex flex-col">
                    <p className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>Herbs & Spices</p>
                    <h4 className="text-lg font-semibold text-amber-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>Spring Onion</h4>
                    
                    <div className="flex justify-between items-end mt-auto">
                      <div className="flex items-baseline">
                        <span className="text-lg font-bold text-green-600" style={{ fontFamily: 'Poppins, sans-serif' }}>₱30/bunch</span>
                        <span className="text-sm text-gray-400 line-through ml-1" style={{ fontFamily: 'Poppins, sans-serif' }}>₱45/bunch</span>
                      </div>
                      <button className="w-8 h-8 bg-green-600 text-white border-none rounded-lg flex items-center justify-center cursor-pointer text-lg font-bold hover:bg-green-700">
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Carrot */}
                <div className="border-2 border-green-700 rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col h-80">
                  {/* Image Area */}
                  <div className="h-48 flex items-center justify-center p-4 bg-white">
                    <Image
                      src="/images/products/carrot.png"
                      alt="Carrot"
                      width={150}
                      height={150}
                      className="object-contain max-w-full max-h-full"
                    />
                  </div>
                  
                  {/* Bottom Section */}
                  <div className="flex-1 bg-orange-50 p-4 flex flex-col">
                    <p className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>Fresh Vegetables</p>
                    <h4 className="text-lg font-semibold text-amber-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>Carrot</h4>
                    
                    <div className="flex justify-between items-end mt-auto">
                      <div className="flex items-baseline">
                        <span className="text-lg font-bold text-green-600" style={{ fontFamily: 'Poppins, sans-serif' }}>₱55/kg</span>
                        <span className="text-sm text-gray-400 line-through ml-1" style={{ fontFamily: 'Poppins, sans-serif' }}>₱65/kg</span>
                      </div>
                      <button className="w-8 h-8 bg-green-600 text-white border-none rounded-lg flex items-center justify-center cursor-pointer text-lg font-bold hover:bg-green-700">
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Pineapple */}
                <div className="border-2 border-green-700 rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col h-80">
                  {/* Image Area */}
                  <div className="h-48 flex items-center justify-center p-4 bg-white">
                    <Image
                      src="/images/products/pineapple.png"
                      alt="Pineapple"
                      width={150}
                      height={150}
                      className="object-contain max-w-full max-h-full"
                    />
                  </div>
                  
                  {/* Bottom Section */}
                  <div className="flex-1 bg-orange-50 p-4 flex flex-col">
                    <p className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>Fruits & Harvest</p>
                    <h4 className="text-lg font-semibold text-amber-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>Pineapple</h4>
                    
                    <div className="flex justify-between items-end mt-auto">
                      <div className="flex items-baseline">
                        <span className="text-lg font-bold text-green-600" style={{ fontFamily: 'Poppins, sans-serif' }}>₱70/kg</span>
                        <span className="text-sm text-gray-400 line-through ml-1" style={{ fontFamily: 'Poppins, sans-serif' }}>₱85/kg</span>
                      </div>
                      <button className="w-8 h-8 bg-green-600 text-white border-none rounded-lg flex items-center justify-center cursor-pointer text-lg font-bold hover:bg-green-700">
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ShopPage;
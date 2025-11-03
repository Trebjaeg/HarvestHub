"use client";

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { teamData, companyStory } from './teamData';
import BridgeIllustration from './assets/BridgeIllustration';
import SproutLogo from './assets/SproutLogo';
import './aboutus.css';

const AboutUsPage = () => {
  const bridgeRef = useRef<HTMLDivElement>(null);
  const sproutRef = useRef<HTMLDivElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);
  const valuesRef = useRef<HTMLDivElement>(null);
  const teamCardsRef = useRef<HTMLDivElement[]>([]);

  // Client-side GSAP loading to avoid SSR issues
  useEffect(() => {
    const loadGSAP = async () => {
      try {
        const { gsap } = await import('gsap');
        const { ScrollTrigger } = await import('gsap/ScrollTrigger');
        
        if (typeof window !== 'undefined') {
          gsap.registerPlugin(ScrollTrigger);
          
          // Initialize animations once GSAP is loaded
          initializeAnimations(gsap);
        }
      } catch (error) {
        console.error('Error loading GSAP:', error);
      }
    };

    loadGSAP();
  }, []);

  const initializeAnimations = (gsap: typeof import('gsap').gsap) => {
    // Bridge entrance animation
    if (bridgeRef.current) {
      gsap.fromTo(bridgeRef.current, 
        { 
          opacity: 0, 
          y: 50,
          scale: 0.9
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1.5,
          ease: "power3.out",
          scrollTrigger: {
            trigger: bridgeRef.current,
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play none none reverse"
          }
        }
      );

      // Bridge glow on scroll
      gsap.to(bridgeRef.current, {
        filter: "drop-shadow(0 0 20px rgba(16, 185, 129, 0.5))",
        scrollTrigger: {
          trigger: bridgeRef.current,
          start: "top 60%",
          end: "bottom 40%",
          scrub: 1
        }
      });
    }

    // Sprout pulsing animation
    if (sproutRef.current) {
      gsap.fromTo(sproutRef.current,
        {
          opacity: 0,
          scale: 0.5,
          y: -30
        },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 1.2,
          ease: "back.out(1.7)",
          delay: 0.3,
          scrollTrigger: {
            trigger: sproutRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse"
          }
        }
      );

      // Continuous pulsing glow
      gsap.to(sproutRef.current, {
        scale: 1.05,
        filter: "drop-shadow(0 0 15px rgba(34, 197, 94, 0.6))",
        duration: 2,
        yoyo: true,
        repeat: -1,
        ease: "power2.inOut"
      });
    }

    // Story section animation
    if (storyRef.current) {
      gsap.fromTo(storyRef.current,
        {
          opacity: 0,
          y: 40
        },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: storyRef.current,
            start: "top 75%",
            toggleActions: "play none none reverse"
          }
        }
      );
    }

    // Values section animation
    if (valuesRef.current) {
      const valueCards = valuesRef.current.querySelectorAll('.value-card');
      gsap.fromTo(valueCards,
        {
          opacity: 0,
          y: 30,
          scale: 0.95
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: "power2.out",
          stagger: 0.2,
          scrollTrigger: {
            trigger: valuesRef.current,
            start: "top 70%",
            toggleActions: "play none none reverse"
          }
        }
      );
    }

    // Team cards animation
    teamCardsRef.current.forEach((card, index) => {
      if (card) {
        gsap.fromTo(card,
          {
            opacity: 0,
            y: 50,
            scale: 0.9
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            ease: "power2.out",
            delay: index * 0.1,
            scrollTrigger: {
              trigger: card,
              start: "top 80%",
              toggleActions: "play none none reverse"
            }
          }
        );

        // Hover animation
        card.addEventListener('mouseenter', () => {
          gsap.to(card, {
            scale: 1.02,
            y: -5,
            duration: 0.3,
            ease: "power2.out"
          });
        });

        card.addEventListener('mouseleave', () => {
          gsap.to(card, {
            scale: 1,
            y: 0,
            duration: 0.3,
            ease: "power2.out"
          });
        });
      }
    });
  };

  const addToRefs = (el: HTMLDivElement) => {
    if (el && !teamCardsRef.current.includes(el)) {
      teamCardsRef.current.push(el);
    }
  };

  return (
    <div 
      className="min-h-screen text-white overflow-x-hidden"
      style={{
        background: 'radial-gradient(ellipse at center, rgba(6, 20, 12, 1) 0%, rgba(0, 0, 0, 1) 70%)'
      }}
    >
      {/* Hero Section with Bridge and Sprout */}
      <section className="relative pt-20 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Sprout Logo - Centered above bridge */}
          <div 
            ref={sproutRef}
            className="flex justify-center mb-8"
          >
            <div className="w-24 h-24 md:w-32 md:h-32">
              <SproutLogo className="w-full h-full" />
            </div>
          </div>

          {/* Bridge Illustration */}
          <div 
            ref={bridgeRef}
            className="w-full max-w-4xl mx-auto mb-12"
          >
            <BridgeIllustration className="w-full h-auto" />
          </div>

          {/* Mission Statement */}
          <div className="text-center mb-16">
            <h1 
              className="text-4xl md:text-6xl font-bold mb-6"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              <span className="text-green-400">{companyStory.mission}</span>
            </h1>
            <p 
              className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              {companyStory.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div 
            ref={storyRef}
            className="glassmorphism-card p-8 md:p-12"
          >
            <h2 
              className="text-3xl md:text-4xl font-bold mb-8 text-green-400"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              Our Story
            </h2>
            <div className="space-y-6 text-gray-300 leading-relaxed">
              {companyStory.story.split('\n\n').map((paragraph, index) => (
                <p key={index} className="text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Timeline */}
            <div className="mt-12">
              <h3 className="text-2xl font-semibold mb-6 text-green-400" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Our Journey
              </h3>
              <div className="flex flex-col md:flex-row gap-8">
                {companyStory.timeline.map((phase, index) => (
                  <div key={index} className="flex-1">
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-black font-bold text-sm mr-3">
                        {index + 1}
                      </div>
                      <h4 className="text-lg font-semibold text-green-400" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {phase.phase}
                      </h4>
                    </div>
                    <p className="text-gray-300 text-sm pl-11" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {phase.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Meet The Team Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 
            className="text-3xl md:text-4xl font-bold text-center mb-16 text-white"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            Meet The Team
          </h2>

          {/* Featured Team Member (Project Manager) */}
          <div className="mb-16 flex justify-center">
            <div
              ref={addToRefs}
              className="featured-team-card max-w-md w-full"
              style={{
                background: 'linear-gradient(135deg, rgba(108, 1, 56, 0.9) 0%, rgba(255, 89, 154, 0.8) 40%, rgba(255, 0, 133, 0.7) 100%)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                borderRadius: '20px',
                padding: '2rem',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.37)'
              }}
            >
              {/* Featured Member Photo */}
              <div className="relative w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden bg-gray-700">
                <Image 
                  src="/images/about-us/Aprodhite-Mirafuentes.svg"
                  alt="Aphrodite Mirafuentes"
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.querySelector('.fallback-avatar')!.classList.remove('hidden');
                  }}
                />
                <div className="fallback-avatar hidden absolute inset-0 w-full h-full">
                  <div className="w-full h-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                      <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                      <path d="M12 10m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
                      <path d="M6.168 18.849a4 4 0 0 1 3.832 -2.849h4a4 4 0 0 1 3.834 2.855" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Featured Member Info */}
              <div className="text-center">
                <h3 
                  className="text-2xl font-bold mb-2 text-white"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  {teamData[0].name}
                </h3>
                <p 
                  className="text-lg font-medium text-pink-100 mb-4"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  {teamData[0].role}
                </p>
                <div 
                  className="p-4 rounded-lg mb-6"
                  style={{
                    background: 'linear-gradient(135deg, rgba(76, 0, 47, 0.9) 0%, rgba(255, 95, 158, 0.8) 41%, rgba(230, 0, 120, 0.7) 100%)',
                    backdropFilter: 'blur(10px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(10px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    borderRadius: '12px'
                  }}
                >
                  <p 
                    className="text-sm text-white leading-relaxed"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    {teamData[0].description}
                  </p>
                </div>

                {/* Social Links */}
                <div className="flex justify-center space-x-4">
                  <Link 
                    href="#"
                    target="_blank"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    {/* TikTok Icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43V7.56a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.02z"/>
                    </svg>
                  </Link>
                  <Link 
                    href="#"
                    target="_blank"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    {/* Instagram Icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Rest of Team Members Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamData.slice(1).map((member) => (
              <div
                key={member.id}
                ref={addToRefs}
                className="team-card glassmorphism-card p-6 text-center group cursor-pointer"
              >
                {/* Profile Photo */}
                <div className="relative w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden bg-gray-700">
                  <Image 
                    src={`/images/about-us/${member.photo.split('/').pop()}`}
                    alt={member.name}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.parentElement!.querySelector('.fallback-avatar')!.classList.remove('hidden');
                    }}
                  />
                  <div className="fallback-avatar hidden absolute inset-0 w-full h-full">
                    <div className="w-full h-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                        <path d="M12 10m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
                        <path d="M6.168 18.849a4 4 0 0 1 3.832 -2.849h4a4 4 0 0 1 3.834 2.855" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Member Info */}
                <h3 
                  className="text-xl font-semibold mb-2 text-green-400 group-hover:text-green-300 transition-colors"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  {member.name}
                </h3>
                <p 
                  className="text-sm font-medium text-gray-400 mb-3"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  {member.role}
                </p>
                <div 
                  className="p-4 rounded-lg mb-4"
                  style={{
                    background: 'linear-gradient(135deg, rgba(104, 114, 107, 0.25) 0%, rgba(22, 94, 74, 0.95) 58%, rgba(18, 36, 25, 0.9) 100%)',
                    backdropFilter: 'blur(10px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(10px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    borderRadius: '12px'
                  }}
                >
                  <p 
                    className="text-sm text-white leading-relaxed"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    {member.description}
                  </p>
                </div>

                {/* Social Links */}
                <div className="flex justify-center space-x-3">
                  {member.linkedin && (
                    <Link 
                      href={member.linkedin}
                      target="_blank"
                      className="text-gray-400 hover:text-green-400 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </Link>
                  )}
                  {member.email && (
                    <Link 
                      href={`mailto:${member.email}`}
                      className="text-gray-400 hover:text-green-400 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                      </svg>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Mission & Vision Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center mb-12">
            <div className="w-8 h-8 mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
                <path d="M12 2v6l3-3-3-3z"/>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <path d="M21 10H3"/>
                <path d="M12 16v6"/>
              </svg>
            </div>
            <h2 
              className="text-3xl md:text-4xl font-bold text-white"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              Our Mission & Vision
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {/* Mission */}
            <div className="glassmorphism-card p-8">
              <h3 
                className="text-2xl font-bold mb-6 text-center text-white"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                Mission
              </h3>
              <p 
                className="text-gray-300 leading-relaxed text-center"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                To empower local farmers by providing a digital platform that connects them directly with consumers. HarvestHub aims to promote fair trade, transparency, and sustainability—ensuring that every harvest supports both farmers and communities.
              </p>
            </div>

            {/* Vision */}
            <div className="glassmorphism-card p-8">
              <h3 
                className="text-2xl font-bold mb-6 text-center text-white"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                Vision
              </h3>
              <p 
                className="text-gray-300 leading-relaxed text-center"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                To build a future where technology bridges the gap between agriculture and people—creating a thriving, self-sustaining ecosystem where every farmer has equal opportunity, every buyer has access to fresh local produce, and every transaction strengthens trust and growth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Get in Touch Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 
            className="text-3xl md:text-4xl font-bold mb-4 text-white"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            Get in Touch
          </h2>
          <p 
            className="text-gray-300 mb-8"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            Have questions or want to collaborate?
          </p>
          
          <div className="mb-8">
            <Link 
              href="mailto:admin@harvesthub.ph"
              className="inline-flex items-center justify-center px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all duration-200 hover:scale-105"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              Email Us - admin@harvesthubph.app
            </Link>
          </div>

          <div className="flex justify-center space-x-4 mb-12">
            <p className="text-gray-400 mr-4" style={{ fontFamily: 'Poppins, sans-serif' }}>Follow Us</p>
            <Link href="#" className="text-gray-400 hover:text-green-400 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
              </svg>
            </Link>
            <Link href="#" className="text-gray-400 hover:text-green-400 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </Link>
            <Link href="#" className="text-gray-400 hover:text-green-400 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
              </svg>
            </Link>
            <Link href="#" className="text-gray-400 hover:text-green-400 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43V7.56a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.02z"/>
              </svg>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default AboutUsPage;
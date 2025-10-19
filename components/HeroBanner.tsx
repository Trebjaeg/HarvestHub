'use client';

import Image from 'next/image';
import Link from 'next/link';
import { IBanner } from '../types/banner';

interface HeroBannerProps {
  banner: IBanner;
  className?: string;
  priority?: boolean;
}

const HeroBanner: React.FC<HeroBannerProps> = ({ banner, className = '', priority = false }) => {
  return (
    <div 
      className={`relative rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300 ${className}`}
      style={{ 
        backgroundColor: banner.backgroundColor || '#D4A574',
        minHeight: '400px',
      }}
    >
      {/* Banner Image */}
      <div className="relative h-full">
        <Image
          src={banner.imageUrl}
          alt={banner.title}
          fill
          className="object-cover"
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        
        {/* Overlay Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
          {/* Title - "Hot This Week" */}
          {banner.title && (
            <p 
              className="text-lg md:text-xl font-semibold mb-2"
              style={{ 
                color: banner.textColor || '#103C2E',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              {banner.title}
            </p>
          )}

          {/* Subtitle - "Special Menu" */}
          {banner.subtitle && (
            <h2 
              className="text-4xl md:text-5xl font-bold mb-3"
              style={{ 
                color: '#FFFFFF',
                fontFamily: 'Pacifico, cursive',
                textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
              }}
            >
              {banner.subtitle}
            </h2>
          )}

          {/* Description - "On all weekend sale" */}
          {banner.description && (
            <p 
              className="text-base md:text-lg mb-6"
              style={{ 
                color: '#FFFFFF',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              {banner.description}
            </p>
          )}

          {/* CTA Button */}
          <Link 
            href={banner.buttonLink}
            className="px-8 py-3 rounded-full font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-lg"
            style={{ 
              backgroundColor: '#F5A742',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            {banner.buttonText}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;

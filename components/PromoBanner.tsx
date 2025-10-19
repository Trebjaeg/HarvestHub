'use client';

import Image from 'next/image';

interface PromoBannerProps {
  title?: string;
  subtitle?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  imageUrl?: string;
  backgroundColor?: string;
  textColor?: string;
  className?: string;
  showButton?: boolean;
}

const PromoBanner: React.FC<PromoBannerProps> = ({
  title = 'We supply high quality organic products',
  subtitle = 'A shop for good people',
  description = 'by good people',
  buttonText = 'Shop now',
  buttonLink = '/products',
  imageUrl = '/images/products/vegetables.png',
  backgroundColor = '#DCFCE7',
  textColor = '#1E3A2F',
  className = '',
  showButton = true
}) => {
  return (
    <div 
      className={`relative rounded-[2.5rem] overflow-hidden ${className}`}
      style={{ 
        width: '1016px', 
        height: '425px',
        background: '#FFFFFF'
      }}
    >
      {/* Left Content Section - 331 x 176 */}
      <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-center px-12 z-10" style={{ width: '331px' }}>
        {/* Small Green Text */}
        <p 
          className="text-sm font-medium mb-2"
          style={{ 
            color: '#2E7D32',
            fontFamily: 'Poppins, sans-serif',
            fontSize: '13px',
            lineHeight: '18px'
          }}
        >
          {title}
        </p>

        {/* Main Title */}
        <h2 
          className="text-3xl font-bold mb-1"
          style={{ 
            color: textColor,
            fontFamily: 'Poppins, sans-serif',
            fontSize: '28px',
            lineHeight: '36px'
          }}
        >
          {subtitle}
        </h2>

        {/* Subtitle */}
        <h3 
          className="text-3xl font-bold mb-4"
          style={{ 
            color: textColor,
            fontFamily: 'Poppins, sans-serif',
            fontSize: '28px',
            lineHeight: '36px'
          }}
        >
          {description}
        </h3>

        {/* Shop Now Button - Only show if enabled */}
        {showButton && buttonLink && (
          <a
            href={buttonLink}
            className="inline-flex items-center gap-2 bg-[#40613D] text-white px-5 py-2.5 rounded-full font-medium transition-all hover:bg-[#2D5240] hover:scale-105"
            style={{ 
              fontFamily: 'Poppins, sans-serif',
              fontSize: '15px',
              width: 'fit-content',
              boxShadow: '0 4px 12px rgba(64, 97, 61, 0.2)'
            }}
          >
            {buttonText}
            <svg 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
        )}
      </div>

      {/* Right Image Section with Blob Background - 608.12 x 387.15 */}
      <div className="absolute right-0 top-0 bottom-0 flex items-center justify-center" style={{ width: '608px' }}>
        {/* Organic Blob Shape Background */}
        <div 
          className="absolute"
          style={{
            width: '550px',
            height: '380px',
            background: 'rgba(134, 239, 172, 0.3)',
            borderRadius: '50% 50% 30% 70% / 60% 40% 60% 40%',
            transform: 'rotate(-15deg)'
          }}
        />
        
        {/* Product Image - 608.12 x 387.15 */}
        <div className="relative z-10" style={{ width: '608px', height: '387px' }}>
          <Image
            src={imageUrl}
            alt="Promo banner"
            fill
            className="object-contain"
            sizes="608px"
          />
        </div>
      </div>
    </div>
  );
};

export default PromoBanner;

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
          className="text-3xl font-bold"
          style={{ 
            color: textColor,
            fontFamily: 'Poppins, sans-serif',
            fontSize: '28px',
            lineHeight: '36px'
          }}
        >
          {description}
        </h3>
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
        
        {/* HeartRepolyo SVG - 505 x 356 positioned to blend with design */}
        <div 
          className="absolute z-[5]"
          style={{ 
            width: '505px', 
            height: '356px',
            right: '50px',
            top: '50%',
            transform: 'translateY(-50%)'
          }}
        >
          <Image
            src="/images/heartrepolyo.svg"
            alt="Fresh vegetables decoration"
            fill
            className="object-contain"
            style={{ 
              filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.08))'
            }}
            priority
          />
        </div>
      </div>
    </div>
  );
};

export default PromoBanner;

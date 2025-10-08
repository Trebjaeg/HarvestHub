'use client';

import Image from 'next/image';
import Link from 'next/link';
import { IProduct } from '../types/product';

interface ProductCardProps {
  product: IProduct;
  className?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, className = '' }) => {
  const hasDiscount = product.basePrice && product.basePrice > product.currentPrice;
  const discountPercentage = hasDiscount 
    ? Math.round(((product.basePrice - product.currentPrice) / product.basePrice) * 100)
    : 0;

  return (
    <div className={`bg-white rounded-2xl border-2 border-green-200 hover:border-green-400 transition-all duration-300 hover:shadow-lg hover:scale-105 ${className}`}>
      <div className="relative">
        {/* Product Image */}
        <div className="relative h-48 rounded-t-xl overflow-hidden">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {hasDiscount && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                -{discountPercentage}%
              </span>
            )}
            {product.isOrganic && (
              <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                Organic
              </span>
            )}
            {product.isFeatured && (
              <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                Featured
              </span>
            )}
          </div>

          {/* Stock indicator */}
          {product.stock < 10 && product.stock > 0 && (
            <div className="absolute top-3 right-3">
              <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                Low Stock
              </span>
            </div>
          )}
          
          {product.stock === 0 && (
            <div className="absolute top-3 right-3">
              <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4 space-y-3">
          {/* Category */}
          <p className="text-sm text-green-600 font-medium">
            {product.category}
          </p>

          {/* Product Name */}
          <h3 className="text-lg font-bold text-gray-900 line-clamp-2">
            {product.name}
          </h3>

          {/* Farmer Info */}
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            <span>by {product.farmer.name}</span>
          </div>

          {/* Location */}
          <div className="flex items-center text-sm text-gray-500">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span>{product.farmer.location}</span>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold text-green-600">
                ₱{product.currentPrice}/{product.unit}
              </span>
              {hasDiscount && (
                <span className="text-sm text-gray-500 line-through">
                  ₱{product.basePrice}
                </span>
              )}
            </div>
          </div>

          {/* Remove Harvest Date section as it's not in our interface */}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {product.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Add to Cart Button */}
          <button 
            className={`w-full py-2 px-4 rounded-lg font-semibold transition-all duration-200 ${
              product.stock > 0
                ? 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            disabled={product.stock === 0}
          >
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
              </svg>
              <span>
                {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
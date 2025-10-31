"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Heart } from 'lucide-react';

interface FavoriteButtonProps {
  productId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  onToggle?: (isFavorite: boolean) => void;
}

export default function FavoriteButton({ 
  productId, 
  className = '', 
  size = 'md',
  showText = false,
  onToggle 
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const buttonSizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3'
  };

  const checkFavoriteStatus = useCallback(async () => {
    try {
      setChecking(true);
      // Use the specific check endpoint for better performance
      const response = await fetch(`/api/favorites/check/${productId}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setIsFavorite(data.data.isFavorite);
        }
      }
    } catch (error) {
      console.error('Error checking favorite status:', error);
    } finally {
      setChecking(false);
    }
  }, [productId]);

  useEffect(() => {
    checkFavoriteStatus();
  }, [checkFavoriteStatus]);

  const toggleFavorite = async () => {
    if (loading) return;

    try {
      setLoading(true);
      setIsAnimating(true);

      if (isFavorite) {
        // Remove from favorites
        const response = await fetch(`/api/favorites/${productId}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setIsFavorite(false);
            onToggle?.(false);
          } else {
            console.error('Failed to remove from favorites:', data.error);
            // Silently handle error - better UX than showing alerts
          }
        } else {
          console.error('Failed to remove from favorites');
        }
      } else {
        // Add to favorites
        const response = await fetch('/api/favorites', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ productId })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setIsFavorite(true);
            onToggle?.(true);
          } else {
            console.error('Failed to add to favorites:', data.error);
            if (data.error === 'Product already in favorites') {
              setIsFavorite(true); // Update UI state
            }
          }
        } else {
          console.error('Failed to add to favorites');
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setLoading(false);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  if (checking) {
    return (
      <button
        disabled
        className={`inline-flex items-center gap-2 rounded-lg transition-colors bg-gray-100 text-gray-400 ${buttonSizeClasses[size]} ${className}`}
      >
        <div className={`animate-pulse bg-gray-300 rounded ${sizeClasses[size]}`}></div>
        {showText && (
          <span className="text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Loading...
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className={`
        inline-flex items-center gap-2 rounded-lg transition-all duration-300 transform
        ${isFavorite 
          ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' 
          : 'bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-600 border border-gray-200'
        }
        ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95 cursor-pointer'}
        ${buttonSizeClasses[size]} ${className}
      `}
      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      style={{ fontFamily: 'Poppins, sans-serif' }}
    >
      {loading ? (
        <div className={`animate-spin rounded-full border-2 border-current border-t-transparent ${sizeClasses[size]}`}></div>
      ) : (
        <Heart 
          className={`
            ${sizeClasses[size]} 
            transition-all duration-300 
            ${isAnimating ? 'animate-bounce' : ''}
            ${isFavorite 
              ? 'fill-red-500 text-red-500 drop-shadow-lg' 
              : 'text-gray-600 hover:text-red-500'
            }
          `} 
        />
      )}
      {showText && (
        <span className={`text-sm font-medium transition-colors ${
          isFavorite ? 'text-red-600' : 'text-gray-600 hover:text-red-600'
        }`}>
          {loading 
            ? 'Loading...' 
            : isFavorite 
              ? 'Favorited' 
              : 'Add to Favorites'
          }
        </span>
      )}
    </button>
  );
}
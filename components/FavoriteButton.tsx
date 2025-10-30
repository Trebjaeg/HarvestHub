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
        className={`inline-flex items-center gap-2 text-gray-400 cursor-not-allowed ${className}`}
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
        inline-flex items-center gap-2 transition-all duration-300
        ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-110 active:scale-95'}
        ${className}
      `}
      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      style={{ fontFamily: 'Poppins, sans-serif' }}
    >
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
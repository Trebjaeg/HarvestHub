import { useState, useEffect, useCallback } from 'react';

interface PromoBanner {
  _id: string;
  title: string;
  subtitle: string;
  description?: string;
  buttonText: string;
  buttonLink: string;
  backgroundColor?: string;
  textColor?: string;
  discountPercentage: number;
  endDate: string;
  showCountdown: boolean;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

interface UsePromoBannerReturn {
  banner: PromoBanner | null;
  timeRemaining: TimeRemaining | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const usePromoBanner = (): UsePromoBannerReturn => {
  const [banner, setBanner] = useState<PromoBanner | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBanner = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/deals/banner');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setBanner(data.banner);
      setTimeRemaining(data.timeRemaining);
      
    } catch (err) {
      console.error('Error fetching promotional banner:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch promotional banner');
      setBanner(null);
      setTimeRemaining(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update countdown timer every second
  useEffect(() => {
    if (!banner || !timeRemaining || timeRemaining.expired) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (!prev || prev.expired) return prev;

        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        } else {
          return { ...prev, expired: true };
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [banner, timeRemaining]);

  // Fetch banner data on mount
  useEffect(() => {
    fetchBanner();
  }, [fetchBanner]);

  // Refetch when timer expires
  useEffect(() => {
    if (timeRemaining?.expired) {
      fetchBanner();
    }
  }, [timeRemaining?.expired, fetchBanner]);

  return {
    banner,
    timeRemaining,
    loading,
    error,
    refetch: fetchBanner,
  };
};
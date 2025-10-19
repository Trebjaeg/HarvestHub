import { useState, useEffect } from 'react';
import { IBanner } from '../types/banner';

interface UseBannersReturn {
  banners: IBanner[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useBanners = (): UseBannersReturn => {
  const [banners, setBanners] = useState<IBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/banners');
      
      if (!response.ok) {
        throw new Error('Failed to fetch banners');
      }

      const data = await response.json();
      
      if (data.success) {
        setBanners(data.data || []);
      } else {
        throw new Error(data.message || 'Failed to load banners');
      }
    } catch (err) {
      console.error('Error fetching banners:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  return {
    banners,
    loading,
    error,
    refetch: fetchBanners,
  };
};

import { useState, useEffect, useCallback } from 'react';

interface DealProduct {
  _id: string;
  name: string;
  category: string;
  currentPrice: number;
  basePrice: number;
  unit: string;
  image: string;
  stock: number;
  rating: number;
  reviews: number;
  dealId?: string;
  dealTitle?: string;
  discountPercentage?: number;
}

interface Deal {
  _id: string;
  title: string;
  subtitle: string;
  description?: string;
  discountPercentage: number;
  buttonText: string;
  buttonLink: string;
  backgroundColor?: string;
  textColor?: string;
  startDate: string;
  endDate: string;
  showCountdown: boolean;
}

interface Category {
  id: string;
  name: string;
  count: number;
}

interface UseDealsParams {
  category?: string;
  page?: number;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  rating?: number;
}

interface UseDealsReturn {
  products: DealProduct[];
  deals: Deal[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  totalProducts: number;
  setCurrentPage: (page: number) => void;
  setFilters: (filters: UseDealsParams) => void;
  refetch: () => void;
}

export const useDeals = (params: UseDealsParams = {}): UseDealsReturn => {
  const [products, setProducts] = useState<DealProduct[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(params.page || 1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [filters, setFilters] = useState<UseDealsParams>(params);

  const fetchDeals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      
      if (filters.category && filters.category !== 'all') {
        searchParams.append('category', filters.category);
      }
      if (filters.page) {
        searchParams.append('page', filters.page.toString());
      }
      if (filters.limit) {
        searchParams.append('limit', filters.limit.toString());
      }
      if (filters.minPrice !== undefined) {
        searchParams.append('minPrice', filters.minPrice.toString());
      }
      if (filters.maxPrice !== undefined) {
        searchParams.append('maxPrice', filters.maxPrice.toString());
      }
      if (filters.sort) {
        searchParams.append('sort', filters.sort);
      }
      if (filters.rating) {
        searchParams.append('rating', filters.rating.toString());
      }

      const response = await fetch(`/api/deals?${searchParams}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setProducts(data.products || []);
      setDeals(data.deals || []);
      setCategories(data.categories || []);
      setTotalPages(data.totalPages || 0);
      setCurrentPage(data.currentPage || 1);
      setTotalProducts(data.totalProducts || 0);
      
    } catch (err) {
      console.error('Error fetching deals:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch deals');
      setProducts([]);
      setDeals([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  const handleSetFilters = useCallback((newFilters: UseDealsParams) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const handleSetCurrentPage = useCallback((page: number) => {
    setCurrentPage(page);
    setFilters(prev => ({ ...prev, page }));
  }, []);

  return {
    products,
    deals,
    categories,
    loading,
    error,
    totalPages,
    currentPage,
    totalProducts,
    setCurrentPage: handleSetCurrentPage,
    setFilters: handleSetFilters,
    refetch: fetchDeals,
  };
};
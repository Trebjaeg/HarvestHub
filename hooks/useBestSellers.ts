import { useState, useEffect, useCallback } from 'react';
import { IProduct } from '../types/product';

interface BestSellersFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  rating?: number;
  page?: number;
  limit?: number;
}

interface BannerConfig {
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  heroImage: string;
  backgroundColor?: string;
  textColor?: string;
  enabled: boolean;
}

interface FilterConfig {
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    enabled: boolean;
    order: number;
  }>;
  priceRange: {
    min: number;
    max: number;
    step: number;
  };
  ratings: {
    enabled: boolean;
    minRating: number;
    maxRating: number;
  };
}

interface SortingConfig {
  options: Array<{
    id: string;
    name: string;
    field: string;
    direction: 'asc' | 'desc';
    enabled: boolean;
    order: number;
  }>;
  current: string;
}

interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  count: number;
}

interface BestSellersResponse {
  products: IProduct[];
  categories: CategoryWithCount[];
  banner: BannerConfig | null;
  sorting: SortingConfig;
  filters: FilterConfig;
  pagination: {
    totalProducts: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  message: string;
}

interface UseBestSellersReturn {
  products: IProduct[];
  categories: CategoryWithCount[];
  banner: BannerConfig | null;
  sorting: SortingConfig | null;
  filters: FilterConfig | null;
  loading: boolean;
  error: string | null;
  totalProducts: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  setCurrentPage: (page: number) => void;
  setFilters: (filters: Partial<BestSellersFilters>) => void;
  refetch: () => void;
}

export const useBestSellers = (initialFilters: BestSellersFilters = {}): UseBestSellersReturn => {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [banner, setBanner] = useState<BannerConfig | null>(null);
  const [sorting, setSorting] = useState<SortingConfig | null>(null);
  const [filtersConfig, setFiltersConfig] = useState<FilterConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialFilters.page || 1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [filters, setFiltersState] = useState<BestSellersFilters>(initialFilters);

  const fetchBestSellers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      
      if (filters.category) params.append('category', filters.category);
      if (filters.minPrice !== undefined) params.append('minPrice', filters.minPrice.toString());
      if (filters.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString());
      if (filters.sort) params.append('sort', filters.sort);
      if (filters.rating !== undefined) params.append('rating', filters.rating.toString());
      if (filters.page !== undefined) params.append('page', filters.page.toString());
      if (filters.limit !== undefined) params.append('limit', filters.limit.toString());

      const response = await fetch(`/api/best-sellers?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: BestSellersResponse = await response.json();
      
      setProducts(data.products || []);
      setCategories(data.categories || []);
      setBanner(data.banner);
      setSorting(data.sorting);
      setFiltersConfig(data.filters);
      setTotalProducts(data.pagination?.totalProducts || 0);
      setTotalPages(data.pagination?.totalPages || 0);
      setCurrentPage(data.pagination?.currentPage || 1);
      setHasNextPage(data.pagination?.hasNextPage || false);
      setHasPrevPage(data.pagination?.hasPrevPage || false);

    } catch (err) {
      console.error('Error fetching best sellers:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch best sellers');
      setProducts([]);
      setCategories([]);
      setBanner(null);
      setSorting(null);
      setFiltersConfig(null);
      setTotalProducts(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const setFilters = useCallback((newFilters: Partial<BestSellersFilters>) => {
    setFiltersState(prevFilters => ({
      ...prevFilters,
      ...newFilters,
      page: newFilters.page !== undefined ? newFilters.page : 1 // Reset to page 1 when filters change
    }));
  }, []);

  const refetch = useCallback(() => {
    fetchBestSellers();
  }, [fetchBestSellers]);

  useEffect(() => {
    fetchBestSellers();
  }, [fetchBestSellers]);

  // Update filters when currentPage changes
  useEffect(() => {
    setFiltersState(prevFilters => ({
      ...prevFilters,
      page: currentPage
    }));
  }, [currentPage]);

  return {
    products,
    categories,
    banner,
    sorting,
    filters: filtersConfig,
    loading,
    error,
    totalProducts,
    totalPages,
    currentPage,
    hasNextPage,
    hasPrevPage,
    setCurrentPage,
    setFilters,
    refetch
  };
};
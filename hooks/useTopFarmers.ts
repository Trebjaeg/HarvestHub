import { useState, useEffect, useCallback } from 'react';

interface TopFarmersFilters {
  performance?: string;
  category?: string;
  rating?: number;
  sort?: string;
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
  performance: Array<{
    id: string;
    name: string;
    enabled: boolean;
    order: number;
  }>;
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    enabled: boolean;
    order: number;
  }>;
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

interface FilterWithCount {
  id: string;
  name: string;
  count: number;
}

interface CategoryWithCount extends FilterWithCount {
  slug: string;
}

interface Farmer {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture: string;
  specialties: string[];
  averageRating: number;
  totalSales: number;
  productCount: number;
  reviewCount: number;
  rank: number;
  categories: string[];
  topFarmerScore: number;
  createdAt: string;
  updatedAt: string;
}

interface TopFarmersResponse {
  farmers: Farmer[];
  performanceFilters: FilterWithCount[];
  categoryFilters: CategoryWithCount[];
  banner: BannerConfig | null;
  sorting: SortingConfig;
  filters: FilterConfig;
  pagination: {
    totalFarmers: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  message: string;
}

interface UseTopFarmersReturn {
  farmers: Farmer[];
  performanceFilters: FilterWithCount[];
  categoryFilters: CategoryWithCount[];
  banner: BannerConfig | null;
  sorting: SortingConfig | null;
  filters: FilterConfig | null;
  loading: boolean;
  error: string | null;
  totalFarmers: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  setCurrentPage: (page: number) => void;
  setFilters: (filters: Partial<TopFarmersFilters>) => void;
  refetch: () => void;
}

export const useTopFarmers = (initialFilters: TopFarmersFilters = {}): UseTopFarmersReturn => {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [performanceFilters, setPerformanceFilters] = useState<FilterWithCount[]>([]);
  const [categoryFilters, setCategoryFilters] = useState<CategoryWithCount[]>([]);
  const [banner, setBanner] = useState<BannerConfig | null>(null);
  const [sorting, setSorting] = useState<SortingConfig | null>(null);
  const [filtersConfig, setFiltersConfig] = useState<FilterConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalFarmers, setTotalFarmers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialFilters.page || 1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [filters, setFiltersState] = useState<TopFarmersFilters>(initialFilters);

  const fetchTopFarmers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      
      if (filters.performance) params.append('performance', filters.performance);
      if (filters.category) params.append('category', filters.category);
      if (filters.rating !== undefined) params.append('rating', filters.rating.toString());
      if (filters.sort) params.append('sort', filters.sort);
      if (filters.page !== undefined) params.append('page', filters.page.toString());
      if (filters.limit !== undefined) params.append('limit', filters.limit.toString());

      const response = await fetch(`/api/top-farmers?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: TopFarmersResponse = await response.json();
      
      setFarmers(data.farmers || []);
      setPerformanceFilters(data.performanceFilters || []);
      setCategoryFilters(data.categoryFilters || []);
      setBanner(data.banner);
      setSorting(data.sorting);
      setFiltersConfig(data.filters);
      setTotalFarmers(data.pagination?.totalFarmers || 0);
      setTotalPages(data.pagination?.totalPages || 0);
      setCurrentPage(data.pagination?.currentPage || 1);
      setHasNextPage(data.pagination?.hasNextPage || false);
      setHasPrevPage(data.pagination?.hasPrevPage || false);

    } catch (err) {
      console.error('Error fetching top farmers:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch top farmers');
      setFarmers([]);
      setPerformanceFilters([]);
      setCategoryFilters([]);
      setBanner(null);
      setSorting(null);
      setFiltersConfig(null);
      setTotalFarmers(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const setFilters = useCallback((newFilters: Partial<TopFarmersFilters>) => {
    setFiltersState(prevFilters => ({
      ...prevFilters,
      ...newFilters,
      page: newFilters.page !== undefined ? newFilters.page : 1 // Reset to page 1 when filters change
    }));
  }, []);

  const refetch = useCallback(() => {
    fetchTopFarmers();
  }, [fetchTopFarmers]);

  useEffect(() => {
    fetchTopFarmers();
  }, [fetchTopFarmers]);

  // Update filters when currentPage changes
  useEffect(() => {
    setFiltersState(prevFilters => ({
      ...prevFilters,
      page: currentPage
    }));
  }, [currentPage]);

  return {
    farmers,
    performanceFilters,
    categoryFilters,
    banner,
    sorting,
    filters: filtersConfig,
    loading,
    error,
    totalFarmers,
    totalPages,
    currentPage,
    hasNextPage,
    hasPrevPage,
    setCurrentPage,
    setFilters,
    refetch
  };
};
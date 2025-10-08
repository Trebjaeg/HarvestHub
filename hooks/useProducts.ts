'use client';

import { useState, useEffect, useCallback } from 'react';
import { IProduct, IProductFilters, IProductsResponse } from '../types/product';

interface UseProductsOptions extends IProductFilters {
  limit?: number;
  page?: number;
  sort?: 'price_asc' | 'price_desc' | 'name' | 'newest' | 'createdAt';
}

interface UseProductsHook {
  products: IProduct[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  setFilters: (filters: IProductFilters) => void;
  refetch: () => void;
}

export const useProducts = (initialOptions: UseProductsOptions = {}): UseProductsHook => {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(initialOptions.page || 1);
  const [options, setOptions] = useState<UseProductsOptions>(initialOptions);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      
      if (options.category) params.append('category', options.category);
      if (options.isFeatured) params.append('featured', 'true');
      if (options.isOrganic) params.append('organic', 'true');
      if (options.search) params.append('search', options.search);
      if (options.minPrice) params.append('minPrice', options.minPrice.toString());
      if (options.maxPrice) params.append('maxPrice', options.maxPrice.toString());
      if (options.limit) params.append('limit', options.limit.toString());
      params.append('page', currentPage.toString());
      if (options.sort) params.append('sort', options.sort);

      const response = await fetch(`/api/products?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data: IProductsResponse = await response.json();
      
      setProducts(data.products);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [options, currentPage]);

  const setFilters = useCallback((filters: IProductFilters) => {
    setOptions(prev => ({ ...prev, ...filters }));
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    totalPages,
    currentPage,
    setCurrentPage,
    setFilters,
    refetch: fetchProducts
  };
};

export const useProduct = (id: string) => {
  const [product, setProduct] = useState<IProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/products/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch product');
        }

        const data = await response.json();
        
        if (data.success) {
          setProduct(data.data);
        } else {
          throw new Error('Product not found');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching product');
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  return { product, loading, error };
};
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../lib/i18n';
import TopFarmersPage from '../page';

// Mock the hooks
jest.mock('../../../hooks/useAuthUserData', () => ({
  useAuthUserData: () => ({
    isAuthenticated: true,
    cartCount: 0,
    notificationCount: 0
  })
}));

jest.mock('../../../hooks/useTopFarmers', () => ({
  useTopFarmers: () => ({
    farmers: [
      {
        _id: '1',
        firstName: 'John',
        lastName: 'Doe',
        rank: 1,
        categories: ['leafy-greens'],
        productCount: 5,
        averageRating: 4.5,
        reviewCount: 10,
        profilePicture: '/images/farmer1.jpg'
      }
    ],
    performanceFilters: [
      { id: 'all', name: 'All', count: 10 },
      { id: 'top_rated', name: 'Top Rated', count: 5 }
    ],
    categoryFilters: [
      { id: 'all', name: 'All', count: 10 },
      { id: 'leafy-greens', name: 'Leafy Greens', count: 3 }
    ],
    banner: {
      enabled: true,
      title: 'Top Farmers',
      subtitle: 'Meet our best farmers',
      buttonText: 'Explore',
      buttonLink: '#farmers',
      heroImage: '/images/hero.jpg'
    },
    sorting: {
      options: [
        { id: 'top_rated', name: 'Top Rated' },
        { id: 'newest', name: 'Newest' }
      ],
      current: 'top_rated'
    },
    filters: {
      ratings: { enabled: true, minRating: 1, maxRating: 5 }
    },
    loading: false,
    error: null,
    totalPages: 1,
    totalFarmers: 1,
    setCurrentPage: jest.fn(),
    setFilters: jest.fn(),
    refetch: jest.fn()
  })
}));

describe('TopFarmersPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          {component}
        </I18nextProvider>
      </QueryClientProvider>
    );
  };

  it('renders Top Farmers page with header and navigation', async () => {
    renderWithProviders(<TopFarmersPage />);
    
    await waitFor(() => {
      expect(screen.getByText('HarvestHub')).toBeInTheDocument();
      expect(screen.getByText('Top Farmers')).toBeInTheDocument();
    });
  });

  it('displays farmers table with farmer information', async () => {
    renderWithProviders(<TopFarmersPage />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('5 products')).toBeInTheDocument();
      expect(screen.getByText('4.5 (10 reviews)')).toBeInTheDocument();
    });
  });

  it('shows filter options and controls', async () => {
    renderWithProviders(<TopFarmersPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Filter Options')).toBeInTheDocument();
      expect(screen.getByText('Performance')).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
    });
  });

  it('renders action buttons for each farmer', async () => {
    renderWithProviders(<TopFarmersPage />);
    
    await waitFor(() => {
      expect(screen.getByText('View Shop')).toBeInTheDocument();
      expect(screen.getByText('Message')).toBeInTheDocument();
    });
  });

  it('displays banner when enabled', async () => {
    renderWithProviders(<TopFarmersPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Top Farmers')).toBeInTheDocument();
      expect(screen.getByText('Meet our best farmers')).toBeInTheDocument();
    });
  });
});
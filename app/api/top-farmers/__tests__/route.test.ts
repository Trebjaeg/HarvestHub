import { NextRequest } from 'next/server';
import { GET } from '../route';
import dbConnect from '../../../../lib/mongodb';
import User from '../../../../models/User';
import TopFarmersConfig from '../../../../models/TopFarmersConfig';

// Mock dependencies
jest.mock('../../../../lib/mongodb');
jest.mock('../../../../models/User');
jest.mock('../../../../models/TopFarmersConfig');
jest.mock('../../../../models/Product');

const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;
const mockUser = User as jest.Mocked<typeof User>;
const mockTopFarmersConfig = TopFarmersConfig as jest.Mocked<typeof TopFarmersConfig>;

describe('/api/top-farmers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDbConnect.mockResolvedValue(undefined);
  });

  const createMockRequest = (searchParams: Record<string, string> = {}) => {
    const url = new URL('http://localhost:3000/api/top-farmers');
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    
    return new NextRequest(url);
  };

  const mockConfig = {
    banner: {
      enabled: true,
      title: 'Top Farmers',
      subtitle: 'Meet our best farmers',
      buttonText: 'Explore',
      buttonLink: '#farmers',
      heroImage: '/images/hero.jpg'
    },
    filters: {
      performance: [
        { id: 'all', name: 'All', enabled: true, order: 0 },
        { id: 'top_rated', name: 'Top Rated', enabled: true, order: 1 }
      ],
      categories: [
        { id: 'all', name: 'All', slug: 'all', enabled: true, order: 0 },
        { id: 'leafy-greens', name: 'Leafy Greens', slug: 'leafy-greens', enabled: true, order: 1 }
      ],
      ratings: { enabled: true, minRating: 1, maxRating: 5 }
    },
    sorting: {
      options: [
        { id: 'top_rated', name: 'Top Rated', field: 'averageRating', direction: 'desc', enabled: true, order: 0 }
      ],
      defaultSort: 'top_rated'
    },
    topFarmersCriteria: {
      salesWeight: 0.3,
      ratingWeight: 0.3,
      productCountWeight: 0.2,
      reviewCountWeight: 0.1,
      recentActivityWeight: 0.1,
      minSalesForTopFarmer: 5,
      minRatingForTopFarmer: 4.0,
      minProductsForTopFarmer: 3,
      timeframeDays: 30
    },
    pagination: { itemsPerPage: 10, maxItemsPerPage: 50 },
    cacheSettings: { ttlMinutes: 30, enabled: true }
  };

  const mockFarmers = [
    {
      _id: '123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      profilePicture: '/images/farmer1.jpg',
      averageRating: 4.5,
      totalSales: 10,
      productCount: 5,
      reviewCount: 8,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  it('should return top farmers with default parameters', async () => {
    mockTopFarmersConfig.findOne.mockResolvedValue(mockConfig);
    mockUser.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockFarmers)
            })
          })
        })
      })
    } as any);
    mockUser.countDocuments.mockResolvedValue(1);

    const request = createMockRequest();
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.farmers).toHaveLength(1);
    expect(data.farmers[0].firstName).toBe('John');
    expect(data.pagination.totalFarmers).toBe(1);
  });

  it('should filter farmers by performance', async () => {
    mockTopFarmersConfig.findOne.mockResolvedValue(mockConfig);
    mockUser.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockFarmers)
            })
          })
        })
      })
    } as any);
    mockUser.countDocuments.mockResolvedValue(1);

    const request = createMockRequest({ performance: 'top_rated' });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockUser.find).toHaveBeenCalledWith(
      expect.objectContaining({
        averageRating: { $gte: 4.0 }
      })
    );
  });

  it('should handle pagination correctly', async () => {
    mockTopFarmersConfig.findOne.mockResolvedValue(mockConfig);
    mockUser.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockFarmers)
            })
          })
        })
      })
    } as any);
    mockUser.countDocuments.mockResolvedValue(25);

    const request = createMockRequest({ page: '2', limit: '10' });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.pagination.currentPage).toBe(2);
    expect(data.pagination.totalPages).toBe(3);
    expect(data.pagination.hasNextPage).toBe(true);
    expect(data.pagination.hasPrevPage).toBe(true);
  });

  it('should return 404 when configuration not found', async () => {
    mockTopFarmersConfig.findOne.mockResolvedValue(null);

    const request = createMockRequest();
    const response = await GET(request);

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('Top farmers configuration not found');
  });

  it('should handle database errors gracefully', async () => {
    mockDbConnect.mockRejectedValue(new Error('Database connection failed'));

    const request = createMockRequest();
    const response = await GET(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Internal server error');
  });

  it('should respect maximum items per page limit', async () => {
    mockTopFarmersConfig.findOne.mockResolvedValue(mockConfig);
    mockUser.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockFarmers)
            })
          })
        })
      })
    } as any);
    mockUser.countDocuments.mockResolvedValue(1);

    const request = createMockRequest({ limit: '100' }); // Exceeds max of 50
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.pagination.itemsPerPage).toBe(50); // Should be capped at max
  });
});
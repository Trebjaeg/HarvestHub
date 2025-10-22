# Top Farmers System - Complete Documentation

## Overview
The Top Farmers system is a fully database-driven feature that showcases the highest-rated and most productive farmers on the HarvestHub platform. It provides dynamic filtering, sorting, and ranking capabilities with comprehensive internationalization support.

## System Architecture

### Frontend Components
- **Page**: `app/top-farmers/page.tsx` - Main Top Farmers page with full i18n support
- **Hook**: `hooks/useTopFarmers.ts` - Custom React hook for data fetching and state management
- **Tests**: `app/top-farmers/__tests__/` - Comprehensive test suite

### Backend Components
- **API Route**: `app/api/top-farmers/route.ts` - RESTful API endpoint with caching
- **Model**: `models/TopFarmersConfig.ts` - Database schema for configuration
- **Setup Script**: `scripts/setup-top-farmers.js` - Database initialization script
- **Tests**: `app/api/top-farmers/__tests__/` - API endpoint tests

### Database Schema
```typescript
interface ITopFarmersConfig {
  banner: {
    title: string;
    subtitle: string;
    buttonText: string;
    buttonLink: string;
    heroImage: string;
    backgroundColor?: string;
    textColor?: string;
    enabled: boolean;
  };
  filters: {
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
  };
  sorting: {
    options: Array<{
      id: string;
      name: string;
      field: string;
      direction: 'asc' | 'desc';
      enabled: boolean;
      order: number;
    }>;
    defaultSort: string;
  };
  topFarmersCriteria: {
    salesWeight: number;
    ratingWeight: number;
    productCountWeight: number;
    reviewCountWeight: number;
    recentActivityWeight: number;
    minSalesForTopFarmer: number;
    minRatingForTopFarmer: number;
    minProductsForTopFarmer: number;
    timeframeDays: number;
  };
  pagination: {
    itemsPerPage: number;
    maxItemsPerPage: number;
  };
  cacheSettings: {
    ttlMinutes: number;
    enabled: boolean;
  };
  isActive: boolean;
}
```

## Features

### 1. Dynamic Configuration
- **Database-driven**: All settings stored in MongoDB
- **Real-time updates**: Changes reflect immediately
- **Admin configurable**: Performance criteria, filters, and sorting options
- **Environment variables**: Support for configurable defaults

### 2. Advanced Filtering System
- **Performance filters**: Top Rated, Top Sellers, Most Productive, Trending, Most Reviewed
- **Category filters**: Based on farmer product categories
- **Rating filters**: 1-5 star rating system with "& Up" functionality
- **Dynamic counts**: Real-time filter result counts

### 3. Intelligent Ranking Algorithm
```javascript
topFarmerScore = 
  (salesScore * 0.3) +           // Sales performance
  (ratingScore * 0.3) +          // Customer ratings
  (productScore * 0.2) +         // Product variety
  (reviewScore * 0.1) +          // Review volume
  (recentActivityScore * 0.1);   // Recent activity
```

### 4. Responsive Design
- **Mobile-first**: Optimized for all screen sizes
- **Table view**: Desktop table layout
- **Card view**: Mobile-friendly card layout
- **Touch-friendly**: Easy navigation on mobile devices

### 5. Internationalization (i18n)
- **English**: Full translation support
- **Filipino (Tagalog)**: Complete localization
- **Dynamic content**: All text content is translatable
- **RTL support**: Ready for right-to-left languages

### 6. Performance Optimization
- **Caching**: Configurable cache TTL (default 30 minutes)
- **Pagination**: Efficient data loading
- **Lazy loading**: Images loaded on demand
- **Query optimization**: Indexed database queries

## API Endpoints

### GET /api/top-farmers
Returns paginated list of top farmers with filtering and sorting.

**Query Parameters:**
- `performance`: Filter by performance type (top_rated, top_sellers, etc.)
- `category`: Filter by farmer category
- `rating`: Minimum rating filter
- `sort`: Sort order (top_rated, most_reviewed, newest, name)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 50)

**Response:**
```json
{
  "farmers": [
    {
      "_id": "farmer_id",
      "firstName": "John",
      "lastName": "Doe",
      "rank": 1,
      "categories": ["leafy-greens", "fruits"],
      "productCount": 15,
      "averageRating": 4.8,
      "reviewCount": 25,
      "profilePicture": "/images/farmer.jpg",
      "topFarmerScore": 0.92
    }
  ],
  "performanceFilters": [...],
  "categoryFilters": [...],
  "banner": {...},
  "sorting": {...},
  "filters": {...},
  "pagination": {
    "totalFarmers": 150,
    "totalPages": 15,
    "currentPage": 1,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

## Environment Variables

```bash
# Top Farmers Configuration
DEFAULT_TOP_FARMERS_HERO_IMAGE=https://barn.sgp1.cdn.digitaloceanspaces.com/images/top-farmers-hero.jpg
TOP_FARMERS_CACHE_TTL=30
TOP_FARMERS_MAX_ITEMS_PER_PAGE=50
TOP_FARMERS_DEFAULT_ITEMS_PER_PAGE=10
```

## Installation & Setup

### 1. Initialize Database Configuration
```bash
node scripts/setup-top-farmers.js
```

### 2. Environment Setup
Ensure all required environment variables are set in `.env.local`.

### 3. Run Tests
```bash
# Frontend tests
npm run test app/top-farmers

# API tests
npm run test app/api/top-farmers
```

## Navigation Integration
Top Farmers appears as the last item in the main navigation:
- Home → Shop → Deals → Best Seller → **Top Farmers**

## File Structure
```
app/
├── top-farmers/
│   ├── page.tsx                 # Main page component
│   └── __tests__/
│       └── page.test.tsx        # Page component tests
├── api/
│   └── top-farmers/
│       ├── route.ts             # API endpoint
│       └── __tests__/
│           └── route.test.ts    # API tests
hooks/
└── useTopFarmers.ts             # Data fetching hook
models/
└── TopFarmersConfig.ts          # Database model
scripts/
└── setup-top-farmers.js        # Setup script
public/
└── locales/
    ├── en/
    │   └── translation.json     # English translations
    └── tl/
        └── translation.json     # Filipino translations
```

## Key Features Checklist ✅

- [x] **Fully Database-Driven**: No hardcoded data
- [x] **Dynamic Configuration**: Admin-configurable settings
- [x] **Advanced Filtering**: Performance, category, and rating filters
- [x] **Intelligent Ranking**: Weighted scoring algorithm
- [x] **Responsive Design**: Mobile and desktop optimized
- [x] **Internationalization**: English and Filipino support
- [x] **Performance Optimization**: Caching and pagination
- [x] **Error Handling**: Comprehensive error management
- [x] **Testing**: Unit tests for components and APIs
- [x] **Documentation**: Complete system documentation
- [x] **Environment Configuration**: Configurable via environment variables
- [x] **Navigation Integration**: Positioned at end of navigation
- [x] **SEO Optimization**: Proper meta tags and structure

## Maintenance

### Adding New Performance Filters
1. Update the configuration in MongoDB
2. Add corresponding logic in the API route
3. Update translations in locale files

### Modifying Ranking Algorithm
1. Update `topFarmersCriteria` weights in configuration
2. Restart the application to clear cache

### Adding New Languages
1. Create new locale files in `public/locales/[lang]/`
2. Add translation keys for Top Farmers
3. Update i18n configuration

## Security Considerations
- Input validation on all parameters
- Rate limiting on API endpoints
- Secure database queries (no injection vulnerabilities)
- Proper error handling without data leakage
- Environment variable protection

## Performance Monitoring
- Cache hit rates
- Query execution times
- API response times
- Database connection pool usage

The Top Farmers system is now fully implemented, tested, and documented with no hardcoded data remaining.
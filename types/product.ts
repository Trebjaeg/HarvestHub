export interface IProduct {
  _id: string;
  name: string;
  description: string;
  category: 'vegetables' | 'fruits' | 'grains' | 'spices' | 'dairy' | 'herbs' | 'nuts';
  basePrice: number;
  currentPrice: number;
  unit: 'kg' | 'piece' | 'bunch' | 'gram' | 'liter';
  stock: number;
  imageUrl: string;
  farmerId: string; // ID of the farmer/seller
  farmerName?: string; // Name of the farmer/seller
  farmer: {
    name: string;
    location: string;
    contact: string;
  };
  isOrganic: boolean;
  isFeatured: boolean;
  tags: string[];
  nutritionalInfo?: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fiber: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductFilters {
  category?: string;
  isOrganic?: boolean;
  isFeatured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sort?: 'price_asc' | 'price_desc' | 'name' | 'newest' | 'createdAt';
}

export interface IProductsResponse {
  products: IProduct[];
  total: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
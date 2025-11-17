'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Plus, Package, Edit, Trash2, FileText, Trophy, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AddEditProductModal from "@/components/ui/AddEditProductModal";
import SuccessDialog from "@/components/ui/SuccessDialog";

interface Product {
  _id?: string;
  name: string;
  category: string;
  unit: string;
  status: string;
  description: string;
  price: number;
  stock: number;
  lowStockAlert: number;
  images: string[];
  farmerId?: string;
  farmerName?: string;
  location?: string;
  image?: string;
  isActive?: boolean;
  isOrganic?: boolean;
  featured?: boolean;
  rating?: number;
  reviews?: number;
  harvestDate?: string;
  createdAt?: Date;
  updatedAt?: Date;
  inventory_available?: number;
  inventory_reserved?: number;
  inventory_committed?: number;
  inventory_on_hand?: number;
  bestSellerScore?: number;
  isBestSeller?: boolean;
  sku?: string;
  // Real sales metrics from API
  totalSold?: number;
  totalRevenue?: number;
  orderCount?: number;
  daysSinceLastOrder?: number;
  avgOrderValue?: number;
  salesRank?: number;
}

interface Appeal {
  _id: string;
  user: string;
  productId?: string;
  productName?: string;
  type: 'suspension' | 'deletion' | 'warning' | 'listing_removal';
  reason: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  decision?: 'approved' | 'rejected' | 'partial';
  decisionReason?: string;
  reviewNotes?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export default function Products() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [verificationMessage, setVerificationMessage] = useState<string>("");
  const [isVerified, setIsVerified] = useState<boolean>(true); // Assume verified until checked
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [successMessage, setSuccessMessage] = useState({ title: '', message: '' });
  const [bestSellerProducts, setBestSellerProducts] = useState<Product[]>([]);
  const [loadingBestSellers, setLoadingBestSellers] = useState(true);

  const categories = [
    "Leafy Greens",
    "Root Crops", 
    "Fruits",
    "Spices & Aromatics",
    "Eggplant & Gourds",
    "Grains & Rice"
  ];

  const statusOptions = ["Available", "Unavailable"];

  useEffect(() => {
    fetchProducts();
    fetchAppeals();
    checkVerificationStatus();
    fetchBestSellerProducts();
  }, []);

  const checkVerificationStatus = async () => {
    try {
      const token = localStorage.getItem('hh_token') || localStorage.getItem('auth-token');
      const response = await fetch('/api/seller/verification/status', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        credentials: 'include',
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        const verified = data.sellerStatus === 'verified';
        setIsVerified(verified);
      }
    } catch (error) {
      setIsVerified(false);
    }
  };

  const fetchAppeals = async () => {
    try {
      const token = localStorage.getItem('hh_token') || localStorage.getItem('auth-token');
      const response = await fetch('/api/seller/appeals', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        setAppeals(data);
      }
    } catch (error) {
      setAppeals([]);
    }
  };

  const fetchBestSellerProducts = async () => {
    try {
      setLoadingBestSellers(true);
      const token = localStorage.getItem('hh_token') || localStorage.getItem('auth-token');
      const response = await fetch('/api/seller/best-seller-products', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        setBestSellerProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching best seller products:', error);
      setBestSellerProducts([]);
    } finally {
      setLoadingBestSellers(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('hh_token') || localStorage.getItem('auth-token');
      const response = await fetch('/api/seller/products', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        // Convert harvestDate from Date to string for the modal
        const formattedProducts = (data.products || []).map((product: any) => ({
          ...product,
          harvestDate: product.harvestDate ? new Date(product.harvestDate).toISOString().split('T')[0] : undefined
        }));
        setProducts(formattedProducts);
        setRetryCount(0); // Reset retry count on success
      } else if (response.status === 403) {
        const error = await response.json();
        if (error.error === 'Insufficient permissions' || error.message?.includes('verification')) {
          // Don't show anything on page load - user will see error when trying to add/edit
        }
      }
    } catch (error) {
      // Retry once if first attempt fails
      if (retryCount < 1) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          fetchProducts();
        }, 1000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (product: Product) => {
    try {
      const token = localStorage.getItem('hh_token') || localStorage.getItem('auth-token');
      const response = await fetch('/api/seller/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(product)
      });
      
      if (response.ok) {
        const data = await response.json();
        // Close modal first
        setShowAddModal(false);
        // Refresh the products list
        await fetchProducts();
        await fetchBestSellerProducts();
        // Show success dialog
        setSuccessMessage({
          title: 'Success!',
          message: 'Your product has been added successfully and is now visible in your product list.'
        });
        setShowSuccessDialog(true);
      } else {
        const error = await response.json();
        // Check if it's a verification error
        if (response.status === 403 && (error.error === 'Insufficient permissions' || error.message?.includes('verification'))) {
          // Keep modal open and show error inline
          setVerificationMessage(error.message || 'You must be a verified seller to add products');
        } else {
          alert(error.error || error.message || 'Failed to create product');
        }
      }
    } catch (error) {
      alert('An error occurred while adding the product. Please try again.');
    }
  };

  const handleEditProduct = async (product: Product) => {
    try {
      const token = localStorage.getItem('hh_token') || localStorage.getItem('auth-token');
      const response = await fetch(`/api/seller/products/${product._id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(product)
      });

      if (response.ok) {
        const data = await response.json();
        // Close modal first
        setEditingProduct(null);
        // Refresh the products list
        await fetchProducts();
        await fetchBestSellerProducts();
        // Show success dialog
        setSuccessMessage({
          title: 'Updated!',
          message: 'Your product has been updated successfully.'
        });
        setShowSuccessDialog(true);
      } else {
        const error = await response.json();
        // Silently fail and close modal
        setEditingProduct(null);
        fetchProducts();
      }
    } catch (error) {
      // Silently fail and close modal
      setEditingProduct(null);
      fetchProducts();
    }
  };

  const handleDeleteProduct = async (productId: string | undefined) => {
    if (!productId) return;
    
    // Open confirmation modal
    setProductToDelete(productId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    try {
      const token = localStorage.getItem('hh_token') || localStorage.getItem('auth-token');
      const response = await fetch(`/api/seller/products/${productToDelete}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Close delete modal
        setShowDeleteModal(false);
        setProductToDelete(null);
        // Refresh the products list
        await fetchProducts();
        await fetchBestSellerProducts();
        // Show success message
        setSuccessMessage({
          title: 'Deleted!',
          message: 'Product has been deleted successfully.'
        });
        setShowSuccessDialog(true);
      } else {
        // Close modal and refresh the list
        setShowDeleteModal(false);
        setProductToDelete(null);
        fetchProducts();
      }
    } catch (error) {
      // Close modal and refresh the list
      setShowDeleteModal(false);
      setProductToDelete(null);
      fetchProducts();
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    const matchesStatus = selectedStatus === "all" || product.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Separate active and deactivated for rendering
  const activeProducts = filteredProducts.filter(product => product.isActive !== false);
  const deactivatedProducts = filteredProducts.filter(product => product.isActive === false);

  const getStatusColor = (status: string) => {
    return status === 'Available' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  const getStockStatus = (availableStock: number, lowStockAlert: number) => {
    if (availableStock === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    if (availableStock <= lowStockAlert) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'In Stock', color: 'bg-green-100 text-green-800' };
  };

  return (
    <div className="bg-gray-50 min-h-screen p-3 sm:p-4 lg:p-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
      <div className="max-w-7xl mx-auto">
        {/* Blurred Overlay for Unverified Sellers - Both Mobile and Desktop */}
        {!isVerified && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-center animate-fade-in-up">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Verification Required
              </h3>
              <p className="text-gray-600 mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
                You must complete seller verification before you can manage products. Please verify your account in the Profile section.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => window.location.href = '/profile'}
                  className="flex-1 bg-[#103C2E] hover:bg-[#0d2e23] text-white"
                >
                  Complete Verification
                </Button>
                <Button
                  onClick={() => window.history.back()}
                  variant="outline"
                  className="flex-1"
                >
                  Go Back
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Package className="w-6 h-6 sm:w-8 sm:h-8 text-[#103C2E] flex-shrink-0" />
            <h1 className="text-lg sm:text-2xl font-bold text-[#103C2E] truncate">
              Products
            </h1>
          </div>
          <Button 
            onClick={() => {
              if (!isVerified) {
                setVerificationMessage('You must complete seller verification to add products. Please verify your account in the Profile section.');
              } else {
                setVerificationMessage('');
              }
              setShowAddModal(true);
            }}
            className="bg-[#103C2E] hover:bg-[#0d2e23] active:bg-[#0d2e23] text-white text-sm sm:text-base whitespace-nowrap flex-shrink-0 touch-manipulation" 
          >
            <Plus className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Add Product</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>

        {/* Filters and Search */}
        <Card className="p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6 bg-white border border-gray-200">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Search Bar */}
            <div className="w-full relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 font-poppins w-full text-sm sm:text-base"
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:flex-1 font-poppins text-sm sm:text-base">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="font-poppins">
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:flex-1 font-poppins text-sm sm:text-base">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="font-poppins">
                  <SelectItem value="all">All Status</SelectItem>
                  {statusOptions.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Best Seller Items Section */}
        {isVerified && (
          <Card className="p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200">
            <div className="flex items-center gap-2 sm:gap-3 mb-4">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 flex-shrink-0" />
              <h2 className="text-base sm:text-lg font-bold text-yellow-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Top Selling Products
              </h2>
              <Badge className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 ml-auto">
                All-Time Best Performers
              </Badge>
            </div>
            
            {loadingBestSellers ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {Array(5).fill(0).map((_, i) => (
                  <div key={i} className="h-32 bg-yellow-100 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : bestSellerProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {bestSellerProducts.map((product) => (
                  <div 
                    key={product._id}
                    className={`bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer relative min-h-[200px] border-yellow-200`}
                    onClick={() => router.push(`/product/${product._id}`)}
                  >
                    {/* Best Seller Badge */}
                    <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-2 py-1 shadow-sm">
                        <Star className="w-3 h-3 mr-1" />
                        Best Seller
                      </Badge>
                      {(product.stock || 0) <= (product.lowStockAlert || 5) && (
                        <Badge className="bg-red-500 text-white text-xs px-2 py-1 shadow-sm">
                          Low Stock
                        </Badge>
                      )}
                    </div>
                    
                    {/* Product Image */}
                    <div className="h-20 sm:h-24 bg-gray-100 rounded-t-lg overflow-hidden">
                      {product.images && product.images.length > 0 ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          width={208}
                          height={96}
                          className="object-cover w-full h-full"
                          unoptimized={product.images[0].includes('digitaloceanspaces.com')}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    {/* Product Info */}
                    <div className="p-2 space-y-1 flex-1">
                      <h3 className="font-medium text-xs text-gray-900 line-clamp-2 leading-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {product.name}
                      </h3>
                      <p className="text-xs font-semibold text-[#103C2E]">
                        ₱{product.price}/{product.unit}
                      </p>
                      
                      {/* Real Sales Metrics */}
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Sold:</span>
                          <span className="font-bold text-green-600">{product.totalSold || 0}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Revenue:</span>
                          <span className="font-bold text-blue-600 text-xs">₱{(product.totalRevenue || 0).toLocaleString()}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Orders:</span>
                          <span className="font-medium text-purple-600">{product.orderCount || 0}</span>
                        </div>
                        
                        {product.salesRank && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">Rank:</span>
                            <span className="font-bold text-yellow-700">#{product.salesRank}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-xs border-t border-gray-200 pt-1 mt-1">
                        <span className={`${
                          (product.stock || 0) <= (product.lowStockAlert || 5) 
                            ? 'text-red-600 font-semibold' 
                            : 'text-gray-500'
                        }`}>
                          Stock: {product.stock || 0}
                          {(product.stock || 0) <= (product.lowStockAlert || 5) && ' ⚠️'}
                        </span>
                        {product.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-current" />
                            <span className="text-gray-600">{product.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <p className="text-sm text-yellow-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  No best seller products yet. Keep selling to earn best seller status!
                </p>
              </div>
            )}
          </Card>
        )}



        {/* Products Table/Cards */}
        {loading ? (
          <Card className="p-6 bg-white border border-gray-200">
            <div className="animate-pulse space-y-4">
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          </Card>
        ) : filteredProducts.length === 0 ? (
          <Card className="p-6 sm:p-8 lg:p-12 text-center bg-white border border-gray-200">
            <Package className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
              No products found
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4">
              {searchTerm || selectedCategory !== "all" || selectedStatus !== "all"
                ? "Try adjusting your filters"
                : "Get started by adding your first product"}
            </p>
            <Button 
              onClick={() => setShowAddModal(true)}
              className="bg-[#103C2E] hover:bg-[#0d2e23] active:bg-[#0d2e23] text-white touch-manipulation"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </Card>
        ) : (
          <>
            {/* Desktop Card Grid View - ProductCard Style */}
            <div className="hidden sm:block">
              <div className="product-card-container">
                {filteredProducts.map((product) => {
                  const productAppeal = appeals.find(
                    (appeal) => appeal.productId === product._id && appeal.type === 'listing_removal'
                  );
                  const isDeactivated = product.isActive === false && product.status !== 'Available';

                  return (
                    <div 
                      key={product._id}
                      onClick={() => router.push(`/product/${product._id}`)}
                      className={`relative w-full rounded-2xl sm:rounded-3xl border-2 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] cursor-pointer ${
                        isDeactivated 
                          ? 'bg-red-50 border-red-200' 
                          : (product.stock || 0) <= (product.lowStockAlert || 5)
                          ? 'bg-white border-red-400 ring-2 ring-red-100'
                          : 'bg-white border-gray-200'
                      }`}
                      style={{ aspectRatio: '3/4' }}
                    >
                      {/* Product Image */}
                      <div className="relative w-full h-[65%]">
                        {product.images && product.images.length > 0 ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, (max-width: 1536px) 25vw, 20vw"
                            unoptimized={product.images[0].includes('digitaloceanspaces.com')}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <Package className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" />
                          </div>
                        )}
                        
                        {/* Badges */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          {/* Best Seller Badge */}
                          {bestSellerProducts.some(bp => bp._id === product._id) && (
                            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-2 py-1 shadow-sm">
                              <Star className="w-3 h-3 mr-1" />
                              Best Seller
                            </Badge>
                          )}
                          
                          {/* Low Stock Badge */}
                          {!isDeactivated && (product.stock || 0) <= (product.lowStockAlert || 5) && (
                            <Badge className="bg-red-500 text-white text-xs px-2 py-1 shadow-sm">
                              ⚠️ Low Stock
                            </Badge>
                          )}
                          
                          {/* Deactivation Badge */}
                          {isDeactivated && (
                            <Badge className="bg-red-500 text-white text-xs px-2 py-1">
                              Deactivated
                            </Badge>
                          )}
                        </div>

                        {/* Action Buttons */}
                        {!isDeactivated && (
                          <div className="absolute top-2 right-2 flex gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingProduct(product);
                              }}
                              className="p-1.5 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all backdrop-blur-sm"
                              title="Edit Product"
                            >
                              <Edit className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#103C2E]" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteProduct(product._id!);
                              }}
                              className="p-1.5 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all backdrop-blur-sm"
                              title="Delete Product"
                            >
                              <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-600" />
                            </button>
                          </div>
                        )}

                        {/* Appeal Button for Deactivated Products */}
                        {isDeactivated && (
                          <div className="absolute bottom-2 left-2 right-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/my-appeals?product=${product._id}&name=${encodeURIComponent(product.name)}`);
                              }}
                              className="w-full flex items-center justify-center gap-1 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-lg px-2 py-1.5 transition-colors font-medium"
                              title="Appeal this deactivation"
                            >
                              <FileText className="w-3 h-3" />
                              <span className="hidden sm:inline">Appeal</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="p-3 sm:p-4 h-[35%] flex flex-col justify-between">
                        <div className="flex-1">
                          <h3 className={`font-semibold text-xs sm:text-sm leading-tight mb-1 line-clamp-2 product-name ${
                            isDeactivated ? 'text-red-800' : 'text-gray-900'
                          }`} style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {product.name}
                          </h3>
                          <p className={`text-sm sm:text-base lg:text-lg font-bold mb-1 ${
                            isDeactivated ? 'text-red-700' : 'text-[#103C2E]'
                          }`} style={{ fontFamily: 'Poppins, sans-serif' }}>
                            ₱{product.price.toFixed(2)}/{product.unit}
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between gap-2 text-xs" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          <div className="flex items-center gap-1 min-w-0 flex-1">
                            <span className="text-gray-600 flex-shrink-0">Stock:</span>
                            <span className={`font-medium flex-shrink-0 ${
                              isDeactivated 
                                ? 'text-red-600' 
                                : (product.stock || 0) <= (product.lowStockAlert || 5)
                                ? 'text-red-600 font-bold'
                                : 'text-green-600'
                            }`}>
                              {product.inventory_available ?? product.stock}
                              {!isDeactivated && (product.stock || 0) <= (product.lowStockAlert || 5) && ' ⚠️'}
                            </span>
                            {(product.inventory_reserved || 0) > 0 && (
                              <>
                                <span className="text-gray-400 mx-1">•</span>
                                <span className="text-yellow-600 font-medium text-xs">
                                  {product.inventory_reserved} reserved
                                </span>
                              </>
                            )}
                          </div>
                          <Badge className={`${getStatusColor(product.status || 'Available')} text-xs px-1.5 py-0.5 flex-shrink-0`}>
                            {product.status || 'Available'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden space-y-3">
              {filteredProducts.map((product) => {
                const productAppeal = appeals.find(
                  (appeal) => appeal.productId === product._id && appeal.type === 'listing_removal'
                );
                const isDeactivated = product.isActive === false && product.status !== 'Available';

                return (
                  <Card 
                    key={product._id} 
                    className={`p-4 ${
                      isDeactivated 
                        ? 'bg-red-50 border-red-200' 
                        : (product.stock || 0) <= (product.lowStockAlert || 5)
                        ? 'bg-white border-red-400 ring-1 ring-red-100'
                        : 'bg-white border-gray-200'
                    }`}
                    onClick={() => router.push(`/product/${product._id}`)}
                  >
                    <div className="flex gap-3">
                      {/* Product Image */}
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        {product.images && product.images.length > 0 ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                            unoptimized={product.images[0].includes('digitaloceanspaces.com')}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 pr-2">
                            <h3 className={`font-semibold text-sm leading-tight product-name ${
                              isDeactivated ? 'text-red-800' : 'text-gray-900'
                            }`} style={{ fontFamily: 'Poppins, sans-serif' }}>
                              {product.name}
                            </h3>
                            {/* Badges for Mobile */}
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {bestSellerProducts.some(bp => bp._id === product._id) && (
                                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-2 py-1 shadow-sm inline-flex items-center">
                                  <Star className="w-3 h-3 mr-1" />
                                  Best Seller
                                </Badge>
                              )}
                              {!isDeactivated && (product.stock || 0) <= (product.lowStockAlert || 5) && (
                                <Badge className="bg-red-500 text-white text-xs px-2 py-1 shadow-sm inline-flex items-center">
                                  ⚠️ Low Stock
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Badge className={`${getStatusColor(product.status || 'Available')} text-xs flex-shrink-0 px-2 py-1`}>
                            {(product.status || 'Available')}
                          </Badge>
                        </div>
                        
                        <p className={`text-lg font-bold mb-2 ${
                          isDeactivated ? 'text-red-700' : 'text-[#103C2E]'
                        }`} style={{ fontFamily: 'Poppins, sans-serif' }}>
                          ₱{product.price.toFixed(2)}/{product.unit}
                        </p>

                        <div className="text-sm text-gray-600 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1">
                              <span>Stock:</span>
                              <span className={`font-medium ${
                                isDeactivated 
                                  ? 'text-red-600' 
                                  : (product.stock || 0) <= (product.lowStockAlert || 5)
                                  ? 'text-red-600 font-bold'
                                  : 'text-green-600'
                              }`}>
                                {product.inventory_available ?? product.stock}
                                {!isDeactivated && (product.stock || 0) <= (product.lowStockAlert || 5) && ' ⚠️'}
                              </span>
                            </div>
                            {(product.inventory_reserved || 0) > 0 && (
                              <div className="flex items-center gap-1 text-yellow-600 text-xs">
                                <span>•</span>
                                <span className="font-medium">{product.inventory_reserved}</span>
                                <span>reserved</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Deactivation Status */}
                        {isDeactivated && (
                          <div className="mb-2">
                            <Badge className="bg-red-500 text-white text-xs mb-1">
                              Deactivated by Admin
                            </Badge>
                            {productAppeal && (
                              <p className="text-xs font-medium" style={{
                                fontFamily: 'Poppins, sans-serif',
                                color: productAppeal.status === 'pending' ? '#FFA726' :
                                       productAppeal.status === 'under_review' ? '#42A5F5' :
                                       productAppeal.status === 'approved' ? '#4A7C59' : '#EF5350'
                              }}>
                                Appeal: {productAppeal.status === 'pending' ? 'Pending' :
                                        productAppeal.status === 'under_review' ? 'Under Review' :
                                        productAppeal.status === 'approved' ? 'Approved' : 'Rejected'}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200">
                      {!isDeactivated ? (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingProduct(product);
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-[#103C2E] bg-green-50 hover:bg-green-100 active:bg-green-100 rounded-lg transition-colors border border-green-200 touch-manipulation touch-target"
                            style={{ fontFamily: 'Poppins, sans-serif' }}
                          >
                            <Edit className="w-4 h-4 flex-shrink-0" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProduct(product._id!);
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 active:bg-red-100 rounded-lg transition-colors border border-red-200 touch-manipulation touch-target"
                            style={{ fontFamily: 'Poppins, sans-serif' }}
                          >
                            <Trash2 className="w-4 h-4 flex-shrink-0" />
                            <span>Delete</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/my-appeals?product=${product._id}&name=${encodeURIComponent(product.name)}`);
                          }}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-700 rounded-lg transition-colors touch-manipulation touch-target"
                          style={{ fontFamily: 'Poppins, sans-serif' }}
                        >
                          <FileText className="w-4 h-4 flex-shrink-0" />
                          <span>Appeal Deactivation</span>
                        </button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {/* Add/Edit Product Modal */}
        <AddEditProductModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setVerificationMessage(''); // Clear error when closing
          }}
          product={null}
          onSave={handleAddProduct}
          verificationError={verificationMessage}
        />

        <AddEditProductModal
          isOpen={!!editingProduct}
          onClose={() => {
            setEditingProduct(null);
            setVerificationMessage(''); // Clear error when closing
          }}
          product={editingProduct}
          onSave={handleEditProduct}
          verificationError={verificationMessage}
        />

        {/* Delete Confirmation Modal */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent className="sm:max-w-[425px] font-poppins">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-900">Delete Product</DialogTitle>
              <DialogDescription className="text-gray-600 pt-2 font-normal">
                Are you sure you want to delete this product? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setProductToDelete(null);
                }}
                className="border-gray-300 font-medium"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white font-medium"
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Success Dialog */}
        <SuccessDialog
          isOpen={showSuccessDialog}
          onClose={() => setShowSuccessDialog(false)}
          title={successMessage.title}
          message={successMessage.message}
        />
      </div>
    </div>
  );
}


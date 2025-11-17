'use client';

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Plus, Package, Edit, Trash2, FileText } from "lucide-react";
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
            <div className="hidden md:block">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 lg:gap-10 justify-items-center">
                {filteredProducts.map((product) => {
                  const productAppeal = appeals.find(
                    (appeal) => appeal.productId === product._id && appeal.type === 'listing_removal'
                  );
                  const isDeactivated = product.isActive === false && product.status !== 'Available';

                  return (
                    <div 
                      key={product._id}
                      onClick={() => router.push(`/product/${product._id}`)}
                      className={`relative w-full max-w-[280px] rounded-3xl border-2 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] cursor-pointer ${
                        isDeactivated ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'
                      }`}
                      style={{ height: '310px' }}
                    >
                      {/* Product Image */}
                      <div className="relative" style={{ height: '210px' }}>
                        {product.images && product.images.length > 0 ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-cover"
                            unoptimized={product.images[0].includes('digitaloceanspaces.com')}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <Package className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                        
                        {/* Deactivation Badge */}
                        {isDeactivated && (
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-red-100 text-red-800 text-xs">
                              Deactivated
                            </Badge>
                          </div>
                        )}

                        {/* Action Buttons */}
                        {!isDeactivated && (
                          <div className="absolute top-2 right-2 flex gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingProduct(product);
                              }}
                              className="p-1.5 bg-white/90 hover:bg-white rounded-full shadow-md transition-all"
                              title="Edit Product"
                            >
                              <Edit className="w-3.5 h-3.5 text-[#103C2E]" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteProduct(product._id!);
                              }}
                              className="p-1.5 bg-white/90 hover:bg-white rounded-full shadow-md transition-all"
                              title="Delete Product"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-600" />
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
                              className="w-full flex items-center justify-center gap-1 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded px-2 py-1 transition-colors"
                              title="Appeal this deactivation"
                            >
                              <FileText className="w-3 h-3" />
                              Appeal Deactivation
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="p-4" style={{ height: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <h3 className={`font-semibold text-sm line-clamp-2 mb-1 ${
                            isDeactivated ? 'text-red-800' : 'text-gray-900'
                          }`} style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {product.name}
                          </h3>
                          <p className={`text-lg font-bold ${
                            isDeactivated ? 'text-red-700' : 'text-[#103C2E]'
                          }`} style={{ fontFamily: 'Poppins, sans-serif' }}>
                            ₱{product.price.toFixed(2)}/{product.unit}
                          </p>
                        </div>
                        <div className="flex items-center justify-between text-xs" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          <div className="flex items-center gap-y-0 w-full mr-4">
                            <div className="flex items-center gap-1">
                              <span className="text-gray-600">Stock:</span>
                              <span className={`font-medium ${
                                isDeactivated ? 'text-red-600' : 'text-green-600'
                              }`}>
                                {product.inventory_available ?? product.stock}
                              </span>
                              {(product.inventory_reserved || 0) > 0 && (
                                <span className="text-gray-400 mx-2">•</span>
                              )}
                            </div>
                            {(product.inventory_reserved || 0) > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="text-yellow-600 font-medium">
                                  {product.inventory_reserved}
                                </span>
                                <span className="text-gray-600">reserved</span>
                              </div>
                            )}
                          </div>
                          <Badge className={`${getStatusColor(product.status || 'Available')} text-xs whitespace-nowrap flex-shrink-0`}>
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
            <div className="md:hidden space-y-4">
              {filteredProducts.map((product) => {
                const productAppeal = appeals.find(
                  (appeal) => appeal.productId === product._id && appeal.type === 'listing_removal'
                );
                const isDeactivated = product.isActive === false && product.status !== 'Available';

                return (
                  <Card 
                    key={product._id} 
                    className={`p-4 ${
                      isDeactivated ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Product Image */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {product.images && product.images.length > 0 ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                            unoptimized={product.images[0].includes('digitaloceanspaces.com')}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold text-base mb-1 line-clamp-1 ${
                          isDeactivated ? 'text-red-800' : 'text-gray-900'
                        }`}>
                          {product.name}
                        </h3>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-lg font-bold ${
                            isDeactivated ? 'text-red-700' : 'text-[#103C2E]'
                          }`}>
                            ₱{product.price.toFixed(2)}/{product.unit}
                          </span>
                          <Badge className={`${getStatusColor(product.status || 'Available')} text-xs`}>
                            {product.status || 'Available'}
                          </Badge>
                        </div>

                        <div className="text-sm text-gray-600">
                          <span>Stock: </span>
                          <span className={`font-medium ${
                            isDeactivated ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {product.inventory_available ?? product.stock}
                          </span>
                          {(product.inventory_reserved || 0) > 0 && (
                            <span className="text-yellow-600 ml-2">
                              • {product.inventory_reserved} reserved
                            </span>
                          )}
                        </div>

                        {/* Deactivation Status */}
                        {isDeactivated && (
                          <div className="mt-2">
                            <Badge className="bg-red-100 text-red-800 text-xs">
                              Deactivated by Admin
                            </Badge>
                            {productAppeal && (
                              <p className="text-xs mt-1 font-medium" style={{
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
                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                      {!isDeactivated ? (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingProduct(product);
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-[#103C2E] bg-green-50 hover:bg-green-100 active:bg-green-100 rounded-lg transition-colors border border-green-200 touch-manipulation"
                          >
                            <Edit className="w-4 h-4" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProduct(product._id!);
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 active:bg-red-100 rounded-lg transition-colors border border-red-200 touch-manipulation"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/my-appeals?product=${product._id}&name=${encodeURIComponent(product.name)}`);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-700 rounded-lg transition-colors touch-manipulation"
                        >
                          <FileText className="w-4 h-4" />
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


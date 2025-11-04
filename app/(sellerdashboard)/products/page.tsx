'use client';

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Plus, Package, Edit, Trash2, FileText } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import AddEditProductModal from "@/components/ui/AddEditProductModal";
import SuccessDialog from "@/components/ui/SuccessDialog";

interface ProductData {
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

// Type alias to avoid empty interface warning
type Product = ProductData;

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
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

  const fetchProducts = useCallback(async () => {
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
        const formattedProducts = (data.products || []).map((product: ProductData) => ({
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
    } catch {
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
  }, [retryCount]);

  useEffect(() => {
    fetchProducts();
    checkVerification();
  }, [fetchProducts]);

  const checkVerification = async () => {
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
    } catch {
      setIsVerified(false);
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
        const errorData = await response.json();
        // Check if it's a verification error
        if (response.status === 403 && (errorData.error === 'Insufficient permissions' || errorData.message?.includes('verification'))) {
          // Keep modal open and show error inline
          setVerificationMessage(errorData.message || 'You must be a verified seller to add products');
        } else {
          alert(errorData.error || errorData.message || 'Failed to create product');
        }
      }
    } catch {
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
        // Silently fail and close modal
        setEditingProduct(null);
        fetchProducts();
      }
    } catch {
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
    } catch {
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

  // Separate active and deactivated for rendering (currently not used in UI but kept for future features)
  // const activeProducts = filteredProducts.filter(product => product.isActive !== false);
  // const deactivatedProducts = filteredProducts.filter(product => product.isActive === false);

  const getStatusColor = (status: string) => {
    return status === 'Available' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  // Stock status helper (currently not used in UI but kept for future features)
  // const getStockStatus = (availableStock: number, lowStockAlert: number) => {
  //   if (availableStock === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800' };
  //   if (availableStock <= lowStockAlert) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
  //   return { label: 'In Stock', color: 'bg-green-100 text-green-800' };
  // };

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
            {/* Desktop Table View (hidden on mobile) */}
            <Card className="hidden md:block bg-white border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Image</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Price</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Stock</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredProducts.map((product) => {
                      // Show as deactivated only if isActive is false AND status is not Available
                      const isDeactivated = product.isActive === false && product.status !== 'Available';

                      return (
                        <tr key={product._id} className={`hover:bg-gray-50 transition-colors ${isDeactivated ? 'bg-red-50' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                            {product.images && product.images.length > 0 ? (
                              <Image
                                src={product.images[0]}
                                alt={product.name}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <p className="font-medium text-gray-900">{product.name}</p>
                            {isDeactivated && (
                              <div className="flex flex-col gap-1">
                                <Badge className="bg-red-100 text-red-800 w-fit">
                                  Deactivated by Admin
                                </Badge>
                                <button
                                  onClick={() => window.location.href = `/my-appeals?product=${product._id}&name=${encodeURIComponent(product.name)}`}
                                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors w-fit"
                                  title="Appeal this deactivation"
                                >
                                  <FileText className="w-3 h-3" />
                                  Appeal Deactivation
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-900">₱{product.price}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-900">
                            <p className="font-medium">{product.inventory_available ?? product.stock}</p>
                            {(product.inventory_reserved || 0) > 0 && (
                              <p className="text-xs text-yellow-600">
                                {product.inventory_reserved} reserved
                              </p>
                            )}
                            {(product.inventory_committed || 0) > 0 && (
                              <p className="text-xs text-blue-600">
                                {product.inventory_committed} committed
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={getStatusColor(product.status || 'Available')}>
                            {product.status || 'Available'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {!isDeactivated && (
                              <>
                                <button
                                  onClick={() => setEditingProduct(product)}
                                  className="p-2 text-[#103C2E] hover:bg-green-50 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(product._id!)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Mobile Card View (hidden on desktop) */}
            <div className="md:hidden space-y-3">
              {filteredProducts.map((product) => {
                // Show as deactivated only if isActive is false AND status is not Available
                const isDeactivated = product.isActive === false && product.status !== 'Available';

                return (
                  <Card key={product._id} className={`border border-gray-200 overflow-hidden ${isDeactivated ? 'bg-red-50 border-red-300' : 'bg-white'}`}>
                    <div className="p-3">
                      <div className="flex gap-3">
                        {/* Product Image */}
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {product.images && product.images.length > 0 ? (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              width={80}
                              height={80}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm sm:text-base text-gray-900 mb-1 line-clamp-2 break-words">
                            {product.name}
                          </h3>
                          {isDeactivated && (
                            <div className="flex flex-col gap-1 mb-1.5">
                              <Badge className="bg-red-100 text-red-800 w-fit text-[10px] sm:text-xs px-1.5 py-0.5">
                                Deactivated
                              </Badge>
                              <button
                                onClick={() => window.location.href = `/my-appeals?product=${product._id}&name=${encodeURIComponent(product.name)}`}
                                className="flex items-center gap-1 text-[10px] sm:text-xs text-blue-600 hover:text-blue-800 transition-colors w-fit"
                                title="Appeal this deactivation"
                              >
                                <FileText className="w-3 h-3" />
                                Appeal Deactivation
                              </button>
                            </div>
                          )}
                          <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                            <span className="text-base sm:text-lg font-bold text-[#103C2E]">₱{product.price}</span>
                            <Badge className={`${getStatusColor(product.status || 'Available')} text-[10px] sm:text-xs px-1.5 py-0.5`}>
                              {product.status || 'Available'}
                            </Badge>
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600 space-y-0.5">
                            <p className="break-words">Available: <span className="font-medium text-green-600">{product.inventory_available ?? product.stock}</span></p>
                            {(product.inventory_reserved || 0) > 0 && (
                              <p className="text-[10px] sm:text-xs text-yellow-600">Reserved: {product.inventory_reserved}</p>
                            )}
                            {(product.inventory_committed || 0) > 0 && (
                              <p className="text-[10px] sm:text-xs text-blue-600">Committed: {product.inventory_committed}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions - Only show for active products */}
                      {!isDeactivated && (
                        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                          <button
                            onClick={() => setEditingProduct(product)}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-[#103C2E] bg-green-50 hover:bg-green-100 active:bg-green-100 rounded-lg transition-colors font-medium touch-manipulation"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product._id!)}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 active:bg-red-100 rounded-lg transition-colors font-medium touch-manipulation"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
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

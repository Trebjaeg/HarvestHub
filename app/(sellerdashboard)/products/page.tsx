'use client';

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Plus, Package, Edit, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
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
  const [products, setProducts] = useState<Product[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [appealsLoading, setAppealsLoading] = useState(true);
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
      setAppealsLoading(true);
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
    } finally {
      setAppealsLoading(false);
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

  const getStockStatus = (stock: number, lowStockAlert: number) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    if (stock <= lowStockAlert) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'In Stock', color: 'bg-green-100 text-green-800' };
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-[#103C2E]" />
            <h1 className="text-2xl font-bold text-[#103C2E]">
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
            className="bg-[#103C2E] hover:bg-[#0d2e23] text-white" 
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>

        {/* Filters and Search */}
        <Card className="p-4 lg:p-6 mb-6 bg-white border border-gray-200">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 lg:gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 font-poppins w-full"
              />
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full lg:w-48 font-poppins">
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
              <SelectTrigger className="w-full lg:w-48 font-poppins">
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
          <Card className="p-12 text-center bg-white border border-gray-200">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No products found
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedCategory !== "all" || selectedStatus !== "all"
                ? "Try adjusting your filters"
                : "Get started by adding your first product"}
            </p>
            <Button 
              onClick={() => setShowAddModal(true)}
              className="bg-[#103C2E] hover:bg-[#0d2e23] text-white"
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
                      const productAppeal = appeals.find(
                        (appeal) => appeal.productId === product._id && appeal.type === 'listing_removal'
                      );
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
                                {productAppeal && (
                                  <span className="text-xs" style={{
                                    color: productAppeal.status === 'pending' ? '#FFA726' :
                                           productAppeal.status === 'under_review' ? '#42A5F5' :
                                           productAppeal.status === 'approved' ? '#4A7C59' : '#EF5350'
                                  }}>
                                    Appeal: {productAppeal.status === 'pending' ? 'Pending' :
                                            productAppeal.status === 'under_review' ? 'Under Review' :
                                            productAppeal.status === 'approved' ? 'Approved' : 'Rejected'}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-900">₱{product.price}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-900">{product.stock}</p>
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
            <div className="md:hidden space-y-4">
              {filteredProducts.map((product) => {
                const productAppeal = appeals.find(
                  (appeal) => appeal.productId === product._id && appeal.type === 'listing_removal'
                );
                // Show as deactivated only if isActive is false AND status is not Available
                const isDeactivated = product.isActive === false && product.status !== 'Available';

                return (
                  <Card key={product._id} className={`border border-gray-200 overflow-hidden ${isDeactivated ? 'bg-red-50 border-red-300' : 'bg-white'}`}>
                    <div className="p-4">
                      <div className="flex gap-4">
                        {/* Product Image */}
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
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
                              <Package className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 mb-1 truncate">
                            {product.name}
                          </h3>
                          {isDeactivated && (
                            <div className="flex flex-col gap-1 mb-2">
                              <Badge className="bg-red-100 text-red-800 w-fit text-xs">
                                Deactivated by Admin
                              </Badge>
                              {productAppeal && (
                                <span className="text-xs font-medium" style={{
                                  color: productAppeal.status === 'pending' ? '#FFA726' :
                                         productAppeal.status === 'under_review' ? '#42A5F5' :
                                         productAppeal.status === 'approved' ? '#4A7C59' : '#EF5350'
                                }}>
                                  Appeal: {productAppeal.status === 'pending' ? 'Pending' :
                                          productAppeal.status === 'under_review' ? 'Under Review' :
                                          productAppeal.status === 'approved' ? 'Approved' : 'Rejected'}
                                </span>
                              )}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg font-bold text-[#103C2E]">₱{product.price}</span>
                            <Badge className={getStatusColor(product.status || 'Available')}>
                              {product.status || 'Available'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            Stock: <span className="font-medium">{product.stock}</span>
                          </p>
                        </div>
                      </div>

                      {/* Actions - Only show for active products */}
                      {!isDeactivated && (
                        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                          <button
                            onClick={() => setEditingProduct(product)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-[#103C2E] bg-green-50 hover:bg-green-100 rounded-lg transition-colors font-medium"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product._id!)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-medium"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
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

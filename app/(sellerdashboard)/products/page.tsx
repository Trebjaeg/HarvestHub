'use client';

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Package, Edit, Trash2, Filter } from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";
import AddEditProductModal from "@/components/ui/AddEditProductModal";

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
    checkVerificationStatus();
  }, []);

  const checkVerificationStatus = async () => {
    try {
      const token = localStorage.getItem('hh_token') || localStorage.getItem('auth-token');
      const response = await fetch('/api/seller/verification/status', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        const verified = data.sellerStatus === 'verified';
        setIsVerified(verified);
        console.log('Verification status:', data.sellerStatus, 'isVerified:', verified);
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('hh_token') || localStorage.getItem('auth-token');
      const response = await fetch('/api/seller/products', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (response.ok) {
        const data = await response.json();
        // Convert harvestDate from Date to string for the modal
        const formattedProducts = (data.products || []).map((product: any) => ({
          ...product,
          harvestDate: product.harvestDate ? new Date(product.harvestDate).toISOString().split('T')[0] : undefined
        }));
        setProducts(formattedProducts);
      } else if (response.status === 403) {
        const error = await response.json();
        if (error.error === 'Insufficient permissions' || error.message?.includes('verification')) {
          // Don't show anything on page load - user will see error when trying to add/edit
          console.log('User needs verification to manage products');
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (product: Product) => {
    try {
      console.log('Attempting to create product:', product);
      const token = localStorage.getItem('hh_token') || localStorage.getItem('auth-token');
      const response = await fetch('/api/seller/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(product)
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Product created successfully:', data);
        // Refresh the products list
        fetchProducts();
        setShowAddModal(false);
      } else {
        const error = await response.json();
        console.error('Server error response:', error);
        // Check if it's a verification error
        if (response.status === 403 && (error.error === 'Insufficient permissions' || error.message?.includes('verification'))) {
          // Keep modal open and show error inline
          setVerificationMessage(error.message || 'You must be a verified seller to add products');
        } else {
          alert(error.error || error.message || 'Failed to create product');
        }
      }
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Failed to create product: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleEditProduct = async (product: Product) => {
    try {
      const token = localStorage.getItem('hh_token') || localStorage.getItem('auth-token');
      const response = await fetch(`/api/seller/products/${product._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(product)
      });

      if (response.ok) {
        const data = await response.json();
        // Refresh the products list
        fetchProducts();
        setEditingProduct(null);
      } else {
        const error = await response.json();
        // Check if it's a verification error
        if (response.status === 403 && (error.error === 'Insufficient permissions' || error.message?.includes('verification'))) {
          // Keep modal open and show error inline
          setVerificationMessage(error.message || 'You must be a verified seller to edit products');
        } else {
          alert(error.error || 'Failed to update product');
        }
      }
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update product');
    }
  };

  const handleDeleteProduct = async (productId: string | undefined) => {
    if (!productId) return;
    
    if (confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      try {
        const token = localStorage.getItem('hh_token') || localStorage.getItem('auth-token');
        const response = await fetch(`/api/seller/products/${productId}`, {
          method: 'DELETE',
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });

        if (response.ok) {
          // Refresh the products list
          fetchProducts();
        } else {
          const error = await response.json();
          // Check if it's a verification error
          if (response.status === 403 && (error.error === 'Insufficient permissions' || error.message?.includes('verification'))) {
            alert(error.message || 'You must be a verified seller to delete products. Please complete verification in your profile.');
          } else {
            alert(error.error || 'Failed to delete product');
          }
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product');
      }
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    const matchesStatus = selectedStatus === "all" || product.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

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
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-900 font-poppins">
              Products
            </h1>
          </div>
          <Button 
            onClick={() => {
              console.log('Add Product clicked, isVerified:', isVerified);
              if (!isVerified) {
                setVerificationMessage('You must complete seller verification to add products. Please verify your account in the Profile section.');
              } else {
                setVerificationMessage('');
              }
              setShowAddModal(true);
            }}
            className="bg-green-600 hover:bg-green-700 text-white font-poppins" 
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>

        {/* Filters and Search */}
        <Card className="p-6 mb-6 bg-white border border-gray-200">
          <div className="flex items-center gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search products by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 font-poppins"
              />
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48 font-poppins">
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
              <SelectTrigger className="w-48 font-poppins">
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

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array(8).fill(0).map((_, i) => (
              <Card key={i} className="p-4 bg-white border border-gray-200">
                <div className="w-full h-48 bg-gray-200 rounded-lg animate-pulse mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card className="p-12 text-center bg-white border border-gray-200">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2 font-poppins">
              No Products Found
            </h3>
            <p className="text-gray-600 mb-4 font-poppins">
              {searchTerm || selectedCategory !== "all" || selectedStatus !== "all" 
                ? "No products match your current filters." 
                : "You haven't added any products yet."}
            </p>
            <Button
              onClick={() => {
                console.log('Add Your First Product clicked, isVerified:', isVerified);
                if (!isVerified) {
                  setVerificationMessage('You must complete seller verification to add products. Please verify your account in the Profile section.');
                } else {
                  setVerificationMessage('');
                }
                setShowAddModal(true);
              }}
              className="bg-green-600 hover:bg-green-700 text-white font-poppins"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Product
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const stockStatus = getStockStatus(product.stock, product.lowStockAlert);
              
              return (
                <Card key={product._id} className="bg-white border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  {/* Product Image */}
                  <div className="relative w-full h-48 bg-gray-100">
                    {product.images.length > 0 ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 font-poppins">
                        {product.name}
                      </h3>
                      <div className="flex gap-1 ml-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (!isVerified) {
                              setVerificationMessage('Verified seller access required');
                            }
                            setEditingProduct(product);
                          }}
                          className="w-8 h-8 p-0"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteProduct(product._id)}
                          className="w-8 h-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-600 mb-2 font-poppins">
                      SKU: {product.category?.slice(0, 3).toUpperCase()}-{product._id?.slice(-4)} • {product.category}
                    </p>
                    
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-lg font-bold text-green-600 font-poppins">
                          ₱{product.price}
                        </span>
                        <span className="text-xs text-gray-500 font-poppins">/{product.unit}</span>
                      </div>
                      <Badge className={`${getStatusColor(product.status)} font-poppins`}>
                        {product.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 font-poppins">
                        Stock: {product.stock} {product.unit}
                      </span>
                      <Badge className={`${stockStatus.color} font-poppins`} variant="secondary">
                        {stockStatus.label}
                      </Badge>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
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
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuthUserData } from '../../hooks/useAuthUserData';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import AlertDialog from '../../components/ui/AlertDialog';

interface CartItem {
  _id: string;
  productId: string;
  productName: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  productImage?: string;
  unit: string;
  sellerId: string;
  sellerName: string;
  stock?: number; // Available stock
  isAvailable?: boolean; // Whether product still exists
}

interface SellerGroup {
  sellerId: string;
  sellerName: string;
  items: CartItem[];
  subtotal: number;
}

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated, cartCount: initialCartCount, notificationCount } = useAuthUserData();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<Set<string>>(new Set());
  const [removing, setRemoving] = useState<Set<string>>(new Set());
  const [cartShake, setCartShake] = useState(false);
  const [cartCount, setCartCount] = useState(initialCartCount);
  const [stockLimitReached, setStockLimitReached] = useState<Set<string>>(new Set());
  const [stockInfo, setStockInfo] = useState<Map<string, number>>(new Map()); // Store actual stock per item
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set()); // Track selected item IDs
  const [alertDialog, setAlertDialog] = useState({
    isOpen: false,
    title: '',
    message: ''
  });

  useEffect(() => {
    fetchCart();
  }, []);

  // Update cart count when initial value changes
  useEffect(() => {
    setCartCount(initialCartCount);
  }, [initialCartCount]);

  // Listen for cart update events (for shake animation)
  useEffect(() => {
    const handleCartUpdate = (event: any) => {
      setCartShake(true);
      setTimeout(() => setCartShake(false), 600);
      
      // Update cart count if provided in event
      if (event.detail?.count !== undefined) {
        setCartCount(event.detail.count);
      }
      
     // Also refresh cart items
      fetchCart();
    };
    
    window.addEventListener('cart-updated', handleCartUpdate);
    return () => window.removeEventListener('cart-updated', handleCartUpdate);
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cart', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setCartItems(data.items || []);
        setCartCount(data.count || 0); // Update cart count from API
        
        // Populate stock info from cart items
        const newStockInfo = new Map<string, number>();
        (data.items || []).forEach((item: CartItem) => {
          if (item.stock !== undefined) {
            newStockInfo.set(item._id, item.stock);
          }
        });
        setStockInfo(newStockInfo);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    // Find the current item to get its actual quantity
    const currentItem = cartItems.find(item => item._id === itemId);
    if (!currentItem) return;

    // Check if we have stock info and prevent going over
    const knownStock = stockInfo.get(itemId);
    if (knownStock !== undefined && newQuantity > knownStock) {
      // Don't even try to update if we know it exceeds stock
      // Just show the validation briefly
      setStockLimitReached(prev => new Set(prev).add(itemId));
      setTimeout(() => {
        setStockLimitReached(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      }, 3000);
      return;
    }

    // Optimistically update the UI immediately with recalculated totalPrice
    setCartItems(prevItems =>
      prevItems.map(item =>
        item._id === itemId 
          ? { 
              ...item, 
              quantity: newQuantity,
              totalPrice: item.pricePerUnit * newQuantity // Recalculate total price
            } 
          : item
      )
    );

    try {
      const response = await fetch('/api/cart/update', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, quantity: newQuantity })
      });

      const data = await response.json();

      if (!response.ok) {
        // Stock limit reached - revert to current quantity without refetching
        setCartItems(prevItems =>
          prevItems.map(item =>
            item._id === itemId 
              ? { 
                  ...item, 
                  quantity: currentItem.quantity,
                  totalPrice: item.pricePerUnit * currentItem.quantity
                } 
              : item
          )
        );
        
        // Store the actual available stock from API response
        if (data.availableStock !== undefined) {
          setStockInfo(prev => new Map(prev).set(itemId, data.availableStock));
        }
        
        // Show red border and validation message for stock limit
        setStockLimitReached(prev => new Set(prev).add(itemId));
        
        // Remove red border after 3 seconds
        setTimeout(() => {
          setStockLimitReached(prev => {
            const newSet = new Set(prev);
            newSet.delete(itemId);
            return newSet;
          });
        }, 3000);
      } else {
        // Clear any stock limit warning if successful
        setStockLimitReached(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      // Revert to previous quantity on network error
      setCartItems(prevItems =>
        prevItems.map(item =>
          item._id === itemId 
            ? { 
                ...item, 
                quantity: currentItem.quantity,
                totalPrice: item.pricePerUnit * currentItem.quantity
              } 
            : item
        )
      );
    }
  };

  const removeItem = async (itemId: string) => {
    setRemoving(prev => new Set(prev).add(itemId));

    // Optimistically remove item from UI and update count
    setCartItems(prevItems => prevItems.filter(item => item._id !== itemId));
    setCartCount(prevCount => Math.max(0, prevCount - 1));

    try {
      const response = await fetch('/api/cart/remove', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId })
      });

      if (!response.ok) {
        // Revert on error
        await fetchCart();
      }
    } catch (error) {
      console.error('Error removing item:', error);
      // Revert on error
      await fetchCart();
    } finally {
      setRemoving(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  // Group items by seller
  const groupedItems: SellerGroup[] = cartItems.reduce((acc: SellerGroup[], item) => {
    const existingGroup = acc.find(g => g.sellerId === item.sellerId);
    if (existingGroup) {
      existingGroup.items.push(item);
      existingGroup.subtotal += item.totalPrice;
    } else {
      acc.push({
        sellerId: item.sellerId,
        sellerName: item.sellerName,
        items: [item],
        subtotal: item.totalPrice
      });
    }
    return acc;
  }, []);

  // Only count available items in totals
  const availableItems = cartItems.filter(item => item.isAvailable !== false);
  const totalAmount = availableItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const shippingFee = availableItems.length > 0 ? 90 : 0;
  const totalWithShipping = totalAmount + shippingFee;

  // ==================== CHECKBOX LOGIC ====================
  
  // Get all item IDs
  const allItemIds = cartItems.map(item => item._id);
  
  // Get item IDs for a specific seller
  const getSellerItemIds = (sellerId: string): string[] => {
    return cartItems
      .filter(item => item.sellerId === sellerId)
      .map(item => item._id);
  };
  
  // Check if a specific item is selected
  const isItemSelected = (itemId: string): boolean => {
    return selectedItems.has(itemId);
  };
  
  // Check if all items from a seller are selected
  const areAllSellerItemsSelected = (sellerId: string): boolean => {
    const sellerItemIds = getSellerItemIds(sellerId);
    if (sellerItemIds.length === 0) return false;
    return sellerItemIds.every(id => selectedItems.has(id));
  };
  
  // Check if some (but not all) items from a seller are selected
  const areSomeSellerItemsSelected = (sellerId: string): boolean => {
    const sellerItemIds = getSellerItemIds(sellerId);
    const selectedCount = sellerItemIds.filter(id => selectedItems.has(id)).length;
    return selectedCount > 0 && selectedCount < sellerItemIds.length;
  };
  
  // Check if all items in cart are selected
  const areAllItemsSelected = (): boolean => {
    if (cartItems.length === 0) return false;
    return allItemIds.every(id => selectedItems.has(id));
  };
  
  // Check if some (but not all) items in cart are selected
  const areSomeItemsSelected = (): boolean => {
    const selectedCount = allItemIds.filter(id => selectedItems.has(id)).length;
    return selectedCount > 0 && selectedCount < allItemIds.length;
  };

  // ==================== CHECKBOX HANDLERS ====================
  
  // Toggle individual item selection
  const handleItemCheckboxChange = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };
  
  // Toggle all items from a seller
  const handleSellerCheckboxChange = (sellerId: string) => {
    const sellerItemIds = getSellerItemIds(sellerId);
    const allSelected = areAllSellerItemsSelected(sellerId);
    
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (allSelected) {
        // Unselect all items from this seller
        sellerItemIds.forEach(id => newSet.delete(id));
      } else {
        // Select all items from this seller
        sellerItemIds.forEach(id => newSet.add(id));
      }
      return newSet;
    });
  };
  
  // Toggle all items in cart
  const handleMasterCheckboxChange = () => {
    const allSelected = areAllItemsSelected();
    
    if (allSelected) {
      // Unselect all
      setSelectedItems(new Set());
    } else {
      // Select all available items only
      const availableItemIds = cartItems
        .filter(item => item.isAvailable !== false)
        .map(item => item._id);
      setSelectedItems(new Set(availableItemIds));
    }
  };

  // ==================== COMPUTED VALUES ====================
  
  const selectedSubtotal = cartItems
    .filter(item => selectedItems.has(item._id) && item.isAvailable !== false)
    .reduce((sum, item) => sum + item.totalPrice, 0);
  
  const selectedShippingFee = selectedItems.size > 0 ? shippingFee : 0;
  const selectedTotal = selectedSubtotal + selectedShippingFee;

  return (
    <div className="min-h-screen bg-[#F5F5F5]" style={{ fontFamily: 'Poppins, sans-serif' }}>
      {/* Header - Same as Home */}
      <header className="bg-[#103C2E] text-white py-3 md:py-4">
        <div className="container mx-auto px-4">
          {/* Mobile Header */}
          <div className="flex md:hidden items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/home">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </Link>
              <span className="text-lg font-bold">
                <span style={{ color: '#6CD75A' }}>Harvest</span>
                <span style={{ color: '#D4DB69' }}> Hub</span>
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <Link href="/my-profile" title="Profile">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              </Link>
              
              <button className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
                {notificationCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
              </button>
              
              <LanguageSwitcher variant="header" />
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/home">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </Link>
              <span className="text-2xl font-bold">
                <span style={{ color: '#6CD75A' }}>Harvest</span>
                <span style={{ color: '#D4DB69' }}> Hub</span>
                <span className="ml-3 text-lg">| Shopping Cart</span>
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <Link href="/my-profile" className="flex items-center space-x-2 hover:bg-white/10 px-3 py-2 rounded-lg transition-all" title="Profile">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
                <span className="text-sm font-medium">Profile</span>
              </Link>
              
              <button data-cart-icon className="relative hover:bg-white/10 px-3 py-2 rounded-lg transition-all flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${cartShake ? 'animate-shake' : ''}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                </svg>
                <span className="text-sm font-medium">Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </button>
              
              <button className="relative hover:bg-white/10 px-3 py-2 rounded-lg transition-all flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
                <span className="text-sm font-medium">Notifications</span>
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
              </button>
              
              <LanguageSwitcher variant="header" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm">
              {/* Product Header */}
              <div className="bg-[#4A7C59] text-white px-4 md:px-6 py-3 rounded-t-lg flex items-center">
                <input 
                  type="checkbox" 
                  checked={areAllItemsSelected()}
                  ref={(el) => {
                    if (el) {
                      el.indeterminate = areSomeItemsSelected();
                    }
                  }}
                  onChange={handleMasterCheckboxChange}
                  aria-label="Select all products"
                  className="w-4 h-4 md:w-5 md:h-5 rounded border-white mr-2 md:mr-3 cursor-pointer" 
                />
                <span className="font-medium text-sm md:text-base">Product (Select All)</span>
              </div>

              {loading ? (
                <div className="p-8 text-center text-gray-500">Loading cart...</div>
              ) : cartItems.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500 mb-4">Your cart is empty</p>
                  <Link href="/home" className="text-[#4A7C59] hover:underline">
                    Continue Shopping
                  </Link>
                </div>
              ) : (
                <>
                  {groupedItems.map((group) => (
                    <div key={group.sellerId} className="border-b last:border-b-0">
                      {/* Seller Name */}
                      <div className="px-4 md:px-6 py-3 bg-gray-50 flex items-center">
                        <input 
                          type="checkbox" 
                          checked={areAllSellerItemsSelected(group.sellerId)}
                          ref={(el) => {
                            if (el) {
                              el.indeterminate = areSomeSellerItemsSelected(group.sellerId);
                            }
                          }}
                          onChange={() => handleSellerCheckboxChange(group.sellerId)}
                          aria-label={`Select all products from ${group.sellerName}`}
                          className="w-4 h-4 md:w-5 md:h-5 rounded mr-2 md:mr-3 cursor-pointer" 
                        />
                        <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                        </svg>
                        <span className="font-medium text-gray-700 text-sm md:text-base">{group.sellerName}</span>
                      </div>

                      {/* Products */}
                      {group.items.map((item) => (
                        <div key={item._id} className={`p-4 md:px-6 md:py-4 border-t relative ${item.isAvailable === false ? 'opacity-60' : ''}`}>
                          {/* Unavailable Overlay */}
                          {item.isAvailable === false && (
                            <div className="absolute inset-0 bg-gray-900/10 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                              <div className="bg-white px-4 py-2 rounded-lg shadow-lg border-2 border-red-500">
                                <p className="text-red-600 font-semibold text-sm">Product Not Available</p>
                                <p className="text-xs text-gray-600 mt-1">This item has been removed by the seller</p>
                              </div>
                            </div>
                          )}
                          
                          {/* Mobile Layout */}
                          <div className="md:hidden">
                            <div className="flex gap-3 mb-3">
                              <input 
                                type="checkbox" 
                                checked={isItemSelected(item._id)}
                                onChange={() => handleItemCheckboxChange(item._id)}
                                aria-label={`Select ${item.productName}`}
                                disabled={item.isAvailable === false}
                                className={`w-5 h-5 rounded border-gray-300 mt-1 flex-shrink-0 ${item.isAvailable === false ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                              />
                              
                              {/* Product Image */}
                              <div className={`relative w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 ${item.isAvailable === false ? 'blur-sm' : ''}`}>
                                {item.productImage ? (
                                  <Image 
                                    src={item.productImage} 
                                    alt={item.productName}
                                    fill
                                    className="object-cover rounded-lg"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                )}
                              </div>

                              {/* Product Details */}
                              <div className={`flex-1 min-w-0 ${item.isAvailable === false ? 'blur-sm' : ''}`}>
                                <h3 className="font-medium text-gray-900 mb-1 text-sm line-clamp-2">{item.productName}</h3>
                                <p className="text-sm text-gray-500 mb-2">
                                  ₱{item.pricePerUnit.toFixed(2)}/{item.unit}
                                </p>
                                <p className="text-base font-semibold text-[#4A7C59]">₱{item.totalPrice.toFixed(2)}</p>
                              </div>

                              {/* Delete Button */}
                              <button
                                onClick={() => removeItem(item._id)}
                                disabled={removing.has(item._id)}
                                className="text-red-500 hover:text-red-700 disabled:opacity-50 self-start z-20 relative"
                                title={item.isAvailable === false ? 'Remove unavailable item' : 'Remove from cart'}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>

                            {/* Quantity Controls - Mobile */}
                            <div className={`flex flex-col items-end gap-1 ml-8 ${item.isAvailable === false ? 'opacity-30 pointer-events-none' : ''}`}>
                              <div className={`flex items-center border ${stockLimitReached.has(item._id) ? 'border-red-500' : 'border-gray-300'} rounded-lg transition-colors`}>
                                <button
                                  onClick={() => updateQuantity(item._id, item.quantity - 1)}
                                  disabled={item.quantity <= 1 || item.isAvailable === false}
                                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                                >
                                  −
                                </button>
                                <input
                                  type="number"
                                  value={item.quantity}
                                  disabled={item.isAvailable === false}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value) || 1;
                                    updateQuantity(item._id, value);
                                  }}
                                  className="w-12 text-center border-x border-gray-300 py-2 focus:outline-none text-base"
                                  min="1"
                                  max={stockInfo.get(item._id) || undefined}
                                />
                                <button
                                  onClick={() => updateQuantity(item._id, item.quantity + 1)}
                                  disabled={item.isAvailable === false || (stockInfo.has(item._id) && item.quantity >= (stockInfo.get(item._id) || 0))}
                                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                                  title={stockInfo.has(item._id) && item.quantity >= (stockInfo.get(item._id) || 0) 
                                    ? `Maximum stock available: ${stockInfo.get(item._id)} ${item.unit}` 
                                    : 'Add one more'}
                                >
                                  +
                                </button>
                              </div>
                              {/* Stock info hint */}
                              {stockInfo.has(item._id) && item.quantity >= (stockInfo.get(item._id) || 0) && (
                                <p className="text-xs text-gray-500">
                                  Max: {stockInfo.get(item._id)} {item.unit}
                                </p>
                              )}
                            </div>
                            
                            {/* Stock Limit Warning - Mobile */}
                            {stockLimitReached.has(item._id) && (
                              <div className="ml-8 mt-2">
                                <p className="text-xs text-red-500 font-medium">
                                  Stock limit reached - Only {stockInfo.get(item._id) || item.quantity} {item.unit} available from seller
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Desktop Layout */}
                          <div className="hidden md:flex items-center">
                            <input 
                              type="checkbox" 
                              checked={isItemSelected(item._id)}
                              onChange={() => handleItemCheckboxChange(item._id)}
                              aria-label={`Select ${item.productName}`}
                              disabled={item.isAvailable === false}
                              className={`w-5 h-5 rounded border-gray-300 mr-4 ${item.isAvailable === false ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                            />
                            
                            <div className="flex items-center flex-1">
                              {/* Product Image */}
                              <div className={`relative w-20 h-20 bg-gray-100 rounded-lg mr-4 flex-shrink-0 ${item.isAvailable === false ? 'blur-sm' : ''}`}>
                                {item.productImage ? (
                                  <Image 
                                    src={item.productImage} 
                                    alt={item.productName}
                                    fill
                                    className="object-cover rounded-lg"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                )}
                              </div>

                              {/* Product Details */}
                              <div className={`flex-1 ${item.isAvailable === false ? 'blur-sm' : ''}`}>
                                <h3 className="font-medium text-gray-900 mb-1">{item.productName}</h3>
                                <p className="text-sm text-gray-500">
                                  ₱{item.pricePerUnit.toFixed(2)}/{item.unit}
                                </p>
                                {/* Stock Limit Warning - Desktop */}
                                {stockLimitReached.has(item._id) && item.isAvailable !== false && (
                                  <p className="text-xs text-red-500 font-medium mt-1">
                                    Stock limit reached - Only {stockInfo.get(item._id) || item.quantity} {item.unit} available from seller
                                  </p>
                                )}
                              </div>

                              {/* Quantity Controls */}
                              <div className={`flex flex-col items-center ${item.isAvailable === false ? 'opacity-30 pointer-events-none' : ''}`}>
                                <div className={`flex items-center border ${stockLimitReached.has(item._id) ? 'border-red-500' : 'border-gray-300'} rounded-lg mx-4 transition-colors`}>
                                  <button
                                    onClick={() => updateQuantity(item._id, item.quantity - 1)}
                                    disabled={item.quantity <= 1 || item.isAvailable === false}
                                    className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    −
                                  </button>
                                  <input
                                    type="number"
                                    value={item.quantity}
                                    disabled={item.isAvailable === false}
                                    onChange={(e) => {
                                      const value = parseInt(e.target.value) || 1;
                                      updateQuantity(item._id, value);
                                    }}
                                    className="w-16 text-center border-x border-gray-300 py-1 focus:outline-none"
                                    min="1"
                                    max={stockInfo.get(item._id) || undefined}
                                  />
                                  <button
                                    onClick={() => updateQuantity(item._id, item.quantity + 1)}
                                    disabled={item.isAvailable === false || (stockInfo.has(item._id) && item.quantity >= (stockInfo.get(item._id) || 0))}
                                    className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title={stockInfo.has(item._id) && item.quantity >= (stockInfo.get(item._id) || 0) 
                                      ? `Maximum stock available: ${stockInfo.get(item._id)} ${item.unit}` 
                                      : 'Add one more'}
                                  >
                                    +
                                  </button>
                                </div>
                                {/* Stock info hint */}
                                {stockInfo.has(item._id) && item.quantity >= (stockInfo.get(item._id) || 0) && item.isAvailable !== false && (
                                  <p className="text-xs text-gray-500 mx-4 mt-1">
                                    Max: {stockInfo.get(item._id)} {item.unit}
                                  </p>
                                )}
                              </div>

                              {/* Price */}
                              <div className={`w-24 text-right mr-4 ${item.isAvailable === false ? 'blur-sm' : ''}`}>
                                <p className="font-semibold text-gray-900">₱{item.totalPrice.toFixed(2)}</p>
                              </div>

                              {/* Delete Button */}
                              <button
                                onClick={() => removeItem(item._id)}
                                disabled={removing.has(item._id)}
                                className="text-red-500 hover:text-red-700 disabled:opacity-50 z-20 relative"
                                title={item.isAvailable === false ? 'Remove unavailable item' : 'Remove from cart'}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Order Summary - Only show when cart has items */}
          {cartItems.length > 0 && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 md:sticky md:top-6">
                <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6">Order Summary</h2>
                
                {selectedItems.size > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-green-700">
                      <span className="font-semibold">{selectedItems.size}</span> item{selectedItems.size > 1 ? 's' : ''} selected
                    </p>
                  </div>
                )}
                
                <div className="space-y-3 mb-4 md:mb-6">
                  <div className="flex justify-between text-gray-700 text-sm md:text-base">
                    <span>Items {selectedItems.size > 0 && `(${selectedItems.size} selected)`}</span>
                    <span>{selectedItems.size > 0 ? selectedItems.size : cartItems.length}</span>
                  </div>
                  <div className="flex justify-between text-gray-700 text-sm md:text-base">
                    <span>Sub Total</span>
                    <span className="font-semibold">₱{selectedSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700 text-sm md:text-base">
                    <span>Shipping</span>
                    <span className="font-semibold">₱{selectedShippingFee.toFixed(2)}</span>
                  </div>
                </div>

                <div className="border-t pt-3 md:pt-4 mb-4 md:mb-6">
                  <div className="flex justify-between text-base md:text-lg font-bold">
                    <span>Total</span>
                    <span className="text-[#4A7C59]">₱{selectedTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Coupon/Discount */}
                <div className="mb-4 md:mb-6">
                  <div className="border border-gray-300 rounded-lg p-3 md:p-4 mb-3">
                    <input
                      type="text"
                      placeholder="Voucher Code"
                      className="w-full focus:outline-none text-sm"
                    />
                  </div>
                  <button className="w-full bg-[#4A7C59] hover:bg-[#3d6549] text-white py-2.5 md:py-3 rounded-lg font-medium transition-colors text-sm md:text-base">
                    Apply Voucher
                  </button>
                  <button className="w-full mt-2 text-[#4A7C59] hover:bg-green-50 py-2 rounded-lg font-medium transition-colors border border-[#4A7C59] text-sm md:text-base">
                    Select Voucher
                  </button>
                </div>

                {/* Checkout Button */}
                <button
                  disabled={cartItems.length === 0}
                  className="w-full bg-[#4A7C59] hover:bg-[#3d6549] text-white py-3 md:py-4 rounded-lg font-semibold text-base md:text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-white py-6 md:py-8 mt-6 md:mt-8">
        <div className="container mx-auto px-3 md:px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="text-center">
              <div className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 md:mb-3">
                <Image src="/images/benefits/farmer.png" alt="Farmer" width={48} height={48} />
              </div>
              <p className="text-xs md:text-sm text-gray-700 font-medium">Fast Delivery</p>
              <p className="text-xs text-gray-500 hidden md:block">Same day delivery available</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 md:mb-3">
                <Image src="/images/benefits/box.png" alt="Box" width={48} height={48} />
              </div>
              <p className="text-xs md:text-sm text-gray-700 font-medium">Live Order Updates</p>
              <p className="text-xs text-gray-500 hidden md:block">Track your order in real-time</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 md:mb-3">
                <Image src="/images/benefits/truck.png" alt="Truck" width={48} height={48} />
              </div>
              <p className="text-xs md:text-sm text-gray-700 font-medium">Easy Coordination</p>
              <p className="text-xs text-gray-500 hidden md:block">Direct communication with sellers</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 md:mb-3">
                <Image src="/images/benefits/sprout.png" alt="Sprout" width={48} height={48} />
              </div>
              <p className="text-xs md:text-sm text-gray-700 font-medium">Quality Guarantee</p>
              <p className="text-xs text-gray-500 hidden md:block">Fresh from local farms</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cart Shake Animation */}
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
          20%, 40%, 60%, 80% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.6s ease-in-out !important;
        }
      `}</style>

      {/* Alert Dialog */}
      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ isOpen: false, title: '', message: '' })}
        title={alertDialog.title}
        message={alertDialog.message}
      />
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { TrendingUp, Package, Star, ShoppingCart, Banknote, AlertTriangle } from "lucide-react";
import { useSellerStats, formatCurrency, getMonthName } from "@/hooks/useSellerReports";

const ReportPage = () => {
  const { stats, loading, error, refresh } = useSellerStats();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="bg-[#ECFDF5] mt-3 sm:mt-4 mb-3 sm:mb-4 mx-2 sm:mx-3 p-3 sm:p-4 rounded-lg shadow-gray-400 shadow-sm min-h-screen">
        <div className="flex items-center gap-2 mt-4 sm:mt-6 ml-1 sm:ml-2 mb-4 sm:mb-6">
          <h1 className="text-[#103C2E] font-bold text-xl sm:text-2xl lg:text-3xl ml-1" style={{ fontFamily: 'Poppins, sans-serif' }}>Reports</h1>
        </div>
        
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#ECFDF5] mt-3 sm:mt-4 mb-3 sm:mb-4 mx-2 sm:mx-3 p-3 sm:p-4 rounded-lg shadow-gray-400 shadow-sm min-h-screen">
        <div className="flex items-center gap-2 mt-4 sm:mt-6 ml-1 sm:ml-2 mb-4 sm:mb-6">
          <h1 className="text-[#103C2E] font-bold text-xl sm:text-2xl lg:text-3xl ml-1" style={{ fontFamily: 'Poppins, sans-serif' }}>Reports</h1>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="text-red-800 font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>Error Loading Reports</h3>
          </div>
          <p className="text-red-700 text-sm mt-2" style={{ fontFamily: 'Poppins, sans-serif' }}>{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="bg-[#ECFDF5] mt-3 sm:mt-4 mb-3 sm:mb-4 mx-2 sm:mx-3 p-3 sm:p-4 rounded-lg shadow-gray-400 shadow-sm min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 mt-4 sm:mt-6 ml-1 sm:ml-2">
          <h1 className="text-[#103C2E] font-bold text-xl sm:text-2xl lg:text-3xl ml-1" style={{ fontFamily: 'Poppins, sans-serif' }}>Reports</h1>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {formatCurrency(stats.overview.totalRevenue)}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Banknote className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="flex items-center mt-3 text-sm">
            <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
            <span className="text-green-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {formatCurrency(stats.recentActivity.recentRevenue)} this month
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>Total Orders</p>
              <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {stats.overview.totalOrders.toLocaleString()}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center mt-3 text-sm">
            <TrendingUp className="w-4 h-4 text-blue-600 mr-1" />
            <span className="text-blue-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {stats.recentActivity.recentOrders} this month
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>Total Products</p>
              <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {stats.overview.totalProducts}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="flex items-center mt-3 text-sm">
            {stats.products.lowStock > 0 ? (
              <>
                <AlertTriangle className="w-4 h-4 text-orange-600 mr-1" />
                <span className="text-orange-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {stats.products.lowStock} low stock
                </span>
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                <span className="text-green-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  All products in stock
                </span>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>Average Rating</p>
              <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {stats.overview.averageRating > 0 ? stats.overview.averageRating.toFixed(1) : 'No ratings yet'}
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="flex items-center mt-3 text-sm">
            {stats.overview.averageRating > 0 ? (
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= stats.overview.averageRating
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            ) : (
              <span className="text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Get your first review to see ratings
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Charts and Additional Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Order Status Breakdown */}
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Order Status
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.orderStats).map(([status, count]) => {
              const statusColors = {
                pending: 'bg-yellow-100 text-yellow-800',
                preparing: 'bg-blue-100 text-blue-800',
                shipped: 'bg-purple-100 text-purple-800',
                delivered: 'bg-green-100 text-green-800',
                completed: 'bg-gray-100 text-gray-800'
              };
              
              return (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${statusColors[status as keyof typeof statusColors]}`}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </div>
                  </div>
                  <span className="font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly Revenue Trend */}
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Monthly Revenue (Last 6 Months)
          </h3>
          <div className="space-y-3">
            {stats.monthlyRevenue.slice(-6).map((month, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {getMonthName(month._id.month)} {month._id.year}
                </span>
                <div className="text-right">
                  <div className="font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {formatCurrency(month.revenue)}
                  </div>
                  <div className="text-xs text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {month.orderCount} orders
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Selling Products */}
      <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Top Selling Products
        </h3>
        
        {stats.topProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-sm font-medium text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Product
                  </th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Units Sold
                  </th>
                  <th className="text-right py-2 text-sm font-medium text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.topProducts.map((product, index) => (
                  <tr key={product._id} className="border-b border-gray-100">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {product.productName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <span className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {product.totalSold}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <span className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {formatCurrency(product.totalRevenue)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
              No sales data available yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportPage;

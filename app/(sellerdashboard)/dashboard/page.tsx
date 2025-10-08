"use client";
import React, { useState, useEffect } from "react";
import {
  Search,
  Bell,
  Download,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import Image from "next/image";

// Type definitions
interface DashboardStats {
  totalProducts: number;
  pendingOrders: number;
  orderShipped: number;
  lowStockProducts: number;
}

interface RecendOrder {
  orderId: string;
  buyer: string;
  product: string;
  status: "Pending" | "Shipped" | "Delivered";
}

interface TopFarmer {
  id: string;
  name: string;
  avatar: string;
  rating: number;
}

interface ChartData {
  ordersByStatus: {
    delivered: number;
    pending: number;
    cancelled: number;
  };
  salesOverTime: Array<{
    time: string;
    amount: number;
  }>;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecendOrder[]>([]);
  const [topFarmers, setTopFarmers] = useState<TopFarmer[]>([]);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedPeriod, setSelectedPeriod] = useState("Today");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const periods = ["Today", "This Week", "This Month", "This Year"];

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Change when we have the actual API
        const [statsRes, ordersRes, farmersRes, chartRes] = await Promise.all([
          fetch("http://localhost:3000/api/dashboard/stats"),
          fetch("http://localhost:3000/api/dashboard/recent-orders"),
          fetch("http://localhost:3000/api/dashboard/top-farmers"),
          fetch("http://localhost:3000/api/dashboard/chart"),
        ]);

        const statsData = await statsRes.json();
        const ordersData = await ordersRes.json();
        const farmersData = await farmersRes.json();
        const chartData = await chartRes.json();

        setStats(statsData);
        setRecentOrders(ordersData);
        setTopFarmers(farmersData);
        setChartData(chartData);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  return (
    <div className="bg-[#ECFDF5] mt-4 mb-4 m-3 p-4 rounded-lg shadow-gray-400 shadow-sm">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between">
        {/* Search Bar */}
        <div className="flex items-center rounded-2xl px-4 py-1 w-full mr-3 border border-[#D0D0D0]">
          <Search size={25} className="mr-3" />
          <Input type="text" placeholder="Find Something here..." />
        </div>

        {/* Right Side - Notification and Export */}
        <div className="flex items-center space-x-4">
          {/* Notification Bell */}
          <button className="relative p-2 bg-[#43A047] rounded-full hover:bg-green-700 transition-colors">
            <Bell size={24} className="text-[#F5ECDE]" />
          </button>
          {/* Export Button */}
          <button className="flex items-center space-x-2 bg-[#43A047] hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
            <Download size={16} />
            <span className="font-medium">Export</span>
          </button>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="mb-6 mt-6">
        <div className="flex items-center justify-between mb-1">
          {/* Left side - Dashboard title */}
          <div className="flex items-center space-x-2">
            <Image
              src="/images/seller/Vector.png"
              alt="Dashboard Icon"
              width={24}
              height={24}
              className="mt-1"
            />
            <h1 className="text-2xl font-bold text-[#103C2E] font-poppins">
              Dashboard
            </h1>
          </div>

          {/* Right side - Period dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-2 bg-[#43A047] hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <span className="font-medium">{selectedPeriod}</span>
              <svg
                className={`w-4 h-4 transition-transform ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Dropdown menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                {periods.map((period) => (
                  <button
                    key={period}
                    onClick={() => {
                      setSelectedPeriod(period);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                      selectedPeriod === period
                        ? "bg-green-50 text-green-700 font-medium"
                        : "text-gray-700"
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <h1 className="text-[#103C2E] text-xl font-semibold">
          Hello, Farmer Warren!
        </h1>
        <p className="text-sm text-[#103C2E]">
          You have {stats?.pendingOrders || 0} pending orders and{" "}
          {stats?.lowStockProducts || 0} products running low on stock.
        </p>
      </div>

      {/* Stats Cards 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 rounded-3xl">
        <div className="flex items-center justify-between rounded-2xl bg-[#43A047] py-6 sm:py-8 px-2 shadow-gray-400 shadow-sm">
          <div className="text-white text-left pl-5">
            <p className="text-md font-medium">Total Products</p>
            <p className="text-2xl font-bold">{stats?.totalProducts || 0}</p>
          </div>
          <Image
            src="/images/seller/productIcon.png"
            alt="Product Icon"
            width={58}
            height={58}
            className="mr-5"
          />
        </div>

        {/* Stats Cards 2 */}
        <div className="flex items-center justify-between rounded-2xl bg-[#43A047] py-6 sm:py-8 px-2 shadow-gray-400 shadow-sm">
          <div className="text-white text-left pl-5">
            <p className="text-md font-medium">Pending Orders</p>
            <p className="text-2xl font-bold">{stats?.pendingOrders || 0}</p>
          </div>
          <Image
            src="/images/seller/pendingIcon.png"
            alt="Product Icon"
            width={58}
            height={58}
            className="mr-5"
          />
        </div>

        {/* Stats Cards 3 */}
        <div className="flex items-center justify-between rounded-2xl bg-[#43A047] py-6 sm:py-8 px-2 shadow-gray-400 shadow-sm">
          <div className="text-white text-left pl-5">
            <p className="text-md font-medium">Orders Shipped</p>
            <p className="text-2xl font-bold">{stats?.orderShipped || 0}</p>
          </div>
          <Image
            src="/images/seller/shipIcon.png"
            alt="Product Icon"
            width={58}
            height={58}
            className="mr-5"
          />
        </div>
      </div>

      {/* Recent Orders & Top Farmers */}
      <div className="flex gap-6 mb-6">
        {/* Recent Orders */}
        <div className="flex-1 bg-white p-4 rounded-xl shadow-gray-400 shadow-sm">
          <h3 className="text-lg font-bold mb-4 text-[#103C2E]">
            Recent Orders
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full inline-table table-auto">
              <thead>
                <tr className="border-b text-[#111827]">
                  <th className="text-left py-2 pr-15">Order ID</th>
                  <th className="text-left py-2 pr-5">Buyer</th>
                  <th className="text-left py-2 pr-5">Product</th>
                  <th className="text-left py-2 pr-5">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.orderId} className="border-b">
                    <td className="py-2">{order.orderId}</td>
                    <td className="py-2">{order.buyer}</td>
                    <td className="py-2">{order.product}</td>
                    <td className=" py-2 whitespace-nowrap ">
                      <span
                        className={`inline-block text-center w-[187px] px-10 py-2 rounded-lg text-md ${
                          order.status === "Delivered"
                            ? "bg-[#DCFCE7] text-[#15803D]"
                            : order.status === "Shipped"
                            ? "bg-[#DBEAFE] text-[#1D4ED8]"
                            : "bg-[#FEF9C3] text-[#CA8A04]"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Farmers */}
        <div className="w-95 bg-white p-6 rounded-lg shadow-gray-400 shadow-sm">
          <h3 className="text-lg font-bold mb-4 text-[#103C2E]">Top Farmers</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <tbody>
                {topFarmers.map((farmer) => (
                  <tr
                    key={farmer.id}
                    className="border-b border-gray-100 last:border-b-0"
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center space-x-3">
                        <Image
                          src={farmer.avatar}
                          alt={farmer.name}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <span className="font-medium text-gray-800">
                          {farmer.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end">
                        <span className="text-yellow-500 mr-1">⭐</span>
                        <span className="text-sm font-medium text-gray-700">
                          {farmer.rating}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="flex gap-6">
        {/* Orders by Status - Pie Chart */}
        <div className="w-150 bg-white p-6 rounded-lg shadow-gray-400 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Orders by Status</h3>
          {/* Add your pie chart component here */}
          <div className="h-64 flex items-center justify-center bg-gray-100 rounded">
            Pie Chart Component
          </div>
        </div>

        {/* Sales Over Time - Bar Chart */}
        <div className="flex-1 bg-white p-6 rounded-lg shadow-gray-400 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Sales Over Time</h3>
          {/* Add your bar chart component here */}
          <div className="h-64 flex items-center justify-center bg-gray-100 rounded">
            Bar Chart Component
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;

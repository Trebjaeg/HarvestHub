'use client';
import { Input } from "@/components/ui/input";
import { Search, ChevronDown } from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";

const Products = () => {
  const [selectedCategory, setSelectedCategory] = useState("By category");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("By status");
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  const categories = [
    "Leafy Greens",
    "Root Crops", 
    "Fruits",
    "Spices & Aromatics",
    "Eggplant & Gourds",
    "Grains & Rice"
  ];

  const status = [
    "Available",
    "Unavailable"
  ];

  return (
    <div className="bg-[#ECFDF5] mt-4 mb-4 m-3 p-4 rounded-lg shadow-gray-400 shadow-sm h-screen">
      <div className="flex items-center gap-2 mt-6 ml-2 mb-6">
        <Image
          src="/images/seller/packageIcon.png"
          alt="Product Image"
          width={38}
          height={38}
        />
        <h1 className="text-[#103C2E] font-bold text-3xl">Products</h1>
      </div>
      
      <div className="bg-[#FFFFFF] rounded-xl shadow-gray-400 shadow-sm p-6">
        {/* Top Controls - Search and Filters */}
        <div className="flex items-center justify-between gap-4 mb-6">
          {/* Search Bar */}
          <div className="flex items-center rounded-2xl px-4 py-1 flex-1 border border-[#D0D0D0]">
            <Search size={25} className="mr-3" />
            <Input type="text" placeholder="Find Something here..." className="border-none focus:ring-0" />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-3">
            {/* Category Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                className="flex items-center justify-between bg-white border border-[#D0D0D0] rounded-2xl px-4 py-2 min-w-[180px] hover:bg-gray-50 transition-colors"
              >
                <span className="text-gray-700 font-medium">{selectedCategory}</span>
                <ChevronDown 
                  size={18} 
                  className={`text-gray-400 ml-2 transition-transform ${
                    isCategoryDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Category Dropdown Menu */}
              {isCategoryDropdownOpen && (
                <div className="absolute right-0 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => {
                        setSelectedCategory(category);
                        setIsCategoryDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                        selectedCategory === category
                          ? "bg-green-50 text-green-700 font-medium"
                          : "text-gray-700"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Status Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                className="flex items-center justify-between bg-white border border-[#D0D0D0] rounded-2xl px-4 py-2 min-w-[140px] hover:bg-gray-50 transition-colors"
              >
                <span className="text-gray-700 font-medium">{selectedStatus}</span>
                <ChevronDown 
                  size={18} 
                  className={`text-gray-400 ml-2 transition-transform ${
                    isStatusDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Status Dropdown Menu */}
              {isStatusDropdownOpen && (
                <div className="absolute right-0 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  {status.map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setSelectedStatus(status);
                        setIsStatusDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                        selectedStatus === status
                          ? "bg-green-50 text-green-700 font-medium"
                          : "text-gray-700"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        <div className="mb-4 flex flex-wrap gap-2">
          {selectedCategory !== "By category" && selectedCategory !== "By Categories" && (
            <div className="inline-flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
              <span>Category: {selectedCategory}</span>
              <button 
                onClick={() => setSelectedCategory("By Categories")}
                className="ml-2 text-green-600 hover:text-green-800"
              >
                ✕
              </button>
            </div>
          )}
          
          {selectedStatus !== "By status" && (
            <div className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              <span>Status: {selectedStatus}</span>
              <button 
                onClick={() => setSelectedStatus("By status")}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Products Content Area */}
        <div className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Placeholder for products */}
            <div className="bg-gray-100 p-6 rounded-lg text-center text-gray-500 h-48 flex items-center justify-center">
              <div>
                <p className="font-medium">Products</p>
                <p className="text-sm">Category: {selectedCategory}</p>
                <p className="text-sm">Status: {selectedStatus}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Star,
  MessageSquare,
  HelpCircle,
  User,
  Home,
  ArrowLeft,
} from "lucide-react";
import Image from "next/image";

interface ProfileData {
  _id: string;
  name: string;
  email: string;
  profileImage?: string;
}

const menuItems = [
  {
    icon: Home,
    label: "Home",
    href: "/home",
    isExternal: true,
  },
  {
    icon: LayoutDashboard,
    label: "Profile",
    href: "/profile",
  },
  {
    icon: Package,
    label: "Products",
    href: "/products",
  },
  {
    icon: ShoppingCart,
    label: "Manage Orders",
    href: "/orders",
  },
  {
    icon: BarChart3,
    label: "Reports",
    href: "/reports",
  },
  {
    icon: Star,
    label: "Reviews & Ratings",
    href: "/reviews",
  },
  {
    icon: MessageSquare,
    label: "Message",
    href: "/message",
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('hh_token') || localStorage.getItem('auth-token');
      const response = await fetch('/api/seller/profile', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.seller);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultAvatar = (name: string) => {
    const initials = name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
    
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-purple-500',
      'bg-red-500',
      'bg-yellow-500',
      'bg-indigo-500',
      'bg-pink-500',
      'bg-teal-500'
    ];
    
    const colorIndex = name.length % colors.length;
    const bgColor = colors[colorIndex];
    
    return { initials, bgColor };
  };

  const handleLogout = async () => {
    try {
      // Call logout API to clear server-side session
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all client-side authentication data
      localStorage.removeItem('hh_token');
      localStorage.removeItem('auth-token');
      
      // Clear any other seller-related data
      localStorage.clear();
      
      // Redirect to auth page
      window.location.replace('/auth');
    }
  };

  return (
    <div className="w-64 bg-white shadow-lg border-r min-h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold text-gray-800 mb-6 text-center" style={{ fontFamily: 'Poppins, sans-serif' }}>
          <span className="text-green-600">Harvest</span>
          <span className="text-gray-800"> Hub</span>
        </h1>

        {/* User Profile */}
        <Link href="/profile" className="flex flex-col items-center mb-4 hover:bg-gray-50 rounded-lg p-3 transition-colors cursor-pointer">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
            {loading ? (
              <div className="w-full h-full bg-gray-200 animate-pulse"></div>
            ) : profile?.profileImage ? (
              <Image
                src={profile.profileImage}
                alt={profile.name}
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            ) : profile ? (
              <div className={`w-full h-full flex items-center justify-center text-white text-xl font-bold ${getDefaultAvatar(profile.name).bgColor}`}>
                {getDefaultAvatar(profile.name).initials}
              </div>
            ) : (
              <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                <User className="w-8 h-8 text-gray-500" />
              </div>
            )}
          </div>
          <h3 className="font-semibold text-gray-800 mt-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {loading ? 'Loading...' : profile?.name || 'Unknown User'}
          </h3>
          <p className="text-gray-600 text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Seller
          </p>
        </Link>
      </div>

      {/* Navigation Menu */}
      <nav className="p-4 flex-1">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const isHomeButton = item.label === "Home";

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors font-medium ${
                    isHomeButton
                      ? "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                      : isActive
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                  }`}
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  <Icon size={20} strokeWidth={isActive || isHomeButton ? 2.5 : 2}/>
                  <span>{item.label}</span>
                  {isHomeButton && (
                    <ArrowLeft size={16} className="ml-auto" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors font-medium"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M14 8v-2a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2 -2v-2" />
            <path d="M9 12h12l-3 -3" />
            <path d="M18 15l3 -3" />
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  ShoppingBag,
  Heart,
  MessageSquare,
  HelpCircle,
  Home,
  Menu,
  X,
} from "lucide-react";
import Image from "next/image";

interface ProfileData {
  _id: string;
  firstName: string;
  lastName: string;
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
    icon: User,
    label: "Profile",
    href: "/buyer-profile",
  },
  {
    icon: ShoppingBag,
    label: "My Orders",
    href: "/buyer-orders",
  },
  {
    icon: Heart,
    label: "Favorites",
    href: "/buyer-favorites",
  },
  {
    icon: MessageSquare,
    label: "Messages",
    href: "/messages",
  },
  {
    icon: HelpCircle,
    label: "Help Center",
    href: "/help",
    isExternal: true,
  },
];

export default function BuyerSidebar() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('hh_token') || localStorage.getItem('auth-token');
      const response = await fetch('/api/buyer/profile', {
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.buyer);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    console.log('🚪 [BUYER] Starting logout process...');
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('🚪 [BUYER] Logout API response:', response.status);
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem('hh_token');
        localStorage.removeItem('auth-token');
        localStorage.removeItem('userToken');
        localStorage.removeItem('user');
        localStorage.removeItem('auth_user');
        
        sessionStorage.clear();
        
        localStorage.setItem('logout-event', Date.now().toString());
        localStorage.removeItem('logout-event');
        
        console.log('🚪 [BUYER] Cleared all storage');
      }
      
    } catch (error) {
      console.error('🚪 [BUYER] Logout error:', error);
    } finally {
      console.log('🚪 [BUYER] Redirecting to auth page...');
      window.location.href = '/auth';
    }
  };

  const fullName = profile ? `${profile.firstName} ${profile.lastName}` : '';

  return (
    <>
      {/* Mobile Header - matches seller layout */}
      <div className="lg:hidden bg-white shadow-sm border-b px-4 py-3 flex items-center justify-between fixed top-0 left-0 right-0 z-30">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg text-gray-600 hover:bg-[#F5F5DC]"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Buyer Dashboard
            </h1>
            <p className="text-xs text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
              HarvestHub Buyer
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Mobile Profile Icon */}
          <Link
            href="/buyer-profile"
            className="p-2 rounded-lg text-gray-600 hover:bg-[#F5F5DC] transition-colors"
            title="Profile"
          >
            <User className="w-5 h-5" />
          </Link>
          
          {/* Mobile Home Button */}
          <Link
            href="/home"
            className="flex items-center space-x-1 px-3 py-2 rounded-lg border border-gray-200 hover:border-[#D2B48C] hover:bg-[#F5F5DC] text-gray-600 hover:text-[#8B7355] transition-colors"
          >
            <Home className="w-4 h-4" />
            <span className="text-sm font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>Home</span>
          </Link>
        </div>
      </div>

      {/* Mobile Overlay - with blur effect like seller */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 backdrop-blur-sm bg-white/20 z-40 top-0 left-0 w-full h-full"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static lg:translate-x-0 z-50 w-64 bg-white shadow-lg lg:shadow-sm border-r transition-transform duration-300 ease-in-out flex flex-col
        inset-y-0 left-0 lg:min-h-screen
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Mobile Sidebar Header - matches seller */}
        <div className="lg:hidden p-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Buyer Dashboard
              </h1>
              <p className="text-xs text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                HarvestHub Buyer
              </p>
            </div>
            
            {/* Close button for mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-lg text-gray-600 hover:bg-[#F5F5DC]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Desktop Header - only visible on desktop */}
        <div className="hidden lg:block p-6 border-b flex-shrink-0">
          <h1 className="text-xl font-bold text-gray-800 mb-6 text-center" style={{ fontFamily: 'Poppins, sans-serif' }}>
            <span className="text-green-600">Harvest</span>
            <span className="text-gray-800"> Hub</span>
          </h1>

          {/* User Profile */}
          <Link href="/buyer-profile" className="flex flex-col items-center mb-4 hover:bg-[#F5F5DC] rounded-lg p-3 transition-colors cursor-pointer">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
              {loading ? (
                <div className="w-full h-full bg-gray-200 animate-pulse"></div>
              ) : profile?.profileImage ? (
                <Image
                  src={profile.profileImage}
                  alt={fullName}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                  <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                  <path d="M12 10m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
                  <path d="M6.168 18.849a4 4 0 0 1 3.832 -2.849h4a4 4 0 0 1 3.834 2.855" />
                </svg>
              )}
            </div>
            <h3 className="font-semibold text-gray-800 mt-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {loading ? 'Loading...' : fullName || 'Unknown User'}
            </h3>
            <p className="text-gray-600 text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Buyer
            </p>
          </Link>
        </div>

      {/* Navigation Menu - with scrollable area */}
      <nav className="p-4 flex-1 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const isHomeButton = item.label === "Home";

            return (
              <li key={item.href} className={isHomeButton ? "hidden lg:block" : ""}>
                <Link
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors font-medium ${
                    isActive
                      ? "bg-[#F5F5DC] text-[#8B7355] border border-[#D2B48C]"
                      : "text-gray-600 hover:bg-[#F5F5DC] hover:text-[#8B7355]"
                  }`}
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2}/>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout Button - fixed at bottom, always visible */}
      <div className="p-4 border-t bg-white flex-shrink-0">
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
    </>
  );
}

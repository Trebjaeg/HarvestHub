"use client";

import React from "react";
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
} from "lucide-react";
import Image from "next/image";

const menuItems = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    href: "/dashboard",
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

  return (
    <div className="w-48 sm:w-56 md:w-64 bg-[#008236] min-h-screen text-white flex flex-col">
      {/* Header */}
      <div className="p-6">
        <h1 className="text-xl font-bold text-white mb-8">Harvest Hub</h1>

        {/* User Profile */}
        <div className="flex flex-col items-center mb-4">
          <div className="w-36 h-36 rounded-full border-5 overflow-hidden">
            <Image
              src="/images/FarmerPFP.png" // Add your image path
              alt="Wade Warren"
              width={144}
              height={144}
              className="w-full h-full object-cover"
            />
          </div>
          <h3 className="font-semibold text-[#F5ECDE]">Wade Warren</h3>
          <p className="text-[#F5ECDE] text-sm">Farmer</p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="px-4 mb-14">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors font-bold ${
                    isActive
                      ? "bg-[#F5ECDE] text-[#614124]"
                      : "text-[#F5ECDE] hover:bg-green-700 hover:text-[#F5ECDE]"
                  }`}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2}/>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Help Section */}
      <div className="p-6 pt-2 m-8 mt-2 bg-[#49ac72] rounded-3xl">
        <div className="flex items-center justify-center mb-2">
          <HelpCircle size={24} className="text-white" />
        </div>
        <h4 className="text-sm font-semibold text-center mb-1">Need Help?</h4>
        <p className="text-xs text-white text-center mb-3">
          Visit our Help Center for support
        </p>
        <button className="w-full bg-[#008236] hover:bg-green-800 text-white text-xs py-2 px-3 rounded transition-colors">
          Open Help Center
        </button>
        <div className="w-full h-24 rounded flex items-center justify-center mt-4 -mb-6">
          <Image
              src="/images/Contactus.png"
              alt="Contact Us"
              width={200}
              height={80}
              className="w-full h-full object-cover"
            />
          </div>
      </div>
    </div>
  );
}

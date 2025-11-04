"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import AddressManager from "@/components/AddressManager";

function BuyerAddresses() {
  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 lg:p-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
      <div className="max-w-6xl mx-auto">
        <AddressManager userRole="buyer" />
      </div>
    </div>
  );
}

export default function BuyerAddressesPage() {
  return (
    <ProtectedRoute>
      <BuyerAddresses />
    </ProtectedRoute>
  );
}

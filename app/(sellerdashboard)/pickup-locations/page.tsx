"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import AddressManager from "@/components/AddressManager";

function SellerPickupLocations() {
  return (
    <div className="min-h-screen bg-gray-50 p-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
      <div className="max-w-6xl mx-auto">
        <AddressManager userRole="seller" />
      </div>
    </div>
  );
}

export default function SellerPickupLocationsPage() {
  return (
    <ProtectedRoute allowedRoles={['seller', 'farmer']}>
      <SellerPickupLocations />
    </ProtectedRoute>
  );
}

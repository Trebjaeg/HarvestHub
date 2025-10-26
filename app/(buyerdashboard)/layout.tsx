'use client';

import BuyerSidebar from './sidebar'
import { ProtectedRoute } from '../../components/ProtectedRoute'
import SuspensionBanner from '@/components/SuspensionBanner'
import { useAuth } from '@/contexts/AuthContext'

export default function BuyerDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useAuth();
  const isSuspended = user?.status === 'suspended';

  return (
    <ProtectedRoute requiredRole="user">
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          <BuyerSidebar />
          <main className="flex-1 p-4 lg:p-6 pt-20 lg:pt-6 min-h-screen">
            {/* Show suspension banner if user is suspended */}
            {isSuspended && (
              <SuspensionBanner 
                reason={user.suspendReason}
                suspendedAt={user.suspendedAt}
                suspensionExpiresAt={user.suspensionExpiresAt}
              />
            )}
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}

import BuyerSidebar from './sidebar'
import { ProtectedRoute } from '../../components/ProtectedRoute'

export default function BuyerDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute requiredRole="user">
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          <BuyerSidebar />
          <main className="flex-1 p-4 lg:p-6 pt-20 lg:pt-6 min-h-screen">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}

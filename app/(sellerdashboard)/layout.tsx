import Sidebar from './sidebar'

export default function SellerDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 bg-[#008236]">
        {children}
      </main>
    </div>
  )
}
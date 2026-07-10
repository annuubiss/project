import { Topbar } from '@/components/dashboard/topbar'
import { SalesAnalytics } from '@/components/dashboard/sales-analytics'
import { StatCards } from '@/components/dashboard/stat-cards'
import { BusinessSummary } from '@/components/dashboard/business-summary'
import { RecentOrders } from '@/components/dashboard/recent-orders'
import { TopLists } from '@/components/dashboard/top-lists'
import { ActivityInventory } from '@/components/dashboard/activity-inventory'
import { WarehouseCard } from '@/components/dashboard/warehouse-card'

export default function DashboardPage() {
  return (
    <>
      <Topbar />
      <div className="space-y-6">
        <StatCards />
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]">
          <SalesAnalytics />
          <BusinessSummary />
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.45fr_340px]">
          <RecentOrders />
          <div className="space-y-6">
            <TopLists />
            <WarehouseCard />
            <ActivityInventory />
          </div>
        </div>
      </div>
    </>
  )
}

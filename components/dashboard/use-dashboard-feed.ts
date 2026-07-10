'use client'

import { useEffect, useState } from 'react'
import { PRODUCT_CATALOG_CHANGED } from '@/lib/erp/product-catalog'
import {
  ERP_DATA_CHANGED,
  getDashboardFeed,
  type DashboardFeed,
} from '@/lib/erp/erp-store'

const emptyFeed: DashboardFeed = {
  recentOrders: [],
  topProducts: [],
  topCategories: [],
  topCustomers: [],
  recentActivity: [],
  inventoryAlerts: [],
  warehouse: [],
}

export function useDashboardFeed() {
  const [feed, setFeed] = useState<DashboardFeed>(emptyFeed)

  useEffect(() => {
    const reload = () => setFeed(getDashboardFeed())

    reload()
    window.addEventListener(ERP_DATA_CHANGED, reload)
    window.addEventListener(PRODUCT_CATALOG_CHANGED, reload)
    window.addEventListener('storage', reload)

    return () => {
      window.removeEventListener(ERP_DATA_CHANGED, reload)
      window.removeEventListener(PRODUCT_CATALOG_CHANGED, reload)
      window.removeEventListener('storage', reload)
    }
  }, [])

  return feed
}

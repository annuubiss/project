'use client'

import { useEffect, useState } from 'react'
import { PRODUCT_CATALOG_CHANGED } from '@/lib/erp/product-catalog'
import {
  ERP_DATA_CHANGED,
  getDashboardSummary,
  type DashboardSummary,
} from '@/lib/erp/erp-store'

const emptySummary: DashboardSummary = {
  salesTotal: 0,
  paymentsTotal: 0,
  salesCount: 0,
  transactionCount: 0,
  soldQty: 0,
  stockValue: 0,
  lowStockCount: 0,
  outOfStockCount: 0,
  chartPoints: [],
  paymentSlices: [],
  latestTransactions: [],
}

export function useDashboardSummary() {
  const [summary, setSummary] = useState<DashboardSummary>(emptySummary)

  useEffect(() => {
    const reload = () => setSummary(getDashboardSummary())

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

  return summary
}

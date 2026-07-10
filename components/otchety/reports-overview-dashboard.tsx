'use client'

import { useEffect, useMemo, useState } from 'react'
import { ReportsGrid } from './reports-grid'
import {
  ERP_DATA_CHANGED,
  getClientReportSummary,
  getDashboardSummary,
  getFinanceReportSummary,
  getProductMovementSummary,
  readSales,
  readSellers,
  type ClientReportSummary,
  type DashboardSummary,
  type FinanceReportSummary,
  type ProductMovementSummary,
} from '@/lib/erp/erp-store'
import { PRODUCT_CATALOG_CHANGED, formatUZS } from '@/lib/erp/product-catalog'

const emptyDashboard: DashboardSummary = {
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

const emptyFinance: FinanceReportSummary = {
  incomeTotal: 0,
  expenseTotal: 0,
  netTotal: 0,
  salesIncomeTotal: 0,
  salesReturnTotal: 0,
  netSalesTotal: 0,
  retailSalesTotal: 0,
  wholesaleSalesTotal: 0,
  retailSalesCount: 0,
  wholesaleSalesCount: 0,
  returnSalesCount: 0,
  manualIncomeTotal: 0,
  transactionCount: 0,
  saleTransactionCount: 0,
  returnTransactionCount: 0,
  expenseTransactionCount: 0,
  methodBreakdown: [],
  returnMethodBreakdown: [],
  latestTransactions: [],
}

const emptyProducts: ProductMovementSummary = {
  productCount: 0,
  totalStock: 0,
  totalStockValue: 0,
  movementCount: 0,
  soldQty: 0,
  writeOffQty: 0,
  transferInQty: 0,
  transferOutQty: 0,
  adjustmentPlusQty: 0,
  adjustmentMinusQty: 0,
  latestMovements: [],
}

const emptyClients: ClientReportSummary = {
  clientCount: 0,
  buyersCount: 0,
  newClientsCount: 0,
  returningClientsCount: 0,
  clientSalesCount: 0,
  totalClientRevenue: 0,
  averageCheck: 0,
  averageRevenuePerClient: 0,
  topClients: [],
  latestClientSales: [],
}

export function ReportsOverviewDashboard() {
  const [dashboard, setDashboard] = useState<DashboardSummary>(emptyDashboard)
  const [finance, setFinance] = useState<FinanceReportSummary>(emptyFinance)
  const [products, setProducts] = useState<ProductMovementSummary>(emptyProducts)
  const [clients, setClients] = useState<ClientReportSummary>(emptyClients)
  const [sellerCount, setSellerCount] = useState(0)
  const [salesCount, setSalesCount] = useState(0)

  useEffect(() => {
    const load = () => {
      setDashboard(getDashboardSummary())
      setFinance(getFinanceReportSummary())
      setProducts(getProductMovementSummary())
      setClients(getClientReportSummary())
      setSellerCount(readSellers().length)
      setSalesCount(readSales().length)
    }

    load()
    window.addEventListener(ERP_DATA_CHANGED, load)
    window.addEventListener(PRODUCT_CATALOG_CHANGED, load)
    window.addEventListener('storage', load)

    return () => {
      window.removeEventListener(ERP_DATA_CHANGED, load)
      window.removeEventListener(PRODUCT_CATALOG_CHANGED, load)
      window.removeEventListener('storage', load)
    }
  }, [])

  const cards = useMemo(
    () => [
      {
        title: 'Магазин',
        dot: 'blue' as const,
        href: '/otchety/magazin',
        description: `Продаж: ${salesCount}. Выручка: ${formatUZS(dashboard.salesTotal)} UZS. Товаров продано: ${dashboard.soldQty} ед.`,
      },
      {
        title: 'Финансы',
        dot: 'teal' as const,
        href: '/otchety/finansy',
        description: `Доходы: ${formatUZS(finance.incomeTotal)} UZS. Расходы: ${formatUZS(finance.expenseTotal)} UZS. Чистый результат: ${formatUZS(finance.netTotal)} UZS.`,
      },
      {
        title: 'Товары',
        dot: 'green' as const,
        href: '/otchety/tovary',
        description: `SKU: ${products.productCount}. Остаток: ${products.totalStock} ед. Стоимость склада: ${formatUZS(products.totalStockValue)} UZS.`,
      },
      {
        title: 'Клиенты',
        dot: 'yellow' as const,
        href: '/otchety/klienty',
        description: `Клиентов: ${clients.clientCount}. Покупали: ${clients.buyersCount}. Выручка по клиентам: ${formatUZS(clients.totalClientRevenue)} UZS.`,
      },
      {
        title: 'Продавцы',
        dot: 'purple' as const,
        href: '/otchety/prodavcy',
        description: `Активных продавцов: ${sellerCount}. Продаж в системе: ${dashboard.salesCount}. Средний чек: ${formatUZS(Math.round(dashboard.salesCount > 0 ? dashboard.salesTotal / dashboard.salesCount : 0))} UZS.`,
      },
    ],
    [clients, dashboard, finance, products, salesCount, sellerCount],
  )

  return <ReportsGrid title="Отчеты" cards={cards} />
}

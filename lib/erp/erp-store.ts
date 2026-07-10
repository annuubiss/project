import {
  PRODUCT_CATALOG_CHANGED,
  formatUZS,
  readProducts,
  writeProducts,
  type CatalogProduct,
} from './product-catalog'

export type ErpSaleLine = {
  productId: string
  name: string
  sku: string
  barcode: string
  qty: number
  unitPrice: number
  total: number
  priceType?: 'retail' | 'wholesale'
}

export type ErpSalePayment = {
  id: string
  methodId: string
  label: string
  amount: number
}

export type ErpSale = {
  id: string
  type: 'sale' | 'return' | 'exchange'
  saleChannel?: 'retail' | 'wholesale'
  sourceSaleId?: string
  createdAt: string
  client: string | null
  seller: string
  store: string
  subtotal: number
  discount: number
  total: number
  lines: ErpSaleLine[]
  payments: ErpSalePayment[]
  note?: string
  cancelled?: boolean
  cancelledAt?: string
  cancellationReason?: string
  changeHistory?: ErpSaleChangeLog[]
}

export type ErpSaleChangeLog = {
  id: string
  createdAt: string
  changedBy: string
  changeType: 'cancel' | 'note' | 'client' | 'discount'
  description: string
  details?: Record<string, unknown>
}

export type ErpClient = {
  id: string
  name: string
  phone: string
  card?: string
  group: string
  tags: string[]
  birthday: string
  gender: 'male' | 'female'
  createdAt: string
  updatedAt: string
}

export type ErpDebtPayment = {
  id: string
  createdAt: string
  amount: number
  methodId: string
  methodLabel: string
  account: string
  cashier: string
}

export type ErpDebt = {
  id: string
  saleId: string
  clientId: string | null
  clientName: string
  clientPhone: string
  store: string
  cashier: string
  createdAt: string
  dueDate: string
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  status: 'overdue' | 'unpaid' | 'partial' | 'paid'
  payments: ErpDebtPayment[]
}

export type ErpFinanceCategoryType = 'income' | 'expense'

export type ErpFinanceCategory = {
  id: string
  name: string
  type: ErpFinanceCategoryType
  status: 'active' | 'deleted'
  parentId: string | null
  createdAt: string
  updatedAt: string
}

export type ErpFinanceTransaction = {
  id: string
  createdAt: string
  operationDate: string
  operation: string
  kind: 'cashflow' | 'profit_loss' | 'through'
  amount: number
  currency: 'UZS' | 'USD'
  account: string
  method: string
  sourceType:
    | 'sale'
    | 'income'
    | 'expense'
    | 'transfer'
    | 'conversion'
    | 'supplier_payment'
  sourceId?: string
}

export type ErpFinanceShift = {
  id: string
  createdAt: string
  account: string
  sentAmount: number
  receivedAmount: number
  status: 'accepted' | 'pending'
  cashier: string
  receivedBy: string
}

export type ErpFinanceTransfer = {
  id: string
  createdAt: string
  fromAccount: string
  toAccount: string
  amount: number
  method: string
  status: 'accepted' | 'pending'
  cashier: string
  receivedBy: string
}

export type ErpFinanceConversion = {
  id: string
  createdAt: string
  fromAccount: string
  toAccount: string
  fromAmount: number
  toAmount: number
  method: string
  status: 'accepted' | 'pending'
  cashier: string
  receivedBy: string
}

export type ErpCashShift = {
  id: string
  cashier: string
  store: string
  registerId: string | null
  openedAt: string
  closedAt: string | null
  openingCash: number
  status: 'open' | 'closed'
  actualByMethod: Record<string, number>
}

export type CashShiftPaymentLine = {
  method: string
  expected: number
  actual: number | null
}

export type CashShiftSummaryRow = ErpCashShift & {
  salesCount: number
  salesTotal: number
  pay: CashShiftPaymentLine[]
}

export type ErpWarehouse = {
  id: string
  name: string
}

export type ErpEmployee = {
  id: string
  name: string
  phone: string
  role: string
  status: 'active' | 'blocked' | 'deleted'
  createdAt: string
}

export type ErpPermissionKey =
  | 'dashboard.view'
  | 'products.manage'
  | 'sales.manage'
  | 'clients.manage'
  | 'finance.manage'
  | 'reports.view'
  | 'settings.manage'
  | 'users.manage'

export type ErpRole = {
  id: string
  name: string
  description: string
  permissions: ErpPermissionKey[]
  status: 'active' | 'deleted'
  createdAt: string
  updatedAt: string
}

export type SellerStatus = 'online' | 'busy' | 'away' | 'offline'

export type ErpSeller = {
  id: string
  name: string
  status: SellerStatus
}

export type ErpInventoryMovementType =
  | 'sale'
  | 'sale_return'
  | 'writeoff'
  | 'transfer_in'
  | 'transfer_out'
  | 'supplier_return'
  | 'inventory_adjustment'
  | 'manual'

export type ErpInventoryMovement = {
  id: string
  createdAt: string
  productId: string
  productName: string
  warehouseId: string
  warehouseName: string
  type: ErpInventoryMovementType
  qty: number
  beforeQty: number
  afterQty: number
  reason?: string
  sourceId?: string
}

export type ErpInventoryDocument = {
  id: string
  name: string
  warehouseId: string
  warehouseName: string
  type: 'full' | 'partial'
  status: 'in_progress' | 'completed'
  createdAt: string
  completedAt?: string
  counts: Record<string, number>
}

export type ProductMovementSummary = {
  productCount: number
  totalStock: number
  totalStockValue: number
  movementCount: number
  soldQty: number
  writeOffQty: number
  transferInQty: number
  transferOutQty: number
  adjustmentPlusQty: number
  adjustmentMinusQty: number
  latestMovements: ErpInventoryMovement[]
}

export type DashboardChartPoint = {
  label: string
  total: number
  count: number
}

export type DashboardPaymentSlice = {
  label: string
  amount: number
}

export type DashboardSummary = {
  salesTotal: number
  paymentsTotal: number
  salesCount: number
  transactionCount: number
  soldQty: number
  stockValue: number
  lowStockCount: number
  outOfStockCount: number
  chartPoints: DashboardChartPoint[]
  paymentSlices: DashboardPaymentSlice[]
  latestTransactions: ErpFinanceTransaction[]
}

export type FinanceReportMethodBreakdown = {
  method: string
  income: number
  expense: number
}

export type FinanceReturnMethodBreakdown = {
  method: string
  amount: number
  count: number
}

export type FinanceReportSummary = {
  incomeTotal: number
  expenseTotal: number
  netTotal: number
  salesIncomeTotal: number
  salesReturnTotal: number
  netSalesTotal: number
  retailSalesTotal: number
  wholesaleSalesTotal: number
  retailSalesCount: number
  wholesaleSalesCount: number
  returnSalesCount: number
  manualIncomeTotal: number
  transactionCount: number
  saleTransactionCount: number
  returnTransactionCount: number
  expenseTransactionCount: number
  methodBreakdown: FinanceReportMethodBreakdown[]
  returnMethodBreakdown: FinanceReturnMethodBreakdown[]
  latestTransactions: ErpFinanceTransaction[]
}

export type FinanceAccountBalance = {
  currency: 'UZS' | 'USD'
  balance: number
  frozen: number
}

export type FinanceAccountRow = {
  id: string
  name: string
  cash: FinanceAccountBalance
  cashless: FinanceAccountBalance
}

export type FinanceAccountsSummary = {
  totalCash: number
  totalCashless: number
  rows: FinanceAccountRow[]
}

export type FinanceAccountActivity = {
  id: string
  createdAt: string
  operation: string
  method: string
  amount: number
  currency: 'UZS' | 'USD'
  channel: 'cash' | 'cashless'
  sourceType: ErpFinanceTransaction['sourceType']
}

export type FinanceAccountDetails = {
  accountId: string
  accountName: string
  turnoverIn: number
  turnoverOut: number
  transactionCount: number
  lastActivityAt: string | null
  activities: FinanceAccountActivity[]
}

export type ErpCashRegister = {
  id: string
  name: string
  store: string
  channel: 'cash' | 'cashless'
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export type ErpPaymentMethodSetting = {
  id: string
  label: string
  hotkey: string
  channel: 'cash' | 'cashless' | 'credit' | 'mixed'
  registerId: string | null
  allowInPos: boolean
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export type ErpCurrencySetting = {
  code: 'UZS' | 'USD'
  name: string
  symbol: string
  rate: number
  isBase: boolean
  status: 'active' | 'inactive'
  updatedAt: string
}

export type ErpSupplier = {
  id: string
  name: string
  phone: string
  email: string
  address: string
  contactPerson: string
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export type ErpPurchaseOrderLine = {
  productId: string
  productName: string
  sku: string
  barcode: string
  orderedQty: number
  receivedQty: number
  costUsd: number
  markupPercent: number
  salePrice: number
}

export type ErpPurchaseOrder = {
  id: string
  name: string
  supplierId: string
  supplierName: string
  store: string
  status: 'draft' | 'ordered' | 'partial' | 'received' | 'paid' | 'cancelled'
  createdAt: string
  expectedDate: string
  paidUsd: number
  totalUsd: number
  lines: ErpPurchaseOrderLine[]
}

export type ErpSupplierPaymentAllocation = {
  orderId: string
  orderName: string
  amountUsd: number
}

export type ErpSupplierPayment = {
  id: string
  supplierId: string
  supplierName: string
  createdAt: string
  amountUsd: number
  preferredOrderId: string | null
  methodId: string
  methodLabel: string
  account: string
  cashier: string
  note: string
  creditUsd: number
  allocations: ErpSupplierPaymentAllocation[]
}

export type ErpPurchaseReturnLine = {
  productId: string
  productName: string
  qty: number
}

export type ErpPurchaseReturn = {
  id: string
  orderId: string
  orderName: string
  supplierId: string
  supplierName: string
  createdAt: string
  reason: string
  lines: ErpPurchaseReturnLine[]
}

export type ErpRevaluationLine = {
  productId: string
  productName: string
  sku: string
  oldPrice: number
  newPrice: number
  qty: number
}

export type ErpRevaluation = {
  id: string
  name: string
  store: string
  type: 'retail' | 'wholesale' | 'cost' | 'rate'
  status: 'new' | 'done'
  createdAt: string
  finishedAt?: string
  createdBy: string
  finishedBy?: string
  lines: ErpRevaluationLine[]
}

export type SupplierSummaryRow = {
  id: string
  name: string
  debtUsd: number
  ordersUsd: number
  paymentsUsd: number
  items: number
  phone: string
}

export type ClientSummaryRow = {
  id: string
  name: string
  phone: string
  card: string
  group: string
  tags: string[]
  totalSpent: number
  purchaseCount: number
  lastPurchaseAt: string | null
  birthday: string
}

export type ClientReportSummary = {
  clientCount: number
  buyersCount: number
  newClientsCount: number
  returningClientsCount: number
  clientSalesCount: number
  totalClientRevenue: number
  averageCheck: number
  averageRevenuePerClient: number
  topClients: ClientSummaryRow[]
  latestClientSales: ErpSale[]
}

export type DebtSummary = {
  totalDebtAmount: number
  totalPaidAmount: number
  totalRemainingAmount: number
  debtorCount: number
  overdueCount: number
  unpaidCount: number
  partialCount: number
  paidCount: number
  debts: ErpDebt[]
}

export type FinanceCategoryTreeItem = ErpFinanceCategory & {
  children: ErpFinanceCategory[]
}

export type DashboardRecentOrder = {
  id: string
  customer: string
  initials: string
  products: string
  status: 'Completed' | 'Processing' | 'Shipped' | 'Cancelled'
  payment: 'Paid' | 'Pending' | 'Failed'
  date: string
  amount: string
}

export type DashboardTopProduct = {
  name: string
  sold: number
  revenue: string
  trend: number
}

export type DashboardTopCategory = {
  name: string
  share: number
}

export type DashboardTopCustomer = {
  name: string
  spend: string
  orders: number
  initials: string
}

export type DashboardActivityItem = {
  text: string
  time: string
  type: 'order' | 'payment' | 'alert' | 'user' | 'invoice'
}

export type DashboardInventoryAlert = {
  name: string
  level: number
  status: 'low' | 'critical' | 'out'
}

export type DashboardWarehouseItem = {
  label: string
  value: number
  tone: 'success' | 'primary' | 'warning' | 'danger'
}

export type DashboardFeed = {
  recentOrders: DashboardRecentOrder[]
  topProducts: DashboardTopProduct[]
  topCategories: DashboardTopCategory[]
  topCustomers: DashboardTopCustomer[]
  recentActivity: DashboardActivityItem[]
  inventoryAlerts: DashboardInventoryAlert[]
  warehouse: DashboardWarehouseItem[]
}

type WarehouseStocks = Record<string, Record<string, number>>

type InventoryChange = {
  productId: string
  warehouseId?: string
  delta: number
  type: ErpInventoryMovementType
  reason?: string
  sourceId?: string
}

type SaleDraft = {
  orderNumber: string
  client: string | null
  seller: string
  store?: string
  saleChannel?: 'retail' | 'wholesale'
  subtotal: number
  discount: number
  total: number
  lines: {
    product: CatalogProduct
    qty: number
    unitPrice?: number
    priceType?: 'retail' | 'wholesale'
  }[]
  payments: ErpSalePayment[]
  note?: string
}

type ManualFinanceDraft = {
  type: 'income' | 'expense' | 'transfer' | 'conversion'
  amount: number
  account: string
  method: string
  category?: string
  reason?: string
}

const defaultFinanceCategories: Array<{
  name: string
  type: ErpFinanceCategoryType
  status: 'active' | 'deleted'
  parentName: string | null
}> = [
  { name: 'Доход', type: 'income', status: 'active', parentName: null },
  { name: 'Автодоход разницы при закрытии кассы', type: 'income', status: 'active', parentName: null },
  { name: 'Автосписание разницы при закрытии кассы', type: 'expense', status: 'active', parentName: null },
  { name: 'Возврат заказа', type: 'income', status: 'active', parentName: null },
  { name: 'Возврат продажи', type: 'income', status: 'active', parentName: null },
  { name: 'Закупка товара', type: 'expense', status: 'active', parentName: null },
  { name: 'Общепроизводственные расходы', type: 'expense', status: 'active', parentName: null },
  { name: 'Аренда помещения', type: 'expense', status: 'active', parentName: 'Общепроизводственные расходы' },
  { name: 'Коммунальные услуги', type: 'expense', status: 'active', parentName: 'Общепроизводственные расходы' },
  { name: 'Операционные расходы', type: 'expense', status: 'active', parentName: null },
  { name: 'Зарплата сотрудников', type: 'expense', status: 'active', parentName: 'Операционные расходы' },
  { name: 'Реклама и маркетинг', type: 'expense', status: 'active', parentName: 'Операционные расходы' },
  { name: 'Прочие расходы', type: 'expense', status: 'active', parentName: null },
  { name: 'Инкассация', type: 'income', status: 'deleted', parentName: null },
  { name: 'Тестовая категория', type: 'expense', status: 'deleted', parentName: null },
]

const defaultCashRegisters: Array<Pick<
  ErpCashRegister,
  'name' | 'store' | 'channel' | 'status'
>> = [
  { name: 'Касса Магазин', store: 'Магазин', channel: 'cash', status: 'active' },
  { name: 'Безналичный счет', store: 'Магазин', channel: 'cashless', status: 'active' },
]

const defaultCurrencySettings: ErpCurrencySetting[] = [
  { code: 'UZS', name: 'Узбекский сум', symbol: 'UZS', rate: 1, isBase: true, status: 'active', updatedAt: new Date().toISOString() },
  { code: 'USD', name: 'Доллар США', symbol: 'USD', rate: 12600, isBase: false, status: 'active', updatedAt: new Date().toISOString() },
]

const defaultSuppliers: Array<Omit<ErpSupplier, 'id' | 'createdAt' | 'updatedAt'>> = [
  {
    name: 'Основной поставщик',
    phone: '+998 90 123 45 67',
    email: 'supplier@kitchen.uz',
    address: 'Узбекистан',
    contactPerson: 'Ответственный менеджер',
    status: 'active',
  },
]

const EMPLOYEES_KEY = 'erp.employees.v1'
const ROLES_KEY = 'erp.roles.v1'

const defaultEmployees: Array<Omit<ErpEmployee, 'id' | 'createdAt'>> = [
  { name: 'Исломали Нурматов', phone: '+998901234567', role: 'Администратор', status: 'active' },
  { name: 'Алишер Каримов', phone: '+998901234568', role: 'Продавец', status: 'active' },
  { name: 'Мадина Рахимова', phone: '+998901234569', role: 'Старший продавец', status: 'active' },
  { name: 'Бахтиёр Холматов', phone: '+998901234570', role: 'Продавец', status: 'active' },
  { name: 'Зафар Усмонов', phone: '+998901234571', role: 'Склад', status: 'active' },
]

const defaultRoles: Array<Omit<ErpRole, 'id' | 'createdAt' | 'updatedAt'>> = [
  {
    name: 'Администратор',
    description: 'Полный доступ ко всем разделам ERP.',
    permissions: [
      'dashboard.view',
      'products.manage',
      'sales.manage',
      'clients.manage',
      'finance.manage',
      'reports.view',
      'settings.manage',
      'users.manage',
    ],
    status: 'active',
  },
  {
    name: 'Старший продавец',
    description: 'Продажи, клиенты, товары, отчеты и контроль смены.',
    permissions: [
      'dashboard.view',
      'products.manage',
      'sales.manage',
      'clients.manage',
      'reports.view',
    ],
    status: 'active',
  },
  {
    name: 'Продавец',
    description: 'Оформление продаж и работа с клиентами.',
    permissions: ['dashboard.view', 'sales.manage', 'clients.manage'],
    status: 'active',
  },
  {
    name: 'Склад',
    description: 'Товары, остатки, перемещения и складские операции.',
    permissions: ['dashboard.view', 'products.manage', 'reports.view'],
    status: 'active',
  },
]

const SALES_KEY = 'erp.sales.v1'
const CLIENTS_KEY = 'erp.clients.v1'
const DEBTS_KEY = 'erp.debts.v1'
const FINANCE_CATEGORIES_KEY = 'erp.financeCategories.v1'
const FINANCE_KEY = 'erp.financeTransactions.v1'
const CASH_REGISTERS_KEY = 'erp.cashRegisters.v1'
const PAYMENT_METHOD_SETTINGS_KEY = 'erp.paymentMethods.v1'
const CURRENCY_SETTINGS_KEY = 'erp.currencySettings.v1'
const FINANCE_SHIFTS_KEY = 'erp.financeShifts.v1'
const FINANCE_TRANSFERS_KEY = 'erp.financeTransfers.v1'
const FINANCE_CONVERSIONS_KEY = 'erp.financeConversions.v1'
const CASH_SHIFTS_KEY = 'erp.cashShifts.v1'
const SUPPLIERS_KEY = 'erp.suppliers.v1'
const PURCHASE_ORDERS_KEY = 'erp.purchaseOrders.v1'
const SUPPLIER_PAYMENTS_KEY = 'erp.supplierPayments.v1'
const PURCHASE_RETURNS_KEY = 'erp.purchaseReturns.v1'
const WAREHOUSE_STOCKS_KEY = 'erp.warehouseStocks.v1'
const INVENTORY_MOVEMENTS_KEY = 'erp.inventoryMovements.v1'
const INVENTORY_DOCUMENTS_KEY = 'erp.inventoryDocuments.v1'
const REVALUATIONS_KEY = 'erp.revaluations.v1'
export const DEFAULT_WAREHOUSE_ID = 'store-main'
export const ERP_DATA_CHANGED = 'erp:data-changed'

export const defaultWarehouses: ErpWarehouse[] = [
  { id: DEFAULT_WAREHOUSE_ID, name: 'Магазин' },
  { id: 'warehouse-1', name: 'Склад №1' },
  { id: 'warehouse-2', name: 'Склад №2' },
  { id: 'basement', name: 'Подвал' },
]

// 'basement' is now a real warehouse (Подвал) — no legacy migration needed

function isBrowser() {
  return typeof window !== 'undefined'
}

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T) {
  if (!isBrowser()) return
  window.localStorage.setItem(key, JSON.stringify(value))
  window.dispatchEvent(new CustomEvent(ERP_DATA_CHANGED))
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
}

function normalizeQty(value: number) {
  return Math.max(0, Math.floor(Number(value) || 0))
}

function absQty(
  movements: ErpInventoryMovement[],
  type: ErpInventoryMovementType,
) {
  return movements
    .filter((movement) => movement.type === type)
    .reduce((sum, movement) => sum + Math.abs(movement.qty), 0)
}

function buildSalesChart(sales: ErpSale[]): DashboardChartPoint[] {
  const today = new Date()
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (6 - index))
    date.setHours(0, 0, 0, 0)
    return date
  })

  return days.map((day) => {
    const nextDay = new Date(day)
    nextDay.setDate(day.getDate() + 1)

    const daySales = sales.filter((sale) => {
      const createdAt = new Date(sale.createdAt)
      return createdAt >= day && createdAt < nextDay
    })

    return {
      label: new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
      }).format(day),
      total: daySales.reduce((sum, sale) => sum + sale.total, 0),
      count: daySales.length,
    }
  })
}

export function readEmployees(): ErpEmployee[] {
  const stored = readJson<ErpEmployee[]>(EMPLOYEES_KEY, [])
  if (stored.length > 0) return stored

  const now = new Date().toISOString()
  const seeded = defaultEmployees.map((item) => ({
    id: makeId('emp'),
    ...item,
    createdAt: now,
  }))
  writeJson(EMPLOYEES_KEY, seeded)
  return seeded
}

export function writeEmployees(employees: ErpEmployee[]) {
  writeJson(EMPLOYEES_KEY, employees)
  return employees
}

export function readRoles(): ErpRole[] {
  const stored = readJson<ErpRole[]>(ROLES_KEY, [])
  if (stored.length > 0) return stored

  const now = new Date().toISOString()
  const seeded = defaultRoles.map((item) => ({
    id: makeId('role'),
    ...item,
    createdAt: now,
    updatedAt: now,
  }))
  writeJson(ROLES_KEY, seeded)
  return seeded
}

export function writeRoles(roles: ErpRole[]) {
  writeJson(ROLES_KEY, roles)
  return roles
}

export function readSellers(): ErpSeller[] {
  return readEmployees()
    .filter((emp) => emp.status === 'active')
    .map((emp) => ({
      id: emp.id,
      name: emp.name,
      status: 'online' as SellerStatus,
    }))
}

export function readSales(): ErpSale[] {
  return readJson<ErpSale[]>(SALES_KEY, [])
}

export function writeSales(sales: ErpSale[]) {
  writeJson(SALES_KEY, sales)
  return sales
}

/**
 * Возвращает топ N самых популярных товаров по количеству продаж за последние 30 дней
 */
export function getPopularProducts(limit = 10): CatalogProduct[] {
  const sales = readSales()
  const products = readProducts()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Подсчитываем количество проданных единиц каждого товара за последние 30 дней
  const productSales = new Map<string, number>()

  for (const sale of sales) {
    // Пропускаем возвраты и старые продажи
    if (sale.type === 'return' || new Date(sale.createdAt) < thirtyDaysAgo) {
      continue
    }

    for (const line of sale.lines) {
      const currentQty = productSales.get(line.productId) ?? 0
      productSales.set(line.productId, currentQty + line.qty)
    }
  }

  // Создаём массив [productId, totalQty] и сортируем по убыванию количества
  const sortedProducts = Array.from(productSales.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)

  // Получаем полные данные товаров
  const productsById = new Map(products.map((p) => [p.id, p]))
  const popularProducts: CatalogProduct[] = []

  for (const [productId] of sortedProducts) {
    const product = productsById.get(productId)
    if (product && product.status === 'active') {
      popularProducts.push(product)
    }
  }

  return popularProducts
}

export function readClients(): ErpClient[] {
  return readJson<ErpClient[]>(CLIENTS_KEY, [])
}

export function writeClients(clients: ErpClient[]) {
  writeJson(CLIENTS_KEY, clients)
  return clients
}

export function readDebts(): ErpDebt[] {
  return readJson<ErpDebt[]>(DEBTS_KEY, [])
}

export function writeDebts(debts: ErpDebt[]) {
  writeJson(DEBTS_KEY, debts)
  return debts
}

export function readFinanceTransactions(): ErpFinanceTransaction[] {
  return readJson<ErpFinanceTransaction[]>(FINANCE_KEY, [])
}

export function writeFinanceTransactions(transactions: ErpFinanceTransaction[]) {
  writeJson(FINANCE_KEY, transactions)
  return transactions
}

export function readCashRegisters(): ErpCashRegister[] {
  const stored = readJson<ErpCashRegister[]>(CASH_REGISTERS_KEY, [])
  if (stored.length > 0) return stored

  const now = new Date().toISOString()
  const seeded = defaultCashRegisters.map((item) => ({
    id: makeId('register'),
    name: item.name,
    store: item.store,
    channel: item.channel,
    status: item.status,
    createdAt: now,
    updatedAt: now,
  }))

  writeJson(CASH_REGISTERS_KEY, seeded)
  return seeded
}

export function writeCashRegisters(registers: ErpCashRegister[]) {
  writeJson(CASH_REGISTERS_KEY, registers)
  return registers
}

export function readCurrencySettings(): ErpCurrencySetting[] {
  const stored = readJson<ErpCurrencySetting[]>(CURRENCY_SETTINGS_KEY, [])
  if (stored.length > 0) return stored
  writeJson(CURRENCY_SETTINGS_KEY, defaultCurrencySettings)
  return defaultCurrencySettings
}

export function writeCurrencySettings(currencies: ErpCurrencySetting[]) {
  writeJson(CURRENCY_SETTINGS_KEY, currencies)
  return currencies
}

export function readPaymentMethodSettings(): ErpPaymentMethodSetting[] {
  const stored = readJson<ErpPaymentMethodSetting[]>(PAYMENT_METHOD_SETTINGS_KEY, [])
  if (stored.length > 0) return stored

  const registers = readCashRegisters()
  const cashRegisterId =
    registers.find((item) => item.channel === 'cash' && item.status === 'active')?.id ?? null
  const cashlessRegisterId =
    registers.find((item) => item.channel === 'cashless' && item.status === 'active')?.id ?? null
  const now = new Date().toISOString()

  const seeded: ErpPaymentMethodSetting[] = [
    { id: 'cash', label: 'Наличные', hotkey: 'F1', channel: 'cash', registerId: cashRegisterId, allowInPos: true, status: 'active', createdAt: now, updatedAt: now },
    { id: 'uzcard', label: 'UzCard', hotkey: 'F2', channel: 'cashless', registerId: cashlessRegisterId, allowInPos: true, status: 'active', createdAt: now, updatedAt: now },
    { id: 'payme', label: 'Payme', hotkey: 'F3', channel: 'cashless', registerId: cashlessRegisterId, allowInPos: true, status: 'active', createdAt: now, updatedAt: now },
    { id: 'click', label: 'Click', hotkey: 'F4', channel: 'cashless', registerId: cashlessRegisterId, allowInPos: true, status: 'active', createdAt: now, updatedAt: now },
    { id: 'humo', label: 'Humo', hotkey: 'F5', channel: 'cashless', registerId: cashlessRegisterId, allowInPos: true, status: 'active', createdAt: now, updatedAt: now },
    { id: 'uzum', label: 'Uzum', hotkey: 'F6', channel: 'cashless', registerId: cashlessRegisterId, allowInPos: true, status: 'active', createdAt: now, updatedAt: now },
    { id: 'transfer', label: 'Перечисление', hotkey: 'F7', channel: 'cashless', registerId: cashlessRegisterId, allowInPos: true, status: 'active', createdAt: now, updatedAt: now },
    { id: 'debt', label: 'В долг', hotkey: 'F8', channel: 'credit', registerId: null, allowInPos: true, status: 'active', createdAt: now, updatedAt: now },
    { id: 'giftcard', label: 'Подарочная карта', hotkey: 'F9', channel: 'mixed', registerId: null, allowInPos: true, status: 'inactive', createdAt: now, updatedAt: now },
  ]

  writeJson(PAYMENT_METHOD_SETTINGS_KEY, seeded)
  return seeded
}

export function writePaymentMethodSettings(methods: ErpPaymentMethodSetting[]) {
  writeJson(PAYMENT_METHOD_SETTINGS_KEY, methods)
  return methods
}

export function upsertCashRegister(input: {
  id?: string
  name: string
  store: string
  channel: 'cash' | 'cashless'
  status?: 'active' | 'inactive'
}) {
  const registers = readCashRegisters()
  const now = new Date().toISOString()

  if (input.id) {
    const next = registers.map((item) =>
      item.id === input.id
        ? {
            ...item,
            name: input.name.trim(),
            store: input.store.trim(),
            channel: input.channel,
            status: input.status ?? item.status,
            updatedAt: now,
          }
        : item,
    )
    writeCashRegisters(next)
    return next.find((item) => item.id === input.id) ?? null
  }

  const created: ErpCashRegister = {
    id: makeId('register'),
    name: input.name.trim(),
    store: input.store.trim(),
    channel: input.channel,
    status: input.status ?? 'active',
    createdAt: now,
    updatedAt: now,
  }
  writeCashRegisters([...registers, created])
  return created
}

export function upsertPaymentMethodSetting(input: {
  id?: string
  methodId?: string
  label: string
  hotkey: string
  channel: 'cash' | 'cashless' | 'credit' | 'mixed'
  registerId: string | null
  allowInPos: boolean
  status?: 'active' | 'inactive'
}) {
  const methods = readPaymentMethodSettings()
  const now = new Date().toISOString()

  if (input.id) {
    const next = methods.map((item) =>
      item.id === input.id
        ? {
            ...item,
            label: input.label.trim(),
            hotkey: input.hotkey.trim(),
            channel: input.channel,
            registerId: input.registerId,
            allowInPos: input.allowInPos,
            status: input.status ?? item.status,
            updatedAt: now,
          }
        : item,
    )
    writePaymentMethodSettings(next)
    return next.find((item) => item.id === input.id) ?? null
  }

  const created: ErpPaymentMethodSetting = {
    id: input.methodId?.trim() || makeId('payment'),
    label: input.label.trim(),
    hotkey: input.hotkey.trim(),
    channel: input.channel,
    registerId: input.registerId,
    allowInPos: input.allowInPos,
    status: input.status ?? 'active',
    createdAt: now,
    updatedAt: now,
  }
  writePaymentMethodSettings([...methods, created])
  return created
}

export function updateCurrencySetting(input: {
  code: 'UZS' | 'USD'
  rate: number
  status: 'active' | 'inactive'
}) {
  const now = new Date().toISOString()
  const next = readCurrencySettings().map((item) =>
    item.code === input.code
      ? {
          ...item,
          rate: Math.max(0, Number(input.rate) || 0),
          status: input.status,
          updatedAt: now,
        }
      : item,
  )
  writeCurrencySettings(next)
  return next.find((item) => item.code === input.code) ?? null
}

export function getActivePosPaymentMethods() {
  return readPaymentMethodSettings()
    .filter((item) => item.status === 'active' && item.allowInPos)
    .sort((left, right) => left.hotkey.localeCompare(right.hotkey))
}

export function readFinanceShifts(): ErpFinanceShift[] {
  return readJson<ErpFinanceShift[]>(FINANCE_SHIFTS_KEY, [])
}

export function writeFinanceShifts(shifts: ErpFinanceShift[]) {
  writeJson(FINANCE_SHIFTS_KEY, shifts)
  return shifts
}

export function readFinanceTransfers(): ErpFinanceTransfer[] {
  return readJson<ErpFinanceTransfer[]>(FINANCE_TRANSFERS_KEY, [])
}

export function writeFinanceTransfers(transfers: ErpFinanceTransfer[]) {
  writeJson(FINANCE_TRANSFERS_KEY, transfers)
  return transfers
}

export function readFinanceConversions(): ErpFinanceConversion[] {
  return readJson<ErpFinanceConversion[]>(FINANCE_CONVERSIONS_KEY, [])
}

export function writeFinanceConversions(conversions: ErpFinanceConversion[]) {
  writeJson(FINANCE_CONVERSIONS_KEY, conversions)
  return conversions
}

export function readCashShifts(): ErpCashShift[] {
  return readJson<ErpCashShift[]>(CASH_SHIFTS_KEY, [])
}

export function writeCashShifts(shifts: ErpCashShift[]) {
  writeJson(CASH_SHIFTS_KEY, shifts)
  return shifts
}

export function readSuppliers(): ErpSupplier[] {
  const stored = readJson<ErpSupplier[]>(SUPPLIERS_KEY, [])
  if (stored.length > 0) return stored

  const now = new Date().toISOString()
  const seeded = defaultSuppliers.map((item) => ({
    id: makeId('supplier'),
    ...item,
    createdAt: now,
    updatedAt: now,
  }))
  writeJson(SUPPLIERS_KEY, seeded)
  return seeded
}

export function writeSuppliers(suppliers: ErpSupplier[]) {
  writeJson(SUPPLIERS_KEY, suppliers)
  return suppliers
}

export function readPurchaseOrders(): ErpPurchaseOrder[] {
  const stored = readJson<ErpPurchaseOrder[]>(PURCHASE_ORDERS_KEY, [])
  return stored
}

export function writePurchaseOrders(orders: ErpPurchaseOrder[]) {
  writeJson(PURCHASE_ORDERS_KEY, orders)
  return orders
}

export function readSupplierPayments(): ErpSupplierPayment[] {
  return readJson<ErpSupplierPayment[]>(SUPPLIER_PAYMENTS_KEY, [])
}

export function writeSupplierPayments(payments: ErpSupplierPayment[]) {
  writeJson(SUPPLIER_PAYMENTS_KEY, payments)
  return payments
}

export function readPurchaseReturns(): ErpPurchaseReturn[] {
  return readJson<ErpPurchaseReturn[]>(PURCHASE_RETURNS_KEY, [])
}

export function writePurchaseReturns(returns: ErpPurchaseReturn[]) {
  writeJson(PURCHASE_RETURNS_KEY, returns)
  return returns
}

export function readRevaluations(): ErpRevaluation[] {
  return readJson<ErpRevaluation[]>(REVALUATIONS_KEY, [])
}

export function writeRevaluations(items: ErpRevaluation[]) {
  writeJson(REVALUATIONS_KEY, items)
}

export function createRevaluation(input: {
  name: string
  store: string
  type: ErpRevaluation['type']
  createdBy?: string
  lines?: ErpRevaluationLine[]
}): ErpRevaluation {
  const now = new Date().toISOString()
  const item: ErpRevaluation = {
    id: `rev-${Date.now()}`,
    name: input.name || `Переоценка ${formatDate(now)}`,
    store: input.store,
    type: input.type,
    status: 'new',
    createdAt: now,
    createdBy: input.createdBy || 'Кассир',
    lines: input.lines ?? [],
  }
  writeRevaluations([item, ...readRevaluations()])
  return item
}

export function finishRevaluation(id: string, finishedBy = 'Кассир'): ErpRevaluation {
  const items = readRevaluations()
  const idx = items.findIndex((r) => r.id === id)
  if (idx < 0) throw new Error('Переоценка не найдена')
  const updated: ErpRevaluation = {
    ...items[idx],
    status: 'done',
    finishedAt: new Date().toISOString(),
    finishedBy,
  }
  // Apply price changes to product catalog
  const products = readProducts()
  for (const line of updated.lines) {
    const pi = products.findIndex((p) => p.id === line.productId)
    if (pi < 0) continue
    if (updated.type === 'retail' || updated.type === 'rate') {
      products[pi] = { ...products[pi], price: line.newPrice, updatedAt: updated.finishedAt! }
    } else if (updated.type === 'wholesale') {
      products[pi] = { ...products[pi], wholesalePrice: line.newPrice, updatedAt: updated.finishedAt! }
    }
  }
  writeProducts(products, false)
  items[idx] = updated
  writeRevaluations(items)
  return updated
}


export function readFinanceCategories(): ErpFinanceCategory[] {
  const stored = readJson<ErpFinanceCategory[]>(FINANCE_CATEGORIES_KEY, [])
  if (stored.length > 0) {
    return stored
      .map((category) => ({
        ...category,
        parentId: category.parentId ?? null,
      }))
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
  }

  const now = new Date().toISOString()
  const byName = new Map<string, ErpFinanceCategory>()
  const seeded: ErpFinanceCategory[] = []

  for (const item of defaultFinanceCategories) {
    const category: ErpFinanceCategory = {
      id: makeId('fcat'),
      name: item.name,
      type: item.type,
      status: item.status,
      parentId: null,
      createdAt: now,
      updatedAt: now,
    }

    seeded.push(category)
    byName.set(item.name, category)
  }

  for (let index = 0; index < defaultFinanceCategories.length; index += 1) {
    const parentName = defaultFinanceCategories[index].parentName
    if (!parentName) continue
    const parent = byName.get(parentName)
    if (parent) {
      seeded[index] = {
        ...seeded[index],
        parentId: parent.id,
      }
    }
  }

  writeJson(FINANCE_CATEGORIES_KEY, seeded)
  return seeded
}

export function writeFinanceCategories(categories: ErpFinanceCategory[]) {
  writeJson(FINANCE_CATEGORIES_KEY, categories)
  return categories
}

export function getFinanceCategoryTree(): FinanceCategoryTreeItem[] {
  const categories = readFinanceCategories()
  const parents = categories.filter((category) => !category.parentId)

  return parents.map((parent) => ({
    ...parent,
    children: categories.filter((category) => category.parentId === parent.id),
  }))
}

export function getFinanceCategoryOptions(type?: ErpFinanceCategoryType) {
  const categories = readFinanceCategories().filter(
    (category) => category.status === 'active' && (!type || category.type === type),
  )

  return categories.sort((left, right) => left.name.localeCompare(right.name, 'ru-RU'))
}

export function createFinanceCategory(input: {
  name: string
  type: ErpFinanceCategoryType
  parentId?: string | null
}) {
  const name = input.name.trim()
  if (!name) {
    throw new Error('Укажите название категории.')
  }

  const categories = readFinanceCategories()
  const now = new Date().toISOString()
  const normalizedName = name.toLowerCase()

  const duplicate = categories.find(
    (category) =>
      category.status === 'active' &&
      category.parentId === (input.parentId ?? null) &&
      category.type === input.type &&
      category.name.trim().toLowerCase() === normalizedName,
  )

  if (duplicate) {
    throw new Error('Category already exists.')
  }

  const category: ErpFinanceCategory = {
    id: makeId('fcat'),
    name,
    type: input.type,
    status: 'active',
    parentId: input.parentId ?? null,
    createdAt: now,
    updatedAt: now,
  }

  writeFinanceCategories([...categories, category])
  return category
}

export function updateFinanceCategory(input: {
  id: string
  name: string
  type: ErpFinanceCategoryType
  parentId?: string | null
}) {
  const name = input.name.trim()
  if (!name) {
    throw new Error('Укажите название категории.')
  }

  const categories = readFinanceCategories()
  const category = categories.find((item) => item.id === input.id)
  if (!category) {
    throw new Error('Категория не найдена.')
  }

  if (input.parentId && input.parentId === input.id) {
    throw new Error('Category cannot be its own parent.')
  }

  const normalizedName = name.toLowerCase()
  const duplicate = categories.find(
    (item) =>
      item.id !== input.id &&
      item.status === 'active' &&
      item.parentId === (input.parentId ?? null) &&
      item.type === input.type &&
      item.name.trim().toLowerCase() === normalizedName,
  )

  if (duplicate) {
    throw new Error('Category already exists.')
  }

  const now = new Date().toISOString()
  const nextCategories = categories.map((item) =>
    item.id === input.id
      ? {
          ...item,
          name,
          type: input.type,
          parentId: input.parentId ?? null,
          updatedAt: now,
        }
      : item.parentId === input.id && item.type !== input.type
        ? {
            ...item,
            type: input.type,
            updatedAt: now,
          }
        : item,
  )

  writeFinanceCategories(nextCategories)
  return nextCategories.find((item) => item.id === input.id) ?? category
}

export function archiveFinanceCategory(id: string) {
  const categories = readFinanceCategories()
  const now = new Date().toISOString()
  const nextCategories = categories.map((item) =>
    item.id === id || item.parentId === id
      ? {
          ...item,
          status: 'deleted' as const,
          updatedAt: now,
        }
      : item,
  )

  writeFinanceCategories(nextCategories)
  return nextCategories
}

export function restoreFinanceCategory(id: string) {
  const categories = readFinanceCategories()
  const target = categories.find((item) => item.id === id)
  if (!target) {
    throw new Error('Категория не найдена.')
  }

  const now = new Date().toISOString()
  const nextCategories = categories.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        status: 'active' as const,
        updatedAt: now,
      }
    }

    if (item.parentId === id) {
      return {
        ...item,
        status: 'active' as const,
        updatedAt: now,
      }
    }

    return item
  })

  if (target.parentId) {
    const parent = nextCategories.find((item) => item.id === target.parentId)
    if (parent?.status === 'deleted') {
      return restoreFinanceCategory(parent.id)
    }
  }

  writeFinanceCategories(nextCategories)
  return nextCategories
}

export function readWarehouses(): ErpWarehouse[] {
  return defaultWarehouses
}

export function readInventoryMovements(): ErpInventoryMovement[] {
  return readJson<ErpInventoryMovement[]>(INVENTORY_MOVEMENTS_KEY, [])
}

export function readInventoryDocuments(): ErpInventoryDocument[] {
  return readJson<ErpInventoryDocument[]>(INVENTORY_DOCUMENTS_KEY, [])
}

function writeInventoryDocuments(documents: ErpInventoryDocument[]) {
  writeJson(INVENTORY_DOCUMENTS_KEY, documents)
  return documents
}

export function createInventoryDocument(input: {
  name?: string
  warehouseId?: string
  type?: 'full' | 'partial'
}) {
  const warehouse = readWarehouses().find((item) => item.id === (input.warehouseId ?? DEFAULT_WAREHOUSE_ID))
  if (!warehouse) throw new Error('Склад для инвентаризации не найден.')
  const now = new Date().toISOString()
  const document: ErpInventoryDocument = {
    id: makeId('inv'),
    name: input.name?.trim() || `Инвентаризация ${formatDate(now)}`,
    warehouseId: warehouse.id,
    warehouseName: warehouse.name,
    type: input.type ?? 'full',
    status: 'in_progress',
    createdAt: now,
    counts: {},
  }
  writeInventoryDocuments([document, ...readInventoryDocuments()])
  return document
}

export function getInventoryDocument(id: string) {
  return readInventoryDocuments().find((item) => item.id === id) ?? null
}

export function updateInventoryCounts(id: string, counts: Record<string, number>) {
  const documents = readInventoryDocuments()
  const index = documents.findIndex((item) => item.id === id)
  if (index < 0) throw new Error('Документ инвентаризации не найден.')
  const document = documents[index]
  if (document.status === 'completed') throw new Error('Завершённую инвентаризацию нельзя редактировать.')
  const normalized = Object.fromEntries(Object.entries(counts).map(([productId, qty]) => [productId, normalizeQty(qty)]))
  documents[index] = { ...document, counts: normalized }
  writeInventoryDocuments(documents)
  return documents[index]
}

export function getProductMovementSummary(): ProductMovementSummary {
  const products = readProducts()
  const movements = readInventoryMovements()
  const totalStock = products.reduce((sum, product) => sum + product.stock, 0)
  const totalStockValue = products.reduce(
    (sum, product) => sum + product.stock * product.price,
    0,
  )

  return {
    productCount: products.length,
    totalStock,
    totalStockValue,
    movementCount: movements.length,
    soldQty: absQty(movements, 'sale'),
    writeOffQty: absQty(movements, 'writeoff'),
    transferInQty: absQty(movements, 'transfer_in'),
    transferOutQty: absQty(movements, 'transfer_out'),
    adjustmentPlusQty: movements
      .filter((movement) => movement.type === 'inventory_adjustment' && movement.qty > 0)
      .reduce((sum, movement) => sum + movement.qty, 0),
    adjustmentMinusQty: movements
      .filter((movement) => movement.type === 'inventory_adjustment' && movement.qty < 0)
      .reduce((sum, movement) => sum + Math.abs(movement.qty), 0),
    latestMovements: movements.slice(0, 12),
  }
}

export function getDashboardSummary(): DashboardSummary {
  const sales = readSales()
  const transactions = readFinanceTransactions()
  const products = readProducts()
  const movements = readInventoryMovements()
  const chartPoints = buildSalesChart(sales)
  const paymentTotals = new Map<string, number>()

  for (const sale of sales) {
    for (const payment of sale.payments) {
      paymentTotals.set(
        payment.label,
        (paymentTotals.get(payment.label) ?? 0) + payment.amount,
      )
    }
  }

  const stockValue = products.reduce(
    (sum, product) => sum + product.stock * product.price,
    0,
  )

  return {
    salesTotal: sales.reduce((sum, sale) => sum + sale.total, 0),
    paymentsTotal: transactions
      .filter((transaction) => transaction.sourceType === 'sale')
      .reduce((sum, transaction) => sum + Math.max(transaction.amount, 0), 0),
    salesCount: sales.length,
    transactionCount: transactions.length,
    soldQty: absQty(movements, 'sale'),
    stockValue,
    lowStockCount: products.filter(
      (product) =>
        product.stock > 0 && product.stock <= product.lowStockThreshold,
    ).length,
    outOfStockCount: products.filter((product) => product.stock <= 0).length,
    chartPoints,
    paymentSlices: Array.from(paymentTotals.entries()).map(([label, amount]) => ({
      label,
      amount,
    })),
    latestTransactions: transactions.slice(0, 5),
  }
}

export function getFinanceReportSummary(): FinanceReportSummary {
  const transactions = readFinanceTransactions()
  const sales = readSales()
  const salesById = new Map(sales.map((sale) => [sale.id, sale]))
  const incomeTransactions = transactions.filter((transaction) => transaction.amount > 0)
  const expenseTransactions = transactions.filter((transaction) => transaction.amount < 0)
  const methodTotals = new Map<string, FinanceReportMethodBreakdown>()
  const returnMethodTotals = new Map<string, FinanceReturnMethodBreakdown>()

  for (const transaction of transactions) {
    const key = transaction.method || 'Без метода'
    const current = methodTotals.get(key) ?? {
      method: key,
      income: 0,
      expense: 0,
    }

    if (transaction.amount >= 0) {
      current.income += transaction.amount
    } else {
      current.expense += Math.abs(transaction.amount)
    }

    methodTotals.set(key, current)

    const relatedSale =
      transaction.sourceType === 'sale'
        ? salesById.get(transaction.sourceId ?? '')
        : null
    if (transaction.amount < 0 && relatedSale?.type === 'return') {
      const returnCurrent = returnMethodTotals.get(key) ?? {
        method: key,
        amount: 0,
        count: 0,
      }
      returnCurrent.amount += Math.abs(transaction.amount)
      returnCurrent.count += 1
      returnMethodTotals.set(key, returnCurrent)
    }
  }

  const incomeTotal = incomeTransactions.reduce(
    (sum, transaction) => sum + transaction.amount,
    0,
  )
  const expenseTotal = expenseTransactions.reduce(
    (sum, transaction) => sum + Math.abs(transaction.amount),
    0,
  )
  const saleIncomeTransactions = incomeTransactions.filter(
    (transaction) => transaction.sourceType === 'sale',
  )
  const saleReturnTransactions = expenseTransactions.filter((transaction) => {
    if (transaction.sourceType !== 'sale') return false
    return salesById.get(transaction.sourceId ?? '')?.type === 'return'
  })
  const retailSalesTotal = saleIncomeTransactions
    .filter((transaction) => salesById.get(transaction.sourceId ?? '')?.saleChannel !== 'wholesale')
    .reduce((sum, transaction) => sum + transaction.amount, 0)
  const wholesaleSalesTotal = saleIncomeTransactions
    .filter((transaction) => salesById.get(transaction.sourceId ?? '')?.saleChannel === 'wholesale')
    .reduce((sum, transaction) => sum + transaction.amount, 0)
  const salesReturnTotal = saleReturnTransactions.reduce(
    (sum, transaction) => sum + Math.abs(transaction.amount),
    0,
  )

  return {
    incomeTotal,
    expenseTotal,
    netTotal: incomeTotal - expenseTotal,
    salesIncomeTotal: saleIncomeTransactions.reduce(
      (sum, transaction) => sum + transaction.amount,
      0,
    ),
    salesReturnTotal,
    netSalesTotal:
      saleIncomeTransactions.reduce((sum, transaction) => sum + transaction.amount, 0) -
      salesReturnTotal,
    retailSalesTotal,
    wholesaleSalesTotal,
    retailSalesCount: sales.filter(
      (sale) => sale.type === 'sale' && sale.saleChannel !== 'wholesale',
    ).length,
    wholesaleSalesCount: sales.filter(
      (sale) => sale.type === 'sale' && sale.saleChannel === 'wholesale',
    ).length,
    returnSalesCount: sales.filter((sale) => sale.type === 'return').length,
    manualIncomeTotal: incomeTransactions
      .filter((transaction) => transaction.sourceType === 'income')
      .reduce((sum, transaction) => sum + transaction.amount, 0),
    transactionCount: transactions.length,
    saleTransactionCount: transactions.filter(
      (transaction) => transaction.sourceType === 'sale',
    ).length,
    returnTransactionCount: saleReturnTransactions.length,
    expenseTransactionCount: expenseTransactions.length,
    methodBreakdown: Array.from(methodTotals.values()).sort(
      (left, right) =>
        right.income + right.expense - (left.income + left.expense),
    ),
    returnMethodBreakdown: Array.from(returnMethodTotals.values()).sort(
      (left, right) => right.amount - left.amount,
    ),
    latestTransactions: transactions.slice(0, 8),
  }
}

export function getFinanceAccountsSummary(): FinanceAccountsSummary {
  const transactions = readFinanceTransactions()
  const accountRows = new Map<string, FinanceAccountRow>()

  for (const transaction of transactions) {
    const accountName = normalizeFinanceAccountName(transaction.account)
    const current = accountRows.get(accountName) ?? {
      id: accountName.toLowerCase().replace(/\s+/g, '-'),
      name: accountName,
      cash: { currency: 'UZS' as const, balance: 0, frozen: 0 },
      cashless: { currency: 'UZS' as const, balance: 0, frozen: 0 },
    }

    if (isCashMethod(transaction.method)) {
      current.cash.balance += transaction.amount
    } else {
      current.cashless.balance += transaction.amount
    }

    accountRows.set(accountName, current)
  }

  const rows = Array.from(accountRows.values()).sort((left, right) =>
    left.name.localeCompare(right.name, 'ru-RU'),
  )

  return {
    totalCash: rows.reduce((sum, row) => sum + row.cash.balance, 0),
    totalCashless: rows.reduce((sum, row) => sum + row.cashless.balance, 0),
    rows,
  }
}

export function getFinanceAccountDetails(accountId: string): FinanceAccountDetails | null {
  const transactions = readFinanceTransactions()
  const activities = transactions
    .filter((transaction) => {
      const normalizedAccountName = normalizeFinanceAccountName(transaction.account)
      const normalizedId = normalizedAccountName.toLowerCase().replace(/\s+/g, '-')
      return normalizedId === accountId
    })
    .map((transaction) => ({
      id: transaction.id,
      createdAt: transaction.createdAt,
      operation: transaction.operation,
      method: transaction.method,
      amount: transaction.amount,
      currency: transaction.currency,
      channel: isCashMethod(transaction.method) ? ('cash' as const) : ('cashless' as const),
      sourceType: transaction.sourceType,
    }))

  if (activities.length === 0) return null

  const accountName = normalizeFinanceAccountName(
    transactions.find((transaction) => {
      const normalizedAccountName = normalizeFinanceAccountName(transaction.account)
      const normalizedId = normalizedAccountName.toLowerCase().replace(/\s+/g, '-')
      return normalizedId === accountId
    })?.account ?? accountId,
  )

  return {
    accountId,
    accountName,
    turnoverIn: activities
      .filter((activity) => activity.amount > 0)
      .reduce((sum, activity) => sum + activity.amount, 0),
    turnoverOut: activities
      .filter((activity) => activity.amount < 0)
      .reduce((sum, activity) => sum + Math.abs(activity.amount), 0),
    transactionCount: activities.length,
    lastActivityAt: activities[0]?.createdAt ?? null,
    activities: activities.slice(0, 12),
  }
}

export function openCashShift(input: {
  cashier?: string
  store: string
  openingCash: number
  registerId?: string | null
}) {
  const openingCash = Math.max(0, Number(input.openingCash) || 0)
  const now = new Date().toISOString()
  const shift: ErpCashShift = {
    id: makeId('cashshift'),
    cashier: input.cashier?.trim() || 'Исломали Нурматов',
    store: input.store.trim(),
    registerId: input.registerId ?? null,
    openedAt: now,
    closedAt: null,
    openingCash,
    status: 'open',
    actualByMethod: {},
  }

  writeCashShifts([shift, ...readCashShifts()])
  return shift
}

export function closeCashShift(input: {
  shiftId: string
  actualByMethod: Record<string, number>
}) {
  const shifts = readCashShifts()
  const shift = shifts.find((item) => item.id === input.shiftId)
  if (!shift) {
    throw new Error('Кассовая смена не найдена.')
  }
  if (shift.status === 'closed') {
    throw new Error('Shift is already closed.')
  }

  const closedAt = new Date().toISOString()
  const nextShift: ErpCashShift = {
    ...shift,
    closedAt,
    status: 'closed',
    actualByMethod: Object.fromEntries(
      Object.entries(input.actualByMethod).map(([key, value]) => [
        key,
        Math.max(0, Number(value) || 0),
      ]),
    ),
  }

  writeCashShifts(
    shifts.map((item) => (item.id === shift.id ? nextShift : item)),
  )

  const summary = buildCashShiftSummaryRow(nextShift)
  const cashExpected =
    summary.pay.find((item) => isCashMethod(item.method))?.expected ?? shift.openingCash
  const cashActual =
    summary.pay.find((item) => isCashMethod(item.method))?.actual ?? cashExpected

  createFinanceShiftClosure({
    account:
      shift.registerId
        ? readCashRegisters().find((item) => item.id === shift.registerId)?.name ??
          accountForPayment('cash')
        : accountForPayment('cash'),
    sentAmount: cashExpected,
    receivedAmount: cashActual,
    cashier: shift.cashier,
    receivedBy: shift.cashier,
  })

  return nextShift
}

export function getCashShiftSummaryRows(): CashShiftSummaryRow[] {
  return readCashShifts().map(buildCashShiftSummaryRow)
}

export function getCurrentShift(): CashShiftSummaryRow | null {
  const shifts = readCashShifts()
  const open = shifts.find((s) => s.status === 'open')
  return open ? buildCashShiftSummaryRow(open) : null
}

export function getShiftHistory(limit = 50): CashShiftSummaryRow[] {
  return readCashShifts()
    .filter((s) => s.status === 'closed')
    .slice(0, limit)
    .map(buildCashShiftSummaryRow)
}

export type XReportData = {
  shift: CashShiftSummaryRow
  generatedAt: string
  salesCount: number
  salesTotal: number
  returnCount: number
  returnTotal: number
  netTotal: number
  discountTotal: number
  avgCheck: number
  payByMethod: Array<{ method: string; amount: number; count: number }>
  topProducts: Array<{ name: string; qty: number; total: number }>
  hourlySales: Array<{ hour: string; count: number; total: number }>
}

export type ZReportData = XReportData & {
  openingCash: number
  closingCash: number
  cashDiff: number
  allDiscrepancies: Array<{ method: string; expected: number; actual: number; diff: number }>
  autoAdjusted: boolean
}

export function generateXReport(shiftId: string): XReportData {
  const shifts = readCashShifts()
  const shift = shifts.find((s) => s.id === shiftId)
  if (!shift) throw new Error('Смена не найдена.')

  const summary = buildCashShiftSummaryRow(shift)
  const sales = readSales().filter((sale) => {
    if (sale.store !== shift.store) return false
    const createdAt = new Date(sale.createdAt).getTime()
    const openedAt = new Date(shift.openedAt).getTime()
    const closedAt = shift.closedAt ? new Date(shift.closedAt).getTime() : Date.now()
    return createdAt >= openedAt && createdAt <= closedAt
  })

  const saleDocs = sales.filter((s) => s.type === 'sale')
  const returnDocs = sales.filter((s) => s.type === 'return')

  // Оплата по методам
  const methodMap = new Map<string, { amount: number; count: number }>()
  for (const sale of saleDocs) {
    for (const p of sale.payments) {
      const cur = methodMap.get(p.label) ?? { amount: 0, count: 0 }
      cur.amount += p.amount
      cur.count += 1
      methodMap.set(p.label, cur)
    }
  }

  // Топ товаров
  const productMap = new Map<string, { name: string; qty: number; total: number }>()
  for (const sale of saleDocs) {
    for (const line of sale.lines) {
      const cur = productMap.get(line.productId) ?? { name: line.name, qty: 0, total: 0 }
      cur.qty += line.qty
      cur.total += line.total
      productMap.set(line.productId, cur)
    }
  }

  // Продажи по часам
  const hourMap = new Map<string, { count: number; total: number }>()
  for (const sale of saleDocs) {
    const hour = new Date(sale.createdAt).getHours().toString().padStart(2, '0') + ':00'
    const cur = hourMap.get(hour) ?? { count: 0, total: 0 }
    cur.count += 1
    cur.total += sale.total
    hourMap.set(hour, cur)
  }

  const salesTotal = saleDocs.reduce((s, d) => s + d.total, 0)
  const returnTotal = returnDocs.reduce((s, d) => s + Math.abs(d.total), 0)
  const discountTotal = saleDocs.reduce((s, d) => s + d.discount, 0)

  return {
    shift: summary,
    generatedAt: new Date().toISOString(),
    salesCount: saleDocs.length,
    salesTotal,
    returnCount: returnDocs.length,
    returnTotal,
    netTotal: salesTotal - returnTotal,
    discountTotal,
    avgCheck: saleDocs.length > 0 ? Math.round(salesTotal / saleDocs.length) : 0,
    payByMethod: Array.from(methodMap.entries()).map(([method, v]) => ({ method, ...v })),
    topProducts: Array.from(productMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10),
    hourlySales: Array.from(hourMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([hour, v]) => ({ hour, ...v })),
  }
}

export function generateZReport(shiftId: string): ZReportData {
  const shifts = readCashShifts()
  const shift = shifts.find((s) => s.id === shiftId)
  if (!shift) throw new Error('Смена не найдена.')
  if (shift.status !== 'closed') throw new Error('Z-отчёт формируется только для закрытой смены.')

  const xData = generateXReport(shiftId)
  const summary = xData.shift

  const discrepancies = summary.pay.map((p) => ({
    method: p.method,
    expected: p.expected,
    actual: p.actual ?? p.expected,
    diff: (p.actual ?? p.expected) - p.expected,
  }))

  const cashLine = discrepancies.find((d) => d.method.toLowerCase().includes('налич'))
  const closingCash = cashLine?.actual ?? shift.openingCash
  const cashDiff = closingCash - (cashLine?.expected ?? shift.openingCash)

  return {
    ...xData,
    openingCash: shift.openingCash,
    closingCash,
    cashDiff,
    allDiscrepancies: discrepancies,
    autoAdjusted: discrepancies.some((d) => d.diff !== 0),
  }
}

export function printXReport(shiftId: string): void {
  if (typeof window === 'undefined') return
  const report = generateXReport(shiftId)
  const win = window.open('', '_blank', 'width=680,height=900')
  if (!win) return
  win.document.write(buildXReportHtml(report))
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 150)
}

export function printZReport(shiftId: string): void {
  if (typeof window === 'undefined') return
  const report = generateZReport(shiftId)
  const win = window.open('', '_blank', 'width=680,height=900')
  if (!win) return
  win.document.write(buildZReportHtml(report))
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 150)
}

function fmtNum(n: number) {
  return n.toLocaleString('ru-RU') + ' UZS'
}

function buildXReportHtml(r: XReportData): string {
  const shift = r.shift
  const rows = r.topProducts
    .map(
      (p) =>
        `<tr><td>${p.name}</td><td>${p.qty} шт</td><td>${fmtNum(p.total)}</td></tr>`,
    )
    .join('')
  const hourRows = r.hourlySales
    .map(
      (h) =>
        `<tr><td>${h.hour}</td><td>${h.count} шт</td><td>${fmtNum(h.total)}</td></tr>`,
    )
    .join('')
  const payRows = r.payByMethod
    .map((m) => `<tr><td>${m.method}</td><td>${m.count} шт</td><td>${fmtNum(m.amount)}</td></tr>`)
    .join('')

  return `<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8">
<title>X-отчёт</title><style>
body{font-family:Arial,sans-serif;margin:24px;color:#111827;font-size:13px}
h1{font-size:20px;margin:0 0 4px}
h2{font-size:14px;margin:16px 0 6px;color:#374151}
.meta{color:#6b7280;margin-bottom:16px}
.badge{display:inline-block;background:#e0e7ff;color:#4338ca;border-radius:6px;padding:2px 8px;font-weight:700;font-size:12px}
.grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:20px}
.card{border:1px solid #e5e7eb;border-radius:10px;padding:10px 12px}
.card-label{font-size:11px;color:#6b7280}
.card-value{font-size:16px;font-weight:700;margin-top:2px}
table{width:100%;border-collapse:collapse;margin-bottom:16px}
th,td{border-bottom:1px solid #e5e7eb;padding:6px 8px;text-align:left}
th{background:#f9fafb;font-weight:600}
td:last-child,th:last-child{text-align:right}
.footer{margin-top:24px;border-top:2px dashed #e5e7eb;padding-top:12px;color:#9ca3af;font-size:11px;text-align:center}
</style></head><body>
<h1>X-отчёт <span class="badge">Промежуточный</span></h1>
<div class="meta">
  Смена #${shift.id.slice(-6)} · ${shift.cashier} · ${shift.store}<br>
  Открыта: ${formatDateTime(shift.openedAt)}<br>
  Отчёт сформирован: ${formatDateTime(r.generatedAt)}
</div>
<div class="grid">
  <div class="card"><div class="card-label">Продажи</div><div class="card-value">${fmtNum(r.salesTotal)}</div></div>
  <div class="card"><div class="card-label">Возвраты</div><div class="card-value" style="color:#dc2626">-${fmtNum(r.returnTotal)}</div></div>
  <div class="card"><div class="card-label">Чистый оборот</div><div class="card-value" style="color:#059669">${fmtNum(r.netTotal)}</div></div>
  <div class="card"><div class="card-label">Чеков</div><div class="card-value">${r.salesCount} шт</div></div>
  <div class="card"><div class="card-label">Средний чек</div><div class="card-value">${fmtNum(r.avgCheck)}</div></div>
  <div class="card"><div class="card-label">Скидки</div><div class="card-value">${fmtNum(r.discountTotal)}</div></div>
</div>
<h2>Оплата по методам</h2>
<table><thead><tr><th>Метод</th><th>Кол-во</th><th>Сумма</th></tr></thead>
<tbody>${payRows || '<tr><td colspan="3" style="text-align:center;color:#9ca3af">Нет данных</td></tr>'}</tbody></table>
<h2>Продажи по часам</h2>
<table><thead><tr><th>Час</th><th>Чеков</th><th>Сумма</th></tr></thead>
<tbody>${hourRows || '<tr><td colspan="3" style="text-align:center;color:#9ca3af">Нет данных</td></tr>'}</tbody></table>
<h2>Топ-10 товаров</h2>
<table><thead><tr><th>Товар</th><th>Кол-во</th><th>Сумма</th></tr></thead>
<tbody>${rows || '<tr><td colspan="3" style="text-align:center;color:#9ca3af">Нет данных</td></tr>'}</tbody></table>
<div class="footer">X-отчёт не закрывает смену · Касса работает</div>
</body></html>`
}

function buildZReportHtml(r: ZReportData): string {
  const xHtml = buildXReportHtml(r)
  const discRows = r.allDiscrepancies
    .map((d) => {
      const color = d.diff === 0 ? '' : d.diff > 0 ? 'color:#059669' : 'color:#dc2626'
      const sign = d.diff === 0 ? '0 UZS' : (d.diff > 0 ? '+' : '') + fmtNum(d.diff)
      return `<tr><td>${d.method}</td><td>${fmtNum(d.expected)}</td><td>${fmtNum(d.actual)}</td><td style="${color};font-weight:700">${sign}</td></tr>`
    })
    .join('')

  const cashDiffColor = r.cashDiff === 0 ? '' : r.cashDiff > 0 ? 'color:#059669' : 'color:#dc2626'
  const cashDiffStr =
    r.cashDiff === 0 ? '0 UZS' : (r.cashDiff > 0 ? '+' : '') + fmtNum(r.cashDiff)

  const extra = `
<h2>Z-отчёт: сводка по закрытию смены</h2>
<table><thead><tr><th>Параметр</th><th>Значение</th></tr></thead><tbody>
<tr><td>Касса на начало</td><td>${fmtNum(r.openingCash)}</td></tr>
<tr><td>Касса на закрытие (факт)</td><td>${fmtNum(r.closingCash)}</td></tr>
<tr><td>Расхождение по наличным</td><td style="${cashDiffColor};font-weight:700">${cashDiffStr}</td></tr>
<tr><td>Автокорректировка</td><td>${r.autoAdjusted ? '✓ Применена' : '— Не требовалась'}</td></tr>
</tbody></table>
<h2>Расхождения по всем методам</h2>
<table><thead><tr><th>Метод</th><th>Ожидалось</th><th>Фактически</th><th>Разница</th></tr></thead>
<tbody>${discRows}</tbody></table>
<div style="margin-top:16px;border:2px solid #dc2626;border-radius:10px;padding:12px;text-align:center;color:#dc2626;font-weight:700;font-size:14px">
  СМЕНА ЗАКРЫТА · Z-ОТЧЁТ ОКОНЧАТЕЛЬНЫЙ
</div>`

  // Вставить extra перед закрывающим </body>
  return xHtml.replace(
    '<div class="footer">',
    extra + '\n<div class="footer">',
  ).replace(
    'X-отчёт не закрывает смену · Касса работает',
    'Z-отчёт · Смена закрыта',
  ).replace(
    'X-отчёт <span class="badge">Промежуточный</span>',
    'Z-отчёт <span class="badge" style="background:#fee2e2;color:#dc2626">Закрытие смены</span>',
  )
}

export function createSupplier(input: {
  name: string
  phone?: string
  email?: string
  address?: string
  contactPerson?: string
}) {
  const now = new Date().toISOString()
  const supplier: ErpSupplier = {
    id: makeId('supplier'),
    name: input.name.trim(),
    phone: input.phone?.trim() ?? '',
    email: input.email?.trim() ?? '',
    address: input.address?.trim() ?? '',
    contactPerson: input.contactPerson?.trim() ?? '',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  }

  writeSuppliers([supplier, ...readSuppliers()])
  return supplier
}

export function getSupplierSummaryRows(): SupplierSummaryRow[] {
  const suppliers = readSuppliers()
  const orders = readPurchaseOrders()
  const payments = readSupplierPayments()

  return suppliers.map((supplier) => {
    const supplierOrders = orders.filter(
      (order) => order.supplierId === supplier.id && order.status !== 'cancelled',
    )
    const supplierPayments = payments.filter((payment) => payment.supplierId === supplier.id)
    const ordersUsd = supplierOrders.reduce((sum, order) => sum + order.totalUsd, 0)
    const paymentsUsd = supplierPayments.reduce((sum, payment) => sum + payment.amountUsd, 0)
    const items = supplierOrders.reduce(
      (sum, order) =>
        sum +
        order.lines.reduce((lineSum, line) => lineSum + line.receivedQty, 0),
      0,
    )

    return {
      id: supplier.id,
      name: supplier.name,
      debtUsd: Math.max(0, ordersUsd - paymentsUsd),
      ordersUsd,
      paymentsUsd,
      items,
      phone: supplier.phone || '-',
    }
  })
}

export function createPurchaseOrder(input: {
  name: string
  supplierId: string
  store: string
  expectedDate: string
  lines: Array<{
    productId: string
    orderedQty: number
    costUsd: number
    markupPercent: number
    salePrice: number
  }>
}) {
  const supplier = readSuppliers().find((item) => item.id === input.supplierId)
  if (!supplier) {
    throw new Error('Поставщик не найден.')
  }

  const products = readProducts()
  const requestedProductIds = input.lines.map((line) => line.productId)
  if (new Set(requestedProductIds).size !== requestedProductIds.length) {
    throw new Error('Один товар нельзя добавлять в заказ несколько раз.')
  }
  const normalizedLines = input.lines
    .map((line) => {
      const product = products.find((item) => item.id === line.productId)
      if (!product) return null
      const orderedQty = normalizeQty(line.orderedQty)
      if (orderedQty <= 0) return null
      const costUsd = Number(line.costUsd)
      if (!Number.isFinite(costUsd) || costUsd <= 0) {
        throw new Error(`Укажите закупочную цену для товара ${product.name}.`)
      }
      return {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        barcode: product.barcode,
        orderedQty,
        receivedQty: 0,
        costUsd,
        markupPercent: Math.max(0, Number(line.markupPercent) || 0),
        salePrice: Math.max(0, Number(line.salePrice) || 0),
      } satisfies ErpPurchaseOrderLine
    })
    .filter((line): line is ErpPurchaseOrderLine => Boolean(line))

  if (normalizedLines.length === 0) {
    throw new Error('Purchase order must include at least one product.')
  }

  const now = new Date().toISOString()
  const order: ErpPurchaseOrder = {
    id: makeId('po'),
    name: input.name.trim() || `Заказ ${now.slice(0, 10)}`,
    supplierId: supplier.id,
    supplierName: supplier.name,
    store: input.store.trim(),
    status: 'ordered',
    createdAt: now,
    expectedDate: input.expectedDate,
    paidUsd: 0,
    totalUsd: roundUsd(normalizedLines.reduce(
      (sum, line) => sum + line.costUsd * line.orderedQty,
      0,
    )),
    lines: normalizedLines,
  }

  writePurchaseOrders([order, ...readPurchaseOrders()])
  return reconcileSupplierLedger(supplier.id).orders.find((item) => item.id === order.id) ?? order
}

export function receivePurchaseOrder(input: {
  orderId: string
  receivedByProductId?: Record<string, number>
}) {
  const orders = readPurchaseOrders()
  const orderIndex = orders.findIndex((item) => item.id === input.orderId)
  if (orderIndex < 0) {
    throw new Error('Заказ поставщику не найден.')
  }

  const order = orders[orderIndex]
  if (order.status === 'cancelled') {
    throw new Error('Cancelled purchase order cannot be received.')
  }
  const changes = order.lines
    .map((line) => {
      const remainingQty = Math.max(0, line.orderedQty - line.receivedQty)
      const targetQty =
        input.receivedByProductId?.[line.productId] ?? remainingQty
      const receivedNow = normalizeQty(targetQty)
      if (receivedNow <= 0) return null
      if (receivedNow > remainingQty) {
        throw new Error(`Нельзя принять больше заказанного количества для ${line.productName}. Осталось принять: ${remainingQty}.`)
      }
      return {
        line,
        receivedNow,
      }
    })
    .filter((item): item is { line: ErpPurchaseOrderLine; receivedNow: number } => Boolean(item))

  if (changes.length === 0) {
    throw new Error('Nothing to receive for this order.')
  }

  applyInventoryChanges(
    changes.map((item) => ({
      productId: item.line.productId,
      delta: item.receivedNow,
      type: 'manual',
      sourceId: order.id,
      reason: `Поступление по заказу ${order.name}`,
    })),
  )

  const nextLines = order.lines.map((line) => {
    const change = changes.find((item) => item.line.productId === line.productId)
    if (!change) return line
    return {
      ...line,
      receivedQty: Math.min(line.orderedQty, line.receivedQty + change.receivedNow),
    }
  })

  const totalReceived = nextLines.reduce((sum, line) => sum + line.receivedQty, 0)
  const nextOrder: ErpPurchaseOrder = {
    ...order,
    lines: nextLines,
    status: purchaseOrderStatus(nextLines, order.paidUsd, order.totalUsd),
  }

  const nextOrders = [...orders]
  nextOrders[orderIndex] = nextOrder
  writePurchaseOrders(nextOrders)

  return reconcileSupplierLedger(order.supplierId).orders.find((item) => item.id === order.id) ?? nextOrder
}

export function updatePurchaseOrder(input: {
  orderId: string
  name?: string
  store?: string
  expectedDate?: string
  lines?: Array<{
    productId: string
    orderedQty: number
    costUsd: number
    markupPercent: number
    salePrice: number
  }>
}) {
  const orders = readPurchaseOrders()
  const orderIndex = orders.findIndex((item) => item.id === input.orderId)
  if (orderIndex < 0) {
    throw new Error('Заказ поставщику не найден.')
  }

  const order = orders[orderIndex]
  if (order.status === 'cancelled') {
    throw new Error('Cancelled purchase order cannot be edited.')
  }
  if (order.lines.some((line) => line.receivedQty > 0)) {
    throw new Error('Received purchase order lines cannot be edited.')
  }
  if (order.paidUsd > 0) {
    throw new Error('Paid purchase order cannot be edited.')
  }

  let nextLines = order.lines
  if (input.lines) {
    const normalizedLines = input.lines
      .map((line) => {
        const currentLine = order.lines.find((item) => item.productId === line.productId)
        if (!currentLine) return null
        const orderedQty = normalizeQty(line.orderedQty)
        if (orderedQty <= 0) return null
        return {
          ...currentLine,
          orderedQty,
          costUsd: Math.max(0, Number(line.costUsd) || 0),
          markupPercent: Math.max(0, Number(line.markupPercent) || 0),
          salePrice: Math.max(0, Number(line.salePrice) || 0),
        } satisfies ErpPurchaseOrderLine
      })
      .filter((line): line is ErpPurchaseOrderLine => Boolean(line))

    if (normalizedLines.length === 0) {
      throw new Error('Purchase order must include at least one product.')
    }
    nextLines = normalizedLines
  }

  const nextOrder: ErpPurchaseOrder = {
    ...order,
    name: input.name?.trim() || order.name,
    store: input.store?.trim() || order.store,
    expectedDate: input.expectedDate?.trim() || order.expectedDate,
    lines: nextLines,
    totalUsd: roundUsd(nextLines.reduce((sum, line) => sum + line.costUsd * line.orderedQty, 0)),
    status: purchaseOrderStatus(nextLines, 0, roundUsd(nextLines.reduce((sum, line) => sum + line.costUsd * line.orderedQty, 0))),
  }

  const nextOrders = [...orders]
  nextOrders[orderIndex] = nextOrder
  writePurchaseOrders(nextOrders)
  return reconcileSupplierLedger(order.supplierId).orders.find((item) => item.id === order.id) ?? nextOrder
}

export function cancelPurchaseOrder(orderId: string) {
  const orders = readPurchaseOrders()
  const orderIndex = orders.findIndex((item) => item.id === orderId)
  if (orderIndex < 0) {
    throw new Error('Заказ поставщику не найден.')
  }

  const order = orders[orderIndex]
  if (order.status === 'cancelled') {
    return order
  }
  if (order.lines.some((line) => line.receivedQty > 0)) {
    throw new Error('Received purchase order cannot be cancelled.')
  }
  if (order.paidUsd > 0) {
    throw new Error('Paid purchase order cannot be cancelled.')
  }

  const nextOrder: ErpPurchaseOrder = {
    ...order,
    status: 'cancelled',
  }

  const nextOrders = [...orders]
  nextOrders[orderIndex] = nextOrder
  writePurchaseOrders(nextOrders)
  return reconcileSupplierLedger(order.supplierId).orders.find((item) => item.id === order.id) ?? nextOrder
}

export function createSupplierPayment(input: {
  supplierId: string
  amountUsd: number
  methodId: string
  orderId?: string | null
  note?: string
  cashier?: string
  createdAt?: string
}) {
  const suppliers = readSuppliers()
  const supplier = suppliers.find((item) => item.id === input.supplierId)
  if (!supplier) {
    throw new Error('Поставщик не найден.')
  }
  const amountUsd = roundUsd(Math.abs(Number(input.amountUsd) || 0))
  if (amountUsd <= 0) {
    throw new Error('Сумма оплаты должна быть больше нуля.')
  }
  const methods = readPaymentMethodSettings()
  const method =
    methods.find((item) => item.id === input.methodId && item.status === 'active') ?? null
  if (!method || method.channel === 'credit') {
    throw new Error('Способ оплаты недоступен.')
  }
  const orders = readPurchaseOrders()
  if (
    input.orderId &&
    !orders.some((item) => item.id === input.orderId && item.supplierId === supplier.id)
  ) {
    throw new Error('Заказ для этого поставщика не найден.')
  }
  const targetOrders = orders.filter((item) => {
    if (item.supplierId !== supplier.id || item.status === 'cancelled') return false
    if (input.orderId) return item.id === input.orderId
    return true
  })
  const totalUnpaidUsd = roundUsd(targetOrders.reduce(
    (sum, item) => sum + Math.max(0, item.totalUsd - item.paidUsd),
    0,
  ))
  if (totalUnpaidUsd <= 0) {
    throw new Error('Supplier has no unpaid balance.')
  }
  if (amountUsd - totalUnpaidUsd > 0.001) {
    throw new Error('Оплата превышает долг поставщику.')
  }
  const now = input.createdAt ?? new Date().toISOString()
  const payment: ErpSupplierPayment = {
    id: makeId('suppay'),
    supplierId: supplier.id,
    supplierName: supplier.name,
    createdAt: now,
    amountUsd,
    preferredOrderId: input.orderId ?? null,
    methodId: method.id,
    methodLabel: method.label,
    account: accountForPayment(method.id),
    cashier: input.cashier?.trim() || 'Исломали Н.',
    note: input.note?.trim() ?? '',
    creditUsd: 0,
    allocations: [],
  }
  const transaction: ErpFinanceTransaction = {
    id: makeId('fin'),
    createdAt: now,
    operationDate: now,
    operation: `Оплата поставщику ${supplier.name}`,
    kind: 'profit_loss',
    amount: -amountUsd,
    currency: 'USD',
    account: payment.account,
    method: payment.methodLabel,
    sourceType: 'supplier_payment',
    sourceId: payment.id,
  }
  writeSupplierPayments([payment, ...readSupplierPayments()])
  writeFinanceTransactions([transaction, ...readFinanceTransactions()])
  return (
    reconcileSupplierLedger(supplier.id).payments.find((item) => item.id === payment.id) ?? payment
  )
}export function createPurchaseReturn(input: {
  orderId: string
  reason?: string
  lines: Array<{
    productId: string
    qty: number
  }>
}) {
  const orders = readPurchaseOrders()
  const order = orders.find((item) => item.id === input.orderId)
  if (!order) {
    throw new Error('Заказ поставщику не найден.')
  }

  const existingReturns = readPurchaseReturns().filter((item) => item.orderId === order.id)
  const returnedByProductId = new Map<string, number>()
  const returningNowByProductId = new Map<string, number>()

  for (const purchaseReturn of existingReturns) {
    for (const line of purchaseReturn.lines) {
      returnedByProductId.set(
        line.productId,
        (returnedByProductId.get(line.productId) ?? 0) + line.qty,
      )
    }
  }

  const normalizedLines = input.lines
    .map((line) => {
      const orderLine = order.lines.find((item) => item.productId === line.productId)
      if (!orderLine) return null
      const qty = normalizeQty(line.qty)
      if (qty <= 0) return null
      const alreadyReturned = returnedByProductId.get(line.productId) ?? 0
      const returningNow = returningNowByProductId.get(line.productId) ?? 0
      const available = Math.max(0, orderLine.receivedQty - alreadyReturned - returningNow)
      if (qty > available) {
        throw new Error(`Количество возврата превышает доступный остаток для ${orderLine.productName}.`)
      }
      returningNowByProductId.set(line.productId, returningNow + qty)
      return {
        productId: orderLine.productId,
        productName: orderLine.productName,
        qty,
      } satisfies ErpPurchaseReturnLine
    })
    .filter((line): line is ErpPurchaseReturnLine => Boolean(line))

  if (normalizedLines.length === 0) {
    throw new Error('Purchase return must include at least one product.')
  }

  const now = new Date().toISOString()
  applyInventoryChanges(
    normalizedLines.map((line) => ({
      productId: line.productId,
      delta: -line.qty,
      type: 'supplier_return',
      sourceId: order.id,
      reason: input.reason?.trim() || `Возврат поставщику по заказу ${order.name}`,
    })),
  )

  const purchaseReturn: ErpPurchaseReturn = {
    id: makeId('poret'),
    orderId: order.id,
    orderName: order.name,
    supplierId: order.supplierId,
    supplierName: order.supplierName,
    createdAt: now,
    reason: input.reason?.trim() || '',
    lines: normalizedLines,
  }

  const returnedUsd = normalizedLines.reduce((sum, line) => {
    const orderLine = order.lines.find((item) => item.productId === line.productId)
    return sum + (orderLine?.costUsd ?? 0) * line.qty
  }, 0)

  const nextOrders = orders.map((item) => {
    if (item.id !== order.id) return item
    const totalUsd = roundUsd(Math.max(0, item.totalUsd - returnedUsd))
    const paidUsd = Math.min(item.paidUsd, totalUsd)
    return {
      ...item,
      totalUsd,
      paidUsd,
      status: purchaseOrderStatus(item.lines, paidUsd, totalUsd),
    }
  })

  writePurchaseOrders(nextOrders)
  writePurchaseReturns([purchaseReturn, ...readPurchaseReturns()])
  return (
    reconcileSupplierLedger(order.supplierId).returns.find((item) => item.id === purchaseReturn.id) ??
    purchaseReturn
  )
}

export function createClient(input: {
  name: string
  phone?: string
  card?: string
  group?: string
  tags?: string[]
  birthday?: string
  gender?: 'male' | 'female'
}) {
  const now = new Date().toISOString()
  const client: ErpClient = {
    id: makeId('client'),
    name: input.name.trim(),
    phone: input.phone?.trim() ?? '',
    card: input.card?.trim() || '',
    group: input.group?.trim() || '-',
    tags: input.tags ?? [],
    birthday: input.birthday?.trim() || '-',
    gender: input.gender ?? 'male',
    createdAt: now,
    updatedAt: now,
  }

  writeClients([client, ...readClients()])
  return client
}

export function ensureClientExists(name: string) {
  const normalizedName = normalizeClientName(name)
  if (!normalizedName) return null

  const clients = readClients()
  const existing = clients.find(
    (client) => normalizeClientName(client.name) === normalizedName,
  )

  if (existing) return existing

  return createClient({ name })
}

export function getClientSummaryRows(): ClientSummaryRow[] {
  const clients = readClients()
  const sales = readSales().filter((sale) => sale.client)
  const salesByClient = new Map<string, ErpSale[]>()

  for (const sale of sales) {
    const normalizedName = normalizeClientName(sale.client ?? '')
    if (!normalizedName) continue
    const current = salesByClient.get(normalizedName) ?? []
    current.push(sale)
    salesByClient.set(normalizedName, current)
  }

  const registeredRows = clients.map((client) => {
    const clientSales =
      salesByClient.get(normalizeClientName(client.name)) ?? []

    return {
      id: client.id,
      name: client.name,
      phone: client.phone || '-',
      card: client.card || '',
      group: client.group || '-',
      tags: client.tags,
      totalSpent: clientSales.reduce((sum, sale) => sum + sale.total, 0),
      purchaseCount: clientSales.length,
      lastPurchaseAt: clientSales[0]?.createdAt ?? null,
      birthday: client.birthday || '-',
    }
  })

  const orphanRows = Array.from(salesByClient.entries())
    .filter(
      ([name]) =>
        !clients.some((client) => normalizeClientName(client.name) === name),
    )
    .map(([name, clientSales]) => ({
      id: `sale-client-${name}`,
      name: clientSales[0]?.client ?? name,
      phone: '-',
      card: '',
      group: '-',
      tags: [],
      totalSpent: clientSales.reduce((sum, sale) => sum + sale.total, 0),
      purchaseCount: clientSales.length,
      lastPurchaseAt: clientSales[0]?.createdAt ?? null,
      birthday: '-',
    }))

  return [...registeredRows, ...orphanRows].sort((left, right) => {
    const leftDate = left.lastPurchaseAt ?? left.id
    const rightDate = right.lastPurchaseAt ?? right.id
    return rightDate.localeCompare(leftDate)
  })
}

export function getClientReportSummary(): ClientReportSummary {
  const clientRows = getClientSummaryRows()
  const clientSales = readSales().filter((sale) => sale.client)
  const buyers = clientRows.filter((client) => client.purchaseCount > 0)
  const totalClientRevenue = clientSales.reduce((sum, sale) => sum + sale.total, 0)

  return {
    clientCount: clientRows.length,
    buyersCount: buyers.length,
    newClientsCount: buyers.filter((client) => client.purchaseCount === 1).length,
    returningClientsCount: buyers.filter((client) => client.purchaseCount > 1).length,
    clientSalesCount: clientSales.length,
    totalClientRevenue,
    averageCheck: clientSales.length > 0 ? totalClientRevenue / clientSales.length : 0,
    averageRevenuePerClient:
      buyers.length > 0 ? totalClientRevenue / buyers.length : 0,
    topClients: [...buyers]
      .sort((left, right) => right.totalSpent - left.totalSpent)
      .slice(0, 8),
    latestClientSales: clientSales.slice(0, 8),
  }
}

export function getDebtSummary(): DebtSummary {
  const debts = readDebts()

  return {
    totalDebtAmount: debts.reduce((sum, debt) => sum + debt.totalAmount, 0),
    totalPaidAmount: debts.reduce((sum, debt) => sum + debt.paidAmount, 0),
    totalRemainingAmount: debts.reduce(
      (sum, debt) => sum + debt.remainingAmount,
      0,
    ),
    debtorCount: new Set(
      debts
        .filter((debt) => debt.remainingAmount > 0)
        .map((debt) => debt.clientName),
    ).size,
    overdueCount: debts.filter((debt) => debt.status === 'overdue').length,
    unpaidCount: debts.filter((debt) => debt.status === 'unpaid').length,
    partialCount: debts.filter((debt) => debt.status === 'partial').length,
    paidCount: debts.filter((debt) => debt.status === 'paid').length,
    debts,
  }
}

export function getDashboardFeed(): DashboardFeed {
  const sales = readSales()
  const products = readProducts()
  const clientRows = getClientSummaryRows()
  const productById = new Map(products.map((product) => [product.id, product]))
  const soldByProduct = new Map<
    string,
    { name: string; qty: number; revenue: number; category: string }
  >()
  const soldByCategory = new Map<string, number>()

  for (const sale of sales) {
    for (const line of sale.lines) {
      const product = productById.get(line.productId)
      const current = soldByProduct.get(line.productId) ?? {
        name: line.name,
        qty: 0,
        revenue: 0,
        category: product?.category ?? '-',
      }

      current.qty += line.qty
      current.revenue += line.total
      soldByProduct.set(line.productId, current)

      const category = product?.category ?? '-'
      soldByCategory.set(category, (soldByCategory.get(category) ?? 0) + line.qty)
    }
  }

  const totalCategoryQty = Array.from(soldByCategory.values()).reduce(
    (sum, qty) => sum + qty,
    0,
  )

  return {
    recentOrders: sales.slice(0, 8).map((sale) => ({
      id: `#${sale.id}`,
      customer: sale.client ?? 'Гость',
      initials: customerInitials(sale.client ?? 'Гость'),
      products: summarizeSaleProducts(sale),
      status: 'Completed',
      payment: sale.payments.some((payment) => payment.methodId !== 'debt')
        ? sale.payments.some((payment) => payment.methodId === 'debt')
          ? 'Pending'
          : 'Paid'
        : 'Pending',
      date: formatDashboardDate(sale.createdAt),
      amount: `${formatUZS(sale.total)} UZS`,
    })),
    topProducts: Array.from(soldByProduct.values())
      .sort((left, right) => right.revenue - left.revenue)
      .slice(0, 4)
      .map((item) => ({
        name: item.name,
        sold: item.qty,
        revenue: `${formatUZS(item.revenue)} UZS`,
        trend: 0,
      })),
    topCategories: Array.from(soldByCategory.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 4)
      .map(([name, qty]) => ({
        name,
        share: totalCategoryQty > 0 ? Math.round((qty / totalCategoryQty) * 100) : 0,
      })),
    topCustomers: clientRows
      .filter((client) => client.purchaseCount > 0)
      .sort((left, right) => right.totalSpent - left.totalSpent)
      .slice(0, 4)
      .map((client) => ({
        name: client.name,
        spend: `${formatUZS(client.totalSpent)} UZS`,
        orders: client.purchaseCount,
        initials: customerInitials(client.name),
      })),
    recentActivity: buildDashboardActivity(),
    inventoryAlerts: products
      .filter((product) => product.stock <= product.lowStockThreshold)
      .sort((left, right) => left.stock - right.stock)
      .slice(0, 4)
      .map((product) => ({
        name: product.name,
        level: product.stock,
        status:
          product.stock <= 0
            ? 'out'
            : product.stock <= Math.max(1, Math.floor(product.lowStockThreshold / 2))
              ? 'critical'
              : 'low',
      })),
    warehouse: buildWarehouseDashboardItems(products),
  }
}

export function repayDebt(input: {
  debtId: string
  payments: {
    methodId: string
    label: string
    amount: number
  }[]
  cashier?: string
}) {
  const debts = readDebts()
  const debtIndex = debts.findIndex((debt) => debt.id === input.debtId)
  if (debtIndex < 0) {
    throw new Error('Долг не найден.')
  }

  const debt = debts[debtIndex]
  const validPayments = input.payments
    .map((payment) => ({
      ...payment,
      amount: Math.max(0, Number(payment.amount) || 0),
    }))
    .filter((payment) => payment.amount > 0)

  if (validPayments.length === 0) {
    throw new Error('Repayment amount must be greater than zero.')
  }

  const repaymentTotal = validPayments.reduce(
    (sum, payment) => sum + payment.amount,
    0,
  )

  if (repaymentTotal > debt.remainingAmount) {
    throw new Error('Repayment exceeds remaining debt.')
  }

  const now = new Date().toISOString()
  const debtPayments = validPayments.map((payment) => ({
    id: makeId('debt-pay'),
    createdAt: now,
    amount: payment.amount,
    methodId: payment.methodId,
    methodLabel: payment.label,
    account: accountForPayment(payment.methodId),
    cashier: input.cashier ?? debt.cashier,
  }))

  const paidAmount = debt.paidAmount + repaymentTotal
  const remainingAmount = Math.max(0, debt.totalAmount - paidAmount)
  const nextDebt: ErpDebt = {
    ...debt,
    paidAmount,
    remainingAmount,
    status: debtStatus(remainingAmount, debt.dueDate, paidAmount),
    payments: [...debtPayments, ...debt.payments],
  }

  const nextDebts = [...debts]
  nextDebts[debtIndex] = nextDebt
  writeDebts(nextDebts)

  const transactions = debtPayments.map((payment) => ({
    id: makeId('fin'),
    createdAt: payment.createdAt,
    operationDate: payment.createdAt,
    operation: `Погашение долга #${debt.id}`,
    kind: 'cashflow' as const,
    amount: payment.amount,
    currency: 'UZS' as const,
    account: payment.account,
    method: payment.methodLabel,
    sourceType: 'income' as const,
    sourceId: debt.id,
  }))

  writeFinanceTransactions([...transactions, ...readFinanceTransactions()])
  return nextDebt
}

export function readWarehouseStocks(): WarehouseStocks {
  const products = readProducts()
  const stocks = readJson<WarehouseStocks>(WAREHOUSE_STOCKS_KEY, {})
  let changed = false

  for (const product of products) {
    if (!stocks[product.id]) {
      stocks[product.id] = Object.fromEntries(
        defaultWarehouses.map((warehouse) => [
          warehouse.id,
          warehouse.id === DEFAULT_WAREHOUSE_ID ? product.stock : 0,
        ]),
      )
      changed = true
      continue
    }

    for (const warehouse of defaultWarehouses) {
      if (stocks[product.id][warehouse.id] === undefined) {
        stocks[product.id][warehouse.id] = 0
        changed = true
      }
    }
  }

  if (changed) writeJson(WAREHOUSE_STOCKS_KEY, stocks)
  return stocks
}

type SaleReturnDraft = {
  saleId: string
  seller?: string
  reason?: string
  lines: {
    productId: string
    qty: number
  }[]
}

type SaleExchangeDraft = {
  saleId: string
  seller?: string
  reason?: string
  returnLines: {
    productId: string
    qty: number
  }[]
  exchange: {
    orderNumber?: string
    client: string | null
    seller: string
    store?: string
    saleChannel?: 'retail' | 'wholesale'
    subtotal: number
    discount: number
    total: number
    lines: {
      product: CatalogProduct
      qty: number
      unitPrice?: number
      priceType?: 'retail' | 'wholesale'
    }[]
    payments: ErpSalePayment[]
    note?: string
  }
}

function normalizeSaleReturnLines(
  sourceSale: ErpSale,
  sales: ErpSale[],
  draftLines: SaleReturnDraft['lines'],
): ErpSaleLine[] {
  const alreadyReturned = new Map<string, number>()
  for (const sale of sales) {
    if (sale.type !== 'return' || sale.sourceSaleId !== sourceSale.id) continue
    for (const line of sale.lines) {
      alreadyReturned.set(
        line.productId,
        (alreadyReturned.get(line.productId) ?? 0) + line.qty,
      )
    }
  }

  const returningNow = new Map<string, number>()
  const normalizedLines: ErpSaleLine[] = []

  for (const line of draftLines) {
    const sourceLine = sourceSale.lines.find(
      (item) => item.productId === line.productId,
    )
    if (!sourceLine) continue

    const qty = normalizeQty(line.qty)
    if (qty <= 0) continue

    const returned = alreadyReturned.get(line.productId) ?? 0
    const pending = returningNow.get(line.productId) ?? 0
    const available = sourceLine.qty - returned - pending
    if (qty > available) {
      throw new Error(`\u041a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e \u0432\u043e\u0437\u0432\u0440\u0430\u0442\u0430 \u043f\u0440\u0435\u0432\u044b\u0448\u0430\u0435\u0442 \u043f\u0440\u043e\u0434\u0430\u043d\u043d\u043e\u0435 \u043a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e \u0434\u043b\u044f ${sourceLine.name}.`)
    }

    returningNow.set(line.productId, pending + qty)
    normalizedLines.push({
      ...sourceLine,
      qty,
      total: qty * sourceLine.unitPrice,
    })
  }

  if (normalizedLines.length === 0) {
    throw new Error('\u0412\u043e\u0437\u0432\u0440\u0430\u0442 \u0434\u043e\u043b\u0436\u0435\u043d \u0441\u043e\u0434\u0435\u0440\u0436\u0430\u0442\u044c \u0445\u043e\u0442\u044f \u0431\u044b \u043e\u0434\u0438\u043d \u0442\u043e\u0432\u0430\u0440.')
  }

  return normalizedLines
}

export function getWarehouseStock(productId: string, warehouseId = DEFAULT_WAREHOUSE_ID) {
  return readWarehouseStocks()[productId]?.[warehouseId] ?? 0
}

export function getTotalWarehouseStock(
  productId: string,
  stocks: WarehouseStocks = readWarehouseStocks(),
) {
  return Object.values(stocks[productId] ?? {}).reduce((sum, qty) => sum + qty, 0)
}

export type ProductWarehouseStock = ErpWarehouse & {
  qty: number
}

export function getProductWarehouseStocks(productId: string): ProductWarehouseStock[] {
  const stocks = readWarehouseStocks()[productId] ?? {}

  return readWarehouses().map((warehouse) => ({
    ...warehouse,
    qty: stocks[warehouse.id] ?? 0,
  }))
}

export function getStoreRestockSuggestions(productId: string, requiredQty = 1) {
  const storeQty = getWarehouseStock(productId, DEFAULT_WAREHOUSE_ID)
  const missingQty = Math.max(0, normalizeQty(requiredQty) - storeQty)

  return getProductWarehouseStocks(productId)
    .filter((warehouse) => warehouse.id !== DEFAULT_WAREHOUSE_ID && warehouse.qty > 0)
    .map((warehouse) => ({
      ...warehouse,
      canMoveQty: missingQty > 0 ? Math.min(warehouse.qty, missingQty) : warehouse.qty,
    }))
    .sort((left, right) => right.qty - left.qty)
}

export function applyInventoryChanges(changes: InventoryChange[]) {
  const products = readProducts()
  const stocks = structuredClone(readWarehouseStocks())
  const now = new Date().toISOString()
  const movements: ErpInventoryMovement[] = []

  for (const change of changes) {
    const product = products.find((item) => item.id === change.productId)
    if (!product) throw new Error(`Товар ${change.productId} не найден.`)

    const warehouseId = change.warehouseId ?? DEFAULT_WAREHOUSE_ID
    const warehouse = readWarehouses().find((item) => item.id === warehouseId)
    const warehouseName = warehouse?.name ?? warehouseId
    const beforeQty = stocks[product.id]?.[warehouseId] ?? 0
    const afterQty = beforeQty + change.delta

    if (afterQty < 0) {
      throw new Error(`Недостаточно остатка для ${product.name}.`)
    }

    stocks[product.id] = {
      ...(stocks[product.id] ?? {}),
      [warehouseId]: afterQty,
    }

    movements.push({
      id: makeId('mov'),
      createdAt: now,
      productId: product.id,
      productName: product.name,
      warehouseId,
      warehouseName,
      type: change.type,
      qty: change.delta,
      beforeQty,
      afterQty,
      reason: change.reason,
      sourceId: change.sourceId,
    })
  }

  const nextProducts = products.map((product) => ({
    ...product,
    // Warehouse balances are the source of truth. Catalog stock is a
    // compatibility projection for existing screens and reports.
    stock: getTotalWarehouseStock(product.id, stocks),
    updatedAt: now,
  }))

  writeJson(WAREHOUSE_STOCKS_KEY, stocks)
  writeProducts(nextProducts)
  writeJson(INVENTORY_MOVEMENTS_KEY, [
    ...movements,
    ...readInventoryMovements(),
  ])

  return movements
}

export function transferInventory({
  productId,
  qty,
  fromWarehouseId = DEFAULT_WAREHOUSE_ID,
  toWarehouseId,
  sourceId,
  reason = 'Перемещение товара',
}: {
  productId: string
  qty: number
  fromWarehouseId?: string
  toWarehouseId: string
  sourceId?: string
  reason?: string
}) {
  const amount = normalizeQty(qty)
  if (amount <= 0) {
    throw new Error('Transfer quantity must be greater than zero.')
  }
  if (fromWarehouseId === toWarehouseId) {
    throw new Error('Transfer warehouses must be different.')
  }

  return applyInventoryChanges([
    {
      productId,
      warehouseId: fromWarehouseId,
      delta: -amount,
      type: 'transfer_out',
      sourceId,
      reason,
    },
    {
      productId,
      warehouseId: toWarehouseId,
      delta: amount,
      type: 'transfer_in',
      sourceId,
      reason,
    },
  ])
}

export function adjustInventoryToCount({
  productId,
  countedQty,
  warehouseId = DEFAULT_WAREHOUSE_ID,
  sourceId,
  reason = 'Инвентаризация',
}: {
  productId: string
  countedQty: number
  warehouseId?: string
  sourceId?: string
  reason?: string
}) {
  const normalizedCount = normalizeQty(countedQty)
  const currentQty = getWarehouseStock(productId, warehouseId)
  const delta = normalizedCount - currentQty

  if (delta === 0) return []

  return applyInventoryChanges([
    {
      productId,
      warehouseId,
      delta,
      type: 'inventory_adjustment',
      sourceId,
      reason,
    },
  ])
}

export function createManualFinanceTransaction(
  draft: ManualFinanceDraft,
): ErpFinanceTransaction {
  const now = new Date().toISOString()
  const signedAmount =
    draft.type === 'expense' ? -Math.abs(draft.amount) : Math.abs(draft.amount)
  const category = draft.category?.trim()
  const reason = draft.reason?.trim()

  let operation = operationTitle(draft.type)
  if (category && reason && reason !== category) {
    operation = `${operation}: ${category} — ${reason}`
  } else if (category) {
    operation = `${operation}: ${category}`
  } else if (reason) {
    operation = `${operation}: ${reason}`
  }

  const transaction: ErpFinanceTransaction = {
    id: makeId('fin'),
    createdAt: now,
    operationDate: now,
    operation,
    kind: draft.type === 'expense' ? 'profit_loss' : 'cashflow',
    amount: signedAmount,
    currency: 'UZS',
    account: draft.account,
    method: draft.method,
    sourceType: draft.type,
  }

  writeFinanceTransactions([transaction, ...readFinanceTransactions()])
  return transaction
}

export function createFinanceShiftClosure(input: {
  account: string
  sentAmount: number
  receivedAmount: number
  cashier?: string
  receivedBy?: string
}) {
  const sentAmount = Math.max(0, Number(input.sentAmount) || 0)
  const receivedAmount = Math.max(0, Number(input.receivedAmount) || 0)

  if (sentAmount <= 0) {
    throw new Error('Shift amount must be greater than zero.')
  }

  const now = new Date().toISOString()
  const shift: ErpFinanceShift = {
    id: makeId('shift'),
    createdAt: now,
    account: input.account,
    sentAmount,
    receivedAmount,
    status: 'accepted',
    cashier: input.cashier?.trim() || 'Исломали Н.',
    receivedBy: input.receivedBy?.trim() || 'Исломали Н.',
  }

  writeFinanceShifts([shift, ...readFinanceShifts()])

  const diff = receivedAmount - sentAmount
  if (diff !== 0) {
    const category =
      diff > 0
        ? 'Автодоход разницы при закрытии кассы'
        : 'Автосписание разницы при закрытии кассы'

    createManualFinanceTransaction({
      type: diff > 0 ? 'income' : 'expense',
      amount: Math.abs(diff),
      account: input.account,
      method: 'Наличные',
      category,
    })
  }

  return shift
}

export function createFinanceTransfer(input: {
  fromAccount: string
  toAccount: string
  amount: number
  method: string
  cashier?: string
  receivedBy?: string
  operationLabel?: string
}) {
  const amount = Math.max(0, Number(input.amount) || 0)
  if (amount <= 0) {
    throw new Error('Transfer amount must be greater than zero.')
  }
  if (input.fromAccount === input.toAccount) {
    throw new Error('Transfer accounts must be different.')
  }

  const now = new Date().toISOString()
  const transfer: ErpFinanceTransfer = {
    id: makeId('transfer'),
    createdAt: now,
    fromAccount: input.fromAccount,
    toAccount: input.toAccount,
    amount,
    method: input.method,
    status: 'accepted',
    cashier: input.cashier?.trim() || 'Исломали Н.',
    receivedBy: input.receivedBy?.trim() || 'Исломали Н.',
  }

  writeFinanceTransfers([transfer, ...readFinanceTransfers()])

  const rows: ErpFinanceTransaction[] = [
    {
      id: makeId('fin'),
      createdAt: now,
      operationDate: now,
      operation: `${input.operationLabel ?? 'Перемещение'} #${transfer.id}`,
      kind: 'through',
      amount: -amount,
      currency: 'UZS',
      account: input.fromAccount,
      method: input.method,
      sourceType: 'transfer',
      sourceId: transfer.id,
    },
    {
      id: makeId('fin'),
      createdAt: now,
      operationDate: now,
      operation: `${input.operationLabel ?? 'Перемещение'} #${transfer.id}`,
      kind: 'through',
      amount,
      currency: 'UZS',
      account: input.toAccount,
      method: input.method,
      sourceType: 'transfer',
      sourceId: transfer.id,
    },
  ]

  writeFinanceTransactions([...rows, ...readFinanceTransactions()])
  return transfer
}

export function createFinanceConversion(input: {
  fromAccount: string
  toAccount: string
  fromAmount: number
  toAmount: number
  method: string
  cashier?: string
  receivedBy?: string
}) {
  const fromAmount = Math.max(0, Number(input.fromAmount) || 0)
  const toAmount = Math.max(0, Number(input.toAmount) || 0)

  if (fromAmount <= 0 || toAmount <= 0) {
    throw new Error('Conversion amounts must be greater than zero.')
  }

  const now = new Date().toISOString()
  const conversion: ErpFinanceConversion = {
    id: makeId('conversion'),
    createdAt: now,
    fromAccount: input.fromAccount,
    toAccount: input.toAccount,
    fromAmount,
    toAmount,
    method: input.method,
    status: 'accepted',
    cashier: input.cashier?.trim() || 'Исломали Н.',
    receivedBy: input.receivedBy?.trim() || 'Исломали Н.',
  }

  writeFinanceConversions([conversion, ...readFinanceConversions()])

  const rows: ErpFinanceTransaction[] = [
    {
      id: makeId('fin'),
      createdAt: now,
      operationDate: now,
      operation: `Конвертация #${conversion.id}`,
      kind: 'through',
      amount: -fromAmount,
      currency: 'UZS',
      account: input.fromAccount,
      method: input.method,
      sourceType: 'conversion',
      sourceId: conversion.id,
    },
    {
      id: makeId('fin'),
      createdAt: now,
      operationDate: now,
      operation: `Конвертация #${conversion.id}`,
      kind: 'through',
      amount: toAmount,
      currency: 'UZS',
      account: input.toAccount,
      method: input.method,
      sourceType: 'conversion',
      sourceId: conversion.id,
    },
  ]

  writeFinanceTransactions([...rows, ...readFinanceTransactions()])
  return conversion
}

export function completeSale(draft: SaleDraft): ErpSale {
  if (draft.lines.length === 0) {
    throw new Error('\u041f\u0440\u043e\u0434\u0430\u0436\u0430 \u0434\u043e\u043b\u0436\u043d\u0430 \u0441\u043e\u0434\u0435\u0440\u0436\u0430\u0442\u044c \u0445\u043e\u0442\u044f \u0431\u044b \u043e\u0434\u0438\u043d \u0442\u043e\u0432\u0430\u0440.')
  }
  if (draft.total <= 0) {
    throw new Error('\u0421\u0443\u043c\u043c\u0430 \u043f\u0440\u043e\u0434\u0430\u0436\u0438 \u0434\u043e\u043b\u0436\u043d\u0430 \u0431\u044b\u0442\u044c \u0431\u043e\u043b\u044c\u0448\u0435 \u043d\u0443\u043b\u044f.')
  }

  const lines: ErpSaleLine[] = []
  const inventoryChanges: InventoryChange[] = []

  for (const line of draft.lines) {
    const qty = normalizeQty(line.qty)
    if (qty <= 0) continue

    const available = getWarehouseStock(line.product.id)
    if (available < qty) {
      const suggestion = getStoreRestockSuggestions(line.product.id, qty)[0]
      throw new Error(
        suggestion
          ? `В магазине не хватает товара "${line.product.name}". Есть в зоне "${suggestion.name}": ${suggestion.qty}.`
          : `В магазине не хватает товара "${line.product.name}".`,
      )
    }

    const unitPrice = line.unitPrice ?? line.product.price

    lines.push({
      productId: line.product.id,
      name: line.product.name,
      sku: line.product.sku,
      barcode: line.product.barcode,
      qty,
      unitPrice,
      total: qty * unitPrice,
      priceType: line.priceType ?? draft.saleChannel ?? 'retail',
    })

    inventoryChanges.push({
      productId: line.product.id,
      delta: -qty,
      type: 'sale',
      sourceId: draft.orderNumber,
      reason: 'Продажа',
    })
  }

  if (lines.length === 0) {
    throw new Error('\u0412 \u043f\u0440\u043e\u0434\u0430\u0436\u0435 \u0434\u043e\u043b\u0436\u043d\u044b \u0431\u044b\u0442\u044c \u0442\u043e\u0432\u0430\u0440\u044b \u0441 \u043a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e\u043c \u0431\u043e\u043b\u044c\u0448\u0435 \u043d\u0443\u043b\u044f.')
  }

  const debtAmount = draft.payments
    .filter((payment) => payment.methodId === 'debt')
    .reduce((sum, payment) => sum + payment.amount, 0)

  if (debtAmount > 0 && !draft.client) {
    throw new Error('\u041f\u0440\u043e\u0434\u0430\u0436\u0430 \u0432 \u0434\u043e\u043b\u0433 \u0442\u0440\u0435\u0431\u0443\u0435\u0442 \u0432\u044b\u0431\u043e\u0440\u0430 \u043a\u043b\u0438\u0435\u043d\u0442\u0430.')
  }

  const now = new Date().toISOString()
  const clientRecord = draft.client ? ensureClientExists(draft.client) : null
  const requestedSaleId = draft.orderNumber?.trim()
  const saleId =
    requestedSaleId && !readSales().some((item) => item.id === requestedSaleId)
      ? requestedSaleId
      : makeId(requestedSaleId ? `sale-${requestedSaleId}` : 'sale')
  const sale: ErpSale = {
    id: saleId,
    type: 'sale',
    saleChannel: draft.saleChannel ?? 'retail',
    createdAt: now,
    client: draft.client,
    seller: draft.seller,
    store: draft.store ?? 'Магазин / Подвал',
    subtotal: draft.subtotal,
    discount: draft.discount,
    total: draft.total,
    lines,
    payments: draft.payments,
    note: draft.note,
  }

  const financeRows = draft.payments
    .filter((payment) => payment.methodId !== 'debt')
    .map((payment) => ({
    id: makeId('fin'),
    createdAt: now,
    operationDate: now,
    operation: `Продажа #${sale.id}`,
    kind: 'cashflow' as const,
    amount: payment.amount,
    currency: 'UZS' as const,
    account: accountForPayment(payment.methodId),
    method: payment.label,
    sourceType: 'sale' as const,
    sourceId: sale.id,
  }))

  applyInventoryChanges(
    inventoryChanges.map((change) => ({ ...change, sourceId: sale.id })),
  )
  writeSales([sale, ...readSales()])
  writeFinanceTransactions([...financeRows, ...readFinanceTransactions()])

  if (debtAmount > 0) {
    const debt = createDebtFromSale({
      sale,
      clientId: clientRecord?.id ?? null,
      clientPhone: clientRecord?.phone ?? '',
      amount: debtAmount,
      createdAt: now,
    })
    writeDebts([debt, ...readDebts()])
  }

  if (isBrowser()) {
    window.dispatchEvent(new CustomEvent(PRODUCT_CATALOG_CHANGED))
  }

  return sale
}

export function createSaleReturn(draft: SaleReturnDraft): ErpSale {
  const sales = readSales()
  const sourceSale = sales.find(
    (sale) => sale.id === draft.saleId && sale.type === 'sale',
  )
  if (!sourceSale) {
    throw new Error('Продажа не найдена.')
  }

  const alreadyReturned = new Map<string, number>()
  for (const sale of sales) {
    if (sale.type !== 'return' || sale.sourceSaleId !== sourceSale.id) continue
    for (const line of sale.lines) {
      alreadyReturned.set(
        line.productId,
        (alreadyReturned.get(line.productId) ?? 0) + line.qty,
      )
    }
  }

  const returningNow = new Map<string, number>()
  const normalizedLines = draft.lines
    .map((line) => {
      const sourceLine = sourceSale.lines.find(
        (item) => item.productId === line.productId,
      )
      if (!sourceLine) return null

      const qty = normalizeQty(line.qty)
      if (qty <= 0) return null

      const returned = alreadyReturned.get(line.productId) ?? 0
      const pending = returningNow.get(line.productId) ?? 0
      const available = sourceLine.qty - returned - pending
      if (qty > available) {
        throw new Error(`Количество возврата превышает проданное количество для ${sourceLine.name}.`)
      }

      returningNow.set(line.productId, pending + qty)

      return {
        ...sourceLine,
        qty,
        total: qty * sourceLine.unitPrice,
      }
    })
    .filter((line): line is ErpSaleLine => Boolean(line))

  if (normalizedLines.length === 0) {
    throw new Error('\u0412\u043e\u0437\u0432\u0440\u0430\u0442 \u0434\u043e\u043b\u0436\u0435\u043d \u0441\u043e\u0434\u0435\u0440\u0436\u0430\u0442\u044c \u0445\u043e\u0442\u044f \u0431\u044b \u043e\u0434\u0438\u043d \u0442\u043e\u0432\u0430\u0440.')
  }

  const now = new Date().toISOString()
  const total = normalizedLines.reduce((sum, line) => sum + line.total, 0)
  const saleReturn: ErpSale = {
    id: makeId('return'),
    type: 'return',
    saleChannel: sourceSale.saleChannel ?? 'retail',
    sourceSaleId: sourceSale.id,
    createdAt: now,
    client: sourceSale.client,
    seller: draft.seller?.trim() || sourceSale.seller,
    store: sourceSale.store,
    subtotal: -total,
    discount: 0,
    total: -total,
    lines: normalizedLines,
    payments: [],
    note: draft.reason?.trim() || `Возврат по продаже #${sourceSale.id}`,
  }

  applyInventoryChanges(
    normalizedLines.map((line) => ({
      productId: line.productId,
      delta: line.qty,
      type: 'sale_return',
      sourceId: saleReturn.id,
      reason: saleReturn.note,
    })),
  )

  const refundRows = sourceSale.payments
    .filter((payment) => payment.methodId !== 'debt' && payment.amount > 0)
    .map((payment) => {
      const share = sourceSale.total > 0 ? payment.amount / sourceSale.total : 0
      return {
        id: makeId('fin'),
        createdAt: now,
        operationDate: now,
        operation: `Возврат продажи #${sourceSale.id}`,
        kind: 'cashflow' as const,
        amount: -Math.min(payment.amount, Math.round(total * share)),
        currency: 'UZS' as const,
        account: accountForPayment(payment.methodId),
        method: payment.label,
        sourceType: 'sale' as const,
        sourceId: saleReturn.id,
      }
    })
    .filter((transaction) => transaction.amount < 0)

  writeSales([saleReturn, ...sales])
  if (refundRows.length > 0) {
    writeFinanceTransactions([...refundRows, ...readFinanceTransactions()])
  }

  if (isBrowser()) {
    window.dispatchEvent(new CustomEvent(PRODUCT_CATALOG_CHANGED))
  }

  return saleReturn
}

export function createSaleExchange(draft: SaleExchangeDraft): {
  saleReturn: ErpSale
  exchangeSale: ErpSale
} {
  if (draft.exchange.lines.length === 0) {
    throw new Error('\u041e\u0431\u043c\u0435\u043d \u0434\u043e\u043b\u0436\u0435\u043d \u0441\u043e\u0434\u0435\u0440\u0436\u0430\u0442\u044c \u0445\u043e\u0442\u044f \u0431\u044b \u043e\u0434\u0438\u043d \u0442\u043e\u0432\u0430\u0440 \u043d\u0430 \u0432\u044b\u0434\u0430\u0447\u0443.')
  }

  const sales = readSales()
  const sourceSale = sales.find(
    (sale) => sale.id === draft.saleId && sale.type === 'sale',
  )
  if (!sourceSale) {
    throw new Error('Продажа не найдена.')
  }

  normalizeSaleReturnLines(sourceSale, sales, draft.returnLines)

  for (const line of draft.exchange.lines) {
    const qty = normalizeQty(line.qty)
    if (qty <= 0) continue

    const available = getWarehouseStock(line.product.id)
    if (available < qty) {
      const suggestion = getStoreRestockSuggestions(line.product.id, qty)[0]
      throw new Error(
        suggestion
          ? `\u0412 \u043c\u0430\u0433\u0430\u0437\u0438\u043d\u0435 \u043d\u0435 \u0445\u0432\u0430\u0442\u0430\u0435\u0442 \u0442\u043e\u0432\u0430\u0440\u0430 "${line.product.name}". \u0415\u0441\u0442\u044c \u0432 \u0437\u043e\u043d\u0435 "${suggestion.name}": ${suggestion.qty}.`
          : `\u0412 \u043c\u0430\u0433\u0430\u0437\u0438\u043d\u0435 \u043d\u0435 \u0445\u0432\u0430\u0442\u0430\u0435\u0442 \u0442\u043e\u0432\u0430\u0440\u0430 "${line.product.name}".`,
      )
    }
  }

  const preflightPaymentSum = draft.exchange.payments.reduce(
    (sum, payment) => sum + Math.abs(payment.amount),
    0,
  )
  if (
    draft.exchange.total !== 0 &&
    preflightPaymentSum !== Math.abs(draft.exchange.total)
  ) {
    throw new Error('\u0421\u0443\u043c\u043c\u0430 \u0440\u0430\u0441\u0447\u0435\u0442\u0430 \u0434\u043e\u043b\u0436\u043d\u0430 \u0441\u043e\u0432\u043f\u0430\u0434\u0430\u0442\u044c \u0441 \u0440\u0430\u0437\u043d\u0438\u0446\u0435\u0439 \u043e\u0431\u043c\u0435\u043d\u0430.')
  }

  const saleReturn = createSaleReturn({
    saleId: draft.saleId,
    seller: draft.seller,
    reason: draft.reason?.trim() || `Обмен по продаже #${sourceSale.id}`,
    lines: draft.returnLines,
  })

  const lines: ErpSaleLine[] = []
  const inventoryChanges: InventoryChange[] = []

  for (const line of draft.exchange.lines) {
    const qty = normalizeQty(line.qty)
    if (qty <= 0) continue

    const available = getWarehouseStock(line.product.id)
    if (available < qty) {
      const suggestion = getStoreRestockSuggestions(line.product.id, qty)[0]
      throw new Error(
        suggestion
          ? `В магазине не хватает товара "${line.product.name}". Есть в зоне "${suggestion.name}": ${suggestion.qty}.`
          : `В магазине не хватает товара "${line.product.name}".`,
      )
    }

    const unitPrice = line.unitPrice ?? line.product.price
    lines.push({
      productId: line.product.id,
      name: line.product.name,
      sku: line.product.sku,
      barcode: line.product.barcode,
      qty,
      unitPrice,
      total: qty * unitPrice,
      priceType: line.priceType ?? draft.exchange.saleChannel ?? 'retail',
    })

    inventoryChanges.push({
      productId: line.product.id,
      delta: -qty,
      type: 'sale',
      reason: `Обмен #${draft.exchange.orderNumber ?? ''}`.trim(),
    })
  }

  if (lines.length === 0) {
    throw new Error('\u0412 \u043e\u0431\u043c\u0435\u043d\u0435 \u0434\u043e\u043b\u0436\u043d\u044b \u0431\u044b\u0442\u044c \u0442\u043e\u0432\u0430\u0440\u044b \u0441 \u043a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e\u043c \u0431\u043e\u043b\u044c\u0448\u0435 \u043d\u0443\u043b\u044f.')
  }

  const settlementTotal = draft.exchange.total
  const paymentSum = draft.exchange.payments.reduce(
    (sum, payment) => sum + Math.abs(payment.amount),
    0,
  )

  if (settlementTotal !== 0 && paymentSum !== Math.abs(settlementTotal)) {
    throw new Error('\u0421\u0443\u043c\u043c\u0430 \u0440\u0430\u0441\u0447\u0435\u0442\u0430 \u0434\u043e\u043b\u0436\u043d\u0430 \u0441\u043e\u0432\u043f\u0430\u0434\u0430\u0442\u044c \u0441 \u0440\u0430\u0437\u043d\u0438\u0446\u0435\u0439 \u043e\u0431\u043c\u0435\u043d\u0430.')
  }

  const now = new Date().toISOString()
  const exchangeSale: ErpSale = {
    id: draft.exchange.orderNumber || makeId('exchange'),
    type: 'exchange',
    saleChannel: draft.exchange.saleChannel ?? sourceSale.saleChannel ?? 'retail',
    sourceSaleId: sourceSale.id,
    createdAt: now,
    client: draft.exchange.client ?? sourceSale.client,
    seller: draft.exchange.seller.trim() || draft.seller?.trim() || sourceSale.seller,
    store: draft.exchange.store ?? sourceSale.store,
    subtotal: draft.exchange.subtotal,
    discount: draft.exchange.discount,
    total: settlementTotal,
    lines,
    payments: draft.exchange.payments,
    note:
      draft.exchange.note?.trim() ||
      draft.reason?.trim() ||
      `Обмен по продаже #${sourceSale.id}`,
  }

  const financeRows =
    settlementTotal === 0
      ? []
      : draft.exchange.payments.map((payment) => ({
          id: makeId('fin'),
          createdAt: now,
          operationDate: now,
          operation: `Обмен #${exchangeSale.id}`,
          kind: 'cashflow' as const,
          amount:
            settlementTotal > 0 ? Math.abs(payment.amount) : -Math.abs(payment.amount),
          currency: 'UZS' as const,
          account: accountForPayment(payment.methodId),
          method: payment.label,
          sourceType: 'sale' as const,
          sourceId: exchangeSale.id,
        }))

  applyInventoryChanges(
    inventoryChanges.map((change) => ({ ...change, sourceId: exchangeSale.id })),
  )
  writeSales([exchangeSale, ...readSales()])
  if (financeRows.length > 0) {
    writeFinanceTransactions([...financeRows, ...readFinanceTransactions()])
  }

  if (isBrowser()) {
    window.dispatchEvent(new CustomEvent(PRODUCT_CATALOG_CHANGED))
  }

  return { saleReturn, exchangeSale }
}

export function cancelSale(input: {
  saleId: string
  reason: string
  cancelledBy?: string
}): ErpSale {
  const sales = readSales()
  const saleIndex = sales.findIndex((item) => item.id === input.saleId)
  if (saleIndex < 0) {
    throw new Error('Продажа не найдена.')
  }

  const sale = sales[saleIndex]
  if (sale.cancelled) {
    throw new Error('Продажа уже была отменена.')
  }

  if (sale.type !== 'sale') {
    throw new Error('Можно отменить только обычную продажу.')
  }

  // Проверка: не более 24 часов с момента продажи
  const saleDate = new Date(sale.createdAt)
  const now = new Date()
  const hoursDiff = (now.getTime() - saleDate.getTime()) / (1000 * 60 * 60)
  if (hoursDiff > 24) {
    throw new Error('Продажу нельзя отменить более чем через 24 часа после оформления.')
  }

  const cancelledAt = now.toISOString()
  const cancelledBy = input.cancelledBy?.trim() || sale.seller

  // Отмена инвентаря (возврат товаров)
  const inventoryChanges = sale.lines.map((line) => ({
    productId: line.productId,
    delta: line.qty,
    type: 'sale_return' as const,
    sourceId: sale.id,
    reason: `Отмена продажи #${sale.id}: ${input.reason}`,
  }))

  applyInventoryChanges(inventoryChanges)

  // Финансовые корректировки (возврат оплат)
  const financeRefundRows = sale.payments
    .filter((payment) => payment.amount > 0)
    .map((payment) => ({
      id: makeId('fin'),
      createdAt: cancelledAt,
      operationDate: cancelledAt,
      operation: `Отмена продажи #${sale.id} — возврат ${payment.label}`,
      kind: 'cashflow' as const,
      amount: -payment.amount,
      currency: 'UZS' as const,
      account: accountForPayment(payment.methodId),
      method: payment.label,
      sourceType: 'sale' as const,
      sourceId: sale.id,
    }))

  // Обновление продажи
  const changeLog: ErpSaleChangeLog = {
    id: makeId('log'),
    createdAt: cancelledAt,
    changedBy: cancelledBy,
    changeType: 'cancel',
    description: `Продажа отменена: ${input.reason}`,
    details: {
      cancelledBy,
      cancelledAt,
      originalTotal: sale.total,
    },
  }

  const nextSale: ErpSale = {
    ...sale,
    cancelled: true,
    cancelledAt,
    cancellationReason: input.reason,
    changeHistory: [...(sale.changeHistory || []), changeLog],
  }

  writeSales(
    sales.map((item) => (item.id === sale.id ? nextSale : item)),
  )
  writeFinanceTransactions([...financeRefundRows, ...readFinanceTransactions()])

  if (isBrowser()) {
    window.dispatchEvent(new CustomEvent(PRODUCT_CATALOG_CHANGED))
  }

  return nextSale
}

export function sendEmailReceipt(input: {
  saleId: string
  to: string
  subject?: string
  message?: string
  senderName?: string
}): {
  success: boolean
  message: string
  emailData: {
    to: string
    subject: string
    body: string
    html: string
  }
} {
  const sales = readSales()
  const sale = sales.find((item) => item.id === input.saleId)
  if (!sale) {
    throw new Error('Продажа не найдена.')
  }

  const to = input.to.trim()
  if (!to || !to.includes('@')) {
    throw new Error('Укажите корректный email получателя.')
  }

  const saleDate = new Date(sale.createdAt)
  const formattedDate = new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(saleDate)

  const subtotal = sale.lines.reduce((sum, line) => sum + line.total, 0)
  const discount = sale.discount
  const total = sale.total

  const itemsHtml = sale.lines
    .map(
      (line) => `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <strong>${escapeHtml(line.name)}</strong><br />
          <span style="color: #6b7280; font-size: 12px;">${line.sku}</span>
        </td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: center;">
          ${line.qty}
        </td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
          ${formatUZS(line.total)} UZS
        </td>
      </tr>`,
    )
    .join('')

  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Чек #${sale.id}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 20px; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
    <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 24px 32px; border-radius: 16px 16px 0 0; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700;">Чек продажи</h1>
      <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9);">#${sale.id}</p>
    </div>
    
    <div style="padding: 24px 32px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
        <div>
          <p style="margin: 0; font-size: 12px; color: #6b7280;">Дата и время</p>
          <p style="margin: 4px 0 0; font-size: 14px; font-weight: 600; color: #1f2937;">${formattedDate}</p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; font-size: 12px; color: #6b7280;">Кассир</p>
          <p style="margin: 4px 0 0; font-size: 14px; font-weight: 600; color: #1f2937;">${escapeHtml(sale.seller)}</p>
        </div>
      </div>

      ${sale.client ? `
      <div style="margin-bottom: 20px; padding: 12px; background: #f3f4f6; border-radius: 8px;">
        <p style="margin: 0; font-size: 12px; color: #6b7280;">Клиент</p>
        <p style="margin: 4px 0 0; font-size: 14px; font-weight: 600; color: #1f2937;">${escapeHtml(sale.client)}</p>
      </div>
      ` : ''}

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background: #f3f4f6;">
            <th style="padding: 12px; text-align: left; font-size: 13px; font-weight: 600; color: #374151;">Товар</th>
            <th style="padding: 12px; text-align: center; font-size: 13px; font-weight: 600; color: #374151;">Кол-во</th>
            <th style="padding: 12px; text-align: right; font-size: 13px; font-weight: 600; color: #374151;">Сумма</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div style="border-top: 2px solid #e5e7eb; padding-top: 16px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
          <span style="color: #6b7280;">Подытог</span>
          <span style="font-weight: 600; color: #1f2937;">${formatUZS(subtotal)} UZS</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
          <span style="color: #6b7280;">Скидка</span>
          <span style="font-weight: 600; color: #dc2626;">-${formatUZS(discount)} UZS</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 8px;">
          <span style="color: #374151; font-weight: 600;">Итого</span>
          <span style="color: #10b981; font-size: 18px; font-weight: 700;">${formatUZS(total)} UZS</span>
        </div>
      </div>

      ${sale.payments.length > 0 ? `
      <div style="margin-bottom: 20px;">
        <p style="margin: 0 0 10px; font-size: 13px; font-weight: 600; color: #374151;">Оплата</p>
        ${sale.payments.map(payment => `
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-size: 14px;">
            <span style="color: #6b7280;">${escapeHtml(payment.label)}</span>
            <span style="font-weight: 600; color: #1f2937;">${formatUZS(payment.amount)} UZS</span>
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${sale.note ? `
      <div style="margin-top: 20px; padding: 12px; background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px;">
        <p style="margin: 0 0 4px; font-size: 12px; color: #92400e; font-weight: 600;">Примечание</p>
        <p style="margin: 0; font-size: 13px; color: #78350f;">${escapeHtml(sale.note)}</p>
      </div>
      ` : ''}
    </div>

    <div style="background: #f9fafb; padding: 16px 32px; border-radius: 0 0 16px 16px; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #9ca3af;">Спасибо за покупку!</p>
      <p style="margin: 4px 0 0; font-size: 11px; color: #d1d5db;">Чек отправлен автоматически</p>
    </div>
  </div>
</body>
</html>`

  const textBody = `Чек продажи #${sale.id}

Дата: ${formattedDate}
Кассир: ${sale.seller}
${sale.client ? `Клиент: ${sale.client}` : ''}

--- Товары ---
${sale.lines.map(line => `${line.name} (${line.qty} шт) - ${formatUZS(line.total)} UZS`).join('\n')}

Подытог: ${formatUZS(subtotal)} UZS
Скидка: -${formatUZS(discount)} UZS
Итого: ${formatUZS(total)} UZS

${sale.payments.length > 0 ? `Оплата:\n${sale.payments.map(p => `${p.label}: ${formatUZS(p.amount)} UZS`).join('\n')}` : ''}

${sale.note ? `Примечание: ${sale.note}` : ''}
Спасибо за покупку!`

  const subject = input.subject || `Чек #${sale.id} — ${formatUZS(total)} UZS`
  const sender = input.senderName || 'Касса ERP'

  // В браузере email отправляется через mailto
  // В Node.js можно было бы использовать nodemailer
  if (isBrowser()) {
    const mailtoLink = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(textBody)}`
    
    // Открываем почтовый клиент
    window.location.href = mailtoLink
    
    return {
      success: true,
      message: 'Открыто окно почтового клиента для отправки чека',
      emailData: {
        to,
        subject,
        body: textBody,
        html,
      },
    }
  }

  // Для серверной части (если будет Node.js окружение)
  return {
    success: true,
    message: 'Email подготовлен для отправки (для реальной отправки настройте SMTP)',
    emailData: {
      to,
      subject,
      body: textBody,
      html,
    },
  }
}

export function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
    .format(date)
    .replace(',', ' |')
}

export function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('ru-RU').format(date)
}

export function formatTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date)
}

function accountForPayment(methodId: string) {
  const methods = readPaymentMethodSettings()
  const registers = readCashRegisters()
  const method = methods.find((item) => item.id === methodId && item.status === 'active')
  const register = method?.registerId
    ? registers.find((item) => item.id === method.registerId && item.status === 'active')
    : null

  if (register) return register.name
  if (method?.channel === 'cash') {
    return registers.find((item) => item.channel === 'cash' && item.status === 'active')?.name ?? 'Касса Магазин'
  }
  return registers.find((item) => item.channel === 'cashless' && item.status === 'active')?.name ?? 'Безналичный счет Магазин'
}

function normalizeFinanceAccountName(account: string) {
  return account
    .replace(/^Касса\s+/i, '')
    .replace(/^Безналичный счет\s+/i, '')
    .trim()
}

function isCashMethod(method: string) {
  const normalized = method.trim().toLowerCase()
  return normalized === 'наличные' || normalized === 'cash'
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function normalizeClientName(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

function customerInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'CL'
}

function summarizeSaleProducts(sale: ErpSale) {
  if (sale.lines.length === 0) return '-'
  if (sale.lines.length === 1) return sale.lines[0].name
  return `${sale.lines[0].name} +${sale.lines.length - 1}`
}

function purchaseOrderStatus(
  lines: ErpPurchaseOrderLine[],
  paidUsd: number,
  totalUsd: number,
): ErpPurchaseOrder['status'] {
  const totalOrdered = lines.reduce((sum, line) => sum + line.orderedQty, 0)
  const totalReceived = lines.reduce((sum, line) => sum + line.receivedQty, 0)
  if (totalUsd <= 0 && paidUsd <= 0) {
    return 'cancelled'
  }
  if (totalReceived >= totalOrdered) {
    return totalUsd - paidUsd <= 0.001 ? 'paid' : 'received'
  }
  if (totalReceived > 0) {
    return 'partial'
  }
  return 'ordered'
}

export function completeInventoryCount(input: {
  sourceId: string
  warehouseId?: string
  reason?: string
  counts: Array<{ productId: string; countedQty: number }>
}) {
  const sourceId = input.sourceId.trim()
  if (!sourceId) throw new Error('Для инвентаризации требуется идентификатор документа.')
  if (readInventoryMovements().some((movement) => movement.type === 'inventory_adjustment' && movement.sourceId === sourceId)) {
    throw new Error('Эта инвентаризация уже завершена и не может быть проведена повторно.')
  }
  const warehouseId = input.warehouseId ?? DEFAULT_WAREHOUSE_ID
  const uniqueProducts = new Set<string>()
  const changes: InventoryChange[] = []
  for (const count of input.counts) {
    if (uniqueProducts.has(count.productId)) throw new Error('Товар указан в инвентаризации несколько раз.')
    uniqueProducts.add(count.productId)
    const countedQty = normalizeQty(count.countedQty)
    const currentQty = getWarehouseStock(count.productId, warehouseId)
    const delta = countedQty - currentQty
    if (delta !== 0) {
      changes.push({
        productId: count.productId,
        warehouseId,
        delta,
        type: 'inventory_adjustment',
        sourceId,
        reason: input.reason?.trim() || 'Инвентаризация',
      })
    }
  }
  if (changes.length === 0) return []
  return applyInventoryChanges(changes)
}

export function completeInventoryDocument(id: string) {
  const document = getInventoryDocument(id)
  if (!document) throw new Error('Документ инвентаризации не найден.')
  if (document.status === 'completed') throw new Error('Эта инвентаризация уже завершена.')
  const activeProducts = readProducts().filter((product) => product.status === 'active')
  if (document.type === 'full' && activeProducts.some((product) => document.counts[product.id] === undefined)) {
    throw new Error('Для полной инвентаризации укажите фактическое количество каждого активного товара.')
  }
  const countedProducts = document.type === 'full'
    ? activeProducts
    : activeProducts.filter((product) => document.counts[product.id] !== undefined)
  const movements = completeInventoryCount({
    sourceId: document.id,
    warehouseId: document.warehouseId,
    reason: document.name,
    counts: countedProducts.map((product) => ({
      productId: product.id,
      countedQty: document.counts[product.id] ?? getWarehouseStock(product.id, document.warehouseId),
    })),
  })
  const documents = readInventoryDocuments()
  const index = documents.findIndex((item) => item.id === id)
  documents[index] = { ...documents[index], status: 'completed', completedAt: new Date().toISOString() }
  writeInventoryDocuments(documents)
  return movements
}

function roundUsd(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}
function reconcileSupplierLedger(supplierId: string) {
  const orders = readPurchaseOrders()
  const payments = readSupplierPayments()
  const supplierOrders = orders
    .filter((item) => item.supplierId === supplierId)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
  const activeOrders = supplierOrders.filter((item) => item.status !== 'cancelled')
  const supplierPayments = payments
    .filter((item) => item.supplierId === supplierId)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
  const orderPaid = new Map<string, number>()
  for (const order of activeOrders) {
    orderPaid.set(order.id, 0)
  }
  const nextPayments = payments.map((payment) => {
    if (payment.supplierId !== supplierId) return payment
    let remaining = payment.amountUsd
    const allocations: ErpSupplierPaymentAllocation[] = []
    const preferredOrders = payment.preferredOrderId
      ? activeOrders.filter((order) => order.id === payment.preferredOrderId)
      : []
    const fallbackOrders = activeOrders.filter((order) => order.id !== payment.preferredOrderId)
    for (const order of [...preferredOrders, ...fallbackOrders]) {
      const paidUsd = orderPaid.get(order.id) ?? 0
      const unpaid = roundUsd(Math.max(0, order.totalUsd - paidUsd))
      if (unpaid <= 0 || remaining <= 0) continue
      const applied = roundUsd(Math.min(unpaid, remaining))
      allocations.push({
        orderId: order.id,
        orderName: order.name,
        amountUsd: applied,
      })
      orderPaid.set(order.id, roundUsd(paidUsd + applied))
      remaining = roundUsd(remaining - applied)
    }
    return {
      ...payment,
      allocations,
      creditUsd: roundUsd(remaining),
    }
  })
  const nextOrders = orders.map((order) => {
    if (order.supplierId !== supplierId) return order
    if (order.status === 'cancelled') {
      return {
        ...order,
        paidUsd: 0,
      }
    }
    const paidUsd = roundUsd(Math.min(order.totalUsd, orderPaid.get(order.id) ?? 0))
    return {
      ...order,
      paidUsd,
      status: purchaseOrderStatus(order.lines, paidUsd, order.totalUsd),
    }
  })
  writePurchaseOrders(nextOrders)
  writeSupplierPayments(nextPayments)
  return {
    orders: nextOrders.filter((item) => item.supplierId === supplierId),
    payments: nextPayments.filter((item) => item.supplierId === supplierId),
    returns: readPurchaseReturns().filter((item) => item.supplierId === supplierId),
  }
}

function formatDashboardDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('ru-RU', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function formatRelativeTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const diffMs = Date.now() - date.getTime()
  const minutes = Math.max(1, Math.floor(diffMs / 60000))

  if (minutes < 60) return `${minutes} мин. назад`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} ч. назад`
  const days = Math.floor(hours / 24)
  return `${days} дн. назад`
}

function buildDashboardActivity(): DashboardActivityItem[] {
  const sales = readSales()
  const transactions = readFinanceTransactions()
  const clients = readClients()
  const alerts = readProducts()
    .filter((product) => product.stock <= product.lowStockThreshold)
    .slice(0, 2)
    .map((product) => ({
      text: `Мало остатков: ${product.name}`,
      time: formatRelativeTime(product.updatedAt),
      type: 'alert' as const,
      createdAt: product.updatedAt,
    }))

  const saleItems = sales.slice(0, 3).map((sale) => ({
    text: `Новая продажа #${sale.id}: ${sale.client ?? 'розничный покупатель'}`,
    time: formatRelativeTime(sale.createdAt),
    type: 'order' as const,
    createdAt: sale.createdAt,
  }))

  const paymentItems = transactions
    .filter((transaction) => transaction.amount > 0)
    .slice(0, 2)
    .map((transaction) => ({
      text: `Поступила оплата: ${formatUZS(transaction.amount)} UZS`,
      time: formatRelativeTime(transaction.createdAt),
      type: 'payment' as const,
      createdAt: transaction.createdAt,
    }))

  const clientItems = clients.slice(0, 2).map((client) => ({
    text: `Добавлен клиент: ${client.name}`,
    time: formatRelativeTime(client.createdAt),
    type: 'user' as const,
    createdAt: client.createdAt,
  }))

  return [...saleItems, ...paymentItems, ...alerts, ...clientItems]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, 6)
    .map(({ text, time, type }) => ({ text, time, type }))
}

function buildWarehouseDashboardItems(products: CatalogProduct[]): DashboardWarehouseItem[] {
  return [
    {
      label: 'В наличии',
      value: products.filter((product) => product.stock > product.lowStockThreshold).length,
      tone: 'success',
    },
    {
      label: 'Ожидается',
      value: 0,
      tone: 'primary',
    },
    {
      label: 'Мало остатков',
      value: products.filter(
        (product) => product.stock > 0 && product.stock <= product.lowStockThreshold,
      ).length,
      tone: 'warning',
    },
    {
      label: 'Нет в наличии',
      value: products.filter((product) => product.stock <= 0).length,
      tone: 'danger',
    },
  ]
}

function createDebtFromSale(input: {
  sale: ErpSale
  clientId: string | null
  clientPhone: string
  amount: number
  createdAt: string
}) {
  const dueDate = new Date(input.createdAt)
  dueDate.setDate(dueDate.getDate() + 30)

  const debt: ErpDebt = {
    id: makeId('debt'),
    saleId: input.sale.id,
    clientId: input.clientId,
    clientName: input.sale.client ?? 'Гость',
    clientPhone: input.clientPhone,
    store: input.sale.store,
    cashier: input.sale.seller,
    createdAt: input.createdAt,
    dueDate: dueDate.toISOString(),
    totalAmount: input.amount,
    paidAmount: 0,
    remainingAmount: input.amount,
    status: debtStatus(input.amount, dueDate.toISOString(), 0),
    payments: [],
  }

  return debt
}

function debtStatus(remainingAmount: number, dueDate: string, paidAmount: number) {
  if (remainingAmount <= 0) return 'paid' as const
  const due = new Date(dueDate)
  if (!Number.isNaN(due.getTime()) && due.getTime() < Date.now()) {
    return 'overdue' as const
  }
  return paidAmount > 0 ? 'partial' as const : 'unpaid' as const
}

function operationTitle(type: ManualFinanceDraft['type']) {
  if (type === 'income') return 'Доход'
  if (type === 'expense') return 'Расход'
  if (type === 'transfer') return 'Перемещение'
  return 'Конвертация'
}

function buildCashShiftSummaryRow(shift: ErpCashShift): CashShiftSummaryRow {
  const methods = getActivePosPaymentMethods()
  const sales = readSales().filter((sale) => {
    if (sale.store !== shift.store) return false
    if (sale.seller !== shift.cashier) return false
    const createdAt = new Date(sale.createdAt).getTime()
    const openedAt = new Date(shift.openedAt).getTime()
    const closedAt = shift.closedAt ? new Date(shift.closedAt).getTime() : Date.now()
    return createdAt >= openedAt && createdAt <= closedAt
  })

  const expectedByMethod = new Map<string, number>()
  const cashLabel =
    methods.find((item) => item.channel === 'cash' && item.status === 'active')?.label ??
    'Наличные'

  expectedByMethod.set(cashLabel, shift.openingCash)

  for (const sale of sales) {
    for (const payment of sale.payments) {
      expectedByMethod.set(
        payment.label,
        (expectedByMethod.get(payment.label) ?? 0) + payment.amount,
      )
    }
  }

  const methodLabels = [
    ...new Set([
      ...methods.map((item) => item.label),
      ...Array.from(expectedByMethod.keys()),
      ...Object.keys(shift.actualByMethod),
    ]),
  ]

  const pay = methodLabels.map((label) => ({
    method: label,
    expected: expectedByMethod.get(label) ?? 0,
    actual:
      shift.status === 'closed'
        ? (shift.actualByMethod[label] ?? expectedByMethod.get(label) ?? 0)
        : null,
  }))

  return {
    ...shift,
    salesCount: sales.length,
    salesTotal: sales.reduce((sum, sale) => sum + sale.total, 0),
    pay,
  }
}


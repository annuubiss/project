'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Banknote,
  Boxes,
  CheckCircle2,
  Package,
  Plus,
  ShoppingCart,
  Star,
  Wallet,
} from 'lucide-react'
import {
  ERP_DATA_CHANGED,
  createSupplierPayment,
  formatDate,
  readPaymentMethodSettings,
  readPurchaseOrders,
  readSupplierPayments,
  readSuppliers,
  receivePurchaseOrder,
  type ErpPurchaseOrder,
  type ErpSupplier,
  type ErpSupplierPayment,
} from '@/lib/erp/erp-store'
import { readProducts, type CatalogProduct } from '@/lib/erp/product-catalog'
import {
  DetailHeader,
  DetailHeadRow,
  DetailRow,
  DetailTableCard,
  GhostButton,
  PrimaryButton,
  StatCard,
  SubTabs,
} from './detail-shared'
import { EmptyState, StatusBadge } from './shared'

const orderColumns = [
  { label: 'ID', className: 'max-w-[110px]' },
  { label: 'Наименование' },
  { label: 'Статус', className: 'max-w-[160px]' },
  { label: 'Оплата', className: 'max-w-[180px]' },
  { label: 'Количество', className: 'max-w-[150px]' },
  { label: 'Дата', className: 'max-w-[140px]' },
  { label: '', className: 'max-w-[120px]' },
]

const paymentColumns = [
  { label: 'Дата', className: 'max-w-[140px]' },
  { label: 'Сумма', className: 'max-w-[140px]' },
  { label: 'Метод', className: 'max-w-[150px]' },
  { label: 'Счет' },
  { label: 'Заказы' },
]

const productColumns = [
  { label: 'Товар' },
  { label: 'SKU', className: 'max-w-[140px]' },
  { label: 'Категория', className: 'max-w-[160px]' },
  { label: 'Остаток', className: 'max-w-[120px]' },
  { label: 'Цена', className: 'max-w-[140px]' },
]

type PaymentMethodOption = {
  id: string
  label: string
}

export function SupplierDetail({ id }: { id: string }) {
  const router = useRouter()
  const [tab, setTab] = useState(0)
  const [supplier, setSupplier] = useState<ErpSupplier | null>(null)
  const [orders, setOrders] = useState<ErpPurchaseOrder[]>([])
  const [payments, setPayments] = useState<ErpSupplierPayment[]>([])
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [methods, setMethods] = useState<PaymentMethodOption[]>([])
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paymentOrderId, setPaymentOrderId] = useState<string>('')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethodId, setPaymentMethodId] = useState('')
  const [paymentNote, setPaymentNote] = useState('')
  const [paymentError, setPaymentError] = useState('')

  useEffect(() => {
    function load() {
      const nextSupplier = readSuppliers().find((item) => item.id === id) ?? null
      const nextOrders = readPurchaseOrders()
        .filter((item) => item.supplierId === id)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      const nextPayments = readSupplierPayments()
        .filter((item) => item.supplierId === id)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      const nextProducts = readProducts().filter(
        (item) => normalizeName(item.supplier) === normalizeName(nextSupplier?.name),
      )
      const nextMethods = readPaymentMethodSettings()
        .filter((item) => item.status === 'active' && item.channel !== 'credit')
        .map((item) => ({ id: item.id, label: item.label }))

      setSupplier(nextSupplier)
      setOrders(nextOrders)
      setPayments(nextPayments)
      setProducts(nextProducts)
      setMethods(nextMethods)
      setPaymentMethodId((current) => current || nextMethods[0]?.id || '')
    }

    load()
    window.addEventListener(ERP_DATA_CHANGED, load)
    window.addEventListener('storage', load)
    return () => {
      window.removeEventListener(ERP_DATA_CHANGED, load)
      window.removeEventListener('storage', load)
    }
  }, [id])

  const summary = useMemo(() => {
    const ordersUsd = orders.reduce((sum, order) => sum + order.totalUsd, 0)
    const paymentsUsd = payments.reduce((sum, payment) => sum + payment.amountUsd, 0)
    const debtUsd = Math.max(0, ordersUsd - paymentsUsd)
    const orderedQty = orders.reduce(
      (sum, order) =>
        sum + order.lines.reduce((lineSum, line) => lineSum + line.orderedQty, 0),
      0,
    )
    const receivedQty = orders.reduce(
      (sum, order) =>
        sum + order.lines.reduce((lineSum, line) => lineSum + line.receivedQty, 0),
      0,
    )
    const paidOrders = orders.filter((order) => order.paidUsd >= order.totalUsd).length
    const unpaidOrders = orders.filter((order) => order.paidUsd < order.totalUsd).length
    const firstOrderAt = orders[orders.length - 1]?.createdAt ?? supplier?.createdAt ?? null
    const monthsActive = firstOrderAt
      ? Math.max(
          1,
          Math.ceil(
            (Date.now() - new Date(firstOrderAt).getTime()) / (1000 * 60 * 60 * 24 * 30),
          ),
        )
      : 1

    return {
      ordersUsd,
      paymentsUsd,
      debtUsd,
      orderedQty,
      receivedQty,
      paidOrders,
      unpaidOrders,
      orderFrequency: (orders.length / monthsActive).toFixed(1),
    }
  }, [orders, payments, supplier])

  const unpaidOrders = useMemo(
    () => orders.filter((order) => order.paidUsd < order.totalUsd),
    [orders],
  )

  if (!supplier) {
    return (
      <EmptyState
        title="Поставщик не найден"
        description="Запись была удалена или еще не создана в системе."
      />
    )
  }

  const currentSupplier = supplier

  function openPaymentModal(orderId?: string) {
    setPaymentError('')
    setPaymentOrderId(orderId ?? '')
    const target = orderId
      ? orders.find((item) => item.id === orderId)
      : null
    setPaymentAmount(
      target
        ? String(Math.max(0, Number((target.totalUsd - target.paidUsd).toFixed(2))))
        : String(Math.max(0, Number(summary.debtUsd.toFixed(2)))),
    )
    setPaymentOpen(true)
  }

  function handleCreateOrder() {
    const params = new URLSearchParams({
      supplier: currentSupplier.name,
      store: orders[0]?.store ?? 'Магазин / Подвал',
      name: '',
      date: '',
    })
    router.push(`/tovary/zakazy/create?${params.toString()}`)
  }

  function handleReceive(orderId: string) {
    try {
      receivePurchaseOrder({ orderId })
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Не удалось принять заказ.')
    }
  }

  function handlePay() {
    try {
      createSupplierPayment({
        supplierId: currentSupplier.id,
        orderId: paymentOrderId || undefined,
        amountUsd: Number(paymentAmount) || 0,
        methodId: paymentMethodId,
        note: paymentNote,
      })
      setPaymentOpen(false)
      setPaymentAmount('')
      setPaymentOrderId('')
      setPaymentNote('')
      setPaymentError('')
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : 'Не удалось сохранить оплату.')
    }
  }

  const stats = [
    { label: 'Баланс', value: usd(summary.debtUsd), unit: '', icon: <Wallet className="size-6" /> },
    {
      label: 'Оплаченные заказы',
      value: String(summary.paidOrders),
      unit: 'заказов',
      icon: <ShoppingCart className="size-6" />,
    },
    {
      label: 'Неоплаченные заказы',
      value: String(summary.unpaidOrders),
      unit: 'заказов',
      icon: <ShoppingCart className="size-6" />,
    },
    {
      label: 'Сумма заказов поставщику',
      value: usd(summary.ordersUsd),
      unit: '',
      icon: <Banknote className="size-6" />,
    },
    {
      label: 'Сумма оплат поставщику',
      value: usd(summary.paymentsUsd),
      unit: '',
      icon: <Banknote className="size-6" />,
    },
    {
      label: 'Сумма долга поставщику',
      value: usd(summary.debtUsd),
      unit: '',
      icon: <Banknote className="size-6" />,
    },
    {
      label: 'Товаров заказано',
      value: String(summary.orderedQty),
      unit: 'шт',
      icon: <Boxes className="size-6" />,
    },
    {
      label: 'Товаров получено',
      value: String(summary.receivedQty),
      unit: 'шт',
      icon: <CheckCircle2 className="size-6" />,
    },
    {
      label: 'Частота заказов',
      value: summary.orderFrequency,
      unit: 'в месяц',
      icon: <Star className="size-6" />,
    },
  ]

  const infoRows = [
    ['Наименование', currentSupplier.name],
    ['Телефон', currentSupplier.phone || '-'],
    ['Email', currentSupplier.email || '-'],
    ['Адрес', currentSupplier.address || '-'],
    ['Контактное лицо', currentSupplier.contactPerson || '-'],
    ['Дата добавления', formatDate(currentSupplier.createdAt)],
    ['Статус', currentSupplier.status === 'active' ? 'Активный' : 'Неактивный'],
  ]

  return (
    <div className="space-y-6">
      <DetailHeader
        title={currentSupplier.name}
        subtitle={`Добавлен ${formatDate(currentSupplier.createdAt)} • Обновлен ${formatDate(
          currentSupplier.updatedAt,
        )}`}
        backHref="/tovary/postavshchiki"
        actions={
          <>
            <GhostButton onClick={() => openPaymentModal()}>
              <Plus className="size-5 text-primary" />
              Добавить оплату
            </GhostButton>
            <PrimaryButton onClick={handleCreateOrder}>Новый заказ</PrimaryButton>
          </>
        }
      />

      <SubTabs
        tabs={[
          { label: 'Дашборд' },
          { label: 'Заказы', count: orders.length },
          { label: 'Оплаты', count: payments.length },
          { label: 'Информация' },
          { label: 'Товары', count: products.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 0 ? (
        <div className="space-y-4">
          <h2 className="text-xl font-black text-foreground">Статистика</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stats.map((item) => (
              <StatCard
                key={item.label}
                label={item.label}
                value={item.value}
                unit={item.unit || undefined}
                icon={item.icon}
              />
            ))}
          </div>
        </div>
      ) : null}

      {tab === 1 ? (
        orders.length === 0 ? (
          <EmptyState
            title="Заказов пока нет"
            description="После оформления закупок они появятся в карточке поставщика."
          />
        ) : (
          <DetailTableCard>
            <DetailHeadRow columns={orderColumns} template="110px 1.3fr 160px 180px 150px 140px 120px" withSettings={false} />
            {orders.map((order) => {
              const ordered = order.lines.reduce((sum, line) => sum + line.orderedQty, 0)
              const received = order.lines.reduce((sum, line) => sum + line.receivedQty, 0)
              const canReceive = received < ordered
              return (
                <DetailRow
                  key={order.id}
                  template="110px 1.3fr 160px 180px 150px 140px 120px"
                  withSettings={false}
                >
                  <div className="font-semibold text-muted-foreground">{order.id.slice(-6)}</div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-primary">{order.name}</p>
                    <p className="text-[13px] text-muted-foreground">{order.store}</p>
                  </div>
                  <div>
                    <StatusBadge label={statusLabel(order.status)} tone={statusTone(order.status)} />
                  </div>
                  <div className="space-y-1 text-[14px] font-semibold">
                    <p className="text-foreground">{usd(order.paidUsd)}</p>
                    <p className="text-muted-foreground">{usd(order.totalUsd - order.paidUsd)}</p>
                  </div>
                  <div className="space-y-1 text-[14px] font-semibold">
                    <p className="text-amber-600">{ordered} шт</p>
                    <p className="text-primary">{received} шт</p>
                  </div>
                  <div className="text-[14px] text-muted-foreground">{formatDate(order.createdAt)}</div>
                  <div>
                    {canReceive ? (
                      <button
                        onClick={() => handleReceive(order.id)}
                        className="rounded-xl bg-secondary px-4 py-2 text-[14px] font-semibold text-foreground transition-colors hover:bg-secondary/70"
                      >
                        Принять
                      </button>
                    ) : order.paidUsd < order.totalUsd ? (
                      <button
                        onClick={() => openPaymentModal(order.id)}
                        className="rounded-xl bg-secondary px-4 py-2 text-[14px] font-semibold text-foreground transition-colors hover:bg-secondary/70"
                      >
                        Оплатить
                      </button>
                    ) : (
                      <span className="text-[14px] font-semibold text-primary">Готово</span>
                    )}
                  </div>
                </DetailRow>
              )
            })}
          </DetailTableCard>
        )
      ) : null}

      {tab === 2 ? (
        payments.length === 0 ? (
          <EmptyState
            title="Оплат пока нет"
            description="После проведения оплаты она появится в истории этого поставщика."
          />
        ) : (
          <DetailTableCard>
            <DetailHeadRow columns={paymentColumns} template="140px 140px 150px 1fr 1.2fr" withSettings={false} />
            {payments.map((payment) => (
              <DetailRow
                key={payment.id}
                template="140px 140px 150px 1fr 1.2fr"
                withSettings={false}
              >
                <div className="text-[14px] text-muted-foreground">{formatDate(payment.createdAt)}</div>
                <div className="font-semibold text-foreground">{usd(payment.amountUsd)}</div>
                <div className="font-semibold text-primary">{payment.methodLabel}</div>
                <div className="min-w-0 text-[14px] text-muted-foreground">{payment.account}</div>
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold text-foreground">
                    {payment.allocations
                      .map((item) => `${item.orderName} (${usd(item.amountUsd)})`)
                      .join(', ')}
                  </p>
                  {payment.note ? (
                    <p className="truncate text-[13px] text-muted-foreground">{payment.note}</p>
                  ) : null}
                </div>
              </DetailRow>
            ))}
          </DetailTableCard>
        )
      ) : null}

      {tab === 3 ? (
        <div className="max-w-2xl divide-y divide-border overflow-hidden rounded-3xl bg-card shadow-sm ring-1 ring-border">
          {infoRows.map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between gap-4 px-6 py-4"
            >
              <span className="text-[15px] text-muted-foreground">{label}</span>
              <span className="text-right text-[15px] font-semibold text-foreground">
                {value}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {tab === 4 ? (
        products.length === 0 ? (
          <EmptyState
            title="Товаров пока нет"
            description="Когда товары будут привязаны к этому поставщику, они появятся здесь."
          />
        ) : (
          <DetailTableCard>
            <DetailHeadRow columns={productColumns} template="1.4fr 140px 160px 120px 140px" withSettings={false} />
            {products.map((product) => (
              <DetailRow
                key={product.id}
                template="1.4fr 140px 160px 120px 140px"
                withSettings={false}
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-primary">{product.name}</p>
                  <p className="truncate text-[13px] text-muted-foreground">
                    {product.brand || 'Без бренда'}
                  </p>
                </div>
                <div className="font-semibold text-muted-foreground">{product.sku}</div>
                <div className="text-[14px] text-foreground">{product.category}</div>
                <div className="font-semibold text-foreground">{product.stock} шт</div>
                <div className="font-semibold text-primary">{formatUzs(product.price)}</div>
              </DetailRow>
            ))}
          </DetailTableCard>
        )
      ) : null}

      {paymentOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 py-10">
          <button
            aria-label="Закрыть"
            onClick={() => setPaymentOpen(false)}
            className="fixed inset-0 bg-foreground/40 backdrop-blur-sm"
          />
          <div className="relative z-10 w-full max-w-2xl rounded-3xl bg-card shadow-xl ring-1 ring-border">
            <div className="flex items-center justify-between gap-4 p-6">
              <h2 className="text-2xl font-black text-foreground">Новая оплата поставщику</h2>
              <button
                onClick={() => setPaymentOpen(false)}
                className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <Plus className="size-5 rotate-45" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-5 px-6 sm:grid-cols-2">
              <FieldSelect
                label="Заказ"
                value={paymentOrderId}
                options={[
                  { value: '', label: 'Распределить по долгам' },
                  ...unpaidOrders.map((order) => ({
                    value: order.id,
                    label: `${order.name} (${usd(order.totalUsd - order.paidUsd)})`,
                  })),
                ]}
                onChange={setPaymentOrderId}
              />
              <FieldSelect
                label="Метод оплаты"
                value={paymentMethodId}
                options={methods.map((method) => ({
                  value: method.id,
                  label: method.label,
                }))}
                onChange={setPaymentMethodId}
              />
              <FieldInput
                label="Сумма USD"
                value={paymentAmount}
                onChange={setPaymentAmount}
                placeholder="0"
              />
              <FieldInput
                label="Комментарий"
                value={paymentNote}
                onChange={setPaymentNote}
                placeholder="Оплата по инвойсу"
              />
            </div>

            {paymentError ? (
              <p className="px-6 pt-4 text-[14px] font-medium text-destructive">{paymentError}</p>
            ) : null}

            <div className="mt-8 flex items-center justify-between gap-4 p-6">
              <button
                onClick={() => setPaymentOpen(false)}
                className="flex h-14 flex-1 items-center justify-center rounded-2xl bg-secondary text-[15px] font-semibold text-foreground transition-colors hover:bg-secondary/70"
              >
                Отмена
              </button>
              <button
                onClick={handlePay}
                className="flex h-14 flex-1 items-center justify-center rounded-2xl bg-primary text-[15px] font-semibold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function FieldSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <label className="block text-[15px] font-medium text-muted-foreground">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-14 w-full rounded-2xl bg-secondary px-5 text-[15px] font-medium text-foreground outline-none ring-1 ring-border transition-shadow focus:ring-2 focus:ring-primary/40"
      >
        {options.map((option) => (
          <option key={`${option.value}-${option.label}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function FieldInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <div className="space-y-2">
      <label className="block text-[15px] font-medium text-muted-foreground">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-14 w-full rounded-2xl bg-secondary px-5 text-[15px] font-medium text-foreground outline-none ring-1 ring-border transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40"
      />
    </div>
  )
}

function statusLabel(status: ErpPurchaseOrder['status']) {
  if (status === 'draft') return 'Черновик'
  if (status === 'ordered') return 'Оформлен'
  if (status === 'partial') return 'Частично получен'
  if (status === 'received') return 'Получен'
  return 'Оплачен'
}

function statusTone(status: ErpPurchaseOrder['status']) {
  if (status === 'paid') return 'success' as const
  if (status === 'received') return 'info' as const
  if (status === 'partial') return 'warning' as const
  return 'muted' as const
}

function usd(value: number) {
  return `${Math.max(0, value).toFixed(1)}`
}

function formatUzs(value: number) {
  return `${new Intl.NumberFormat('ru-RU').format(value)} UZS`
}

function normalizeName(value?: string | null) {
  return (value ?? '').trim().replace(/\s+/g, ' ').toLowerCase()
}

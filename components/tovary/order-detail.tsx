'use client'

import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeftRight,
  Banknote,
  Boxes,
  CheckCircle2,
  Pencil,
  Plus,
  ShoppingCart,
  Trash2,
  Undo2,
} from 'lucide-react'
import {
  ERP_DATA_CHANGED,
  cancelPurchaseOrder,
  createSupplierPayment,
  createPurchaseReturn,
  formatDate,
  readPaymentMethodSettings,
  readPurchaseOrders,
  readPurchaseReturns,
  readSupplierPayments,
  receivePurchaseOrder,
  updatePurchaseOrder,
  type ErpPurchaseOrder,
  type ErpPurchaseReturn,
  type ErpSupplierPayment,
} from '@/lib/erp/erp-store'
import {
  DetailHeader,
  DetailHeadRow,
  DetailRow,
  DetailTableCard,
  GhostButton,
  PrimaryButton,
  QtyInput,
  StatCard,
  SubTabs,
} from './detail-shared'
import { EmptyState, StatusBadge } from './shared'

const lineColumns = [
  { label: 'Товар' },
  { label: 'Артикул', className: 'max-w-[120px]' },
  { label: 'Заказано', className: 'max-w-[120px]' },
  { label: 'Получено', className: 'max-w-[120px]' },
  { label: 'Возвращено', className: 'max-w-[120px]' },
  { label: 'Цена', className: 'max-w-[120px]' },
]

const paymentColumns = [
  { label: 'Дата', className: 'max-w-[140px]' },
  { label: 'Сумма', className: 'max-w-[140px]' },
  { label: 'Метод', className: 'max-w-[150px]' },
  { label: 'Комментарий' },
]

const returnColumns = [
  { label: 'Дата', className: 'max-w-[140px]' },
  { label: 'Товары' },
  { label: 'Причина' },
]

type EditLineDraft = {
  orderedQty: string
  costUsd: string
  markupPercent: string
  salePrice: string
}

export function OrderDetail({ id }: { id: string }) {
  const [tab, setTab] = useState(0)
  const [order, setOrder] = useState<ErpPurchaseOrder | null>(null)
  const [payments, setPayments] = useState<ErpSupplierPayment[]>([])
  const [returns, setReturns] = useState<ErpPurchaseReturn[]>([])
  const [receiveOpen, setReceiveOpen] = useState(false)
  const [returnOpen, setReturnOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [payOpen, setPayOpen] = useState(false)
  const [receiveValues, setReceiveValues] = useState<Record<string, string>>({})
  const [returnValues, setReturnValues] = useState<Record<string, string>>({})
  const [editValues, setEditValues] = useState<Record<string, EditLineDraft>>({})
  const [editName, setEditName] = useState('')
  const [editStore, setEditStore] = useState('')
  const [editExpectedDate, setEditExpectedDate] = useState('')
  const [payAmount, setPayAmount] = useState('')
  const [payMethodId, setPayMethodId] = useState('')
  const [payNote, setPayNote] = useState('')
  const [returnReason, setReturnReason] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    function load() {
      const nextOrder = readPurchaseOrders().find((item) => item.id === id) ?? null
      const nextPayments = readSupplierPayments()
        .filter((item) => item.allocations.some((allocation) => allocation.orderId === id))
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      const nextReturns = readPurchaseReturns()
        .filter((item) => item.orderId === id)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))

      setOrder(nextOrder)
      setPayments(nextPayments)
      setReturns(nextReturns)
    }

    load()
    window.addEventListener(ERP_DATA_CHANGED, load)
    window.addEventListener('storage', load)
    return () => {
      window.removeEventListener(ERP_DATA_CHANGED, load)
      window.removeEventListener('storage', load)
    }
  }, [id])

  const returnedByProductId = useMemo(() => {
    const result = new Map<string, number>()
    for (const purchaseReturn of returns) {
      for (const line of purchaseReturn.lines) {
        result.set(line.productId, (result.get(line.productId) ?? 0) + line.qty)
      }
    }
    return result
  }, [returns])

  if (!order) {
    return (
      <EmptyState
        title="Заказ не найден"
        description="Запись была удалена или еще не создана."
      />
    )
  }

  const currentOrder = order
  const orderedQty = currentOrder.lines.reduce((sum, line) => sum + line.orderedQty, 0)
  const receivedQty = currentOrder.lines.reduce((sum, line) => sum + line.receivedQty, 0)
  const returnedQty = Array.from(returnedByProductId.values()).reduce((sum, qty) => sum + qty, 0)
  const debtUsd = Math.max(0, Math.round((currentOrder.totalUsd - currentOrder.paidUsd) * 100) / 100)
  const canEdit =
    currentOrder.status !== 'cancelled' &&
    currentOrder.paidUsd <= 0 &&
    currentOrder.lines.every((line) => line.receivedQty <= 0)
  const canCancel = canEdit
  const canReceive =
    currentOrder.status !== 'cancelled' &&
    currentOrder.lines.some((line) => line.receivedQty < line.orderedQty)
  const canPay = currentOrder.status !== 'cancelled' && debtUsd > 0
  const canReturn =
    currentOrder.status !== 'cancelled' &&
    currentOrder.lines.some((line) => {
      const returned = returnedByProductId.get(line.productId) ?? 0
      return line.receivedQty - returned > 0
    })

  const stats = [
    { label: 'Сумма заказа', value: usd(currentOrder.totalUsd), icon: <Banknote className="size-6" /> },
    { label: 'Оплачено', value: usd(currentOrder.paidUsd), icon: <CheckCircle2 className="size-6" /> },
    { label: 'Остаток долга', value: usd(debtUsd), icon: <ShoppingCart className="size-6" /> },
    { label: 'Заказано', value: String(orderedQty), unit: 'шт', icon: <Boxes className="size-6" /> },
    { label: 'Получено', value: String(receivedQty), unit: 'шт', icon: <ArrowLeftRight className="size-6" /> },
    { label: 'Возвращено', value: String(returnedQty), unit: 'шт', icon: <Undo2 className="size-6" /> },
  ]
  const paymentMethods = readPaymentMethodSettings().filter(
    (item) => item.status === 'active' && item.channel !== 'credit',
  )

  function openReceiveModal() {
    setError('')
    setReceiveValues(
      Object.fromEntries(
        currentOrder.lines.map((line) => [
          line.productId,
          String(Math.max(0, line.orderedQty - line.receivedQty)),
        ]),
      ),
    )
    setReceiveOpen(true)
  }

  function openReturnModal() {
    setError('')
    setReturnValues(
      Object.fromEntries(
        currentOrder.lines.map((line) => {
          const returned = returnedByProductId.get(line.productId) ?? 0
          return [line.productId, String(Math.max(0, line.receivedQty - returned))]
        }),
      ),
    )
    setReturnOpen(true)
  }

  function openEditModal() {
    setError('')
    setEditName(currentOrder.name)
    setEditStore(currentOrder.store)
    setEditExpectedDate(currentOrder.expectedDate)
    setEditValues(
      Object.fromEntries(
        currentOrder.lines.map((line) => [
          line.productId,
          {
            orderedQty: String(line.orderedQty),
            costUsd: String(line.costUsd),
            markupPercent: String(line.markupPercent),
            salePrice: String(line.salePrice),
          },
        ]),
      ),
    )
    setEditOpen(true)
  }

  function openPayModal() {
    setError('')
    setPayAmount(String(Number(debtUsd.toFixed(2))))
    setPayMethodId((current) => current || paymentMethods[0]?.id || '')
    setPayNote('')
    setPayOpen(true)
  }

  function submitReceive() {
    try {
      receivePurchaseOrder({
        orderId: currentOrder.id,
        receivedByProductId: Object.fromEntries(
          Object.entries(receiveValues).map(([productId, value]) => [
            productId,
            Number(value) || 0,
          ]),
        ),
      })
      setReceiveOpen(false)
      setError('')
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Не удалось принять заказ.')
    }
  }

  function submitReturn() {
    try {
      createPurchaseReturn({
        orderId: currentOrder.id,
        reason: returnReason,
        lines: Object.entries(returnValues).map(([productId, value]) => ({
          productId,
          qty: Number(value) || 0,
        })),
      })
      setReturnOpen(false)
      setReturnReason('')
      setError('')
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Не удалось оформить возврат.')
    }
  }

  function submitEdit() {
    try {
      updatePurchaseOrder({
        orderId: currentOrder.id,
        name: editName,
        store: editStore,
        expectedDate: editExpectedDate,
        lines: currentOrder.lines.map((line) => ({
          productId: line.productId,
          orderedQty: Number(editValues[line.productId]?.orderedQty) || 0,
          costUsd: Number(editValues[line.productId]?.costUsd) || 0,
          markupPercent: Number(editValues[line.productId]?.markupPercent) || 0,
          salePrice: Number(editValues[line.productId]?.salePrice) || 0,
        })),
      })
      setEditOpen(false)
      setError('')
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Не удалось обновить заказ.')
    }
  }

  function submitCancel() {
    try {
      cancelPurchaseOrder(currentOrder.id)
      setError('')
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Не удалось отменить заказ.')
    }
  }

  function submitPay() {
    try {
      createSupplierPayment({
        supplierId: currentOrder.supplierId,
        orderId: currentOrder.id,
        amountUsd: Number(payAmount) || 0,
        methodId: payMethodId,
        note: payNote,
      })
      setPayOpen(false)
      setError('')
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Не удалось сохранить оплату.')
    }
  }

  return (
    <div className="space-y-6">
      <DetailHeader
        title={currentOrder.name}
        subtitle={
          <>
            Заказ от {formatDate(currentOrder.createdAt)} • поставщик{' '}
            <Link
              href={`/tovary/postavshchiki/${currentOrder.supplierId}`}
              className="text-primary"
            >
              {currentOrder.supplierName}
            </Link>{' '}
            • {currentOrder.store}
          </>
        }
        backHref="/tovary/zakazy"
        actions={
          <>
            {canEdit ? (
              <GhostButton onClick={openEditModal}>
                <Pencil className="size-5 text-primary" />
                Редактировать
              </GhostButton>
            ) : null}
            {canReturn ? (
              <GhostButton onClick={openReturnModal}>
                <Undo2 className="size-5 text-primary" />
                Возврат
              </GhostButton>
            ) : null}
            {canPay ? (
              <GhostButton onClick={openPayModal}>
                <Banknote className="size-5 text-primary" />
                Оплатить
              </GhostButton>
            ) : null}
            {canReceive ? (
              <PrimaryButton onClick={openReceiveModal}>
                <Plus className="size-5" />
                Приемка
              </PrimaryButton>
            ) : null}
          </>
        }
      />

      {error ? (
        <div className="rounded-2xl bg-destructive/10 px-4 py-3 text-[14px] font-medium text-destructive">
          {error}
        </div>
      ) : null}

      <SubTabs
        tabs={[
          { label: 'Обзор' },
          { label: 'Товары', count: currentOrder.lines.length },
          { label: 'Оплаты', count: payments.length },
          { label: 'Возвраты', count: returns.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stats.map((item) => (
              <StatCard
                key={item.label}
                label={item.label}
                value={item.value}
                unit={item.unit}
                icon={item.icon}
              />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge label={statusLabel(currentOrder.status)} tone={statusTone(currentOrder.status)} />
            <span className="text-[14px] text-muted-foreground">
              Плановая дата: {formatDate(currentOrder.expectedDate)}
            </span>
            {canCancel ? (
              <button
                onClick={submitCancel}
                className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-card px-5 text-[14px] font-semibold text-destructive shadow-sm ring-1 ring-border transition-colors hover:bg-secondary"
              >
                <Trash2 className="size-4" />
                Отменить заказ
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {tab === 1 ? (
        <DetailTableCard>
          <DetailHeadRow
            columns={lineColumns}
            template="1.3fr 120px 120px 120px 120px 120px"
            withSettings={false}
          />
          {currentOrder.lines.map((line) => (
            <DetailRow
              key={line.productId}
              template="1.3fr 120px 120px 120px 120px 120px"
              withSettings={false}
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-primary">{line.productName}</p>
                <p className="truncate text-[13px] text-muted-foreground">{line.barcode}</p>
              </div>
              <div className="font-semibold text-muted-foreground">{line.sku}</div>
              <div className="font-semibold text-foreground">{line.orderedQty} шт</div>
              <div className="font-semibold text-primary">{line.receivedQty} шт</div>
              <div className="font-semibold text-amber-600">
                {returnedByProductId.get(line.productId) ?? 0} шт
              </div>
              <div className="font-semibold text-foreground">{usd(line.costUsd)}</div>
            </DetailRow>
          ))}
        </DetailTableCard>
      ) : null}

      {tab === 2 ? (
        payments.length === 0 ? (
          <EmptyState
            title="Оплат пока нет"
            description="После оплаты поставщику здесь появится история платежей по заказу."
          />
        ) : (
          <DetailTableCard>
            <DetailHeadRow
              columns={paymentColumns}
              template="140px 140px 150px 1fr"
              withSettings={false}
            />
            {payments.map((payment) => {
              const amount = payment.allocations
                .filter((allocation) => allocation.orderId === currentOrder.id)
                .reduce((sum, allocation) => sum + allocation.amountUsd, 0)
              return (
                <DetailRow
                  key={payment.id}
                  template="140px 140px 150px 1fr"
                  withSettings={false}
                >
                  <div className="text-[14px] text-muted-foreground">{formatDate(payment.createdAt)}</div>
                  <div className="font-semibold text-foreground">{usd(amount)}</div>
                  <div className="font-semibold text-primary">{payment.methodLabel}</div>
                  <div className="truncate text-[14px] text-muted-foreground">
                    {payment.note || payment.account}
                  </div>
                </DetailRow>
              )
            })}
          </DetailTableCard>
        )
      ) : null}

      {tab === 3 ? (
        returns.length === 0 ? (
          <EmptyState
            title="Возвратов пока нет"
            description="Оформленные возвраты поставщику будут отображаться здесь."
          />
        ) : (
          <DetailTableCard>
            <DetailHeadRow
              columns={returnColumns}
              template="140px 1.2fr 1fr"
              withSettings={false}
            />
            {returns.map((purchaseReturn) => (
              <DetailRow
                key={purchaseReturn.id}
                template="140px 1.2fr 1fr"
                withSettings={false}
              >
                <div className="text-[14px] text-muted-foreground">
                  {formatDate(purchaseReturn.createdAt)}
                </div>
                <div className="text-[14px] font-semibold text-foreground">
                  {purchaseReturn.lines
                    .map((line) => `${line.productName} (${line.qty} шт)`)
                    .join(', ')}
                </div>
                <div className="text-[14px] text-muted-foreground">
                  {purchaseReturn.reason || '-'}
                </div>
              </DetailRow>
            ))}
          </DetailTableCard>
        )
      ) : null}

      {receiveOpen ? (
        <OrderActionModal
          title="Приемка заказа"
          submitLabel="Принять"
          onClose={() => setReceiveOpen(false)}
          onSubmit={submitReceive}
        >
          <div className="space-y-4">
            {currentOrder.lines.map((line) => (
              <ActionRow
                key={line.productId}
                title={line.productName}
                subtitle={`Осталось принять ${Math.max(0, line.orderedQty - line.receivedQty)} шт`}
                value={receiveValues[line.productId] ?? '0'}
                onChange={(value) =>
                  setReceiveValues((current) => ({ ...current, [line.productId]: value }))
                }
              />
            ))}
          </div>
        </OrderActionModal>
      ) : null}

      {returnOpen ? (
        <OrderActionModal
          title="Возврат поставщику"
          submitLabel="Оформить возврат"
          onClose={() => setReturnOpen(false)}
          onSubmit={submitReturn}
        >
          <div className="space-y-4">
            <FieldInput
              label="Причина"
              value={returnReason}
              onChange={setReturnReason}
              placeholder="Брак, пересорт, возврат поставщику"
            />
            {currentOrder.lines.map((line) => {
              const returned = returnedByProductId.get(line.productId) ?? 0
              return (
                <ActionRow
                  key={line.productId}
                  title={line.productName}
                  subtitle={`Доступно к возврату ${Math.max(0, line.receivedQty - returned)} шт`}
                  value={returnValues[line.productId] ?? '0'}
                  onChange={(value) =>
                    setReturnValues((current) => ({ ...current, [line.productId]: value }))
                  }
                />
              )
            })}
          </div>
        </OrderActionModal>
      ) : null}

      {payOpen ? (
        <OrderActionModal
          title="Оплата поставщику"
          submitLabel="Сохранить"
          onClose={() => setPayOpen(false)}
          onSubmit={submitPay}
        >
          <div className="space-y-4">
            <FieldInput label="Сумма USD" value={payAmount} onChange={setPayAmount} />
            <div className="space-y-2">
              <label className="block text-[13px] font-medium text-muted-foreground">Метод</label>
              <select
                value={payMethodId}
                onChange={(event) => setPayMethodId(event.target.value)}
                className="h-12 w-full rounded-2xl bg-card px-4 text-[14px] font-medium text-foreground outline-none ring-1 ring-border transition-shadow focus:ring-2 focus:ring-primary/40"
              >
                {paymentMethods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>
            <FieldInput
              label="Комментарий"
              value={payNote}
              onChange={setPayNote}
              placeholder="Оплата по заказу"
            />
          </div>
        </OrderActionModal>
      ) : null}

      {editOpen ? (
        <OrderActionModal
          title="Редактирование заказа"
          submitLabel="Сохранить"
          onClose={() => setEditOpen(false)}
          onSubmit={submitEdit}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FieldInput label="Наименование" value={editName} onChange={setEditName} />
              <FieldInput label="Магазин" value={editStore} onChange={setEditStore} />
            </div>
            <div className="space-y-2">
              <label className="block text-[15px] font-medium text-muted-foreground">
                Плановая дата
              </label>
              <input
                type="date"
                value={editExpectedDate}
                onChange={(event) => setEditExpectedDate(event.target.value)}
                className="h-14 w-full rounded-2xl bg-secondary px-5 text-[15px] font-medium text-foreground outline-none ring-1 ring-border transition-shadow focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="space-y-4">
              {currentOrder.lines.map((line) => (
                <div key={line.productId} className="space-y-3 rounded-2xl bg-secondary/50 p-4">
                  <div>
                    <p className="font-semibold text-foreground">{line.productName}</p>
                    <p className="text-[13px] text-muted-foreground">{line.sku}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <FieldInput
                      label="Кол-во"
                      value={editValues[line.productId]?.orderedQty ?? '0'}
                      onChange={(value) =>
                        setEditValues((current) => ({
                          ...current,
                          [line.productId]: {
                            ...current[line.productId],
                            orderedQty: value,
                          },
                        }))
                      }
                    />
                    <FieldInput
                      label="Цена USD"
                      value={editValues[line.productId]?.costUsd ?? '0'}
                      onChange={(value) =>
                        setEditValues((current) => ({
                          ...current,
                          [line.productId]: {
                            ...current[line.productId],
                            costUsd: value,
                          },
                        }))
                      }
                    />
                    <FieldInput
                      label="Наценка %"
                      value={editValues[line.productId]?.markupPercent ?? '0'}
                      onChange={(value) =>
                        setEditValues((current) => ({
                          ...current,
                          [line.productId]: {
                            ...current[line.productId],
                            markupPercent: value,
                          },
                        }))
                      }
                    />
                    <FieldInput
                      label="Цена продажи"
                      value={editValues[line.productId]?.salePrice ?? '0'}
                      onChange={(value) =>
                        setEditValues((current) => ({
                          ...current,
                          [line.productId]: {
                            ...current[line.productId],
                            salePrice: value,
                          },
                        }))
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </OrderActionModal>
      ) : null}
    </div>
  )
}

function OrderActionModal({
  title,
  submitLabel,
  children,
  onClose,
  onSubmit,
}: {
  title: string
  submitLabel: string
  children: ReactNode
  onClose: () => void
  onSubmit: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 py-10">
      <button
        aria-label="Закрыть"
        onClick={onClose}
        className="fixed inset-0 bg-foreground/40 backdrop-blur-sm"
      />
      <div className="relative z-10 w-full max-w-2xl rounded-3xl bg-card shadow-xl ring-1 ring-border">
        <div className="flex items-center justify-between gap-4 p-6">
          <h2 className="text-2xl font-black text-foreground">{title}</h2>
        </div>
        <div className="px-6 pb-2">{children}</div>
        <div className="mt-8 flex items-center justify-between gap-4 p-6">
          <button
            onClick={onClose}
            className="flex h-14 flex-1 items-center justify-center rounded-2xl bg-secondary text-[15px] font-semibold text-foreground transition-colors hover:bg-secondary/70"
          >
            Отмена
          </button>
          <button
            onClick={onSubmit}
            className="flex h-14 flex-1 items-center justify-center rounded-2xl bg-primary text-[15px] font-semibold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function ActionRow({
  title,
  subtitle,
  value,
  onChange,
}: {
  title: string
  subtitle: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="grid grid-cols-[1fr_140px] items-center gap-4 rounded-2xl bg-secondary/50 p-4">
      <div className="min-w-0">
        <p className="truncate font-semibold text-foreground">{title}</p>
        <p className="text-[13px] text-muted-foreground">{subtitle}</p>
      </div>
      <QtyInput value={value} suffix="шт" onChange={onChange} />
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
  placeholder?: string
}) {
  return (
    <div className="space-y-2">
      <label className="block text-[13px] font-medium text-muted-foreground">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl bg-card px-4 text-[14px] font-medium text-foreground outline-none ring-1 ring-border transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40"
      />
    </div>
  )
}

function statusLabel(status: ErpPurchaseOrder['status']) {
  if (status === 'draft') return 'Черновик'
  if (status === 'ordered') return 'Оформлен'
  if (status === 'partial') return 'Частично получен'
  if (status === 'received') return 'Получен'
  if (status === 'paid') return 'Оплачен'
  if (status === 'cancelled') return 'Отменен'
  return 'Оплачен'
}

function statusTone(status: ErpPurchaseOrder['status']) {
  if (status === 'paid') return 'success' as const
  if (status === 'received') return 'info' as const
  if (status === 'partial') return 'warning' as const
  return 'muted' as const
}

function usd(value: number) {
  return `${Number(value.toFixed(1))} USD`
}

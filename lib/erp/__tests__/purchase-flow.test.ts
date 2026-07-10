import { beforeEach, describe, expect, it } from 'vitest'
import {
  createPurchaseOrder,
  createPurchaseReturn,
  createSupplierPayment,
  getWarehouseStock,
  readPaymentMethodSettings,
  readPurchaseOrders,
  readSuppliers,
  receivePurchaseOrder,
} from '../erp-store'
import { readProducts } from '../product-catalog'

describe('purchase flow integrity', () => {
  beforeEach(() => localStorage.clear())

  function orderFixture() {
    const product = readProducts()[0]
    const supplier = readSuppliers()[0]
    const order = createPurchaseOrder({
      name: 'Тестовый заказ', supplierId: supplier.id, store: 'Магазин', expectedDate: '2026-07-15',
      lines: [{ productId: product.id, orderedQty: 5, costUsd: 10, markupPercent: 20, salePrice: product.price }],
    })
    return { order, product }
  }

  it('does not change stock when received quantity exceeds the order', () => {
    const { order, product } = orderFixture()
    const before = getWarehouseStock(product.id)
    expect(() => receivePurchaseOrder({ orderId: order.id, receivedByProductId: { [product.id]: 6 } })).toThrow('больше заказанного')
    expect(getWarehouseStock(product.id)).toBe(before)
    expect(readPurchaseOrders().find((item) => item.id === order.id)?.lines[0].receivedQty).toBe(0)
  })

  it('rejects duplicate order lines', () => {
    const product = readProducts()[0]
    const supplier = readSuppliers()[0]
    const line = { productId: product.id, orderedQty: 1, costUsd: 10, markupPercent: 0, salePrice: 100 }
    expect(() => createPurchaseOrder({ name: 'Дубли', supplierId: supplier.id, store: 'Магазин', expectedDate: '', lines: [line, line] })).toThrow('несколько раз')
  })

  it('rejects duplicate return lines exceeding the received quantity', () => {
    const { order, product } = orderFixture()
    receivePurchaseOrder({ orderId: order.id, receivedByProductId: { [product.id]: 5 } })
    expect(() => createPurchaseReturn({ orderId: order.id, lines: [{ productId: product.id, qty: 3 }, { productId: product.id, qty: 3 }] })).toThrow('превышает')
  })

  it('tracks partial and full supplier payments to cents', () => {
    const { order, product } = orderFixture()
    const method = readPaymentMethodSettings().find((item) => item.status === 'active' && item.channel !== 'credit')!
    createSupplierPayment({ supplierId: order.supplierId, orderId: order.id, amountUsd: 10.005, methodId: method.id })
    expect(readPurchaseOrders().find((item) => item.id === order.id)?.paidUsd).toBe(10.01)
    createSupplierPayment({ supplierId: order.supplierId, orderId: order.id, amountUsd: 39.99, methodId: method.id })
    receivePurchaseOrder({ orderId: order.id, receivedByProductId: { [product.id]: 5 } })
    const paid = readPurchaseOrders().find((item) => item.id === order.id)
    expect(paid?.paidUsd).toBe(50)
    expect(paid?.status).toBe('paid')
    expect(() => createSupplierPayment({ supplierId: order.supplierId, orderId: order.id, amountUsd: 0.01, methodId: method.id })).toThrow('no unpaid balance')
  })
})

import { beforeEach, describe, expect, it } from 'vitest'
import {
  completeSale,
  createSaleExchange,
  createSaleReturn,
  getWarehouseStock,
  readSales,
} from '../erp-store'
import { writeProducts, type CatalogProduct } from '../product-catalog'

function product(overrides: Partial<CatalogProduct>): CatalogProduct {
  const now = '2026-07-09T09:00:00.000Z'
  return {
    id: 'product-1',
    name: 'Казан 8 л',
    sku: 'KZN-8',
    barcode: '2000000000001',
    category: 'Казаны',
    brand: 'Kukmara',
    supplier: 'Основной поставщик',
    unit: 'шт',
    price: 100000,
    wholesalePrice: 90000,
    stock: 1,
    lowStockThreshold: 1,
    status: 'active',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

function sell(item: CatalogProduct, qty: number) {
  return completeSale({
    orderNumber: `sale-${item.id}`,
    client: null,
    seller: 'Администратор',
    subtotal: item.price * qty,
    discount: 0,
    total: item.price * qty,
    lines: [{ product: item, qty, unitPrice: item.price, priceType: 'retail' }],
    payments: [
      {
        id: `payment-${item.id}`,
        methodId: 'cash',
        label: 'Наличные',
        amount: item.price * qty,
      },
    ],
  })
}

describe('sales flow', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('does not write a return when exchange outgoing stock validation fails', () => {
    const sold = product({ id: 'sold-product', stock: 1 })
    const missing = product({
      id: 'missing-product',
      name: 'Сковорода 28 см',
      sku: 'SKV-28',
      barcode: '2000000000002',
      stock: 0,
      price: 120000,
    })
    writeProducts([sold, missing], false)

    const sale = sell(sold, 1)

    expect(() =>
      createSaleExchange({
        saleId: sale.id,
        seller: 'Администратор',
        reason: 'Обмен',
        returnLines: [{ productId: sold.id, qty: 1 }],
        exchange: {
          client: null,
          seller: 'Администратор',
          subtotal: 0,
          discount: 0,
          total: 0,
          lines: [{ product: missing, qty: 1, unitPrice: missing.price }],
          payments: [],
        },
      }),
    ).toThrow()

    expect(readSales()).toHaveLength(1)
    expect(readSales()[0]?.id).toBe(sale.id)
    expect(getWarehouseStock(sold.id)).toBe(0)
    expect(getWarehouseStock(missing.id)).toBe(0)
  })

  it('rejects duplicate return lines that exceed sold quantity', () => {
    const sold = product({ id: 'return-product', stock: 2 })
    writeProducts([sold], false)

    const sale = sell(sold, 2)

    expect(() =>
      createSaleReturn({
        saleId: sale.id,
        seller: 'Администратор',
        reason: 'Возврат',
        lines: [
          { productId: sold.id, qty: 2 },
          { productId: sold.id, qty: 1 },
        ],
      }),
    ).toThrow()

    expect(readSales()).toHaveLength(1)
    expect(getWarehouseStock(sold.id)).toBe(0)
  })
})

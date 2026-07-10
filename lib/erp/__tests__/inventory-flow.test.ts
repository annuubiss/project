import { beforeEach, describe, expect, it } from 'vitest'
import { completeInventoryCount, completeInventoryDocument, createInventoryDocument, getWarehouseStock, readInventoryMovements, updateInventoryCounts } from '../erp-store'
import { readProducts } from '../product-catalog'

describe('inventory completion', () => {
  beforeEach(() => localStorage.clear())

  it('creates one immutable adjustment document', () => {
    const product = readProducts()[0]
    const current = getWarehouseStock(product.id)
    const movements = completeInventoryCount({ sourceId: 'inv-1', counts: [{ productId: product.id, countedQty: current + 2 }] })
    expect(movements).toHaveLength(1)
    expect(getWarehouseStock(product.id)).toBe(current + 2)
    expect(() => completeInventoryCount({ sourceId: 'inv-1', counts: [{ productId: product.id, countedQty: current }] })).toThrow('уже завершена')
    expect(readInventoryMovements().filter((movement) => movement.sourceId === 'inv-1')).toHaveLength(1)
  })

  it('does not write any movement when a document contains duplicate products', () => {
    const product = readProducts()[0]
    const before = readInventoryMovements().length
    expect(() => completeInventoryCount({ sourceId: 'inv-2', counts: [{ productId: product.id, countedQty: 1 }, { productId: product.id, countedQty: 2 }] })).toThrow('несколько раз')
    expect(readInventoryMovements()).toHaveLength(before)
  })

  it('requires full counts and locks a completed document', () => {
    const products = readProducts().filter((product) => product.status === 'active')
    const document = createInventoryDocument({ type: 'full' })
    expect(() => completeInventoryDocument(document.id)).toThrow('каждого активного товара')
    updateInventoryCounts(document.id, Object.fromEntries(products.map((product) => [product.id, getWarehouseStock(product.id)])))
    completeInventoryDocument(document.id)
    expect(() => updateInventoryCounts(document.id, {})).toThrow('нельзя редактировать')
  })
})

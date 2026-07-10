import { describe, it, expect } from 'vitest'
import { readProducts, seedProducts } from '../product-catalog'

describe('product-catalog readProducts', () => {
  it('should return seed products when no localStorage data', () => {
    // Mock localStorage
    const originalLocalStorage = global.localStorage
    delete (global as any).localStorage
    global.localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
    } as any

    const products = readProducts()
    expect(products.length).toBeGreaterThan(0)
    expect(products[0]).toMatchObject(seedProducts[0])
    expect(products[0].categoryId).toBeTruthy()

    global.localStorage = originalLocalStorage
  })

  it('should normalize product data', () => {
    const products = readProducts()
    products.forEach((product) => {
      expect(product.category).toBeDefined()
      expect(product.categoryId).toBeDefined()
      expect(product.unit).toBeDefined()
      expect(product.price).toBeTypeOf('number')
      expect(product.wholesalePrice).toBeTypeOf('number')
      expect(product.stock).toBeTypeOf('number')
      expect(product.lowStockThreshold).toBeTypeOf('number')
    })
  })
})

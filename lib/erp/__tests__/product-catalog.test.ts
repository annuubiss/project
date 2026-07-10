import { describe, it, expect } from 'vitest'
import {
  generateSku,
  generateBarcode,
  parseMoney,
  formatUZS,
  validateProductDraft,
  type ProductDraft,
} from '../product-catalog'

const validDraft: ProductDraft = {
  name: 'Казан 8 л',
  sku: 'KZN-008',
  barcode: '2000000010001',
  category: 'Казаны',
  unit: 'sht',
  price: 185000,
  wholesalePrice: 160000,
  stock: 10,
  lowStockThreshold: 3,
  status: 'active',
}

describe('product-catalog utils', () => {
  describe('generateSku', () => {
    it('should generate SKU from product name', () => {
      const sku = generateSku('Product name')
      expect(sku).toMatch(/^[A-Z]{3}-[0-9]{5}$/)
    })

    it('should handle special characters', () => {
      const sku = generateSku('Product-name (special)')
      expect(sku).toMatch(/^[A-Z]{3}-[0-9]{5}$/)
    })

    it('should pad short names', () => {
      const sku = generateSku('AB')
      expect(sku).toMatch(/^[A-Z]{3}-[0-9]{5}$/)
    })
  })

  describe('generateBarcode', () => {
    it('should generate 13-digit barcode starting with 200', () => {
      const barcode = generateBarcode()
      expect(barcode).toMatch(/^200[0-9]{10}$/)
      expect(barcode.length).toBe(13)

      const sum = barcode
        .slice(0, 12)
        .split('')
        .reduce((total, digit, index) => total + Number(digit) * (index % 2 === 0 ? 1 : 3), 0)
      expect((sum + Number(barcode[12])) % 10).toBe(0)
    })
  })

  describe('validateProductDraft', () => {
    it('normalizes product identifiers', () => {
      const result = validateProductDraft({ ...validDraft, sku: ' kzn-008 ' }, [])
      expect(result.sku).toBe('KZN-008')
    })

    it('rejects duplicate SKU and barcode', () => {
      const existing = [{ ...validDraft, id: 'p1', createdAt: '', updatedAt: '' }]
      expect(() => validateProductDraft({ ...validDraft, barcode: '2000000019999' }, existing)).toThrow(
        'артикулом',
      )
      expect(() => validateProductDraft({ ...validDraft, sku: 'KZN-009' }, existing)).toThrow(
        'штрихкодом',
      )
    })

    it('rejects invalid prices and quantities', () => {
      expect(() => validateProductDraft({ ...validDraft, price: 0 }, [])).toThrow('больше нуля')
      expect(() => validateProductDraft({ ...validDraft, stock: -1 }, [])).toThrow('отрицательным')
    })
  })

  describe('parseMoney', () => {
    it('should parse valid money string', () => {
      expect(parseMoney('125000')).toBe(125000)
      expect(parseMoney('1 250 000')).toBe(1250000)
    })

    it('should ignore non-numeric characters', () => {
      expect(parseMoney('125 000 UZS')).toBe(125000)
      expect(parseMoney('$125,000')).toBe(125000)
    })

    it('should return 0 for invalid input', () => {
      expect(parseMoney('abc')).toBe(0)
      expect(parseMoney('')).toBe(0)
    })
  })

  describe('formatUZS', () => {
    it('should format number with spaces', () => {
      expect(formatUZS(125000)).toMatch(/125\s000/)
      expect(formatUZS(1000000)).toMatch(/1\s000\s000/)
    })

    it('should handle zero', () => {
      expect(formatUZS(0)).toBe('0')
    })
  })
})

import { beforeEach, describe, expect, it } from 'vitest'
import {
  archiveProductUnit,
  createProductUnit,
  getActiveProductUnits,
  readProductUnits,
} from '../product-units'

describe('product units', () => {
  beforeEach(() => localStorage.clear())

  it('provides the system units', () => {
    expect(getActiveProductUnits().some((unit) => unit.id === 'sht')).toBe(true)
  })

  it('creates a unique custom unit and archives it', () => {
    const created = createProductUnit({ label: 'Комплект', symbol: 'компл' })
    expect(readProductUnits()).toContainEqual(created)
    expect(() => createProductUnit({ label: 'Другой комплект', symbol: 'компл' })).toThrow(
      'уже существует',
    )

    archiveProductUnit(created.id)
    expect(getActiveProductUnits().some((unit) => unit.id === created.id)).toBe(false)
  })

  it('does not archive a system unit', () => {
    expect(() => archiveProductUnit('sht')).toThrow('Системную')
  })
})

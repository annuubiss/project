import { beforeEach, describe, expect, it } from 'vitest'
import { parseCsv, prepareProductImport } from '../product-import'

describe('product import', () => {
  beforeEach(() => localStorage.clear())

  it('parses semicolon CSV with quoted values', () => {
    expect(parseCsv('name;price\n"Казан; 8 л";185000')).toEqual([
      ['name', 'price'], ['Казан; 8 л', '185000'],
    ])
  })

  it('maps a valid product row', () => {
    const rows = prepareProductImport('Наименование;Артикул;Штрихкод;Категория;Единица;Цена продажи\nКазан 8 л;KZN-NEW-8;2999999999999;Казаны;шт;185000')
    expect(rows).toHaveLength(1)
    expect(rows[0].errors).toEqual([])
    expect(rows[0].draft.categoryId).toBeTruthy()
    expect(rows[0].draft.unit).toBe('sht')
  })

  it('reports missing fields and duplicates with row numbers', () => {
    const rows = prepareProductImport('Наименование;Артикул;Штрихкод;Категория;Единица;Цена продажи\nКазан;KZN-8;2000000010001;Казаны;шт;0\nКазан 2;KZN-8;2000000010001;Нет;шт;100')
    expect(rows[0].errors.some((error) => error.field === 'price')).toBe(true)
    expect(rows[1].errors.map((error) => error.field)).toEqual(expect.arrayContaining(['sku', 'barcode', 'category']))
    expect(rows[1].row).toBe(3)
  })
})

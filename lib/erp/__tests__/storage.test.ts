import { describe, expect, it } from 'vitest'
import { createCrudRepository } from '../repositories/base'
import { mergeFilters, queryItems } from '../storage'

type DemoItem = {
  id: string
  name: string
  status: 'active' | 'inactive'
  amount: number
  createdAt: string
  updatedAt: string
}

describe('storage query helpers', () => {
  const items: DemoItem[] = [
    { id: '1', name: 'Казан 12л', status: 'active', amount: 5, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
    { id: '2', name: 'Сковорода 24', status: 'inactive', amount: 2, createdAt: '2026-01-02', updatedAt: '2026-01-02' },
    { id: '3', name: 'Казан 8л', status: 'active', amount: 11, createdAt: '2026-01-03', updatedAt: '2026-01-03' },
  ]

  it('filters, searches, sorts and paginates together', () => {
    const result = queryItems(items, {
      page: 1,
      pageSize: 1,
      filters: { status: 'active' },
      search: 'казан',
      searchKeys: ['name'],
      sort: { key: 'amount', dir: 'desc' },
    })

    expect(result.total).toBe(2)
    expect(result.totalPages).toBe(2)
    expect(result.items[0]?.id).toBe('3')
  })

  it('merges and clears empty filters', () => {
    expect(
      mergeFilters(
        { status: 'active', category: 'Казаны' },
        { category: '', brand: 'Kukmara' },
      ),
    ).toEqual({ status: 'active', brand: 'Kukmara' })
  })
})

describe('createCrudRepository', () => {
  it('creates, updates and queries repository items', () => {
    let store: DemoItem[] = []

    const repository = createCrudRepository<
      DemoItem,
      Pick<DemoItem, 'name' | 'status' | 'amount'>,
      Partial<DemoItem>
    >({
      read: () => store,
      write: (items) => {
        store = items
      },
      createEntity: (data, { now, items }) => ({
        id: `demo-${items.length + 1}`,
        createdAt: now,
        updatedAt: now,
        ...data,
      }),
      updateEntity: (current, patch, { now }) => ({
        ...current,
        ...patch,
        updatedAt: now,
      }),
    })

    const first = repository.create({ name: 'Кастрюля', status: 'active', amount: 3 })
    repository.create({ name: 'Нож', status: 'inactive', amount: 1 })
    const updated = repository.update(first.id, { amount: 9 })
    const page = repository.query({
      filters: { status: 'active' },
      sort: { key: 'amount', dir: 'desc' },
    })

    expect(updated?.amount).toBe(9)
    expect(page.total).toBe(1)
    expect(page.items[0]?.name).toBe('Кастрюля')
  })
})

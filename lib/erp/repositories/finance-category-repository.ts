import {
  readFinanceCategories,
  writeFinanceCategories,
  type ErpFinanceCategory,
} from '../erp-store'
import { createCrudRepository, type CrudRepository } from './base'

export type FinanceCategoryRepository = CrudRepository<
  ErpFinanceCategory,
  Omit<ErpFinanceCategory, 'id' | 'createdAt' | 'updatedAt'>,
  Partial<ErpFinanceCategory>
> & {
  findTree: () => Array<ErpFinanceCategory & { children: ErpFinanceCategory[] }>
  archive: (id: string) => boolean
  restore: (id: string) => boolean
}

export function createFinanceCategoryRepository(): FinanceCategoryRepository {
  const repository = createCrudRepository<
    ErpFinanceCategory,
    Omit<ErpFinanceCategory, 'id' | 'createdAt' | 'updatedAt'>,
    Partial<ErpFinanceCategory>
  >({
    read: readFinanceCategories,
    write: writeFinanceCategories,
    createEntity: (data, { now }) => ({
      id: `fcat-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
      ...data,
    }),
    updateEntity: (current, patch, { now }) => ({
      ...current,
      ...(patch as Partial<ErpFinanceCategory>),
      updatedAt: now,
    }),
  })

  return {
    ...repository,
    findTree: () => {
      const categories = readFinanceCategories()
      const parents = categories.filter((c) => !c.parentId)
      return parents.map((parent) => ({
        ...parent,
        children: categories.filter((c) => c.parentId === parent.id),
      }))
    },
    archive: (id) => {
      const categories = readFinanceCategories()
      const now = new Date().toISOString()
      const next: ErpFinanceCategory[] = categories.map((c) =>
        c.id === id || c.parentId === id
          ? { ...c, status: 'deleted' as const, updatedAt: now }
          : c,
      )
      writeFinanceCategories(next)
      return true
    },
    restore: (id) => {
      const categories = readFinanceCategories()
      const now = new Date().toISOString()
      const target = categories.find((c) => c.id === id)
      if (!target) return false

      const next: ErpFinanceCategory[] = categories.map((c) => {
        if (c.id === id) return { ...c, status: 'active' as const, updatedAt: now }
        if (c.parentId === id) return { ...c, status: 'active' as const, updatedAt: now }
        return c
      })

      writeFinanceCategories(next)
      return true
    },
  }
}

import {
  readSuppliers,
  writeSuppliers,
  type ErpSupplier,
} from '../erp-store'
import { createCrudRepository, type CrudRepository } from './base'

export type SupplierRepository = CrudRepository<
  ErpSupplier,
  Omit<ErpSupplier, 'id' | 'createdAt' | 'updatedAt'>,
  Partial<ErpSupplier>
> & {
  archive: (id: string) => boolean
  restore: (id: string) => boolean
}

export function createSupplierRepository(): SupplierRepository {
  const repository = createCrudRepository<
    ErpSupplier,
    Omit<ErpSupplier, 'id' | 'createdAt' | 'updatedAt'>,
    Partial<ErpSupplier>
  >({
    read: readSuppliers,
    write: writeSuppliers,
    createEntity: (data, { now }) => ({
      id: `sup-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
      ...data,
    }),
    updateEntity: (current, patch, { now }) => ({
      ...current,
      ...(patch as Partial<ErpSupplier>),
      updatedAt: now,
    }),
  })

  return {
    ...repository,
    archive: (id) => {
      const updated = repository.update(id, { status: 'inactive' })
      return updated !== null
    },
    restore: (id) => {
      const updated = repository.update(id, { status: 'active' })
      return updated !== null
    },
  }
}

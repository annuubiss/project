import {
  readEmployees,
  writeEmployees,
  type ErpEmployee,
} from '../erp-store'
import { createCrudRepository, type CrudRepository } from './base'

export type EmployeeRepository = CrudRepository<
  ErpEmployee,
  Omit<ErpEmployee, 'id' | 'createdAt'>,
  Partial<ErpEmployee>
> & {
  archive: (id: string) => boolean
  restore: (id: string) => boolean
}

export function createEmployeeRepository(): EmployeeRepository {
  const repository = createCrudRepository<
    ErpEmployee,
    Omit<ErpEmployee, 'id' | 'createdAt'>,
    Partial<ErpEmployee>
  >({
    read: readEmployees,
    write: writeEmployees,
    createEntity: (data, { now }) => ({
      id: `emp-${Date.now()}`,
      createdAt: now,
      ...data,
    }),
    updateEntity: (current, patch, { now }) => ({
      ...current,
      ...(patch as Partial<ErpEmployee>),
      updatedAt: now,
    }),
  })

  return {
    ...repository,
    archive: (id) => {
      const updated = repository.update(id, { status: 'deleted' })
      return updated !== null
    },
    restore: (id) => {
      const updated = repository.update(id, { status: 'active' })
      return updated !== null
    },
  }
}

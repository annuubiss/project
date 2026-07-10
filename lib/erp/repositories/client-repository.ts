import {
  readClients,
  writeClients,
  type ErpClient,
} from '../erp-store'
import { createCrudRepository, type CrudRepository } from './base'

export type ClientRepository = CrudRepository<
  ErpClient,
  Omit<ErpClient, 'id' | 'createdAt' | 'updatedAt'>,
  Partial<ErpClient>
>

export function createClientRepository(): ClientRepository {
  return createCrudRepository<
    ErpClient,
    Omit<ErpClient, 'id' | 'createdAt' | 'updatedAt'>,
    Partial<ErpClient>
  >({
    read: readClients,
    write: writeClients,
    createEntity: (data, { now }) => ({
      id: `client-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
      ...data,
    }),
    updateEntity: (current, patch, { now }) => ({
      ...current,
      ...(patch as Partial<ErpClient>),
      updatedAt: now,
    }),
  })
}

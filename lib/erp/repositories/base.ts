import {
  queryItems,
  type PageResult,
  type QueryConfig,
} from '../storage'

export type RepositoryQuery<T> = QueryConfig<T> & {
  predicate?: (item: T) => boolean
}

export type CrudRepository<
  T extends { id: string },
  TCreate extends object,
  TUpdate extends object = Partial<T>,
> = {
  findAll: () => T[]
  query: (config?: RepositoryQuery<T>) => PageResult<T>
  findById: (id: string) => T | null
  create: (data: TCreate) => T
  update: (id: string, data: TUpdate) => T | null
}

type CreateCrudRepositoryOptions<
  T extends { id: string },
  TCreate extends object,
  TUpdate extends object = Partial<T>,
> = {
  read: () => T[]
  write: (items: T[]) => unknown
  createEntity: (data: TCreate, context: { items: T[]; now: string }) => T
  updateEntity?: (
    current: T,
    patch: TUpdate,
    context: { items: T[]; now: string },
  ) => T
}

export function createCrudRepository<
  T extends { id: string },
  TCreate extends object,
  TUpdate extends object = Partial<T>,
>({
  read,
  write,
  createEntity,
  updateEntity,
}: CreateCrudRepositoryOptions<T, TCreate, TUpdate>): CrudRepository<T, TCreate, TUpdate> {
  return {
    findAll: () => read(),
    query: (config = {}) => {
      const { predicate, ...query } = config
      const items = predicate ? read().filter(predicate) : read()
      return queryItems(items, query)
    },
    findById: (id) => read().find((item) => item.id === id) ?? null,
    create: (data) => {
      const items = read()
      const entity = createEntity(data, { items, now: new Date().toISOString() })
      write([...items, entity])
      return entity
    },
    update: (id, data) => {
      const items = read()
      const index = items.findIndex((item) => item.id === id)
      if (index < 0) return null

      const current = items[index]
      const updated = updateEntity
        ? updateEntity(current, data, { items, now: new Date().toISOString() })
        : ({
            ...current,
            ...(data as Partial<T>),
          } as T)

      const next = [...items]
      next[index] = updated
      write(next)
      return updated
    },
  }
}

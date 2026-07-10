'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  Plus,
  Pencil,
  Link2,
  Trash2,
  ChevronRight,
  X,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  ERP_DATA_CHANGED,
  archiveFinanceCategory,
  createFinanceCategory,
  getFinanceCategoryOptions,
  getFinanceCategoryTree,
  restoreFinanceCategory,
  type ErpFinanceCategory,
  type ErpFinanceCategoryType,
  type FinanceCategoryTreeItem,
  updateFinanceCategory,
} from '@/lib/erp/erp-store'

type TabId = 'active' | 'income' | 'expense' | 'deleted'

type CategoryModalState =
  | {
      mode: 'create'
      parentId: string | null
      type: ErpFinanceCategoryType
    }
  | {
      mode: 'edit'
      category: ErpFinanceCategory
    }

const typeBadge: Record<ErpFinanceCategoryType, string> = {
  income: 'bg-chart-2/15 text-chart-2',
  expense: 'bg-chart-4/15 text-chart-4',
}

function CategoryModal({
  state,
  onClose,
  onSaved,
}: {
  state: CategoryModalState
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(
    state.mode === 'edit' ? state.category.name : '',
  )
  const [type, setType] = useState<ErpFinanceCategoryType>(
    state.mode === 'edit' ? state.category.type : state.type,
  )
  const [parentId, setParentId] = useState<string>(
    state.mode === 'edit' ? state.category.parentId ?? '' : state.parentId ?? '',
  )
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const parentOptions = useMemo(
    () =>
      getFinanceCategoryOptions(type).filter(
        (category) =>
          !category.parentId &&
          (state.mode !== 'edit' || category.id !== state.category.id),
      ),
    [state, type],
  )

  function handleSubmit() {
    try {
      setError('')
      if (state.mode === 'edit') {
        updateFinanceCategory({
          id: state.category.id,
          name,
          type,
          parentId: parentId || null,
        })
      } else {
        createFinanceCategory({
          name,
          type,
          parentId: parentId || null,
        })
      }
      onSaved()
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить категорию.')
    }
  }

  const title =
    state.mode === 'edit'
      ? 'Редактирование категории'
      : state.parentId
        ? 'Новая подкатегория'
        : 'Новая категория'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md rounded-3xl bg-card shadow-2xl ring-1 ring-border">
        {done ? (
          <div className="p-8 text-center">
            <span className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-chart-2/10">
              <Check className="size-8 text-chart-2" />
            </span>
            <h3 className="text-xl font-black text-foreground">Категория сохранена</h3>
            <p className="mt-2 text-[15px] text-muted-foreground">
              {name || 'Без названия'} добавлена в список
            </p>
            <button
              onClick={onClose}
              className="mt-6 w-full rounded-2xl bg-primary py-3.5 text-[15px] font-bold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
            >
              Готово
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-border px-7 py-5">
              <h2 className="text-xl font-black text-foreground">{title}</h2>
              <button
                onClick={onClose}
                aria-label="Закрыть"
                className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-5 px-7 py-6">
              <div>
                <label className="mb-2 block text-[13px] font-medium text-muted-foreground">
                  Наименование категории
                </label>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Например, Аренда помещения"
                  className="h-12 w-full rounded-2xl bg-secondary px-4 text-[15px] text-foreground outline-none ring-1 ring-transparent transition-shadow placeholder:text-muted-foreground focus:ring-primary/40"
                />
              </div>

              <div>
                <span className="mb-2 block text-[13px] font-medium text-muted-foreground">Тип</span>
                <div className="grid grid-cols-2 gap-3">
                  {(['income', 'expense'] as const).map((item) => (
                    <button
                      key={item}
                      onClick={() => setType(item)}
                      className={cn(
                        'rounded-2xl py-3.5 text-[15px] font-semibold transition-all ring-1',
                        type === item
                          ? item === 'income'
                            ? 'bg-chart-2/10 text-chart-2 ring-chart-2'
                            : 'bg-chart-4/10 text-chart-4 ring-chart-4'
                          : 'bg-secondary text-muted-foreground ring-transparent hover:text-foreground',
                      )}
                    >
                      {item === 'income' ? 'Доход' : 'Расход'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[13px] font-medium text-muted-foreground">
                  Родительская категория
                </label>
                <select
                  value={parentId}
                  onChange={(event) => setParentId(event.target.value)}
                  className="h-12 w-full rounded-2xl bg-secondary px-4 text-[15px] text-foreground outline-none ring-1 ring-transparent transition-shadow focus:ring-primary/40"
                >
                  <option value="">Без родителя</option>
                  {parentOptions.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {error ? (
                <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-[13px] font-medium text-destructive">
                  {error}
                </p>
              ) : null}
            </div>

            <div className="border-t border-border px-7 py-5">
              <button
                onClick={handleSubmit}
                className="w-full rounded-2xl bg-primary py-3.5 text-[15px] font-bold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
              >
                Сохранить
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export function FinanceCategories() {
  const [tab, setTab] = useState<TabId>('active')
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState<CategoryModalState | null>(null)
  const [expanded, setExpanded] = useState<string[]>([])
  const [tree, setTree] = useState<FinanceCategoryTreeItem[]>([])

  useEffect(() => {
    function load() {
      const nextTree = getFinanceCategoryTree().sort((left, right) =>
        left.name.localeCompare(right.name, 'ru-RU'),
      )

      setTree(
        nextTree.map((item) => ({
          ...item,
          children: [...item.children].sort((left, right) =>
            left.name.localeCompare(right.name, 'ru-RU'),
          ),
        })),
      )
    }

    load()
    window.addEventListener(ERP_DATA_CHANGED, load)
    window.addEventListener('storage', load)

    return () => {
      window.removeEventListener(ERP_DATA_CHANGED, load)
      window.removeEventListener('storage', load)
    }
  }, [])

  const allCategories = useMemo(
    () => tree.flatMap((parent) => [parent, ...parent.children]),
    [tree],
  )

  const counts = useMemo(
    () => ({
      active: allCategories.filter((item) => item.status === 'active').length,
      income: allCategories.filter(
        (item) => item.status === 'active' && item.type === 'income',
      ).length,
      expense: allCategories.filter(
        (item) => item.status === 'active' && item.type === 'expense',
      ).length,
      deleted: allCategories.filter((item) => item.status === 'deleted').length,
    }),
    [allCategories],
  )

  const tabs = [
    { id: 'active' as const, label: 'Активные', count: counts.active },
    { id: 'income' as const, label: 'Доходы', count: counts.income },
    { id: 'expense' as const, label: 'Расходы', count: counts.expense },
    { id: 'deleted' as const, label: 'Удаленные', count: counts.deleted },
  ]

  const normalizedQuery = query.trim().toLowerCase()
  const filtered = useMemo(
    () =>
      tree.filter((parent) => {
        const parentMatchesStatus =
          tab === 'active'
            ? parent.status === 'active'
            : tab === 'deleted'
              ? parent.status === 'deleted'
              : parent.status === 'active' && parent.type === tab

        const childMatches = parent.children.filter((child) => {
          const statusMatch =
            tab === 'active'
              ? child.status === 'active'
              : tab === 'deleted'
                ? child.status === 'deleted'
                : child.status === 'active' && child.type === tab

          if (!statusMatch) return false
          if (!normalizedQuery) return true
          return child.name.toLowerCase().includes(normalizedQuery)
        })

        const parentNameMatch =
          !normalizedQuery || parent.name.toLowerCase().includes(normalizedQuery)

        return (parentMatchesStatus && parentNameMatch) || childMatches.length > 0
      }),
    [normalizedQuery, tab, tree],
  )

  function toggle(id: string) {
    setExpanded((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  function handleDelete(category: ErpFinanceCategory) {
    if (!window.confirm(`Удалить категорию "${category.name}"?`)) return
    archiveFinanceCategory(category.id)
  }

  function handleRestore(category: ErpFinanceCategory) {
    restoreFinanceCategory(category.id)
  }

  function visibleChildren(parent: FinanceCategoryTreeItem) {
    return parent.children.filter((child) => {
      const statusMatch =
        tab === 'active'
          ? child.status === 'active'
          : tab === 'deleted'
            ? child.status === 'deleted'
            : child.status === 'active' && child.type === tab

      if (!statusMatch) return false
      if (!normalizedQuery) return true
      return child.name.toLowerCase().includes(normalizedQuery)
    })
  }

  return (
    <>
      <h1 className="mb-6 text-3xl font-black tracking-tight text-foreground sm:text-[34px]">
        Финансовые категории
      </h1>

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              'rounded-2xl px-5 py-2.5 text-[15px] font-semibold transition-all',
              tab === item.id
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30'
                : 'bg-card text-muted-foreground hover:text-foreground',
            )}
          >
            {item.label} ({item.count})
          </button>
        ))}
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Наименование категории"
            className="h-14 w-full rounded-2xl bg-card pl-12 pr-4 text-[15px] text-foreground outline-none ring-1 ring-transparent transition-shadow placeholder:text-muted-foreground focus:ring-primary/40"
          />
        </div>
        <button
          onClick={() => setModal({ mode: 'create', parentId: null, type: 'expense' })}
          className="flex h-14 shrink-0 items-center justify-center gap-2 rounded-2xl bg-primary px-7 text-[15px] font-bold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
        >
          <Plus className="size-5" />
          Новая категория
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl bg-card ring-1 ring-border">
        <div className="grid grid-cols-[1fr_120px_120px_140px] items-center gap-4 border-b border-border px-6 py-4 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
          <span>Наименование</span>
          <span>ID</span>
          <span>Тип</span>
          <span className="text-right">Действие</span>
        </div>

        {filtered.length === 0 ? (
          <p className="py-12 text-center text-[15px] text-muted-foreground">Категории не найдены</p>
        ) : (
          filtered.map((parent) => {
            const children = visibleChildren(parent)
            const parentVisible =
              (tab === 'active' && parent.status === 'active') ||
              (tab === 'deleted' && parent.status === 'deleted') ||
              ((tab === 'income' || tab === 'expense') &&
                parent.status === 'active' &&
                parent.type === tab)

            return (
              <div key={parent.id}>
                {parentVisible ? (
                  <div className="grid grid-cols-[1fr_120px_120px_140px] items-center gap-4 border-b border-border px-6 py-4 transition-colors hover:bg-secondary/50">
                    <button
                      onClick={() => parent.children.length > 0 && toggle(parent.id)}
                      className={cn(
                        'flex items-center gap-2 text-left text-[15px] font-medium text-foreground',
                        parent.children.length === 0 && 'cursor-default',
                      )}
                    >
                      {parent.children.length > 0 ? (
                        <ChevronRight
                          className={cn(
                            'size-4 shrink-0 text-muted-foreground transition-transform',
                            expanded.includes(parent.id) && 'rotate-90',
                          )}
                        />
                      ) : null}
                      <span className={cn(parent.children.length === 0 && 'pl-6')}>{parent.name}</span>
                    </button>
                    <span className="text-[14px] tabular-nums text-muted-foreground">{parent.id.slice(-6)}</span>
                    <span>
                      <span
                        className={cn(
                          'inline-flex rounded-full px-4 py-1.5 text-[13px] font-bold',
                          typeBadge[parent.type],
                        )}
                      >
                        {parent.type === 'income' ? 'Доход' : 'Расход'}
                      </span>
                    </span>
                    <div className="flex items-center justify-end gap-2">
                      {parent.status === 'active' ? (
                        <>
                          <button
                            aria-label="Редактировать"
                            onClick={() => setModal({ mode: 'edit', category: parent })}
                            className="flex size-9 items-center justify-center rounded-xl bg-secondary text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            aria-label="Добавить подкатегорию"
                            onClick={() =>
                              setModal({
                                mode: 'create',
                                parentId: parent.id,
                                type: parent.type,
                              })
                            }
                            className="flex size-9 items-center justify-center rounded-xl bg-chart-2/15 text-chart-2 transition-colors hover:bg-chart-2 hover:text-primary-foreground"
                          >
                            <Link2 className="size-4" />
                          </button>
                          <button
                            aria-label="Удалить"
                            onClick={() => handleDelete(parent)}
                            className="flex size-9 items-center justify-center rounded-xl bg-destructive/10 text-destructive transition-colors hover:bg-destructive hover:text-primary-foreground"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          aria-label="Восстановить"
                          onClick={() => handleRestore(parent)}
                          className="flex size-9 items-center justify-center rounded-xl bg-chart-2/15 text-chart-2 transition-colors hover:bg-chart-2 hover:text-primary-foreground"
                        >
                          <Check className="size-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ) : null}

                {parent.children.length > 0 && expanded.includes(parent.id) && children.map((child) => (
                  <div
                    key={child.id}
                    className="grid grid-cols-[1fr_120px_120px_140px] items-center gap-4 border-b border-border bg-secondary/30 px-6 py-3.5"
                  >
                    <span className="pl-12 text-[14px] text-foreground">{child.name}</span>
                    <span className="text-[14px] tabular-nums text-muted-foreground">{child.id.slice(-6)}</span>
                    <span>
                      <span
                        className={cn(
                          'inline-flex rounded-full px-4 py-1.5 text-[13px] font-bold',
                          typeBadge[child.type],
                        )}
                      >
                        {child.type === 'income' ? 'Доход' : 'Расход'}
                      </span>
                    </span>
                    <div className="flex items-center justify-end gap-2">
                      {child.status === 'active' ? (
                        <>
                          <button
                            aria-label="Редактировать"
                            onClick={() => setModal({ mode: 'edit', category: child })}
                            className="flex size-9 items-center justify-center rounded-xl bg-card text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            aria-label="Редактировать родителя"
                            onClick={() => setModal({ mode: 'edit', category: child })}
                            className="flex size-9 items-center justify-center rounded-xl bg-chart-2/15 text-chart-2 transition-colors hover:bg-chart-2 hover:text-primary-foreground"
                          >
                            <Link2 className="size-4" />
                          </button>
                          <button
                            aria-label="Удалить"
                            onClick={() => handleDelete(child)}
                            className="flex size-9 items-center justify-center rounded-xl bg-destructive/10 text-destructive transition-colors hover:bg-destructive hover:text-primary-foreground"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          aria-label="Восстановить"
                          onClick={() => handleRestore(child)}
                          className="flex size-9 items-center justify-center rounded-xl bg-chart-2/15 text-chart-2 transition-colors hover:bg-chart-2 hover:text-primary-foreground"
                        >
                          <Check className="size-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          })
        )}
      </div>

      {modal ? (
        <CategoryModal
          state={modal}
          onClose={() => setModal(null)}
          onSaved={() => setExpanded((prev) => (modal.mode === 'create' && modal.parentId ? [...new Set([...prev, modal.parentId])] : prev))}
        />
      ) : null}
    </>
  )
}

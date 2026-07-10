'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Plus,
  Search,
  Filter,
  ChevronDown,
  Pencil,
  Archive,
  Tag,
  Users,
  X,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ERP_DATA_CHANGED, readClients, type ErpClient } from '@/lib/erp/erp-store'
import {
  ensureClientGroups,
  readClientGroups,
  renameClientGroup,
  writeClientGroups,
  type ClientGroupRecord,
  type GroupStatus,
} from '@/lib/erp/client-segments'

type GroupModalState =
  | { mode: 'create' }
  | { mode: 'edit'; group: ClientGroupRecord }

function GroupModal({
  state,
  onClose,
  onSaved,
}: {
  state: GroupModalState
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(state.mode === 'edit' ? state.group.name : '')
  const [description, setDescription] = useState(
    state.mode === 'edit' ? state.group.description : '',
  )
  const [status, setStatus] = useState<GroupStatus>(
    state.mode === 'edit' ? state.group.status : 'active',
  )
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  function submit() {
    try {
      const trimmed = name.trim()
      if (!trimmed) throw new Error('Введите название группы.')

      const now = new Date().toISOString()
      const groups = readClientGroups()

      if (state.mode === 'create') {
        const next: ClientGroupRecord = {
          id: `group-${Date.now()}`,
          name: trimmed,
          description: description.trim(),
          status,
          createdAt: now,
          updatedAt: now,
        }
        writeClientGroups([next, ...groups])
      } else {
        const previousName = state.group.name
        const next: ClientGroupRecord = {
          ...state.group,
          name: trimmed,
          description: description.trim(),
          status,
          updatedAt: now,
        }
        writeClientGroups(groups.map((group) => (group.id === state.group.id ? next : group)))
        if (previousName !== trimmed) {
          renameClientGroup(previousName, trimmed)
        }
      }

      onSaved()
      setDone(true)
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Не удалось сохранить группу.')
    }
  }

  const title = state.mode === 'create' ? 'Новая группа' : 'Редактирование группы'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-3xl bg-card shadow-2xl ring-1 ring-border">
        {done ? (
          <div className="p-8 text-center">
            <span className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-chart-2/10">
              <Check className="size-8 text-chart-2" />
            </span>
            <h3 className="text-xl font-black text-foreground">Группа сохранена</h3>
            <p className="mt-2 text-[15px] text-muted-foreground">
              {name || 'Без названия'} добавлена в справочник.
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
                  Название
                </label>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Например, VIP"
                  className="h-12 w-full rounded-2xl bg-secondary px-4 text-[15px] text-foreground outline-none ring-1 ring-transparent transition-shadow placeholder:text-muted-foreground focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="mb-2 block text-[13px] font-medium text-muted-foreground">
                  Описание
                </label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Для постоянных клиентов с высоким чеком"
                  className="min-h-[92px] w-full rounded-2xl bg-secondary px-4 py-3 text-[15px] text-foreground outline-none ring-1 ring-transparent transition-shadow placeholder:text-muted-foreground focus:ring-primary/40"
                />
              </div>
              <div>
                <span className="mb-2 block text-[13px] font-medium text-muted-foreground">
                  Статус
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {(['active', 'inactive'] as const).map((item) => (
                    <button
                      key={item}
                      onClick={() => setStatus(item)}
                      className={cn(
                        'rounded-2xl py-3.5 text-[15px] font-semibold transition-all ring-1',
                        status === item
                          ? 'bg-primary text-primary-foreground ring-primary'
                          : 'bg-secondary text-muted-foreground ring-transparent hover:text-foreground',
                      )}
                    >
                      {item === 'active' ? 'Активна' : 'Архив'}
                    </button>
                  ))}
                </div>
              </div>
              {error ? (
                <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-[13px] font-medium text-destructive">
                  {error}
                </p>
              ) : null}
            </div>
            <div className="border-t border-border px-7 py-5">
              <button
                onClick={submit}
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

export function ClientGroups() {
  const [query, setQuery] = useState('')
  const [groups, setGroups] = useState<ClientGroupRecord[]>([])
  const [clients, setClients] = useState<ErpClient[]>([])
  const [modal, setModal] = useState<GroupModalState | null>(null)

  useEffect(() => {
    function load() {
      setClients(readClients())
      setGroups(ensureClientGroups())
    }

    load()
    window.addEventListener(ERP_DATA_CHANGED, load)
    window.addEventListener('storage', load)

    return () => {
      window.removeEventListener(ERP_DATA_CHANGED, load)
      window.removeEventListener('storage', load)
    }
  }, [])

  const stats = useMemo(() => {
    const groupCount = groups.length
    const activeCount = groups.filter((group) => group.status === 'active').length
    const uniqueTags = new Set(clients.flatMap((client) => client.tags))
    const totalClients = clients.length
    return { groupCount, activeCount, uniqueTags: uniqueTags.size, totalClients }
  }, [clients, groups])

  const tagCounts = useMemo(() => {
    const entries = new Map<string, number>()
    for (const client of clients) {
      for (const tag of client.tags) {
        entries.set(tag, (entries.get(tag) ?? 0) + 1)
      }
    }
    return Array.from(entries.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((left, right) => right.count - left.count)
  }, [clients])

  const groupRows = useMemo(() => {
    return groups
      .map((group) => ({
        ...group,
        clientCount: clients.filter((client) => client.group === group.name).length,
      }))
      .filter((group) => {
        if (query.trim()) {
          const value = query.toLowerCase()
          return (
            group.name.toLowerCase().includes(value) ||
            group.description.toLowerCase().includes(value)
          )
        }
        return true
      })
      .sort((left, right) => {
        if (left.status !== right.status) return left.status === 'active' ? -1 : 1
        return right.clientCount - left.clientCount
      })
  }, [clients, groups, query])

  function toggleArchive(group: ClientGroupRecord) {
    const next: ClientGroupRecord[] = groups.map((item) =>
      item.id === group.id
        ? {
            ...item,
            status: item.status === 'active' ? 'inactive' : 'active',
            updatedAt: new Date().toISOString(),
          }
        : item,
    )
    writeClientGroups(next)
    setGroups(next)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Группы и теги
          </h1>
          <p className="mt-1 text-[15px] text-muted-foreground">
            Сегментация клиентов и рабочие метки для продаж и рассылок
          </p>
        </div>
        <button
          onClick={() => setModal({ mode: 'create' })}
          className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary px-8 text-[15px] font-semibold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
        >
          <Plus className="size-5" />
          Новая группа
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Stat label="Групп" value={stats.groupCount.toString()} />
        <Stat label="Активных" value={stats.activeCount.toString()} />
        <Stat label="Клиентов" value={stats.totalClients.toString()} />
        <Stat label="Тегов" value={stats.uniqueTags.toString()} />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск по группе или описанию"
            className="h-14 w-full rounded-2xl bg-card pl-14 pr-4 text-[15px] text-foreground shadow-sm outline-none ring-1 ring-border transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <button
          onClick={() => setQuery('')}
          className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-card px-6 text-[15px] font-semibold text-foreground shadow-sm ring-1 ring-border transition-colors hover:bg-secondary"
        >
          <ChevronDown className="size-4 text-muted-foreground" />
          <Filter className="size-4 text-primary" />
          Фильтры
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <div className="space-y-3">
          {groupRows.map((group) => (
            <div key={group.id} className="rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-[17px] font-bold text-foreground">{group.name}</h2>
                    <span
                      className={cn(
                        'rounded-full px-3 py-1 text-[12px] font-semibold',
                        group.status === 'active'
                          ? 'bg-chart-2/15 text-chart-2'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {group.status === 'active' ? 'Активна' : 'Архив'}
                    </span>
                  </div>
                  <p className="mt-1 text-[14px] text-muted-foreground">
                    {group.description || 'Без описания'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-primary">{group.clientCount}</p>
                  <p className="text-[13px] text-muted-foreground">клиентов</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
                <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                  <Tag className="size-4 text-primary" />
                  {group.clientCount > 0 ? 'Связана с клиентами' : 'Пока без клиентов'}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setModal({ mode: 'edit', group })}
                    className="flex items-center gap-2 rounded-2xl bg-secondary px-4 py-2.5 text-[14px] font-semibold text-foreground transition-colors hover:bg-accent"
                  >
                    <Pencil className="size-4" />
                    Изменить
                  </button>
                  <button
                    onClick={() => toggleArchive(group)}
                    className="flex items-center gap-2 rounded-2xl bg-secondary px-4 py-2.5 text-[14px] font-semibold text-foreground transition-colors hover:bg-accent"
                  >
                    <Archive className="size-4" />
                    {group.status === 'active' ? 'В архив' : 'Вернуть'}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {groupRows.length === 0 ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center rounded-3xl bg-card px-6 py-12 text-center shadow-sm ring-1 ring-border">
              <Users className="size-12 text-muted-foreground/30" />
              <p className="mt-3 text-[15px] text-muted-foreground">Группы не найдены</p>
            </div>
          ) : null}
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[15px] text-muted-foreground">Популярные теги</p>
                <p className="text-xl font-black text-primary">{tagCounts.length} тегов</p>
              </div>
              <Tag className="size-5 text-primary" />
            </div>
            <div className="mt-5 space-y-2">
              {tagCounts.slice(0, 8).map((tag) => (
                <div key={tag.name} className="flex items-center justify-between rounded-2xl bg-secondary px-4 py-3">
                  <span className="text-[14px] font-semibold text-foreground">{tag.name}</span>
                  <span className="text-[13px] text-muted-foreground">{tag.count} клиентов</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border">
            <p className="text-[15px] text-muted-foreground">Связка с продажами</p>
            <p className="mt-2 text-[15px] text-foreground">
              Группа клиента используется в карточке клиента, продажах и отчетах. Если
              переименовать группу, название обновится у всех клиентов автоматически.
            </p>
          </div>
        </aside>
      </div>

      {modal ? (
        <GroupModal
          state={modal}
          onClose={() => setModal(null)}
          onSaved={() => {
            setClients(readClients())
            setGroups(readClientGroups())
          }}
        />
      ) : null}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border">
      <p className="text-[13px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-black text-foreground">{value}</p>
    </div>
  )
}

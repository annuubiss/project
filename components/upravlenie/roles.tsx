'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, Edit3, Plus, Search, Settings2, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  ERP_DATA_CHANGED,
  readEmployees,
  readRoles,
  writeRoles,
  type ErpPermissionKey,
  type ErpRole,
} from '@/lib/erp/erp-store'

type TabId = 'active' | 'deleted'
type RoleFormState = {
  id?: string
  name: string
  description: string
  permissions: ErpPermissionKey[]
}

const permissionOptions: Array<{ key: ErpPermissionKey; label: string }> = [
  { key: 'dashboard.view', label: 'Dashboard' },
  { key: 'products.manage', label: 'Товары' },
  { key: 'sales.manage', label: 'Продажи' },
  { key: 'clients.manage', label: 'Клиенты' },
  { key: 'finance.manage', label: 'Финансы' },
  { key: 'reports.view', label: 'Отчеты' },
  { key: 'settings.manage', label: 'Настройки' },
  { key: 'users.manage', label: 'Пользователи' },
]

const emptyForm: RoleFormState = {
  name: '',
  description: '',
  permissions: ['dashboard.view'],
}

export function Roles() {
  const [roles, setRoles] = useState<ErpRole[]>([])
  const [employeeCounts, setEmployeeCounts] = useState<Map<string, number>>(new Map())
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<TabId>('active')
  const [selected, setSelected] = useState<string[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<RoleFormState>(emptyForm)

  const load = () => {
    const nextRoles = readRoles()
    const counts = new Map<string, number>()
    for (const employee of readEmployees()) {
      if (employee.status !== 'deleted') {
        counts.set(employee.role, (counts.get(employee.role) ?? 0) + 1)
      }
    }
    setRoles(nextRoles)
    setEmployeeCounts(counts)
  }

  useEffect(() => {
    load()
    window.addEventListener(ERP_DATA_CHANGED, load)
    window.addEventListener('storage', load)

    return () => {
      window.removeEventListener(ERP_DATA_CHANGED, load)
      window.removeEventListener('storage', load)
    }
  }, [])

  const tabs = useMemo(
    () => [
      { id: 'active' as const, label: 'Активные роли', count: roles.filter((role) => role.status === 'active').length },
      { id: 'deleted' as const, label: 'Удаленные роли', count: roles.filter((role) => role.status === 'deleted').length },
    ],
    [roles],
  )

  const filtered = roles.filter((role) => {
    const value = query.trim().toLowerCase()
    const matchesTab = role.status === tab
    if (!value) return matchesTab
    return (
      matchesTab &&
      [role.id, role.name, role.description, role.permissions.join(' ')]
        .join(' ')
        .toLowerCase()
        .includes(value)
    )
  })

  const saveRoles = (next: ErpRole[]) => {
    writeRoles(next)
    setRoles(next)
    window.dispatchEvent(new Event(ERP_DATA_CHANGED))
  }

  const openCreate = () => {
    setForm(emptyForm)
    setFormOpen(true)
  }

  const openEdit = (role: ErpRole) => {
    setForm({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions,
    })
    setFormOpen(true)
  }

  const submitForm = () => {
    const name = form.name.trim()
    const description = form.description.trim()
    if (!name) return

    const now = new Date().toISOString()
    if (form.id) {
      saveRoles(
        roles.map((role) =>
          role.id === form.id
            ? {
                ...role,
                name,
                description,
                permissions: form.permissions,
                updatedAt: now,
              }
            : role,
        ),
      )
    } else {
      saveRoles([
        {
          id: `role-${Date.now()}`,
          name,
          description,
          permissions: form.permissions,
          status: 'active',
          createdAt: now,
          updatedAt: now,
        },
        ...roles,
      ])
      setTab('active')
    }

    setFormOpen(false)
    setForm(emptyForm)
  }

  const setStatus = (role: ErpRole, status: ErpRole['status']) => {
    const now = new Date().toISOString()
    saveRoles(
      roles.map((item) =>
        item.id === role.id ? { ...item, status, updatedAt: now } : item,
      ),
    )
  }

  const toggleSelected = (id: string) => {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
        Роли
      </h1>

      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              'rounded-2xl px-5 py-2.5 text-[15px] font-semibold transition-colors',
              tab === item.id
                ? 'bg-foreground text-background'
                : 'bg-card text-muted-foreground ring-1 ring-border hover:bg-secondary',
            )}
          >
            {item.label} ({item.count})
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ID, роль, право доступа"
            className="h-14 w-full rounded-2xl bg-card pl-14 pr-4 text-[15px] text-foreground shadow-sm outline-none ring-1 ring-border transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <button
          onClick={openCreate}
          className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary px-8 text-[15px] font-semibold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
        >
          <Plus className="size-5" />
          Новая роль
        </button>
      </div>

      <div className="overflow-x-auto rounded-3xl bg-card p-2 shadow-sm ring-1 ring-border">
        <div className="min-w-[980px]">
          <div className="flex items-center gap-4 border-b border-border px-4 py-4 text-[14px] font-semibold text-muted-foreground">
            <div className="w-8 shrink-0" />
            <div className="w-[120px] shrink-0">ID</div>
            <div className="flex-1">Роль</div>
            <div className="w-[110px] shrink-0">Сотрудников</div>
            <div className="flex-[1.4]">Права доступа</div>
            <div className="flex-1">Описание</div>
            <div className="w-[120px] shrink-0 text-right">Действие</div>
            <button
              aria-label="Настройки колонок"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
            >
              <Settings2 className="size-4" />
            </button>
          </div>

          {filtered.length > 0 ? (
            filtered.map((role) => (
              <div
                key={role.id}
                className="flex items-center gap-4 border-b border-border px-4 py-4 text-[15px] transition-colors last:border-0 hover:bg-secondary/50"
              >
                <div className="w-8 shrink-0">
                  <input
                    type="checkbox"
                    checked={selected.includes(role.id)}
                    onChange={() => toggleSelected(role.id)}
                    aria-label={`Выбрать роль ${role.name}`}
                    className="size-5 cursor-pointer rounded-md border-border accent-primary"
                  />
                </div>
                <div className="w-[120px] shrink-0 font-medium text-muted-foreground">{role.id.slice(-8)}</div>
                <div className="flex-1 font-semibold text-primary">{role.name}</div>
                <div className="w-[110px] shrink-0 text-foreground">{employeeCounts.get(role.name) ?? 0}</div>
                <div className="flex-[1.4] text-muted-foreground">
                  {role.permissions.map(permissionLabel).join(', ')}
                </div>
                <div className="flex-1 text-muted-foreground">{role.description || '-'}</div>
                <div className="flex w-[120px] shrink-0 items-center justify-end gap-2">
                  <button
                    onClick={() => openEdit(role)}
                    aria-label="Редактировать роль"
                    className="flex size-9 items-center justify-center rounded-xl bg-secondary text-foreground transition-colors hover:bg-border"
                  >
                    <Edit3 className="size-4" />
                  </button>
                  {role.status === 'deleted' ? (
                    <button
                      onClick={() => setStatus(role, 'active')}
                      aria-label="Восстановить роль"
                      className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      <Check className="size-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setStatus(role, 'deleted')}
                      aria-label="Удалить роль"
                      className="flex size-9 items-center justify-center rounded-xl bg-destructive text-destructive-foreground transition-colors hover:bg-destructive/90"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
                <div className="size-9 shrink-0" />
              </div>
            ))
          ) : (
            <div className="flex min-h-[220px] items-center justify-center px-6 text-center text-[15px] font-medium text-muted-foreground">
              Ролей по выбранным условиям нет
            </div>
          )}
        </div>
      </div>

      {formOpen ? (
        <RoleFormModal
          form={form}
          onChange={setForm}
          onClose={() => setFormOpen(false)}
          onSubmit={submitForm}
        />
      ) : null}
    </div>
  )
}

function RoleFormModal({
  form,
  onChange,
  onClose,
  onSubmit,
}: {
  form: RoleFormState
  onChange: (form: RoleFormState) => void
  onClose: () => void
  onSubmit: () => void
}) {
  const togglePermission = (key: ErpPermissionKey) => {
    onChange({
      ...form,
      permissions: form.permissions.includes(key)
        ? form.permissions.filter((permission) => permission !== key)
        : [...form.permissions, key],
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 px-4">
      <div className="w-full max-w-2xl rounded-3xl bg-card p-6 shadow-2xl ring-1 ring-border">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-black text-foreground">
            {form.id ? 'Редактировать роль' : 'Новая роль'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="flex size-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="grid gap-4">
          <label className="grid gap-2 text-[14px] font-semibold text-foreground">
            Название
            <input
              value={form.name}
              onChange={(event) => onChange({ ...form, name: event.target.value })}
              className="h-12 rounded-2xl bg-background px-4 text-[15px] outline-none ring-1 ring-border focus:ring-2 focus:ring-primary/40"
            />
          </label>
          <label className="grid gap-2 text-[14px] font-semibold text-foreground">
            Описание
            <input
              value={form.description}
              onChange={(event) => onChange({ ...form, description: event.target.value })}
              className="h-12 rounded-2xl bg-background px-4 text-[15px] outline-none ring-1 ring-border focus:ring-2 focus:ring-primary/40"
            />
          </label>

          <div className="grid gap-3">
            <span className="text-[14px] font-semibold text-foreground">Права доступа</span>
            <div className="grid gap-2 sm:grid-cols-2">
              {permissionOptions.map((item) => (
                <label
                  key={item.key}
                  className="flex items-center gap-3 rounded-2xl bg-background px-4 py-3 text-[14px] font-semibold text-foreground ring-1 ring-border"
                >
                  <input
                    type="checkbox"
                    checked={form.permissions.includes(item.key)}
                    onChange={() => togglePermission(item.key)}
                    className="size-5 cursor-pointer rounded-md border-border accent-primary"
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-2xl bg-secondary px-6 py-3 text-[15px] font-semibold text-foreground transition-colors hover:bg-border"
          >
            Отмена
          </button>
          <button
            onClick={onSubmit}
            className="rounded-2xl bg-primary px-6 py-3 text-[15px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  )
}

function permissionLabel(permission: ErpPermissionKey) {
  return permissionOptions.find((item) => item.key === permission)?.label ?? permission
}

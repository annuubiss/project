'use client'

import { useEffect, useMemo, useState } from 'react'
import { Ban, Check, Edit3, Filter, Plus, Search, Settings2, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  ERP_DATA_CHANGED,
  readEmployees,
  readRoles,
  writeEmployees,
  type ErpEmployee,
} from '@/lib/erp/erp-store'

type TabId = 'active' | 'blocked' | 'deleted'
type EmployeeFormState = {
  id?: string
  name: string
  phone: string
  role: string
}

const emptyForm: EmployeeFormState = {
  name: '',
  phone: '',
  role: 'Продавец',
}

export function Employees() {
  const [employees, setEmployees] = useState<ErpEmployee[]>([])
  const [roles, setRoles] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<TabId>('active')
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<EmployeeFormState>(emptyForm)

  const load = () => {
    setEmployees(readEmployees())
    setRoles(readRoles().filter((role) => role.status === 'active').map((role) => role.name))
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
      { id: 'active' as const, label: 'Текущие сотрудники', count: employees.filter((item) => item.status === 'active').length },
      { id: 'blocked' as const, label: 'Заблокированные сотрудники', count: employees.filter((item) => item.status === 'blocked').length },
      { id: 'deleted' as const, label: 'Удаленные сотрудники', count: employees.filter((item) => item.status === 'deleted').length },
    ],
    [employees],
  )

  const filtered = employees.filter((employee) => {
    const value = query.trim().toLowerCase()
    const matchesTab = employee.status === tab
    if (!value) return matchesTab
    return (
      matchesTab &&
      [employee.id, employee.name, employee.phone, employee.role]
        .join(' ')
        .toLowerCase()
        .includes(value)
    )
  })

  const saveEmployees = (next: ErpEmployee[]) => {
    writeEmployees(next)
    setEmployees(next)
    window.dispatchEvent(new Event(ERP_DATA_CHANGED))
  }

  const openCreate = () => {
    setForm({ ...emptyForm, role: roles[0] ?? emptyForm.role })
    setFormOpen(true)
  }

  const openEdit = (employee: ErpEmployee) => {
    setForm({
      id: employee.id,
      name: employee.name,
      phone: employee.phone,
      role: employee.role,
    })
    setFormOpen(true)
  }

  const submitForm = () => {
    const name = form.name.trim()
    const phone = form.phone.trim()
    const role = form.role.trim()
    if (!name || !phone || !role) return

    const now = new Date().toISOString()
    if (form.id) {
      saveEmployees(
        employees.map((employee) =>
          employee.id === form.id
            ? { ...employee, name, phone, role }
            : employee,
        ),
      )
    } else {
      saveEmployees([
        {
          id: `emp-${Date.now()}`,
          name,
          phone,
          role,
          status: 'active',
          createdAt: now,
        },
        ...employees,
      ])
      setTab('active')
    }

    setFormOpen(false)
    setForm(emptyForm)
  }

  const setStatus = (employee: ErpEmployee, status: ErpEmployee['status']) => {
    saveEmployees(
      employees.map((item) =>
        item.id === employee.id ? { ...item, status } : item,
      ),
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
        Сотрудники
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
            placeholder="ID, имя, телефон, роль"
            className="h-14 w-full rounded-2xl bg-card pl-14 pr-4 text-[15px] text-foreground shadow-sm outline-none ring-1 ring-border transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <button
          onClick={() => setQuery('')}
          className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-card px-6 text-[15px] font-semibold text-foreground shadow-sm ring-1 ring-border transition-colors hover:bg-secondary"
        >
          <Filter className="size-4 text-primary" />
          Фильтры
        </button>
        <button
          onClick={openCreate}
          className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary px-8 text-[15px] font-semibold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
        >
          <Plus className="size-5" />
          Новый сотрудник
        </button>
      </div>

      <div className="overflow-x-auto rounded-3xl bg-card p-2 shadow-sm ring-1 ring-border">
        <div className="min-w-[980px]">
          <div className="flex items-center gap-4 border-b border-border px-4 py-4 text-[14px] font-semibold text-muted-foreground">
            <div className="w-[130px] shrink-0">ID</div>
            <div className="flex-[1.5]">Сотрудник</div>
            <div className="flex-1">Телефон</div>
            <div className="flex-1">Роль</div>
            <div className="w-[130px] shrink-0">Статус</div>
            <div className="w-[150px] shrink-0 text-right">Действие</div>
            <button
              aria-label="Настройки колонок"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
            >
              <Settings2 className="size-4" />
            </button>
          </div>

          {filtered.length > 0 ? (
            filtered.map((employee) => (
              <div
                key={employee.id}
                className="flex items-center gap-4 border-b border-border px-4 py-4 text-[15px] transition-colors last:border-0 hover:bg-secondary/50"
              >
                <div className="w-[130px] shrink-0 font-medium text-muted-foreground">{employee.id.slice(-8)}</div>
                <div className="flex-[1.5] font-semibold text-primary">{employee.name}</div>
                <div className="flex-1 text-foreground">{employee.phone}</div>
                <div className="flex-1">
                  <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-[13px] font-semibold text-primary">
                    {employee.role}
                  </span>
                </div>
                <div className="w-[130px] shrink-0">
                  <span className={cn('inline-flex rounded-full px-3 py-1.5 text-[13px] font-semibold', statusClass(employee.status))}>
                    {statusLabel(employee.status)}
                  </span>
                </div>
                <div className="flex w-[150px] shrink-0 items-center justify-end gap-2">
                  <button
                    onClick={() => openEdit(employee)}
                    aria-label="Редактировать"
                    className="flex size-9 items-center justify-center rounded-xl bg-secondary text-foreground transition-colors hover:bg-border"
                  >
                    <Edit3 className="size-4" />
                  </button>
                  {employee.status === 'blocked' || employee.status === 'deleted' ? (
                    <button
                      onClick={() => setStatus(employee, 'active')}
                      aria-label="Восстановить"
                      className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      <Check className="size-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setStatus(employee, 'blocked')}
                      aria-label="Заблокировать"
                      className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      <Ban className="size-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setStatus(employee, 'deleted')}
                    aria-label="Удалить"
                    className="flex size-9 items-center justify-center rounded-xl bg-destructive text-destructive-foreground transition-colors hover:bg-destructive/90"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="size-9 shrink-0" />
              </div>
            ))
          ) : (
            <div className="flex min-h-[220px] items-center justify-center px-6 text-center text-[15px] font-medium text-muted-foreground">
              Сотрудников по выбранным условиям нет
            </div>
          )}
        </div>
      </div>

      {formOpen ? (
        <EmployeeFormModal
          form={form}
          roles={roles}
          onChange={setForm}
          onClose={() => setFormOpen(false)}
          onSubmit={submitForm}
        />
      ) : null}
    </div>
  )
}

function EmployeeFormModal({
  form,
  roles,
  onChange,
  onClose,
  onSubmit,
}: {
  form: EmployeeFormState
  roles: string[]
  onChange: (form: EmployeeFormState) => void
  onClose: () => void
  onSubmit: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 px-4">
      <div className="w-full max-w-xl rounded-3xl bg-card p-6 shadow-2xl ring-1 ring-border">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-black text-foreground">
            {form.id ? 'Редактировать сотрудника' : 'Новый сотрудник'}
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
            Имя
            <input
              value={form.name}
              onChange={(event) => onChange({ ...form, name: event.target.value })}
              className="h-12 rounded-2xl bg-background px-4 text-[15px] outline-none ring-1 ring-border focus:ring-2 focus:ring-primary/40"
            />
          </label>
          <label className="grid gap-2 text-[14px] font-semibold text-foreground">
            Телефон
            <input
              value={form.phone}
              onChange={(event) => onChange({ ...form, phone: event.target.value })}
              className="h-12 rounded-2xl bg-background px-4 text-[15px] outline-none ring-1 ring-border focus:ring-2 focus:ring-primary/40"
            />
          </label>
          <label className="grid gap-2 text-[14px] font-semibold text-foreground">
            Роль
            <select
              value={form.role}
              onChange={(event) => onChange({ ...form, role: event.target.value })}
              className="h-12 rounded-2xl bg-background px-4 text-[15px] outline-none ring-1 ring-border focus:ring-2 focus:ring-primary/40"
            >
              {Array.from(new Set([...roles, form.role, 'Продавец'])).map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>
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

function statusLabel(status: ErpEmployee['status']) {
  if (status === 'active') return 'Активный'
  if (status === 'blocked') return 'Заблокирован'
  return 'Удален'
}

function statusClass(status: ErpEmployee['status']) {
  if (status === 'active') return 'bg-chart-2/15 text-chart-2'
  if (status === 'blocked') return 'bg-chart-3/15 text-chart-3'
  return 'bg-destructive/10 text-destructive'
}

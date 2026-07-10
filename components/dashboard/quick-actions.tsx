'use client'

import { useState } from 'react'
import {
  Plus,
  ShoppingCart,
  Package,
  UserPlus,
  FileText,
  ArrowLeftRight,
  X,
} from 'lucide-react'

const actions = [
  { label: 'Создать продажу', icon: ShoppingCart },
  { label: 'Добавить товар', icon: Package },
  { label: 'Новый клиент', icon: UserPlus },
  { label: 'Создать счет', icon: FileText },
  { label: 'Переместить товар', icon: ArrowLeftRight },
]

export function QuickActions() {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed right-6 bottom-6 z-40 flex flex-col items-end gap-3">
      {open && (
        <div className="flex flex-col items-end gap-2">
          {actions.map((a, i) => {
            const Icon = a.icon
            return (
              <button
                key={a.label}
                className="animate-fade-up flex items-center gap-3 rounded-2xl border border-border bg-card py-2.5 pr-3 pl-4 text-sm font-medium text-foreground shadow-lg shadow-slate-900/5 transition-colors hover:bg-secondary"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {a.label}
                <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </span>
              </button>
            )
          })}
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Быстрые действия"
        aria-expanded={open}
        className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/30 transition-all duration-300 hover:scale-105 active:scale-95"
      >
        {open ? <X className="size-6" /> : <Plus className="size-6" />}
      </button>
    </div>
  )
}

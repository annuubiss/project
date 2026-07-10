'use client'

import { useState } from 'react'
import { ChevronLeft, Clock, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const presets = [
  { id: 'tomorrow', label: 'До завтра' },
  { id: '3days', label: 'На 3 дня' },
  { id: 'week', label: 'На неделю' },
] as const

export function DeferModal({
  open,
  onClose,
  onDefer,
}: {
  open: boolean
  onClose: () => void
  onDefer: () => void
}) {
  const [preset, setPreset] = useState<string>('tomorrow')
  const [note, setNote] = useState('')
  const [printReceipt, setPrintReceipt] = useState(false)

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mt-16 w-full max-w-lg rounded-3xl bg-card p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative mb-6 flex items-center justify-center">
          <button
            aria-label="Назад"
            onClick={onClose}
            className="absolute left-0 flex size-10 items-center justify-center rounded-full bg-secondary text-foreground transition-colors hover:bg-accent"
          >
            <ChevronLeft className="size-5" />
          </button>
          <h2 className="text-2xl font-bold text-foreground">
            Отложить продажу
          </h2>
        </div>

        <div className="mb-6 flex items-center gap-3 rounded-2xl bg-secondary/60 px-5 py-4 text-[15px] text-muted-foreground">
          <Clock className="size-5 shrink-0 text-primary" />
          Выберите срок, на который нужно отложить эту продажу
        </div>

        <div className="mb-6 grid grid-cols-3 gap-3">
          {presets.map((p) => (
            <button
              key={p.id}
              onClick={() => setPreset(p.id)}
              className={cn(
                'rounded-2xl py-3.5 text-[15px] font-semibold transition-colors',
                preset === p.id
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30'
                  : 'bg-secondary text-foreground hover:bg-accent hover:text-primary',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="mb-6 space-y-2">
          <label className="text-[15px] font-semibold text-foreground">
            Заметка
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Введите заметку к отложенной продаже"
            rows={3}
            className="w-full resize-none rounded-2xl bg-secondary px-4 py-3 text-[15px] text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <button
          onClick={() => setPrintReceipt((v) => !v)}
          className="mb-6 flex w-full items-center gap-3 text-left"
        >
          <span
            className={cn(
              'flex size-6 shrink-0 items-center justify-center rounded-lg ring-1 transition-colors',
              printReceipt
                ? 'bg-primary text-primary-foreground ring-primary'
                : 'bg-secondary ring-border',
            )}
          >
            {printReceipt && <Check className="size-4" />}
          </span>
          <span className="text-[15px] font-medium text-foreground">
            Напечатать чек об отложке
          </span>
        </button>

        <button
          onClick={onDefer}
          className="flex w-full items-center justify-center rounded-2xl bg-primary px-6 py-4 text-[16px] font-bold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
        >
          Отложить
        </button>
      </div>
    </div>
  )
}

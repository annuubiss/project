'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getAvailableClientGroups,
  getAvailableClientTags,
} from '@/lib/erp/client-segments'

export function ClientModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean
  onClose: () => void
  onCreate: (client: {
    name: string
    phone: string
    card?: string
    group: string
    tags: string[]
    birthday: string
    gender: 'male' | 'female'
  }) => void
}) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [group, setGroup] = useState<string | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [day, setDay] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')
  const [phone, setPhone] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [showCardInput, setShowCardInput] = useState(false)

  const clientGroups = useMemo(() => getAvailableClientGroups(), [])
  const clientTags = useMemo(() => getAvailableClientTags(), [])

  if (!open) return null

  const toggleTag = (tag: string) =>
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((value) => value !== tag) : [...prev, tag],
    )

  const fieldCls =
    'h-13 w-full rounded-2xl bg-secondary px-4 py-4 text-[15px] text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40'

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="my-10 w-full max-w-3xl rounded-3xl bg-card p-8 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              aria-label="Назад"
              onClick={onClose}
              className="flex size-10 items-center justify-center rounded-full bg-secondary text-foreground transition-colors hover:bg-accent"
            >
              <ChevronLeft className="size-5" />
            </button>
            <h2 className="text-2xl font-bold text-foreground">Новый клиент</h2>
          </div>
          <button
            onClick={() =>
              onCreate({
                name: [firstName, lastName].filter(Boolean).join(' ') || 'Клиент',
                phone: phone.trim() ? `+998 ${phone.trim()}` : '',
                card: cardNumber.trim(),
                group: group ?? '-',
                tags,
                birthday: day && month && year ? `${day}.${month}.${year}` : '-',
                gender,
              })
            }
            disabled={!firstName.trim()}
            className="rounded-2xl bg-primary px-8 py-3 text-[15px] font-semibold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            Создать
          </button>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-[15px] font-medium text-foreground">
              Имя <span className="text-primary">*</span>
            </label>
            <input
              autoFocus
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              placeholder="Введите имя"
              className={fieldCls}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[15px] font-medium text-foreground">Фамилия</label>
            <input
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              placeholder="Введите фамилию"
              className={fieldCls}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[15px] font-medium text-foreground">Отчество</label>
            <input placeholder="Введите отчество" className={fieldCls} />
          </div>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-[15px] font-medium text-foreground">День рождения</label>
            <div className="grid grid-cols-3 gap-3">
              <input
                value={day}
                onChange={(event) => setDay(event.target.value.replace(/[^\d]/g, '').slice(0, 2))}
                placeholder="ДД"
                className={cn(fieldCls, 'text-center')}
              />
              <input
                value={month}
                onChange={(event) =>
                  setMonth(event.target.value.replace(/[^\d]/g, '').slice(0, 2))
                }
                placeholder="ММ"
                className={cn(fieldCls, 'text-center')}
              />
              <input
                value={year}
                onChange={(event) =>
                  setYear(event.target.value.replace(/[^\d]/g, '').slice(0, 4))
                }
                placeholder="ГГГГ"
                className={cn(fieldCls, 'text-center')}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[15px] font-medium text-foreground">Пол</label>
            <div className="flex h-13 items-center gap-2 rounded-2xl bg-secondary p-1">
              {([
                ['male', 'Мужской'],
                ['female', 'Женский'],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setGender(value)}
                  className={cn(
                    'h-full flex-1 rounded-xl text-[15px] font-semibold transition-colors',
                    gender === value
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-[15px] font-medium text-foreground">Телефон</label>
            <div className="flex items-center gap-2">
              <span className="flex h-13 items-center rounded-2xl bg-secondary px-3 text-[15px] text-muted-foreground">
                +998
              </span>
              <input
                value={phone}
                onChange={(event) =>
                  setPhone(event.target.value.replace(/[^\d\s]/g, '').slice(0, 12))
                }
                placeholder="Введите телефон"
                className={cn(fieldCls, 'flex-1')}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[15px] font-medium text-foreground">Карта</label>
            {showCardInput ? (
              <input
                value={cardNumber}
                onChange={(event) =>
                  setCardNumber(event.target.value.replace(/[^\d\s-]/g, '').slice(0, 24))
                }
                placeholder="Номер карты"
                className={fieldCls}
              />
            ) : (
              <button
                type="button"
                onClick={() => setShowCardInput(true)}
                className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border text-[15px] font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <Plus className="size-5" />
                Добавить карту
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <label className="text-[15px] font-medium text-foreground">Группы</label>
          <div className="flex flex-wrap gap-2.5">
            {clientGroups.map((item) => (
              <button
                key={item}
                onClick={() => setGroup((prev) => (prev === item ? null : item))}
                className={cn(
                  'rounded-2xl px-5 py-2.5 text-[15px] font-semibold transition-colors',
                  group === item
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-foreground hover:bg-accent hover:text-primary',
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <label className="text-[15px] font-medium text-foreground">Теги</label>
          <div className="flex flex-wrap gap-2.5">
            {clientTags.map((item) => (
              <button
                key={item}
                onClick={() => toggleTag(item)}
                className={cn(
                  'rounded-2xl px-5 py-2.5 text-[15px] font-semibold transition-colors',
                  tags.includes(item)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-foreground hover:bg-accent hover:text-primary',
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

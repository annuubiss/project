'use client'

import { useEffect, useState } from 'react'
import { Gift, Percent, Star, Save, Users, BadgePercent } from 'lucide-react'
import { ERP_DATA_CHANGED, getClientSummaryRows } from '@/lib/erp/erp-store'
import { getAvailableClientGroups } from '@/lib/erp/client-segments'

type LoyaltyLevel = {
  name: string
  threshold: number
  cashbackPercent: number
}

type LoyaltySettings = {
  enabled: boolean
  pointsPer1000: number
  minCheck: number
  welcomeBonus: number
  eligibleGroups: string[]
  levels: LoyaltyLevel[]
}

const STORAGE_KEY = 'erp.loyaltySettings.v1'

const defaultSettings: LoyaltySettings = {
  enabled: true,
  pointsPer1000: 5,
  minCheck: 50000,
  welcomeBonus: 10000,
  eligibleGroups: ['Постоянные клиенты', 'VIP', 'Оптовики'],
  levels: [
    { name: 'Бронза', threshold: 0, cashbackPercent: 1 },
    { name: 'Серебро', threshold: 500000, cashbackPercent: 2 },
    { name: 'Золото', threshold: 1000000, cashbackPercent: 4 },
  ],
}

function readSettings(): LoyaltySettings {
  if (typeof window === 'undefined') return defaultSettings
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultSettings
    return { ...defaultSettings, ...JSON.parse(raw) } as LoyaltySettings
  } catch {
    return defaultSettings
  }
}

function saveSettings(settings: LoyaltySettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  window.dispatchEvent(new CustomEvent(ERP_DATA_CHANGED))
}

export function LoyaltySettingsScreen() {
  const [settings, setSettings] = useState<LoyaltySettings>(defaultSettings)
  const [clients, setClients] = useState(() => getClientSummaryRows())
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setSettings(readSettings())
    const loadClients = () => setClients(getClientSummaryRows())
    loadClients()
    window.addEventListener(ERP_DATA_CHANGED, loadClients)
    window.addEventListener('storage', loadClients)
    return () => {
      window.removeEventListener(ERP_DATA_CHANGED, loadClients)
      window.removeEventListener('storage', loadClients)
    }
  }, [])

  const eligibleClients = clients.filter((client) => settings.eligibleGroups.includes(client.group))
  const averageCheck =
    eligibleClients.length > 0
      ? eligibleClients.reduce((sum, client) => sum + client.totalSpent, 0) / eligibleClients.length
      : 0
  const goldLevel = settings.levels[2] ?? defaultSettings.levels[2]
  const sampleBonus = Math.round((averageCheck * goldLevel.cashbackPercent) / 100)

  function updateLevel(index: number, patch: Partial<LoyaltyLevel>) {
    setSettings((prev) => {
      const levels = prev.levels.map((level, levelIndex) =>
        levelIndex === index ? { ...level, ...patch } : level,
      )
      return { ...prev, levels }
    })
  }

  function toggleGroup(group: string) {
    setSettings((prev) => ({
      ...prev,
      eligibleGroups: prev.eligibleGroups.includes(group)
        ? prev.eligibleGroups.filter((item) => item !== group)
        : [...prev.eligibleGroups, group],
    }))
  }

  function submit() {
    saveSettings(settings)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1500)
  }

  const groups = getAvailableClientGroups().sort()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Программа лояльности
          </h1>
          <p className="mt-1 text-[15px] text-muted-foreground">
            Настройте бонусы, кешбэк и правила участия для покупателей
          </p>
        </div>
        <button
          onClick={submit}
          className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary px-8 text-[15px] font-semibold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
        >
          <Save className="size-5" />
          {saved ? 'Сохранено' : 'Сохранить'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Stat label="Активна" value={settings.enabled ? 'Да' : 'Нет'} icon={BadgePercent} />
        <Stat label="Участников" value={eligibleClients.length.toString()} icon={Users} />
        <Stat
          label="Средний чек"
          value={`${Math.round(averageCheck).toLocaleString('ru-RU')} UZS`}
          icon={Gift}
        />
        <Stat
          label="Бонус к выплате"
          value={`${sampleBonus.toLocaleString('ru-RU')} UZS`}
          icon={Star}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4 rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-foreground">Основные правила</h2>
              <p className="mt-1 text-[14px] text-muted-foreground">
                Кешбэк и накопление баллов
              </p>
            </div>
            <button
              onClick={() => setSettings((prev) => ({ ...prev, enabled: !prev.enabled }))}
              className={`relative h-7 w-12 rounded-full transition-colors ${settings.enabled ? 'bg-primary' : 'bg-muted'}`}
            >
              <span
                className={`absolute top-1 size-5 rounded-full bg-card shadow transition-transform ${settings.enabled ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field
              label="Баллов за 1000 UZS"
              value={settings.pointsPer1000}
              onChange={(value) => setSettings((prev) => ({ ...prev, pointsPer1000: value }))}
              icon={Percent}
            />
            <Field
              label="Мин. чек"
              value={settings.minCheck}
              onChange={(value) => setSettings((prev) => ({ ...prev, minCheck: value }))}
              icon={Gift}
            />
            <Field
              label="Приветственный бонус"
              value={settings.welcomeBonus}
              onChange={(value) => setSettings((prev) => ({ ...prev, welcomeBonus: value }))}
              icon={Star}
            />
          </div>

          <div className="rounded-2xl bg-secondary p-4">
            <p className="text-[14px] font-semibold text-foreground">Формула начисления</p>
            <p className="mt-1 text-[14px] text-muted-foreground">
              Клиент получает {settings.pointsPer1000} баллов за каждые 1000 UZS при чеке
              выше {settings.minCheck.toLocaleString('ru-RU')} UZS.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {settings.levels.map((level, index) => (
              <div key={`${level.name}-${index}`} className="rounded-2xl bg-secondary p-4">
                <input
                  value={level.name}
                  onChange={(event) => updateLevel(index, { name: event.target.value })}
                  className="w-full bg-transparent text-[15px] font-bold text-foreground outline-none"
                />
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <label className="space-y-1">
                    <span className="block text-[12px] text-muted-foreground">Порог</span>
                    <input
                      type="number"
                      value={level.threshold}
                      onChange={(event) =>
                        updateLevel(index, { threshold: Number(event.target.value) || 0 })
                      }
                      className="h-11 w-full rounded-xl bg-card px-3 text-[14px] outline-none ring-1 ring-border focus:ring-2 focus:ring-primary/40"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="block text-[12px] text-muted-foreground">Кешбэк %</span>
                    <input
                      type="number"
                      value={level.cashbackPercent}
                      onChange={(event) =>
                        updateLevel(index, { cashbackPercent: Number(event.target.value) || 0 })
                      }
                      className="h-11 w-full rounded-xl bg-card px-3 text-[14px] outline-none ring-1 ring-border focus:ring-2 focus:ring-primary/40"
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border">
            <h2 className="text-xl font-black text-foreground">Доступные группы</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {groups.map((group) => {
                const active = settings.eligibleGroups.includes(group)
                return (
                  <button
                    key={group}
                    onClick={() => toggleGroup(group)}
                    className={`rounded-full px-3 py-2 text-[13px] font-semibold transition-colors ${
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {group}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border">
            <h2 className="text-xl font-black text-foreground">Пример начисления</h2>
            <div className="mt-4 space-y-3">
              <PreviewRow
                label="Средний чек"
                value={`${Math.round(averageCheck).toLocaleString('ru-RU')} UZS`}
              />
              <PreviewRow
                label="Порог входа"
                value={`${settings.minCheck.toLocaleString('ru-RU')} UZS`}
              />
              <PreviewRow
                label="Баллы за 1000 UZS"
                value={settings.pointsPer1000.toString()}
              />
              <PreviewRow
                label={`Бонус на ${goldLevel.name.toLowerCase()}`}
                value={`${sampleBonus.toLocaleString('ru-RU')} UZS`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: typeof BadgePercent
}) {
  return (
    <div className="rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[13px] text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-black text-foreground">{value}</p>
        </div>
        <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  icon: Icon,
}: {
  label: string
  value: number
  onChange: (next: number) => void
  icon: typeof Percent
}) {
  return (
    <label className="space-y-2">
      <span className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
        <Icon className="size-4 text-primary" />
        {label}
      </span>
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value) || 0)}
        className="h-12 w-full rounded-2xl bg-background px-4 text-[15px] outline-none ring-1 ring-border focus:ring-2 focus:ring-primary/40"
      />
    </label>
  )
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-secondary px-4 py-3">
      <span className="text-[14px] text-muted-foreground">{label}</span>
      <span className="text-[14px] font-semibold text-foreground">{value}</span>
    </div>
  )
}

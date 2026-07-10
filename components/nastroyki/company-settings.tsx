'use client'

import { useEffect, useMemo, useState } from 'react'
import { Building2, Download, Hash, MapPin, Phone, Save, User } from 'lucide-react'
import { downloadBackup, getStorageStats } from '@/lib/erp/backup'
import { ERP_DATA_CHANGED } from '@/lib/erp/erp-store'

type CompanySettings = {
  name: string
  shortName: string
  legalName: string
  inn: string
  phone: string
  address: string
  director: string
  city: string
  workHours: string
  taxRegime: string
}

const STORAGE_KEY = 'erp.companySettings.v1'

const defaultSettings: CompanySettings = {
  name: 'Магазин посуды и кухонных товаров',
  shortName: 'Посуда ERP',
  legalName: 'ИП Магазин посуды',
  inn: '123456789',
  phone: '+998 90 123 45 67',
  address: 'Узбекистан, Ташкент',
  director: 'Исломали Н.',
  city: 'Ташкент',
  workHours: '09:00 - 21:00',
  taxRegime: 'Упрощенная система',
}

function readSettings(): CompanySettings {
  if (typeof window === 'undefined') return defaultSettings
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings
  } catch {
    return defaultSettings
  }
}

function saveSettings(settings: CompanySettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  window.dispatchEvent(new Event(ERP_DATA_CHANGED))
}

export function CompanySettingsScreen() {
  const [settings, setSettings] = useState<CompanySettings>(defaultSettings)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setSettings(readSettings())
  }, [])

  const stats = useMemo(() => {
    try {
      return getStorageStats()
    } catch {
      return { usedKb: 0, usedPercent: 0, itemCount: 0 }
    }
  }, [saved])

  function submit() {
    saveSettings(settings)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">Компания</h1>
          <p className="mt-1 text-[15px] text-muted-foreground">
            Основные данные магазина, юридическая информация и контакты
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={downloadBackup}
            className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-card px-6 text-[15px] font-semibold text-foreground shadow-sm ring-1 ring-border transition-colors hover:bg-secondary"
          >
            <Download className="size-5 text-primary" />
            Резервная копия
          </button>
          <button
            onClick={submit}
            className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary px-8 text-[15px] font-semibold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
          >
            <Save className="size-5" />
            {saved ? 'Сохранено' : 'Сохранить'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Stat label="Объем данных" value={`${stats.usedKb} KB`} />
        <Stat label="Записей" value={stats.itemCount.toString()} />
        <Stat label="Заполнено" value={`${stats.usedPercent}%`} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-4 rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border">
          <h2 className="text-xl font-black text-foreground">Профиль компании</h2>

          <Field icon={Building2} label="Название" value={settings.name} onChange={(value) => setSettings((prev) => ({ ...prev, name: value }))} />
          <Field icon={Building2} label="Краткое название" value={settings.shortName} onChange={(value) => setSettings((prev) => ({ ...prev, shortName: value }))} />
          <Field icon={Building2} label="Юридическое имя" value={settings.legalName} onChange={(value) => setSettings((prev) => ({ ...prev, legalName: value }))} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field icon={Hash} label="ИНН / ИНПС" value={settings.inn} onChange={(value) => setSettings((prev) => ({ ...prev, inn: value }))} />
            <Field icon={Phone} label="Телефон" value={settings.phone} onChange={(value) => setSettings((prev) => ({ ...prev, phone: value }))} />
          </div>

          <Field icon={MapPin} label="Адрес" value={settings.address} onChange={(value) => setSettings((prev) => ({ ...prev, address: value }))} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field icon={User} label="Директор" value={settings.director} onChange={(value) => setSettings((prev) => ({ ...prev, director: value }))} />
            <Field icon={MapPin} label="Город" value={settings.city} onChange={(value) => setSettings((prev) => ({ ...prev, city: value }))} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field icon={Building2} label="Часы работы" value={settings.workHours} onChange={(value) => setSettings((prev) => ({ ...prev, workHours: value }))} />
            <Field icon={Building2} label="Налоговый режим" value={settings.taxRegime} onChange={(value) => setSettings((prev) => ({ ...prev, taxRegime: value }))} />
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border">
            <h2 className="text-xl font-black text-foreground">Карточка магазина</h2>
            <div className="mt-4 space-y-3">
              <MiniRow label="Магазин" value={settings.name} />
              <MiniRow label="Директор" value={settings.director} />
              <MiniRow label="Телефон" value={settings.phone} />
              <MiniRow label="Адрес" value={settings.address} />
              <MiniRow label="График" value={settings.workHours} />
            </div>
          </div>

          <div className="rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border">
            <h2 className="text-xl font-black text-foreground">Синхронизация</h2>
            <p className="mt-2 text-[15px] text-muted-foreground">
              Эти данные используются в чеках, резервных копиях и служебных отчетах.
            </p>
          </div>
        </aside>
      </div>
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

function Field({
  icon: Icon,
  label,
  value,
  onChange,
}: {
  icon: typeof Building2
  label: string
  value: string
  onChange: (next: string) => void
}) {
  return (
    <label className="space-y-2">
      <span className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
        <Icon className="size-4 text-primary" />
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-2xl bg-secondary px-4 text-[15px] text-foreground outline-none ring-1 ring-transparent transition-shadow focus:ring-primary/40"
      />
    </label>
  )
}

function MiniRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-secondary px-4 py-3">
      <p className="text-[13px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-[15px] font-semibold text-foreground">{value}</p>
    </div>
  )
}

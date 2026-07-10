'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, FileText, Printer, Save } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ERP_DATA_CHANGED } from '@/lib/erp/erp-store'

type ReceiptSettingsState = {
  template: 'standard' | 'detailed' | 'minimal'
  printer: 'pdf' | 'pos' | 'network'
  customerCopy: boolean
  lastTestAt: string | null
}

type ReceiptTemplate = {
  id: ReceiptSettingsState['template']
  name: string
  description: string
  features: string[]
}

const STORAGE_KEY = 'erp.receiptSettings.v1'

const defaultSettings: ReceiptSettingsState = {
  template: 'standard',
  printer: 'pdf',
  customerCopy: true,
  lastTestAt: null,
}

const templates: ReceiptTemplate[] = [
  {
    id: 'standard',
    name: 'Стандартный',
    description: 'Классический чек с основной информацией',
    features: ['Название магазина', 'Дата и время', 'Список товаров', 'Итоговая сумма'],
  },
  {
    id: 'detailed',
    name: 'Детальный',
    description: 'Чек с полной информацией о продаже',
    features: ['Все стандартные данные', 'Артикулы товаров', 'Штрихкоды', 'Информация о продавце'],
  },
  {
    id: 'minimal',
    name: 'Минимальный',
    description: 'Краткий чек для быстрой печати',
    features: ['Только необходимое', 'Без лишней информации', 'Быстрая печать'],
  },
]

function readSettings(): ReceiptSettingsState {
  if (typeof window === 'undefined') return defaultSettings
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings
  } catch {
    return defaultSettings
  }
}

function writeSettings(settings: ReceiptSettingsState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  window.dispatchEvent(new Event(ERP_DATA_CHANGED))
}

export function ReceiptSettings() {
  const [settings, setSettings] = useState<ReceiptSettingsState>(defaultSettings)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setSettings(readSettings())
  }, [])

  function submit(next = settings) {
    writeSettings(next)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1500)
  }

  function testPrint() {
    const next = { ...settings, lastTestAt: new Date().toISOString() }
    setSettings(next)
    submit(next)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-foreground">Настройки чеков</h2>
        <p className="mt-1 text-[15px] text-muted-foreground">
          Выберите шаблон чека и настройте печать
        </p>
      </div>

      <div className="grid gap-4">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => setSettings((prev) => ({ ...prev, template: template.id }))}
            className={cn(
              'rounded-2xl p-6 text-left transition-all',
              settings.template === template.id
                ? 'bg-card shadow-sm ring-2 ring-primary'
                : 'bg-secondary hover:bg-accent',
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex size-10 items-center justify-center rounded-xl',
                    settings.template === template.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background text-muted-foreground',
                  )}
                >
                  <FileText className="size-5" />
                </div>
                <div>
                  <p className="text-[15px] font-bold text-foreground">{template.name}</p>
                  <p className="text-[13px] text-muted-foreground">{template.description}</p>
                </div>
              </div>
              {settings.template === template.id ? <CheckCircle2 className="size-5 text-primary" /> : null}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {template.features.map((feature) => (
                <span
                  key={feature}
                  className="rounded-full bg-background/50 px-3 py-1 text-[12px] text-muted-foreground"
                >
                  {feature}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>

      <div className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border">
        <h3 className="mb-4 text-[15px] font-semibold text-foreground">Принтер</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-[13px] text-muted-foreground">Принтер чеков</label>
            <select
              value={settings.printer}
              onChange={(event) => setSettings((prev) => ({ ...prev, printer: event.target.value as ReceiptSettingsState['printer'] }))}
              className="h-12 w-full rounded-2xl bg-background px-4 text-[15px] outline-none ring-1 ring-border focus:ring-2 focus:ring-primary/40"
            >
              <option value="pdf">По умолчанию (PDF)</option>
              <option value="pos">Термопринтер (POS)</option>
              <option value="network">Сетевой принтер</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-[13px] text-muted-foreground">Копия чека для клиента</label>
            <div className="flex gap-3">
              {[true, false].map((value) => (
                <button
                  key={String(value)}
                  onClick={() => setSettings((prev) => ({ ...prev, customerCopy: value }))}
                  className={cn(
                    'flex-1 rounded-2xl py-3 text-[15px] font-semibold transition-colors',
                    settings.customerCopy === value
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30'
                      : 'bg-secondary text-foreground hover:bg-accent',
                  )}
                >
                  {value ? 'Да' : 'Нет'}
                </button>
              ))}
            </div>
          </div>
          {settings.lastTestAt ? (
            <p className="text-[13px] text-muted-foreground">
              Последний тест печати: {new Date(settings.lastTestAt).toLocaleString('ru-RU')}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          onClick={() => submit()}
          className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-[16px] font-bold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
        >
          <Save className="size-5" />
          {saved ? 'Сохранено' : 'Сохранить'}
        </button>
        <button
          onClick={testPrint}
          className="flex items-center justify-center gap-2 rounded-2xl bg-card px-6 py-4 text-[16px] font-bold text-foreground shadow-sm ring-1 ring-border transition-colors hover:bg-secondary"
        >
          <Printer className="size-5 text-primary" />
          Протестировать печать
        </button>
      </div>
    </div>
  )
}

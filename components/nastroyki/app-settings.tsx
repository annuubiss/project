'use client'

import { ReactNode, useEffect, useState } from 'react'
import { Monitor, Plus, Smartphone, Wifi, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ERP_DATA_CHANGED } from '@/lib/erp/erp-store'

type AppIntegration = {
  id: string
  name: string
  description: string
  icon: ReactNode
  active: boolean
  connected: boolean
}

const STORAGE_KEY = 'erp.appSettings.v1'

const defaultIntegrations: AppIntegration[] = [
  {
    id: 'mobile_app',
    name: 'Мобильное приложение',
    description: 'Интеграция с мобильным приложением для продавцов',
    icon: <Smartphone className="size-5" />,
    active: true,
    connected: true,
  },
  {
    id: 'website',
    name: 'Сайт магазина',
    description: 'Синхронизация с онлайн-магазином',
    icon: <Monitor className="size-5" />,
    active: false,
    connected: false,
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    description: 'Отправка чеков и уведомлений в WhatsApp',
    icon: <Wifi className="size-5" />,
    active: false,
    connected: false,
  },
  {
    id: 'accounting',
    name: 'Бухгалтерия',
    description: 'Интеграция с бухгалтерской системой',
    icon: <Zap className="size-5" />,
    active: false,
    connected: false,
  },
]

type StoredIntegration = Omit<AppIntegration, 'icon'>

function withIcons(items: StoredIntegration[]): AppIntegration[] {
  return items.map((item) => ({
    ...item,
    icon:
      item.id === 'mobile_app' ? <Smartphone className="size-5" /> :
      item.id === 'website' ? <Monitor className="size-5" /> :
      item.id === 'whatsapp' ? <Wifi className="size-5" /> :
      <Zap className="size-5" />,
  }))
}

function readIntegrations(): AppIntegration[] {
  if (typeof window === 'undefined') return defaultIntegrations
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? withIcons(JSON.parse(raw)) : defaultIntegrations
  } catch {
    return defaultIntegrations
  }
}

function writeIntegrations(items: AppIntegration[]) {
  const payload: StoredIntegration[] = items.map(({ icon, ...item }) => item)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  window.dispatchEvent(new Event(ERP_DATA_CHANGED))
}

export function AppSettings() {
  const [integrations, setIntegrations] = useState(defaultIntegrations)

  useEffect(() => {
    setIntegrations(readIntegrations())
  }, [])

  function save(next: AppIntegration[]) {
    setIntegrations(next)
    writeIntegrations(next)
  }

  function toggleIntegration(id: string) {
    save(
      integrations.map((item) =>
        item.id === id ? { ...item, active: !item.active, connected: item.connected || !item.active } : item,
      ),
    )
  }

  function addIntegration() {
    const id = `custom-${Date.now()}`
    save([
      {
        id,
        name: 'Новая интеграция',
        description: 'Подключение внешнего сервиса',
        icon: <Zap className="size-5" />,
        active: false,
        connected: false,
      },
      ...integrations,
    ])
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-foreground">Приложения и интеграции</h2>
        <p className="mt-1 text-[15px] text-muted-foreground">
          Подключите сторонние сервисы для расширения функционала
        </p>
      </div>

      <div className="space-y-4">
        {integrations.map((integration) => (
          <div
            key={integration.id}
            className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    'flex size-12 items-center justify-center rounded-2xl',
                    integration.active
                      ? 'bg-primary/10 text-primary'
                      : 'bg-secondary text-muted-foreground',
                  )}
                >
                  {integration.icon}
                </div>
                <div>
                  <p className="text-[15px] font-bold text-foreground">{integration.name}</p>
                  <p className="text-[13px] text-muted-foreground">{integration.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'rounded-full px-3 py-1 text-[12px] font-semibold',
                    integration.connected
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted/10 text-muted-foreground',
                  )}
                >
                  {integration.connected ? 'Подключено' : 'Не подключено'}
                </span>
                <button
                  onClick={() => toggleIntegration(integration.id)}
                  className={cn(
                    'relative h-7 w-12 rounded-full transition-colors',
                    integration.active ? 'bg-primary' : 'bg-muted',
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-1 size-5 rounded-full bg-card shadow transition-transform',
                      integration.active ? 'translate-x-6' : 'translate-x-1',
                    )}
                  />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addIntegration}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-3.5 text-[15px] font-semibold text-primary transition-colors hover:border-primary hover:bg-primary/5"
      >
        <Plus className="size-5" />
        Подключить новое приложение
      </button>
    </div>
  )
}

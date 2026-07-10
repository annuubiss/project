'use client'

import { ReactNode, useEffect, useState } from 'react'
import { Bell, Mail, Smartphone, Wifi } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ERP_DATA_CHANGED } from '@/lib/erp/erp-store'

type NotificationChannels = { email: boolean; sms: boolean; push: boolean }
type NotificationType = {
  id: string
  label: string
  description: string
  icon: ReactNode
  channels: NotificationChannels
}

const STORAGE_KEY = 'erp.notificationSettings.v1'

const defaultNotifications: NotificationType[] = [
  {
    id: 'new_sale',
    label: 'Новая продажа',
    description: 'Уведомление о каждой новой продаже',
    icon: <Smartphone className="size-5" />,
    channels: { email: true, sms: false, push: true },
  },
  {
    id: 'low_stock',
    label: 'Малый остаток',
    description: 'Когда остаток товара ниже порога',
    icon: <Bell className="size-5" />,
    channels: { email: true, sms: true, push: true },
  },
  {
    id: 'debt_reminder',
    label: 'Напоминание о долге',
    description: 'Уведомления о просроченных долгах',
    icon: <Mail className="size-5" />,
    channels: { email: true, sms: false, push: true },
  },
  {
    id: 'cash_shift',
    label: 'Закрытие кассы',
    description: 'Уведомление о закрытии кассовой смены',
    icon: <Wifi className="size-5" />,
    channels: { email: false, sms: false, push: true },
  },
]

function readChannelSettings(): Record<string, NotificationChannels> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeChannelSettings(items: NotificationType[]) {
  const payload = Object.fromEntries(items.map((item) => [item.id, item.channels]))
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  window.dispatchEvent(new Event(ERP_DATA_CHANGED))
}

export function NotificationSettings() {
  const [notifications, setNotifications] = useState(defaultNotifications)

  useEffect(() => {
    const saved = readChannelSettings()
    setNotifications((items) =>
      items.map((item) => ({
        ...item,
        channels: saved[item.id] ?? item.channels,
      })),
    )
  }, [])

  function toggleChannel(id: string, channel: keyof NotificationChannels) {
    setNotifications((current) => {
      const next = current.map((item) =>
        item.id === id
          ? { ...item, channels: { ...item.channels, [channel]: !item.channels[channel] } }
          : item,
      )
      writeChannelSettings(next)
      return next
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-foreground">Уведомления</h2>
        <p className="mt-1 text-[15px] text-muted-foreground">
          Настройте получение уведомлений
        </p>
      </div>

      <div className="space-y-4">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  {notification.icon}
                </div>
                <div>
                  <p className="text-[15px] font-bold text-foreground">{notification.label}</p>
                  <p className="text-[13px] text-muted-foreground">{notification.description}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {(['email', 'sms', 'push'] as const).map((channel) => (
                  <button
                    key={channel}
                    onClick={() => toggleChannel(notification.id, channel)}
                    className={cn(
                      'flex size-10 items-center justify-center rounded-xl transition-colors',
                      notification.channels[channel]
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-muted-foreground hover:bg-accent',
                    )}
                    title={channel === 'email' ? 'Email' : channel === 'sms' ? 'SMS' : 'Push'}
                  >
                    {channel === 'email' ? <Mail className="size-4" /> : null}
                    {channel === 'sms' ? <Smartphone className="size-4" /> : null}
                    {channel === 'push' ? <Wifi className="size-4" /> : null}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-primary/10 px-6 py-4 ring-1 ring-primary/20">
        <p className="text-[15px] font-semibold text-primary">
          Уведомления используют email и телефон из профиля пользователя.
        </p>
      </div>
    </div>
  )
}

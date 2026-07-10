'use client'

import { useEffect, useState } from 'react'
import { Building2, Camera, Mail, Phone, Save, User } from 'lucide-react'
import { ERP_DATA_CHANGED, readWarehouses } from '@/lib/erp/erp-store'

type ProfileSettingsState = {
  name: string
  email: string
  phone: string
  store: string
}

const STORAGE_KEY = 'erp.profileSettings.v1'

const defaultProfile: ProfileSettingsState = {
  name: 'Исломали Н.',
  email: 'islomali@example.com',
  phone: '+998901234570',
  store: 'Магазин / Подвал',
}

function readProfile(): ProfileSettingsState {
  if (typeof window === 'undefined') return defaultProfile
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...defaultProfile, ...JSON.parse(raw) } : defaultProfile
  } catch {
    return defaultProfile
  }
}

function writeProfile(profile: ProfileSettingsState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  window.dispatchEvent(new Event(ERP_DATA_CHANGED))
}

export function ProfileSettings() {
  const [profile, setProfile] = useState<ProfileSettingsState>(defaultProfile)
  const [saved, setSaved] = useState(false)
  const stores = readWarehouses().map((warehouse) => warehouse.name)

  useEffect(() => {
    setProfile(readProfile())
  }, [])

  function submit() {
    writeProfile(profile)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1500)
  }

  const initials = profile.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-foreground">Профиль</h2>
        <p className="mt-1 text-[15px] text-muted-foreground">
          Управляйте данными пользователя и рабочей локацией
        </p>
      </div>

      <div className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="flex size-24 items-center justify-center rounded-2xl bg-secondary text-2xl font-bold text-primary">
              {initials || 'ERP'}
            </div>
            <button
              aria-label="Обновить фото"
              className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-colors hover:bg-primary/90"
            >
              <Camera className="size-4" />
            </button>
          </div>
          <div>
            <p className="text-[15px] font-semibold text-foreground">{profile.name}</p>
            <p className="text-[13px] text-muted-foreground">{profile.store}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border">
          <h3 className="mb-4 text-[15px] font-semibold text-foreground">Контактные данные</h3>
          <div className="space-y-4">
            <ProfileField icon={User} label="Имя" value={profile.name} onChange={(value) => setProfile((prev) => ({ ...prev, name: value }))} />
            <ProfileField icon={Mail} label="Email" value={profile.email} onChange={(value) => setProfile((prev) => ({ ...prev, email: value }))} />
            <ProfileField icon={Phone} label="Телефон" value={profile.phone} onChange={(value) => setProfile((prev) => ({ ...prev, phone: value }))} />
          </div>
        </div>

        <div className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border">
          <h3 className="mb-4 text-[15px] font-semibold text-foreground">Магазин</h3>
          <div className="flex items-center gap-4">
            <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
              <Building2 className="size-5" />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-[13px] text-muted-foreground">Текущая локация</label>
              <select
                value={profile.store}
                onChange={(event) => setProfile((prev) => ({ ...prev, store: event.target.value }))}
                className="h-12 w-full rounded-xl bg-background px-4 text-[15px] outline-none ring-1 ring-border focus:ring-2 focus:ring-primary/40"
              >
                {stores.map((store) => (
                  <option key={store}>{store}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={submit}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-[16px] font-bold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
      >
        <Save className="size-5" />
        {saved ? 'Сохранено' : 'Сохранить изменения'}
      </button>
    </div>
  )
}

function ProfileField({
  icon: Icon,
  label,
  value,
  onChange,
}: {
  icon: typeof User
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
        <Icon className="size-5" />
      </div>
      <div className="flex-1">
        <label className="mb-1 block text-[13px] text-muted-foreground">{label}</label>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full rounded-xl bg-background px-4 text-[15px] outline-none ring-1 ring-border focus:ring-2 focus:ring-primary/40"
        />
      </div>
    </div>
  )
}

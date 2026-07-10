'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ShoppingCart,
  Store,
  Users,
  Megaphone,
  PieChart,
  Wallet,
  Briefcase,
  Settings,
  ChevronsLeft,
  ChevronRight,
  ChevronLeft,
  HelpCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type NavItem = {
  label: string
  icon: typeof ShoppingCart
  href: string
}

const mainNav: NavItem[] = [
  { label: 'Товары', icon: ShoppingCart, href: '/tovary' },
  { label: 'Продажи', icon: Store, href: '/prodazhi' },
  { label: 'Клиенты', icon: Users, href: '/klienty' },
  { label: 'Маркетинг', icon: Megaphone, href: '/marketing' },
  { label: 'Отчеты', icon: PieChart, href: '/otchety' },
  { label: 'Финансы', icon: Wallet, href: '/finansy' },
  { label: 'Управление', icon: Briefcase, href: '/upravlenie' },
  { label: 'Настройки', icon: Settings, href: '/nastroyki' },
]

type Section = {
  prefix: string
  label: string
  icon: typeof ShoppingCart
  items: { label: string; href: string }[]
}

const sections: Section[] = [
  {
    prefix: '/tovary',
    label: 'Товары',
    icon: ShoppingCart,
    items: [
      { label: 'Каталог', href: '/tovary' },
      { label: 'Импорт', href: '/tovary/import' },
      { label: 'Заказы', href: '/tovary/zakazy' },
      { label: 'Инвентаризация', href: '/tovary/inventarizaciya' },
      { label: 'Трансфер', href: '/tovary/transfer' },
      { label: 'Переоценка', href: '/tovary/pereocenka' },
      { label: 'Списание', href: '/tovary/spisanie' },
      { label: 'Поставщики', href: '/tovary/postavshchiki' },
    ],
  },
  {
    prefix: '/prodazhi',
    label: 'Продажи',
    icon: Store,
    items: [
      { label: 'Новая продажа', href: '/prodazhi' },
      { label: 'Все продажи', href: '/prodazhi/vse' },
      { label: 'Кассовые смены', href: '/prodazhi/smeny' },
      { label: 'Кассовые операции', href: '/prodazhi/operacii' },
    ],
  },
  {
    prefix: '/klienty',
    label: 'Клиенты',
    icon: Users,
    items: [
      { label: 'Все клиенты', href: '/klienty' },
      { label: 'Группы и теги', href: '/klienty/gruppy' },
      { label: 'Программа лояльности', href: '/klienty/loyalnost' },
      { label: 'Долги клиентов', href: '/klienty/dolgi' },
    ],
  },
  {
    prefix: '/otchety',
    label: 'Отчеты',
    icon: PieChart,
    items: [
      { label: 'Избранные', href: '/otchety' },
      { label: 'Магазин', href: '/otchety/magazin' },
      { label: 'Товары', href: '/otchety/tovary' },
      { label: 'Продавцы', href: '/otchety/prodavcy' },
      { label: 'Клиенты', href: '/otchety/klienty' },
      { label: 'Финансы', href: '/otchety/finansy' },
    ],
  },
  {
    prefix: '/marketing',
    label: 'Маркетинг',
    icon: Megaphone,
    items: [
      { label: 'Акции', href: '/marketing' },
      { label: 'Промокоды', href: '/marketing/promokody' },
      { label: 'SMS рассылка', href: '/marketing/sms' },
      { label: 'Подарочные карты', href: '/marketing/podarochnye-karty' },
    ],
  },
  {
    prefix: '/finansy',
    label: 'Финансы',
    icon: Wallet,
    items: [
      { label: 'Финансовые категории', href: '/finansy' },
      { label: 'Финансовые транзакции', href: '/finansy/tranzakcii' },
      { label: 'Состояние счетов', href: '/finansy/scheta' },
    ],
  },
  {
    prefix: '/upravlenie',
    label: 'Управление',
    icon: Briefcase,
    items: [
      { label: 'Сотрудники', href: '/upravlenie' },
      { label: 'Роли', href: '/upravlenie/roli' },
    ],
  },
  {
    prefix: '/nastroyki',
    label: 'Настройки',
    icon: Settings,
    items: [
      { label: 'Профиль', href: '/nastroyki' },
      { label: 'Компания', href: '/nastroyki/kompaniya' },
      { label: 'Магазины', href: '/nastroyki/magaziny' },
      { label: 'Кассы', href: '/nastroyki/kassy' },
      { label: 'Чеки', href: '/nastroyki/cheki' },
      { label: 'Валюты и оплаты', href: '/nastroyki/valyuty' },
      { label: 'Товары', href: '/nastroyki/tovary' },
      { label: 'Уведомления', href: '/nastroyki/uvedomleniya' },
      { label: 'Приложения', href: '/nastroyki/prilozheniya' },
    ],
  },
]

export function Sidebar() {
  const [expanded, setExpanded] = useState(true)
  const pathname = usePathname()
  const section = sections.find((s) => pathname.startsWith(s.prefix))

  return (
    <aside
      className={cn(
        'sticky top-0 z-30 hidden h-dvh shrink-0 flex-col bg-sidebar shadow-[1px_0_0_0_var(--sidebar-border)] transition-[width] duration-300 ease-out lg:flex',
        expanded ? 'w-[280px]' : 'w-[88px]',
      )}
    >
      <div className="flex h-24 items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/30">
            <span className="text-xl font-black italic">Z</span>
          </div>
          <span
            className={cn(
              'overflow-hidden text-2xl font-black tracking-[0.15em] text-sidebar-foreground transition-all duration-200',
              expanded ? 'w-auto opacity-100' : 'w-0 opacity-0',
            )}
          >
            BILL<span className="text-primary">Z</span>
          </span>
        </Link>
        <button
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? 'Свернуть меню' : 'Развернуть меню'}
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground',
            !expanded && 'hidden',
          )}
        >
          <ChevronsLeft className="size-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-2 no-scrollbar">
        {section ? (
          <>
            <Link
              href="/"
              className="mb-2 flex items-center gap-3 rounded-2xl px-2 py-2 text-[15px] font-semibold text-sidebar-foreground transition-colors hover:bg-secondary"
            >
              <span className="flex size-8 items-center justify-center rounded-lg text-muted-foreground">
                <ChevronLeft className="size-5" />
              </span>
              <section.icon className="size-5 shrink-0 text-primary" />
              <span
                className={cn(
                  'overflow-hidden whitespace-nowrap transition-all duration-200',
                  expanded ? 'w-auto opacity-100' : 'w-0 opacity-0',
                )}
              >
                {section.label}
              </span>
            </Link>

            {section.items.map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex w-full items-center rounded-2xl px-4 py-3 text-[15px] font-medium transition-all duration-200',
                    active
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-secondary hover:text-sidebar-foreground',
                    !expanded && 'justify-center px-0',
                  )}
                >
                  <span
                    className={cn(
                      'overflow-hidden whitespace-nowrap transition-all duration-200',
                      expanded ? 'w-auto opacity-100' : 'w-0 opacity-0',
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </>
        ) : (
          mainNav.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group relative flex w-full items-center gap-3.5 rounded-2xl px-3.5 py-3 text-[15px] font-medium transition-all duration-200',
                  active
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-secondary hover:text-sidebar-foreground',
                )}
              >
                <Icon className={cn('size-5 shrink-0', active && 'text-primary')} />
                <span
                  className={cn(
                    'flex-1 overflow-hidden whitespace-nowrap text-left transition-all duration-200',
                    expanded ? 'w-auto opacity-100' : 'w-0 opacity-0',
                  )}
                >
                  {item.label}
                </span>
                {expanded && (
                  <ChevronRight
                    className={cn(
                      'size-4 shrink-0 transition-colors',
                      active ? 'text-primary' : 'text-muted-foreground/50',
                    )}
                  />
                )}
              </Link>
            )
          })
        )}
      </nav>

      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center gap-3 border-t border-sidebar-border pt-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-sm font-bold text-primary">
            ИН
          </div>
          <div
            className={cn(
              'flex min-w-0 flex-1 flex-col overflow-hidden transition-all duration-200',
              expanded ? 'opacity-100' : 'w-0 opacity-0',
            )}
          >
            <span className="truncate text-[15px] font-semibold text-sidebar-foreground">
              Исломали Н.
            </span>
            <span className="truncate text-[13px] text-muted-foreground">Магазин / Подвал</span>
          </div>
        </div>
      </div>

      <button className="mx-4 mb-4 flex items-center justify-center gap-2 rounded-2xl bg-secondary px-4 py-3.5 text-[14px] font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-primary">
        <HelpCircle className="size-5 shrink-0" />
        <span
          className={cn(
            'overflow-hidden whitespace-nowrap transition-all duration-200',
            expanded ? 'w-auto opacity-100' : 'w-0 opacity-0',
          )}
        >
          Нужна помощь?
        </span>
      </button>

      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          aria-label="Развернуть меню"
          className="absolute -right-3 top-28 flex size-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:text-foreground"
        >
          <ChevronRight className="size-4" />
        </button>
      )}
    </aside>
  )
}

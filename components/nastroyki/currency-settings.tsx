'use client'

import { useEffect, useState } from 'react'
import { DollarSign, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  ERP_DATA_CHANGED,
  readCurrencySettings,
  updateCurrencySetting,
  type ErpCurrencySetting,
} from '@/lib/erp/erp-store'
import { formatUZS } from '@/lib/erp/product-catalog'

export function CurrencySettings() {
  const [currencies, setCurrencies] = useState<ErpCurrencySetting[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [rates, setRates] = useState<Record<string, string>>({})
  const [error, setError] = useState('')

  const load = () => {
    const data = readCurrencySettings()
    setCurrencies(data)
    setRates(Object.fromEntries(data.map((currency) => [currency.code, String(currency.rate)])))
  }

  useEffect(() => {
    load()
    window.addEventListener(ERP_DATA_CHANGED, load)
    window.addEventListener('storage', load)

    return () => {
      window.removeEventListener(ERP_DATA_CHANGED, load)
      window.removeEventListener('storage', load)
    }
  }, [])

  function handleSave(code: 'UZS' | 'USD') {
    const rate = Number(rates[code]) || 0
    if (rate <= 0) {
      setError('Курс должен быть больше нуля')
      return
    }

    const currency = currencies.find((item) => item.code === code)
    if (!currency) return

    updateCurrencySetting({
      code,
      rate,
      status: currency.status,
    })

    setEditing(null)
    setError('')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-foreground">Валюты и курсы</h2>
        <p className="mt-1 text-[15px] text-muted-foreground">
          Управляйте валютами и курсами обмена
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl bg-destructive/10 px-5 py-4 text-[15px] font-semibold text-destructive ring-1 ring-destructive/20">
          {error}
        </div>
      ) : null}

      <div className="space-y-3">
        {currencies.map((currency) => (
          <div
            key={currency.code}
            className="flex items-center justify-between gap-4 rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border"
          >
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                {currency.code === 'USD' ? <DollarSign className="size-6" /> : <TrendingUp className="size-6" />}
              </div>
              <div>
                <p className="text-[15px] font-bold text-foreground">{currency.name}</p>
                <p className="text-[13px] text-muted-foreground">
                  {currency.code}
                  {currency.isBase ? (
                    <span className="ml-2 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[12px] font-semibold text-primary">
                      Базовая
                    </span>
                  ) : null}
                </p>
              </div>
            </div>

            {editing === currency.code ? (
              <div className="flex items-center gap-3">
                <input
                  autoFocus
                  type="number"
                  value={rates[currency.code]}
                  onChange={(event) =>
                    setRates((prev) => ({
                      ...prev,
                      [currency.code]: event.target.value,
                    }))
                  }
                  className="h-12 w-32 rounded-2xl bg-background px-4 text-[15px] font-semibold text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary/40"
                />
                <button
                  onClick={() => handleSave(currency.code as 'UZS' | 'USD')}
                  className="rounded-2xl bg-primary px-6 py-3 text-[15px] font-semibold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
                >
                  Сохранить
                </button>
                <button
                  onClick={() => {
                    setEditing(null)
                    setError('')
                  }}
                  className="rounded-2xl bg-secondary px-6 py-3 text-[15px] font-semibold text-foreground transition-colors hover:bg-accent"
                >
                  Отмена
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[15px] font-bold text-foreground">{formatUZS(currency.rate)}</p>
                  <p className="text-[13px] text-muted-foreground">за 1 {currency.code}</p>
                </div>
                <button
                  onClick={() => {
                    setEditing(currency.code)
                    setError('')
                  }}
                  disabled={currency.isBase}
                  className={cn(
                    'rounded-2xl px-6 py-3 text-[15px] font-semibold transition-colors',
                    currency.isBase
                      ? 'cursor-not-allowed bg-secondary text-muted-foreground opacity-50'
                      : 'bg-secondary text-foreground hover:bg-accent',
                  )}
                >
                  Изменить
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-primary/10 px-6 py-4 ring-1 ring-primary/20">
        <p className="text-[15px] font-semibold text-primary">
          Базовая валюта UZS не изменяется. Остальные курсы указываются относительно базовой валюты.
        </p>
      </div>
    </div>
  )
}

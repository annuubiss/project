'use client'

import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { Save, CreditCard, Coins } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  ERP_DATA_CHANGED,
  readCashRegisters,
  readCurrencySettings,
  readPaymentMethodSettings,
  updateCurrencySetting,
  upsertPaymentMethodSetting,
  type ErpCashRegister,
  type ErpCurrencySetting,
  type ErpPaymentMethodSetting,
} from '@/lib/erp/erp-store'

function SettingsSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="grid grid-cols-1 gap-6 border-t border-border py-8 lg:grid-cols-[220px_1fr] lg:gap-12">
      <h2 className="text-2xl font-black text-foreground">{title}</h2>
      <div className="min-w-0">{children}</div>
    </section>
  )
}

export function PaymentCurrencySettings() {
  const [registers, setRegisters] = useState<ErpCashRegister[]>([])
  const [currencies, setCurrencies] = useState<ErpCurrencySetting[]>([])
  const [methods, setMethods] = useState<ErpPaymentMethodSetting[]>([])

  useEffect(() => {
    function load() {
      setRegisters(readCashRegisters())
      setCurrencies(readCurrencySettings())
      setMethods(readPaymentMethodSettings())
    }

    load()
    window.addEventListener(ERP_DATA_CHANGED, load)
    window.addEventListener('storage', load)
    return () => {
      window.removeEventListener(ERP_DATA_CHANGED, load)
      window.removeEventListener('storage', load)
    }
  }, [])

  const registerOptions = useMemo(
    () => registers.filter((item) => item.status === 'active'),
    [registers],
  )

  return (
    <div className="space-y-2">
      <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">Валюты и оплаты</h1>

      <SettingsSection title="Валюты">
        <div className="space-y-4">
          {currencies.map((currency) => (
            <div key={currency.code} className="rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Coins className="size-5" />
                    </span>
                    <div>
                      <p className="text-[16px] font-bold text-foreground">{currency.name}</p>
                      <p className="text-[14px] text-muted-foreground">{currency.code}</p>
                    </div>
                  </div>
                </div>
                <span className={cn(
                  'inline-flex rounded-full px-3 py-1 text-[12px] font-bold',
                  currency.status === 'active' ? 'bg-chart-2/15 text-chart-2' : 'bg-secondary text-muted-foreground',
                )}>
                  {currency.status === 'active' ? 'Активна' : 'Отключена'}
                </span>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-[160px_180px_auto] sm:items-end">
                <div className="space-y-2">
                  <label className="text-[14px] font-semibold text-foreground">Курс</label>
                  <input
                    value={currency.rate}
                    onChange={(event) =>
                      setCurrencies((prev) =>
                        prev.map((item) =>
                          item.code === currency.code ? { ...item, rate: Number(event.target.value) || 0 } : item,
                        ),
                      )
                    }
                    type="number"
                    className="h-12 w-full rounded-2xl bg-secondary px-4 text-[15px] text-foreground outline-none ring-1 ring-transparent transition-shadow focus:ring-primary/40"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[14px] font-semibold text-foreground">Статус</label>
                  <div className="flex overflow-hidden rounded-2xl bg-secondary p-1.5 ring-1 ring-border">
                    {(['active', 'inactive'] as const).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() =>
                          setCurrencies((prev) =>
                            prev.map((item) =>
                              item.code === currency.code ? { ...item, status } : item,
                            ),
                          )
                        }
                        className={cn(
                          'flex-1 rounded-xl px-4 py-3 text-[14px] font-semibold transition-colors',
                          currency.status === status
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground',
                        )}
                      >
                        {status === 'active' ? 'Активна' : 'Отключена'}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updateCurrencySetting({
                      code: currency.code,
                      rate: currency.rate,
                      status: currency.status,
                    })
                  }
                  className="rounded-2xl bg-primary px-6 py-3 text-[15px] font-bold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
                >
                  <Save className="mr-2 inline size-4" />
                  Сохранить
                </button>
              </div>
            </div>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection title="Способы оплаты">
        <div className="overflow-hidden rounded-3xl bg-card shadow-sm ring-1 ring-border">
          <div className="grid grid-cols-[1.1fr_120px_140px_1.1fr_110px_110px] gap-4 border-b border-border px-6 py-4 text-[14px] font-semibold text-muted-foreground">
            <div>Метод</div>
            <div>Кнопка</div>
            <div>Канал</div>
            <div>Счет</div>
            <div>POS</div>
            <div>Статус</div>
          </div>

          {methods.map((method) => (
            <div
              key={method.id}
              className="grid grid-cols-[1.1fr_120px_140px_1.1fr_110px_110px] items-center gap-4 border-b border-border px-6 py-4 last:border-b-0"
            >
              <div>
                <p className="font-semibold text-foreground">{method.label}</p>
                <p className="text-[13px] text-muted-foreground">{method.id}</p>
              </div>
              <input
                value={method.hotkey}
                onChange={(event) =>
                  setMethods((prev) =>
                    prev.map((item) =>
                      item.id === method.id ? { ...item, hotkey: event.target.value } : item,
                    ),
                  )
                }
                className="h-11 rounded-2xl bg-secondary px-4 text-[14px] text-foreground outline-none ring-1 ring-transparent transition-shadow focus:ring-primary/40"
              />
              <select
                value={method.channel}
                onChange={(event) =>
                  setMethods((prev) =>
                    prev.map((item) =>
                      item.id === method.id
                        ? {
                            ...item,
                            channel: event.target.value as ErpPaymentMethodSetting['channel'],
                          }
                        : item,
                    ),
                  )
                }
                className="h-11 rounded-2xl bg-secondary px-4 text-[14px] text-foreground outline-none ring-1 ring-transparent transition-shadow focus:ring-primary/40"
              >
                <option value="cash">Наличные</option>
                <option value="cashless">Безналичные</option>
                <option value="credit">Кредит</option>
                <option value="mixed">Смешанный</option>
              </select>
              <select
                value={method.registerId ?? ''}
                onChange={(event) =>
                  setMethods((prev) =>
                    prev.map((item) =>
                      item.id === method.id
                        ? { ...item, registerId: event.target.value || null }
                        : item,
                    ),
                  )
                }
                className="h-11 rounded-2xl bg-secondary px-4 text-[14px] text-foreground outline-none ring-1 ring-transparent transition-shadow focus:ring-primary/40"
              >
                <option value="">Не назначен</option>
                {registerOptions.map((register) => (
                  <option key={register.id} value={register.id}>
                    {register.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() =>
                  setMethods((prev) =>
                    prev.map((item) =>
                      item.id === method.id ? { ...item, allowInPos: !item.allowInPos } : item,
                    ),
                  )
                }
                className={cn(
                  'rounded-2xl px-4 py-2.5 text-[14px] font-semibold transition-colors',
                  method.allowInPos
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground',
                )}
              >
                {method.allowInPos ? 'Вкл' : 'Выкл'}
              </button>
              <button
                type="button"
                onClick={() =>
                  setMethods((prev) =>
                    prev.map((item) =>
                      item.id === method.id
                        ? { ...item, status: item.status === 'active' ? 'inactive' : 'active' }
                        : item,
                    ),
                  )
                }
                className={cn(
                  'rounded-2xl px-4 py-2.5 text-[14px] font-semibold transition-colors',
                  method.status === 'active'
                    ? 'bg-chart-2/15 text-chart-2'
                    : 'bg-secondary text-muted-foreground',
                )}
              >
                {method.status === 'active' ? 'Активен' : 'Отключен'}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => {
              for (const method of methods) {
                upsertPaymentMethodSetting({
                  id: method.id,
                  label: method.label,
                  hotkey: method.hotkey,
                  channel: method.channel,
                  registerId: method.registerId,
                  allowInPos: method.allowInPos,
                  status: method.status,
                })
              }
            }}
            className="rounded-2xl bg-primary px-6 py-3 text-[15px] font-bold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
          >
            <Save className="mr-2 inline size-4" />
            Сохранить способы оплаты
          </button>
        </div>

        <div className="mt-4 rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border">
          <div className="flex items-start gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <CreditCard className="size-5" />
            </span>
            <div>
              <p className="text-[15px] font-bold text-foreground">Связь с продажами</p>
              <p className="mt-1 text-[14px] text-muted-foreground">
                Активные способы оплаты сразу доступны в POS и направляют платежи в назначенные кассы.
              </p>
            </div>
          </div>
        </div>
      </SettingsSection>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { ChevronDown, Pencil, FileText, ArrowRight } from 'lucide-react'
import {
  DetailHeader,
  PrimaryButton,
  GhostButton,
  SubTabs,
  DetailToolbar,
  DetailTableCard,
  DetailHeadRow,
  DetailRow,
} from './detail-shared'
import { Pagination } from './shared'

type Product = {
  name: string
  sku: string
  barcode: string
  rate: string
  supplier: string
  sale: string
  markup: string
  qty: string
}

const products: Product[] = [
  {
    name: 'Казан чугунный 12 л',
    sku: 'KAZ-12L',
    barcode: '2000000021713',
    rate: '12 600',
    supplier: '18 USD',
    sale: '420 000 UZS',
    markup: '85%',
    qty: '14 шт',
  },
  {
    name: 'Сковорода антипригарная 28 см',
    sku: 'SKV-28',
    barcode: '2000000021720',
    rate: '12 600',
    supplier: '9 USD',
    sale: '210 000 UZS',
    markup: '90%',
    qty: '32 шт',
  },
  {
    name: 'Кастрюля эмалированная 5 л',
    sku: 'KAS-5L',
    barcode: '2000000007342',
    rate: '12 600',
    supplier: '7 USD',
    sale: '165 000 UZS',
    markup: '88%',
    qty: '21 шт',
  },
  {
    name: 'Чайник нержавеющий 3 л',
    sku: 'CHA-3L',
    barcode: '2000000007311',
    rate: '12 600',
    supplier: '6 USD',
    sale: '145 000 UZS',
    markup: '92%',
    qty: '18 шт',
  },
  {
    name: 'Набор кухонных ножей 6 предметов',
    sku: 'NOJ-6',
    barcode: '2000000007359',
    rate: '12 600',
    supplier: '11 USD',
    sale: '255 000 UZS',
    markup: '84%',
    qty: '9 шт',
  },
]

const columns = [
  { label: 'Наименование', className: 'flex-[1.4]' },
  { label: 'Артикул', className: 'max-w-[110px]' },
  { label: 'Баркод', className: 'max-w-[160px]' },
  { label: 'Курс', className: 'max-w-[90px]' },
  { label: 'Цена поставщика', className: 'max-w-[130px]' },
  { label: 'Цена продажи', className: 'flex-[1.4]' },
  { label: 'Наценка', className: 'flex-[1.1]' },
  { label: 'Кол-во', className: 'max-w-[80px]' },
]

function UndefinedTarget() {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <ArrowRight className="size-4 text-primary" />
      Не определено
    </span>
  )
}

export function RevaluationDetail({ id }: { id: string }) {
  const [tab, setTab] = useState(0)

  return (
    <div className="space-y-6">
      <DetailHeader
        title={`Переоценка #${id}`}
        subtitle="Переоценка • Магазин / Подвал"
        backHref="/tovary/pereocenka"
        editable
        actions={
          <>
            <GhostButton tone="danger">Отменить</GhostButton>
            <PrimaryButton>Переоценить</PrimaryButton>
          </>
        }
      />

      <div className="flex items-center justify-between gap-4">
        <SubTabs
          tabs={[
            { label: 'Все', count: 294 },
            { label: 'К переоценке', count: 0 },
          ]}
          active={tab}
          onChange={setTab}
        />
        <button className="flex shrink-0 items-center gap-2 text-[15px] font-medium text-muted-foreground transition-colors hover:text-foreground">
          <ChevronDown className="size-4" />
          Показать статистику
        </button>
      </div>

      <DetailToolbar
        right={
          <div className="flex items-center gap-3">
            <button className="flex h-14 items-center gap-2 rounded-2xl bg-card px-6 text-[15px] font-semibold text-muted-foreground shadow-sm ring-1 ring-border transition-colors hover:bg-secondary">
              <Pencil className="size-5 text-primary" />
              Изменить наценку
            </button>
            <button
              aria-label="Заметка"
              className="flex size-14 items-center justify-center rounded-2xl bg-card text-primary shadow-sm ring-1 ring-border transition-colors hover:bg-secondary"
            >
              <FileText className="size-5" />
            </button>
          </div>
        }
      />

      <DetailTableCard>
        <DetailHeadRow columns={columns} withCheckbox />
        {products.map((p) => (
          <DetailRow key={p.barcode} withCheckbox>
            <div className="flex-[1.4] font-semibold text-primary">{p.name}</div>
            <div className="max-w-[110px] flex-1 text-muted-foreground">
              {p.sku}
            </div>
            <div className="max-w-[160px] flex-1 text-muted-foreground">
              {p.barcode}
            </div>
            <div className="max-w-[90px] flex-1 text-foreground">{p.rate}</div>
            <div className="max-w-[130px] flex-1 font-semibold text-foreground">
              {p.supplier}
            </div>
            <div className="flex flex-[1.4] items-center gap-2">
              <span className="font-semibold text-foreground">{p.sale}</span>
              <UndefinedTarget />
            </div>
            <div className="flex flex-[1.1] items-center gap-2">
              <span className="font-semibold text-foreground">{p.markup}</span>
              <UndefinedTarget />
            </div>
            <div className="max-w-[80px] flex-1 text-muted-foreground">
              {p.qty}
            </div>
          </DetailRow>
        ))}
      </DetailTableCard>

      <Pagination pages={59} />
    </div>
  )
}

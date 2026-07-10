'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Dispatch, ReactNode, SetStateAction } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ImagePlus, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  generateBarcode,
  generateSku,
  parseMoney,
  updateProduct,
  type CatalogProduct,
} from '@/lib/erp/product-catalog'
import { findBrandReference, findCategoryReference } from '@/lib/erp/categories'
import type { ProductUnit } from '@/lib/erp/product-units'
import { DetailHeader, PrimaryButton, GhostButton } from './detail-shared'
import { useProductReferences } from './use-product-references'

const steps = ['Основные', 'Цены', 'Остатки', 'Характеристики'] as const

type FormState = {
  name: string
  sku: string
  barcode: string
  unit: string
  salePrice: string
  wholesalePrice: string
  lowStockThreshold: string
  brand: string
  supplier: string
  category: string
  status: 'active' | 'inactive'
}

const inputCls =
  'h-14 w-full rounded-2xl bg-background px-4 text-[15px] text-foreground outline-none ring-1 ring-border transition-shadow focus:ring-2 focus:ring-primary/40'

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <label className="text-[15px] font-medium text-muted-foreground">
        {label}
        {required ? <span className="ml-0.5 text-destructive">*</span> : null}
      </label>
      {children}
    </div>
  )
}

function MoneyInput({
  value,
  suffix,
  onChange,
}: {
  value: string
  suffix: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex h-14 items-center overflow-hidden rounded-2xl bg-background ring-1 ring-border focus-within:ring-2 focus-within:ring-primary/40">
      <input
        inputMode="numeric"
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/[^\d]/g, ''))}
        className="h-full w-full min-w-0 bg-transparent px-4 text-[15px] font-semibold text-foreground outline-none"
      />
      <span className="px-4 text-[13px] font-medium text-muted-foreground">{suffix}</span>
    </div>
  )
}

function BasicTab({
  form,
  setForm,
  units,
}: {
  form: FormState
  setForm: Dispatch<SetStateAction<FormState>>
  units: ProductUnit[]
}) {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-black text-foreground">Основные</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field label="Наименование" required>
          <input
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Введите наименование"
            className={inputCls}
          />
        </Field>

        <Field label="Артикул" required>
          <div className="relative">
            <input
              value={form.sku}
              onChange={(event) => setForm((prev) => ({ ...prev, sku: event.target.value }))}
              placeholder="Введите артикул"
              className={cn(inputCls, 'pr-36')}
            />
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, sku: generateSku(prev.name || 'product') }))}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-4 py-2 text-[15px] font-semibold text-primary transition-colors hover:bg-accent"
            >
              Генерировать
            </button>
          </div>
        </Field>

        <Field label="Единица измерения">
          <div className="relative">
            <select
              value={form.unit}
              onChange={(event) => setForm((prev) => ({ ...prev, unit: event.target.value }))}
              className={cn(inputCls, 'appearance-none pr-12')}
            >
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>{unit.label} ({unit.symbol})</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          </div>
        </Field>

        <Field label="Штрихкод">
          <div className="relative">
            <input
              value={form.barcode}
              onChange={(event) => setForm((prev) => ({ ...prev, barcode: event.target.value }))}
              placeholder="Сгенерировать автоматически"
              className={cn(inputCls, 'pr-36')}
            />
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, barcode: generateBarcode() }))}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-4 py-2 text-[15px] font-semibold text-primary transition-colors hover:bg-accent"
            >
              Генерировать
            </button>
          </div>
        </Field>
      </div>

      <Field label="Статус">
        <div className="grid grid-cols-2 max-w-xs gap-2 rounded-2xl bg-secondary p-1.5">
          {(['active', 'inactive'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, status }))}
              className={cn(
                'rounded-2xl py-3 text-[15px] font-semibold transition-colors',
                form.status === status
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {status === 'active' ? 'Активный' : 'Неактивный'}
            </button>
          ))}
        </div>
      </Field>

      <div>
        <p className="text-[15px] font-medium text-muted-foreground">Фото</p>
        <div className="mt-3 flex flex-wrap gap-4">
          <button className="flex size-28 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary">
            <ImagePlus className="size-6" />
            <span className="text-[13px] font-semibold">Добавить</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function PricesTab({
  form,
  setForm,
}: {
  form: FormState
  setForm: Dispatch<SetStateAction<FormState>>
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-foreground">Цены</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field label="Цена продажи" required>
          <MoneyInput
            value={form.salePrice}
            suffix="UZS"
            onChange={(salePrice) => setForm((prev) => ({ ...prev, salePrice }))}
          />
        </Field>
        <Field label="Оптовая цена">
          <MoneyInput
            value={form.wholesalePrice}
            suffix="UZS"
            onChange={(wholesalePrice) => setForm((prev) => ({ ...prev, wholesalePrice }))}
          />
        </Field>
      </div>
    </div>
  )
}

function StockTab({
  form,
  setForm,
}: {
  form: FormState
  setForm: Dispatch<SetStateAction<FormState>>
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-foreground">Остатки</h2>
      <p className="text-[15px] text-muted-foreground">
        Для изменения остатков используйте инвентаризацию или перемещение.
      </p>
      <div className="grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2">
        <Field label="Порог малого остатка">
          <MoneyInput
            value={form.lowStockThreshold}
            suffix={form.unit}
            onChange={(lowStockThreshold) => setForm((prev) => ({ ...prev, lowStockThreshold }))}
          />
        </Field>
      </div>
    </div>
  )
}

function ReferenceSuggestions({
  items,
  onPick,
}: {
  items: string[]
  onPick: (value: string) => void
}) {
  if (items.length === 0) return null

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {items.slice(0, 6).map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onPick(item)}
          className="rounded-xl bg-accent px-3 py-1.5 text-[13px] font-semibold text-primary"
        >
          {item}
        </button>
      ))}
    </div>
  )
}

function CharacteristicsTab({
  form,
  setForm,
  categories,
  brands,
  suppliers,
}: {
  form: FormState
  setForm: Dispatch<SetStateAction<FormState>>
  categories: string[]
  brands: string[]
  suppliers: string[]
}) {
  const brandMatches = useMemo(() => {
    const query = form.brand.trim().toLowerCase()
    if (!query) return brands
    return brands.filter((brand) => brand.toLowerCase().includes(query))
  }, [brands, form.brand])

  const supplierMatches = useMemo(() => {
    const query = form.supplier.trim().toLowerCase()
    if (!query) return suppliers
    return suppliers.filter((supplier) => supplier.toLowerCase().includes(query))
  }, [form.supplier, suppliers])

  const categoryMatches = useMemo(() => {
    const query = form.category.trim().toLowerCase()
    if (!query) return categories
    return categories.filter((category) => category.toLowerCase().includes(query))
  }, [categories, form.category])

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-black text-foreground">Характеристики</h2>
      <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-2">
        <Field label="Бренд">
          <div className="relative">
            <input
              value={form.brand}
              onChange={(event) => setForm((prev) => ({ ...prev, brand: event.target.value }))}
              placeholder="Введите бренд"
              className={cn(inputCls, 'pr-12')}
            />
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          </div>
          <ReferenceSuggestions
            items={brandMatches}
            onPick={(brand) => setForm((prev) => ({ ...prev, brand }))}
          />
        </Field>

        <Field label="Поставщик">
          <div className="relative">
            <input
              value={form.supplier}
              onChange={(event) => setForm((prev) => ({ ...prev, supplier: event.target.value }))}
              placeholder="Введите поставщика"
              className={cn(inputCls, 'pr-12')}
            />
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          </div>
          <ReferenceSuggestions
            items={supplierMatches}
            onPick={(supplier) => setForm((prev) => ({ ...prev, supplier }))}
          />
        </Field>
      </div>

      <div className="space-y-3">
        <p className="text-[15px] font-medium text-muted-foreground">Категория</p>
        <div className="rounded-3xl bg-background p-4 ring-1 ring-border">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={form.category}
              onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
              placeholder="Название категории"
              className="h-13 w-full rounded-2xl bg-card py-3.5 pl-12 pr-4 text-[15px] outline-none ring-1 ring-border focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="mt-2 space-y-1">
            {categoryMatches.map((category) => (
              <label
                key={category}
                className="flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-secondary"
              >
                <input
                  type="radio"
                  checked={form.category === category}
                  onChange={() => setForm((prev) => ({ ...prev, category }))}
                  className="size-5 rounded-md border border-border accent-primary"
                />
                <span className="flex-1 text-[15px] font-semibold text-foreground">{category}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function ProductEdit({ product }: { product: CatalogProduct }) {
  const router = useRouter()
  const { categories, brands, suppliers, units } = useProductReferences()
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const [form, setForm] = useState<FormState>({
    name: product.name,
    sku: product.sku,
    barcode: product.barcode,
    unit: product.unit,
    salePrice: String(product.price),
    wholesalePrice: String(product.wholesalePrice),
    lowStockThreshold: String(product.lowStockThreshold),
    brand: product.brand ?? '',
    supplier: product.supplier ?? '',
    category: product.category,
    status: product.status,
  })

  useEffect(() => {
    if (!form.category && categories[0]) {
      setForm((prev) => ({ ...prev, category: categories[0] }))
    }
  }, [categories, form.category])

  function save() {
    const name = form.name.trim()
    const category = form.category.trim()
    const brand = form.brand.trim()
    const price = parseMoney(form.salePrice)

    if (!name) {
      setError('Заполните наименование товара.')
      setStep(0)
      return
    }

    if (!price) {
      setError('Укажите цену продажи.')
      setStep(1)
      return
    }

    if (!category) {
      setError('Укажите категорию товара.')
      setStep(3)
      return
    }

    try {
      const categoryReference = findCategoryReference({ name: category })
      const brandReference = brand ? findBrandReference({ name: brand }) : null
      if (!categoryReference) throw new Error('Выберите действующую категорию из справочника.')
      if (brand && !brandReference) throw new Error('Выберите действующий бренд из справочника.')
      updateProduct(product.id, {
        name,
        sku: form.sku.trim() || generateSku(name),
        barcode: form.barcode.trim() || generateBarcode(),
        category,
        categoryId: categoryReference.id,
        brand,
        brandId: brandReference?.id,
        supplier: form.supplier.trim(),
        unit: form.unit,
        price,
        wholesalePrice: parseMoney(form.wholesalePrice),
        lowStockThreshold: parseMoney(form.lowStockThreshold),
        status: form.status,
      })
      setError('')
      router.push('/tovary')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить товар.')
    }
  }

  return (
    <div className="space-y-8">
      <DetailHeader
        title={product.name}
        backHref="/tovary"
        actions={
          <>
            <GhostButton onClick={() => router.push('/tovary')}>Отмена</GhostButton>
            <PrimaryButton onClick={save}>Сохранить</PrimaryButton>
          </>
        }
      />

      {error ? (
        <div className="rounded-2xl bg-destructive/10 px-5 py-4 text-[15px] font-semibold text-destructive ring-1 ring-destructive/20">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-8 lg:flex-row">
        <nav className="flex shrink-0 gap-2 overflow-x-auto no-scrollbar lg:w-56 lg:flex-col">
          {steps.map((stepLabel, index) => (
            <button
              key={stepLabel}
              onClick={() => setStep(index)}
              className={cn(
                'whitespace-nowrap rounded-2xl px-5 py-3.5 text-left text-[15px] font-semibold transition-colors',
                step === index
                  ? 'bg-accent text-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
              )}
            >
              {stepLabel}
            </button>
          ))}
        </nav>

        <div className="min-w-0 flex-1 rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border sm:p-8">
          {step === 0 ? <BasicTab form={form} setForm={setForm} units={units} /> : null}
          {step === 1 ? <PricesTab form={form} setForm={setForm} /> : null}
          {step === 2 ? <StockTab form={form} setForm={setForm} /> : null}
          {step === 3 ? (
            <CharacteristicsTab
              form={form}
              setForm={setForm}
              categories={categories}
              brands={brands}
              suppliers={suppliers}
            />
          ) : null}

          <div className="mt-8 flex justify-between border-t border-border pt-6">
            <button
              disabled={step === 0}
              onClick={() => setStep((value) => Math.max(0, value - 1))}
              className="rounded-2xl bg-secondary px-8 py-3.5 text-[15px] font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
            >
              Назад
            </button>
            {step < steps.length - 1 ? (
              <button
                onClick={() => {
                  setError('')
                  setStep((value) => Math.min(steps.length - 1, value + 1))
                }}
                className="rounded-2xl bg-primary px-10 py-3.5 text-[15px] font-semibold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
              >
                Далее
              </button>
            ) : (
              <button
                onClick={save}
                className="rounded-2xl bg-primary px-10 py-3.5 text-[15px] font-semibold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
              >
                Сохранить
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

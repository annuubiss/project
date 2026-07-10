'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Dispatch, ReactNode, SetStateAction } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  ChevronDown,
  ImagePlus,
  Search,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  createProduct,
  generateBarcode,
  generateSku,
  parseMoney,
} from '@/lib/erp/product-catalog'
import { findBrandReference, findCategoryReference } from '@/lib/erp/categories'
import type { ProductUnit } from '@/lib/erp/product-units'
import { DetailHeader, PrimaryButton } from './detail-shared'
import { useProductReferences } from './use-product-references'

const steps = ['Основные', 'Вариации', 'Цены', 'Остатки', 'Характеристики'] as const
const colors = ['Белый', 'Розовый', 'Синий']
const sizes = ['36', '38', '40']

type FormState = {
  type: string
  variability: string
  name: string
  sku: string
  barcode: string
  unit: string
  salePrice: string
  wholesalePrice: string
  stock: string
  lowStockThreshold: string
  brand: string
  supplier: string
  category: string
}

const inputCls =
  'h-14 w-full rounded-2xl bg-background px-4 text-[15px] text-foreground outline-none ring-1 ring-border transition-shadow focus:ring-2 focus:ring-primary/40'

function createInitialForm(defaultCategory: string): FormState {
  return {
    type: 'Товар',
    variability: 'Вариативный',
    name: '',
    sku: '',
    barcode: '',
    unit: 'sht',
    salePrice: '127000',
    wholesalePrice: '0',
    stock: '0',
    lowStockThreshold: '5',
    brand: '',
    supplier: '',
    category: defaultCategory,
  }
}

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

function ChoiceCard({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-14 items-center gap-3 rounded-2xl px-5 text-[15px] font-semibold transition-colors',
        selected
          ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30'
          : 'bg-background text-muted-foreground ring-1 ring-border hover:bg-secondary',
      )}
    >
      <span
        className={cn(
          'flex size-5 items-center justify-center rounded-full border-2',
          selected ? 'border-primary-foreground' : 'border-muted-foreground/50',
        )}
      >
        {selected ? <CheckCircle2 className="size-5 text-primary-foreground" /> : null}
      </span>
      {label}
    </button>
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

      <Field label="Тип продукта">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {['Товар', 'Услуга', 'Комплект'].map((type) => (
            <ChoiceCard
              key={type}
              label={type}
              selected={form.type === type}
              onClick={() => setForm((prev) => ({ ...prev, type }))}
            />
          ))}
        </div>
      </Field>

      <Field label="Вариативность продукта">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {['Простой', 'Вариативный'].map((variability) => (
            <ChoiceCard
              key={variability}
              label={variability}
              selected={form.variability === variability}
              onClick={() => setForm((prev) => ({ ...prev, variability }))}
            />
          ))}
        </div>
      </Field>

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
              onClick={() =>
                setForm((prev) => ({ ...prev, sku: generateSku(prev.name || 'product') }))
              }
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

function VariationsTab() {
  const variantCount = colors.length * sizes.length

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-black text-foreground">Вариации</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <TagField label="Цвет" values={colors} />
        <TagField label="Размер" values={sizes} />
      </div>
      <p className="text-[15px] text-muted-foreground">
        Будет создано <span className="font-bold text-foreground">{variantCount}</span> вариаций товара
      </p>
    </div>
  )
}

function TagField({ label, values }: { label: string; values: string[] }) {
  return (
    <Field label={label}>
      <div className="flex flex-wrap gap-2 rounded-2xl bg-background p-3 ring-1 ring-border">
        {values.map((value) => (
          <span
            key={value}
            className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-[14px] font-semibold text-primary"
          >
            {value}
            <X className="size-3.5" />
          </span>
        ))}
        <input
          placeholder="Добавить"
          className="min-w-24 flex-1 bg-transparent px-2 text-[15px] outline-none"
        />
      </div>
    </Field>
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
      <div className="grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2">
        <Field label="Стартовый остаток">
          <MoneyInput
            value={form.stock}
            suffix={form.unit}
            onChange={(stock) => setForm((prev) => ({ ...prev, stock }))}
          />
        </Field>
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

export function ProductCreate() {
  const router = useRouter()
  const { categories, brands, suppliers, units } = useProductReferences()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>(() => createInitialForm(categories[0] ?? ''))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!form.category && categories[0]) {
      setForm((prev) => ({ ...prev, category: categories[0] }))
    }
  }, [categories, form.category])

  function saveProduct() {
    const name = form.name.trim()
    const sku = form.sku.trim() || generateSku(name || 'product')
    const barcode = form.barcode.trim() || generateBarcode()
    const price = parseMoney(form.salePrice)
    const category = form.category.trim()
    const brand = form.brand.trim()

    if (!name) {
      setError('Заполните наименование товара.')
      setStep(0)
      return
    }

    if (!price) {
      setError('Укажите цену продажи.')
      setStep(2)
      return
    }

    if (!category) {
      setError('Укажите категорию товара.')
      setStep(4)
      return
    }

    try {
      const categoryReference = findCategoryReference({ name: category })
      const brandReference = brand ? findBrandReference({ name: brand }) : null
      if (!categoryReference) throw new Error('Выберите действующую категорию из справочника.')
      if (brand && !brandReference) throw new Error('Выберите действующий бренд из справочника.')
      createProduct({
        name,
        sku,
        barcode,
        category,
        categoryId: categoryReference.id,
        brand,
        brandId: brandReference?.id,
        supplier: form.supplier.trim(),
        unit: form.unit,
        price,
        wholesalePrice: parseMoney(form.wholesalePrice),
        stock: parseMoney(form.stock),
        lowStockThreshold: parseMoney(form.lowStockThreshold),
        status: 'active',
      })
      setError('')
      router.push('/tovary')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось создать товар.')
    }
  }

  return (
    <div className="space-y-8">
      <DetailHeader
        title="Новый продукт"
        backHref="/tovary"
        actions={<PrimaryButton onClick={saveProduct}>Создать</PrimaryButton>}
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
          {step === 1 ? <VariationsTab /> : null}
          {step === 2 ? <PricesTab form={form} setForm={setForm} /> : null}
          {step === 3 ? <StockTab form={form} setForm={setForm} /> : null}
          {step === 4 ? (
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
                onClick={saveProduct}
                className="rounded-2xl bg-primary px-10 py-3.5 text-[15px] font-semibold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
              >
                Создать
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

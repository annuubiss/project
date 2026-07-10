'use client'

import { useEffect, useState } from 'react'
import { Plus, Settings2, Trash2, X } from 'lucide-react'
import {
  PRODUCT_REFERENCES_CHANGED,
  createCategory,
  deleteCategory,
  readCategories,
  type ProductCategory,
} from '@/lib/erp/categories'
import { ERP_DATA_CHANGED } from '@/lib/erp/erp-store'
import {
  archiveProductUnit,
  createProductUnit,
  defaultProductUnits,
  readProductUnits,
  type ProductUnit,
} from '@/lib/erp/product-units'

type UnitSetting = ProductUnit

const defaultUnits: UnitSetting[] = defaultProductUnits

function readUnits() {
  return readProductUnits()
}

export function ProductSettings() {
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [units, setUnits] = useState<UnitSetting[]>(defaultUnits)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [showUnitForm, setShowUnitForm] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [newUnit, setNewUnit] = useState('')
  const [error, setError] = useState('')

  const load = () => {
    setCategories(readCategories())
    setUnits(readUnits())
  }

  useEffect(() => {
    load()
    window.addEventListener(PRODUCT_REFERENCES_CHANGED, load)
    window.addEventListener(ERP_DATA_CHANGED, load)
    window.addEventListener('storage', load)

    return () => {
      window.removeEventListener(PRODUCT_REFERENCES_CHANGED, load)
      window.removeEventListener(ERP_DATA_CHANGED, load)
      window.removeEventListener('storage', load)
    }
  }, [])

  function handleAddCategory() {
    try {
      createCategory({ name: newCategory })
      setNewCategory('')
      setShowCategoryForm(false)
      setError('')
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось добавить категорию.')
    }
  }

  function handleAddUnit() {
    const label = newUnit.trim()
    if (!label) return
    try {
      const symbol = label.toLowerCase().replace(/[^a-zа-яё0-9]/gi, '').slice(0, 8)
      createProductUnit({ label, symbol })
      setUnits(readProductUnits())
      setNewUnit('')
      setShowUnitForm(false)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось добавить единицу измерения.')
    }
  }

  function removeUnit(id: string) {
    try {
      archiveProductUnit(id)
      setUnits(readProductUnits())
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось удалить единицу измерения.')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-foreground">Настройки товаров</h2>
        <p className="mt-1 text-[15px] text-muted-foreground">
          Управляйте категориями и единицами измерения
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl bg-destructive/10 px-5 py-4 text-[15px] font-semibold text-destructive ring-1 ring-destructive/20">
          {error}
        </div>
      ) : null}

      <div className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-foreground">Категории</h3>
          <button
            onClick={() => setShowCategoryForm(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-[14px] font-semibold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
          >
            <Plus className="size-4" />
            Добавить
          </button>
        </div>

        {showCategoryForm ? (
          <div className="mb-4 flex gap-3 rounded-xl bg-secondary p-3">
            <input
              autoFocus
              value={newCategory}
              onChange={(event) => setNewCategory(event.target.value)}
              placeholder="Название категории"
              className="flex-1 rounded-xl bg-background px-3 text-[15px] outline-none ring-1 ring-border focus:ring-2 focus:ring-primary/40"
            />
            <button
              onClick={handleAddCategory}
              className="rounded-xl bg-primary px-4 py-2 text-[14px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Добавить
            </button>
            <button
              onClick={() => {
                setShowCategoryForm(false)
                setNewCategory('')
              }}
              aria-label="Отмена"
              className="flex size-10 items-center justify-center rounded-xl bg-secondary text-foreground transition-colors hover:bg-accent"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : null}

        <div className="space-y-2">
          {categories.filter((category) => category.status === 'active').map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between rounded-xl bg-secondary px-4 py-3"
            >
              <span className="text-[15px] font-medium text-foreground">{category.name}</span>
              <button
                onClick={() => deleteCategory(category.id)}
                aria-label="Удалить категорию"
                className="text-muted-foreground transition-colors hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-foreground">Единицы измерения</h3>
          <button
            onClick={() => setShowUnitForm(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-[14px] font-semibold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
          >
            <Plus className="size-4" />
            Добавить
          </button>
        </div>

        {showUnitForm ? (
          <div className="mb-4 flex gap-3 rounded-xl bg-secondary p-3">
            <input
              autoFocus
              value={newUnit}
              onChange={(event) => setNewUnit(event.target.value)}
              placeholder="Название единицы"
              className="flex-1 rounded-xl bg-background px-3 text-[15px] outline-none ring-1 ring-border focus:ring-2 focus:ring-primary/40"
            />
            <button
              onClick={handleAddUnit}
              className="rounded-xl bg-primary px-4 py-2 text-[14px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Добавить
            </button>
          </div>
        ) : null}

        <div className="space-y-3">
          {units.map((unit) => (
            <div
              key={unit.id}
              className="flex items-center justify-between rounded-xl bg-secondary px-4 py-3"
            >
              <div>
                <p className="text-[15px] font-medium text-foreground">{unit.label}</p>
                <p className="text-[13px] text-muted-foreground">id: {unit.id}</p>
              </div>
              {unit.system ? (
                <span className="rounded-full bg-primary/10 px-3 py-1 text-[12px] font-semibold text-primary">
                  По умолчанию
                </span>
              ) : (
                <button
                  onClick={() => removeUnit(unit.id)}
                  aria-label="Удалить единицу"
                  className="text-muted-foreground transition-colors hover:text-destructive"
                >
                  <Settings2 className="size-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

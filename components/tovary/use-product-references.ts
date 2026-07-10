'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  getActiveBrandOptions,
  getActiveCategoryOptions,
  PRODUCT_REFERENCES_CHANGED,
} from '@/lib/erp/categories'
import { ERP_DATA_CHANGED, readSuppliers } from '@/lib/erp/erp-store'
import { getActiveProductUnits, PRODUCT_UNITS_CHANGED } from '@/lib/erp/product-units'

export function useProductReferences() {
  const [categories, setCategories] = useState<string[]>([])
  const [brands, setBrands] = useState<string[]>([])
  const [suppliers, setSuppliers] = useState<string[]>([])
  const [units, setUnits] = useState(getActiveProductUnits())

  useEffect(() => {
    function load() {
      setCategories(getActiveCategoryOptions().map((item) => item.name))
      setBrands(getActiveBrandOptions().map((item) => item.name))
      setSuppliers(readSuppliers().map((item) => item.name).filter(Boolean))
      setUnits(getActiveProductUnits())
    }

    load()
    window.addEventListener(PRODUCT_REFERENCES_CHANGED, load)
    window.addEventListener(ERP_DATA_CHANGED, load)
    window.addEventListener('storage', load)
    window.addEventListener(PRODUCT_UNITS_CHANGED, load)

    return () => {
      window.removeEventListener(PRODUCT_REFERENCES_CHANGED, load)
      window.removeEventListener(ERP_DATA_CHANGED, load)
      window.removeEventListener('storage', load)
      window.removeEventListener(PRODUCT_UNITS_CHANGED, load)
    }
  }, [])

  return useMemo(
    () => ({
      categories,
      brands,
      suppliers,
      units,
    }),
    [brands, categories, suppliers, units],
  )
}

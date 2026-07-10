'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { readProducts, type CatalogProduct } from '@/lib/erp/product-catalog'
import { ProductEdit } from '@/components/tovary/product-edit'

export default function ProductEditPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [product, setProduct] = useState<CatalogProduct | null | undefined>(undefined)

  useEffect(() => {
    const found = readProducts().find((p) => p.id === id) ?? null
    setProduct(found)
    if (!found) router.replace('/tovary')
  }, [id, router])

  if (product === undefined) return null
  if (!product) return null

  return <ProductEdit product={product} />
}

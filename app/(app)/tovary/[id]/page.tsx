'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  PRODUCT_CATALOG_CHANGED,
  readProducts,
  type CatalogProduct,
} from '@/lib/erp/product-catalog'
import { ProductDetail, ProductDetailSkeleton } from '@/components/tovary/product-detail'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()

  // undefined = loading, null = not found, CatalogProduct = found
  const [product, setProduct] = useState<CatalogProduct | null | undefined>(undefined)

  useEffect(() => {
    function load() {
      const found = readProducts().find((p) => p.id === params.id) ?? null
      setProduct(found)
    }

    load()

    window.addEventListener(PRODUCT_CATALOG_CHANGED, load)
    window.addEventListener('storage', load)
    return () => {
      window.removeEventListener(PRODUCT_CATALOG_CHANGED, load)
      window.removeEventListener('storage', load)
    }
  }, [params.id])

  // Loading state — show skeleton
  if (product === undefined) {
    return <ProductDetailSkeleton />
  }

  // Not found
  if (product === null) {
    return (
      <div className="space-y-6">
        <Link
          href="/tovary"
          className="inline-flex items-center gap-2 text-[15px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-5" />
          Назад к каталогу
        </Link>
        <div className="flex min-h-[400px] items-center justify-center rounded-3xl bg-card shadow-sm ring-1 ring-border">
          <div className="text-center px-6">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
              <ChevronLeft className="size-8" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Товар не найден</h2>
            <p className="mt-2 text-[15px] text-muted-foreground">
              Товара с ID <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[13px]">{params.id}</code> не существует.
            </p>
            <Link
              href="/tovary"
              className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-primary px-8 text-[15px] font-semibold text-primary-foreground shadow-md shadow-primary/30 transition-colors hover:bg-primary/90"
            >
              Открыть каталог
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return <ProductDetail product={product} />
}

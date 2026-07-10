'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Barcode, ChevronLeft } from 'lucide-react'
import { DetailHeadRow, DetailRow, DetailTableCard, QtyInput } from './detail-shared'
import { getInventoryDocument, getWarehouseStock, updateInventoryCounts } from '@/lib/erp/erp-store'
import { readProducts, type CatalogProduct } from '@/lib/erp/product-catalog'

export function InventoryScan({ id }: { id: string }) {
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const document = getInventoryDocument(id)
  useEffect(() => {
    if (!document) return
    setProducts(readProducts().filter((product) => product.status === 'active'))
    setCounts(document.counts)
  }, [id])
  const rows = useMemo(() => products.filter((product) => [product.name, product.sku, product.barcode].some((value) => value.toLowerCase().includes(query.trim().toLowerCase()))), [products, query])
  function setCount(productId: string, value: string) {
    if (!document || document.status === 'completed') return
    const next = { ...counts, [productId]: Math.max(0, Number(value) || 0) }
    try { updateInventoryCounts(id, next); setCounts(next); setError('') } catch (err) { setError(err instanceof Error ? err.message : 'Не удалось сохранить количество.') }
  }
  if (!document) return <div className="rounded-2xl bg-card p-8 text-muted-foreground">Документ инвентаризации не найден.</div>
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6"><div className="flex items-center gap-4"><Link href="/tovary/inventarizaciya" className="flex size-12 items-center justify-center rounded-full bg-card text-muted-foreground shadow-sm ring-1 ring-border"><ChevronLeft className="size-6" /></Link><div><h1 className="text-3xl font-black text-foreground">{document.name}</h1><p className="mt-1 text-muted-foreground">{document.type === 'full' ? 'Полная' : 'Частичная'} инвентаризация · {document.warehouseName}</p></div></div><Link href={`/tovary/inventarizaciya/${id}/result`} className="flex h-14 items-center gap-2 rounded-2xl bg-primary px-8 font-semibold text-primary-foreground">Результаты <ArrowRight className="size-5" /></Link></div>
    {error ? <div className="rounded-2xl bg-destructive/10 px-5 py-4 font-semibold text-destructive">{error}</div> : null}
    <div className="relative"><Barcode className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по штрихкоду, артикулу или названию" className="h-14 w-full rounded-2xl bg-card pl-14 pr-4 shadow-sm ring-1 ring-border outline-none focus:ring-2 focus:ring-primary/40" /></div>
    <DetailTableCard><DetailHeadRow columns={[{ label: 'Товар', className: 'flex-[1.4]' }, { label: 'Артикул' }, { label: 'Штрихкод' }, { label: 'Учёт' }, { label: 'Факт' }]} withSettings={false} />{rows.map((product) => <DetailRow key={product.id}><div className="flex-[1.4] font-semibold text-primary">{product.name}</div><div className="flex-1 text-muted-foreground">{product.sku}</div><div className="flex-1">{product.barcode}</div><div className="flex-1">{getWarehouseStock(product.id, document.warehouseId)} {product.unit}</div><div className="flex-1"><QtyInput value={counts[product.id] === undefined ? '' : String(counts[product.id])} suffix={product.unit} onChange={(value) => setCount(product.id, value)} /></div></DetailRow>)}</DetailTableCard>
  </div>
}

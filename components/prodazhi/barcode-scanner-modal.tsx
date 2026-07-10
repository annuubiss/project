'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ScanLine, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { readProducts, type CatalogProduct } from '@/lib/erp/product-catalog'

export function BarcodeScannerModal({
  open,
  onClose,
  onScan,
}: {
  open: boolean
  onClose: () => void
  onScan: (product: CatalogProduct) => void
}) {
  const [query, setQuery] = useState('')
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(false)
  const [scanSuccess, setScanSuccess] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const scanTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const lastKeypressRef = useRef<number>(0)

  useEffect(() => {
    if (open) {
      setQuery('')
      setError('')
      setScanning(false)
      setScanSuccess(false)
      setProducts(readProducts())
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    function handleScan(scannedCode: string) {
      const product = products.find(
        (p) =>
          p.barcode === scannedCode ||
          p.sku.toLowerCase() === scannedCode.toLowerCase(),
      )

      if (product) {
        setScanSuccess(true)
        setError('')
        setTimeout(() => {
          onScan(product)
          setQuery('')
          setScanSuccess(false)
        }, 600)
      } else {
        setError(`Товар с кодом "${scannedCode}" не найден`)
        setScanning(false)
        setTimeout(() => setError(''), 3000)
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      const now = Date.now()
      const timeSinceLastKey = now - lastKeypressRef.current
      lastKeypressRef.current = now

      // Определяем быстрый ввод от сканера (менее 50ms между символами)
      if (timeSinceLastKey < 50 && query.length === 0) {
        setScanning(true)
      }

      if (e.key === 'Enter' && query.trim()) {
        e.preventDefault()
        clearTimeout(scanTimeoutRef.current)
        handleScan(query.trim())
        return
      }

      // Автоматически сбрасываем режим сканирования после паузы
      clearTimeout(scanTimeoutRef.current)
      scanTimeoutRef.current = setTimeout(() => {
        setScanning(false)
      }, 100)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      clearTimeout(scanTimeoutRef.current)
    }
  }, [open, query, products, onScan])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-card shadow-xl ring-1 ring-border">
        <div className="flex items-center justify-between gap-4 border-b border-border p-6">
          <h2 className="text-2xl font-black text-foreground">Сканирование</h2>
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          {/* Scanning indicator */}
          {scanning && !scanSuccess && (
            <div className="flex items-center justify-center gap-3 rounded-2xl bg-primary/10 px-4 py-6 ring-1 ring-primary/20">
              <ScanLine className="size-6 animate-pulse text-primary" />
              <span className="text-[15px] font-semibold text-primary">
                Сканирование...
              </span>
            </div>
          )}

          {/* Success indicator */}
          {scanSuccess && (
            <div className="flex items-center justify-center gap-3 rounded-2xl bg-success/10 px-4 py-6 ring-1 ring-success/20">
              <Check className="size-6 text-success" />
              <span className="text-[15px] font-semibold text-success">
                Товар найден!
              </span>
            </div>
          )}

          {/* Error */}
          {error && !scanning && !scanSuccess && (
            <div className="rounded-2xl bg-destructive/10 px-4 py-3 text-[14px] font-semibold text-destructive ring-1 ring-destructive/20">
              {error}
            </div>
          )}

          {/* Input */}
          {!scanning && !scanSuccess && (
            <>
              <div className="relative">
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setError('')
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      onClose()
                    }
                  }}
                  placeholder="Отсканируйте штрихкод или введите артикул"
                  className="h-14 w-full rounded-2xl bg-background pl-4 pr-24 text-[15px] text-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary/40"
                />
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-[11px] font-semibold">
                    Enter
                  </span>
                  для поиска
                </div>
              </div>

              {/* Search results */}
              {query.trim() && (
                <div className="space-y-2">
                  {products
                    .filter(
                      (p) =>
                        p.barcode === query.trim() ||
                        p.sku.toLowerCase().includes(query.trim().toLowerCase()) ||
                        p.name.toLowerCase().includes(query.trim().toLowerCase()),
                    )
                    .slice(0, 5)
                    .map((product) => (
                      <button
                        key={product.id}
                        onClick={() => {
                          onScan(product)
                          setQuery('')
                        }}
                        className="flex w-full items-center gap-3 rounded-2xl bg-secondary px-4 py-3 text-left transition-colors hover:bg-accent"
                      >
                        <span className="flex size-10 items-center justify-center rounded-xl bg-card text-muted-foreground">
                          <span className="text-[13px] font-semibold">
                            {product.sku}
                          </span>
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px] font-semibold text-foreground">
                            {product.name}
                          </p>
                          <p className="text-[13px] text-muted-foreground">
                            {product.barcode}
                          </p>
                        </div>
                        <span className="text-[15px] font-bold text-primary">
                          {product.price.toLocaleString('ru-RU')} UZS
                        </span>
                      </button>
                    ))}
                  {products.filter(
                    (p) =>
                      p.barcode === query.trim() ||
                      p.sku.toLowerCase().includes(query.trim().toLowerCase()) ||
                      p.name.toLowerCase().includes(query.trim().toLowerCase()),
                  ).length === 0 && (
                    <div className="rounded-2xl bg-secondary px-4 py-6 text-center text-[15px] text-muted-foreground">
                      Товар не найден
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <div className="rounded-2xl bg-secondary/60 px-4 py-3 text-center text-[13px] text-muted-foreground">
            USB-сканер работает автоматически. Просто отсканируйте штрихкод.
          </div>
        </div>
      </div>
    </div>
  )
}

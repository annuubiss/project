'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Upload, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { EmptyState, PageHeader, Pagination, StatusBadge, TableCard, TableHeadRow, TableRow, Toolbar } from './shared'
import { createProductImportSession, PRODUCT_IMPORTS_CHANGED, readProductImportSessions, type ProductImportSession } from '@/lib/erp/product-import'

const columns = [
  { label: 'Файл', className: 'flex-[1.5]' }, { label: 'Строки' },
  { label: 'Ошибки' }, { label: 'Статус' }, { label: 'Дата' },
]

export function Import() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [sessions, setSessions] = useState<ProductImportSession[]>([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const load = () => setSessions(readProductImportSessions())
  useEffect(() => { load(); window.addEventListener(PRODUCT_IMPORTS_CHANGED, load); return () => window.removeEventListener(PRODUCT_IMPORTS_CHANGED, load) }, [])
  const filtered = useMemo(() => sessions.filter((item) => item.fileName.toLowerCase().includes(query.toLowerCase())), [sessions, query])

  async function selectFile(file?: File) {
    if (!file) return
    try {
      if (!file.name.toLowerCase().endsWith('.csv')) throw new Error('Выберите файл CSV.')
      const session = createProductImportSession(file.name, await file.text())
      setError('')
      router.push(`/tovary/import/${session.id}`)
    } catch (err) { setError(err instanceof Error ? err.message : 'Не удалось прочитать файл.') }
  }

  return <div className="space-y-6">
    <PageHeader title="Импорт товаров" />
    <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => void selectFile(event.target.files?.[0])} />
    <Toolbar placeholder="Название файла" query={query} onQueryChange={setQuery} actionLabel="Новый импорт" actionIcon={<Plus className="size-5" />} onAction={() => inputRef.current?.click()} />
    {error ? <div className="rounded-2xl bg-destructive/10 px-5 py-4 font-semibold text-destructive">{error}</div> : null}
    {!filtered.length ? <div className="rounded-3xl bg-card shadow-sm ring-1 ring-border"><EmptyState title="Импортов пока нет" description="Загрузите CSV-файл с товарами для проверки перед добавлением в каталог." /></div> :
      <TableCard><TableHeadRow columns={columns} />{filtered.map((session) => {
        const errors = session.rows.reduce((sum, row) => sum + row.errors.length, 0)
        return <TableRow key={session.id}>
          <div className="flex-[1.5]"><Link className="flex items-center gap-2 font-semibold text-primary hover:underline" href={`/tovary/import/${session.id}`}><Upload className="size-4" />{session.fileName}</Link></div>
          <div className="flex-1">{session.rows.length}</div>
          <div className="flex flex-1 items-center gap-2">{errors ? <AlertTriangle className="size-4 text-destructive" /> : <CheckCircle2 className="size-4 text-primary" />}{errors}</div>
          <div className="flex-1"><StatusBadge label={session.status === 'completed' ? 'Завершён' : 'Проверка'} tone={session.status === 'completed' ? 'success' : 'warning'} /></div>
          <div className="flex-1 text-muted-foreground">{new Date(session.createdAt).toLocaleString('ru-RU')}</div>
        </TableRow>
      })}</TableCard>}
    <Pagination pages={1} total={filtered.length} />
  </div>
}

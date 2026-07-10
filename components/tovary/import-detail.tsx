'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { DetailHeader, DetailHeadRow, DetailRow, DetailTableCard, GhostButton, PrimaryButton, StatCard } from './detail-shared'
import { commitProductImport, getProductImportSession, type ProductImportSession } from '@/lib/erp/product-import'

const columns = [
  { label: 'Строка', className: 'max-w-[80px]' }, { label: 'Наименование', className: 'flex-[1.4]' },
  { label: 'Артикул' }, { label: 'Штрихкод' }, { label: 'Категория' }, { label: 'Цена' }, { label: 'Проверка' },
]

export function ImportDetail({ id }: { id: string }) {
  const router = useRouter()
  const [session, setSession] = useState<ProductImportSession | null>(null)
  const [error, setError] = useState('')
  useEffect(() => setSession(getProductImportSession(id)), [id])
  if (!session) return <div className="rounded-2xl bg-card p-8 text-muted-foreground">Импорт не найден.</div>
  const errorCount = session.rows.reduce((sum, row) => sum + row.errors.length, 0)
  function commit() {
    try { commitProductImport(id); setSession(getProductImportSession(id)); setError('') }
    catch (err) { setError(err instanceof Error ? err.message : 'Не удалось выполнить импорт.') }
  }
  return <div className="space-y-6">
    <DetailHeader title={session.fileName} subtitle="Предварительная проверка товаров" backHref="/tovary/import" actions={<>
      {errorCount ? <GhostButton onClick={() => router.push(`/tovary/import/${id}/errors`)} tone="danger">Ошибки ({errorCount})</GhostButton> : null}
      <PrimaryButton onClick={commit} disabled={Boolean(errorCount) || session.status === 'completed'}>{session.status === 'completed' ? 'Импорт завершён' : 'Добавить в каталог'}</PrimaryButton>
    </>} />
    {error ? <div className="rounded-2xl bg-destructive/10 px-5 py-4 font-semibold text-destructive">{error}</div> : null}
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3"><StatCard label="Строк" value={String(session.rows.length)} icon={<CheckCircle2 className="size-6" />} /><StatCard label="Готово" value={String(session.rows.filter((row) => !row.errors.length).length)} icon={<CheckCircle2 className="size-6" />} /><StatCard label="Ошибок" value={String(errorCount)} icon={<AlertTriangle className="size-6" />} /></div>
    <DetailTableCard><DetailHeadRow columns={columns} withSettings={false} />{session.rows.map((row) => <DetailRow key={row.row}>
      <div className="max-w-[80px] flex-1">{row.row}</div><div className="flex-[1.4] font-semibold">{row.draft.name || '—'}</div><div className="flex-1">{row.draft.sku || '—'}</div><div className="flex-1">{row.draft.barcode || '—'}</div><div className="flex-1">{row.draft.category || '—'}</div><div className="flex-1">{row.draft.price.toLocaleString('ru-RU')}</div><div className={row.errors.length ? 'flex-1 text-destructive' : 'flex-1 text-primary'}>{row.errors.length ? `${row.errors.length} ошибок` : 'Готово'}</div>
    </DetailRow>)}</DetailTableCard>
  </div>
}

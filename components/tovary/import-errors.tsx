'use client'

import { useEffect, useState } from 'react'
import { DetailHeader, DetailHeadRow, DetailRow, DetailTableCard } from './detail-shared'
import { EmptyState } from './shared'
import { getProductImportSession, type ProductImportError } from '@/lib/erp/product-import'

export function ImportErrors({ id }: { id: string }) {
  const [errors, setErrors] = useState<ProductImportError[]>([])
  useEffect(() => setErrors(getProductImportSession(id)?.rows.flatMap((row) => row.errors) ?? []), [id])
  return <div className="space-y-6">
    <DetailHeader title="Ошибки импорта" subtitle={`${errors.length} ошибок`} backHref={`/tovary/import/${id}`} />
    {!errors.length ? <EmptyState title="Ошибок нет" description="Файл готов к добавлению в каталог." /> : <DetailTableCard>
      <DetailHeadRow columns={[{ label: 'Строка', className: 'max-w-[100px]' }, { label: 'Поле', className: 'max-w-[180px]' }, { label: 'Описание' }]} withSettings={false} />
      {errors.map((error, index) => <DetailRow key={`${error.row}-${error.field}-${index}`}><div className="max-w-[100px] flex-1 font-semibold">{error.row}</div><div className="max-w-[180px] flex-1 text-muted-foreground">{error.field || 'Строка'}</div><div className="flex-1 font-semibold text-destructive">{error.message}</div></DetailRow>)}
    </DetailTableCard>}
  </div>
}

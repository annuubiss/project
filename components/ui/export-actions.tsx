'use client'

import { Download, FileSpreadsheet, FileJson2 } from 'lucide-react'

type Props = {
  onCsv?: () => void
  onExcel?: () => void
  onJson?: () => void
}

export function ExportActions({ onCsv, onExcel, onJson }: Props) {
  if (!onCsv && !onExcel && !onJson) return null

  return (
    <div className="flex items-center gap-2">
      {onCsv ? (
        <button
          onClick={onCsv}
          className="flex h-10 items-center gap-2 rounded-xl bg-card px-4 text-[14px] font-semibold text-foreground shadow-sm ring-1 ring-border transition-colors hover:bg-secondary"
        >
          <FileSpreadsheet className="size-4 text-primary" />
          CSV
        </button>
      ) : null}

      {onExcel ? (
        <button
          onClick={onExcel}
          className="flex h-10 items-center gap-2 rounded-xl bg-card px-4 text-[14px] font-semibold text-foreground shadow-sm ring-1 ring-border transition-colors hover:bg-secondary"
        >
          <Download className="size-4 text-primary" />
          Excel
        </button>
      ) : null}

      {onJson ? (
        <button
          onClick={onJson}
          className="flex h-10 items-center gap-2 rounded-xl bg-card px-4 text-[14px] font-semibold text-foreground shadow-sm ring-1 ring-border transition-colors hover:bg-secondary"
        >
          <FileJson2 className="size-4 text-primary" />
          JSON
        </button>
      ) : null}
    </div>
  )
}

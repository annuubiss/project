/**
 * Export utilities for CSV, Excel-compatible XLS, and JSON files.
 */

export type ExportColumn<T> = {
  header: string
  key: keyof T
  format?: (value: unknown, row: T) => string
}

/** Convert array of objects to CSV string with UTF-8 BOM for Excel compatibility. */
export function toCsv<T extends object>(
  rows: T[],
  columns: ExportColumn<T>[],
): string {
  const bom = '\uFEFF'
  const headers = columns.map((col) => escapeCsvCell(col.header)).join(';')

  const lines = rows.map((row) =>
    columns
      .map((col) => {
        const raw = row[col.key]
        const value = col.format ? col.format(raw, row) : String(raw ?? '')
        return escapeCsvCell(value)
      })
      .join(';'),
  )

  return bom + [headers, ...lines].join('\r\n')
}

/** Build a minimal Excel-compatible HTML table document and save as .xls. */
export function toExcelTable<T extends object>(
  rows: T[],
  columns: ExportColumn<T>[],
  sheetName = 'Sheet1',
): string {
  const headerRow = columns
    .map((col) => `<th>${escapeHtml(col.header)}</th>`)
    .join('')

  const bodyRows = rows
    .map((row) => {
      const cells = columns
        .map((col) => {
          const raw = row[col.key]
          const value = col.format ? col.format(raw, row) : String(raw ?? '')
          return `<td>${escapeHtml(value)}</td>`
        })
        .join('')

      return `<tr>${cells}</tr>`
    })
    .join('')

  return `<!doctype html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <meta charset="utf-8" />
    <meta name="ProgId" content="Excel.Sheet" />
    <meta name="Generator" content="ERP Export" />
    <title>${escapeHtml(sheetName)}</title>
  </head>
  <body>
    <table border="1">
      <thead>
        <tr>${headerRow}</tr>
      </thead>
      <tbody>
        ${bodyRows}
      </tbody>
    </table>
  </body>
</html>`
}

function escapeCsvCell(value: string): string {
  const str = String(value ?? '')
  if (str.includes(';') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function escapeHtml(value: string): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

/** Trigger browser download of a text file. */
export function downloadFile(
  content: string,
  filename: string,
  mimeType = 'text/csv;charset=utf-8;',
): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/** Export rows as CSV and trigger download. */
export function exportCsv<T extends object>(
  rows: T[],
  columns: ExportColumn<T>[],
  filename: string,
): void {
  const csv = toCsv(rows, columns)
  downloadFile(csv, filename.endsWith('.csv') ? filename : `${filename}.csv`)
}

/** Export rows as an Excel-compatible .xls file. */
export function exportExcel<T extends object>(
  rows: T[],
  columns: ExportColumn<T>[],
  filename: string,
  sheetName?: string,
): void {
  const html = toExcelTable(rows, columns, sheetName)
  downloadFile(
    html,
    filename.endsWith('.xls') ? filename : `${filename}.xls`,
    'application/vnd.ms-excel;charset=utf-8;',
  )
}

/** Export arbitrary data as JSON. */
export function exportJson(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2)
  downloadFile(
    json,
    filename.endsWith('.json') ? filename : `${filename}.json`,
    'application/json',
  )
}

/** Format date for export filenames: 2026-07-10 */
export function exportDateStamp(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Backup & restore: full localStorage snapshot as JSON.
 * All ERP keys are collected, serialized, and can be restored atomically.
 */

import { downloadFile, exportDateStamp } from './export'

const ERP_KEYS = [
  'erp.productCatalog.v1',
  'erp.sales.v1',
  'erp.clients.v1',
  'erp.debts.v1',
  'erp.financeCategories.v1',
  'erp.financeTransactions.v1',
  'erp.cashRegisters.v1',
  'erp.paymentMethods.v1',
  'erp.currencySettings.v1',
  'erp.financeShifts.v1',
  'erp.financeTransfers.v1',
  'erp.financeConversions.v1',
  'erp.cashShifts.v1',
  'erp.suppliers.v1',
  'erp.purchaseOrders.v1',
  'erp.supplierPayments.v1',
  'erp.purchaseReturns.v1',
  'erp.warehouseStocks.v1',
  'erp.inventoryMovements.v1',
  'erp.employees.v1',
  'erp.roles.v1',
  'erp.categories.v1',
  'erp.brands.v1',
  'erp.profileSettings.v1',
  'erp.companySettings.v1',
  'erp.storeSettings.v1',
  'erp.productSettings.v1',
  'erp.productUnits.v1',
  'erp.receiptSettings.v1',
  'erp.notificationSettings.v1',
  'erp.appSettings.v1',
  'erp.clientGroups.v1',
  'erp.loyaltySettings.v1',
]

export type BackupMeta = {
  version: number
  createdAt: string
  keys: string[]
}

export type BackupFile = {
  meta: BackupMeta
  data: Record<string, unknown>
}

/** Create a full backup of all ERP data from localStorage */
export function createBackup(): BackupFile {
  const data: Record<string, unknown> = {}

  for (const key of ERP_KEYS) {
    const raw = localStorage.getItem(key)
    if (raw) {
      try {
        data[key] = JSON.parse(raw)
      } catch {
        data[key] = raw
      }
    }
  }

  return {
    meta: {
      version: 1,
      createdAt: new Date().toISOString(),
      keys: Object.keys(data),
    },
    data,
  }
}

/** Download backup as JSON file */
export function downloadBackup(): void {
  const backup = createBackup()
  const json = JSON.stringify(backup, null, 2)
  downloadFile(
    json,
    `erp-backup-${exportDateStamp()}.json`,
    'application/json',
  )
}

export type RestoreResult = {
  success: boolean
  restoredKeys: string[]
  error?: string
}

/** Restore all ERP data from a backup file */
export function restoreBackup(file: BackupFile): RestoreResult {
  try {
    if (!file?.meta || !file?.data) {
      return { success: false, restoredKeys: [], error: 'Неверный формат файла резервной копии.' }
    }

    if (file.meta.version !== 1) {
      return { success: false, restoredKeys: [], error: `Неподдерживаемая версия резервной копии: ${file.meta.version}.` }
    }

    const restoredKeys: string[] = []

    for (const [key, value] of Object.entries(file.data)) {
      if (!ERP_KEYS.includes(key)) continue
      localStorage.setItem(key, JSON.stringify(value))
      restoredKeys.push(key)
    }

    // Notify all listeners
    window.dispatchEvent(new CustomEvent('erp:data-changed'))
    window.dispatchEvent(new CustomEvent('erp:product-catalog-changed'))

    return { success: true, restoredKeys }
  } catch (err) {
    return {
      success: false,
      restoredKeys: [],
      error: err instanceof Error ? err.message : 'Не удалось восстановить данные.',
    }
  }
}

/** Parse a JSON file from File input and restore */
export async function restoreFromFile(file: File): Promise<RestoreResult> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const backup = JSON.parse(event.target?.result as string) as BackupFile
        resolve(restoreBackup(backup))
      } catch {
        resolve({ success: false, restoredKeys: [], error: 'Не удалось прочитать файл.' })
      }
    }
    reader.onerror = () =>
      resolve({ success: false, restoredKeys: [], error: 'Ошибка чтения файла.' })
    reader.readAsText(file)
  })
}

/** Get localStorage usage stats */
export function getStorageStats(): { usedKb: number; usedPercent: number; itemCount: number } {
  let totalBytes = 0
  let itemCount = 0

  for (const key of ERP_KEYS) {
    const raw = localStorage.getItem(key)
    if (raw) {
      totalBytes += key.length + raw.length
      itemCount++
    }
  }

  // localStorage limit is ~5MB = 5_242_880 bytes
  const limit = 5_242_880
  return {
    usedKb: Math.round(totalBytes / 1024),
    usedPercent: Math.round((totalBytes / limit) * 100),
    itemCount,
  }
}

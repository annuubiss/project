import { InventoryScan } from '@/components/tovary/inventory-scan'

export default async function InventoryScanPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <InventoryScan id={id} />
}

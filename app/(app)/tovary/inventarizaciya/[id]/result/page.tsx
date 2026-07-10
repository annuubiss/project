import { InventoryResult } from '@/components/tovary/inventory-result'

export default async function InventoryResultPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <InventoryResult id={id} />
}

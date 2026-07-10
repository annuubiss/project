import { SupplierDetail } from '@/components/tovary/supplier-detail'

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <SupplierDetail id={id} />
}

import { OrderDetail } from '@/components/tovary/order-detail'

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <OrderDetail id={id} />
}

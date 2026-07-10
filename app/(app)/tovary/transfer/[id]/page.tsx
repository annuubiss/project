import { TransferDetail } from '@/components/tovary/transfer-detail'

export default async function TransferDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { id } = await params
  const query = await searchParams
  const from = Array.isArray(query.from) ? query.from[0] : query.from
  const product = Array.isArray(query.product) ? query.product[0] : query.product
  const qty = Array.isArray(query.qty) ? query.qty[0] : query.qty
  const returnTo = Array.isArray(query.returnTo) ? query.returnTo[0] : query.returnTo

  return (
    <TransferDetail
      id={id}
      initialProductId={product}
      initialQty={qty}
      initialSourceWarehouseId={from}
      returnHref={returnTo}
    />
  )
}

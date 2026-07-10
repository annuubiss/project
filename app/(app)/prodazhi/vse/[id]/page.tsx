import { SaleDetailPage } from '@/components/prodazhi/sale-detail-page'

type Params = Promise<{ id: string }>

export default async function SaleDetailRoute(props: { params: Params }) {
  const params = await props.params
  return <SaleDetailPage saleId={params.id} />
}

import { OrderCreate } from '@/components/tovary/order-create'

export default async function OrderCreatePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams

  return (
    <OrderCreate
      supplier={typeof params.supplier === 'string' ? params.supplier : undefined}
      store={typeof params.store === 'string' ? params.store : undefined}
      name={typeof params.name === 'string' ? params.name : undefined}
      date={typeof params.date === 'string' ? params.date : undefined}
    />
  )
}

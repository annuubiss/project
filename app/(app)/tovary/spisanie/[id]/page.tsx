import { WriteOffDetail } from '@/components/tovary/write-off-detail'

export default async function WriteOffDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <WriteOffDetail id={id} />
}

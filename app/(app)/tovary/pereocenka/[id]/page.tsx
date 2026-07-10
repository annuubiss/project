import { RevaluationDetail } from '@/components/tovary/revaluation-detail'

export default async function RevaluationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <RevaluationDetail id={id} />
}

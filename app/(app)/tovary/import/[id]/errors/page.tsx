import { ImportErrors } from '@/components/tovary/import-errors'

export default async function ImportErrorsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ImportErrors id={id} />
}

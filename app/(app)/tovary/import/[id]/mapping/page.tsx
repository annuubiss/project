import { redirect } from 'next/navigation'

export default async function ImportMappingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/tovary/import/${id}`)
}

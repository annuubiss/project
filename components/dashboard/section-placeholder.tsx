import { Construction } from 'lucide-react'

export function SectionPlaceholder({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">{title}</h1>
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl bg-card px-6 py-16 text-center shadow-sm ring-1 ring-border">
        <span className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Construction className="size-8" />
        </span>
        <h2 className="text-xl font-bold text-foreground">Раздел в разработке</h2>
        <p className="mt-2 max-w-md text-[15px] text-muted-foreground">
          {description ?? 'Этот раздел скоро будет доступен.'}
        </p>
      </div>
    </div>
  )
}

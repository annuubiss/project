import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ReportCard = {
  title: string
  description: string
  dot: 'blue' | 'purple' | 'green' | 'yellow' | 'teal'
  href?: string
}

const dotColors: Record<ReportCard['dot'], string> = {
  blue: 'bg-primary',
  purple: 'bg-chart-2',
  green: 'bg-chart-4',
  yellow: 'bg-chart-3',
  teal: 'bg-chart-5',
}

export function ReportsGrid({
  title,
  cards,
}: {
  title: string
  cards: ReportCard[]
}) {
  return (
    <div>
      <h1 className="mb-8 text-3xl font-black tracking-tight text-foreground text-balance">
        {title}
      </h1>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <article
            key={card.title}
            className="group flex flex-col rounded-3xl border border-border bg-card p-7 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
          >
            <div className="mb-4 flex items-start justify-between">
              <span className="text-[13px] font-medium text-muted-foreground">
                Отчет
              </span>
              <span className={cn('size-3.5 rounded-full', dotColors[card.dot])} />
            </div>

            <h2 className="mb-4 text-xl font-bold text-foreground">
              {card.title}
            </h2>

            <p className="mb-8 flex-1 text-[15px] leading-relaxed text-muted-foreground">
              {card.description}
            </p>

            {card.href ? (
              <Link
                href={card.href}
                className="inline-flex items-center gap-2 text-[15px] font-semibold text-primary transition-colors group-hover:text-primary/80"
              >
                Перейти к отчету
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  )
}

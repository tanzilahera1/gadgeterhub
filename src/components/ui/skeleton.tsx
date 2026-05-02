import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-slate-900/5 dark:bg-slate-50/5",
        "after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_2s_infinite] after:bg-linear-to-r after:from-transparent after:via-white/20 after:to-transparent dark:after:via-white/5",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }

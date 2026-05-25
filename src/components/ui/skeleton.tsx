import { cn } from "@/lib/utils"

/**
 * Skeleton avec effet shimmer.
 * UX P0 (PROPOSITION_UX_FURSA.md §3.6) : remplace l'animate-pulse statique
 * par un degrade qui defile en continu, inspire de Paje Square / Fumba Town.
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-md bg-sand-200 animate-shimmer",
        "bg-[linear-gradient(90deg,#e0dbd3_0%,#f5f0eb_50%,#e0dbd3_100%)] bg-[length:200%_100%]",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }

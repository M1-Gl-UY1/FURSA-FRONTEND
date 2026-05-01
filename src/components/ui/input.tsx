import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-md border-[1.5px] border-sand-400 bg-white px-4 py-3 text-sm font-body text-earth placeholder:text-earth-400 transition-colors",
          "focus-visible:outline-none focus-visible:border-ocean focus-visible:ring-2 focus-visible:ring-ocean/15",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-sand-200",
          "aria-invalid:border-error aria-invalid:focus-visible:border-error aria-invalid:focus-visible:ring-error/15",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }

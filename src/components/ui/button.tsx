import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-body font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean focus-visible:ring-offset-2 focus-visible:ring-offset-sand-50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-terra text-white shadow-brand hover:bg-terra-600 hover:shadow-brand-hover active:bg-terra-700",
        secondary:
          "bg-earth text-white hover:bg-earth-600 active:bg-earth-800",
        outline:
          "border-[1.5px] border-earth bg-transparent text-earth hover:bg-earth hover:text-white",
        ghost:
          "bg-transparent text-terra hover:bg-terra/8",
        link:
          "bg-transparent text-ocean underline-offset-4 hover:underline shadow-none p-0 h-auto",
        destructive:
          "bg-error text-white hover:bg-error/90 active:bg-error/80",
        ocean:
          "bg-ocean text-white hover:bg-ocean-600 active:bg-ocean-700",
      },
      size: {
        sm: "h-9 px-4 text-xs [&_svg]:size-4",
        default: "h-11 px-6 text-sm [&_svg]:size-4",
        lg: "h-[52px] px-8 text-base [&_svg]:size-5",
        icon: "h-10 w-10 [&_svg]:size-5",
        "icon-sm": "h-9 w-9 [&_svg]:size-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

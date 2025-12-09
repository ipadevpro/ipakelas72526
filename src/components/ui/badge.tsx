import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "rounded-full border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "rounded-full border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "rounded-full border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "rounded-full text-foreground",
        success:
          "rounded-full border-transparent bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-100",
        warning:
          "rounded-full border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-100",
        info:
          "rounded-full border-transparent bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-100",
        // Neo-Brutalism + Industrial Minimalism variants
        "industrial-primary":
          "rounded-none border-2 border-industrial-black bg-industrial-black text-industrial-white shadow-brutal-sm",
        "industrial-secondary":
          "rounded-none border-2 border-industrial-black bg-industrial-white text-industrial-black shadow-brutal-sm",
        "industrial-success":
          "rounded-none border-2 border-industrial-green bg-industrial-green text-industrial-black shadow-brutal-sm",
        "industrial-warning":
          "rounded-none border-2 border-industrial-yellow bg-industrial-yellow text-industrial-black shadow-brutal-sm",
        "industrial-danger":
          "rounded-none border-2 border-industrial-bright-red bg-industrial-bright-red text-industrial-white shadow-brutal-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants } 
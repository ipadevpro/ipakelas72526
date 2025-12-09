import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "rounded-md bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "rounded-md hover:bg-accent hover:text-accent-foreground",
        link: "rounded-md text-primary underline-offset-4 hover:underline",
        // Neo-Brutalism + Industrial Minimalism variants (no rounded corners, hard shadows)
        "industrial-primary": "rounded-none bg-industrial-black text-industrial-white border-2 border-industrial-black shadow-brutal hover:bg-industrial-gray hover:shadow-brutal-hover hover:-translate-x-0.5 hover:-translate-y-0.5 active:shadow-brutal-active active:translate-x-0.5 active:translate-y-0.5",
        "industrial-secondary": "rounded-none bg-industrial-white text-industrial-black border-2 border-industrial-black shadow-brutal hover:bg-industrial-light hover:shadow-brutal-hover hover:-translate-x-0.5 hover:-translate-y-0.5 active:shadow-brutal-active active:translate-x-0.5 active:translate-y-0.5",
        "industrial-danger": "rounded-none bg-industrial-bright-red text-industrial-white border-2 border-industrial-bright-red shadow-brutal hover:bg-[#FF5252] hover:shadow-brutal-hover hover:-translate-x-0.5 hover:-translate-y-0.5 active:shadow-brutal-active active:translate-x-0.5 active:translate-y-0.5",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
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
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transition-all active:scale-[0.98]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all",
        outline:
          "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground transition-all",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all",
        ghost: "glass bg-transparent border-none hover:bg-white/10 hover:text-white transition-all",
        link: "text-primary underline-offset-4 hover:underline",
        premium: "bg-gradient-to-r from-primary to-secondary text-white font-bold shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-t border-white/20 hover:scale-[1.02] active:scale-[0.98] transition-all",
        glass: "glass-panel border-white/20 bg-white/5 hover:bg-white/10 text-foreground font-semibold shadow-xl transition-all",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
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
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }

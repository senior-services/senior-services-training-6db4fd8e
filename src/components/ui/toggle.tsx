import * as React from "react"
import * as TogglePrimitive from "@radix-ui/react-toggle"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const toggleVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium ring-offset-background transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground",
  {
    variants: {
      variant: {
        default: "bg-transparent text-sm",
        outline:
          "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground text-sm",
        pill: "bg-transparent rounded-full hover:bg-[hsl(var(--toggle-item-hover))] text-sm data-[state=on]:bg-[hsl(var(--toggle-item-selected))] data-[state=on]:text-[hsl(var(--toggle-item-selected-foreground))] data-[state=on]:font-semibold data-[state=on]:shadow-md transition-all duration-200",
      },
      size: {
        default: "h-10 px-6",
        sm: "h-9 px-2.5", 
        lg: "h-11 px-5",
        pill: "h-8 px-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(toggleVariants({ variant, size, className }))}
    {...props}
  />
))

Toggle.displayName = TogglePrimitive.Root.displayName

export { Toggle, toggleVariants }

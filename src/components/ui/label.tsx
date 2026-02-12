import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const labelVariants = cva(
  "text-base font-medium leading-none",
  {
    variants: {
      mutedOnDisabled: {
        true: "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        false: "peer-disabled:cursor-default peer-disabled:opacity-100",
      },
    },
    defaultVariants: {
      mutedOnDisabled: true,
    },
  }
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, mutedOnDisabled, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants({ mutedOnDisabled }), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }

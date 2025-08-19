import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      // M3 Checkbox - 18px container, 2px border, 2px corner radius
      "peer h-[18px] w-[18px] shrink-0 rounded-checkbox border-2 border-outline bg-surface",
      "hover:bg-primary/8 hover:border-primary",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
      "data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-on-primary",
      "data-[state=indeterminate]:bg-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:text-on-primary",
      "disabled:border-outline/38 disabled:cursor-not-allowed disabled:data-[state=checked]:bg-on-surface/38",
      "transition-all duration-200 ease-out",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-3 w-3" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }

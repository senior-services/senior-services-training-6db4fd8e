import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface SuffixInputProps extends React.ComponentProps<"input"> {
  suffix: string;
}

const SuffixInput = React.forwardRef<HTMLInputElement, SuffixInputProps>(
  ({ suffix, className, ...props }, ref) => {
    return (
      <div className="relative">
        <Input
          ref={ref}
          className={cn("pr-16", className)}
          {...props}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
          {suffix}
        </span>
      </div>
    )
  }
)
SuffixInput.displayName = "SuffixInput"

export { SuffixInput }

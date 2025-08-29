import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Check, AlertTriangle, AlertCircle } from "lucide-react"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 whitespace-nowrap",
  {
    variants: {
      variant: {
        // Solid variants
        default:
          "border-transparent bg-primary text-primary-foreground shadow-sm",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground shadow-sm",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-sm",
        success:
          "border-transparent bg-success text-success-foreground shadow-sm",
        warning:
          "border-transparent bg-warning text-warning-foreground shadow-sm",
        // Hollow variants  
        outline: "text-foreground shadow-sm",
        "hollow-primary":
          "border-primary text-primary bg-transparent shadow-sm",
        "hollow-secondary":
          "border-secondary text-secondary bg-transparent shadow-sm",
        "hollow-destructive":
          "border-destructive text-destructive bg-transparent shadow-sm",
        "hollow-success":
          "border-success text-success bg-transparent shadow-sm",
        "hollow-warning":
          "border-warning text-warning bg-transparent shadow-sm",
        "hollow-plain":
          "border-transparent text-muted-foreground bg-transparent shadow-sm",
        // Ghost variants (like hollow but without borders or shadows)
        "ghost-primary":
          "border-transparent text-primary bg-transparent",
        "ghost-secondary":
          "border-transparent text-secondary bg-transparent",
        "ghost-destructive":
          "border-transparent text-destructive bg-transparent",
        "ghost-success":
          "border-transparent text-success bg-transparent",
        "ghost-warning":
          "border-transparent text-warning bg-transparent",
        "ghost-plain":
          "border-transparent text-muted-foreground bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  showIcon?: boolean;
}

function Badge({ className, variant, showIcon, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {showIcon && (variant === "success" || variant === "hollow-success" || variant === "ghost-success") && (
        <Check className="w-3 h-3 mr-1" />
      )}
      {showIcon && (variant === "destructive" || variant === "hollow-destructive" || variant === "ghost-destructive") && (
        <AlertTriangle className="w-3 h-3 mr-1" />
      )}
      {showIcon && (variant === "warning" || variant === "hollow-warning" || variant === "ghost-warning") && (
        <AlertCircle className="w-3 h-3 mr-1" />
      )}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }

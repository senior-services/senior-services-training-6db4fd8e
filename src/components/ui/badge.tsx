import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Check, AlertTriangle, AlertCircle } from "lucide-react"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 whitespace-nowrap",
  {
    variants: {
      variant: {
        // Solid variants
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        success:
          "border-transparent bg-success text-success-foreground hover:bg-success/80",
        warning:
          "border-transparent bg-warning text-warning-foreground hover:bg-warning/80",
        // Hollow variants  
        outline: "text-foreground",
        "hollow-primary":
          "border-primary text-primary bg-transparent hover:bg-primary/10",
        "hollow-secondary":
          "border-secondary text-secondary bg-transparent hover:bg-secondary/10",
        "hollow-destructive":
          "border-destructive text-destructive bg-transparent hover:bg-destructive/10",
        "hollow-success":
          "border-success text-success bg-transparent hover:bg-success/10",
        "hollow-warning":
          "border-warning text-warning bg-transparent hover:bg-warning/10",
        "hollow-plain":
          "border-transparent text-muted-foreground bg-transparent hover:bg-secondary/10",
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
      {showIcon && (variant === "success" || variant === "hollow-success") && (
        <Check className="w-3 h-3 mr-1" />
      )}
      {showIcon && (variant === "destructive" || variant === "hollow-destructive") && (
        <AlertTriangle className="w-3 h-3 mr-1" />
      )}
      {showIcon && (variant === "warning" || variant === "hollow-warning") && (
        <AlertCircle className="w-3 h-3 mr-1" />
      )}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }

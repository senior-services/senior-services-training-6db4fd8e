import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Check, AlertTriangle, AlertCircle, Shield } from "lucide-react"

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
        tertiary:
          "border-transparent bg-muted text-muted-foreground shadow-sm",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-sm",
        success:
          "border-transparent bg-success text-success-foreground shadow-sm",
        warning:
          "border-transparent bg-warning text-warning-foreground shadow-sm",
        attention:
          "border-transparent bg-attention text-attention-foreground shadow-sm",
        // Hollow variants
        "hollow-primary":
          "border-primary text-primary bg-transparent shadow-sm",
        "hollow-secondary":
          "border-secondary text-secondary bg-transparent shadow-sm",
        "hollow-tertiary":
          "border-muted-foreground text-muted-foreground bg-transparent shadow-sm",
        "hollow-destructive":
          "border-destructive text-destructive bg-transparent shadow-sm",
        "hollow-success":
          "border-success text-success bg-transparent shadow-sm",
        "hollow-warning":
          "border-warning text-warning bg-transparent shadow-sm",
        "hollow-attention":
          "border-attention text-attention bg-transparent shadow-sm",
        // Ghost variants (like hollow but without borders or shadows)
        "ghost-primary":
          "border-transparent text-primary bg-transparent",
        "ghost-secondary":
          "border-transparent text-secondary bg-transparent",
        "ghost-tertiary":
          "border-transparent text-muted-foreground bg-transparent",
        "ghost-destructive":
          "border-transparent text-destructive bg-transparent",
        "ghost-success":
          "border-transparent text-success bg-transparent",
        "ghost-warning":
          "border-transparent text-warning bg-transparent",
        "ghost-attention":
          "border-transparent text-attention bg-transparent",
        // Soft variants (colored text with muted background)
        "soft-primary":
          "border-transparent text-primary bg-primary/10 shadow-sm",
        "soft-secondary":
          "border-transparent text-secondary bg-secondary/10 shadow-sm",
        "soft-tertiary":
          "border-transparent text-muted-foreground bg-muted shadow-sm",
        "soft-destructive":
          "border-transparent text-destructive bg-destructive/10 shadow-sm",
        "soft-success":
          "border-transparent text-success bg-success/10 shadow-sm",
        "soft-warning":
          "border-transparent text-warning bg-warning/10 shadow-sm",
        "soft-attention":
          "border-transparent text-attention bg-attention/10 shadow-sm",
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
      {showIcon && (variant === "success" || variant === "hollow-success" || variant === "ghost-success" || variant === "soft-success") && (
        <Check className="w-3 h-3 mr-1" />
      )}
      {showIcon && (variant === "destructive" || variant === "hollow-destructive" || variant === "ghost-destructive" || variant === "soft-destructive") && (
        <AlertTriangle className="w-3 h-3 mr-1" />
      )}
      {showIcon && (variant === "warning" || variant === "hollow-warning" || variant === "ghost-warning" || variant === "soft-warning") && (
        <AlertCircle className="w-3 h-3 mr-1" />
      )}
      {showIcon && (variant === "attention" || variant === "hollow-attention" || variant === "ghost-attention" || variant === "soft-attention") && (
        <Shield className="w-3 h-3 mr-1" />
      )}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }

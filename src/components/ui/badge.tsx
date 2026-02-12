import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Check, AlertTriangle, AlertCircle, Clock, Info, MessageSquare } from "lucide-react"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 whitespace-nowrap",
  {
    variants: {
      variant: {
        // Solid variants
        default:
          "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        tertiary:
          "border-transparent bg-muted-foreground text-white",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground",
        success:
          "border-transparent bg-success text-success-foreground",
        warning:
          "border-transparent bg-warning text-warning-foreground",
        attention:
          "border-transparent bg-attention text-attention-foreground",
        // Hollow variants
        "hollow-primary":
          "border-primary text-primary bg-background",
        "hollow-secondary":
          "border-secondary text-secondary bg-background",
        "hollow-tertiary":
          "border-muted-foreground text-muted-foreground bg-background",
        "hollow-destructive":
          "border-destructive text-destructive bg-background",
        "hollow-success":
          "border-success text-success bg-background",
        "hollow-warning":
          "border-warning text-warning bg-background",
        "hollow-attention":
          "border-attention text-attention bg-background",
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
          "border-transparent text-primary bg-primary/10",
        "soft-secondary":
          "border-transparent text-secondary bg-secondary/10",
        "soft-tertiary":
          "border-transparent text-muted-foreground bg-muted",
        "soft-destructive":
          "border-transparent text-destructive bg-destructive/10",
        "soft-success":
          "border-transparent text-success bg-success/10",
        "soft-warning":
          "border-transparent text-warning bg-warning/10",
        "soft-attention":
          "border-transparent text-attention bg-attention/10",
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
        <Clock className="w-3 h-3 mr-1" />
      )}
      {showIcon && (variant === "attention" || variant === "hollow-attention" || variant === "ghost-attention" || variant === "soft-attention") && (
        <AlertTriangle className="w-3 h-3 mr-1" />
      )}
      {showIcon && (variant === "default" || variant === "hollow-primary" || variant === "ghost-primary" || variant === "soft-primary") && (
        <Info className="w-3 h-3 mr-1" />
      )}
      {showIcon && (variant === "secondary" || variant === "hollow-secondary" || variant === "ghost-secondary" || variant === "soft-secondary") && (
        <Info className="w-3 h-3 mr-1" />
      )}
      {showIcon && (variant === "tertiary" || variant === "hollow-tertiary" || variant === "ghost-tertiary" || variant === "soft-tertiary") && (
        <MessageSquare className="w-3 h-3 mr-1" />
      )}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Check, AlertTriangle, AlertCircle, Clock, Info, MessageSquare } from "lucide-react"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "badge-base",
  {
    variants: {
      variant: {
        default: "badge-default",
        secondary: "badge-secondary",
        tertiary: "badge-tertiary",
        destructive: "badge-destructive",
        success: "badge-success",
        warning: "badge-warning",
        attention: "badge-attention",
        "hollow-primary": "badge-hollow-primary",
        "hollow-secondary": "badge-hollow-secondary",
        "hollow-tertiary": "badge-hollow-tertiary",
        "hollow-destructive": "badge-hollow-destructive",
        "hollow-success": "badge-hollow-success",
        "hollow-warning": "badge-hollow-warning",
        "hollow-attention": "badge-hollow-attention",
        "ghost-primary": "badge-ghost-primary",
        "ghost-secondary": "badge-ghost-secondary",
        "ghost-tertiary": "badge-ghost-tertiary",
        "ghost-destructive": "badge-ghost-destructive",
        "ghost-success": "badge-ghost-success",
        "ghost-warning": "badge-ghost-warning",
        "ghost-attention": "badge-ghost-attention",
        "soft-primary": "badge-soft-primary",
        "soft-secondary": "badge-soft-secondary",
        "soft-tertiary": "badge-soft-tertiary",
        "soft-destructive": "badge-soft-destructive",
        "soft-success": "badge-soft-success",
        "soft-warning": "badge-soft-warning",
        "soft-attention": "badge-soft-attention",
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

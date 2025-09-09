import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X, Info, AlertTriangle, CheckCircle, XCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "./button"

const bannerVariants = cva(
  "relative w-full rounded-lg border p-4 shadow-card hover:shadow-lg transition-shadow duration-300 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        info: "bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950/20 dark:text-blue-100 dark:border-blue-900/50",
        success: "bg-green-50 text-green-900 border-green-200 dark:bg-green-950/20 dark:text-green-100 dark:border-green-900/50",
        warning: "bg-yellow-50 text-yellow-900 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-100 dark:border-yellow-900/50",
        error: "bg-red-50 text-red-900 border-red-200 dark:bg-red-950/20 dark:text-red-100 dark:border-red-900/50",
        destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const iconMap = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  destructive: XCircle,
  default: Info,
}

export interface BannerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof bannerVariants> {
  title?: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  showIcon?: boolean
  dismissible?: boolean
  onDismiss?: () => void
  actions?: React.ReactNode
}

const Banner = React.forwardRef<HTMLDivElement, BannerProps>(
  ({ 
    className, 
    variant = "default", 
    title, 
    description, 
    icon: CustomIcon, 
    showIcon = true, 
    dismissible = false, 
    onDismiss, 
    actions, 
    children, 
    ...props 
  }, ref) => {
    const Icon = CustomIcon || iconMap[variant as keyof typeof iconMap] || iconMap.default

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(bannerVariants({ variant }), className)}
        {...props}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            {showIcon && (
              <Icon className="h-5 w-5 mt-0.5 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              {title && (
                <h5 className="mb-1 font-medium leading-none tracking-tight">{title}</h5>
              )}
              {description && (
                <div className="text-sm [&_p]:leading-relaxed opacity-90">{description}</div>
              )}
              {children && (
                <div className="text-sm [&_p]:leading-relaxed">{children}</div>
              )}
              {actions && (
                <div className="mt-3 flex items-center space-x-2">
                  {actions}
                </div>
              )}
            </div>
          </div>
          {dismissible && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-black/10 dark:hover:bg-white/10"
              onClick={onDismiss}
              aria-label="Dismiss banner"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    )
  }
)
Banner.displayName = "Banner"

export { Banner, bannerVariants }
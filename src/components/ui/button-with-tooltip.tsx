import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { TOOLTIP_CONFIG, type TooltipPosition } from "@/constants/tooltip-config";

interface ButtonWithTooltipProps extends ButtonProps {
  tooltip: string;
  tooltipPosition?: TooltipPosition;
  children: React.ReactNode;
}

export const ButtonWithTooltip = React.memo(
  React.forwardRef<HTMLButtonElement, ButtonWithTooltipProps>(
    (
      {
        tooltip,
        tooltipPosition = "top",
        disabled,
        className,
        children,
        onClick,
        ...props
      },
      ref
    ) => {
      // Block keyboard activation on disabled wrapper
      const handleWrapperKeyDown = React.useCallback(
        (e: React.KeyboardEvent) => {
          if (disabled && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
          }
        },
        [disabled]
      );

      return (
        <TooltipProvider>
          <Tooltip delayDuration={TOOLTIP_CONFIG.delayDuration}>
            <TooltipTrigger asChild>
              <span
                className="inline-flex"
                tabIndex={disabled ? 0 : -1}
                role={disabled ? "button" : undefined}
                aria-disabled={disabled || undefined}
                onKeyDown={handleWrapperKeyDown}
              >
                <Button
                  ref={ref}
                  disabled={disabled}
                  onClick={onClick}
                  className={cn(
                    disabled && "pointer-events-none cursor-not-allowed",
                    className
                  )}
                  {...props}
                >
                  {children}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent side={tooltipPosition}>
              <p>{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
  )
);

ButtonWithTooltip.displayName = "ButtonWithTooltip";

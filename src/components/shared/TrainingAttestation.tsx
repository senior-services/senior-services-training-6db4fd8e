import React, { useState } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface TrainingAttestationProps {
  /** Whether the checkbox can be interacted with */
  enabled: boolean;
  /** Current checked state */
  checked: boolean;
  /** Callback when checked state changes */
  onCheckedChange: (checked: boolean) => void;
  /** Tooltip text shown when disabled */
  disabledTooltip: string;
}

/**
 * Shared training attestation component used across all training completion flows.
 * Provides a unified card with title, body text, and attestation checkbox.
 *
 * - Disabled state: transparent background, muted text, tooltip on hover
 * - Enabled state: bg-background, standard border, active checkbox
 */
export function TrainingAttestation({
  enabled,
  checked,
  onCheckedChange,
  disabledTooltip,
}: TrainingAttestationProps) {
  const [a11yAnnouncement, setA11yAnnouncement] = useState('');

  const handleCheckedChange = (value: boolean | 'indeterminate') => {
    const isChecked = value === true;
    onCheckedChange(isChecked);
    setA11yAnnouncement(
      isChecked
        ? 'Training material acknowledgment confirmed.'
        : 'Training material acknowledgment removed.'
    );
  };

  const checkboxId = 'training-attestation-checkbox';

  const content = (
    <div
      id="attestation-section"
      className={cn(
        "border border-border rounded-lg p-6 transition-colors",
        enabled ? "bg-background" : "bg-transparent"
      )}
    >
      {/* Screen reader live region */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {a11yAnnouncement}
      </div>

      <h3 className="form-section-header !mt-0">
        Training Acknowledgment
      </h3>
      <p className={cn(
        "mt-1",
        enabled ? "text-foreground" : "text-muted-foreground"
      )}>
        Please review all training content carefully. By acknowledging, you confirm you've read and understood the material — your confirmation will be recorded for compliance.
      </p>

      <div className="mt-4 flex items-start">
        {!enabled && disabledTooltip ? (
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Checkbox
                  id={checkboxId}
                  checked={checked}
                  disabled
                  onCheckedChange={handleCheckedChange}
                  aria-describedby="attestation-label"
                />
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" align="center" sideOffset={8}>
              <p>{disabledTooltip}</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <Checkbox
            id={checkboxId}
            checked={checked}
            disabled={!enabled}
            onCheckedChange={handleCheckedChange}
            aria-describedby="attestation-label"
          />
        )}
        <Label
          htmlFor={checkboxId}
          id="attestation-label"
          className={cn(
            "font-medium leading-relaxed select-none ml-3",
            enabled
              ? "text-foreground cursor-pointer"
              : "text-muted-foreground cursor-not-allowed"
          )}
          mutedOnDisabled={false}
        >
          I certify that I have read and understood this content.
        </Label>
      </div>
    </div>
  );

  return content;
}

import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type DueDateOption = "1week" | "2weeks" | "1month" | null;

interface DueDateSelectorProps {
  dueDateOption: DueDateOption;
  noDueDateRequired: boolean;
  onSelectionChange: (option: DueDateOption, noDueDate: boolean) => void;
  disabled?: boolean;
  className?: string;
  showLabel?: boolean;
}

/**
 * Calculates a due date based on the selected option
 * Exported for use in components that need the calculated date
 */
export const calculateDueDate = (
  dueDateOption: DueDateOption,
  noDueDateRequired: boolean
): Date | undefined => {
  if (noDueDateRequired) return undefined;

  const today = new Date();
  switch (dueDateOption) {
    case "1week": {
      const date = new Date(today);
      date.setDate(date.getDate() + 7);
      return date;
    }
    case "2weeks": {
      const date = new Date(today);
      date.setDate(date.getDate() + 14);
      return date;
    }
    case "1month": {
      const date = new Date(today);
      date.setMonth(date.getMonth() + 1);
      return date;
    }
    default:
      return undefined;
  }
};

/**
 * Shared due date selector component used by:
 * - AddContentModal (for assign-to-all feature)
 * - AssignVideosModal (for individual assignment)
 */
export const DueDateSelector: React.FC<DueDateSelectorProps> = ({
  dueDateOption,
  noDueDateRequired,
  onSelectionChange,
  disabled = false,
  className,
  showLabel = true,
}) => {
  const handleValueChange = (value: string) => {
    if (value === "none") {
      onSelectionChange(null, true);
    } else {
      onSelectionChange(value as DueDateOption, false);
    }
  };

  const currentValue = noDueDateRequired ? "none" : dueDateOption || "";

  return (
    <div className={cn("space-y-3", className)}>
      {showLabel && (
        <Label className="font-medium">Select due date</Label>
      )}
      <RadioGroup
        value={currentValue}
        onValueChange={handleValueChange}
        disabled={disabled}
        className="space-y-3"
      >
        <div className="flex items-center space-x-3">
          <RadioGroupItem value="1week" id="due-1week" />
          <Label htmlFor="due-1week" className="font-normal cursor-pointer">
            1 week
          </Label>
        </div>
        <div className="flex items-center space-x-3">
          <RadioGroupItem value="2weeks" id="due-2weeks" />
          <Label htmlFor="due-2weeks" className="font-normal cursor-pointer">
            2 weeks
          </Label>
        </div>
        <div className="flex items-center space-x-3">
          <RadioGroupItem value="1month" id="due-1month" />
          <Label htmlFor="due-1month" className="font-normal cursor-pointer">
            1 month
          </Label>
        </div>
        <div className="flex items-center space-x-3">
          <RadioGroupItem value="none" id="due-none" />
          <Label htmlFor="due-none" className="font-normal cursor-pointer">
            No due date required
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
};

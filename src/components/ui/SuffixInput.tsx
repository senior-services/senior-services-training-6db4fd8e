import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SuffixInputProps extends React.ComponentProps<"input"> {
  suffix: string;
}

const SuffixInput = React.forwardRef<HTMLInputElement, SuffixInputProps>(({ className, suffix, ...props }, ref) => {
  return (
    /* Move the className here so the 'relative' box matches the input size */
    <div className={cn("relative flex items-center", className)}>
      <Input
        ref={ref}
        /* Remove 'className' from here, use 'w-full' so it fills the relative box */
        className="pr-16 h-11 w-full"
        {...props}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none whitespace-nowrap">
        {suffix}
      </span>
    </div>
  );
});
SuffixInput.displayName = "SuffixInput";

export { SuffixInput };

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";

// minimal className combiner (shadcn-style)
function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

const RadioGroup = React.forwardRef(
  (
    { className, ...props },
    ref
  ) => {
    return (
      <RadioGroupPrimitive.Root
        className={cn("grid gap-2", className)}
        {...props}
        ref={ref}
      />
    );
  }
);
RadioGroup.displayName = "RadioGroup";

const RadioGroupItem = React.forwardRef(
  (
    { className, ...props },
    ref
  ) => {
    return (
      <RadioGroupPrimitive.Item
        ref={ref}
        className={cn(
          // M3 Radio Button - 16px container with 2px stroke (smaller like reference)
          "relative h-4 w-4 rounded-full border-2 border-input bg-transparent ring-offset-background",
          "hover:border-primary/80 hover:bg-primary/10",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "data-[state=checked]:border-primary data-[state=checked]:text-primary",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-all duration-200 ease-out",
          className
        )}
        {...props}
      >
        <RadioGroupPrimitive.Indicator className="absolute inset-0 flex items-center justify-center">
          <div className="h-1.5 w-1.5 rounded-full bg-current" />
        </RadioGroupPrimitive.Indicator>
      </RadioGroupPrimitive.Item>
    );
  }
);
RadioGroupItem.displayName = "RadioGroupItem";

// --- Demo ---
export default function DemoRadioGroup() {
  const [plan, setPlan] = React.useState("basic");

  const options = [
    { id: "r-basic", value: "basic", label: "Basic" },
    { id: "r-standard", value: "standard", label: "Standard" },
    { id: "r-premium", value: "premium", label: "Premium" },
  ];

  return (
    <div className="min-h-[60vh] w-full grid place-items-center bg-background p-6">
      <div className="w-full max-w-md rounded-2xl border bg-card shadow-sm p-6">
        <h2 className="text-xl font-semibold tracking-tight">Choose a plan</h2>
        <p className="text-sm text-muted-foreground mb-4">Radix Radio Group demo</p>

        <RadioGroup
          className="grid gap-4"
          value={plan}
          onValueChange={setPlan}
          aria-label="Pricing plan"
        >
          {options.map((opt) => (
            <label
              key={opt.value}
              htmlFor={opt.id}
              className="flex items-center gap-3 rounded-xl border px-4 py-3 hover:bg-accent cursor-pointer"
            >
              <RadioGroupItem id={opt.id} value={opt.value} />
              <span className="text-sm font-medium leading-none">{opt.label}</span>
            </label>
          ))}
        </RadioGroup>

        <div className="mt-5 text-sm text-muted-foreground">
          Selected: <span className="font-medium text-foreground">{plan}</span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            className="rounded-2xl border px-3 py-2 text-sm hover:bg-accent"
            onClick={() => setPlan("basic")}
          >
            Set Basic
          </button>
          <button
            className="rounded-2xl border px-3 py-2 text-sm hover:bg-accent"
            onClick={() => setPlan("premium")}
          >
            Set Premium
          </button>
        </div>
      </div>
    </div>
  );
}

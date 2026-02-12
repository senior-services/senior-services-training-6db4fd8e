import * as React from "react";
import { Button } from "@/components/ui/button";
import { TableHead } from "@/components/ui/table";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

type SortDirection = "asc" | "desc";

interface SortableTableHeadProps
  extends React.ThHTMLAttributes<HTMLTableCellElement> {
  /** Column identifier used to determine active sort state */
  column: string;
  /** Currently sorted column (pass from parent state) */
  sortColumn: string | null;
  /** Current sort direction (pass from parent state) */
  sortDirection: SortDirection;
  /** Callback when header is clicked */
  onSort: (column: string) => void;
  /** Header label text */
  children: React.ReactNode;
}

const SortableTableHead = React.forwardRef<
  HTMLTableCellElement,
  SortableTableHeadProps
>(
  (
    {
      column,
      sortColumn,
      sortDirection,
      onSort,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const isActive = sortColumn === column;

    const handleClick = React.useCallback(() => {
      onSort(column);
    }, [column, onSort]);

    const getAriaSort = (): "ascending" | "descending" | undefined => {
      if (!isActive) return undefined;
      return sortDirection === "asc" ? "ascending" : "descending";
    };

    const getAriaLabel = (): string => {
      if (!isActive) {
        return `Sort by ${children} ascending`;
      }
      return `Sort by ${children} ${sortDirection === "asc" ? "descending" : "ascending"}`;
    };

    return (
      <TableHead ref={ref} aria-sort={getAriaSort()} className={className} {...props}>
        <Button
          variant="ghost"
          onClick={handleClick}
          className={cn(
            "text-sm uppercase text-muted-foreground p-0 h-auto",
            "hover:bg-transparent hover:text-primary hover:shadow-none group",
            isActive ? "font-bold" : "font-medium"
          )}
          aria-label={getAriaLabel()}
        >
          {children}
          {isActive ? (
            sortDirection === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
              <ArrowDown className="ml-2 h-4 w-4" />
            )
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4 opacity-50 group-hover:text-primary group-hover:opacity-100" />
          )}
        </Button>
      </TableHead>
    );
  }
);

SortableTableHead.displayName = "SortableTableHead";

export { SortableTableHead };
export type { SortDirection, SortableTableHeadProps };

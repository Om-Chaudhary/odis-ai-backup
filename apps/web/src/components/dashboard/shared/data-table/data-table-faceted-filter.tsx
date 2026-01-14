"use client";

import * as React from "react";
import { Check, PlusCircle, Search } from "lucide-react";

import { cn } from "@odis-ai/shared/util";
import { Badge } from "@odis-ai/shared/ui/badge";
import { Button } from "@odis-ai/shared/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@odis-ai/shared/ui/popover";
import { Separator } from "@odis-ai/shared/ui/separator";
import { Input } from "@odis-ai/shared/ui/input";

interface DataTableFacetedFilterProps<TValue> {
  title?: string;
  selectedValues: Set<TValue>;
  options: {
    label: string;
    value: TValue;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
  onSelect: (values: Set<TValue>) => void;
}

export function DataTableFacetedFilter<TValue extends string | number>({
  title,
  selectedValues,
  options,
  onSelect,
}: DataTableFacetedFilterProps<TValue>) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <PlusCircle className="mr-2 h-4 w-4" />
          {title}
          {selectedValues.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden"
              >
                {selectedValues.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedValues.size > 2 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {selectedValues.size} selected
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValues.has(option.value))
                    .map((option) => (
                      <Badge
                        variant="secondary"
                        key={String(option.value)}
                        className="rounded-sm px-1 font-normal"
                      >
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <div className="p-2">
          <div className="flex items-center space-x-2 border-b px-2 pb-2">
            <Search className="h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder={title}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="placeholder:text-muted-foreground flex h-6 w-full rounded-md border-none bg-transparent px-0 py-1 text-sm outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2 pt-0">
          <div className="space-y-1">
            {filteredOptions.length === 0 && (
              <p className="text-muted-foreground py-6 text-center text-sm">
                No results found.
              </p>
            )}
            {filteredOptions.map((option) => {
              const isSelected = selectedValues.has(option.value);
              return (
                <div
                  key={String(option.value)}
                  className="flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                  onClick={() => {
                    const next = new Set(selectedValues);
                    if (isSelected) {
                      next.delete(option.value);
                    } else {
                      next.add(option.value);
                    }
                    onSelect(next);
                  }}
                >
                  <div
                    className={cn(
                      "border-primary mr-2 flex h-4 w-4 items-center justify-center rounded-sm border",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "opacity-50 [&_svg]:invisible",
                    )}
                  >
                    <Check className={cn("h-4 w-4")} />
                  </div>
                  {option.icon && (
                    <option.icon className="text-muted-foreground mr-2 h-4 w-4" />
                  )}
                  <span>{option.label}</span>
                  {/* Facet counts could be passed in options if needed */}
                </div>
              );
            })}
          </div>
        </div>
        {selectedValues.size > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full justify-center text-center text-sm font-normal"
                onClick={() => onSelect(new Set())}
              >
                Clear filters
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

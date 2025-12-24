"use client";

import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import {
  type DayButton,
  DayPicker,
  getDefaultClassNames,
} from "react-day-picker";

import { cn } from "@odis-ai/shared/util";
import { Button, buttonVariants } from "./button";

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames();

  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        // Base styles
        "flex aspect-square h-auto w-full min-w-[--cell-size] flex-col gap-1 rounded-lg text-sm leading-none font-medium transition-all duration-150",
        // Selected single day - teal accent
        "data-[selected-single=true]:bg-teal-600 data-[selected-single=true]:text-white data-[selected-single=true]:shadow-md data-[selected-single=true]:hover:bg-teal-700",
        // Range styles
        "data-[range-middle=true]:bg-teal-50 data-[range-middle=true]:text-teal-900",
        "data-[range-start=true]:bg-teal-600 data-[range-start=true]:text-white",
        "data-[range-end=true]:bg-teal-600 data-[range-end=true]:text-white",
        "data-[range-end=true]:rounded-lg data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-lg",
        // Focus styles
        "group-data-[focused=true]/day:border-teal-400 group-data-[focused=true]/day:ring-teal-500/30",
        "group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px]",
        // Hover
        "hover:bg-teal-50 hover:text-teal-700",
        "[&>span]:text-xs [&>span]:opacity-70",
        defaultClassNames.day,
        className,
      )}
      {...props}
    />
  );
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
}) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "group/calendar bg-white p-5 [--cell-size:2.75rem]",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className,
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "relative flex flex-col gap-6 md:flex-row",
          defaultClassNames.months,
        ),
        month: cn("flex w-full flex-col gap-5", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
          defaultClassNames.nav,
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-9 w-9 select-none rounded-lg p-0 text-slate-600 hover:bg-teal-50 hover:text-teal-700 aria-disabled:opacity-50",
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-9 w-9 select-none rounded-lg p-0 text-slate-600 hover:bg-teal-50 hover:text-teal-700 aria-disabled:opacity-50",
          defaultClassNames.button_next,
        ),
        month_caption: cn(
          "flex h-9 w-full items-center justify-center px-10",
          defaultClassNames.month_caption,
        ),
        dropdowns: cn(
          "flex h-9 w-full items-center justify-center gap-2 text-base font-semibold",
          defaultClassNames.dropdowns,
        ),
        dropdown_root: cn(
          "has-focus:border-teal-400 border-slate-200 shadow-sm has-focus:ring-teal-500/30 has-focus:ring-[3px] relative rounded-lg border",
          defaultClassNames.dropdown_root,
        ),
        dropdown: cn("absolute inset-0 opacity-0", defaultClassNames.dropdown),
        caption_label: cn(
          "select-none font-semibold text-slate-800",
          captionLayout === "label"
            ? "text-base"
            : "[&>svg]:text-slate-400 flex h-9 items-center gap-1.5 rounded-lg pl-3 pr-2 text-base [&>svg]:size-4",
          defaultClassNames.caption_label,
        ),
        table: "w-full border-collapse",
        weekdays: cn("flex mb-1", defaultClassNames.weekdays),
        weekday: cn(
          "text-slate-500 flex-1 select-none rounded-md pb-2 text-sm font-medium",
          defaultClassNames.weekday,
        ),
        week: cn("mt-1 flex w-full gap-0.5", defaultClassNames.week),
        week_number_header: cn(
          "w-[--cell-size] select-none",
          defaultClassNames.week_number_header,
        ),
        week_number: cn(
          "text-slate-400 select-none text-sm",
          defaultClassNames.week_number,
        ),
        day: cn(
          "relative w-full h-full p-0.5 text-center group/day aspect-square select-none",
          "[&:last-child[data-selected=true]_button]:rounded-r-lg",
          props.showWeekNumber
            ? "[&:nth-child(2)[data-selected=true]_button]:rounded-l-lg"
            : "[&:first-child[data-selected=true]_button]:rounded-l-lg",
          defaultClassNames.day,
        ),
        range_start: cn(
          "bg-teal-50 rounded-l-lg",
          defaultClassNames.range_start,
        ),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn("bg-teal-50 rounded-r-lg", defaultClassNames.range_end),
        today: cn(
          "relative",
          "[&_button]:font-bold [&_button]:text-teal-600",
          "[&_button:not([data-selected-single=true])]:bg-teal-50/50",
          "data-[selected=true]:rounded-none",
          defaultClassNames.today,
        ),
        outside: cn(
          "text-slate-300 aria-selected:text-slate-400",
          defaultClassNames.outside,
        ),
        disabled: cn(
          "text-slate-300 opacity-50 cursor-not-allowed",
          defaultClassNames.disabled,
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          );
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-5", className)} {...props} />
            );
          }

          return (
            <ChevronRightIcon className={cn("size-5", className)} {...props} />
          );
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-[--cell-size] items-center justify-center text-center">
                {children}
              </div>
            </td>
          );
        },
        ...components,
      }}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };

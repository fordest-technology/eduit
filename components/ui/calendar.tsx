"use client";

import * as React from "react";
import ReactCalendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import "./calendar.css";

// We define a props interface that mimics common react-day-picker props
// to minimize breaking changes in the rest of the app.
export interface CalendarProps {
  mode?: "single" | "range" | "multiple";
  selected?: Date | Date[] | { from: Date; to: Date };
  onSelect?: (date: any) => void;
  className?: string;
  disabled?: any;
  fromDate?: Date;
  toDate?: Date;
  initialFocus?: boolean;
}

function Calendar({
  className,
  mode = "single",
  selected,
  onSelect,
  disabled,
  fromDate,
  toDate,
  ...props
}: CalendarProps) {

  // Map value for react-calendar
  let value: any = selected;
  if (mode === "single" && Array.isArray(selected)) {
    value = selected[0];
  } else if (mode === "range" && selected && typeof selected === "object" && 'from' in selected) {
    value = [selected.from, (selected as any).to];
  }

  const onChange = (val: any) => {
    if (!onSelect) return;

    if (mode === "single") {
      onSelect(val);
    } else if (mode === "range") {
      onSelect({ from: val[0], to: val[1] });
    } else {
      onSelect(val);
    }
  };

  // Map disabled prop to tileDisabled
  const tileDisabled = ({ date }: { date: Date }) => {
    if (!disabled) return false;

    if (typeof disabled === "function") {
      return disabled(date);
    }

    if (typeof disabled === "object") {
      if (disabled.before && date < disabled.before) return true;
      if (disabled.after && date > disabled.after) return true;
      if (Array.isArray(disabled)) {
        return disabled.some(disabledDate =>
          date.getFullYear() === disabledDate.getFullYear() &&
          date.getMonth() === disabledDate.getMonth() &&
          date.getDate() === disabledDate.getDate()
        );
      }
    }

    return false;
  };

  return (
    <div className={cn("calendar-wrapper", className)}>
      <ReactCalendar
        onChange={onChange}
        value={value}
        minDate={fromDate}
        maxDate={toDate}
        locale="en-US"
        prevLabel={<ChevronLeft className="h-4 w-4" />}
        nextLabel={<ChevronRight className="h-4 w-4" />}
        prev2Label={null}
        next2Label={null}
        tileDisabled={tileDisabled}
        {...props}
      />
    </div>
  );
}

Calendar.displayName = "Calendar";

export { Calendar };

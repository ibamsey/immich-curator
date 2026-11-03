"use client";

import { useRef } from "react";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  displayDateToIso,
  isoDateForPicker,
  isoDateToDisplay,
} from "@/lib/dates/dob-format";

type DobInputProps = {
  valueIso: string | null | undefined;
  displayValue: string;
  onDisplayChange: (display: string) => void;
  onIsoFromPicker: (iso: string) => void;
  className?: string;
  id?: string;
};

export function DobInput({
  displayValue,
  onDisplayChange,
  onIsoFromPicker,
  valueIso,
  className,
  id,
}: DobInputProps) {
  const pickerRef = useRef<HTMLInputElement>(null);

  const openPicker = () => {
    const el = pickerRef.current;
    if (!el) return;
    if (typeof el.showPicker === "function") {
      el.showPicker();
    } else {
      el.focus();
      el.click();
    }
  };

  return (
    <div className={cn("relative mt-1", className)}>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        placeholder="dd/mm/yyyy"
        autoComplete="bday"
        value={displayValue}
        onChange={(e) => onDisplayChange(e.target.value)}
        className="w-full rounded-md border border-input bg-background py-1.5 pl-2 pr-9 text-sm disabled:opacity-60"
      />
      <button
        type="button"
        onClick={openPicker}
        className="absolute top-1/2 right-1 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        title="Pick date"
        aria-label="Open date picker"
      >
        <CalendarDays className="size-4" />
      </button>
      <input
        ref={pickerRef}
        type="date"
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none absolute h-0 w-0 opacity-0"
        value={isoDateForPicker(valueIso)}
        onChange={(e) => {
          const iso = e.target.value;
          if (!iso) return;
          onIsoFromPicker(iso);
        }}
      />
    </div>
  );
}

export { displayDateToIso, isoDateToDisplay };

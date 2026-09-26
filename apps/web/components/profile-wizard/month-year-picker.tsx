"use client";

import { useEffect, useRef, useState } from "react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;
const FIRST_YEAR = 1900;
const LAST_YEAR = new Date().getUTCFullYear() + 10;

interface MonthYearPickerProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}

export function MonthYearPicker({ id, label, value, onChange, disabled, error }: MonthYearPickerProps) {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(() => Number(value.slice(0, 4)) || new Date().getUTCFullYear());
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const selectedMonth = Number(value.slice(5, 7));
  const display = selectedMonth >= 1 && selectedMonth <= 12
    ? `${MONTHS[selectedMonth - 1]} ${value.slice(0, 4)}`
    : "Choose month and year";

  useEffect(() => {
    if (value) setYear(Number(value.slice(0, 4)));
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", closeOutside);
    return () => document.removeEventListener("mousedown", closeOutside);
  }, [open]);

  return (
    <div className="company-onboarding-field profile-month-field" ref={root} onKeyDown={(event) => {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    }}>
      <label htmlFor={id}>{label}</label>
      <button
        id={id}
        ref={trigger}
        type="button"
        className="profile-month-trigger"
        aria-label={label}
        aria-expanded={open}
        aria-controls={`${id}-calendar`}
        aria-describedby={error ? `${id}-error` : undefined}
        data-invalid={error ? "true" : undefined}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{display}</span><span aria-hidden="true">▾</span>
      </button>
      {open ? <div id={`${id}-calendar`} className="profile-month-popover" role="group" aria-label={`${label} picker`}>
        <div className="profile-month-popover-heading">
          <span>Select a month</span>
          <select aria-label={`Year for ${label}`} value={year} onChange={(event) => setYear(Number(event.target.value))}>
            {Array.from({ length: LAST_YEAR - FIRST_YEAR + 1 }, (_, index) => LAST_YEAR - index)
              .map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>
        <div className="profile-month-grid">
          {MONTHS.map((month, index) => <button
            key={month}
            type="button"
            aria-label={month}
            aria-pressed={value === `${year}-${String(index + 1).padStart(2, "0")}`}
            onClick={() => {
              onChange(`${year}-${String(index + 1).padStart(2, "0")}`);
              setOpen(false);
              trigger.current?.focus();
            }}
          >{month.slice(0, 3)}</button>)}
        </div>
        {value ? <button type="button" className="profile-month-clear" onClick={() => {
          onChange("");
          setOpen(false);
          trigger.current?.focus();
        }}>Clear date</button> : null}
      </div> : null}
      {error ? <p id={`${id}-error`} className="company-onboarding-error" role="alert">{error}</p> : null}
    </div>
  );
}

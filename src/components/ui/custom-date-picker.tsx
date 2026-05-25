"use client";

import { useState, useRef, useEffect } from "react";

type Props = {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
};

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const WEEKDAYS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

export function CustomDatePicker({ value, onChange, placeholder = "AAAA-MM-DD" }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial value or use current date
  const parsedDate = value ? new Date(value) : new Date();
  const initialYear = isNaN(parsedDate.getTime()) ? new Date().getFullYear() : parsedDate.getFullYear();
  const initialMonth = isNaN(parsedDate.getTime()) ? new Date().getMonth() : parsedDate.getMonth();

  const [viewYear, setViewYear] = useState(initialYear);
  const [viewMonth, setViewMonth] = useState(initialMonth);

  // Keep view in sync when value changes from outside
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }

  // Click outside listener to close calendar
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Helper to generate days of the month
  const getDaysInMonth = (year: number, month: number) => {
    // month is 0-indexed
    const date = new Date(year, month, 1);
    const days = [];
    
    // Get day of week of 1st day (0 is Sunday, 1 is Monday...)
    // Shift so 0 is Monday, 6 is Sunday
    let startDay = date.getDay() - 1;
    if (startDay === -1) startDay = 6; // Sunday

    // Get total days in month
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    // Get total days in previous month
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    // Previous month filler days
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonthTotalDays - i,
        month: month === 0 ? 11 : month - 1,
        year: month === 0 ? year - 1 : year,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        day: i,
        month,
        year,
        isCurrentMonth: true,
      });
    }

    // Next month filler days to complete grid
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        day: i,
        month: month === 11 ? 0 : month + 1,
        year: month === 11 ? year + 1 : year,
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const days = getDaysInMonth(viewYear, viewMonth);

  const handleDayClick = (dayObj: { day: number; month: number; year: number }) => {
    const y = dayObj.year;
    const m = String(dayObj.month + 1).padStart(2, "0");
    const d = String(dayObj.day).padStart(2, "0");
    const dateStr = `${y}-${m}-${d}`;
    onChange(dateStr);
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Generate year options for quick dropdown selector (10 years back, 5 years ahead)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 16 }, (_, i) => currentYear - 10 + i);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input wrapper */}
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="glass-input w-full rounded-lg pl-3 pr-10 py-2 text-sm outline-none text-white font-display tracking-widest placeholder-white/20 uppercase"
          onClick={() => setIsOpen(true)}
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-muted hover:text-accent-cyan transition-all"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
        </button>
      </div>

      {/* Custom Calendar Popover */}
      {isOpen && (
        <div className="absolute left-0 mt-2 z-50 w-72 bg-[#0a0b10] border border-white/10 rounded-xl p-4 shadow-2xl backdrop-blur-2xl">
          {/* Header */}
          <div className="flex items-center justify-between gap-1 mb-3">
            {/* Prev month button */}
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-md text-text-muted hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>

            {/* Quick Selectors */}
            <div className="flex items-center gap-1.5">
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(parseInt(e.target.value))}
                className="bg-[#101014] text-xs font-semibold text-white border border-white/10 rounded px-2 py-0.5 outline-none cursor-pointer"
              >
                {MONTH_NAMES.map((name, index) => (
                  <option key={name} value={index}>{name}</option>
                ))}
              </select>

              <select
                value={viewYear}
                onChange={(e) => setViewYear(parseInt(e.target.value))}
                className="bg-[#101014] text-xs font-semibold text-white border border-white/10 rounded px-2 py-0.5 outline-none cursor-pointer"
              >
                {years.map((yr) => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>

            {/* Next month button */}
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-md text-text-muted hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1 text-[10px] font-bold text-text-muted uppercase tracking-wider">
            {WEEKDAYS.map((day) => (
              <div key={day} className="py-1">{day}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {days.map((dObj, idx) => {
              // Check if selected
              const formattedCurrent = `${dObj.year}-${String(dObj.month + 1).padStart(2, "0")}-${String(dObj.day).padStart(2, "0")}`;
              const isSelected = value === formattedCurrent;

              // Check if today
              const today = new Date();
              const isToday =
                today.getDate() === dObj.day &&
                today.getMonth() === dObj.month &&
                today.getFullYear() === dObj.year;

              return (
                <button
                  key={`${dObj.year}-${dObj.month}-${dObj.day}-${idx}`}
                  type="button"
                  onClick={() => handleDayClick(dObj)}
                  className={`py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                    !dObj.isCurrentMonth
                      ? "text-text-muted/20 hover:text-white/40"
                      : isSelected
                      ? "bg-accent-cyan/15 text-accent-cyan ring-1 ring-accent-cyan/30"
                      : isToday
                      ? "border border-accent-red/40 text-accent-red"
                      : "text-white hover:bg-white/5"
                  }`}
                >
                  {dObj.day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

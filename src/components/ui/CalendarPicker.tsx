"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

interface CalendarPickerProps {
  selectedDate: string;
  onChange: (date: string) => void;
  availableDates?: string[];
}

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export default function CalendarPicker({
  selectedDate,
  onChange,
  availableDates = [],
}: CalendarPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse currently selected date (e.g. "11/06/2026" -> day=11, month=5 (June), year=2026)
  const parsedSelected = useMemo(() => {
    if (!selectedDate) return { day: 11, month: 5, year: 2026 };
    const [d, m, y] = selectedDate.split("/").map(Number);
    return { day: d, month: m - 1, year: y };
  }, [selectedDate]);

  // Current month/year view state of the calendar dropdown
  const [viewDate, setViewDate] = useState(() => {
    return new Date(parsedSelected.year, parsedSelected.month, 1);
  });

  // Sync viewed month with selectedDate whenever selectedDate changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setViewDate(new Date(parsedSelected.year, parsedSelected.month, 1));
  }, [parsedSelected]);

  // Close calendar dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  // Grid details calculation
  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentYear, currentMonth]);

  const startDayOfWeek = useMemo(() => {
    const day = new Date(currentYear, currentMonth, 1).getDay();
    // Align with Monday as start day: 0 (Sun) -> 6, 1 (Mon) -> 0, ..., 6 (Sat) -> 5
    return day === 0 ? 6 : day - 1;
  }, [currentYear, currentMonth]);

  // Generate list of days to display in the grid (previous month empty cells + current month cells)
  const calendarCells = useMemo(() => {
    const cells: { dayNum: number | null; dateStr: string; isPastOrToday: boolean; hasData: boolean; isSelected: boolean }[] = [];

    // Prepend empty cells for alignment
    for (let i = 0; i < startDayOfWeek; i++) {
      cells.push({ dayNum: null, dateStr: "", isPastOrToday: false, hasData: false, isSelected: false });
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // Append cells of the actual month
    for (let day = 1; day <= daysInMonth; day++) {
      const dd = String(day).padStart(2, "0");
      const mm = String(currentMonth + 1).padStart(2, "0");
      const dateStr = `${dd}/${mm}/${currentYear}`;

      const cellDate = new Date(currentYear, currentMonth, day);
      const isPastOrToday = cellDate <= today;
      const hasData = availableDates.includes(dateStr);
      const isSelected = selectedDate === dateStr;

      cells.push({ dayNum: day, dateStr, isPastOrToday, hasData, isSelected });
    }

    return cells;
  }, [currentYear, currentMonth, daysInMonth, startDayOfWeek, availableDates, selectedDate]);

  // Navigate to previous month
  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  // Navigate to next month
  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleSelectDay = (dateStr: string) => {
    onChange(dateStr);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Dropdown Toggle Input Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl border border-white/10 bg-[#0a0a0a] text-xs sm:text-sm font-bold text-foreground cursor-pointer shadow-lg min-w-[210px] sm:min-w-[240px] hover:border-primary hover:text-primary dark:hover:text-amber-400 dark:hover:border-amber-400 transition-all select-none"
      >
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-primary dark:text-amber-400" />
          <span>{selectedDate ? `Ngày ${selectedDate}` : "Chọn ngày..."}</span>
        </div>
        <ChevronDown
          size={16}
          className={`text-foreground/50 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
 
      {/* Floating Calendar Popover Popover */}
      {isOpen && (
        <div className="absolute left-0 mt-2 z-40 w-[290px] sm:w-[320px] rounded-3xl border border-white/10 bg-[#0a0a0a] p-4 shadow-2xl backdrop-blur-xl animate-fade-in origin-top-left">
          {/* Calendar Header Controls */}
          <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-foreground cursor-pointer transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs sm:text-sm font-extrabold text-foreground select-none">
              Tháng {currentMonth + 1}, {currentYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-foreground cursor-pointer transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
 
          {/* Weekdays Row */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1 text-[10px] sm:text-xs font-black text-foreground/45 select-none">
            {WEEKDAYS.map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>
 
          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {calendarCells.map((cell, index) => {
              if (cell.dayNum === null) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }
 
              return (
                <button
                  key={cell.dateStr}
                  type="button"
                  disabled={!cell.isPastOrToday}
                  onClick={() => handleSelectDay(cell.dateStr)}
                  className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
                    cell.isSelected
                      ? "bg-primary text-white scale-105 shadow-md shadow-primary/20"
                      : cell.isPastOrToday
                        ? "bg-white/5 border border-white/5 text-foreground hover:bg-primary/20 hover:text-primary dark:hover:text-amber-400 dark:hover:bg-amber-400/20"
                        : "text-foreground/20 cursor-not-allowed"
                  }`}
                >
                  <span>{cell.dayNum}</span>
                  {/* Subtle small dot indicators below active match dates */}
                  {cell.hasData && !cell.isSelected && (
                    <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-primary dark:bg-amber-400 animate-pulse-slow" />
                  )}
                </button>
              );
            })}
          </div>
 
          {/* Footnotes Info */}
          <div className="mt-3 pt-2.5 border-t border-white/5 text-[9px] text-foreground/40 flex items-center justify-between select-none">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary dark:bg-amber-400" />
              <span>Có dữ liệu giá vàng</span>
            </div>
            <span>NTJ Data</span>
          </div>
        </div>
      )}
    </div>
  );
}

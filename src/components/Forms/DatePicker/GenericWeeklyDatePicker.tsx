import React, { useEffect, useRef, useState } from 'react';
import flatpickr from 'flatpickr';
import { Calendar } from 'lucide-react';
import 'flatpickr/dist/flatpickr.min.css';

interface GenericWeeklyDatePickerProps {
  id: string;
  placeholder?: string;
  onDateChange?: (dates: Date[]) => void;
  label?: string;
  required?: boolean;
  className?: string;
  initialDates?: Date[];
  mode?: 'from' | 'to';
}

const GenericWeeklyDatePicker: React.FC<GenericWeeklyDatePickerProps> = ({
  id,
  placeholder = 'DD/MM/YYYY',
  onDateChange,
  label,
  required = false,
  className = '',
  initialDates = [],
  mode = 'from',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    // If initialDates provided, use the appropriate date
    if (initialDates.length > 0) {
      if (mode === 'from') {
        return initialDates[0] || null;
      } else if (mode === 'to') {
        return initialDates[1] || null;
      }
      return initialDates[0] || null;
    }
    
    // Otherwise, default based on mode
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 1 = Monday, ...
    
    if (mode === 'from') {
      // Default to Monday
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);
      monday.setHours(0, 0, 0, 0);
      return monday;
    } else if (mode === 'to') {
      // Default to Sunday
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
      return sunday;
    }
    
    return null;
  });

  // Format date for display
  const formatDateForDisplay = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    if (!inputRef.current) return;

    const defaultDate = selectedDate;

    // Set initial value
    if (defaultDate && inputRef.current) {
      inputRef.current.value = formatDateForDisplay(defaultDate);
    }

    const fp = flatpickr(inputRef.current, {
      mode: 'single',
      defaultDate: defaultDate || undefined,
      dateFormat: 'd/m/Y',
      onChange: (dates) => {
        if (dates && dates.length > 0) {
          setSelectedDate(dates[0]);
          // Update input value
          if (inputRef.current) {
            inputRef.current.value = formatDateForDisplay(dates[0]);
          }
          onDateChange?.(dates);
        }
      },
      monthSelectorType: 'static',
      position: 'auto',
      static: false,
      appendTo: document.body,
      disableMobile: false,
      prevArrow:
        '<svg class="fill-current" width="7" height="11" viewBox="0 0 7 11"><path d="M5.4 10.8l1.4-1.4-4-4 4-4L5.4 0 0 5.4z" /></svg>',
      nextArrow:
        '<svg class="fill-current" width="7" height="11" viewBox="0 0 7 11"><path d="M1.4 10.8L0 9.4l4-4-4-4L1.4 0l5.4 5.4z" /></svg>',
    });

    return () => {
      fp.destroy();
    };
  }, [onDateChange, mode, selectedDate]);

  // Update when initialDates change externally
  useEffect(() => {
    if (inputRef.current && initialDates.length > 0) {
      let date = null;
      if (mode === 'from') {
        date = initialDates[0];
      } else if (mode === 'to') {
        date = initialDates[1];
      }
      
      if (date) {
        const fp = (inputRef.current as any)._flatpickr;
        if (fp) {
          fp.setDate(date);
        }
        inputRef.current.value = formatDateForDisplay(date);
        setSelectedDate(date);
      }
    }
  }, [initialDates, mode]);

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={id}
          className="mb-1 block text-[9px] sm:text-[10px] font-bold uppercase text-[#4f4535] dark:text-slate-400"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          placeholder={placeholder}
          readOnly
          className="w-full rounded-lg border border-[#d3c4af]/30 bg-white px-2 py-1.5 pr-8 text-xs focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white sm:px-3 sm:py-2 sm:pr-10 sm:text-sm"
        />
        <div className="pointer-events-none absolute inset-0 left-auto right-2 flex items-center sm:right-3">
          <Calendar className="h-3.5 w-3.5 text-[#817563] sm:h-4 sm:w-4" />
        </div>
      </div>
    </div>
  );
};

export default GenericWeeklyDatePicker;
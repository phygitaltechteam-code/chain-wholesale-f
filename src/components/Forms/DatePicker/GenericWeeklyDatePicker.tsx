import React, { useEffect, useRef, useState } from 'react';
import flatpickr from 'flatpickr';
import { Calendar, X } from 'lucide-react';
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
  const flatpickrInstanceRef = useRef<any>(null);
  
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

  // Handle clear date
  const handleClearDate = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Clear the input value
    if (inputRef.current) {
      inputRef.current.value = '';
    }

    // Clear flatpickr instance
    if (flatpickrInstanceRef.current) {
      flatpickrInstanceRef.current.clear();
      flatpickrInstanceRef.current.setDate(null);
    }

    setSelectedDate(null);

    // Notify parent with empty array
    onDateChange?.([]);
  };

  // Initialize flatpickr
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

    flatpickrInstanceRef.current = fp;

    return () => {
      fp.destroy();
      flatpickrInstanceRef.current = null;
    };
  }, []); // Only run once on mount

  // Update when initialDates change externally
  useEffect(() => {
    if (!inputRef.current || initialDates.length === 0) return;

    let date = null;
    if (mode === 'from') {
      date = initialDates[0];
    } else if (mode === 'to') {
      date = initialDates[1];
    }

    if (date) {
      // Only update if the date is different
      const currentDate = selectedDate;
      if (currentDate && date.getTime() === currentDate.getTime()) {
        return;
      }

      setSelectedDate(date);
      
      if (inputRef.current) {
        inputRef.current.value = formatDateForDisplay(date);
      }
      
      if (flatpickrInstanceRef.current) {
        flatpickrInstanceRef.current.setDate(date);
      }
    }
  }, [initialDates, mode, selectedDate]);

  const hasValue = selectedDate !== null;

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
          className="w-full rounded-lg border border-[#d3c4af]/30 bg-white px-2 py-1.5 pr-12 text-xs focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white sm:px-3 sm:py-2 sm:pr-14 sm:text-sm"
        />

        {/* Clear button - shows only when there's a value */}
        {hasValue && (
          <button
            type="button"
            onClick={handleClearDate}
            className="absolute inset-0 left-auto right-8 flex items-center text-gray-400 hover:text-red-500 transition-colors sm:right-9"
            title="Clear date"
          >
            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        )}

        {/* Calendar icon */}
        <div className="pointer-events-none absolute inset-0 left-auto right-2 flex items-center sm:right-3">
          <Calendar className="h-3.5 w-3.5 text-[#817563] sm:h-4 sm:w-4" />
        </div>
      </div>
    </div>
  );
};

export default GenericWeeklyDatePicker;
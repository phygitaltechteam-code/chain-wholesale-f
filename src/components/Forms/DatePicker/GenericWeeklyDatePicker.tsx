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

const GenericWeeklyDatePicker: React.FC<
  GenericWeeklyDatePickerProps
> = ({
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

  const [selectedDate, setSelectedDate] =
    useState<Date | null>(() => {
      /*
       * If parent has provided dates,
       * use the correct date according to mode.
       */
      if (initialDates.length > 0) {
        if (mode === 'from') {
          return initialDates[0] || null;
        }

        if (mode === 'to') {
          return initialDates[1] || null;
        }

        return initialDates[0] || null;
      }

      /*
       * Default date only when the component
       * is initially used without initialDates.
       */
      const now = new Date();
      const day = now.getDay();

      if (mode === 'from') {
        // Monday
        const diffToMonday =
          day === 0 ? -6 : 1 - day;

        const monday = new Date(now);

        monday.setDate(
          now.getDate() + diffToMonday
        );

        monday.setHours(0, 0, 0, 0);

        return monday;
      }

      if (mode === 'to') {
        // Sunday
        const diffToMonday =
          day === 0 ? -6 : 1 - day;

        const monday = new Date(now);

        monday.setDate(
          now.getDate() + diffToMonday
        );

        monday.setHours(0, 0, 0, 0);

        const sunday = new Date(monday);

        sunday.setDate(
          monday.getDate() + 6
        );

        sunday.setHours(23, 59, 59, 999);

        return sunday;
      }

      return null;
    });

  /*
   * Format date as DD/MM/YYYY
   */
  const formatDateForDisplay = (
    date: Date
  ): string => {
    const day = String(
      date.getDate()
    ).padStart(2, '0');

    const month = String(
      date.getMonth() + 1
    ).padStart(2, '0');

    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  /*
   * CLEAR DATE
   */
  const handleClearDate = (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();

    // Clear React state
    setSelectedDate(null);

    // Clear input
    if (inputRef.current) {
      inputRef.current.value = '';
    }

    // Clear Flatpickr
    if (flatpickrInstanceRef.current) {
      flatpickrInstanceRef.current.clear();
    }

    // Tell parent that date was cleared
    onDateChange?.([]);
  };

  /*
   * Initialize Flatpickr
   */
  useEffect(() => {
    if (!inputRef.current) {
      return;
    }

    const defaultDate = selectedDate;

    if (defaultDate) {
      inputRef.current.value =
        formatDateForDisplay(defaultDate);
    } else {
      inputRef.current.value = '';
    }

    const fp = flatpickr(
      inputRef.current,
      {
        mode: 'single',

        defaultDate:
          defaultDate || undefined,

        dateFormat: 'd/m/Y',

        onChange: (dates) => {
          if (
            dates &&
            dates.length > 0
          ) {
            const selected = dates[0];

            setSelectedDate(selected);

            if (inputRef.current) {
              inputRef.current.value =
                formatDateForDisplay(
                  selected
                );
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
          '<svg class="fill-current" width="7" height="11" viewBox="0 0 7 11"><path d="M1.4 10.8L0 9.4l4-4-4-4L1.4 0 0 5.4z" /></svg>',
      }
    );

    flatpickrInstanceRef.current = fp;

    return () => {
      fp.destroy();

      flatpickrInstanceRef.current =
        null;
    };

    // Initialize only once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
   * IMPORTANT:
   * Sync changes coming from parent.
   *
   * When initialDates = []
   * we MUST clear this component.
   */
  useEffect(() => {
    if (!inputRef.current) {
      return;
    }

    /*
     * Parent cleared the date.
     */
    if (initialDates.length === 0) {
      setSelectedDate(null);

      if (inputRef.current) {
        inputRef.current.value = '';
      }

      if (flatpickrInstanceRef.current) {
        flatpickrInstanceRef.current.clear();
      }

      return;
    }

    let date: Date | null = null;

    if (mode === 'from') {
      date = initialDates[0] || null;
    } else if (mode === 'to') {
      date = initialDates[1] || null;
    }

    /*
     * If the selected date is empty,
     * clear the picker.
     */
    if (!date) {
      setSelectedDate(null);

      if (inputRef.current) {
        inputRef.current.value = '';
      }

      if (flatpickrInstanceRef.current) {
        flatpickrInstanceRef.current.clear();
      }

      return;
    }

    /*
     * Don't update if date hasn't changed.
     */
    if (
      selectedDate &&
      date.getTime() ===
        selectedDate.getTime()
    ) {
      return;
    }

    setSelectedDate(date);

    if (inputRef.current) {
      inputRef.current.value =
        formatDateForDisplay(date);
    }

    if (flatpickrInstanceRef.current) {
      flatpickrInstanceRef.current.setDate(
        date,
        false
      );
    }
  }, [
    initialDates,
    mode,
    selectedDate,
  ]);

  const hasValue =
    selectedDate !== null;

  return (
    <div className={className}>

      {label && (
        <label
          htmlFor={id}
          className="mb-1 block text-[9px] sm:text-[10px] font-bold uppercase text-[#4f4535] dark:text-slate-400"
        >
          {label}{' '}

          {required && (
            <span className="text-red-500">
              *
            </span>
          )}
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

        {/* Clear Button */}
        {hasValue && (
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={handleClearDate}
            className="absolute inset-y-0 right-8 z-20 flex items-center justify-center px-1 text-gray-400 transition-colors hover:text-red-500 sm:right-9"
            title="Clear date"
          >
            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        )}

        {/* Calendar Icon */}
        <div className="pointer-events-none absolute inset-y-0 right-2 z-10 flex items-center sm:right-3">
          <Calendar className="h-3.5 w-3.5 text-[#817563] sm:h-4 sm:w-4" />
        </div>

      </div>
    </div>
  );
};

export default GenericWeeklyDatePicker;
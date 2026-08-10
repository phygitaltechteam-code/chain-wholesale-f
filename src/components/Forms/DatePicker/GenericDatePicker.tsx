import React, { useEffect, useRef } from 'react';
import flatpickr from 'flatpickr';
import { Calendar } from 'lucide-react';
import 'flatpickr/dist/flatpickr.min.css';

interface GenericDatePickerProps {
  id: string;
  placeholder?: string;
  dateFormat?: string;
  initialDate?: Date | string;
  onDateChange?: (selectedDate: Date[]) => void;
  label?: string;
  required?: boolean;
  className?: string;
  value?: string;
  defaultWeek?: boolean; // Add this prop
}

const GenericDatePicker: React.FC<GenericDatePickerProps> = ({
  id,
  placeholder = 'DD/MM/YYYY',
  dateFormat = 'd/m/Y',
  initialDate,
  onDateChange,
  label,
  required = false,
  className = '',
  value,
  defaultWeek = false, // Default to false
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!inputRef.current) return;

    // Calculate default date for current week (Monday)
    let defaultDate = initialDate || value || undefined;
    
    if (defaultWeek && !defaultDate) {
      const today = new Date();
      const dayOfWeek = today.getDay();
      
      // Calculate Monday (start of week)
      const monday = new Date(today);
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      monday.setDate(today.getDate() - daysToMonday);
      monday.setHours(0, 0, 0, 0);
      
      defaultDate = monday;
    }

    const fp = flatpickr(inputRef.current, {
      mode: 'single',
      defaultDate: defaultDate,
      dateFormat: dateFormat,
      onChange: onDateChange,
      monthSelectorType: 'static',
      position: 'auto',
      static: false,
      appendTo: document.body,
      prevArrow:
        '<svg class="fill-current" width="7" height="11" viewBox="0 0 7 11"><path d="M5.4 10.8l1.4-1.4-4-4 4-4L5.4 0 0 5.4z" /></svg>',
      nextArrow:
        '<svg class="fill-current" width="7" height="11" viewBox="0 0 7 11"><path d="M1.4 10.8L0 9.4l4-4-4-4L1.4 0l5.4 5.4z" /></svg>',
    });

    // If defaultWeek is true, trigger onDateChange with Monday
    if (defaultWeek && onDateChange && !initialDate && !value) {
      const today = new Date();
      const dayOfWeek = today.getDay();
      
      const monday = new Date(today);
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      monday.setDate(today.getDate() - daysToMonday);
      monday.setHours(0, 0, 0, 0);
      
      onDateChange([monday]);
    }

    return () => {
      fp.destroy();
    };
  }, [id, initialDate, dateFormat, onDateChange, value, defaultWeek]);

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
          className="w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-2 text-sm focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:bg-slate-800 dark:text-white dark:border-slate-700"
          placeholder={placeholder}
          readOnly
        />
        <div className="pointer-events-none absolute inset-0 left-auto right-3 flex items-center">
          <Calendar className="h-4 w-4 text-[#817563]" />
        </div>
      </div>
    </div>
  );
};

export default GenericDatePicker;
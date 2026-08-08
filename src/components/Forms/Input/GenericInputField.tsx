// components/Forms/Input/GenericInputField.tsx
import React, { forwardRef } from 'react';

interface InputProps {
  name?: string;
  label?: string;
  type?: string;

  inputMode?:
    | 'text'
    | 'numeric'
    | 'decimal'
    | 'search'
    | 'email'
    | 'tel'
    | 'url'
    | 'none';

  placeholder?: string;
  disabled?: boolean;
  defaultValue?: string | number;
  required?: boolean;
  className?: string;
  readOnly?: boolean;
  value?: string | number;

  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;

  suffix?: string;
  suffixClassName?: string;

  step?: string | number;
  min?: number | string;
  max?: number | string;

  // Decimal configuration
  decimalScale?: number; // Number of decimal places allowed (e.g., 3 for 3 decimals)
}

const GenericInputField = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      name,
      label,
      type = 'text',
      inputMode,
      placeholder,
      disabled = false,
      defaultValue,
      required = false,
      className = '',
      readOnly = false,
      value,
      onChange,
      onBlur,
      onFocus,
      onKeyDown,
      suffix,
      suffixClassName = '',
      step,
      min,
      max,
      decimalScale,
    },
    ref
  ) => {
    const isReadOnly = readOnly || disabled;

    // If decimalScale is provided, use text input to handle decimals properly
    const isDecimalInput = decimalScale !== undefined;

    const baseInputClasses = `
      w-full rounded-lg
      border border-[#d3c4af]/30
      bg-white
      px-3 py-2.5
      text-sm text-[#1a1c1b]
      placeholder:text-[#817563]
      outline-none
      transition-all duration-200
      focus:border-[#785600]
      focus:ring-2 focus:ring-[#785600]/10
      dark:bg-slate-800
      dark:text-white
      dark:border-slate-700
      dark:placeholder:text-slate-500

      ${
        isReadOnly
          ? 'bg-gray-50 text-slate-600 dark:bg-slate-700 dark:text-slate-300 cursor-default border-transparent'
          : 'hover:border-[#785600]/50'
      }

      ${suffix ? 'pr-8' : ''}
      ${className}
    `;

    // Handle input change with decimal validation
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isDecimalInput) {
        const inputValue = e.target.value;

        // Allow empty value
        if (inputValue === '') {
          onChange?.(e);
          return;
        }

        // Allow only digits and decimal point
        if (!/^\d*\.?\d*$/.test(inputValue)) {
          return;
        }

        // Prevent multiple decimal points
        const parts = inputValue.split('.');
        if (parts.length > 2) {
          return;
        }

        // Check decimal places limit
        const decimalPart = parts[1];
        if (decimalPart !== undefined && decimalPart.length > decimalScale!) {
          return;
        }

        onChange?.(e);
      } else {
        onChange?.(e);
      }
    };

    // Prevent invalid keyboard characters for decimal input
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (isDecimalInput) {
        const invalidKeys = ['e', 'E', '+', '-'];

        // Prevent 'e', 'E', '+', '-' characters
        if (invalidKeys.includes(e.key)) {
          e.preventDefault();
          return;
        }

        // Allow backspace, delete, tab, escape, enter, etc.
        const allowedKeys = [
          'Backspace',
          'Delete',
          'Tab',
          'Escape',
          'Enter',
          'ArrowLeft',
          'ArrowRight',
          'ArrowUp',
          'ArrowDown',
          'Home',
          'End',
        ];

        if (allowedKeys.includes(e.key)) {
          // Let these pass through
        } else if (e.key === '.') {
          // Allow decimal point, but prevent if already has one
          const currentValue = (e.target as HTMLInputElement).value;
          if (currentValue.includes('.')) {
            e.preventDefault();
          }
        } else if (!/^\d$/.test(e.key)) {
          // Allow only digits
          e.preventDefault();
        }
      }

      onKeyDown?.(e);
    };

    // On blur, format the value to the specified decimal places
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      if (isDecimalInput && e.target.value) {
        const numValue = parseFloat(e.target.value);
        if (!isNaN(numValue)) {
          // Round to decimalScale places
          const rounded = numValue.toFixed(decimalScale!);
          e.target.value = rounded;
          // Trigger onChange with formatted value
          if (onChange) {
            const changeEvent = {
              ...e,
              target: { ...e.target, value: rounded },
            } as React.ChangeEvent<HTMLInputElement>;
            onChange(changeEvent);
          }
        }
      }

      if (onBlur) {
        onBlur(e);
      }
    };

    const inputElement = (
      <input
        ref={ref}
        id={name}
        name={name}
        type={isDecimalInput ? 'text' : type}
        inputMode={isDecimalInput ? 'decimal' : inputMode}
        placeholder={placeholder}
        className={baseInputClasses}
        disabled={disabled}
        defaultValue={defaultValue}
        value={value ?? ''}
        readOnly={readOnly}
        required={required}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={onFocus}
        onKeyDown={handleKeyDown}
        step={step}
        min={min}
        max={max}
      />
    );

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={name}
            className="mb-1.5 block text-sm font-medium text-[#1a1c1b] dark:text-white"
          >
            {label}

            {required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}

        {suffix ? (
          <div className="relative">
            {inputElement}

            <div
              className={`
                absolute right-3 top-1/2
                -translate-y-1/2
                select-none
                text-xs text-[#4f4535]
                dark:text-slate-400
                ${suffixClassName}
              `}
            >
              {suffix}
            </div>
          </div>
        ) : (
          inputElement
        )}
      </div>
    );
  }
);

GenericInputField.displayName = 'GenericInputField';

export default GenericInputField;
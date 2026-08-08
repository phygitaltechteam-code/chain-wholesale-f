// components/Forms/Input/GenericInputField.tsx
import React, { forwardRef } from 'react';

interface InputProps {
  name?: string;
  label?: string;
  type?: string;
  inputMode?: 'text' | 'numeric' | 'decimal' | 'search' | 'email' | 'tel' | 'url' | 'none';
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
  decimalScale?: number;
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

    // Keep maximum 3 decimal places while typing
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (decimalScale !== undefined) {
        const inputValue = e.target.value;

        // Allow empty value
        if (inputValue === '') {
          onChange?.(e);
          return;
        }

        // Allow only numbers and decimal point
        if (!/^\d*\.?\d*$/.test(inputValue)) {
          return;
        }

        // Check decimal places
        const decimalPart = inputValue.split('.')[1];

        if (
          decimalPart !== undefined &&
          decimalPart.length > decimalScale
        ) {
          return;
        }
      }

      onChange?.(e);
    };

    const inputElement = (
      <input
        ref={ref}
        name={name}
        type={type}
        inputMode={
          decimalScale !== undefined
            ? 'decimal'
            : inputMode
        }
        placeholder={placeholder}
        className={baseInputClasses}
        disabled={disabled}
        defaultValue={defaultValue}
        value={value}
        readOnly={readOnly}
        required={required}
        onChange={handleChange}
        onBlur={onBlur}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
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
            {required && (
              <span className="ml-1 text-red-500">*</span>
            )}
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
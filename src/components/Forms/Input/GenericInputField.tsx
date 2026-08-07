import React from 'react';
import { useFormContext, RegisterOptions } from 'react-hook-form';

interface InputProps {
  name: string;
  label?: string;
  type?: string;
  placeholder?: string;
  validation?: RegisterOptions;
  disabled?: boolean;
  defaultValue?: string;
  required?: boolean;
  as?: 'input' | 'textarea' | 'select';
  rows?: number;
  uppercase?: boolean;
  children?: React.ReactNode;
  className?: string;
  readOnly?: boolean;
  value?: string | number;
}

const GenericInputField: React.FC<InputProps> = ({
  name,
  label,
  type = 'text',
  placeholder,
  validation,
  disabled = false,
  defaultValue,
  required = false,
  as = 'input',
  rows = 3,
  uppercase = false,
  children,
  className = '',
  readOnly = false,
  value,
}) => {
  const {
    register,
    formState: { errors },
    setValue,
  } = useFormContext();

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { value } = e.target;
    if (type === 'number') {
      setValue(name, Number(value));
    }
  };

  // Check if field is read-only or disabled
  const isReadOnly = readOnly || disabled;

  const baseInputClasses = `w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-2 text-sm text-left text-[#1a1c1b] outline-none transition-all duration-200 focus:border-[#785600] focus:ring-2 focus:ring-[#785600]/10 dark:bg-slate-800 dark:text-white dark:border-slate-700 ${
    uppercase ? 'uppercase' : ''
  } ${
    isReadOnly 
      ? 'bg-gray-50 text-slate-600 dark:bg-slate-700 dark:text-slate-300 cursor-default border-transparent' 
      : 'hover:border-[#785600]/50'
  } ${className}`;

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="mb-1 block text-xs font-medium text-[#4f4535] dark:text-slate-400">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      {as === 'textarea' ? (
        <textarea
          placeholder={placeholder}
          className={`${baseInputClasses} resize-none`}
          disabled={disabled || readOnly}
          defaultValue={defaultValue}
          rows={rows}
          {...register(name, validation)}
          onChange={handleInputChange}
        />
      ) : as === 'select' ? (
        <select
          className={baseInputClasses}
          disabled={disabled || readOnly}
          defaultValue={defaultValue}
          {...register(name, validation)}
          onChange={handleInputChange}
        >
          {children}
        </select>
      ) : (
        <input
          type={type}
          placeholder={placeholder}
          className={baseInputClasses}
          disabled={disabled || readOnly}
          defaultValue={defaultValue}
          value={value}
          readOnly={readOnly}
          {...register(name, validation)}
          onChange={(e) => {
            register(name).onChange(e);
            handleInputChange(e);
          }}
        />
      )}

      {errors[name] && (
        <p className="mt-1 text-xs text-red-500">
          {errors[name]?.message as string}
        </p>
      )}
    </div>
  );
};

export default GenericInputField;

// import React from 'react';
// import {useFormContext, RegisterOptions} from 'react-hook-form';

// interface InputProps {
//   name: string;
//   label?: string;
//   type?: string;
//   placeholder?: string;
//   validation?: RegisterOptions;
//   disabled?: boolean;
//   defaultValue?: string;
//   required?: boolean;
// }

// const GenericInputField: React.FC<InputProps> = ({
//   name,
//   label,
//   type = 'text',
//   placeholder,
//   validation,
//   disabled = false,
//   defaultValue,
//   required = false,
// }) => {
//   const {
//     register,
//     formState: {errors},
//     setValue,
//   } = useFormContext();

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const {value} = e.target;
//     if (type === 'number') {
//       setValue(name, Number(value));
//     }
//   };

//   return (
//     <div className="w-full">
//       {label && (
//         <label className="mb-2.5 block text-black dark:text-white">
//           {label}
//           <span className="text-lg font-bold text-red-600">
//             &nbsp;{required && '*'}
//           </span>
//         </label>
//       )}

//       <input
//         type={type}
//         placeholder={placeholder}
//         className="w-full rounded border-[1.7px] border-stroke bg-transparent px-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
//         disabled={disabled}
//         defaultValue={defaultValue}
//         {...register(name, validation)}
//         onChange={handleInputChange} // Handle the number conversion for number types
//       />
//       {errors[name] && (
//         <p className="mt-1 text-sm text-red-500">
//           {errors[name]?.message as string}
//         </p>
//       )}
//     </div>
//   );
// };

// export default GenericInputField;

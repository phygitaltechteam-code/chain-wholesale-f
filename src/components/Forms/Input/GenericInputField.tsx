import React from 'react';
import {useFormContext, RegisterOptions} from 'react-hook-form';

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
  children?: React.ReactNode; // For select options
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
}) => {
  const {
    register,
    formState: {errors},
    setValue,
  } = useFormContext();

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const {value} = e.target;
    if (type === 'number') {
      setValue(name, Number(value));
    }
  };

  const baseInputClasses = `w-full rounded-lg border-0 bg-[#f4f4f2] py-2.5 pl-7 pr-3 text-right text-sm text-[#1a1c1b] outline-none focus:ring-2 focus:ring-[#785600]/20 ${
    uppercase ? 'uppercase' : ''
  }`;

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-on-surface-variant ml-1 text-xs font-semibold uppercase tracking-wider">
          {label}
          {required && <span className="ml-1 text-red-600">*</span>}
        </label>
      )}

      {as === 'textarea' ? (
        <textarea
          placeholder={placeholder}
          className={`${baseInputClasses} resize-none`}
          disabled={disabled}
          defaultValue={defaultValue}
          rows={rows}
          {...register(name, validation)}
          onChange={handleInputChange}
        />
      ) : as === 'select' ? (
        <select
          className={baseInputClasses}
          disabled={disabled}
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
          disabled={disabled}
          defaultValue={defaultValue}
          {...register(name, validation)}
          onChange={handleInputChange}
        />
      )}

      {errors[name] && (
        <p className="mt-1 text-sm text-red-500">
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

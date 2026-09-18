import React, {useEffect} from 'react';
import {useForm, FormProvider, Controller} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {Plus, Check, X} from 'lucide-react';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import GenericDropdown from '@/components/Forms/DropDown/GenericDropDown';
import GenericButton from '@/components/Forms/Buttons/GenericButton';

// Karigar Zod Schema
export const karigarSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name should only contain letters and spaces'),
  phoneNumber: z
    .string()
    .length(10, 'Phone number must be exactly 10 digits')
    .regex(/^\d{10}$/, 'Phone number must contain 10 digits only'),
  address: z.string().optional(),
  employmentType: z.enum(['inhouse', 'outhouse']),
  salary: z.coerce.number().optional(),
  due: z.coerce.number().optional(),
  openingBalance: z.coerce.number().optional(),
  password: z
    .string()
    .min(1, 'Password is required'),
}).refine(
  (data) => {
    if (data.employmentType === 'inhouse') {
      return data.salary !== undefined && data.salary > 0;
    }
    return true;
  },
  {
    message: 'Monthly salary is required and must be greater than 0 for inhouse karigar',
    path: ['salary'],
  }
);

export type KarigarFormData = z.infer<typeof karigarSchema>;

interface KarigarFormProps {
  onSuccess: (data: KarigarFormData) => void;
  onCancel: () => void;
  isPending: boolean;
  initialData?: any;
  isEditMode?: boolean;
}

export const KarigarForm: React.FC<KarigarFormProps> = ({
  onSuccess,
  onCancel,
  isPending,
  initialData,
  isEditMode = false,
}) => {
  const methods = useForm<KarigarFormData>({
    resolver: zodResolver(karigarSchema),
    defaultValues: {
      name: initialData?.name || '',
      phoneNumber: initialData?.phoneNumber || '',
      address: initialData?.address || '',
      employmentType:
        initialData?.type === 'IN_HOUSE' || initialData?.employmentType === 'inhouse'
          ? 'inhouse'
          : 'outhouse',
      salary: initialData?.salary || undefined,
      due: initialData?.due || undefined,
      openingBalance: initialData?.openingBalance || undefined,
      password: initialData?.password || '',
    },
    mode: 'onTouched',
  });

  const {
    handleSubmit,
    reset,
    watch,
    control,
    formState: {errors},
  } = methods;

  const watchedEmploymentType = watch('employmentType');

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || '',
        phoneNumber: initialData.phoneNumber || '',
        address: initialData.address || '',
        employmentType:
          initialData.type === 'IN_HOUSE' || initialData.employmentType === 'inhouse'
            ? 'inhouse'
            : 'outhouse',
        salary: initialData.salary || undefined,
        due: initialData.due || undefined,
        openingBalance: initialData.openingBalance || undefined,
        password: initialData.password || '',
      });
    }
  }, [initialData, reset]);

  const employmentOptions = [
    {value: 'inhouse', label: 'Inhouse'},
    {value: 'outhouse', label: 'OutSource'},
  ];

  // Prevent entering non-numeric characters for phone
  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedKeys = [
      'Backspace',
      'Delete',
      'Tab',
      'Escape',
      'Enter',
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End',
    ];
    if (allowedKeys.includes(e.key) || (e.ctrlKey && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase()))) {
      return;
    }
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  // Prevent entering non-alphabetic characters for name
  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedKeys = [
      'Backspace',
      'Delete',
      'Tab',
      'Escape',
      'Enter',
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End',
      ' ',
    ];
    if (allowedKeys.includes(e.key) || (e.ctrlKey && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase()))) {
      return;
    }
    if (!/^[a-zA-Z]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const onSubmit = (data: KarigarFormData) => {
    onSuccess(data);
    if (!isEditMode) {
      reset({
        name: '',
        phoneNumber: '',
        address: '',
        employmentType: 'outhouse',
        salary: undefined,
        due: undefined,
        openingBalance: undefined,
        password: '',
      });
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-6 rounded-2xl border border-[#d3c4af]/20 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="mb-5 flex items-center justify-between border-b border-[#d3c4af]/10 pb-4 dark:border-slate-800">
            <div>
              <h3 className="font-['Playfair_Display'] text-lg font-bold text-[#1a1c1b] dark:text-white">
                {isEditMode ? 'Edit Artisan Profile' : 'Add New Artisan (Karigar)'}
              </h3>
              <p className="text-xs text-[#4f4535] dark:text-slate-400">
                Configure artisan credentials, employment type & wage structure
              </p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Full Name */}
            <div>
              <Controller
                name="name"
                control={control}
                render={({field}) => (
                  <GenericInputField
                    {...field}
                    label="Full Name"
                    placeholder="Enter karigar name (letters only)"
                    required
                    onKeyDown={handleNameKeyDown}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                      field.onChange(val);
                    }}
                  />
                )}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <Controller
                name="phoneNumber"
                control={control}
                render={({field}) => (
                  <GenericInputField
                    {...field}
                    label="Phone Number"
                    type="tel"
                    inputMode="numeric"
                    placeholder="Enter 10-digit phone number"
                    required
                    onKeyDown={handlePhoneKeyDown}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      field.onChange(val);
                    }}
                  />
                )}
              />
              {errors.phoneNumber && (
                <p className="mt-1 text-xs text-red-500">{errors.phoneNumber.message}</p>
              )}
            </div>

            {/* Employment Type */}
            <div>
              <GenericDropdown
                name="employmentType"
                label="Employment Type"
                options={employmentOptions}
                control={control as any}
                required
              />
              {errors.employmentType && (
                <p className="mt-1 text-xs text-red-500">{errors.employmentType.message}</p>
              )}
            </div>

            {/* Monthly Salary */}
            {watchedEmploymentType === 'inhouse' && (
              <div>
                <Controller
                  name="salary"
                  control={control}
                  render={({field}) => (
                    <GenericInputField
                      {...field}
                      value={field.value ?? ''}
                      label="Monthly Salary (₹)"
                      type="text"
                      decimalScale={2}
                      inputMode="decimal"
                      placeholder="Enter salary in ₹"
                      required
                      onChange={(e) => {
                        const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                        field.onChange(val);
                      }}
                    />
                  )}
                />
                {errors.salary && (
                  <p className="mt-1 text-xs text-red-500">{errors.salary.message}</p>
                )}
              </div>
            )}

            {/* Password */}
            <div>
              <Controller
                name="password"
                control={control}
                render={({field}) => (
                  <GenericInputField
                    {...field}
                    label="Login Password"
                    type="password"
                    placeholder="Enter login password"
                    required
                  />
                )}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* Due */}
            <div>
              <Controller
                name="due"
                control={control}
                render={({field}) => (
                  <GenericInputField
                    {...field}
                    value={field.value ?? ''}
                    label="Due (Optional)"
                    type="number"
                    decimalScale={2}
                    placeholder="Enter due amount"
                    onChange={(e) => {
                      const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                      field.onChange(val);
                    }}
                  />
                )}
              />
            </div>

            {/* Opening Balance */}
            <div>
              <Controller
                name="openingBalance"
                control={control}
                render={({field}) => (
                  <GenericInputField
                    {...field}
                    value={field.value ?? ''}
                    label="Opening Balance (Optional)"
                    type="number"
                    decimalScale={2}
                    placeholder="Enter opening balance"
                    onChange={(e) => {
                      const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                      field.onChange(val);
                    }}
                  />
                )}
              />
            </div>

            {/* Address */}
            <div className={watchedEmploymentType === 'inhouse' ? 'sm:col-span-2' : ''}>
              <Controller
                name="address"
                control={control}
                render={({field}) => (
                  <GenericInputField
                    {...field}
                    label="Address (Optional)"
                    placeholder="Enter city / workshop address"
                  />
                )}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-[#d3c4af]/10 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-[#d3c4af]/30 px-5 py-2.5 text-sm font-medium text-[#4f4535] transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <GenericButton
              type="submit"
              isLoading={isPending}
              className="flex items-center gap-2 !px-6 !py-2.5"
            >
              {isEditMode ? <Check size={16} /> : <Plus size={16} />}
              {isEditMode ? 'Update Artisan' : 'Save Artisan'}
            </GenericButton>
          </div>
        </div>
      </form>
    </FormProvider>
  );
};

export default KarigarForm;

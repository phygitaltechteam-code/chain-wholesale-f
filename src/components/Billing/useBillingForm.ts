// hooks/useBillingForm.ts
import {useState, useEffect} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';

import {BillingFormDataWithFields, MetalItem} from './billing.types';
import {BillingFormSchema} from './BillingSchema';

export const useBillingForm = () => {
  const methods = useForm<BillingFormDataWithFields>({
    resolver: zodResolver(BillingFormSchema),
    defaultValues: {
      metalType: '',
      fineWeight: '',
      rate: '',
      exchangeFineWeight: '0', // Add this field
      makingChargeType: 'g',
      makingChargeValue: '',
      hsnCode: '',
      gstPercent: '3',
      discount: '0',
      exchangeMetalType: '',
      exchangeGrossWeight: '',
      exchangePurity: '0',
      exchangeRate: '',
      cashPaid: '',
      previousBalance: '0',
      metalAdjustment: '0',
    },
  });

  const [metalItem, setMetalItem] = useState<MetalItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    metalName?: string;
    fineWeight?: string;
    rate?: string;
  }>({});

  const {watch, setValue, getValues} = methods;
  const fineWeight = watch('fineWeight') || '0';
  const rate = watch('rate') || '0';
  const metalType = watch('metalType') || '';

  useEffect(() => {
    if (metalType || parseFloat(fineWeight) > 0 || parseFloat(rate) > 0) {
      setIsEditing(true);
    } else {
      setIsEditing(false);
    }
  }, [metalType, fineWeight, rate]);

  const handleFineWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    setValidationErrors((prev) => ({...prev, fineWeight: undefined}));
    if (/^\d*\.?\d*$/.test(value)) {
      if (value.includes('.')) {
        const parts = value.split('.');
        if (parts[1] && parts[1].length > 3) {
          value = parseFloat(value).toFixed(3);
        }
      }
      setValue('fineWeight', value);
    }
  };

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    setValidationErrors((prev) => ({...prev, rate: undefined}));
    if (/^\d*\.?\d*$/.test(value)) {
      if (value.includes('.')) {
        const parts = value.split('.');
        if (parts[1] && parts[1].length > 2) {
          value = parseFloat(value).toFixed(2);
        }
      }
      setValue('rate', value);
    }
  };

  const removeMetalItem = () => {
    setMetalItem(null);
    setValue('metalType', '');
    setValue('fineWeight', '');
    setValue('rate', '');
    setIsEditing(false);
  };

  const resetForm = () => {
    setMetalItem(null);
    setValue('metalType', '');
    setValue('fineWeight', '');
    setValue('rate', '');
    setValue('makingChargeValue', '');
    setValue('discount', '0');
    setValue('metalAdjustment', '0');
    setValue('cashPaid', '');
    setValue('exchangeMetalType', '');
    setValue('exchangeGrossWeight', '');
    setValue('exchangePurity', '');
    setValue('exchangeRate', '');
    setValue('previousBalance', '0');
    setValidationErrors({});
    setIsEditing(false);
  };

  return {
    methods,
    metalItem,
    setMetalItem,
    isEditing,
    validationErrors,
    handleFineWeightChange,
    handleRateChange,
    removeMetalItem,
    resetForm,
  };
};

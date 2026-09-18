import React, {useState, useEffect} from 'react';
import {X, Check, Building2, Phone, MapPin, FileText} from 'lucide-react';
import toast from 'react-hot-toast';
import {useUpdatesupplier, SupplierFormData, Supplier} from './api';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import GenericButton from '@/components/Forms/Buttons/GenericButton';

interface EditSupplierProps {
  isOpen: boolean;
  onClose: () => void;
  supplierId: string;
  supplierData: any;
  onSuccess?: () => void;
}

export const EditSupplier: React.FC<EditSupplierProps> = ({
  isOpen,
  onClose,
  supplierId,
  supplierData,
  onSuccess,
}) => {
  const updateSupplierMutation = useUpdatesupplier(supplierId);

  const [formData, setFormData] = useState<SupplierFormData>({
    fullname: '',
    shopName: '',
    phoneNumber: '',
    secondaryPhoneNumber: '',
    city: '',
    address: '',
    GST: '',
    PAN: '',
    aadhar: '',
  });

  useEffect(() => {
    if (supplierData) {
      setFormData({
        fullname: supplierData.fullname || '',
        shopName: supplierData.shopName || '',
        phoneNumber: supplierData.phoneNumber || '',
        secondaryPhoneNumber: supplierData.secondaryPhoneNumber || '',
        city: supplierData.city || '',
        address: supplierData.address || '',
        GST: supplierData.GST || '',
        PAN: supplierData.PAN || '',
        aadhar: supplierData.aadhar || '',
      });
    }
  }, [supplierData]);

  if (!isOpen) return null;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullname.trim()) {
      toast.error('Supplier name is required');
      return;
    }
    if (!formData.phoneNumber || formData.phoneNumber.length < 10) {
      toast.error('Phone number must be at least 10 digits');
      return;
    }

    updateSupplierMutation.mutate(formData, {
      onSuccess: () => {
        onSuccess?.();
        onClose();
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#d3c4af]/20 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        <div className="mb-6 flex items-center justify-between border-b border-[#d3c4af]/10 pb-4 dark:border-slate-800">
          <div>
            <h3 className="font-['Playfair_Display'] text-xl font-bold text-[#1a1c1b] dark:text-white">
              Edit Supplier Profile
            </h3>
            <p className="text-xs text-[#4f4535] dark:text-slate-400">
              Update vendor credentials, business name & tax numbers
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <GenericInputField
                label="Full Name"
                placeholder="Enter supplier contact name"
                required
                value={formData.fullname}
                onChange={(e) => setFormData({...formData, fullname: e.target.value})}
              />
            </div>

            <div>
              <GenericInputField
                label="Shop / Business Name"
                placeholder="Enter company or shop name"
                value={formData.shopName || ''}
                onChange={(e) => setFormData({...formData, shopName: e.target.value})}
              />
            </div>

            <div>
              <GenericInputField
                label="Primary Phone Number"
                type="tel"
                inputMode="numeric"
                placeholder="Enter 10-digit mobile number"
                required
                value={formData.phoneNumber}
                onKeyDown={handlePhoneKeyDown}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    phoneNumber: e.target.value.replace(/\D/g, '').slice(0, 10),
                  })
                }
              />
            </div>

            <div>
              <GenericInputField
                label="Secondary Phone Number"
                type="tel"
                inputMode="numeric"
                placeholder="Alternate phone number (optional)"
                value={formData.secondaryPhoneNumber || ''}
                onKeyDown={handlePhoneKeyDown}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    secondaryPhoneNumber: e.target.value.replace(/\D/g, '').slice(0, 10),
                  })
                }
              />
            </div>

            <div>
              <GenericInputField
                label="City"
                placeholder="Enter city"
                value={formData.city || ''}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
              />
            </div>

            <div>
              <GenericInputField
                label="GST Number"
                placeholder="e.g. 27AABCT1234D1Z5"
                value={formData.GST || ''}
                onChange={(e) => setFormData({...formData, GST: e.target.value.toUpperCase()})}
              />
            </div>

            <div>
              <GenericInputField
                label="PAN Number"
                placeholder="e.g. AABCT1234D"
                value={formData.PAN || ''}
                onChange={(e) => setFormData({...formData, PAN: e.target.value.toUpperCase()})}
              />
            </div>

            <div>
              <GenericInputField
                label="Aadhar Number"
                placeholder="12-digit Aadhar (optional)"
                value={formData.aadhar || ''}
                onKeyDown={handlePhoneKeyDown}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    aadhar: e.target.value.replace(/\D/g, '').slice(0, 12),
                  })
                }
              />
            </div>

            <div className="sm:col-span-2">
              <GenericInputField
                label="Complete Address"
                placeholder="Workshop, office, or store street address"
                value={formData.address || ''}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3 border-t border-[#d3c4af]/10 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#d3c4af]/30 px-6 py-2.5 text-sm font-medium text-[#4f4535] transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <GenericButton
              type="submit"
              isLoading={updateSupplierMutation.isPending}
              className="flex items-center gap-2 !px-7 !py-2.5 shadow-md"
            >
              <Check size={16} />
              <span>Update Supplier</span>
            </GenericButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSupplier;

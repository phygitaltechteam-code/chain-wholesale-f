import React, {useState} from 'react';
import {X} from 'lucide-react';
import toast from 'react-hot-toast';
import {useSubmitCrystal} from './jobcreationapi';
import {useGetsupplier} from '@/components/Supplier/api';

interface AddCrystalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (crystal: any) => void;
}

export const AddCrystalModal: React.FC<AddCrystalModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const {data: supplierData} = useGetsupplier();
  const submitCrystal = useSubmitCrystal();

  const [form, setForm] = useState({
    name: '',
    supplierId: '',
    clarity: 'VS1',
    color: 'G',
    lab: 'GIA',
    shape: 'Round',
    size: 'Medium',
    qty: 1,
    wt: 0,
    carat: 0,
    rate: 0,
    amount: 0,
    isInHouse: false,
  });

  if (!isOpen) return null;

  const supplierList = Array.isArray(supplierData?.data || supplierData)
    ? supplierData?.data || supplierData
    : [];

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error('Crystal name is required');
      return;
    }

    const payload = {
      ...form,
      qty: Number(form.qty) || 1,
      wt: parseFloat(String(form.wt)) || 0,
      carat: parseFloat(String(form.carat)) || 0,
      rate: parseFloat(String(form.rate)) || 0,
      amount: parseFloat(String(form.amount)) || 0,
    };

    submitCrystal.mutate(payload, {
      onSuccess: (res: any) => {
        onSuccess(res?.data || res);
        onClose();
      },
    });
  };

  const handleNumericKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    allowDecimal = true,
  ) => {
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
    if (
      allowedKeys.includes(e.key) ||
      (e.ctrlKey && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase()))
    ) {
      return;
    }
    if (allowDecimal && e.key === '.') {
      if ((e.target as HTMLInputElement).value.includes('.')) {
        e.preventDefault();
      }
      return;
    }
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#d3c4af]/20 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between border-b border-[#d3c4af]/10 pb-4 dark:border-slate-800">
          <h3 className="font-['Playfair_Display'] text-xl font-bold text-[#1a1c1b] dark:text-white">
            Add Crystal
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="space-y-4">
          {/* Row 1: Crystal Name & Supplier */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
                CRYSTAL NAME <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})}
                placeholder="Enter crystal name"
                className="w-full rounded-xl border border-[#d3c4af]/30 bg-white px-3.5 py-2.5 text-sm text-[#1a1c1b] outline-none transition-all placeholder:text-[#817563] focus:border-[#785600] focus:ring-1 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
                SUPPLIER
              </label>
              <select
                value={form.supplierId}
                onChange={(e) => setForm({...form, supplierId: e.target.value})}
                className="w-full rounded-xl border border-[#d3c4af]/30 bg-white px-3.5 py-2.5 text-sm text-[#1a1c1b] outline-none transition-all focus:border-[#785600] focus:ring-1 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="">Select option</option>
                {supplierList.map((s: any) => (
                  <option key={s.id || s._id} value={s.id || s._id}>
                    {s.fullname || s.shopName || s.name || 'Supplier'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Clarity, Color, Laboratory, Shape */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
                CLARITY
              </label>
              <select
                value={form.clarity}
                onChange={(e) => setForm({...form, clarity: e.target.value})}
                className="w-full rounded-xl border border-[#d3c4af]/30 bg-white px-3 py-2.5 text-sm text-[#1a1c1b] outline-none transition-all focus:border-[#785600] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {[
                  'VS1',
                  'VVS1',
                  'VVS2',
                  'SI1',
                  'SI2',
                  'I1',
                  'I2',
                  'FL',
                  'IF',
                ].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
                COLOR
              </label>
              <select
                value={form.color}
                onChange={(e) => setForm({...form, color: e.target.value})}
                className="w-full rounded-xl border border-[#d3c4af]/30 bg-white px-3 py-2.5 text-sm text-[#1a1c1b] outline-none transition-all focus:border-[#785600] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
                LABORATORY
              </label>
              <select
                value={form.lab}
                onChange={(e) => setForm({...form, lab: e.target.value})}
                className="w-full rounded-xl border border-[#d3c4af]/30 bg-white px-3 py-2.5 text-sm text-[#1a1c1b] outline-none transition-all focus:border-[#785600] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {['GIA', 'IGI', 'HRD', 'AGS', 'None'].map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
                SHAPE
              </label>
              <select
                value={form.shape}
                onChange={(e) => setForm({...form, shape: e.target.value})}
                className="w-full rounded-xl border border-[#d3c4af]/30 bg-white px-3 py-2.5 text-sm text-[#1a1c1b] outline-none transition-all focus:border-[#785600] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {[
                  'Round',
                  'Princess',
                  'Emerald',
                  'Oval',
                  'Pear',
                  'Heart',
                  'Marquise',
                  'Cushion',
                  'Radiant',
                ].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Size, Qty, Weight, Carat */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
                SIZE
              </label>
              <select
                value={form.size}
                onChange={(e) => setForm({...form, size: e.target.value})}
                className="w-full rounded-xl border border-[#d3c4af]/30 bg-white px-3 py-2.5 text-sm text-[#1a1c1b] outline-none transition-all focus:border-[#785600] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {['Small', 'Medium', 'Large', 'Very Large'].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
                QTY
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={form.qty}
                onKeyDown={(e) => handleNumericKeyDown(e, false)}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setForm({...form, qty: Number(val) || 0});
                }}
                className="w-full rounded-xl border border-[#d3c4af]/30 bg-white px-3.5 py-2.5 text-sm text-[#1a1c1b] outline-none transition-all focus:border-[#785600] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
                WEIGHT
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={form.wt === 0 ? '0' : form.wt || ''}
                onKeyDown={(e) => handleNumericKeyDown(e, true)}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, '');
                  setForm({...form, wt: parseFloat(val) || 0});
                }}
                className="w-full rounded-xl border border-[#d3c4af]/30 bg-white px-3.5 py-2.5 text-sm text-[#1a1c1b] outline-none transition-all focus:border-[#785600] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
                CARAT
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={form.carat === 0 ? '0' : form.carat || ''}
                onKeyDown={(e) => handleNumericKeyDown(e, true)}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, '');
                  setForm({...form, carat: parseFloat(val) || 0});
                }}
                className="w-full rounded-xl border border-[#d3c4af]/30 bg-white px-3.5 py-2.5 text-sm text-[#1a1c1b] outline-none transition-all focus:border-[#785600] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Row 4: Rate, Amount, Inhouse */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
                RATE
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={form.rate === 0 ? '0' : form.rate || ''}
                onKeyDown={(e) => handleNumericKeyDown(e, true)}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, '');
                  const rateNum = parseFloat(val) || 0;
                  const amt = Number(
                    (
                      rateNum * (form.wt || form.carat || form.qty || 1)
                    ).toFixed(2),
                  );
                  setForm({
                    ...form,
                    rate: rateNum,
                    amount: form.amount === 0 ? amt : form.amount,
                  });
                }}
                className="w-full rounded-xl border border-[#d3c4af]/30 bg-white px-3.5 py-2.5 text-sm text-[#1a1c1b] outline-none transition-all focus:border-[#785600] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
                AMOUNT
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={form.amount === 0 ? '0' : form.amount || ''}
                onKeyDown={(e) => handleNumericKeyDown(e, true)}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, '');
                  setForm({...form, amount: parseFloat(val) || 0});
                }}
                className="w-full rounded-xl border border-[#d3c4af]/30 bg-white px-3.5 py-2.5 text-sm text-[#1a1c1b] outline-none transition-all focus:border-[#785600] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
                Inhouse
              </label>
              <div className="flex h-[42px] items-center rounded-xl border border-[#d3c4af]/30 bg-white px-3.5 dark:border-slate-700 dark:bg-slate-800">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isInHouse}
                    onChange={(e) =>
                      setForm({...form, isInHouse: e.target.checked})
                    }
                    className="h-4 w-4 rounded accent-[#785600]"
                  />
                  <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
                    Inhouse
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-end gap-3 border-t border-[#d3c4af]/10 pt-4 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#d3c4af]/30 px-6 py-2.5 text-sm font-medium text-[#4f4535] transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={submitCrystal.isPending}
            className="flex items-center gap-2 rounded-xl bg-[#785600] px-7 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#785600]/20 transition-all hover:bg-[#986d00] disabled:opacity-50"
          >
            {submitCrystal.isPending ? 'Saving...' : 'Save Crystal'}
          </button>
        </div>
      </div>
    </div>
  );
};

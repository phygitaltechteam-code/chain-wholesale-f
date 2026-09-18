import React, {useRef} from 'react';
import {Upload, X} from 'lucide-react';
import toast from 'react-hot-toast';

interface JobItemDetailsSectionProps {
  item: {
    itemName: string;
    description: string;
    metal: 'GOLD' | 'SILVER';
    grossWt?: number;
    fineWt?: number;
    purity?: number;
    deliveryDate: string;
    images: File[];
    imagePreviews: string[];
  };
  onChange: (updated: any) => void;
}

export const JobItemDetailsSection: React.FC<JobItemDetailsSectionProps> = ({
  item,
  onChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const currentImages = item.images || [];
    const currentPreviews = item.imagePreviews || [];
    const remainingSlots = 4 - currentImages.length;
    const validFiles = files.slice(0, remainingSlots);

    if (validFiles.length === 0 && currentImages.length >= 4) {
      toast.error('Maximum 4 images allowed');
      return;
    }

    const newPreviews = validFiles.map((file) => URL.createObjectURL(file));
    onChange({
      ...item,
      images: [...currentImages, ...validFiles],
      imagePreviews: [...currentPreviews, ...newPreviews],
    });
  };

  const removeImage = (index: number) => {
    const currentImages = item.images || [];
    const currentPreviews = item.imagePreviews || [];
    URL.revokeObjectURL(currentPreviews[index]);
    onChange({
      ...item,
      images: currentImages.filter((_, i) => i !== index),
      imagePreviews: currentPreviews.filter((_, i) => i !== index),
    });
  };

  const handleGrossOrPurityChange = (gross?: number, purity?: number) => {
    const g = gross !== undefined ? gross : item.grossWt;
    const p = purity !== undefined ? purity : item.purity;
    const fine =
      g !== undefined && p !== undefined && p > 0
        ? Number(((g * p) / 100).toFixed(3))
        : undefined;

    onChange({
      ...item,
      grossWt: gross !== undefined ? gross : item.grossWt,
      purity: purity !== undefined ? purity : item.purity,
      fineWt: fine,
    });
  };

  return (
    <div className="rounded-2xl border border-[#d3c4af]/20 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-[#785600] dark:text-amber-400">
        Job Item Details
      </h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-[#4f4535] dark:text-slate-400">
            Item Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g., Gold Necklace"
            value={item.itemName}
            onChange={(e) => onChange({...item, itemName: e.target.value})}
            className="w-full rounded-xl border border-[#d3c4af]/30 bg-white px-3.5 py-2 text-sm outline-none focus:border-[#785600] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-[#4f4535] dark:text-slate-400">
            Description
          </label>
          <input
            type="text"
            placeholder="Design details"
            value={item.description}
            onChange={(e) => onChange({...item, description: e.target.value})}
            className="w-full rounded-xl border border-[#d3c4af]/30 bg-white px-3.5 py-2 text-sm outline-none focus:border-[#785600] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-[#4f4535] dark:text-slate-400">
            Gross Wt (g) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.001"
            placeholder="0.000"
            value={item.grossWt ?? ''}
            onChange={(e) =>
              handleGrossOrPurityChange(
                e.target.value === '' ? undefined : parseFloat(e.target.value),
              )
            }
            className="w-full rounded-xl border border-[#d3c4af]/30 bg-white px-3.5 py-2 text-sm font-semibold outline-none focus:border-[#785600] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-[#4f4535] dark:text-slate-400">
            Purity (%) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.1"
            placeholder="91.6"
            value={item.purity ?? ''}
            onChange={(e) =>
              handleGrossOrPurityChange(
                undefined,
                e.target.value === '' ? undefined : parseFloat(e.target.value),
              )
            }
            className="w-full rounded-xl border border-[#d3c4af]/30 bg-white px-3.5 py-2 text-sm outline-none focus:border-[#785600] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-[#4f4535] dark:text-slate-400">
            Metal Type
          </label>
          <select
            value={item.metal}
            onChange={(e) => onChange({...item, metal: e.target.value as 'GOLD' | 'SILVER'})}
            className="w-full rounded-xl border border-[#d3c4af]/30 bg-white px-3.5 py-2 text-sm outline-none focus:border-[#785600] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="GOLD">Gold</option>
            <option value="SILVER">Silver</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-[#4f4535] dark:text-slate-400">
            Delivery Date
          </label>
          <input
            type="date"
            value={item.deliveryDate}
            onChange={(e) => onChange({...item, deliveryDate: e.target.value})}
            className="w-full rounded-xl border border-[#d3c4af]/30 bg-white px-3.5 py-2 text-sm outline-none focus:border-[#785600] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-bold uppercase text-[#4f4535] dark:text-slate-400">
            IMAGES (MAX 4)
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {item.imagePreviews.map((preview, index) => (
              <div key={index} className="relative h-12 w-12 overflow-hidden rounded-xl border border-[#d3c4af]/30">
                <img src={preview} alt={`Upload ${index + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute right-0.5 top-0.5 rounded-full bg-red-500 p-0.5 text-white hover:bg-red-600"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
            {item.images.length < 4 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-12 w-12 flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#d3c4af]/40 bg-slate-50 text-slate-400 transition-colors hover:border-[#785600] hover:text-[#785600] dark:bg-slate-800"
              >
                <Upload size={14} />
                <span className="text-[8px] font-semibold">{4 - item.images.length} left</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobItemDetailsSection;

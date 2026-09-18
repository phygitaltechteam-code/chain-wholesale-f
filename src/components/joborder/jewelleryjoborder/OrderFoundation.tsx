import React, {useState} from 'react';
import {
  Package,
  Edit2,
  Calendar,
  Gem,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {Job} from './types';
import {formatCurrency} from '@/utils/utilities';

interface OrderFoundationProps {
  jobData: Job;
  onEdit?: () => void;
  onImageClick?: (image: string) => void;
  canEditJob?: boolean;
}

export const OrderFoundation: React.FC<OrderFoundationProps> = ({
  jobData,
  onEdit,
  onImageClick,
  canEditJob = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    return !isNaN(d.getTime())
      ? d.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : '—';
  };

  const clientName =
    jobData.client?.fullName || jobData.client?.fullname || 'Walk-in Client';

  return (
    <div className="rounded-2xl border border-[#d3c4af]/20 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex flex-1 cursor-pointer items-center gap-2.5"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-[#785600] dark:bg-amber-950/40 dark:text-amber-400">
            <Package size={18} />
          </div>
          <div>
            <h3 className="font-['Playfair_Display'] text-base font-bold text-[#1a1c1b] dark:text-white">
              Order Specifications & Material
            </h3>
            {isCollapsed && (
              <p className="text-xs text-[#817563]">
                {jobData.itemName} • {jobData.metal} (
                {(jobData.grossWeight || jobData.grossWt || 0).toFixed(3)}g) •{' '}
                {clientName}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canEditJob && onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="flex items-center gap-1 rounded-xl border border-[#d3c4af]/30 px-3 py-1.5 text-xs font-semibold text-[#785600] transition-colors hover:bg-amber-50 dark:border-slate-700 dark:text-amber-400 dark:hover:bg-slate-800"
            >
              <Edit2 size={13} />
              <span>Edit Order</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            title={isCollapsed ? 'Expand Details' : 'Collapse Details'}
          >
            {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="mt-4 border-t border-[#d3c4af]/10 pt-4 dark:border-slate-800">
          {/* Grid of details */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-xl border border-[#d3c4af]/15 bg-[#f9f9f7] p-2.5 dark:border-slate-800 dark:bg-slate-800/50">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#817563]">
                Item Name
              </p>
              <p className="mt-0.5 text-xs font-semibold text-[#1a1c1b] dark:text-white">
                {jobData.itemName || '—'}
              </p>
            </div>

            <div className="rounded-xl border border-[#d3c4af]/15 bg-[#f9f9f7] p-2.5 dark:border-slate-800 dark:bg-slate-800/50">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#817563]">
                Metal & Purity
              </p>
              <p className="mt-0.5 text-xs font-semibold text-[#785600] dark:text-amber-400">
                {jobData.metal} ({jobData.purity || '—'}%)
              </p>
            </div>

            <div className="rounded-xl border border-[#d3c4af]/15 bg-[#f9f9f7] p-2.5 dark:border-slate-800 dark:bg-slate-800/50">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#817563]">
                Gross Weight
              </p>
              <p className="mt-0.5 text-xs font-semibold text-[#1a1c1b] dark:text-white">
                {(jobData.grossWeight || jobData.grossWt || 0).toFixed(3)} g
              </p>
            </div>

            <div className="rounded-xl border border-[#d3c4af]/15 bg-[#f9f9f7] p-2.5 dark:border-slate-800 dark:bg-slate-800/50">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#817563]">
                Fine / Net Wt
              </p>
              <p className="mt-0.5 text-xs font-semibold text-[#1a1c1b] dark:text-white">
                {(
                  jobData.fineWeight ||
                  jobData.fineWt ||
                  jobData.netWeight ||
                  0
                ).toFixed(3)}{' '}
                g
              </p>
            </div>

            <div className="rounded-xl border border-[#d3c4af]/15 bg-[#f9f9f7] p-2.5 dark:border-slate-800 dark:bg-slate-800/50">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#817563]">
                Client
              </p>
              <p className="mt-0.5 truncate text-xs font-semibold text-[#1a1c1b] dark:text-white">
                {clientName}
              </p>
            </div>

            <div className="rounded-xl border border-[#d3c4af]/15 bg-[#f9f9f7] p-2.5 dark:border-slate-800 dark:bg-slate-800/50">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#817563]">
                Delivery Date
              </p>
              <p className="mt-0.5 text-xs font-semibold text-[#1a1c1b] dark:text-white">
                {formatDate(jobData.deliveryDate)}
              </p>
            </div>
          </div>

          {/* Advances & Description */}
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[#d3c4af]/15 bg-[#f9f9f7] p-2.5 dark:border-slate-800 dark:bg-slate-800/50">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#817563]">
                Cash Advance
              </p>
              <p className="mt-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {jobData.cashAdvance
                  ? formatCurrency(jobData.cashAdvance)
                  : '₹0.00'}
              </p>
            </div>

            <div className="rounded-xl border border-[#d3c4af]/15 bg-[#f9f9f7] p-2.5 dark:border-slate-800 dark:bg-slate-800/50">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#817563]">
                Metal Advance
              </p>
              <p className="mt-0.5 text-xs font-bold text-[#785600] dark:text-amber-400">
                {jobData.goldAdvance
                  ? `${jobData.goldAdvance}g Gold`
                  : jobData.silverAdvance
                    ? `${jobData.silverAdvance}g Silver`
                    : '0.00g'}
              </p>
            </div>

            <div className="rounded-xl border border-[#d3c4af]/15 bg-[#f9f9f7] p-2.5 dark:border-slate-800 dark:bg-slate-800/50">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#817563]">
                Order Date
              </p>
              <p className="mt-0.5 text-xs font-semibold text-[#1a1c1b] dark:text-white">
                {formatDate(jobData.createdAt)}
              </p>
            </div>
          </div>

          {jobData.description && (
            <div className="mt-3 rounded-xl border border-[#d3c4af]/10 bg-[#f9f9f7]/60 p-3 text-xs text-[#4f4535] dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300">
              <span className="font-bold text-[#817563]">
                Special Instructions / Description:{' '}
              </span>
              {jobData.description}
            </div>
          )}

          {/* Crystal Ledger Section */}
          {jobData.jobCrystals && jobData.jobCrystals.length > 0 && (
            <div className="mt-4 border-t border-[#d3c4af]/10 pt-3 dark:border-slate-800">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#785600] dark:text-amber-400">
                <Gem size={14} />
                <span>
                  Assigned Crystals & Gems ({jobData.jobCrystals.length})
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-[#d3c4af]/15">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[#d3c4af]/15 bg-slate-50 text-[11px] font-bold uppercase text-[#817563] dark:border-slate-800 dark:bg-slate-800/60">
                    <tr>
                      <th className="px-3 py-2">Stone Name</th>
                      <th className="px-3 py-2">Qty</th>
                      <th className="px-3 py-2">Shape</th>
                      <th className="px-3 py-2">Color</th>
                      <th className="px-3 py-2">Weight</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d3c4af]/10 dark:divide-slate-800">
                    {jobData.jobCrystals.map((item, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                      >
                        <td className="px-3 py-2 font-semibold text-[#1a1c1b] dark:text-white">
                          {item.crystal?.name || 'Crystal'}
                        </td>
                        <td className="px-3 py-2 font-medium">{item.qty}</td>
                        <td className="px-3 py-2 text-slate-500">
                          {item.crystal?.shape || 'Round'}
                        </td>
                        <td className="px-3 py-2 text-slate-500">
                          {item.crystal?.color || 'G'}
                        </td>
                        <td className="px-3 py-2 text-slate-500">
                          {item.crystal?.wt || 0}g
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Attached Media */}
          {jobData.images && jobData.images.length > 0 && (
            <div className="mt-4 border-t border-[#d3c4af]/10 pt-3 dark:border-slate-800">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#817563]">
                Attached Design Sketches & Images
              </p>
              <div className="flex flex-wrap gap-2.5">
                {jobData.images.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => onImageClick && onImageClick(img.image)}
                    className="group relative h-16 w-16 cursor-pointer overflow-hidden rounded-xl border border-[#d3c4af]/30 bg-slate-100 shadow-sm transition-all hover:scale-105 hover:shadow-md"
                  >
                    <img
                      src={img.image}
                      alt="Design"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      <ImageIcon size={16} className="text-white" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderFoundation;

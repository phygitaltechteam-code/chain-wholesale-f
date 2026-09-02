import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAddCuttingScrap } from '@/lib/api/processmelting';
import { formatNoTrailingZeros3Dec } from './cuttingUtils';
import toast from 'react-hot-toast';

export interface ScrapModalItem {
  id: string;
  purity: number;
  availableWeight: number;
  sendWeight?: string;
}

interface MeltingPopupProps {
  isOpen: boolean;
  onClose: () => void;
  scrapModalItems: ScrapModalItem[];
  scrapCalculations: {
    finalPurity: number;
    totalAvailableWeight: number;
  };
  refetchCuttingScrap: () => Promise<any>;
  refetch: () => Promise<any>;
  onSuccess: () => void;
  onSubmitScrap?: (payload: any) => Promise<any>;
}

const MeltingPopup: React.FC<MeltingPopupProps> = ({
  isOpen,
  onClose,
  scrapModalItems,
  scrapCalculations,
  refetchCuttingScrap,
  refetch,
  onSuccess,
  onSubmitScrap,
}) => {
  const [receivedPurity, setReceivedPurity] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [lossFineWeight, setLossFineWeight] = useState<string>('0');
  const [isManualLoss, setIsManualLoss] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const receivedscrap = useAddCuttingScrap();

  // Reset inputs to empty / default 0 when modal closes or opens
  useEffect(() => {
    if (isOpen) {
      setReceivedPurity('');
      setWeight('');
      setLossFineWeight('0');
      setIsManualLoss(false);
    }
  }, [isOpen]);

  // Auto-calculate Loss (Fine Wt) = Fine Gold Available - Fine Gold Received
  // Fine Gold Available = Total Scrap Wt * (Scrap Avg Purity / 100)
  // Fine Gold Received  = Melted Wt * (Received Purity % / 100)
  useEffect(() => {
    if (isManualLoss) return;

    const totalScrapW = scrapCalculations.totalAvailableWeight;
    const avgPurity = scrapCalculations.finalPurity;
    const meltedW = weight !== '' ? parseFloat(weight) : 0;
    const recvPurityVal = receivedPurity !== '' ? parseFloat(receivedPurity) : 0;

    if (!isNaN(meltedW) && meltedW > 0 && !isNaN(recvPurityVal) && recvPurityVal > 0 && avgPurity > 0 && totalScrapW > 0) {
      const fineGoldAvailable = (totalScrapW * avgPurity) / 100;
      const fineGoldReceived = (meltedW * recvPurityVal) / 100;
      const fineLoss = Math.max(0, fineGoldAvailable - fineGoldReceived);
      setLossFineWeight(formatNoTrailingZeros3Dec(fineLoss));
    } else {
      setLossFineWeight('0');
    }
  }, [receivedPurity, weight, scrapCalculations.finalPurity, scrapCalculations.totalAvailableWeight, isManualLoss]);

  if (!isOpen) return null;

  const handleProcessMelting = async () => {
    if (scrapModalItems.length === 0) {
      toast.error('No scrap items selected');
      return;
    }

    const payload = {
      items: scrapModalItems.map((item) => ({
        cuttingId: item.id,
        purity: item.purity,
        weight: item.availableWeight,
      })),
      avgPurity: Number(formatNoTrailingZeros3Dec(scrapCalculations.finalPurity)),
      avgWeight: Number(formatNoTrailingZeros3Dec(scrapCalculations.totalAvailableWeight)),
      receivedPurity: receivedPurity ? parseFloat(receivedPurity) : 0,
      receivedPercentage: receivedPurity ? parseFloat(receivedPurity) : 0,
      weight: weight ? parseFloat(weight) : 0,
      lossWeight: lossFineWeight ? parseFloat(lossFineWeight) : 0,
    };

    setIsSubmitting(true);
    try {
      if (onSubmitScrap) {
        await onSubmitScrap(payload);
      } else {
        await receivedscrap.mutateAsync({ data: payload });
      }

      setReceivedPurity('');
      setWeight('');
      setLossFineWeight('0');
      setIsManualLoss(false);

      onSuccess();
      await refetchCuttingScrap();
      await refetch();
      onClose();
    } catch (error: any) {
      console.error('Error in processing melting scrap:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isSubmitting || receivedscrap.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-lg flex-col rounded-2xl border border-[#d3c4af]/30 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#d3c4af]/20 pb-3">
          <h3 className="text-base font-bold text-[#1a1c1b] dark:text-white">
            Scrap Received & Melting
          </h3>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrap Table */}
        <div className="my-4 overflow-hidden rounded-xl border border-[#d3c4af]/30 bg-white dark:border-slate-800 dark:bg-slate-950">
          <table className="w-full text-left font-mono text-xs">
            {/* Header */}
            <thead className="border-b border-[#d3c4af]/20 bg-[#f9f9f7] font-bold text-slate-700 dark:bg-slate-900 dark:text-slate-300">
              <tr>
                <th className="p-3">Scrap</th>
                <th className="p-3 text-right">Wt</th>
              </tr>
            </thead>

            {/* Scrap Rows */}
            <tbody className="divide-y divide-[#d3c4af]/20 dark:divide-slate-800">
              {scrapModalItems.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td className="p-3 font-semibold text-[#1a1c1b] dark:text-white">
                    Scrap {item.purity}%
                  </td>

                  <td className="p-3 text-right font-mono font-bold text-[#1a1c1b] dark:text-slate-400">
                    {formatNoTrailingZeros3Dec(item.availableWeight)} g
                  </td>
                </tr>
              ))}
            </tbody>

            {/* Scrap Average */}
            <tfoot className="border-t-2 border-[#d3c4af]/40 bg-[#f9f9f7] dark:bg-slate-900">
              <tr>
                <td className="p-3 font-bold text-[#785600] dark:text-amber-400">
                  Scrap Avg ({formatNoTrailingZeros3Dec(scrapCalculations.finalPurity)}%)
                </td>

                <td className="p-3 text-right font-mono font-bold text-[#785600] dark:text-amber-400">
                  {formatNoTrailingZeros3Dec(scrapCalculations.totalAvailableWeight)} g
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Received (%) / Wt / Loss Inputs */}
        <div className="overflow-hidden rounded-xl border border-[#d3c4af]/30 bg-[#f9f9f7] dark:border-slate-800 dark:bg-slate-950">
          <div className="grid grid-cols-4 gap-3 p-4">
            {/* Received (%) */}
            <div>
              <label className="mb-2 block text-center text-xs font-bold text-slate-700 dark:text-slate-300">
                Received (%)
              </label>

              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={receivedPurity}
                  onChange={(e) => {
                    setReceivedPurity(e.target.value);
                    setIsManualLoss(false);
                  }}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-[#d3c4af]/50 bg-white px-2 py-2 text-right font-mono text-sm font-semibold text-[#1a1c1b] outline-none focus:border-[#785600] focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <span className="text-xs font-bold text-[#785600] dark:text-amber-400">%</span>
              </div>
            </div>

            {/* Wt */}
            <div>
              <label className="mb-2 block text-center text-xs font-bold text-slate-700 dark:text-slate-300">
                Weight(G)
              </label>

              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={weight}
                  onChange={(e) => {
                    setWeight(e.target.value);
                    setIsManualLoss(false);
                  }}
                  placeholder="0.000"
                  className="w-full rounded-lg border border-[#d3c4af]/50 bg-white px-2 py-2 text-right font-mono text-sm font-semibold text-[#1a1c1b] outline-none focus:border-[#785600] focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <span className="text-xs text-slate-500">g</span>
              </div>
            </div>
            {/* Fine Wt (auto-calculated, read-only) */}
            <div>
              <label className="mb-2 block text-center text-xs font-bold text-slate-700 dark:text-slate-300">
                Fine Wt (G)
              </label>
              <div className="flex items-center gap-1">
                <div className="w-full rounded-lg border border-[#d3c4af]/50 bg-[#fffdf6] px-2 py-2 text-right font-mono text-sm font-semibold text-[#785600] dark:border-slate-700 dark:bg-slate-800 dark:text-amber-400">
                  {(() => {
                    const w = parseFloat(weight);
                    const p = parseFloat(receivedPurity);
                    if (!isNaN(w) && !isNaN(p) && w > 0 && p > 0) {
                      const fine = Math.round(((w * p) / 100) * 1000) / 1000;
                      return fine > 0 ? formatNoTrailingZeros3Dec(fine) : '—';
                    }
                    return '—';
                  })()}
                </div>
                <span className="text-xs text-slate-500">g</span>
              </div>
            </div>

            {/* Loss Fine Wt */}
            <div>
              <label className="mb-2 block text-center text-xs font-bold text-slate-700 dark:text-slate-300">
                Loss (Fine Wt) G
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={lossFineWeight}
                  onChange={(e) => {
                    setLossFineWeight(e.target.value);
                    setIsManualLoss(true);
                  }}
                  placeholder="0"
                  className="w-full rounded-lg border border-[#d3c4af]/50 bg-white px-2 py-2 text-right font-mono text-sm font-semibold text-[#1a1c1b] outline-none focus:border-[#785600] focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <span className="text-xs text-slate-500">g</span>
              </div>
            </div>
          </div>
        </div>

        {/* Melting Button */}
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={handleProcessMelting}
            disabled={
              isLoading ||
              scrapCalculations.totalAvailableWeight <= 0
            }
            className="rounded-xl bg-[#785600] px-7 py-2.5 font-mono text-sm font-bold uppercase tracking-wider text-white shadow-lg transition-all hover:bg-[#5d4200] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
          >
            {isLoading ? 'Processing...' : 'Melting'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeltingPopup;

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Save } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { GenericTable, Column } from '@/components/Forms/Table/GenericTable';
import { useGetCutting, useSubmitCutting } from '@/lib/api/cutting';

interface CuttingEntry {
  id: string;
  srNo: number;
  dateTime: string;
  item: string;
  size: string;
  purity: number;
  chainGiven: number;
  chainReceived: number;
  scrap: number;
  isEditing?: boolean;
  isSaved?: boolean;
  chainReceivedRaw?: string;
  scrapRaw?: string;
  purityRaw?: string;
  itemId?: string;
  sizeId?: string;
  isCompleted?: boolean;
}

const CuttingDept: React.FC = () => {
  const navigate = useNavigate();
  const [cuttingEntries, setCuttingEntries] = useState<CuttingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saveIndex, setSaveIndex] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const isInitialMount = useRef(true);

  // Fetch data from API
  const { data: cuttingData = [], isLoading: cuttingLoading, refetch, error } = useGetCutting();
  const submitCutting = useSubmitCutting();

  // Load data from API - FIXED
  useEffect(() => {
    // Skip if still loading
    if (cuttingLoading) {
      return;
    }

    // Handle error
    if (error) {
      console.error('Error fetching cutting data:', error);
      setCuttingEntries([]);
      return;
    }

    // If we have data, process it
    if (cuttingData && cuttingData.length > 0) {
      const entries: CuttingEntry[] = cuttingData.map((cutting: any, index: number) => {
        const itemName = cutting.item?.name || cutting.itemId || 'N/A';
        const sizeName = cutting.size?.size || cutting.sizeId || 'N/A';

        // Check if all required fields are filled AND isCompleted is true
        const isSaved = cutting.isCompleted === true &&
          cutting.chainReceived !== null &&
          cutting.chainReceived !== undefined &&
          cutting.scrap !== null &&
          cutting.scrap !== undefined &&
          cutting.purity !== null &&
          cutting.purity !== undefined;

        return {
          id: cutting.id,
          srNo: index + 1,
          dateTime: new Date(cutting.createdAt).toLocaleString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }),
          item: itemName,
          size: sizeName,
          purity: cutting.purity || 0,
          chainGiven: cutting.chainWeight || 0,
          chainReceived: cutting.chainReceived || 0,
          scrap: cutting.scrap || 0,
          isEditing: !isSaved,
          isSaved: isSaved,
          chainReceivedRaw: cutting.chainReceived ? cutting.chainReceived.toString() : '',
          scrapRaw: cutting.scrap ? cutting.scrap.toString() : '',
          purityRaw: cutting.purity ? cutting.purity.toString() : '',
          itemId: cutting.itemId,
          sizeId: cutting.sizeId,
          isCompleted: cutting.isCompleted || false,
        };
      });
      setCuttingEntries(entries);
    } else {
      // No data - set empty array
      setCuttingEntries([]);
    }
  }, [cuttingData, cuttingLoading, error]);

  // Handle inline field change
  const handleInlineChange = useCallback((index: number, field: 'chainReceived' | 'scrap' | 'purity', value: string) => {
    setCuttingEntries(prev => prev.map((entry, i) => {
      if (i === index) {
        const updated = { ...entry };

        if (field === 'chainReceived') {
          updated.chainReceivedRaw = value;
          if (value === '' || value === '.' || value === '-') {
            updated.chainReceived = 0;
          } else {
            const numValue = parseFloat(value);
            updated.chainReceived = isNaN(numValue) ? 0 : numValue;
          }
        } else if (field === 'scrap') {
          updated.scrapRaw = value;
          if (value === '' || value === '.' || value === '-') {
            updated.scrap = 0;
          } else {
            const numValue = parseFloat(value);
            updated.scrap = isNaN(numValue) ? 0 : numValue;
          }
        } else if (field === 'purity') {
          updated.purityRaw = value;
          if (value === '' || value === '.' || value === '-') {
            updated.purity = 0;
          } else {
            const numValue = parseFloat(value);
            updated.purity = isNaN(numValue) ? 0 : numValue;
          }
        }

        return updated;
      }
      return entry;
    }));
  }, []);

  // Open confirmation popup before saving
  const handleSaveClick = useCallback((index: number) => {
    const entry = cuttingEntries[index];

    if (!entry.chainReceived || entry.chainReceived < 0) {
      toast.error('Please enter a valid chain received weight');
      return;
    }

    if (!entry.scrap || entry.scrap < 0) {
      toast.error('Please enter a valid scrap weight');
      return;
    }

    if (!entry.purity || entry.purity < 0 || entry.purity > 100) {
      toast.error('Please enter a valid purity percentage (1-100)');
      return;
    }

    setSaveIndex(index);
    setShowConfirmModal(true);
  }, [cuttingEntries]);

  // Confirm and save
  const confirmSave = useCallback(async () => {
    if (saveIndex === null) return;

    const index = saveIndex;
    const entry = cuttingEntries[index];

    setIsLoading(true);

    try {
      await submitCutting.mutateAsync({
        id: entry.id,
        data: {
          chainReceived: entry.chainReceived,
          scrap: entry.scrap,
          purity: entry.purity,
          isCompleted: true,
        }
      });

      setCuttingEntries(prev => prev.map((s, i) =>
        i === index ? { ...s, isEditing: false, isSaved: true, isCompleted: true } : s
      ));

      // toast.success('Cutting entry saved successfully! Process completed! 🎉');
      setIsLoading(false);
      setShowConfirmModal(false);
      setSaveIndex(null);
      await refetch();

      navigate({
        to: '/Stocks/stockpage'
      });
    } catch (error) {
      console.error('Error saving cutting:', error);
      toast.error('Failed to save cutting entry');
      setIsLoading(false);
      setShowConfirmModal(false);
      setSaveIndex(null);
    }
  }, [saveIndex, cuttingEntries, submitCutting, navigate, refetch]);

  const formatNumber = (value: number) => {
    if (value === 0 || !value) return '0';
    const str = value.toString();
    if (str.includes('.')) {
      return str.replace(/\.?0+$/, '');
    }
    return str;
  };

  // Check if all entries are saved
  const allSaved = cuttingEntries.every(entry => entry.isSaved);

  // Custom action renderer
  const renderActions = useCallback((item: CuttingEntry, index: number) => {
    if (item.isEditing && !item.isSaved) {
      return (
        <button
          onClick={() => handleSaveClick(index)}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-1 rounded-lg bg-gradient-to-br from-[#785600] to-[#986d00] px-2 py-1 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          title="Save Entry"
        >
          <Save className="h-3 w-3" />
          <span>Save</span>
        </button>
      );
    }
    return (
      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
        ✓ Completed
      </span>
    );
  }, [isLoading, handleSaveClick]);

  // Define columns for GenericTable
  const columns: Column<CuttingEntry>[] = [
    {
      key: 'dateTime',
      header: 'Date & Time',
      render: (item) => {
        // Split dateTime into date and time parts
        const parts = item.dateTime ? item.dateTime.split(' ') : ['', ''];
        const datePart = parts[0] || '';
        const timePart = parts.slice(1).join(' ') || '';

        return (
          <div className="flex flex-col items-center">
            <span className="text-sm text-[#1a1c1b] dark:text-white">
              {datePart}
            </span>
            <span className="text-xs text-[#4f4535] dark:text-slate-400">
              {timePart}
            </span>
          </div>
        );
      },
    },
    {
      key: 'item',
      header: 'Item',
      render: (item) => (
        <span className="text-sm font-medium text-[#1a1c1b] dark:text-white">
          {item.item}
        </span>
      ),
    },
    {
      key: 'size',
      header: 'Size',
      render: (item) => (
        <span className="text-sm text-[#1a1c1b] dark:text-white">
          {item.size}
        </span>
      ),
    },
    {
      key: 'chainGiven',
      header: 'Chain Given (G)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumber(item.chainGiven)}
        </span>
      ),
    },
    {
      key: 'chainReceived',
      header: 'Chain Received (G)',
      render: (item, index) => {
        if (item.isEditing && !item.isSaved) {
          return (
            <input
              type="text"
              value={item.chainReceivedRaw !== undefined ? item.chainReceivedRaw : (item.chainReceived === 0 ? '' : item.chainReceived)}
              onChange={(e) => handleInlineChange(index, 'chainReceived', e.target.value)}
              placeholder="0.000"
              className="w-full rounded border-0 bg-[#f4f4f2] px-2 py-1.5 text-center font-mono text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
            />
          );
        }
        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumber(item.chainReceived)}
          </span>
        );
      },
    },
    {
      key: 'scrap',
      header: 'Scrap (G)',
      render: (item, index) => {
        if (item.isEditing && !item.isSaved) {
          return (
            <input
              type="text"
              value={item.scrapRaw !== undefined ? item.scrapRaw : (item.scrap === 0 ? '' : item.scrap)}
              onChange={(e) => handleInlineChange(index, 'scrap', e.target.value)}
              placeholder="0.000"
              className="w-full rounded border-0 bg-[#f4f4f2] px-2 py-1.5 text-center font-mono text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
            />
          );
        }
        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumber(item.scrap)}
          </span>
        );
      },
    },
    {
      key: 'purity',
      header: 'Purity (%)',
      render: (item, index) => {
        if (item.isEditing && !item.isSaved) {
          return (
            <input
              type="text"
              value={item.purityRaw !== undefined ? item.purityRaw : (item.purity === 0 ? '' : item.purity)}
              onChange={(e) => handleInlineChange(index, 'purity', e.target.value)}
              placeholder="e.g., 91.6"
              className="w-full rounded border-0 bg-[#f4f4f2] px-2 py-1.5 text-center font-mono text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
            />
          );
        }
        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumber(item.purity)}%
          </span>
        );
      },
    },
  ];

  const isSubmitting = submitCutting.isPending;

  return (
    <div className="bg-[#f9f9f7] dark:bg-slate-950">
      <div >

        <GenericTable<CuttingEntry>
          data={cuttingEntries}
          columns={columns}
          onSave={(item, index) => handleSaveClick(index)}
          emptyMessage="No cutting entries found."
          isLoading={cuttingLoading || isSubmitting}
          renderActions={!allSaved ? renderActions : undefined}
          showSrNo={true}
          srNoLabel="Sr No."
        />
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl dark:bg-slate-900">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="rounded-full bg-amber-100 p-3 dark:bg-amber-900/30">
                  <Save className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <h3 className="text-center text-lg font-bold text-[#1a1c1b] dark:text-white mb-2">
                Confirm Save
              </h3>
              <p className="text-center text-sm text-[#4f4535] dark:text-slate-400">
                Are you sure you want to save this cutting entry? This will complete the process.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setSaveIndex(null);
                  }}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-[#4f4535] transition-colors hover:bg-[#f4f4f2] dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSave}
                  disabled={isLoading}
                  className="rounded-lg bg-gradient-to-br from-[#785600] to-[#986d00] px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Confirm Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CuttingDept;
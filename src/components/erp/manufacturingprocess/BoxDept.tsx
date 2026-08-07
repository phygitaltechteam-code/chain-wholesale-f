import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Save, History } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { GenericTable, Column } from '@/components/Forms/Table/GenericTable';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import { useGetBox, useGetBoxHistory, useSubmitBox } from '@/lib/api/box';

interface BoxEntry {
  id: string;
  srNo: number;
  dateTime: string;
  item: string;
  size: string;
  tarWeight: number;
  chainWeight: number;
  scrap: number;
  loss: number;
  isEditing?: boolean;
  isSaved?: boolean;
  chainWeightRaw?: string;
  scrapRaw?: string;
  itemId?: string;
  sizeId?: string;
  isCompleted?: boolean;
}

const BoxDept: React.FC = () => {
  const navigate = useNavigate();
  const [boxEntries, setBoxEntries] = useState<BoxEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saveIndex, setSaveIndex] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const isInitialMount = useRef(true);

  // Fetch data from API
  const { data: boxData = [], isLoading: boxLoading, refetch } = useGetBox();
  const { data: boxHistory = [], isLoading: historyLoading, refetch: refetchHistory } = useGetBoxHistory();
  const submitBox = useSubmitBox();

  // Load data from API
  useEffect(() => {
    if (boxLoading) return;

    if (isInitialMount.current) {
      isInitialMount.current = false;
    }

    if (boxData.length > 0) {
      const entries: BoxEntry[] = boxData.map((box: any, index: number) => {
        const itemName = box.item?.name || box.itemId || 'N/A';
        const sizeName = box.size?.size || box.sizeId || 'N/A';

        const chainWeight = box.chainWeight || 0;
        const tarWeight = box.tarWeight || 0;
        const loss = tarWeight - chainWeight;

        const dateTime = new Date(box.createdAt).toLocaleString('en-IN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });

        return {
          id: box.id,
          srNo: index + 1,
          dateTime: dateTime,
          item: itemName,
          size: sizeName,
          tarWeight: tarWeight,
          chainWeight: chainWeight,
          scrap: box.scrap || 0,
          loss: loss,
          isEditing: box.chainWeight === null || box.chainWeight === undefined,
          isSaved: box.chainWeight !== null && box.chainWeight !== undefined,
          chainWeightRaw: box.chainWeight ? box.chainWeight.toString() : '',
          scrapRaw: box.scrap ? box.scrap.toString() : '',
          itemId: box.itemId,
          sizeId: box.sizeId,
          isCompleted: box.isCompleted || false,
        };
      });
      setBoxEntries(entries);
    } else {
      setBoxEntries([]);
    }
  }, [boxData, boxLoading]);

  // Format date helper for history
  const formatDate = (dateString: string) => {
  if (!dateString) return { date: '-', time: '-' };

  const date = new Date(dateString);

  return {
    date: date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }),
    time: date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }),
  };
};
  // Format number helper for history
  const formatNumber = (value: any) => {
    if (value === null || value === undefined) return '0';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';
    return num.toFixed(3);
  };

  // History table columns
  const historyColumns: Column<any>[] = [

 {
  key: 'createdAt',
  header: 'Date & Time',
  render: (item) => {
    const { date, time } = formatDate(item.createdAt);

    return (
      <div className="flex flex-col items-center">
        <span className="text-sm text-[#1a1c1b] dark:text-white">
          {date}
        </span>

        <span className="text-xs text-gray-500 dark:text-gray-400">
          {time}
        </span>
      </div>
    );
  },
},

  {
  key: 'updatedAt',
  header: 'Updated Date & Time',
  render: (item) => {
    const { date, time } = formatDate(item.updatedAt);

    return (
      <div className="flex flex-col items-center">
        <span className="text-sm text-[#1a1c1b] dark:text-white">
          {date}
        </span>

        <span className="text-xs text-gray-500 dark:text-gray-400">
          {time}
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
          {item.item?.name || '-'}
        </span>
      ),
    },
    {
      key: 'size',
      header: 'Size',
      render: (item) => (
        <span className="text-sm text-[#1a1c1b] dark:text-white">
          {item.size?.size || '-'}
        </span>
      ),
    },
    {
      key: 'tarWeight',
      header: 'Tar (तार)',
      render: (item) => (
        <span className="text-sm font-mono text-[#1a1c1b] dark:text-white">
          {formatNumber(item.tarWeight)}
        </span>
      ),
    },
    {
      key: 'chainWeight',
      header: 'Chain Weight (G)',
      render: (item) => (
        <span className="text-sm font-mono text-[#1a1c1b] dark:text-white">
          {formatNumber(item.chainWeight)}
        </span>
      ),
    },
    {
      key: 'scrap',
      header: 'Scrap (स्क्रॅप)',
      render: (item) => (
        <span className="text-sm font-mono text-[#1a1c1b] dark:text-white">
          {formatNumber(item.scrap)}
        </span>
      ),
    },
    {
      key: 'loss',
      header: 'Loss',
      render: (item) => (
        <span className="text-sm font-mono text-[#1a1c1b] dark:text-white">
          {formatNumber(item.loss)}
        </span>
      ),
    },
  ];

  // Handle inline field change
  const handleInlineChange = useCallback((index: number, field: 'chainWeight' | 'scrap', value: string) => {
    setBoxEntries(prev => prev.map((entry, i) => {
      if (i === index) {
        const updated = { ...entry };

        if (field === 'chainWeight') {
          updated.chainWeightRaw = value;
          if (value === '' || value === '.' || value === '-') {
            updated.chainWeight = 0;
          } else {
            const numValue = parseFloat(value);
            updated.chainWeight = isNaN(numValue) ? 0 : numValue;
          }
          updated.loss = Math.max(0, entry.tarWeight - updated.chainWeight);
        } else if (field === 'scrap') {
          updated.scrapRaw = value;
          if (value === '' || value === '.' || value === '-') {
            updated.scrap = 0;
          } else {
            const numValue = parseFloat(value);
            updated.scrap = isNaN(numValue) ? 0 : numValue;
          }
        }

        return updated;
      }
      return entry;
    }));
  }, []);

  // Open confirmation popup before saving
  const handleSaveClick = useCallback((index: number) => {
    const entry = boxEntries[index];

    if (!entry.chainWeight || entry.chainWeight < 0) {
      toast.error('Please enter a valid chain weight');
      return;
    }

    if (!entry.scrap || entry.scrap < 0) {
      toast.error('Please enter a valid scrap weight');
      return;
    }

    if (entry.loss < 0) {
      toast.error('Loss Weight cannot be negative. Chain weight must be less than or equal to Tar Weight.');
      return;
    }

    setSaveIndex(index);
    setShowConfirmModal(true);
  }, [boxEntries]);

  // Confirm and save
  const confirmSave = useCallback(async () => {
    if (saveIndex === null) return;

    const index = saveIndex;
    const entry = boxEntries[index];

    setIsLoading(true);

    try {
      await submitBox.mutateAsync({
        id: entry.id,
        data: {
          chainWeight: entry.chainWeight,
          scrap: entry.scrap,
          loss: entry.loss,
          isCompleted: true,
        }
      });

      setBoxEntries(prev => prev.map((s, i) =>
        i === index ? { ...s, isEditing: false, isSaved: true, isCompleted: true } : s
      ));

      setIsLoading(false);
      setShowConfirmModal(false);
      setSaveIndex(null);
      await refetch();

      navigate({
        to: '/manufacturingprocess/process',
        state: { selectedTab: 'soldering' }
      });
    } catch (error) {
      console.error('Error saving box:', error);
      toast.error('Failed to save box entry');
      setIsLoading(false);
      setShowConfirmModal(false);
      setSaveIndex(null);
    }
  }, [saveIndex, boxEntries, submitBox, navigate, refetch]);

  const formatNumberDisplay = (value: number) => {
    if (value === 0 || !value) return '0';
    const str = value.toString();
    if (str.includes('.')) {
      return str.replace(/\.?0+$/, '');
    }
    return str;
  };

  // Check if all entries are saved
  const allSaved = boxEntries.every(entry => entry.isSaved);

  // Custom action renderer
  const renderActions = useCallback((item: BoxEntry, index: number) => {
    if (item.isEditing) {
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
    return null;
  }, [isLoading, handleSaveClick]);

  // Define columns for GenericTable
  const columns: Column<BoxEntry>[] = [
    {
      key: 'dateTime',
      header: 'Date & Time',
      render: (item) => {
        const parts = item.dateTime ? item.dateTime.split(', ') : ['', ''];
        const datePart = parts[0] || '';
        const timePart = parts[1] || '';

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
      key: 'tarWeight',
      header: 'Tar(तार)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.tarWeight)}
        </span>
      ),
    },
    {
      key: 'chainWeight',
      header: 'Chain Weight(G)',
      render: (item, index) => {
        if (item.isEditing) {
          return (
            <input
              type="text"
              value={item.chainWeightRaw !== undefined ? item.chainWeightRaw : (item.chainWeight === 0 ? '' : item.chainWeight)}
              onChange={(e) => handleInlineChange(index, 'chainWeight', e.target.value)}
              placeholder="0.000"
              className="w-full rounded border-0 bg-[#f4f4f2] px-2 py-1.5 text-center font-mono text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
            />
          );
        }
        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.chainWeight)}
          </span>
        );
      },
    },
    {
      key: 'scrap',
      header: 'Scrap (स्क्रॅप)',
      render: (item, index) => {
        if (item.isEditing) {
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
            {formatNumberDisplay(item.scrap)}
          </span>
        );
      },
    },
    {
      key: 'loss',
      header: 'Loss',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.loss)}
        </span>
      ),
    },
  ];

  const isSubmitting = submitBox.isPending;

  const toggleHistory = () => {
    setShowHistory(!showHistory);
    if (!showHistory) {
      refetchHistory();
    }
  };

  return (
    <div className="bg-[#f9f9f7] dark:bg-slate-950 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#f9f9f7] dark:bg-slate-950 border-b border-[#d3c4af]/10 dark:border-slate-700">
        <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 md:px-6">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-sm sm:text-base md:text-lg font-bold text-[#1a1c1b] dark:text-white truncate">
              {showHistory ? 'Box History' : 'Box Department'}
            </h1>
            {!showHistory && (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                {boxEntries.length}
              </span>
            )}
            {showHistory && (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                {boxHistory.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
             <GenericButton
    type="button"
    onClick={() => {
      setShowHistory(true);
      refetchHistory();
    }}
    className="flex items-center gap-1.5 !bg-blue-600 !px-3 !py-1.5 !text-xs !text-white hover:!bg-blue-700"
  >
    <History className="h-4 w-4" />
    History
  </GenericButton>
          </div>
        </div>
      </div>

      {/* Conditional Rendering: Box Table OR History Table */}
     {!showHistory ? (
  /* Box Department Table */
  <div className="px-3 py-4 sm:px-4 md:px-6">
    <GenericTable<BoxEntry>
      data={boxEntries}
      columns={columns}
      onSave={(item, index) => handleSaveClick(index)}
      emptyMessage="No box entries found."
      isLoading={boxLoading || isSubmitting}
      renderActions={!allSaved ? renderActions : undefined}
      showSrNo={true}
      srNoLabel="Sr No."
    />
  </div>
) : (
  /* History Table */
  <div className="px-3 py-4 sm:px-4 md:px-6">

       {/* History Table */}
    <GenericTable
      data={boxHistory}
      columns={historyColumns}
      emptyMessage="No history records found. Complete a box process to see history."
      isLoading={historyLoading}
      showSrNo={true}
      srNoLabel="Sr No."
      className="shadow-sm"
    />

  </div>
)}
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
                Are you sure you want to save this box entry? This will move to the <strong className="text-[#785600] dark:text-amber-400">Soldering Department</strong>.
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

export default BoxDept;
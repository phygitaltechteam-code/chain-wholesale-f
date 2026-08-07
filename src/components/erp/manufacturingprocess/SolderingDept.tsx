import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Save, Scissors, Hammer, History } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { GenericTable, Column } from '@/components/Forms/Table/GenericTable';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import { useGetSoldering, useGetSolderingHistory, useSubmitSoldering } from '@/lib/api/soldering';
import { useSubmitCutting, useSubmitMoveCutting } from '@/lib/api/cutting';

interface SolderingEntry {
  id: string;
  srNo: number;
  dateTime: string;
  item: string;
  size: string;
  purity: string;
  chainGiven: number;
  chainReceived: number;
  powder: number;
  increase: number;
  scrap: number;
  isEditing?: boolean;
  isSaved?: boolean;
  chainReceivedRaw?: string;
  powderRaw?: string;
  scrapRaw?: string;
  itemId?: string;
  sizeId?: string;
  isCompleted?: boolean;
}

const SolderingDept: React.FC = () => {
  const navigate = useNavigate();
  const [solderingEntries, setSolderingEntries] = useState<SolderingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saveIndex, setSaveIndex] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionType, setActionType] = useState<'joint' | 'cutting' | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const isInitialMount = useRef(true);

  // Fetch data from API
  const { data: solderingData = [], isLoading: solderingLoading, refetch } = useGetSoldering();
  const { data: solderingHistory = [], isLoading: historyLoading, refetch: refetchHistory } = useGetSolderingHistory();
  const submitSoldering = useSubmitSoldering();
  const submitCutting = useSubmitMoveCutting();

  // Load data from API
  useEffect(() => {
    if (solderingLoading) {
      return;
    }

    if (isInitialMount.current) {
      isInitialMount.current = false;
    }

    if (solderingData.length > 0) {
      const entries: SolderingEntry[] = solderingData.map((soldering: any, index: number) => {
        const itemName = soldering.item?.name || soldering.itemId || 'N/A';
        const sizeName = soldering.size?.size || soldering.sizeId || 'N/A';

        const chainGiven = soldering.chainWeight || 0;
        const powder = soldering.powder || 0;
        const increase = powder - chainGiven;

        return {
          id: soldering.id,
          srNo: index + 1,
          dateTime: new Date(soldering.createdAt).toLocaleString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }),
          item: itemName,
          size: sizeName,
          purity: soldering.purity || '22K',
          chainGiven: chainGiven,
          chainReceived: soldering.chainReceived || 0,
          powder: powder,
          increase: increase > 0 ? increase : 0,
          scrap: soldering.scrap || 0,
          isEditing: soldering.chainReceived === null || soldering.chainReceived === undefined,
          isSaved: soldering.chainReceived !== null && soldering.chainReceived !== undefined,
          chainReceivedRaw: soldering.chainReceived ? soldering.chainReceived.toString() : '',
          powderRaw: soldering.powder ? soldering.powder.toString() : '',
          scrapRaw: soldering.scrap ? soldering.scrap.toString() : '',
          itemId: soldering.itemId,
          sizeId: soldering.sizeId,
          isCompleted: soldering.isCompleted || false,
        };
      });
      setSolderingEntries(entries);
    } else {
      setSolderingEntries([]);
    }
  }, [solderingData, solderingLoading]);

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
      key: 'purity',
      header: 'Purity',
      render: (item) => (
        <span className="text-sm text-[#1a1c1b] dark:text-white">
          {item.purity || '-'}
        </span>
      ),
    },
    {
      key: 'chainWeight',
      header: 'Chain Given (G)',
      render: (item) => (
        <span className="text-sm font-mono text-[#1a1c1b] dark:text-white">
          {formatNumber(item.chainWeight)}
        </span>
      ),
    },
    {
      key: 'chainReceived',
      header: 'Chain Received (G)',
      render: (item) => (
        <span className="text-sm font-mono text-[#1a1c1b] dark:text-white">
          {formatNumber(item.chainReceived)}
        </span>
      ),
    },
    {
      key: 'powder',
      header: 'Powder (G)',
      render: (item) => (
        <span className="text-sm font-mono text-[#1a1c1b] dark:text-white">
          {formatNumber(item.powder)}
        </span>
      ),
    },
    {
      key: 'increase',
      header: 'Increase',
      render: (item) => (
        <span className="text-sm font-mono text-[#1a1c1b] dark:text-white">
          {formatNumber(item.increase)}
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
  ];

  // Handle inline field change
  const handleInlineChange = useCallback((index: number, field: 'chainReceived' | 'powder' | 'scrap', value: string) => {
    setSolderingEntries(prev => prev.map((entry, i) => {
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
        } else if (field === 'powder') {
          updated.powderRaw = value;
          if (value === '' || value === '.' || value === '-') {
            updated.powder = 0;
          } else {
            const numValue = parseFloat(value);
            updated.powder = isNaN(numValue) ? 0 : numValue;
          }
        } else if (field === 'scrap') {
          updated.scrapRaw = value;
          if (value === '' || value === '.' || value === '-') {
            updated.scrap = 0;
          } else {
            const numValue = parseFloat(value);
            updated.scrap = isNaN(numValue) ? 0 : numValue;
          }
        }

        updated.increase = Math.max(0, updated.powder - entry.chainGiven);

        return updated;
      }
      return entry;
    }));
  }, []);

  // Open confirmation popup before saving
  const handleSaveClick = useCallback((index: number, action: 'joint' | 'cutting') => {
    const entry = solderingEntries[index];

    if (!entry.chainReceived || entry.chainReceived < 0) {
      toast.error('Please enter a valid chain received weight');
      return;
    }

    if (!entry.powder || entry.powder < 0) {
      toast.error('Please enter a valid powder weight');
      return;
    }

    if (!entry.scrap || entry.scrap < 0) {
      toast.error('Please enter a valid scrap weight');
      return;
    }

    setSaveIndex(index);
    setActionType(action);
    setShowConfirmModal(true);
  }, [solderingEntries]);

  // Confirm and save - Joint
  const confirmSaveJoint = useCallback(async () => {
    if (saveIndex === null) return;

    const index = saveIndex;
    const entry = solderingEntries[index];

    setIsLoading(true);

    try {
      await submitSoldering.mutateAsync({
        id: entry.id,
        data: {
          chainReceived: entry.chainReceived,
          powder: entry.powder,
          increase: entry.increase,
          scrap: entry.scrap,
          isCompleted: true,
        }
      });

      setSolderingEntries(prev => prev.map((s, i) =>
        i === index ? { ...s, isEditing: false, isSaved: true, isCompleted: true } : s
      ));

      setIsLoading(false);
      setShowConfirmModal(false);
      setSaveIndex(null);
      setActionType(null);
      await refetch();

      navigate({
        to: '/manufacturingprocess/process',
        state: { selectedTab: 'joint' }
      });
    } catch (error) {
      console.error('Error saving soldering:', error);
      toast.error('Failed to save soldering entry');
      setIsLoading(false);
      setShowConfirmModal(false);
      setSaveIndex(null);
      setActionType(null);
    }
  }, [saveIndex, solderingEntries, submitSoldering, navigate, refetch]);

  // Confirm and save - Cutting (uses different API)
  const confirmSaveCutting = useCallback(async () => {
    if (saveIndex === null) return;

    const index = saveIndex;
    const entry = solderingEntries[index];

    setIsLoading(true);

    try {
      // First save the soldering entry
      await submitSoldering.mutateAsync({
        id: entry.id,
        data: {
          chainReceived: entry.chainReceived,
          powder: entry.powder,
          increase: entry.increase,
          scrap: entry.scrap,
          isCompleted: true,
        }
      });

      // Then submit to Cutting API
      await submitCutting.mutateAsync({
        id: entry.id,
        data: {
          chainReceived: entry.chainReceived,
          powder: entry.powder,
          increase: entry.increase,
          scrap: entry.scrap,
          isCompleted: true,
        }
      });

      setSolderingEntries(prev => prev.map((s, i) =>
        i === index ? { ...s, isEditing: false, isSaved: true, isCompleted: true } : s
      ));

      setIsLoading(false);
      setShowConfirmModal(false);
      setSaveIndex(null);
      setActionType(null);
      await refetch();

      navigate({
        to: '/manufacturingprocess/process',
        state: { selectedTab: 'cutting' }
      });
    } catch (error) {
      console.error('Error saving soldering:', error);
      toast.error('Failed to save soldering entry');
      setIsLoading(false);
      setShowConfirmModal(false);
      setSaveIndex(null);
      setActionType(null);
    }
  }, [saveIndex, solderingEntries, submitSoldering, submitCutting, navigate, refetch]);

  const formatNumberDisplay = (value: number) => {
    if (value === 0 || !value) return '0';
    const str = value.toString();
    if (str.includes('.')) {
      return str.replace(/\.?0+$/, '');
    }
    return str;
  };

  // Check if all entries are saved
  const allSaved = solderingEntries.every(entry => entry.isSaved);

  // Custom action renderer for GenericTable
  const renderActions = useCallback((item: SolderingEntry, index: number) => {
    if (!item.isEditing) {
      return null;
    }

    return (
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => handleSaveClick(index, 'joint')}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-br from-[#785600] to-[#986d00] px-3 py-1.5 text-white shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          title="Go to Joint"
        >
          <Hammer className="h-4 w-4" />
          <span className="text-xs">Joint</span>
        </button>
        <button
          onClick={() => handleSaveClick(index, 'cutting')}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-br from-[#785600] to-[#986d00] px-3 py-1.5 text-white shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          title="Go to Cutting"
        >
          <Scissors className="h-4 w-4" />
          <span className="text-xs">Cutting</span>
        </button>
      </div>
    );
  }, [isLoading, handleSaveClick]);

  // Define columns for GenericTable
  const columns: Column<SolderingEntry>[] = [
    {
      key: 'dateTime',
      header: 'Date & Time',
      render: (item) => {
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
      header: 'Chain Given(G)',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.chainGiven)}
        </span>
      ),
    },
    {
      key: 'chainReceived',
      header: 'Chain Received(G)',
      render: (item, index) => {
        if (item.isEditing) {
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
            {formatNumberDisplay(item.chainReceived)}
          </span>
        );
      },
    },
    {
      key: 'powder',
      header: 'Powder(G)',
      render: (item, index) => {
        if (item.isEditing) {
          return (
            <input
              type="text"
              value={item.powderRaw !== undefined ? item.powderRaw : (item.powder === 0 ? '' : item.powder)}
              onChange={(e) => handleInlineChange(index, 'powder', e.target.value)}
              placeholder="0.000"
              className="w-full rounded border-0 bg-[#f4f4f2] px-2 py-1.5 text-center font-mono text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
            />
          );
        }
        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.powder)}
          </span>
        );
      },
    },
    {
      key: 'increase',
      header: 'Increase',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumberDisplay(item.increase)}
        </span>
      ),
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
  ];

  const isSubmitting = submitSoldering.isPending || submitCutting.isPending;

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
              {showHistory ? 'Soldering History' : 'Soldering Department'}
            </h1>
            {!showHistory && (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                {solderingEntries.length}
              </span>
            )}
            {showHistory && (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                {solderingHistory.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!showHistory && (
              <GenericButton
                type="button"
                onClick={toggleHistory}
                className="flex items-center gap-1.5 !px-3 !py-1.5 !text-xs sm:!px-4 sm:!py-2 sm:!text-sm !text-white whitespace-nowrap !bg-blue-600 hover:!bg-blue-700"
              >
                <History className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>History</span>
              </GenericButton>
            )}
          </div>
        </div>
      </div>

      {/* Conditional Rendering: Soldering Table OR History Table */}
      {!showHistory ? (
        /* Soldering Department Table */
        <div className="px-3 py-4 sm:px-4 md:px-6">
          <GenericTable<SolderingEntry>
            data={solderingEntries}
            columns={columns}
            onSave={(item, index) => handleSaveClick(index, 'joint')}
            emptyMessage="No soldering entries found."
            isLoading={solderingLoading || isSubmitting}
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
            data={solderingHistory}
            columns={historyColumns}
            emptyMessage="No history records found. Complete a soldering process to see history."
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
                Are you sure you want to save this soldering entry and go to the <strong>{actionType === 'joint' ? 'Joint' : 'Cutting'}</strong> department?
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setSaveIndex(null);
                    setActionType(null);
                  }}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-[#4f4535] transition-colors hover:bg-[#f4f4f2] dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={actionType === 'joint' ? confirmSaveJoint : confirmSaveCutting}
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

export default SolderingDept;
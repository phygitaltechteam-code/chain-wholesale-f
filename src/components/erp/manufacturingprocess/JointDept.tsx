import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Save } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { GenericTable, Column } from '@/components/Forms/Table/GenericTable';
import { useGetJoint, useSubmitJoint } from '@/lib/api/joint';

interface JointEntry {
  id: string;
  srNo: number;
  dateTime: string;
  item: string;
  size: string;
  purity: number;
  chainWeight: number;
  chainReceived: number;
  powder: number;
  powderReceived: number;
  srp: number;
  scrap: number;
  isEditing?: boolean;
  isSaved?: boolean;
  powderReceivedRaw?: string;
  srpRaw?: string;
  purityRaw?: string;
  scrapRaw?: string;
  itemId?: string;
  sizeId?: string;
  isCompleted?: boolean;
}

const JointDept: React.FC = () => {
  const navigate = useNavigate();
  const [jointEntries, setJointEntries] = useState<JointEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saveIndex, setSaveIndex] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const isInitialMount = useRef(true);

  // Fetch data from API
  const { data: jointData = [], isLoading: jointLoading, refetch } = useGetJoint();
  const submitJoint = useSubmitJoint();

  // Load data from API
  useEffect(() => {
    if (jointLoading) {
      return;
    }

    if (isInitialMount.current) {
      isInitialMount.current = false;
    }

    if (jointData.length > 0) {
      const entries: JointEntry[] = jointData.map((joint: any, index: number) => {
        const itemName = joint.item?.name || joint.itemId || 'N/A';
        const sizeName = joint.size?.size || joint.sizeId || 'N/A';

        return {
          id: joint.id,
          srNo: index + 1,
          dateTime: new Date(joint.createdAt).toLocaleString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }),
          item: itemName,
          size: sizeName,
          purity: joint.purity || 0,
          chainWeight: joint.chainWeight || 0,
          chainReceived: joint.chainReceived || 0,
          powder: joint.powder || 0,
          powderReceived: joint.powderReceived || 0,
          srp: joint.srp || 0,
          scrap: joint.scrap || 0,
          isEditing: joint.powderReceived === null || joint.powderReceived === undefined,
          isSaved: joint.powderReceived !== null && joint.powderReceived !== undefined,
          powderReceivedRaw: joint.powderReceived ? joint.powderReceived.toString() : '',
          srpRaw: joint.srp ? joint.srp.toString() : '',
          purityRaw: joint.purity ? joint.purity.toString() : '',
          scrapRaw: joint.scrap ? joint.scrap.toString() : '',
          itemId: joint.itemId,
          sizeId: joint.sizeId,
          isCompleted: joint.isCompleted || false,
        };
      });
      setJointEntries(entries);
    } else {
      setJointEntries([]);
    }
  }, [jointData, jointLoading]);

  // Handle inline field change
  const handleInlineChange = useCallback((index: number, field: 'powderReceived' | 'srp' | 'purity' | 'scrap', value: string) => {
    setJointEntries(prev => prev.map((entry, i) => {
      if (i === index) {
        const updated = { ...entry };

        if (field === 'powderReceived') {
          updated.powderReceivedRaw = value;
          if (value === '' || value === '.' || value === '-') {
            updated.powderReceived = 0;
          } else {
            const numValue = parseFloat(value);
            updated.powderReceived = isNaN(numValue) ? 0 : numValue;
          }
        } else if (field === 'srp') {
          updated.srpRaw = value;
          if (value === '' || value === '.' || value === '-') {
            updated.srp = 0;
          } else {
            const numValue = parseFloat(value);
            updated.srp = isNaN(numValue) ? 0 : numValue;
          }
        } else if (field === 'purity') {
          updated.purityRaw = value;
          if (value === '' || value === '.' || value === '-') {
            updated.purity = 0;
          } else {
            const numValue = parseFloat(value);
            updated.purity = isNaN(numValue) ? 0 : numValue;
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

        return updated;
      }
      return entry;
    }));
  }, []);

  // Open confirmation popup before saving
  const handleSaveClick = useCallback((index: number) => {
    const entry = jointEntries[index];

    if (!entry.powderReceived || entry.powderReceived < 0) {
      toast.error('Please enter a valid powder received weight');
      return;
    }

    if (!entry.srp || entry.srp < 0) {
      toast.error('Please enter a valid SRP (Majuri)');
      return;
    }

    if (!entry.purity || entry.purity < 0) {
      toast.error('Please enter a valid purity percentage');
      return;
    }

    if (!entry.scrap || entry.scrap < 0) {
      toast.error('Please enter a valid scrap weight');
      return;
    }

    setSaveIndex(index);
    setShowConfirmModal(true);
  }, [jointEntries]);

  // Confirm and save
  const confirmSave = useCallback(async () => {
    if (saveIndex === null) return;

    const index = saveIndex;
    const entry = jointEntries[index];

    setIsLoading(true);

    try {
      await submitJoint.mutateAsync({
        id: entry.id,
        data: {
          powderReceived: entry.powderReceived,
          srp: entry.srp,
          purity: entry.purity,
          scrap: entry.scrap,
          isCompleted: true,
        }
      });

      setJointEntries(prev => prev.map((s, i) =>
        i === index ? { ...s, isEditing: false, isSaved: true, isCompleted: true } : s
      ));

      // toast.success('Joint entry saved successfully!');
      setIsLoading(false);
      setShowConfirmModal(false);
      setSaveIndex(null);
      await refetch();

      navigate({
        to: '/manufacturingprocess/process',
        state: { selectedTab: 'cutting' }
      });
    } catch (error) {
      console.error('Error saving joint:', error);
      toast.error('Failed to save joint entry');
      setIsLoading(false);
      setShowConfirmModal(false);
      setSaveIndex(null);
    }
  }, [saveIndex, jointEntries, submitJoint, navigate, refetch]);

  const formatNumber = (value: number) => {
    if (value === 0 || !value) return '0';
    const str = value.toString();
    if (str.includes('.')) {
      return str.replace(/\.?0+$/, '');
    }
    return str;
  };

  // Custom action renderer
  const renderActions = useCallback((item: JointEntry, index: number) => {
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
  const columns: Column<JointEntry>[] = [
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
      key: 'chainWeight',
      header: 'Chain Given',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumber(item.chainWeight)}
        </span>
      ),
    },
    {
      key: 'chainReceived',
      header: 'Chain Received',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumber(item.chainReceived)}
        </span>
      ),
    },
    {
      key: 'powder',
      header: 'Powder',
      render: (item) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {formatNumber(item.powder)}
        </span>
      ),
    },
    {
      key: 'powderReceived',
      header: 'Powder Received',
      render: (item, index) => {
        if (item.isEditing) {
          return (
            <input
              type="text"
              value={item.powderReceivedRaw !== undefined ? item.powderReceivedRaw : (item.powderReceived === 0 ? '' : item.powderReceived)}
              onChange={(e) => handleInlineChange(index, 'powderReceived', e.target.value)}
              placeholder="0.000"
              className="w-full rounded border-0 bg-[#f4f4f2] px-2 py-1.5 text-center font-mono text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
            />
          );
        }
        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumber(item.powderReceived)}
          </span>
        );
      },
    },
    {
      key: 'purity',
      header: 'Purity (%)',
      render: (item, index) => {
        if (item.isEditing) {
          return (
            <input
              type="text"
              value={item.purityRaw !== undefined ? item.purityRaw : (item.purity === 0 ? '' : item.purity)}
              onChange={(e) => handleInlineChange(index, 'purity', e.target.value)}
              placeholder="e.g., 98"
              className="w-full rounded border-0 bg-[#f4f4f2] px-2 py-1.5 text-center font-mono text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
            />
          );
        }
        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumber(item.purity)}
          </span>
        );
      },
    },
    {
      key: 'srp',
      header: 'SRP (Majuri)',
      render: (item, index) => {
        if (item.isEditing) {
          return (
            <input
              type="text"
              value={item.srpRaw !== undefined ? item.srpRaw : (item.srp === 0 ? '' : item.srp)}
              onChange={(e) => handleInlineChange(index, 'srp', e.target.value)}
              placeholder="0.000"
              className="w-full rounded border-0 bg-[#f4f4f2] px-2 py-1.5 text-center font-mono text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
            />
          );
        }
        return (
          <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
            {formatNumber(item.srp)}
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
            {formatNumber(item.scrap)}
          </span>
        );
      },
    },
  ];

  // Check if all entries are saved
  const allSaved = jointEntries.every(entry => entry.isSaved);

  const isSubmitting = submitJoint.isPending;

  return (
    <div className="bg-[#f9f9f7] dark:bg-slate-950">
      <div>

        <GenericTable<JointEntry>
          data={jointEntries}
          columns={columns}
          onSave={(item, index) => handleSaveClick(index)}
          emptyMessage="No joint entries found."
          isLoading={jointLoading || isSubmitting}
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
                Are you sure you want to save this joint entry?
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

export default JointDept;
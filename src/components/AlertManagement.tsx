import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { GenericTable, Column } from '@/components/Forms/Table/GenericTable';
import GenericButton from './Forms/Buttons/GenericButton';
import { useSubmitProcessAlert, useDeleteProcessAlert } from '@/lib/api/alertmanagement';

export interface AlertRuleRow {
  id: string;
  grossWt: number | string;
  purity: number | string;
  loss: number | string;
  adjustment: number | string;
}

export type ProcessTabId =
  | 'melting'
  | 'tar'
  | 'box'
  | 'soldering'
  | 'joint'
  | 'cutting'
  | 'skunda';

interface ProcessTabConfig {
  id: ProcessTabId;
  label: string;
}

const STORAGE_KEY = 'chain_alert_management_settings_v2';

const PROCESS_TABS: ProcessTabConfig[] = [
  { id: 'melting', label: 'Melting' },
  { id: 'tar', label: 'Tar' },
  { id: 'box', label: 'Box' },
  { id: 'soldering', label: 'Soldering' },
  { id: 'joint', label: 'Joint' },
  { id: 'cutting', label: 'Cutting' },
  { id: 'skunda', label: 'S / Kunda' },
];

const createDefaultRow = (grossWt: string = '10G'): AlertRuleRow => ({
  id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
  grossWt: grossWt,
  purity: '',
  loss: '',
  adjustment: '',
});

const getDefaultAlertData = (): Record<ProcessTabId, AlertRuleRow[]> => ({
  melting: [createDefaultRow('10G')],
  tar: [createDefaultRow('10G')],
  box: [createDefaultRow('10G')],
  soldering: [createDefaultRow('10G')],
  joint: [createDefaultRow('10G')],
  cutting: [createDefaultRow('10G')],
  skunda: [createDefaultRow('10G')],
});

export const AlertManagement: React.FC = () => {
  const [activeProcess, setActiveProcess] = useState<ProcessTabId>('melting');
  const [alertData, setAlertData] = useState<Record<ProcessTabId, AlertRuleRow[]>>(() => {
    try {
      localStorage.removeItem('chain_alert_management_settings_v1');
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const merged: Record<ProcessTabId, AlertRuleRow[]> = getDefaultAlertData();
        PROCESS_TABS.forEach((tab) => {
          if (Array.isArray(parsed[tab.id]) && parsed[tab.id].length > 0) {
            merged[tab.id] = parsed[tab.id];
          }
        });
        return merged;
      }
    } catch (e) {
      console.error('Failed to parse saved alert data from localStorage', e);
    }
    return getDefaultAlertData();
  });

  // Active rows for current tab (strictly 1 row initially unless user added more)
  const currentRows = alertData[activeProcess] || [createDefaultRow('10G')];

  const submitalert = useSubmitProcessAlert();
  const deleteAlertMutation = useDeleteProcessAlert();

  // Update a single field in a row
  const handleFieldChange = (
    rowId: string,
    field: keyof Omit<AlertRuleRow, 'id'>,
    value: string,
  ) => {
    setAlertData((prev) => {
      const updatedList = (prev[activeProcess] || []).map((row) => {
        if (row.id === rowId) {
          return { ...row, [field]: value };
        }
        return row;
      });
      return {
        ...prev,
        [activeProcess]: updatedList,
      };
    });
  };

  // Add new row with Gross Wt default = 10G
  const handleAddRow = (index?: number) => {
    const newRow = createDefaultRow('10G');
    setAlertData((prev) => {
      const list = [...(prev[activeProcess] || [])];
      if (typeof index === 'number') {
        list.splice(index + 1, 0, newRow);
      } else {
        list.push(newRow);
      }
      return {
        ...prev,
        [activeProcess]: list,
      };
    });
    toast.success('New row added');
  };

  // Delete a row
  const handleDeleteRow = async (rowId: string) => {
    if (currentRows.length <= 1) {
      toast.error('At least one row is required.');
      return;
    }

    try {
      if (rowId && !rowId.includes('-')) {
        await deleteAlertMutation.mutateAsync({
          process: activeProcess,
          id: rowId,
        });
      }
    } catch (e) {
      console.error('Delete API error', e);
    }

    setAlertData((prev) => {
      const updated = (prev[activeProcess] || []).filter((r) => r.id !== rowId);
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...prev, [activeProcess]: updated }),
      );
      return {
        ...prev,
        [activeProcess]: updated,
      };
    });
    toast.success('Row removed');
  };

  // Save settings via process-specific API mutation with array payload
  const handleSave = async () => {
    try {
      const payload = currentRows.map((row) => {
        const grossWtNumber =
          typeof row.grossWt === 'number'
            ? row.grossWt
            : parseFloat(String(row.grossWt).replace(/[^0-9.]/g, '')) || 10;

        const adjustmentNumber =
          typeof row.adjustment === 'number'
            ? row.adjustment
            : parseFloat(String(row.adjustment).replace(/[^0-9.-]/g, '')) || 0;

        return {
          grossWt: grossWtNumber,
          purity: parseFloat(String(row.purity)) || 0,
          loss: parseFloat(String(row.loss)) || 0,
          adjustment: adjustmentNumber,
        };
      });

      await submitalert.mutateAsync({
        process: activeProcess,
        data: payload,
      });

      localStorage.setItem(STORAGE_KEY, JSON.stringify(alertData));
    } catch (error) {
      console.error('Failed to submit alert settings:', error);
    }
  };

  // Columns definition using project's GenericTable Column interface
  const columns: Column<AlertRuleRow>[] = [
    {
      key: 'grossWt',
      header: 'Gross Wt (G)',
      render: (item: AlertRuleRow) => (
        <div className="relative flex items-center">
          <input
            type="text"
            value={item.grossWt}
            onChange={(e) =>
              handleFieldChange(item.id, 'grossWt', e.target.value)
            }
            placeholder="10G"
            className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#785600] focus:ring-1 focus:ring-[#785600] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
      ),
    },
    {
      key: 'purity',
      header: 'Purity (%)',
      render: (item: AlertRuleRow) => (
        <div className="relative flex items-center">
          <input
            type="number"
            step="any"
            value={item.purity}
            onChange={(e) =>
              handleFieldChange(item.id, 'purity', e.target.value)
            }
            placeholder="Purity %"
            className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#785600] focus:ring-1 focus:ring-[#785600] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
      ),
    },
    {
      key: 'loss',
      header: 'Loss (G)',
      render: (item: AlertRuleRow) => (
        <div className="relative flex items-center">
          <input
            type="number"
            step="any"
            value={item.loss}
            onChange={(e) =>
              handleFieldChange(item.id, 'loss', e.target.value)
            }
            placeholder="Loss (G)"
            className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#785600] focus:ring-1 focus:ring-[#785600] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
      ),
    },
    {
      key: 'adjustment',
      header: 'Adjustment (+/- %)',
      render: (item: AlertRuleRow) => (
        <div className="relative flex items-center">
          <input
            type="text"
            value={item.adjustment}
            onChange={(e) =>
              handleFieldChange(item.id, 'adjustment', e.target.value)
            }
            placeholder="+/- %"
            className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#785600] focus:ring-1 focus:ring-[#785600] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'center',
      render: (item: AlertRuleRow, index: number) => (
        <div className="flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={() => handleAddRow(index)}
            className="rounded-lg p-1.5 text-[#785600] transition-colors hover:bg-[#785600]/10 dark:text-[#986d00] dark:hover:bg-[#986d00]/20"
            title="Add New Row"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleDeleteRow(item.id)}
            className="rounded-lg p-1.5 text-[#785600] transition-colors hover:bg-[#785600]/10 dark:text-[#986d00] dark:hover:bg-[#986d00]/20"
            title="Delete Row"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Sub-Tab Navigation Bar (Matching Main Tab Style) */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <div className="flex gap-6 overflow-x-auto">
          {PROCESS_TABS.map((tab) => {
            const isActive = activeProcess === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveProcess(tab.id)}
                className={`whitespace-nowrap border-b-2 pb-2.5 text-sm font-semibold transition-colors duration-150 ${isActive
                  ? 'border-[#785600] text-black dark:border-amber-400 dark:text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Project's GenericTable Component */}
      <div>
        <GenericTable<AlertRuleRow>
          data={currentRows}
          columns={columns}
          showSrNo={true}
          srNoLabel="Sr No."
          pagination={false}
          emptyMessage="No alert rules found"
        />

        {/* Footer with Save Button */}
        <div className="flex items-center justify-end px-4 py-3">
          <GenericButton
            type="button"
            onClick={handleSave}
            variant="primary"
            size="sm"
            disabled={submitalert.isPending}
          >
            <span>{submitalert.isPending ? 'Saving...' : 'Alert Settings'}</span>
          </GenericButton>
        </div>
      </div>
    </div>
  );
};

export default AlertManagement;

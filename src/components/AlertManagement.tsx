import React, {useState, useEffect} from 'react';
import {
  Plus,
  Trash2,
  Save,
  Flame,
  TrendingUp,
  Box,
  Hammer,
  Scissors,
  CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {GenericTable, Column} from '@/components/Forms/Table/GenericTable';
import GenericButton from './Forms/Buttons/GenericButton';
import PageHeader from '@/components/Forms/Common/PageHeader';
import {
  useGetProcessAlert,
  useSubmitProcessAlert,
  useDeleteProcessAlert,
} from '@/lib/api/alertmanagement';

export interface AlertRuleRow {
  id: string;
  grossWt: number | string;
  purity: number | string;
  loss: number | string;
  adjustment: number | string;
}

export type ProcessTabId = 'melting' | 'tar' | 'box' | 'cutting' | 'skunda';

interface ProcessTabConfig {
  id: ProcessTabId;
  label: string;
  icon: React.ReactNode;
}

const STORAGE_KEY = 'chain_alert_management_settings_v2';

const PROCESS_TABS: ProcessTabConfig[] = [
  {
    id: 'tar',
    label: 'Tar Management',
    icon: <TrendingUp className="h-4 w-4" />,
  },
  {id: 'box', label: 'Box Department', icon: <Box className="h-4 w-4" />},
  {id: 'cutting', label: 'Cutting', icon: <Scissors className="h-4 w-4" />},
  {id: 'skunda', label: 'S / Kunda', icon: <CheckCircle className="h-4 w-4" />},
  {id: 'melting', label: 'Melting', icon: <Flame className="h-4 w-4" />},
];

const createDefaultRow = (grossWt: string = '100G'): AlertRuleRow => ({
  id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
  grossWt: grossWt,
  purity: '',
  loss: '',
  adjustment: '',
});

const getDefaultAlertData = (): Record<ProcessTabId, AlertRuleRow[]> => ({
  tar: [createDefaultRow('100G')],
  box: [createDefaultRow('100G')],
  cutting: [createDefaultRow('100G')],
  skunda: [createDefaultRow('100G')],
  melting: [createDefaultRow('100G')],
});

export const AlertManagement: React.FC = () => {
  const [activeProcess, setActiveProcess] = useState<ProcessTabId>('tar');
  const [alertData, setAlertData] = useState<
    Record<ProcessTabId, AlertRuleRow[]>
  >(() => {
    try {
      localStorage.removeItem('chain_alert_management_settings_v1');
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const merged: Record<ProcessTabId, AlertRuleRow[]> =
          getDefaultAlertData();
        PROCESS_TABS.forEach((tab) => {
          if (Array.isArray(parsed[tab.id]) && parsed[tab.id].length > 0) {
            merged[tab.id] = parsed[tab.id].map((row: any) => ({
              ...row,
              grossWt:
                row.grossWt === '10G' || row.grossWt === 10
                  ? '100G'
                  : row.grossWt || '100G',
            }));
          }
        });
        return merged;
      }
    } catch (e) {
      console.error('Failed to parse saved alert data from localStorage', e);
    }
    return getDefaultAlertData();
  });

  const {data: serverAlerts, isLoading: isAlertsLoading} =
    useGetProcessAlert(activeProcess);

  useEffect(() => {
    let list: any[] = [];
    if (Array.isArray(serverAlerts) && serverAlerts.length > 0) {
      list = serverAlerts;
    } else if (serverAlerts && typeof serverAlerts === 'object') {
      if (
        Array.isArray((serverAlerts as any).data) &&
        (serverAlerts as any).data.length > 0
      ) {
        list = (serverAlerts as any).data;
      } else if ((serverAlerts as any).grossWt !== undefined) {
        list = [serverAlerts];
      }
    }

    if (list.length > 0) {
      const mappedRows: AlertRuleRow[] = list.map((item, idx) => {
        const lossVal =
          item.loss !== undefined && item.loss !== null
            ? item.loss
            : item.lossWt !== undefined && item.lossWt !== null
              ? item.lossWt
              : '';

        const adjVal =
          item.adjustment !== undefined && item.adjustment !== null
            ? item.adjustment
            : item.adjsutment !== undefined && item.adjsutment !== null
              ? item.adjsutment
              : '';

        return {
          id:
            item._id || item.id || `rule-${activeProcess}-${idx}-${Date.now()}`,
          grossWt:
            item.grossWt !== undefined && item.grossWt !== null
              ? typeof item.grossWt === 'number'
                ? `${item.grossWt}G`
                : String(item.grossWt).includes('G')
                  ? item.grossWt
                  : `${item.grossWt}G`
              : '100G',
          purity:
            item.purity !== undefined && item.purity !== null
              ? item.purity
              : '',
          loss: lossVal,
          adjustment: adjVal,
        };
      });

      setAlertData((prev) => ({
        ...prev,
        [activeProcess]: mappedRows,
      }));
    }
  }, [serverAlerts, activeProcess]);

  const currentRows = alertData[activeProcess] || [createDefaultRow('100G')];

  const submitalert = useSubmitProcessAlert();
  const deleteAlertMutation = useDeleteProcessAlert();

  const handleFieldChange = (
    rowId: string,
    field: keyof Omit<AlertRuleRow, 'id'>,
    value: string,
  ) => {
    setAlertData((prev) => {
      const updatedList = (prev[activeProcess] || []).map((row) => {
        if (row.id === rowId) {
          return {...row, [field]: value};
        }
        return row;
      });
      return {
        ...prev,
        [activeProcess]: updatedList,
      };
    });
  };

  const handleAddRow = (index?: number) => {
    const newRow = createDefaultRow('100G');
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

  const handleDeleteRow = async (rowId: string) => {
    // 1. Calculate remaining rows
    const remaining = (alertData[activeProcess] || []).filter(
      (r) => r.id !== rowId,
    );
    const updated =
      remaining.length > 0 ? remaining : [createDefaultRow('100G')];

    // 2. Update local state immediately
    setAlertData((prev) => ({
      ...prev,
      [activeProcess]: updated,
    }));

    // 3. Update localStorage
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({...alertData, [activeProcess]: updated}),
    );

    // 4. If row had a real server ID, attempt single delete API
    if (
      rowId &&
      !rowId.startsWith('rule-') &&
      !rowId.includes('.') &&
      !rowId.includes('-')
    ) {
      try {
        await deleteAlertMutation.mutateAsync({
          process: activeProcess,
          id: rowId,
        });
      } catch (e) {
        console.error('Single delete API error:', e);
      }
    }

    // 5. Sync the updated remaining rows array to the backend
    try {
      const payload = remaining
        .filter(
          (r) =>
            (r.purity !== '' && r.purity !== undefined) ||
            (r.loss !== '' && r.loss !== undefined) ||
            (r.adjustment !== '' && r.adjustment !== undefined),
        )
        .map((row) => ({
          grossWt:
            typeof row.grossWt === 'number'
              ? row.grossWt
              : parseFloat(String(row.grossWt).replace(/[^0-9.]/g, '')) || 100,
          purity: parseFloat(String(row.purity)) || 0,
          loss: parseFloat(String(row.loss)) || 0,
          lossWt: parseFloat(String(row.loss)) || 0,
          adjustment:
            parseFloat(String(row.adjustment).replace(/[^0-9.-]/g, '')) || 0,
          adjsutment:
            parseFloat(String(row.adjustment).replace(/[^0-9.-]/g, '')) || 0,
        }));

      await submitalert.mutateAsync({
        process: activeProcess,
        data: payload,
      });
    } catch (e) {
      console.error('Sync alert settings after delete error:', e);
    }

    toast.success('Row deleted successfully');
  };

  const handleSave = async () => {
    try {
      const payload = currentRows.map((row) => {
        const grossWtNumber =
          typeof row.grossWt === 'number'
            ? row.grossWt
            : parseFloat(String(row.grossWt).replace(/[^0-9.]/g, '')) || 100;

        const adjustmentNumber =
          typeof row.adjustment === 'number'
            ? row.adjustment
            : parseFloat(String(row.adjustment).replace(/[^0-9.-]/g, '')) || 0;

        const lossNumber = parseFloat(String(row.loss)) || 0;

        return {
          grossWt: grossWtNumber,
          purity: parseFloat(String(row.purity)) || 0,
          loss: lossNumber,
          lossWt: lossNumber,
          adjustment: adjustmentNumber,
          adjsutment: adjustmentNumber,
        };
      });

      await submitalert.mutateAsync({
        process: activeProcess,
        data: payload,
      });

      localStorage.setItem(STORAGE_KEY, JSON.stringify(alertData));
      // toast.success('Alert settings saved successfully');
    } catch (error) {
      console.error('Failed to submit alert settings:', error);
      toast.error('Failed to save alert settings');
    }
  };

  const columns: Column<AlertRuleRow>[] = [
    {
      key: 'grossWt',
      header: 'Gross Wt',
      render: (item: AlertRuleRow) => (
        <span className="font-mono text-sm text-[#1a1c1b] dark:text-white">
          {item.grossWt}
        </span>
      ),
    },
    {
      key: 'purity',
      header: 'Purity',
      render: (item: AlertRuleRow) => (
        <div className="relative inline-block">
          <input
            type="number"
            step="any"
            value={item.purity}
            onChange={(e) =>
              handleFieldChange(item.id, 'purity', e.target.value)
            }
            placeholder="0.000"
            className="font-mono w-20 rounded border-0 bg-[#f4f4f2] px-2 py-1.5 pr-6 text-right text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
          />
          <span className="text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 text-xs dark:text-slate-500">
            %
          </span>
        </div>
      ),
    },
    {
      key: 'loss',
      header: 'Loss',
      render: (item: AlertRuleRow) => (
        <div className="relative inline-block">
          <input
            type="number"
            step="any"
            value={item.loss}
            onChange={(e) => handleFieldChange(item.id, 'loss', e.target.value)}
            placeholder="0.000"
            className="font-mono w-20 rounded border-0 bg-[#f4f4f2] px-2 py-1.5 pr-6 text-right text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
          />
          <span className="text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 text-xs dark:text-slate-500">
            G
          </span>
        </div>
      ),
    },
    {
      key: 'adjustment',
      header: 'Adjustment',
      render: (item: AlertRuleRow) => (
        <div className="relative inline-block">
          <input
            type="number"
            step="any"
            value={item.adjustment}
            onChange={(e) =>
              handleFieldChange(item.id, 'adjustment', e.target.value)
            }
            placeholder="0.000"
            className="font-mono w-20 rounded border-0 bg-[#f4f4f2] px-2 py-1.5 pr-6 text-right text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
          />
          <span className="text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 text-xs dark:text-slate-500">
            %
          </span>
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
    <div className="bg-[#f9f9f7] dark:bg-slate-950">
      <div className="px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6">
        {/* Page Header */}
        <div className="mb-6">
          <PageHeader
            title="Alert Management"
            subtitle="Configure alert rules for each manufacturing process"
          />
        </div>

        {/* Sub-Tab Navigation Bar with Icons */}
        <div className="mb-6 border-b border-[#d3c4af]/20 dark:border-slate-700">
          <nav className="flex flex-wrap gap-1" aria-label="Tabs">
            {PROCESS_TABS.map((tab) => {
              const isActive = activeProcess === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveProcess(tab.id)}
                  className={`group relative flex items-center gap-2 rounded-t-lg border-b-2 px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'border-[#785600] bg-[#785600]/5 text-[#785600] dark:border-[#986d00] dark:bg-[#986d00]/10 dark:text-[#986d00]'
                      : 'border-transparent text-[#4f4535] hover:bg-[#785600]/5 dark:text-slate-500 dark:hover:bg-[#986d00]/10'
                  } cursor-pointer`}
                >
                  <span
                    className={
                      isActive
                        ? 'text-[#785600] dark:text-[#986d00]'
                        : 'text-[#4f4535] dark:text-slate-500'
                    }
                  >
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* GenericTable Component */}
        <div className="rounded-lg p-4 shadow-sm dark:bg-slate-900">
          <GenericTable<AlertRuleRow>
            data={currentRows}
            columns={columns}
            showSrNo={true}
            srNoLabel="Sr No."
            pagination={false}
            isLoading={isAlertsLoading}
            emptyMessage="No alert rules found"
          />

          {/* Footer with Save Button */}
          <div className="mt-1 flex items-center justify-end px-4 py-3 dark:border-slate-700">
            <GenericButton
              type="button"
              onClick={handleSave}
              variant="primary"
              size="sm"
              disabled={submitalert.isPending}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              <span>{submitalert.isPending ? 'Saving...' : 'Save'}</span>
            </GenericButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertManagement;

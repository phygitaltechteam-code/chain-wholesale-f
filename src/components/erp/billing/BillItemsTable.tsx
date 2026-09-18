import React from 'react';
import {Plus, Minus, Loader2} from 'lucide-react';
import {GenericTable, Column} from '@/components/Forms/Table/GenericTable';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import {ReceiptItem, formatNumberThreeDecimals} from './billFormTypes';

interface BillItemsTableProps {
  items: ReceiptItem[];
  availableItems: any[];
  availableSizes: any[];
  isReadOnly?: boolean;
  onItemChange: (index: number, field: keyof ReceiptItem, value: any) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  getScaleProps: (index: number, field: keyof ReceiptItem) => any;
}

export const BillItemsTable: React.FC<BillItemsTableProps> = ({
  items,
  availableItems,
  availableSizes,
  isReadOnly = false,
  onItemChange,
  onAddItem,
  onRemoveItem,
  getScaleProps,
}) => {
  const renderActions = (item: ReceiptItem) => {
    if (isReadOnly) return null;
    const actualIndex = items.indexOf(item);

    return (
      <div className="flex items-center justify-center gap-1">
        <button
          onClick={() => onRemoveItem(actualIndex)}
          className="rounded-lg p-1.5 text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/20"
          title="Remove row"
          disabled={items.length <= 1}
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onAddItem}
          className="rounded-lg p-1.5 text-emerald-600 transition-colors hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
          title="Add row"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  };

  const columns: Column<ReceiptItem>[] = [
    {
      key: 'item',
      header: 'Item',
      render: (item) => {
        if (isReadOnly) {
          return (
            <span className="font-semibold text-[#1a1c1b] dark:text-white">
              {item.item || '-'}
            </span>
          );
        }
        const actualIndex = items.indexOf(item);
        return (
          <select
            value={item.item}
            onChange={(e) => onItemChange(actualIndex, 'item', e.target.value)}
            className="w-full min-w-0 rounded-md border border-[#d3c4af]/30 bg-white px-1.5 py-1.5 text-xs focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="">Select Item</option>
            {availableItems.map((it: any) => (
              <option key={it.id} value={it.name}>
                {it.name}
              </option>
            ))}
          </select>
        );
      },
    },
    {
      key: 'size',
      header: 'Size',
      render: (item) => {
        if (isReadOnly) {
          return (
            <span className="text-[#1a1c1b] dark:text-white">
              {item.size || '-'}
            </span>
          );
        }
        const actualIndex = items.indexOf(item);
        return (
          <select
            value={item.size}
            onChange={(e) => onItemChange(actualIndex, 'size', e.target.value)}
            className="w-full min-w-0 rounded-md border border-[#d3c4af]/30 bg-white px-1.5 py-1.5 text-xs focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="">Select Size</option>
            {availableSizes.map((sz: any) => (
              <option key={sz.id} value={sz.size}>
                {sz.size}
              </option>
            ))}
          </select>
        );
      },
    },
    {
      key: 'purity',
      header: 'Purity (%)',
      render: (item) => {
        if (isReadOnly) {
          return (
            <div className="font-mono flex w-full items-center justify-end font-medium text-[#1a1c1b] dark:text-white">
              {item.purity !== undefined &&
              item.purity !== null &&
              item.purity !== ''
                ? `${item.purity}%`
                : '-'}
            </div>
          );
        }
        const actualIndex = items.indexOf(item);
        return (
          <div className="relative flex-1">
            <GenericInputField
              type="text"
              inputMode="decimal"
              step="0.001"
              min="0"
              max="100"
              value={
                item.purity !== undefined && item.purity !== null
                  ? item.purity
                  : ''
              }
              onChange={(e) =>
                onItemChange(actualIndex, 'purity', e.target.value)
              }
              placeholder="0.000"
              suffix="%"
              className="!w-full !min-w-0 !px-1.5 !py-1.5 !pr-6 text-right text-xs"
              decimalScale={3}
            />
            {item.isLoadingQty && (
              <Loader2 className="absolute right-8 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#785600]" />
            )}
          </div>
        );
      },
    },
    {
      key: 'availableQty',
      header: 'Available Qty',
      render: (item) => (
        <div className="flex w-full items-center justify-end gap-1 whitespace-nowrap rounded-md border border-[#c5b497] bg-[#eae3d5] px-2 py-1.5 text-xs shadow-inner dark:border-slate-600 dark:bg-slate-800">
          <span className="font-mono font-bold text-black dark:text-white">
            {item.availableQty !== undefined &&
            item.availableQty !== null &&
            item.availableQty !== ''
              ? formatNumberThreeDecimals(Number(item.availableQty))
              : '0'}
          </span>
          <span className="text-gray-500 text-[10px] dark:text-slate-400">
            G
          </span>
        </div>
      ),
    },
    {
      key: 'grossWt',
      header: 'Gross Wt (G)',
      render: (item) => {
        if (isReadOnly) {
          return (
            <div className="font-mono flex w-full items-center justify-end font-bold text-[#1a1c1b] dark:text-white">
              {formatNumberThreeDecimals(item.grossWt)} G
            </div>
          );
        }
        const actualIndex = items.indexOf(item);
        return (
          <GenericInputField
            type="text"
            inputMode="decimal"
            step="0.001"
            min="0"
            value={
              item.grossWt !== undefined && item.grossWt !== null
                ? item.grossWt
                : ''
            }
            {...getScaleProps(actualIndex, 'grossWt')}
            onChange={(e) => {
              onItemChange(actualIndex, 'grossWt', e.target.value);
            }}
            placeholder="0.000"
            suffix="G"
            className="!w-full !min-w-0 !px-1.5 !py-1.5 !pr-6 text-right text-xs"
            decimalScale={3}
          />
        );
      },
    },
    {
      key: 'srp',
      header: 'SRP (G)',
      render: (item) => {
        if (isReadOnly) {
          return (
            <div className="font-mono flex w-full items-center justify-end text-[#1a1c1b] dark:text-white">
              {formatNumberThreeDecimals(item.srp)} G
            </div>
          );
        }
        const actualIndex = items.indexOf(item);
        return (
          <GenericInputField
            type="text"
            inputMode="decimal"
            step="0.001"
            min="0"
            value={item.srp !== undefined && item.srp !== null ? item.srp : ''}
            onChange={(e) => onItemChange(actualIndex, 'srp', e.target.value)}
            placeholder="0.000"
            suffix="G"
            className="!w-full !min-w-0 !px-1.5 !py-1.5 !pr-6 text-right text-xs"
            decimalScale={3}
          />
        );
      },
    },
    {
      key: 'fineWt',
      header: 'Fine Wt (G)',
      render: (item) => (
        <div className="flex w-full items-center justify-end gap-1 whitespace-nowrap rounded-md border border-[#c5b497] bg-[#eae3d5] px-2 py-1.5 text-xs shadow-inner dark:border-slate-600 dark:bg-slate-800">
          <span className="font-mono font-bold text-black dark:text-amber-400">
            {formatNumberThreeDecimals(item.fineWt)}
          </span>
          <span className="text-gray-500 text-[10px] dark:text-slate-400">
            G
          </span>
        </div>
      ),
    },
    {
      key: 'laborRate',
      header: 'Labor Rate (G)',
      render: (item) => {
        if (isReadOnly) {
          return (
            <div className="font-mono flex w-full items-center justify-end text-[#1a1c1b] dark:text-white">
              {formatNumberThreeDecimals(item.laborRate)} G
            </div>
          );
        }
        const actualIndex = items.indexOf(item);
        return (
          <GenericInputField
            type="text"
            inputMode="decimal"
            step="0.001"
            min="0"
            value={
              item.laborRate !== undefined && item.laborRate !== null
                ? item.laborRate
                : ''
            }
            onChange={(e) =>
              onItemChange(actualIndex, 'laborRate', e.target.value)
            }
            placeholder="0.000"
            suffix="G"
            className="!w-full !min-w-0 !px-1.5 !py-1.5 !pr-6 text-right text-xs"
            decimalScale={3}
          />
        );
      },
    },
  ];

  return (
    <div className="mb-4 rounded-xl border border-[#d3c4af]/20 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
          Items
        </h3>
        {!isReadOnly && (
          <p className="mt-1 text-xs text-[#4f4535]/60 dark:text-slate-400">
            Use + button to add more items, - button to remove
          </p>
        )}
      </div>

      <div className="w-full min-w-0 overflow-hidden [&_table]:w-full [&_table]:table-fixed [&_td]:px-1.5 [&_td]:py-1.5 [&_td]:text-xs [&_th]:px-1.5 [&_th]:py-2 [&_th]:text-[11px]">
        <GenericTable<ReceiptItem>
          data={items}
          columns={columns}
          emptyMessage="No items added yet."
          isLoading={false}
          renderActions={isReadOnly ? undefined : renderActions}
          showSrNo={true}
          srNoLabel="Sr No."
        />
      </div>
    </div>
  );
};

export default BillItemsTable;

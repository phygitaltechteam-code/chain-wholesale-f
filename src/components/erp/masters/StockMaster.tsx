import React, { useState, useEffect } from 'react';
import {
  Plus,
  Save,
  X,
  Edit,
  Trash2,
  Package,
  Ruler,
  Search,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import { GenericTable, Column } from '@/components/Forms/Table/GenericTable';
import { useGetItems, Item } from '@/lib/api/items';
import { useGetSizes, Size } from '@/lib/api/sizes';
import {
  useCreateStock,
  useUpdateStock,
  useDeleteStock,
  useGetStock,
} from '@/lib/api/stock';
import { z } from 'zod';

// Zod Schema for validation
const OpeningStockSchema = z.object({
  itemId: z.string().min(1, 'Please select an item'),
  sizeId: z.string().min(1, 'Please select a size'),
  grams: z.number().min(0.001, 'Please enter a valid weight in grams'),
  purity: z
    .number()
    .min(1, 'Please enter purity percentage')
    .max(100, 'Purity cannot exceed 100%'),
});

type OpeningStockFormData = z.infer<typeof OpeningStockSchema>;

interface OpeningStockEntry {
  id: string;
  srNo: number;
  item: string;
  size: string;
  purity: number;
  grams: number;
  isEditing?: boolean;
  isSaved?: boolean;
  gramsRaw?: string;
  purityRaw?: string;
  itemId?: string;
  sizeId?: string;
}

const StockMaster: React.FC = () => {
  const navigate = useNavigate();
  const [openingEntries, setOpeningEntries] = useState<OpeningStockEntry[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch items and sizes from API
  const { data: items = [], isLoading: itemsLoading } = useGetItems();
  const { data: sizes = [], isLoading: sizesLoading } = useGetSizes();

  // Fetch existing stock data
  const {
    data: stockData = [],
    isLoading: stockLoading,
    refetch,
  } = useGetStock();

  // Mutation hooks
  const createStock = useCreateStock();
  const updateStock = useUpdateStock();
  const deleteStock = useDeleteStock();

  useEffect(() => {
    if (itemsLoading || sizesLoading || stockLoading) {
      return;
    }

    let entries: OpeningStockEntry[] = [];

    if (stockData.length > 0) {
      const stockEntries: OpeningStockEntry[] = stockData.map(
        (stock, index) => {
          const item = items.find((i) => i.id === stock.itemId);
          const size = sizes.find((s) => s.id === stock.sizeId);
          const isGold =
            (stock.sizeId === null && stock.purity === null) ||
            (item?.name?.toLowerCase().includes('gold') && stock.sizeId === null);

          const weight = stock.weight ? Number(stock.weight) : 0;
          const purity = isGold ? 100 : stock.purity ? Number(stock.purity) : 0;

          return {
            id: stock.id,
            srNo: index + 1,
            item: item?.name || (isGold ? 'Gold' : ''),
            size: isGold ? '-' : size?.size || '',
            purity: purity,
            grams: weight,
            isEditing: false,
            isSaved: true,
            gramsRaw: formatNumberDisplay(weight, 3),
            purityRaw: formatNumberDisplay(purity, 3),
            itemId: stock.itemId,
            sizeId: stock.sizeId,
          };
        },
      );
      const goldItems = stockEntries.filter(
        (entry) =>
          entry.sizeId === null && entry.purity === 100,
      );
      const otherItems = stockEntries.filter(
        (entry) =>
          !(entry.sizeId === null && entry.purity === 100),
      );
      const sortedGold = goldItems.sort((a, b) => a.item.localeCompare(b.item));
      const sortedOther = otherItems.sort((a, b) => {
        if (a.grams > 0 && b.grams === 0) return -1;
        if (a.grams === 0 && b.grams > 0) return 1;
        return a.item.localeCompare(b.item);
      });
      entries = [...sortedGold, ...sortedOther];
      entries = entries.map((entry, index) => ({
        ...entry,
        srNo: index + 1,
      }));
    }

    setOpeningEntries(entries);
  }, [stockData, items, sizes, itemsLoading, sizesLoading, stockLoading]);

  // Filter data based on search term - search across all fields
  const filteredData = searchTerm
    ? openingEntries.filter((entry) => {
      const searchLower = searchTerm.toLowerCase().trim();
      return (
        entry.item.toLowerCase().includes(searchLower) ||
        entry.size.toLowerCase().includes(searchLower) ||
        entry.purity.toString().includes(searchLower) ||
        entry.grams.toString().includes(searchLower) ||
        `${entry.grams}`.includes(searchLower)
      );
    })
    : openingEntries;

  // Validate form data
  const validateEntry = (entry: OpeningStockEntry): boolean => {
    try {
      OpeningStockSchema.parse({
        itemId: entry.itemId || '',
        sizeId: entry.sizeId || '',
        grams: entry.grams,
        purity:
          typeof entry.purity === 'string'
            ? parseFloat(entry.purity)
            : entry.purity,
      });
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          toast.error(err.message);
        });
      }
      return false;
    }
  };

  const formatNumberDisplay = (
    value: number | string | null | undefined,
    maxDecimals: number = 3,
  ): string => {
    if (value === null || value === undefined || value === '') return '-';
    const num = typeof value === 'number' ? value : parseFloat(String(value));
    if (isNaN(num)) return '-';
    if (num === 0) return '0';

    const fixed = num.toFixed(maxDecimals);
    return parseFloat(fixed).toString();
  };

  const formatGrams = (value: number | string | null | undefined): string => {
    return formatNumberDisplay(value, 3);
  };

  // Handle row save - Create or Update
  const handleRowSave = async (index: number) => {
    const entry = openingEntries[index];

    if (!validateEntry(entry)) {
      return;
    }

    const stockDataPayload = {
      itemId: entry.itemId,
      sizeId: entry.sizeId,
      weight: entry.grams,
      purity:
        typeof entry.purity === 'string'
          ? parseFloat(entry.purity)
          : entry.purity,
    };

    try {
      if (entry.isSaved) {
        await updateStock.mutateAsync({ id: entry.id, data: stockDataPayload });
        toast.success('Opening stock updated successfully!');
      } else {
        const result = await createStock.mutateAsync(stockDataPayload);
        entry.id = result.id;
        toast.success('Opening stock saved successfully!');
      }

      setOpeningEntries((prev) =>
        prev.map((s, i) => {
          if (i === index) {
            return {
              ...s,
              isEditing: false,
              isSaved: true,
              gramsRaw: formatNumberDisplay(entry.grams, 3),
              purityRaw: formatNumberDisplay(entry.purity, 3),
            };
          }
          return s;
        }),
      );

      await refetch();
    } catch (error) {
      console.error('Error saving opening stock:', error);
      toast.error('Failed to save opening stock');
    }
  };

  const handleRowClick = (entry: OpeningStockEntry) => {
    const id = entry.id;
    navigate({ to: `/stock/stockreport/${entry.id}` });
  };

  // Define columns for GenericTable - NO EDIT/DELETE icons
  const columns: Column<OpeningStockEntry>[] = [
    {
      key: 'item',
      header: 'Item',
      render: (item, index) => {
        return (
          <span className="font-medium text-[#1a1c1b] dark:text-white">
            {item.item}
          </span>
        );
      },
    },
    {
      key: 'size',
      header: 'Size',
      render: (item, index) => {
        return (
          <span className="text-[#1a1c1b] dark:text-white">{item.size}</span>
        );
      },
    },
    {
      key: 'purity',
      header: 'Purity (%)',
      render: (item, index) => {
        return (
          <span className="font-mono text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.purity, 3)} %
          </span>
        );
      },
    },
    {
      key: 'gramsRaw',
      header: 'Weight (G)',
      render: (item, index) => {
        return (
          <span className="font-mono text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.gramsRaw, 3)} G
          </span>
        );
      },
    },

  ];

  const isSubmitting =
    createStock.isPending || updateStock.isPending || deleteStock.isPending;

  return (
    <div className="bg-[#f9f9f7] dark:bg-slate-950">
      {/* Header with Title, Search and Buttons */}
      <div className="sticky top-0 z-10 border-b border-[#d3c4af]/10 bg-[#f9f9f7] dark:border-slate-700 dark:bg-slate-950">
        <div className="flex flex-col items-center justify-between gap-3 px-3 py-2 sm:px-4 sm:py-3 md:px-6 lg:flex-row">
          {/* Left side - Title with Refresh Icon */}
          <div className="flex w-full min-w-0 items-center gap-2 lg:w-auto">
            <h2 className="whitespace-nowrap font-headline text-2xl font-black italic text-[#1a1a2e] sm:text-3xl lg:text-4xl">
              Stocks
            </h2>
            <button
              type="button"
              onClick={async () => {
                await refetch();
                toast.success('Stock data refreshed');
              }}
              disabled={stockLoading}
              title="Refresh Stock Data"
              className="flex items-center justify-center rounded-lg p-1.5 text-[#785600] transition-all hover:bg-[#785600]/10 hover:scale-105 active:scale-95 disabled:opacity-50 dark:text-amber-400 dark:hover:bg-slate-800"
            >
              <RefreshCw
                className={`h-4 w-4 sm:h-5 sm:w-5 ${stockLoading ? 'animate-spin' : ''}`}
              />
            </button>
          </div>

          {/* Right side - Search and Action Buttons */}
          <div className="flex w-full flex-col items-center gap-3 sm:flex-row lg:w-auto">
            {/* Search Bar - Responsive */}
            <div className="relative w-full sm:w-64 md:w-72 lg:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
              <input
                type="text"
                placeholder="Search by item, size, weight or purity..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-[#d3c4af]/30 bg-white/80 py-2 pl-9 pr-4 text-sm text-[#1a1c1b] outline-none transition-all placeholder:text-[#817563] focus:border-[#785600] focus:ring-2 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-[#785600]"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#817563] hover:text-[#1a1c1b] dark:hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Action Buttons - Themed Colors */}
            <div className="flex w-full flex-wrap items-center justify-center gap-2 sm:w-auto">
              {/* Inward / Outward */}
              <GenericButton
                type="button"
                onClick={() => navigate({ to: '/Stocks/stockmanagement' })}
                variant="primary"
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Inward / Outward</span>
              </GenericButton>

              {/* Opening Stock */}
              <GenericButton
                type="button"
                onClick={() => navigate({ to: '/stock/openingstock' })}
                variant="primary"
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Opening Stock</span>
              </GenericButton>

              {/* Add Item */}
              <GenericButton
                type="button"
                onClick={() => navigate({ to: '/master/additems' })}
                variant="primary"
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Add Item</span>
              </GenericButton>

              {/* Add Size */}
              <GenericButton
                type="button"
                onClick={() => navigate({ to: '/master/size' })}
                variant="primary"
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Add Size</span>
              </GenericButton>
            </div>
          </div>
        </div>
      </div>

      <div className="px-3 pb-4 sm:px-4 md:px-6">
        {/* Generic Table - No Actions column */}
        <div className="-mx-3 overflow-x-auto sm:-mx-4 md:mx-0">
          <div className="inline-block min-w-full align-middle">
            <GenericTable
              data={filteredData}
              columns={columns}
              onSave={(item, index) => handleRowSave(index)}
              emptyMessage={
                searchTerm
                  ? `No results found for "${searchTerm}"`
                  : 'No opening stock entries found.'
              }
              isLoading={isSubmitting}
              showSrNo={true}
              srNoLabel="Sr No."
              onRowClick={handleRowClick}
              showEdit={false}
              showDelete={false}
              renderActions={undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockMaster;
import React, {useState, useEffect} from 'react';
import {Plus, Save, X, Edit, Trash2, Search, ArrowLeft} from 'lucide-react';
import {useNavigate} from '@tanstack/react-router';
import toast from 'react-hot-toast';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import {GenericTable, Column} from '@/components/Forms/Table/GenericTable';
import {useGetItems, Item} from '@/lib/api/items';
import {useGetSizes, Size} from '@/lib/api/sizes';
import {
  useCreateStock,
  useUpdateStock,
  useDeleteStock,
  useGetStock,
} from '@/lib/api/stock';
import {useTableScaleFocus} from '@/lib/hooks/useScaleFocus';
import {z} from 'zod';

// Zod Schema for validation
const OpeningStockSchema = z.object({
  itemId: z.string().min(1, 'Please select an item'),
  sizeId: z.string().min(1, 'Please select a size').optional(),
  grams: z
    .number()
    .min(0.001, 'Please enter a valid weight in grams')
    .optional(),
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
  isGoldRow?: boolean;
}

const OpeningStock: React.FC = () => {
  const navigate = useNavigate();
  const [openingEntries, setOpeningEntries] = useState<OpeningStockEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch items and sizes from API
  const {data: items = [], isLoading: itemsLoading} = useGetItems();
  const {data: sizes = [], isLoading: sizesLoading} = useGetSizes();

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

  // Weighing Scale table focus hook
  const {getScaleProps} = useTableScaleFocus<'grams'>(
    (index, field, weight) => {
      handleInlineChange(index, field, weight.toString());
    },
  );

  // Initialize with existing stock data or empty row
  useEffect(() => {
    if (itemsLoading || sizesLoading || stockLoading) {
      return;
    }

    if (stockData.length > 0) {
      const entries: OpeningStockEntry[] = stockData.map((stock, index) => {
        const item = items.find((i) => i.id === stock.itemId);
        const size = sizes.find((s) => s.id === stock.sizeId);

        // Check if this is a gold row
        const isGold = item?.name?.toLowerCase() === 'gold' || index === 0;

        // Handle null values with fallbacks
        const weight = stock.weight ? Number(stock.weight) : 0;
        const purity = stock.purity ? Number(stock.purity) : 0;

        return {
          id: stock.id,
          srNo: index + 1,
          item: isGold ? 'Gold' : item?.name || '',
          size: isGold ? '-' : size?.size || '',
          purity: isGold ? 0 : purity,
          grams: weight,
          isEditing: false,
          isSaved: true,
          gramsRaw: weight ? formatNumberDisplay(weight, 3) : '0',
          purityRaw: isGold ? '' : purity ? formatNumberDisplay(purity, 3) : '',
          itemId: stock.itemId || '',
          sizeId: stock.sizeId || '',
          isGoldRow: isGold,
        };
      });
      setOpeningEntries(entries);
    } else {
      setOpeningEntries([]);
    }
  }, [stockData, items, sizes, itemsLoading, sizesLoading, stockLoading]);

  // Filter data based on search term
  const filteredData = searchTerm
    ? openingEntries.filter(
        (item) =>
          item.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.size.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.purity.toString().includes(searchTerm),
      )
    : openingEntries;

  // Validate form data - Skip validation for gold row
  const validateEntry = (entry: OpeningStockEntry): boolean => {
    // Skip validation for gold row
    if (isGoldRow(entry)) {
      return true;
    }

    try {
      OpeningStockSchema.parse({
        itemId: entry.itemId || '',
        sizeId: entry.sizeId || '',
        grams: entry.grams || 0,
        purity:
          typeof entry.purity === 'string'
            ? parseFloat(entry.purity)
            : entry.purity || 0,
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

  // Handle row edit toggle
  const handleRowEdit = (index: number) => {
    setOpeningEntries((prev) =>
      prev.map((entry, i) => {
        if (i === index) {
          return {
            ...entry,
            isEditing: !entry.isEditing,
            gramsRaw: entry.grams !== 0 ? entry.grams.toString() : '',
            purityRaw: entry.purity ? entry.purity.toString() : '',
          };
        }
        return entry;
      }),
    );
  };

  // Handle inline field change
  const handleInlineChange = (
    index: number,
    field: 'item' | 'size' | 'purity' | 'grams' | 'itemId' | 'sizeId',
    value: string,
  ) => {
    setOpeningEntries((prev) =>
      prev.map((entry, i) => {
        if (i === index) {
          const updated = {...entry};

          if (field === 'item') {
            updated.item = value;
            const foundItem = items.find((item) => item.name === value);
            updated.itemId = foundItem?.id || '';
          } else if (field === 'size') {
            updated.size = value;
            const foundSize = sizes.find((size) => size.size === value);
            updated.sizeId = foundSize?.id || '';
          } else if (field === 'itemId') {
            updated.itemId = value;
            const foundItem = items.find((item) => item.id === value);
            updated.item = foundItem?.name || '';
          } else if (field === 'sizeId') {
            updated.sizeId = value;
            const foundSize = sizes.find((size) => size.id === value);
            updated.size = foundSize?.size || '';
          } else if (field === 'purity') {
            const sanitized = value.replace(/[^0-9.]/g, '');
            const parts = sanitized.split('.');
            const formatted =
              parts.length > 2
                ? `${parts[0]}.${parts.slice(1).join('')}`
                : sanitized;
            updated.purity = parseFloat(formatted) || 0;
            updated.purityRaw = formatted;
          } else if (field === 'grams') {
            const sanitized = value.replace(/[^0-9.]/g, '');
            const parts = sanitized.split('.');
            let formatted =
              parts.length > 2
                ? `${parts[0]}.${parts.slice(1).join('')}`
                : sanitized;

            if (
              formatted.includes('.') &&
              formatted.split('.')[1]?.length > 3
            ) {
              formatted = `${formatted.split('.')[0]}.${formatted.split('.')[1].slice(0, 3)}`;
            }

            updated.gramsRaw = formatted;
            if (formatted === '' || formatted === '.' || formatted === '-') {
              updated.grams = 0;
            } else {
              const numValue = parseFloat(formatted);
              updated.grams = isNaN(numValue) ? 0 : numValue;
            }
          }

          return updated;
        }
        return entry;
      }),
    );
  };

  // Helper function to format numbers up to 3 decimal places without unnecessary trailing zeros
  // (e.g. 1.200000000000003 -> "1.2", 1.233 -> "1.233", 92 -> "92")
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

    // Validate using Zod schema (skips validation for gold row)
    if (!validateEntry(entry)) {
      return;
    }

    let stockDataPayload;

    // For gold row, only send id and weight
    if (isGoldRow(entry)) {
      stockDataPayload = {
        id: entry.id,
        weight: entry.grams || 0,
      };
    } else {
      stockDataPayload = {
        itemId: entry.itemId || '',
        sizeId: entry.sizeId || '',
        weight: entry.grams || 0,
        purity:
          typeof entry.purity === 'string'
            ? parseFloat(entry.purity)
            : entry.purity || 0,
      };
    }

    try {
      if (entry.isSaved) {
        await updateStock.mutateAsync({id: entry.id, data: stockDataPayload});
        // toast.success('Opening stock updated successfully!');
      } else {
        const result = await createStock.mutateAsync(stockDataPayload);
        entry.id = result.id;
        // toast.success('Opening stock saved successfully!');
      }

      setOpeningEntries((prev) =>
        prev.map((s, i) => {
          if (i === index) {
            return {
              ...s,
              isEditing: false,
              isSaved: true,
              gramsRaw: formatNumberDisplay(entry.grams || 0, 3),
              purityRaw: isGoldRow(entry)
                ? ''
                : formatNumberDisplay(entry.purity || 0, 3),
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

  // Handle delete
  const handleDelete = async (index: number) => {
    const entry = openingEntries[index];

    if (
      !window.confirm(
        'Are you sure you want to delete this opening stock entry?',
      )
    ) {
      return;
    }

    try {
      if (entry.isSaved) {
        await deleteStock.mutateAsync(entry.id);
      }

      // Remove the deleted row immediately from the local table.
      setOpeningEntries((prev) =>
        prev
          .filter((_, i) => i !== index)
          .map((entry, i) => ({
            ...entry,
            srNo: i + 1,
          })),
      );

      // React Query invalidation in useDeleteStock refreshes the server data.
    } catch (error) {
      console.error('Error deleting opening stock:', error);
      toast.error('Failed to delete opening stock');
    }
  };

  // Handle add new row
  const handleAddRow = () => {
    const newEntry: OpeningStockEntry = {
      id: `opening-${Date.now()}`,
      srNo: openingEntries.length + 1,
      item: '',
      size: '',
      purity: 0,
      grams: 0,
      isEditing: true,
      isSaved: false,
      gramsRaw: '',
      purityRaw: '',
      itemId: '',
      sizeId: '',
      isGoldRow: false,
    };
    setOpeningEntries((prev) => [...prev, newEntry]);
  };

  // Check if a row is the gold row
  const isGoldRow = (entry: OpeningStockEntry) => {
    return entry.isGoldRow || (entry.item === 'Gold' && entry.srNo === 1);
  };

  // Custom action renderer for GenericTable with matching theme
  const renderActions = (item: OpeningStockEntry, index: number) => {
    // Show Save and Delete for unsaved/new rows OR when in editing mode
    if (item.isEditing || !item.isSaved) {
      return (
        <div className="flex">
          <button
            onClick={() => handleRowSave(index)}
            disabled={createStock.isPending || updateStock.isPending}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[#785600] shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-[#785600]/10 hover:shadow-md active:scale-[0.98] dark:text-[#986d00] dark:hover:bg-[#986d00]/20"
            title="Save"
          >
            <Save className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(index)}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[#785600] shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-[#785600]/10 hover:shadow-md active:scale-[0.98] dark:text-[#986d00] dark:hover:bg-[#986d00]/20"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      );
    }

    // For gold row (saved), only show Edit button (no Delete)
    if (isGoldRow(item)) {
      return (
        <div className="flex">
          <button
            onClick={() => handleRowEdit(index)}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[#785600] shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-[#785600]/10 hover:shadow-md active:scale-[0.98] dark:text-[#986d00] dark:hover:bg-[#986d00]/20"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </button>
        </div>
      );
    }

    // Show Edit and Delete for saved rows (non-gold)
    return (
      <div className="flex">
        <button
          onClick={() => handleRowEdit(index)}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[#785600] shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-[#785600]/10 hover:shadow-md active:scale-[0.98] dark:text-[#986d00] dark:hover:bg-[#986d00]/20"
          title="Edit"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          onClick={() => handleDelete(index)}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[#785600] shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-[#785600]/10 hover:shadow-md active:scale-[0.98] dark:text-[#986d00] dark:hover:bg-[#986d00]/20"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    );
  };

  // Define columns for GenericTable
  const columns: Column<OpeningStockEntry>[] = [
    {
      key: 'item',
      header: 'Item',

      render: (item, index) => {
        // If it's a gold row, show "Gold" as read-only
        if (isGoldRow(item) && item.isSaved) {
          return (
            <span className="font-medium text-[#785600] dark:text-amber-400">
              Gold
            </span>
          );
        }
        if (item.isEditing) {
          return (
            <select
              value={item.itemId || ''}
              onChange={(e) =>
                handleInlineChange(index, 'itemId', e.target.value)
              }
              className="w-28 rounded border-0 bg-[#f4f4f2] px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
            >
              <option value="">Select Item</option>
              {items &&
                items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
            </select>
          );
        }
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
        // If it's a gold row, show "-" as read-only
        if (isGoldRow(item) && item.isSaved) {
          return <span className="text-[#4f4535] dark:text-slate-400">-</span>;
        }
        if (item.isEditing) {
          return (
            <select
              value={item.sizeId || ''}
              onChange={(e) =>
                handleInlineChange(index, 'sizeId', e.target.value)
              }
              className="w-28 rounded border-0 bg-[#f4f4f2] px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
            >
              <option value="">Select Size</option>
              {sizes &&
                sizes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.size}
                  </option>
                ))}
            </select>
          );
        }
        return (
          <span className="text-[#1a1c1b] dark:text-white">{item.size}</span>
        );
      },
    },
    {
      key: 'grams',
      header: 'Weight (G)',
      render: (item, index) => {
        if (item.isEditing) {
          return (
            <div className="relative inline-block">
              <input
                type="text"
                value={
                  item.gramsRaw !== undefined
                    ? item.gramsRaw
                    : item.grams === 0
                      ? ''
                      : item.grams
                }
                {...getScaleProps(index, 'grams')}
                onChange={(e) =>
                  handleInlineChange(index, 'grams', e.target.value)
                }
                placeholder="0.000"
                className="font-mono w-24 rounded border-0 bg-[#f4f4f2] px-2 py-1.5 pr-6 text-right text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
              />
              <span className="text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 text-xs dark:text-slate-500">
                G
              </span>
            </div>
          );
        }
        return (
          <span className="font-mono text-[#1a1c1b] dark:text-white">
            {formatGrams(item.grams || 0)} G
          </span>
        );
      },
    },
    {
      key: 'purity',
      header: 'Purity (%)',
      render: (item, index) => {
        // If it's a gold row, show "-" as read-only
        if (isGoldRow(item) && item.isSaved) {
          return <span className="text-[#4f4535] dark:text-slate-400">-</span>;
        }
        if (item.isEditing) {
          return (
            <div className="relative inline-block">
              <input
                type="text"
                value={
                  item.purityRaw !== undefined
                    ? item.purityRaw
                    : item.purity
                      ? item.purity.toString()
                      : ''
                }
                onChange={(e) =>
                  handleInlineChange(index, 'purity', e.target.value)
                }
                placeholder="e.g., 98"
                className="w-24 rounded border-0 bg-[#f4f4f2] px-2 py-1.5 pr-6 text-right text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
              />
              <span className="text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 text-xs dark:text-slate-500">
                %
              </span>
            </div>
          );
        }
        return (
          <span className="font-mono text-[#1a1c1b] dark:text-white">
            {formatNumberDisplay(item.purity, 3)} %
          </span>
        );
      },
    },
  ];

  const isSubmitting =
    createStock.isPending || updateStock.isPending || deleteStock.isPending;

  return (
    <div className="bg-[#f9f9f7] dark:bg-slate-950">
      {/* Header with Title, Search and Add Button */}
      <div className="sticky top-0 z-10 border-b border-[#d3c4af]/10 bg-[#f9f9f7] dark:border-slate-700 dark:bg-slate-950">
        <div className="flex flex-col items-center justify-between gap-3 px-3 py-2 sm:flex-row sm:px-4 sm:py-3 md:px-6">
          <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto">
            <button
              onClick={() => navigate({to: '/Stocks/stockpage'})}
              className="flex flex-shrink-0 items-center gap-1 text-[#785600] transition-colors hover:text-[#5d4200] dark:text-amber-400 dark:hover:text-amber-300"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-xs font-medium sm:text-sm">Back</span>
            </button>
            <div className="h-5 w-px flex-shrink-0 bg-[#d3c4af]/30 dark:bg-slate-600" />
            <h2 className="font-headline text-2xl font-black italic text-[#1a1a2e] sm:text-3xl lg:text-4xl">
              Opening Stock
            </h2>
          </div>

          {/* Search and Add Button - Same Line */}
          <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
            {/* Search Bar */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
              <input
                type="text"
                placeholder="Search by item, size or purity..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-2 pl-9 pr-4 text-sm text-[#1a1c1b] placeholder:text-[#817563] focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Add Button */}
            <GenericButton type="button" onClick={handleAddRow}>
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />{' '}
              <span className="xs:inline hidden">Add Row</span>
              <span className="xs:hidden">Add Row</span>
            </GenericButton>
          </div>
        </div>
      </div>
      <div className="px-3 pb-4 sm:px-4 md:px-6">
        {/* Generic Table */}
        <div className="-mx-3 sm:-mx-4 md:mx-0">
          <GenericTable
            data={filteredData}
            columns={columns}
            onSave={(item, index) => handleRowSave(index)}
            emptyMessage="No opening stock entries found. Click 'Add Row' to create one."
            isLoading={isSubmitting}
            renderActions={renderActions}
            showSrNo={true}
            srNoLabel="Sr No."
          />
        </div>
      </div>
    </div>
  );
};

export default OpeningStock;

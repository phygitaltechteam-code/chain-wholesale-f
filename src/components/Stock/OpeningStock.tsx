import React, { useState, useEffect } from 'react';
import { Plus, Save, X, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import { GenericTable, Column } from '@/components/Forms/Table/GenericTable';
import { useGetItems, Item } from '@/lib/api/items';
import { useGetSizes, Size } from '@/lib/api/sizes';
import { useCreateStock, useUpdateStock, useDeleteStock, useGetStock } from '@/lib/api/stock';
import { z } from 'zod';

// Zod Schema for validation
const OpeningStockSchema = z.object({
  itemId: z.string().min(1, "Please select an item"),
  sizeId: z.string().min(1, "Please select a size"),
  grams: z.number().min(0.001, "Please enter a valid weight in grams"),
  purity: z.number().min(1, "Please enter purity percentage")
    .max(100, "Purity cannot exceed 100%"),
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

const OpeningStock: React.FC = () => {
  const navigate = useNavigate();
  const [openingEntries, setOpeningEntries] = useState<OpeningStockEntry[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch items and sizes from API
  const { data: items = [], isLoading: itemsLoading } = useGetItems();
  const { data: sizes = [], isLoading: sizesLoading } = useGetSizes();

  // Fetch existing stock data
  const { data: stockData = [], isLoading: stockLoading, refetch } = useGetStock();

  // Mutation hooks
  const createStock = useCreateStock();
  const updateStock = useUpdateStock();
  const deleteStock = useDeleteStock();

  // Initialize with existing stock data or empty row
  useEffect(() => {
    if (itemsLoading || sizesLoading || stockLoading) {
      return;
    }

    if (isInitialized) {
      return;
    }

    if (stockData.length > 0) {
      const entries: OpeningStockEntry[] = stockData.map((stock, index) => {
        // Find the item and size from the IDs
        const item = items.find(i => i.id === stock.itemId);
        const size = sizes.find(s => s.id === stock.sizeId);

        return {
          id: stock.id,
          srNo: index + 1,
          item: item?.name || '',
          size: size?.size || '',
          purity: typeof stock.purity === 'string' ? parseFloat(stock.purity) : stock.purity,
          grams: stock.weight,
          isEditing: false,
          isSaved: true,
          gramsRaw: stock.weight.toString(),
          purityRaw: typeof stock.purity === 'string' ? stock.purity : stock.purity?.toString() || '',
          itemId: stock.itemId,
          sizeId: stock.sizeId,
        };
      });
      setOpeningEntries(entries);
    } else {
      // Start with empty state - no initial row
      setOpeningEntries([]);
    }

    setIsInitialized(true);
  }, [stockData, items, sizes, itemsLoading, sizesLoading, stockLoading, isInitialized]);

  // Validate form data
  const validateEntry = (entry: OpeningStockEntry): boolean => {
    try {
      OpeningStockSchema.parse({
        itemId: entry.itemId || '',
        sizeId: entry.sizeId || '',
        grams: entry.grams,
        purity: typeof entry.purity === 'string' ? parseFloat(entry.purity) : entry.purity,
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
    setOpeningEntries(prev => prev.map((entry, i) => {
      if (i === index) {
        return {
          ...entry,
          isEditing: !entry.isEditing,
          gramsRaw: entry.grams !== 0 ? entry.grams.toString() : '',
          purityRaw: entry.purity ? entry.purity.toString() : '',
        };
      }
      return entry;
    }));
  };

  // Handle inline field change
  const handleInlineChange = (index: number, field: 'item' | 'size' | 'purity' | 'grams' | 'itemId' | 'sizeId', value: string) => {
    setOpeningEntries(prev => prev.map((entry, i) => {
      if (i === index) {
        const updated = { ...entry };

        if (field === 'item') {
          updated.item = value;
          const foundItem = items.find(item => item.name === value);
          updated.itemId = foundItem?.id || '';
        } else if (field === 'size') {
          updated.size = value;
          const foundSize = sizes.find(size => size.size === value);
          updated.sizeId = foundSize?.id || '';
        } else if (field === 'itemId') {
          updated.itemId = value;
          const foundItem = items.find(item => item.id === value);
          updated.item = foundItem?.name || '';
        } else if (field === 'sizeId') {
          updated.sizeId = value;
          const foundSize = sizes.find(size => size.id === value);
          updated.size = foundSize?.size || '';
        } else if (field === 'purity') {
          const sanitized = value.replace(/[^0-9.]/g, '');
          const parts = sanitized.split('.');
          const formatted = parts.length > 2
            ? `${parts[0]}.${parts.slice(1).join('')}`
            : sanitized;
          updated.purity = parseFloat(formatted) || 0;
          updated.purityRaw = formatted;
        } else if (field === 'grams') {
          const sanitized = value.replace(/[^0-9.]/g, '');
          const parts = sanitized.split('.');
          let formatted = parts.length > 2
            ? `${parts[0]}.${parts.slice(1).join('')}`
            : sanitized;

          if (formatted.includes('.') && formatted.split('.')[1]?.length > 3) {
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
    }));
  };

  // Helper function to format grams without trailing zeros
  const formatGrams = (value: number): string => {
    if (value === 0) return '0';
    // Remove trailing zeros after decimal
    const str = value.toString();
    if (str.includes('.')) {
      return str.replace(/\.?0+$/, '');
    }
    return str;
  };

  // Handle row save - Create or Update
  const handleRowSave = async (index: number) => {
    const entry = openingEntries[index];

    // Validate using Zod schema
    if (!validateEntry(entry)) {
      return;
    }

    const stockDataPayload = {
      itemId: entry.itemId,
      sizeId: entry.sizeId,
      weight: entry.grams,
      purity: typeof entry.purity === 'string' ? parseFloat(entry.purity) : entry.purity,
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

      setOpeningEntries(prev => prev.map((s, i) => {
        if (i === index) {
          return {
            ...s,
            isEditing: false,
            isSaved: true,
            gramsRaw: formatGrams(entry.grams),
            purityRaw: entry.purity.toString(),
          };
        }
        return s;
      }));

      await refetch();
    } catch (error) {
      console.error('Error saving opening stock:', error);
      toast.error('Failed to save opening stock');
    }
  };

  // Handle delete
  const handleDelete = async (index: number) => {
    const entry = openingEntries[index];
    if (window.confirm(`Are you sure you want to delete this opening stock entry?`)) {
      try {
        if (entry.isSaved) {
          await deleteStock.mutateAsync(entry.id);
          toast.success('Opening stock entry deleted successfully');
          await refetch();
        }
        setOpeningEntries(prev => prev.filter((_, i) => i !== index));
        setOpeningEntries(prev => prev.map((e, i) => ({ ...e, srNo: i + 1 })));
      } catch (error) {
        console.error('Error deleting opening stock:', error);
        toast.error('Failed to delete opening stock');
      }
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
    };
    setOpeningEntries(prev => [...prev, newEntry]);
  };

  const formatNumber = (value: number) => {
    if (value === 0) return '0';
    const str = value.toString();
    if (str.includes('.')) {
      return str.replace(/\.?0+$/, '');
    }
    return str;
  };

  // Custom action renderer for GenericTable with matching theme
  const renderActions = (item: OpeningStockEntry, index: number) => {
    // Show Save and Delete for unsaved/new rows OR when in editing mode
    if (item.isEditing || !item.isSaved) {
      return (
        <div className="flex ">
          <button
            onClick={() => handleRowSave(index)}
            disabled={createStock.isPending || updateStock.isPending}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[#785600] shadow-sm transition-all duration-200 hover:bg-[#785600]/10 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] dark:text-[#986d00] dark:hover:bg-[#986d00]/20"
            title="Save"
          >
            <Save className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(index)}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[#785600] shadow-sm transition-all duration-200 hover:bg-[#785600]/10 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] dark:text-[#986d00] dark:hover:bg-[#986d00]/20"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      );
    }

    // Show Edit and Delete for saved rows
    return (
      <div className="flex">
        <button
          onClick={() => handleRowEdit(index)}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[#785600] shadow-sm transition-all duration-200 hover:bg-[#785600]/10 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] dark:text-[#986d00] dark:hover:bg-[#986d00]/20"
          title="Edit"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          onClick={() => handleDelete(index)}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[#785600] shadow-sm transition-all duration-200 hover:bg-[#785600]/10 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] dark:text-[#986d00] dark:hover:bg-[#986d00]/20"
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
      align: 'left',
      render: (item, index) => {
        if (item.isEditing) {
          return (
            <select
              value={item.itemId || ''}
              onChange={(e) => handleInlineChange(index, 'itemId', e.target.value)}
              className="w-full rounded border-0 bg-[#f4f4f2] px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
            >
              <option value="">Select Item</option>
              {items && items.map((i) => (
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
      align: 'left',
      render: (item, index) => {
        if (item.isEditing) {
          return (
            <select
              value={item.sizeId || ''}
              onChange={(e) => handleInlineChange(index, 'sizeId', e.target.value)}
              className="w-full rounded border-0 bg-[#f4f4f2] px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
            >
              <option value="">Select Size</option>
              {sizes && sizes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.size}
                </option>
              ))}
            </select>
          );
        }
        return (
          <span className="text-[#1a1c1b] dark:text-white">
            {item.size}
          </span>
        );
      },
    },
    {
      key: 'grams',
      header: 'Weight (G)',
      align: 'center',
      render: (item, index) => {
        if (item.isEditing) {
          return (
            <input
              type="text"
              value={item.gramsRaw !== undefined ? item.gramsRaw : (item.grams === 0 ? '' : item.grams)}
              onChange={(e) => handleInlineChange(index, 'grams', e.target.value)}
              placeholder="0.000"
              className="w-full rounded border-0 bg-[#f4f4f2] px-2 py-1.5 text-right font-mono text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
            />
          );
        }
        return (
          <span className="font-mono text-[#1a1c1b] dark:text-white">
            {formatGrams(item.grams)}
          </span>
        );
      },
    },
    {
      key: 'purity',
      header: 'Purity (%)',
      align: 'center',
      render: (item, index) => {
        if (item.isEditing) {
          return (
            <input
              type="text"
              value={item.purityRaw !== undefined ? item.purityRaw : (item.purity ? item.purity.toString() : '')}
              onChange={(e) => handleInlineChange(index, 'purity', e.target.value)}
              placeholder="e.g., 98"
              className="w-full rounded border-0 bg-[#f4f4f2] px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-700 dark:text-white"
            />
          );
        }
        return (
          <span className="font-mono text-[#1a1c1b] dark:text-white">
            {item.purity || '-'}
          </span>
        );
      },
    },
  ];

  const isSubmitting = createStock.isPending || updateStock.isPending || deleteStock.isPending;

  return (
    <div className="min-h-screen bg-[#f9f9f7] dark:bg-slate-950">
      {/* Header with Title */}
      <div className="sticky top-0 z-10 bg-[#f9f9f7] dark:bg-slate-950 border-b border-[#d3c4af]/10 dark:border-slate-700">
        <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 md:px-6">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="font-headline text-2xl font-black italic text-[#1a1a2e] sm:text-3xl lg:text-4xl">
              Opening Stock
            </h2>
          </div>

          <GenericButton
            type="button"
            onClick={handleAddRow}
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Add Row</span>
            <span className="xs:hidden">Add</span>
          </GenericButton>
        </div>
      </div>

      <div className="px-3 sm:px-4 md:px-6 pb-4">
        {/* Generic Table */}
        <div className="-mx-3 sm:-mx-4 md:mx-0">
          <GenericTable
            data={openingEntries}
            columns={columns}
            onSave={(item, index) => handleRowSave(index)}
            emptyMessage="No opening stock entries found. Click 'Add Row' to create one."
            isLoading={isSubmitting}
            renderActions={renderActions}
            showSrNo={true}
            srNoLabel="Sr No."
          />
        </div>

        {/* Footer */}
        {openingEntries.length > 0 && (
          <div className="mt-3 flex items-center justify-end border-t border-[#d3c4af]/10 pt-3 text-xs text-[#4f4535] dark:border-slate-700 dark:text-slate-400">
            <span className="font-medium text-amber-600 dark:text-amber-400">
              Total Weight: {openingEntries.reduce((sum, entry) => sum + entry.grams, 0).toFixed(4)} G
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default OpeningStock;
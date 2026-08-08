import React, { useState, useEffect } from 'react';
import { Plus, Save, X, Edit, Trash2, Package, Ruler, Search } from 'lucide-react';
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

const StockMaster: React.FC = () => {
  const navigate = useNavigate();
  const [openingEntries, setOpeningEntries] = useState<OpeningStockEntry[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch items and sizes from API
  const { data: items = [], isLoading: itemsLoading } = useGetItems();
  const { data: sizes = [], isLoading: sizesLoading } = useGetSizes();

  // Fetch existing stock data
  const { data: stockData = [], isLoading: stockLoading, refetch } = useGetStock();

  // Mutation hooks
  const createStock = useCreateStock();
  const updateStock = useUpdateStock();
  const deleteStock = useDeleteStock();

  // Initialize with existing stock data only (no empty row)
  useEffect(() => {
    if (itemsLoading || sizesLoading || stockLoading) {
      return;
    }

    if (isInitialized) {
      return;
    }

    // Separate gold items and other items
    let entries: OpeningStockEntry[] = [];

    if (stockData.length > 0) {
      const stockEntries: OpeningStockEntry[] = stockData.map((stock, index) => {
        const item = items.find(i => i.id === stock.itemId);
        const size = sizes.find(s => s.id === stock.sizeId);

        return {
          id: stock.id,
          srNo: index + 1,
          item: item?.name || '',
          size: size?.size || '',
          purity: typeof stock.purity === 'string' ? parseFloat(stock.purity) : stock.purity || '99.99',
          grams: stock.weight,
          isEditing: false,
          isSaved: true,
          gramsRaw: stock.weight.toString(),
          purityRaw: typeof stock.purity === 'string' ? stock.purity : stock.purity?.toString() || '',
          itemId: stock.itemId,
          sizeId: stock.sizeId,
        };
      });

      // Separate gold items (assuming gold is identified by name containing 'gold' or itemId)
      const goldItems = stockEntries.filter(entry =>
        entry.item.toLowerCase().includes('gold') ||
        entry.itemId?.toLowerCase().includes('gold')
      );
      const otherItems = stockEntries.filter(entry =>
        !entry.item.toLowerCase().includes('gold') &&
        !entry.itemId?.toLowerCase().includes('gold')
      );

      // Sort gold items to top, then sort by item name
      const sortedGold = goldItems.sort((a, b) => a.item.localeCompare(b.item));
      const sortedOther = otherItems.sort((a, b) => a.item.localeCompare(b.item));

      // Combine with gold items first
      entries = [...sortedGold, ...sortedOther];

      // Recalculate srNo
      entries = entries.map((entry, index) => ({
        ...entry,
        srNo: index + 1
      }));
    } else {
      entries = [];
    }

    setOpeningEntries(entries);
    setIsInitialized(true);
  }, [stockData, items, sizes, itemsLoading, sizesLoading, stockLoading, isInitialized]);

  // Filter data based on search term - search across all fields
  const filteredData = searchTerm
    ? openingEntries.filter(entry => {
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

  // Helper function to format grams - remove trailing zeros
  const formatGrams = (value: number): string => {
    if (value === 0) return '0';
    const str = value.toString();
    if (str.includes('.')) {
      return str.replace(/\.?0+$/, '');
    }
    return str;
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

  // Define columns for GenericTable
  const columns: Column<OpeningStockEntry>[] = [
    {
      key: 'item',
      header: 'Item',
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
            {item.purity || '99.99'}
          </span>
        );
      },
    },
  ];

  const isSubmitting = createStock.isPending || updateStock.isPending || deleteStock.isPending;

  return (
    <div className="bg-[#f9f9f7] dark:bg-slate-950">
      {/* Header with Title, Search and Buttons */}
      <div className="sticky top-0 z-10 bg-[#f9f9f7] dark:bg-slate-950 border-b border-[#d3c4af]/10 dark:border-slate-700">
        <div className="flex flex-col lg:flex-row items-center justify-between px-3 py-2 sm:px-4 sm:py-3 md:px-6 gap-3">
          {/* Left side - Title */}
          <div className="flex items-center gap-2 min-w-0 w-full lg:w-auto">
            <h2 className="font-headline text-2xl font-black italic text-[#1a1a2e] sm:text-3xl lg:text-4xl whitespace-nowrap">
              Stocks
            </h2>
          </div>

          {/* Right side - Search and Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            {/* Search Bar - Responsive */}
            <div className="relative w-full sm:w-64 md:w-72 lg:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
              <input
                type="text"
                placeholder="Search by item, size, weight or purity..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-[#d3c4af]/30 bg-white/80 pl-9 pr-4 py-2 text-sm text-[#1a1c1b] placeholder:text-[#817563] outline-none transition-all focus:border-[#785600] focus:ring-2 focus:ring-[#785600]/20 dark:bg-slate-800 dark:text-white dark:border-slate-700 dark:focus:border-[#785600]"
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

            {/* Action Buttons - Responsive Grid */}
            <div className="flex flex-wrap items-center justify-center gap-2 w-full sm:w-auto">
              <GenericButton
                type="button"
                onClick={() => navigate({ to: '/Stocks/stockmanagement' })}
                className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span >  Inward / Outward</span>
              </GenericButton>

              <GenericButton
                type="button"
                onClick={() => navigate({ to: '/stock/openingstock' })}
                className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span >Opening Stock</span>
              </GenericButton>

              <GenericButton
                type="button"
                onClick={() => navigate({ to: '/master/additems' })}
                className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Add Item</span>
              </GenericButton>

              <GenericButton
                type="button"
                onClick={() => navigate({ to: '/master/size' })}
                className="whitespace-nowrap text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Add Size</span>
              </GenericButton>
            </div>
          </div>
        </div>
      </div>

      <div className="px-3 sm:px-4 md:px-6 pb-4">
        {/* Generic Table */}
        <div className="-mx-3 sm:-mx-4 md:mx-0 overflow-x-auto">
          <div className="min-w-full inline-block align-middle">
            <GenericTable
              data={filteredData}
              columns={columns}
              onSave={(item, index) => handleRowSave(index)}
              emptyMessage={
                searchTerm
                  ? `No results found for "${searchTerm}"`
                  : "No opening stock entries found."
              }
              isLoading={isSubmitting}
              showSrNo={true}
              srNoLabel="Sr No."
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default StockMaster;
import React, {useState, useEffect} from 'react';
import {Save, ArrowLeft} from 'lucide-react';
import {useNavigate} from '@tanstack/react-router';
import toast from 'react-hot-toast';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import GenericDropdown from '@/components/Forms/DropDown/GenericDropDown';
import {useGetItems} from '@/lib/api/items';
import {useGetSizes} from '@/lib/api/sizes';
import {useGetAllStock, useUpdateStock} from '@/lib/api/stockmanagement';
import {z} from 'zod';
import {useForm, FormProvider} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';

// Schema for validation
const StockSchema = z.object({
  itemId: z.string().min(1, 'Please select an item'),
  sizeId: z.string().optional(),
  purity: z.string().optional(),
  stockQty: z.number().min(0.001, 'Please enter a valid quantity'),
  stockType: z.string().min(1, 'Please select stock type'),
  note: z.string().optional(),
});

type StockFormData = z.infer<typeof StockSchema>;

const StockManagment: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Fetch data from API
  const {data: items = []} = useGetItems();
  const {data: sizes = []} = useGetSizes();
  const {data: stockData = [], refetch: refetchStock} = useGetAllStock();
  const updateStock = useUpdateStock();

  // Form state
  const [currentStock, setCurrentStock] = useState<number>(0);
  const [remainingStock, setRemainingStock] = useState<number>(0);
  const [stockId, setStockId] = useState<string>('');
  const [isGoldSelected, setIsGoldSelected] = useState<boolean>(false);

  // React Hook Form
  const methods = useForm<StockFormData>({
    resolver: zodResolver(StockSchema),
    defaultValues: {
      itemId: '',
      sizeId: '',
      purity: '',
      stockQty: 0,
      stockType: 'INWARD',
      note: '',
    },
  });

  const {
    watch,
    setValue,
    handleSubmit,
    reset,
    control,
    formState: {errors},
  } = methods;

  // Watch all form values
  const watchedItemId = watch('itemId');
  const watchedSizeId = watch('sizeId');
  const watchedPurity = watch('purity');
  const watchedStockQty = watch('stockQty');
  const watchedStockType = watch('stockType');

  // Stock type options
  const stockTypeOptions = [
    {label: 'Add Stock (INWARD)', value: 'INWARD'},
    {label: 'Less Stock (OUTWARD)', value: 'OUTWARD'},
  ];

  // Get item options
  const itemOptions = items.map((item: any) => ({
    label: item.name,
    value: item.id,
  }));

  // Purity options from stock data
  const getPurityOptions = () => {
    const puritySet = new Set<string>();
    stockData.forEach((stock: any) => {
      if (stock.purity) {
        puritySet.add(String(stock.purity));
      }
    });
    return Array.from(puritySet).map((p) => ({label: p, value: p}));
  };

  // Get size options for selected item (excluding null sizes)
  const getSizeOptions = (itemId: string) => {
    if (!itemId) return [];
    const availableSizeIds = stockData
      .filter(
        (st: any) => st.itemId === itemId && st.sizeId !== null && st.sizeId,
      )
      .map((st: any) => st.sizeId);
    return sizes
      .filter((s: any) => availableSizeIds.includes(s.id))
      .map((s: any) => ({label: s.size, value: s.id}));
  };

  // Get stock for a specific item (any size/purity combination)
  const getStockForItem = (itemId: string) => {
    return stockData.find((s: any) => s.itemId === itemId);
  };

  // Get current stock for a specific item, size, and purity
  const getCurrentStockValue = (
    itemId: string,
    sizeId: string | null,
    purity: string,
  ): number => {
    const stock = stockData.find(
      (s: any) =>
        s.itemId === itemId &&
        (sizeId ? s.sizeId === sizeId : s.sizeId === null) &&
        (purity
          ? String(s.purity) === purity
          : s.purity === null || s.purity === undefined),
    );
    return stock?.weight || 0;
  };

  // Get stock ID for a specific item, size, and purity
  const getStockIdValue = (
    itemId: string,
    sizeId: string | null,
    purity: string,
  ): string => {
    const stock = stockData.find(
      (s: any) =>
        s.itemId === itemId &&
        (sizeId ? s.sizeId === sizeId : s.sizeId === null) &&
        (purity
          ? String(s.purity) === purity
          : s.purity === null || s.purity === undefined),
    );
    return stock?.id || '';
  };

  // Get purity values for selected item and size
  const getPurityValues = (itemId: string, sizeId: string | null): string[] => {
    const stocks = stockData.filter(
      (s: any) =>
        s.itemId === itemId && s.sizeId === sizeId && s.purity !== null,
    );
    return stocks.map((s: any) => String(s.purity));
  };

  // Get all stock entries for an item (for auto-selecting when only one exists)
  const getStocksForItem = (itemId: string) => {
    return stockData.filter((s: any) => s.itemId === itemId);
  };

  // Check if selected item is Gold and get its stock
  useEffect(() => {
    if (watchedItemId) {
      const selectedItem = items.find((i: any) => i.id === watchedItemId);
      const isGold = selectedItem?.name?.toLowerCase() === 'gold';
      setIsGoldSelected(isGold);

      if (isGold) {
        // For Gold, find stock with null sizeId
        const goldStock = stockData.find(
          (s: any) => s.itemId === watchedItemId && s.sizeId === null,
        );
        if (goldStock) {
          setStockId(goldStock.id);
          setCurrentStock(goldStock.weight || 0);
          setRemainingStock(goldStock.weight || 0);
          if (goldStock.purity !== null && goldStock.purity !== undefined) {
            setValue('purity', String(goldStock.purity));
          } else {
            setValue('purity', '');
          }
        } else {
          setCurrentStock(0);
          setRemainingStock(0);
          setStockId('');
        }
        setValue('sizeId', '');
      } else {
        // For non-gold items, check if there's only one stock entry
        const itemStocks = getStocksForItem(watchedItemId);
        if (itemStocks.length === 1) {
          const stock = itemStocks[0];
          setStockId(stock.id);
          setCurrentStock(stock.weight || 0);
          setRemainingStock(stock.weight || 0);
          if (stock.sizeId) {
            setValue('sizeId', stock.sizeId);
          }
          if (stock.purity !== null && stock.purity !== undefined) {
            setValue('purity', String(stock.purity));
          }
        } else if (itemStocks.length > 1) {
          // Multiple stocks, reset and let user select
          setCurrentStock(0);
          setRemainingStock(0);
          setStockId('');
          setValue('sizeId', '');
          setValue('purity', '');
        } else {
          // No stock found
          setCurrentStock(0);
          setRemainingStock(0);
          setStockId('');
          setValue('sizeId', '');
          setValue('purity', '');
        }
      }
    } else {
      setCurrentStock(0);
      setRemainingStock(0);
      setStockId('');
      setIsGoldSelected(false);
    }
  }, [watchedItemId, stockData, items]);

  // Update current stock when size or purity changes (for non-gold with multiple stocks)
  useEffect(() => {
    if (watchedItemId && !isGoldSelected && watchedSizeId) {
      const stock = getCurrentStockValue(
        watchedItemId,
        watchedSizeId,
        watchedPurity,
      );
      if (stock > 0) {
        setCurrentStock(stock);
        setRemainingStock(stock);
        setStockId(
          getStockIdValue(watchedItemId, watchedSizeId, watchedPurity),
        );
      }
    }
  }, [watchedSizeId, watchedPurity, watchedItemId, stockData, isGoldSelected]);

  // Calculate remaining stock when quantity changes
  useEffect(() => {
    const qty = parseFloat(String(watchedStockQty)) || 0;
    if (watchedStockType === 'INWARD') {
      setRemainingStock(currentStock + qty);
    } else {
      setRemainingStock(Math.max(0, currentStock - qty));
    }
  }, [watchedStockQty, watchedStockType, currentStock]);

  // Handle item change
  const handleItemChange = (value: string) => {
    setValue('itemId', value);
    setValue('sizeId', '');
    setValue('purity', '');
    setCurrentStock(0);
    setRemainingStock(0);
    setStockId('');
    setIsGoldSelected(false);
  };

  // Handle size change
  const handleSizeChange = (value: string) => {
    setValue('sizeId', value);
    setValue('purity', '');

    // Auto-select purity if only one purity exists
    if (watchedItemId && value) {
      const purityValues = getPurityValues(watchedItemId, value);
      if (purityValues.length === 1) {
        setValue('purity', purityValues[0]);
      }
    }
  };

  // Handle save
  const onSubmit = async (data: StockFormData) => {
    const stockQty = data.stockQty || 0;
    const purity = data.purity || '';

    if (!stockId) {
      toast.error('No stock found for selected item');
      return;
    }

    const currentStockValue = currentStock;
    let newStock = currentStockValue;

    if (data.stockType === 'INWARD') {
      newStock = currentStockValue + stockQty;
    } else {
      if (stockQty > currentStockValue) {
        toast.error(
          `Insufficient stock! Current stock: ${currentStockValue} G`,
        );
        return;
      }
      newStock = currentStockValue - stockQty;
    }

    setIsLoading(true);

    try {
      const payload: any = {
        id: stockId,
        itemId: data.itemId,
        weight: newStock,
        note: data.note || '',
        stockQty: stockQty,
        type: data.stockType,
      };

      if (isGoldSelected) {
        payload.sizeId = null;
      } else {
        payload.sizeId = data.sizeId || '';
        payload.purity = purity;
      }

      console.log('Saving payload:', payload);

      await updateStock.mutateAsync({id: stockId, data: payload});
      toast.success(
        `Stock ${data.stockType === 'INWARD' ? 'added' : 'reduced'} successfully!`,
      );

      await refetchStock();
      reset();
      setCurrentStock(0);
      setRemainingStock(0);
      setStockId('');
      setIsGoldSelected(false);
      setIsLoading(false);

      navigate({to: '/Stocks/stockpage'});
    } catch (error) {
      console.error('Error saving stock:', error);
      toast.error('Failed to save stock entry');
      setIsLoading(false);
    }
  };

  // Get purity options based on selected item and size
  const getFilteredPurityOptions = () => {
    if (!watchedItemId) return [];
    const purityValues = getPurityValues(watchedItemId, watchedSizeId || null);
    return purityValues.map((p) => ({label: p, value: p}));
  };

  return (
    <div className="bg-[#f9f9f7] dark:bg-slate-950">
      <div className="px-4 py-4 md:px-8 md:py-6">
        {/* Header with Back and Title */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate({to: '/Stocks/stockpage'})}
              className="flex flex-shrink-0 items-center gap-1 text-[#785600] transition-colors hover:text-[#5d4200] dark:text-amber-400 dark:hover:text-amber-300"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-xs font-medium sm:text-sm">Back</span>
            </button>
            <div className="h-5 w-px flex-shrink-0 bg-[#d3c4af]/30 dark:bg-slate-600" />
            <h1 className="font-headline text-2xl font-black italic text-[#1a1a2e] sm:text-3xl lg:text-4xl">
              Inward / Outward Stock
            </h1>
          </div>
        </div>

        {/* Form Section */}
        <div className="mx-auto rounded-xl border border-[#d3c4af]/10 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h3 className="mb-4 text-center text-sm font-semibold uppercase tracking-wide text-[#4f4535] dark:text-slate-400">
            {watchedStockType === 'INWARD'
              ? 'Add Stock (INWARD)'
              : 'Less Stock (OUTWARD)'}
            {isGoldSelected && ' - Gold'}
          </h3>

          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Item Dropdown */}
                <GenericDropdown
                  name="itemId"
                  label="Item"
                  options={itemOptions}
                  placeholder="Select Item"
                  control={control}
                  required
                  error={errors.itemId?.message}
                  onChange={(value) => handleItemChange(value)}
                />

                {/* Size Dropdown - Disabled for Gold */}
                <GenericDropdown
                  name="sizeId"
                  label="Size"
                  options={getSizeOptions(watchedItemId)}
                  placeholder="Select Size"
                  control={control}
                  required={!isGoldSelected}
                  error={errors.sizeId?.message}
                  disabled={!watchedItemId || isGoldSelected}
                  onChange={(value) => handleSizeChange(value)}
                />

                {/* Purity Dropdown - Disabled for Gold */}
                <GenericDropdown
                  name="purity"
                  label="Purity (%)"
                  options={getFilteredPurityOptions()}
                  placeholder="Select Purity"
                  control={control}
                  required={!isGoldSelected}
                  error={errors.purity?.message}
                  disabled={!watchedItemId || !watchedSizeId || isGoldSelected}
                />

                {/* Stock Type Dropdown */}
                <GenericDropdown
                  name="stockType"
                  label="Stock Type"
                  options={stockTypeOptions}
                  placeholder="Select Stock Type"
                  control={control}
                  required
                  error={errors.stockType?.message}
                />

                {/* Stock Quantity */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#4f4535] dark:text-slate-400">
                    Quantity (G) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={watchedStockQty || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.]/g, '');
                      setValue('stockQty', parseFloat(value) || 0);
                    }}
                    placeholder="0.000"
                    className="font-mono mt-1 w-full rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-2 text-left text-sm focus:border-[#785600] focus:outline-none focus:ring-2 focus:ring-[#785600]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  {errors.stockQty && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.stockQty.message}
                    </p>
                  )}
                </div>

                {/* Current & Remaining Stock */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#4f4535] dark:text-slate-400">
                      Current Stock
                    </label>
                    <div className="bg-gray-100 mt-1 rounded-lg px-3 py-2 text-left text-sm font-semibold text-[#785600] dark:bg-slate-800 dark:text-amber-400">
                      {currentStock.toFixed(3)} G
                    </div>
                    {isGoldSelected && (
                      <p className="mt-0.5 text-[10px] text-[#785600] dark:text-amber-400/70">
                        Gold Stock
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#4f4535] dark:text-slate-400">
                      Total Stock
                    </label>
                    <div
                      className={`mt-1 rounded-lg px-3 py-2 text-left text-sm font-semibold ${
                        remainingStock < 0
                          ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                      }`}
                    >
                      {remainingStock.toFixed(3)} G
                    </div>
                  </div>
                </div>

                {/* Note */}
                <div className="md:col-span-2">
                  <GenericInputField
                    name="note"
                    label="Note"
                    type="text"
                    placeholder="Add a note (optional)"
                    onChange={(e) => setValue('note', e.target.value)}
                    value={watch('note') || ''}
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="mt-6 flex justify-end">
                <GenericButton
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 !bg-[#785600] !px-6 !py-2.5 !text-sm !text-white hover:!bg-[#5d4200]"
                >
                  <Save className="h-4 w-4" />
                  {isLoading ? 'Saving...' : 'Save Stock'}
                </GenericButton>
              </div>
            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  );
};

export default StockManagment;

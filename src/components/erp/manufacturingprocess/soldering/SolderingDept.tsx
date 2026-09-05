import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Save,
  ChevronRight,
  ChevronDown,
  Printer,
  Plus,
  X,
  Layers,
  Box,
} from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { GenericTable } from '@/components/Forms/Table/GenericTable';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import {
  useGetSoldering,
  useGetSolderingHistory,
  useSubmitSoldering,
  useCreateSoldering,
  getBackendErrorMessage,
} from '@/lib/api/soldering';
import { useGetItems, Item } from '@/lib/api/items';
import { useGetSizes } from '@/lib/api/sizes';
import { useSubmitMoveCutting } from '@/lib/api/cutting';
import { useGetBox, useGetBoxweight } from '@/lib/api/box';
import GenericWeeklyDatePicker from '@/components/Forms/DatePicker/GenericWeeklyDatePicker';
import { useGetHeader } from '@/lib/api/headerapi';
import { useTableScaleFocus } from '@/lib/hooks/useScaleFocus';
import { useAddSolderingMelting } from '@/lib/api/processmelting';

import {
  SolderingEntry,
  SolderingCardForm,
  createNewSolderingCard,
  getCurrentWeekRange,
  formatNumberDisplay,
  truncate3Dec,
  getSolderingColumns,
  printSolderingHistory,
} from './solderingUtils';
import HistorySoldering from './HistorySoldering';

const SolderingDept: React.FC = () => {
  const getpdfheaderdata = useGetHeader();
  const navigate = useNavigate();
  const [solderingEntries, setSolderingEntries] = useState<SolderingEntry[]>([]);
  const [meltingLoadingIds, setMeltingLoadingIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [hasEditedRow, setHasEditedRow] = useState(false);
  const [saveIndex, setSaveIndex] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionType, setActionType] = useState<'joint' | 'cutting' | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalCards, setModalCards] = useState<SolderingCardForm[]>([
    createNewSolderingCard(),
  ]);
  const [selectedBoxForModal, setSelectedBoxForModal] = useState<{
    id: string;
    sizeId: string;
    size: string;
    purity: number;
    totalWeight: number;
  } | null>(null);
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  // Weighing Scale table focus hook
  const { getScaleProps } = useTableScaleFocus<'chainReceived' | 'scrap'>(
    (index, field, weight) => {
      handleInlineChange(index, field, weight.toString());
    },
  );

  const isInitialMount = useRef(true);

  // Fetch data from API
  const {
    data: solderingData = [],
    isLoading: solderingLoading,
    refetch,
  } = useGetSoldering();

  const {
    data: solderingHistory = [],
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = useGetSolderingHistory();

  const { data: items = [], isLoading: itemsLoading } = useGetItems();
  const itemsList: Item[] = Array.isArray((items as any)?.data)
    ? (items as any).data
    : Array.isArray(items)
      ? items
      : [];
  const { data: sizes = [], isLoading: sizesLoading } = useGetSizes();
  const { data: boxData = [] } = useGetBox();
  const { data: tarData = [], isLoading: tarLoading, refetch: tarRefetch } = useGetBoxweight();

  const submitSoldering = useSubmitSoldering();
  const createSoldering = useCreateSoldering();
  const submitCutting = useSubmitMoveCutting();
  const submitMelting = useAddSolderingMelting();

  const handleMelting = async (entry: SolderingEntry) => {
    setMeltingLoadingIds((prev) => new Set(prev).add(entry.id));

    try {
      await submitMelting.mutateAsync({
        id: entry.id,
        data: {
          purity: parseFloat(entry.purity) || 0,
          chainWeight: entry.chainWeight || 0,
          solderingId: entry.id,
        },
      });
      await refetch();
    } catch (error: any) {
      console.error('Error in melting:', error);
      toast.error(getBackendErrorMessage(error, 'Failed to process melting'));
    } finally {
      setMeltingLoadingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(entry.id);
        return newSet;
      });
    }
  };

  // Weighing Scale modal focus hook
  const { getScaleProps: getModalScaleProps } = useTableScaleFocus<'chainWeight'>(
    (cardIndex, field, weight) => {
      handleCardChange(cardIndex, field, weight.toString());
    },
  );

  const boxStockList = Array.isArray(tarData)
    ? tarData
    : [];

  // Top Box Cards for Soldering Department (from /admin/box/stock)
  const boxCards = React.useMemo(() => {
    return boxStockList
      .map((item: any) => {
        const sizeLabel =
          item.size?.size ||
          (typeof item.size === 'string' ? item.size : '') ||
          'Box';
        const p = Number(item.purity || 0);
        const wt = Number(item.tarWeight || item.chainWeight || item.weight || 0);
        return {
          id: item.id,
          sizeId: item.sizeId || item.size?.id,
          size: sizeLabel,
          purity: p,
          totalWeight: truncate3Dec(wt),
        };
      })
      .filter((c: any) => c.totalWeight > 0);
  }, [boxStockList]);

  // Unique available sizes present in the Box Cards + boxData (no fallback to all sizes)
  const availableSizesInCards = React.useMemo(() => {
    const cardSizeIds = new Set<string>();
    const cardSizeNames = new Set<string>();

    boxCards.forEach((c: any) => {
      if (c.sizeId) cardSizeIds.add(String(c.sizeId));
      if (c.size) cardSizeNames.add(String(c.size).trim().toLowerCase());
    });

    // Also include sizes from boxData — only where sizeId and purity are not null
    const bList = Array.isArray((boxData as any)?.data)
      ? (boxData as any).data
      : Array.isArray(boxData)
        ? boxData
        : [];
    bList.forEach((s: any) => {
      if (s.sizeId && s.purity) cardSizeIds.add(String(s.sizeId));
    });

    // Return only sizes that have actual stock — empty if nothing available
    return sizes.filter(
      (s: any) =>
        cardSizeIds.has(String(s.id)) ||
        cardSizeNames.has(String(s.size).trim().toLowerCase()),
    );
  }, [boxCards, sizes, boxData]);

  // Unique available purities from Box Stock / boxData (no static defaults)
  const availablePurities = React.useMemo(() => {
    const pSet = new Set<number>();

    // From boxCards (box/stock)
    boxCards.forEach((c) => {
      if (c.purity && c.purity > 0) pSet.add(c.purity);
    });

    // From boxData — only entries with valid sizeId AND purity
    const bList = Array.isArray((boxData as any)?.data)
      ? (boxData as any).data
      : Array.isArray(boxData)
        ? boxData
        : [];
    bList.forEach((s: any) => {
      const p = Number(s.purity || 0);
      if (p > 0 && s.sizeId) pSet.add(p);
    });

    return Array.from(pSet).sort((a, b) => b - a);
  }, [boxCards, boxData]);

  // Helper to get purities that actually have available stock for the selected size
  const getPuritiesForSize = (sizeId?: string): number[] => {
    if (!sizeId) {
      return availablePurities;
    }
    const pSet = new Set<number>();
    boxCards.forEach((c) => {
      if (
        String(c.sizeId) === String(sizeId) &&
        c.purity &&
        c.purity > 0 &&
        c.totalWeight > 0
      ) {
        pSet.add(c.purity);
      }
    });

    if (pSet.size === 0) {
      boxStockList.forEach((b: any) => {
        const bSizeId = b.sizeId || b.size?.id;
        const wt = Number(b.tarWeight || b.chainWeight || b.weight || 0);
        const p = Number(b.purity || 0);
        if (String(bSizeId) === String(sizeId) && wt > 0 && p > 0) {
          pSet.add(p);
        }
      });
    }

    // Also check boxData
    if (pSet.size === 0) {
      const bList = Array.isArray((boxData as any)?.data)
        ? (boxData as any).data
        : Array.isArray(boxData)
          ? boxData
          : [];
      bList.forEach((s: any) => {
        const sSizeId = String(s.sizeId || '');
        const p = Number(s.purity || 0);
        if (sSizeId === String(sizeId) && p > 0) {
          pSet.add(p);
        }
      });
    }

    return Array.from(pSet).sort((a, b) => b - a);
  };

  // Helper to get available box quantity for a size and purity
  const getAvailableBoxQty = (sizeId?: string, purity?: string): number => {
    if (!sizeId) {
      return 0;
    }

    if (boxStockList.length > 0) {
      let filtered = boxStockList.filter(
        (b: any) =>
          (String(b.sizeId) === String(sizeId) || String(b.size?.id) === String(sizeId)) &&
          Number(b.tarWeight || b.chainWeight || b.weight || 0) > 0,
      );
      if (purity && parseFloat(purity) > 0) {
        const pNum = parseFloat(purity);
        filtered = filtered.filter((b: any) => parseFloat(b.purity) === pNum);
      }
      const total = filtered.reduce((sum: number, b: any) => {
        const wt = Number(b.tarWeight || b.chainWeight || b.weight || 0);
        return sum + (isNaN(wt) ? 0 : wt);
      }, 0);
      return truncate3Dec(total);
    }

    if (Array.isArray(boxData) && boxData.length > 0) {
      let filtered = boxData.filter(
        (b: any) =>
          (String(b.sizeId) === String(sizeId) || String(b.size?.id) === String(sizeId)) &&
          Number(b.chainWeight || 0) > 0,
      );
      if (purity && parseFloat(purity) > 0) {
        const pNum = parseFloat(purity);
        filtered = filtered.filter((b: any) => parseFloat(b.purity) === pNum);
      }
      const total = filtered.reduce((sum: number, b: any) => {
        const wt = Number(b.chainWeight || 0);
        return sum + (isNaN(wt) ? 0 : wt);
      }, 0);
      return truncate3Dec(total);
    }



    return 0;
  };

  // When a size is selected in the modal, automatically prefill purity and chain weight from box stock
  const handleSizeSelect = (cardIndex: number, selectedSizeId: string) => {
    let sizePurities = getPuritiesForSize(selectedSizeId);

    // Fallback: scan boxStockList directly if boxCards lookup returned nothing
    if (sizePurities.length === 0 && selectedSizeId) {
      const pSet = new Set<number>();
      boxStockList.forEach((b: any) => {
        const bSizeId = String(b.sizeId || b.size?.id || '');
        const p = Number(b.purity || 0);
        if (bSizeId === String(selectedSizeId) && p > 0) {
          pSet.add(p);
        }
      });
      sizePurities = Array.from(pSet).sort((a, b) => b - a);
    }

    // Fallback: scan boxData which has sizeId + purity
    if (sizePurities.length === 0 && selectedSizeId) {
      const bList = Array.isArray((boxData as any)?.data)
        ? (boxData as any).data
        : Array.isArray(boxData)
          ? boxData
          : [];
      const pSet = new Set<number>();
      bList.forEach((s: any) => {
        const sSizeId = String(s.sizeId || '');
        const p = Number(s.purity || 0);
        if (sSizeId === String(selectedSizeId) && p > 0) {
          pSet.add(p);
        }
      });
      sizePurities = Array.from(pSet).sort((a, b) => b - a);
    }

    const chosenPurity = sizePurities.length > 0 ? String(sizePurities[0]) : '';
    const availableQty =
      selectedSizeId && chosenPurity
        ? getAvailableBoxQty(selectedSizeId, chosenPurity)
        : 0;

    setModalCards((prev) =>
      prev.map((c, idx) => {
        if (idx !== cardIndex) return c;
        return {
          ...c,
          sizeId: selectedSizeId,
          purity: chosenPurity,
          chainWeight: availableQty > 0 ? availableQty.toString() : '',
        };
      }),
    );
  };

  // When a purity is selected in the modal, automatically prefill chain weight from box stock
  const handlePuritySelect = (cardIndex: number, selectedPurity: string) => {
    setModalCards((prev) =>
      prev.map((c, idx) => {
        if (idx !== cardIndex) return c;
        const availableQty =
          c.sizeId && selectedPurity
            ? getAvailableBoxQty(c.sizeId, selectedPurity)
            : 0;
        return {
          ...c,
          purity: selectedPurity,
          chainWeight: availableQty > 0 ? availableQty.toString() : '',
        };
      }),
    );
  };

  // Load data from API
  useEffect(() => {
    if (solderingLoading) {
      return;
    }

    if (isInitialMount.current) {
      isInitialMount.current = false;
    }

    if (solderingData.length > 0) {
      const entries: SolderingEntry[] = solderingData.map(
        (soldering: any, index: number) => {
          const itemName = soldering.item?.name || soldering.itemId || 'N/A';
          const sizeName = soldering.size?.size || soldering.sizeId || 'N/A';
          const chainWeight = soldering.chainWeight || 0;
          const purity = soldering.purity;
          const fine =
            soldering.fine !== undefined && soldering.fine !== null
              ? soldering.fine
              : truncate3Dec((chainWeight * (parseFloat(purity) || 0)) / 100);
          const chainReceived = soldering.chainReceived || 0;
          const powder =
            chainReceived > 0
              ? Math.max(0, truncate3Dec(chainReceived - chainWeight))
              : soldering.powder || 0;
          const increase =
            powder > 0 && chainReceived > 0
              ? truncate3Dec((powder / chainReceived) * 100)
              : soldering.increase || 0;

          const isSaved =
            soldering.isCompleted === true &&
            soldering.chainReceived !== null &&
            soldering.chainReceived !== undefined;

          return {
            id: soldering.id,
            srNo: index + 1,
            dateTime: new Date(soldering.createdAt).toLocaleString('en-IN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            }),
            item: itemName,
            size: sizeName,
            purity: soldering.purity || '',
            fine: fine,
            chainWeight: chainWeight,
            chainReceived: chainReceived,
            powder: powder,
            increase: increase,
            scrap: soldering.scrap || 0,
            isEditing: !isSaved,
            isSaved: isSaved,
            chainReceivedRaw: soldering.chainReceived
              ? soldering.chainReceived.toString()
              : '',
            powderRaw: soldering.powder ? soldering.powder.toString() : '',
            scrapRaw: soldering.scrap ? soldering.scrap.toString() : '',
            purityRaw:
              soldering.purity !== null && soldering.purity !== undefined
                ? soldering.purity.toString()
                : '',
            fineRaw: fine > 0 ? fine.toString() : '',
            itemId: soldering.itemId,
            sizeId: soldering.sizeId,
            isCompleted: soldering.isCompleted || false,
            isDirty: false,
            status: soldering.status,
            process: soldering.process,
            isMelting: soldering.isMelting,
            meltingStatus: soldering.meltingStatus,
          };
        },
      );

      setSolderingEntries(entries);
    } else {
      setSolderingEntries([]);
    }
  }, [solderingData, solderingLoading]);

  // Filter history by date
  const getFilteredHistory = () => {
    let filtered = solderingHistory;

    if (fromDate) {
      const from = new Date(fromDate);
      from.setHours(0, 0, 0, 0);
      filtered = filtered.filter((item: any) => {
        const itemDate = new Date(item.createdAt);
        return itemDate >= from;
      });
    }

    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter((item: any) => {
        const itemDate = new Date(item.createdAt);
        return itemDate <= to;
      });
    }

    return filtered;
  };

  // Print History Function
  const handlePrintHistory = () => {
    const success = printSolderingHistory(getFilteredHistory(), fromDate, toDate, getpdfheaderdata);
    if (!success) {
      toast.error('No history records available to print for the selected date range');
    }
  };

  // Handle inline field change
  const handleInlineChange = useCallback(
    (index: number, field: 'chainReceived' | 'scrap' | 'purity', value: string) => {
      setHasEditedRow(true);

      setSolderingEntries((prev) =>
        prev.map((entry, i) => {
          if (i === index) {
            const updated = { ...entry };

            if (field === 'purity') {
              updated.purityRaw = value;
              updated.purity = value;
            } else if (field === 'chainReceived') {
              updated.chainReceivedRaw = value;

              if (value === '' || value === '.' || value === '-') {
                updated.chainReceived = 0;
              } else {
                const numValue = parseFloat(value);
                updated.chainReceived = isNaN(numValue) ? 0 : numValue;
              }

              const autoPowder = Math.max(
                0,
                truncate3Dec(updated.chainReceived - entry.chainWeight),
              );
              updated.powder = autoPowder;
              updated.powderRaw = autoPowder > 0 ? autoPowder.toString() : '0';
            } else if (field === 'scrap') {
              updated.scrapRaw = value;

              if (value === '' || value === '.' || value === '-') {
                updated.scrap = 0;
              } else {
                const numValue = parseFloat(value);
                updated.scrap = isNaN(numValue) ? 0 : numValue;
              }
            }

            if (updated.powder > 0 && updated.chainReceived > 0) {
              updated.increase = truncate3Dec((updated.powder / updated.chainReceived) * 100);
            } else {
              updated.increase = 0;
            }

            updated.isDirty = true;
            return updated;
          }
          return entry;
        }),
      );
    },
    [],
  );

  // Open confirmation popup before saving
  const handleSaveClick = useCallback(
    (index: number, action: 'joint' | 'cutting') => {
      const entry = solderingEntries[index];

      // if (!entry.chainReceived || entry.chainReceived <= 0) {
      //   toast.error('Please enter a valid chain received weight');
      //   return;
      // }

      setSaveIndex(index);
      setActionType(action);
      setShowConfirmModal(true);
    },
    [solderingEntries],
  );

  // Confirm and save - Joint
  const confirmSaveJoint = useCallback(async () => {
    if (saveIndex === null) {
      return;
    }

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
          purity: entry.purity,
          isCompleted: true,
        },
      });

      setSolderingEntries((prev) =>
        prev.map((s, i) =>
          i === index
            ? { ...s, isEditing: false, isSaved: true, isCompleted: true }
            : s,
        ),
      );

      setHasEditedRow(false);
      setIsLoading(false);
      setShowConfirmModal(false);
      setSaveIndex(null);
      setActionType(null);

      await refetch();
    } catch (error: any) {
      console.error('Error saving soldering:', error);
      toast.error(getBackendErrorMessage(error, 'Failed to save soldering entry'));

      setIsLoading(false);
      setShowConfirmModal(false);
      setSaveIndex(null);
      setActionType(null);
    }
  }, [saveIndex, solderingEntries, submitSoldering, refetch]);

  // Confirm and save - Cutting
  const confirmSaveCutting = useCallback(async () => {
    if (saveIndex === null) {
      return;
    }

    const index = saveIndex;
    const entry = solderingEntries[index];

    setIsLoading(true);

    try {
      // Submit directly to Cutting API (PUT /admin/soldering/cutting/${id})
      await submitCutting.mutateAsync({
        id: entry.id,
        data: {
          chainReceived: entry.chainReceived,
          powder: entry.powder,
          increase: entry.increase,
          scrap: entry.scrap,
          purity: entry.purity,
          isCompleted: true,
        },
      });

      setSolderingEntries((prev) =>
        prev.map((s, i) =>
          i === index
            ? { ...s, isEditing: false, isSaved: true, isCompleted: true }
            : s,
        ),
      );

      setHasEditedRow(false);
      setIsLoading(false);
      setShowConfirmModal(false);
      setSaveIndex(null);
      setActionType(null);

      await refetch();
    } catch (error: any) {
      console.error('Error saving soldering:', error);
      toast.error(getBackendErrorMessage(error, 'Failed to save soldering entry'));

      setIsLoading(false);
      setShowConfirmModal(false);
      setSaveIndex(null);
      setActionType(null);
    }
  }, [saveIndex, solderingEntries, submitCutting, refetch]);

  const handleCardChange = (
    cardIndex: number,
    field: 'sizeId' | 'purity' | 'chainWeight' | 'itemId',
    value: string,
  ) => {
    setModalCards((prev) =>
      prev.map((card, idx) => {
        if (idx !== cardIndex) return card;
        const sanitized =
          field === 'sizeId' || field === 'itemId'
            ? value
            : value.replace(/[^0-9.]/g, '');
        return { ...card, [field]: sanitized };
      }),
    );
  };



  const handleRemoveCard = (cardIndex: number) => {
    setModalCards((prev) => {
      const next = prev.filter((_, idx) => idx !== cardIndex);
      if (next.length === 0) {
        setIsModalOpen(false);
        return [createNewSolderingCard()];
      }
      return next;
    });
  };

  const handleOpenModal = (boxCard?: {
    sizeId?: string;
    purity?: number | string;
    totalWeight?: number;
  }) => {
    const targetBox = boxCard || selectedBoxForModal;
    const sizeId = targetBox?.sizeId ? String(targetBox.sizeId) : '';
    const purity =
      targetBox?.purity !== undefined && targetBox?.purity !== null
        ? String(targetBox.purity)
        : '';
    const availableQty =
      sizeId && purity ? getAvailableBoxQty(sizeId, purity) : 0;
    const wt =
      targetBox?.totalWeight !== undefined
        ? targetBox.totalWeight.toString()
        : availableQty > 0
          ? availableQty.toString()
          : '';

    const newCard = createNewSolderingCard({
      sizeId,
      purity,
      chainWeight: wt,
    });

    setModalCards([newCard]);
    setIsModalOpen(true);
    setSelectedBoxForModal(null);
  };

  const handleSaveCard = async (cardIndex: number) => {
    const card = modalCards[cardIndex];
    if (!card) return;

    if (!card.itemId) {
      toast.error(`Please select an item`);
      return;
    }

    if (!card.sizeId) {
      toast.error(`Please select a size`);
      return;
    }

    const chainWeightVal = parseFloat(card.chainWeight) || 0;
    const purityVal = parseFloat(card.purity) || 0;
    const fineVal = truncate3Dec((chainWeightVal * purityVal) / 100);

    if (chainWeightVal <= 0) {
      toast.error(`Please enter a valid Chain Weight`);
      return;
    }

    setModalCards((prev) =>
      prev.map((c, idx) => (idx === cardIndex ? { ...c, isSaving: true } : c)),
    );

    try {
      const itemsList = Array.isArray(items?.data)
        ? items.data
        : Array.isArray(items)
          ? items
          : [];
      const selectedItem = itemsList.find(
        (i: any) => String(i.id || i._id) === String(card.itemId),
      );
      const selectedSize = sizes.find(
        (s: any) => String(s.id || s._id) === String(card.sizeId),
      );

      const payload = {
        itemId: card.itemId,
        item: selectedItem?.name || '',
        sizeId: card.sizeId,
        size: selectedSize?.size || '',
        purity: purityVal ? String(purityVal) : '',
        fine: fineVal,
        chainWeight: chainWeightVal,
      };

      await createSoldering.mutateAsync(payload);

      setModalCards((prev) => {
        const next = prev.filter((_, idx) => idx !== cardIndex);
        if (next.length === 0) {
          setIsModalOpen(false);
          return [createNewSolderingCard()];
        }
        return next;
      });

      await tarRefetch();
      await refetch();
    } catch (error: any) {
      console.error('Error saving soldering card:', error);
      toast.error(getBackendErrorMessage(error, 'Failed to save soldering entry'));
      setModalCards((prev) =>
        prev.map((c, idx) => (idx === cardIndex ? { ...c, isSaving: false } : c)),
      );
    }
  };

  const hasEditableValues = (entry: SolderingEntry): boolean => {
    return Boolean(entry.isDirty);
  };

  const isSubmitting = submitSoldering.isPending || submitCutting.isPending;

  const columns = getSolderingColumns(
    getScaleProps,
    handleInlineChange,
    handleSaveClick,
    handleMelting,
    isLoading,
    isSubmitting,
    meltingLoadingIds,
    hasEditableValues
  );

  const toggleHistory = () => {
    if (showHistory) {
      setShowHistory(false);
      setFromDate(null);
      setToDate(null);
      refetch();
    } else {
      setShowHistory(true);
      const { monday, sunday } = getCurrentWeekRange();
      setFromDate(monday);
      setToDate(sunday);
      refetchHistory();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top Box Cards Bar with Smooth Scrollbar */}
      {boxCards.length > 0 && !showHistory && (
        <div className="w-full">
          <div className="mb-2 flex items-center gap-2 px-1">
            <Box className="h-4 w-4 text-[#785600] dark:text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-300">
              Available Box Stock
            </span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-[#785600]/40 dark:scrollbar-track-slate-800 dark:scrollbar-thumb-slate-600">
            {boxCards.map((card, idx) => (
              <div
                key={card.id || idx}
                onClick={() => {
                  handleOpenModal(card);
                }}
                className="flex min-w-[110px] cursor-pointer flex-col rounded-lg border border-[#d3c4af]/30 bg-white px-3 py-2 shadow-sm transition-all hover:scale-105 hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
              >
                <span className="font-mono text-sm font-bold text-black dark:text-white">
                  {card.size} ({card.purity}%)
                </span>
                <span className="font-mono text-base font-bold text-black dark:text-white">
                  {formatNumberDisplay(card.totalWeight)} G
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-[#1a1c1b] dark:text-white">
            {showHistory ? 'Soldering History' : 'Soldering Department'}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date Filters */}
          {showHistory && (
            <div className="flex flex-wrap items-center gap-2">
              <GenericWeeklyDatePicker
                id="from-date-box"
                placeholder="DD/MM/YYYY"
                mode="from"
                initialDates={fromDate ? [fromDate] : []}
                onDateChange={(dates) => {
                  if (dates && dates.length > 0) {
                    const selected = new Date(dates[0]);
                    selected.setHours(0, 0, 0, 0);
                    setFromDate(selected);
                  } else {
                    setFromDate(null);
                  }
                }}
                className="w-32 sm:w-36 md:w-40"
              />

              <GenericWeeklyDatePicker
                id="to-date-box"
                placeholder="DD/MM/YYYY"
                mode="to"
                initialDates={toDate ? [toDate] : []}
                onDateChange={(dates) => {
                  if (dates && dates.length > 0) {
                    const selected = new Date(dates[0]);
                    selected.setHours(23, 59, 59, 999);
                    setToDate(selected);
                  } else {
                    setToDate(null);
                  }
                }}
                className="w-32 sm:w-36 md:w-40"
              />
            </div>
          )}

          {/* Print History Button */}
          {showHistory && (
            <GenericButton type="button" onClick={handlePrintHistory} variant="primary">
              <Printer className="h-4 w-4" />
              <span>Print</span>
            </GenericButton>
          )}

          {/* {!showHistory && (
            <GenericButton type="button" onClick={handleOpenModal} variant="primary">
              <Plus className="h-4 w-4" />
              <span>Add Soldering</span>
            </GenericButton>
          )} */}

          {/* History Toggle Button */}
          <GenericButton type="button" onClick={toggleHistory} variant="primary">
            {showHistory ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <span>{showHistory ? 'Show Soldering' : 'History'}</span>
          </GenericButton>
        </div>
      </div>

      {/* Table Section */}
      {!showHistory ? (
        <div>
          <GenericTable<SolderingEntry>
            data={solderingEntries}
            columns={columns}
            onSave={(item, index) => handleSaveClick(index, 'joint')}
            emptyMessage="No soldering entries found."
            isLoading={solderingLoading || isSubmitting}
            showSrNo={true}
            srNoLabel="Sr No."
          />
        </div>
      ) : (
        <HistorySoldering
          filteredData={getFilteredHistory()}
          historyLoading={historyLoading}
          fromDate={fromDate}
          toDate={toDate}
        />
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl dark:bg-slate-900">
            <div className="p-6">
              <h3 className="mb-2 text-center text-lg font-bold text-[#1a1c1b] dark:text-white">
                Confirm Save
              </h3>

              <p className="text-center text-sm text-[#4f4535] dark:text-slate-400">
                Are you sure you want to save this soldering entry and go to the{' '}
                <strong className="text-[#785600] dark:text-amber-400">
                  {actionType === 'joint' ? 'Joint' : 'Cutting'}
                </strong>{' '}
                department?
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
                  className="rounded-lg bg-gradient-to-br from-[#785600] to-[#986d00] px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Confirm Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Soldering Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm">
          <div
            className={`w-full ${modalCards.length > 1 ? 'max-w-4xl' : 'max-w-lg'
              } flex max-h-[90vh] flex-col rounded-2xl bg-white shadow-2xl transition-all dark:bg-slate-900 border border-[#d3c4af]/30 dark:border-slate-700`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#d3c4af]/20 p-4 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-[#785600]/10 p-2 text-[#785600] dark:bg-amber-900/30 dark:text-amber-400">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1a1c1b] dark:text-white sm:text-lg">
                    Add Soldering Process
                  </h3>
                  <p className="text-xs text-[#4f4535] dark:text-slate-400">
                    {modalCards.length} {modalCards.length === 1 ? 'soldering item' : 'soldering items'} to configure
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg p-1.5 text-[#4f4535] transition-colors hover:bg-[#f4f4f2] dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body - Cards Container */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className={`grid gap-4 ${modalCards.length > 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                {modalCards.map((card, idx) => {
                  const isCardSaving = card.isSaving || false;
                  const availableQty = getAvailableBoxQty(card.sizeId, card.purity);

                  return (
                    <div
                      key={card.id || idx}
                      className="relative flex flex-col justify-between rounded-xl border border-[#d3c4af]/30 bg-[#fbfaf8] p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-800/80"
                    >
                      {modalCards.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCard(idx)}
                          disabled={isCardSaving}
                          className="absolute right-2 top-2 rounded-md p-1 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40"
                          title="Remove this card"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}

                      {/* Card Inputs */}
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                              Size <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={card.sizeId}
                              onChange={(e) => handleSizeSelect(idx, e.target.value)}
                              className="w-full rounded-lg border border-[#d3c4af]/30 bg-white px-2 py-1.5 text-sm text-[#1a1c1b] outline-none transition-colors focus:ring-2 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            >
                              <option value="">Select</option>
                              {availableSizesInCards.map((size) => (
                                <option key={size.id} value={size.id}>
                                  {size.size || JSON.stringify(size)}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                              Purity (%) <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={card.purity}
                              onChange={(e) =>
                                handlePuritySelect(idx, e.target.value)
                              }
                              className="w-full rounded-lg border border-[#d3c4af]/30 bg-white px-2 py-1.5 text-sm text-[#1a1c1b] outline-none transition-colors focus:ring-2 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            >
                              <option value="">Select</option>
                              {getPuritiesForSize(card.sizeId).map((p) => (
                                <option key={p} value={p}>
                                  {p}%
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                              Available Qty (G)
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                readOnly
                                value={formatNumberDisplay(availableQty)}
                                className="font-mono w-full rounded-lg border border-[#d3c4af]/20 bg-amber-50/50 px-2 py-1.5 pr-6 text-sm font-bold text-black outline-none cursor-not-allowed dark:bg-amber-950/20 dark:text-amber-400"
                              />
                              <span className="text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 text-[10px] dark:text-slate-500">
                                G
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                              Item <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={card.itemId}
                              onChange={(e) => handleCardChange(idx, 'itemId', e.target.value)}
                              className="w-full rounded-lg border border-[#d3c4af]/30 bg-white px-2 py-1.5 text-sm text-[#1a1c1b] outline-none transition-colors focus:ring-2 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            >
                              <option value="">Select Item</option>
                              {itemsList
                                .filter((item) => item?.name?.trim().toLowerCase() !== 'gold')
                                .map((item) => (
                                  <option key={item.id} value={item.id}>
                                    {item.name || JSON.stringify(item)}
                                  </option>
                                ))}
                            </select>
                          </div>

                          <div>
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                              Chain Weight (G) <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={card.chainWeight}
                                {...getModalScaleProps(idx, 'chainWeight')}
                                onChange={(e) =>
                                  handleCardChange(idx, 'chainWeight', e.target.value)
                                }
                                placeholder="0.000"
                                className="font-mono w-full rounded-lg border border-[#d3c4af]/30 bg-white px-2 py-1.5 pr-6 text-sm text-[#1a1c1b] outline-none transition-colors focus:ring-2 focus:ring-[#785600]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                              />
                              <span className="text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 text-[10px] dark:text-slate-500">
                                G
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 border-t border-[#d3c4af]/20 pt-3 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => handleSaveCard(idx)}
                          disabled={isCardSaving}
                          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-br from-[#785600] to-[#986d00] py-2 text-xs font-semibold text-white shadow-sm transition-all hover:scale-[1.01] hover:shadow active:scale-[0.99] disabled:opacity-50"
                        >
                          <Save className="h-3.5 w-3.5" />
                          <span>{isCardSaving ? 'Saving...' : 'Save'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SolderingDept;

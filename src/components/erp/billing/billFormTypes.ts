export interface ReceiptItem {
  id: string;
  srNo: number;
  item: string;
  size: string;
  purity: number | string;
  availableQty: number | string;
  grossWt: number | string;
  wastage: number | string;
  srp: number | string;
  fineWt: number;
  laborRate: number | string;
  isLoadingQty?: boolean;
  itemId?: string;
  sizeId?: string;
}

export interface ReceiptFormData {
  clientId: string;
  clientName: string;
  date: string;
  items: ReceiptItem[];
  customerWeight: number | string;
  remainingWeight?: number | string;
  totalFine: number | string;
  goldInfo: {
    karat: string;
    rate: number;
    weight: number;
    totalAmount: number;
  };
}

export const calculateFineWeight = (
  purity: number,
  grossWt: number,
  srp: number,
) => {
  const effectivePurity = (purity + srp) / 100;
  return Math.round(grossWt * effectivePurity * 1000) / 1000;
};

export const updateTotalFine = (items: ReceiptItem[]) => {
  const total = items.reduce(
    (sum, item) => sum + (item.fineWt || 0) + (Number(item.laborRate) || 0),
    0,
  );
  return Math.round(total * 1000) / 1000;
};

export const getClientDueBalance = (client: any) => {
  if (!client) return 0;
  const due =
    client?.due !== null && client?.due !== undefined
      ? Number(client.due)
      : NaN;
  if (!isNaN(due)) {
    return Math.round(due * 1000) / 1000;
  }
  const openingBalance = Number(client?.openingBalance) || 0;
  return Math.round(openingBalance * 1000) / 1000;
};

export const formatNumberThreeDecimals = (value: number) => {
  if (value === 0 || !value) return '0';
  const formatted = Number(value.toFixed(3)).toString();
  return formatted;
};

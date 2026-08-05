/**
 * Gold Chain Manufacturing ERP - Local Store & Pre-populated Mock Data
 * Complete state management with localStorage persistence and full CRUD operations.
 */

export interface ItemMasterItem {
  id: string;
  name: string;
  code: string;
  status: 'Active' | 'Inactive';
}

export interface SizeMasterItem {
  id: string;
  size: string;
  description: string;
  status: 'Active' | 'Inactive';
}

export interface PurityMasterItem {
  id: string;
  name: string;
  purityPercent: number; // e.g. 91.6
  status: 'Active' | 'Inactive';
}

export interface BoxMasterItem {
  id: string;
  boxNumber: string;
  description: string;
  status: 'Active' | 'Inactive';
}

export interface WorkerMasterItem {
  id: string;
  name: string;
  department: 'Box' | 'Soldering' | 'Joint' | 'Cutting';
  phone: string;
  status: 'Active' | 'Inactive';
}

export interface CustomerMasterItem {
  id: string;
  name: string;
  gst: string;
  mobile: string;
  address: string;
  openingBalance: number;
  status: 'Active' | 'Inactive';
}

export interface RateMasterItem {
  id: string;
  date: string;
  rate22k: number; // ₹ per gram
  rate24k: number; // ₹ per gram
  makingCharge: number; // ₹ per gram
  gstPercent: number; // e.g. 3%
}

export interface WastageMasterItem {
  id: string;
  department: 'Box' | 'Soldering' | 'Joint' | 'Cutting';
  allowedPercent: number;
}

export interface UserMasterItem {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role:
    | 'Admin'
    | 'Manager'
    | 'Stock Operator'
    | 'Box Operator'
    | 'Soldering Operator'
    | 'Joint Operator'
    | 'Cutting Operator'
    | 'Billing Operator';
  status: 'Active' | 'Inactive';
}

export type PipelineStage =
  | 'RAW_STOCK'
  | 'BOX'
  | 'SOLDERING'
  | 'JOINT'
  | 'CUTTING'
  | 'FINISHED_STOCK'
  | 'BILLED';

export interface LotBatchTransaction {
  id: string;
  lotNo: string;
  date: string;
  item: string;
  size: string;
  purity: string;
  stage: PipelineStage;
  stockWeight: number; // input weight g (3 decimals)
  currentWeight: number; // remaining/output weight g (3 decimals)
  lossWeight: number; // accumulated loss g (3 decimals)
  
  // Department specific fields
  boxNumber?: string;
  solderUsed?: number; // g
  piecesCount?: number;
  location?: string; // Vault/Tray info
  assignedWorker?: string;
  remarks?: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Rejected';
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  invoiceNo: string;
  date: string;
  customerName: string;
  customerGst: string;
  item: string;
  size: string;
  purity: string;
  grossWeight: number; // g
  ratePerGram: number; // ₹
  makingChargePerGram: number; // ₹
  goldAmount: number; // ₹
  makingChargeAmount: number; // ₹
  taxableAmount: number; // ₹
  gstPercent: number; // %
  gstAmount: number; // ₹
  totalAmount: number; // ₹
  paymentStatus: 'Paid' | 'Pending' | 'Partial';
  lotNo?: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

// Key for LocalStorage
const STORAGE_KEY = 'GOLD_CHAIN_ERP_DATA_V1';

// Initial Default Static Records
const defaultItems: ItemMasterItem[] = [
  { id: '1', name: 'Chain', code: 'CHN-01', status: 'Active' },
  { id: '2', name: 'Bracelet', code: 'BRC-02', status: 'Active' },
  { id: '3', name: 'Necklace', code: 'NCK-03', status: 'Active' },
  { id: '4', name: 'Ring', code: 'RNG-04', status: 'Active' },
  { id: '5', name: 'Bangles', code: 'BNG-05', status: 'Active' },
];

const defaultSizes: SizeMasterItem[] = [
  { id: '1', size: '16', description: '16 Inch Standard', status: 'Active' },
  { id: '2', size: '18', description: '18 Inch Standard', status: 'Active' },
  { id: '3', size: '20', description: '20 Inch Medium', status: 'Active' },
  { id: '4', size: '22', description: '22 Inch Large', status: 'Active' },
  { id: '5', size: '24', description: '24 Inch XL', status: 'Active' },
];

const defaultPurities: PurityMasterItem[] = [
  { id: '1', name: '24K', purityPercent: 99.9, status: 'Active' },
  { id: '2', name: '22K', purityPercent: 91.6, status: 'Active' },
  { id: '3', name: '20K', purityPercent: 83.3, status: 'Active' },
  { id: '4', name: '18K', purityPercent: 75.0, status: 'Active' },
  { id: '5', name: '916', purityPercent: 91.6, status: 'Active' },
  { id: '6', name: '750', purityPercent: 75.0, status: 'Active' },
];

const defaultBoxes: BoxMasterItem[] = [
  { id: '1', boxNumber: 'BOX-001', description: 'Primary Melting Box 1', status: 'Active' },
  { id: '2', boxNumber: 'BOX-002', description: 'Wire Drawing Box 2', status: 'Active' },
  { id: '3', boxNumber: 'BOX-003', description: 'Chain Assembly Box 3', status: 'Active' },
  { id: '4', boxNumber: 'BOX-004', description: 'Polish & Cleaning Box 4', status: 'Active' },
];

const defaultWorkers: WorkerMasterItem[] = [
  { id: '1', name: 'Ganesh Kumar', department: 'Box', phone: '+91 98765 43210', status: 'Active' },
  { id: '2', name: 'Ramesh Patel', department: 'Soldering', phone: '+91 98765 43211', status: 'Active' },
  { id: '3', name: 'Suresh Sharma', department: 'Joint', phone: '+91 98765 43212', status: 'Active' },
  { id: '4', name: 'Mahesh Verma', department: 'Cutting', phone: '+91 98765 43213', status: 'Active' },
];

const defaultCustomers: CustomerMasterItem[] = [
  { id: '1', name: 'Kalyan Jewellers', gst: '27AAAAA0000A1Z5', mobile: '+91 98200 11223', address: 'Zaveri Bazaar, Mumbai', openingBalance: 0, status: 'Active' },
  { id: '2', name: 'Malabar Gold & Diamonds', gst: '27BBBBB1111B1Z2', mobile: '+91 98200 22334', address: 'CG Road, Ahmedabad', openingBalance: 150000, status: 'Active' },
  { id: '3', name: 'TBZ Jewellers', gst: '27CCCCC2222C1Z9', mobile: '+91 98200 33445', address: 'Opera House, Mumbai', openingBalance: 0, status: 'Active' },
  { id: '4', name: 'Joyalukkas Jewellers', gst: '27DDDDD3333D1Z4', mobile: '+91 98200 44556', address: 'MG Road, Bengaluru', openingBalance: 85000, status: 'Active' },
];

const defaultRates: RateMasterItem[] = [
  {
    id: '1',
    date: '2026-08-03',
    rate22k: 7250.0,
    rate24k: 7910.0,
    makingCharge: 450.0,
    gstPercent: 3.0,
  },
];

const defaultWastages: WastageMasterItem[] = [
  { id: '1', department: 'Box', allowedPercent: 0.1 },
  { id: '2', department: 'Soldering', allowedPercent: 0.3 },
  { id: '3', department: 'Joint', allowedPercent: 0.5 },
  { id: '4', department: 'Cutting', allowedPercent: 0.2 },
];

const defaultUsers: UserMasterItem[] = [
  { id: '1', username: 'admin', fullName: 'Rajesh Shah', email: 'admin@sonaerp.com', role: 'Admin', status: 'Active' },
  { id: '2', username: 'manager', fullName: 'Vikram Mehta', email: 'manager@sonaerp.com', role: 'Manager', status: 'Active' },
  { id: '3', username: 'stock_op', fullName: 'Anil Desai', email: 'stock@sonaerp.com', role: 'Stock Operator', status: 'Active' },
  { id: '4', username: 'billing_op', fullName: 'Priya Nair', email: 'billing@sonaerp.com', role: 'Billing Operator', status: 'Active' },
];

// Pre-populated Manufacturing Pipeline Batches
const defaultBatches: LotBatchTransaction[] = [
  {
    id: 'b1',
    lotNo: 'LOT-20260803-001',
    date: '2026-08-03',
    item: 'Chain',
    size: '18',
    purity: '22K',
    stage: 'RAW_STOCK',
    stockWeight: 100.500,
    currentWeight: 100.500,
    lossWeight: 0.000,
    remarks: 'Pure Swiss Gold Bars 999.9',
    status: 'Completed',
    updatedAt: '2026-08-03 09:15:00',
  },
  {
    id: 'b2',
    lotNo: 'LOT-20260803-002',
    date: '2026-08-03',
    item: 'Bracelet',
    size: '20',
    purity: '916',
    stage: 'BOX',
    stockWeight: 75.250,
    currentWeight: 75.180,
    lossWeight: 0.070,
    boxNumber: 'BOX-001',
    assignedWorker: 'Ganesh Kumar',
    status: 'In Progress',
    updatedAt: '2026-08-03 10:30:00',
  },
  {
    id: 'b3',
    lotNo: 'LOT-20260803-003',
    date: '2026-08-03',
    item: 'Chain',
    size: '22',
    purity: '22K',
    stage: 'SOLDERING',
    stockWeight: 120.000,
    currentWeight: 120.150,
    lossWeight: 0.350,
    solderUsed: 0.500,
    assignedWorker: 'Ramesh Patel',
    status: 'In Progress',
    updatedAt: '2026-08-03 11:45:00',
  },
  {
    id: 'b4',
    lotNo: 'LOT-20260803-004',
    date: '2026-08-03',
    item: 'Necklace',
    size: '16',
    purity: '750',
    stage: 'JOINT',
    stockWeight: 50.800,
    currentWeight: 50.550,
    lossWeight: 0.250,
    assignedWorker: 'Suresh Sharma',
    status: 'In Progress',
    updatedAt: '2026-08-03 12:20:00',
  },
  {
    id: 'b5',
    lotNo: 'LOT-20260803-005',
    date: '2026-08-03',
    item: 'Chain',
    size: '20',
    purity: '916',
    stage: 'CUTTING',
    stockWeight: 85.600,
    currentWeight: 85.450,
    lossWeight: 0.150,
    piecesCount: 4,
    assignedWorker: 'Mahesh Verma',
    status: 'In Progress',
    updatedAt: '2026-08-03 13:10:00',
  },
  {
    id: 'b6',
    lotNo: 'LOT-20260803-006',
    date: '2026-08-03',
    item: 'Ring',
    size: '16',
    purity: '22K',
    stage: 'FINISHED_STOCK',
    stockWeight: 25.400,
    currentWeight: 25.320,
    lossWeight: 0.080,
    location: 'Main Vault - Tray B4',
    status: 'Completed',
    updatedAt: '2026-08-03 14:00:00',
  },
];

const defaultInvoices: InvoiceItem[] = [
  {
    id: 'inv1',
    invoiceNo: 'INV-2026-001',
    date: '2026-08-03',
    customerName: 'Kalyan Jewellers',
    customerGst: '27AAAAA0000A1Z5',
    item: 'Chain 22K (20 Inch)',
    size: '20',
    purity: '22K',
    grossWeight: 45.250,
    ratePerGram: 7250.0,
    makingChargePerGram: 450.0,
    goldAmount: 328062.5,
    makingChargeAmount: 20362.5,
    taxableAmount: 348425.0,
    gstPercent: 3.0,
    gstAmount: 10452.75,
    totalAmount: 358877.75,
    paymentStatus: 'Paid',
    lotNo: 'LOT-20260802-099',
  },
  {
    id: 'inv2',
    invoiceNo: 'INV-2026-002',
    date: '2026-08-03',
    customerName: 'Malabar Gold & Diamonds',
    customerGst: '27BBBBB1111B1Z2',
    item: 'Bracelet 916 (18 Inch)',
    size: '18',
    purity: '916',
    grossWeight: 30.120,
    ratePerGram: 7250.0,
    makingChargePerGram: 450.0,
    goldAmount: 218370.0,
    makingChargeAmount: 13554.0,
    taxableAmount: 231924.0,
    gstPercent: 3.0,
    gstAmount: 6957.72,
    totalAmount: 238881.72,
    paymentStatus: 'Paid',
    lotNo: 'LOT-20260802-098',
  },
];

const defaultLogs: AuditLogItem[] = [
  { id: '1', timestamp: '2026-08-03 09:15:00', user: 'admin', action: 'CREATE_STOCK', details: 'Added 100.500g 22K Raw Gold (LOT-20260803-001)' },
  { id: '2', timestamp: '2026-08-03 10:30:00', user: 'stock_op', action: 'BOX_TRANSFER', details: 'Transferred LOT-20260803-002 (75.250g) to Box Dept (BOX-001)' },
  { id: '3', timestamp: '2026-08-03 11:45:00', user: 'admin', action: 'SOLDERING_PROCESS', details: 'Processed LOT-20260803-003 with 0.500g solder added' },
];

export interface ERPStoreData {
  items: ItemMasterItem[];
  sizes: SizeMasterItem[];
  purities: PurityMasterItem[];
  boxes: BoxMasterItem[];
  workers: WorkerMasterItem[];
  customers: CustomerMasterItem[];
  rates: RateMasterItem[];
  wastages: WastageMasterItem[];
  users: UserMasterItem[];
  batches: LotBatchTransaction[];
  invoices: InvoiceItem[];
  auditLogs: AuditLogItem[];
}

export class ERPStore {
  private data: ERPStoreData;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): ERPStoreData {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to parse stored ERP data', e);
    }

    return {
      items: defaultItems,
      sizes: defaultSizes,
      purities: defaultPurities,
      boxes: defaultBoxes,
      workers: defaultWorkers,
      customers: defaultCustomers,
      rates: defaultRates,
      wastages: defaultWastages,
      users: defaultUsers,
      batches: defaultBatches,
      invoices: defaultInvoices,
      auditLogs: defaultLogs,
    };
  }

  private saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Failed to save ERP data to localStorage', e);
    }
  }

  public getData(): ERPStoreData {
    return this.data;
  }

  public resetToDefault() {
    localStorage.removeItem(STORAGE_KEY);
    this.data = this.loadData();
  }

  // AUDIT LOG
  public addAuditLog(user: string, action: string, details: string) {
    const newLog: AuditLogItem = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user,
      action,
      details,
    };
    this.data.auditLogs.unshift(newLog);
    this.saveData();
  }

  // MASTERS CRUD
  public addItem(item: Omit<ItemMasterItem, 'id'>) {
    const newItem: ItemMasterItem = { ...item, id: Date.now().toString() };
    this.data.items.push(newItem);
    this.addAuditLog('admin', 'ADD_ITEM', `Added item ${item.name} (${item.code})`);
    this.saveData();
    return newItem;
  }

  public updateItem(id: string, updates: Partial<ItemMasterItem>) {
    this.data.items = this.data.items.map((it) => (it.id === id ? { ...it, ...updates } : it));
    this.saveData();
  }

  public deleteItem(id: string) {
    this.data.items = this.data.items.filter((it) => it.id !== id);
    this.saveData();
  }

  public addSize(size: Omit<SizeMasterItem, 'id'>) {
    const newSize: SizeMasterItem = { ...size, id: Date.now().toString() };
    this.data.sizes.push(newSize);
    this.addAuditLog('admin', 'ADD_SIZE', `Added size ${size.size}`);
    this.saveData();
    return newSize;
  }

  public updateSize(id: string, updates: Partial<SizeMasterItem>) {
    this.data.sizes = this.data.sizes.map((s) => (s.id === id ? { ...s, ...updates } : s));
    this.saveData();
  }

  public deleteSize(id: string) {
    this.data.sizes = this.data.sizes.filter((s) => s.id !== id);
    this.saveData();
  }

  public addWorker(worker: Omit<WorkerMasterItem, 'id'>) {
    const newWorker: WorkerMasterItem = { ...worker, id: Date.now().toString() };
    this.data.workers.push(newWorker);
    this.addAuditLog('admin', 'ADD_WORKER', `Added worker ${worker.name} (${worker.department})`);
    this.saveData();
    return newWorker;
  }

  public updateWorker(id: string, updates: Partial<WorkerMasterItem>) {
    this.data.workers = this.data.workers.map((w) => (w.id === id ? { ...w, ...updates } : w));
    this.saveData();
  }

  public deleteWorker(id: string) {
    this.data.workers = this.data.workers.filter((w) => w.id !== id);
    this.saveData();
  }

  public addCustomer(customer: Omit<CustomerMasterItem, 'id'>) {
    const newCust: CustomerMasterItem = { ...customer, id: Date.now().toString() };
    this.data.customers.push(newCust);
    this.addAuditLog('admin', 'ADD_CUSTOMER', `Added customer ${customer.name}`);
    this.saveData();
    return newCust;
  }

  public updateCustomer(id: string, updates: Partial<CustomerMasterItem>) {
    this.data.customers = this.data.customers.map((c) => (c.id === id ? { ...c, ...updates } : c));
    this.saveData();
  }

  public deleteCustomer(id: string) {
    this.data.customers = this.data.customers.filter((c) => c.id !== id);
    this.saveData();
  }

  public updateRates(rates: Omit<RateMasterItem, 'id'>) {
    const newRate: RateMasterItem = { ...rates, id: Date.now().toString() };
    this.data.rates.unshift(newRate);
    this.addAuditLog('admin', 'UPDATE_RATES', `Updated 22K Rate: ₹${rates.rate22k}/g, 24K: ₹${rates.rate24k}/g`);
    this.saveData();
    return newRate;
  }

  // LOT BATCH TRANSACTIONS
  public generateLotNumber(): string {
    const dateStr = new Date().toISOString().substring(0, 10).replace(/-/g, '');
    const count = this.data.batches.length + 1;
    const seq = count.toString().padStart(3, '0');
    return `LOT-${dateStr}-${seq}`;
  }

  public addGoldStock(batchData: Omit<LotBatchTransaction, 'id' | 'lotNo' | 'stage' | 'status' | 'updatedAt'>) {
    const lotNo = this.generateLotNumber();
    const newBatch: LotBatchTransaction = {
      ...batchData,
      id: Date.now().toString(),
      lotNo,
      stage: 'RAW_STOCK',
      currentWeight: batchData.stockWeight,
      lossWeight: 0.0,
      status: 'Completed',
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    this.data.batches.unshift(newBatch);
    this.addAuditLog('admin', 'GOLD_STOCK_INTAKE', `Added stock ${lotNo} - ${batchData.stockWeight.toFixed(3)}g`);
    this.saveData();
    return newBatch;
  }

  public updateBatchStage(
    batchId: string,
    nextStage: PipelineStage,
    updates: Partial<LotBatchTransaction>
  ) {
    this.data.batches = this.data.batches.map((b) => {
      if (b.id === batchId) {
        return {
          ...b,
          ...updates,
          stage: nextStage,
          updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        };
      }
      return b;
    });
    this.addAuditLog('operator', 'STAGE_TRANSITION', `Updated Batch ID ${batchId} to ${nextStage}`);
    this.saveData();
  }

  // INVOICING
  public addInvoice(inv: Omit<InvoiceItem, 'id' | 'invoiceNo'>) {
    const seq = (this.data.invoices.length + 1).toString().padStart(3, '0');
    const invoiceNo = `INV-2026-${seq}`;
    const newInv: InvoiceItem = {
      ...inv,
      id: Date.now().toString(),
      invoiceNo,
    };
    this.data.invoices.unshift(newInv);
    this.addAuditLog('billing_op', 'CREATE_INVOICE', `Created Invoice ${invoiceNo} for ${inv.customerName} (₹${inv.totalAmount.toFixed(2)})`);
    this.saveData();
    return newInv;
  }
}

// Singleton Export
export const erpStore = new ERPStore();

/**
 * Trial / TRIAL User Helper & Default Data Store
 * Provides default data for:
 * 1. Items: shiva, indrajit, highway, kamal (and GOLD)
 * 2. Sizes: 1, 2, 2.5, 4Box
 * 3. Clients: 3 clients with different opening balances (3.4, 5.2, 1.8)
 * 4. Manufacturing Process: 3 entries in each process step for understanding workflow
 */

export const isTrialUser = (): boolean => {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      const accessType = (
        user?.accessType ||
        user?.type ||
        user?.role ||
        user?.user?.accessType ||
        ''
      )
        .toString()
        .trim()
        .toUpperCase();
      if (accessType === 'TRIAL') return true;
    }
    const tokenStr = localStorage.getItem('token');
    if (tokenStr) {
      const tokenObj = JSON.parse(tokenStr);
      const accessType = (
        tokenObj?.accessType ||
        tokenObj?.type ||
        tokenObj?.role ||
        tokenObj?.user?.accessType ||
        ''
      )
        .toString()
        .trim()
        .toUpperCase();
      if (accessType === 'TRIAL') return true;
    }
    const directAccessType = localStorage.getItem('admin_access_type');
    if (directAccessType) {
      const upper = directAccessType.toString().trim().toUpperCase();
      if (upper === 'TRIAL') return true;
    }
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('/trial') || path.includes('/demo')) return true;
    }
  } catch (e) {
    // Ignore error
  }
  return false;
};

// ==========================================
// 1. DEFAULT ITEMS FOR TRIAL
// ==========================================
export const DEFAULT_TRIAL_ITEMS = [
  {id: 'trial-item-gold', name: 'GOLD'},
  {id: 'trial-item-shiva', name: 'shiva'},
  {id: 'trial-item-indrajit', name: 'indrajit'},
  {id: 'trial-item-highway', name: 'highway'},
  {id: 'trial-item-kamal', name: 'kamal'},
];

const TRIAL_ITEMS_KEY = 'trial_items_data_v1';

export const getTrialItems = () => {
  try {
    const stored = localStorage.getItem(TRIAL_ITEMS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  localStorage.setItem(TRIAL_ITEMS_KEY, JSON.stringify(DEFAULT_TRIAL_ITEMS));
  return DEFAULT_TRIAL_ITEMS;
};

export const saveTrialItems = (items: any[]) => {
  try {
    localStorage.setItem(TRIAL_ITEMS_KEY, JSON.stringify(items));
  } catch (e) {}
};

// ==========================================
// 2. DEFAULT SIZES FOR TRIAL
// ==========================================
export const DEFAULT_TRIAL_SIZES = [
  {id: 'trial-size-1', size: '1'},
  {id: 'trial-size-2', size: '2'},
  {id: 'trial-size-2.5', size: '2.5'},
  {id: 'trial-size-4box', size: '4Box'},
];

const TRIAL_SIZES_KEY = 'trial_sizes_data_v1';

export const getTrialSizes = () => {
  try {
    const stored = localStorage.getItem(TRIAL_SIZES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  localStorage.setItem(TRIAL_SIZES_KEY, JSON.stringify(DEFAULT_TRIAL_SIZES));
  return DEFAULT_TRIAL_SIZES;
};

export const saveTrialSizes = (sizes: any[]) => {
  try {
    localStorage.setItem(TRIAL_SIZES_KEY, JSON.stringify(sizes));
  } catch (e) {}
};

// ==========================================
// 3. DEFAULT 3 CLIENTS FOR TRIAL
// ==========================================
export const DEFAULT_TRIAL_CLIENTS = [
  {
    id: 'trial-client-1',
    fullName: 'Shiva Jewellers',
    phoneNumber: '9820123456',
    address: 'Zaveri Bazaar, Mumbai',
    openingBalance: 3.4,
  },
  {
    id: 'trial-client-2',
    fullName: 'Indrajit Gold Works',
    phoneNumber: '9820234567',
    address: 'Manek Chowk, Ahmedabad',
    openingBalance: 5.2,
  },
  {
    id: 'trial-client-3',
    fullName: 'Highway Ornaments',
    phoneNumber: '9820345678',
    address: 'Sarafa Bazaar, Rajkot',
    openingBalance: 1.8,
  },
];

const TRIAL_CLIENTS_KEY = 'trial_clients_data_v1';

export const getTrialClients = () => {
  try {
    const stored = localStorage.getItem(TRIAL_CLIENTS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  localStorage.setItem(
    TRIAL_CLIENTS_KEY,
    JSON.stringify(DEFAULT_TRIAL_CLIENTS),
  );
  return DEFAULT_TRIAL_CLIENTS;
};

export const saveTrialClients = (clients: any[]) => {
  try {
    localStorage.setItem(TRIAL_CLIENTS_KEY, JSON.stringify(clients));
  } catch (e) {}
};

// ==========================================
// 4. DEFAULT 3 ENTRIES IN MANUFACTURING PROCESS
// ==========================================
const nowStr = () =>
  new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

export const DEFAULT_TRIAL_TAR = [
  {
    id: 'trial-tar-1',
    srNo: 1,
    dateTime: nowStr(),
    itemId: 'trial-item-shiva',
    item: 'shiva',
    sizeId: 'trial-size-1',
    size: '1',
    grossWt: 50.0,
    grosswt: 50.0,
    fine: 45.8,
    tar: 45.6,
    scrap: 0.15,
    loss: 0.05,
    purity: 91.6,
    isSaved: true,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'trial-tar-2',
    srNo: 2,
    dateTime: nowStr(),
    itemId: 'trial-item-indrajit',
    item: 'indrajit',
    sizeId: 'trial-size-2',
    size: '2',
    grossWt: 75.0,
    grosswt: 75.0,
    fine: 68.7,
    tar: 68.45,
    scrap: 0.2,
    loss: 0.05,
    purity: 91.6,
    isSaved: true,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'trial-tar-3',
    srNo: 3,
    dateTime: nowStr(),
    itemId: 'trial-item-highway',
    item: 'highway',
    sizeId: 'trial-size-2.5',
    size: '2.5',
    grossWt: 100.0,
    grosswt: 100.0,
    fine: 91.6,
    tar: 91.3,
    scrap: 0.25,
    loss: 0.05,
    purity: 91.6,
    isSaved: true,
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
];

export const DEFAULT_TRIAL_BOX = [
  {
    id: 'trial-box-1',
    srNo: 1,
    dateTime: nowStr(),
    itemId: 'trial-item-shiva',
    item: 'shiva',
    sizeId: 'trial-size-1',
    size: '1',
    tarWeight: 45.6,
    chainWeight: 45.45,
    scrap: 0.1,
    loss: 0.05,
    purity: 91.6,
    isSaved: true,
    createdAt: new Date(Date.now() - 3600000 * 3.5).toISOString(),
  },
  {
    id: 'trial-box-2',
    srNo: 2,
    dateTime: nowStr(),
    itemId: 'trial-item-indrajit',
    item: 'indrajit',
    sizeId: 'trial-size-2',
    size: '2',
    tarWeight: 68.45,
    chainWeight: 68.25,
    scrap: 0.15,
    loss: 0.05,
    purity: 91.6,
    isSaved: true,
    createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
  },
  {
    id: 'trial-box-3',
    srNo: 3,
    dateTime: nowStr(),
    itemId: 'trial-item-highway',
    item: 'highway',
    sizeId: 'trial-size-2.5',
    size: '2.5',
    tarWeight: 91.3,
    chainWeight: 91.05,
    scrap: 0.2,
    loss: 0.05,
    purity: 91.6,
    isSaved: true,
    createdAt: new Date(Date.now() - 3600000 * 0.5).toISOString(),
  },
];

export const DEFAULT_TRIAL_SOLDERING = [
  {
    id: 'trial-soldering-1',
    srNo: 1,
    itemId: 'trial-item-shiva',
    item: 'shiva',
    sizeId: 'trial-size-1',
    size: '1',
    chainGiven: 45.45,
    chainReceived: 46.25,
    powder: 1.0,
    increase: 0.8,
    scrap: 0.2,
    purity: '91.6',
    isCompleted: false,
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'trial-soldering-2',
    srNo: 2,
    itemId: 'trial-item-indrajit',
    item: 'indrajit',
    sizeId: 'trial-size-2',
    size: '2',
    chainGiven: 68.25,
    chainReceived: 69.45,
    powder: 1.5,
    increase: 1.2,
    scrap: 0.3,
    purity: '91.6',
    isCompleted: false,
    createdAt: new Date(Date.now() - 3600000 * 1.2).toISOString(),
  },
  {
    id: 'trial-soldering-3',
    srNo: 3,
    itemId: 'trial-item-highway',
    item: 'highway',
    sizeId: 'trial-size-2.5',
    size: '2.5',
    chainGiven: 91.05,
    chainReceived: 92.65,
    powder: 2.0,
    increase: 1.6,
    scrap: 0.4,
    purity: '91.6',
    isCompleted: false,
    createdAt: new Date(Date.now() - 3600000 * 0.3).toISOString(),
  },
];

export const DEFAULT_TRIAL_JOINT = [
  {
    id: 'trial-joint-1',
    srNo: 1,
    itemId: 'trial-item-shiva',
    item: 'shiva',
    sizeId: 'trial-size-1',
    size: '1',
    chainGiven: 46.25,
    chainReceived: 46.15,
    powder: 1.0,
    powderReceived: 0.8,
    srp: 0.1,
    purity: '91.6',
    isCompleted: false,
    createdAt: new Date(Date.now() - 3600000 * 2.5).toISOString(),
  },
  {
    id: 'trial-joint-2',
    srNo: 2,
    itemId: 'trial-item-indrajit',
    item: 'indrajit',
    sizeId: 'trial-size-2',
    size: '2',
    chainGiven: 69.45,
    chainReceived: 69.3,
    powder: 1.5,
    powderReceived: 1.2,
    srp: 0.15,
    purity: '91.6',
    isCompleted: false,
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: 'trial-joint-3',
    srNo: 3,
    itemId: 'trial-item-highway',
    item: 'highway',
    sizeId: 'trial-size-2.5',
    size: '2.5',
    chainGiven: 92.65,
    chainReceived: 92.45,
    powder: 2.0,
    powderReceived: 1.6,
    srp: 0.2,
    purity: '91.6',
    isCompleted: false,
    createdAt: new Date(Date.now() - 3600000 * 0.2).toISOString(),
  },
];

export const DEFAULT_TRIAL_CUTTING = [
  {
    id: 'trial-cutting-1',
    srNo: 1,
    itemId: 'trial-item-shiva',
    item: 'shiva',
    sizeId: 'trial-size-1',
    size: '1',
    chainGiven: 46.15,
    chainReceived: 45.95,
    scrap: 0.15,
    purity: '91.6',
    isCompleted: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'trial-cutting-2',
    srNo: 2,
    itemId: 'trial-item-indrajit',
    item: 'indrajit',
    sizeId: 'trial-size-2',
    size: '2',
    chainGiven: 69.3,
    chainReceived: 69.05,
    scrap: 0.2,
    purity: '91.6',
    isCompleted: false,
    createdAt: new Date(Date.now() - 3600000 * 0.8).toISOString(),
  },
  {
    id: 'trial-cutting-3',
    srNo: 3,
    itemId: 'trial-item-highway',
    item: 'highway',
    sizeId: 'trial-size-2.5',
    size: '2.5',
    chainGiven: 92.45,
    chainReceived: 92.15,
    scrap: 0.25,
    purity: '91.6',
    isCompleted: false,
    createdAt: new Date(Date.now() - 3600000 * 0.1).toISOString(),
  },
];

export const DEFAULT_TRIAL_KUNDA = [
  {
    id: 'trial-kunda-1',
    srNo: 1,
    itemId: 'trial-item-shiva',
    item: 'shiva',
    sizeId: 'trial-size-1',
    size: '1',
    chainReceived: 45.95,
    weight: 45.95,
    scrap: 0.05,
    purity: '91.6',
    isCompleted: false,
    createdAt: new Date(Date.now() - 3600000 * 1.8).toISOString(),
  },
  {
    id: 'trial-kunda-2',
    srNo: 2,
    itemId: 'trial-item-indrajit',
    item: 'indrajit',
    sizeId: 'trial-size-2',
    size: '2',
    chainReceived: 69.05,
    weight: 69.05,
    scrap: 0.05,
    purity: '91.6',
    isCompleted: false,
    createdAt: new Date(Date.now() - 3600000 * 0.6).toISOString(),
  },
  {
    id: 'trial-kunda-3',
    srNo: 3,
    itemId: 'trial-item-highway',
    item: 'highway',
    sizeId: 'trial-size-2.5',
    size: '2.5',
    chainReceived: 92.15,
    weight: 92.15,
    scrap: 0.05,
    purity: '91.6',
    isCompleted: false,
    createdAt: new Date(Date.now() - 3600000 * 0.05).toISOString(),
  },
];

export const DEFAULT_TRIAL_MELTING = [
  {
    id: 'trial-melting-1',
    particular: 'Scrap Melting - Shiva Lot',
    grossWt: 10.5,
    purity: 91.6,
    expectedFine: 9.618,
    fineWt: 9.61,
    scrapCount: 1,
    isCompleted: true,
    createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
  },
  {
    id: 'trial-melting-2',
    particular: 'Cutting Scrap - Indrajit Lot',
    grossWt: 15.2,
    purity: 91.6,
    expectedFine: 13.923,
    fineWt: 13.91,
    scrapCount: 2,
    isCompleted: true,
    createdAt: new Date(Date.now() - 3600000 * 0.5).toISOString(),
  },
  {
    id: 'trial-melting-3',
    particular: 'Daily Workshop Melting Batch',
    grossWt: 22.0,
    purity: 91.6,
    expectedFine: 20.152,
    fineWt: 20.14,
    scrapCount: 3,
    isCompleted: false,
    createdAt: new Date().toISOString(),
  },
];

export const DEFAULT_TRIAL_LOSS_REPORT = [
  {
    id: 'trial-loss-1',
    createdAt: new Date().toISOString(),
    particular: 'Tar Drawing Loss (shiva)',
    loss: 0.05,
    purity: 91.6,
    process: 'Tar',
    type: 'Tar',
    weight: 50.0,
    expectedLoss: 0.05,
    actualLoss: 0.05,
    diffLoss: 0.0,
    item: {id: 'trial-item-shiva', name: 'shiva'},
    size: {id: 'trial-size-1', size: '1'},
  },
  {
    id: 'trial-loss-2',
    createdAt: new Date().toISOString(),
    particular: 'Box Dept Loss (indrajit)',
    loss: 0.05,
    purity: 91.6,
    process: 'Box',
    type: 'Box',
    weight: 75.0,
    expectedLoss: 0.05,
    actualLoss: 0.05,
    diffLoss: 0.0,
    item: {id: 'trial-item-indrajit', name: 'indrajit'},
    size: {id: 'trial-size-2', size: '2'},
  },
  {
    id: 'trial-loss-3',
    createdAt: new Date().toISOString(),
    particular: 'Cutting Loss (highway)',
    loss: 0.05,
    purity: 91.6,
    process: 'Cutting',
    type: 'Cutting',
    weight: 100.0,
    expectedLoss: 0.05,
    actualLoss: 0.05,
    diffLoss: 0.0,
    item: {id: 'trial-item-highway', name: 'highway'},
    size: {id: 'trial-size-2.5', size: '2.5'},
  },
];

export const DEFAULT_TRIAL_MANUFACTURING_REPORT = {
  statusCode: 200,
  status: true,
  message: 'Manufacturing data fetched successfully',
  data: {
    totals: {
      totalWeight: 225.0,
      totalScrap: 0.6,
      totalLoss: 0.15,
      currentWeight: 224.25,
    },
    history: [
      {
        id: 'trial-m-1',
        adminId: 'trial-admin',
        itemId: 'trial-item-shiva',
        sizeId: 'trial-size-1',
        purity: 91.6,
        weight: 50.0,
        scrap: 0.15,
        loss: 0.05,
        currentWeight: 49.8,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        item: {
          id: 'trial-item-shiva',
          name: 'shiva',
          adminId: 'trial-admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        size: {
          id: 'trial-size-1',
          size: '1',
          adminId: 'trial-admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
      {
        id: 'trial-m-2',
        adminId: 'trial-admin',
        itemId: 'trial-item-indrajit',
        sizeId: 'trial-size-2',
        purity: 91.6,
        weight: 75.0,
        scrap: 0.2,
        loss: 0.05,
        currentWeight: 74.75,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        item: {
          id: 'trial-item-indrajit',
          name: 'indrajit',
          adminId: 'trial-admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        size: {
          id: 'trial-size-2',
          size: '2',
          adminId: 'trial-admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
      {
        id: 'trial-m-3',
        adminId: 'trial-admin',
        itemId: 'trial-item-highway',
        sizeId: 'trial-size-2.5',
        purity: 91.6,
        weight: 100.0,
        scrap: 0.25,
        loss: 0.05,
        currentWeight: 99.7,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        item: {
          id: 'trial-item-highway',
          name: 'highway',
          adminId: 'trial-admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        size: {
          id: 'trial-size-2.5',
          size: '2.5',
          adminId: 'trial-admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
    ],
  },
  errors: null,
};

// ==========================================
// 5. DEFAULT BILLS FOR TRIAL (Draft & Completed Bills)
// ==========================================
export const DEFAULT_TRIAL_BILLS = [
  {
    id: 'trial-bill-1',
    billNumber: 'BILL00001',
    billNo: 'BILL00001',
    type: 'BILL',
    clientId: 'trial-client-1',
    customerWeight: 42.09,
    remainingWeight: 0,
    dueBalance: 3.4,
    createdAt: new Date().toISOString(),
    receiptDate: new Date().toISOString(),
    client: {
      id: 'trial-client-1',
      fullName: 'Shiva Jewellers',
      phoneNumber: '9820123456',
      address: 'Zaveri Bazaar, Mumbai',
      openingBalance: 3.4,
      due: 3.4,
    },
    receiptItems: [
      {
        id: 'trial-bill-item-1',
        itemID: 'trial-item-shiva',
        sizeID: 'trial-size-1',
        purity: 91.6,
        grossWeight: 45.95,
        fineWeight: 42.09,
        srp: 42.09,
        availableQty: 1,
        laborRate: 50,
        item: {id: 'trial-item-shiva', name: 'shiva'},
        size: {id: 'trial-size-1', size: '1'},
      },
    ],
  },
  {
    id: 'trial-bill-2',
    billNumber: 'BILL00002',
    billNo: 'BILL00002',
    type: 'DRAFT',
    clientId: 'trial-client-2',
    customerWeight: 50.0,
    remainingWeight: 13.25,
    dueBalance: 18.45,
    createdAt: new Date().toISOString(),
    receiptDate: new Date().toISOString(),
    client: {
      id: 'trial-client-2',
      fullName: 'Indrajit Gold Works',
      phoneNumber: '9820234567',
      address: 'Manek Chowk, Ahmedabad',
      openingBalance: 5.2,
      due: 18.45,
    },
    receiptItems: [
      {
        id: 'trial-bill-item-2',
        itemID: 'trial-item-indrajit',
        sizeID: 'trial-size-2',
        purity: 91.6,
        grossWeight: 69.05,
        fineWeight: 63.25,
        srp: 63.25,
        availableQty: 1,
        laborRate: 50,
        item: {id: 'trial-item-indrajit', name: 'indrajit'},
        size: {id: 'trial-size-2', size: '2'},
      },
    ],
  },
  {
    id: 'trial-bill-3',
    billNumber: 'BILL00003',
    billNo: 'BILL00003',
    type: 'DRAFT',
    clientId: 'trial-client-3',
    customerWeight: 60.0,
    remainingWeight: 24.41,
    dueBalance: 26.21,
    createdAt: new Date().toISOString(),
    receiptDate: new Date().toISOString(),
    client: {
      id: 'trial-client-3',
      fullName: 'Highway Ornaments',
      phoneNumber: '9820345678',
      address: 'Sarafa Bazaar, Rajkot',
      openingBalance: 1.8,
      due: 26.21,
    },
    receiptItems: [
      {
        id: 'trial-bill-item-3',
        itemID: 'trial-item-highway',
        sizeID: 'trial-size-2.5',
        purity: 91.6,
        grossWeight: 92.15,
        fineWeight: 84.41,
        srp: 84.41,
        availableQty: 1,
        laborRate: 50,
        item: {id: 'trial-item-highway', name: 'highway'},
        size: {id: 'trial-size-2.5', size: '2.5'},
      },
    ],
  },
  {
    id: 'trial-bill-4',
    billNumber: 'BILL00004',
    billNo: 'BILL00004',
    type: 'DRAFT',
    clientId: 'trial-client-1',
    customerWeight: 35.0,
    remainingWeight: 15.5,
    dueBalance: 18.9,
    createdAt: new Date().toISOString(),
    receiptDate: new Date().toISOString(),
    client: {
      id: 'trial-client-1',
      fullName: 'Shiva Jewellers',
      phoneNumber: '9820123456',
      address: 'Zaveri Bazaar, Mumbai',
      openingBalance: 3.4,
      due: 18.9,
    },
    receiptItems: [
      {
        id: 'trial-bill-item-4',
        itemID: 'trial-item-kamal',
        sizeID: 'trial-size-4box',
        purity: 91.6,
        grossWeight: 55.15,
        fineWeight: 50.5,
        srp: 50.5,
        availableQty: 1,
        laborRate: 50,
        item: {id: 'trial-item-kamal', name: 'kamal'},
        size: {id: 'trial-size-4box', size: '4Box'},
      },
    ],
  },
];

const TRIAL_BILLS_KEY = 'trial_bills_data_v2';

export const getTrialBills = () => {
  try {
    const stored = localStorage.getItem(TRIAL_BILLS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length >= DEFAULT_TRIAL_BILLS.length)
        return parsed;
    }
  } catch (e) {}
  localStorage.setItem(TRIAL_BILLS_KEY, JSON.stringify(DEFAULT_TRIAL_BILLS));
  return DEFAULT_TRIAL_BILLS;
};

export const saveTrialBills = (bills: any[]) => {
  try {
    localStorage.setItem(TRIAL_BILLS_KEY, JSON.stringify(bills));
  } catch (e) {}
};

// ==========================================
// 6. DEFAULT SETTLEMENTS FOR TRIAL
// ==========================================
export const DEFAULT_TRIAL_SETTLEMENTS = [
  {
    id: 'trial-settle-1',
    clientId: 'trial-client-1',
    clientName: 'Shiva Jewellers',
    phoneNumber: '9820123456',
    address: 'Zaveri Bazaar, Mumbai',
    amount: 3.4,
    openingBalance: 3.4,
    due: 3.4,
    type: 'receive',
    totalBills: 1,
    status: 'completed',
    date: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'trial-settle-2',
    clientId: 'trial-client-2',
    clientName: 'Indrajit Gold Works',
    phoneNumber: '9820234567',
    address: 'Manek Chowk, Ahmedabad',
    amount: 2.0,
    openingBalance: 5.2,
    due: 18.45,
    type: 'receive',
    totalBills: 1,
    status: 'pending',
    date: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'trial-settle-3',
    clientId: 'trial-client-3',
    clientName: 'Highway Ornaments',
    phoneNumber: '9820345678',
    address: 'Sarafa Bazaar, Rajkot',
    amount: 1.0,
    openingBalance: 1.8,
    due: 26.21,
    type: 'receive',
    totalBills: 1,
    status: 'pending',
    date: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
  },
];

// ==========================================
// 7. DEFAULT CLIENT REPORT ENTRIES
// ==========================================
export const getTrialClientReport = (clientId?: string) => {
  const allEntries = [
    {
      id: 'trial-cr-1',
      clientId: 'trial-client-1',
      billNumber: 'BILL00001',
      itemId: 'trial-item-shiva',
      sizeId: 'trial-size-1',
      purity: 91.6,
      remark: 'BILL00001 Sale (Completed)',
      weight: 45.95,
      grossWeight: 45.95,
      fineWeight: 42.09,
      fineweight: 42.09,
      pending: 0,
      remainingWeight: 0,
      receiptId: 'trial-receipt-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      item: {id: 'trial-item-shiva', name: 'shiva'},
      size: {id: 'trial-size-1', size: '1'},
    },
    {
      id: 'trial-cr-2',
      clientId: 'trial-client-2',
      billNumber: 'BILL00002',
      itemId: 'trial-item-indrajit',
      sizeId: 'trial-size-2',
      purity: 91.6,
      remark: 'BILL00002 Draft Sale',
      weight: 69.05,
      grossWeight: 69.05,
      fineWeight: 63.25,
      fineweight: 63.25,
      pending: 13.25,
      remainingWeight: 13.25,
      receiptId: 'trial-receipt-2',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      item: {id: 'trial-item-indrajit', name: 'indrajit'},
      size: {id: 'trial-size-2', size: '2'},
    },
    {
      id: 'trial-cr-3',
      clientId: 'trial-client-3',
      billNumber: 'BILL00003',
      itemId: 'trial-item-highway',
      sizeId: 'trial-size-2.5',
      purity: 91.6,
      remark: 'BILL00003 Draft Sale',
      weight: 92.15,
      grossWeight: 92.15,
      fineWeight: 84.41,
      fineweight: 84.41,
      pending: 24.41,
      remainingWeight: 24.41,
      receiptId: 'trial-receipt-3',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      item: {id: 'trial-item-highway', name: 'highway'},
      size: {id: 'trial-size-2.5', size: '2.5'},
    },
    {
      id: 'trial-cr-4',
      clientId: 'trial-client-1',
      billNumber: 'BILL00004',
      itemId: 'trial-item-kamal',
      sizeId: 'trial-size-4box',
      purity: 91.6,
      remark: 'BILL00004 Draft Sale',
      weight: 55.15,
      grossWeight: 55.15,
      fineWeight: 50.5,
      fineweight: 50.5,
      pending: 15.5,
      remainingWeight: 15.5,
      receiptId: 'trial-receipt-4',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      item: {id: 'trial-item-kamal', name: 'kamal'},
      size: {id: 'trial-size-4box', size: '4Box'},
    },
  ];

  if (!clientId) return allEntries;
  const filtered = allEntries.filter((e) => e.clientId === clientId);
  return filtered.length > 0 ? filtered : allEntries;
};

// ==========================================
// 8. DEFAULT STOCK LEDGER REPORT DATA
// ==========================================
export const DEFAULT_TRIAL_STOCK_LEDGER = {
  statusCode: 200,
  status: true,
  message: 'Stock Ledger Report fetched successfully',
  data: {
    summary: {
      opening: {
        gold: 500.0,
        raw: 225.0,
        openingChain: 207.15,
        srp: 189.75,
        openingClientDue: 10.4,
        inward: 100.0,
      },
      closing: {
        gold: 500.0,
        raw: 225.0,
        closingChain: 207.15,
        closingClientDue: 48.06,
        outward: 42.09,
        loss: 0.15,
        profitLoss: 0,
      },
    },
    rawStock: [
      {
        id: 'rs-1',
        name: 'GOLD 99.5',
        opening: 500.0,
        closing: 500.0,
        difference: 0,
      },
    ],
    chainStock: [
      {
        id: 'cs-1',
        name: 'shiva (1)',
        opening: 45.95,
        closing: 45.95,
        difference: 0,
      },
      {
        id: 'cs-2',
        name: 'indrajit (2)',
        opening: 69.05,
        closing: 69.05,
        difference: 0,
      },
      {
        id: 'cs-3',
        name: 'highway (2.5)',
        opening: 92.15,
        closing: 92.15,
        difference: 0,
      },
    ],
    client: [
      {
        id: 'cl-1',
        name: 'Shiva Jewellers',
        due: 3.4,
        opening: 3.4,
        closing: 3.4,
      },
      {
        id: 'cl-2',
        name: 'Indrajit Gold Works',
        due: 18.45,
        opening: 5.2,
        closing: 18.45,
      },
      {
        id: 'cl-3',
        name: 'Highway Ornaments',
        due: 26.21,
        opening: 1.8,
        closing: 26.21,
      },
    ],
    stockMovement: [
      {
        id: 'sm-1',
        inwardName: 'Opening Gold Inward',
        inward: 100.0,
        outwardName: 'BILL00001 (Shiva Jewellers)',
        outward: 42.09,
      },
      {
        id: 'sm-2',
        inwardName: 'Workshop Batch Inward',
        inward: 50.0,
        outwardName: '-',
        outward: 0,
      },
    ],
  },
};

// ==========================================
// 9. DEFAULT STOCKS FOR TRIAL
// ==========================================
export const DEFAULT_TRIAL_STOCKS = [
  {
    id: 'trial-stock-gold',
    itemId: 'trial-item-gold',
    sizeId: '',
    weight: 500.0,
    purity: '99.5',
    type: 'GOLD',
    item: {id: 'trial-item-gold', name: 'GOLD'},
    size: null,
    stockQty: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'trial-stock-shiva',
    itemId: 'trial-item-shiva',
    sizeId: 'trial-size-1',
    weight: 45.95,
    purity: '91.6',
    type: 'CHAIN',
    item: {id: 'trial-item-shiva', name: 'shiva'},
    size: {id: 'trial-size-1', size: '1'},
    stockQty: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'trial-stock-indrajit',
    itemId: 'trial-item-indrajit',
    sizeId: 'trial-size-2',
    weight: 69.05,
    purity: '91.6',
    type: 'CHAIN',
    item: {id: 'trial-item-indrajit', name: 'indrajit'},
    size: {id: 'trial-size-2', size: '2'},
    stockQty: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'trial-stock-highway',
    itemId: 'trial-item-highway',
    sizeId: 'trial-size-2.5',
    weight: 92.15,
    purity: '91.6',
    type: 'CHAIN',
    item: {id: 'trial-item-highway', name: 'highway'},
    size: {id: 'trial-size-2.5', size: '2.5'},
    stockQty: 1,
    createdAt: new Date().toISOString(),
  },
];

const TRIAL_STOCKS_KEY = 'trial_stocks_data_v1';

export const getTrialStocks = () => {
  try {
    const stored = localStorage.getItem(TRIAL_STOCKS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  localStorage.setItem(TRIAL_STOCKS_KEY, JSON.stringify(DEFAULT_TRIAL_STOCKS));
  return DEFAULT_TRIAL_STOCKS;
};

export const saveTrialStocks = (stocks: any[]) => {
  try {
    localStorage.setItem(TRIAL_STOCKS_KEY, JSON.stringify(stocks));
  } catch (e) {}
};

const TRIAL_TAR_KEY = 'trial_tar_data_v1';
export const getStoredTrialTar = () => {
  try {
    const stored = localStorage.getItem(TRIAL_TAR_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  localStorage.setItem(TRIAL_TAR_KEY, JSON.stringify(DEFAULT_TRIAL_TAR));
  return DEFAULT_TRIAL_TAR;
};

export const revertStoredTrialTar = (id: string) => {
  try {
    const current = getStoredTrialTar();
    const filtered = current.filter(
      (item: any) => String(item.id || item._id) !== String(id),
    );
    localStorage.setItem(TRIAL_TAR_KEY, JSON.stringify(filtered));
  } catch (e) {}
};

const TRIAL_BOX_KEY = 'trial_box_data_v1';
export const getStoredTrialBox = () => {
  try {
    const stored = localStorage.getItem(TRIAL_BOX_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  localStorage.setItem(TRIAL_BOX_KEY, JSON.stringify(DEFAULT_TRIAL_BOX));
  return DEFAULT_TRIAL_BOX;
};

export const revertStoredTrialBox = (id: string) => {
  try {
    const current = getStoredTrialBox();
    const filtered = current.filter(
      (item: any) => String(item.id || item._id) !== String(id),
    );
    localStorage.setItem(TRIAL_BOX_KEY, JSON.stringify(filtered));
  } catch (e) {}
};

const TRIAL_SOLDERING_KEY = 'trial_soldering_data_v1';
export const getStoredTrialSoldering = () => {
  try {
    const stored = localStorage.getItem(TRIAL_SOLDERING_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  localStorage.setItem(
    TRIAL_SOLDERING_KEY,
    JSON.stringify(DEFAULT_TRIAL_SOLDERING),
  );
  return DEFAULT_TRIAL_SOLDERING;
};

export const revertStoredTrialSoldering = (id: string) => {
  try {
    const current = getStoredTrialSoldering();
    const filtered = current.filter(
      (item: any) => String(item.id || item._id) !== String(id),
    );
    localStorage.setItem(TRIAL_SOLDERING_KEY, JSON.stringify(filtered));
  } catch (e) {}
};

import React, {useState} from 'react';
import {Plus, Edit, Trash2, Save, X} from 'lucide-react';
import GenericButton from '../Forms/Buttons/GenericButton';
import GenericTable, {Column} from '../Forms/Table/GenericTable';
import toast from 'react-hot-toast';

interface Account {
  id: string;
  accountName: string;
  openingBalance: number;
  balanceType: 'DEBIT' | 'CREDIT';
  createdAt?: string;
}

const Account: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([
    {
      id: '1',
      accountName: 'Cash Account',
      openingBalance: 50000,
      balanceType: 'DEBIT',
    },
    {
      id: '2',
      accountName: 'Bank Account - HDFC',
      openingBalance: 100000,
      balanceType: 'DEBIT',
    },
    {
      id: '3',
      accountName: 'Supplier Account',
      openingBalance: 25000,
      balanceType: 'CREDIT',
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState({
    accountName: '',
    openingBalance: '',
    balanceType: 'DEBIT' as 'DEBIT' | 'CREDIT',
  });

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Handle form input change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const {name, value} = e.target;
    setFormData((prev) => ({...prev, [name]: value}));
  };

  // Handle add new account
  const handleAddAccount = () => {
    if (!formData.accountName.trim()) {
      toast.error('Please enter account name');
      return;
    }

    if (!formData.openingBalance || parseFloat(formData.openingBalance) < 0) {
      toast.error('Please enter valid opening balance');
      return;
    }

    const newAccount: Account = {
      id: Date.now().toString(),
      accountName: formData.accountName,
      openingBalance: parseFloat(formData.openingBalance),
      balanceType: formData.balanceType,
    };

    setAccounts((prev) => [...prev, newAccount]);
    toast.success('Account added successfully');
    resetForm();
    setIsModalOpen(false);
  };

  // Handle edit account
  const handleEditAccount = () => {
    if (!editingAccount) return;

    if (!formData.accountName.trim()) {
      toast.error('Please enter account name');
      return;
    }

    if (!formData.openingBalance || parseFloat(formData.openingBalance) < 0) {
      toast.error('Please enter valid opening balance');
      return;
    }

    const updatedAccounts = accounts.map((acc) =>
      acc.id === editingAccount.id
        ? {
            ...acc,
            accountName: formData.accountName,
            openingBalance: parseFloat(formData.openingBalance),
            balanceType: formData.balanceType,
          }
        : acc,
    );

    setAccounts(updatedAccounts);
    toast.success('Account updated successfully');
    resetForm();
    setIsModalOpen(false);
    setEditingAccount(null);
  };

  // Handle delete account
  const handleDeleteAccount = (account: Account) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${account.accountName}"?`,
      )
    ) {
      setAccounts((prev) => prev.filter((acc) => acc.id !== account.id));
      toast.success('Account deleted successfully');
    }
  };

  // Handle edit button click
  const handleEditClick = (account: Account) => {
    setEditingAccount(account);
    setFormData({
      accountName: account.accountName,
      openingBalance: account.openingBalance.toString(),
      balanceType: account.balanceType,
    });
    setIsModalOpen(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      accountName: '',
      openingBalance: '',
      balanceType: 'DEBIT',
    });
    setEditingAccount(null);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  // Calculate totals
  const totalDebitBalance = accounts
    .filter((acc) => acc.balanceType === 'DEBIT')
    .reduce((sum, acc) => sum + acc.openingBalance, 0);

  const totalCreditBalance = accounts
    .filter((acc) => acc.balanceType === 'CREDIT')
    .reduce((sum, acc) => sum + acc.openingBalance, 0);

  const netBalance = totalDebitBalance - totalCreditBalance;

  // Table columns
  const columns: Column<Account>[] = [
    {
      header: 'Account Name',
      accessor: 'accountName',
      sortable: true,
      align: 'left',
      className: 'font-medium',
    },
    {
      header: 'Opening Balance',
      accessor: 'openingBalance',
      sortable: true,
      align: 'right',
      render: (item) => formatCurrency(item.openingBalance),
    },
  ];

  return (
    <div className="min-h-screen bg-[#f9f9f7]">
      <div className="px-4 py-4 md:px-8 md:py-6">
        {/* Header */}
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="font-headline text-2xl font-bold tracking-tight text-[#1a1c1b] md:text-3xl">
              Account Management
            </h2>
            <p className="mt-1 text-xs text-[#4f4535]">
              Manage your chart of accounts and opening balances
            </p>
          </div>
          <GenericButton
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 !px-4 !py-2"
          >
            <Plus className="h-4 w-4" />
            Add Account
          </GenericButton>
        </div>

        {/* Accounts Table */}
        <GenericTable
          data={accounts}
          columns={columns}
          itemsPerPage={10}
          searchable={true}
          searchPlaceholder="Search by account name..."
          title="Chart of Accounts"
          action={true}
          onEdit={handleEditClick}
          onDelete={handleDeleteAccount}
          emptyMessage="No accounts found. Click 'Add Account' to create one."
        />
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#d3c4af]/10 p-4">
              <h3 className="text-lg font-bold text-[#1a1c1b]">
                {editingAccount ? 'Edit Account' : 'Add New Account'}
              </h3>
              <button
                onClick={closeModal}
                className="rounded-lg p-1 transition-colors hover:bg-[#f4f4f2]"
              >
                <X className="h-5 w-5 text-[#4f4535]" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 p-4">
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase text-[#4f4535]">
                  Account Name
                </label>
                <input
                  type="text"
                  name="accountName"
                  value={formData.accountName}
                  onChange={handleInputChange}
                  placeholder="e.g., Cash Account, Bank Account"
                  className="w-full rounded-lg border-0 bg-[#f4f4f2] px-4 py-3 text-sm text-[#1a1c1b] outline-none focus:ring-2 focus:ring-[#785600]/20"
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase text-[#4f4535]">
                  Opening Balance (₹)
                </label>
                <input
                  type="number"
                  name="openingBalance"
                  value={formData.openingBalance}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full rounded-lg border-0 bg-[#f4f4f2] px-4 py-3 text-sm text-[#1a1c1b] outline-none focus:ring-2 focus:ring-[#785600]/20"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 border-t border-[#d3c4af]/10 p-4">
              <button
                onClick={closeModal}
                className="rounded-lg px-4 py-2 text-sm font-medium text-[#4f4535] transition-colors hover:bg-[#f4f4f2]"
              >
                Cancel
              </button>
              <button
                onClick={editingAccount ? handleEditAccount : handleAddAccount}
                className="rounded-lg bg-[#785600] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#5d4200]"
              >
                {editingAccount ? 'Update Account' : 'Add Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Account;

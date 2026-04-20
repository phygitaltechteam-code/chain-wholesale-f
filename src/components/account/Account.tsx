import React, {useState, useEffect} from 'react';
import {Plus, Edit, Trash2, Save, X} from 'lucide-react';
import GenericButton from '../Forms/Buttons/GenericButton';
import GenericTable, {Column} from '../Forms/Table/GenericTable';
import toast from 'react-hot-toast';
import {useSaveAccontInfo, useGetAccounts} from './accountapi';
import PageHeader from '../Forms/Common/PageHeader';

interface Account {
  id: string;
  accountName: string;
  openingBalance: number;
  createdAt?: string;
}

// API Response interface
interface AccountAPIResponse {
  name: string;
  balance: number;
  id?: string;
}

const Account: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState({
    accountName: '',
    openingBalance: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const saveAccount = useSaveAccontInfo();

  // Fetch accounts from API
  const {
    data: accountsData,
    isLoading: isDataLoading,
    refetch,
  } = useGetAccounts();

  // Load accounts from API when component mounts
  useEffect(() => {
    if (accountsData && accountsData.data) {
      // Transform API data to match Account interface
      const transformedAccounts: Account[] = accountsData.data.map(
        (item: AccountAPIResponse, index: number) => ({
          id: item.id || index.toString(),
          accountName: item.name,
          openingBalance: item.balance,
        }),
      );
      setAccounts(transformedAccounts);
    }
  }, [accountsData]);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(value));
  };

  // Handle form input change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const {name, value} = e.target;
    setFormData((prev) => ({...prev, [name]: value}));
  };

  // Handle add new account - Save to API
  const handleAddAccount = async () => {
    if (!formData.accountName.trim()) {
      toast.error('Please enter account name');
      return;
    }

    if (!formData.openingBalance || parseFloat(formData.openingBalance) < 0) {
      toast.error('Please enter valid opening balance');
      return;
    }

    setIsLoading(true);

    // Prepare payload in required format: { "name": "string", "balance": 0 }
    const payload = {
      name: formData.accountName,
      balance: parseFloat(formData.openingBalance),
    };

    try {
      const result = await saveAccount.mutateAsync(payload);

      if (result && result.data) {
        toast.success('Account added successfully');
        resetForm();
        setIsModalOpen(false);
        await refetch(); // Refresh data from API to get the latest data
      }
    } catch (error) {
      console.error('Error saving account:', error);
      toast.error('Failed to save account');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle edit account - Update in API
  const handleEditAccount = async () => {
    if (!editingAccount) return;

    if (!formData.accountName.trim()) {
      toast.error('Please enter account name');
      return;
    }

    if (!formData.openingBalance || parseFloat(formData.openingBalance) < 0) {
      toast.error('Please enter valid opening balance');
      return;
    }

    setIsLoading(true);

    // Prepare payload in required format
    const payload = {
      name: formData.accountName,
      balance: parseFloat(formData.openingBalance),
    };

    try {
      const result = await saveAccount.mutateAsync(payload);

      if (result && result.data) {
        toast.success('Account updated successfully');
        resetForm();
        setIsModalOpen(false);
        setEditingAccount(null);
        await refetch(); // Refresh data from API to get the latest data
      }
    } catch (error) {
      console.error('Error updating account:', error);
      toast.error('Failed to update account');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete account
  const handleDeleteAccount = async (account: Account) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${account.accountName}"?`,
      )
    ) {
      // Note: You need to add a delete API call here
      // For now, just remove from local state and refetch
      toast.success('Account deleted successfully');
      await refetch(); // Refresh data from API
    }
  };

  // Handle edit button click
  const handleEditClick = (account: Account) => {
    // Set the editing account with the exact current values
    setEditingAccount(account);
    setFormData({
      accountName: account.accountName,
      openingBalance: account.openingBalance.toString(),
    });
    setIsModalOpen(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      accountName: '',
      openingBalance: '',
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
    .filter((acc) => acc.openingBalance >= 0)
    .reduce((sum, acc) => sum + acc.openingBalance, 0);

  const totalCreditBalance = accounts
    .filter((acc) => acc.openingBalance < 0)
    .reduce((sum, acc) => sum + Math.abs(acc.openingBalance), 0);

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
            <PageHeader
              title="Account Management"
              subtitle="Manage your chart of accounts and opening balances"
            />
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
          // action={true}
          // onEdit={handleEditClick}
          // onDelete={handleDeleteAccount}
          emptyMessage="No accounts found. Click 'Add Account' to create one."
          loading={isDataLoading}
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
                disabled={isLoading}
                className="rounded-lg bg-[#785600] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#5d4200] disabled:opacity-50"
              >
                {isLoading
                  ? 'Saving...'
                  : editingAccount
                    ? 'Update Account'
                    : 'Add Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Account;

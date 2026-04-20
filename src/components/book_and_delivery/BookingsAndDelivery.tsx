// RegisterNewTrade.tsx - with Bank Account at the end and Notes section
import React, {useState, useEffect} from 'react';
import {
  Search,
  Lock,
  Calendar,
  Receipt,
  ArrowDown,
  ArrowUp,
  Check,
  User,
  Building2,
  Edit2,
  FileText,
  AlertCircle,
} from 'lucide-react';
import {useNavigate} from '@tanstack/react-router';
import toast from 'react-hot-toast';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import {FormProvider, useForm} from 'react-hook-form';
import {useGetClient} from '../Client/api';
import {useGetAccounts} from '../account/accountapi';
import {useNewBooking} from './bookingapi';

interface Client {
  id: string;
  name: string;
  gstin: string;
  phone: string;
  email?: string;
  address?: string;
}

interface Account {
  id: string;
  name: string;
  balance: number;
}

interface TradeFormData {
  clientLedger: string;
  netWeight: number;
  advanceToken: number;
  accountId: string;
  rate: number;
  notes: string;
}

interface ClientApiResponse {
  id: string;
  fullname: string;
  phoneNumber: string;
  GST?: string;
  city?: string;
  address?: string;
}

interface BookingPayload {
  clientId: string;
  clientName: string;
  accountId: string;
  accountName: string;
  transactionType: string;
  commodity: string;
  netWeight: number;
  rate: number;
  totalValue: number;
  advanceToken: number;
  balanceDue: number;
  valueDate: string;
  notes?: string;
  status: string;
}

const RegisterNewTrade: React.FC = () => {
  const navigate = useNavigate();
  const methods = useForm<TradeFormData>();
  const {register, setValue, watch} = methods;

  // API Hooks
  const {data: clientsData, isLoading: clientsLoading} = useGetClient();
  const {
    data: accountsData,
    isLoading: accountsLoading,
    refetch: refetchAccounts,
  } = useGetAccounts();

  const newbook = useNewBooking();

  const [transactionType, setTransactionType] = useState<'sale' | 'purchase'>(
    'sale',
  );
  const [commodity, setCommodity] = useState<'gold' | 'silver'>('gold');
  const [netWeight, setNetWeight] = useState<number>(0);
  const [valueDate, setValueDate] = useState<string>(
    new Date().toISOString().split('T')[0],
  );
  const [accountsList, setAccountsList] = useState<Account[]>([]);
  const [advanceToken, setAdvanceToken] = useState<number>(0);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [accountSearchQuery, setAccountSearchQuery] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState<string>('');

  // Rate state - made editable
  const [rate, setRate] = useState<number>(72450); // Default gold rate

  // Transform API client data to Client interface
  const clients: Client[] =
    clientsData?.map((client: ClientApiResponse) => ({
      id: client.id,
      name: client.fullname,
      gstin: client.GST || '',
      phone: client.phoneNumber,
      email: '',
      address: client.address,
    })) || [];

  // Transform API account data to Account interface
  useEffect(() => {
    if (accountsData && accountsData.data) {
      const transformedAccounts: Account[] = accountsData.data.map(
        (item: any) => ({
          id: item.id,
          name: item.name,
          balance: item.balance,
        }),
      );
      setAccountsList(transformedAccounts);
    }
  }, [accountsData]);

  // Update rate when commodity changes
  useEffect(() => {
    if (commodity === 'gold') {
      setRate(72450);
    } else {
      setRate(91200);
    }
  }, [commodity]);

  // Filter clients based on search query
  const filteredClients = clients.filter(
    (client) =>
      client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.gstin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phone?.includes(searchQuery),
  );

  // Filter accounts based on search query
  const filteredAccounts = accountsList.filter((account) =>
    account.name?.toLowerCase().includes(accountSearchQuery.toLowerCase()),
  );

  const ratePerUnit = commodity === 'gold' ? '/ 10g' : '/ kg';

  // Calculate total value using editable rate
  const totalValue = (netWeight * rate) / (commodity === 'gold' ? 10 : 1);
  const balanceDue = totalValue - advanceToken;

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setSearchQuery(client.name);
    setShowClientDropdown(false);
    toast.success(`Client selected: ${client.name}`);
  };

  const handleAccountSelect = (account: Account) => {
    setSelectedAccount(account);
    setAccountSearchQuery(account.name);
    setShowAccountDropdown(false);
    toast.success(`Account selected: ${account.name}`);
  };

  const handleClearClient = () => {
    setSelectedClient(null);
    setSearchQuery('');
    toast.success('Client cleared');
  };

  const handleClearAccount = () => {
    setSelectedAccount(null);
    setAccountSearchQuery('');
    toast.success('Account cleared');
  };

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newRate = Number(e.target.value);
    if (!isNaN(newRate) && newRate >= 0) {
      setRate(newRate);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!selectedClient) {
      toast.error('Please select a client');
      return;
    }
    if (!selectedAccount) {
      toast.error('Please select an account');
      return;
    }
    if (netWeight <= 0) {
      toast.error('Please enter net weight');
      return;
    }
    if (advanceToken <= 0) {
      toast.error('Please enter advance token amount');
      return;
    }
    if (advanceToken > totalValue) {
      toast.error('Advance token cannot exceed total value');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare payload for API
      const payload: BookingPayload = {
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        accountId: selectedAccount.id,
        accountName: selectedAccount.name,
        transactionType: transactionType,
        commodity: commodity,
        netWeight: netWeight,
        rate: rate,
        totalValue: totalValue,
        advanceToken: advanceToken,
        balanceDue: balanceDue,
        valueDate: valueDate,
        notes: notes.trim() || undefined,
        status: 'PENDING',
      };

      console.log('Submitting payload:', payload);

      // Call API
      const result = await newbook.mutateAsync(payload);

      console.log('API Response:', result);

      toast.success('Trade confirmed successfully!');

      // Reset form after successful submission
      resetForm();

      // Navigate after delay
      setTimeout(() => {
        navigate({to: '/bookdelivery/bookings-delivery'});
      }, 1500);
    } catch (error: any) {
      console.error('Error submitting trade:', error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to register trade. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedClient(null);
    setSelectedAccount(null);
    setSearchQuery('');
    setAccountSearchQuery('');
    setNetWeight(0);
    setAdvanceToken(0);
    setValueDate(new Date().toISOString().split('T')[0]);
    setTransactionType('sale');
    setCommodity('gold');
    setRate(72450);
    setNotes('');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <FormProvider {...methods}>
      <div className="min-h-screen bg-[#f9f9f7]">
        {/* Back Button */}
        <div className="px-3 pt-3 md:px-4 md:pt-4">
          <button
            className="flex items-center gap-2 text-xs text-[#785600] transition-colors hover:text-[#5d4200] md:text-sm"
            onClick={() => navigate({to: '/bookdelivery/bookings-delivery'})}
          >
            ← Back to Bookings
          </button>
        </div>

        {/* Main Content */}
        <div className="px-3 py-4 md:px-4 md:py-6">
          <div className="mx-auto max-w-3xl">
            {/* Form Card */}
            <div className="overflow-hidden rounded-xl bg-white shadow-[0px_10px_40px_rgba(121,88,0,0.06)]">
              <div className="border-b border-[#d3c4af]/15 px-4 py-4 md:px-6 md:py-5">
                <h1 className="font-headline text-xl font-bold text-[#1a1c1b] md:text-2xl">
                  Register New Trade
                </h1>
                <p className="font-body mt-1 text-xs text-[#4f4535]">
                  Log a new bullion transaction against current verified market
                  rates.
                </p>
              </div>

              <form
                className="space-y-4 p-4 md:p-6"
                onSubmit={(e) => e.preventDefault()}
              >
                {/* Client Selection */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4f4535]">
                    Client Ledger <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowClientDropdown(true);
                        if (e.target.value === '') setSelectedClient(null);
                      }}
                      onFocus={() => setShowClientDropdown(true)}
                      className="w-full rounded-lg border-0 bg-[#f4f4f2] py-2.5 pl-9 pr-10 text-sm text-[#1a1c1b] outline-none placeholder:text-xs focus:ring-2 focus:ring-[#785600]/20"
                      placeholder="Search client name, GSTIN or phone..."
                      disabled={clientsLoading}
                    />
                    {selectedClient && searchQuery && (
                      <button
                        type="button"
                        onClick={handleClearClient}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#817563] hover:text-red-500"
                      >
                        ✕
                      </button>
                    )}
                    {clientsLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#785600] border-t-transparent"></div>
                      </div>
                    )}
                    {showClientDropdown &&
                      !clientsLoading &&
                      filteredClients.length > 0 && (
                        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-[#d3c4af]/30 bg-white shadow-lg">
                          {filteredClients.map((client) => (
                            <div
                              key={client.id}
                              className="cursor-pointer border-b border-[#f4f4f2] p-3 transition-colors hover:bg-[#f4f4f2]"
                              onClick={() => handleClientSelect(client)}
                            >
                              <p className="text-sm font-bold text-[#1a1c1b]">
                                {client.name}
                              </p>
                              <p className="text-xs text-[#4f4535]">
                                GST: {client.gstin || 'N/A'}
                              </p>
                              <p className="text-xs text-[#4f4535]">
                                {client.phone || 'No phone'}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    {showClientDropdown &&
                      !clientsLoading &&
                      filteredClients.length === 0 &&
                      searchQuery && (
                        <div className="absolute z-10 mt-1 w-full rounded-lg border border-[#d3c4af]/30 bg-white p-4 text-center shadow-lg">
                          <p className="text-sm text-[#4f4535]">
                            No clients found
                          </p>
                        </div>
                      )}
                  </div>
                </div>

                {/* Gridded Toggles */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4f4535]">
                      Transaction Nature
                    </label>
                    <div className="flex rounded-lg bg-[#f4f4f2] p-1">
                      <button
                        type="button"
                        onClick={() => setTransactionType('sale')}
                        className={`flex-1 rounded-md py-2 text-xs font-medium transition-all ${
                          transactionType === 'sale'
                            ? 'bg-white text-[#785600] shadow-sm'
                            : 'text-[#4f4535] hover:text-[#1a1c1b]'
                        }`}
                      >
                        Sale (Outward)
                      </button>
                      <button
                        type="button"
                        onClick={() => setTransactionType('purchase')}
                        className={`flex-1 rounded-md py-2 text-xs font-medium transition-all ${
                          transactionType === 'purchase'
                            ? 'bg-white text-[#785600] shadow-sm'
                            : 'text-[#4f4535] hover:text-[#1a1c1b]'
                        }`}
                      >
                        Purchase (Inward)
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4f4535]">
                      Commodity Class
                    </label>
                    <div className="flex rounded-lg bg-[#f4f4f2] p-1">
                      <button
                        type="button"
                        onClick={() => setCommodity('gold')}
                        className={`flex-1 rounded-md py-2 text-xs font-medium transition-all ${
                          commodity === 'gold'
                            ? 'bg-white text-[#785600] shadow-sm'
                            : 'text-[#4f4535] hover:text-[#1a1c1b]'
                        }`}
                      >
                        Gold (AU)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCommodity('silver')}
                        className={`flex-1 rounded-md py-2 text-xs font-medium transition-all ${
                          commodity === 'silver'
                            ? 'bg-white text-[#785600] shadow-sm'
                            : 'text-[#4f4535] hover:text-[#1a1c1b]'
                        }`}
                      >
                        Silver (AG)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Weights & Rates - Rate is now editable */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4f4535]">
                      Net Weight <span className="text-red-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        value={netWeight || ''}
                        onChange={(e) => setNetWeight(Number(e.target.value))}
                        step="0.001"
                        className="w-full rounded-lg border-0 bg-[#f4f4f2] py-2.5 pl-3 pr-16 text-right text-sm text-[#1a1c1b] outline-none focus:ring-2 focus:ring-[#785600]/20"
                        placeholder="0.000"
                      />
                      <span className="absolute right-3 text-xs font-medium text-[#4f4535]">
                        Grams
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4f4535]">
                      Rate <span className="text-red-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <Edit2 className="absolute left-3 h-4 w-4 text-[#817563]" />
                      <input
                        type="number"
                        value={rate}
                        onChange={handleRateChange}
                        step="0.01"
                        className="w-full rounded-lg border-0 bg-[#f4f4f2] py-2.5 pl-9 pr-16 text-sm font-bold text-[#785600] outline-none focus:ring-2 focus:ring-[#785600]/20"
                        placeholder="Enter rate"
                      />
                      <span className="absolute right-3 text-[10px] font-medium text-[#4f4535]">
                        {ratePerUnit}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-[#4f4535]">
                      * Editable - Current{' '}
                      {commodity === 'gold' ? 'Gold' : 'Silver'} rate: ₹
                      {commodity === 'gold' ? '72,450' : '91,200'} {ratePerUnit}
                    </p>
                  </div>
                </div>

                {/* Financials */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4f4535]">
                      Value Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
                      <input
                        type="date"
                        value={valueDate}
                        onChange={(e) => setValueDate(e.target.value)}
                        className="w-full rounded-lg border-0 bg-[#f4f4f2] py-2.5 pl-9 pr-3 text-sm text-[#1a1c1b] outline-none focus:ring-2 focus:ring-[#785600]/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4f4535]">
                      Advance Token <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-[#4f4535]">
                        ₹
                      </span>
                      <input
                        type="number"
                        value={advanceToken || ''}
                        onChange={(e) =>
                          setAdvanceToken(Number(e.target.value))
                        }
                        step="0.01"
                        className="w-full rounded-lg border-0 bg-[#f4f4f2] py-2.5 pl-7 pr-3 text-right text-sm text-[#1a1c1b] outline-none focus:ring-2 focus:ring-[#785600]/20"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                {/* Bank Account Selection - Moved to the end */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4f4535]">
                    Bank Account <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#817563]" />
                    <input
                      type="text"
                      value={accountSearchQuery}
                      onChange={(e) => {
                        setAccountSearchQuery(e.target.value);
                        setShowAccountDropdown(true);
                        if (e.target.value === '') setSelectedAccount(null);
                      }}
                      onFocus={() => setShowAccountDropdown(true)}
                      className="w-full rounded-lg border-0 bg-[#f4f4f2] py-2.5 pl-9 pr-10 text-sm text-[#1a1c1b] outline-none placeholder:text-xs focus:ring-2 focus:ring-[#785600]/20"
                      placeholder="Search account name..."
                      disabled={accountsLoading}
                    />
                    {selectedAccount && accountSearchQuery && (
                      <button
                        type="button"
                        onClick={handleClearAccount}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#817563] hover:text-red-500"
                      >
                        ✕
                      </button>
                    )}
                    {accountsLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#785600] border-t-transparent"></div>
                      </div>
                    )}
                    {showAccountDropdown &&
                      !accountsLoading &&
                      filteredAccounts.length > 0 && (
                        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-[#d3c4af]/30 bg-white shadow-lg">
                          {filteredAccounts.map((account) => (
                            <div
                              key={account.id}
                              className="cursor-pointer border-b border-[#f4f4f2] p-3 transition-colors hover:bg-[#f4f4f2]"
                              onClick={() => handleAccountSelect(account)}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-bold text-[#1a1c1b]">
                                    {account.name}
                                  </p>
                                  <p className="text-xs text-[#4f4535]">
                                    Balance: {formatCurrency(account.balance)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    {showAccountDropdown &&
                      !accountsLoading &&
                      filteredAccounts.length === 0 &&
                      accountSearchQuery && (
                        <div className="absolute z-10 mt-1 w-full rounded-lg border border-[#d3c4af]/30 bg-white p-4 text-center shadow-lg">
                          <p className="text-sm text-[#4f4535]">
                            No accounts found
                          </p>
                        </div>
                      )}
                  </div>
                </div>

                {/* Notes Section */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#4f4535]">
                    Notes{' '}
                    <span className="font-normal text-[#4f4535]">
                      (Optional)
                    </span>
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-[#817563]" />
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border-0 bg-[#f4f4f2] py-2.5 pl-9 pr-3 text-sm text-[#1a1c1b] outline-none placeholder:text-xs focus:ring-2 focus:ring-[#785600]/20"
                      placeholder="Add any additional notes or instructions..."
                    />
                  </div>
                  <p className="flex items-center gap-1 text-[10px] text-[#4f4535]">
                    <AlertCircle className="h-3 w-3" />
                    Include delivery instructions, special requests, or any
                    other relevant information
                  </p>
                </div>

                {/* Summary Card */}
                {(netWeight > 0 || advanceToken > 0) && (
                  <div className="rounded-xl bg-gradient-to-br from-[#1a1a2e] to-[#1a1a2e]/95 p-4 text-white">
                    <h3 className="mb-2 font-headline text-sm font-bold">
                      Booking Summary
                    </h3>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-400">Net Weight</span>
                        <span className="font-medium">
                          {netWeight.toFixed(3)} g
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-400">Rate</span>
                        <span className="font-medium">
                          ₹ {rate.toFixed(2)} {ratePerUnit}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-400">Total Value</span>
                        <span className="font-medium">
                          {formatCurrency(totalValue)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-400">Advance Paid</span>
                        <span className="font-medium text-emerald-400">
                          {formatCurrency(advanceToken)}
                        </span>
                      </div>
                      {notes && (
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-400">Notes</span>
                          <span className="max-w-[200px] text-right text-xs font-medium">
                            {notes.length > 30
                              ? notes.substring(0, 30) + '...'
                              : notes}
                          </span>
                        </div>
                      )}
                      <div className="my-1.5 h-px bg-white/10"></div>
                      <div className="flex justify-between text-sm">
                        <span className="font-bold">Balance Due</span>
                        <span className="font-bold text-[#f7bd48]">
                          {formatCurrency(balanceDue)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={
                      !selectedClient ||
                      !selectedAccount ||
                      netWeight <= 0 ||
                      advanceToken <= 0 ||
                      isSubmitting
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-[#785600] to-[#986d00] px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Receipt className="h-4 w-4" />
                        Execute Trade Confirmation
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .font-headline {
          font-family: 'Noto Serif', serif;
        }
        .font-body {
          font-family: 'Manrope', sans-serif;
        }
      `}</style>
    </FormProvider>
  );
};

export default RegisterNewTrade;

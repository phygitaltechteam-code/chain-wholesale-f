import React, {useState} from 'react';
import {X} from 'lucide-react';
import toast from 'react-hot-toast';
import {Client} from '@/lib/api/client';
import {ClientSelector} from './ClientSelector';
import {JobItemDetailsSection} from './JobItemDetailsSection';
import {JobCrystalSection} from './JobCrystalSection';
import {JobChargesAndAdvanceSection} from './JobChargesAndAdvanceSection';
import {AddCrystalModal} from './AddCrystalModal';
import {useGetCrystal, useSaveJob} from './jobcreationapi';

interface AddJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clients: Client[];
  clientsLoading: boolean;
  onAddNewClient: () => void;
}

export interface SelectedCrystalRow {
  id: string;
  isClient?: boolean;
  name: string;
  shape: string;
  color: string;
  weight: number;
  qty: number;
  amount: number;
  size: string;
}

export const AddJobModal: React.FC<AddJobModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  clients,
  clientsLoading,
  onAddNewClient,
}) => {
  const saveJobMutation = useSaveJob();
  const {data: allCrystalsData, refetch: refetchCrystals} = useGetCrystal();

  const allCrystals: any[] = Array.isArray(allCrystalsData?.data || allCrystalsData)
    ? allCrystalsData?.data || allCrystalsData
    : [];

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showAddCrystalModal, setShowAddCrystalModal] = useState(false);
  const [selectedCrystalObj, setSelectedCrystalObj] = useState<any>(null);
  const [selectedCrystalsList, setSelectedCrystalsList] = useState<SelectedCrystalRow[]>([]);

  // Job Item Form State
  const [itemData, setItemData] = useState<{
    itemName: string;
    description: string;
    metal: 'GOLD' | 'SILVER';
    grossWt?: number;
    fineWt?: number;
    purity?: number;
    deliveryDate: string;
    images: File[];
    imagePreviews: string[];
  }>({
    itemName: '',
    description: '',
    metal: 'GOLD',
    grossWt: undefined,
    fineWt: undefined,
    purity: 91.6,
    deliveryDate: new Date().toISOString().split('T')[0],
    images: [],
    imagePreviews: [],
  });

  // Making charges and advances
  const [metalMakingCharges, setMetalMakingCharges] = useState({
    enteredValue: 0,
    calculatedValue: 0,
  });
  const [cashMakingCharges, setCashMakingCharges] = useState({
    subtype: '',
    enteredValue: 0,
    calculatedValue: 0,
  });
  const [cashAdvance, setCashAdvance] = useState(0);
  const [goldAdvance, setGoldAdvance] = useState(0);
  const [silverAdvance, setSilverAdvance] = useState(0);

  if (!isOpen) return null;

  const convertToFormData = () => {
    const formData = new FormData();
    if (selectedClient) formData.append('clientId', selectedClient.id);
    if (itemData.itemName) formData.append('itemName', itemData.itemName);
    if (itemData.description) formData.append('description', itemData.description);
    if (itemData.metal) formData.append('metal', itemData.metal);
    if (itemData.grossWt) formData.append('grossWeight', itemData.grossWt.toString());
    if (itemData.fineWt) {
      formData.append('fineWeight', itemData.fineWt.toString());
      formData.append('netWeight', itemData.fineWt.toString());
    }
    if (itemData.purity) formData.append('purity', itemData.purity.toString());
    if (itemData.deliveryDate) {
      formData.append('deliveryDate', new Date(itemData.deliveryDate).toISOString());
    }

    if (cashAdvance) formData.append('cashAdvance', cashAdvance.toString());
    if (goldAdvance) formData.append('goldAdvance', goldAdvance.toString());
    if (silverAdvance) formData.append('silverAdvance', silverAdvance.toString());

    if (metalMakingCharges.enteredValue > 0) {
      formData.append('makingChargesType', 'METAL');
      formData.append('makingChargesSubType', '');
      formData.append('makingChargesValue', metalMakingCharges.enteredValue.toString());
      formData.append('makingChargesAmount', metalMakingCharges.calculatedValue.toString());
    }

    if (cashMakingCharges.subtype && cashMakingCharges.enteredValue > 0) {
      formData.append('cashMakingChargesType', 'CASH');
      formData.append('cashMakingChargesSubType', cashMakingCharges.subtype);
      formData.append('cashMakingChargesValue', cashMakingCharges.enteredValue.toString());
      formData.append('cashMakingChargesAmount', cashMakingCharges.calculatedValue.toString());
    }

    if (itemData.images?.length) {
      itemData.images.forEach((img) => formData.append('images', img));
    }

    const shopCrystals = selectedCrystalsList
      .filter((c) => !c.isClient)
      .map((c) => ({crystalId: c.id, qty: c.qty}));

    const clientCrystals = selectedCrystalsList
      .filter((c) => c.isClient)
      .map((c) => ({
        name: c.name,
        weight: c.weight,
        size: c.size,
        color: c.color,
        shape: c.shape,
        qty: c.qty,
      }));

    if (shopCrystals.length) {
      formData.append('crystalIds', JSON.stringify(shopCrystals));
    }
    if (clientCrystals.length) {
      formData.append('clientCrystals', JSON.stringify(clientCrystals));
    }

    return formData;
  };

  const handleSubmit = async () => {
    if (!selectedClient) {
      toast.error('Please select a client');
      return;
    }
    if (!itemData.itemName?.trim()) {
      toast.error('Please enter item name');
      return;
    }
    if (!itemData.grossWt || itemData.grossWt <= 0) {
      toast.error('Please enter valid gross weight');
      return;
    }
    if (!itemData.purity || itemData.purity <= 0) {
      toast.error('Please enter valid purity');
      return;
    }

    const formData = convertToFormData();
    saveJobMutation.mutate(formData, {
      onSuccess: () => {
        onSuccess();
        onClose();
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm">
      <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#d3c4af]/20 bg-[#f9f9f7] shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#d3c4af]/10 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <h2 className="font-['Playfair_Display'] text-lg font-bold text-[#1a1c1b] dark:text-white">
              Add New Job...
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          {/* Client Selection with integrated Add New Client inside dropdown */}
          <ClientSelector
            clients={clients}
            selectedClient={selectedClient}
            onSelectClient={setSelectedClient}
            onAddNewClient={onAddNewClient}
            isLoading={clientsLoading}
          />

          {/* Job Item Details */}
          <JobItemDetailsSection
            item={itemData}
            onChange={setItemData}
          />

          {/* Crystal Details */}
          <JobCrystalSection
            allCrystals={allCrystals}
            selectedCrystalsList={selectedCrystalsList}
            onAddCrystal={(row) => setSelectedCrystalsList((prev) => [...prev, row])}
            onRemoveCrystal={(index) =>
              setSelectedCrystalsList((prev) => prev.filter((_, i) => i !== index))
            }
            onOpenAddCrystalModal={() => setShowAddCrystalModal(true)}
            selectedCrystalObj={selectedCrystalObj}
            onSelectCrystalObj={setSelectedCrystalObj}
          />

          {/* Making Charges & Advances */}
          <JobChargesAndAdvanceSection
            metal={itemData.metal}
            grossWt={itemData.grossWt}
            metalMakingCharges={metalMakingCharges}
            onMetalMakingChargesChange={setMetalMakingCharges}
            cashMakingCharges={cashMakingCharges}
            onCashMakingChargesChange={setCashMakingCharges}
            cashAdvance={cashAdvance}
            onCashAdvanceChange={setCashAdvance}
            goldAdvance={goldAdvance}
            onGoldAdvanceChange={setGoldAdvance}
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-[#d3c4af]/10 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#d3c4af]/50 px-5 py-2 text-sm font-medium text-[#4f4535] transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saveJobMutation.isPending}
            className="flex items-center gap-2 rounded-lg bg-[#785600] px-6 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#634700] disabled:opacity-50"
          >
            {saveJobMutation.isPending ? 'Submitting...' : 'Create Job'}
          </button>
        </div>
      </div>

      {/* Add Crystal Modal */}
      <AddCrystalModal
        isOpen={showAddCrystalModal}
        onClose={() => setShowAddCrystalModal(false)}
        onSuccess={(created) => {
          refetchCrystals();
          if (created?.id || created?._id) {
            setSelectedCrystalObj(created);
          }
        }}
      />
    </div>
  );
};

export default AddJobModal;

import React, {useState} from 'react';
import {ChevronDown, ChevronUp, Plus, X} from 'lucide-react';
import toast from 'react-hot-toast';
import {SelectedCrystalRow} from './AddJobModal';
import GenericSearchDropdown, {
  DropdownItem,
} from '@/components/Forms/DropDown/GenericSearchDropdown';

interface JobCrystalSectionProps {
  allCrystals: any[];
  selectedCrystalsList: SelectedCrystalRow[];
  onAddCrystal: (row: SelectedCrystalRow) => void;
  onRemoveCrystal: (index: number) => void;
  onOpenAddCrystalModal: () => void;
  selectedCrystalObj: any;
  onSelectCrystalObj: (crystal: any) => void;
}

export const JobCrystalSection: React.FC<JobCrystalSectionProps> = ({
  allCrystals,
  selectedCrystalsList,
  onAddCrystal,
  onRemoveCrystal,
  onOpenAddCrystalModal,
  selectedCrystalObj,
  onSelectCrystalObj,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [crystalType, setCrystalType] = useState<'Shop' | 'Client'>('Shop');
  const [qty, setQty] = useState(1);

  // Client crystal input
  const [clientName, setClientName] = useState('');
  const [clientWeight, setClientWeight] = useState(0);

  const crystalDropdownItems: DropdownItem[] = allCrystals.map((c: any) => ({
    id: String(c.id || c._id || ''),
    title: c.name || 'Crystal',
    subtitle: `${c.shape || 'Round'} • ${c.color || 'G'} • ${c.wt || 0}g`,
    extra: `₹${c.amount || c.rate || 0}`,
    data: c,
  }));

  const currentSelectedCrystalItem: DropdownItem | null = selectedCrystalObj
    ? {
        id: String(selectedCrystalObj.id || selectedCrystalObj._id || ''),
        title: selectedCrystalObj.name
          ? `${selectedCrystalObj.name} (${selectedCrystalObj.shape || 'Round'})`
          : 'Crystal',
        data: selectedCrystalObj,
      }
    : null;

  const handleAdd = () => {
    if (crystalType === 'Shop') {
      if (!selectedCrystalObj) {
        toast.error('Please select a crystal');
        return;
      }
      const newRow: SelectedCrystalRow = {
        id: String(
          selectedCrystalObj.id || selectedCrystalObj._id || Date.now(),
        ),
        isClient: false,
        name: selectedCrystalObj.name || 'Crystal',
        shape: selectedCrystalObj.shape || 'Round',
        color: selectedCrystalObj.color || 'G',
        weight: parseFloat(
          String(selectedCrystalObj.wt || selectedCrystalObj.weight || 0),
        ),
        qty: Number(qty) || 1,
        amount:
          parseFloat(
            String(selectedCrystalObj.amount || selectedCrystalObj.rate || 0),
          ) * (Number(qty) || 1),
        size: selectedCrystalObj.size || 'Medium',
      };
      onAddCrystal(newRow);
      onSelectCrystalObj(null);
      setQty(1);
    } else {
      if (!clientName.trim()) {
        toast.error('Please enter crystal name');
        return;
      }
      const newRow: SelectedCrystalRow = {
        id: `client_${Date.now()}`,
        isClient: true,
        name: clientName,
        shape: 'Round',
        color: 'G',
        weight: parseFloat(String(clientWeight || 0)),
        qty: Number(qty) || 1,
        amount: 0,
        size: 'Medium',
      };
      onAddCrystal(newRow);
      setClientName('');
      setClientWeight(0);
      setQty(1);
    }
  };

  return (
    <div className="rounded-2xl border border-[#d3c4af]/20 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex cursor-pointer items-center justify-between"
      >
        <h3 className="font-['Playfair_Display'] text-sm font-bold text-[#785600] dark:text-amber-400">
          Crystal Details
        </h3>
        <button type="button" className="text-slate-400">
          {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="mt-4 space-y-4 border-t border-[#d3c4af]/10 pt-4 dark:border-slate-800">
          {/* Inputs Row */}
          <div className="flex flex-wrap items-end gap-3">
            {/* Type */}
            <div className="w-32">
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                TYPE
              </label>
              <select
                value={crystalType}
                onChange={(e) => {
                  setCrystalType(e.target.value as 'Shop' | 'Client');
                  onSelectCrystalObj(null);
                }}
                className="w-full rounded-xl border border-[#d3c4af]/30 bg-white px-3 py-2.5 text-sm text-[#1a1c1b] outline-none transition-all focus:border-[#785600] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="Shop">Shop</option>
                <option value="Client">Client</option>
              </select>
            </div>

            {/* Crystal Combobox or Client Input */}
            {crystalType === 'Shop' ? (
              <div className="min-w-[220px] flex-1">
                <GenericSearchDropdown
                  label="CRYSTAL"
                  placeholder="Type to search crystal..."
                  items={crystalDropdownItems}
                  selectedItem={currentSelectedCrystalItem}
                  onSelect={(item) => onSelectCrystalObj(item?.data || null)}
                  onAddNew={onOpenAddCrystalModal}
                  addNewLabel="Add New Crystal"
                />
              </div>
            ) : (
              <div className="flex min-w-[220px] flex-1 flex-wrap items-end gap-2">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                    CRYSTAL NAME
                  </label>
                  <input
                    type="text"
                    placeholder="Client stone name"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full rounded-xl border border-[#d3c4af]/30 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#785600] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div className="w-24">
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                    WT (g)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={clientWeight || ''}
                    onChange={(e) =>
                      setClientWeight(parseFloat(e.target.value) || 0)
                    }
                    className="w-full rounded-xl border border-[#d3c4af]/30 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#785600] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* QTY */}
            <div className="w-20">
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[#4f4535] dark:text-slate-400">
                QTY
              </label>
              <input
                type="number"
                min="1"
                value={qty}
                onChange={(e) =>
                  setQty(Math.max(1, Number(e.target.value) || 1))
                }
                className="w-full rounded-xl border border-[#d3c4af]/30 bg-white px-3 py-2.5 text-sm text-[#1a1c1b] outline-none focus:border-[#785600] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Add Button (+) */}
            <button
              type="button"
              onClick={handleAdd}
              className="flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-[#785600] text-white shadow-sm transition-all hover:bg-[#986d00]"
              title="Add Crystal"
            >
              <Plus size={20} />
            </button>
          </div>

          {/* Selected Crystals Table */}
          {selectedCrystalsList.length > 0 && (
            <div className="mt-4 overflow-hidden rounded-xl border border-[#d3c4af]/20 bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-[#d3c4af]/10 bg-[#f9f9f7]/60 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-800/40">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Selected Crystals
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {selectedCrystalsList.length} added
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#d3c4af]/10 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-[#4f4535] dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
                      <th className="px-4 py-3">Crystal</th>
                      <th className="px-4 py-3">Shape</th>
                      <th className="px-4 py-3">Color</th>
                      <th className="px-4 py-3">Weight</th>
                      <th className="px-4 py-3">Qty</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Size</th>
                      <th className="px-4 py-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d3c4af]/10 dark:divide-slate-800">
                    {selectedCrystalsList.map((row, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                      >
                        <td className="px-4 py-3 font-semibold text-[#1a1c1b] dark:text-white">
                          {row.name}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {row.shape}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {row.color}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {row.weight} g
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {row.qty}
                        </td>
                        <td className="px-4 py-3 font-medium text-[#785600] dark:text-amber-400">
                          {row.amount > 0 ? `₹${row.amount}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {row.size}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => onRemoveCrystal(idx)}
                            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                          >
                            <X size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JobCrystalSection;

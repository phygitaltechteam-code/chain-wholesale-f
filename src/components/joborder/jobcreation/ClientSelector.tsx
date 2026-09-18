import React from 'react';
import {Client} from '@/lib/api/client';
import GenericSearchDropdown, {DropdownItem} from '@/components/Forms/DropDown/GenericSearchDropdown';

interface ClientSelectorProps {
  clients: Client[];
  selectedClient: Client | null;
  onSelectClient: (client: Client | null) => void;
  onAddNewClient: () => void;
  isLoading?: boolean;
}

export const ClientSelector: React.FC<ClientSelectorProps> = ({
  clients,
  selectedClient,
  onSelectClient,
  onAddNewClient,
}) => {
  const items: DropdownItem[] = clients.map((c) => ({
    id: String(c.id || ''),
    title: c.fullName || 'Unnamed Client',
    subtitle: `${c.phoneNumber || 'No phone'}${c.address ? ` • ${c.address}` : ''}`.trim(),
    data: c,
  }));

  const currentSelectedItem: DropdownItem | null = selectedClient
    ? {
        id: String(selectedClient.id || ''),
        title: selectedClient.fullName,
        subtitle: selectedClient.phoneNumber,
        data: selectedClient,
      }
    : null;

  return (
    <div className="rounded-2xl border border-[#d3c4af]/20 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <GenericSearchDropdown
        label="Client Information"
        required
        placeholder="Type to search client by name or phone..."
        items={items}
        selectedItem={currentSelectedItem}
        onSelect={(item) => onSelectClient(item?.data || null)}
        onAddNew={onAddNewClient}
        addNewLabel="Add New Client"
      />
    </div>
  );
};

export default ClientSelector;

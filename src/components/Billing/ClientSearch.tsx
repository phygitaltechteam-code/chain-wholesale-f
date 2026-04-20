// components/ClientSearch.tsx
import React, {useState} from 'react';
import {Search, X, UserPlus} from 'lucide-react';
import {useNavigate} from '@tanstack/react-router';
import {Client} from './billing.types';

interface ClientSearchProps {
  selectedClient: Client | null;
  onSelectClient: (client: Client) => void;
  onClearClient: () => void;
  clients: Client[];
  isLoading?: boolean;
}

export const ClientSearch: React.FC<ClientSearchProps> = ({
  selectedClient,
  onSelectClient,
  onClearClient,
  clients,
  isLoading,
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredClients = clients.filter(
    (client) =>
      client.fullname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phoneNumber?.includes(searchQuery),
  );

  const handleAddClient = () => {
    navigate({to: '/client/clientdirectory'});
  };

  return (
    <div className="rounded-xl border border-[#d3c4af]/10 bg-white p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between md:mb-6">
        <h3 className="font-['Noto_Serif'] text-lg font-bold text-[#785600] md:text-xl">
          Client Details
        </h3>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4f4535] md:h-5 md:w-5" />

        {selectedClient ? (
          <div className="flex items-center justify-between rounded-lg bg-[#f4f4f2] py-3 pl-10 pr-3 md:py-4 md:pl-12 md:pr-4">
            <div className="flex-1">
              <p className="text-sm font-bold text-[#1a1c1b]">
                {selectedClient.fullname} - {selectedClient.phoneNumber}
              </p>
              {selectedClient.address && (
                <p className="text-xs text-[#4f4535]">
                  {selectedClient.address}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClearClient}
              className="ml-2 rounded-full p-1 transition-colors hover:bg-[#e8e8e6]"
            >
              <X size={16} className="text-[#4f4535]" />
            </button>
          </div>
        ) : (
          <>
            <input
              className="w-full rounded-lg border-0 bg-[#f4f4f2] py-3 pl-10 pr-3 text-sm text-[#1a1c1b] outline-none focus:ring-2 focus:ring-[#785600]/20 md:py-4 md:pl-12 md:pr-4"
              placeholder="Search by name or phone..."
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
            />

            {/* Show "No clients found" message */}
            {!selectedClient &&
              showDropdown &&
              searchQuery &&
              filteredClients.length === 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border border-[#d3c4af]/30 bg-white shadow-lg">
                  <div className="p-4 text-center">
                    <p className="text-sm text-[#4f4535]">No clients found</p>
                    <button
                      onClick={handleAddClient}
                      className="mt-2 text-sm font-medium text-[#785600] hover:underline"
                    >
                      + Add new client
                    </button>
                  </div>
                </div>
              )}
          </>
        )}

        {!selectedClient && showDropdown && filteredClients.length > 0 && (
          <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-[#d3c4af]/30 bg-white shadow-lg">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                className="cursor-pointer border-b border-[#f4f4f2] p-3 transition-colors hover:bg-[#f4f4f2]"
                onClick={() => {
                  onSelectClient(client);
                  setSearchQuery(client.fullname);
                  setShowDropdown(false);
                }}
              >
                <p className="text-sm font-bold text-[#1a1c1b]">
                  {client.fullname}
                </p>
                <p className="text-xs text-[#4f4535]">{client.phoneNumber}</p>
                {client.address && (
                  <p className="mt-1 text-xs text-[#4f4535]">
                    {client.address}
                  </p>
                )}
              </div>
            ))}

            {/* Add client option at bottom of dropdown */}
            <div
              className="cursor-pointer border-t border-[#d3c4af]/20 bg-[#f9f9f7] p-3 transition-colors hover:bg-[#f4f4f2]"
              onClick={handleAddClient}
            >
              <div className="flex items-center gap-2 text-[#785600]">
                <UserPlus className="h-4 w-4" />
                <span className="text-sm font-medium">Add New Client</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="mt-2 text-center text-xs text-[#4f4535]">
          Loading clients...
        </div>
      )}
    </div>
  );
};

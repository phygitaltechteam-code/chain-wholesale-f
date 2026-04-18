import {useEffect, useState} from 'react';
import {
  Search,
  UserPlus,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';
import AddClient from './AddClient';
import {useNavigate} from '@tanstack/react-router';
import GenericTable, {Column} from '../Forms/Table/GenericTable';
import PageHeader from '../Forms/Common/PageHeader';
import { useGetClient } from './api';
// Mock data
const mockClients = [
  {
    id: 1,
    name: 'Vikram Singh',
    initials: 'VS',
    tier: 'Premium Tier',
    phone: '+91 98765 43210',
    city: 'Jaipur, Rajasthan',
    balance: 245000,
    gold: '45.50',
    silver: '850.00',
    gst: '27AAAAA0000A1Z5',
    pan: 'ABCDE1234F',
    aadhaar: '1234 5678 9012',
    address: '123, Jewelry Market, Jaipur',
  },
  {
    id: 2,
    name: 'Ananya Mehta',
    initials: 'AM',
    tier: 'Standard',
    phone: '+91 88221 00456',
    city: 'Udaipur, Rajasthan',
    balance: 12400,
    gold: '120.25',
    silver: '0.00',
    gst: '27BBBBB0000B1Z7',
    pan: 'FGHIJ5678K',
    aadhaar: '2345 6789 0123',
    address: '456, Lake City, Udaipur',
  },
  {
    id: 3,
    name: 'Rajesh Khanna',
    initials: 'RK',
    tier: 'Premium Tier',
    phone: '+91 99004 55678',
    city: 'Surat, Gujarat',
    balance: -450000,
    gold: '500.00',
    silver: '2400.00',
    gst: '24CCCCC0000C1Z8',
    pan: 'KLMNO7890P',
    aadhaar: '3456 7890 1234',
    address: '789, Diamond Market, Surat',
  },
];

interface Client {
  id: number;
  fullname: string;
  initials: string;
  tier: string;
  phoneNumber: string;
  city: string;
  balance: number;
  gold: string;
  silver: string;
  gst: string;
  pan: string;
  aadhaar: string;
  address: string;
}

export default function ClientDirectory() {
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  // const [clients, setClients] = useState<Client[]>(mockClients);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  
    // In real implementation, fetch clients from API here
   const {data}  =useGetClient()
   console.log(data);


 const clients: Client[] =
  data?.map((item: any) => ({
    fullname: item.fullname,
    phoneNumber: item.phoneNumber,
    city: item.city,
    balance: item.balance,
    gold: item.gold,
    silver: item.silver,
    initials: item.fullname
      ?.split(" ")
      .map((w: string) => w[0])
      .join("")
      .toUpperCase(),
    tier: item.tier || "regular",
  })) || [];
  

  const handleAddClient = (newClientData: any) => {
    const newClient: Client = {
      id: clients.length + 1,
      fullname: newClientData.name,
      initials: newClientData.fullname
        .split(' ')
        .map((n: string) => n[0])
        .join(''),
      tier: 'Standard',
      phoneNumber: newClientData.phone,
      city: newClientData.city,
      balance: 0,
      gold: '0.00',
      silver: '0.00',
      gst: newClientData.gst,
      pan: newClientData.pan,
      aadhaar: newClientData.aadhaar,
      address: newClientData.address,
    };

    // setClients([...clients, newClient]);
  };

  const handleClientClick = (client: Client) => {
    navigate({
      to: '/client/clientdetails',
      // state: client,
    });
  };

  const handleEditClient = (client: Client) => {
    console.log('Edit client:', client);
    // Add edit logic here
  };

  const handleDeleteClient = (client: Client) => {
    if (confirm(`Are you sure you want to delete ${client.fullname}?`)) {
      // setClients(clients.filter((c) => c.id !== client.id));
    }
  };

  const handleViewClient = (client: Client) => {
    navigate({
      to: '/client/clientdetails',
      // state: client,
    });
  };

  // Filter clients based on search
  const filteredClients = clients.filter(
    (client) =>
      client.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phoneNumber.includes(searchTerm),
  );

  // Define table columns
  const columns: Column<Client>[] = [
    {
      header: 'Client Name',
      accessor: 'fullname',
      align: 'left',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#785600]/10 text-sm font-bold text-[#785600]">
            {item.initials}
          </div>
          <div>
            <p className="font-bold text-[#1a1c1b]">{item.fullname}</p>
            <p className="text-[10px] font-bold uppercase tracking-tighter text-[#785600]">
              {item.tier}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'Contact & City',
      accessor: 'phoneNumber',
      align: 'left',
      render: (item) => (
        <div>
          <p className="text-sm text-[#4f4535]">{item.phoneNumber}</p>
          <p className="text-xs text-[#4f4535]">{item.city}</p>
        </div>
      ),
    },
    {
      header: 'Balance (₹)',
      accessor: 'balance',
      align: 'right',
      render: (item) => (
        <span
          className="font-bold"
          style={{
            color: item.balance < 0 ? '#ba1a1a' : '#1a1c1b',
          }}
        >
          {item.balance < 0
            ? `-₹${Math.abs(item.balance).toLocaleString()}`
            : `₹${(item.balance ?? 0).toLocaleString()}`}
        </span>
      ),
    },
    {
      header: 'Gold (g)',
      accessor: 'gold',
      align: 'right',
      render: (item) => (
        <span className="inline-block rounded-full bg-[#785600]/5 px-3 py-1 text-sm font-bold text-[#785600]">
          {item.gold} g
        </span>
      ),
    },
    {
      header: 'Silver (g)',
      accessor: 'silver',
      align: 'right',
      render: (item) => (
        <span className="font-medium text-[#5d5c74]">{item.silver} g</span>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#f9f9f7]">
      {/* Responsive Padding */}
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end lg:gap-6">
            <PageHeader
              title="Client Directory"
              subtitle="Manage your curated list of elite investors and collectors."
            />

            {/* Action Buttons */}
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4">
              {/* Search Bar */}
              <div className="group relative flex-1 sm:flex-initial">
                <Search className="text-outline absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 sm:left-4 sm:h-5 sm:w-5" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-[#d3c4af]/30 bg-white py-2.5 pl-9 pr-4 text-sm outline-none transition-all placeholder:text-[#817563] focus:border-[#785600] focus:ring-2 focus:ring-[#785600]/10 sm:w-72 sm:py-3 sm:pl-11"
                  placeholder="Search clients..."
                  type="text"
                />
              </div>

              {/* Add Client Button */}
              <button
                onClick={() => setIsAddDrawerOpen(true)}
                className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-[#785600] to-[#986d00] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] sm:px-6 sm:py-3 sm:text-base"
              >
                <UserPlus className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Add Client</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:mb-8 lg:grid-cols-4">
          <div className="rounded-xl border border-[#d3c4af]/10 bg-white p-4 shadow-sm">
            <p className="mb-1 text-xs text-[#4f4535]">Total Clients</p>
            <p className="text-2xl font-bold text-[#1a1c1b]">
              {clients.length}
            </p>
          </div>
          <div className="rounded-xl border border-[#d3c4af]/10 bg-white p-4 shadow-sm">
            <p className="mb-1 text-xs text-[#4f4535]">Premium Tier</p>
            <p className="text-2xl font-bold text-[#785600]">
              {clients.filter((c) => c.tier === 'Premium Tier').length}
            </p>
          </div>
          <div className="rounded-xl border border-[#d3c4af]/10 bg-white p-4 shadow-sm">
            <p className="mb-1 text-xs text-[#4f4535]">Total Balance</p>
            <p className="text-xl font-bold text-[#1a1c1b]">
              ₹
              {clients
                .reduce((sum, c) => sum + Math.abs(c.balance), 0)
                .toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-[#d3c4af]/10 bg-white p-4 shadow-sm">
            <p className="mb-1 text-xs text-[#4f4535]">Active Clients</p>
            <p className="text-2xl font-bold text-green-600">
              {clients.length}
            </p>
          </div>
        </div>

        {/* Generic Table */}
        <GenericTable
          data={filteredClients}
          columns={columns}
          title=""
          searchable={false}
          itemsPerPage={8}
          onView={handleViewClient}
          onEdit={handleEditClient}
          onDelete={handleDeleteClient}
          onRowClick={handleClientClick}
          emptyMessage="No clients found matching your search."
        />

        {/* Add Client Drawer */}
        <AddClient
          isOpen={isAddDrawerOpen}
          onClose={() => setIsAddDrawerOpen(false)}
          onSave={handleAddClient}
        />

        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Manrope:wght@400;500;600;700&display=swap');
          
          .font-headline {
            font-family: 'Noto Serif', serif;
          }
          
          .shadow-sm {
            box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.05);
          }
          
          .text-on-surface {
            color: #1a1c1b;
          }
          
          .text-on-surface-variant {
            color: #4f4535;
          }
          
          .text-outline {
            color: #817563;
          }
        `}</style>
      </div>
    </div>
  );
}

import React, {useState} from 'react';
import {
  ShoppingCart,
  Calendar,
  Truck,
  BarChart3,
  FileText,
  Users,
  Bell,
  UserCircle,
  Download,
  Printer,
  RefreshCw,
  Plus,
  Edit,
  Stars,
  Diamond,
} from 'lucide-react';
import {FaSellcast} from 'react-icons/fa';
import {
  MdAccountBalance,
  MdContactPage,
  MdEngineering,
  MdHourglassEmpty,
  MdInventory2,
  MdPayments,
  MdReceipt,
  MdVerifiedUser,
} from 'react-icons/md';
import {IoArrowForward} from 'react-icons/io5';
import {GenericTable, Column} from '@/components/Forms/Table/GenericTable';
import Account from '@/components/account/Account';

interface User {
  id: string;
  name: string;
  initials: string;
  role: string;
  status: 'active' | 'inactive';
  color: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  fee: string;
  icon: React.ReactNode;
  bgColor: string;
  iconColor: string;
  enabled: boolean;
}

const usersData: User[] = [
  {
    id: '1',
    name: 'Amit Sharma',
    initials: 'AS',
    role: 'Store Manager',
    status: 'active',
    color: 'bg-[#785600]/10',
  },
  {
    id: '2',
    name: 'Rajesh Kumar',
    initials: 'RK',
    role: 'Sales Associate',
    status: 'active',
    color: 'bg-[#D3C4AF]/20',
  },
  {
    id: '3',
    name: 'Sneha Mehta',
    initials: 'SM',
    role: 'Accountant',
    status: 'inactive',
    color: 'bg-[#F4F4F2]',
  },
];

const productsData: Product[] = [
  {
    id: '1',
    name: '24K Gold Bullion',
    description: 'Standard 999.9 Purity',
    fee: '₹450/kg Fee',
    icon: <Diamond className="h-6 w-6" />,
    bgColor: 'bg-[#f4d48a]/20',
    iconColor: 'text-[#785600]',
    enabled: true,
  },
  {
    id: '2',
    name: '999 Silver Coin',
    description: 'Sterling Standard',
    fee: '₹85/kg Fee',
    icon: <MdPayments className="h-6 w-6" />,
    bgColor: 'bg-[#F4F4F2]',
    iconColor: 'text-[#5E5B56]',
    enabled: true,
  },
  {
    id: '3',
    name: 'Platinum Rings',
    description: 'PT 950 Hallmark',
    fee: '₹1,200/kg Fee',
    icon: <Stars className="h-6 w-6" />,
    bgColor: 'bg-[#f4d48a]/10',
    iconColor: 'text-[#785600]',
    enabled: false,
  },
];

const tabs = [
  {id: 'shopInfo', label: 'Shop Info'},
  {id: 'users', label: 'Users'},
  {id: 'products', label: 'Products'},
  {id: 'locations', label: 'Locations'},
  {id: 'tax', label: 'Tax/HSN'},
  {id: 'printConfig', label: 'Print Config'},
  {
    id: 'account',
    label: 'Account',
  },
];

// Toggle Switch Component
function ToggleSwitch({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: () => void;
}) {
  return (
    <div className="relative mr-2 inline-block w-10 select-none align-middle transition duration-200 ease-in">
      <input
        type="checkbox"
        checked={enabled}
        onChange={onChange}
        className={`toggle-checkbox absolute block h-6 w-6 cursor-pointer appearance-none rounded-full border-4 bg-white transition-all duration-200 ease-in-out ${
          enabled ? 'right-0 border-[#785600]' : 'right-4 border-[#D3C4AF]'
        }`}
      />
      <label
        className={`toggle-label block h-6 cursor-pointer overflow-hidden rounded-full ${
          enabled ? 'bg-[#785600]' : 'bg-[#D3C4AF]/50'
        }`}
      ></label>
    </div>
  );
}

const Setting = () => {
  const [activeTab, setActiveTab] = useState('shopInfo');
  const [users, setUsers] = useState(usersData);
  const [products, setProducts] = useState(productsData);

  const toggleProduct = (productId: string) => {
    setProducts(
      products.map((product) =>
        product.id === productId
          ? {...product, enabled: !product.enabled}
          : product,
      ),
    );
  };

  // Define columns for GenericTable
  const userColumns: Column<User>[] = [
    {
      header: 'Name',
      accessor: (item) => (
        <div className="flex items-center gap-3">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-[#1A1C1B] ${item.color}`}
          >
            {item.initials}
          </div>
          <span className="font-medium text-[#1A1C1B]">{item.name}</span>
        </div>
      ),
      align: 'left',
    },
    {
      header: 'Role',
      accessor: (item) => (
        <span className="text-sm text-[#5E5B56]">{item.role}</span>
      ),
      align: 'left',
    },
    {
      header: 'Status',
      accessor: (item) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            item.status === 'active'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {item.status === 'active' ? 'Active' : 'Inactive'}
        </span>
      ),
      align: 'left',
    },
    {
      header: 'Actions',
      accessor: (item) => (
        <button className="text-sm font-bold text-[#785600] hover:underline">
          Edit
        </button>
      ),
      align: 'left',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F9F7F3]">
      {/* Main Content Area */}
      <main className="min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-40 flex w-full items-center justify-between bg-[#f9f9f7] px-8 py-4 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-4">
            <h1 className="font-serif text-2xl font-bold text-[#1A1C1B]">
              Settings
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative">
              <Bell className="h-5 w-5 cursor-pointer text-[#5E5B56]" />
              <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-red-600"></span>
            </div>
            <UserCircle className="h-5 w-5 cursor-pointer text-[#5E5B56]" />
          </div>
        </header>

        {/* Content Canvas */}
        <div className="mx-auto max-w-7xl p-12">
          {/* Horizontal Tabs */}
          <div className="scrollbar-hide mb-12 flex gap-8 overflow-x-auto whitespace-nowrap border-b border-[#D3C4AF]/20">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-[#785600] text-[#785600]'
                    : 'text-[#5E5B56] hover:text-[#785600]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Account Tab Content - Imported from separate component */}
          {activeTab === 'account' ? (
            <Account />
          ) : (
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
              {/* Left Column - Shop Info & Users */}
              <div className="space-y-10 lg:col-span-2">
                {/* Shop Info Section */}
                {activeTab === 'shopInfo' && (
                  <section>
                    <h3 className="font-serif mb-6 text-xl font-bold text-[#1A1C1B]">
                      Store Identity
                    </h3>
                    <div className="rounded-lg border border-[#D3C4AF]/10 bg-white p-8 shadow-lg shadow-[#785600]/5">
                      <div className="mb-10 flex items-center gap-8">
                        <div className="group relative">
                          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg border border-[#D3C4AF]/30 bg-[#F4F4F2]">
                            <img
                              alt="Store Logo"
                              className="h-full w-full object-cover"
                              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBfNGT0fFFu34Q5jKEN1tnjSkGOfy5snQcgHaabCu1aYSVE5-vF4fNRw_k3RLK9ttc-PQpsdtg_q4UvSUSePTWEsMfylQ_OCxpOvr-J_Kymhz-552v6B0_1Lx0BB5YkqkVfQj22bfR5-UsRQA6SOKLnPLuQGub0NMPXwITO3pIDzwyGy-XQ1VMqUr97KukSMKU4S4mQJmleBkVjseGv8VSr0_V8NuqXomMUuRCdcUJ6mFlUWYFsHDHC8YA5sii97qDt5p6zfFiAWRZv"
                            />
                          </div>
                          <button className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#785600] text-white shadow-lg transition-transform hover:scale-105">
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                        <div>
                          <h4 className="font-bold text-[#1A1C1B]">
                            Store Logo
                          </h4>
                          <p className="text-sm text-[#5E5B56]">
                            Upload your brand identity for invoices and reports.
                          </p>
                        </div>
                      </div>
                      <form className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-[#5E5B56]">
                            Store Name
                          </label>
                          <input
                            type="text"
                            defaultValue="Royal Bullion & Jewels"
                            className="w-full rounded border border-[#D3C4AF]/20 bg-white py-3 text-[#1A1C1B] focus:border-[#785600] focus:outline-none focus:ring-1 focus:ring-[#785600]"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-[#5E5B56]">
                            GST Number
                          </label>
                          <input
                            type="text"
                            placeholder="27AAAAA0000A125"
                            className="w-full rounded border border-[#D3C4AF]/20 bg-white py-3 text-[#1A1C1B] focus:border-[#785600] focus:outline-none focus:ring-1 focus:ring-[#785600]"
                          />
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-[#5E5B56]">
                            Store Address
                          </label>
                          <textarea
                            rows={3}
                            defaultValue="102, Gold Souk, Zaveri Bazaar, Mumbai, Maharashtra 400002"
                            className="w-full rounded border border-[#D3C4AF]/20 bg-white py-3 text-[#1A1C1B] focus:border-[#785600] focus:outline-none focus:ring-1 focus:ring-[#785600]"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-[#5E5B56]">
                            PAN Number
                          </label>
                          <input
                            type="text"
                            placeholder="ABCDE1234F"
                            className="w-full rounded border border-[#D3C4AF]/20 bg-white py-3 text-[#1A1C1B] focus:border-[#785600] focus:outline-none focus:ring-1 focus:ring-[#785600]"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-[#5E5B56]">
                            Contact Phone
                          </label>
                          <input
                            type="tel"
                            defaultValue="+91 98765 43210"
                            className="w-full rounded border border-[#D3C4AF]/20 bg-white py-3 text-[#1A1C1B] focus:border-[#785600] focus:outline-none focus:ring-1 focus:ring-[#785600]"
                          />
                        </div>
                      </form>
                    </div>
                  </section>
                )}

                {/* Users Section */}
                {(activeTab === 'shopInfo' || activeTab === 'users') && (
                  <section>
                    <div className="mb-6 flex items-end justify-between">
                      <h3 className="font-serif text-xl text-[#1A1C1B]">
                        User Access
                      </h3>
                      <button className="flex items-center gap-2 rounded-full bg-[#785600] px-6 py-2.5 text-sm font-bold text-white shadow-lg transition-colors hover:bg-[#986d00]">
                        <Plus className="h-4 w-4" />
                        Add User
                      </button>
                    </div>
                    <div className="overflow-hidden rounded-lg border border-[#D3C4AF]/10 bg-white shadow-lg shadow-[#785600]/5">
                      <GenericTable
                        data={users}
                        columns={userColumns}
                        title=""
                        searchable={false}
                        itemsPerPage={5}
                        paginationOff={true}
                        className="border-0 shadow-none"
                      />
                    </div>
                  </section>
                )}
              </div>

              {/* Right Column - Products & Security */}
              <div className="space-y-10">
                {/* Product Catalog Section */}
                {activeTab === 'shopInfo' && (
                  <section>
                    <h3 className="font-serif mb-6 text-xl font-bold text-[#1A1C1B]">
                      Product Catalog
                    </h3>
                    <div className="space-y-6 rounded-lg border border-[#D3C4AF]/10 bg-white p-6 shadow-lg shadow-[#785600]/5">
                      {products.map((product) => (
                        <div
                          key={product.id}
                          className="group flex items-center justify-between"
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`flex h-12 w-12 items-center justify-center rounded ${product.bgColor} ${product.iconColor}`}
                            >
                              {product.icon}
                            </div>
                            <div>
                              <h5 className="font-bold text-[#1A1C1B]">
                                {product.name}
                              </h5>
                              <p className="text-xs text-[#5E5B56]">
                                {product.description}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-[#785600]">
                              {product.fee}
                            </p>
                            <ToggleSwitch
                              enabled={product.enabled}
                              onChange={() => toggleProduct(product.id)}
                            />
                          </div>
                        </div>
                      ))}
                      <button className="w-full rounded-lg border-2 border-dashed border-[#D3C4AF]/30 py-3 text-sm font-bold text-[#5E5B56] transition-colors hover:bg-[#F4F4F2]">
                        + Manage Full Catalog
                      </button>
                    </div>
                  </section>
                )}

                {/* Trust & Security Section */}
                {activeTab !== 'account' && (
                  <section className="rounded-lg border border-[#785600]/10 bg-[#785600]/5 p-6">
                    <div className="mb-4 flex items-center gap-3 text-[#785600]">
                      <MdVerifiedUser className="h-5 w-5" />
                      <h4 className="font-bold text-[#1A1C1B]">
                        Trust & Security
                      </h4>
                    </div>
                    <p className="mb-6 text-sm leading-relaxed text-[#5E5B56]">
                      Your billing data and GST compliance settings are audited
                      weekly. Ensure your HSN codes are up to date with the
                      latest ministry notifications.
                    </p>
                    <button className="flex items-center gap-2 text-sm font-bold text-[#785600] transition-all hover:gap-3">
                      View Compliance Report
                      <IoArrowForward className="h-4 w-4" />
                    </button>
                  </section>
                )}
              </div>
            </div>
          )}

          {/* Global Actions - Only show for non-account tabs */}
          {activeTab !== 'account' && (
            <div className="mt-16 flex justify-end gap-4 border-t border-[#D3C4AF]/20 pt-10">
              <button className="rounded-full px-8 py-3 font-bold text-[#5E5B56] transition-colors hover:bg-[#F4F4F2]">
                Discard Changes
              </button>
              <button className="transform rounded-full bg-gradient-to-r from-[#785600] to-[#5a4000] px-10 py-3 font-bold text-white shadow-xl transition-all hover:scale-[1.02] active:scale-95">
                Save Configuration
              </button>
            </div>
          )}
        </div>
      </main>

      <style>{`
        .toggle-checkbox {
          right: 1rem;
          transition: all 0.2s ease-in-out;
        }
        .toggle-checkbox:checked {
          right: 0;
          border-color: #785600;
        }
        .toggle-checkbox:checked + .toggle-label {
          background-color: #785600;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default Setting;

// Settings.tsx - Settings Page matching HTML design exactly
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
import PageHeader from '@/components/Forms/Common/PageHeader';

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
    color: 'bg-secondary-container',
  },
  {
    id: '2',
    name: 'Rajesh Kumar',
    initials: 'RK',
    role: 'Sales Associate',
    status: 'active',
    color: 'bg-tertiary-container',
  },
  {
    id: '3',
    name: 'Sneha Mehta',
    initials: 'SM',
    role: 'Accountant',
    status: 'inactive',
    color: 'bg-surface-container-high',
  },
];

const productsData: Product[] = [
  {
    id: '1',
    name: '24K Gold Bullion',
    description: 'Standard 999.9 Purity',
    fee: '₹ 450 /g Fee',
    icon: (
      <Diamond
        className="h-6 w-6"
        style={{fontVariationSettings: "'FILL' 1"}}
      />
    ),
    bgColor: 'bg-[#f4d48a]/20',
    iconColor: 'text-[#785600]',
    enabled: true,
  },
  {
    id: '2',
    name: '999 Silver Coin',
    description: 'Sterling Standard',
    fee: '₹ 85 /g Fee',
    icon: <MdPayments className="h-6 w-6" />,
    bgColor: 'bg-surface-container',
    iconColor: 'text-secondary',
    enabled: true,
  },
  {
    id: '3',
    name: 'Platinum Rings',
    description: 'PT 950 Hallmark',
    fee: '₹ 1,200 /g Fee',
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
          enabled ? 'right-0 border-primary' : 'border-outline-variant right-4'
        }`}
      />
      <label
        className={`toggle-label block h-6 cursor-pointer overflow-hidden rounded-full ${
          enabled ? 'bg-primary' : 'bg-surface-container-high'
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

  return (
    <div className="bg-background min-h-screen">
      {/* Main Content Area */}
      <main className="min-h-screen">
        {/* Header */}
        <header className="top-0 z-40 flex w-full items-center justify-between bg-[#f9f9f7] px-8 py-4 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-4">
            <PageHeader title="Settings" />
          </div>
          <div className="flex items-center gap-6">
            <div className="relative">
              <span className="material-symbols-outlined cursor-pointer text-[#4f4535]">
                notifications
              </span>
              <span className="bg-error absolute right-0 top-0 h-2 w-2 rounded-full"></span>
            </div>
            <span className="material-symbols-outlined cursor-pointer text-[#4f4535]">
              account_circle
            </span>
          </div>
        </header>

        {/* Content Canvas */}
        <div className="mx-auto max-w-7xl p-12">
          {/* Horizontal Tabs */}
          <div className="border-outline-variant/20 scrollbar-hide mb-12 flex gap-8 overflow-x-auto whitespace-nowrap border-b">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-[#785600] text-[#785600]'
                    : 'text-[#4f4535] hover:text-[#785600]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            {/* Left Column - Shop Info & Users */}
            <div className="space-y-10 lg:col-span-2">
              {/* Shop Info Section */}
              {activeTab === 'shopInfo' && (
                <section>
                  <h3 className="serif-text text-on-surface mb-6 text-xl">
                    Store Identity
                  </h3>
                  <div className="border-outline-variant/10 bg-surface-container-lowest rounded-lg border p-8 shadow-[0px_10px_40px_rgba(121,88,0,0.06)]">
                    <div className="mb-10 flex items-center gap-8">
                      <div className="group relative">
                        <div className="border-outline-variant/30 bg-surface-container flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg border">
                          <img
                            alt="Store Logo"
                            className="h-full w-full object-cover"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBfNGT0fFFu34Q5jKEN1tnjSkGOfy5snQcgHaabCu1aYSVE5-vF4fNRw_k3RLK9ttc-PQpsdtg_q4UvSUSePTWEsMfylQ_OCxpOvr-J_Kymhz-552v6B0_1Lx0BB5YkqkVfQj22bfR5-UsRQA6SOKLnPLuQGub0NMPXwITO3pIDzwyGy-XQ1VMqUr97KukSMKU4S4mQJmleBkVjseGv8VSr0_V8NuqXomMUuRCdcUJ6mFlUWYFsHDHC8YA5sii97qDt5p6zfFiAWRZv"
                          />
                        </div>
                        <button className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-105">
                          <span className="material-symbols-outlined text-sm">
                            edit
                          </span>
                        </button>
                      </div>
                      <div>
                        <h4 className="text-on-surface font-bold">
                          Store Logo
                        </h4>
                        <p className="text-on-surface-variant text-sm">
                          Upload your brand identity for invoices and reports.
                        </p>
                      </div>
                    </div>
                    <form className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">
                          Store Name
                        </label>
                        <input
                          type="text"
                          defaultValue="Royal Bullion &amp; Jewels"
                          className="border-outline-variant/20 bg-surface-container-lowest text-on-surface w-full rounded py-3 focus:border-primary focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">
                          GST Number
                        </label>
                        <input
                          type="text"
                          placeholder="27AAAAA0000A1Z5"
                          className="border-outline-variant/20 bg-surface-container-lowest text-on-surface w-full rounded py-3 focus:border-primary focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">
                          Store Address
                        </label>
                        <textarea
                          rows={3}
                          defaultValue="102, Gold Souk, Zaveri Bazaar, Mumbai, Maharashtra 400002"
                          className="border-outline-variant/20 bg-surface-container-lowest text-on-surface w-full rounded py-3 focus:border-primary focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">
                          PAN Number
                        </label>
                        <input
                          type="text"
                          placeholder="ABCDE1234F"
                          className="border-outline-variant/20 bg-surface-container-lowest text-on-surface w-full rounded py-3 focus:border-primary focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">
                          Contact Phone
                        </label>
                        <input
                          type="tel"
                          defaultValue="+91 98765 43210"
                          className="border-outline-variant/20 bg-surface-container-lowest text-on-surface w-full rounded py-3 focus:border-primary focus:ring-primary"
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
                    <h3 className="serif-text text-on-surface text-xl">
                      User Access
                    </h3>
                    <button className="flex items-center gap-2 rounded-full bg-[#785600] px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-colors hover:bg-[#986d00]">
                      <Plus className="h-4 w-4" />
                      Add User
                    </button>
                  </div>
                  <div className="border-outline-variant/10 bg-surface-container-lowest overflow-hidden rounded-lg border shadow-[0px_10px_40px_rgba(121,88,0,0.06)]">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-outline-variant/10 bg-surface-container-low border-b">
                          <th className="text-on-surface-variant px-8 py-4 text-xs font-bold uppercase tracking-wider">
                            Name
                          </th>
                          <th className="text-on-surface-variant px-8 py-4 text-xs font-bold uppercase tracking-wider">
                            Role
                          </th>
                          <th className="text-on-surface-variant px-8 py-4 text-xs font-bold uppercase tracking-wider">
                            Status
                          </th>
                          <th className="text-on-surface-variant px-8 py-4 text-xs font-bold uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-outline-variant/10 divide-y">
                        {users.map((user) => (
                          <tr
                            key={user.id}
                            className="hover:bg-surface-container-low/50 transition-colors"
                          >
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`text-on-secondary-container flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${user.color}`}
                                >
                                  {user.initials}
                                </div>
                                <span className="text-on-surface font-medium">
                                  {user.name}
                                </span>
                              </div>
                            </td>
                            <td className="text-on-surface-variant px-8 py-5 text-sm">
                              {user.role}
                            </td>
                            <td className="px-8 py-5">
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                  user.status === 'active'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {user.status === 'active'
                                  ? 'Active'
                                  : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-8 py-5">
                              <button className="text-sm font-bold text-primary hover:underline">
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </div>

            {/* Right Column - Products & Security */}
            <div className="space-y-10">
              {/* Product Catalog Section */}
              {activeTab === 'shopInfo' && (
                <section>
                  <h3 className="serif-text text-on-surface mb-6 text-xl">
                    Product Catalog
                  </h3>
                  <div className="border-outline-variant/10 bg-surface-container-lowest space-y-6 rounded-lg border p-6 shadow-[0px_10px_40px_rgba(121,88,0,0.06)]">
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
                            <h5 className="text-on-surface font-bold">
                              {product.name}
                            </h5>
                            <p className="text-on-surface-variant text-xs">
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
                    <button className="border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-low w-full rounded-lg border-2 border-dashed py-3 text-sm font-bold transition-colors">
                      + Manage Full Catalog
                    </button>
                  </div>
                </section>
              )}

              {/* Trust & Security Section */}
              <section className="rounded-lg border border-primary/10 bg-primary/5 p-6">
                <div className="mb-4 flex items-center gap-3 text-[#785600]">
                  <MdVerifiedUser className="h-5 w-5" />
                  <h4 className="font-bold">Trust &amp; Security</h4>
                </div>
                <p className="text-on-surface-variant mb-6 text-sm leading-relaxed">
                  Your billing data and GST compliance settings are audited
                  weekly. Ensure your HSN codes are up to date with the latest
                  ministry notifications.
                </p>
                <button className="flex items-center gap-2 text-sm font-bold text-[#785600] transition-all hover:gap-3">
                  View Compliance Report
                  <IoArrowForward className="h-4 w-4" />
                </button>
              </section>
            </div>
          </div>

          {/* Global Actions */}
          <div className="border-outline-variant/20 mt-16 flex justify-end gap-4 border-t pt-10">
            <button className="text-on-surface-variant hover:bg-surface-container rounded-full px-8 py-3 font-bold transition-colors">
              Discard Changes
            </button>
            <button className="to-primary-container transform rounded-full bg-gradient-to-r from-primary px-10 py-3 font-bold text-white shadow-xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95">
              Save Configuration
            </button>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          vertical-align: middle;
        }
        .serif-text {
          font-family: 'Playfair Display', serif;
        }
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

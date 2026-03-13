import {useNavigate} from '@tanstack/react-router';
import React, {useState} from 'react';
import {MdSearch, MdFilterList} from 'react-icons/md';

const OrderManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Active');

  const orders = [
    {
      id: 1,
      symbol: 'XAU/USD',
      type: 'Spot • Gold',
      price: '1,945.50',
      priceLabel: 'Limit Price',
      side: 'Buy',
      sideColor: 'text-[#37ec13]',
      filled: '5.0',
      total: '10.0 oz',
      status: 'Partial',
      statusColor: 'text-yellow-400',
      progress: 50,
      tab: 'Active',
    },
    {
      id: 2,
      symbol: 'BTC/USDT',
      type: 'Spot • Crypto',
      price: '61,200',
      priceLabel: 'Market Price',
      side: 'Sell',
      sideColor: 'text-red-400',
      total: '0.5 BTC',
      status: 'Filled',
      statusColor: 'text-green-400',
      tab: 'Completed', // Changed from "Filled" to "Completed"
    },
    {
      id: 3,
      symbol: 'ETH/USDT',
      type: 'Spot • Crypto',
      price: '3,200',
      priceLabel: 'Limit Price',
      side: 'Buy',
      sideColor: 'text-[#37ec13]',
      total: '2 ETH',
      status: 'Cancelled',
      statusColor: 'text-red-400',
      tab: 'Cancelled',
    },
    {
      id: 4,
      symbol: 'XAG/USD',
      type: 'Spot • Silver',
      price: '24.10',
      priceLabel: 'Limit Price',
      side: 'Buy',
      sideColor: 'text-[#37ec13]',
      total: '20 oz',
      status: 'Filled',
      statusColor: 'text-green-400',
      tab: 'Completed', // Changed from "History" to "Completed"
    },
  ];

  const filteredOrders = orders.filter((order) => order.tab === activeTab);

  return (
    <div className="flex min-h-screen justify-center bg-[#000000] font-[Inter]">
      <div className="relative flex min-h-screen w-full flex-col bg-[#000000] text-white">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>

          <div className="flex gap-3">
            <button className="rounded-full p-2 hover:bg-primary/10">
              <MdSearch className="text-gray-300 text-xl" />
            </button>

            <button className="rounded-full p-2 hover:bg-primary/10">
              <MdFilterList className="text-gray-300 text-xl" />
            </button>
          </div>
        </header>

        {/* Tabs */}
        <div className="px-6 pb-6">
          <div className="grid grid-cols-3 gap-2 rounded-full border border-white/5 bg-[#1a2e16]/30 p-1">
            {['Active', 'Completed', 'Cancelled'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-3 py-2 text-xs font-bold transition ${
                  activeTab === tab
                    ? 'bg-[#37ec13] text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Orders */}
        <main className="flex-1 space-y-4 overflow-y-auto px-6 pb-28">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <OrderCard key={order.id} {...order} />
            ))
          ) : (
            <p className="text-gray-500 mt-10 text-center text-sm">
              No {activeTab} Orders
            </p>
          )}
        </main>
      </div>
    </div>
  );
};

export default OrderManagement;

/* ---------------- Order Card ---------------- */

interface OrderCardProps {
  symbol: string;
  type: string;
  price: string;
  priceLabel: string;
  side: string;
  sideColor: string;
  filled?: string;
  total: string;
  status: string;
  statusColor: string;
  progress?: number;
}

const OrderCard: React.FC<OrderCardProps> = ({
  symbol,
  type,
  price,
  priceLabel,
  side,
  sideColor,
  filled,
  total,
  status,
  statusColor,
  progress,
}) => {
  const navigate = useNavigate();

  return (
    <div className="rounded-xl border border-[#37ec13]/10 bg-[#000000]/70 p-5 backdrop-blur-lg">
      {/* Top */}
      <div className="mb-4 flex justify-between">
        <div>
          <h3 className="text-xs font-bold">{symbol}</h3>
          <p className="text-gray-400 text-xs">{type}</p>
        </div>

        <div className="text-right">
          <p className="text-xs font-bold">{price}</p>
          <p className="text-gray-400 text-xs">{priceLabel}</p>
        </div>
      </div>

      {/* Info */}
      <div className="mb-4 grid grid-cols-3 border-y border-white/5 py-4 text-xs">
        <div>
          <p className="text-gray-400 mb-1 text-[10px] uppercase">Side</p>
          <p className={`font-bold ${sideColor}`}>{side}</p>
        </div>

        <div>
          <p className="text-gray-400 mb-1 text-[10px] uppercase">
            {filled ? 'Filled / Total' : 'Total'}
          </p>

          <p className="font-semibold">
            {filled ? (
              <>
                {filled} <span className="text-gray-400">/ {total}</span>
              </>
            ) : (
              total
            )}
          </p>
        </div>

        <div className="text-right">
          <p className="text-gray-400 mb-1 text-[10px] uppercase">Status</p>
          <p className={`font-semibold ${statusColor}`}>{status}</p>
        </div>
      </div>

      {/* Progress */}
      {progress && (
        <div className="bg-gray-700 mb-4 h-1 w-full rounded-full">
          <div
            className="h-full rounded-full bg-[#37ec13]"
            style={{width: `${progress}%`}}
          />
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => {
            navigate({to: `/placeorder/${'buy'}`});
          }}
          className="flex-1 rounded-full border border-[#37ec13] py-3 text-sm font-semibold text-[#37ec13] hover:bg-[#37ec13] hover:text-black"
        >
          Modify
        </button>

        <button className="text-gray-400 flex-1 rounded-full border border-transparent py-3 text-sm hover:bg-red-400/10 hover:text-red-400">
          Cancel
        </button>
      </div>
    </div>
  );
};

import {useNavigate, useLocation} from '@tanstack/react-router';
import React from 'react';
import {
  MdCandlestickChart,
  MdReceiptLong,
  MdAccountBalanceWallet,
  MdPerson,
  MdShowChart,
} from 'react-icons/md';
import {TbReport} from 'react-icons/tb';

const Footer: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname.includes(path);

  const getClass = (path: string) =>
    `flex h-full w-16 flex-col items-center justify-center text-xs ${
      isActive(path) ? 'text-green-600' : 'text-gray-400'
    }`;

  return (
    <nav className="absolute bottom-0 flex h-20 w-full items-center justify-around border-t border-white/5 bg-[#000000]/95 pb-2 backdrop-blur-lg">
      <button
        onClick={() => navigate({to: '/market'})}
        className={getClass('/market')}
      >
        <MdCandlestickChart className="text-2xl" />
        <span className="mt-1">Markets</span>
      </button>

      <button
        onClick={() => navigate({to: '/order'})}
        className={getClass('/order')}
      >
        <MdReceiptLong className="text-2xl" />
        <span className="mt-1">Orders</span>
      </button>

      <button
        onClick={() => navigate({to: '/wallet'})}
        className={getClass('/wallet')}
      >
        <MdAccountBalanceWallet className="text-2xl" />
        <span className="mt-1">Wallet</span>
      </button>

      <button
        onClick={() => navigate({to: '/portfolio'})}
        className={getClass('/portfolio')}
      >
        <MdShowChart className="text-2xl" />
        <span className="mt-1">Portfolio</span>
      </button>

      <button
        className={getClass('/report')}
        onClick={() => navigate({to: '/report'})}
      >
        <TbReport className="text-2xl" />
        <span className="mt-1">Report</span>
      </button>
    </nav>
  );
};

export default Footer;

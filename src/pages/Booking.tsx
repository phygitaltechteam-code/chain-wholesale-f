/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {useState} from 'react';
import {ChevronLeft, ChevronRight, Plus} from 'lucide-react';
import BookingCard, {CreateBookingCard} from '@/components/BookingCard';
import {motion} from 'framer-motion';
const BOOKINGS_DATA = [
  {
    id: '#BK-1024',
    client: 'Arjun Malhotra',
    metal: 'Gold 24k',
    weight: '50.000g',
    rate: '6,250',
    date: '12 OCT 2023',
    status: 'PENDING' as const,
  },
  {
    id: '#BK-0982',
    client: 'Priya Sharma',
    metal: 'Gold 22k',
    weight: '12.450g',
    rate: '5,840',
    date: '08 OCT 2023',
    status: 'DELIVERED' as const,
  },
  {
    id: '#BK-1025',
    client: 'Vikram Singh',
    metal: 'Gold 24k',
    weight: '100.000g',
    rate: '6,250',
    date: '13 OCT 2023',
    status: 'PENDING' as const,
  },
  {
    id: '#BK-1001',
    client: 'Siddharth Rao',
    metal: 'Silver 999',
    weight: '1000.00g',
    rate: '78',
    date: '10 OCT 2023',
    status: 'DELIVERED' as const,
  },
  {
    id: '#BK-1030',
    client: 'Meera Iyer',
    metal: 'Gold 24k',
    weight: '25.000g',
    rate: '6,310',
    date: '14 OCT 2023',
    status: 'PENDING' as const,
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('All Bookings');

  return (
    <div className="bg-bg-deep selection:bg-gold/30 selection:text-gold-light min-h-screen">
      <main className="min-h-screen">
        <div className="mx-auto max-w-7xl p-8">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="serif mb-6 text-4xl font-bold text-slate-100">
                Bookings
              </h2>

              <div className="flex space-x-8 border-b border-white/5">
                {['All Bookings', 'Pending', 'Delivered'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`relative pb-4 text-sm font-semibold transition-all ${
                      activeTab === tab
                        ? 'text-gold'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <motion.div
                        layoutId="activeTabIndicator"
                        className="bg-gold absolute bottom-0 left-0 right-0 h-0.5"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {BOOKINGS_DATA.filter(
              (b) =>
                activeTab === 'All Bookings' ||
                (activeTab === 'Pending' && b.status === 'PENDING') ||
                (activeTab === 'Delivered' && b.status === 'DELIVERED'),
            ).map((booking) => (
              <BookingCard
                key={booking.id}
                id={booking.id}
                client={booking.client}
                metal={booking.metal}
                weight={booking.weight}
                rate={booking.rate}
                date={booking.date}
                status={booking.status}
              />
            ))}
            {activeTab !== 'Delivered' && <CreateBookingCard />}
          </div>

          {/* Pagination & Footer Info */}
          <div className="mt-12 flex flex-col items-center justify-between gap-6 border-t border-white/5 pt-8 md:flex-row">
            <p className="text-sm text-slate-500">
              Showing <span className="font-bold text-slate-200">5</span> of{' '}
              <span className="font-bold text-slate-200">128</span> active
              bookings
            </p>

            <div className="flex items-center space-x-2">
              <button className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-2 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-200">
                <ChevronLeft className="h-5 w-5" />
              </button>

              {[1, 2, 3].map((page) => (
                <button
                  key={page}
                  className={`h-10 w-10 rounded-lg border text-sm font-bold transition-all ${
                    page === 1
                      ? 'text-gold border-slate-700 bg-slate-800 shadow-lg'
                      : 'border-white/5 text-slate-500 hover:border-slate-700 hover:text-slate-300'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-2 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-200">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Floating Action Button for mobile access */}
        <motion.button
          whileHover={{scale: 1.1}}
          whileTap={{scale: 0.9}}
          className="bg-gold text-bg-deep shadow-gold/40 fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-2xl lg:hidden"
        >
          <Plus className="h-6 w-6" />
        </motion.button>
      </main>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import BookingCard, { CreateBookingCard } from '@/components/BookingCard';
import { motion } from 'framer-motion';
const BOOKINGS_DATA = [
  { id: '#BK-1024', client: 'Arjun Malhotra', metal: 'Gold 24k', weight: '50.000g', rate: '6,250', date: '12 OCT 2023', status: 'PENDING' as const },
  { id: '#BK-0982', client: 'Priya Sharma', metal: 'Gold 22k', weight: '12.450g', rate: '5,840', date: '08 OCT 2023', status: 'DELIVERED' as const },
  { id: '#BK-1025', client: 'Vikram Singh', metal: 'Gold 24k', weight: '100.000g', rate: '6,250', date: '13 OCT 2023', status: 'PENDING' as const },
  { id: '#BK-1001', client: 'Siddharth Rao', metal: 'Silver 999', weight: '1000.00g', rate: '78', date: '10 OCT 2023', status: 'DELIVERED' as const },
  { id: '#BK-1030', client: 'Meera Iyer', metal: 'Gold 24k', weight: '25.000g', rate: '6,310', date: '14 OCT 2023', status: 'PENDING' as const },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('All Bookings');

  return (
    <div className="min-h-screen bg-bg-deep selection:bg-gold/30 selection:text-gold-light">
      <main className="min-h-screen">
        <div className="p-8 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <h2 className="serif text-4xl font-bold text-slate-100 mb-6">Bookings</h2>
              
              <div className="flex space-x-8 border-b border-white/5">
                {['All Bookings', 'Pending', 'Delivered'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-4 text-sm font-semibold transition-all relative ${
                      activeTab === tab ? 'text-gold' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <motion.div
                        layoutId="activeTabIndicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {BOOKINGS_DATA.filter(b => 
              activeTab === 'All Bookings' || 
              (activeTab === 'Pending' && b.status === 'PENDING') ||
              (activeTab === 'Delivered' && b.status === 'DELIVERED')
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
          <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-sm text-slate-500">
              Showing <span className="text-slate-200 font-bold">5</span> of <span className="text-slate-200 font-bold">128</span> active bookings
            </p>

            <div className="flex items-center space-x-2">
              <button className="p-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              {[1, 2, 3].map((page) => (
                <button
                  key={page}
                  className={`w-10 h-10 rounded-lg border text-sm font-bold transition-all ${
                    page === 1 
                      ? 'bg-slate-800 border-slate-700 text-gold shadow-lg' 
                      : 'border-white/5 text-slate-500 hover:border-slate-700 hover:text-slate-300'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button className="p-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Floating Action Button for mobile access */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-8 right-8 w-14 h-14 bg-gold text-bg-deep rounded-full shadow-2xl shadow-gold/40 flex items-center justify-center z-50 lg:hidden"
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      </main>
    </div>
  );
}

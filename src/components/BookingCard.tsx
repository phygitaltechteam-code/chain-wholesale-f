import { Lock, ArrowRight, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
interface BookingCardProps {
  key?: string | number;
  id: string;
  client: string;
  metal: string;
  weight: string;
  rate: string;
  date: string;
  status: 'PENDING' | 'DELIVERED';
}

export default function BookingCard({ id, client, metal, weight, rate, date, status }: BookingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-bg-card border border-white/5 rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:border-white/10 transition-all group"
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Booking ID</p>
          <h3 className="text-xl font-bold text-slate-100 group-hover:text-gold-light transition-colors">{id}</h3>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Client</p>
          <p className="text-sm font-semibold text-slate-300">{client}</p>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex justify-between items-center py-2 border-b border-white/5">
          <span className="text-xs text-slate-500 font-medium">Metal & Weight</span>
          <span className="text-sm font-bold text-slate-200">{metal} | {weight}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-white/5">
          <span className="text-xs text-slate-500 font-medium">Rate Locked</span>
          <div className="flex items-center space-x-2">
            <Lock className="w-3.5 h-3.5 text-gold/60" />
            <span className="text-sm font-bold text-gold">₹ {rate}/g</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-auto">
        <div>
          <p className="text-[10px] uppercase font-bold text-slate-600 mb-1">{date}</p>
          <span className={`text-[10px] px-2 py-0.5 rounded font-bold tracking-wider ${
            status === 'DELIVERED' 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
          }`}>
            {status}
          </span>
        </div>

        {status === 'DELIVERED' ? (
          <span className="text-xs italic text-slate-500 font-medium">Completed</span>
        ) : (
          <motion.button
            whileHover={{ x: 3 }}
            className="flex items-center space-x-2 text-xs font-bold text-gold-light hover:text-gold border border-gold/30 hover:border-gold px-4 py-2 rounded-lg transition-all"
          >
            <span>Deliver</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

export function CreateBookingCard() {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="bg-slate-800/10 border-2 border-dashed border-slate-700/50 rounded-2xl p-6 flex flex-col items-center justify-center space-y-4 hover:border-gold/30 hover:bg-gold/5 transition-all min-h-[280px] group"
    >
      <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-gold transition-colors">
        <Plus className="w-6 h-6 text-slate-500 group-hover:text-bg-deep transition-colors" />
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-slate-300 group-hover:text-gold transition-colors">Create New Booking</p>
        <p className="text-xs text-slate-600 mt-1">Generate a new ledger entry</p>
      </div>
    </motion.button>
  );
}

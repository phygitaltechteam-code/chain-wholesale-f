import {Lock, ArrowRight, Plus} from 'lucide-react';
import {motion} from 'framer-motion';
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

export default function BookingCard({
  id,
  client,
  metal,
  weight,
  rate,
  date,
  status,
}: BookingCardProps) {
  return (
    <motion.div
      initial={{opacity: 0, y: 10}}
      animate={{opacity: 1, y: 0}}
      whileHover={{y: -4}}
      className="bg-bg-card group rounded-2xl border border-white/5 p-6 shadow-xl transition-all hover:border-white/10 hover:shadow-2xl"
    >
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Booking ID
          </p>
          <h3 className="group-hover:text-gold-light text-xl font-bold text-slate-100 transition-colors">
            {id}
          </h3>
        </div>
        <div className="text-right">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Client
          </p>
          <p className="text-sm font-semibold text-slate-300">{client}</p>
        </div>
      </div>

      <div className="mb-6 space-y-3">
        <div className="flex items-center justify-between border-b border-white/5 py-2">
          <span className="text-xs font-medium text-slate-500">
            Metal & Weight
          </span>
          <span className="text-sm font-bold text-slate-200">
            {metal} | {weight}
          </span>
        </div>
        <div className="flex items-center justify-between border-b border-white/5 py-2">
          <span className="text-xs font-medium text-slate-500">
            Rate Locked
          </span>
          <div className="flex items-center space-x-2">
            <Lock className="text-gold/60 h-3.5 w-3.5" />
            <span className="text-gold text-sm font-bold">₹ {rate}/g</span>
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase text-slate-600">
            {date}
          </p>
          <span
            className={`rounded px-2 py-0.5 text-[10px] font-bold tracking-wider ${
              status === 'DELIVERED'
                ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                : 'border border-amber-500/20 bg-amber-500/10 text-amber-500'
            }`}
          >
            {status}
          </span>
        </div>

        {status === 'DELIVERED' ? (
          <span className="text-xs font-medium italic text-slate-500">
            Completed
          </span>
        ) : (
          <motion.button
            whileHover={{x: 3}}
            className="text-gold-light hover:text-gold border-gold/30 hover:border-gold flex items-center space-x-2 rounded-lg border px-4 py-2 text-xs font-bold transition-all"
          >
            <span>Deliver</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

export function CreateBookingCard() {
  return (
    <motion.button
      whileHover={{scale: 1.01}}
      whileTap={{scale: 0.99}}
      className="hover:border-gold/30 hover:bg-gold/5 group flex min-h-[280px] flex-col items-center justify-center space-y-4 rounded-2xl border-2 border-dashed border-slate-700/50 bg-slate-800/10 p-6 transition-all"
    >
      <div className="group-hover:bg-gold flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 transition-colors">
        <Plus className="group-hover:text-bg-deep h-6 w-6 text-slate-500 transition-colors" />
      </div>
      <div className="text-center">
        <p className="group-hover:text-gold text-sm font-bold text-slate-300 transition-colors">
          Create New Booking
        </p>
        <p className="mt-1 text-xs text-slate-600">
          Generate a new ledger entry
        </p>
      </div>
    </motion.button>
  );
}

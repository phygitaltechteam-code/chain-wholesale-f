import React, { useState, useEffect } from 'react';
import {
  Weight,
  Gem,
  Ruler,
  Award,
  CreditCard,
  Wallet,
  IndianRupee,
  RefreshCw,
} from 'lucide-react';
import { erpStore } from '@/store/erpStore';
import { useGetDashboard } from '@/lib/api/dashboard';


const Dashboard = () => {
  const [data, setData] = useState(erpStore.getData());
  const [lastRefreshed, setLastRefreshed] = useState<string>(new Date().toLocaleTimeString());
 
   const { data: dashboardData } = useGetDashboard();
   console.log(dashboardData);
  const handleRefresh = () => {
    setData(erpStore.getData());
    setLastRefreshed(new Date().toLocaleTimeString());
  };

  useEffect(() => {
    setData(erpStore.getData());
  }, []);

  return (
    <div className="min-h-screen bg-[#f9f9f7] dark:bg-slate-950 p-4 md:p-8">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#d3c4af]/20 dark:border-slate-700 pb-6 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-amber-500 animate-pulse"></span>
            <h1 className="text-2xl md:text-3xl font-bold font-serif text-[#785600] dark:text-amber-400 tracking-tight">
             Dashboard
            </h1>
          </div>
        
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 rounded-lg border border-[#d3c4af]/30 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-semibold text-[#1a1c1b] dark:text-slate-300 hover:bg-[#f4f4f2] dark:hover:bg-slate-800 hover:text-[#785600] dark:hover:text-amber-400 transition-all shadow-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </button>
        </div>
      </div>

      {/* 7 Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Card 1: Total Gold Weight */}
        <div className="rounded-xl border border-[#d3c4af]/20 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-sm hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#4f4535] dark:text-slate-400 uppercase tracking-wider">
              Total Gold Weight
            </span>
            <div className="rounded-lg bg-amber-100 dark:bg-amber-500/10 p-2 text-[#785600] dark:text-amber-400">
              <Weight className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-[#1a1c1b] dark:text-slate-100 font-mono">
 
            </span>
            <p className="text-[11px] mt-1">Total Gold in System</p>
          </div>
        </div>

        {/* Card 2: Total Items */}
        <div className="rounded-xl border border-[#d3c4af]/20 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-sm hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#4f4535] dark:text-slate-400 uppercase tracking-wider">
              Total Items
            </span>
            <div className="rounded-lg bg-blue-100 dark:bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
              <Gem className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-[#1a1c1b] dark:text-slate-100">
           
            </span>
            <p className="text-[11px] mt-1">Unique Item Types</p>
          </div>
        </div>

        {/* Card 3: Total Sizes */}
        <div className="rounded-xl border border-[#d3c4af]/20 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-sm hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#4f4535] dark:text-slate-400 uppercase tracking-wider">
              Total Sizes
            </span>
            <div className="rounded-lg bg-purple-100 dark:bg-purple-500/10 p-2 text-purple-600 dark:text-purple-400">
              <Ruler className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-[#1a1c1b] dark:text-slate-100">
       
            </span>
            <p className="text-[11px] mt-1">Available Size Variations</p>
          </div>
        </div>

        {/* Card 4: Average Purity */}
        <div className="rounded-xl border border-[#d3c4af]/20 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-sm hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#4f4535] dark:text-slate-400 uppercase tracking-wider">
              Avg Purity
            </span>
            <div className="rounded-lg bg-emerald-100 dark:bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-[#1a1c1b] dark:text-slate-100">
          
            </span>
            <p className="text-[11px] mt-1">Average Gold Purity</p>
          </div>
        </div>

        {/* Card 5: Total Receivable */}
        <div className="rounded-xl border border-[#d3c4af]/20 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-sm hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#4f4535] dark:text-slate-400 uppercase tracking-wider">
              Total Receivable
            </span>
            <div className="rounded-lg bg-cyan-100 dark:bg-cyan-500/10 p-2 text-cyan-600 dark:text-cyan-400">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-[#1a1c1b] dark:text-slate-100 font-mono">

            </span>
            <p className="text-[11px] mt-1">Pending Customer Payments</p>
          </div>
        </div>

        {/* Card 6: Total Payable */}
        <div className="rounded-xl border border-[#d3c4af]/20 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-sm hover:border-rose-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#4f4535] dark:text-slate-400 uppercase tracking-wider">
              Total Payable
            </span>
            <div className="rounded-lg bg-rose-100 dark:bg-rose-500/10 p-2 text-rose-600 dark:text-rose-400">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-[#1a1c1b] dark:text-slate-100 font-mono">
          
            </span>
            <p className="text-[11px] mt-1">Pending Vendor Payments</p>
          </div>
        </div>

        {/* Card 7: Total SRP */}
        <div className="rounded-xl border border-[#d3c4af]/20 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 shadow-sm hover:border-orange-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#4f4535] dark:text-slate-400 uppercase tracking-wider">
              Total SRP
            </span>
            <div className="rounded-lg bg-orange-100 dark:bg-orange-500/10 p-2 text-orange-600 dark:text-orange-400">
              <IndianRupee className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-[#1a1c1b] dark:text-slate-100 font-mono">
             
            </span>
            <p className="text-[11px] mt-1">Total Selling Price Value</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
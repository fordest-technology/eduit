"use client";

import { useEffect, useState } from "react";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  CreditCard, 
  Clock, 
  CheckCircle2,
  Receipt,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface Transaction {
  id: string;
  type: "FEE_COLLECTION" | "USAGE_BILLING" | "WITHDRAWAL";
  amount: number;
  description: string;
  date: string;
  status: string;
}

export function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const res = await fetch("/api/school/wallet/transactions");
        if (res.ok) setTransactions(await res.json());
      } catch (error) {
        console.error("Failed to fetch transactions", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTransactions();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <Receipt className="h-10 w-10 mb-2 opacity-20" />
        <p className="text-sm font-bold uppercase tracking-widest">No transactions yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 px-2">
      <AnimatePresence mode="popLayout">
        {transactions.map((tx, idx) => {
          const isNegative = tx.amount < 0;
          return (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center justify-between p-4 rounded-3xl bg-slate-50 hover:bg-white hover:shadow-xl hover:shadow-black/5 border border-transparent hover:border-slate-100 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                  tx.type === "FEE_COLLECTION" ? "bg-green-100 text-green-600" :
                  tx.type === "WITHDRAWAL" ? "bg-amber-100 text-amber-600" :
                  "bg-blue-100 text-blue-600"
                )}>
                  {tx.type === "FEE_COLLECTION" ? <ArrowDownLeft className="h-5 w-5" /> : 
                   tx.type === "WITHDRAWAL" ? <ArrowUpRight className="h-5 w-5" /> :
                   <CreditCard className="h-5 w-5" />}
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800 font-sora truncate max-w-[180px]">
                    {tx.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {format(new Date(tx.date), "MMM d, h:mm a")}
                    </p>
                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                      {tx.status}
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className={cn(
                  "text-lg font-black tracking-tight",
                  isNegative ? "text-slate-800" : "text-green-600"
                )}>
                  {isNegative ? "-" : "+"}₦{Math.abs(tx.amount).toLocaleString()}
                </p>
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-0.5">NGN</p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

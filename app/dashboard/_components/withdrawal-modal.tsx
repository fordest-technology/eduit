"use client";

import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Building2, 
  Wallet, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

interface Bank {
  bank_code: string;
  bank_name: string;
}

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  onSuccess: () => void;
}

export function WithdrawalModal({ isOpen, onClose, balance, onSuccess }: WithdrawalModalProps) {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    amount: "",
    bankCode: "",
    accountNumber: ""
  });

  useEffect(() => {
    if (isOpen) {
      const fetchBanks = async () => {
        setLoadingBanks(true);
        try {
          const res = await fetch("/api/wallets/withdraw");
          if (res.ok) setBanks(await res.json());
        } catch (error) {
          console.error("Failed to fetch banks", error);
        } finally {
          setLoadingBanks(false);
        }
      };
      fetchBanks();
    }
  }, [isOpen]);

  const handleWithdraw = async () => {
    if (!formData.amount || !formData.bankCode || !formData.accountNumber) {
      toast.error("Please fill all fields");
      return;
    }

    if (Number(formData.amount) > balance) {
      toast.error("Insufficient balance");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/wallets/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setStep(2);
        onSuccess();
        toast.success("Withdrawal initiated successfully");
      } else {
        const error = await res.json();
        toast.error(error.error || "Withdrawal failed");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-white">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8"
            >
              <DialogHeader>
                <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mb-4 mx-auto">
                  <Wallet className="h-7 w-7" />
                </div>
                <DialogTitle className="text-2xl font-black text-center font-sora text-slate-900">Withdraw Funds</DialogTitle>
                <DialogDescription className="text-center text-slate-500 font-medium">
                  Transfer funds from your school wallet to your bank account securely.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-8 mb-6 p-4 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available Balance</p>
                  <p className="text-lg font-black text-slate-900">₦{balance.toLocaleString()}</p>
                </div>
                <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm">
                  <ArrowRight className="h-5 w-5" />
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Amount to Withdraw</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 italic">₦</span>
                    <Input 
                      placeholder="0.00" 
                      className="h-14 pl-10 rounded-2xl border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 font-bold transition-all"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Select Bank</Label>
                  <Select onValueChange={(val) => setFormData({...formData, bankCode: val})}>
                    <SelectTrigger className="h-14 rounded-2xl border-slate-200 focus:ring-4 focus:ring-indigo-100 font-bold transition-all">
                      <SelectValue placeholder={loadingBanks ? "Loading banks..." : "Choose your bank"} />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                      {banks.map(bank => (
                        <SelectItem key={bank.bank_code} value={bank.bank_code} className="py-3 rounded-xl font-medium">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-slate-400" />
                            {bank.bank_name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">Account Number</Label>
                  <Input 
                    placeholder="Enter 10-digit number" 
                    maxLength={10}
                    className="h-14 rounded-2xl border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 font-bold transition-all tracking-[0.2em]"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                  />
                </div>
              </div>

              <Button 
                className="w-full h-14 mt-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50"
                onClick={handleWithdraw}
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>Confirm Withdrawal <ArrowRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            </motion.div>
          ) : (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-12 flex flex-col items-center text-center"
            >
              <div className="w-24 h-24 bg-green-100 rounded-[2rem] flex items-center justify-center text-green-600 mb-8 animate-bounce">
                <CheckCircle2 className="h-12 w-12" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 font-sora">Request Sent!</h2>
              <p className="text-slate-500 font-medium mt-4 max-w-[280px]">
                Your withdrawal request of <span className="text-slate-900 font-black">₦{Number(formData.amount).toLocaleString()}</span> is being processed and will hit your account shortly.
              </p>
              <Button 
                variant="outline" 
                className="mt-10 h-14 px-10 rounded-2xl border-slate-200 text-slate-600 font-black text-sm uppercase tracking-wider hover:bg-slate-50 transition-all"
                onClick={onClose}
              >
                Close Window
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CreditCard, 
  TrendingUp,
  Receipt,
  Users,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { WithdrawalModal } from "../../_components/withdrawal-modal";
import { TransactionHistory } from "../../_components/transaction-history";
import Image from "next/image";
import { ResponsiveSheet } from "@/components/ui/responsive-sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  ShieldCheck, 
  MapPin, 
  User, 
  Smartphone, 
  Calendar, 
  ChevronRight,
  Sparkles,
  Building 
} from "lucide-react";

interface WalletInfo {
  balance: number;
  totalFeesCollected: number;
  totalUsagePaid: number;
  bankAccountNumber?: string;
  bankCode?: string;
  schoolName?: string;
}

export function WalletFeesContent() {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [kycLoading, setKycLoading] = useState(false);
  
  const [kycData, setKycData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    bvn: "",
    dob: "",
    gender: "1",
    address: ""
  });

  const fetchWallet = async () => {
    try {
      const res = await fetch("/api/school/wallet");
      if (res.ok) setWallet(await res.json());
    } catch (error) {
      console.error("Failed to fetch wallet info:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  if (loading) return <div className="animate-pulse space-y-8">...</div>;

  return (
    <div className="space-y-8 pb-12">
      {/* Top Section: Balance & Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Balance Card */}
        <Card className="md:col-span-2 border-none shadow-2xl rounded-[3rem] overflow-hidden bg-slate-900 text-white relative group">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none group-hover:bg-blue-500/20 transition-all duration-700" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" />
          
          <CardHeader className="p-10 pb-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-black font-sora tracking-tight">Available Balance</CardTitle>
                <CardDescription className="text-slate-400 mt-1">Total funds ready for withdrawal</CardDescription>
              </div>
              <div className="p-4 bg-white/10 rounded-3xl backdrop-blur-md shadow-inner border border-white/10">
                <Wallet className="h-8 w-8 text-blue-400" />
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-10 pb-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="flex-1">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-black text-slate-500 italic">₦</span>
                  <h2 className="text-7xl font-black font-sora tracking-tighter">
                    {wallet?.balance.toLocaleString() || "0"}
                  </h2>
                </div>
                
                {wallet?.bankAccountNumber ? (
                  <div className="mt-8 p-6 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-sm max-w-xs relative overflow-hidden">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                       <ShieldCheck className="h-3 w-3" /> Dedicated Receiving Account
                    </p>
                    <p className="text-sm font-black text-white font-sora tracking-wide select-all cursor-copy">
                      {wallet.bankAccountNumber}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">
                      {wallet.bankCode === "000" ? "Payvessel Virtual Bank" : "Commercial Bank"}
                    </p>
                    
                    {/* Branding */}
                    <div className="absolute bottom-4 right-4 opacity-30 grayscale">
                        <Image 
                             src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Guaranty_Trust_Bank_Logo_2022.svg/1200px-Guaranty_Trust_Bank_Logo_2022.svg.png" 
                             alt="GTBank" 
                             width={40} 
                             height={20} 
                             className="h-4 w-auto object-contain brightness-200 contrast-200"
                        />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-4">
                    <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active & Secure</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={() => setIsWithdrawModalOpen(true)}
                  className="h-16 px-8 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-black text-sm uppercase tracking-wider shadow-xl shadow-white/10 transition-all active:scale-95 group/btn"
                >
                  Withdraw <ArrowUpRight className="ml-2 h-5 w-5 transition-transform group-hover/btn:-translate-y-1 group-hover/btn:translate-x-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Insights Cards */}
        <Card className="border-none shadow-xl rounded-[3.5rem] bg-white flex flex-col justify-center p-8">
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                <ArrowDownLeft className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fees Collected</p>
                <p className="text-2xl font-black text-slate-900 tracking-tight">₦{wallet?.totalFeesCollected?.toLocaleString() || "0"}</p>
              </div>
            </div>

            <div className="h-px bg-slate-100 w-full" />

            <div className="flex items-center gap-4">
              <div className="h-14 w-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">EduIT Usage Paid</p>
                <p className="text-2xl font-black text-slate-900 tracking-tight">₦{wallet?.totalUsagePaid?.toLocaleString() || "0"}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Section: History */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Statistics & Help */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-6 overflow-hidden relative">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-lg font-black font-sora">Help Center</CardTitle>
            </CardHeader>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Funds collected from parent payments are instantly available in your wallet. Withdrawals typically hit your bank within minutes.
            </p>
            <Button variant="outline" className="w-full mt-6 rounded-xl font-bold text-xs h-10 border-slate-100 hover:bg-slate-50">
              View FAQ
            </Button>
          </Card>
          
          {!wallet?.bankAccountNumber ? (
            <div className="p-8 rounded-[2.5rem] bg-blue-600 text-white shadow-xl shadow-blue-100 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
               <Sparkles className="h-8 w-8 mb-4 text-blue-200" />
               <h3 className="font-black text-lg font-sora leading-tight uppercase tracking-tight">Activate Deposits</h3>
               <p className="text-blue-200 text-xs mt-2 font-medium leading-relaxed">
                 Generate your per-school virtual account to start receiving parent payments directly.
               </p>
               <Button 
                 onClick={() => setIsAccountModalOpen(true)}
                 className="mt-6 w-full h-12 rounded-2xl bg-white text-blue-600 hover:bg-blue-50 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-black/5"
               >
                 Get Started <ChevronRight className="ml-1 h-3 w-3" />
               </Button>
            </div>
          ) : (
            <div className="p-8 rounded-[2.5rem] bg-indigo-600 text-white shadow-xl shadow-indigo-100">
               <TrendingUp className="h-8 w-8 mb-4 opacity-50" />
               <h3 className="font-black text-lg font-sora leading-tight">Projected Collections</h3>
               <p className="text-indigo-200 text-xs mt-2 font-medium">Based on your student population, you expect ₦{(50 * 2000).toLocaleString()} this term.</p>
            </div>
          )}
        </div>

        {/* Detailed Transaction List */}
        <Card className="lg:col-span-3 border-none shadow-xl rounded-[3rem] bg-white overflow-hidden">
          <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-black font-sora text-slate-900">Transaction Registry</CardTitle>
              <CardDescription className="text-slate-400 mt-1">Audit log of all financial activities</CardDescription>
            </div>
            <div className="flex items-center gap-2">
               <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                  <Receipt className="h-5 w-5" />
               </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <TransactionHistory />
          </CardContent>
        </Card>
      </div>

      <WithdrawalModal 
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        balance={wallet?.balance || 0}
        onSuccess={fetchWallet}
      />

      <ResponsiveSheet 
        open={isAccountModalOpen} 
        onOpenChange={setIsAccountModalOpen}
        title="Institutional Liquidity"
        description="Provision a dedicated virtual account to automate revenue collection."
        className="sm:max-w-xl"
      >
        <div className="flex flex-col gap-10">
            {process.env.NODE_ENV === "development" && (
                <div className="flex justify-end -mt-4">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="rounded-xl border-dashed border-indigo-200 text-indigo-600 font-black uppercase text-[9px] tracking-widest hover:bg-indigo-50"
                        onClick={() => setKycData({
                            firstName: "Joesph",
                            lastName: "Ayodele",
                            email: "test@example.com",
                            phoneNumber: "08012345678",
                            bvn: "22110011001",
                            dob: "1990-01-01",
                            gender: "1",
                            address: "123 Test Street, Lagos"
                        })}
                    >
                        <Sparkles className="h-3.5 w-3.5 mr-2" /> Populate Sandbox Credentials
                    </Button>
                </div>
            )}

            <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-100/50 text-indigo-700 text-[10px] font-bold uppercase tracking-tight flex gap-3 items-center">
                <ShieldCheck className="h-5 w-5 shrink-0 opacity-70" />
                <span>In sandbox, BVN details must match provider's testing records exactly.</span>
            </div>

            <div className="space-y-10">
                {/* KYC Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
                       <User className="h-4 w-4 text-indigo-500" />
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Faculty Representative Identity</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Legal First Name</Label>
                            <Input 
                                className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-bold text-lg focus:bg-white transition-all"
                                placeholder="John"
                                value={kycData.firstName}
                                onChange={(e) => setKycData({...kycData, firstName: e.target.value})}
                            />
                         </div>
                         <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Legal Surname</Label>
                            <Input 
                                className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-bold text-lg focus:bg-white transition-all"
                                placeholder="Doe"
                                value={kycData.lastName}
                                onChange={(e) => setKycData({...kycData, lastName: e.target.value})}
                            />
                         </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Official Email Address</Label>
                        <Input 
                            className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-bold text-lg focus:bg-white transition-all"
                            placeholder="registrar@institution.edu"
                            type="email"
                            value={kycData.email}
                            onChange={(e) => setKycData({...kycData, email: e.target.value})}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Bank Verification Identity (BVN)</Label>
                        <Input 
                            className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-black text-xl tracking-[0.2em] focus:bg-white transition-all"
                            placeholder="22200011100"
                            maxLength={11}
                            value={kycData.bvn}
                            onChange={(e) => setKycData({...kycData, bvn: e.target.value})}
                        />
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
                       <MapPin className="h-4 w-4 text-indigo-500" />
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Institutional Residency</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Direct Line</Label>
                            <Input 
                                className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-bold text-lg focus:bg-white transition-all"
                                placeholder="08012345678"
                                value={kycData.phoneNumber}
                                onChange={(e) => setKycData({...kycData, phoneNumber: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Birth Registry</Label>
                            <Input 
                                className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-bold text-lg focus:bg-white transition-all uppercase"
                                type="date"
                                value={kycData.dob}
                                onChange={(e) => setKycData({...kycData, dob: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Verified Address</Label>
                        <Input 
                            className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-bold text-lg focus:bg-white transition-all"
                            placeholder="Institutional or Residential street address..."
                            value={kycData.address}
                            onChange={(e) => setKycData({...kycData, address: e.target.value})}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Gender</Label>
                        <div className="flex gap-3">
                            <button 
                                type="button"
                                onClick={() => setKycData({...kycData, gender: "1"})}
                                className={cn(
                                    "flex-1 h-12 rounded-xl border transition-all text-xs font-black uppercase tracking-widest",
                                    kycData.gender === "1" ? "bg-indigo-600 text-white border-transparent shadow-lg shadow-indigo-100" : "bg-white text-slate-400 border-slate-100 hover:border-slate-300"
                                )}
                            >Male Candidate</button>
                            <button 
                                type="button"
                                onClick={() => setKycData({...kycData, gender: "2"})}
                                className={cn(
                                    "flex-1 h-12 rounded-xl border transition-all text-xs font-black uppercase tracking-widest",
                                    kycData.gender === "2" ? "bg-indigo-600 text-white border-transparent shadow-lg shadow-indigo-100" : "bg-white text-slate-400 border-slate-100 hover:border-slate-300"
                                )}
                            >Female Candidate</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-6 pt-6 border-t border-slate-50">
                <Button 
                    className="w-full h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-tighter shadow-xl shadow-indigo-100 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                    disabled={kycLoading}
                    onClick={async () => {
                        setKycLoading(true);
                        try {
                            const res = await fetch("/api/school/wallet/virtual-account", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(kycData)
                            });
                            
                            const result = await res.json();
                            if (res.ok) {
                                toast.success("Virtual account provisioned successfully!");
                                setIsAccountModalOpen(false);
                                fetchWallet();
                            } else {
                                toast.error(result.error || "Provisioning failed");
                            }
                        } catch (e) {
                            toast.error("A network synchronization error occurred");
                        } finally {
                            setKycLoading(false);
                        }
                    }}
                >
                    {kycLoading ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Provisioning Identity...</span>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-2">
                           <span>Activate Institutional Account</span>
                           <Sparkles className="h-5 w-5" />
                        </div>
                    )}
                </Button>

                <div className="flex items-center justify-center gap-4 opacity-70 group-hover:opacity-100 transition-all">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">In Partnership With</p>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Payvessel Limited</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </ResponsiveSheet>
    </div>
  );
}

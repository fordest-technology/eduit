"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { 
  Printer, 
  Download, 
  ArrowLeft, 
  CheckCircle2, 
  ShieldCheck,
  Calendar,
  Hash,
  User,
  School as SchoolIcon,
  CreditCard
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function ReceiptPage() {
  const { reference } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function fetchReceipt() {
      try {
        const res = await fetch(`/api/payments/receipt/${reference}`);
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Failed to fetch receipt");
        }
        const result = await res.json();
        setData(result);
      } catch (error: any) {
        console.error(error);
        toast.error(error.message);
        router.push("/dashboard/fees/parent");
      } finally {
        setLoading(false);
      }
    }

    if (reference) {
      fetchReceipt();
    }
  }, [reference, router]);

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-4">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-[600px] w-full rounded-[2rem]" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 print:bg-white print:p-0">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Actions - Hidden on print */}
        <div className="flex items-center justify-between print:hidden">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="rounded-full hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex gap-2">
            <Button 
              onClick={handlePrint}
              className="rounded-full bg-black text-white hover:bg-slate-800"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Receipt
            </Button>
          </div>
        </div>

        {/* Receipt Container */}
        <Card className="border-none shadow-2xl shadow-black/5 rounded-[2.5rem] overflow-hidden bg-white print:shadow-none print:rounded-none">
          {/* Header with Background Pattern */}
          <div className="relative bg-black h-32 flex items-center justify-center overflow-hidden print:h-24">
            <div className="absolute inset-0 opacity-20">
                <div className="absolute rotate-45 -top-10 -left-10 w-40 h-40 bg-white/20 blur-3xl rounded-full"></div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/20 blur-3xl rounded-full"></div>
            </div>
            <div className="z-10 text-center">
                <Badge className="bg-green-500/20 text-green-400 border-none mb-2 hover:bg-green-500/30">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Transaction Successful
                </Badge>
                <h1 className="text-white text-xl font-bold tracking-tight">PAYMENT RECEIPT</h1>
            </div>
          </div>

          <CardContent className="p-8 md:p-12 space-y-10 print:p-8">
            {/* Logos Section */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 pb-10 border-b border-slate-100 print:flex-row print:pb-6">
              <div className="flex flex-col items-center md:items-start space-y-2">
                {data.school.logo ? (
                  <img src={data.school.logo} alt={data.school.name} className="h-16 w-auto object-contain" />
                ) : (
                  <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                    <SchoolIcon className="h-8 w-8 text-slate-400" />
                  </div>
                )}
                <h2 className="text-xl font-black text-slate-900 font-sora mt-2">{data.school.name}</h2>
                <div className="text-slate-400 text-xs text-center md:text-left space-y-1 font-medium">
                  <p>{data.school.address || "Digital School Address"}</p>
                  <p>{data.school.phone} • {data.school.email}</p>
                </div>
              </div>

              <div className="flex flex-col items-center md:items-end space-y-2">
                <img src="/logo.png" alt="EduIT" className="h-10 w-auto opacity-80" />
                <div className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Receipt No.</p>
                    <p className="text-sm font-mono font-bold text-slate-900 leading-none">#{data.receiptNumber}</p>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
              {/* Payment Info */}
              <div className="space-y-6">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Hash className="h-3 w-3" />
                    Payment Details
                </h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-start">
                        <span className="text-sm text-slate-500 font-medium italic">Service/Fee</span>
                        <span className="text-sm font-bold text-slate-900 text-right max-w-[180px]">{data.billName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-500 font-medium italic">Date</span>
                        <span className="text-sm font-bold text-slate-900">{format(new Date(data.date), "PPP")}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-500 font-medium italic">Status</span>
                        <span className="text-xs font-black text-green-600 bg-green-50 px-2 py-1 rounded-md uppercase tracking-tighter">PAID</span>
                    </div>
                </div>
              </div>

              {/* Student Info */}
              <div className="space-y-6">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <User className="h-3 w-3" />
                    Student Profiling
                </h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-start">
                        <span className="text-sm text-slate-500 font-medium italic">Name</span>
                        <span className="text-sm font-bold text-slate-900 text-right">{data.student.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-500 font-medium italic">Class</span>
                        <span className="text-sm font-bold text-slate-900">{data.student.class}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-500 font-medium italic">Reference</span>
                        <span className="text-[10px] font-mono font-medium text-slate-400">{data.transactionRef}</span>
                    </div>
                </div>
              </div>
            </div>

            {/* Amount Summary */}
            <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 space-y-4 mt-4">
                <div className="flex justify-between items-center text-slate-500">
                    <span className="text-sm font-medium">Subtotal</span>
                    <span className="text-sm font-bold font-mono">{formatCurrency(data.amount)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500 border-b border-slate-200 pb-4">
                    <span className="text-sm font-medium">Transaction Charges</span>
                    <span className="text-sm font-bold font-mono">{formatCurrency(0)}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-black rounded-xl flex items-center justify-center text-white">
                            <CreditCard className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Amount Paid</p>
                            <p className="text-sm font-bold text-slate-900">Digital Gateway</p>
                        </div>
                    </div>
                    <span className="text-3xl font-black text-slate-900 font-sora tracking-tighter">{formatCurrency(data.amount)}</span>
                </div>
            </div>

            {/* Verification Footer */}
            <div className="pt-10 flex flex-col items-center justify-center space-y-6">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-white border border-slate-100 px-4 py-2 rounded-full">
                    <ShieldCheck className="h-3 w-3 text-green-500" />
                    Authentic Digital Receipt
                </div>
                
                <div className="flex items-center justify-between w-full pt-6 border-t border-slate-100 opacity-60">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400">Powered by</span>
                        <img src="/logo.png" alt="EduIT" className="h-4 w-auto grayscale" />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400">Secured by</span>
                        <div className="flex items-center gap-3">
                            <img src="/squad.png" alt="Squad" className="h-4 w-auto object-contain grayscale opacity-70" />
                            <div className="h-3 w-px bg-slate-300"></div>
                            <img src="/habaripay.jpg" alt="HabariPay" className="h-4 w-auto object-contain grayscale opacity-70" />
                            <div className="h-3 w-px bg-slate-300"></div>
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Guaranty_Trust_Bank_Logo_2022.svg/1200px-Guaranty_Trust_Bank_Logo_2022.svg.png" alt="GTBank" className="h-4 w-auto object-contain grayscale opacity-70" />
                        </div>
                    </div>
                </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Footer Note */}
        <p className="text-center text-slate-400 text-xs font-medium px-8 pb-8 print:hidden">
            This is an electronically generated receipt and does not require a physical signature. 
            For inquiries, contact the school administration or EduIT support.
        </p>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:rounded-none {
            border-radius: 0 !important;
          }
          .print\\:p-8 {
            padding: 2rem !important;
          }
        }
        @font-face {
          font-family: 'Sora';
          src: url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap');
        }
      `}</style>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
            {children}
        </span>
    );
}

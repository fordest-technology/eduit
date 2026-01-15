import { Suspense } from "react";
import { WalletFeesContent } from "./_components/wallet-fees-content";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Wallet & Fees | EduIT Management",
  description: "Manage your school wallet, collected fees, and withdrawals.",
};

export default function WalletPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black font-sora text-slate-900 tracking-tight">Wallet & Fees</h1>
        <p className="text-slate-500 font-medium mt-1">Manage collected student fees and your school's usage billing.</p>
      </div>

      <Suspense fallback={<WalletLoadingSkeleton />}>
        <WalletFeesContent />
      </Suspense>
    </div>
  );
}

function WalletLoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-[200px] md:col-span-2 rounded-[2.5rem]" />
        <Skeleton className="h-[200px] rounded-[2.5rem]" />
      </div>
      <Skeleton className="h-[500px] rounded-[2.5rem]" />
    </div>
  );
}

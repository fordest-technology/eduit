"use client";

import { AlertCircle, LogOut, Phone, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export function BillingLock() {
    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/login";
    };

    return (
        <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Decorative Background */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-50/50 rounded-full blur-3xl -z-10 -mr-64 -mt-64 animate-pulse" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-50/50 rounded-full blur-3xl -z-10 -ml-64 -mb-64" />

            <Card className="max-w-md w-full border-none shadow-2xl rounded-[2.5rem] bg-white/80 backdrop-blur-xl overflow-hidden animate-in zoom-in duration-500">
                <div className="h-2 bg-red-500 w-full" />
                <CardHeader className="text-center pt-10">
                    <div className="mx-auto h-20 w-20 bg-red-50 rounded-3xl flex items-center justify-center mb-6 ring-8 ring-red-50/50">
                        <ShieldAlert className="h-10 w-10 text-red-600" />
                    </div>
                    <CardTitle className="text-2xl font-black text-slate-800 tracking-tight">Access Restricted</CardTitle>
                    <CardDescription className="text-slate-500 font-medium px-4 mt-2">
                        Institutional access has been suspended by the system administrator due to pending administrative requirements.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 px-10 pb-10">
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-start gap-4">
                        <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                        <div className="text-sm text-slate-600 leading-relaxed">
                            Please contact your school administrator or our technical support team to resolve this issue and restore full access to your account.
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button className="w-full bg-slate-900 hover:bg-black rounded-2xl h-12 font-black tracking-tight flex items-center gap-2 shadow-lg shadow-slate-200">
                            <Phone className="h-4 w-4" />
                            Contact Support
                        </Button>
                        <Button 
                            variant="ghost" 
                            className="w-full rounded-2xl h-12 font-bold text-slate-500 hover:text-slate-800"
                            onClick={handleLogout}
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            Log Out
                        </Button>
                    </div>
                </CardContent>
                <div className="bg-slate-50/50 py-4 text-center border-t border-slate-100">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">EduIT Unified Governance System</span>
                </div>
            </Card>
        </div>
    );
}

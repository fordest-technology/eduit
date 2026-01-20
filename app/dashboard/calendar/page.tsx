import { Card, CardContent } from "@/components/ui/card";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Calendar as CalendarIcon, Info } from "lucide-react";

export default async function CalendarPage() {
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    return (
        <div className="space-y-8 p-8 max-w-5xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black font-sora tracking-tight text-slate-800">Academic Calendar</h1>
                <p className="text-slate-500 font-medium">Keep track of important dates, holidays, and school sessions.</p>
            </div>

            <Card className="border-none shadow-xl shadow-black/5 rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-center bg-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -mr-32 -mt-32" />

                <div className="h-24 w-24 rounded-[2rem] bg-indigo-50 flex items-center justify-center text-indigo-500 mb-8 relative z-10 transition-transform duration-500 hover:scale-110">
                    <CalendarIcon className="h-10 w-10" />
                </div>

                <h3 className="text-2xl font-black text-slate-800 font-sora mb-2 relative z-10">Calendar Sync in Progress</h3>
                <p className="text-slate-500 max-w-sm font-medium relative z-10 leading-relaxed">
                    We are currently integrating the full school schedule into your personal dashboard.
                    Please check back soon for the complete semester view.
                </p>

                <div className="mt-8 px-6 py-3 rounded-2xl bg-amber-50 border border-amber-100/50 flex items-center gap-3 text-amber-700 text-sm font-bold uppercase tracking-wider relative z-10">
                    <Info className="h-4 w-4" />
                    Feature Launching Soon
                </div>
            </Card>
        </div>
    );
}

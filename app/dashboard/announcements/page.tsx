import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { redirect } from "next/navigation";
import { Bell, Calendar, MapPin, Clock } from "lucide-react";
import { format } from "date-fns";

export default async function AnnouncementsPage() {
    const session = await getSession();

    if (!session || (session.role !== "STUDENT" && session.role !== "PARENT")) {
        redirect("/login");
    }

    // Fetch school announcements (Events marked as public)
    const announcements = await db.event.findMany({
        where: {
            schoolId: session.schoolId as string,
            isPublic: true,
        },
        orderBy: {
            startDate: 'desc',
        },
    });

    return (
        <div className="space-y-8 p-8 max-w-5xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black font-sora tracking-tight text-slate-800">School Announcements</h1>
                <p className="text-slate-500 font-medium">Clear, timely updates from your institution.</p>
            </div>

            <div className="grid gap-6">
                {announcements.length > 0 ? (
                    announcements.map((announcement) => (
                        <Card key={announcement.id} className="border-none shadow-xl shadow-black/5 rounded-[2rem] overflow-hidden group hover:shadow-2xl hover:shadow-black/10 transition-all duration-500 bg-white">
                            <CardHeader className="p-8 pb-4">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 transition-transform duration-500 group-hover:scale-110">
                                        <Bell className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <Calendar className="h-3 w-3" />
                                            {format(new Date(announcement.startDate), "PPP")}
                                        </div>
                                        <CardTitle className="text-2xl font-bold font-sora text-slate-800 mt-1">{announcement.title}</CardTitle>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="px-8 pb-8">
                                <p className="text-slate-600 leading-relaxed text-lg mb-6">
                                    {announcement.description || "No detailed description provided for this announcement."}
                                </p>

                                <div className="flex flex-wrap gap-6 items-center border-t border-slate-50 pt-6">
                                    {announcement.location && (
                                        <div className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest">
                                            <MapPin className="h-4 w-4 text-indigo-400" />
                                            {announcement.location}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest">
                                        <Clock className="h-4 w-4 text-indigo-400" />
                                        {format(new Date(announcement.startDate), "p")}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <Card className="border-dashed border-2 border-slate-200 shadow-none rounded-[2rem] p-20 flex flex-col items-center justify-center text-center">
                        <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 mb-6">
                            <Bell className="h-10 w-10" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-400 font-sora">No Active Announcements</h3>
                        <p className="text-slate-300 max-w-xs mt-2 font-medium">When the school sends a message, it will reflect here immediately.</p>
                    </Card>
                )}
            </div>
        </div>
    );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, XCircle, Clock, AlertCircle, Loader2, Calendar, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Separator } from "@/components/ui/separator";

interface AttendanceRecord {
    id: string;
    date: string;
    status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
    remarks?: string;
}

interface ParentAttendanceViewProps {
    children: {
        id: string;
        user: {
            name: string;
            email: string;
            profileImage: string | null;
        };
        currentClass: {
            id: string;
            name: string;
            level: string;
        } | null;
    }[];
    schoolId: string;
}

export function ParentAttendanceView({ children, schoolId }: ParentAttendanceViewProps) {
    const searchParams = useSearchParams();
    const urlChildId = searchParams.get("childId");

    const [selectedChildId, setSelectedChildId] = useState(urlChildId || children[0]?.id);
    const [selectedSessionId, setSelectedSessionId] = useState("");
    const [sessions, setSessions] = useState<any[]>([]);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, total: 0 });

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const response = await fetch(`/api/schools/${schoolId}/sessions`);
                if (response.ok) {
                    const data = await response.json();
                    setSessions(data);
                    const current = data.find((s: any) => s.isCurrent) || data[0];
                    if (current) setSelectedSessionId(current.id);
                }
            } catch (error) {
                console.error("Error fetching sessions:", error);
            }
        };

        fetchSessions();
    }, [schoolId]);

    useEffect(() => {
        if (selectedChildId && selectedSessionId) {
            fetchAttendance();
        }
    }, [selectedChildId, selectedSessionId]);

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `/api/attendance?studentId=${selectedChildId}&sessionId=${selectedSessionId}`
            );
            if (response.ok) {
                const data = await response.json();
                setAttendance(data);

                const stats = data.reduce(
                    (acc: any, curr: any) => {
                        acc.total++;
                        if (curr.status === "PRESENT") acc.present++;
                        else if (curr.status === "ABSENT") acc.absent++;
                        else if (curr.status === "LATE") acc.late++;
                        return acc;
                    },
                    { present: 0, absent: 0, late: 0, total: 0 }
                );
                setStats(stats);
            }
        } catch (error) {
            console.error("Error fetching attendance:", error);
            toast.error("Failed to load attendance data");
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PRESENT":
                return <Badge className="bg-emerald-50 text-emerald-600 border-none px-4 py-1.5 rounded-xl font-black tracking-widest text-[10px]">PRESENT</Badge>;
            case "ABSENT":
                return <Badge className="bg-rose-50 text-rose-600 border-none px-4 py-1.5 rounded-xl font-black tracking-widest text-[10px]">ABSENT</Badge>;
            case "LATE":
                return <Badge className="bg-amber-50 text-amber-600 border-none px-4 py-1.5 rounded-xl font-black tracking-widest text-[10px]">LATE</Badge>;
            default:
                return <Badge className="bg-slate-50 text-slate-600 border-none px-4 py-1.5 rounded-xl font-black tracking-widest text-[10px]">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-10 max-w-7xl mx-auto pb-20">
            <Tabs value={selectedChildId} onValueChange={setSelectedChildId} className="w-full">
                <TabsList className="bg-slate-100/50 p-1.5 rounded-[2rem] h-auto flex-wrap justify-start gap-2 mb-10 overflow-hidden border border-slate-200/50 shadow-inner">
                    {children.map((child) => (
                        <TabsTrigger
                            key={child.id}
                            value={child.id}
                            className="rounded-2xl px-8 py-3.5 font-bold data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-lg transition-all duration-300 tracking-tight font-sora"
                        >
                            {child.user.name}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {children.map((child) => (
                    <TabsContent key={child.id} value={child.id} className="mt-0 animate-in fade-in zoom-in-95 duration-500">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                            {/* Left Column: Stats & Session */}
                            <div className="lg:col-span-4 space-y-8">
                                <Card className="border-none shadow-xl shadow-black/5 rounded-[2.5rem] bg-indigo-600 text-white overflow-hidden relative p-8">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />
                                    <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                                        <div>
                                            <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-3 ml-1">Academic Cycle</p>
                                            <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                                                <SelectTrigger className="bg-white/10 border-white/20 text-white rounded-2xl h-14 font-black text-lg focus:ring-white/30 backdrop-blur-md">
                                                    <SelectValue placeholder="Select session" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl border-none shadow-2xl">
                                                    {sessions.map((s) => (
                                                        <SelectItem key={s.id} value={s.id} className="rounded-xl font-bold py-3">
                                                            {s.name} {s.isCurrent && "(Active)"}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] ml-1">Summary Statistics</p>
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="bg-white/10 rounded-[1.5rem] p-4 backdrop-blur-md border border-white/10 flex flex-col items-center">
                                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.1em] mb-1">Present</p>
                                                    <p className="text-2xl font-black font-sora">{stats.present}</p>
                                                </div>
                                                <div className="bg-white/10 rounded-[1.5rem] p-4 backdrop-blur-md border border-white/10 flex flex-col items-center">
                                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.1em] mb-1">Absent</p>
                                                    <p className="text-2xl font-black font-sora">{stats.absent}</p>
                                                </div>
                                                <div className="bg-white/10 rounded-[1.5rem] p-4 backdrop-blur-md border border-white/10 flex flex-col items-center">
                                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.1em] mb-1">Late</p>
                                                    <p className="text-2xl font-black font-sora">{stats.late}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white/10 rounded-[2rem] p-6 backdrop-blur-md border border-white/10">
                                            <div className="flex items-center justify-between mb-4">
                                                <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">Attendance Index</p>
                                                <Badge className="bg-white/20 text-white border-none font-black text-[10px] tracking-widest px-3">
                                                    {stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}%
                                                </Badge>
                                            </div>
                                            <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${stats.total > 0 ? (stats.present / stats.total) * 100 : 0}%` }}
                                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                                    className="h-full bg-white rounded-full shadow-lg shadow-white/20"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="border-none shadow-xl shadow-black/5 rounded-[2.5rem] bg-white p-8 group hover:scale-[1.02] transition-transform duration-500">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                                            <Calendar className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-800 font-sora">Sync Metadata</h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{child.currentClass?.name || 'Unassigned Registry'}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-5">
                                        <div className="flex justify-between items-center py-1">
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Level Designation</span>
                                            <span className="text-sm font-black text-slate-700">{child.currentClass?.level || 'N/A'}</span>
                                        </div>
                                        <Separator className="bg-slate-50" />
                                        <div className="flex justify-between items-center py-1">
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Comm Link</span>
                                            <span className="text-sm font-black text-slate-700 truncate max-w-[150px]">{child.user.email}</span>
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            {/* Right Column: Attendance History Table */}
                            <div className="lg:col-span-8 flex flex-col">
                                <Card className="border-none shadow-xl shadow-black/5 rounded-[2.5rem] bg-white flex-1 flex flex-col overflow-hidden border border-slate-50">
                                    <CardHeader className="p-10 pb-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-2xl font-black font-sora text-slate-800 flex items-center gap-3">
                                                    Attendance Log <Sparkles className="h-5 w-5 text-indigo-500" />
                                                </CardTitle>
                                                <CardDescription className="text-slate-400 font-medium tracking-tight mt-1">Chronological record of academic attendance for {child.user.name}</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0 overflow-hidden flex-1">
                                        {loading ? (
                                            <div className="flex-1 flex flex-col items-center justify-center py-24 min-h-[400px]">
                                                <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mb-4" />
                                                <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">Accessing Audit Trail...</p>
                                            </div>
                                        ) : attendance.length === 0 ? (
                                            <div className="flex-1 flex flex-col items-center justify-center py-24 min-h-[400px] text-center px-10">
                                                <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 mb-6 border border-slate-100 shadow-inner">
                                                    <Calendar className="h-10 w-10" />
                                                </div>
                                                <h3 className="text-xl font-bold text-slate-400 font-sora">No Records Available</h3>
                                                <p className="text-slate-300 max-w-xs mt-2 font-medium">When attendance is marked by the teacher, it will appear here instantly.</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col h-full overflow-hidden">
                                                <div className="px-10 py-5 bg-slate-50/50 border-y border-slate-100 flex items-center gap-10">
                                                    <div className="flex-1 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Record Date</div>
                                                    <div className="w-40 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Registry Status</div>
                                                    <div className="flex-1 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Audit Notes</div>
                                                </div>
                                                <div className="overflow-y-auto flex-1 h-full max-h-[650px] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                                                    <AnimatePresence initial={false}>
                                                        {attendance.map((record, index) => (
                                                            <motion.div
                                                                key={record.id}
                                                                initial={{ opacity: 0, x: 20 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                transition={{ delay: index * 0.05 }}
                                                                className="px-10 py-7 flex items-center gap-10 hover:bg-slate-50/80 transition-all border-b border-slate-50 last:border-none group"
                                                            >
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="h-2 w-2 rounded-full group-hover:scale-150 transition-transform duration-300"
                                                                            style={{ backgroundColor: record.status === 'PRESENT' ? '#10b981' : record.status === 'ABSENT' ? '#f43f5e' : '#f59e0b' }} />
                                                                        <span className="font-bold text-slate-700 font-sora tracking-tight">{format(new Date(record.date), "EEEE, do MMMM yyyy")}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="w-40">
                                                                    {getStatusBadge(record.status)}
                                                                </div>
                                                                <div className="flex-1 text-right">
                                                                    <span className="text-slate-400 font-medium italic text-xs tracking-tight">
                                                                        {record.remarks || "— Standard Entry —"}
                                                                    </span>
                                                                </div>
                                                            </motion.div>
                                                        ))}
                                                    </AnimatePresence>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}

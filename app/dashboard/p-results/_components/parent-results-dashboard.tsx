"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, BookOpen, TrendingUp, Award, Loader2, Sparkles, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface ParentResultsDashboardProps {
    data: {
        children: {
            id: string;
            user: {
                name: string;
                email: string;
            };
            currentClass: {
                name: string;
                level: string;
            } | null;
        }[];
        schoolId: string;
        schoolName: string;
    };
}

export function ParentResultsDashboard({ data }: ParentResultsDashboardProps) {
    const searchParams = useSearchParams();
    const urlChildId = searchParams.get("childId");

    const [selectedChild, setSelectedChild] = useState(urlChildId || data.children[0]?.id);
    const [selectedSession, setSelectedSession] = useState("");
    const [selectedPeriod, setSelectedPeriod] = useState("");
    const [sessions, setSessions] = useState<any[]>([]);
    const [periods, setPeriods] = useState<any[]>([]);
    const [results, setResults] = useState<any[]>([]);
    const [metrics, setMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        if (data.schoolId) {
            fetchSessionsAndPeriods();
        }
    }, [data.schoolId]);

    async function fetchSessionsAndPeriods() {
        try {
            const sessionsRes = await fetch(`/api/schools/${data.schoolId}/sessions`);
            const sessionsData = await sessionsRes.json();
            setSessions(sessionsData);

            const currentSession = sessionsData.find((s: any) => s.isCurrent) || sessionsData[0];
            if (currentSession) {
                setSelectedSession(currentSession.id);
                fetchPeriods(currentSession.id);
            }
        } catch (error) {
            console.error("Error fetching sessions:", error);
        }
    }

    async function fetchPeriods(sessionId: string) {
        try {
            const periodsRes = await fetch(
                `/api/schools/${data.schoolId}/results/config-client?sessionId=${sessionId}`
            );
            const configData = await periodsRes.json();
            if (configData.periods) {
                setPeriods(configData.periods);
                // Pre-select the current period or the one with ACTIVE status, fallback to last
                const currentPeriod = configData.periods.find((p: any) => p.isCurrent || p.status === 'ACTIVE');
                if (currentPeriod) {
                    setSelectedPeriod(currentPeriod.id);
                } else if (configData.periods.length > 0) {
                    setSelectedPeriod(configData.periods[configData.periods.length - 1].id);
                }
            }
        } catch (error) {
            console.error("Error fetching periods:", error);
        }
    }

    useEffect(() => {
        if (selectedChild && selectedSession && selectedPeriod) {
            fetchResults();
        }
    }, [selectedChild, selectedSession, selectedPeriod]);

    async function fetchResults() {
        setLoading(true);
        try {
            const response = await fetch(
                `/api/students/${selectedChild}/results-view/results?sessionId=${selectedSession}&periodId=${selectedPeriod}`
            );
            const resData = await response.json();
            setResults(resData.results || []);
            setMetrics(resData.metrics || null);
        } catch (error) {
            console.error("Error fetching results:", error);
            toast.error("Failed to load results");
        } finally {
            setLoading(false);
        }
    }

    async function handleDownload(childId: string, childName: string) {
        setDownloading(true);
        try {
            const response = await fetch(
                `/api/students/${childId}/report-card?sessionId=${selectedSession}&periodId=${selectedPeriod}`
            );
            if (!response.ok) throw new Error("Failed to download report card");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const schoolName = data.schoolName.replace(/\s+/g, '_');
            const studentName = childName.replace(/\s+/g, '_');
            a.download = `${schoolName}_${studentName}_Report.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success("Report card downloaded");
        } catch (error) {
            toast.error("Failed to download PDF");
        } finally {
            setDownloading(false);
        }
    }

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="space-y-10 max-w-7xl mx-auto pb-20">
            <Tabs value={selectedChild} onValueChange={setSelectedChild} className="w-full">
                <TabsList className="bg-slate-100/50 p-1.5 rounded-[2rem] h-auto flex-wrap justify-start gap-2 mb-10 overflow-hidden border border-slate-200/50 shadow-inner">
                    {data.children.map((child) => (
                        <TabsTrigger
                            key={child.id}
                            value={child.id}
                            className="rounded-2xl px-8 py-3.5 font-bold data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-lg transition-all duration-300 tracking-tight font-sora"
                        >
                            {child.user.name}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {data.children.map((child) => (
                    <TabsContent key={child.id} value={child.id} className="space-y-10 mt-0 animate-in fade-in zoom-in-95 duration-500">
                        {/* Filters & Actions Header */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                            <Card className="lg:col-span-8 border-none shadow-xl shadow-black/5 rounded-[2.5rem] bg-white p-8">
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="flex-1 space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Academic Session</label>
                                        <Select value={selectedSession} onValueChange={(v) => { setSelectedSession(v); fetchPeriods(v); }}>
                                            <SelectTrigger className="rounded-2xl h-14 border-slate-100 font-bold focus:ring-indigo-500/20">
                                                <SelectValue placeholder="Select session" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-none shadow-2xl">
                                                {sessions.map((s) => (
                                                    <SelectItem key={s.id} value={s.id} className="rounded-xl font-bold py-3">{s.name} {s.isCurrent && "(Active)"}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Term / Period</label>
                                        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                                            <SelectTrigger className="rounded-2xl h-14 border-slate-100 font-bold focus:ring-indigo-500/20">
                                                <SelectValue placeholder="Select period" />
                                            </SelectTrigger>
                                             <SelectContent className="rounded-2xl border-none shadow-2xl">
                                                {periods.map((p) => (
                                                    <SelectItem key={p.id} value={p.id} className="rounded-xl font-bold py-3">
                                                        {p.name} {p.isCurrent && "(Current)"} {p.status && p.status !== 'ACTIVE' && p.status !== 'INACTIVE' && `[${p.status}]`}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </Card>

                            <Card className="lg:col-span-12 border-none shadow-2xl shadow-indigo-200/50 rounded-[2.5rem] bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-700 p-10 flex flex-col md:flex-row items-center justify-between text-white relative overflow-hidden group">
                                 <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-40 -mt-40 group-hover:scale-150 transition-transform duration-700" />
                                 <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-400/20 rounded-full blur-2xl -ml-20 -mb-20" />
                                 
                                 <div className="relative z-10 space-y-4 text-center md:text-left">
                                     <div className="flex items-center gap-3 justify-center md:justify-start">
                                         <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                                             <Sparkles className="h-5 w-5 text-indigo-100" />
                                         </div>
                                         <p className="text-[10px] font-black text-indigo-100 uppercase tracking-[0.2em]">Official Digital Records</p>
                                     </div>
                                     <h2 className="text-3xl font-black font-sora tracking-tight">Report Card is Ready!</h2>
                                     <p className="text-indigo-100 max-w-md font-medium">Download the official academic transcript for {child.user.name} for the selected term.</p>
                                 </div>

                                 <div className="relative z-10 mt-8 md:mt-0 w-full md:w-auto">
                                     <Button
                                         onClick={() => handleDownload(child.id, child.user.name)}
                                         disabled={downloading || results.length === 0}
                                         className="w-full md:w-auto bg-white text-indigo-600 hover:bg-slate-50 rounded-2xl h-16 px-12 font-black shadow-xl shadow-indigo-900/20 gap-3 text-lg transition-all active:scale-95"
                                     >
                                         {downloading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Download className="h-6 w-6" />}
                                         DOWNLOAD AS PDF
                                     </Button>
                                 </div>
                            </Card>
                        </div>

                        {/* Metrics Grid */}
                        {metrics && (
                            <motion.div
                                variants={container}
                                initial="hidden"
                                animate="show"
                                className="grid grid-cols-1 md:grid-cols-3 gap-6"
                            >
                                <motion.div variants={item}>
                                    <Card className="border-none shadow-xl shadow-black/5 rounded-[2.5rem] bg-white p-8 group hover:scale-[1.02] transition-transform duration-500 cursor-default">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                                                <TrendingUp className="h-6 w-6" />
                                            </div>
                                            <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[10px] tracking-widest px-3">Performance</Badge>
                                        </div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Average Score</p>
                                        <div className="flex items-baseline gap-2">
                                            <h3 className="text-4xl font-black font-sora text-slate-800">{metrics.average}%</h3>
                                            <p className="text-slate-400 font-bold text-xs">/ 100</p>
                                        </div>
                                        <p className="text-xs text-slate-400 font-medium mt-2">{metrics.totalSubjects} subjects evaluated</p>
                                    </Card>
                                </motion.div>

                                <motion.div variants={item}>
                                    <Card className="border-none shadow-xl shadow-black/5 rounded-[2.5rem] bg-white p-8 group hover:scale-[1.02] transition-transform duration-500 cursor-default">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 transition-colors group-hover:bg-amber-600 group-hover:text-white">
                                                <Award className="h-6 w-6" />
                                            </div>
                                            <Badge className="bg-amber-50 text-amber-600 border-none font-black text-[10px] tracking-widest px-3">Standing</Badge>
                                        </div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Class Position</p>
                                        <div className="flex items-baseline gap-2">
                                            <h3 className="text-4xl font-black font-sora text-slate-800">{metrics.position || 'N/A'}</h3>
                                            <p className="text-slate-400 font-bold text-xs">of {metrics.totalStudents || 'N/A'}</p>
                                        </div>
                                        <p className="text-xs text-slate-400 font-medium mt-2">Relative to cohort performance</p>
                                    </Card>
                                </motion.div>

                                <motion.div variants={item}>
                                    <Card className="border-none shadow-xl shadow-black/5 rounded-[2.5rem] bg-white p-8 group hover:scale-[1.02] transition-transform duration-500 cursor-default">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                                                <BookOpen className="h-6 w-6" />
                                            </div>
                                            <Badge className="bg-slate-50 text-slate-600 border-none font-black text-[10px] tracking-widest px-3">Benchmark</Badge>
                                        </div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Class Average</p>
                                        <div className="flex items-baseline gap-2">
                                            <h3 className="text-4xl font-black font-sora text-slate-800">{metrics.classAverage}%</h3>
                                            <p className="text-slate-400 font-bold text-xs">/ Global</p>
                                        </div>
                                        <p className="text-xs text-slate-400 font-medium mt-2">Overall class mean score</p>
                                    </Card>
                                </motion.div>
                            </motion.div>
                        )}

                        {/* Detailed Results Table */}
                        <Card className="border-none shadow-xl shadow-black/5 rounded-[2.5rem] bg-white overflow-hidden">
                            <CardHeader className="p-10 pb-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-2xl font-black font-sora text-slate-800 flex items-center gap-3">
                                            Subject Breakdown <Sparkles className="h-5 w-5 text-indigo-500" />
                                        </CardTitle>
                                        <CardDescription className="text-slate-400 font-medium mt-1">Detailed performance metrics per subject for this term</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-24">
                                        <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mb-4" />
                                        <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">Calculating Results...</p>
                                    </div>
                                ) : results.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-24 text-center px-6">
                                        <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 mb-6 border border-slate-100 shadow-inner">
                                            <BookOpen className="h-10 w-10" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-400 font-sora">No Published Data</h3>
                                        <p className="text-slate-300 max-w-xs mt-2 font-medium">When results are approved and published by the administration, they will appear here.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader className="bg-slate-50/50">
                                                <TableRow className="border-slate-100 hover:bg-transparent">
                                                    <TableHead className="pl-10 h-16 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Academic Subject</TableHead>
                                                    {results[0]?.componentScores.map((cs: any) => (
                                                        <TableHead key={cs.component.key} className="h-16 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{cs.component.name}</TableHead>
                                                    ))}
                                                    <TableHead className="h-16 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total</TableHead>
                                                    <TableHead className="h-16 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Grade Status</TableHead>
                                                    <TableHead className="pr-10 h-16 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Faculty Remarks</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {results.map((r, idx) => (
                                                    <TableRow key={r.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                                        <TableCell className="pl-10 py-6">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-1 aspect-square rounded-full bg-indigo-500 group-hover:scale-[2] transition-transform duration-300" />
                                                                <span className="font-bold text-slate-700 font-sora">{r.subject.name}</span>
                                                            </div>
                                                        </TableCell>
                                                        {r.componentScores.map((cs: any) => (
                                                            <TableCell key={cs.component.key} className="py-6">
                                                                <div className="flex flex-col">
                                                                    <span className="font-black text-slate-800">{cs.score}</span>
                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">/ {cs.component.maxScore}</span>
                                                                </div>
                                                            </TableCell>
                                                        ))}
                                                        <TableCell className="py-6">
                                                            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-800 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                                                                {r.total}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-6">
                                                            <Badge className={`${r.grade === 'A' ? 'bg-emerald-50 text-emerald-600' :
                                                                    r.grade === 'B' ? 'bg-indigo-50 text-indigo-600' :
                                                                        r.grade === 'C' ? 'bg-amber-50 text-amber-600' :
                                                                            'bg-slate-50 text-slate-600'
                                                                } border-none font-black px-4 py-1.5 rounded-xl text-xs tracking-widest`}>
                                                                {r.grade}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="pr-10 py-6 text-right">
                                                            <span className="text-slate-400 font-medium italic text-xs tracking-tight">{r.remark || "— Standard Assessment —"}</span>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}

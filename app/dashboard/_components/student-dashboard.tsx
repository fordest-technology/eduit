"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Users,
    BookOpen,
    GraduationCap,
    ClipboardCheck,
    Calendar,
    TrendingUp,
    ChevronRight,
    Award,
    Clock,
    UserCircle,
    ArrowUpRight,
    Download,
    Sparkles,
} from "lucide-react";
import { DashboardHeader } from "@/app/components/dashboard-header";
import Link from "next/link";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

interface StudentStats {
    attendancePercentage: number;
    averagePerformance: number;
    totalSubjects: number;
    currentClass: string;
    currentLevel: string;
    attendanceHistory: { date: string; status: string }[];
    recentResults: {
        subject: string;
        total: number;
        grade: string;
        remark: string;
    }[];
    announcements: {
        id: string;
        title: string;
        description: string | null;
        date: string;
        location: string | null;
    }[];
}

export default function StudentDashboard() {
    const [stats, setStats] = useState<StudentStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                setLoading(true);
                const response = await fetch("/api/students/dashboard/stats");

                if (!response.ok) {
                    throw new Error("Failed to fetch dashboard stats");
                }

                const data = await response.json();
                setStats(data);
            } catch (error) {
                console.error("Error fetching stats:", error);
                toast.error("Failed to load your dashboard statistics");
            } finally {
                setLoading(false);
            }
        }

        fetchStats();
    }, []);

    const statsCards = stats
        ? [
            {
                title: "Academic Pulse",
                value: `${stats.averagePerformance}%`,
                desc: "Overall Average",
                icon: TrendingUp,
                color: "bg-indigo-500",
                lightColor: "bg-indigo-50/50",
                textColor: "text-indigo-600",
                borderColor: "border-indigo-100",
            },
            {
                title: "Engagement",
                value: `${stats.attendancePercentage}%`,
                desc: "Attendance Rate",
                icon: Clock,
                color: "bg-emerald-500",
                lightColor: "bg-emerald-50/50",
                textColor: "text-emerald-600",
                borderColor: "border-emerald-100",
            },
            {
                title: "Course Load",
                value: stats.totalSubjects,
                desc: "Active Subjects",
                icon: BookOpen,
                color: "bg-blue-500",
                lightColor: "bg-blue-50/50",
                textColor: "text-blue-600",
                borderColor: "border-blue-100",
            },
            {
                title: "Classification",
                value: stats.currentClass,
                desc: stats.currentLevel,
                icon: GraduationCap,
                color: "bg-purple-500",
                lightColor: "bg-purple-50/50",
                textColor: "text-purple-600",
                borderColor: "border-purple-100",
            },
        ]
        : [];

    if (loading) {
        return (
            <div className="space-y-8 p-8 animate-pulse bg-slate-50/30 min-h-screen">
                <div className="h-48 bg-slate-200/50 rounded-[2.5rem]" />
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-40 bg-slate-100 rounded-[2rem]" />
                    ))}
                </div>
                <div className="grid gap-8 lg:grid-cols-12">
                    <div className="lg:col-span-8 h-[500px] bg-slate-100 rounded-[2.5rem]" />
                    <div className="lg:col-span-4 h-[500px] bg-slate-100 rounded-[2.5rem]" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pt-0 px-8 pb-8 max-w-[1600px] mx-auto min-h-screen bg-slate-50/50 relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-50/50 rounded-full blur-3xl -z-10 -mr-64 -mt-64" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-50/50 rounded-full blur-3xl -z-10 -ml-64 -mb-64" />

            <DashboardHeader
                heading="Student Dashboard"
                text="Track your growth, stay engaged, and aim for excellence."
                showBanner={true}
                icon={<UserCircle className="h-8 w-8 text-white" />}
            />

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <AnimatePresence mode="popLayout">
                    {statsCards.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <motion.div
                                key={stat.title}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    delay: index * 0.1,
                                    type: "spring",
                                    stiffness: 100,
                                    damping: 20
                                }}
                            >
                                <Card className={`border ${stat.borderColor} shadow-xl shadow-black/[0.02] hover:shadow-2xl hover:shadow-black/5 transition-all duration-500 rounded-[2rem] overflow-hidden group bg-white/80 backdrop-blur-sm`}>
                                    <CardContent className="p-5">
                                        <div className="flex items-start justify-between">
                                            <div className={`p-3 rounded-2xl ${stat.lightColor} text-slate-800 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                                                <Icon className={`h-5 w-5 ${stat.textColor}`} />
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.title}</span>
                                                <div className="text-2xl font-black font-sora text-slate-800 tracking-tight leading-none group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-br group-hover:from-slate-800 group-hover:to-slate-400 transition-all duration-500">
                                                    {stat.value}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex items-center justify-between">
                                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{stat.desc}</span>
                                            <div className={`h-1 w-10 rounded-full ${stat.color} opacity-20 group-hover:opacity-40 transition-opacity`} />
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            <div className="grid gap-8 lg:grid-cols-12">
                {/* Performance Trajectory & Learning Gateway */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="lg:col-span-8 space-y-8"
                >
                    <Card className="border-none shadow-2xl shadow-black/5 rounded-[2.5rem] bg-white overflow-hidden">
                        <div className="p-8 pb-4 flex items-center justify-between border-b border-slate-50">
                            <div>
                                <h3 className="text-2xl font-black font-sora text-slate-800 tracking-tight">Academic Trajectory</h3>
                                <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Growth across assessment periods</p>
                            </div>
                            <Button variant="ghost" className="rounded-2xl hover:bg-slate-50 group font-bold text-slate-500" asChild>
                                <Link href="/dashboard/my-results">
                                    Full Report <ArrowUpRight className="h-4 w-4 ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                </Link>
                            </Button>
                        </div>
                        <CardContent className="p-8 h-[400px]">
                            {stats && stats.attendanceHistory.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={stats.attendanceHistory.slice().reverse()}
                                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                    >
                                        <defs>
                                            <linearGradient id="colorPerf" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <Tooltip
                                            contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)' }}
                                            labelStyle={{ fontWeight: 'bold' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="status"
                                            stroke="#4f46e5"
                                            strokeWidth={4}
                                            fillOpacity={1}
                                            fill="url(#colorPerf)"
                                        />
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis hide />
                                        <YAxis hide />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-300 font-bold uppercase tracking-[0.2em] italic">
                                    Awaiting assessment data...
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-2xl shadow-indigo-200/50 rounded-[2.5rem] bg-orange-600 overflow-hidden text-white relative group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-700" />
                        <CardContent className="p-8 relative z-10 flex flex-col md:flex-row items-center gap-8">
                            <div className="flex-1 text-center md:text-left">
                                <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                                    <Sparkles className="h-4 w-4 text-orange-200" />
                                    <span className="text-[10px] font-black text-orange-200 uppercase tracking-[0.2em]">Official Announcement</span>
                                </div>
                                <h4 className="text-2xl font-black font-sora tracking-tight mb-2">Your Report Card is Ready</h4>
                                <p className="text-orange-100 font-medium text-base max-w-md">The academic results for the current term have been published and are ready for download.</p>
                            </div>
                            <div className="flex flex-col gap-3 w-full md:w-auto">
                                <Link href="/dashboard/my-results">
                                    <Button className="w-full md:w-48 h-14 rounded-[1rem] bg-white text-orange-600 hover:bg-orange-50 border-none font-black text-sm transition-all duration-300 shadow-xl shadow-orange-900/20">
                                        <Download className="h-5 w-5 mr-2" />
                                        DOWNLOAD PDF
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-2xl shadow-black/5 rounded-[2.5rem] bg-slate-900 overflow-hidden text-white relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-32 -mt-32" />
                        <CardContent className="p-8 relative z-10 flex flex-col md:flex-row items-center gap-8">
                            <div className="flex-1 text-center md:text-left">
                                <h4 className="text-2xl font-black font-sora tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">Your Learning Gateway</h4>
                                <p className="text-slate-400 font-medium text-base max-w-md">Access your subjects, join virtual classes, and track your history from one unified hub.</p>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
                                <Link href="/dashboard/my-classes">
                                    <Button className="w-full h-12 rounded-[1rem] bg-white/10 hover:bg-white hover:text-slate-900 border-none backdrop-blur-md font-bold text-sm transition-all duration-300">
                                        <GraduationCap className="h-5 w-5 mr-2" />
                                        Classes
                                    </Button>
                                </Link>
                                <Link href="/dashboard/my-results">
                                    <Button className="w-full h-12 rounded-[1rem] bg-white/10 hover:bg-white hover:text-slate-900 border-none backdrop-blur-md font-bold text-sm transition-all duration-300">
                                        <Award className="h-5 w-5 mr-2" />
                                        Results
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Sidebar: Announcements & Spotlight */}
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7, duration: 0.8 }}
                    className="lg:col-span-4 space-y-8"
                >
                    {/* Announcements Card */}
                    <Card className="border-none shadow-2xl shadow-black/5 rounded-[2.5rem] bg-white overflow-hidden">
                        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                            <h3 className="text-lg font-black font-sora text-slate-800 tracking-tight">Announcements</h3>
                            <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center">
                                <Calendar className="h-4 w-4 text-slate-400" />
                            </div>
                        </div>
                        <CardContent className="p-0">
                            {stats && stats.announcements.length > 0 ? (
                                <div className="divide-y divide-slate-50">
                                    {stats.announcements.map((announcement) => (
                                        <div key={announcement.id} className="p-6 hover:bg-slate-50/50 transition-all duration-300 group">
                                            <div className="flex gap-4">
                                                <div className="flex flex-col items-center justify-center h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex-shrink-0">
                                                    <span className="text-[8px] font-black uppercase tracking-widest leading-none mb-1">
                                                        {new Date(announcement.date).toLocaleString('default', { month: 'short' })}
                                                    </span>
                                                    <span className="text-sm font-black font-sora leading-none">
                                                        {new Date(announcement.date).getDate()}
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-sm text-slate-800 font-sora truncate group-hover:text-indigo-600 transition-colors">
                                                        {announcement.title}
                                                    </h4>
                                                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                                        {announcement.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center opacity-30">
                                    <Clock className="h-10 w-10 mb-2 text-slate-300" />
                                    <p className="font-bold text-slate-400 uppercase tracking-widest text-[8px]">No updates</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Academic Spotlight Card */}
                    <Card className="border-none shadow-2xl shadow-black/5 rounded-[2.5rem] bg-white overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                            <h3 className="text-lg font-black font-sora text-slate-800 tracking-tight">Spotlight</h3>
                            <Award className="h-4 w-4 text-slate-400" />
                        </div>
                        <CardContent className="p-0 flex-1">
                            {stats && stats.recentResults.length > 0 ? (
                                <div className="divide-y divide-slate-50">
                                    {stats.recentResults.map((result, i) => (
                                        <div key={i} className="p-6 hover:bg-slate-50/50 transition-all duration-300 group">
                                            <div className="flex items-start justify-between mb-2">
                                                <h5 className="font-bold text-sm text-slate-800 font-sora truncate group-hover:text-indigo-600 transition-colors">{result.subject}</h5>
                                                <Badge className="bg-slate-900 text-white font-black text-[10px] h-6 px-3 rounded-lg border-none">
                                                    {result.grade}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${result.total}%` }}
                                                        transition={{ delay: 1.2 + (i * 0.1), duration: 1 }}
                                                        className="h-full bg-indigo-500"
                                                    />
                                                </div>
                                                <span className="text-xs font-black text-slate-700 font-sora">{result.total}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center opacity-30">
                                    <Award className="h-10 w-10 mb-2 text-slate-300" />
                                    <p className="font-bold text-slate-400 uppercase tracking-widest text-[8px]">No results</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Small Performance Summary */}
                    <Card className="border-none shadow-2xl shadow-black/5 rounded-[2.5rem] bg-indigo-600 text-white p-6">
                        <div className="flex items-center justify-between mb-4">
                            <TrendingUp className="h-5 w-5 text-indigo-200" />
                            <Badge className="bg-white/20 text-white border-none backdrop-blur-sm px-2 py-0 h-5 text-[10px]">Live Track</Badge>
                        </div>
                        <h4 className="text-2xl font-black font-sora">{stats?.averagePerformance}%</h4>
                        <p className="text-indigo-100 font-bold uppercase tracking-widest text-[8px] mt-1">Current Academic Rating</p>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}

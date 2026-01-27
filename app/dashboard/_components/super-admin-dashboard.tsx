"use client";

import { useEffect, useState } from "react";
import { 
    Users, 
    School as SchoolIcon, 
    GraduationCap, 
    TrendingUp, 
    CreditCard, 
    MoreVertical, 
    RefreshCw,
    ShieldCheck,
    ShieldAlert,
    BarChart3,
    Trophy,
    Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
    LineChart, 
    Line, 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    AreaChart, 
    Area,
    Cell,
    PieChart,
    Pie
} from "recharts";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface GlobalStats {
    totalSchools: number;
    totalStudents: number;
    totalTeachers: number;
    totalRevenue: number;
    systemAvg: number;
}

interface School {
    id: string;
    name: string;
    subdomain: string;
    billingStatus: "ACTIVE" | "BLOCKED";
    studentCount: number;
    teacherCount: number;
    avgPerformance: number;
    successRate: number;
    createdAt: string;
}

interface BestStudent {
    name: string;
    school: string;
    img?: string;
    avg: number;
}

import { useSearchParams, useRouter } from "next/navigation";

export function SuperAdminDashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<GlobalStats | null>(null);
    const [schools, setSchools] = useState<School[]>([]);
    const [bestStudent, setBestStudent] = useState<BestStudent | null>(null);
    const searchParams = useSearchParams();
    const router = useRouter();
    const show = searchParams.get("show");

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/super-admin/data");
            const data = await res.json();
            if (res.ok) {
                setStats(data.stats);
                setSchools(data.schools);
                setBestStudent(data.bestStudent);
            } else {
                toast.error(data.message || "Failed to fetch dashboard data");
            }
        } catch (error) {
            toast.error("An error occurred while fetching data");
        } finally {
            setLoading(false);
        }
    };

    const toggleBillingStatus = async (schoolId: string, currentStatus: string) => {
        const newStatus = currentStatus === "ACTIVE" ? "BLOCKED" : "ACTIVE";
        try {
            const res = await fetch(`/api/super-admin/schools/${schoolId}/billing`, {
                method: "PATCH",
                body: JSON.stringify({ status: newStatus }),
                headers: { "Content-Type": "application/json" }
            });
            if (res.ok) {
                toast.success(`School ${newStatus === "ACTIVE" ? "unblocked" : "blocked"} successfully`);
                fetchData();
            } else {
                toast.error("Failed to update school status");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) return <DashboardSkeleton />;

    // Logic to determine what sections to show
    const showAll = !show;
    const isSchoolsView = show === "schools" || showAll;
    const isAnalyticsView = show === "analytics" || showAll;
    const isRevenueView = show === "revenue" || showAll;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Executive Highlights */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard 
                    title="Total Schools" 
                    value={stats?.totalSchools || 0} 
                    icon={<SchoolIcon className="h-5 w-5 text-green-600" />} 
                    description="Active institutional nodes"
                    color="green"
                />
                <StatCard 
                    title="System Capacity" 
                    value={`${(stats?.totalStudents || 0).toLocaleString()}`} 
                    icon={<Users className="h-5 w-5 text-orange-600" />} 
                    description="Total student population"
                    color="orange"
                />
                <StatCard 
                    title="Educator Network" 
                    value={stats?.totalTeachers || 0} 
                    icon={<GraduationCap className="h-5 w-5 text-green-600" />} 
                    description="Verified teaching staff"
                    color="green"
                />
                <StatCard 
                    title="Platform Revenue" 
                    value={`₦${(stats?.totalRevenue || 0).toLocaleString()}`} 
                    icon={<CreditCard className="h-5 w-5 text-orange-600" />} 
                    description="Cumulative usage billing"
                    color="orange"
                />
            </div>

            <div className="grid gap-6 lg:grid-cols-12">
                {/* Academic Performance Index */}
                {isAnalyticsView && (
                    <Card className="lg:col-span-8 border-none shadow-sm rounded-3xl bg-white border border-slate-100">
                        <CardHeader className="flex flex-row items-center justify-between pb-4">
                            <div>
                                <CardTitle className="text-lg font-bold text-slate-900">Academic Performance Index</CardTitle>
                                <CardDescription className="text-slate-500">Cross-institutional success rate trends</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 mr-4">
                                    <div className="h-2 w-2 rounded-full bg-green-500" />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Success Rate</span>
                                </div>
                               <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-700 rounded-lg px-3 py-1 font-bold">System Average: {stats?.systemAvg}%</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="pb-6">
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={schools.slice(0, 8)} barGap={0}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis 
                                            dataKey="name" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 500}} 
                                        />
                                        <YAxis 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 500}} 
                                            unit="%"
                                        />
                                        <Tooltip 
                                            cursor={{fill: '#f8fafc'}}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                                        />
                                        <Bar 
                                            dataKey="successRate" 
                                            fill="#f97316" 
                                            radius={[4, 4, 0, 0]} 
                                            barSize={40}
                                            name="Success Rate %"
                                        >
                                            {schools.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.successRate > 70 ? '#22c55e' : '#f97316'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* System Activity */}
                {isAnalyticsView && (
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="border-none shadow-sm rounded-3xl bg-white border border-slate-100 overflow-hidden">
                            <CardHeader className="bg-slate-50/50 pb-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <Activity className="h-4 w-4 text-green-600" />
                                    <CardTitle className="text-sm font-bold">System Health</CardTitle>
                                </div>
                                <CardDescription className="text-xs">Real-time infrastructure metrics</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-5">
                                <MetricRow label="Growth Velocity" value="+12.4%" trend="up" />
                                <MetricRow label="API Uptime" value="99.98%" trend="stable" />
                                <MetricRow label="Security Score" value="A+" trend="up" />
                                <div className="pt-2">
                                    <Button className="w-full bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold h-10">
                                        View Full System Logs
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {bestStudent && (
                            <Card className="border-none shadow-sm rounded-3xl bg-gradient-to-br from-green-600 to-green-700 text-white p-1">
                                <div className="bg-white/5 backdrop-blur-sm rounded-[1.4rem] p-5">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Trophy className="h-4 w-4 text-orange-400" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-green-100">Top Performer</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-12 w-12 border-2 border-green-400">
                                            <AvatarImage src={bestStudent.img} />
                                            <AvatarFallback className="bg-green-800 font-bold">{bestStudent.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h4 className="text-sm font-bold">{bestStudent.name}</h4>
                                            <p className="text-[10px] text-green-100 opacity-80">{bestStudent.school}</p>
                                        </div>
                                        <div className="ml-auto text-right">
                                            <span className="text-lg font-black">{bestStudent.avg}%</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>
                )}
            </div>

            {/* Institutional Ledger */}
            {isSchoolsView && (
                <Card className="border-none shadow-sm rounded-3xl bg-white border border-slate-100 overflow-hidden">
                    <CardHeader className="px-6 py-6 border-b border-slate-50 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-bold text-slate-800">Institutional Ledger</CardTitle>
                            <CardDescription className="text-xs">Global governance of all onboarded schools</CardDescription>
                        </div>
                    </CardHeader>
                    <div className="relative overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-slate-50 bg-slate-50/30 font-medium">
                                    <TableHead className="pl-6 h-12 text-[10px] uppercase tracking-wider font-bold text-slate-400">Institution</TableHead>
                                    <TableHead className="h-12 text-[10px] uppercase tracking-wider font-bold text-slate-400 text-center">Students</TableHead>
                                    <TableHead className="h-12 text-[10px] uppercase tracking-wider font-bold text-slate-400 text-center">Teachers</TableHead>
                                    <TableHead className="h-12 text-[10px] uppercase tracking-wider font-bold text-slate-400 text-center">Success KPI</TableHead>
                                    <TableHead className="h-12 text-[10px] uppercase tracking-wider font-bold text-slate-400">Status</TableHead>
                                    <TableHead className="pr-6 h-12 text-right text-[10px] uppercase tracking-wider font-bold text-slate-400">Management</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {schools.map((school) => (
                                    <TableRow key={school.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="pl-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-shrink-0 h-9 w-9 rounded-xl bg-green-50 text-green-700 flex items-center justify-center font-bold text-xs">
                                                    {school.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-slate-700">{school.name}</div>
                                                    <div className="text-[10px] text-slate-400">{school.subdomain}.eduit.app</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center text-sm font-medium text-slate-600">{school.studentCount}</TableCell>
                                        <TableCell className="text-center text-sm font-medium text-slate-600">{school.teacherCount}</TableCell>
                                        <TableCell className="text-center">
                                            <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                                                {school.successRate}% Avg
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge 
                                                className={`rounded-lg px-2 py-0.5 text-[9px] font-bold uppercase tracking-tight border-none ${
                                                    school.billingStatus === "ACTIVE" 
                                                    ? "bg-green-100 text-green-700 hover:bg-green-200" 
                                                    : "bg-orange-100 text-orange-700 hover:bg-orange-200"
                                                }`}
                                            >
                                                {school.billingStatus}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="pr-6 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-100">
                                                        <MoreVertical className="h-4 w-4 text-slate-400" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="rounded-xl border-slate-100">
                                                    <DropdownMenuItem className="text-xs font-medium py-2 px-3 focus:bg-slate-50 cursor-pointer" onClick={() => router.push(`/dashboard/schools/${school.id}`)}>
                                                        <BarChart3 className="h-3.5 w-3.5 mr-2" />
                                                        View Detailed Audit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-xs font-medium py-2 px-3 focus:bg-slate-50 cursor-pointer" onClick={() => toggleBillingStatus(school.id, school.billingStatus)}>
                                                        {school.billingStatus === "ACTIVE" ? (
                                                            <div className="flex items-center text-orange-600">
                                                                <ShieldAlert className="h-3.5 w-3.5 mr-2" />
                                                                Suspend Service
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center text-green-600">
                                                                <ShieldCheck className="h-3.5 w-3.5 mr-2" />
                                                                Restore Service
                                                            </div>
                                                        )}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            )}

            {/* Revenue View specific content could go here */}
            {show === "revenue" && (
                <div className="p-12 text-center bg-white rounded-[2rem] border border-dashed border-slate-200">
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-2">Revenue Ledger</p>
                    <h3 className="text-lg font-black text-slate-800">Detailed transactions and billing history coming soon</h3>
                </div>
            )}
        </div>
    );
}

function MetricRow({ label, value, trend }: any) {
    return (
        <div className="flex items-center justify-between group cursor-default">
            <span className="text-xs font-medium text-slate-500 group-hover:text-slate-700 transition-colors">{label}</span>
            <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">{value}</span>
                {trend === "up" && <div className="h-1 w-1 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />}
                {trend === "stable" && <div className="h-1 w-1 rounded-full bg-blue-500" />}
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, description, color }: any) {
    const colorStyles: any = {
        green: "bg-green-50 text-green-600 border-green-100/50",
        orange: "bg-orange-50 text-orange-600 border-orange-100/50",
    };

    return (
        <Card className="border border-slate-100 shadow-sm rounded-3xl bg-white overflow-hidden transition-all duration-300 hover:shadow-md hover:border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</CardTitle>
                <div className={cn("p-2 rounded-xl border", colorStyles[color])}>
                    {icon}
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-slate-900 mb-0.5 tracking-tight">{value}</div>
                <p className="text-[10px] text-slate-500 font-medium">{description}</p>
            </CardContent>
        </Card>
    );
}

function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-3xl" />)}
            </div>
            <div className="grid gap-6 lg:grid-cols-12">
                <Skeleton className="lg:col-span-8 h-[400px] rounded-3xl" />
                <div className="lg:col-span-4 space-y-6">
                    <Skeleton className="h-48 rounded-3xl" />
                    <Skeleton className="h-32 rounded-3xl" />
                </div>
            </div>
        </div>
    );
}



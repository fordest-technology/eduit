"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { motion } from "framer-motion"
import {
    CreditCard,
    DollarSign,
    Clock,
    Users,
    CalendarDays,
    GraduationCap,
    TrendingUp,
    Bell,
    ChevronRight,
    ClipboardCheck,
    Calendar,
    Download,
    Sparkles
} from "lucide-react"
import { DashboardHeader } from "@/app/components/dashboard-header"

interface ParentDashboardProps {
    data: {
        children: {
            id: string;
            name: string;
            profileImage: string | null;
            class?: string;
        }[]
        stats: {
            totalBilled: number
            totalPaid: number
            pendingPayments: number
            approvedPayments: number
            remainingBalance: number
        }
    }
}

export function ParentDashboard({ data }: ParentDashboardProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
            minimumFractionDigits: 0
        }).format(amount)
    }

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    }

    return (
        <div className="flex-1 space-y-8 p-8 pt-6 min-h-screen bg-slate-50/50 relative overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-3xl -z-10 -mr-64 -mt-64" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-50/50 rounded-full blur-3xl -z-10 -ml-64 -mb-64" />

            <DashboardHeader
                heading="Parent Dashboard"
                text="Monitor your children's academic journey and institutional engagements"
                showBanner={true}
                icon={<GraduationCap className="h-8 w-8 text-white" />}
            />

            {/* Results Alert Banner */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <Card className="border-none shadow-2xl shadow-indigo-100 rounded-[2.5rem] bg-orange-600 overflow-hidden text-white relative group mb-8">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-700" />
                    <CardContent className="p-8 relative z-10 flex flex-col md:flex-row items-center gap-8">
                        <div className="flex-1 text-center md:text-left">
                            <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                                <TrendingUp className="h-4 w-4 text-orange-200" />
                                <span className="text-[10px] font-black text-orange-200 uppercase tracking-[0.2em]">Academic Update</span>
                            </div>
                            <h4 className="text-2xl font-black font-sora tracking-tight mb-2">Term Results are Published</h4>
                            <p className="text-orange-100 font-medium text-base max-w-md">Official report cards for your children are now available for download as PDF documents.</p>
                        </div>
                        <div className="flex flex-col gap-3 w-full md:w-auto">
                            <Link href="/dashboard/p-results">
                                <Button className="w-full md:w-48 h-14 rounded-[1rem] bg-white text-orange-600 hover:bg-orange-50 border-none font-black text-sm transition-all duration-300 shadow-xl shadow-orange-900/20">
                                    <Download className="h-5 w-5 mr-2" />
                                    GET RESULTS
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Financial Overview Section */}
            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-4 gap-6"
            >
                <motion.div variants={item}>
                    <Card className="border-none shadow-xl shadow-black/5 rounded-[2rem] overflow-hidden bg-white group hover:shadow-indigo-500/10 transition-all duration-500">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Commitment</CardTitle>
                            <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform duration-500">
                                <DollarSign className="h-5 w-5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black font-sora text-slate-800">{formatCurrency(data.stats.totalBilled)}</div>
                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Accumulated School Fees</p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={item}>
                    <Card className="border-none shadow-xl shadow-black/5 rounded-[2rem] overflow-hidden bg-white group hover:shadow-emerald-500/10 transition-all duration-500">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Liquidated</CardTitle>
                            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform duration-500">
                                <ClipboardCheck className="h-5 w-5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black font-sora text-slate-800">{formatCurrency(data.stats.totalPaid)}</div>
                            <p className="text-[10px] font-bold text-emerald-500 mt-1 uppercase tracking-wider">Successfully Paid</p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={item}>
                    <Card className="border-none shadow-xl shadow-black/5 rounded-[2rem] overflow-hidden bg-white group hover:shadow-rose-500/10 transition-all duration-500">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Outstanding</CardTitle>
                            <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform duration-500">
                                <Clock className="h-5 w-5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black font-sora text-slate-800">{formatCurrency(data.stats.remainingBalance)}</div>
                            <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-wider">Balance Due</p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={item}>
                    <Card className="border-none shadow-xl shadow-black/5 rounded-[2rem] overflow-hidden bg-white group hover:shadow-amber-500/10 transition-all duration-500">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Dependencies</CardTitle>
                            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform duration-500">
                                <Users className="h-5 w-5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black font-sora text-slate-800">{data.children.length}</div>
                            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Linked Student Profiles</p>
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Children Section */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-black font-sora text-slate-800">My Children</h2>
                        <Link href="/dashboard/children">
                            <Button variant="ghost" size="sm" className="font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl gap-2 tracking-tight">
                                Manage Profiles <ChevronRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {data.children.map((child, idx) => (
                            <motion.div
                                key={child.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 + idx * 0.1 }}
                            >
                                <Card className="border-none shadow-xl shadow-black/5 rounded-[2.5rem] overflow-hidden bg-white group hover:shadow-2xl hover:shadow-black/10 transition-all duration-500 p-6 flex flex-col items-center text-center">
                                    <Avatar className="h-24 w-24 rounded-[2rem] shadow-2xl shadow-indigo-500/20 mb-4 transition-transform duration-500 group-hover:scale-105 border-4 border-white">
                                        <AvatarImage src={child.profileImage || undefined} className="object-cover" />
                                        <AvatarFallback className="bg-indigo-50 text-indigo-600 font-black text-2xl uppercase">
                                            {child.name.substring(0, 2)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <h3 className="text-xl font-bold font-sora text-slate-800 mb-1">{child.name}</h3>
                                    <Badge className="bg-indigo-50 text-indigo-600 border-none px-4 py-1 rounded-xl font-bold text-[10px] tracking-widest uppercase mb-6">
                                        {child.class || "Class Pending"}
                                    </Badge>

                                    <div className="grid grid-cols-2 w-full gap-3 mt-auto">
                                        <Link href={`/dashboard/p-attendance?childId=${child.id}`} className="w-full">
                                            <Button variant="outline" className="w-full rounded-2xl border-slate-100 font-bold text-xs h-11 hover:bg-slate-50">
                                                Attendance
                                            </Button>
                                        </Link>
                                        <Link href={`/dashboard/p-results?childId=${child.id}`} className="w-full">
                                            <Button variant="outline" className="w-full rounded-2xl border-slate-100 font-bold text-xs h-11 hover:bg-slate-50">
                                                Results
                                            </Button>
                                        </Link>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                        {data.children.length === 0 && (
                            <Card className="col-span-2 border-dashed border-2 border-slate-200 shadow-none rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-center bg-slate-50/50">
                                <Users className="h-12 w-12 text-slate-200 mb-4" />
                                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No Children Registered</p>
                                <p className="text-slate-300 text-sm max-w-[250px] mt-2 font-medium">Please contact the school administrator to link your children to your account.</p>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Quick Access Sidebar */}
                <div className="lg:col-span-4 space-y-10">
                    <div className="mb-2">
                        <h2 className="text-2xl font-black font-sora text-slate-800 tracking-tight">Quick Access</h2>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="flex flex-col gap-6"
                    >
                        <Link href="/dashboard/cfees">
                            <Card className="border-none shadow-xl shadow-black/5 rounded-[2rem] p-6 bg-white hover:bg-indigo-600 group transition-all duration-500 cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-white/20 group-hover:text-white transition-colors">
                                        <CreditCard className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-slate-800 font-sora group-hover:text-white transition-colors">Fee Management</h4>
                                        <p className="text-xs text-slate-400 font-medium group-hover:text-white/60 transition-colors tracking-tight">View and settle school obligations</p>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-white transition-colors" />
                                </div>
                            </Card>
                        </Link>

                        <Link href="/dashboard/calendar">
                            <Card className="border-none shadow-xl shadow-black/5 rounded-[2rem] p-6 bg-white hover:bg-emerald-600 group transition-all duration-500 cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-white/20 group-hover:text-white transition-colors">
                                        <Calendar className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-slate-800 font-sora group-hover:text-white transition-colors">Academic Calendar</h4>
                                        <p className="text-xs text-slate-400 font-medium group-hover:text-white/60 transition-colors tracking-tight">Track important institutional dates</p>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-white transition-colors" />
                                </div>
                            </Card>
                        </Link>

                        <Link href="/dashboard/announcements">
                            <Card className="border-none shadow-xl shadow-black/5 rounded-[2rem] p-6 bg-white hover:bg-amber-600 group transition-all duration-500 cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:bg-white/20 group-hover:text-white transition-colors">
                                        <Bell className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-slate-800 font-sora group-hover:text-white transition-colors">Announcements</h4>
                                        <p className="text-xs text-slate-400 font-medium group-hover:text-white/60 transition-colors tracking-tight">Stay updated with institution news</p>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-white transition-colors" />
                                </div>
                            </Card>
                        </Link>
                    </motion.div>
                </div>
            </div>
        </div>
    )
} 

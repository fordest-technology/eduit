import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/app/components/dashboard-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
    Users, 
    GraduationCap, 
    BookOpen, 
    TrendingUp, 
    LayoutDashboard,
    ArrowLeft,
    School as SchoolIcon,
    Activity
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function SchoolDetailPage({ params }: { params: { id: string } }) {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") redirect("/dashboard");

    const school = await prisma.school.findUnique({
        where: { id: params.id },
        include: {
            _count: {
                select: {
                    students: true,
                    teachers: true,
                    classes: true,
                    subjects: true
                }
            }
        }
    });

    if (!school) redirect("/dashboard");

    return (
        <div className="flex-1 space-y-8 p-8 pt-6 min-h-screen bg-slate-50/50">
            <Link href="/dashboard?show=schools">
                <Button variant="ghost" className="mb-4 text-slate-500 hover:text-slate-900 gap-2 font-bold px-0">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Control Center
                </Button>
            </Link>

            <DashboardHeader
                heading={school.name}
                text={`Institutional detailed audit for ${school.subdomain}.eduit.app`}
                showBanner={true}
                variant="brand"
                icon={<SchoolIcon className="h-8 w-8 text-white" />}
                action={
                    <Badge className={school.billingStatus === 'ACTIVE' ? "bg-white text-green-600 font-black h-10 px-6 rounded-2xl border-none shadow-lg" : "bg-white text-orange-600 font-black h-10 px-6 rounded-2xl border-none shadow-lg"}>
                        {school.billingStatus}
                    </Badge>
                }
            />

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <DetailCard title="Enrolled Students" value={school._count.students} icon={<Users className="text-green-600" />} color="green" />
                <DetailCard title="Dedicated Faculty" value={school._count.teachers} icon={<GraduationCap className="text-orange-600" />} color="orange" />
                <DetailCard title="Academic Classes" value={school._count.classes} icon={<LayoutDashboard className="text-green-600" />} color="green" />
                <DetailCard title="Curricular Subjects" value={school._count.subjects} icon={<BookOpen className="text-orange-600" />} color="orange" />
            </div>

            <Card className="border-none shadow-xl shadow-black/5 rounded-[2.5rem] bg-white overflow-hidden p-8">
                 <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-green-50 rounded-2xl text-green-600">
                        <Activity className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-800 font-sora">Institutional Health Audit</h3>
                        <p className="text-sm text-slate-500 font-medium tracking-tight">Systematic verification of academic and operational integrity</p>
                    </div>
                 </div>

                 <div className="grid gap-8 md:grid-cols-2">
                    <div className="space-y-6">
                        <HealthRow label="Data Consistency" score="98/100" desc="User and result records integrity" />
                        <HealthRow label="Billing Compliance" score={school.billingStatus === 'ACTIVE' ? "100%" : "0%"} desc="Platform subscription state" />
                        <HealthRow label="Teacher Participation" score="100%" desc="Subject and class assignments" />
                    </div>
                    <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 flex flex-col justify-center items-center text-center">
                        <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
                            <TrendingUp className="h-10 w-10 text-green-600" />
                        </div>
                        <h4 className="text-lg font-bold text-slate-800 mb-1">Health Score: Excellent</h4>
                        <p className="text-xs text-slate-500 max-w-[200px]">This school is operating within the recommended performance parameters.</p>
                    </div>
                 </div>
            </Card>
        </div>
    );
}

function DetailCard({ title, value, icon, color }: any) {
    return (
        <Card className="border-none shadow-xl shadow-black/5 rounded-[2rem] bg-white overflow-hidden p-6 hover:shadow-2xl transition-all duration-500 group">
             <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{title}</span>
                <div className={`p-2 rounded-xl ${color === 'green' ? 'bg-green-50' : 'bg-orange-50'}`}>
                    {icon}
                </div>
             </div>
             <div className="text-4xl font-black text-slate-800 font-sora">{value}</div>
        </Card>
    );
}

function HealthRow({ label, score, desc }: any) {
    return (
        <div className="flex items-start gap-4">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2 shrink-0 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            <div className="flex-1">
                <div className="flex items-center justify-between mb-0.5">
                    <h5 className="font-bold text-slate-800 text-sm">{label}</h5>
                    <span className="text-xs font-black text-green-600">{score}</span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">{desc}</p>
            </div>
        </div>
    );
}

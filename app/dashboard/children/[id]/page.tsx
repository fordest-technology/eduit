import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, GraduationCap, BookOpen, Calendar, Mail, Phone, MapPin, User, ChevronLeft } from "lucide-react"
import { DashboardHeader } from "@/app/components/dashboard-header"
import { format } from "date-fns"
import { BackButton } from "../components/back-button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface ChildDetail {
    id: string;
    user: {
        id: string;
        name: string;
        email: string;
        profileImage: string | null;
    };
    classes: Array<{
        classId: string;
        className: string;
        section: string | null;
    }>;
    address: string | null;
    phone: string | null;
    dateOfBirth: Date | null;
    gender: string | null;
    admissionDate: Date | null;
}

async function getChildDetail(childId: string, parentId: string): Promise<ChildDetail | null> {
    const relationship = await prisma.studentParent.findFirst({
        where: {
            studentId: childId,
            parentId: parentId,
        },
        include: {
            student: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            profileImage: true,
                        },
                    },
                    classes: {
                        include: {
                            class: {
                                select: {
                                    id: true,
                                    name: true,
                                    section: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!relationship) return null;

    return {
        id: relationship.student.id,
        user: relationship.student.user,
        classes: relationship.student.classes.map(cls => ({
            classId: cls.class?.id || "",
            className: cls.class?.name || "Unknown",
            section: cls.class?.section || null,
        })),
        address: relationship.student.address,
        phone: relationship.student.phone,
        dateOfBirth: relationship.student.dateOfBirth,
        gender: relationship.student.gender,
        admissionDate: relationship.student.admissionDate,
    };
}

export default async function ChildDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params;
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    const user = await prisma.user.findUnique({
        where: { id: session.id },
        include: { parent: true },
    });

    if (!user || !user.parent) {
        redirect("/dashboard");
    }

    const child = await getChildDetail(id, user.parent.id);

    if (!child) {
        redirect("/dashboard/children");
    }

    return (
        <div className="flex-1 space-y-10 p-8 pt-6 min-h-screen bg-slate-50/50 relative overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-3xl -z-10 -mr-64 -mt-64" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-50/50 rounded-full blur-3xl -z-10 -ml-64 -mb-64" />

            <DashboardHeader
                heading={`${child.user.name}'s Profile`}
                text="View comprehensive personal and academic records"
                showBanner={true}
                icon={<User className="h-8 w-8 text-white" />}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left Column: Avatar & Summary */}
                <div className="lg:col-span-4 space-y-8">
                    <Card className="border-none shadow-2xl shadow-black/5 rounded-[3rem] bg-white p-10 flex flex-col items-center text-center relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-10 group-hover:opacity-20 transition-opacity duration-500" />

                        <Avatar className="h-40 w-40 rounded-[2.5rem] shadow-2xl shadow-indigo-500/20 mb-6 border-8 border-white relative z-10 transition-transform duration-500 group-hover:scale-105">
                            <AvatarImage src={child.user.profileImage || undefined} className="object-cover" />
                            <AvatarFallback className="bg-indigo-50 text-indigo-600 font-black text-4xl uppercase">
                                {child.user.name.substring(0, 2)}
                            </AvatarFallback>
                        </Avatar>

                        <div className="relative z-10">
                            <h3 className="text-2xl font-black font-sora text-slate-800 mb-2">{child.user.name}</h3>
                            <div className="flex flex-wrap justify-center gap-2 mb-6">
                                {child.classes.map((cls) => (
                                    <Badge key={cls.classId} className="bg-indigo-50 text-indigo-600 border-none px-4 py-1 rounded-xl font-bold text-[10px] tracking-widest uppercase">
                                        {cls.className}
                                    </Badge>
                                ))}
                                {child.classes.length === 0 && (
                                    <Badge className="bg-slate-50 text-slate-400 border-none px-4 py-1 rounded-xl font-bold text-[10px] tracking-widest uppercase">
                                        Unassigned
                                    </Badge>
                                )}
                            </div>
                        </div>

                        <div className="w-full space-y-3 pt-6 border-t border-slate-50 relative z-10">
                            <div className="flex justify-between items-center px-4">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Student ID</span>
                                <span className="text-xs font-bold text-slate-600">ED-{child.id.substring(0, 8).toUpperCase()}</span>
                            </div>
                            <div className="flex justify-between items-center px-4">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Date</span>
                                <span className="text-xs font-bold text-slate-600">{child.admissionDate ? format(child.admissionDate, 'MMM yyyy') : 'N/A'}</span>
                            </div>
                        </div>
                    </Card>

                    <div className="px-4">
                        <BackButton />
                    </div>
                </div>

                {/* Right Column: Detailed Info Sections */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Personal Information Card */}
                    <Card className="border-none shadow-xl shadow-black/5 rounded-[2.5rem] bg-white overflow-hidden">
                        <CardHeader className="p-10 pb-6 border-b border-slate-50 flex flex-row items-center gap-4 space-y-0">
                            <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100/50">
                                <User className="h-6 w-6" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black font-sora text-slate-800 tracking-tight">Personal Profile</CardTitle>
                                <CardDescription className="text-slate-400 font-medium">Verify and monitor basic student identifiers</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Contact Email</label>
                                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100/50 hover:bg-indigo-50/30 transition-colors duration-300">
                                        <Mail className="h-4 w-4 text-indigo-500" />
                                        <span className="text-sm font-bold text-slate-700">{child.user.email}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Residential Address</label>
                                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100/50 hover:bg-indigo-50/30 transition-colors duration-300">
                                        <MapPin className="h-4 w-4 text-indigo-500" />
                                        <span className="text-sm font-bold text-slate-700">{child.address || 'Not Registered'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date of Birth</label>
                                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100/50 hover:bg-indigo-50/30 transition-colors duration-300">
                                        <Calendar className="h-4 w-4 text-indigo-500" />
                                        <span className="text-sm font-bold text-slate-700">{child.dateOfBirth ? format(child.dateOfBirth, 'PPP') : 'N/A'}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Gender</label>
                                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100/50 hover:bg-indigo-50/30 transition-colors duration-300">
                                        <Users className="h-4 w-4 text-indigo-500" />
                                        <span className="text-sm font-bold text-slate-700 capitalize">{child.gender || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Academic Information Card */}
                    <Card className="border-none shadow-xl shadow-black/5 rounded-[2.5rem] bg-white overflow-hidden">
                        <CardHeader className="p-10 pb-6 border-b border-slate-50 flex flex-row items-center gap-4 space-y-0">
                            <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100/50">
                                <GraduationCap className="h-6 w-6" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black font-sora text-slate-800 tracking-tight">Academic Records</CardTitle>
                                <CardDescription className="text-slate-400 font-medium">Current institutional standing and class assignments</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="p-10">
                            <div className="bg-slate-50/50 rounded-[2rem] p-8 border border-slate-100 border-dashed">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Current Institutional Assignments</h4>
                                {child.classes.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {child.classes.map((cls) => (
                                            <div key={cls.classId} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5 hover:scale-105 transition-transform duration-500">
                                                <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                                                    <BookOpen className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <p className="text-lg font-black font-sora text-slate-800">{cls.className}</p>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{cls.section || 'No Section assigned'}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-10">
                                        <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                            <GraduationCap className="h-8 w-8" />
                                        </div>
                                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No Active Class Registry</p>
                                        <p className="text-slate-300 text-sm mt-1">Institutional metadata awaiting synchronization.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
} 

import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, GraduationCap, BookOpen, ChevronRight } from "lucide-react"
import { ChildrenTable } from "./children-table"
import { DashboardHeader } from "@/app/components/dashboard-header"

interface Student {
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
}

async function getParentChildren(parentId: string): Promise<Student[]> {
    const relationships = await prisma.studentParent.findMany({
        where: { parentId },
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

    return relationships.map(rel => ({
        id: rel.student.id,
        user: rel.student.user,
        classes: rel.student.classes.map(cls => ({
            classId: cls.class.id,
            className: cls.class.name,
            section: cls.class.section,
        })),
    }));
}

export default async function ChildrenPage() {
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

    const children = await getParentChildren(user.parent.id);
    const activeChildren = children.filter(child => child.classes.length > 0).length;
    const pendingChildren = children.length - activeChildren;

    return (
        <div className="flex-1 space-y-10 p-8 pt-6 min-h-screen bg-slate-50/50 relative overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-3xl -z-10 -mr-64 -mt-64" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-50/50 rounded-full blur-3xl -z-10 -ml-64 -mb-64" />

            <DashboardHeader
                heading="My Children"
                text="Manage and monitor the academic profiles of all your registered children"
                showBanner={true}
                icon={<Users className="h-8 w-8 text-white" />}
            />

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-xl shadow-grey-500/10 rounded-[2.5rem] bg-indigo-600 text-white overflow-hidden relative p-8 group transition-all duration-500">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
                    <div className="relative z-10 flex flex-col gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                            <Users className="h-7 w-7 text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mb-1">Total Registry</p>
                            <h3 className="text-4xl font-black font-sora">{children.length}</h3>
                            <p className="text-xs font-bold text-white/40 mt-2 uppercase tracking-widest">Registered Students</p>
                        </div>
                    </div>
                </Card>

                <Card className="border-none shadow-xl shadow-black/5 rounded-[2.5rem] bg-white overflow-hidden relative p-8 group transition-all duration-500 hover:shadow-2xl">
                    <div className="flex flex-col gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100/50">
                            <GraduationCap className="h-7 w-7 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Academic Status</p>
                            <h3 className="text-4xl font-black font-sora text-slate-800">{activeChildren}</h3>
                            <p className="text-xs font-bold text-emerald-500 mt-2 uppercase tracking-widest">Active Class Assignments</p>
                        </div>
                    </div>
                </Card>

                <Card className="border-none shadow-xl shadow-black/5 rounded-[2.5rem] bg-white overflow-hidden relative p-8 group transition-all duration-500 hover:shadow-2xl">
                    <div className="flex flex-col gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-100/50">
                            <BookOpen className="h-7 w-7 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Pending Sync</p>
                            <h3 className="text-4xl font-black font-sora text-slate-800">{pendingChildren}</h3>
                            <p className="text-xs font-bold text-amber-500 mt-2 uppercase tracking-widest">Awaiting Class Assignment</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Main Content */}
            <Card className="border-none shadow-2xl shadow-black/5 rounded-[2.5rem] bg-white overflow-hidden">
                <CardHeader className="p-10 pb-6 border-b border-slate-50">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl font-black font-sora text-slate-800 tracking-tight">Children Information</CardTitle>
                            <CardDescription className="text-slate-400 font-medium">Detailed census of children linked to your parent account</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-10 pt-8">
                    <ChildrenTable children={children} />
                </CardContent>
            </Card>
        </div>
    )
} 

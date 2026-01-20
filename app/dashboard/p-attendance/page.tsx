import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma, withErrorHandling } from "@/lib/prisma"
import { DashboardHeader } from "@/app/components/dashboard-header"
import { ParentAttendanceView } from "./_components/parent-attendance-view"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronLeft, CalendarDays } from "lucide-react"

export default async function ParentAttendancePage() {
    const session = await getSession()

    if (!session) {
        redirect("/login")
    }

    if (session.role !== "PARENT") {
        redirect("/dashboard")
    }

    // Get parent's children with retry logic
    const parent = await withErrorHandling(() => prisma.parent.findUnique({
        where: { userId: session.id },
        include: {
            children: {
                include: {
                    student: {
                        include: {
                            user: { select: { name: true, email: true, profileImage: true } },
                            classes: {
                                include: {
                                    class: true,
                                    session: true
                                },
                                where: { session: { isCurrent: true } }
                            }
                        }
                    }
                }
            }
        }
    }))

    if (!parent?.children.length) {
        return (
            <div className="space-y-6">
                <DashboardHeader
                    heading="Attendance Record"
                    text="Monitor your children's school attendance"
                    showBanner={true}
                    icon={<CalendarDays className="h-8 w-8 text-white" />}
                    action={
                        <Link href="/dashboard">
                            <Button variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30 rounded-2xl font-bold gap-2 backdrop-blur-md">
                                <ChevronLeft className="h-4 w-4" /> Back to Dashboard
                            </Button>
                        </Link>
                    }
                />
                <div className="rounded-[2.5rem] border-none bg-white p-12 text-center text-slate-400 shadow-xl shadow-black/5 font-medium">
                    You don't have any children linked to your account.
                </div>
            </div>
        )
    }

    const data = {
        schoolId: session.schoolId!,
        children: parent.children.map((c: any) => ({
            id: c.student.id,
            user: c.student.user,
            currentClass: c.student.classes[0] ? {
                id: c.student.classes[0].classId,
                name: c.student.classes[0].class.name,
                level: c.student.classes[0].class.levelId || "N/A"
            } : null
        }))
    }

    return (
        <div className="space-y-6">
            <DashboardHeader
                heading="Attendance Record"
                text="Track and monitor your children's attendance history"
                showBanner={true}
                icon={<CalendarDays className="h-8 w-8 text-white" />}
                action={
                    <Link href="/dashboard">
                        <Button variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30 rounded-2xl font-bold gap-2 backdrop-blur-md">
                            <ChevronLeft className="h-4 w-4" /> Back to Dashboard
                        </Button>
                    </Link>
                }
            />
            <ParentAttendanceView children={data.children} schoolId={data.schoolId} />
        </div>
    )
}

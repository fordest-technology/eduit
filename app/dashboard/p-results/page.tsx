import { getSession } from "@/lib/auth-client"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { DashboardHeader } from "@/app/components/dashboard-header"
import { ParentResultsDashboard } from "./_components/parent-results-dashboard"

export default async function ParentResultsPage() {
    const session = await getSession(null)

    if (!session) {
        redirect("/login")
    }

    if (session.role !== "PARENT") {
        redirect("/dashboard")
    }

    // Get parent's children
    const parent = await prisma.parent.findUnique({
        where: { userId: session.id },
        include: {
            children: {
                include: {
                    student: {
                        include: {
                            user: { select: { name: true, email: true } },
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
    })

    if (!parent?.children.length) {
        return (
            <div className="space-y-6">
                <DashboardHeader
                    heading="Academic Results"
                    text="View your children's academic performance"
                    showBanner={true}
                />
                <div className="rounded-lg border bg-card p-12 text-center text-muted-foreground">
                    You don't have any children registered in the system.
                </div>
            </div>
        )
    }

    const data = {
        schoolId: session.schoolId!,
        children: parent.children.map(c => ({
            id: c.student.id,
            user: c.student.user,
            currentClass: c.student.classes[0] ? {
                name: c.student.classes[0].class.name,
                level: c.student.classes[0].class.levelId || "N/A"
            } : null
        }))
    }

    return (
        <div className="space-y-6">
            <DashboardHeader
                heading="Academic Results"
                text="View your children's academic performance"
                showBanner={true}
            />
            <ParentResultsDashboard data={data} />
        </div>
    )
}

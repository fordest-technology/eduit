import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/app/components/dashboard-header"
import { UserRole } from "@prisma/client"
import { ParentResultsDashboard } from "./_components/parent-results-dashboard"

interface ParentResultsPageProps {
    searchParams: { [key: string]: string | string[] | undefined }
}

export default async function ParentResultsPage({ searchParams }: ParentResultsPageProps) {
    const session = await getSession()

    if (!session) {
        redirect("/auth/login")
    }

    // Check if user is a parent
    if (session.role !== UserRole.PARENT) {
        redirect("/dashboard")
    }

    // Get parent's children with their results
    const parent = await prisma.parent.findUnique({
        where: { userId: session.id },
        include: {
            children: {
                include: {
                    student: {
                        include: {
                            user: true,
                            results: {
                                include: {
                                    subject: true,
                                    period: true,
                                    session: true,
                                    componentScores: {
                                        include: {
                                            component: {
                                                select: {
                                                    name: true,
                                                    maxScore: true
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            classes: {
                                include: {
                                    class: true,
                                    session: true
                                }
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
                <div className="rounded-lg border bg-card p-8 text-card-foreground shadow-sm">
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <h2 className="text-xl font-bold">No Children Found</h2>
                        <p className="text-center text-muted-foreground">
                            You don't have any children registered in the system.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    // Transform data for the dashboard
    const data = {
        children: parent.children.map(c => {
            const currentClass = c.student.classes.find(cls => cls.session.isCurrent)?.class;
            return {
                id: c.student.id,
                user: {
                    name: c.student.user.name,
                    email: c.student.user.email
                },
                results: c.student.results.map(r => ({
                    id: r.id,
                    subject: {
                        name: r.subject.name,
                        code: r.subject.code || ""
                    },
                    period: {
                        name: r.period.name,
                        startDate: new Date(r.period.createdAt),
                        endDate: new Date(r.period.updatedAt)
                    },
                    session: {
                        name: r.session.name,
                        isCurrent: r.session.isCurrent
                    },
                    totalScore: r.total,
                    grade: r.grade,
                    componentScores: r.componentScores.map(cs => ({
                        component: (cs as any).component.name,
                        score: cs.score,
                        maxScore: (cs as any).component.maxScore
                    }))
                })),
                currentClass: currentClass ? {
                    name: currentClass.name,
                    level: currentClass.levelId || "N/A"
                } : null
            };
        })
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
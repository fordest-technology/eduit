import { getSession } from "@/lib/auth"
import prisma from "@/lib/db"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DashboardHeader } from "@/app/components/dashboard-header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ClassDetailPageProps {
    params: { classId: string }
}

export default async function ClassDetailPage({ params }: ClassDetailPageProps) {
    const session = await getSession()
    if (!session || session.role !== "TEACHER") {
        redirect("/login")
    }

    // Fetch the class and its students
    const cls = await prisma.class.findUnique({
        where: { id: params.classId, teacher: { userId: session.id } },
        include: {
            students: {
                include: {
                    student: {
                        include: { user: true }
                    }
                }
            }
        }
    })

    if (!cls) {
        redirect("/dashboard/my-classes")
    }

    return (
        <div className="container py-6">
            <DashboardHeader
                heading={cls.name}
                text={`Students enrolled in this class${cls.section ? ` (Section: ${cls.section})` : ""}`}
                showBanner={true}
            />
            <Card className="mt-8">
                <CardHeader>
                    <CardTitle>Students</CardTitle>
                    <CardDescription>All students currently enrolled in this class.</CardDescription>
                </CardHeader>
                <CardContent>
                    {cls.students.length === 0 ? (
                        <div className="text-muted-foreground">No students enrolled yet.</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {cls.students.map(sc => (
                                <div key={sc.student.id} className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                                    <Avatar>
                                        <AvatarImage src={sc.student.user.profileImage || undefined} />
                                        <AvatarFallback>{sc.student.user.name?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-medium">{sc.student.user.name}</div>
                                        <div className="text-xs text-muted-foreground">{sc.student.user.email}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
} 
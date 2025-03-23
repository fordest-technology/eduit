"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, Pencil } from "lucide-react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"

interface Subject {
    id: string
    name: string
    department: {
        name: string
    } | null
    level: {
        name: string
    } | null
}

interface TeacherSubject {
    id: string
    subjectId: string
    subject: Subject
}

interface Teacher {
    id: string
    name: string
    teacherSubjects: TeacherSubject[]
}

export default function TeacherSubjects({ teacher }: { teacher: Teacher }) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleManageSubjects = () => {
        // Implement your logic to open a modal or navigate to subject management
        router.push(`/dashboard/teachers/${teacher.id}/subjects`)
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Teaching Subjects</CardTitle>
                <Button size="sm" onClick={handleManageSubjects}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Manage Subjects
                </Button>
            </CardHeader>
            <CardContent>
                {teacher.teacherSubjects && teacher.teacherSubjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {teacher.teacherSubjects.map((ts) => (
                            <Card key={ts.id} className="border overflow-hidden">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg">{ts.subject.name}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {ts.subject.department && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-muted-foreground">Department:</span>
                                                <Badge variant="outline">{ts.subject.department.name}</Badge>
                                            </div>
                                        )}

                                        {ts.subject.level && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-muted-foreground">Level:</span>
                                                <Badge variant="outline">{ts.subject.level.name}</Badge>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-4 flex justify-end">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => router.push(`/dashboard/subjects/${ts.subjectId}`)}
                                        >
                                            <Pencil className="h-4 w-4 mr-2" />
                                            View Subject
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center p-4">
                        <p className="text-muted-foreground mb-4">
                            No subjects assigned to this teacher yet.
                        </p>
                        <Button onClick={handleManageSubjects}>
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Assign Subjects
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
} 
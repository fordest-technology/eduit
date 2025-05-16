"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, Pencil } from "lucide-react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

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

interface Department {
    name: string
}

interface Teacher {
    id: string
    name: string
    subjects: Array<{
        id: string
        name: string
        code: string
        department: Department
    }>
}

interface TeacherSubjectsProps {
    teacher: Teacher;
    onUpdate: () => Promise<void>;
}

export default function TeacherSubjects({ teacher, onUpdate }: TeacherSubjectsProps) {
    const [loading, setLoading] = useState(false)
    const [subjects, setSubjects] = useState<TeacherSubject[]>(
        teacher.subjects.map(s => ({
            id: s.id,
            subjectId: s.id,
            subject: {
                id: s.id,
                name: s.name,
                department: s.department ? { name: s.department.name } : null,
                level: null
            }
        }))
    )
    const router = useRouter()

    // Fetch up-to-date subject data
    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                setLoading(true)
                const response = await fetch(`/api/teachers/${teacher.id}/subjects`)
                if (!response.ok) throw new Error("Failed to fetch subjects")
                const data = await response.json()
                if (data.subjects) {
                    setSubjects(data.subjects)
                }
                await onUpdate()
            } catch (error) {
                console.error("Error fetching subjects:", error)
                toast.error("Failed to fetch updated subject information")
            } finally {
                setLoading(false)
            }
        }

        fetchSubjects()
    }, [teacher.id, onUpdate])

    const handleManageSubjects = () => {
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
                {subjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {subjects.map((ts) => (
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
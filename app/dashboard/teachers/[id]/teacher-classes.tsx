"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, Pencil, GraduationCap, School } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

interface Class {
    id: string
    name: string
    section: string | null
    level?: {
        id: string
        name: string
        description: string | null
    } | null
}

interface Teacher {
    id: string
    name: string
    classes: Class[]
}

export default function TeacherClasses({ teacher }: { teacher: Teacher }) {
    const [loading, setLoading] = useState(false)
    const [classes, setClasses] = useState<Class[]>(teacher.classes || [])
    const router = useRouter()

    // Fetch up-to-date class data with levels
    useEffect(() => {
        const fetchClasses = async () => {
            try {
                setLoading(true)
                const response = await fetch(`/api/teachers/${teacher.id}/classes`)
                if (!response.ok) throw new Error("Failed to fetch classes")
                const data = await response.json()
                if (data.classes) {
                    setClasses(data.classes)
                }
            } catch (error) {
                console.error("Error fetching classes:", error)
                toast.error("Failed to fetch updated class information")
            } finally {
                setLoading(false)
            }
        }

        fetchClasses()
    }, [teacher.id])

    const handleManageClasses = () => {
        router.push(`/dashboard/teachers/${teacher.id}/classes`)
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Assigned Classes</CardTitle>
                <Button size="sm" onClick={handleManageClasses}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Manage Classes
                </Button>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="text-center p-4">
                        <p className="text-muted-foreground">Loading classes...</p>
                    </div>
                ) : classes && classes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {classes.map((cls) => (
                            <Card key={cls.id} className="border overflow-hidden">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg">{cls.name}</CardTitle>
                                        {cls.level && (
                                            <Badge variant="outline" className="ml-2">
                                                <School className="h-3 w-3 mr-1" />
                                                {cls.level.name}
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {cls.section && (
                                        <p className="text-sm text-muted-foreground">
                                            Section: {cls.section}
                                        </p>
                                    )}
                                    <div className="mt-4 flex justify-end">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => router.push(`/dashboard/classes/${cls.id}`)}
                                        >
                                            <Pencil className="h-4 w-4 mr-2" />
                                            View Details
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center p-4">
                        <p className="text-muted-foreground mb-4">
                            No classes assigned to this teacher yet.
                        </p>
                        <Button onClick={handleManageClasses}>
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Assign Classes
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
} 
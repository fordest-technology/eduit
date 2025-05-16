"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, GraduationCap, Users, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useColors } from "@/contexts/color-context"

interface SubjectsClientProps {
    children: React.ReactNode
    stats?: {
        totalSubjects: number
        totalClasses: number
        totalTeachers: number
    }
}

export function SubjectsClient({ children, stats = { totalSubjects: 0, totalClasses: 0, totalTeachers: 0 } }: SubjectsClientProps) {
    const [open, setOpen] = useState(false)
    const { colors } = useColors()

    const handleAddClick = () => {
        setOpen(true)
    }

    return (
        <div className="space-y-8">
            {/* <div className="flex justify-end">
                <Button
                    onClick={handleAddClick}
                    className="gap-1"
                    style={{
                        backgroundColor: colors.primaryColor,
                        color: 'white',
                        hover: {
                            backgroundColor: `${colors.primaryColor}cc`
                        }
                    }}
                >
                    <Plus className="h-4 w-4" />
                    <span>Add Subject</span>
                </Button>
            </div> */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium flex items-center text-blue-700">
                            <BookOpen className="mr-2 h-5 w-5" />
                            Subjects
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-blue-800">{stats.totalSubjects}</p>
                        <p className="text-sm text-blue-600 mt-1">Total subjects</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium flex items-center text-purple-700">
                            <GraduationCap className="mr-2 h-5 w-5" />
                            Classes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-purple-800">{stats.totalClasses}</p>
                        <p className="text-sm text-purple-600 mt-1">Classes using subjects</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium flex items-center text-green-700">
                            <Users className="mr-2 h-5 w-5" />
                            Teachers
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-green-800">{stats.totalTeachers}</p>
                        <p className="text-sm text-green-600 mt-1">Assigned teachers</p>
                    </CardContent>
                </Card>
            </div>

            {children}
        </div>
    )
} 
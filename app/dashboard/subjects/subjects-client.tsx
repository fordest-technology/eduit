"use client"

import React, { useState } from "react"
import { BookOpen, GraduationCap, Users, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useColors } from "@/contexts/color-context"
import { DashboardStatsCard, DashboardStatsGrid } from "@/components/dashboard-stats-card"

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

            {/* Stats Cards Section */}
            <DashboardStatsGrid columns={3}>
                <DashboardStatsCard
                    title="Subjects"
                    value={stats.totalSubjects}
                    icon={BookOpen}
                    color="blue"
                    description="Total curriculum subjects"
                />
                <DashboardStatsCard
                    title="Classes"
                    value={stats.totalClasses}
                    icon={GraduationCap}
                    color="purple"
                    description="Active academic blocks"
                />
                <DashboardStatsCard
                    title="Teachers"
                    value={stats.totalTeachers}
                    icon={Users}
                    color="emerald"
                    description="Specialized educators"
                />
            </DashboardStatsGrid>

            {children}
        </div>
    )
} 
"use client"

import { SchoolSettings } from "./school-settings"
import { UserRole } from "@prisma/client"

interface SettingsContentProps {
    userRole: UserRole
    userId: string
}

export function SettingsContent({ userRole }: SettingsContentProps) {
    const isSchoolAdmin = userRole === "SCHOOL_ADMIN"

    if (!isSchoolAdmin) {
        return (
            <div className="container mx-auto px-4 py-6">
                <div className="bg-destructive/15 p-4 rounded-md">
                    <p className="text-destructive">You don't have permission to access school settings.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-6">
            <SchoolSettings />
        </div>
    )
} 
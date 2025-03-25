"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileSettings } from "./profile-settings"
import { SchoolSettings } from "./school-settings"
import { useColors } from "@/contexts/color-context"
import { UserRole } from "@prisma/client"

interface SettingsContentProps {
    userRole: UserRole
    userId: string
}

export function SettingsContent({ userRole, userId }: SettingsContentProps) {
    const isSchoolAdmin = userRole === "SCHOOL_ADMIN"

    return (
        <div className="container mx-auto px-4 py-6">
            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    {isSchoolAdmin && (
                        <TabsTrigger value="school">School Settings</TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="profile" className="space-y-6">
                    <ProfileSettings userRole={userRole} userId={userId} />
                </TabsContent>

                {isSchoolAdmin && (
                    <TabsContent value="school" className="space-y-6">
                        <SchoolSettings />
                    </TabsContent>
                )}
            </Tabs>
        </div>
    )
} 
// import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, Lock } from "lucide-react"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { UpdateNameForm } from "./_components/update-name-form"
// import { UpdatePasswordForm } from "./_components/update-password-form"
import { DashboardHeader } from "@/app/components/dashboard-header"
import { UpdatePasswordForm } from "./_components/update-password-form"
import { UserRole } from "@prisma/client"

interface ParentSettingsPageProps {
    searchParams: { [key: string]: string | string[] | undefined }
}

export default async function ParentSettingsPage({ searchParams }: ParentSettingsPageProps) {
    const session = await getSession()

    if (!session) {
        redirect("/auth/login")
    }

    // Check if user is a parent
    if (session.role !== UserRole.PARENT) {
        redirect("/dashboard")
    }

    // Get user data
    const user = await prisma.user.findUnique({
        where: { id: session.id },
        select: {
            name: true,
            email: true
        }
    })

    if (!user) {
        redirect("/dashboard")
    }

    return (
        <div className="space-y-6">
            <DashboardHeader
                heading="Settings"
                text="Manage your account settings"
                showBanner={true}
            />

            <div className="grid gap-6">
                {/* Profile Settings */}
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-medium text-blue-700">
                                <User className="mr-2 h-5 w-5 inline" />
                                Profile Settings
                            </CardTitle>
                        </div>
                        <CardDescription className="text-blue-600">
                            Update your personal information
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                        <UpdateNameForm
                            name={user.name}
                            email={user.email}
                        />
                    </CardContent>
                </Card>

                {/* Security Settings */}
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-medium text-purple-700">
                                <Lock className="mr-2 h-5 w-5 inline" />
                                Security Settings
                            </CardTitle>
                        </div>
                        <CardDescription className="text-purple-600">
                            Update your password
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                        <UpdatePasswordForm />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
} 
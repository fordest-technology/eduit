import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Lock, Shield, UserCircle } from "lucide-react"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { UpdateNameForm } from "./_components/update-name-form"
import { DashboardHeader } from "@/app/components/dashboard-header"
import { UpdatePasswordForm } from "./_components/update-password-form"
import { UserRole } from "@prisma/client"
import { Separator } from "@/components/ui/separator"

interface ParentSettingsPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ParentSettingsPage({ searchParams }: ParentSettingsPageProps) {
    const params = await searchParams;
    const session = await getSession()

    if (!session) {
        redirect("/auth/login")
    }

    if (session.role !== UserRole.PARENT) {
        redirect("/dashboard")
    }

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

            <div className="grid gap-6 max-w-4xl mx-auto">
                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-2">
                             <div className="p-2 bg-indigo-50 rounded-lg">
                                <UserCircle className="h-5 w-5 text-indigo-600" />
                             </div>
                             <div>
                                <CardTitle className="text-lg font-semibold text-slate-900">Personal Information</CardTitle>
                                <CardDescription>Update your personal details and contact info</CardDescription>
                             </div>
                        </div>
                    </CardHeader>
                    <Separator className="bg-slate-100" />
                    <CardContent className="p-6">
                        <UpdateNameForm
                            name={user.name}
                            email={user.email}
                        />
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-slate-200">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-2">
                             <div className="p-2 bg-emerald-50 rounded-lg">
                                <Shield className="h-5 w-5 text-emerald-600" />
                             </div>
                             <div>
                                <CardTitle className="text-lg font-semibold text-slate-900">Security</CardTitle>
                                <CardDescription>Manage your password and security questions</CardDescription>
                             </div>
                        </div>
                    </CardHeader>
                    <Separator className="bg-slate-100" />
                    <CardContent className="p-6">
                        <UpdatePasswordForm />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
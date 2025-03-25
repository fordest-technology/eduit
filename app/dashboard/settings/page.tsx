import { Suspense } from "react"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/app/components/dashboard-header"
import Loading from "@/app/login/loading"
import { SettingsContent } from "./_components/settings-content"
import { getSession } from "@/lib/auth"

export const metadata = {
    title: "Settings | Dashboard",
    description: "Manage your account and preferences"
}

export default async function SettingsPage() {
    const session = await getSession()

    if (!session) {
        redirect("/auth/signin")
    }

    return (
        <div className="flex flex-col min-h-screen space-y-6">
            <DashboardHeader
                heading="Settings"
                text="Manage your account settings and preferences."
            />

            <Suspense fallback={<Loading />}>
                <SettingsContent userRole={session.role} userId={session.id} />
            </Suspense>
        </div>
    )
} 
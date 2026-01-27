import { Suspense } from "react"
import { redirect } from "next/navigation"
import Loading from "@/app/login/loading"
import { SettingsContent } from "./_components/settings-content"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/db"

export const metadata = {
    title: "School Settings | Dashboard",
    description: "Manage your school settings and preferences"
}

export default async function SettingsPage() {
    const session = await getSession()

    if (!session) {
        redirect("/auth/signin")
    }

    // Get school colors for styling the banner
    let school = null;
    if (session.schoolId) {
        school = await prisma.school.findUnique({
            where: {
                id: session.schoolId,
            },
            select: {
                name: true,
                primaryColor: true,
                secondaryColor: true,
            },
        })
    }

    const schoolColors = session.role === "SUPER_ADMIN" 
        ? { primaryColor: "#16a34a", secondaryColor: "#ea580c" } // Brand Green & Orange
        : {
            primaryColor: school?.primaryColor || "#3b82f6",
            secondaryColor: school?.secondaryColor || "#1f2937",
        }

    return (
        <div className="flex flex-col min-h-screen">


            <Suspense fallback={<Loading />}>
                <SettingsContent userRole={session.role} userId={session.id} />
            </Suspense>
        </div>
    )
} 
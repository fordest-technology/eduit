import type React from "react"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardNav } from "@/components/dashboard-nav"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  // If no session, redirect to login
  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <div className="fixed left-0 top-0 z-40 h-full">
        <DashboardSidebar
          user={{
            name: session.name,
            role: session.role,
            profileImage: session.profileImage,
          }}
        />
      </div>
      <div className="flex w-full flex-1 flex-col pl-[16rem]">
        <DashboardNav user={session} />
        <main className="flex-1 space-y-4 p-8 pt-6">{children}</main>
      </div>
    </div>
  )
}


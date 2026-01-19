import { withErrorHandling } from "@/lib/prisma"
import prisma from "@/lib/db"
import { getSession } from "@/lib/auth"
import { Bell, BookText } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { hasPermission } from "@/lib/permissions"

export async function RecentActivitiesSection() {
  const session = await getSession()
  if (!session) return null

  // Check permissions
  let perms = session.permissions;
  if (typeof perms === 'string') {
    try { perms = JSON.parse(perms); } catch (e) {}
  }

  const isSuperAdmin = session.role === "SUPER_ADMIN";
  const isSchoolAdmin = session.role === "SCHOOL_ADMIN";
  const hasFullAccess = isSuperAdmin || (isSchoolAdmin && (!perms || (Array.isArray(perms) && perms.length === 0)));
  const canViewResults = hasFullAccess || hasPermission(perms, "view_results");

  if (!canViewResults) return null;

  const recentActivities = await withErrorHandling(() => prisma.result.findMany({
    where: {
      student: {
        user: { schoolId: session.schoolId }
      }
    },
    include: {
      student: { include: { user: true } },
      subject: true
    },
    orderBy: { updatedAt: 'desc' },
    take: 5
  }))

  return (
    <Card className="lg:col-span-8 border-none shadow-xl shadow-black/5 rounded-[2.5rem] bg-white overflow-hidden">
      <CardHeader className="px-8 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold font-sora text-slate-800">Recent Activities</CardTitle>
            <CardDescription className="font-medium text-slate-500">Live updates from across the institution</CardDescription>
          </div>
          <div className="p-2 bg-slate-50 rounded-xl">
            <Bell className="h-5 w-5 text-slate-400" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-8 pb-8 pt-2">
        {recentActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/50">
            <p className="text-slate-400 font-medium">No recent activities available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center p-5 rounded-3xl bg-slate-50/50 hover:bg-white hover:shadow-lg hover:shadow-black/5 border border-transparent hover:border-slate-100 transition-all duration-300 group"
              >
                <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mr-4 border border-slate-100 group-hover:scale-110 transition-transform duration-300">
                  <BookText className="h-6 w-6 text-indigo-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 font-sora truncate">
                    {activity.student?.user?.name || "Unknown Student"}
                  </p>
                  <p className="text-sm text-slate-500 font-medium">
                    Scored <span className="text-indigo-600 font-bold">{activity.total}</span> in <span className="text-slate-700">{activity.subject?.name || "Unknown Subject"}</span>
                  </p>
                </div>
                <div className="ml-4 text-xs font-bold text-slate-400 whitespace-nowrap bg-white px-3 py-1.5 rounded-full border border-slate-100">
                  {format(new Date(activity.updatedAt), "MMM d")}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function ActivitiesSkeleton() {
    return (
        <Card className="lg:col-span-8 h-[500px] border-none shadow-xl shadow-black/5 rounded-[2.5rem] bg-slate-50 animate-pulse" />
    )
}

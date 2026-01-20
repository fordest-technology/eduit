import prisma from "@/lib/db"
import { getSession } from "@/lib/auth"
import { Wallet, Coins, Users, UserCheck, GraduationCap, BookOpen, LayoutDashboard } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { hasPermission, hasFullAccess, can } from "@/lib/permissions"
import { BillingStatus } from "./billing-status"
import { withErrorHandling } from "@/lib/prisma"

export async function DashboardStatsSection() {
  const session = await getSession()
  if (!session) return null

  // Check permissions
  const isSuperAdmin = session.role === "SUPER_ADMIN";
  const fullAccess = hasFullAccess(session);
  const perms = session.permissions;

  const canViewFinance = fullAccess || hasPermission(perms, "view_fees", session.role) || hasPermission(perms, "manage_fees", session.role) || hasPermission(perms, "view_wallet", session.role) || hasPermission(perms, "manage_wallet", session.role);
  const canViewStudents = fullAccess || hasPermission(perms, "view_students", session.role) || hasPermission(perms, "manage_students", session.role);
  const canViewTeachers = fullAccess || hasPermission(perms, "view_teachers", session.role) || hasPermission(perms, "manage_teachers", session.role);
  const canViewClasses = fullAccess || hasPermission(perms, "manage_classes", session.role);
  const canViewSubjects = fullAccess || hasPermission(perms, "manage_subjects", session.role);

  const stats = await withErrorHandling(async () => {
    if (!session.schoolId) {
      return {
        totalStudents: 0,
        totalTeachers: 0,
        totalClasses: 0,
        totalSubjects: 0,
        walletBalance: 0,
      }
    }

    const [totalStudents, totalTeachers, uniqueClasses, totalSubjects, wallet] = await Promise.all([
      prisma.student.count({ where: { user: { schoolId: session.schoolId } } }),
      prisma.teacher.count({ where: { user: { schoolId: session.schoolId } } }),
      prisma.class.groupBy({
        by: ["name"],
        where: { schoolId: session.schoolId },
      }),
      prisma.subject.count({ where: { schoolId: session.schoolId } }),
      prisma.schoolWallet.findUnique({ where: { schoolId: session.schoolId } })
    ]);

    return {
      totalStudents,
      totalTeachers,
      totalClasses: uniqueClasses.length,
      totalSubjects,
      walletBalance: wallet ? Number(wallet.balance) : 0,
    }
  });

  const statsCards = [];
  if (canViewFinance) {
    statsCards.push({ title: "Wallet Balance", value: `₦${stats.walletBalance.toLocaleString()}`, icon: Wallet, color: "emerald", desc: "Current funds" });
    statsCards.push({ title: "Pending Fees", value: 0, icon: Coins, color: "rose", desc: "Unpaid assignments" });
  }
  if (canViewStudents) statsCards.push({ title: "Students", value: stats.totalStudents, icon: Users, color: "blue", desc: "Active enrollments" });
  if (canViewTeachers) statsCards.push({ title: "Teachers", value: stats.totalTeachers, icon: UserCheck, color: "rose", desc: "Active educators" });
  if (canViewClasses) statsCards.push({ title: "Classes", value: stats.totalClasses, icon: GraduationCap, color: "purple", desc: "Total sections" });
  if (canViewSubjects) statsCards.push({ title: "Subjects", value: stats.totalSubjects, icon: BookOpen, color: "emerald", desc: "Course offerings" });

  if (statsCards.length === 0 && !isSuperAdmin) {
    statsCards.push({ title: "Welcome", value: "EduIT", icon: LayoutDashboard, color: "blue", desc: "School Portal ready" });
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsCards.map((stat, i) => (
        <Card key={i} className="group overflow-hidden border-none shadow-xl shadow-black/5 hover:shadow-2xl hover:shadow-black/10 transition-all duration-500 rounded-[2rem] bg-white relative">
          <div className={cn(
            "absolute top-0 right-0 w-24 h-24 blur-[60px] opacity-10 rounded-full transition-all duration-500 group-hover:scale-150 group-hover:opacity-20",
            stat.color === 'emerald' ? "bg-emerald-500" :
              stat.color === 'rose' ? "bg-rose-500" :
                stat.color === 'blue' ? "bg-blue-500" :
                  "bg-purple-500"
          )} />
          <CardHeader className="pb-2 relative z-10">
            <div className="flex items-center justify-between">
              <div className={cn(
                "p-3 rounded-2xl shadow-inner",
                stat.color === 'blue' ? "bg-blue-50 text-blue-600" :
                  stat.color === 'purple' ? "bg-purple-50 text-purple-600" :
                    stat.color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
                      "bg-rose-50 text-rose-600"
              )}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
            <CardDescription className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-4">
              {stat.title}
            </CardDescription>
            <CardTitle className="text-4xl font-black font-sora text-slate-800 tracking-tight">
              {stat.value}
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex items-center text-xs font-semibold text-slate-500">
              <span>{stat.desc}</span>
            </div>
          </CardContent>
        </Card>
      ))}
      {(session.role === "SCHOOL_ADMIN" || session.role === "SUPER_ADMIN") && (
        <div className="sm:col-span-2 h-full">
          <BillingStatus />
        </div>
      )}
    </div>
  )
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="h-44 border-none shadow-xl shadow-black/5 rounded-[2rem] bg-slate-100/50 animate-pulse" />
      ))}
      <div className="sm:col-span-2 h-44 border-none shadow-xl shadow-black/5 rounded-[2rem] bg-slate-100/50 animate-pulse" />
    </div>
  )
}

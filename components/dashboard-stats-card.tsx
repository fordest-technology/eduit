import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"

interface DashboardStatsCardProps {
    title: string
    value: number | string
    icon: LucideIcon
    color: "blue" | "purple" | "emerald" | "amber" | "indigo" | "rose" | "cyan" | "orange" | "pink" | "teal"
    description: string
    className?: string
}

export function DashboardStatsCard({
    title,
    value,
    icon: Icon,
    color,
    description,
    className = ""
}: DashboardStatsCardProps) {
    const colorClasses = {
        blue: "bg-blue-50 text-blue-600",
        purple: "bg-purple-50 text-purple-600",
        emerald: "bg-emerald-50 text-emerald-600",
        amber: "bg-amber-50 text-amber-600",
        indigo: "bg-indigo-50 text-indigo-600",
        rose: "bg-rose-50 text-rose-600",
        cyan: "bg-cyan-50 text-cyan-600",
        orange: "bg-orange-50 text-orange-600",
        pink: "bg-pink-50 text-pink-600",
        teal: "bg-teal-50 text-teal-600"
    }

    const glowClasses = {
        blue: "bg-blue-500",
        purple: "bg-purple-500",
        emerald: "bg-emerald-500",
        amber: "bg-amber-500",
        indigo: "bg-indigo-500",
        rose: "bg-rose-500",
        cyan: "bg-cyan-500",
        orange: "bg-orange-500",
        pink: "bg-pink-500",
        teal: "bg-teal-500"
    }

    return (
        <Card className={`group overflow-hidden border-none shadow-xl shadow-black/5 hover:shadow-2xl hover:shadow-black/10 transition-all duration-500 rounded-[2rem] bg-white relative ${className}`}>
            {/* Ambient Glow */}
            <div className={`absolute top-0 right-0 w-24 h-24 blur-[60px] opacity-10 rounded-full transition-all duration-500 group-hover:scale-150 group-hover:opacity-20 ${glowClasses[color]}`} />

            <CardHeader className="pb-2 relative z-10">
                <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-2xl shadow-inner ${colorClasses[color]}`}>
                        <Icon className="h-6 w-6" />
                    </div>
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-4 font-poppins">
                    {title}
                </p>
                <CardTitle className="text-4xl font-black font-sora text-slate-800 tracking-tight">
                    {value}
                </CardTitle>
            </CardHeader>

            <CardContent className="relative z-10">
                <div className="flex items-center text-xs font-semibold text-slate-500 font-poppins">
                    <span>{description}</span>
                </div>
            </CardContent>
        </Card>
    )
}

interface DashboardStatsGridProps {
    children: React.ReactNode
    columns?: 2 | 3 | 4
    className?: string
}

export function DashboardStatsGrid({
    children,
    columns = 3,
    className = ""
}: DashboardStatsGridProps) {
    const gridCols = {
        2: "lg:grid-cols-2",
        3: "lg:grid-cols-3",
        4: "lg:grid-cols-4"
    }

    return (
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridCols[columns]} gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 ${className}`}>
            {children}
        </div>
    )
}

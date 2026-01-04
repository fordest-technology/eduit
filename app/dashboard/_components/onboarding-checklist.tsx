"use client"

import { CheckCircle2, Circle, ArrowRight, Settings, Users, GraduationCap, Calendar, Layers } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface OnboardingStep {
    id: string
    title: string
    description: string
    href: string
    isCompleted: boolean
    icon: any
}

interface OnboardingChecklistProps {
    stats: {
        totalStudents: number
        totalTeachers: number
        totalClasses: number
        totalSessions: number
        totalLevels: number
    }
}

export function OnboardingChecklist({ stats }: OnboardingChecklistProps) {
    const steps: OnboardingStep[] = [
        {
            id: "session",
            title: "Set Academic Session",
            description: "Define your current term and academic year.",
            href: "/dashboard/sessions",
            isCompleted: stats.totalSessions > 0,
            icon: Calendar,
        },
        {
            id: "levels",
            title: "Create School Levels",
            description: "Setup levels like Primary, Secondary, etc.",
            href: "/dashboard/school-levels",
            isCompleted: stats.totalLevels > 0,
            icon: Layers,
        },
        {
            id: "classes",
            title: "Add Classes",
            description: "Create class sections for your students.",
            href: "/dashboard/classes",
            isCompleted: stats.totalClasses > 0,
            icon: GraduationCap,
        },
        {
            id: "teachers",
            title: "Register Teachers",
            description: "Add your staff members to the portal.",
            href: "/dashboard/teachers",
            isCompleted: stats.totalTeachers > 0,
            icon: Users,
        },
        {
            id: "students",
            title: "Enroll Students",
            description: "Register your students to start tracking results.",
            href: "/dashboard/students",
            isCompleted: stats.totalStudents > 0,
            icon: Users,
        },
    ]

    const completedSteps = steps.filter((step) => step.isCompleted).length
    const progress = (completedSteps / steps.length) * 100

    if (completedSteps === steps.length) return null

    return (
        <Card className="border-none shadow-2xl shadow-orange-500/10 rounded-[2.5rem] bg-white overflow-hidden relative mb-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 blur-[100px] rounded-full -mr-20 -mt-20" />
            <CardHeader className="px-8 pt-8 pb-4 relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-3xl font-black font-sora text-slate-900 tracking-tight">
                            Institutional <span className="text-orange-600">Onboarding</span>
                        </CardTitle>
                        <CardDescription className="text-slate-500 font-medium text-base mt-1">
                            Complete these steps to fully setup your institution's digital portal.
                        </CardDescription>
                    </div>
                    <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Progress</p>
                            <p className="text-xl font-black text-slate-800 font-sora">{Math.round(progress)}%</p>
                        </div>
                        <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 relative overflow-hidden">
                            <div
                                className="absolute bottom-0 left-0 w-full bg-orange-500 transition-all duration-1000 ease-out opacity-20"
                                style={{ height: `${progress}%` }}
                            />
                            <Settings className="h-6 w-6 animate-spin-slow" />
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-8 pb-8 pt-4 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {steps.map((step) => (
                        <Link key={step.id} href={step.href}>
                            <div className={cn(
                                "group p-5 rounded-3xl border-2 transition-all duration-300 h-full flex flex-col justify-between",
                                step.isCompleted
                                    ? "bg-emerald-50/30 border-emerald-100 hover:border-emerald-200"
                                    : "bg-white border-slate-100 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-500/5"
                            )}>
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={cn(
                                            "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                                            step.isCompleted ? "bg-emerald-500 text-white" : "bg-slate-50 text-slate-400 group-hover:bg-orange-500 group-hover:text-white"
                                        )}>
                                            <step.icon className="h-6 w-6" />
                                        </div>
                                        {step.isCompleted ? (
                                            <CheckCircle2 className="h-6 w-6 text-emerald-500 fill-emerald-50" />
                                        ) : (
                                            <Circle className="h-6 w-6 text-slate-200 group-hover:text-orange-200" />
                                        )}
                                    </div>
                                    <h4 className={cn(
                                        "font-bold font-sora mb-1 text-lg",
                                        step.isCompleted ? "text-slate-700" : "text-slate-900"
                                    )}>
                                        {step.title}
                                    </h4>
                                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                        {step.description}
                                    </p>
                                </div>
                                <div className="mt-6 flex items-center text-xs font-black uppercase tracking-widest transition-all duration-300">
                                    {step.isCompleted ? (
                                        <span className="text-emerald-600">Completed</span>
                                    ) : (
                                        <span className="text-orange-600 flex items-center gap-2 group-hover:gap-3">
                                            Go to {step.title.split(' ').pop()} <ArrowRight className="h-3 w-3" />
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

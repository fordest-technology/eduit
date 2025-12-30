"use client"

import { useColors } from "@/contexts/color-context"
import { ReactNode } from "react"

interface DashboardHeaderProps {
    heading: string
    text?: string
    showBanner?: boolean
    icon?: ReactNode
    action?: ReactNode
    children?: React.ReactNode
}

export function DashboardHeader({
    heading,
    text,
    showBanner = false,
    icon,
    action,
    children,
}: DashboardHeaderProps) {
    const { colors } = useColors()

    return (
        <div className="flex flex-col gap-2 mb-8 z-0 relative font-poppins">
            {showBanner && (
                <div
                    className="w-full rounded-[2rem] p-8 py-10 mb-6 shadow-2xl relative overflow-hidden border border-white/20 group"
                    style={{
                        background: `linear-gradient(135deg, ${colors.primaryColor || '#4f46e5'} 0%, ${colors.secondaryColor || '#7c3aed'} 100%)`,
                    }}
                >
                    {/* Background decorative elements */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700" />
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-black/10 rounded-full blur-3xl group-hover:bg-black/20 transition-all duration-700" />

                    <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none"
                        style={{
                            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                            backgroundSize: "32px 32px",
                        }}
                    />

                    <div className="relative z-10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                {icon && (
                                    <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 shadow-inner">
                                        {icon}
                                    </div>
                                )}
                                <div>
                                    <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-md font-sora">
                                        {heading}
                                    </h1>
                                    {text && <p className="text-white/80 max-w-2xl mt-2 text-lg font-medium leading-relaxed">{text}</p>}
                                </div>
                            </div>
                            {action && <div className="flex-shrink-0">{action}</div>}
                        </div>
                    </div>
                </div>
            )}

            {!showBanner && (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 backdrop-blur-sm p-6 rounded-[1.5rem] border border-slate-200/50 shadow-sm">
                    <div className="flex items-center gap-4">
                        {icon && (
                            <div className="p-2.5 bg-slate-100 rounded-xl text-slate-600">
                                {icon}
                            </div>
                        )}
                        <div>
                            <h1 className="text-2xl font-bold font-sora tracking-tight text-slate-800">{heading}</h1>
                            {text && <p className="text-slate-500 font-medium text-sm mt-0.5">{text}</p>}
                        </div>
                    </div>
                    {action && <div className="flex-shrink-0">{action}</div>}
                </div>
            )}

            {children && (
                <div className="mt-4">
                    {children}
                </div>
            )}
        </div>
    )
}

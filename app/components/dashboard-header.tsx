"use client"

import { useColors } from "@/contexts/color-context"
import { ReactNode } from "react"

interface DashboardHeaderProps {
    heading: string
    text?: string
    showBanner?: boolean
    icon?: ReactNode
    action?: ReactNode
}

export function DashboardHeader({ heading, text, showBanner = false, icon, action }: DashboardHeaderProps) {
    const { colors } = useColors()

    return (
        <div className="flex flex-col gap-2 mb-8">
            {showBanner && (
                <div
                    className="w-full rounded-lg p-6 py-8 mb-6 shadow-md relative overflow-hidden"
                    style={{
                        background: `linear-gradient(120deg, ${colors.primaryColor}88 0%, ${colors.secondaryColor}88 100%)`,
                        borderLeft: `4px solid ${colors.primaryColor}`,
                    }}
                >
                    <div className="absolute top-0 left-0 w-full h-full opacity-10"
                        style={{
                            backgroundImage: `radial-gradient(circle at 25px 25px, ${colors.secondaryColor} 2%, transparent 0%), radial-gradient(circle at 75px 75px, ${colors.primaryColor} 2%, transparent 0%)`,
                            backgroundSize: "100px 100px",
                        }}
                    />
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            {icon && <span className="mr-2">{icon}</span>}
                            <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">{heading}</h1>
                        </div>
                        {action && <div>{action}</div>}
                    </div>
                    {text && <p className="text-white/90 max-w-2xl mt-2">{text}</p>}
                </div>
            )}

            {!showBanner && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        {icon && <span className="mr-2">{icon}</span>}
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{heading}</h1>
                            {text && <p className="text-muted-foreground">{text}</p>}
                        </div>
                    </div>
                    {action && <div>{action}</div>}
                </div>
            )}
        </div>
    )
} 
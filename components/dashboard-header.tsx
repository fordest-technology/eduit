import { ReactNode } from "react"

interface DashboardHeaderProps {
    heading: string
    text?: string
    icon?: ReactNode
    showBanner?: boolean
}

export function DashboardHeader({
    heading,
    text,
    icon,
    showBanner = false,
}: DashboardHeaderProps) {
    return (
        <div className="flex items-center justify-between">
            <div className="space-y-1">
                <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                    {icon}
                    {heading}
                </h2>
                {text && (
                    <p className="text-muted-foreground">
                        {text}
                    </p>
                )}
            </div>
        </div>
    )
} 
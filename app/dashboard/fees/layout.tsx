import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Fee Management",
    description: "Manage student fees and payments",
    icons: {
        icon: "/favicon.ico",
    },
}

export default function FeesLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="container mx-auto py-6">
            {children}
        </div>
    )
} 
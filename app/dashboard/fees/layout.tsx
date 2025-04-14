import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Fee Management",
    description: "Manage student fees and payments",
}

export default function FeesLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
} 
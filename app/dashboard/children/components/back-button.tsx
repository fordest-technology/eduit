"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"

export function BackButton() {
    const router = useRouter()

    return (
        <Button
            variant="outline"
            onClick={() => router.back()}
            className="rounded-2xl border-slate-200 font-bold text-xs h-11 px-6 hover:bg-slate-50 gap-2 text-slate-600 transition-all duration-300"
        >
            <ChevronLeft className="h-4 w-4" /> Back to Registry
        </Button>
    )
} 
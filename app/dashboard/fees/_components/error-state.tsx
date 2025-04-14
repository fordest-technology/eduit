'use client'

import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ErrorState() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <h2 className="text-2xl font-semibold">Error Loading Fee Data</h2>
            <p className="text-muted-foreground">
                There was an error loading the fee data. Please try again later.
            </p>
            <Button onClick={() => window.location.reload()}>
                Try Again
            </Button>
        </div>
    )
} 
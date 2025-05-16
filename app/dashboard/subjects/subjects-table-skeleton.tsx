"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export function SubjectsTableSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex-1 space-y-4 w-full">
                    <div className="flex flex-col sm:flex-row gap-4 w-full">
                        <Skeleton className="h-10 w-full sm:w-[300px]" />
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Skeleton className="h-10 w-full sm:w-[180px]" />
                            <Skeleton className="h-10 w-full sm:w-[180px]" />
                            <Skeleton className="h-10 w-full sm:w-[120px]" />
                        </div>
                    </div>
                </div>
            </div>

            <Card className="border border-border/60 shadow-sm">
                <CardContent className="p-6 space-y-4">
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
} 
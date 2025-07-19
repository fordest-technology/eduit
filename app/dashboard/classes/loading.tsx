import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DashboardHeader } from "@/app/components/dashboard-header"
import { GraduationCap } from "lucide-react"

export default function ClassesLoading() {
    return (
        <div className="space-y-6">
            <DashboardHeader
                heading="Class Management"
                text="Loading class data..."
                showBanner={true}
                icon={<GraduationCap className="h-6 w-6" />}
            />

            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {[1, 2, 3].map((i) => (
                    <Card key={i}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-medium">
                                <Skeleton className="h-5 w-32" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-16 mb-2" />
                            <Skeleton className="h-4 w-24" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Classes Table Skeleton */}
            <Card>
                <CardContent className="p-6">
                    <div className="space-y-4">
                        {/* Header */}
                        <div className="flex justify-between items-center">
                            <div>
                                <Skeleton className="h-8 w-32 mb-2" />
                                <Skeleton className="h-4 w-64" />
                            </div>
                            <Skeleton className="h-10 w-32" />
                        </div>

                        {/* Table */}
                        <div className="border rounded-lg">
                            <div className="p-4">
                                <div className="space-y-3">
                                    {/* Table Header */}
                                    <div className="grid grid-cols-6 gap-4 pb-2 border-b">
                                        {['Class', 'Teacher', 'Level', 'Students', 'Subjects', 'Actions'].map((header) => (
                                            <Skeleton key={header} className="h-4 w-16" />
                                        ))}
                                    </div>

                                    {/* Table Rows */}
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <div key={i} className="grid grid-cols-6 gap-4 py-3">
                                            <div className="space-y-1">
                                                <Skeleton className="h-4 w-20" />
                                                <Skeleton className="h-3 w-16" />
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Skeleton className="h-8 w-8 rounded-full" />
                                                <Skeleton className="h-4 w-24" />
                                            </div>
                                            <Skeleton className="h-4 w-16" />
                                            <Skeleton className="h-4 w-12" />
                                            <Skeleton className="h-4 w-12" />
                                            <Skeleton className="h-8 w-8" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
} 
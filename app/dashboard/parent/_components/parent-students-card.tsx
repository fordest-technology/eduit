"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ChevronRight } from "lucide-react"

interface Student {
    id: string
    user: {
        id: string
        name: string
        email?: string
        image?: string
    }
    classes: Array<{
        id: string
        classId: string
        class: {
            id: string
            name: string
            level?: {
                id: string
                name: string
            }
        }
    }>
    enrollmentStatus?: string
}

interface ParentStudentsCardProps {
    children: {
        student: Student
        parentId: string
    }[]
}

export function ParentStudentsCard({ children }: ParentStudentsCardProps) {
    return (
        <Card className="border-primary/10 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="bg-primary/5">
                <CardTitle>My Children</CardTitle>
                <CardDescription>Students linked to your account</CardDescription>
            </CardHeader>


            <CardContent className="p-0">
                {children.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                        <p className="text-muted-foreground">No children linked to your account yet</p>
                        <p className="text-xs text-muted-foreground mt-1">Please contact the school administration</p>
                    </div>
                ) : (
                    <ScrollArea className="h-full max-h-[400px]">
                        <div className="divide-y">
                            {children.map(({ student: child }) => {
                                // Get the main class for the student
                                const mainClass = child.classes?.[0]?.class

                                return (
                                    <div key={child.id} className="p-4 hover:bg-muted/50 transition-colors">
                                        <div className="flex items-start space-x-4">
                                            <Avatar className="h-12 w-12 border border-primary/10">
                                                <AvatarImage src={child.user.image || ""} alt={child.user.name} />
                                                <AvatarFallback className="bg-primary/10 text-primary">
                                                    {child.user.name.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>

                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-medium">{child.user.name}</h3>
                                                    <Badge variant={
                                                        child.enrollmentStatus === "ACTIVE" ? "outline" :
                                                            child.enrollmentStatus === "GRADUATED" ? "secondary" : "destructive"
                                                    }>
                                                        {child.enrollmentStatus || "ACTIVE"}
                                                    </Badge>
                                                </div>

                                                <div className="flex flex-col gap-1 text-sm">
                                                    {mainClass && (
                                                        <div className="flex items-center space-x-1 text-muted-foreground">
                                                            <span>Class:</span>
                                                            <span className="font-medium">{mainClass.name}</span>
                                                            {mainClass.level && (
                                                                <>
                                                                    <Separator orientation="vertical" className="h-3 mx-1" />
                                                                    <span>{mainClass.level.name}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    )}

                                                    {child.user.email && (
                                                        <div className="text-xs text-muted-foreground">
                                                            {child.user.email}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-3 flex items-center justify-between space-x-2">
                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/dashboard/students/${child.id}`}>
                                                        View Profile
                                                    </Link>
                                                </Button>
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/dashboard/fees?student=${child.id}`}>
                                                        Fee History
                                                    </Link>
                                                </Button>
                                            </div>
                                            <Button variant="ghost" size="icon" className="rounded-full" asChild>
                                                <Link href={`/dashboard/students/${child.id}`}>
                                                    <ChevronRight className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>

            {children.length > 0 && (
                <CardFooter className="bg-muted/30 py-3 flex justify-center">
                    <Button variant="outline" asChild>
                        <Link href="/dashboard/students">
                            View All Student Details
                        </Link>
                    </Button>
                </CardFooter>
            )}
        </Card>
    )
}
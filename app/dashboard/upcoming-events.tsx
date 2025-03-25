"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
// import EventCard from "@/components/event-card"
import { toast } from "@/components/ui/use-toast"
import EventCard from "./events/_components/event-card"
import { Calendar } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface Event {
    id: string
    title: string
    description: string | null
    startDate: string
    endDate: string | null
    location: string | null
    isPublic: boolean
}

interface UpcomingEventsProps {
    schoolId?: string
    limit?: number
    className?: string
    showIcon?: boolean
}

export function UpcomingEvents({
    schoolId,
    limit = 5,
    className,
    showIcon = false
}: UpcomingEventsProps) {
    const [events, setEvents] = useState<Event[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchUpcomingEvents() {
            try {
                let url = `/api/events/upcoming?limit=${limit}`
                if (schoolId) url += `&schoolId=${schoolId}`

                const response = await fetch(url)
                if (!response.ok) throw new Error("Failed to fetch events")

                const data = await response.json()
                setEvents(data)
            } catch (error) {
                console.error("Error fetching upcoming events:", error)
                toast({
                    title: "Error",
                    description: "Failed to load upcoming events",
                    variant: "destructive",
                })
            } finally {
                setLoading(false)
            }
        }

        fetchUpcomingEvents()
    }, [schoolId, limit])

    return (
        <Card className={className}>
            <CardHeader className="bg-secondary/5 border-b border-secondary/10">
                <CardTitle>Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : events.length === 0 ? (
                    <div className="flex items-center justify-center h-40">
                        <p className="text-muted-foreground">No upcoming events</p>
                    </div>
                ) : (
                    <div className="space-y-0">
                        {events.map((event, index) => (
                            <div
                                key={event.id}
                                className={cn(
                                    "flex items-center p-4 hover:bg-secondary/5 transition-colors",
                                    index !== events.length - 1 ? "border-b border-secondary/10" : ""
                                )}
                            >
                                {showIcon && (
                                    <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10">
                                        <Calendar className="h-5 w-5 text-secondary" />
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        {event.title}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {format(new Date(event.startDate), "MMM d, yyyy")}
                                        {event.endDate && event.startDate !== event.endDate &&
                                            ` - ${format(new Date(event.endDate), "MMM d, yyyy")}`}
                                    </p>
                                    {event.location && (
                                        <p className="text-xs text-muted-foreground">
                                            📍 {event.location}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
} 
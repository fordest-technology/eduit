'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EventDialog } from './event-dialog'
import { fetchEvents } from '@/app/lib/services/event-service'
import { Event, UserRole } from '@prisma/client'
import { EventList } from './event-list'
// import { fetchEvents } from '@/lib/services/event-service'
// import { EventDialog } from './event-dialog'
// import { EventList } from './event-list'
// import { UserRole } from '@/lib/types/auth'

interface EventsDashboardProps {
    userRole: UserRole
}

export function EventsDashboard({ userRole }: EventsDashboardProps) {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
    const [view, setView] = useState<'list' | 'calendar'>('list')

    const { data: events, isLoading } = useQuery({
        queryKey: ['events', selectedDate],
        queryFn: () => fetchEvents({
            startDate: selectedDate ?? new Date(),
            endDate: new Date((selectedDate ?? new Date()).getTime() + 30 * 24 * 60 * 60 * 1000)
        })
    })

    const canManageEvents = userRole === 'SCHOOL_ADMIN'

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>School Events</CardTitle>
                        <CardDescription>View and manage upcoming school events</CardDescription>
                    </div>
                    {canManageEvents && <EventDialog mode="create" />}
                </div>
            </CardHeader>
            <CardContent>
                <Tabs value={view} onValueChange={(v) => setView(v as 'list' | 'calendar')}>
                    <TabsList>
                        <TabsTrigger value="list">List View</TabsTrigger>
                        <TabsTrigger value="calendar">Calendar View</TabsTrigger>
                    </TabsList>
                    <TabsContent value="list">
                        <EventList
                            events={events as Event[]}
                            isLoading={isLoading}
                            userRole={userRole}
                        />
                    </TabsContent>
                    <TabsContent value="calendar">
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            className="rounded-md border"
                        />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
} 
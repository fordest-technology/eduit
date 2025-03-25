// import { Event } from '@/lib/types/events'
// import { UserRole } from '@/lib/types/auth'
import { format } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'
import { Event, UserRole } from '@prisma/client'
import { EventDialog } from './event-dialog'
// import { EventDialog } from './event-dialog'

interface EventListProps {
    events: Event[]
    isLoading: boolean
    userRole: UserRole
}

export function EventList({ events, isLoading, userRole }: EventListProps) {
    const canManageEvents = userRole === 'SCHOOL_ADMIN'

    if (isLoading) {
        return Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
            </div>
        ))
    }

    return (
        <div className="space-y-4">
            {events.map((event) => (
                <div
                    key={event.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                >
                    <div>
                        <h3 className="font-medium">{event.title}</h3>
                        <p className="text-sm text-muted-foreground">
                            {format(new Date(event.startDate), 'PPP')}
                        </p>
                        <p className="text-sm mt-1">{event.description}</p>
                    </div>
                    {canManageEvents && (
                        <EventDialog mode="edit" event={event} />
                    )}
                </div>
            ))}
        </div>
    )
} 
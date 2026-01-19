'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { ResponsiveSheet } from "@/components/ui/responsive-sheet"
import { Sparkles, Trash2 } from "lucide-react"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { Event } from '@prisma/client'
import { createEvent, deleteEvent, updateEvent } from '@/app/lib/services/event-service'
// import { Event } from '@/lib/types/events'
// import { createEvent, updateEvent, deleteEvent } from '@/lib/services/event-service'

const eventSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    startDate: z.date(),
    endDate: z.date(),
    location: z.string().optional(),
})

type EventFormData = z.infer<typeof eventSchema>

interface EventDialogProps {
    mode: 'create' | 'edit'
    event?: Event
}

export function EventDialog({ mode, event }: EventDialogProps) {
    const [open, setOpen] = useState(false)
    const queryClient = useQueryClient()

    const form = useForm<EventFormData>({
        resolver: zodResolver(eventSchema),
        defaultValues: event
            ? {
                title: event.title,
                description: event.description || '',
                startDate: new Date(event.startDate),
                endDate: event.endDate ? new Date(event.endDate) : new Date(),
                location: event.location || '',
            }
            : {
                title: '',
                description: '',
                startDate: new Date(),
                endDate: new Date(),
                location: '',
            },
    })

    const createMutation = useMutation({
        mutationFn: createEvent,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] })
            setOpen(false)
            form.reset()
        },
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: EventFormData }) =>
            updateEvent(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] })
            setOpen(false)
        },
    })

    const deleteMutation = useMutation({
        mutationFn: deleteEvent,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] })
            setOpen(false)
        },
    })

    function onSubmit(data: EventFormData) {
        if (mode === 'create') {
            createMutation.mutate(data)
        } else if (event) {
            updateMutation.mutate({ id: event.id, data })
        }
    }

    return (
        <>
            <Button 
                onClick={() => setOpen(true)}
                variant={mode === 'create' ? 'default' : 'ghost'} 
                size={mode === 'create' ? 'sm' : 'icon'}
                className={cn(
                    mode === 'create' 
                        ? "h-10 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-tighter shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        : "h-10 w-10 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-all"
                )}
            >
                {mode === 'create' ? (
                    <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Plan Event
                    </>
                ) : 'Edit'}
            </Button>

            <ResponsiveSheet 
                open={open} 
                onOpenChange={setOpen}
                title={mode === 'create' ? 'Institutional Schedule' : 'Update Event Profile'}
                description={mode === 'create'
                    ? 'Establish a new academic or social milestone on the institutional calendar.'
                    : 'Refine the configuration or logistics for this scheduled event.'}
                className="sm:max-w-xl"
            >
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Event Designation</FormLabel>
                                    <FormControl>
                                        <Input {...field} className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white text-lg font-bold transition-all" placeholder="e.g., Annual Sports Summit" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Logistics & Context</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} className="resize-none rounded-2xl bg-slate-50 border-slate-100 focus:bg-white text-sm font-medium transition-all p-4" rows={4} placeholder="Describe the objectives and requirements for this event..." />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Commencement Date</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            'w-full h-14 rounded-2xl bg-slate-50 border-slate-100 font-bold text-lg focus:bg-white transition-all pl-4 text-left',
                                                            !field.value && 'text-slate-400'
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, 'PPP')
                                                        ) : (
                                                            <span>Select commencement</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-5 w-5 opacity-40" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl border-slate-100" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date: Date) =>
                                                        date < new Date(new Date().setHours(0, 0, 0, 0))
                                                    }
                                                    initialFocus
                                                    className="p-4"
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="endDate"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Conclusion Date</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            'w-full h-14 rounded-2xl bg-slate-50 border-slate-100 font-bold text-lg focus:bg-white transition-all pl-4 text-left',
                                                            !field.value && 'text-slate-400'
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, 'PPP')
                                                        ) : (
                                                            <span>Select conclusion</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-5 w-5 opacity-40" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl border-slate-100" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date: Date) =>
                                                        date < form.getValues('startDate')
                                                    }
                                                    initialFocus
                                                    className="p-4"
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Institutional Venue</FormLabel>
                                    <FormControl>
                                        <Input {...field} className="h-14 rounded-2xl bg-slate-50 border-slate-100 focus:bg-white text-lg font-bold transition-all" placeholder="e.g., Main Auditorium, Block C" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-50">
                            {mode === 'edit' && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => event && deleteMutation.mutate(event.id)}
                                    className="flex-1 h-14 rounded-2xl font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 transition-all"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </Button>
                            )}
                            <Button 
                                type="submit"
                                disabled={createMutation.isPending || updateMutation.isPending}
                                className="flex-[2] h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-xl shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {createMutation.isPending || updateMutation.isPending ? (
                                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        {mode === 'create' ? 'Establish Event' : 'Sync Profile'}
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </ResponsiveSheet>
        </>
    )
} 

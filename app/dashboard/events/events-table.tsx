"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import type { UserRole } from "@/lib/auth"
import { Calendar, Edit, Loader2, Plus, Trash } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"

type School = {
  id: string
  name: string
}

type Event = {
  id: string
  title: string
  description?: string | null
  startDate: string
  endDate?: string | null
  location?: string | null
  isPublic: boolean
  schoolId: string
  createdAt: string
  updatedAt: string
}

interface EventsTableProps {
  userRole: UserRole
  userId: string
  schoolId?: string
  schools: School[]
}

export function EventsTable({ userRole, userId, schoolId, schools = [] }: EventsTableProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    location: "",
    isPublic: true,
    schoolId: schoolId || "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Fetch events
  useEffect(() => {
    async function fetchEvents() {
      setLoading(true)
      try {
        let url = "/api/events"

        if (schoolId) {
          url += `?schoolId=${schoolId}`
        }

        const response = await fetch(url)

        if (!response.ok) {
          throw new Error("Failed to fetch events")
        }

        const data = await response.json()
        setEvents(data)
      } catch (error) {
        console.error("Error fetching events:", error)
        toast({
          title: "Error",
          description: "Failed to load events",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [schoolId])

  // Filter events based on search term
  const filteredEvents = events.filter(
    (event) =>
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (event.location && event.location.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Handle checkbox change
  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      isPublic: checked,
    }))
  }

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      location: "",
      isPublic: true,
      schoolId: schoolId || "",
    })
  }

  // Open add dialog
  const openAddDialog = () => {
    resetForm()
    setIsAddDialogOpen(true)
  }

  // Open edit dialog
  const openEditDialog = (event: Event) => {
    setCurrentEvent(event)
    setFormData({
      title: event.title,
      description: event.description || "",
      startDate: event.startDate.split("T")[0], // Format date for input
      endDate: event.endDate ? event.endDate.split("T")[0] : "",
      location: event.location || "",
      isPublic: event.isPublic,
      schoolId: event.schoolId,
    })
    setIsEditDialogOpen(true)
  }

  // Add event
  const addEvent = async () => {
    setSubmitting(true)
    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to add event")
      }

      const newEvent = await response.json()

      setEvents((prev) => [newEvent, ...prev])
      setIsAddDialogOpen(false)
      resetForm()

      toast({
        title: "Success",
        description: "Event added successfully",
      })
    } catch (error: any) {
      console.error("Error adding event:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to add event",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Update event
  const updateEvent = async () => {
    if (!currentEvent) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/events/${currentEvent.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update event")
      }

      const updatedEvent = await response.json()

      setEvents((prev) => prev.map((event) => (event.id === updatedEvent.id ? updatedEvent : event)))
      setIsEditDialogOpen(false)
      setCurrentEvent(null)

      toast({
        title: "Success",
        description: "Event updated successfully",
      })
    } catch (error: any) {
      console.error("Error updating event:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update event",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Delete event
  const deleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete event")
      }

      setEvents((prev) => prev.filter((event) => event.id !== eventId))

      toast({
        title: "Success",
        description: "Event deleted successfully",
      })
    } catch (error: any) {
      console.error("Error deleting event:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete event",
        variant: "destructive",
      })
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "PPP")
    } catch (error) {
      return dateString
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-[300px]"
          />

          {userRole === "SUPER_ADMIN" && (
            <Select value={formData.schoolId} onValueChange={(value) => handleSelectChange("schoolId", value)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Schools" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Schools</SelectItem>
                {schools.map((school) => (
                  <SelectItem key={school.id} value={school.id}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Event
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Loading events...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  No events found
                </TableCell>
              </TableRow>
            ) : (
              filteredEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{event.title}</TableCell>
                  <TableCell>
                    {formatDate(event.startDate)}
                    {event.endDate && ` - ${formatDate(event.endDate)}`}
                  </TableCell>
                  <TableCell>{event.location || "-"}</TableCell>
                  <TableCell>
                    {event.isPublic ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        Public
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                        Private
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(event)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteEvent(event.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Event Sheet */}
      <Sheet open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <SheetContent className="sm:max-w-[500px] w-full overflow-y-auto" side="right">
          <SheetHeader>
            <SheetTitle>Add New Event</SheetTitle>
            <SheetDescription>Create a new event for your school.</SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Annual Sports Day"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Details about the event"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <div className="flex">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <div className="flex">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location (Optional)</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="School Auditorium"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="isPublic" checked={formData.isPublic} onCheckedChange={handleCheckboxChange} />
              <Label htmlFor="isPublic">Make this event public to all users</Label>
            </div>

            {userRole === "SUPER_ADMIN" && (
              <div className="space-y-2">
                <Label htmlFor="schoolId">School</Label>
                <Select
                  name="schoolId"
                  value={formData.schoolId}
                  onValueChange={(value) => handleSelectChange("schoolId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select School" />
                  </SelectTrigger>
                  <SelectContent>
                    {schools.map((school) => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addEvent} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Event
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Edit Event Sheet */}
      <Sheet open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <SheetContent className="sm:max-w-[500px] w-full overflow-y-auto" side="right">
          <SheetHeader>
            <SheetTitle>Edit Event</SheetTitle>
            <SheetDescription>Update event details.</SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Event Title</Label>
              <Input id="edit-title" name="title" value={formData.title} onChange={handleInputChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Textarea
                id="edit-description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-startDate">Start Date</Label>
                <div className="flex">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="edit-startDate"
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-endDate">End Date (Optional)</Label>
                <div className="flex">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="edit-endDate"
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-location">Location (Optional)</Label>
              <Input id="edit-location" name="location" value={formData.location} onChange={handleInputChange} />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="edit-isPublic" checked={formData.isPublic} onCheckedChange={handleCheckboxChange} />
              <Label htmlFor="edit-isPublic">Make this event public to all users</Label>
            </div>

            {userRole === "SUPER_ADMIN" && (
              <div className="space-y-2">
                <Label htmlFor="edit-schoolId">School</Label>
                <Select
                  name="schoolId"
                  value={formData.schoolId}
                  onValueChange={(value) => handleSelectChange("schoolId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select School" />
                  </SelectTrigger>
                  <SelectContent>
                    {schools.map((school) => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateEvent} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Event
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}


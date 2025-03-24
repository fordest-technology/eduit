"use client"

import type React from "react"

import { useState } from "react"
import { createResult } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

export default function ResultGenerator() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [schoolLevel, setSchoolLevel] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData(event.currentTarget)
      if (schoolLevel) {
        formData.set("schoolLevel", schoolLevel)
      }

      await createResult(formData)

      toast({
        title: "Success",
        description: "Result created successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create result",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" placeholder="Enter result title" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" placeholder="Enter result description" rows={4} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="schoolLevel">School Level (Optional)</Label>
        <Select onValueChange={setSchoolLevel}>
          <SelectTrigger>
            <SelectValue placeholder="Select school level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="elementary">Elementary</SelectItem>
            <SelectItem value="middle">Middle School</SelectItem>
            <SelectItem value="high">High School</SelectItem>
            <SelectItem value="college">College</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="score">Score (Optional)</Label>
        <Input id="score" name="score" type="number" min="0" max="100" placeholder="Enter score (0-100)" />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Creating..." : "Create Result"}
      </Button>
    </form>
  )
}


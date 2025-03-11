"use client"

import type React from "react"
import { useState, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { SchoolIcon, ArrowLeft, Upload } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { HexColorPicker } from "react-colorful"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    schoolName: "",
    shortName: "",
    address: "",
    phone: "",
    email: "",
    primaryColor: "#22c55e", // Default green color
    secondaryColor: "#f59e0b", // Default orange color
    adminName: "",
    adminEmail: "",
    adminPassword: "",
    confirmPassword: "",
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleColorChange = (color: string, type: "primaryColor" | "secondaryColor") => {
    setFormData((prev) => ({ ...prev, [type]: color }))
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setLogoFile(file)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const validateForm = () => {
    if (!formData.schoolName || !formData.shortName || !formData.email || !formData.adminName || !formData.adminEmail || !formData.adminPassword || !formData.confirmPassword) {
      setError("All fields are required")
      return false
    }

    if (formData.adminPassword !== formData.confirmPassword) {
      setError("Passwords do not match")
      return false
    }

    if (!/^[a-z0-9]+$/.test(formData.shortName)) {
      setError("School short name must contain only lowercase letters and numbers (no spaces or special characters)")
      return false
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Invalid school email format")
      return false
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminEmail)) {
      setError("Invalid admin email format")
      return false
    }

    if (formData.adminPassword.length < 8) {
      setError("Password must be at least 8 characters long")
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (!validateForm()) {
      setIsLoading(false)
      return
    }

    try {
      const formDataToSend = new FormData()

      // Add all text fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== "confirmPassword") {
          formDataToSend.append(key, value)
        }
      })

      // Add logo file if exists
      if (logoFile) {
        formDataToSend.append("logo", logoFile)
      }

      // Send registration request
      const response = await fetch("/api/schools/register", {
        method: "POST",
        body: formDataToSend,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Registration failed. Please try again.")
      }

      // Redirect to login page with success message
      router.push("/login?registered=true")
    } catch (error: any) {
      console.error("Registration failed:", error)
      setError(error.message || "Registration failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/40 p-4">
      <Link
        href="/"
        className="absolute top-8 left-8 inline-flex items-center text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Home
      </Link>

      <div className="flex items-center mb-8">
        <SchoolIcon className="h-8 w-8 text-primary mr-2" />
        <h1 className="text-2xl font-bold">EduIT</h1>
      </div>

      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Register School</CardTitle>
          <CardDescription className="text-center">Create an account for your educational institution</CardDescription>
          {error && <div className="bg-destructive/15 text-destructive text-center p-3 rounded-md mt-2">{error}</div>}
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {/* School Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">School Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="schoolName">School Name</Label>
                  <Input
                    id="schoolName"
                    name="schoolName"
                    placeholder="Example High School"
                    required
                    value={formData.schoolName}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shortName">School Short Name (for URL)</Label>
                  <Input
                    id="shortName"
                    name="shortName"
                    placeholder="ehs"
                    required
                    value={formData.shortName}
                    onChange={handleChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    This will be used for your school's URL: {formData.shortName ? formData.shortName : "yourschool"}
                    .eduit.com
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">School Address</Label>
                <Textarea
                  id="address"
                  name="address"
                  placeholder="123 Education Street, City, Country"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">School Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="info@school.com"
                    required
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">School Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="+1234567890"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>School Logo</Label>
                  <div
                    className="border-2 border-dashed rounded-md p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {logoPreview ? (
                      <div className="flex flex-col items-center">
                        <img
                          src={logoPreview || "/placeholder.svg"}
                          alt="School logo preview"
                          className="w-24 h-24 object-contain mb-2"
                        />
                        <p className="text-sm text-muted-foreground">Click to change</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Click to upload logo</p>
                      </div>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleLogoChange}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>School Colors</Label>
                    <div className="flex gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Primary</p>
                        <Popover>
                          <PopoverTrigger asChild>
                            <div
                              className="w-10 h-10 rounded-md cursor-pointer border"
                              style={{ backgroundColor: formData.primaryColor }}
                            />
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <HexColorPicker
                              color={formData.primaryColor}
                              onChange={(color) => handleColorChange(color, "primaryColor")}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Secondary</p>
                        <Popover>
                          <PopoverTrigger asChild>
                            <div
                              className="w-10 h-10 rounded-md cursor-pointer border"
                              style={{ backgroundColor: formData.secondaryColor }}
                            />
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <HexColorPicker
                              color={formData.secondaryColor}
                              onChange={(color) => handleColorChange(color, "secondaryColor")}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Account Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Admin Account</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adminName">Admin Name</Label>
                  <Input
                    id="adminName"
                    name="adminName"
                    placeholder="John Doe"
                    required
                    value={formData.adminName}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Admin Email</Label>
                  <Input
                    id="adminEmail"
                    name="adminEmail"
                    type="email"
                    placeholder="admin@school.com"
                    required
                    value={formData.adminEmail}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adminPassword">Password</Label>
                  <Input
                    id="adminPassword"
                    name="adminPassword"
                    type="password"
                    required
                    value={formData.adminPassword}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Registering..." : "Register School"}
            </Button>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Log in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
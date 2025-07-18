"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { useSchoolStore } from "@/store/school-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Eye, EyeOff, AlertCircle, School, GraduationCap, Users, BookOpen } from "lucide-react"
import Link from "next/link"

// TypeScript interface for school data
interface School {
  id: string
  name: string
  shortName: string
  subdomain: string
  logo: string
  primaryColor: string
  secondaryColor: string
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [loginAttempts, setLoginAttempts] = useState(0)
  const [isSchoolLoading, setIsSchoolLoading] = useState(true)
  const router = useRouter();
  const { toast } = useToast();
  const { school, setSchool } = useSchoolStore()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  // Check authentication status using API endpoint
  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/check', {
        method: 'GET',
        credentials: 'include', // Important for cookies
      });

      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          // Redirect based on user role
          if (data.user.role === "super_admin") {
            router.push("/dashboard");
          } else {
            router.push(`/dashboard`);
          }
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    const fetchSchoolData = async () => {
      setIsSchoolLoading(true)
      try {
        // Get the subdomain from the current URL
        const host = window.location.host
        const subdomain = host.split(".")[0]

        if (!subdomain) {
          console.error("No subdomain found in URL")
          return
        }

        console.log("Fetching school data for subdomain:", subdomain)
        const response = await fetch(`/api/public/schools/${subdomain}`)
        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error || "Failed to fetch school data")
        }

        const schoolData = result.data
        if (!schoolData.subdomain) {
          throw new Error("School data is missing required subdomain property")
        }

        console.log("School data fetched successfully:", schoolData.name)
        setSchool(schoolData)
      } catch (error) {
        console.error("Error fetching school data:", error)
        setError(error instanceof Error ? error.message : "Failed to load school data")
      } finally {
        setIsSchoolLoading(false)
      }
    }

    fetchSchoolData()
  }, [setSchool])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Check if max login attempts reached
    if (loginAttempts >= 3) {
      setError("Too many login attempts. Please try again later or reset your password.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include", // Important for cookies
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Successful login
      toast({
        title: "Login Successful",
        description: "Welcome back! You are being redirected...",
      });

      const targetRoute = data.user.role === "super_admin" ? "/dashboard" : `/dashboard`;
      await router.push(targetRoute);

    } catch (error) {
      console.error("Login error:", error);
      setError(error instanceof Error ? error.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  }

  // Format error message for display
  const getErrorMessage = (error: string) => {
    if (error.includes("CredentialsSignin") || error.includes("Invalid credentials")) {
      return "Invalid email or password. Please try again."
    }
    return error
  }

  // Apply dynamic styles based on school colors
  const primaryColor = school?.primaryColor || "#3b82f6"
  const secondaryColor = school?.secondaryColor || "#1f2937"
  const textColor = school?.primaryColor ? "#ffffff" : undefined

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Panel - Decorative */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-[#f97316] via-orange-500 to-[#16a34a] relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:16px_16px]" />
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-400/20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-400/20 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
          <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 to-green-600/10 backdrop-blur-[2px]" />
        </div>
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8">
            <School className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-orange-100">
            Welcome to Eduit
          </h1>
          <p className="text-xl text-orange-50 text-center max-w-md mb-12 font-light">
            Your comprehensive school management platform. Sign in to access your dashboard.
          </p>
          <div className="grid grid-cols-3 gap-6 w-full max-w-2xl">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 transform hover:scale-105 transition-transform duration-300">
              <GraduationCap className="w-8 h-8 mb-4 text-orange-100" />
              <div className="text-2xl font-bold mb-2">500+</div>
              <div className="text-orange-100 text-sm">Schools Trust Us</div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 transform hover:scale-105 transition-transform duration-300">
              <Users className="w-8 h-8 mb-4 text-orange-100" />
              <div className="text-2xl font-bold mb-2">50K+</div>
              <div className="text-orange-100 text-sm">Active Users</div>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 transform hover:scale-105 transition-transform duration-300">
              <BookOpen className="w-8 h-8 mb-4 text-orange-100" />
              <div className="text-2xl font-bold mb-2">99.9%</div>
              <div className="text-orange-100 text-sm">Uptime SLA</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-orange-50/30">
        <Card className="w-full max-w-md shadow-xl border-0 bg-white/70 backdrop-blur-lg">
          <CardHeader className="space-y-1 pb-8">
            <div className="flex flex-col items-center space-y-2">
              {isSchoolLoading ? (
                <div className="h-16 w-16 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-[#f97316]" />
                </div>
              ) : school?.logo ? (
                <img
                  src={school.logo}
                  alt={school.name}
                  className="h-16 w-auto mb-2 object-contain"
                />
              ) : (
                <div className="bg-gradient-to-br from-[#f97316] to-[#16a34a] p-4 rounded-xl">
                  <School className="h-12 w-12 text-white" />
                </div>
              )}
              <CardTitle className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-[#f97316] to-[#16a34a]">
                {isSchoolLoading ? (
                  <div className="h-8 w-48 animate-pulse bg-orange-100 rounded mx-auto" />
                ) : (
                  school?.name || "Welcome Back"
                )}
              </CardTitle>
              <CardDescription className="text-center text-gray-600">
                Sign in to your account to continue
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6 bg-red-50/80 backdrop-blur-lg text-red-600 border-red-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{getErrorMessage(error)}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  autoComplete="email"
                  disabled={isLoading || loginAttempts >= 3}
                  required
                  className="h-12 px-4 bg-white/70 backdrop-blur-sm border-gray-200 focus:border-[#f97316] focus:ring-[#f97316] transition-colors duration-200"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-gray-700">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-[#16a34a] hover:text-[#15803d] transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={isLoading || loginAttempts >= 3}
                    required
                    className="h-12 px-4 bg-white/70 backdrop-blur-sm border-gray-200 focus:border-[#f97316] focus:ring-[#f97316] transition-colors duration-200"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:text-[#f97316] transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    <span className="sr-only">
                      {showPassword ? "Hide password" : "Show password"}
                    </span>
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-medium bg-gradient-to-r from-[#f97316] to-[#16a34a] hover:from-[#ea580c] hover:to-[#15803d] text-white transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                disabled={isLoading || loginAttempts >= 3}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </CardContent>

          {loginAttempts >= 3 && (
            <CardFooter className="flex justify-center pt-6 border-t border-gray-200/50">
              <div className="text-sm text-center">
                <p className="text-gray-600 mb-2">Too many login attempts.</p>
                <Link
                  href="/forgot-password"
                  className="text-[#16a34a] font-medium hover:text-[#15803d] transition-colors"
                >
                  Reset your password
                </Link>
              </div>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  )
}


"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useSchoolStore } from "@/store/school-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Eye, EyeOff, AlertCircle, School, GraduationCap, Users, BookOpen, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [loginAttempts, setLoginAttempts] = useState(0)
  const [isSchoolLoading, setIsSchoolLoading] = useState(true)
  const router = useRouter()
  const { school, setSchool } = useSchoolStore()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isRegistered, setIsRegistered] = useState(false)

  // Check authentication status using API endpoint
  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/check', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          router.push("/dashboard");
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    }
  };

  useEffect(() => {
    checkAuth();

    // Check for registration success
    const params = new URLSearchParams(window.location.search)
    if (params.get("registered") === "true") {
      setIsRegistered(true)
    }
  }, []);

  useEffect(() => {
    const fetchSchoolData = async () => {
      setIsSchoolLoading(true)
      try {
        const host = window.location.host
        // Remove port from host if present (e.g., localhost:3000 -> localhost)
        const hostname = host.split(":")[0]
        const subdomain = hostname.split(".")[0]

        // Skip school fetch for localhost or main domain
        if (!subdomain || subdomain === 'localhost' || subdomain.includes('localhost') || subdomain === 'eduit' || subdomain === '127') {
          setIsSchoolLoading(false)
          return
        }

        const response = await fetch(`/api/public/schools/${subdomain}`)
        const result = await response.json()

        if (result.success) {
          setSchool(result.data)
        }
      } catch (error) {
        console.error("Error fetching school data:", error)
      } finally {
        setIsSchoolLoading(false)
      }
    }

    fetchSchoolData()
  }, [setSchool])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (loginAttempts >= 3) {
      setError("Too many login attempts. Please try again later or reset your password.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        setLoginAttempts(prev => prev + 1)
        throw new Error(data.message || "Invalid email or password");
      }

      toast.success("Login Successful", {
        description: "Welcome back! You are being redirected...",
        duration: 2000,
      });

      // Force a hard refresh to ensure cookie is picked up by middleware
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);

    } catch (error) {
      setError(error instanceof Error ? error.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FAFAFA] selection:bg-orange-100 selection:text-orange-900 font-poppins">
      {/* Left Panel - Premium Decorative */}
      <div className="hidden md:flex md:w-[45%] lg:w-[42%] bg-[#0F172A] relative overflow-hidden flex-col justify-between p-12 lg:p-16">
        {/* Background Effects */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[40%] bg-orange-600/20 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[40%] bg-blue-600/10 blur-[100px] rounded-full"></div>
          <div className="absolute inset-0 opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
          <motion.div
            animate={{ y: [0, -20, 0], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[20%] left-[10%] w-32 h-32 border border-white/10 rounded-full"
          />
        </div>

        <motion.div
          className="relative z-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Link href="/">
            <div className="relative h-12 w-48 bg-transparent rounded-2xl shadow-2xl group transition-transform hover:scale-105">
              <Image
                src="/eduitlogo-text.png"
                alt="EduIT Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>

          <div className="mt-24 space-y-6">
            <h1 className="text-4xl lg:text-5xl font-black text-white leading-[1.1] font-sora tracking-tight">
              Welcome to <span className="text-orange-600">EduIT</span>
            </h1>
            <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-sm">
              Your comprehensive school management platform. <br />Sign in to access your dashboard.
            </p>
          </div>
        </motion.div>

        <div className="relative z-10">
          <div className="grid grid-cols-1 gap-5">
            {[
              { label: "500+ Schools Trust Us", icon: <GraduationCap className="h-5 w-5" />, value: "500+" },
              { label: "50K+ Active Users", icon: <Users className="h-5 w-5" />, value: "50K+" },
              { label: "99.9% Uptime SLA", icon: <BookOpen className="h-5 w-5" />, value: "99.9%" }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 + (i * 0.1) }}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md hover:bg-white/10 transition-colors cursor-default"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-600/10 text-orange-500 border border-orange-500/20">
                  {stat.icon}
                </div>
                <div>
                  <p className="text-lg font-black text-white font-sora leading-none">{stat.value}</p>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1.5">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-white relative">
        <div className="absolute top-0 right-0 w-[40%] h-[30%] bg-orange-50/50 blur-[100px] pointer-events-none"></div>
        <div className="w-full max-w-[420px] relative z-10">
          <motion.div
            className="space-y-12"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center space-y-4">
              <div className="md:hidden flex justify-center mb-8">
                <Image src="/eduitlogo-text.png" alt="Logo" width={140} height={40} className="object-contain" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-slate-900 font-sora tracking-tighter">
                  {isSchoolLoading ? "Loading..." : (school?.name || "Welcome Back")}
                </h2>
                <p className="text-slate-500 font-medium tracking-tight">
                  Sign in to your account to continue
                </p>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {isRegistered && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem] space-y-2 mb-8 shadow-sm"
                >
                  <div className="flex items-center gap-3 text-emerald-700">
                    <CheckCircle2 className="h-6 w-6 shrink-0" />
                    <h4 className="font-black font-sora text-lg tracking-tight leading-none text-emerald-800">Registration Success!</h4>
                  </div>
                  <p className="text-xs text-emerald-600 font-bold leading-relaxed opacity-80 uppercase tracking-wide">
                    Your institutional portal is ready. Please check your email for credentials.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-700 shadow-sm"
                >
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p className="text-sm font-bold font-sora leading-tight">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-7">
              <div className="space-y-2.5">
                <Label className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 font-sora ml-1">Email Address</Label>
                <Input
                  type="email"
                  placeholder="name@school.com"
                  required
                  disabled={isLoading || loginAttempts >= 3}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 bg-slate-50/50 border-slate-200 rounded-2xl px-6 font-bold font-poppins focus:bg-white focus:ring-[6px] focus:ring-orange-500/5 focus:border-orange-600 transition-all duration-300"
                />
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between ml-1">
                  <Label className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 font-sora">Password</Label>
                  <Link href="/forgot-password" className="text-[12px] font-bold text-orange-600 hover:text-orange-700 underline underline-offset-4 decoration-orange-200">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative group">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    required
                    disabled={isLoading || loginAttempts >= 3}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-14 bg-slate-50/50 border-slate-200 rounded-2xl px-6 font-bold font-poppins focus:bg-white focus:ring-[6px] focus:ring-orange-500/5 focus:border-orange-600 transition-all duration-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-orange-600 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isLoading || loginAttempts >= 3}
                  className="w-full h-16 bg-orange-600 hover:bg-orange-700 text-white rounded-[1.25rem] text-lg font-black font-sora tracking-tight transition-all active:scale-[0.98] shadow-2xl shadow-orange-100 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span>Authenticating...</span>
                    </div>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </div>
            </form>

            <div className="pt-6 text-center space-y-4">
              <p className="text-[14px] font-bold text-slate-500">
                Don't have an account? <Link href="/register" className="text-orange-600 hover:text-orange-700 underline underline-offset-4 decoration-orange-200">Register now</Link>
              </p>
              <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest opacity-60">
                Managed securely by <Link href="/" className="text-slate-900 hover:text-orange-600 transition-colors">EduIT OS</Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}


"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Mail, AlertCircle, CheckCircle2, Loader2, KeyRound, ShieldCheck, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type ResetStep = "email" | "code" | "password" | "success"

export default function ForgotPasswordPage() {
    const [step, setStep] = useState<ResetStep>("email")
    const [email, setEmail] = useState("")
    const [code, setCode] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error || "Failed to send code")

            setStep("code")
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch("/api/auth/verify-code", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code }),
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error || "Invalid verification code")

            setStep("password")
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match")
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch("/api/auth/confirm-reset", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code, newPassword }),
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error || "Failed to reset password")

            setStep("success")
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 relative overflow-hidden font-sora">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-orange-500/5 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[500px] relative z-10"
            >
                <div className="bg-white rounded-[2.5rem] shadow-[0_40px_80px_-16px_rgba(0,0,0,0.08)] border border-slate-100 overflow-hidden">
                    <div className="p-8 md:p-12">

                        {/* Step Icons */}
                        <div className="mb-8 text-center flex justify-center">
                            <AnimatePresence mode="wait">
                                {step === "email" && (
                                    <motion.div key="icon-email" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-600">
                                        <Mail className="h-8 w-8" />
                                    </motion.div>
                                )}
                                {step === "code" && (
                                    <motion.div key="icon-code" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                                        <ShieldCheck className="h-8 w-8" />
                                    </motion.div>
                                )}
                                {step === "password" && (
                                    <motion.div key="icon-pass" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                        <KeyRound className="h-8 w-8" />
                                    </motion.div>
                                )}
                                {step === "success" && (
                                    <motion.div key="icon-success" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                        <CheckCircle2 className="h-8 w-8" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="text-center mb-10">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-3">
                                {step === "email" && "Forgot Password?"}
                                {step === "code" && "Verification"}
                                {step === "password" && "New Password"}
                                {step === "success" && "Success!"}
                            </h1>
                            <p className="text-slate-500 font-medium">
                                {step === "email" && "No worries, we'll send you a 4-digit code."}
                                {step === "code" && "Enter the 4-digit code sent to your email."}
                                {step === "password" && "Create a secure new password for your account."}
                                {step === "success" && "Your password has been successfully reset."}
                            </p>
                        </div>

                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600 mb-6"
                                >
                                    <AlertCircle className="h-5 w-5 shrink-0" />
                                    <p className="text-sm font-bold leading-tight">{error}</p>
                                </motion.div>
                            )}

                            {step === "email" && (
                                <motion.form key="step-email" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleSendCode} className="space-y-7">
                                    <div className="space-y-2.5">
                                        <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</Label>
                                        <Input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="name@school.com"
                                            className="h-14 bg-slate-50 border-slate-200 rounded-2xl px-6 font-bold focus:bg-white focus:ring-[6px] focus:ring-orange-500/5 focus:border-orange-600 transition-all"
                                        />
                                    </div>
                                    <Button disabled={isLoading} className="w-full h-14 bg-slate-900 hover:bg-black text-white rounded-2xl font-black shadow-xl">
                                        {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Send Code"}
                                    </Button>
                                </motion.form>
                            )}

                            {step === "code" && (
                                <motion.form key="step-code" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleVerifyCode} className="space-y-7">
                                    <div className="space-y-2.5">
                                        <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Verification Code</Label>
                                        <Input
                                            type="text"
                                            maxLength={4}
                                            required
                                            value={code}
                                            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                                            placeholder="0000"
                                            className="h-16 text-center text-3xl tracking-[1rem] font-black bg-slate-50 border-slate-200 rounded-2xl focus:bg-white focus:ring-[6px] focus:ring-blue-500/5 focus:border-blue-600 transition-all font-mono"
                                        />
                                    </div>
                                    <Button disabled={isLoading} className="w-full h-14 bg-slate-900 hover:bg-black text-white rounded-2xl font-black shadow-xl">
                                        {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Verify Code"}
                                    </Button>
                                    <div className="text-center">
                                        <button type="button" onClick={() => setStep("email")} className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors">
                                            Try another email
                                        </button>
                                    </div>
                                </motion.form>
                            )}

                            {step === "password" && (
                                <motion.form key="step-password" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleResetPassword} className="space-y-7">
                                    <div className="space-y-4">
                                        <div className="space-y-2.5">
                                            <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">New Password</Label>
                                            <div className="relative">
                                                <Input
                                                    type={showPassword ? "text" : "password"}
                                                    required
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    placeholder="••••••••••••"
                                                    className="h-14 bg-slate-50 border-slate-200 rounded-2xl px-6 font-bold"
                                                />
                                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-2.5">
                                            <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Confirm New Password</Label>
                                            <Input
                                                type={showPassword ? "text" : "password"}
                                                required
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="••••••••••••"
                                                className="h-14 bg-slate-50 border-slate-200 rounded-2xl px-6 font-bold"
                                            />
                                        </div>
                                    </div>
                                    <Button disabled={isLoading} className="w-full h-14 bg-slate-900 hover:bg-black text-white rounded-2xl font-black shadow-xl">
                                        {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Reset Password"}
                                    </Button>
                                </motion.form>
                            )}

                            {step === "success" && (
                                <motion.div key="step-success" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
                                    <div className="py-2">
                                        <p className="text-slate-500 font-medium mb-10 leading-relaxed">
                                            Password reset successful! You can now log in with your new credentials.
                                        </p>
                                        <Link href="/login" className="block">
                                            <Button className="w-full h-14 bg-slate-900 hover:bg-black text-white rounded-2xl font-black shadow-xl">
                                                Go to Log In <ArrowLeft className="ml-2 h-5 w-5 rotate-180" />
                                            </Button>
                                        </Link>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {step !== "success" && (
                            <div className="mt-10 pt-10 border-t border-slate-50 text-center">
                                <Link href="/login" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 font-bold text-sm transition-colors">
                                    <ArrowLeft className="h-4 w-4" /> Back to Log In
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Brand Footer */}
                <div className="mt-8 text-center">
                    <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        <span>Managed by</span>
                        <span className="text-orange-600">EduIT Global</span>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

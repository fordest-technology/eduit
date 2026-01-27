"use client"

import type React from "react"
import { useState, useRef } from "react"
import { toast } from "sonner"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { HexColorPicker } from "react-colorful"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  ArrowLeft,
  Upload,
  ShieldCheck,
  School,
  GraduationCap,
  Users,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Globe,
  Loader2,
  AlertCircle
} from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    schoolName: "",
    shortName: "",
    address: "",
    phone: "",
    email: "",
    primaryColor: "#f97316", // Default EduIT orange
    secondaryColor: "#0f172a", // Default EduIT dark
    schoolType: "combined", // primary, secondary, combined
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
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setError("Please select a valid image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB");
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const validateStep1 = () => {
    if (!formData.schoolName || !formData.shortName || !formData.email) {
      setError("Please fill in basic school details")
      return false
    }
    if (!/^[a-z0-9]+$/.test(formData.shortName)) {
      setError("Short name must be lowercase letters and numbers only")
      return false
    }
    setError("")
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep === 1) {
      if (validateStep1()) setCurrentStep(2)
      return
    }

    if (currentStep === 2) {
        setCurrentStep(3);
        return;
    }

    if (formData.adminPassword !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setIsLoading(true);
    setError("");

    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== "confirmPassword") formDataToSend.append(key, value);
      });
      if (logoFile) formDataToSend.append("logo", logoFile);

      const response = await fetch("/api/schools/register", {
        method: "POST",
        body: formDataToSend,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.details || "Registration failed");

      toast.success("School Registered!", {
        description: "Your institutional portal is ready. Check your email for details.",
        duration: 5000,
      });
      router.push("/login?registered=true");
    } catch (error: any) {
      setError(error.message || "Registration failed");
      toast.error("Registration Failed", {
        description: error.message || "Please check your information and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FAFAFA] selection:bg-orange-100 selection:text-orange-900 font-poppins">
      {/* Left Panel - Brand Promise */}
      <div className="hidden md:flex md:w-[35%] lg:w-[30%] bg-[#0F172A] relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,rgba(249,115,22,0.4)_0%,transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        </div>

        <motion.div
          className="relative z-10"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Link href="/">
            <div className="relative h-12 w-44 bg-transparent rounded-xl mb-12 shadow-xl">
              <Image src="/eduitlogo-text.png" alt="EduIT Logo" fill className="object-contain" />
            </div>
          </Link>

          <div className="space-y-6">
            <h1 className="text-3xl font-black text-white leading-tight font-sora">
              Digitize Your <br />
              <span className="text-orange-600">Institution Today.</span>
            </h1>
            <p className="text-slate-400 text-sm font-medium leading-relaxed">
              Join 500+ schools globaly using EduIT to automate management and empower educators.
            </p>
          </div>
        </motion.div>

        <div className="relative z-10 space-y-4">
          {[
            { icon: <ShieldCheck className="h-4 w-4" />, text: "Built-in Security" },
            { icon: <Globe className="h-4 w-4" />, text: "Custom Subdomain" },
            { icon: <Sparkles className="h-4 w-4" />, text: "Modular Scaling" }
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-slate-300 text-xs font-bold uppercase tracking-widest">
              <div className="h-8 w-8 rounded-lg bg-orange-600/10 flex items-center justify-center text-orange-500 border border-orange-500/20">
                {item.icon}
              </div>
              {item.text}
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Dynamic Multi-step Form */}
      <div className="flex-1 flex flex-col p-6 md:p-12 lg:p-20 relative overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full space-y-10">
          <div className="flex items-center justify-between">
            <Link href="/login" className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-orange-600 transition-colors group">
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Back to Login
            </Link>
            <div className="flex gap-2">
              <div className={`h-1.5 w-12 rounded-full transition-colors ${currentStep >= 1 ? 'bg-orange-600' : 'bg-slate-200'}`} />
              <div className={`h-1.5 w-12 rounded-full transition-colors ${currentStep >= 2 ? 'bg-orange-600' : 'bg-slate-200'}`} />
              <div className={`h-1.5 w-12 rounded-full transition-colors ${currentStep >= 3 ? 'bg-orange-600' : 'bg-slate-200'}`} />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-4xl font-black text-slate-900 font-sora tracking-tighter">
              {currentStep === 1 ? "Institutional Setup" : currentStep === 2 ? "Academic Structure" : "Administrator Access"}
            </h2>
            <p className="text-slate-500 font-medium">
              {currentStep === 1
                ? "Let's start with your school's unique identity."
                : currentStep === 2 
                ? "Select your institution type to auto-generate classes."
                : "Secure your portal with an administrator account."}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700"
              >
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="text-sm font-bold font-sora tracking-tight">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-8 pb-12">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              {currentStep === 1 ? (
                <div className="space-y-8">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2.5">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-400 font-sora ml-1">School Full Name</Label>
                      <Input name="schoolName" placeholder="Global Excellence Academy" required value={formData.schoolName} onChange={handleChange}
                        className="h-14 bg-white border-slate-200 rounded-2xl px-6 font-bold focus:ring-4 focus:ring-orange-500/5 focus:border-orange-600 transition-all" />
                    </div>
                    <div className="space-y-2.5">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-400 font-sora ml-1">Unique Short Name (URL)</Label>
                      <Input name="shortName" placeholder="gea" required value={formData.shortName} onChange={handleChange}
                        className="h-14 bg-white border-slate-200 rounded-2xl px-6 font-bold focus:ring-4 focus:ring-orange-500/5 focus:border-orange-600 transition-all" />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                        URL: <span className="text-orange-600">{formData.shortName || 'choice'}.eduit.com</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400 font-sora ml-1">Official Address</Label>
                    <Textarea name="address" placeholder="123 Education Boulevard..." value={formData.address} onChange={handleChange}
                      className="min-h-[100px] bg-white border-slate-200 rounded-2xl px-6 py-4 font-bold focus:ring-4 focus:ring-orange-500/5 focus:border-orange-600 transition-all" />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2.5">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-400 font-sora ml-1">Official Email</Label>
                      <Input name="email" type="email" placeholder="contact@school.edu" required value={formData.email} onChange={handleChange}
                        className="h-14 bg-white border-slate-200 rounded-2xl px-6 font-bold" />
                    </div>
                    <div className="space-y-2.5">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-400 font-sora ml-1">Phone Number</Label>
                      <Input name="phone" placeholder="+123 456 789" value={formData.phone} onChange={handleChange}
                        className="h-14 bg-white border-slate-200 rounded-2xl px-6 font-bold" />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8 items-center pt-4">
                    <div className="space-y-4">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-400 font-sora ml-1">Institutional Logo</Label>
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="h-40 border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 hover:bg-orange-50/30 transition-all overflow-hidden"
                      >
                        {logoPreview ? (
                          <div className="relative h-full w-full p-4 flex items-center justify-center">
                            <img src={logoPreview} alt="Preview" className="max-h-full max-w-full object-contain" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                              <span className="text-white text-xs font-bold uppercase tracking-widest">Change Logo</span>
                            </div>
                          </div>
                        ) : (
                          <>
                            <Upload className="h-8 w-8 text-slate-300 mb-2" />
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Click to upload</p>
                          </>
                        )}
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoChange} />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-400 font-sora ml-1">Brand Colors</Label>
                      <div className="flex gap-6">
                        <div className="space-y-3">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Primary</p>
                          <Popover>
                            <PopoverTrigger asChild>
                              <div className="h-16 w-16 rounded-[1.25rem] cursor-pointer shadow-lg border-4 border-white" style={{ backgroundColor: formData.primaryColor }} />
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-3xl overflow-hidden">
                              <HexColorPicker color={formData.primaryColor} onChange={(c) => handleColorChange(c, "primaryColor")} />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-3">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Secondary</p>
                          <Popover>
                            <PopoverTrigger asChild>
                              <div className="h-16 w-16 rounded-[1.25rem] cursor-pointer shadow-lg border-4 border-white" style={{ backgroundColor: formData.secondaryColor }} />
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-3xl overflow-hidden">
                              <HexColorPicker color={formData.secondaryColor} onChange={(c) => handleColorChange(c, "secondaryColor")} />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : currentStep === 2 ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                            { id: "primary", name: "Primary School", desc: "Nursery - P6" },
                            { id: "secondary", name: "Secondary School", desc: "JSS1 - SSS3" },
                            { id: "combined", name: "Combined", desc: "Nursery - SSS3" },
                            { id: "custom", name: "Custom Setup", desc: "Define structure manually" }
                        ].map((type) => (
                             <div 
                                key={type.id}
                                onClick={() => setFormData(prev => ({ ...prev, schoolType: type.id }))}
                                className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all ${formData.schoolType === type.id ? 'border-orange-600 bg-orange-50' : 'border-slate-100 hover:border-slate-300'}`}
                             >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 ${formData.schoolType === type.id ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                    {formData.schoolType === type.id ? <CheckCircle2 className="h-5 w-5" /> : <School className="h-5 w-5" />}
                                </div>
                                <h4 className="text-lg font-black font-sora mb-1">{type.name}</h4>
                                <p className="text-sm text-slate-500 font-medium">{type.desc}</p>
                             </div>
                        ))}
                    </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2.5">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-400 font-sora ml-1">Admin Full Name</Label>
                      <Input name="adminName" placeholder="Dr. Sarah Jenkins" required value={formData.adminName} onChange={handleChange}
                        className="h-14 bg-white border-slate-200 rounded-2xl px-6 font-bold focus:ring-4 focus:ring-orange-500/5 focus:border-orange-600 transition-all" />
                    </div>
                    <div className="space-y-2.5">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-400 font-sora ml-1">Admin Email (Login)</Label>
                      <Input name="adminEmail" type="email" placeholder="admin@school.edu" required value={formData.adminEmail} onChange={handleChange}
                        className="h-14 bg-white border-slate-200 rounded-2xl px-6 font-bold" />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2.5">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-400 font-sora ml-1">Secure Password</Label>
                      <PasswordInput name="adminPassword" placeholder="••••••••" required value={formData.adminPassword} onChange={handleChange}
                        className="h-14 bg-white border-slate-200 rounded-2xl px-6 font-bold" />
                    </div>
                    <div className="space-y-2.5">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-400 font-sora ml-1">Confirm Password</Label>
                      <PasswordInput name="confirmPassword" placeholder="••••••••" required value={formData.confirmPassword} onChange={handleChange}
                        className="h-14 bg-white border-slate-200 rounded-2xl px-6 font-bold" />
                    </div>
                  </div>

                  <div className="p-6 bg-orange-50 border border-orange-100 rounded-[2rem] space-y-3">
                    <h4 className="text-sm font-black text-orange-900 font-sora flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" /> Ready to Launch?
                    </h4>
                    <p className="text-xs text-orange-800/70 font-medium leading-relaxed">
                      By registering, you'll gain full administrative control over your school's EduIT instance. You can always adjust branding and settings later from the main dashboard.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                {currentStep > 1 && (
                  <Button type="button" variant="outline" onClick={() => setCurrentStep(prev => prev - 1)} className="h-16 px-8 rounded-2xl border-slate-200 font-bold">
                    Back
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 h-16 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl text-[17px] font-black font-sora tracking-tight transition-all active:scale-[0.98] shadow-2xl shadow-orange-100"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      Authenticating...
                    </div>
                  ) : (
                    currentStep === 3 ? "Launch Institution" : "Continue"
                  )}
                </Button>
              </div>
            </motion.div>
          </form>
        </div>
      </div>
    </div>
  )
}

"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  CalendarDays,
  CheckCircle,
  ChevronRight,
  Download,
  Globe,
  LifeBuoy,
  Lock,
  Mail,
  MessageSquare,
  School,
  Shield,
  Star,
  Users,
  BarChart3,
  BookOpen,
  LayoutDashboard,
  Bell,
  CheckCircle2,
  ArrowRight,
  Zap,
  ShieldCheck,
  TrendingUp,
  Plus,
  ArrowUpRight,
  Cpu,
  Layers,
  Database,
  HeadphonesIcon
} from "lucide-react"

export default function Home() {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6, ease: "easeOut" }
  }

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-white font-poppins selection:bg-orange-100 selection:text-orange-900">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-20 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center group">
              <div className="relative h-16 w-48 transition-transform group-hover:scale-105 duration-300">
                <Image
                  src="/EDUIT.jpeg"
                  alt="EduIT Logo"
                  fill
                  className="object-contain mix-blend-multiply brightness-[1.1] contrast-[1.1]"
                  priority
                />
              </div>
            </Link>
          </div>
          <nav className="hidden lg:flex gap-10">
            {["Features", "Modules", "Pricing", "Security"].map((item) => (
              <Link
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-[14px] font-semibold text-slate-600 hover:text-orange-600 transition-colors tracking-tight font-sora"
              >
                {item}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-6">
            <Link href="/register">
              <Button className="bg-orange-600 hover:bg-orange-700 text-white text-[15px] font-black h-12 px-8 rounded-2xl shadow-xl shadow-orange-100 transition-all hover:scale-[1.02] active:scale-100 font-sora tracking-tight">
                Get Started Now
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-24 pb-20 md:pt-36 md:pb-32 overflow-hidden">
          <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-100/50"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-orange-500 text-orange-500" />
                  ))}
                </div>
                <span className="text-[13px] font-bold text-orange-700 font-sora tracking-tight">⭐ 4.9 / 5 average rating</span>
              </motion.div>

              <motion.h1
                className="text-5xl md:text-7xl font-extrabold text-slate-900 leading-[1.05] tracking-tight font-sora"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                Building the Future <br />
                <span className="text-orange-600">of Education.</span>
              </motion.h1>

              <motion.p
                className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto font-medium"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                EduIT is a modern, all-in-one operating system designed for forward-thinking schools. Manage academics, finance, communication, and administration from a single intelligent platform built to scale.
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Link href="/register">
                  <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white text-[16px] font-black h-14 px-10 rounded-2xl shadow-xl shadow-orange-100 transition-all hover:-translate-y-1 active:translate-y-0 font-sora">
                    Get Started Now
                  </Button>
                </Link>
                <Link href="#features">
                  <Button size="lg" variant="outline" className="border-slate-200 text-slate-800 text-[16px] font-bold h-14 px-10 rounded-2xl bg-white hover:bg-slate-50 transition-all">
                    Explore the Platform
                  </Button>
                </Link>
              </motion.div>

              <motion.p
                className="text-sm font-bold text-slate-500 tracking-widest uppercase font-sora pt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.4 }}
              >
                Trusted by 500+ institutions globally
              </motion.p>
            </div>
          </div>

          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(255,237,213,0.4)_0%,rgba(255,255,255,0)_60%)]"></div>
        </section>

        {/* Strategic Partners (Powered By) */}
        <section className="py-10 border-b border-slate-100 bg-white">
          <div className="container mx-auto px-4 text-center">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">
              Secured & Powered By Industry Leaders
            </p>
            <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
               {/* GTBank */}
               <div className="h-12 w-auto flex items-center">
                  <Image 
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Guaranty_Trust_Bank_Logo_2022.svg/1200px-Guaranty_Trust_Bank_Logo_2022.svg.png" 
                    alt="GTBank" 
                    width={150} 
                    height={50} 
                    className="h-10 w-auto object-contain"
                  />
               </div>
               
               {/* HabariPay - now local */}
               <div className="h-12 w-auto flex items-center">
                  <Image 
                    src="/habaripay.jpg" 
                    alt="HabariPay" 
                    width={150} 
                    height={50} 
                    className="h-10 w-auto object-contain"
                  />
               </div>

               {/* Squad - now local */}
               <div className="h-12 w-auto flex items-center">
                  <Image 
                    src="/squad.png" 
                    alt="Squad" 
                    width={120} 
                    height={40} 
                    className="h-8 w-auto object-contain"
                  />
               </div>
            </div>
          </div>
        </section>

        {/* Product Proof (Quick Metrics) */}
        <section className="py-16 border-y border-slate-100 bg-slate-50/50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto text-center">
              <motion.div {...fadeInUp} className="space-y-2">
                <p className="text-4xl md:text-5xl font-black text-slate-900 font-sora">+24%</p>
                <p className="text-[15px] font-bold text-slate-500 uppercase tracking-[0.1em]">Enrollment Growth</p>
              </motion.div>
              <motion.div {...fadeInUp} transition={{ delay: 0.1 }} className="space-y-2">
                <p className="text-4xl md:text-5xl font-black text-orange-600 font-sora">40%</p>
                <p className="text-[15px] font-bold text-slate-500 uppercase tracking-[0.1em]">Improvement in Efficiency</p>
              </motion.div>
              <motion.div {...fadeInUp} transition={{ delay: 0.2 }} className="space-y-2">
                <p className="text-4xl md:text-5xl font-black text-slate-900 font-sora">99.99%</p>
                <p className="text-[15px] font-bold text-slate-500 uppercase tracking-[0.1em]">System Reliability</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Trusted By */}
        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <p className="text-[13px] font-black text-orange-600 uppercase tracking-[0.2em] mb-12">Powering schools, colleges, and education networks worldwide.</p>
            <div className="flex flex-wrap justify-center items-center gap-x-16 gap-y-12 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
              {["School Alpha", "Green Valley Academy", "Riverside College", "Future Scholars Institute", "Global International School"].map((school) => (
                <span key={school} className="text-xl md:text-2xl font-black tracking-tight text-slate-900 font-sora">
                  {school}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Product Preview */}
        <section id="preview" className="py-24 bg-white overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-6">
              <h2 className="text-sm font-black text-orange-600 uppercase tracking-[0.2em]">Product Preview</h2>
              <h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight font-sora">See EduIT in Action</h3>
              <p className="text-lg text-slate-600 font-medium leading-relaxed">
                A powerful, intuitive dashboard that gives administrators, educators, and leaders complete visibility and control over their institution.
              </p>
            </div>

            <motion.div
              className="max-w-6xl mx-auto relative group"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              <div className="rounded-[2.5rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(30,41,59,0.15)] border-8 border-slate-100 bg-white">
                <Image
                  src="/eduit-dashboard.png"
                  alt="EduIT Dashboard Preview"
                  width={1400}
                  height={900}
                  className="w-full h-auto object-cover transform group-hover:scale-[1.02] transition-transform duration-1000"
                />
              </div>
              <div className="absolute inset-0 rounded-[2.5rem] ring-1 ring-inset ring-slate-900/10 pointer-events-none"></div>
            </motion.div>
          </div>
        </section>

        {/* Why EduIT */}
        <section id="features" className="py-24 bg-slate-900 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center mb-20 space-y-4">
              <h2 className="text-sm font-black text-orange-400 capitalize tracking-widest font-sora italic">Built for Modern Education.</h2>
              <h3 className="text-4xl md:text-6xl font-black tracking-tight font-sora">Designed for Real Humans.</h3>
              <p className="text-lg md:text-xl text-slate-400 font-medium max-w-2xl mx-auto pt-4 leading-relaxed">
                We transformed complex school operations into a seamless experience that saves time, reduces errors, and drives measurable growth.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { title: "Unified Institutional Control", desc: "Oversee enrollment, academics, finance, staff, and communication from one centralized dashboard.", icon: <LayoutDashboard /> },
                { title: "Enterprise-Grade Security", desc: "Advanced encryption, role-based access, and secure cloud infrastructure protect your data at every level.", icon: <ShieldCheck /> },
                { title: "Actionable Intelligence", desc: "Real-time analytics and reports that empower leadership to make smarter, faster decisions.", icon: <TrendingUp /> },
                { title: "Access Anywhere", desc: "A fully cloud-native platform accessible on desktop, tablet, and mobile devices.", icon: <Globe /> },
                { title: "Seamless Collaboration", desc: "Bring administrators, teachers, parents, and students together in one secure ecosystem.", icon: <Users /> },
                { title: "Dedicated Support", desc: "Expert account managers and 24/7 technical assistance tailored to education institutions.", icon: <LifeBuoy /> }
              ].map((f, i) => (
                <motion.div
                  key={f.title}
                  {...fadeInUp}
                  transition={{ delay: i * 0.1 }}
                  className="p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-orange-500/50 transition-all duration-300 group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-orange-600/20 text-orange-400 border border-orange-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    {f.icon}
                  </div>
                  <h4 className="text-xl font-bold mb-4 font-sora">{f.title}</h4>
                  <p className="text-slate-400 font-medium leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Comprehensive Modules */}
        <section id="modules" className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-20 space-y-6">
              <h2 className="text-sm font-black text-orange-600 uppercase tracking-[0.2em]">Comprehensive Modules</h2>
              <h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight font-sora">Everything You Need to Run a High-Performing School</h3>
              <p className="text-lg text-slate-600 font-medium leading-relaxed">
                EduIT is modular, flexible, and built to grow with your institution.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
              {[
                { title: "Student Information System (SIS)", desc: "Centralized student records, attendance tracking, behavioral monitoring, and academic history.", icon: <Users className="h-7 w-7" /> },
                { title: "Academic Engine", desc: "Automated grading, curriculum management, assessments, and custom transcript generation.", icon: <BookOpen className="h-7 w-7" /> },
                { title: "Financial Hub", desc: "Tuition billing, invoicing, expense tracking, payment integration, and financial reporting.", icon: <BarChart3 className="h-7 w-7" /> },
                { title: "Communication Suite", desc: "Instant notifications, parent portals, staff messaging, and engagement tools.", icon: <MessageSquare className="h-7 w-7" /> },
                { title: "Analytics & Reports", desc: "Performance tracking, institutional insights, and compliance-ready reporting.", icon: <TrendingUp className="h-7 w-7" /> }
              ].map((m, i) => (
                <motion.div
                  key={m.title}
                  {...fadeInUp}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-6 items-start group"
                >
                  <div className="bg-slate-100 p-4 rounded-2xl text-slate-900 group-hover:bg-orange-600 group-hover:text-white transition-colors duration-300 shrink-0">
                    {m.icon}
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-xl font-bold font-sora group-hover:text-orange-600 transition-colors duration-300">{m.title}</h4>
                    <p className="text-slate-600 font-medium leading-relaxed">{m.desc}</p>
                  </div>
                </motion.div>
              ))}
              <Link href="#request-demo" className="group">
                <div className="flex gap-6 items-start p-6 rounded-3xl border-2 border-dashed border-slate-200 hover:border-orange-500 hover:bg-orange-50 transition-all cursor-pointer h-full">
                  <div className="bg-orange-600 p-4 rounded-2xl text-white shrink-0 shadow-lg shadow-orange-100">
                    <Plus className="h-7 w-7" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-bold font-sora">Explore 30+ Integrated Modules</h4>
                    <p className="text-slate-500 font-medium">EduIT scales with your institutional needs. Discover more.</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* Who EduIT is for */}
        <section className="py-24 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center mb-16 space-y-4">
              <h2 className="text-sm font-black text-orange-600 uppercase tracking-[0.2em]">Who EduIT is for</h2>
              <h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight font-sora">Built for Institutions That Want More</h3>
              <p className="text-lg text-slate-600 font-medium pt-2">EduIT supports institutions of all sizes and structures.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto mb-16">
              {["Primary & Secondary Schools", "Colleges & Academies", "Private & International Schools", "Multi-Campus Education Networks"].map((type, i) => (
                <div key={type} className="bg-white p-8 rounded-[2rem] border border-slate-200/60 text-center space-y-4 hover:shadow-xl transition-all hover:-translate-y-2">
                  <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <p className="font-bold text-slate-900 font-sora leading-tight">{type}</p>
                </div>
              ))}
            </div>

            <div className="text-center">
              <p className="text-xl text-slate-600 font-medium italic">Whether you manage 100 students or 100,000, EduIT scales with you.</p>
            </div>
          </div>
        </section>

        {/* Security, Compliance & Infrastructure */}
        <section id="security" className="py-24 bg-slate-900 text-white overflow-hidden relative">
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <div className="space-y-12">
                <div className="space-y-4">
                  <h2 className="text-sm font-black text-orange-400 uppercase tracking-[0.2em]">Security, Compliance & Infrastructure</h2>
                  <h3 className="text-4xl md:text-6xl font-black tracking-tight font-sora leading-[1.1]">Institutional-Grade <br />Technology You Can Trust</h3>
                  <p className="text-xl text-slate-400 font-medium leading-relaxed">EduIT is engineered to meet the highest global standards for reliability and data protection.</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-8">
                  {[
                    { title: "Zero-Trust Security Architecture", desc: "End-to-end encryption with full data ownership and role-based access control.", icon: <Shield className="h-6 w-6" /> },
                    { title: "Distributed Cloud Infrastructure", desc: "High availability with global edge performance and ultra-low latency.", icon: <Globe className="h-6 w-6" /> },
                    { title: "Compliance-Ready by Design", desc: "Built to support FERPA, GDPR, and local education data regulations.", icon: <ShieldCheck className="h-6 w-6" /> },
                    { title: "Expert Architectural Support", desc: "Direct access to senior engineers and education technology specialists.", icon: <HeadphonesIcon className="h-6 w-6" /> }
                  ].map((f) => (
                    <div key={f.title} className="space-y-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 text-orange-400 flex items-center justify-center mb-4">
                        {f.icon}
                      </div>
                      <h4 className="text-lg font-bold font-sora leading-snug">{f.title}</h4>
                      <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="bg-orange-600/20 blur-[100px] w-full h-full absolute"></div>
                <div className="bg-white/5 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/10 relative z-10">
                  <div className="space-y-8">
                    <div className="flex justify-between items-center">
                      <h4 className="text-2xl font-black font-sora">System Status</h4>
                      <div className="flex items-center gap-2 text-green-400 font-bold text-sm">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-ping"></span>
                        Operational
                      </div>
                    </div>
                    <div className="space-y-8">
                      <div className="flex items-center justify-between border-b border-white/5 pb-4">
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Uptime</p>
                        <p className="text-2xl font-black font-sora text-orange-400">99.99%</p>
                      </div>
                      <div className="flex items-center justify-between border-b border-white/5 pb-4">
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Average Latency</p>
                        <p className="text-2xl font-black font-sora">256ms</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Requests / Hr</p>
                        <p className="text-2xl font-black font-sora">2.4M</p>
                      </div>
                    </div>
                    <div className="p-1 h-3 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-orange-600 rounded-full"
                        initial={{ width: 0 }}
                        whileInView={{ width: "95%" }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
              <h2 className="text-sm font-black text-orange-600 uppercase tracking-[0.2em]">Testimonials</h2>
              <h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight font-sora">Trusted by Educators Like You</h3>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  quote: "EduIT completely transformed how we manage our school. What took days now takes hours.",
                  author: "Dr. Sarah Jenkins",
                  role: "Principal, Lincoln High School",
                  img: "https://i.pravatar.cc/150?u=sarah"
                },
                {
                  quote: "Parent engagement has never been better. Communication is now clear, fast, and reliable.",
                  author: "Marcus Thompson",
                  role: "Administrator, Green Valley Academy",
                  img: "https://i.pravatar.cc/150?u=marcus"
                },
                {
                  quote: "Finally, a platform teachers actually enjoy using. Clean UI and truly useful features.",
                  author: "Elena Rodriguez",
                  role: "Head Teacher, St. Jude’s College",
                  img: "https://i.pravatar.cc/150?u=elena"
                }
              ].map((t, i) => (
                <motion.div
                  key={t.author}
                  {...fadeInUp}
                  transition={{ delay: i * 0.1 }}
                  className="p-10 rounded-[3rem] bg-slate-50 border border-slate-100 flex flex-col justify-between hover:bg-white hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
                >
                  <p className="text-xl text-slate-800 font-medium leading-relaxed mb-10 italic">“{t.quote}”</p>
                  <div className="flex items-center gap-4">
                    <div className="relative h-14 w-14 rounded-full overflow-hidden ring-4 ring-white shadow-sm">
                      <Image src={t.img} alt={t.author} fill className="object-cover" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 font-sora">{t.author}</p>
                      <p className="text-[13px] text-slate-500 font-bold uppercase tracking-wider">{t.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
              <h2 className="text-sm font-black text-orange-600 uppercase tracking-[0.2em]">Pricing</h2>
              <h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight font-sora">Flexible Plans for Every Institution</h3>
              <p className="text-lg text-slate-600 font-medium pt-2">Transparent pricing that grows with your school.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                {
                  name: "Starter",
                  price: "1,000",
                  desc: "Best for small schools starting their digital journey.",
                  features: ["Up to 500 students", "Core SIS features", "Basic reports", "Public school portal", "Email support"]
                },
                {
                  name: "Professional",
                  popular: true,
                  price: "2,000",
                  desc: "Ideal for growing schools needing automation and insights.",
                  features: ["Up to 2,000 students", "Advanced analytics", "Financial hub", "Priority support", "Mobile access", "Custom branding"]
                },
                {
                  name: "Enterprise",
                  price: "Custom",
                  desc: "For large institutions and education networks.",
                  features: ["Unlimited students", "Dedicated account manager", "Custom integrations & APIs", "On-site training", "24/7 phone support", "SLA guarantees"]
                }
              ].map((p, i) => (
                <div
                  key={p.name}
                  className={`p-10 rounded-[3rem] border flex flex-col justify-between transition-all duration-300 ${p.popular ? 'bg-slate-900 text-white border-slate-900 shadow-2xl scale-105 relative z-10' : 'bg-white border-slate-200 hover:border-orange-500'}`}
                >
                  <div className="space-y-8">
                    <div className="flex justify-between items-start">
                      <div>
                        {p.popular && <span className="bg-orange-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4 inline-block">Most Popular</span>}
                        <h4 className="text-2xl font-black font-sora">{p.name}</h4>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-bold opacity-60">₦</span>
                        <span className="text-5xl font-black font-sora">{p.price}</span>
                        {p.price !== "Custom" && <span className="text-sm font-bold opacity-60">/ student / mo</span>}
                      </div>
                      <p className={`mt-4 font-medium italic ${p.popular ? 'text-slate-400' : 'text-slate-500'}`}>{p.desc}</p>
                    </div>
                    <ul className="space-y-4">
                      {p.features.map(f => (
                        <li key={f} className="flex gap-3 text-sm font-medium items-center">
                          <CheckCircle2 className={`h-5 w-5 shrink-0 ${p.popular ? 'text-orange-500' : 'text-green-500'}`} />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button size="lg" className={`w-full mt-12 rounded-2xl h-14 font-bold text-lg ${p.popular ? 'bg-orange-600 hover:bg-orange-700' : 'bg-slate-900 hover:bg-slate-800'}`}>
                    {p.name === "Enterprise" ? "Contact Sales" : "Get Started"}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-24 bg-slate-50">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-sm font-black text-orange-600 uppercase tracking-[0.2em]">FAQ</h2>
              <h3 className="text-4xl font-black text-slate-900 tracking-tight font-sora">Common Questions</h3>
            </div>

            <div className="space-y-4">
              {[
                { q: "Can we migrate data from our existing system?", a: "Yes. We provide secure, white-glove migration services for all clients." },
                { q: "Are there any setup or hidden fees?", a: "No. EduIT offers clear, transparent pricing with no hidden costs." },
                { q: "Do you provide training for staff?", a: "Yes. Professional and Enterprise plans include guided onboarding and training." },
                { q: "Can EduIT be customized for our institution?", a: "Absolutely. EduIT is modular and highly configurable." }
              ].map((faq, i) => (
                <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-200/60 hover:border-orange-200 transition-all cursor-default">
                  <h4 className="text-[17px] font-black font-sora text-slate-900 mb-3">{faq.q}</h4>
                  <p className="text-slate-600 font-medium leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section id="request-demo" className="py-24 bg-white overflow-hidden relative">
          <div className="container mx-auto px-4 relative z-10">
            <div className="bg-orange-600 rounded-[4rem] p-12 md:p-24 text-white overflow-hidden relative">
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div className="space-y-8">
                  <h3 className="text-4xl md:text-6xl font-black font-sora tracking-tight leading-[1.05]">Experience EduIT <br />in Action</h3>
                  <p className="text-xl text-orange-50 font-medium leading-relaxed border-l-4 border-white/30 pl-8 capitalize italic">
                    See how EduIT can simplify operations, empower educators, and elevate student outcomes at your institution.
                  </p>
                  <div className="flex items-center gap-6 pt-6">
                    <div className="text-center">
                      <p className="text-3xl font-black font-sora">10M+</p>
                      <p className="text-[11px] font-black uppercase tracking-widest opacity-80 mt-1">Students Managed</p>
                    </div>
                    <div className="h-10 w-px bg-white/20"></div>
                    <div className="text-center">
                      <p className="text-3xl font-black font-sora">24/7</p>
                      <p className="text-[11px] font-black uppercase tracking-widest opacity-80 mt-1">Expert Support</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[3rem] p-8 md:p-12 text-slate-900 shadow-2xl">
                  <h4 className="text-2xl font-black font-sora mb-8 text-center uppercase tracking-tighter italic">Schedule Demo</h4>
                  <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">First Name</label>
                        <input type="text" className="w-full h-14 bg-slate-50 border-slate-100 rounded-xl px-5 font-bold outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 transition-all text-sm" placeholder="John" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Last Name</label>
                        <input type="text" className="w-full h-14 bg-slate-50 border-slate-100 rounded-xl px-5 font-bold outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 transition-all text-sm" placeholder="Doe" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400">Work Email</label>
                      <input type="email" className="w-full h-14 bg-slate-50 border-slate-100 rounded-xl px-5 font-bold outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 transition-all text-sm" placeholder="john@school.edu" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400">School Name</label>
                      <input type="text" className="w-full h-14 bg-slate-50 border-slate-100 rounded-xl px-5 font-bold outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 transition-all text-sm" placeholder="Green Valley High" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400">Student Population</label>
                      <select className="w-full h-14 bg-slate-50 border-slate-100 rounded-xl px-5 font-bold outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 transition-all text-sm appearance-none cursor-pointer">
                        <option>Under 500</option>
                        <option>500 - 1,000</option>
                        <option>1,000 - 5,000</option>
                        <option>Above 5,000</option>
                      </select>
                    </div>
                    <Button className="w-full h-16 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl text-lg font-black shadow-xl shadow-orange-100 mt-4 transition-all hover:scale-[1.02] active:scale-100">
                      Request a Live Demo
                    </Button>
                  </form>
                </div>
              </div>

              {/* Decoration */}
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white opacity-5 rounded-full -mr-48 -mt-48 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-white opacity-5 rounded-full -ml-48 -mb-48 blur-3xl"></div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white pt-24 pb-12 overflow-hidden border-t border-slate-100">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
            <div className="space-y-8">
              <Link href="/" className="flex items-center group">
                <div className="relative h-16 w-48 bg-white p-2 rounded-xl">
                  <Image
                    src="/EDUIT.jpeg"
                    alt="EduIT Logo"
                    fill
                    className="object-contain brightness-[1.1] contrast-[1.1]"
                  />
                </div>
              </Link>
              <p className="text-slate-500 font-medium leading-relaxed max-w-xs text-sm italic">
                Empowering institutions through intelligent education infrastructure.
              </p>
              
              <div className="pt-4 border-t border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Powered By</p>
                <div className="flex items-center gap-4 opacity-70 grayscale hover:grayscale-0 transition-opacity">
                    <Image 
                        src="/squad.png" 
                        alt="Squad" 
                        width={80} 
                        height={30} 
                        className="h-6 w-auto object-contain"
                    />
                    <div className="h-4 w-px bg-slate-200"></div>
                     <Image 
                        src="/habaripay.jpg" 
                        alt="HabariPay" 
                        width={80} 
                        height={30} 
                        className="h-6 w-auto object-contain"
                    />
                     <div className="h-4 w-px bg-slate-200"></div>
                     <Image 
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Guaranty_Trust_Bank_Logo_2022.svg/1200px-Guaranty_Trust_Bank_Logo_2022.svg.png" 
                        alt="GTBank" 
                        width={80} 
                        height={30} 
                        className="h-6 w-auto object-contain"
                    />
                </div>
              </div>

              <div className="flex gap-4">
                {["Twitter", "LinkedIn", "YouTube"].map((s) => (
                  <div key={s} className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center hover:bg-orange-600 hover:border-orange-600 hover:text-white transition-all cursor-pointer">
                    <Star className="h-4 w-4" />
                  </div>
                ))}
              </div>
            </div>

            {[
              { title: "Platform", links: ["Features", "Security", "Modules", "System Updates"] },
              { title: "Company", links: ["About Us", "Careers", "Partners", "Contact"] },
              { title: "Resources", links: ["Documentation", "Community", "Support Center", "Privacy Policy"] }
            ].map((col) => (
              <div key={col.title} className="space-y-8">
                <h4 className="text-[13px] font-black uppercase tracking-[0.2em] text-slate-900">{col.title}</h4>
                <ul className="space-y-4">
                  {col.links.map((link) => (
                    <li key={link}>
                      <Link href="#" className="text-sm font-bold text-slate-500 hover:text-orange-600 transition-colors">
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-sm font-bold text-slate-500">© {new Date().getFullYear()} EduIT Ecosystem. All rights reserved.</p>
            <div className="flex gap-8">
              <Link href="#" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">Terms & Conditions</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

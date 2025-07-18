import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { CalendarDays, CheckCircle, ChevronRight, Download, Globe, LifeBuoy, Lock, Mail, MessageSquare, School, Shield, Star, Users } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative h-10 w-32">
              <div className="absolute inset-0 flex items-center">
                <School className="h-6 w-6 text-[#f97316]" />
                <span className="ml-2 text-xl font-bold text-gray-900">Eduit</span>
              </div>
              <div className="absolute bottom-0 right-0">
                <span className="text-[10px] text-gray-500 whitespace-nowrap">by Fordest Technologies</span>
              </div>
            </div>
          </div>
          <nav className="hidden md:flex gap-8">
            <Link href="#features" className="text-sm font-medium text-gray-600 hover:text-[#f97316] transition-colors">
              Features
            </Link>
            <Link href="#testimonials" className="text-sm font-medium text-gray-600 hover:text-[#f97316] transition-colors">
              Testimonials
            </Link>
            <Link href="#pricing" className="text-sm font-medium text-gray-600 hover:text-[#f97316] transition-colors">
              Pricing
            </Link>
            <Link href="#integrations" className="text-sm font-medium text-gray-600 hover:text-[#f97316] transition-colors">
              Integrations
            </Link>
            <Link href="#about" className="text-sm font-medium text-gray-600 hover:text-[#f97316] transition-colors">
              About Fordest
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="font-medium text-gray-700">Log in</Button>
            </Link>
            <Link href="#request-demo" className="group">
              <Button className="bg-[#f97316] hover:bg-[#ea580c] text-white font-medium shadow-md hover:shadow-lg transition-all">
                Request Demo
                <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-28 overflow-hidden bg-gradient-to-b from-white via-orange-50/50 to-white">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-100 rounded-full opacity-20 blur-3xl"></div>
            <div className="absolute top-60 -left-20 w-60 h-60 bg-green-200 rounded-full opacity-20 blur-3xl"></div>
          </div>
          <div className="container relative px-4 md:px-6 mx-auto">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              <div className="space-y-8 max-w-2xl">
                <div className="inline-flex items-center rounded-full border border-orange-200 px-4 py-1.5 text-sm font-medium bg-orange-50 text-[#f97316]">
                  All-in-one School Management Platform
                </div>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl text-gray-900 lg:leading-[1.1]">
                  Transform School Management with <span className="text-[#f97316]">Eduit</span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Fordest Technologies' comprehensive platform designed to streamline administration, enhance teaching, and elevate the learning experience.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="#request-demo" className="group">
                    <Button size="lg" className="w-full sm:w-auto text-base bg-[#f97316] hover:bg-[#ea580c] text-white font-medium shadow-md hover:shadow-lg transition-all">
                      Request Demo
                      <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                  </Link>
                  <Link href="#features">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto text-base text-gray-700 border-gray-300 hover:bg-gray-50">
                      See Features
                    </Button>
                  </Link>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center text-sm text-gray-600 font-medium">
                      <CheckCircle className="h-5 w-5 text-[#f97316] mr-2" />
                      Trusted by 500+ schools
                    </div>
                    <div className="flex items-center text-sm text-gray-600 font-medium">
                      <CheckCircle className="h-5 w-5 text-[#f97316] mr-2" />
                      99.9% Uptime SLA
                    </div>
                    <div className="flex items-center text-sm text-gray-600 font-medium">
                      <CheckCircle className="h-5 w-5 text-[#f97316] mr-2" />
                      FERPA Compliant
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative flex justify-center rounded-2xl overflow-hidden shadow-2xl">
                <div className="relative w-full aspect-[4/3] bg-white rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white via-white to-orange-50 flex items-center justify-center">
                    <div className="relative w-full h-full p-6">
                      {/* Placeholder for dashboard image */}
                      <div className="relative w-full h-full rounded-lg overflow-hidden border border-gray-200 shadow-md bg-white">
                        <div className="absolute top-0 left-0 right-0 h-12 bg-[#f97316] flex items-center px-4">
                          <div className="flex space-x-2">
                            <div className="w-3 h-3 rounded-full bg-red-400"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                            <div className="w-3 h-3 rounded-full bg-green-400"></div>
                          </div>
                          <div className="ml-4 text-white text-sm font-medium">Eduit Dashboard</div>
                        </div>
                        <div className="absolute top-12 left-0 right-0 bottom-0 bg-gray-50 flex">
                          <div className="w-48 h-full bg-[#ea580c] p-4">
                            <div className="space-y-4">
                              <div className="bg-orange-600 rounded p-2 text-white text-xs">Dashboard</div>
                              <div className="text-orange-100 text-xs p-2">Students</div>
                              <div className="text-orange-100 text-xs p-2">Teachers</div>
                              <div className="text-orange-100 text-xs p-2">Classes</div>
                              <div className="text-orange-100 text-xs p-2">Attendance</div>
                              <div className="text-orange-100 text-xs p-2">Reports</div>
                            </div>
                          </div>
                          <div className="flex-1 p-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-white rounded-lg p-3 shadow-sm">
                                <div className="text-xs text-gray-500 mb-1">Total Students</div>
                                <div className="text-lg font-bold">1,248</div>
                                <div className="mt-2 h-1 bg-gray-100 rounded-full">
                                  <div className="h-1 bg-green-500 rounded-full w-3/4"></div>
                                </div>
                              </div>
                              <div className="bg-white rounded-lg p-3 shadow-sm">
                                <div className="text-xs text-gray-500 mb-1">Attendance Rate</div>
                                <div className="text-lg font-bold">94.2%</div>
                                <div className="mt-2 h-1 bg-gray-100 rounded-full">
                                  <div className="h-1 bg-blue-500 rounded-full w-[94%]"></div>
                                </div>
                              </div>
                              <div className="bg-white rounded-lg p-3 shadow-sm">
                                <div className="text-xs text-gray-500 mb-1">Classes</div>
                                <div className="text-lg font-bold">42</div>
                                <div className="mt-2 h-1 bg-gray-100 rounded-full">
                                  <div className="h-1 bg-purple-500 rounded-full w-1/2"></div>
                                </div>
                              </div>
                              <div className="bg-white rounded-lg p-3 shadow-sm">
                                <div className="text-xs text-gray-500 mb-1">GPA Average</div>
                                <div className="text-lg font-bold">3.4</div>
                                <div className="mt-2 h-1 bg-gray-100 rounded-full">
                                  <div className="h-1 bg-yellow-500 rounded-full w-4/5"></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 bg-white rounded-lg shadow-lg p-4 flex items-center justify-center">
                  <div className="px-2 py-1 bg-[#f97316]/10 rounded-md text-xs font-medium text-[#f97316] flex items-center">
                    <span className="inline-block mr-1 p-1 bg-white rounded-full">
                      <School className="h-3 w-3 text-[#f97316]" />
                    </span>
                    A Fordest Technologies Solution
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Indicators */}
        <section className="py-12 border-y border-gray-200 bg-gray-50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-8">Trusted By Leading Educational Institutions</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 items-center justify-items-center w-full max-w-5xl">
                {/* Placeholder for school logos */}
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 w-32 bg-white rounded-md shadow-sm flex items-center justify-center px-4">
                    <div className="text-gray-400 font-medium text-sm">School Logo {i + 1}</div>
                  </div>
                ))}
              </div>
              <div className="mt-12 flex flex-wrap justify-center gap-6">
                <div className="flex items-center px-4 py-2 bg-white rounded-lg shadow-sm">
                  <Shield className="h-5 w-5 text-[#f97316] mr-2" />
                  <span className="text-sm font-medium">FERPA Compliant</span>
                </div>
                <div className="flex items-center px-4 py-2 bg-white rounded-lg shadow-sm">
                  <Shield className="h-5 w-5 text-[#f97316] mr-2" />
                  <span className="text-sm font-medium">COPPA Certified</span>
                </div>
                <div className="flex items-center px-4 py-2 bg-white rounded-lg shadow-sm">
                  <Lock className="h-5 w-5 text-[#f97316] mr-2" />
                  <span className="text-sm font-medium">ISO 27001</span>
                </div>
                <div className="flex items-center px-4 py-2 bg-white rounded-lg shadow-sm">
                  <Shield className="h-5 w-5 text-[#f97316] mr-2" />
                  <span className="text-sm font-medium">SOC 2 Compliant</span>
                </div>
              </div>
              <div className="mt-8 text-gray-500 text-sm">
                Featured in: <span className="font-medium">EdTech Magazine</span>, <span className="font-medium">Education World</span>, <span className="font-medium">Tech & Learning</span>
              </div>
            </div>
          </div>
        </section>

        {/* Fordest Advantage Section */}
        <section id="about" className="py-20 bg-white">
          <div className="container px-4 md:px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center rounded-full border border-orange-200 px-4 py-1.5 text-sm font-medium bg-orange-50 text-[#f97316]">
                  The Fordest Advantage
                </div>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-gray-900">
                  Backed by Fordest Technologies' 10+ Years in Education Innovation
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Fordest Technologies specializes in creating sophisticated yet intuitive software solutions for the education sector, with a focus on data security, seamless integration, and measurable outcomes.
                </p>
                <div className="pt-4">
                  <Link href="https://fordest.com" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="text-[#f97316] border-[#f97316]">
                      Learn More About Fordest Technologies
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-6 pt-6">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full p-2 bg-orange-50">
                      <Globe className="h-5 w-5 text-[#f97316]" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Global Presence</h3>
                      <p className="text-sm text-gray-600">Serving institutions across 25+ countries</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="rounded-full p-2 bg-orange-50">
                      <Users className="h-5 w-5 text-[#f97316]" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Industry Leaders</h3>
                      <p className="text-sm text-gray-600">Team of education technology experts</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="rounded-full p-2 bg-orange-50">
                      <Star className="h-5 w-5 text-[#f97316]" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Award-Winning</h3>
                      <p className="text-sm text-gray-600">Multiple EdTech excellence awards</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="rounded-full p-2 bg-orange-50">
                      <LifeBuoy className="h-5 w-5 text-[#f97316]" />
                    </div>
                    <div>
                      <h3 className="font-semibold">24/7 Support</h3>
                      <p className="text-sm text-gray-600">Dedicated customer success teams</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative flex justify-center">
                <div className="relative w-full max-w-md">
                  <div className="absolute -top-6 -left-6 w-20 h-20 bg-orange-100 rounded-lg rotate-6 z-10"></div>
                  <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-green-200 rounded-lg -rotate-6 z-10"></div>
                  <div className="relative z-20 bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
                    <div className="aspect-video bg-[#f97316] flex items-center justify-center p-8 text-white">
                      <div className="text-center">
                        <div className="mb-4 inline-block">
                          <School className="h-16 w-16" />
                        </div>
                        <h3 className="text-xl font-bold">Fordest Technologies</h3>
                        <p className="text-orange-100 mt-2">Education Innovation Since 2013</p>
                      </div>
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <h4 className="font-semibold text-lg">Our Mission</h4>
                        <p className="text-sm text-gray-600">To transform education through technology that empowers educators and enhances student outcomes.</p>
                      </div>
                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-500">Industry Partners:</div>
                          <div className="flex space-x-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                              <div key={i} className="h-6 w-6 bg-gray-200 rounded-full"></div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Product Showcase */}
        <section id="features" className="py-20 bg-gray-50 border-t border-gray-200">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-16">
              <div className="inline-flex items-center rounded-full border border-orange-200 px-4 py-1.5 text-sm font-medium bg-orange-50 text-[#f97316] mb-4">
                Product Showcase
              </div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-gray-900 mb-4">
                Experience the Power of Eduit
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Discover how our comprehensive suite of tools can transform your educational institution
              </p>
            </div>

            {/* Interactive Demo Viewer */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 mb-16">
              <div className="border-b border-gray-200">
                <div className="flex overflow-x-auto">
                  {["Dashboard", "Student Management", "Attendance", "Gradebook", "Reports"].map((tab, i) => (
                    <div key={i} className={`px-6 py-4 font-medium whitespace-nowrap cursor-pointer ${i === 0 ? "text-[#f97316] border-b-2 border-[#f97316]" : "text-gray-600 hover:text-gray-900"}`}>
                      {tab}
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-8">
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="mb-4">
                      <School className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800">Interactive Demo Preview</h3>
                    <p className="text-gray-500 mt-2 max-w-md mx-auto">
                      Explore our intuitive dashboard designed for educators and administrators
                    </p>
                    <Button className="mt-6 bg-[#f97316] hover:bg-[#ea580c]">Play Demo Video</Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Comparison Table */}
            <div className="mb-16">
              <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Why Eduit Stands Out</h3>
              <div className="overflow-hidden shadow-md rounded-xl border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200 bg-white">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 px-6 text-left text-sm font-semibold text-gray-900">Features</th>
                      <th scope="col" className="py-3.5 px-6 text-center text-sm font-semibold text-gray-900 border-l border-gray-200">
                        <div className="flex items-center justify-center">
                          <School className="h-5 w-5 text-[#f97316] mr-2" />
                          Eduit
                        </div>
                      </th>
                      <th scope="col" className="py-3.5 px-6 text-center text-sm font-semibold text-gray-900 border-l border-gray-200">
                        Competitor A
                      </th>
                      <th scope="col" className="py-3.5 px-6 text-center text-sm font-semibold text-gray-900 border-l border-gray-200">
                        Competitor B
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {[
                      { feature: "All-in-one Platform", eduit: true, compA: false, compB: false },
                      { feature: "Mobile Application", eduit: true, compA: true, compB: false },
                      { feature: "Real-time Analytics", eduit: true, compA: false, compB: true },
                      { feature: "Parent Portal", eduit: true, compA: true, compB: true },
                      { feature: "Advanced Reporting", eduit: true, compA: false, compB: false },
                    ].map((row, i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="py-4 px-6 text-sm font-medium text-gray-900">{row.feature}</td>
                        <td className="py-4 px-6 text-center text-sm text-gray-500 border-l border-gray-200">
                          {row.eduit ? (
                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-green-100 text-green-600">
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-red-100 text-red-600">
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-center text-sm text-gray-500 border-l border-gray-200">
                          {row.compA ? (
                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-green-100 text-green-600">
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-red-100 text-red-600">
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-center text-sm text-gray-500 border-l border-gray-200">
                          {row.compB ? (
                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-green-100 text-green-600">
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-red-100 text-red-600">
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile App Preview */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900">Access Anywhere with Our Mobile App</h3>
                <p className="text-lg text-gray-600">
                  Manage your school on the go with our feature-rich mobile application available for iOS and Android devices.
                </p>
                <ul className="space-y-4">
                  {[
                    "Real-time attendance tracking",
                    "Instant notifications for parents and teachers",
                    "Grade entry and management",
                    "Student behavior monitoring",
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="rounded-full p-1 bg-[#f97316]/10 text-[#f97316] mt-0.5">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M13.3334 4L6.00002 11.3333L2.66669 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-4 pt-4">
                  <Button className="bg-black text-white hover:bg-gray-800 flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    App Store
                  </Button>
                  <Button className="bg-black text-white hover:bg-gray-800 flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Google Play
                  </Button>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="relative w-64 h-[500px] bg-black rounded-[32px] p-2 shadow-xl border-4 border-gray-800">
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-black rounded-b-xl"></div>
                  <div className="w-full h-full bg-white rounded-[24px] overflow-hidden">
                    <div className="h-12 bg-[#f97316] flex items-center justify-center text-white font-medium">
                      Eduit Mobile
                    </div>
                    <div className="p-4 space-y-4">
                      <div className="space-y-2">
                        <div className="h-8 bg-gray-100 rounded-md w-2/3"></div>
                        <div className="h-20 bg-gray-100 rounded-md"></div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="h-24 bg-orange-50 rounded-md p-3">
                          <div className="h-4 w-12 bg-orange-200 rounded mb-2"></div>
                          <div className="h-6 w-16 bg-orange-100 rounded"></div>
                        </div>
                        <div className="h-24 bg-green-50 rounded-md p-3">
                          <div className="h-4 w-12 bg-green-200 rounded mb-2"></div>
                          <div className="h-6 w-16 bg-green-100 rounded"></div>
                        </div>
                        <div className="h-24 bg-yellow-50 rounded-md p-3">
                          <div className="h-4 w-12 bg-yellow-200 rounded mb-2"></div>
                          <div className="h-6 w-16 bg-yellow-100 rounded"></div>
                        </div>
                        <div className="h-24 bg-purple-50 rounded-md p-3">
                          <div className="h-4 w-12 bg-purple-200 rounded mb-2"></div>
                          <div className="h-6 w-16 bg-purple-100 rounded"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-20 bg-white border-t border-gray-200">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-16">
              <div className="inline-flex items-center rounded-full border border-orange-200 px-4 py-1.5 text-sm font-medium bg-orange-50 text-[#f97316] mb-4">
                Success Stories
              </div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-gray-900 mb-4">
                Trusted by Educators Nationwide
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Hear from administrators and teachers who have transformed their schools with Eduit
              </p>
            </div>

            {/* Video Testimonial */}
            <div className="mb-20">
              <div className="relative mx-auto max-w-4xl">
                <div className="aspect-video rounded-2xl overflow-hidden bg-gray-200 shadow-lg">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="p-4 rounded-full bg-[#f97316]/20 backdrop-blur-sm">
                      <div className="p-3 rounded-full bg-[#f97316] text-white">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M5 3L19 12L5 21V3Z" fill="currentColor" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent text-white">
                    <div>
                      <h3 className="text-xl font-bold">Springfield High School's Success Story</h3>
                      <p className="text-white/80 mt-2">How we saved 20+ hours per week in administrative tasks</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quote Cards */}
            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  quote: "Eduit has revolutionized how we manage student data. Our teachers save countless hours on administrative tasks and can focus more on teaching.",
                  author: "Jennifer Martinez",
                  title: "Principal, Washington Academy",
                  image: null,
                },
                {
                  quote: "The parent communication features alone made the investment worthwhile. We've seen parent engagement increase by 40% since implementation.",
                  author: "Michael Johnson",
                  title: "Superintendent, Oakridge School District",
                  image: null,
                },
                {
                  quote: "As a teacher, I appreciate how intuitive the grading system is. I can provide detailed feedback and track progress with minimal effort.",
                  author: "Sarah Thompson",
                  title: "Lead Teacher, Riverside Elementary",
                  image: null,
                },
              ].map((testimonial, i) => (
                <div key={i} className="bg-white p-8 rounded-xl shadow-md border border-gray-200 flex flex-col h-full">
                  <div className="mb-6">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.33333 17.3333C9.33333 17.3333 8 16.4444 8 14.6667C8 12.8889 9.33333 12 9.33333 12C9.33333 12 8.44444 12 8.44444 10.6667C8.44444 9.33333 9.33333 8.44444 10.6667 8.44444C12 8.44444 12.8889 9.33333 12.8889 10.6667C12.8889 12 12 12.8889 10.6667 12.8889M9.33333 17.3333C9.33333 17.3333 10.6667 17.7778 12 17.7778C13.3333 17.7778 14.6667 17.3333 14.6667 17.3333M9.33333 17.3333V20.4444C9.33333 20.4444 10.6667 21.3333 12 21.3333C13.3333 21.3333 14.6667 20.4444 14.6667 20.4444V17.3333M21.3333 17.3333C21.3333 17.3333 20 16.4444 20 14.6667C20 12.8889 21.3333 12 21.3333 12C21.3333 12 20.4444 12 20.4444 10.6667C20.4444 9.33333 21.3333 8.44444 22.6667 8.44444C24 8.44444 24.8889 9.33333 24.8889 10.6667C24.8889 12 24 12.8889 22.6667 12.8889M21.3333 17.3333C21.3333 17.3333 22.6667 17.7778 24 17.7778C25.3333 17.7778 26.6667 17.3333 26.6667 17.3333M21.3333 17.3333V20.4444C21.3333 20.4444 22.6667 21.3333 24 21.3333C25.3333 21.3333 26.6667 20.4444 26.6667 20.4444V17.3333" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="text-gray-700 flex-grow">{testimonial.quote}</p>
                  <div className="mt-8 pt-4 border-t border-gray-200 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{testimonial.author}</p>
                      <p className="text-sm text-gray-500">{testimonial.title}</p>
                    </div>
                    <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Case Studies */}
            <div className="mt-16 mx-auto max-w-4xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Featured Case Studies</h3>
              <div className="space-y-4">
                {[
                  {
                    title: "How Springfield High School Saved 20 Hours Per Week",
                    summary: "Implementing Eduit's automated attendance and grading systems streamlined administrative processes.",
                  },
                  {
                    title: "Westlake District Increased Parent Engagement by 38%",
                    summary: "Using Eduit's parent portal and communication tools transformed home-school connections.",
                  },
                  {
                    title: "Charter Academy Network Reduced IT Costs by 42%",
                    summary: "Consolidating multiple systems into Eduit's comprehensive platform eliminated redundancies.",
                  },
                ].map((study, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:border-[#f97316] transition-colors group cursor-pointer">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-lg text-gray-900 group-hover:text-[#f97316] transition-colors">{study.title}</h4>
                        <p className="text-gray-600 mt-1">{study.summary}</p>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-white border border-gray-200 flex items-center justify-center group-hover:bg-[#f97316] group-hover:border-[#f97316] transition-colors">
                        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 text-center">
                <Button variant="outline" className="text-[#f97316] border-[#f97316]">
                  View All Case Studies
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Enterprise-Grade Features */}
        <section className="py-20 bg-gray-50 border-t border-gray-200">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-16">
              <div className="inline-flex items-center rounded-full border border-orange-200 px-4 py-1.5 text-sm font-medium bg-orange-50 text-[#f97316] mb-4">
                Enterprise-Grade
              </div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-gray-900 mb-4">
                Built for Scale and Security
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Eduit is designed to meet the highest standards of data security and system reliability
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8">
                <div className="p-3 rounded-full bg-orange-50 inline-block mb-4">
                  <Shield className="h-6 w-6 text-[#f97316]" />
                </div>
                <h3 className="text-xl font-bold mb-3">Data Security</h3>
                <p className="text-gray-600 mb-6">
                  End-to-end encryption, regular security audits, and compliance with FERPA, COPPA, and other education data standards.
                </p>
                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                  {["FERPA", "COPPA", "GDPR Ready", "SOC 2"].map((badge, i) => (
                    <div key={i} className="px-3 py-1 bg-orange-50 rounded-full text-xs font-medium text-[#f97316]">
                      {badge}
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8">
                <div className="p-3 rounded-full bg-green-50 inline-block mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-green-600">
                    <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" />
                    <path d="M12 7V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3">99.9% Uptime SLA</h3>
                <p className="text-gray-600 mb-6">
                  Built on a robust cloud infrastructure with redundant systems to ensure your data is always accessible when you need it.
                </p>
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">System Reliability</span>
                    <span className="text-sm font-medium text-gray-900">99.9%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full">
                    <div className="h-2 bg-green-500 rounded-full w-[99.9%]"></div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8">
                <div className="p-3 rounded-full bg-purple-50 inline-block mb-4">
                  <LifeBuoy className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">Dedicated Support</h3>
                <p className="text-gray-600 mb-6">
                  Access to our education support specialists with experience in school operations and technical troubleshooting.
                </p>
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-purple-600" />
                    <span className="text-sm text-gray-700">Live chat support</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-purple-600" />
                    <span className="text-sm text-gray-700">Dedicated account manager</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CalendarDays className="h-5 w-5 text-purple-600" />
                    <span className="text-sm text-gray-700">Regular check-in meetings</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Technology Partners */}
        <section id="integrations" className="py-16 bg-white border-t border-gray-200">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Technology Partners</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Eduit seamlessly integrates with your favorite educational tools and services
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 items-center justify-items-center">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-20 w-32 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200 p-4">
                  <div className="text-gray-400 text-xs font-medium">Partner Logo</div>
                </div>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Button variant="outline" className="text-gray-700 border-gray-300">
                View All Integrations
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </section>

        {/* ROI Calculator */}
        <section className="py-20 bg-gradient-to-b from-orange-50 to-white border-t border-gray-200">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
              <div className="grid md:grid-cols-5">
                <div className="md:col-span-2 bg-[#f97316] p-8 text-white">
                  <h2 className="text-2xl font-bold mb-4">Calculate Your ROI</h2>
                  <p className="text-orange-100 mb-6">
                    Discover how much time and resources your school can save with Eduit
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-orange-100 mb-1">Number of Students</label>
                      <div className="relative">
                        <input
                          type="text"
                          className="w-full px-4 py-2 rounded bg-white/10 border border-orange-400 text-white placeholder-orange-200"
                          placeholder="e.g., 500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-orange-100 mb-1">Number of Staff</label>
                      <div className="relative">
                        <input
                          type="text"
                          className="w-full px-4 py-2 rounded bg-white/10 border border-orange-400 text-white placeholder-orange-200"
                          placeholder="e.g., 50"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-orange-100 mb-1">Current Software Costs/Year</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-200">$</span>
                        <input
                          type="text"
                          className="w-full px-4 py-2 pl-8 rounded bg-white/10 border border-orange-400 text-white placeholder-orange-200"
                          placeholder="e.g., 10,000"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-3 p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Your Estimated Savings</h3>
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Time Saved Weekly</span>
                        <span className="text-xl font-bold text-gray-900">20 hours</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full">
                        <div className="h-2 bg-[#f97316] rounded-full w-3/4"></div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Annual Cost Savings</span>
                        <span className="text-xl font-bold text-gray-900">$12,500</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full">
                        <div className="h-2 bg-green-500 rounded-full w-2/3"></div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Productivity Increase</span>
                        <span className="text-xl font-bold text-gray-900">32%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full">
                        <div className="h-2 bg-purple-500 rounded-full w-1/3"></div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-8">
                    <Button className="w-full bg-[#f97316] hover:bg-[#ea580c] text-white font-medium py-3">
                      Get Your Personalized ROI Report
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter and CTA */}
        <section id="request-demo" className="py-20 bg-gray-900 text-white">
          <div className="container px-4 md:px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to Transform Your School?</h2>
                <p className="text-xl text-gray-300">
                  Join 500+ schools nationwide that are already benefiting from Eduit's comprehensive platform.
                </p>
                <div className="space-y-4">
                  {[
                    "Streamline administrative tasks",
                    "Enhance teacher productivity",
                    "Improve student outcomes",
                    "Strengthen parent engagement",
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="rounded-full p-1 bg-[#f97316]/20 text-[#f97316]">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M13.3334 4L6.00002 11.3333L2.66669 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span className="text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center pt-6 text-sm">
                  <div className="flex -space-x-2 mr-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-8 w-8 rounded-full border-2 border-gray-900 bg-gray-600"></div>
                    ))}
                  </div>
                  <span className="text-gray-400">Trusted by <span className="text-white font-semibold">500+</span> schools</span>
                </div>
              </div>
              <div>
                <div className="bg-white rounded-xl p-8 shadow-xl">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Request a Demo</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316] outline-none transition-all"
                        placeholder="Enter your school name"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316] outline-none transition-all"
                          placeholder="First name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316] outline-none transition-all"
                          placeholder="Last name"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        className="w-full px-4 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316] outline-none transition-all"
                        placeholder="you@school.edu"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        className="w-full px-4 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316] outline-none transition-all"
                        placeholder="(123) 456-7890"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                      <select className="w-full px-4 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316] outline-none transition-all">
                        <option value="">Select your role</option>
                        <option value="Administrator">Administrator</option>
                        <option value="Principal">Principal</option>
                        <option value="Teacher">Teacher</option>
                        <option value="IT Director">IT Director</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-6">
                    <Button className="w-full bg-[#f97316] hover:bg-[#ea580c] text-white font-medium py-3">
                      Schedule Your Demo Now
                    </Button>
                  </div>
                  <div className="mt-4 text-center text-xs text-gray-500">
                    By submitting this form, you agree to our privacy policy and terms of service.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter Signup */}
        <section className="py-12 bg-gray-50 border-t border-gray-200">
          <div className="container px-4 md:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Stay Updated with Educational Trends</h3>
              <p className="text-gray-600 mb-6">
                Subscribe to our newsletter for the latest updates on education technology and best practices.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 max-w-lg mx-auto">
                <input
                  type="email"
                  className="flex-grow px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316] outline-none transition-all"
                  placeholder="Enter your email"
                />
                <Button className="bg-[#f97316] hover:bg-[#ea580c] text-white font-medium">
                  Subscribe
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 bg-white border-t border-gray-200">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-16">
              <div className="inline-flex items-center rounded-full border border-orange-200 px-4 py-1.5 text-sm font-medium bg-orange-50 text-[#f97316] mb-4">
                Flexible Pricing
              </div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-gray-900 mb-4">
                Choose the Perfect Plan for Your School
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Transparent pricing with no hidden fees. All plans include core features and premium support.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Basic Plan */}
              <div className="relative bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                <div className="absolute -top-5 left-6">
                  <div className="inline-flex items-center rounded-full border border-orange-200 px-4 py-1.5 text-xs font-medium bg-orange-50 text-[#f97316]">
                    STARTER
                  </div>
                </div>
                <div className="mb-6">
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-bold">₦1000</span>
                    <span className="text-gray-500 mb-1">/ student / month</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Perfect for small schools starting their digital journey</p>
                </div>
                <ul className="space-y-4 mb-8">
                  {[
                    "Up to 500 students",
                    "Core management features",
                    "Basic analytics",
                    "Email support",
                    "Mobile app access",
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <div className="rounded-full p-1 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full border-[#f97316] text-[#f97316] hover:bg-orange-50">
                  Get Started
                </Button>
              </div>

              {/* Professional Plan */}
              <div className="relative bg-[#f97316] rounded-2xl shadow-lg p-8 scale-105 z-10">
                <div className="absolute -top-5 left-6">
                  <div className="inline-flex items-center rounded-full border border-white px-4 py-1.5 text-xs font-medium bg-white text-[#f97316]">
                    PROFESSIONAL
                  </div>
                </div>
                <div className="mb-6">
                  <div className="flex items-end gap-2 text-white">
                    <span className="text-4xl font-bold">₦2000</span>
                    <span className="mb-1 opacity-90">/ student / month</span>
                  </div>
                  <p className="text-sm text-orange-100 mt-2">Most popular choice for growing institutions</p>
                </div>
                <ul className="space-y-4 mb-8">
                  {[
                    "Up to 2000 students",
                    "Advanced analytics",
                    "Priority support",
                    "Custom integrations",
                    "Parent portal",
                    "API access",
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-white">
                      <div className="rounded-full p-1 bg-white/20">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full bg-white hover:bg-gray-50 text-[#f97316]">
                  Get Started
                </Button>
              </div>

              {/* Enterprise Plan */}
              <div className="relative bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                <div className="absolute -top-5 left-6">
                  <div className="inline-flex items-center rounded-full border border-green-200 px-4 py-1.5 text-xs font-medium bg-green-50 text-green-600">
                    ENTERPRISE
                  </div>
                </div>
                <div className="mb-6">
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-bold">Custom</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Tailored solutions for large educational networks</p>
                </div>
                <ul className="space-y-4 mb-8">
                  {[
                    "Unlimited students",
                    "Custom development",
                    "24/7 dedicated support",
                    "On-premise deployment",
                    "SLA guarantee",
                    "Training & onboarding",
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <div className="rounded-full p-1 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full border-green-600 text-green-600 hover:bg-green-50">
                  Contact Sales
                </Button>
              </div>
            </div>

            <div className="mt-16 text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Frequently Asked Questions</h3>
              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left">
                {[
                  {
                    q: "Can I switch plans later?",
                    a: "Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.",
                  },
                  {
                    q: "Is there a setup fee?",
                    a: "No, we don't charge any setup or hidden fees. You only pay for the plan you choose.",
                  },
                  {
                    q: "Do you offer discounts for long-term contracts?",
                    a: "Yes, we offer special pricing for annual commitments. Contact our sales team for details.",
                  },
                  {
                    q: "What payment methods do you accept?",
                    a: "We accept all major credit cards, bank transfers, and purchase orders for enterprise customers.",
                  },
                ].map((faq, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-2">{faq.q}</h4>
                    <p className="text-gray-600 text-sm">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-20 bg-gray-50 border-t border-gray-200">
          <div className="container px-4 md:px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center rounded-full border border-orange-200 px-4 py-1.5 text-sm font-medium bg-orange-50 text-[#f97316] mb-4">
                  Get in Touch
                </div>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-gray-900 mb-4">
                  Let's Discuss Your School's Needs
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                  Our education specialists are here to help you find the perfect solution for your institution.
                </p>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full p-2 bg-orange-50">
                      <Mail className="h-6 w-6 text-[#f97316]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Email Us</h3>
                      <p className="text-gray-600">contact@eduit.com</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="rounded-full p-2 bg-green-50">
                      <MessageSquare className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Live Chat</h3>
                      <p className="text-gray-600">Available Monday to Friday, 9am-6pm EST</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="rounded-full p-2 bg-orange-50">
                      <Globe className="h-6 w-6 text-[#f97316]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Global Support</h3>
                      <p className="text-gray-600">Supporting schools in over 25 countries</p>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="bg-white rounded-2xl shadow-xl p-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Send us a Message</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316] outline-none transition-all"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316] outline-none transition-all"
                        placeholder="your@email.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                      <textarea
                        rows={4}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#f97316] focus:border-[#f97316] outline-none transition-all resize-none"
                        placeholder="How can we help you?"
                      ></textarea>
                    </div>
                    <Button className="w-full bg-[#f97316] hover:bg-[#ea580c] text-white">
                      Send Message
                    </Button>
                    <p className="text-xs text-center text-gray-500">
                      We'll get back to you within 24 hours
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 border-t border-gray-800">
        <div className="container px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <School className="h-8 w-8 text-white" />
                <div>
                  <div className="text-xl font-bold">Eduit</div>
                  <div className="text-[10px] text-gray-400">by Fordest Technologies</div>
                </div>
              </div>
              <p className="text-gray-400 mb-6">
                The comprehensive school management system trusted by educational institutions nationwide.
              </p>
              <div className="flex space-x-4">
                {["facebook", "twitter", "linkedin", "instagram"].map((social, i) => (
                  <a key={i} href="#" className="p-2 rounded-full bg-gray-800 hover:bg-[#f97316] transition-colors">
                    <span className="sr-only">{social}</span>
                    <div className="h-5 w-5 bg-gray-600"></div>
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-4">Product</h4>
              <ul className="space-y-3">
                {["Features", "Pricing", "Integrations", "Case Studies", "Security", "Updates"].map((link, i) => (
                  <li key={i}>
                    <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-4">Company</h4>
              <ul className="space-y-3">
                {["About Fordest", "Leadership", "Customers", "Careers", "Partner Program", "Media Kit"].map((link, i) => (
                  <li key={i}>
                    <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-4">Resources</h4>
              <ul className="space-y-3">
                {["Blog", "Documentation", "Community", "Support Center", "Webinars", "Privacy Policy"].map((link, i) => (
                  <li key={i}>
                    <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2023 Fordest Technologies, Inc. All rights reserved.
            </div>
            <div className="flex items-center">
              <div className="px-3 py-1 bg-gray-800 rounded-full text-xs font-medium text-gray-400 flex items-center">
                <Lock className="h-3 w-3 mr-1" />
                SOC 2 Compliant
              </div>
              <div className="ml-3 px-3 py-1 bg-gray-800 rounded-full text-xs font-medium text-gray-400 flex items-center">
                <Shield className="h-3 w-3 mr-1" />
                FERPA Certified
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Sticky CTA */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="flex flex-col items-end gap-4">
          <Button className="rounded-full h-12 w-12 bg-[#f97316] hover:bg-[#ea580c] shadow-lg p-0 flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-white" />
          </Button>
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 flex items-center overflow-hidden">
            <Button className="px-4 py-2 bg-[#f97316] hover:bg-[#ea580c] text-white text-sm font-medium rounded-r-none rounded-l-xl">
              Request Demo
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}


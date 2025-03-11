import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SchoolIcon, BookOpen, Users, Award, BarChart3 } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <SchoolIcon className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">EduIT</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link href="#features" className="text-sm font-medium hover:text-primary">
              Features
            </Link>
            <Link href="#roles" className="text-sm font-medium hover:text-primary">
              User Roles
            </Link>
            <Link href="#contact" className="text-sm font-medium hover:text-primary">
              Contact
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="outline">Log in</Button>
            </Link>
            <Link href="/register">
              <Button>Register School</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="py-20 md:py-32 bg-gradient-to-b from-white to-accent">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-4">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Comprehensive School Management System
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  EduIT streamlines school operations with powerful tools for administrators, teachers, students, and
                  parents.
                </p>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/register">
                    <Button size="lg" className="w-full min-[400px]:w-auto">
                      Get Started
                    </Button>
                  </Link>
                  <Link href="#features">
                    <Button size="lg" variant="outline" className="w-full min-[400px]:w-auto">
                      Learn More
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="relative w-full max-w-[500px] aspect-video rounded-xl bg-gradient-to-br from-primary/20 via-secondary/20 to-primary/20 p-1">
                  <div className="absolute inset-0 rounded-lg bg-white/90 dark:bg-black/80 shadow-lg flex items-center justify-center">
                    <div className="text-center p-6">
                      <SchoolIcon className="h-16 w-16 mx-auto mb-4 text-primary" />
                      <h3 className="text-xl font-bold">EduIT Dashboard</h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        Manage your school with our intuitive dashboard
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-16 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter">Key Features</h2>
              <p className="text-muted-foreground md:text-lg mt-4">
                Everything you need to manage your educational institution
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg shadow-sm">
                <div className="p-3 rounded-full bg-primary/10 mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-2">User Management</h3>
                <p className="text-sm text-muted-foreground">
                  Secure JWT authentication with role-based access control for all users
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg shadow-sm">
                <div className="p-3 rounded-full bg-secondary/10 mb-4">
                  <BookOpen className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="text-lg font-bold mb-2">Academic Management</h3>
                <p className="text-sm text-muted-foreground">
                  Create and manage classes, subjects, and assign teachers
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg shadow-sm">
                <div className="p-3 rounded-full bg-primary/10 mb-4">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-2">Results Management</h3>
                <p className="text-sm text-muted-foreground">
                  Record scores, calculate grades, and generate digital report cards
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg shadow-sm">
                <div className="p-3 rounded-full bg-secondary/10 mb-4">
                  <BarChart3 className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="text-lg font-bold mb-2">Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  Track attendance, monitor academic progress, and generate reports
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="roles" className="py-16 md:py-24 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter">User Roles</h2>
              <p className="text-muted-foreground md:text-lg mt-4">Tailored experiences for every stakeholder</p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <div className="bg-card p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="p-2 rounded-full bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </span>
                  Super Admin
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="rounded-full bg-primary/20 p-1 mt-0.5">
                      <svg className="h-3 w-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    Manage all schools on the platform
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="rounded-full bg-primary/20 p-1 mt-0.5">
                      <svg className="h-3 w-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    Register new schools and assign admins
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="rounded-full bg-primary/20 p-1 mt-0.5">
                      <svg className="h-3 w-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    Monitor platform-wide activities
                  </li>
                </ul>
              </div>
              <div className="bg-card p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="p-2 rounded-full bg-secondary/10">
                    <Users className="h-5 w-5 text-secondary" />
                  </span>
                  School Admin
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="rounded-full bg-secondary/20 p-1 mt-0.5">
                      <svg className="h-3 w-3 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    Register teachers, students, and parents
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="rounded-full bg-secondary/20 p-1 mt-0.5">
                      <svg className="h-3 w-3 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    Manage classes, subjects, and assignments
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="rounded-full bg-secondary/20 p-1 mt-0.5">
                      <svg className="h-3 w-3 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    Approve results before publishing
                  </li>
                </ul>
              </div>
              <div className="bg-card p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="p-2 rounded-full bg-primary/10">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </span>
                  Teachers
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="rounded-full bg-primary/20 p-1 mt-0.5">
                      <svg className="h-3 w-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    Record attendance and test scores
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="rounded-full bg-primary/20 p-1 mt-0.5">
                      <svg className="h-3 w-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    Track student academic performance
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="rounded-full bg-primary/20 p-1 mt-0.5">
                      <svg className="h-3 w-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    Submit results for approval
                  </li>
                </ul>
              </div>
              <div className="bg-card p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="p-2 rounded-full bg-secondary/10">
                    <Users className="h-5 w-5 text-secondary" />
                  </span>
                  Students
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="rounded-full bg-secondary/20 p-1 mt-0.5">
                      <svg className="h-3 w-3 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    View academic records and results
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="rounded-full bg-secondary/20 p-1 mt-0.5">
                      <svg className="h-3 w-3 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    Download and print report cards
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="rounded-full bg-secondary/20 p-1 mt-0.5">
                      <svg className="h-3 w-3 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    Access school announcements
                  </li>
                </ul>
              </div>
              <div className="bg-card p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="p-2 rounded-full bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </span>
                  Parents
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="rounded-full bg-primary/20 p-1 mt-0.5">
                      <svg className="h-3 w-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    Monitor child's academic progress
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="rounded-full bg-primary/20 p-1 mt-0.5">
                      <svg className="h-3 w-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    View attendance and results
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="rounded-full bg-primary/20 p-1 mt-0.5">
                      <svg className="h-3 w-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    Receive school notifications
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-6 md:py-8">
        <div className="container flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <SchoolIcon className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold">EduIT</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2025 EduIT. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
              Privacy Policy
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getSession } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"
import { redirect } from "next/navigation"
import { ResultsTable } from "./results-table"
import type { Result, Prisma } from "@prisma/client"
import type { UserRole } from "@/lib/auth"

const prisma = new PrismaClient()

interface ExtendedResult extends Result {
  student: {
    id: string
    name: string
  }
  subject: {
    id: string
    name: string
  }
}

export default async function ResultsPage() {
  const session = await getSession()
  if (!session) {
    redirect("/login")
  }

  let results: ExtendedResult[] = []
  const { role, id, schoolId } = session

  const baseInclude = {
    student: {
      select: {
        id: true,
        name: true,
      },
    },
    subject: {
      select: {
        id: true,
        name: true,
      },
    },
  } as const

  if (role === "super_admin") {
    const data = await prisma.result.findMany({
      where: {
        student: {
          schoolId,
        },
        isApproved: false,
      },
      include: baseInclude,
    })
    results = data as ExtendedResult[]
  } else if (role === "teacher") {
    const data = await prisma.result.findMany({
      where: {
        student: {
          schoolId,
        },
        subject: {
          teachers: {
            some: {
              teacherId: id,
            },
          },
        },
      },
      include: baseInclude,
    })
    results = data as ExtendedResult[]
  } else if (role === "student") {
    const data = await prisma.result.findMany({
      where: {
        student: {
          schoolId,
        },
        studentId: id,
        isApproved: true,
      },
      include: baseInclude,
    })
    results = data as ExtendedResult[]
  } else if (role === "parent") {
    const studentParents = await prisma.studentParent.findMany({
      where: { parentId: id },
      select: {
        studentId: true,
      },
    })

    if (studentParents.length > 0) {
      const studentIds = studentParents.map(s => s.studentId)
      const data = await prisma.result.findMany({
        where: {
          student: {
            schoolId,
          },
          studentId: {
            in: studentIds,
          },
          isApproved: true,
        },
        include: baseInclude,
      })
      results = data as ExtendedResult[]
    }
  }

  let title = "Results"
  let description = "View and manage results"

  switch (role) {
    case "super_admin":
      title = "Results Management"
      description = "Review and approve student results"
      break
    case "teacher":
      title = "Student Results"
      description = "View and manage your students' results"
      break
    case "student":
      title = "My Results"
      description = "View your academic results"
      break
    case "parent":
      title = "Children's Results"
      description = "View your children's academic results"
      break
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        <ResultsTable
          userRole={role}
          schoolId={schoolId}
          results={results}
        />
      </CardContent>
    </Card>
  )
}
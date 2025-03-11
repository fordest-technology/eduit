import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("studentId")
    const subjectId = searchParams.get("subjectId")
    const sessionId = searchParams.get("sessionId")
    const examType = searchParams.get("examType")
    const isApproved = searchParams.get("isApproved")

    const where: any = {}

    if (studentId) {
      where.studentId = studentId
    }

    if (subjectId) {
      where.subjectId = subjectId
    }

    if (sessionId) {
      where.sessionId = sessionId
    }

    if (examType) {
      where.examType = examType.toUpperCase()
    }

    if (isApproved !== null) {
      where.isApproved = isApproved === "true"
    }

    // If user is a student, they can only see their own approved results
    if (session.role === "STUDENT") {
      where.studentId = session.id
      where.isApproved = true
    }

    // If user is a parent, they can only see their children's approved results
    if (session.role === "PARENT") {
      const children = await prisma.studentParent.findMany({
        where: { parentId: session.id },
        select: { studentId: true },
      })

      const childrenIds = children.map((child) => child.studentId)

      if (childrenIds.length === 0) {
        return NextResponse.json([])
      }

      where.studentId = { in: childrenIds }
      where.isApproved = true
    }

    // If user is a teacher, they can only see results for subjects they teach
    if (session.role === "TEACHER") {
      const teacherSubjects = await prisma.subjectTeacher.findMany({
        where: { teacherId: session.id },
        select: { subjectId: true },
      })

      const subjectIds = teacherSubjects.map((subject) => subject.subjectId)

      if (subjectIds.length === 0 && !subjectId) {
        return NextResponse.json([])
      }

      if (!subjectId) {
        where.subjectId = { in: subjectIds }
      }
    }

    // If user is a school admin, they can only see results for their school
    if (session.role === "SCHOOL_ADMIN") {
      where.student = {
        schoolId: session.schoolId,
      }
    }

    const results = await prisma.result.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            schoolId: true,
          },
        },
        subject: true,
        session: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    })

    return NextResponse.json(results)
  } catch (error) {
    console.error("Error fetching results:", error)
    return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session || (session.role !== "super_admin" && session.role !== "school_admin" && session.role !== "TEACHER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { studentId, subjectId, sessionId, examType, marks, totalMarks, remarks } = body

    // Validate required fields
    if (!studentId || !subjectId || !sessionId || !examType || marks === undefined || totalMarks === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if student exists
    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
        role: "STUDENT",
      },
      select: { schoolId: true },
    })

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Check if subject exists
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      select: { schoolId: true },
    })

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 })
    }

    // Check if session exists
    const academicSession = await prisma.academicSession.findUnique({
      where: { id: sessionId },
      select: { schoolId: true },
    })

    if (!academicSession) {
      return NextResponse.json({ error: "Academic session not found" }, { status: 404 })
    }

    // Check if all entities belong to the same school
    if (student.schoolId !== subject.schoolId || student.schoolId !== academicSession.schoolId) {
      return NextResponse.json(
        { error: "Student, subject, and session must belong to the same school" },
        { status: 400 },
      )
    }

    // Check if user has permission to add results for this student/subject
    if (session.role === "TEACHER") {
      // Teachers can only add results for subjects they teach
      const teacherSubject = await prisma.subjectTeacher.findFirst({
        where: {
          teacherId: session.id,
          subjectId,
        },
      })

      if (!teacherSubject) {
        return NextResponse.json({ error: "You are not assigned to teach this subject" }, { status: 403 })
      }
    } else if (session.role === "SCHOOL_ADMIN") {
      // School admins can only add results for students in their school
      if (student.schoolId !== session.schoolId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    // Calculate grade based on percentage
    const percentage = (marks / totalMarks) * 100
    let grade = ""

    if (percentage >= 90) {
      grade = "A+"
    } else if (percentage >= 80) {
      grade = "A"
    } else if (percentage >= 70) {
      grade = "B"
    } else if (percentage >= 60) {
      grade = "C"
    } else if (percentage >= 50) {
      grade = "D"
    } else {
      grade = "F"
    }

    // Check if result already exists
    const existingResult = await prisma.result.findFirst({
      where: {
        studentId,
        subjectId,
        sessionId,
        examType: examType.toUpperCase(),
      },
    })

    let result

    if (existingResult) {
      // Update existing result
      result = await prisma.result.update({
        where: { id: existingResult.id },
        data: {
          marks,
          totalMarks,
          grade,
          remarks,
          isApproved: session.role === "SCHOOL_ADMIN", // Auto-approve if added by school admin
        },
        include: {
          student: {
            select: {
              id: true,
              name: true,
            },
          },
          subject: true,
          session: true,
        },
      })
    } else {
      // Create new result
      result = await prisma.result.create({
        data: {
          studentId,
          subjectId,
          sessionId,
          examType: examType.toUpperCase(),
          marks,
          totalMarks,
          grade,
          remarks,
          isApproved: session.role === "SCHOOL_ADMIN", // Auto-approve if added by school admin
        },
        include: {
          student: {
            select: {
              id: true,
              name: true,
            },
          },
          subject: true,
          session: true,
        },
      })
    }

    return NextResponse.json(result, { status: existingResult ? 200 : 201 })
  } catch (error) {
    console.error("Error adding result:", error)
    return NextResponse.json({ error: "Failed to add result" }, { status: 500 })
  }
}


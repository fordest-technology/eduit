import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { BookOpen, GraduationCap, Info, School, User, Users } from "lucide-react"

export default function UserGuideDocumentationPage() {
  return (
    <div className="container py-10 max-w-5xl">
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-2">EduIT User Guide</h1>
        <p className="text-xl text-muted-foreground">
          Comprehensive documentation for all user roles in the EduIT School Management System
        </p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="super-admin">Super Admin</TabsTrigger>
          <TabsTrigger value="school-admin">School Admin</TabsTrigger>
          <TabsTrigger value="teacher">Teacher</TabsTrigger>
          <TabsTrigger value="student">Student</TabsTrigger>
          <TabsTrigger value="parent">Parent</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Overview</CardTitle>
              <CardDescription>Introduction to the EduIT School Management System</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">What is EduIT?</h3>
                <p>
                  EduIT is a comprehensive school management system designed to streamline administrative tasks, enhance
                  communication between stakeholders, and improve the overall educational experience. The system
                  provides role-based access for administrators, teachers, students, and parents.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Key Features</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>User Management:</strong> Role-based access control with secure authentication
                  </li>
                  <li>
                    <strong>School Management:</strong> Create and manage multiple schools on a single platform
                  </li>
                  <li>
                    <strong>Academic Management:</strong> Manage classes, subjects, and teacher assignments
                  </li>
                  <li>
                    <strong>Results Management:</strong> Record, approve, and publish student results
                  </li>
                  <li>
                    <strong>Parent Portal:</strong> Allow parents to monitor their children's progress
                  </li>
                  <li>
                    <strong>Reporting:</strong> Generate comprehensive reports and analytics
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">User Roles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center">
                        <User className="h-4 w-4 mr-2 text-destructive" />
                        Super Admin
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      Platform-wide administration, manages schools and school admins
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center">
                        <School className="h-4 w-4 mr-2 text-primary" />
                        School Admin
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      Manages a specific school, including users, classes, and results
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center">
                        <BookOpen className="h-4 w-4 mr-2 text-secondary" />
                        Teacher
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      Records attendance, manages classes, and submits results
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center">
                        <GraduationCap className="h-4 w-4 mr-2 text-secondary" />
                        Student
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      Views academic records, results, and school announcements
                    </CardContent>
                  </Card>

                  <Card className="md:col-span-2">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center">
                        <Users className="h-4 w-4 mr-2 text-primary" />
                        Parent
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      Monitors children's academic progress, views results and attendance
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Getting Started</AlertTitle>
                <AlertDescription>
                  To get started with EduIT, log in with your provided credentials. Your dashboard and available
                  features will depend on your assigned role.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="super-admin" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Super Admin Guide</CardTitle>
              <CardDescription>Complete guide for Super Administrators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Dashboard Overview</h3>
                <p>
                  The Super Admin dashboard provides a comprehensive overview of all schools, users, and system
                  activities. From here, you can manage the entire platform, create schools, and assign school
                  administrators.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Managing Schools</h3>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>
                    <strong>Creating a School:</strong>
                    <ul className="list-disc pl-6 mt-1">
                      <li>Navigate to "Schools" in the sidebar</li>
                      <li>Click "Add School"</li>
                      <li>Fill in the school details (name, address, contact information)</li>
                      <li>A unique subdomain will be automatically generated for the school</li>
                      <li>Click "Save" to create the school</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Editing a School:</strong>
                    <ul className="list-disc pl-6 mt-1">
                      <li>Navigate to "Schools" in the sidebar</li>
                      <li>Find the school you want to edit</li>
                      <li>Click the "Edit" button</li>
                      <li>Update the school details</li>
                      <li>Click "Save" to apply changes</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Deleting a School:</strong>
                    <ul className="list-disc pl-6 mt-1">
                      <li>Navigate to "Schools" in the sidebar</li>
                      <li>Find the school you want to delete</li>
                      <li>Click the "Delete" button</li>
                      <li>Confirm the deletion</li>
                    </ul>
                  </li>
                </ol>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Managing Users</h3>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>
                    <strong>Creating a School Admin:</strong>
                    <ul className="list-disc pl-6 mt-1">
                      <li>Navigate to "Users" in the sidebar</li>
                      <li>Click "Add User"</li>
                      <li>Select "School Admin" as the role</li>
                      <li>Fill in the user details</li>
                      <li>Select the school to assign the admin to</li>
                      <li>Click "Save" to create the admin</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Creating Students:</strong>
                    <ul className="list-disc pl-6 mt-1">
                      <li>Navigate to "Users" in the sidebar</li>
                      <li>Click "Add User"</li>
                      <li>Select "Student" as the role</li>
                      <li>Fill in the student details</li>
                      <li>Select the school</li>
                      <li>Click "Save" to create the student</li>
                      <li>After creation, assign the student to a class</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Creating Parents:</strong>
                    <ul className="list-disc pl-6 mt-1">
                      <li>Navigate to "Users" in the sidebar</li>
                      <li>Click "Add User"</li>
                      <li>Select "Parent" as the role</li>
                      <li>Fill in the parent details</li>
                      <li>Select the school</li>
                      <li>Click "Save" to create the parent</li>
                      <li>After creation, link the parent to their children</li>
                    </ul>
                  </li>
                </ol>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Academic Sessions</h3>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>
                    <strong>Creating an Academic Session:</strong>
                    <ul className="list-disc pl-6 mt-1">
                      <li>Navigate to "Academic Sessions" in the sidebar</li>
                      <li>Click "Add Session"</li>
                      <li>Enter the session name, start date, and end date</li>
                      <li>Select the school</li>
                      <li>Set as current if applicable</li>
                      <li>Click "Save" to create the session</li>
                    </ul>
                  </li>
                </ol>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Best Practices</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-6 mt-2">
                    <li>Regularly audit user accounts and permissions</li>
                    <li>Create a standardized naming convention for schools and users</li>
                    <li>Maintain proper documentation for all system configurations</li>
                    <li>Implement regular data backups</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="school-admin" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>School Admin Guide</CardTitle>
              <CardDescription>Complete guide for School Administrators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Dashboard Overview</h3>
                <p>
                  The School Admin dashboard provides an overview of your school's classes, teachers, students, and
                  recent activities. From here, you can manage all aspects of your school's operations.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Managing Users</h3>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>
                    <strong>Adding Teachers:</strong>
                    <ul className="list-disc pl-6 mt-1">
                      <li>Navigate to "Users" in the sidebar</li>
                      <li>Click "Add User"</li>
                      <li>Select "Teacher" as the role</li>
                      <li>Fill in the teacher details</li>
                      <li>Click "Save" to create the teacher</li>
                      <li>After creation, assign the teacher to subjects</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Adding Students:</strong>
                    <ul className="list-disc pl-6 mt-1">
                      <li>Navigate to "Users" in the sidebar</li>
                      <li>Click "Add User"</li>
                      <li>Select "Student" as the role</li>
                      <li>Fill in the student details</li>
                      <li>Click "Save" to create the student</li>
                      <li>After creation, assign the student to a class</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Adding Parents:</strong>
                    <ul className="list-disc pl-6 mt-1">
                      <li>Navigate to "Users" in the sidebar</li>
                      <li>Click "Add User"</li>
                      <li>Select "Parent" as the role</li>
                      <li>Fill in the parent details</li>
                      <li>Click "Save" to create the parent</li>
                      <li>After creation, link the parent to their children</li>
                    </ul>
                  </li>
                </ol>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Managing Classes and Subjects</h3>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>
                    <strong>Creating Classes:</strong>
                    <ul className="list-disc pl-6 mt-1">
                      <li>Navigate to "Classes" in the sidebar</li>
                      <li>Click "Add Class"</li>
                      <li>Enter the class name and section</li>
                      <li>Optionally assign a class teacher</li>
                      <li>Click "Save" to create the class</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Creating Subjects:</strong>
                    <ul className="list-disc pl-6 mt-1">
                      <li>Navigate to "Subjects" in the sidebar</li>
                      <li>Click "Add Subject"</li>
                      <li>Enter the subject name and code</li>
                      <li>Add a description if needed</li>
                      <li>Click "Save" to create the subject</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Assigning Subjects to Classes:</strong>
                    <ul className="list-disc pl-6 mt-1">
                      <li>Navigate to "Classes" in the sidebar</li>
                      <li>Select a class</li>
                      <li>Click "Assign Subjects"</li>
                      <li>Select the subjects to assign</li>
                      <li>Click "Save" to assign the subjects</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Assigning Teachers to Subjects:</strong>
                    <ul className="list-disc pl-6 mt-1">
                      <li>Navigate to "Subjects" in the sidebar</li>
                      <li>Select a subject</li>
                      <li>Click "Assign Teachers"</li>
                      <li>Select the teachers to assign</li>
                      <li>Click "Save" to assign the teachers</li>
                    </ul>
                  </li>
                </ol>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Results Management</h3>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>
                    <strong>Approving Results:</strong>
                    <ul className="list-disc pl-6 mt-1">
                      <li>Navigate to "Results" in the sidebar</li>
                      <li>Filter by "Pending Approval"</li>
                      <li>Review the results</li>
                      <li>Click the "Approve" button for each result or use batch approval</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Rejecting Results:</strong>
                    <ul className="list-disc pl-6 mt-1">
                      <li>Navigate to "Results" in the sidebar</li>
                      <li>Filter by "Pending Approval"</li>
                      <li>Review the results</li>
                      <li>Click the "Reject" button for results that need correction</li>
                      <li>Provide a reason for rejection</li>
                    </ul>
                  </li>
                </ol>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Important Notes</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-6 mt-2">
                    <li>Results must be approved before they are visible to students and parents</li>
                    <li>Regularly update class and subject assignments</li>
                    <li>Ensure all teachers are properly assigned to their subjects</li>
                    <li>Maintain accurate student records and class assignments</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teacher" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Teacher Guide</CardTitle>
              <CardDescription>Complete guide for Teachers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Dashboard Overview</h3>
                <p>
                  The Teacher dashboard shows your assigned classes, subjects, and recent activities. From here, you can
                  manage your classes, record attendance, and enter student results.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Managing Results</h3>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>
                    <strong>Adding Results:</strong>
                    <ul className="list-disc pl-6 mt-1">
                      <li>Navigate to "Results" in the sidebar</li>
                      <li>Click "Add Result"</li>
                      <li>Select the student, subject, and exam type</li>
                      <li>Enter the marks and total marks</li>
                      <li>Add remarks if needed</li>
                      <li>Click "Save" to submit the result for approval</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Editing Results:</strong>
                    <ul className="list-disc pl-6 mt-1">
                      <li>Navigate to "Results" in the sidebar</li>
                      <li>Find the result you want to edit</li>
                      <li>Click the "Edit" button</li>
                      <li>Update the result details</li>
                      <li>Click "Save" to submit the updated result for approval</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Viewing Rejected Results:</strong>
                    <ul className="list-disc pl-6 mt-1">
                      <li>Navigate to "Results" in the sidebar</li>
                      <li>Filter by "Rejected"</li>
                      <li>Review the rejection reason</li>
                      <li>Make necessary corrections</li>
                      <li>Resubmit for approval</li>
                    </ul>
                  </li>
                </ol>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Managing Attendance</h3>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>
                    <strong>Recording Attendance:</strong>
                    <ul className="list-disc pl-6 mt-1">
                      <li>Navigate to "Attendance" in the sidebar</li>
                      <li>Select the class and date</li>
                      <li>Mark each student as present, absent, late, or excused</li>
                      <li>Add remarks if needed</li>
                      <li>Click "Save" to record the attendance</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Editing Attendance:</strong>
                    <ul className="list-disc pl-6 mt-1">
                      <li>Navigate to "Attendance" in the sidebar</li>
                      <li>Select the class and date</li>
                      <li>Update the attendance records</li>
                      <li>Click "Save" to update the attendance</li>
                    </ul>
                  </li>
                </ol>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Best Practices</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-6 mt-2">
                    <li>Record attendance daily</li>
                    <li>Submit results promptly after assessments</li>
                    <li>Provide detailed remarks for students who need improvement</li>
                    <li>Regularly check for rejected results and make corrections</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="student" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Student Guide</CardTitle>
              <CardDescription>Complete guide for Students</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Dashboard Overview</h3>
                <p>
                  The Student dashboard displays your academic information, upcoming events, and recent activities. From
                  here, you can view your results, attendance, and class information.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Viewing Results</h3>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>
                    <strong>Accessing Your Results:</strong>
                    <ul className="list-disc pl-6 mt-1">
                      <li>Navigate to "Results" in the sidebar</li>
                      <li>View your results for different subjects and exams</li>
                      <li>Filter by academic session or exam type</li>
                      <li>Note that only approved results will be visible</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Downloading Report Cards:</strong>
                    <ul className="list-disc pl-6 mt-1">
                      <li>Navigate to "Results" in the sidebar</li>
                      <li>Click "Download Report Card"</li>
                      <li>Select the academic session</li>
                      <li>Click "Download" to get your report card in PDF format</li>
                    </ul>
                  </li>
                </ol>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Viewing Attendance</h3>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>
                    <strong>Checking Your Attendance:</strong>
                    <ul className="list-disc pl-6 mt-1">
                      <li>Navigate to "Attendance" in the sidebar</li>
                      <li>View your attendance records</li>
                      <li>Filter by date range or status</li>
                      <li>See your overall attendance percentage</li>
                    </ul>
                  </li>
                </ol>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Important Notes</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-6 mt-2">
                    <li>Regularly check your results and attendance</li>
                    <li>Contact your teacher or school admin if you notice any discrepancies</li>
                    <li>Keep your login credentials secure</li>
                    <li>Change your password periodically for security</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parent" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Parent Guide</CardTitle>
              <CardDescription>Complete guide for Parents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Dashboard Overview</h3>
                <p>
                  The Parent dashboard shows your children's academic information, upcoming events, and recent
                  activities. From here, you can monitor their progress, view results, and check attendance.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Viewing Child's Results</h3>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>
                    <strong>Accessing Results:</strong>
                    <ul className="list-disc pl-6 mt-1">
                      <li>Navigate to "Results" in the sidebar</li>
                      <li>Select your child if you have multiple children</li>
                      <li>View their results for different subjects and exams</li>
                      <li>Filter by academic session or exam type</li>
                      <li>Note that only approved results will be visible</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Downloading Report Cards:</strong>
                    <ul className="list-disc pl-6 mt-1">
                      <li>Navigate to "Results" in the sidebar</li>
                      <li>Select your child if you have multiple children</li>
                      <li>Click "Download Report Card"</li>
                      <li>Select the academic session</li>
                      <li>Click "Download" to get the report card in PDF format</li>
                    </ul>
                  </li>
                </ol>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Viewing Child's Attendance</h3>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>
                    <strong>Checking Attendance:</strong>
                    <ul className="list-disc pl-6 mt-1">
                      <li>Navigate to "Attendance" in the sidebar</li>
                      <li>Select your child if you have multiple children</li>
                      <li>View their attendance records</li>
                      <li>Filter by date range or status</li>
                      <li>See their overall attendance percentage</li>
                    </ul>
                  </li>
                </ol>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Parent Tips</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-6 mt-2">
                    <li>Regularly check your child's results and attendance</li>
                    <li>Contact teachers or school admin if you notice any issues</li>
                    <li>Encourage your child to maintain good attendance</li>
                    <li>Review report cards with your child to discuss areas for improvement</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}


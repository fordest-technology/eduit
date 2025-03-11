import nodemailer from "nodemailer"

// In a production environment, you would use a real email service
// For development, we'll use a mock implementation
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.example.com",
  port: Number.parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER || "user@example.com",
    pass: process.env.EMAIL_PASSWORD || "password",
  },
})

interface EmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    if (process.env.NODE_ENV === "production") {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || "noreply@eduit.com",
        to,
        subject,
        html,
      })
    } else {
      // In development, log the email instead of sending it
      console.log("Email would be sent in production:")
      console.log(`To: ${to}`)
      console.log(`Subject: ${subject}`)
      console.log(`Content: ${html}`)
    }
    return true
  } catch (error) {
    console.error("Error sending email:", error)
    return false
  }
}

interface WelcomeEmailParams {
  name: string
  email: string
  role: string
  schoolName: string
  schoolUrl: string
  password: string
}

export async function sendWelcomeEmail({ name, email, role, schoolName, schoolUrl, password }: WelcomeEmailParams) {
  const subject = `Welcome to EduIT - ${schoolName}`

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #22c55e;">Welcome to EduIT!</h2>
      <p>Hello ${name},</p>
      <p>You have been registered as a <strong>${role}</strong> for <strong>${schoolName}</strong>.</p>
      <p>Here are your login details:</p>
      <ul>
        <li><strong>School URL:</strong> <a href="${schoolUrl}">${schoolUrl}</a></li>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Password:</strong> ${password}</li>
      </ul>
      <p>Please log in and change your password as soon as possible.</p>
      <div style="margin-top: 30px; padding: 20px; background-color: #f3f4f6; border-radius: 5px;">
        <p style="margin: 0;">If you have any questions, please contact support at <a href="mailto:support@eduit.com">support@eduit.com</a>.</p>
      </div>
    </div>
  `

  return await sendEmail({ to: email, subject, html })
}

interface StudentCredentialsEmailParams {
  studentName: string
  parentName?: string
  studentEmail: string
  parentEmail?: string
  password: string
  schoolName: string
  schoolUrl: string
}

export async function sendStudentCredentialsEmail({
  studentName,
  parentName,
  studentEmail,
  parentEmail,
  password,
  schoolName,
  schoolUrl,
}: StudentCredentialsEmailParams) {
  const subject = `Your EduIT Account for ${schoolName}`

  const studentHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #22c55e;">Your EduIT Student Account</h2>
      <p>Hello ${studentName},</p>
      <p>An account has been created for you at <strong>${schoolName}</strong>.</p>
      <p>Here are your login details:</p>
      <ul>
        <li><strong>School URL:</strong> <a href="${schoolUrl}">${schoolUrl}</a></li>
        <li><strong>Email:</strong> ${studentEmail}</li>
        <li><strong>Password:</strong> ${password}</li>
      </ul>
      <p>Please log in and change your password as soon as possible.</p>
      <div style="margin-top: 30px; padding: 20px; background-color: #f3f4f6; border-radius: 5px;">
        <p style="margin: 0;">If you have any questions, please contact your school administrator.</p>
      </div>
    </div>
  `

  // Send email to student
  await sendEmail({ to: studentEmail, subject, html: studentHtml })

  // If parent email is provided, send them an email too
  if (parentName && parentEmail) {
    const parentSubject = `Your Child's EduIT Account for ${schoolName}`

    const parentHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #22c55e;">Your Child's EduIT Account</h2>
        <p>Hello ${parentName},</p>
        <p>An account has been created for your child, ${studentName}, at <strong>${schoolName}</strong>.</p>
        <p>Your child's login details:</p>
        <ul>
          <li><strong>School URL:</strong> <a href="${schoolUrl}">${schoolUrl}</a></li>
          <li><strong>Email:</strong> ${studentEmail}</li>
          <li><strong>Password:</strong> ${password}</li>
        </ul>
        <p>You can also log in with your own parent account to monitor your child's progress.</p>
        <div style="margin-top: 30px; padding: 20px; background-color: #f3f4f6; border-radius: 5px;">
          <p style="margin: 0;">If you have any questions, please contact the school administrator.</p>
        </div>
      </div>
    `

    await sendEmail({ to: parentEmail, subject: parentSubject, html: parentHtml })
  }

  return true
}

interface TeacherCredentialsEmailParams {
  name: string
  email: string
  password: string
  schoolName: string
  schoolUrl: string
}

export async function sendTeacherCredentialsEmail({
  name,
  email,
  password,
  schoolName,
  schoolUrl,
}: TeacherCredentialsEmailParams) {
  const subject = `Your EduIT Teacher Account for ${schoolName}`

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #22c55e;">Your EduIT Teacher Account</h2>
      <p>Hello ${name},</p>
      <p>An account has been created for you as a teacher at <strong>${schoolName}</strong>.</p>
      <p>Here are your login details:</p>
      <ul>
        <li><strong>School URL:</strong> <a href="${schoolUrl}">${schoolUrl}</a></li>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Password:</strong> ${password}</li>
      </ul>
      <p>Please log in and change your password as soon as possible.</p>
      <div style="margin-top: 30px; padding: 20px; background-color: #f3f4f6; border-radius: 5px;">
        <p style="margin: 0;">If you have any questions, please contact the school administrator.</p>
      </div>
    </div>
  `

  return await sendEmail({ to: email, subject, html })
}


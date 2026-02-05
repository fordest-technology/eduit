import { emailService } from "@/lib/email-service";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  attachments?: any[];
}

/**
 * Sends an email using the professional EmailService
 * @param options Email options including recipient, subject, and content
 */
export async function sendEmail(
  options: EmailOptions
): Promise<{ success: boolean; error?: string }> {
  const result = await emailService.sendEmail(options);
  if (!result) return { success: false, error: "Failed to send email" };
  return { success: true };
}

export interface WelcomeEmailParams {
  name: string;
  email: string;
  role: string;
  schoolName: string;
  schoolUrl: string;
  password: string;
  schoolId?: string;
  debugId?: string;
}

export interface SchoolWelcomeEmailParams {
  adminName: string;
  adminEmail: string;
  schoolName: string;
  schoolUrl: string;
  password: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
}

export async function sendWelcomeEmail(params: WelcomeEmailParams) {
  return await emailService.sendWelcomeEmail(params);
}

export async function sendSchoolWelcomeEmail(params: SchoolWelcomeEmailParams) {
  return await emailService.sendSchoolWelcomeEmail(params);
}

export interface StudentCredentialsEmailParams {
  studentName: string;
  parentName?: string;
  studentEmail: string;
  parentEmail?: string;
  password: string;
  schoolName: string;
  schoolUrl: string;
  schoolId?: string;
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
  // Send to student
  await emailService.sendWelcomeEmail({
    name: studentName,
    role: "Student",
    schoolName,
    schoolUrl,
    email: studentEmail,
    password,
  });

  // Send to parent if exists
  if (parentName && parentEmail) {
    await emailService.sendWelcomeEmail({
      name: parentName,
      role: "Parent",
      schoolName,
      schoolUrl,
      email: parentEmail,
      isParent: true,
      studentName,
      password,
    });
  }

  return true;
}

export interface TeacherCredentialsEmailParams {
  name: string;
  email: string;
  password: string;
  schoolName: string;
  schoolUrl: string;
  schoolId?: string;
}

export async function sendTeacherCredentialsEmail(params: TeacherCredentialsEmailParams) {
  return await emailService.sendWelcomeEmail({
    name: params.name,
    role: "Teacher",
    schoolName: params.schoolName,
    schoolUrl: params.schoolUrl,
    email: params.email,
    password: params.password,
  });
}

export interface PaymentNotificationEmailParams {
  to: string;
  recipientName: string;
  studentName: string;
  amount: number;
  billName: string;
  transactionRef: string;
  date: Date;
  schoolName: string;
  schoolLogo?: string;
  isParent: boolean;
}

export async function sendPaymentNotificationEmail(params: PaymentNotificationEmailParams) {
  return await emailService.sendPaymentNotification(params);
}

export interface ResultPublishedEmailParams {
  studentName: string;
  studentEmail: string;
  parentName?: string;
  parentEmail?: string;
  periodName: string;
  sessionName: string;
  schoolName: string;
  schoolId: string;
}

export async function sendResultPublishedEmail(params: ResultPublishedEmailParams) {
  return await emailService.sendResultPublished(params);
}

export interface PasswordResetEmailParams {
  userName: string;
  userEmail: string;
  resetCode: string;
  schoolName: string;
}

export async function sendPasswordResetEmail(params: PasswordResetEmailParams) {
  return await emailService.sendPasswordResetCode(params);
}

/**
 * Send notification email to parent when a student is linked to their account
 */
export async function sendParentStudentLinkageEmail(params: {
  parentName: string;
  parentEmail: string;
  studentName: string;
  schoolName: string;
  schoolUrl: string;
  relation?: string;
}) {
  return await emailService.sendAccountLinkage(params);
}

/**
 * Send notification email to teacher when a subject is assigned to them
 */
export async function sendTeacherSubjectAssignmentEmail(params: {
  teacherName: string;
  teacherEmail: string;
  subjectName: string;
  subjectCode?: string | null;
  schoolName: string;
  schoolUrl: string;
}) {
  return await emailService.sendSubjectAssignment(params);
}

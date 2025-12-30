# TEACHER EMAIL CREDENTIALS - IMPLEMENTATION PLAN

## Issue
When a teacher is created, their login credentials are not being sent to their email address.

## Current Status
- Teacher creation works in `app/api/teachers/route.ts` (line 463)
- Email/password are generated but not sent to teacher
- Need to implement email notification system

## Solution

### Step 1: Check for Email Service
Need to verify if email service is configured (e.g., Resend, SendGrid, Nodemailer)

### Step 2: Create Email Template
Create a welcome email template with:
- Teacher's email
- Temporary password
- Login link
- Instructions to change password

### Step 3: Send Email After Teacher Creation
Add email sending logic after successful teacher creation in POST handler

### Step 4: Environment Variables Needed
```env
# Email Service Configuration
EMAIL_SERVICE=resend  # or sendgrid, nodemailer
EMAIL_FROM=noreply@eduit.com
EMAIL_API_KEY=your_api_key_here
```

## Implementation Code

### 1. Create Email Utility (`lib/email.ts`)
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.EMAIL_API_KEY);

export async function sendTeacherWelcomeEmail({
  email,
  name,
  password,
  schoolName
}: {
  email: string;
  name: string;
  password: string;
  schoolName: string;
}) {
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@eduit.com',
      to: email,
      subject: `Welcome to ${schoolName} - Your Teacher Account`,
      html: `
        <h1>Welcome to ${schoolName}!</h1>
        <p>Hello ${name},</p>
        <p>Your teacher account has been created. Here are your login credentials:</p>
        <ul>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Temporary Password:</strong> ${password}</li>
        </ul>
        <p>Please login at: <a href="${process.env.NEXT_PUBLIC_APP_URL}/login">${process.env.NEXT_PUBLIC_APP_URL}/login</a></p>
        <p><strong>Important:</strong> Please change your password after your first login.</p>
        <p>Best regards,<br>${schoolName} Administration</p>
      `
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return { success: false, error };
  }
}
```

### 2. Update Teacher Creation API
In `app/api/teachers/route.ts`, after line 459 (after teacher creation):

```typescript
// Send welcome email with credentials
if (process.env.EMAIL_API_KEY) {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { name: true }
  });

  await sendTeacherWelcomeEmail({
    email,
    name,
    password, // The plain text password before hashing
    schoolName: school?.name || 'EduIT'
  });
}
```

## Files to Modify
1. Create: `lib/email.ts`
2. Update: `app/api/teachers/route.ts`
3. Update: `.env` (add email configuration)

## Testing Checklist
- [ ] Email service configured
- [ ] Welcome email template created
- [ ] Email sent after teacher creation
- [ ] Email contains correct credentials
- [ ] Login link works
- [ ] Error handling for failed emails

## Priority: HIGH
This is a critical feature for user onboarding.

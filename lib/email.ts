import { Resend } from "resend";
import db from "@/lib/db";
import { generateEmailDebugId } from "@/lib/utils";

// Create the transporter with proper configuration
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  attachments?: any[];
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  debugId?: string;
}

/**
 * Sends an email using the configured SMTP server or a mock for development
 * @param options Email options including recipient, subject, and content
 */
export async function sendEmail(
  options: EmailOptions
): Promise<{ success: boolean; error?: string }> {
  const {
    to,
    subject,
    html,
    from = process.env.EMAIL_FROM || "onboarding@mail.fordestech.com",
    replyTo = process.env.EMAIL_REPLY_TO || "support@eduit.com",
    attachments = [],
  } = options;

  // Ensure the FROM address is a valid email (prefix with onboarding@ if only domain provided)
  let fromAddr = from;
  if (!fromAddr.includes("@")) {
    fromAddr = `onboarding@${fromAddr}`;
  }

  // Clean up domain if it has trailing spaces/dots
  fromAddr = fromAddr.trim();

  // Add a professional name to the from address
  const displayName = "EduIT Global";
  const finalFrom = `"${displayName}" <${fromAddr}>`;

  // In development mode, check if we should send a real email or just mock it
  const isDev = process.env.NODE_ENV !== "production";
  const useRealEmails = process.env.ENABLE_REAL_EMAILS === "true";
  const hasResendKey = !!process.env.RESEND_API_KEY;

  if (isDev && !useRealEmails) {
    try {
      console.log("-----------------------------------------");
      console.log(`📧  MOCK EMAIL (ENABLE_REAL_EMAILS=false)`);
      console.log(`To:      ${to}`);
      console.log(`From:    ${finalFrom}`);
      console.log(`Subject: ${subject}`);
      console.log("-----------------------------------------");

      // Log to file in development for inspection
      try {
        const fs = require("fs");
        const path = require("path");
        const debugDir = path.join(process.cwd(), ".debug-emails");
        if (!fs.existsSync(debugDir)) {
          fs.mkdirSync(debugDir, { recursive: true });
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = path.join(debugDir, `email-${timestamp}.html`);
        fs.writeFileSync(filename, html);
        console.log(`💾  Html saved to: .debug-emails/${path.basename(filename)}`);
      } catch (err) {
        console.warn("Could not save debug email to file", err);
      }
      return { success: true };
    } catch (err) {
      console.error("Error with mock email log:", err);
      return { success: false, error: "Mock email logging failed" };
    }
  }

  // Production/Real sending logic: attempt to send using Resend
  if (!resend) {
    const errorMsg = "RESEND_API_KEY is missing from .env";
    console.error(`❌  ${errorMsg}`);
    return { success: false, error: errorMsg };
  }

  try {
    console.log(`🚀  Sending real email via Resend to ${to}...`);
    const { data, error } = await resend.emails.send({
      from: finalFrom,
      to: [to],
      subject,
      html,
      replyTo,
    });

    if (error) {
      console.error("❌  Resend delivery error:", error);
      return { success: false, error: error.message };
    }

    console.log(`✅  Email delivered successfully to ${to}. ID: ${data?.id}`);
    return { success: true };
  } catch (error: any) {
    console.error("❌  Critical Resend Error:", error);
    return {
      success: false,
      error: error?.message || "Unknown email error",
    };
  }
}

interface WelcomeEmailParams {
  name: string;
  email: string;
  role: string;
  schoolName: string;
  schoolUrl: string;
  password: string;
  schoolId?: string;
  debugId?: string;
}

interface SchoolWelcomeEmailParams {
  adminName: string;
  adminEmail: string;
  schoolName: string;
  schoolUrl: string;
  password: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
}

export async function sendWelcomeEmail({
  name,
  email,
  role,
  schoolName,
  schoolUrl,
  password,
  schoolId,
  debugId,
}: WelcomeEmailParams) {
  const subject = `Welcome to EduIT - ${schoolName}`;

  // Get school colors if schoolId is provided
  let primaryColor = "#22c55e";
  let secondaryColor = "#4f46e5";
  let logoUrl = "https://eduit.app/logo.png";

  if (schoolId) {
    try {
      const school = await db.school.findUnique({
        where: { id: schoolId },
        select: {
          primaryColor: true,
          secondaryColor: true,
          logo: true,
        },
      });

      if (school) {
        primaryColor = school.primaryColor || primaryColor;
        secondaryColor = school.secondaryColor || secondaryColor;
        logoUrl = school.logo || logoUrl;
      }
    } catch (error) {
      console.error("Error fetching school colors for email:", error);
    }
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background-color: ${primaryColor}; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .header img { max-height: 60px; margin-bottom: 10px; }
        .content { padding: 30px 20px; }
        .footer { background-color: #f7f7f7; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 5px 5px; }
        h1 { color: #ffffff; font-size: 24px; margin: 0; font-weight: 600; }
        h2 { color: ${primaryColor}; font-size: 20px; margin-top: 0; }
        p { color: #333; line-height: 1.5; }
        .credentials { background-color: #f7f7f7; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .credentials p { margin: 5px 0; }
        .credentials span { font-weight: bold; color: ${secondaryColor}; }
        .button { display: inline-block; background-color: ${primaryColor}; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 4px; font-weight: 500; margin-top: 15px; }
        .warning { margin-top: 20px; padding: 12px; background-color: #fff8e1; border-left: 4px solid #ffc107; color: #5d4037; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${logoUrl}" alt="${schoolName} Logo" />
          <h1>Welcome to EduIT</h1>
        </div>
        <div class="content">
          <h2>Hello, ${name}!</h2>
          <p>You have been registered as a <strong>${role}</strong> for <strong>${schoolName}</strong>.</p>
          
          <div class="credentials">
            <h3 style="margin-top: 0;">Your Login Credentials</h3>
            <p><span>School URL:</span> <a href="${schoolUrl}" style="color: ${primaryColor};">${schoolUrl}</a></p>
            <p><span>Email:</span> ${email}</p>
            <p><span>Password:</span> ${password}</p>
          </div>
          
          <div class="warning">
            <p style="margin: 0;">Please log in and change your password as soon as possible for security reasons.</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${schoolUrl}" class="button">Login Now</a>
          </div>
        </div>
        <div class="footer">
          <p>If you have any questions, please contact support at <a href="mailto:support@eduit.com" style="color: ${primaryColor};">support@eduit.com</a></p>
          <p>&copy; ${new Date().getFullYear()} EduIT. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const result = await sendEmail({
      to: email,
      subject,
      html,
    });
    return result;
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    throw error;
  }
}

export async function sendSchoolWelcomeEmail({
  adminName,
  adminEmail,
  schoolName,
  schoolUrl,
  password,
  primaryColor = "#f97316",
  secondaryColor = "#0f172a",
  logoUrl = "https://eduit.app/logo.png",
}: SchoolWelcomeEmailParams) {
  const subject = `Welcome to EduIT! Your institution is live 🚀`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to EduIT</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      <style>
        body { 
          font-family: 'Outfit', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #f8fafc;
          margin: 0;
          padding: 0;
          -webkit-font-smoothing: antialiased;
        }
        .wrapper {
          width: 100%;
          background-color: #f8fafc;
          padding: 40px 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 32px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08);
        }
        .top-banner {
          background-color: #1a1a1a;
          padding: 12px;
          text-align: center;
        }
        .top-banner span {
          color: #f97316;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 3px;
        }
        .hero {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          padding: 60px 40px;
          text-align: center;
          position: relative;
        }
        .edu-logo {
          width: 80px;
          height: 80px;
          background-color: #ffffff;
          border-radius: 20px;
          padding: 10px;
          margin: 0 auto 24px;
          box-shadow: 0 10px 15px -3px rgba(249, 115, 22, 0.3);
        }
        .hero h1 {
          color: #ffffff;
          font-size: 32px;
          font-weight: 800;
          margin: 0;
          letter-spacing: -1px;
        }
        .hero p {
          color: #94a3b8;
          font-size: 18px;
          margin: 12px 0 0;
          font-weight: 500;
        }
        .main-content {
          padding: 48px 40px;
        }
        .welcome-msg {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 16px;
        }
        .intro-text {
          font-size: 16px;
          line-height: 1.7;
          color: #475569;
          margin-bottom: 32px;
        }
        .school-info {
          background: #f1f5f9;
          border-radius: 24px;
          padding: 32px;
          margin-bottom: 32px;
          border: 1px solid #e2e8f0;
        }
        .info-header {
          display: flex;
          align-items: center;
          margin-bottom: 24px;
        }
        .school-pic {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          background-color: #ffffff;
          margin-right: 16px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }
        .school-name-sm {
          font-weight: 800;
          color: #0f172a;
          font-size: 18px;
        }
        .cred-box {
          background-color: #ffffff;
          border-radius: 16px;
          padding: 20px;
          border: 1px solid #e2e8f0;
        }
        .cred-item {
          margin-bottom: 12px;
        }
        .cred-item:last-child {
          margin-bottom: 0;
        }
        .cred-label {
          font-size: 11px;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 4px;
        }
        .cred-value {
          font-weight: 600;
          color: #0f172a;
          word-break: break-all;
        }
        .btn-container {
          text-align: center;
          margin: 40px 0;
        }
        .main-btn {
          display: inline-block;
          background-color: #f97316;
          color: #ffffff !important;
          padding: 20px 48px;
          border-radius: 18px;
          font-weight: 800;
          font-size: 16px;
          text-decoration: none;
          box-shadow: 0 20px 25px -5px rgba(249, 115, 22, 0.25);
        }
        .steps-section {
          padding: 0 0 20px;
        }
        .section-tag {
          font-size: 12px;
          font-weight: 800;
          color: #f97316;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 24px;
          display: block;
        }
        .step {
          display: flex;
          margin-bottom: 24px;
        }
        .step-num {
          width: 36px;
          height: 36px;
          background-color: #fff7ed;
          color: #f97316;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          margin-right: 20px;
          flex-shrink: 0;
        }
        .step-info b {
          display: block;
          color: #0f172a;
          font-size: 16px;
          margin-bottom: 4px;
        }
        .step-info p {
          margin: 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.5;
        }
        .footer {
          background-color: #f8fafc;
          padding: 40px;
          text-align: center;
          border-top: 1px solid #e2e8f0;
        }
        .footer p {
          color: #94a3b8;
          font-size: 13px;
          margin: 0;
          line-height: 1.6;
        }
        .footer a {
          color: #475569;
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="top-banner">
            <span>Official Institutional Welcome</span>
          </div>
          <div class="hero">
            <div class="edu-logo">
              <img src="https://fordestech.com/logo.png" alt="EduIT" width="60" style="display: block; margin: 0 auto;" />
            </div>
            <h1>The Future is Here.</h1>
            <p>Welcome to the EduIT ecosystem.</p>
          </div>
          <div class="main-content">
            <div class="welcome-msg">Congratulations, ${adminName}!</div>
            <p class="intro-text">
              We are beyond excited to have <b>${schoolName}</b> join our network of elite digital institutions. Your custom administrative architecture is live and fully provisioned.
            </p>
            
            <div class="school-info">
              <div class="info-header" style="margin-bottom: 20px; display: block;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td width="66" style="padding-right: 16px;">
                      <div class="school-pic">
                        <img src="${logoUrl}" alt="${schoolName}" width="50" height="50" style="object-fit: contain;" />
                      </div>
                    </td>
                    <td>
                      <div class="school-name-sm">${schoolName}</div>
                      <div style="font-size: 12px; color: #64748b; font-weight: 600; margin-top: 2px;">Institutional Access Provisioned</div>
                    </td>
                  </tr>
                </table>
              </div>
              
              <div class="cred-box">
                <div class="cred-item">
                  <div class="cred-label">Portal Endpoint</div>
                  <div class="cred-value"><a href="${schoolUrl}" style="color: #f97316; text-decoration: none;">${schoolUrl}</a></div>
                </div>
                <div style="height: 1px; background: #f1f5f9; margin: 12px 0;"></div>
                <div class="cred-item">
                  <div class="cred-label">Admin Identity</div>
                  <div class="cred-value">${adminEmail}</div>
                </div>
                <div style="height: 1px; background: #f1f5f9; margin: 12px 0;"></div>
                <div class="cred-item">
                  <div class="cred-label">Access Pass</div>
                  <div class="cred-value" style="font-family: monospace; font-size: 15px; color: #1e293b;">${password}</div>
                </div>
              </div>
            </div>
            
            <div class="btn-container">
              <a href="${schoolUrl}" class="main-btn">Launch Your Portal</a>
            </div>
            
            <div class="steps-section">
              <span class="section-tag">Strategic Onboarding</span>
              <div class="step">
                <div class="step-num">1</div>
                <div class="step-info">
                  <b>Initialize Session</b>
                  <p>Define your first academic year and terms to unlock the system.</p>
                </div>
              </div>
              <div class="step">
                <div class="step-num">2</div>
                <div class="step-info">
                  <b>Architect Levels</b>
                  <p>Build your institutional hierarchy from Primary to Advanced levels.</p>
                </div>
              </div>
              <div class="step">
                <div class="step-num">3</div>
                <div class="step-info">
                  <b>Deploy Users</b>
                  <p>Bulk import your educators and students to go live.</p>
                </div>
              </div>
            </div>
          </div>
          <div class="footer">
            <p>
              Managed by <b>EduIT OS</b>. All Rights Reserved.<br />
              Need help? Reach out to <a href="mailto:support@fordestech.com">our engineering team</a>.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    return await sendEmail({
      to: adminEmail,
      subject,
      html,
    });
  } catch (error) {
    console.error("Failed to send school welcome email:", error);
    throw error;
  }
}

interface StudentCredentialsEmailParams {
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
  schoolId,
}: StudentCredentialsEmailParams) {
  const subject = `Your EduIT Account for ${schoolName}`;

  // Get school colors if schoolId is provided
  let primaryColor = "#22c55e";
  let secondaryColor = "#4f46e5";
  let logoUrl = "https://eduit.app/logo.png";

  if (schoolId) {
    try {
      const school = await db.school.findUnique({
        where: { id: schoolId },
        select: {
          primaryColor: true,
          secondaryColor: true,
          logo: true,
        },
      });

      if (school) {
        primaryColor = school.primaryColor || primaryColor;
        secondaryColor = school.secondaryColor || secondaryColor;
        logoUrl = school.logo || logoUrl;
      }
    } catch (error) {
      console.error("Error fetching school colors for email:", error);
    }
  }

  const studentHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background-color: ${primaryColor}; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .header img { max-height: 60px; margin-bottom: 10px; }
        .content { padding: 30px 20px; }
        .footer { background-color: #f7f7f7; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 5px 5px; }
        h1 { color: #ffffff; font-size: 24px; margin: 0; font-weight: 600; }
        h2 { color: ${primaryColor}; font-size: 20px; margin-top: 0; }
        p { color: #333; line-height: 1.5; }
        .credentials { background-color: #f7f7f7; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .credentials p { margin: 5px 0; }
        .credentials span { font-weight: bold; color: ${secondaryColor}; }
        .button { display: inline-block; background-color: ${primaryColor}; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 4px; font-weight: 500; margin-top: 15px; }
        .warning { margin-top: 20px; padding: 12px; background-color: #fff8e1; border-left: 4px solid #ffc107; color: #5d4037; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${logoUrl}" alt="${schoolName} Logo" />
          <h1>Your Student Account</h1>
        </div>
        <div class="content">
          <h2>Hello, ${studentName}!</h2>
          <p>An account has been created for you at <strong>${schoolName}</strong>.</p>
          
          <div class="credentials">
            <h3 style="margin-top: 0;">Your Login Credentials</h3>
            <p><span>School URL:</span> <a href="${schoolUrl}" style="color: ${primaryColor};">${schoolUrl}</a></p>
            <p><span>Email:</span> ${studentEmail}</p>
            <p><span>Password:</span> ${password}</p>
          </div>
          
          <div class="warning">
            <p style="margin: 0;">Please log in and change your password as soon as possible for security reasons.</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${schoolUrl}" class="button">Login Now</a>
          </div>
        </div>
        <div class="footer">
          <p>If you have any questions, please contact your school administrator.</p>
          <p>&copy; ${new Date().getFullYear()} EduIT. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Send email to student
  await sendEmail({ to: studentEmail, subject, html: studentHtml });

  // If parent email is provided, send them an email too
  if (parentName && parentEmail) {
    const parentSubject = `Your Child's EduIT Account for ${schoolName}`;

    const parentHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background-color: ${primaryColor}; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .header img { max-height: 60px; margin-bottom: 10px; }
          .content { padding: 30px 20px; }
          .footer { background-color: #f7f7f7; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 5px 5px; }
          h1 { color: #ffffff; font-size: 24px; margin: 0; font-weight: 600; }
          h2 { color: ${primaryColor}; font-size: 20px; margin-top: 0; }
          p { color: #333; line-height: 1.5; }
          .credentials { background-color: #f7f7f7; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .credentials p { margin: 5px 0; }
          .credentials span { font-weight: bold; color: ${secondaryColor}; }
          .button { display: inline-block; background-color: ${primaryColor}; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 4px; font-weight: 500; margin-top: 15px; }
          .info { margin-top: 20px; padding: 12px; background-color: #e3f2fd; border-left: 4px solid #2196f3; color: #0d47a1; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${logoUrl}" alt="${schoolName} Logo" />
            <h1>Your Child's Account</h1>
          </div>
          <div class="content">
            <h2>Hello, ${parentName}!</h2>
            <p>An account has been created for your child, <strong>${studentName}</strong>, at <strong>${schoolName}</strong>.</p>
            
            <div class="credentials">
              <h3 style="margin-top: 0;">Your Child's Login Credentials</h3>
              <p><span>School URL:</span> <a href="${schoolUrl}" style="color: ${primaryColor};">${schoolUrl}</a></p>
              <p><span>Email:</span> ${studentEmail}</p>
              <p><span>Password:</span> ${password}</p>
            </div>
            
            <div class="info">
              <p style="margin: 0;">You can also log in with your own parent account to monitor your child's progress.</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${schoolUrl}" class="button">Visit School Portal</a>
            </div>
          </div>
          <div class="footer">
            <p>If you have any questions, please contact the school administrator.</p>
            <p>&copy; ${new Date().getFullYear()} EduIT. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail({
      to: parentEmail,
      subject: parentSubject,
      html: parentHtml,
    });
  }

  return true;
}

interface TeacherCredentialsEmailParams {
  name: string;
  email: string;
  password: string;
  schoolName: string;
  schoolUrl: string;
  schoolId?: string;
}

export async function sendTeacherCredentialsEmail({
  name,
  email,
  password,
  schoolName,
  schoolUrl,
  schoolId,
}: TeacherCredentialsEmailParams) {
  const subject = `Your EduIT Teacher Account for ${schoolName}`;

  // Get school colors if schoolId is provided
  let primaryColor = "#22c55e";
  let secondaryColor = "#4f46e5";
  let logoUrl = "https://eduit.app/logo.png";

  if (schoolId) {
    try {
      const school = await db.school.findUnique({
        where: { id: schoolId },
        select: {
          primaryColor: true,
          secondaryColor: true,
          logo: true,
        },
      });

      if (school) {
        primaryColor = school.primaryColor || primaryColor;
        secondaryColor = school.secondaryColor || secondaryColor;
        logoUrl = school.logo || logoUrl;
      }
    } catch (error) {
      console.error("Error fetching school colors for email:", error);
    }
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-radius: 5px; }
        .header { background-color: ${primaryColor}; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .header img { max-height: 60px; margin-bottom: 10px; }
        .content { padding: 30px 20px; }
        .footer { background-color: #f7f7f7; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 5px 5px; }
        h1 { color: #ffffff; font-size: 24px; margin: 0; font-weight: 600; }
        h2 { color: ${primaryColor}; font-size: 20px; margin-top: 0; }
        p { color: #333; line-height: 1.5; }
        .credentials { background-color: #f7f7f7; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .credentials p { margin: 5px 0; }
        .credentials span { font-weight: bold; color: ${secondaryColor}; }
        .button { display: inline-block; background-color: ${primaryColor}; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 4px; font-weight: 500; margin-top: 15px; }
        .warning { margin-top: 20px; padding: 12px; background-color: #fff8e1; border-left: 4px solid #ffc107; color: #5d4037; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${logoUrl}" alt="${schoolName} Logo" />
          <h1>Your Teacher Account</h1>
        </div>
        <div class="content">
          <h2>Hello, ${name}!</h2>
          <p>Welcome to the EduIT platform. An account has been created for you as a teacher at <strong>${schoolName}</strong>.</p>
          
          <div class="credentials">
            <h3 style="margin-top: 0;">Your Login Credentials</h3>
            <p><span>School URL:</span> <a href="${schoolUrl}" style="color: ${primaryColor};">${schoolUrl}</a></p>
            <p><span>Email:</span> ${email}</p>
            <p><span>Password:</span> ${password}</p>
          </div>
          
          <div class="warning">
            <p style="margin: 0;">Please log in and change your password as soon as possible for security reasons.</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${schoolUrl}" class="button">Access Your Account</a>
          </div>
        </div>
        <div class="footer">
          <p>If you have any questions, please contact the school administrator.</p>
          <p>&copy; ${new Date().getFullYear()} EduIT. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({ to: email, subject, html });
}

interface ResultPublishedEmailParams {
  studentName: string;
  studentEmail: string;
  parentName?: string;
  parentEmail?: string;
  periodName: string;
  sessionName: string;
  schoolName: string;
  schoolId: string;
}

export async function sendResultPublishedEmail({
  studentName,
  studentEmail,
  parentName,
  parentEmail,
  periodName,
  sessionName,
  schoolName,
  schoolId,
}: ResultPublishedEmailParams) {
  const subject = `Results Published: ${periodName} - ${sessionName}`;

  // Get school colors
  let primaryColor = "#22c55e";
  let logoUrl = "https://eduit.app/logo.png";

  try {
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { primaryColor: true, logo: true },
    });
    if (school) {
      primaryColor = school.primaryColor || primaryColor;
      logoUrl = school.logo || logoUrl;
    }
  } catch (error) {
    console.error("Error fetching school info for email:", error);
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 5px; overflow: hidden; }
        .header { background-color: ${primaryColor}; padding: 20px; text-align: center; }
        .header img { max-height: 60px; margin-bottom: 10px; }
        .content { padding: 30px 20px; text-align: center; }
        .footer { background-color: #f7f7f7; padding: 15px; text-align: center; font-size: 12px; color: #666; }
        h1 { color: #ffffff; font-size: 24px; margin: 0; }
        p { color: #333; line-height: 1.6; }
        .button { display: inline-block; background-color: ${primaryColor}; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 4px; font-weight: 500; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${logoUrl}" alt="${schoolName} Logo" />
          <h1>Academic Results Published</h1>
        </div>
        <div class="content">
          <h2>Hello, ${parentName || studentName}!</h2>
          <p>The academic results for <strong>${studentName}</strong> for <strong>${periodName} (${sessionName})</strong> have been published.</p>
          <p>You can now log in to the school portal to view the detailed results and download the report card.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://eduit.app'}" class="button">View Results</a>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${schoolName}. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Send to student
  await sendEmail({ to: studentEmail, subject, html });

  // Send to parent if exists
  if (parentEmail) {
    await sendEmail({ to: parentEmail, subject, html });
  }

  return true;
}

interface PasswordResetEmailParams {
  userName: string;
  userEmail: string;
  resetCode: string;
  schoolName: string;
}

export async function sendPasswordResetEmail({
  userName,
  userEmail,
  resetCode,
  schoolName,
}: PasswordResetEmailParams) {
  const subject = `Verification Code: ${resetCode} - Reset Your ${schoolName} Account`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      <style>
        body { 
          font-family: 'Outfit', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #f8fafc;
          margin: 0;
          padding: 0;
          -webkit-font-smoothing: antialiased;
        }
        .wrapper {
          width: 100%;
          background-color: #f8fafc;
          padding: 40px 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 32px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08);
        }
        .hero {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          padding: 50px 40px;
          text-align: center;
        }
        .edu-logo {
          width: 70px;
          height: 70px;
          background-color: #ffffff;
          border-radius: 18px;
          padding: 10px;
          margin: 0 auto 20px;
        }
        .hero h1 {
          color: #ffffff;
          font-size: 28px;
          font-weight: 800;
          margin: 0;
          letter-spacing: -1px;
        }
        .main-content {
          padding: 48px 40px;
        }
        .code-box {
          background-color: #fff7ed;
          border: 2px dashed #f97316;
          border-radius: 24px;
          padding: 40px;
          margin: 30px 0;
          text-align: center;
        }
        .code-label {
          font-size: 13px;
          font-weight: 800;
          color: #f97316;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 12px;
        }
        .code-value {
          font-size: 56px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: 12px;
          margin-left: 12px;
        }
        .footer {
          background-color: #f8fafc;
          padding: 30px;
          text-align: center;
          border-top: 1px solid #e2e8f0;
        }
        .footer p {
          color: #94a3b8;
          font-size: 12px;
          line-height: 1.6;
        }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="hero">
            <div class="edu-logo">
              <img src="https://fordestech.com/logo.png" alt="EduIT" width="50" style="display: block; margin: 0 auto;" />
            </div>
            <h1>Verification Code</h1>
          </div>
          <div class="main-content">
            <div style="font-size: 20px; font-weight: 700; color: #1e293b; margin-bottom: 16px;">Secure Password Reset</div>
            <p style="font-size: 16px; line-height: 1.7; color: #475569;">
              Hello, ${userName}. Your password reset request for <b>${schoolName}</b> has been received. Please use the 4-digit code below to continue.
            </p>
            
            <div class="code-box">
              <div class="code-label">Reset Verification Code</div>
              <div class="code-value">${resetCode}</div>
            </div>
            
            <p style="font-size: 14px; color: #64748b; text-align: center; font-style: italic;">
              This code will expire in 10 minutes. 
            </p>

            <div style="margin-top: 40px; border-radius: 20px; background: #f1f5f9; padding: 24px;">
              <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.6;">
                <b>Security Alert:</b> If you did not request this code, your account security may be compromised. Please contact your school's technical support immediately.
              </p>
            </div>
          </div>
          <div class="footer">
            <p>
              &copy; ${new Date().getFullYear()} <b>EduIT Global</b>. All Rights Reserved.<br />
              Secure Institutional Portal Services
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: userEmail,
    subject,
    html,
  });
}

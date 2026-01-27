import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export async function POST(req: NextRequest) {
  let waitlistPrisma: PrismaClient | null = null;
  try {
    const body = await req.json();
    const { firstName, lastName, email, schoolName, studentPopulation } = body;

    if (!process.env.WAITLIST_DATABASE_URL) {
      throw new Error("WAITLIST_DATABASE_URL is not defined");
    }

    waitlistPrisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.WAITLIST_DATABASE_URL
        }
      }
    });

    // Create table if not exists
    await waitlistPrisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS waitlist (
        id SERIAL PRIMARY KEY,
        first_name TEXT,
        last_name TEXT,
        email TEXT UNIQUE,
        school_name TEXT,
        student_population TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert data
    await waitlistPrisma.$executeRawUnsafe(
      `INSERT INTO waitlist (first_name, last_name, email, school_name, student_population) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (email) DO UPDATE SET 
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         school_name = EXCLUDED.school_name,
         student_population = EXCLUDED.student_population;`,
      firstName, lastName, email, schoolName, studentPopulation
    );

    // Send Professional Emails via React Email Service
    try {
      const { emailService } = await import("@/lib/email-service");
      
      // Notify Admins
      await emailService.sendWaitlistAdminNotification({
        firstName,
        lastName,
        email,
        schoolName,
        studentPopulation
      });

      // Confirm to User
      await emailService.sendWaitlistConfirmation(email, firstName);
      
    } catch (emailError) {
      console.error("Failed to send notification emails:", emailError);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Waitlist error:", error);
    return NextResponse.json({ 
      error: "Failed to join waitlist", 
      details: error.message 
    }, { status: 500 });
  } finally {
    if (waitlistPrisma) {
      await waitlistPrisma.$disconnect();
    }
  }
}

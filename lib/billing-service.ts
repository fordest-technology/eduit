import { prisma } from "@/lib/prisma";
import { BillingStatus } from "@prisma/client";

const STUDENT_THRESHOLD = 50;
const INACTIVITY_HOURS = 48;
const PRICE_PER_STUDENT = 2000;

export const billingService = {
  /**
   * Updates the last onboarding activity timestamp for a school
   */
  async updateOnboardingActivity(schoolId: string) {
    try {
      await prisma.school.update({
        where: { id: schoolId },
        data: { lastOnboardingActivity: new Date() },
      });
      // After updating activity, re-evaluate billing status
      await this.checkAndEnforceBilling(schoolId);
    } catch (error) {
      console.error("Error updating onboarding activity:", error);
    }
  },

  /**
   * Evaluates the school's billing status based on student count and inactivity
   */
  async checkAndEnforceBilling(schoolId: string) {
    try {
      const school = await prisma.school.findUnique({
        where: { id: schoolId },
        include: {
          _count: {
            select: { users: { where: { role: "STUDENT" } } }
          }
        }
      });

      if (!school) return;

      const currentStudentCount = school._count.users;
      const paidStudentCount = school.paidStudentCount;
      const unpaidStudents = currentStudentCount - paidStudentCount;

      let shouldBlock = false;

      // Rule 1: Student Threshold (50-Student Rule)
      // If they reach exactly or exceed 50 students and haven't paid for at least that many
      if (currentStudentCount >= STUDENT_THRESHOLD && paidStudentCount < STUDENT_THRESHOLD) {
        shouldBlock = true;
      }

      // Rule 2: Inactivity Rule (48-Hour Enforcement)
      // If there are unpaid students and no onboarding activity for 48 hours
      if (!shouldBlock && unpaidStudents > 0 && school.lastOnboardingActivity) {
        const now = new Date();
        const lastActivity = new Date(school.lastOnboardingActivity);
        const diffInHours = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);

        if (diffInHours >= INACTIVITY_HOURS) {
          shouldBlock = true;
        }
      }

      // Update school billing status
      const newStatus = shouldBlock ? BillingStatus.BLOCKED : BillingStatus.ACTIVE;
      
      if (school.billingStatus !== newStatus) {
        await prisma.school.update({
          where: { id: schoolId },
          data: { billingStatus: newStatus },
        });
      }

      return {
        isBlocked: shouldBlock,
        currentStudentCount,
        paidStudentCount,
        unpaidStudents,
        amountDue: unpaidStudents * PRICE_PER_STUDENT,
        lastActivity: school.lastOnboardingActivity
      };
    } catch (error) {
      console.error("Error checking billing status:", error);
      throw error;
    }
  },

  /**
   * Gets the detailed billing info for a school
   */
  async getBillingInfo(schoolId: string) {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        _count: {
          select: { users: { where: { role: "STUDENT" } } }
        }
      }
    });

    if (!school) throw new Error("School not found");

    const currentStudentCount = school._count.users;
    const unpaidStudents = Math.max(0, currentStudentCount - school.paidStudentCount);
    
    // Check if 48h rule is approaching
    let hoursRemaining = null;
    if (unpaidStudents > 0 && school.lastOnboardingActivity) {
      const lastActivity = new Date(school.lastOnboardingActivity);
      const expiry = new Date(lastActivity.getTime() + INACTIVITY_HOURS * 60 * 60 * 1000);
      hoursRemaining = Math.max(0, (expiry.getTime() - Date.now()) / (1000 * 60 * 60));
    }

    return {
      currentStudentCount,
      paidStudentCount: school.paidStudentCount,
      unpaidStudents,
      amountDue: unpaidStudents * PRICE_PER_STUDENT,
      billingStatus: school.billingStatus,
      lastOnboardingActivity: school.lastOnboardingActivity,
      hoursRemaining: hoursRemaining !== null ? Math.round(hoursRemaining * 10) / 10 : null,
      isThresholdReached: currentStudentCount >= STUDENT_THRESHOLD
    };
  },

  /**
   * Records a usage payment (School paying EduIT)
   */
  async recordUsagePayment(schoolId: string, studentCount: number, amount: number, reference: string) {
    return await prisma.$transaction(async (tx) => {
      // Create usage payment record
      const payment = await tx.usagePayment.create({
        data: {
          schoolId,
          amount,
          studentCount,
          squadReference: reference,
          status: "SUCCESS",
          paidAt: new Date(),
        },
      });

      // Update school's paid student count
      await tx.school.update({
        where: { id: schoolId },
        data: {
          paidStudentCount: { increment: studentCount },
          billingStatus: BillingStatus.ACTIVE // Unblock if they paid
        },
      });

      return payment;
    });
  }
};

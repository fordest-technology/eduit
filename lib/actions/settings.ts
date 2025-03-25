"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateSchoolSettings({
  primaryColor,
}: {
  primaryColor: string;
}) {
  try {
    await prisma.school.update({
      where: {
        id: "current-school-id", // You'll need to get this from the session
      },
      data: {
        primaryColor,
      },
    });

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update school settings" };
  }
}

export async function updateUserProfile(
  userId: string,
  data: {
    name: string;
    email: string;
    phone: string;
  }
) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data,
    });

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update profile" };
  }
}

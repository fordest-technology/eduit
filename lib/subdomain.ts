import { z } from "zod";

// Reserved subdomains that cannot be used
const RESERVED_SUBDOMAINS = [
  "www",
  "api",
  "admin",
  "support",
  "mail",
  "ftp",
  "smtp",
  "pop",
  "dev",
  "staging",
  "test",
  "localhost",
];

// Subdomain validation schema
export const subdomainSchema = z
  .string()
  .min(3, "Subdomain must be at least 3 characters")
  .max(63, "Subdomain must be less than 63 characters")
  .regex(
    /^[a-z0-9][a-z0-9-]*[a-z0-9]$/,
    "Subdomain can only contain lowercase letters, numbers, and hyphens"
  )
  .refine(
    (val) => !RESERVED_SUBDOMAINS.includes(val),
    "This subdomain is reserved and cannot be used"
  );

// Function to normalize a string for use as a subdomain
export function normalizeSubdomain(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-") // Replace invalid chars with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
}

// Function to generate a unique subdomain from a school name
export function generateSubdomain(schoolName: string): string {
  const normalized = normalizeSubdomain(schoolName);
  return normalized;
}

// Function to validate a subdomain
export function validateSubdomain(subdomain: string): {
  isValid: boolean;
  error?: string;
} {
  try {
    subdomainSchema.parse(subdomain);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0].message };
    }
    return { isValid: false, error: "Invalid subdomain format" };
  }
}

// Function to check if a subdomain is available
export async function isSubdomainAvailable(
  subdomain: string
): Promise<boolean> {
  try {
    // In development, we'll use localhost
    const baseUrl =
      process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : process.env.NEXT_PUBLIC_APP_URL || "https://yourplatform.com";

    const response = await fetch(
      `${baseUrl}/api/subdomains/check?subdomain=${subdomain}`
    );
    const data = await response.json();
    return data.available;
  } catch (error) {
    console.error("Error checking subdomain availability:", error);
    return false;
  }
}

// Function to get the school ID from a subdomain
export async function getSchoolIdFromSubdomain(
  subdomain: string
): Promise<string | null> {
  try {
    const baseUrl =
      process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : process.env.NEXT_PUBLIC_APP_URL || "https://yourplatform.com";

    const response = await fetch(
      `${baseUrl}/api/subdomains/lookup?subdomain=${subdomain}`
    );
    const data = await response.json();
    return data.schoolId || null;
  } catch (error) {
    console.error("Error looking up school ID:", error);
    return null;
  }
}

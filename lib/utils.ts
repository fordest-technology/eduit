import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generatePassword(length: number = 12): string {
  // Ensure we have all character types for a secure password
  const uppercaseChars = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // Removed confusing chars like I, O
  const lowercaseChars = "abcdefghijkmnopqrstuvwxyz"; // Removed confusing chars like l
  const numberChars = "23456789"; // Removed confusing chars like 0, 1
  const specialChars = "!@#$%^&*_-+=";

  // Combine all character sets
  const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars;

  // Ensure minimum length
  const finalLength = Math.max(length, 8);

  // Generate password with at least one character from each set
  let password = "";

  // Add one character from each required set
  password += uppercaseChars.charAt(
    Math.floor(Math.random() * uppercaseChars.length)
  );
  password += lowercaseChars.charAt(
    Math.floor(Math.random() * lowercaseChars.length)
  );
  password += numberChars.charAt(
    Math.floor(Math.random() * numberChars.length)
  );
  password += specialChars.charAt(
    Math.floor(Math.random() * specialChars.length)
  );

  // Fill the rest with random characters from all sets
  for (let i = password.length; i < finalLength; i++) {
    const randomIndex = Math.floor(Math.random() * allChars.length);
    password += allChars[randomIndex];
  }

  // Shuffle the password characters
  return shuffleString(password);
}

// Fisher-Yates shuffle algorithm to randomize the password
function shuffleString(str: string): string {
  const array = str.split("");
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
  return array.join("");
}

/**
 * Generates a unique ID for tracking emails through the system
 * Format: E-XXXX-XXXX (where X is alphanumeric)
 */
export function generateEmailDebugId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "E-";

  // Generate first group of 4 characters
  for (let i = 0; i < 4; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  id += "-";

  // Generate second group of 4 characters
  for (let i = 0; i < 4; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return id;
}

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates a secure random password with the specified length
 * @param length Length of the password
 * @returns A secure random password
 */
export function generatePassword(length: number = 10): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const special = "!@#$%^&*";
  
  let result = "";
  
  // Use crypto.getRandomValues for cryptographic security
  const getRandomChar = (src: string) => {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return src.charAt(array[0] % src.length);
  };

  // Ensure password has at least one of each character type
  result += getRandomChar(lowercase);
  result += getRandomChar(uppercase);
  result += getRandomChar(numbers);
  result += getRandomChar(special);

  // Fill the rest
  for (let i = 4; i < length; i++) {
    result += getRandomChar(charset);
  }

  // Shuffle using secure values
  return shuffleString(result);
}

// Fisher-Yates shuffle algorithm using crypto.getRandomValues
function shuffleString(str: string): string {
  const array = str.split("");
  const randomValues = new Uint32Array(array.length);
  crypto.getRandomValues(randomValues);

  for (let i = array.length - 1; i > 0; i--) {
    const j = randomValues[i] % (i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array.join("");
}

/**
 * Generates a unique ID for tracking emails through the system
 * Format: E-XXXX-XXXX (where X is alphanumeric)
 */
export function generateEmailDebugId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const array = new Uint32Array(8);
  crypto.getRandomValues(array);
  
  let id = "E-";
  for (let i = 0; i < 4; i++) id += chars.charAt(array[i] % chars.length);
  id += "-";
  for (let i = 4; i < 8; i++) id += chars.charAt(array[i] % chars.length);

  return id;
}

/**
 * Generates a 4-digit numeric verification code
 */
export function generateResetCode(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return (1000 + (array[0] % 9000)).toString();
}

/**
 * Recursively converts BigInt values to numbers for JSON serialization
 * @param data The data to process
 * @returns The data with BigInts converted to numbers
 */
export function serializeBigInts(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === "bigint") {
    return Number(data);
  }

  if (Array.isArray(data)) {
    return data.map((item) => serializeBigInts(item));
  }

  if (typeof data === "object") {
    const result: any = {};
    for (const key in data) {
      result[key] = serializeBigInts(data[key]);
    }
    return result;
  }

  return data;
}

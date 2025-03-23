// Environment variables checker
type EnvVar = {
  name: string;
  required: boolean;
};

export function checkEnvVars(vars: EnvVar[]): string[] {
  const missing: string[] = [];

  for (const v of vars) {
    const value = process.env[v.name];
    if (v.required && (!value || value.trim() === "")) {
      missing.push(v.name);
    }
  }

  return missing;
}

// Function to check Cloudinary credentials
export function checkCloudinaryConfig() {
  const requiredVars = [
    { name: "CLOUDINARY_CLOUD_NAME", required: true },
    { name: "CLOUDINARY_API_KEY", required: true },
    { name: "CLOUDINARY_API_SECRET", required: true },
  ];

  const missing = checkEnvVars(requiredVars);

  if (missing.length > 0) {
    // Only log this once during app initialization
    return false;
  }

  return true;
}

// Function to check database configuration
export function checkDatabaseConfig() {
  const requiredVars = [{ name: "DATABASE_URL", required: true }];

  const missing = checkEnvVars(requiredVars);

  if (missing.length > 0) {
    // Only log this once during app initialization
    return false;
  }

  return true;
}

// Call this function early in your app startup to check all required environment variables
export function checkAllRequiredEnvVars() {
  const isCloudinaryConfigValid = checkCloudinaryConfig();
  const isDatabaseConfigValid = checkDatabaseConfig();

  return isCloudinaryConfigValid && isDatabaseConfigValid;
}

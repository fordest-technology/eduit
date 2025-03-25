"use client";

import { create } from "zustand";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

interface SchoolBranding {
  name: string;
  subdomain: string;
  shortName: string;
  logo?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
}

interface SchoolContext {
  school: SchoolBranding | null;
  isLoading: boolean;
  error: string | null;
  setSchool: (school: SchoolBranding | null) => void;
}

const useSchoolStore = create<SchoolContext>(
  (set: (fn: (state: SchoolContext) => SchoolContext) => void) => ({
    school: null,
    isLoading: true,
    error: null,
    setSchool: (school: SchoolBranding | null) =>
      set((state) => ({ ...state, school, isLoading: false })),
  })
);

export function useSchoolContext() {
  const pathname = usePathname();
  const { school, isLoading, error, setSchool } = useSchoolStore();

  useEffect(() => {
    let isMounted = true;

    const loadSchool = async () => {
      try {
        // Get the hostname from the current URL
        const host = window.location.host;
        const isLocalhost = host.includes("localhost");
        const isSubdomain = !isLocalhost && host.split(".").length > 2;

        if (!isSubdomain) {
          if (isMounted) {
            setSchool(null);
          }
          return;
        }

        const subdomain = host.split(".")[0];

        // Use the new public endpoint
        const response = await fetch(`/api/public/schools/${subdomain}`);

        if (!response.ok) {
          if (response.status === 404) {
            if (isMounted) {
              setSchool(null);
            }
            return;
          }
          throw new Error("Failed to fetch school details");
        }

        const schoolData = await response.json();
        if (isMounted) {
          setSchool(schoolData);
        }
      } catch (err) {
        console.error("Error loading school context:", err);
        if (isMounted) {
          setSchool(null);
        }
      }
    };

    loadSchool();

    return () => {
      isMounted = false;
    };
  }, [pathname, setSchool]);

  return {
    school,
    isLoading,
    error,
  };
}

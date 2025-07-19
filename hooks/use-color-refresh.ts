"use client";

import { useColors } from "@/contexts/color-context";
import { useCallback } from "react";
import { toast } from "sonner";

export function useColorRefresh() {
  const { refreshColors, isLoading } = useColors();

  const handleRefreshColors = useCallback(async () => {
    try {
      await refreshColors();
      toast.success("Colors refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh colors");
      console.error("Error refreshing colors:", error);
    }
  }, [refreshColors]);

  return {
    refreshColors: handleRefreshColors,
    isLoading,
  };
}

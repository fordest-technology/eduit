import "./globals.css";
import type { Metadata } from "next";
import { Poppins, Sora } from "next/font/google";
import { CustomSessionProvider } from "@/providers/session-provider";
import { ColorProvider } from "@/contexts/color-context";
import { ColorLoader } from "@/components/ui/color-loader";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins"
});

const sora = Sora({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sora"
});

import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";

export const metadata: Metadata = {
  title: "EduIT",
  description: "School Management System",
};

// Helper function to convert hex to HSL
function hexToHSL(hex: string) {
  // Remove the # if present
  hex = hex.replace(/^#/, '');

  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  // Find the min and max values to compute the lightness
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  // Calculate lightness
  let l = (max + min) / 2;

  let h, s;

  if (max === min) {
    // Achromatic
    h = s = 0;
  } else {
    // Calculate saturation
    s = l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);

    // Calculate hue
    switch (max) {
      case r:
        h = (g - b) / (max - min) + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / (max - min) + 2;
        break;
      case b:
        h = (r - g) / (max - min) + 4;
        break;
      default:
        h = 0;
    }
    h /= 6;
  }

  // Convert to degrees, percentage, percentage
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return { h, s, l };
}

// Helper function to generate CSS variables from hex colors
function generateColorVariables(primaryColor: string, secondaryColor: string) {
  // Validate hex format before processing to prevent CSS injection
  const hexRegex = /^#([A-Fa-f0-9]{3}){1,2}$/;
  const validPrimary = hexRegex.test(primaryColor) ? primaryColor : "#22c55e";
  const validSecondary = hexRegex.test(secondaryColor) ? secondaryColor : "#f59e0b";

  const primaryHSL = hexToHSL(validPrimary);
  const secondaryHSL = hexToHSL(validSecondary);

  return `
    :root {
      --background: 0 0% 100%;
      --foreground: 222.2 84% 4.9%;
      
      --card: 0 0% 100%;
      --card-foreground: 222.2 84% 4.9%;
      
      --popover: 0 0% 100%;
      --popover-foreground: 222.2 84% 4.9%;
      
      --primary: ${primaryHSL.h} ${primaryHSL.s}% ${primaryHSL.l}%;
      --primary-foreground: 210 40% 98%;
      
      --secondary: ${secondaryHSL.h} ${secondaryHSL.s}% ${secondaryHSL.l}%;
      --secondary-foreground: 222.2 47.4% 11.2%;
      
      --muted: 210 40% 96.1%;
      --muted-foreground: 215.4 16.3% 46.9%;
      
      --accent: 32 100% 96%;
      --accent-foreground: 222.2 47.4% 11.2%;
      
      --destructive: 0 84.2% 60.2%;
      --destructive-foreground: 210 40% 98%;
      
      --border: 214.3 31.8% 91.4%;
      --input: 214.3 31.8% 91.4%;
      --ring: ${primaryHSL.h} ${primaryHSL.s}% ${primaryHSL.l}%;
      
      --radius: 0.5rem;
    }
  `;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: generateColorVariables("#22c55e", "#f59e0b") }} />
      </head>
      <body className={`${poppins.variable} ${sora.variable} font-poppins`}>
        <CustomSessionProvider>
          <ColorProvider>
            <ColorLoader>
              {children}
            </ColorLoader>
          </ColorProvider>
        </CustomSessionProvider>
        <Toaster />
        <SonnerToaster 
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              borderRadius: '12px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            },
          }}
          expand={true}
          richColors
        />
      </body>
    </html>
  );
}
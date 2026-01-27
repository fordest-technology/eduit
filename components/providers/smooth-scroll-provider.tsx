"use client"

import { ReactLenis, useLenis } from "lenis/react"
import { ReactNode, useEffect } from "react"

function ScrollHandler() {
  const lenis = useLenis()

  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const anchor = target.closest("a")
      
      if (anchor && anchor.hash && anchor.origin === window.location.origin && anchor.pathname === window.location.pathname) {
        const targetElement = document.querySelector(anchor.hash)
        if (targetElement && lenis) {
          e.preventDefault()
          lenis.scrollTo(targetElement, {
            offset: -80, // Offset for the sticky header
            duration: 1.5,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Premium easing curve
          })
        }
      }
    }

    document.addEventListener("click", handleAnchorClick)
    return () => document.removeEventListener("click", handleAnchorClick)
  }, [lenis])

  return null
}

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  return (
    <ReactLenis root options={{ 
      lerp: 0.05, // Lower lerp = smoother, more inertial feel
      duration: 1.5, 
      smoothWheel: true,
      wheelMultiplier: 1.1,
      touchMultiplier: 2,
    }}>
      <ScrollHandler />
      {children}
    </ReactLenis>
  )
}

"use client"

import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

interface StepperProps {
  steps: {
    id: string
    label: string
    description?: string
  }[]
  currentStep: number
  className?: string
  onStepClick?: (step: number) => void
}

export function Stepper({ steps, currentStep, className, onStepClick }: StepperProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="relative flex justify-between">
        {/* Progress Bar Background */}
        <div className="absolute top-1/2 left-0 h-1 w-full -translate-y-1/2 rounded-full bg-slate-100" />
        
        {/* Active Progress Bar */}
        <div
          className="absolute top-1/2 left-0 h-1 -translate-y-1/2 rounded-full bg-primary transition-all duration-300 ease-in-out"
          style={{
            width: `${(currentStep / (steps.length - 1)) * 100}%`,
          }}
        />

        {steps.map((step, index) => {
          const isCompleted = currentStep > index
          const isCurrent = currentStep === index

          return (
            <div
              key={step.id}
              className={cn(
                "relative z-10 flex flex-col items-center gap-2",
                onStepClick ? "cursor-pointer" : "cursor-default"
              )}
              onClick={() => onStepClick?.(index)}
            >
              {/* Step Indicator Circle */}
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-300",
                  isCompleted
                    ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : isCurrent
                    ? "border-primary bg-background text-primary ring-4 ring-primary/10"
                    : "border-slate-200 bg-background text-slate-400"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>

              {/* Step Label */}
              <div className="flex flex-col items-center text-center">
                <span
                  className={cn(
                    "text-xs font-semibold uppercase tracking-wider transition-colors duration-300",
                    isCompleted || isCurrent ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  Step {index + 1}
                </span>
                <span
                  className={cn(
                    "text-xs font-medium transition-colors duration-300 sm:text-sm",
                    isCompleted || isCurrent ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

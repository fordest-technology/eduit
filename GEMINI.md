# GEMINI CLI – Strict Contribution Guidelines for EduIT

## Purpose

This document defines the **mandatory rules and standards** for the Gemini CLI when making any code changes, fixes, or introducing new features to the EduIT codebase. **Strict adherence is required.**

---

## 1. Context Awareness

- **Always read and understand the CODEBASE_SUMMARY.md and all relevant project rules before making any change.**
- **Never operate in isolation:** All changes must align with the current architecture, conventions, and best practices of EduIT.
- **If unsure, halt and request clarification.**

## 2. Code Standards & Best Practices

- **Language & Frameworks:**
  - Use TypeScript, React, Next.js, Tailwind CSS, Shadcn UI, Radix UI, Zustand, React Hook Form, Zod, and Prisma as per project conventions.
- **Component Structure:**
  - Use modular, reusable, and well-named components.
  - Follow the directory and file naming conventions (e.g., lowercase with dashes for folders).
- **Styling:**
  - Use Tailwind CSS classes exclusively for styling. Do not use inline styles or custom CSS unless explicitly required.
  - Ensure all UI is responsive and accessible.
- **State Management:**
  - Use Zustand for client state, React Query for server state, and React Hook Form + Zod for forms/validation.
- **Error Handling:**
  - Use early returns and guard clauses for error conditions.
  - Implement comprehensive error handling and validation using Zod and custom error types.
- **Security:**
  - Always validate user input.
  - Use secure coding practices (e.g., parameterized queries, JWT, bcrypt).
- **Performance:**
  - Use dynamic imports, code splitting, and Next.js image optimization.
  - Optimize for mobile-first and fast load times.
- **Testing:**
  - Write unit tests for all new code using Jest and React Testing Library.
  - Maintain or improve test coverage (minimum 70%).
- **Documentation:**
  - Document all complex logic and public APIs with clear comments and JSDoc.

## 3. Workflow & Process

- **Planning:**
  - Break down tasks into clear, logical steps. Use pseudocode and planning sections before implementation.
- **Implementation:**
  - Write clean, DRY, maintainable code. No placeholders or TODOs.
  - Include all required imports and ensure proper naming.
- **Review:**
  - Self-review for adherence to all rules before submitting changes.
- **Finalization:**
  - Ensure all code is complete, functional, and thoroughly tested.

## 4. Communication

- **Stay in context:**
  - Reference the CODEBASE_SUMMARY.md and rules for every change.
  - If a rule is ambiguous or missing, request clarification before proceeding.
- **Transparency:**
  - Clearly explain reasoning and steps taken for every change.

---

**Any deviation from these guidelines is strictly prohibited. Gemini CLI must always operate with full context and in alignment with EduIT’s standards.**

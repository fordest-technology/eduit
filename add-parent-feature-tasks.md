# TODO: Add Parent with Email Credentials Feature

This document outlines the tasks required to implement the "Add Parent" functionality, including sending login credentials via email, mirroring the existing (and working) "Add Teacher" feature.

### 1. Frontend (`/dashboard/parents/`)

- [ ] **Create/Update `AddParentModal.tsx`:**

  - [ ] Add a password field to the form with validation (min 6 characters).
  - [ ] Implement UI state for email sending (loading spinner, success checkmark, error/retry message).
  - [ ] Ensure the modal handles both "Add New Parent" and "Edit Parent" modes correctly.

- [ ] **Implement `sendLoginCredentials` Helper Function:**

  - [ ] Inside the `AddParentModal`, create a function to handle the API call to `/api/send-credentials`.
  - [ ] Ensure the payload is complete: `name`, `email`, `password`, `role: 'parent'`, `schoolName`, and `schoolUrl`.

- [ ] **Update `onSubmit` Logic in Modal:**

  - [ ] After a successful `POST` to `/api/parents` to create the parent, immediately call the `sendLoginCredentials` function.
  - [ ] Use `toast` notifications to provide clear feedback (e.g., "Parent created, sending credentials...", "Credentials sent!", "Parent created, but email failed.").

- [ ] **Implement Refetch Logic:**
  - [ ] Ensure the parent page (`ParentsClient.tsx` or similar) has a `fetchParents` function that updates the component's state.
  - [ ] Pass `fetchParents` to the `AddParentModal` via an `onSuccess` prop.
  - [ ] Ensure the modal calls `onSuccess` to trigger a soft refetch, avoiding a full page reload.

### 2. Backend (`/api/parents/` & `/api/send-credentials/`)

- [ ] **Enhance `POST /api/parents`:**

  - [ ] Update the endpoint to accept and handle the `password` field.
  - [ ] Ensure it securely hashes the password using `bcryptjs` before saving the new `User`.
  - [ ] Use Zod to validate the entire incoming payload.
  - [ ] Wrap the user and parent creation in a Prisma transaction to ensure atomicity.

- [ ] **Verify `POST /api/send-credentials`:**
  - [ ] Confirm the Zod schema accepts `role: 'parent'`.
  - [ ] Ensure the logic correctly routes to a `sendParentCredentialsEmail` function or a generic handler.

### 3. Email System (`lib/email.ts`)

- [ ] **Create Parent Email Template:**

  - [ ] Design a clear and professional HTML email template for parents.
  - [ ] Include the school's name, the parent's login credentials (email/password), and a direct link to the login page.

- [ ] **Implement `sendParentCredentialsEmail` Function:**
  - [ ] Create a dedicated function that populates the parent email template with the necessary data.
  - [ ] Ensure it uses the configured `nodemailer` transport.

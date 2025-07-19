# Send Credentials (Teacher) – Professional TODO List

1.  **Frontend (AddTeacherModal & Related Components)**

    -   [x] Ensure all required fields are sent in the credentials payload (name, email, password, role, schoolName, schoolId, schoolUrl).
    -   [x] Handle and display all error messages from the /api/send-credentials endpoint clearly to the user.
    -   [x] Add loading and retry logic for sending credentials, with clear user feedback.
    -   [x] Remove all console.log statements; use toast or UI feedback for errors/success.
    -   [x] Validate email and password before sending credentials.
    -   [x] Ensure resend functionality works and respects retry limits.
    -   [ ] Test with both new and existing teachers (edit mode and add mode).

2.  **API (/api/send-credentials)**

    -   [x] Use Zod to validate all incoming payloads and return detailed errors.
    -   [x] Log all errors with context for debugging (use logger, not console).
    -   [x] Ensure the API returns clear, actionable error messages for all failure cases (validation, email send failure, etc.).
    -   [x] Handle and log email sending failures gracefully; provide debug info in dev.
    -   [x] Ensure the API works for both teacher and student roles.
    -   [ ] Add tests for edge cases (missing fields, invalid email, etc.).

3.  **Email Logic**

    -   [x] Ensure the email template is clear, professional, and includes all necessary info (login URL, credentials, support contact).
    -   [x] Log email send attempts and failures for audit/debugging.
    -   [ ] Test email sending in both dev and production environments.

4.  **General**
    -   [ ] Document the send credentials flow for both devs and admins.
    -   [ ] Test the full flow end-to-end (add teacher, send credentials, teacher login).
    -   [ ] Review and refactor for DRY, maintainable code.
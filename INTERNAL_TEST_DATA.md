# Internal Testing Data Scenario

**School Name:** Zenith Heights College
**Motto:** Excellence in Knowledge
**Address:** 12 Education Close, Victoria Island, Lagos
**Phone:** 08012345678

---

## 1. School Admin (The Setup)

**Role:** Sets up the school, adds classes, and employs teachers.

- **Name:** Dr. Tunde Bakare
- **Email:** `[INSERT YOUR REAL EMAIL 1]` _(e.g., yourname+admin@gmail.com)_
- **Password:** `TestPassword123!`

**Action Plan:**

1.  Sign up as a new school with these details.
2.  Verify the "Welcome to EduIT" email.

---

## 2. Structure Setup (Admin Dashboard)

Use the Admin account to create these:

### Classes (Arms)

- **JSS 1 Gold**
- **JSS 1 Silver**
- **SSS 1 Science**

### Subjects

- **Mathematics** (General)
- **English Language** (General)
- **Basic Technology** (Junior)
- **Physics** (Senior)

---

## 3. Teacher Persona (The Grader)

**Role:** Records scores and attendance. Creates the "activity" on the platform.

- **Name:** Mrs. Funmi Adebayo
- **Email:** `[INSERT YOUR REAL EMAIL 2]` _(e.g., yourname+teacher@gmail.com)_
- **Subjects Assigned:** Mathematics, Physics.
- **Class Assigned:** JSS 1 Gold (Form Teacher)

**Action Plan:**

1.  Admin invites this teacher.
2.  **Check Email 2**: Verify "Invitation to join Zenith Heights" email.
3.  Click link, set password, and login.

---

## 4. Student & Parent Persona (The Payer)

**Role:** Receives notifications, pays fees, checks results.

### Student

- **Name:** Chioma Okoro
- **Class:** JSS 1 Gold
- **Date of Birth:** 2012-05-14
- **Gender:** Female

### Parent (Linked to Student)

- **Name:** Mr. Chinedu Okoro
- **Email:** `[INSERT YOUR REAL EMAIL 3]` _(e.g., yourname+parent@gmail.com)_
- **Phone:** 08099999999

**Action Plan:**

1.  Admin registers Student (Chioma).
2.  Admin links Parent (Mr. Okoro).
3.  **Check Email 3**: Verify "Welcome Parent" email validation.

---

## 5. Test Flows & Notifications

### A. The Billing Loop (Financial)

1.  **Admin:** Go to Finance -> Fee Management.
2.  Create a Bill: "First Term School Fees" (₦45,000).
3.  Assign to: **JSS 1 Gold**.
4.  **Check Email 3 (Parent)**: Should receive "New Bill Generated" invoice.
5.  **Parent:** Login -> Finance -> Pay with Card (use Test Card).
6.  **Check Email 3 (Parent)**: "Payment Receipt" notification.
7.  **Check Email 1 (Admin)**: "Payment Received" alert.

### B. The Academic Loop (Results)

1.  **Teacher:** Login -> Results.
2.  Select **JSS 1 Gold** -> **Mathematics**.
3.  Enter Score for **Chioma Okoro**: (CA: 25, Exam: 60).
4.  Save & Publish.
5.  **Check Email 3 (Parent)**: "New Exam Results Available" notification.

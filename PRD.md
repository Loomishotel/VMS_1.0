# Product Requirements Document (PRD)
## Visitor Management System (VMS) — v1.0

**Document Date:** July 17, 2026  
**Stack:** React (TypeScript) + Vite · Supabase (Auth + Postgres + Realtime) · Express API Server · Turborepo Monorepo

---

## 1. Overview

VMS is a multi-branch, role-gated web application that manages visitor check-in/check-out workflows for corporate office locations. Staff log in through a single-page dashboard; their active role determines which views and actions are accessible. All data is scoped to the user's assigned **branch**.

---

## 2. User Roles & Access

The system has three distinct roles, each auto-assigned at login based on email pattern and Supabase public `User` profile.

| Role | Landing View | Key Capabilities |
|------|-------------|-----------------|
| **Admin** | Lobby Queue | Full visitor queue, company directory, blacklist review, analytics |
| **Security** | Today's Arrivals | Gate arrivals, invite lookup, past records, walk-in registration |
| **Employee** | Today's Scheduled | View/manage own hosted visits, invite future guests, add remarks |

---

## 3. Authentication & Session Management

### 3.1 Login Screen
- Email + password form against **Supabase Auth** (`signInWithPassword`)
- Displays `VMS Staff Portal` branding with building icon
- Shows inline error messages on failure

### 3.2 Pre-Login Security (Backend Rate Limiting)
- Before sending credentials to Supabase, the frontend calls the Express API `POST /api/v1/auth/pre-login-check`
- **IP-level lockout:** After 10 failed attempts from the same IP → 15-minute lockout
- **Email-level lockout:** After 5 failed attempts for the same email → 15-minute lockout
- **CAPTCHA challenge:** Triggered after 3 failed attempts (per email or IP); backend generates a random arithmetic question (addition, subtraction, multiplication). Login is blocked until the correct answer is submitted
- If the Express API server is offline, the frontend silently falls back to direct Supabase auth (no security check applied)
- On successful login, the frontend calls `POST /api/v1/auth/log-login-success` to reset attempt counters

### 3.3 Frontend Lockout Fallback
- When the backend is offline, the browser tracks attempts in `localStorage`
- After 10 local attempts, a 15-minute client-side lockout is imposed
- A live countdown timer is shown on the login form during lockout

### 3.4 Session Timeout
- Tracks user activity via `mousedown`, `mousemove`, `keypress`, `scroll`, `touchstart`, and `click` events
- After **25 minutes** of inactivity, a warning banner appears with a countdown
- After **30 minutes** of inactivity, the session is automatically terminated (Supabase `signOut`)
- User can click "Stay Logged In" to reset the inactivity timer

### 3.5 Theme Persistence
- Dark/light mode toggle in the top navigation bar
- Selection persisted to `localStorage`; defaults to OS preference on first visit
- CSS class (`dark` / `light`) applied to `<html>` element

### 3.6 Logout
- Sidebar footer "Logout" button calls `supabase.auth.signOut()` and clears `localStorage` token
- Resets all in-memory queue, employee, and analytics state

---

## 4. Core Application Layout

### 4.1 Sidebar Navigation
- Persistent left sidebar with **VMS Gateway** logo
- Navigation items are role-specific (rendered conditionally based on `user.role`)
- Highlights the active view
- Bottom section shows the logged-in user's full name, role, and an online indicator avatar
- **Admin sidebar:** Lobby Queue · Company Directory · Blacklist Review Queue · Analytics
- **Security sidebar:** Today's Arrivals · Check Invitation · Past Records · Register Walk-in (opens modal)
- **Employee sidebar:** Today's Scheduled · Past Hosted Visits · My Future Visits · Invite Future Guest

### 4.2 Top Navigation Bar
- Displays the current view name as a page title
- Active Branch name shown (scoped from user's `branchId`)
- Dark/Light mode toggle button
- Global alert/notification banner (success or error) with auto-dismiss X button

---

## 5. Visitor Pre-Registration (All Roles with Access)

Pre-registration is available to **Admin**, **Security**, and **Employee** roles via a modal (Admin/Security) or a dedicated page view (Employee → "Invite Future Guest").

### 5.1 Pre-Registration Form Fields
| Field | Required | Notes |
|-------|----------|-------|
| Visitor Full Name | Yes | Used for blacklist matching |
| Email Address | Conditional | Required for Admin/Security; at least email or phone for Employee |
| Phone Number | Conditional | International format with country-code selector |
| Company / Organization | No | Free text |
| Visitor's Office Location | No | Free text address/city |
| Visitor Type | Yes | Dropdown: Guest · Vendor · Contractor · Candidate · VIP |
| Host Employee | Yes | Dropdown from branch employee directory; auto-set for Employee role |
| Purpose of Visit | Yes | Free text |
| Scheduled Date & Time | Yes | Must not be in the past |
| Number of Additional Guests | No | Integer; capped at 10 for non-VIP visitors |
| Visitor Photo | No | Captured via device camera (live preview + snap) |

### 5.2 Phone Number Validation
- Country code prefix selector (+1, +91, +44, +61, +65, +971, +49, +33, +81, +82, +27, +55)
- Country-specific digit length enforcement (e.g. +91 = 10 digits, +65 = 8 digits)
- Live digit counter shown next to the field with green/red indicators

### 5.3 Camera Capture (Visitor Photo)
- "Take Photo" button opens the device camera feed (`getUserMedia`)
- "Capture" button takes a 320×320 JPEG snapshot
- Preview is shown; user can retake before submitting
- Camera stream is stopped on modal close or form reset
- Photo stored as a base64 `photoUrl` on the `Visitor` record

### 5.4 Blacklist Pre-Check
- Before creating a visitor, the form queries `Blacklist` table scoped to the user's branch
- Matches by visitor name (case-insensitive), email, and phone against existing visitor records
- If a match is found, a **Blacklist Blocked Modal** appears informing the user that registration is blocked
- The registration page is closed upon modal dismissal

### 5.5 Registration Logic
1. Check or create `Visitor` record (upsert by email + phone match)
2. Generate a unique QR token (`QR-<uuid>`) and check-in code (`VMS-<10-char-hex>`)
3. Create an `Invitation` record (linked to visitor + host + QR token)
4. Create a `Visit` record with status `Expected`, linked to the invitation
5. Queue a `Notification` record (channel: Email, status: Queued)
6. Display success alert with the check-in code

---

## 6. Role-Specific Views

### 6.1 Admin — Lobby Queue (`queue`)

**Purpose:** Full visibility of all today's visits across all statuses for the current branch.

**Table Columns:**
- Visitor Details (avatar with type color, name, company, visitor type badge)
- Zone Access
- Host Employee (name + phone)
- Purpose
- Scheduled Time / Created Time
- Status indicator
- Actions column

**Actions per visit status:**
- `Expected` → **Check In** button (opens photo + contact completion modal) · **Deny Entry** button
- `Waiting` → **Check In** · **Deny Entry**
- `CheckedIn` → **Check Out**
- `Denied` → Read-only denied reason shown

**Status Summary Cards (counts):**
- Expected · Checked In · Waiting · Checked Out

**Search:** Real-time filter by visitor name, host name, or purpose.

**Pre-Register Button:** Opens the pre-registration modal.

---

### 6.2 Admin — Company Directory (`employees`)

**Table Columns:** Name · Department · Floor · Email · Phone · Active status badge · Edit button · Delete/Deactivate button

**Add Employee Modal:**
- Fields: Full Name, Email, Phone, Floor, Department (dropdown scoped to branch)
- Saved directly to `Employee` table with `branchId`

**Edit Employee Modal:**
- Same fields as Add, plus Active toggle
- Updates existing `Employee` record

**Delete/Deactivate:**
- Attempts hard delete first
- If foreign key constraint prevents deletion (past visits exist), falls back to setting `isActive = false`

**Search:** Real-time filter by name or department.

---

### 6.3 Admin — Blacklist Review Queue (`blacklist_review`)

**Purpose:** Review visitors flagged by Security for potential blacklisting and manage confirmed blacklist entries.

**Section A — Pending Review Flags:**
- Lists visitors with `blacklistFlag = 'pending_review'` and `flaggedByUserId` belonging to the current branch
- Shows visitor name, type, flag reason, flagged by (user name), flag date
- Shows visit history for each visitor (purpose + host employee + status)
- Actions: **Confirm Blacklist** (adds to `Blacklist` table + sets `isBlacklisted = true`) · **Dismiss Flag** (clears flag, no blacklist entry created)

**Section B — Confirmed Blacklisted:**
- Lists visitors currently on the branch's blacklist
- Shows severity badge (Low / Medium / High)
- Actions: **Remove from Blacklist** (deletes `Blacklist` entry; if no other entries remain, resets `isBlacklisted = false` on visitor)

**Add to Blacklist Directly:**
- "Add to Blacklist" button opens a modal with: Name, Reason, Severity (Low/Medium/High)
- Matches an existing `Visitor` record by name if present, flags it
- Creates a `Blacklist` table entry linked to the current user

---

### 6.4 Admin — Analytics (`analytics`)

**Data Source:** Last 30 days of `Visit` records for the current branch, computed client-side.

**KPI Summary Cards:**
- Today's Visitors (total visits created today)
- Average Visit Duration (minutes, from completed check-in/check-out sessions)
- Denied Entries (30-day total + today's count)
- Repeat Visitor Rate (% of unique visitors with more than one visit in 30 days)

**Charts (Recharts library):**
- **7-Day Visitor Trend** — AreaChart with daily visit count per day (last 7 days)
- **Visitors by Department** — BarChart grouped by host employee's department
- **Top 5 Visit Purposes** — PieChart of top 5 purposes by count
- **Hourly Check-in Distribution** — BarChart showing check-in counts per hour (8 AM–6 PM)

---

### 6.5 Security — Today's Arrivals (`security_arrivals`)

**Purpose:** Gate-level view of active visitors scheduled for today (Expected, Waiting, CheckedIn statuses).

**Table Columns:**
- Visitor Details (avatar, name, company, type)
- Classification (additional guests badge)
- Host Employee (name + phone)
- Purpose
- Scheduled Time
- Status indicator
- Actions

**Actions per visitor status:**
- `Expected` → **Mark Arrived** (updates status to `Waiting`) · **Deny Entry**
- `Waiting` → **Check In** (opens photo + contact completion modal) · **Deny Entry**
- `CheckedIn` → **Check Out** · _(Checked In badge shown)_
- `Blacklisted` → Red **BLACKLISTED** badge; no action buttons shown

**Flag for Blacklist:** Available for all non-blacklisted visitors. Opens the Flag modal.

**Search:** Real-time filter by visitor or host name.

**Mark Arrived Logic:** Validates that the visit is scheduled for the current day before transitioning status; rejects attempts to mark future-day visits as arrived.

---

### 6.6 Security — Check Invitation (`check_invite`)

**Purpose:** Look up and verify future pre-registered invitations.

**Lists:** All visits with status `Expected`, scheduled from today onwards, for the current branch.

**Table Columns:** Visitor Name (with blacklist/pending-review badges) · Company / Classification · Host Employee · Scheduled Time (today vs future label) · Status · Actions

**Actions:**
- **Mark Arrived** — only enabled if visit is scheduled for today; locked for future dates with "Actions Locked (Future Visit)" label
- **Details** — opens a slide-in detail panel with tabs:
  - **General:** visitor name, type, company, email, phone, purpose, scheduled time, remarks
  - **Host:** host name, phone, department
  - **Remarks:** displays the host's remark for this visit
- **Flag Blacklist** — opens the flag modal (for non-blacklisted visitors)

**Search:** Real-time filter by visitor or host name.

**Department Filter:** Dropdown to filter invitations by host employee's department.

---

### 6.7 Security — Past Records (`security_history`)

**Purpose:** Archived log of completed, denied, and cancelled visits plus overdue Expected visits.

**Fetches:** Visits with status `CheckedOut`, `Denied`, `Cancelled`, or `Expected` with `scheduledAt` before today.

**Table Columns:**
- Visitor Details (name, blacklist badge, additional guests badge, company, type, location, email, phone)
- Host Employee (name, department, floor, phone)
- Visit Purpose / Badge Number
- Schedule & Timings (scheduled, checked-in, checked-out timestamps; deny reason if applicable)
- Final Status indicator

**Search:** Real-time filter by visitor name, host name, or company.

---

### 6.8 Employee — Today's Scheduled (`employee_scheduled`)

**Purpose:** Shows visits where the logged-in employee is the host, scheduled for today, in active statuses (Expected, Waiting, CheckedIn).

**Table Columns:** Visitor (name, guests, company, type, location, email, phone) · Purpose · Expected Arrival · Status · Actions

**Actions:**
- `Expected` visit → **Delay Visit** dropdown (15 / 30 / 45 / 60 minutes) · **Cancel Visit** button
- `Waiting` visit → **Deny** button
- `CheckedIn` visit → Read-only status

**Delay Visit:** Updates `scheduledAt` by the selected number of minutes and queues a `Notification` record for the visitor.

**Cancel Visit:** Sets status to `cancellation_pending_reception` (notifies reception to handle the visitor on arrival).

---

### 6.9 Employee — Past Hosted Visits (`employee_past`)

**Purpose:** Read-only log of finalized visits the employee has hosted (past scheduled date, or CheckedOut / Denied / Cancelled / Cancellation Pending).

**Table Columns:** Visitor · Purpose · Schedule & Timing Details (scheduled, checked-in, checked-out, deny reason) · Status

---

### 6.10 Employee — My Future Visits (`employee_future`)

**Purpose:** Card-style list of all upcoming pre-registered visits (scheduled after today's end).

**Card Content:** Visitor avatar, name, company, type, email, purpose, scheduled date/time, days-from-now countdown, status indicator, host's remark (if any)

**Add/Edit Remark:** Each card has an "Add Remark" / "Edit Remark" button that opens a textarea modal. The saved remark is stored on the `Visit` record and visible to Security when they view the visit's details panel.

---

### 6.11 Employee — Invite Future Guest (`employee_invite`)

Renders the full pre-registration form (see Section 5) inside a page view rather than a modal. The employee's own `Employee` record is auto-selected as the host.

---

## 7. Visit Actions & Modals

### 7.1 Check-In with Photo Modal (Security / Admin)
- Triggered for Security and Admin roles when clicking **Check In** on a Waiting/Expected visitor
- Displays current visitor email and phone; allows updating them before check-in
- Camera capture section: Start Camera → Live preview → Capture Photo → Retake option
- **Submit Check-In** calls `handleApproveCheckIn` which:
  1. Updates visitor's email/phone/photo if new data provided
  2. Sets visit status to `CheckedIn`, sets `checkedInAt`, sets `zoneAccess = 'Floor 1, Lobby'`
  3. Creates a `Badge` record (upsert) with a generated badge number (`BDG-<8-char-hex>`)
  4. Writes an `AuditLog` entry for `VISIT_STATUS_CHECKEDIN`
  5. Shows a **Visitor Pass Modal** with badge details

### 7.2 Visitor Pass Modal (Printable Badge)
- Shown after successful check-in (not shown for Employee role)
- Displays: visitor name, company, type, email, phone, photo, badge number, check-in time, host name, host phone, department, purpose, additional guests count, branch name, zone access
- Print button triggers `window.print()`

### 7.3 Deny Entry Modal
- Triggered by **Deny Entry** or **Deny** buttons
- Text area for denial reason (required)
- Submits: sets visit status to `Denied`, stores `deniedReason`, writes `AuditLog` entry for `VISIT_STATUS_DENIED`

### 7.4 Flag for Blacklist Modal
- Opens when Security taps **Flag** or **Flag Blacklist** on a visitor
- Text area for flag reason (required)
- Submits: updates visitor record with `blacklistFlag = 'pending_review'`, `flaggedByUserId`, `flaggedAt`, `flagReason`
- Admin can then review and confirm or dismiss in the Blacklist Review Queue

### 7.5 Blacklist Blocked Modal
- Shown when attempting to pre-register a visitor who is on the branch's blacklist
- Displays a fixed notification message
- Dismissing the modal also closes the registration form/page

### 7.6 Remark Modal (Employee)
- Textarea pre-filled with existing remark
- Save → updates `remarks` column on the `Visit` record
- Visible to Security in the Check Invitation "Details" panel (Remarks tab)

---

## 8. Real-time Notifications (Supabase Realtime)

Subscribes to Postgres changes on the `Visit` table (`postgres_changes`, event `*`).

### 8.1 Employee — Visitor Arrived Notification
- Triggers when a visit transitions to `Waiting` or `CheckedIn`
- Only fires if the visit's `hostEmployeeId` matches the logged-in employee's ID
- Displays an in-app toast/banner: "Your visitor [Name] has arrived"

### 8.2 Admin/Security — Visit Delay Notification
- Triggers when a visit's `scheduledAt` field is updated to a later time
- Checks that the new scheduled time is for the current day
- Displays a banner: "Visitor [Name] for [Host (Dept)] has been delayed by X minutes. New time: HH:MM"

### 8.3 Auto-refresh on Realtime Event
- If the current view is `queue` or `security_arrivals` → silently re-fetches the queue
- If the current view is `employee_scheduled` / `employee_past` / `employee_future` → re-fetches employee visits
- If the current view is `check_invite` → re-fetches future invitations
- If the current view is `security_history` → re-fetches past records

---

## 9. Data Model (Supabase Tables)

| Table | Purpose |
|-------|---------|
| `Role` | System roles (Admin, Security, Employee) |
| `Permission` | Permission codes (visitor.create, visitor.view, blacklist.manage, etc.) |
| `RolePermission` | Many-to-many role ↔ permission mapping |
| `Branch` | Office locations (name, address, timezone) |
| `Department` | Departments scoped to a branch |
| `User` | Staff profiles linked to `auth.users`; has `roleId`, `branchId` |
| `Employee` | Host employee directory (name, email, phone, floor, department, branch) |
| `Visitor` | Visitor profiles (name, email, phone, photo, type, blacklist flags) |
| `Visit` | Individual visit records (status, scheduledAt, checkedIn/Out, purpose, zoneAccess, additionalGuests, checkInCode) |
| `Invitation` | Pre-registration tokens (QR token, expiry, linked to visitor + host) |
| `Badge` | Badge records generated at check-in (badgeNumber, printedAt, printCount) |
| `Blacklist` | Branch-scoped blacklist entries (name, reason, severity, visitorId) |
| `Notification` | Queued email notifications (channel, message, status: Queued/Sent) |
| `AuditLog` | Immutable audit trail of actions (actor, action, entity, before/after state) |
| `Setting` | Branch-level key/value configuration (e.g. badge_expiry_minutes) |
| `Document` | Visitor document uploads (type, fileUrl, expiry) |

### 9.1 Visit Status States
`Expected` → `Waiting` → `CheckedIn` → `CheckedOut`  
`Expected` → `Denied`  
`Expected` → `cancellation_pending_reception` → `Cancelled`

### 9.2 Visitor Blacklist Flags
- `blacklistFlag`: `none` · `pending_review`
- `isBlacklisted`: boolean (true when confirmed on blacklist)

### 9.3 Branch Isolation
All queries filter by `user.branchId`. This ensures users in one branch cannot see visitor, employee, or blacklist data from other branches.

### 9.4 Auto User Profile Trigger
A PostgreSQL function `handle_new_auth_user` fires on `INSERT` into `auth.users` and automatically creates the corresponding `public.User` profile, inferring role and branch from the email pattern.

---

## 10. Express API Server (api-server)

The Express server runs independently from the Supabase client and provides the following endpoints. The frontend falls back gracefully if this server is offline.

### 10.1 Auth Routes (`/api/v1/auth`)
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/pre-login-check` | IP + email lockout check + CAPTCHA enforcement |
| POST | `/log-login-failure` | Increments failure counters; triggers lockout thresholds |
| POST | `/log-login-success` | Resets failure counters after successful login |
| POST | `/login` | (Legacy) JWT-based login via Prisma — present but not used by UI (UI uses Supabase Auth) |
| GET | `/me` | Returns current user profile via JWT token |

### 10.2 Visit Routes (`/api/v1/visits`)
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/queue` | Fetch today's visit queue for the authenticated branch |
| POST | `/pre-register` | Create visitor + invitation + visit (Expected status) |
| POST | `/checkin` | QR-based check-in or walk-in registration |
| POST | `/checkout` | Check out a visitor by visitId |
| PUT | `/:id/status` | Update visit status (approve/deny); generates badge on CheckedIn |

### 10.3 Visitor Routes (`/api/v1/visitors`)
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/` | Search visitor profiles (with branch blacklist overlay) |
| GET | `/:id` | Visitor profile + visit history |
| POST | `/` | Create manual visitor profile |
| GET | `/blacklist` | Branch-scoped blacklist list |
| POST | `/blacklist` | Add to blacklist |
| DELETE | `/blacklist/:id` | Remove from blacklist |

### 10.4 Employee Routes (`/api/v1/employees`)
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/` | List employees for the authenticated branch |
| POST | `/` | Add a new employee |
| PUT | `/:id` | Update employee profile |
| DELETE | `/:id` | Delete or deactivate employee |

### 10.5 Analytics Routes (`/api/v1/analytics`)
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/summary` | KPIs: today's visitors, denied count, avg visit time, weekly trend, visitors by dept |
| GET | `/evacuation` | Real-time list of everyone currently on-site (CheckedIn / Waiting / InMeeting) |

---

## 11. Visitor Types

Five visitor type classifications, each with distinct color-coded avatars and badge styles:

| Type | Color Scheme |
|------|-------------|
| Guest | Indigo/Blue |
| Vendor | Teal/Green |
| Candidate | Amber/Yellow |
| Contractor | Purple |
| VIP | Red/Crimson |

---

## 12. Multi-Branch Support

- Users are assigned to a specific branch at registration time
- All visits, employees, and blacklist entries are scoped to `branchId`
- Branch name is displayed in the top navbar: `Active Branch: [Branch Name]`
- Branches currently seeded: Bangalore HQ · Mumbai Office · Pune Office · Gurgaon Office

---

## 13. Monorepo Structure

```
VMS_1.0/
├── apps/
│   ├── dashboard-ui/        # React + Vite SPA (single App.tsx)
│   │   ├── src/
│   │   │   ├── App.tsx      # All views, handlers, and UI components
│   │   │   ├── index.css    # Global design tokens and component styles
│   │   │   ├── main.tsx     # Vite entry point
│   │   │   └── supabaseClient.ts  # Supabase client initialisation
│   │   └── .env             # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL
│   └── api-server/          # Express + Prisma API server
│       └── src/
│           ├── index.ts     # Express app setup + route mounting
│           ├── middleware/auth.ts  # JWT verification + permission checking
│           └── routes/      # auth.ts, visits.ts, visitors.ts, employees.ts, analytics.ts
├── packages/
│   ├── database/            # Prisma schema + client
│   └── types/               # Shared TypeScript types
├── supabase_schema.sql      # Full Supabase schema + seed data
└── turbo.json               # Turborepo pipeline config
```

---

## 14. UI Component Library (Inline)

All UI primitives are defined directly in `App.tsx`:

| Component | Description |
|-----------|-------------|
| `Avatar` | Initials-based avatar with visitor-type color coding; supports image src, online dot, and ring styles. Sizes: xs/sm/md/lg/xl |
| `Badge` | Pill badge with tone variants: slate · primary · success · warning · danger · indigo · purple. Supports dot indicator and icon |
| `CredentialBadge` | Monospace dashed-border badge for displaying badge numbers and codes |
| `StatusIndicator` | Left-bordered status pill mapping all visit statuses to colors and icons |
| `EmptyState` | Centered empty-state block with icon, title, description, and optional action |
| `Button` | Three variants (primary / secondary / danger) with loading spinner, left/right icon slots |

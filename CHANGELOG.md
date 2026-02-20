# San Synapse-CRM — Changelog

All notable changes from the original CRM Pro v2.0 base are documented here.

---

## [v2.6] — 2026-02-20

### Flutter Mobile App — Speed Dial Add Menu
- Replaced static center Add button with an animated **speed dial overlay**
- Tapping Add reveals 5 quick-action tiles; button icon animates `+` → `×`
- Each tile opens a full bottom-sheet form matching the reference UI:

| Action | Color | Form |
|---|---|---|
| Leave | Purple | Apply Leave (type, from/to dates, team email, reason) |
| Regularize | Red | Add Regularization (period, date, check-in card, reason dropdown) |
| Time Log | Blue | Add Time Log (project, job, hour/start-end/timer modes, billable toggle) |
| Compensatory Off | Orange | Add Request (worked date, unit, duration, start/end time, expiry date) |
| Status | Green | Post Status (audience picker, @mention text, image/attachment toolbar) |

- Shared form widget library (`sheet_widgets.dart`) for consistent styling across all sheets
- Removed unused `/add` placeholder route from router

### Flutter Mobile App — iOS Routing
- Updated iOS configuration and routing setup (`45b5f71`)

### Flutter Mobile App — UI Improvements (`487fba9`)
- **Team view**: Lists all active team members with roles
- **Organization view**: Lists departments with member counts
- **Notifications**: Bell icon with unread badge count
- **Leave types**: Color-coded leave balance chips
- **Profile tab**: Expanded profile information display

### Web App — Responsive UI Fixes (`4ff5cfb`)
- Fixed header layout overflow on smaller viewports
- Fixed sidebar collapse/expand behavior
- Fixed data table column widths on candidates, interviews, and payroll pages
- Fixed login/signup header sizing
- Added CSS utility classes for consistent responsive behavior

---

## [v2.5] — 2026-02-19

### Candidate Form UX (`cb39681`)
- Fixed field ordering and validation feedback in the candidate add/edit form
- Improved inline error states for required fields

### Activity Log Filter
- Added filter controls to the Admin Activity dashboard
- Filter by action type and date range

### Login Audit Export
- New **Audit Log** tab in Settings (`src/pages/settings/components/AuditLogTab.jsx`)
- Displays login history: user, timestamp, IP, device
- Export to CSV

---

## [v2.4] — 2026-02-18

### Clock In/Out Error Handling (`045d26d`)
- Surfaced Supabase errors on failed clock-in/out with user-facing toast messages
- Prevented double-submit on slow connections

### Profile Settings — Supabase Integration
- Profile tab (`ProfileTab.jsx`) now reads from and writes to Supabase `profiles` table
- Avatar, display name, phone, timezone fields are persisted

### UI Components & Pages (`19de28f`)
- Updated Header component styling and active-state indicators
- Sidebar active link highlight improvements
- General polish across Activities, Contacts, Emails, Pipeline, Reports, and Integrations pages

---

## [v2.3] — 2026-02-17

### Production Hardening (`f8ed60d`)
- Removed `.env` from version control; added `.env.example` with all required keys documented
- Added `Content-Security-Policy` and security headers via `netlify.toml` and `vercel.json`
- Added Vercel deploy config (`vercel.json`) alongside existing Netlify config
- Fixed `Select.jsx` component to handle null/undefined option values gracefully
- Fixed `CandidateDrawer.jsx` and `CandidateForm.jsx` display issues
- Improved `Routes.jsx` — lazy loading and cleaner role-guard structure
- Updated `send-whatsapp` Supabase Edge Function with retry logic and better error logging
- Updated `authorize` Edge Function with stricter role checks
- HR Onboarding page refinements

### Expanded VISA Types (`f8ed60d`)
- Migration: `supabase/migrations/20260217_expanded_visa_types.sql`
- Added new VISA type options to the candidates form dropdown

### Database Migration — Production Hardening
- File: `supabase/migrations/20260217_production_hardening.sql`
- Added missing indexes on high-traffic columns
- Added RLS policies for previously unprotected tables
- Cleaned up orphaned foreign key constraints

### Flutter Mobile App — Initial Launch (`f2d9870`)
- New `hr_flutter_app/` — Flutter app for iOS and Android
- Supabase-backed authentication (login screen)
- **Home screen**: My Space / Team / Organization segments
  - Activities tab: Check-in/out timer, work schedule, absent dates
  - Dashboard tab: Leave report card, upcoming holidays
  - Feeds tab, Profile tab, Approvals tab, Leave balance tab, Attendance tab, Time Logs tab
- **Leave screen**: Summary, Balance, and Requests tabs
- **Time screen**: Weekly time logs with total hours, week navigator
- **More screen**: Searchable feature list
- Real-time clock provider with elapsed time tracking
- GoRouter navigation with auth guards
- Material 3 theme with San Synapse brand colors

---

## [v2.2] — 2026-02-15

### Branding
- Renamed app from **Professional CRM v2.2** to **San Synapse-CRM** across all pages, headers, login, signup, sidebar, and browser tab

### Candidate Form — New Fields Added
| Field | Description |
|---|---|
| Alternate Contact No | Secondary phone number |
| Emergency Contact No | Emergency contact number |
| Date of Birth | Candidate DOB |
| Full Address | Complete street/city/state/zip address |
| VISA Copy URL | Link to uploaded VISA document |
| NCA Signed Document URL | Link to uploaded signed NCA |
| Places Willing to Relocate | Specific cities/states (shown when "willing to relocate" is checked) |

### Submission Form — New Fields Added
| Field | Description |
|---|---|
| Client Name | End client company name |

### Interview Form — New Fields Added
| Field | Description |
|---|---|
| Technology | Tech stack for the interview (Java, React, etc.) |
| Client Name | End client company name |
| Feedback & Status | Now visible on new interviews too (was edit-only before) |

### Placement Form — New Fields Added
| Field | Description |
|---|---|
| Technology | Tech stack for the placement |
| Client Address | Client office/site address |
| Offer Type | C2C / W2 / Full-time dropdown |
| Final Interview Date | Date of the final round interview |
| Final Interview Time (CST) | Time of final interview |
| Vendor Contact Person | Vendor contact name |
| Vendor Contact Details | Vendor contact email/phone |

### Payroll — W2 Timesheets Tab
- Added **W2 TIMESHEETS** tab (alongside existing C2C Timesheets)
- Submit W2 timesheets per pay period (employee, dates, hours, screenshot)
- W2 stats cards: Total Entries, Pending, Approved, Total Hours
- Approval workflow (same as C2C)

### Database Migration
- File: `supabase/migrations/20260215_client_template_fields.sql`
- New columns on `candidates`: alternate_phone, emergency_contact, full_address, visa_copy_url, relocation_places, date_of_birth
- New columns on `submissions`: client_name
- New columns on `interviews`: technology, client_name
- New columns on `placements`: technology, final_interview_date, final_interview_time, vendor_contact_name, vendor_contact_details, client_address, offer_type

---

## [v2.1] — 2026-02-09

### Phase 1 Client Implementation
- **Candidate form**: Added full_name consolidation, deal_type (Full-time/W2/C2C), payment_terms, NCA status fields
- **Submission form**: Added technology, vendor contact (name/email/phone), location_type, location_detail, submission_source, NCA compliance blocking
- **Submissions index**: Updated table columns (Technology, Source replacing Tier/Sales Person)
- **Compliance page**: Complete rewrite with tabs — Overview, NCA Compliance, I-9 Forms, E-Verify, All Forms
- **Payroll page**: Added C2C Timesheets tab with submit/approve workflow
- **Analytics dashboard**: Expanded to 12 KPIs, real data charts, recent activity feed
- **Integrations**: Added QuickBooks "Coming Soon — Phase 2" card
- **Settings**: Added Automation tab (Phase 2 stubs with disabled rules)

### Database Migration
- File: `supabase/migrations/20260209_phase1_client_requirements.sql`
- Added ENUM types: deal_type, nca_status, submission_source, location_type
- New columns on candidates, submissions, placements
- New tables: timesheets, recruiter_targets

### Filters
- Added search + filter bars to: Submissions, Interviews, Placements, Payroll, Invoices
- Each page: search input + status/mode dropdowns + result count + clear button

---

## [v2.0] — 2026-02-05 (Original)

### Core CRM
- React 18 + Vite 5 + TailwindCSS 3 + Supabase
- RBAC with 6 roles: admin, sales, recruiter, hr, finance, employee
- Modules: Candidates, Submissions, Interviews, Placements, Payroll, Invoicing, Compliance, Analytics, Vendors, Integrations
- Supabase auth with RLS policies
- Clock-in/Clock-out with WhatsApp notifications
- Admin Activity Dashboard

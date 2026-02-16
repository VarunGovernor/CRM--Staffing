# San Synapse-CRM — Changelog

All notable changes from the original CRM Pro v2.0 base are documented here.

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

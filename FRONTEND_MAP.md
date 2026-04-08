# Frontend Architecture Map

> Last updated: April 2026

## Overview

This document maps the frontend folder structure, shared components, utilities, naming conventions, and import rules. It serves as the single source of truth for understanding and extending the codebase.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 |
| Router | React Router v7 (BrowserRouter) |
| Bundler | Vite 7 |
| Language | TypeScript (strict mode) |
| Styling | CSS variables + Tailwind CSS utilities |
| Fonts | Playfair Display, Caveat, JetBrains Mono (Google Fonts) |

---

## Folder Structure

```
src/
├── main.tsx                   # App entry point
├── App.tsx                    # Route definitions
├── index.css                  # Global styles, animations, responsive utilities
│
├── components/
│   ├── ui/                    # Design system primitives
│   │   ├── index.tsx          # Barrel re-export (all UI components)
│   │   ├── Button.tsx         # Button (primary, ghost, danger, success, outline)
│   │   ├── Input.tsx          # Text input with focus/blur styling
│   │   ├── Select.tsx         # Styled select dropdown
│   │   ├── Textarea.tsx       # Multi-line text input
│   │   ├── Badge.tsx          # Status/label badge (7 variants)
│   │   ├── Card.tsx           # Content card with optional hover
│   │   ├── Container.tsx      # Responsive max-width container
│   │   ├── Stack.tsx          # Flex layout helper
│   │   ├── Spinner.tsx        # Loading spinner SVG
│   │   ├── Label.tsx          # Form label
│   │   ├── Divider.tsx        # Horizontal rule
│   │   ├── PageHeader.tsx     # Page title + subtitle + actions
│   │   ├── FormField.tsx      # Label + input + hint wrapper
│   │   ├── EmptyState.tsx     # Empty state placeholder
│   │   ├── Alert.tsx          # Success/error/warning/info banner
│   │   └── StatCard.tsx       # Numeric stat display card
│   │
│   ├── Layout.tsx             # App shell: navbar, drawer, theme toggle
│   ├── Footer.tsx             # Site footer
│   ├── FeedbackWidget.tsx     # Floating feedback form
│   ├── ProtectedRoute.tsx     # Auth + admin route guard
│   ├── PublicJobDetail.tsx    # Job detail view (used by Dashboard)
│   ├── FilterBar.tsx          # Top-level filter wrapper
│   ├── FilterDropdown.tsx     # Dropdown filter with portal + mobile sheet
│   ├── FormattedDescription.tsx # Job description parser/renderer
│   ├── JobCard.tsx            # Job card for feed lists
│   ├── HomeJobCard.tsx        # Simplified job card for home page
│   ├── DirectoryCard.tsx      # Company directory card
│   ├── SkeletonCompanyCard.tsx # Skeleton loader for company cards
│   └── Pagination.tsx         # Page navigation controls
│
├── pages/
│   ├── Home.tsx               # Landing page
│   ├── Dashboard.tsx          # Public job feed + detail split view
│   ├── CompanyDirectory.tsx   # Company browsing page
│   ├── Login.tsx              # Login form
│   ├── Signup.tsx             # Signup form
│   ├── Legal.tsx              # Privacy policy + terms
│   ├── AdminDashboard.tsx     # Admin: daily analytics
│   ├── AddJob.tsx             # Admin: manual job entry
│   ├── AdminCompanies.tsx     # Admin: company directory management
│   ├── AdminFeedback.tsx      # Admin: user feedback management
│   ├── ReviewQueue.tsx        # Admin: job review queue
│   ├── RejectedJobs.tsx       # Admin: rejected jobs browser
│   └── JobTestLogs.tsx        # Admin: AI processing logs
│
├── hooks/
│   ├── useMediaQuery.ts       # Responsive breakpoint detection
│   └── useCompanies.ts        # Company data fetching + filtering
│
├── context/
│   └── AuthContext.tsx         # Authentication state (token, user, login/logout)
│
├── utils/
│   ├── visitorId.ts           # Anonymous visitor tracking via cookies
│   ├── date.ts                # Shared date helpers (toDate, relativeDate, formatPostedDate)
│   └── job.ts                 # Shared job-data helpers (locations, salary, workplace)
│
├── theme/
│   ├── ThemeProvider.tsx       # Light/dark mode context + CSS variable injection
│   ├── themes.ts              # CSS variable definitions (light + dark)
│   ├── tokens.ts              # Design tokens (spacing, radii, shadows, typography)
│   ├── brand.ts               # Brand constants (name, tagline, colors)
│   ├── content.ts             # Centralized UI copy/strings
│   ├── companies-content.ts   # Company page copy
│   └── legal.ts               # Legal page content
│
└── types/
    └── index.ts               # Core interfaces (IJob, ICompany)
```

---

## Naming Conventions

| Category | Convention | Example |
|----------|-----------|---------|
| Folders | kebab-case | `components/ui/` |
| Components | PascalCase | `PublicJobDetail.tsx` |
| Hooks | camelCase with `use` prefix | `useMediaQuery.ts` |
| Utilities | camelCase | `visitorId.ts`, `date.ts` |
| Types/Interfaces | PascalCase with `I` prefix (interfaces) | `IJob`, `ICompany` |
| CSS variables | kebab-case with `--` prefix | `--primary`, `--bg-surface` |

---

## Shared Utilities

### `utils/date.ts`
| Function | Description | Used by |
|----------|-------------|---------|
| `toDate(value)` | Safe Date parser, returns null on failure | Dashboard, ReviewQueue |
| `relativeDate(value)` | "2d ago", "1w ago" format | Dashboard, HomeJobCard, RejectedJobs |
| `formatPostedDate(value)` | "Jan 15, 2026" format | PublicJobDetail, ReviewQueue, RejectedJobs |

### `utils/job.ts`
| Function | Description | Used by |
|----------|-------------|---------|
| `isMeaningful(value)` | Non-empty, non-"N/A" check | PublicJobDetail, ReviewQueue, RejectedJobs |
| `parseAllLocations(job)` | Merge Location + AllLocations | Dashboard, HomeJobCard, PublicJobDetail, ReviewQueue, RejectedJobs |
| `getPrimaryLocation(job, locations)` | Pick first available location | Dashboard, HomeJobCard, PublicJobDetail, ReviewQueue, RejectedJobs |
| `normalizeWorkplace(value)` | → Remote/Hybrid/Onsite/Unspecified | Dashboard, PublicJobDetail, RejectedJobs |
| `normalizeSalary(value, interval)` | Scale low values (e.g. 125 → 125000) | Internal (used by compactSalary, detailedSalary) |
| `compactSalary(job)` | "€50K-80K" format | Dashboard, HomeJobCard |
| `detailedSalary(job)` | "€50,000 - €80,000 / year" format | PublicJobDetail, ReviewQueue |

---

## UI Component Library

All UI primitives live in `components/ui/` and are imported via the barrel:

```tsx
import { Button, Badge, Card, Container, Input } from '../components/ui';
```

> **Rule**: Never import from individual UI files directly (e.g. `from './ui/Button'`). Always use the barrel export.

---

## Route Map

| Path | Page | Auth Required |
|------|------|--------------|
| `/` | Home | No |
| `/jobs` | Dashboard | No |
| `/directory` | CompanyDirectory | No |
| `/login` | Login | No |
| `/signup` | Signup | No |
| `/legal` | Legal | No |
| `/review` | ReviewQueue | Admin |
| `/admin/companies` | AdminCompanies | Admin |
| `/dashboard` | AdminDashboard | Admin |
| `/add` | AddJob | Admin |
| `/rejected` | RejectedJobs | Admin |
| `/test-logs` | JobTestLogs | Admin |
| `/feedback` | AdminFeedback | Admin |

---

## Theme System

- Theme is toggled via `ThemeProvider` (context)
- CSS variables are injected onto `<html>` element
- Two themes: `lightTheme` and `darkTheme` defined in `themes.ts`
- **Do not hardcode colors** — always use `var(--variable-name)`

---

## API Pattern

- All API calls go through the Vite proxy: `/api/*` → `http://localhost:3000/api/*`
- Auth token is attached via `Authorization: Bearer ${token}` header
- Token is stored in `localStorage` under key `token`

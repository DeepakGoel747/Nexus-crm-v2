# NexaFlow CRM Integration Technical Report

This document provides a comprehensive architectural and technical specification of the current codebase for the integration of the **NexaFlow CRM** system.

---

## SECTION 1: TECH STACK

| Category | Specification & Version | Notes / Details |
| :--- | :--- | :--- |
| **1. Frontend Framework** | **React 19.0.1** (`react`, `react-dom` v19.0.1) | Functional components with hooks (`useState`, `useEffect`, `useMemo`, `useRef`). |
| **2. Frontend Build Tool** | **Vite 8.3.0** (`vite` v8.3.0, `@vitejs/plugin-react` v6.1.1) | Fast HMR, ESM bundling, integrated with Express dev middleware. |
| **3. CSS Approach** | **Tailwind CSS v4.3.3** (`tailwindcss` v4.3.3, `@tailwindcss/vite` v4.3.3) | Imported via `@import "tailwindcss";` in `src/index.css`. Zero CSS modules or inline CSS. |
| **4. Component Library** | **Custom Tailwind + Lucide Icons v0.546.0** + **Motion v12.23.24** | Handcrafted components styled to match Twenty CRM design language (drawers, modals, sheets, popovers). No external UI kit (No Shadcn/Radix/MUI). |
| **5. State Management** | **React Local State + URL Hash Routing + `localStorage`** | Token, current user, and workspace stored in `localStorage` (`nexus_token`, `nexus_user`, `nexus_workspace`). Cross-component sync via state lifting. |
| **6. Backend Framework** | **Node.js + Express 4.21.2** (`express` v4.21.2) | Executed via `tsx` v4.21.0 in `server.ts`. Vite dev server runs as Express middleware (`app.use(vite.middlewares)`). |
| **7. Database** | **JSON Document Disk Store (`data/crm_storage.json`)** | File-backed atomic persistence on local disk. Real multi-tenant schemas for users, workspaces, companies, deals, people, tasks, activities, workflows. |
| **8. ORM / Query Builder** | **Custom TypeScript JSON Persistence Engine** | `loadDb()` & atomic `saveDb()` with array filter/map/find operations in `server.ts`. No Prisma/Drizzle/TypeORM installed yet. |
| **9. Authentication Method** | **Bearer Token (Base64 JWT) + Google SSO Integration** | Endpoints `/api/auth/register`, `/api/auth/login`, `/api/auth/google`, `/api/auth/me`. Tokens verified via `Authorization: Bearer <token>`. |
| **10. API Style** | **RESTful JSON HTTP APIs + Model Context Protocol (MCP)** | JSON request/response bodies under `/api/*` + standard MCP tool-calling endpoint at `/api/ai/mcp`. |
| **11. Language** | **TypeScript 7.0.2** (`typescript` v7.0.2) | Full static typing across frontend and backend (`tsconfig.json`, `src/types/crm.ts`). |
| **12. Package Manager** | **npm** (with `bun.lock` compatibility) | Scripts: `dev` (`tsx server.ts`), `build` (`vite build`), `lint` (`tsc --noEmit`). |

---

## SECTION 2: PROJECT STRUCTURE

### 1. Top-Level Folder Structure
```
├── .env.example               # Environment template (GEMINI_API_KEY, PORT)
├── .gitignore                 # Git ignore configuration
├── README.md                  # Local dev and AI coder MCP setup guide
├── answers.md                 # Technical specification report (this file)
├── bun.lock                   # Lockfile
├── mcp.json                   # Model Context Protocol server configuration
├── metadata.json              # Project identity & major capabilities manifest
├── package.json               # Dependencies & scripts
├── tsconfig.json              # TypeScript compilation config
├── vite.config.ts             # Vite build & Tailwind plugin config
├── server.ts                  # Backend Express server + AI + DB persistence
├── data/
│   └── crm_storage.json       # Persistent multi-tenant database file
└── src/
    ├── App.tsx                # App root & hash-based routing engine
    ├── main.tsx               # Client entry point (DOM mount)
    ├── index.css              # Global Tailwind CSS entry
    ├── types/
    │   └── crm.ts             # Core CRM TypeScript entities & schemas
    └── components/
        ├── Navbar.tsx         # Global marketing & app switcher navbar
        ├── Hero.tsx           # Twenty-style product showcase hero
        ├── ProblemSection.tsx # Open-source vs Salesforce breakdown
        ├── FeatureBento.tsx   # Bento grid highlighting CRM features
        ├── InteractiveCrmPreview.tsx # Live marketing pipeline sandbox
        ├── ComparisonTable.tsx# Salesforce vs Hubspot vs Nexus comparison
        ├── McpAiSection.tsx   # Model Context Protocol interactive playground
        ├── WorkflowSection.tsx# Visual event-driven workflow engine
        ├── SelfHostDocker.tsx # Docker & deployment interactive terminal
        ├── Pricing.tsx        # Cloud vs Enterprise self-host pricing
        ├── Faq.tsx            # Technical FAQ accordion
        ├── Footer.tsx         # Legal, open-source & community footer
        ├── CommandPalette.tsx # Global Cmd+K quick navigation search
        ├── TrialModal.tsx     # Cloud trial onboarding modal
        ├── AiCopilotDrawer.tsx# Gemini 3.8 Flash AI Copilot drawer
        ├── auth/
        │   └── GoogleLoginModal.tsx # Google Account Chooser & OAuth dialog
        ├── export/
        │   └── ExportToAiCoderModal.tsx # Cursor / Claude MCP export modal
        ├── pages/
        │   ├── LoginPage.tsx      # Multi-tenant Sign In & Register screen
        │   ├── DocsPage.tsx       # Developer API & architecture documentation
        │   ├── ChangelogPage.tsx  # Product version release history
        │   ├── StatusPage.tsx     # Live system uptime & health metrics
        │   └── LegalPage.tsx      # AGPLv3, SOC2, Privacy & Security terms
        └── workspace/
            └── FullCrmWorkspace.tsx # Standalone Twenty CRM application
```

### 2. How Frontend Pages / Routes are Organized
Routes are governed by hash-based routing inside `src/App.tsx`:
- `AppView` type: `'home' | 'workspace' | 'login' | 'docs' | 'changelog' | 'status' | 'legal'`
- Hash listeners listen to `window.location.hash` (`#workspace`, `#login`, `#docs`, `#changelog`, `#status`, `#legal`, or empty for `#home`).
- Direct programmatic transition function: `navigateTo(view: AppView)`.

### 3. How Frontend Components are Organized
- Feature modules are in `src/components/`:
  - `workspace/`: The full CRM application (`FullCrmWorkspace.tsx` contains Companies, Pipeline Kanban, People, Tasks, Workflows, Schema Viewer, and Slide-over drawers).
  - `auth/`: Authentication modals (`GoogleLoginModal.tsx`).
  - `export/`: AI Coder & MCP export modals (`ExportToAiCoderModal.tsx`).
  - `pages/`: Standalone sub-pages (`LoginPage.tsx`, `DocsPage.tsx`, etc.).
  - Root components: Marketing sections (`Hero.tsx`, `Navbar.tsx`, `Pricing.tsx`).

### 4. How Backend Routes / Controllers are Organized
All backend routes are currently consolidated in `server.ts` with distinct functional sections:
- Lines 120–320: Auth & Workspace Controllers (`/api/auth/register`, `/api/auth/login`, `/api/auth/google`, `/api/auth/me`, `/api/workspace`)
- Lines 321–550: Multi-Tenant CRUD Controllers (`/api/companies`, `/api/opportunities`, `/api/people`, `/api/tasks`, `/api/activities`, `/api/workflows`, `/api/custom-objects`)
- Lines 551–620: Export Controllers (`/api/export/companies/csv`, `/api/export/full-database`, `/api/export/mcp-config`)
- Lines 621–750: AI & MCP Controllers (`/api/ai/copilot`, `/api/ai/enrich-company`, `/api/ai/deal-health`, `/api/ai/draft-email`, `/api/ai/mcp`)
- Lines 751+: Vite dev server middleware integration and listener.

### 5. How Database Models / Schemas are Organized
- Schema declarations exist in `src/types/crm.ts` (TypeScript interfaces).
- Schema state in storage is defined in `data/crm_storage.json`.
- Dynamic Custom Objects are registered through `/api/custom-objects` and stored in `db.customObjects`.

### 6. Where Shared Types / Interfaces Live
- `src/types/crm.ts`: Houses `Deal`, `Company`, `Person`, `Task`, `Activity`, `WorkflowNode`, `McpTool`, and `DealStage`.

### 7. Is It a Monorepo?
**No**, it is a single unified full-stack TypeScript repository where the Node.js Express server mounts Vite directly during development and serves static build assets in production.

---

## SECTION 3: DATABASE SCHEMA

The persistent database is stored in `data/crm_storage.json`. Every primary CRM entity is strictly partitioned by `workspaceId`.

### Model 1: `users`
| Field | Type | Attributes / Constraints |
| :--- | :--- | :--- |
| `id` | `string` | Primary Key (e.g., `usr-1729560000000`) |
| `name` | `string` | Full name of user |
| `email` | `string` | Unique identifier (case-insensitive lookup) |
| `password` | `string` | Password string or `'sso_google_managed'` |
| `avatar` | `string` | Optional URL or DiceBear initials avatar |
| `workspaceId` | `string` | Foreign Key $\rightarrow$ `workspaces.id` |
| `role` | `string` | e.g., `'Admin / Owner'`, `'VP Sales'` |
| `createdAt` | `string` | ISO 8601 Datetime |

### Model 2: `workspaces`
| Field | Type | Attributes / Constraints |
| :--- | :--- | :--- |
| `id` | `string` | Primary Key (e.g., `ws-1729560000000`) |
| `name` | `string` | Workspace organization name |
| `ownerId` | `string` | Foreign Key $\rightarrow$ `users.id` |
| `createdAt` | `string` | ISO 8601 Datetime |

### Model 3: `companies`
| Field | Type | Attributes / Constraints |
| :--- | :--- | :--- |
| `id` | `string` | Primary Key (e.g., `comp-1`) |
| `workspaceId` | `string` | Foreign Key $\rightarrow$ `workspaces.id` |
| `name` | `string` | Company account name |
| `domain` | `string` | Web domain (e.g., `linear.app`) |
| `tier` | `string` | `'Enterprise'` \| `'Mid-Market'` \| `'Growth'` \| `'Seed'` |
| `arr` | `number` | Annual Recurring Revenue in USD |
| `dealCount` | `number` | Count of associated deals |
| `city` | `string` | City location |
| `country` | `string` | Country |
| `employees` | `number` | Employee headcount |
| `primaryContact`| `string` | Contact name |
| `owner` | `string` | Sales rep / AE assigned |
| `status` | `string` | `'Active'` \| `'Churn Risk'` \| `'Prospect'` \| `'Onboarding'` |
| `notes` | `string` | Internal notes & log text |
| `tags` | `string[]` | Array of label tags |
| `techStack` | `string[]` | (Optional) Detected technologies via AI |
| `aiHealthScore`| `number` | (Optional) 0–100 calculated health score |
| `aiSummary` | `string` | (Optional) AI synthesized elevator pitch |

### Model 4: `opportunities` (Deals)
| Field | Type | Attributes / Constraints |
| :--- | :--- | :--- |
| `id` | `string` | Primary Key (e.g., `deal-1`) |
| `workspaceId` | `string` | Foreign Key $\rightarrow$ `workspaces.id` |
| `title` | `string` | Deal title / description |
| `companyId` | `string` | Foreign Key $\rightarrow$ `companies.id` |
| `companyName` | `string` | Cached display name |
| `amount` | `number` | Dollar deal size |
| `stage` | `DealStage` | `'prospect'` \| `'qualified'` \| `'proposal'` \| `'negotiation'` \| `'won'` \| `'lost'` |
| `probability` | `number` | 0–100 integer probability |
| `closeDate` | `string` | Date string (YYYY-MM-DD) |
| `owner` | `string` | Assigned Account Executive |

### Model 5: `people` (Contacts / Leads)
| Field | Type | Attributes / Constraints |
| :--- | :--- | :--- |
| `id` | `string` | Primary Key (e.g., `peo-1`) |
| `workspaceId` | `string` | Foreign Key $\rightarrow$ `workspaces.id` |
| `name` | `string` | Person full name |
| `email` | `string` | Work email |
| `title` | `string` | Job title |
| `companyId` | `string` | Foreign Key $\rightarrow$ `companies.id` |
| `companyName` | `string` | Cached company name |
| `phone` | `string` | Phone number |
| `status` | `string` | `'Lead'` \| `'Contact'` \| `'Customer'` \| `'Champion'` |
| `lastActivity` | `string` | Recent activity timestamp/description |

### Model 6: `tasks`
| Field | Type | Attributes / Constraints |
| :--- | :--- | :--- |
| `id` | `string` | Primary Key (e.g., `tsk-1`) |
| `workspaceId` | `string` | Foreign Key $\rightarrow$ `workspaces.id` |
| `title` | `string` | Action item summary |
| `completed` | `boolean` | Status toggle |
| `dueDate` | `string` | Due date string |
| `assignedTo` | `string` | Assigned team member |
| `priority` | `string` | `'low'` \| `'medium'` \| `'high'` |
| `relatedEntity`| `string` | Name of associated company or deal |
| `entityId` | `string` | (Optional) ID of associated company |

### Model 7: `activities`
| Field | Type | Attributes / Constraints |
| :--- | :--- | :--- |
| `id` | `string` | Primary Key (e.g., `act-1`) |
| `workspaceId` | `string` | Foreign Key $\rightarrow$ `workspaces.id` |
| `companyId` | `string` | Foreign Key $\rightarrow$ `companies.id` |
| `type` | `string` | `'email'` \| `'meeting'` \| `'note'` \| `'stage_change'` |
| `title` | `string` | Activity headline |
| `description` | `string` | Full log details |
| `timestamp` | `string` | Relative or ISO time |
| `author` | `string` | Rep or system actor |

### Model 8: `workflows`
| Field | Type | Attributes / Constraints |
| :--- | :--- | :--- |
| `id` | `string` | Primary Key (e.g., `wf-1`) |
| `workspaceId` | `string` | Foreign Key $\rightarrow$ `workspaces.id` |
| `name` | `string` | Workflow rule name |
| `trigger` | `string` | Event trigger statement |
| `action` | `string` | Automated action command |
| `enabled` | `boolean` | Active flag |
| `executionCount`| `number` | Executions counter |

### Model 9: `customObjects` (Dynamic Schemas)
| Field | Type | Attributes / Constraints |
| :--- | :--- | :--- |
| `id` | `string` | Primary Key (e.g., `co-1`) |
| `workspaceId` | `string` | Foreign Key $\rightarrow$ `workspaces.id` |
| `name` | `string` | Object Name (e.g. `Contracts`, `Subscriptions`) |
| `slug` | `string` | URL-safe identifier |
| `description` | `string` | Model description |
| `fields` | `string[]` | Field column names |

---

## SECTION 4: AUTHENTICATION & USERS

### 1. How Login Works (Endpoints & Flow)
1. **Email / Password Flow**:
   - `POST /api/auth/register`: Takes `{ name, email, password, workspaceName, seedDemoData }`. Creates user + workspace, generates token.
   - `POST /api/auth/login`: Takes `{ email, password }`. Matches user, returns user details + workspace + token.
2. **Google Single Sign-On Flow (Authentic OAuth 2.0)**:
   - Frontend opens `GoogleLoginModal.tsx` powered by Google Identity Services (GIS).
   - Configurable Google Client ID (`GOOGLE_CLIENT_ID` in `.env`, `/api/auth/google/config`, or entered directly in UI with instant local persistence).
   - Official Google Sign-In SDK prompts authentic Google login dialog and returns a signed ID Token (`credential` JWT).
   - `POST /api/auth/google`: Accepts `{ credential, workspaceName }`. Backend verifies the ID token cryptographically via `https://oauth2.googleapis.com/tokeninfo`.
   - Verified profile data (`email`, `name`, `picture`, `sub`) is extracted, matching or creating user with verified Google identity and dedicated workspace.
   - Also includes a simulated testing tab for development environments without Google Cloud credentials.
3. **Session Issuance & Storage**:
   - Token payload: `{ userId, email, workspaceId, timestamp }` encoded as Base64.
   - Stored on client in `localStorage.setItem('nexus_token', token)` and `localStorage.setItem('nexus_user', ...)`.

### 2. User Model
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  workspaceId: string;
  role: string;
  workspaceName?: string;
  createdAt?: string;
}
```

### 3. Roles and Permissions
- Current roles: `'Admin / Owner'`, `'VP Sales'`, `'Admin'`.
- Role controls workspace administration, custom object creation, and workspace renaming.

### 4. How Protected Routes are Handled (Frontend)
- `App.tsx` handles route protection by reading `localStorage.getItem('nexus_token')`.
- If an unauthenticated user navigates to `#workspace`, the app can route to `LoginPage.tsx`.
- Signing out clears `nexus_token`, `nexus_user`, and `nexus_workspace`, redirecting back to `#login`.

### 5. How Protected API Routes are Handled (Backend)
- In `server.ts`, `getAuthContext(req)` extracts `req.headers.authorization`:
```typescript
function getAuthContext(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: db.users[0], workspace: db.workspaces[0] };
  }
  const token = authHeader.split(' ')[1];
  const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
  const user = db.users.find((u) => u.id === decoded.userId || u.email === decoded.email);
  const workspace = db.workspaces.find((w) => w.id === user.workspaceId);
  return { user, workspace };
}
```

### 6. Where Current User is Stored (Frontend State)
- `currentUser` state in `FullCrmWorkspace.tsx` (`name`, `email`, `role`, `workspaceName`).
- Backed by `localStorage.getItem('nexus_user')`.

### 7. Current User API Endpoint
- `GET /api/auth/me`: Reads Bearer token header, returns `{ user, workspace }`.

---

## SECTION 5: EXISTING FEATURES

| Feature Name | Functional Description | Route / Page | API Endpoints Used | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Companies Directory** | Table view with search, filter by tier, sort by ARR, multi-row bulk delete, CSV export, column visibility toggle, and record creation modal. | `#workspace` (Companies tab) | `GET /api/companies`<br>`POST /api/companies`<br>`PATCH /api/companies/:id`<br>`POST /api/companies/bulk-delete`<br>`GET /api/export/companies/csv` | **Complete** |
| **Pipeline Kanban Board** | 5-stage visual Kanban board (*Prospecting, Qualified, Proposal, Negotiation, Closed Won*). Drag/click stage advancement, dynamic ARR stage sums, and deal probability. | `#workspace` (Pipeline tab) | `GET /api/opportunities`<br>`POST /api/opportunities`<br>`PATCH /api/opportunities/:id/stage` | **Complete** |
| **People / Contacts** | Contact directory linked to companies with status badges (*Champion, Contact, Lead*), email, phone, and direct touchpoint triggers. | `#workspace` (People tab) | `GET /api/people`<br>`POST /api/people` | **Complete** |
| **Tasks Manager** | Task list with checkbox completion toggles, priority levels (*high, medium, low*), due dates, and entity relationship links. | `#workspace` (Tasks tab) | `GET /api/tasks`<br>`POST /api/tasks`<br>`PATCH /api/tasks/:id/toggle` | **Complete** |
| **Event-Driven Workflows** | Visual automation rules (e.g. auto-creating an onboarding task when a deal moves to Won) with active/inactive toggles. | `#workspace` (Workflows tab) | `GET /api/workflows`<br>`PATCH /api/workflows/:id/toggle` | **Complete** |
| **Schema & Custom Objects** | Visual relational database viewer showcasing PostgreSQL schemas, field types, and user-defined tables (`Contracts`, `Subscriptions`). | `#workspace` (Schema tab) | `GET /api/custom-objects`<br>`POST /api/custom-objects` | **Complete** |
| **Slide-Over Record Drawer** | Right-side inspection sheet for any company showing live ARR, tier, employees, timeline activity feed, tech stack, and internal note poster. | `#workspace` | `GET /api/activities?companyId=...`<br>`POST /api/activities` | **Complete** |
| **AI Copilot (MCP Agent)** | Gemini 3.8 Flash copilot drawer with live database grounding, pipeline risk evaluation, and tool payload simulation. | `#workspace` & `#home` | `POST /api/ai/copilot` | **Complete** |
| **AI Company Enrichment** | One-click intelligence engine: fetches tech stack, employee range, and elevator pitch for any company domain via Gemini. | `#workspace` (Slide-over drawer) | `POST /api/ai/enrich-company` | **Complete** |
| **AI Email Drafter** | Generates context-aware, personalized B2B sales outreach emails tailored to company status and notes. | `#workspace` (Slide-over drawer) | `POST /api/ai/draft-email` | **Complete** |
| **Model Context Protocol Server** | Standard JSON-RPC MCP endpoint allowing Cursor, Windsurf, or Claude Desktop to query deals and log activities. | Global | `POST /api/ai/mcp`<br>`GET /api/export/mcp-config` | **Complete** |
| **Global Command Palette** | Quick jump modal triggered via `Cmd+K` or search bar to instantly access pipeline, companies, docs, or settings. | Global | Client-side search index | **Complete** |
| **Authentication & Workspaces** | Register custom isolated workspaces, password sign in, Google SSO modal, and workspace renaming settings. | `#login` & `#workspace` | `POST /api/auth/register`<br>`POST /api/auth/login`<br>`POST /api/auth/google`<br>`PATCH /api/workspace` | **Complete** |
| **AI Coder Export Modal** | 1-click modal providing `.cursor/mcp.json`, `claude_desktop_config.json`, and raw database JSON export. | `#workspace` | `GET /api/export/full-database`<br>`GET /api/export/mcp-config` | **Complete** |

---

## SECTION 6: API PATTERNS

### 1. Base URL Pattern
All application backend endpoints are prefixed with:
```
/api/*
```

### 2. Example Endpoints

#### Example 1: Create Company
- **HTTP Method + Path**: `POST /api/companies`
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "name": "Acme Dynamics",
    "domain": "acme.io",
    "tier": "Enterprise",
    "arr": 150000,
    "primaryContact": "Jane Doe"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "company": {
      "id": "comp-1729567890",
      "workspaceId": "ws-1729560000",
      "name": "Acme Dynamics",
      "domain": "acme.io",
      "tier": "Enterprise",
      "arr": 150000,
      "dealCount": 1,
      "city": "San Francisco",
      "country": "USA",
      "employees": 10,
      "primaryContact": "Jane Doe",
      "owner": "Alex Vance",
      "status": "Prospect",
      "notes": "Created in custom workspace.",
      "tags": ["Inbound"],
      "techStack": ["TypeScript", "React"],
      "aiHealthScore": 85
    }
  }
  ```

#### Example 2: Advance Deal Stage
- **HTTP Method + Path**: `PATCH /api/opportunities/:id/stage`
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "stage": "won"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "deal": {
      "id": "deal-1",
      "stage": "won",
      "title": "Enterprise Rollout",
      "amount": 90000
    }
  }
  ```

#### Example 3: AI Copilot Natural Language Query
- **HTTP Method + Path**: `POST /api/ai/copilot`
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "message": "Which accounts in our pipeline are currently at churn risk?"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "reply": "Based on live workspace data, **Cloudflare Infrastructure** is flagged with an open incident and a decreased health score of 62.",
    "timestamp": "7:45:00 AM"
  }
  ```

### 3. Pagination Handling
Currently handled on the frontend via array filtering and sorting (`useMemo` in `FullCrmWorkspace.tsx`). Endpoints return full tenant arrays filtered by `workspaceId`. Backend cursor pagination is not yet implemented.

### 4. Error Format
Errors follow standard HTTP status codes (`400`, `401`, `404`, `409`, `500`) with a JSON payload:
```json
{
  "error": "Detailed descriptive error message string"
}
```

### 5. Middleware Pattern
- Express `express.json()` handles request body parsing.
- Auth helper `getAuthContext(req)` extracts Bearer token and resolves user/workspace.
- Vite middleware is mounted in development: `app.use(vite.middlewares)`.

### 6. Frontend API Utilities
- Frontend uses standard native `fetch()` calls with helper function `getAuthHeaders()`:
```typescript
const getAuthHeaders = () => {
  const token = localStorage.getItem('nexus_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};
```

---

## SECTION 7: UI / DESIGN SYSTEM

### 1. Current UI Vibe
Minimalist, high-density, modern SaaS aesthetic modeled directly after the **Twenty CRM** and Linear design language:
- Clean monochrome borders (`border-neutral-200` in light mode, `border-neutral-800` in dark mode).
- Off-white paper background (`bg-[#faf9f6]`) in light mode; deep obsidian (`bg-[#090a0d]`) in dark mode.
- Dense typographic hierarchy with monospace metadata chips.

### 2. Brand Colors
- **Primary / Dominant**: Neutral black (`#090a0d` / `#141518`) and pure white (`#ffffff`).
- **Accent**: Purple / Indigo (`#9333ea` / `#a855f7`) for AI Copilot, MCP badges, and active focus rings.
- **Status Semantic**:
  - Green / Emerald (`#10b981`): Closed Won, Active, Verified.
  - Amber / Yellow (`#f59e0b`): Proposal, Mid-Market, Pending.
  - Red / Rose (`#ef4444`): Churn Risk, High Priority, Delete.
  - Blue (`#3b82f6`): Primary Google branding, Qualified stage.

### 3. Fonts
- **Primary Body / UI**: System Sans font stack (`Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `sans-serif`).
- **Code & Numeric**: Monospace font stack (`ui-monospace`, `SFMono-Regular`, `Menlo`, `Monaco`, `Consolas`).

### 4. Reusable UI Components
Components are built with consistent Tailwind primitives:
- Modal Dialogs: Overlay `fixed inset-0 bg-black/65 backdrop-blur-sm` with card `rounded-2xl border p-6 shadow-2xl`.
- Popovers / Menus: `rounded-xl border shadow-xl bg-white dark:bg-[#121318]`.
- Badges: `text-[10px] font-mono px-1.5 py-0.5 rounded border`.
- Buttons: Solid primary (`bg-neutral-950 text-white rounded-md font-bold px-3 py-1.5`) and subtle secondary (`border border-neutral-300 dark:border-neutral-700`).

### 5. Design System Documentation
Not a separate Storybook library; component patterns are documented in code and demonstrated across `FullCrmWorkspace.tsx`, `Navbar.tsx`, and `InteractiveCrmPreview.tsx`.

### 6. Form Handling
Built using standard controlled React state (`useState` per input or form state object) with native `onSubmit` handlers.

### 7. Form Validation
Inline client-side validation checking field length and email formats, supplemented with server-side response error banners.

### 8. Tables & Lists Rendering
- Tables: Semantic `<table>` with `<thead>` and `<tbody>`, hover highlights (`hover:bg-neutral-50 dark:hover:bg-white/[0.02]`), row check-boxes, and column visibility filters.
- Kanban: 5-column CSS grid (`grid-cols-1 md:grid-cols-5 gap-3`) with deal cards showing amounts, owners, and stage advance buttons.

### 9. Charts & Graphs
- CSS / SVG-based metric bars and pipeline progress indicators.
- No external chart libraries (`recharts`, `chart.js`) are installed yet.

---

## SECTION 8: DEPLOYMENT & ENVIRONMENT

### 1. How App is Deployed
- Production build via `npm run build` (`vite build`).
- Full-stack runtime entry point: `server.ts` running via `node server.ts` or `tsx server.ts` on port 3000.
- Production deployment runs on Google Cloud Run containerized environment (`0.0.0.0:3000`).

### 2. Docker / Docker Compose
- `src/components/SelfHostDocker.tsx` provides interactive Docker command generator.
- A physical `docker-compose.yml` does not exist in the root yet (can be added if required).

### 3. Environment Variables
Stored in `.env` (template in `.env.example`):
```env
PORT=3000
GEMINI_API_KEY=AIzaSy...
```

### 4. Environments
- Development: `npm run dev` (`tsx server.ts` with Vite middleware mode).
- Production: Containerized deployment listening on port 3000.

### 5. CI / CD
Build validation runs via:
```bash
npm run lint    # runs "tsc --noEmit"
npm run build   # runs "vite build"
```

---

## SECTION 9: WHAT THE USER WANTS TO ADD (FEATURE AUDIT)

Here is the exact status of the requested CRM modules:

| Requested Module | Status in Project | Implementation Details & File Location |
| :--- | :--- | :--- |
| **Companies Management** | **ALREADY EXISTS** | CRUD, table view, filter by tier, search, bulk delete, and slide-over detail drawer in `src/components/workspace/FullCrmWorkspace.tsx`. |
| **Contacts Management** | **ALREADY EXISTS** | People directory linked to companies by `companyId`, status tags (*Champion, Contact*), phone/email in `FullCrmWorkspace.tsx`. |
| **Leads Management** | **ALREADY EXISTS (PARTIAL)** | Implemented as `'Lead'` status under People and `'prospect'` stage under Deals. A standalone dedicated Leads pipeline view can be expanded. |
| **Deals / Opportunities** | **ALREADY EXISTS** | 5-stage Kanban board with stage transition, ARR sums, and win probability calculations in `FullCrmWorkspace.tsx`. |
| **Tasks** | **ALREADY EXISTS** | Task manager with priorities, due dates, entity links, and completion toggles. Drag-and-drop board can be added (currently list-based). |
| **Calendar / Meetings** | **NEW / NOT YET IMPLEMENTED** | Activity timeline logs meetings, but a full interactive visual monthly/weekly calendar grid is not yet built. |
| **Activities Timeline** | **ALREADY EXISTS** | Slide-over drawer contains reverse-chronological timeline of emails, meetings, stage updates, and notes (`GET /api/activities`). |
| **Notes** | **ALREADY EXISTS** | Internal note taking input in slide-over drawer with instant backend persistence (`POST /api/activities`). |
| **Email Logging** | **ALREADY EXISTS** | Simulated context-aware email generator via Gemini 3.8 Flash (`POST /api/ai/draft-email`). |
| **Dashboard with Charts** | **NEW / NOT YET IMPLEMENTED** | KPI summary badges exist at the top of Pipeline and Companies, but a dedicated Analytics Dashboard page with graphical charts is not yet built. |
| **Reports Module** | **NEW / NOT YET IMPLEMENTED** | Custom reports builder is not yet implemented. |
| **Users & RBAC** | **ALREADY EXISTS** | User model with roles (`'Admin / Owner'`, `'VP Sales'`), password login, Google SSO, and multi-tenant workspace isolation. |
| **Settings (Workspace, Profile)** | **ALREADY EXISTS** | Workspace Settings modal for renaming workspace (`PATCH /api/workspace`), user profile dropdown, and sign out. |
| **Audit Logs** | **ALREADY EXISTS (PARTIAL)** | System activity feed tracks creation, updates, and stage movements in `db.activities`. |
| **Trash / Soft Delete** | **NEW / NOT YET IMPLEMENTED** | Deletions are currently hard deletes (`DELETE /api/companies/:id`). A `deletedAt` soft-delete field can be added. |
| **Global Search / Cmd+K** | **ALREADY EXISTS** | `src/components/CommandPalette.tsx` supports keyboard shortcut `⌘K` / `Ctrl+K` with quick jump. |
| **CSV Import / Export** | **ALREADY EXISTS (EXPORT)** | Real CSV export at `/api/export/companies/csv`. CSV file upload parser is **NEW / NOT YET IMPLEMENTED**. |
| **Notifications System** | **ALREADY EXISTS (BASIC)** | Toast notification banners for actions (login success, deal movement, errors). Real-time notification center dropdown can be expanded. |

---

## SECTION 10: CONSTRAINTS & PREFERENCES

1. **Libraries to Use vs. Avoid**:
   - **MUST USE**: Standard React 19, Tailwind CSS v4, Lucide React icons, TypeScript.
   - **AVOID**: Heavy UI suites like MUI or Ant Design that clash with the Twenty/Linear minimalist design system. If charts are needed, lightweight SVG or `recharts` / `chart.js` can be installed.
2. **Coding Standards**:
   - Strict TypeScript with no implicit `any`. Standard enums and exported interfaces in `src/types/crm.ts`.
   - Tailwind utility classes for all styling.
   - Keep APIs RESTful under `/api/*` and maintain multi-tenant scoping (`workspaceId`).
3. **Refactoring vs Matching Existing Patterns**:
   - New code should match existing patterns: components in `src/components/`, types in `src/types/`, and routes in `server.ts`.
   - Modularity: If `server.ts` grows too large, breaking it into `src/server/routes/` or controller files is welcome.
4. **Recommended Implementation Priority Order**:
   - **Priority 1**: Visual Analytics Dashboard with revenue charts & conversion KPI widgets.
   - **Priority 2**: Dedicated Calendar & Meetings view with drag-and-drop event scheduling.
   - **Priority 3**: CSV Import file parser (to complement existing CSV export).
   - **Priority 4**: Soft Delete / Trash bin with recovery actions.
5. **Performance Considerations**:
   - For datasets over 10,000 records, transition `data/crm_storage.json` to SQLite or PostgreSQL with Drizzle/Prisma, and add server-side cursor pagination.
6. **Security Requirements**:
   - Ensure all new CRUD operations strictly check and enforce `workspaceId` to maintain multi-tenant isolation.
   - In production, replace the Base64 token with signed JWT (`jsonwebtoken` or `jose`) with cryptographic expiration.

---

### Project State Summary
Nexus CRM is an active full-stack open-source application featuring a React 19 and Tailwind CSS v4 frontend paired with an Express and Node.js backend running Gemini 3.8 Flash AI automation. It has a functional Twenty-style CRM workspace supporting multi-tenant accounts, companies management, a Kanban pipeline, contacts, tasks, workflows, Google SSO, and a native Model Context Protocol (MCP) server. The project persists data to disk via an atomic JSON storage engine and is primed for the addition of analytics charts, calendar scheduling, and CSV import.

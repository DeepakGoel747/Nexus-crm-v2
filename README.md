# Nexus CRM — Full-Stack Open-Source AI CRM

A high-performance, open-source alternative to Salesforce with native Model Context Protocol (MCP) support, persistent multi-tenant storage, and Gemini 3.8 Flash AI automation.

---

## 🚀 Quickstart for Local AI Coders (Cursor, Windsurf, Claude Code, VS Code)

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **pnpm**

### 2. Setup & Installation
```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env
```

Ensure your `.env` contains:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
DATABASE_URL=postgresql://nexus_user:your_password@localhost:5432/nexus_crm
```
Replace the placeholder with a valid Google AI Studio Gemini API key. If no valid key is configured, pipeline summary and risk questions are calculated from saved CRM opportunity and company fields; open-ended Gemini requests show a setup message instead of attempting Google Cloud default credentials.

Generate a session secret with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` and put it in `SESSION_SECRET` in your `.env`. Set `NODE_ENV=production` for deployment so the server enforces the PostgreSQL and session-secret requirements.

For PostgreSQL, create a database and user, then set `DATABASE_URL` to that database. On first connection Nexus creates its PostgreSQL entity store. The default is a clean database; to migrate `data/crm_storage.json`, back it up, set `DATABASE_IMPORT_JSON=true`, and start against an empty PostgreSQL database. This import flag is ignored when PostgreSQL already contains data. Do not point unrelated environments at the same database. Once PostgreSQL contains records, it is the source of truth. Without `DATABASE_URL`, development continues to use the local JSON file. Production refuses to start unless PostgreSQL and a 32-character `SESSION_SECRET` are configured; an empty PostgreSQL database starts clean and never implicitly imports local demo credentials or data.

The PostgreSQL store uses PostgreSQL JSONB record payloads with indexed entity and workspace keys to preserve the current flexible CRM model during this migration. It is a first migration step, not a claim that every CRM object has a finalized normalized relational schema; schema migrations and typed repositories are the next database-hardening phase. Existing plaintext local account passwords are converted to salted scrypt hashes when the server starts. Sessions are signed, expire after seven days, and all API routes except registration and sign-in require authentication. For an isolated local run or test, `CRM_STORAGE_FILE` can point the JSON mode at a separate file.

### Google Sign-In setup
Google Sign-In requires your own OAuth 2.0 **Web application** client ID; it is not available until configured in Google Cloud. In Google Cloud Console, configure the OAuth consent screen, create a Web application OAuth client, and add each app origin under **Authorized JavaScript origins** (for local development, `http://localhost:3000`; add your deployed HTTPS origin for production). Set `GOOGLE_CLIENT_ID` in the server `.env` to that client ID, restart Nexus, and retry sign-in. The sign-in API verifies the returned Google ID token and requires its audience to match this client ID. If the client ID is missing or the JavaScript origin is not allowlisted, Google sign-in will not work; use email/password sign-in in the meantime.

On first Google sign-in, Nexus asks for the company name, website, industry, employee range, and country, then saves those details to the private workspace profile. The CRM starts empty for that account; sample companies, opportunities, contacts, tasks, and workflows are not added. The profile can be updated later in **Settings → Workspace → General**.

### 3. Run Dev Server
```bash
npm run dev
```
The full-stack application will run at:
- **Web App & CRM Workspace**: `http://localhost:3000`
- **REST & AI Endpoints**: `http://localhost:3000/api/*`

### Gmail integration (import mail as CRM activity)

Settings → Apps → Gmail connects a mailbox with Google OAuth and imports recent messages
as activity records, matched to contacts by sender address so correspondence history sits
next to the related account.

Setup, all in the same Google Cloud OAuth client used for sign-in:

1. Enable the **Gmail API** for your project.
2. Add the exact redirect URI under **Authorized redirect URIs**:
   `https://<your-deployment-host>/api/integrations/gmail/callback`
   (`http://localhost:3000/api/integrations/gmail/callback` for local runs).
3. Set `GOOGLE_CLIENT_SECRET` on the server. The client ID alone is not enough — the
   authorization-code exchange needs the secret.
4. Request only the `gmail.readonly` scope. Nexus never sends, edits, or deletes mail.

The refresh token is encrypted at rest (AES-256-GCM) with a key derived from
`SESSION_SECRET`, so it is never stored in plain text. Re-running a sync is safe:
imported messages are tracked by Gmail message ID and are not duplicated.

### Deploy a live instance on Render

Nexus serves the Vite development server locally. Production serves the built `dist` frontend from the Express server and requires PostgreSQL; it will refuse to start if the production database or session secret is missing.

1. Push the project to a GitHub repository. Never commit `.env`, API keys, OAuth secrets, or private CRM data.
2. In Render, choose **New → Blueprint**, connect the GitHub repository, and select the `deploy/nexaflow-render` branch. Render reads `render.yaml` to create the Node web service and PostgreSQL database.
3. When prompted, set `GOOGLE_CLIENT_ID` and `GEMINI_API_KEY` in Render's environment settings. The Blueprint generates `SESSION_SECRET` and connects the managed database automatically.

   | Variable | Required | Value |
   | --- | --- | --- |
   | `NODE_ENV` | Yes | `production` |
   | `DATABASE_URL` | Yes | Automatically connected managed PostgreSQL URL |
   | `SESSION_SECRET` | Yes | Automatically generated unique secret |
   | `GOOGLE_CLIENT_ID` | For Google sign-in | OAuth 2.0 Web client ID |
   | `GEMINI_API_KEY` | For Gemini AI | Google AI Studio API key |

4. In Google Cloud Console, add the deployed HTTPS origin (for example, `https://your-service.onrender.com`) to the OAuth client's **Authorized JavaScript origins**. It must match the browser URL exactly, including the scheme and host; do not add a path.
5. Deploy and check the service logs for the startup message. Visit the HTTPS URL, create an account, and verify sign-in, workspace creation, and saved data after a redeploy.

The production database starts empty by default; the local JSON/demo dataset is not automatically copied. If importing the JSON dataset, back it up first and point only the intended new, empty production database at the service. Keep all credentials in the hosting provider's environment settings, not in Git.

---

## 🔌 Connecting Your AI Coder via Model Context Protocol (MCP)

This project has native support for **Model Context Protocol (MCP)**, allowing **Cursor**, **Windsurf**, or **Claude Desktop** to directly read and mutate your CRM data.

### Option A: Connect in Cursor
1. Open Cursor Settings (`Cmd + ,` or `Ctrl + ,`).
2. Go to **Features** → **MCP**.
3. Click **+ Add New MCP Server**.
4. Configure:
   - **Name**: `nexus-crm`
   - **Type**: `command`
   - **Command**: `npm run dev`
   - **URL / Endpoint**: `http://localhost:3000/api/ai/mcp`
   - Or point to the live cloud URL:
     `https://ais-dev-f3cvlhbxe5zevt6qccu2nb-478429180564.asia-southeast1.run.app/api/ai/mcp`

### Option B: Connect in Claude Desktop
Add this to your `claude_desktop_config.json`:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "nexus-crm": {
      "command": "node",
      "args": ["server.ts"],
      "env": {
        "PORT": "3000",
        "GEMINI_API_KEY": "YOUR_GEMINI_KEY"
      }
    }
  }
}
```

### Available MCP Tools for Your AI Coder
- `find_deals`: Search and filter pipeline deals by stage, amount, or company.
- `log_activity`: Log automated meeting notes, emails, or status milestones.
- `enrich_company`: Trigger Gemini 3.8 Flash to extract headcount, tech stack, and pitch.
- `deal_health`: Calculate win probabilities and risk scores for active opportunities.

---

## Workspace Features

The CRM workspace includes:
- **Dashboards**: live KPI cards, pipeline value by stage, win rate, and task completion. Favorite a dashboard and customize which widgets are shown.
- **Workflows**: view and enable/disable event automations, inspect aggregate execution counts, and see the current configuration/status. Individual run logs and historical workflow versions are not stored yet.
- **Calendar**: monthly and weekly meeting views with meeting scheduling and attendee notes.
- **Reports**: build CSV reports for companies, deals, people, or tasks, choose fields, and preview results.
- **Trash**: recover deleted companies (including linked deals) or permanently remove trashed records.
- **CSV Import**: preview and import up to 500 company records per file (512 KB maximum); a `Name` column is required.
- **Notifications**: workspace-scoped history for new companies, imports, meetings, deal wins, trash, and restores.
- **AI assistant**: a prompt-first workspace chat for questions grounded in CRM companies and opportunities, pipeline summaries, email drafts, and workflow design. The assistant can open the existing company-record form; workflow suggestions still need to be configured and enabled in Workflows before they run.
- **Settings**: Twenty-inspired settings navigation for profile, experience, workspace, data model, layout, members, accounts, communication, and AI/MCP. Profile/workspace names and supported workspace preferences persist in the active database; app appearance and sidebar layout also apply in the UI. Email/calendar providers, billing, invitations, custom domains, account security, and marketplace integrations are clearly marked unavailable until implemented.

---

## 📂 Project Architecture

```
├── server.ts               # Full-stack Express server with Vite middleware mount
├── data/
│   └── crm_storage.json    # Local JSON fallback; PostgreSQL is preferred
├── src/
│   ├── App.tsx             # Root router (Workspace vs Marketing site)
│   ├── components/
│   │   ├── workspace/      # Full standalone CRM workspace and analytics/calendar/report views
│   │   │   ├── FullCrmWorkspace.tsx
│   │   │   ├── WorkspaceAiPage.tsx
│   │   │   ├── SettingsPanel.tsx
│   │   │   ├── AnalyticsDashboard.tsx
│   │   │   ├── CalendarView.tsx
│   │   │   ├── ReportsView.tsx
│   │   │   ├── TrashView.tsx
│   │   │   └── CompanyCsvImport.tsx
│   │   ├── auth/           # Google Login & Workspace Modals
│   │   │   └── GoogleLoginModal.tsx
│   │   ├── pages/          # Login, Docs, Changelog, Status, Legal
│   │   └── AiCopilotDrawer.tsx # Floating Gemini AI MCP Copilot
│   └── types/
│       └── crm.ts          # Core TypeScript relational models
├── mcp.json                # Standard MCP server manifest
└── package.json
```

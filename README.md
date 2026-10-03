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
```

### 3. Run Dev Server
```bash
npm run dev
```
The full-stack application will run at:
- **Web App & CRM Workspace**: `http://localhost:3000`
- **REST & AI Endpoints**: `http://localhost:3000/api/*`

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

## 📂 Project Architecture

```
├── server.ts               # Full-stack Express server with Vite middleware mount
├── data/
│   └── crm_storage.json    # Persistent file-backed multi-tenant database
├── src/
│   ├── App.tsx             # Root router (Workspace vs Marketing site)
│   ├── components/
│   │   ├── workspace/      # Full standalone Twenty CRM Workspace
│   │   │   └── FullCrmWorkspace.tsx
│   │   ├── auth/           # Google Login & Workspace Modals
│   │   │   └── GoogleLoginModal.tsx
│   │   ├── pages/          # Login, Docs, Changelog, Status, Legal
│   │   └── AiCopilotDrawer.tsx # Floating Gemini AI MCP Copilot
│   └── types/
│       └── crm.ts          # Core TypeScript relational models
├── mcp.json                # Standard MCP server manifest
└── package.json
```

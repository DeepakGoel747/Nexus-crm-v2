import express, { Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { Pool } from 'pg';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DB_FILE = path.resolve(process.env.CRM_STORAGE_FILE || path.resolve(process.cwd(), 'data', 'crm_storage.json'));
const DIST_DIR = path.resolve(process.cwd(), 'dist');
const SESSION_SECRET = process.env.SESSION_SECRET || randomBytes(32).toString('hex');
const ENTITY_TYPES = ['users', 'workspaces', 'companies', 'opportunities', 'people', 'tasks', 'activities', 'workflows', 'customObjects', 'meetings', 'notifications', 'trash'];

app.use(express.json({ limit: '1mb' }));

type AuthContext = { user: any; workspace: any };
interface AuthenticatedRequest extends Request {
  authContext?: AuthContext;
}

let postgresPool: Pool | null = null;
let persistedSnapshot: any = null;
let persistenceQueue: Promise<void> = Promise.resolve();
let localDbReadError: Error | null = null;

function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString('base64url')}$${hash.toString('base64url')}`;
}

function verifyPassword(password: string, storedHash: string) {
  const [algorithm, saltText, hashText] = storedHash.split('$');
  if (algorithm !== 'scrypt' || !saltText || !hashText) return false;
  const expected = Buffer.from(hashText, 'base64url');
  const actual = scryptSync(password, Buffer.from(saltText, 'base64url'), expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function encodeTokenPayload(payload: Record<string, unknown>) {
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

function signTokenPayload(payload: string) {
  return createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
}

function decodeSessionToken(token: string) {
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) return null;
  const expected = Buffer.from(signTokenPayload(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    if (!decoded.userId || typeof decoded.exp !== 'number' || decoded.exp <= Date.now()) return null;
    return decoded;
  } catch {
    return null;
  }
}

// Initialize Google GenAI Client on the server
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

function hasGeminiApiKey() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  return Boolean(apiKey && !/^(?:MY_GEMINI_API_KEY|YOUR_GEMINI_API_KEY(?:_HERE)?|YOUR_GEMINI_KEY|YOUR_KEY_HERE)$/i.test(apiKey));
}

// Gemini intermittently returns 429/503 ("high demand", RESOURCE_EXHAUSTED / UNAVAILABLE).
// Retry the same model with backoff, then fall back to the next model, so a transient
// capacity spike never surfaces as a failed AI action.
const GEMINI_MODEL_FALLBACKS = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-2.5-flash'];
const TRANSIENT_GEMINI_ERROR = /\b(429|500|502|503|504)\b|RESOURCE_EXHAUSTED|UNAVAILABLE|overloaded|high demand|fetch failed|ETIMEDOUT|ECONNRESET|timeout/i;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function generateContentResilient(params: { contents: any; config?: any }) {
  let lastError: any;
  for (const model of GEMINI_MODEL_FALLBACKS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await ai.models.generateContent({ ...params, model });
      } catch (err: any) {
        lastError = err;
        const message = String(err?.message || err || '');
        if (!TRANSIENT_GEMINI_ERROR.test(message)) throw err;
        if (attempt < 2) await sleep(800 * (attempt + 1));
      }
    }
    console.warn(`Gemini model ${model} unavailable, trying next fallback.`);
  }
  throw lastError;
}

function buildPipelineSummary(workspace: any) {
  const workspaceId = workspace?.id;
  const openDeals = (db.opportunities || []).filter((deal: any) =>
    deal.workspaceId === workspaceId && !['won', 'lost'].includes(String(deal.stage).toLowerCase()),
  );
  const companies = (db.companies || []).filter((company: any) => company.workspaceId === workspaceId);
  const companyById = new Map(companies.map((company: any) => [company.id, company]));
  const currencyCode = ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD'].includes(workspace?.settings?.currency)
    ? workspace.settings.currency
    : 'USD';
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(amount);
  const total = openDeals.reduce((sum: number, deal: any) => sum + (Number(deal.amount) || 0), 0);
  const weighted = openDeals.reduce((sum: number, deal: any) => {
    const probability = Math.max(0, Math.min(100, Number(deal.probability) || 0));
    return sum + (Number(deal.amount) || 0) * probability / 100;
  }, 0);
  const now = new Date();
  const risks: Array<{ deal: any; reasons: string[] }> = [];

  for (const deal of openDeals) {
    const reasons: string[] = [];
    const company = companyById.get(deal.companyId) ||
      companies.find((item: any) => item.name === deal.companyName);
    const probability = Number(deal.probability);
    const closeDate = typeof deal.closeDate === 'string' ? new Date(deal.closeDate) : null;
    const validCloseDate = closeDate && !Number.isNaN(closeDate.getTime()) ? closeDate : null;

    if (company?.status === 'Churn Risk') reasons.push('linked company is marked Churn Risk');
    if (Number.isFinite(probability) && probability <= 30) reasons.push(`low recorded win probability (${probability}%)`);
    if (validCloseDate && validCloseDate < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
      reasons.push(`close date has passed (${validCloseDate.toLocaleDateString()})`);
    }
    if (reasons.length) risks.push({ deal, reasons });
  }

  const rankedDeals = [...openDeals].sort((left: any, right: any) => (Number(right.amount) || 0) - (Number(left.amount) || 0));
  const lines = [
    '## Open pipeline summary',
    '',
    `- **Open opportunities:** ${openDeals.length}`,
    `- **Open pipeline value:** ${formatCurrency(total)}`,
    `- **Probability-weighted value:** ${formatCurrency(weighted)}`,
    '',
    '### Highest-value open opportunities',
    ...(rankedDeals.length
      ? rankedDeals.slice(0, 5).map((deal: any) =>
        `- **${deal.title || deal.companyName || 'Untitled opportunity'}** — ${formatCurrency(Number(deal.amount) || 0)}; ${deal.stage || 'stage not set'}; ${Number.isFinite(Number(deal.probability)) ? `${deal.probability}% recorded probability` : 'no recorded probability'}; close ${deal.closeDate || 'date not set'}.`,
      )
      : ['- There are no open opportunities in this workspace.']),
    '',
    '### Risk flags',
    ...(risks.length
      ? risks.map(({ deal, reasons }) =>
        `- **${deal.title || deal.companyName || 'Untitled opportunity'}** (${formatCurrency(Number(deal.amount) || 0)}): ${reasons.join('; ')}.`,
      )
      : ['- No overdue close dates, low recorded probabilities (30% or less), or linked companies marked Churn Risk were found in the saved CRM data.']),
    '',
    '_Calculated from saved CRM opportunity probabilities, close dates, and company statuses. It is a data summary, not an AI-generated forecast. Configure `GEMINI_API_KEY` to enable open-ended AI analysis._',
  ];
  return lines.join('\n');
}

// Load persistent database from disk
function loadDb(): any {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);

      // Ensure users and workspaces arrays exist
      if (!parsed.users) parsed.users = [];
      if (!parsed.workspaces) parsed.workspaces = [];

      // Default demo workspace
      if (parsed.workspaces.length === 0) {
        parsed.workspaces.push({
          id: 'ws-demo',
          name: 'Acme Systems (Demo Workspace)',
          ownerId: 'usr-demo',
          createdAt: new Date().toISOString(),
        });
      }

      // Default demo user
      if (parsed.users.length === 0) {
        parsed.users.push({
          id: 'usr-demo',
          name: 'Alex Vance',
          email: 'demo@nexus.corp',
          password: 'password123',
          workspaceId: 'ws-demo',
          role: 'Admin / VP of Sales',
          createdAt: new Date().toISOString(),
        });
      }

      // Ensure all existing records have workspaceId
      ['companies', 'opportunities', 'people', 'tasks', 'activities', 'workflows', 'customObjects', 'meetings', 'notifications', 'trash'].forEach((key) => {
        if (Array.isArray(parsed[key])) {
          parsed[key].forEach((item: any) => {
            if (!item.workspaceId) item.workspaceId = 'ws-demo';
          });
        } else {
          parsed[key] = [];
        }
      });

      return parsed;
    }
  } catch (err) {
    console.error('Error reading crm_storage.json, initializing structure:', err);
    localDbReadError = err instanceof Error ? err : new Error('Unknown local CRM database read error.');
  }

  return {
    users: [
      {
        id: 'usr-demo',
        name: 'Alex Vance',
        email: 'demo@nexus.corp',
        password: 'password123',
        workspaceId: 'ws-demo',
        role: 'Admin / VP of Sales',
        createdAt: new Date().toISOString(),
      },
    ],
    workspaces: [
      {
        id: 'ws-demo',
        name: 'Acme Systems (Demo Workspace)',
        ownerId: 'usr-demo',
        createdAt: new Date().toISOString(),
      },
    ],
    companies: [],
    opportunities: [],
    people: [],
    tasks: [],
    activities: [],
    workflows: [],
    customObjects: [],
    meetings: [],
    notifications: [],
    trash: [],
  };
}

async function persistPostgresSnapshot(snapshot: any) {
  if (!postgresPool) throw new Error('PostgreSQL is not initialized.');
  const client = await postgresPool.connect();
  try {
    await client.query('BEGIN');
    for (const entityType of ENTITY_TYPES) {
      const previous = new Map((persistedSnapshot?.[entityType] || []).map((item: any) => [item.id, item]));
      const nextRecords = snapshot[entityType] || [];
      const next = new Map(nextRecords.map((item: any) => [item.id, item]));
      for (const [id] of previous) {
        if (!next.has(id)) {
          await client.query('DELETE FROM nexus_crm_records WHERE entity_type = $1 AND record_id = $2', [entityType, id]);
        }
      }
      for (const record of nextRecords) {
        if (typeof record.id !== 'string' || !record.id) throw new Error(`Cannot persist ${entityType} record without an ID.`);
        const oldRecord = previous.get(record.id);
        if (oldRecord && JSON.stringify(oldRecord) === JSON.stringify(record)) continue;
        await client.query(
          `INSERT INTO nexus_crm_records (entity_type, record_id, workspace_id, payload)
           VALUES ($1, $2, $3, $4::jsonb)
           ON CONFLICT (entity_type, record_id)
           DO UPDATE SET workspace_id = EXCLUDED.workspace_id, payload = EXCLUDED.payload`,
          [entityType, record.id, typeof record.workspaceId === 'string' ? record.workspaceId : null, JSON.stringify(record)],
        );
      }
    }
    await client.query('COMMIT');
    persistedSnapshot = snapshot;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function initializePersistence() {
  for (const user of db.users) {
    if (!user.passwordHash && typeof user.password === 'string') {
      user.passwordHash = hashPassword(user.password);
      delete user.password;
    }
  }

  if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required in production. Refusing to start with the local JSON file database.');
  }
  const configuredSessionSecret = process.env.SESSION_SECRET;
  if (
    process.env.NODE_ENV === 'production' &&
    (!configuredSessionSecret || configuredSessionSecret.length < 32 || configuredSessionSecret.startsWith('replace_with_a_random_secret'))
  ) {
    throw new Error('SESSION_SECRET must contain at least 32 characters in production.');
  }
  if (!process.env.DATABASE_URL) {
    if (localDbReadError) {
      throw new Error('Unable to read the local CRM database. Refusing to overwrite it; restore a valid backup before restarting.');
    }
    if (!await saveDb(db)) throw new Error('Unable to securely migrate the local CRM database.');
    console.warn('DATABASE_URL is not set; using the local JSON file database. Configure PostgreSQL before production deployment.');
    return;
  }

  postgresPool = new Pool({ connectionString: process.env.DATABASE_URL });
  await postgresPool.query(`
    CREATE TABLE IF NOT EXISTS nexus_crm_records (
      entity_type text NOT NULL,
      record_id text NOT NULL,
      workspace_id text,
      payload jsonb NOT NULL,
      PRIMARY KEY (entity_type, record_id)
    )
  `);
  await postgresPool.query(`
    CREATE INDEX IF NOT EXISTS nexus_crm_records_workspace_idx
    ON nexus_crm_records (workspace_id, entity_type)
  `);
  const result = await postgresPool.query(
    'SELECT entity_type, payload FROM nexus_crm_records WHERE entity_type = ANY($1::text[])',
    [ENTITY_TYPES],
  );
  if (result.rowCount) {
    const loaded: Record<string, any[]> = Object.fromEntries(ENTITY_TYPES.map((type) => [type, []]));
    for (const row of result.rows) {
      if (loaded[row.entity_type]) loaded[row.entity_type].push(row.payload);
    }
    db = loaded;
    persistedSnapshot = JSON.parse(JSON.stringify(loaded));
    for (const user of db.users) {
      if (!user.passwordHash && typeof user.password === 'string') {
        user.passwordHash = hashPassword(user.password);
        delete user.password;
      }
    }
    await persistPostgresSnapshot(db);
    return;
  }
  persistedSnapshot = Object.fromEntries(ENTITY_TYPES.map((type) => [type, []]));
  if (process.env.DATABASE_IMPORT_JSON === 'true') {
    if (localDbReadError) throw new Error('Cannot import the local CRM database because its JSON file could not be read.');
    await persistPostgresSnapshot(JSON.parse(JSON.stringify(db)));
    console.info('Initialized PostgreSQL storage from the existing local CRM dataset by explicit request.');
    return;
  }
  db = Object.fromEntries(ENTITY_TYPES.map((type) => [type, []]));
  await persistPostgresSnapshot(JSON.parse(JSON.stringify(db)));
  console.info('PostgreSQL is empty; starting with a clean database. Create the first workspace through registration.');
}

async function saveDb(data: any, res?: Response) {
  try {
    if (postgresPool) {
      const snapshot = JSON.parse(JSON.stringify(data));
      const currentSave = persistenceQueue.then(() => persistPostgresSnapshot(snapshot));
      persistenceQueue = currentSave.then(() => undefined, () => undefined);
      await currentSave;
    } else {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const tempFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    }
    return true;
  } catch (err) {
    console.error('Error saving CRM data:', err);
    if (res && !res.headersSent) {
      res.status(500).json({ error: 'Unable to save CRM changes. Check the server database connection and logs.' });
    }
    return false;
  }
}

let db = loadDb();

function addNotification(workspaceId: string, title: string, message: string, type = 'activity') {
  db.notifications.unshift({
    id: `ntf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    workspaceId,
    title,
    message,
    type,
    createdAt: new Date().toISOString(),
    read: false,
  });
}

function moveToTrash(entityType: string, record: any, workspaceId: string) {
  db.trash.unshift({
    id: `trash-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    entityType,
    record: { ...record },
    workspaceId,
    deletedAt: new Date().toISOString(),
  });
}

// Helper: Extract current user & workspace from Bearer Token
function resolveAuthContext(req: Request): AuthContext | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;

  try {
    const decoded = decodeSessionToken(authHeader.slice('Bearer '.length));
    if (!decoded) return null;
    const user = db.users.find((u: any) => u.id === decoded.userId);
    if (!user) return null;
    const workspace = db.workspaces.find((w: any) => w.id === user.workspaceId);
    if (!workspace) return null;
    return { user, workspace };
  } catch (err) {
    console.warn('Error parsing auth token:', err);
  }
  return null;
}

function getAuthContext(req: Request): AuthContext {
  const context = (req as AuthenticatedRequest).authContext;
  if (!context) throw new Error('Authenticated request context is unavailable.');
  return context;
}

app.use('/api', (req: Request, res: Response, next) => {
  const publicRoutes = new Set([
    'POST /auth/register',
    'POST /auth/login',
    'GET /auth/google/config',
    'POST /auth/google',
  ]);
  if (publicRoutes.has(`${req.method} ${req.path.replace(/^\/api/, '')}`)) return next();
  const authContext = resolveAuthContext(req);
  if (!authContext) return res.status(401).json({ error: 'Authentication required. Sign in and retry.' });
  (req as AuthenticatedRequest).authContext = authContext;
  next();
});

// Generate token
function generateToken(user: any) {
  const payload = encodeTokenPayload({
    userId: user.id,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });
  return `${payload}.${signTokenPayload(payload)}`;
}

// ==========================================
// 1. AUTHENTICATION & WORKSPACE ENDPOINTS
// ==========================================

// Register New User & Create Custom Workspace
app.post('/api/auth/register', async (req: Request, res: Response) => {
  const { name, email, password, workspaceName, seedDemoData } = req.body;

  if (typeof email !== 'string' || typeof password !== 'string' || !password.trim()) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  if (password.length < 12 || password.length > 256) {
    return res.status(400).json({ error: 'Password must be between 12 and 256 characters.' });
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = db.users.find((u: any) => u.email.toLowerCase() === normalizedEmail);

  if (existingUser) {
    return res.status(409).json({ error: 'An account with this email already exists. Please log in.' });
  }

  const userId = `usr-${Date.now()}`;
  const workspaceId = `ws-${Date.now()}`;
  const finalWorkspaceName = workspaceName?.trim() || `${name?.trim() || 'My'} Workspace`;

  // Create Custom Workspace
  const newWorkspace = {
    id: workspaceId,
    name: finalWorkspaceName,
    ownerId: userId,
    createdAt: new Date().toISOString(),
  };

  // Create User Account
  const newUser = {
    id: userId,
    name: name?.trim() || 'Workspace Admin',
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    workspaceId: workspaceId,
    role: 'Admin / Owner',
    createdAt: new Date().toISOString(),
  };

  db.workspaces.push(newWorkspace);
  db.users.push(newUser);

  // Optional: Seed workspace with initial CRM records
  if (seedDemoData !== false) {
    // Add default initial company
    const newComp = {
      id: `comp-${Date.now()}-1`,
      workspaceId: workspaceId,
      name: 'Starlight Dynamics',
      domain: 'starlight.io',
      tier: 'Enterprise',
      arr: 120000,
      dealCount: 1,
      city: 'San Francisco',
      country: 'USA',
      employees: 65,
      primaryContact: 'Elena Chen',
      owner: newUser.name,
      status: 'Active',
      notes: 'Initial enterprise account provisioned in your new workspace.',
      tags: ['SaaS', 'Expansion'],
      techStack: ['TypeScript', 'PostgreSQL', 'React'],
      aiHealthScore: 92,
    };
    db.companies.push(newComp);

    // Add default opportunity
    db.opportunities.push({
      id: `deal-${Date.now()}-1`,
      workspaceId: workspaceId,
      title: 'Starlight — Enterprise Workspace Rollout',
      companyId: newComp.id,
      companyName: newComp.name,
      amount: 85000,
      stage: 'proposal',
      probability: 60,
      closeDate: '2026-11-30',
      owner: newUser.name,
    });

    // Add default contact
    db.people.push({
      id: `peo-${Date.now()}-1`,
      workspaceId: workspaceId,
      name: 'Elena Chen',
      email: 'elena@starlight.io',
      title: 'VP of Product',
      companyId: newComp.id,
      companyName: newComp.name,
      phone: '+1 (555) 012-8899',
      status: 'Champion',
      lastActivity: 'Just now',
    });

    // Add default task
    db.tasks.push({
      id: `tsk-${Date.now()}-1`,
      workspaceId: workspaceId,
      title: 'Schedule initial product walkthrough with Elena Chen',
      completed: false,
      dueDate: 'Tomorrow',
      assignedTo: newUser.name,
      priority: 'high',
      relatedEntity: newComp.name,
      entityId: newComp.id,
    });

    // Add default workflow
    db.workflows.push({
      id: `wf-${Date.now()}-1`,
      workspaceId: workspaceId,
      name: 'Auto-Create Onboarding Task on Closed Won',
      trigger: "deal.stage_changed === 'won'",
      action: 'create_task && send_notification',
      enabled: true,
      executionCount: 0,
    });
  }

  if (!await saveDb(db, res)) return;

  const token = generateToken(newUser);

  res.status(201).json({
    status: 'success',
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      workspaceId: newUser.workspaceId,
      role: newUser.role,
      workspaceName: newWorkspace.name,
    },
    workspace: newWorkspace,
    token,
  });
});

// Login Existing User
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  if (password.length > 256) return res.status(400).json({ error: 'Password is too long.' });

  const normalizedEmail = email.trim().toLowerCase();
  const user = db.users.find(
    (u: any) => u.email.toLowerCase() === normalizedEmail && typeof u.passwordHash === 'string' && verifyPassword(password, u.passwordHash)
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password. Please try again or create a new workspace.' });
  }

  const workspace = db.workspaces.find((w: any) => w.id === user.workspaceId) || {
    id: user.workspaceId,
    name: 'Custom Workspace',
  };

  const token = generateToken(user);

  res.json({
    status: 'success',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      workspaceId: user.workspaceId,
      role: user.role,
      workspaceName: workspace.name,
    },
    workspace,
    token,
  });
});

// Google OAuth Public Config (Provides server-configured Client ID if set in environment)
app.get('/api/auth/google/config', (_req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || null;
  res.json({ clientId });
});

// Google Authentication (Authentic Google ID Token Verification + Development Fallback)
app.post('/api/auth/google', async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;
    let userEmail: string;
    let userName: string;
    let userAvatar: string;
    let googleSub: string | null = null;
    let isCryptographicallyVerified = false;

    // 1. If Google ID Token is provided, cryptographically verify with Google OAuth2 servers
    if (credential && typeof credential === 'string') {
      try {
        const verifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`;
        const verifyRes = await fetch(verifyUrl);

        if (!verifyRes.ok) {
          const errData: any = await verifyRes.json().catch(() => ({}));
          return res.status(401).json({
            error: `Google verification failed: ${errData.error_description || 'Invalid or expired Google ID Token'}`,
          });
        }

        const tokenInfo: any = await verifyRes.json();
        const configuredClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
        if (!configuredClientId || tokenInfo.aud !== configuredClientId) {
          return res.status(401).json({ error: 'Google ID token was issued for a different or unconfigured client.' });
        }

        // Ensure email is verified by Google
        if (tokenInfo.email_verified !== 'true' && tokenInfo.email_verified !== true) {
          return res.status(401).json({ error: 'This Google account email has not been verified by Google.' });
        }

        userEmail = tokenInfo.email.trim().toLowerCase();
        userName = tokenInfo.name?.trim() || tokenInfo.given_name?.trim() || userEmail.split('@')[0];
        userAvatar = tokenInfo.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userName)}`;
        googleSub = tokenInfo.sub;
        isCryptographicallyVerified = true;
      } catch (err: any) {
        console.error('Google token verification error:', err);
        return res.status(500).json({ error: 'Unable to reach Google OAuth verification servers: ' + err.message });
      }
    } else {
      return res.status(401).json({ error: 'A verified Google ID token is required. Use email and password sign-in if Google OAuth is not configured.' });
    }

    let user = db.users.find((u: any) => u.email.toLowerCase() === userEmail);
    let workspace;

    if (!user) {
      const userId = `usr-${Date.now()}`;
      const workspaceId = `ws-${Date.now()}`;

      workspace = {
        id: workspaceId,
        name: `${userName}'s Workspace`,
        ownerId: userId,
        createdAt: new Date().toISOString(),
        onboardingCompleted: false,
      };

      user = {
        id: userId,
        name: userName,
        email: userEmail,
        avatar: userAvatar,
        googleId: googleSub,
        workspaceId: workspaceId,
        role: 'Admin / Owner',
        createdAt: new Date().toISOString(),
      };

      db.workspaces.push(workspace);
      db.users.push(user);

      if (!await saveDb(db, res)) return;
    } else {
      workspace = db.workspaces.find((w: any) => w.id === user.workspaceId);
      if (userAvatar) user.avatar = userAvatar;
      if (userName && !user.name) user.name = userName;
      if (googleSub) user.googleId = googleSub;
      if (workspace && workspace.onboardingCompleted === undefined) workspace.onboardingCompleted = true;
      if (!await saveDb(db, res)) return;
    }

    const token = generateToken(user);

    res.json({
      status: 'success',
      verified: isCryptographicallyVerified,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        workspaceId: user.workspaceId,
        role: user.role,
        workspaceName: workspace?.name || 'Custom Workspace',
      },
      workspace,
      token,
      requiresOnboarding: workspace?.onboardingCompleted === false,
    });
  } catch (err: any) {
    console.error('Google auth error:', err);
    res.status(500).json({ error: 'Google authentication failed: ' + err.message });
  }
});

// Get Current User Profile & Workspace
app.get('/api/auth/me', (req: Request, res: Response) => {
  const { user, workspace } = getAuthContext(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthenticated' });
  }

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      workspaceId: user.workspaceId,
      role: user.role,
      workspaceName: workspace?.name || 'Custom Workspace',
    },
    workspace,
  });
});

app.patch('/api/auth/me', async (req: Request, res: Response) => {
  const { user, workspace } = getAuthContext(req);
  if (!user) return res.status(401).json({ error: 'Unauthenticated' });
  const { name } = req.body || {};
  if (typeof name !== 'string' || !name.trim()) return res.status(400).json({ error: 'Name is required.' });
  if (name.trim().length > 100) return res.status(400).json({ error: 'Name must be 100 characters or fewer.' });
  user.name = name.trim();
  if (!await saveDb(db, res)) return;
  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      workspaceId: user.workspaceId,
      role: user.role,
      workspaceName: workspace?.name || 'Custom Workspace',
    },
  });
});

const WORKSPACE_SETTING_KEYS = [
  'currency', 'defaultCompanyTier', 'weekStartsOn', 'defaultCalendarView', 'emailSenderName', 'emailSenderAddress',
  'appearance', 'language', 'interfaceScale', 'recordNavigation', 'timezone', 'dateFormat', 'timeFormat',
  'numberFormat', 'emailImportScope', 'emailVisibility', 'autoCreateEmailContacts', 'excludeGroupEmails',
  'excludeNonProfessionalEmails', 'calendarEventVisibility', 'autoCreateCalendarContacts', 'syncInternalEmails',
  'emailBlocklist', 'sidebarItems',
];

// Workspace settings are deliberately limited to non-secret preferences.
app.get('/api/workspace/settings', (req: Request, res: Response) => {
  const { workspace } = getAuthContext(req);
  if (!workspace) return res.status(401).json({ error: 'Unauthenticated' });
  const settings = Object.fromEntries(Object.entries(workspace.settings || {}).filter(([key]) => WORKSPACE_SETTING_KEYS.includes(key)));
  res.json({ settings });
});

app.patch('/api/workspace/settings', async (req: Request, res: Response) => {
  const { workspace } = getAuthContext(req);
  if (!workspace) return res.status(401).json({ error: 'Unauthenticated' });
  const input = req.body?.settings;
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return res.status(400).json({ error: 'Settings must be provided as an object.' });
  }

  const unsupportedSetting = Object.keys(input).find((key) => !WORKSPACE_SETTING_KEYS.includes(key));
  if (unsupportedSetting) return res.status(400).json({ error: `Unsupported workspace setting: ${unsupportedSetting}` });

  const next = Object.fromEntries(Object.entries(workspace.settings || {}).filter(([key]) => WORKSPACE_SETTING_KEYS.includes(key)));
  const enumSettings: Record<string, string[]> = {
    appearance: ['light', 'dark', 'system'],
    language: ['English'],
    interfaceScale: ['compact', 'regular', 'comfortable'],
    recordNavigation: ['side-panel', 'full-page'],
    dateFormat: ['locale', 'MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'],
    timeFormat: ['12h', '24h'],
    numberFormat: ['en-US', 'en-IN', 'de-DE', 'fr-FR'],
    emailImportScope: ['all', 'last-30-days', 'none'],
    emailVisibility: ['participants-only', 'all', 'metadata'],
    calendarEventVisibility: ['metadata', 'everything'],
  };
  for (const [key, allowedValues] of Object.entries(enumSettings)) {
    if (input[key] !== undefined) {
      if (typeof input[key] !== 'string' || !allowedValues.includes(input[key])) {
        return res.status(400).json({ error: `Invalid value for ${key}.` });
      }
      next[key] = input[key];
    }
  }
  const booleanSettings = [
    'autoCreateEmailContacts', 'excludeGroupEmails', 'excludeNonProfessionalEmails',
    'autoCreateCalendarContacts', 'syncInternalEmails',
  ];
  for (const key of booleanSettings) {
    if (input[key] !== undefined) {
      if (typeof input[key] !== 'boolean') return res.status(400).json({ error: `${key} must be a boolean.` });
      next[key] = input[key];
    }
  }
  if (input.currency !== undefined) {
    if (!['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD'].includes(input.currency)) return res.status(400).json({ error: 'Choose a supported currency.' });
    next.currency = input.currency;
  }
  if (input.defaultCompanyTier !== undefined) {
    if (!['Enterprise', 'Mid-Market', 'Growth', 'Seed'].includes(input.defaultCompanyTier)) return res.status(400).json({ error: 'Choose a valid default company tier.' });
    next.defaultCompanyTier = input.defaultCompanyTier;
  }
  if (input.weekStartsOn !== undefined) {
    if (!['sunday', 'monday'].includes(input.weekStartsOn)) return res.status(400).json({ error: 'Week start must be Sunday or Monday.' });
    next.weekStartsOn = input.weekStartsOn;
  }
  if (input.defaultCalendarView !== undefined) {
    if (!['month', 'week'].includes(input.defaultCalendarView)) return res.status(400).json({ error: 'Calendar view must be month or week.' });
    next.defaultCalendarView = input.defaultCalendarView;
  }
  if (input.emailSenderName !== undefined) {
    if (typeof input.emailSenderName !== 'string' || input.emailSenderName.length > 100) return res.status(400).json({ error: 'Sender name must be 100 characters or fewer.' });
    next.emailSenderName = input.emailSenderName.trim();
  }
  if (input.emailSenderAddress !== undefined) {
    if (typeof input.emailSenderAddress !== 'string' || (input.emailSenderAddress && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.emailSenderAddress))) {
      return res.status(400).json({ error: 'Enter a valid sender email address.' });
    }
    next.emailSenderAddress = input.emailSenderAddress.trim();
  }
  if (input.timezone !== undefined) {
    if (typeof input.timezone !== 'string' || input.timezone.length > 100) return res.status(400).json({ error: 'Enter a valid timezone.' });
    try {
      new Intl.DateTimeFormat('en', { timeZone: input.timezone });
    } catch {
      return res.status(400).json({ error: 'Enter a valid timezone.' });
    }
    next.timezone = input.timezone;
  }
  if (input.emailBlocklist !== undefined) {
    if (!Array.isArray(input.emailBlocklist) || input.emailBlocklist.length > 100 || input.emailBlocklist.some((item: unknown) =>
      typeof item !== 'string' || item.length > 254 || !/^(?:[^\s@]+@[^\s@]+\.[^\s@]+|(?:[a-z0-9-]+\.)+[a-z]{2,})$/i.test(item),
    )) {
      return res.status(400).json({ error: 'Blocklist entries must be valid email addresses or domains (up to 100 entries).' });
    }
    next.emailBlocklist = Array.from(new Set(input.emailBlocklist.map((item: string) => item.trim().toLowerCase())));
  }
  if (input.sidebarItems !== undefined) {
    const validItems = ['companies', 'people', 'opportunities', 'tasks', 'notes', 'analytics', 'calendar', 'reports', 'trash', 'schema'];
    if (!Array.isArray(input.sidebarItems) || input.sidebarItems.length > validItems.length ||
      input.sidebarItems.some((item: unknown) => typeof item !== 'string' || !validItems.includes(item)) ||
      new Set(input.sidebarItems).size !== input.sidebarItems.length) {
      return res.status(400).json({ error: 'Choose valid, unique workspace navigation items.' });
    }
    next.sidebarItems = input.sidebarItems;
  }

  workspace.settings = next;
  if (!await saveDb(db, res)) return;
  res.json({ settings: next });
});

app.get('/api/workspace/members', (req: Request, res: Response) => {
  const { workspace } = getAuthContext(req);
  if (!workspace) return res.status(401).json({ error: 'Unauthenticated' });
  const members = db.users
    .filter((member: any) => member.workspaceId === workspace.id)
    .map((member: any) => ({
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role,
      createdAt: member.createdAt,
    }));
  res.json({ members });
});

// Update Workspace Name
app.patch('/api/workspace', async (req: Request, res: Response) => {
  const { workspace } = getAuthContext(req);
  if (!workspace) return res.status(401).json({ error: 'Unauthenticated' });

  const { name, companyName, website, industry, companySize, country } = req.body;
  if (typeof name !== 'string' || !name.trim()) return res.status(400).json({ error: 'Workspace name is required.' });
  if (name.trim().length > 100) return res.status(400).json({ error: 'Workspace name must be 100 characters or fewer.' });
  let normalizedWebsite: string | undefined;
  if (companyName !== undefined) {
    if (typeof companyName !== 'string' || !companyName.trim() || companyName.trim().length > 100) {
      return res.status(400).json({ error: 'Company name is required and must be 100 characters or fewer.' });
    }
  }
  if (website !== undefined) {
    if (typeof website !== 'string' || website.length > 2048) return res.status(400).json({ error: 'Enter a valid company website.' });
    if (website.trim()) {
      try {
        const parsedWebsite = new URL(/^https?:\/\//i.test(website) ? website : `https://${website}`);
        if (!['http:', 'https:'].includes(parsedWebsite.protocol)) throw new Error('Invalid protocol');
        normalizedWebsite = parsedWebsite.toString();
      } catch {
        return res.status(400).json({ error: 'Enter a valid company website.' });
      }
    } else {
      normalizedWebsite = '';
    }
  }
  if (industry !== undefined) {
    if (typeof industry !== 'string' || industry.trim().length > 100) return res.status(400).json({ error: 'Industry must be 100 characters or fewer.' });
  }
  if (companySize !== undefined) {
    if (typeof companySize !== 'string' || !['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'].includes(companySize)) {
      return res.status(400).json({ error: 'Choose a valid company size.' });
    }
  }
  if (country !== undefined) {
    if (typeof country !== 'string' || country.trim().length > 100) return res.status(400).json({ error: 'Country must be 100 characters or fewer.' });
  }
  workspace.name = name.trim();
  if (companyName !== undefined) workspace.companyName = companyName.trim();
  if (normalizedWebsite !== undefined) workspace.companyWebsite = normalizedWebsite;
  if (industry !== undefined) workspace.industry = industry.trim();
  if (companySize !== undefined) workspace.companySize = companySize;
  if (country !== undefined) workspace.country = country.trim();
  if (!await saveDb(db, res)) return;
  res.json({ workspace });
});

app.patch('/api/workspace/onboarding', async (req: Request, res: Response) => {
  const { workspace } = getAuthContext(req);
  if (!workspace) return res.status(401).json({ error: 'Unauthenticated' });

  const { companyName, website, industry, companySize, country } = req.body || {};
  if (typeof companyName !== 'string' || !companyName.trim()) {
    return res.status(400).json({ error: 'Company name is required.' });
  }
  if (companyName.trim().length > 100) return res.status(400).json({ error: 'Company name must be 100 characters or fewer.' });
  if (typeof website !== 'string' || website.length > 2048) return res.status(400).json({ error: 'Enter a valid company website.' });
  let normalizedWebsite = '';
  if (website.trim()) {
    try {
      const parsedWebsite = new URL(/^https?:\/\//i.test(website) ? website : `https://${website}`);
      if (!['http:', 'https:'].includes(parsedWebsite.protocol)) throw new Error('Invalid protocol');
      normalizedWebsite = parsedWebsite.toString();
    } catch {
      return res.status(400).json({ error: 'Enter a valid company website.' });
    }
  }
  if (typeof industry !== 'string' || industry.trim().length > 100) return res.status(400).json({ error: 'Industry must be 100 characters or fewer.' });
  if (typeof companySize !== 'string' || !['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'].includes(companySize)) {
    return res.status(400).json({ error: 'Choose a valid company size.' });
  }
  if (typeof country !== 'string' || country.trim().length > 100) return res.status(400).json({ error: 'Country must be 100 characters or fewer.' });

  workspace.name = companyName.trim();
  workspace.companyName = companyName.trim();
  workspace.companyWebsite = normalizedWebsite;
  workspace.industry = industry.trim();
  workspace.companySize = companySize;
  workspace.country = country.trim();
  workspace.onboardingCompleted = true;
  if (!await saveDb(db, res)) return;
  res.json({ workspace });
});

// ==========================================
// 2. MULTI-TENANT CRM CRUD ENDPOINTS
// ==========================================

// COMPANIES
app.get('/api/companies', (req: Request, res: Response) => {
  const { workspace } = getAuthContext(req);
  const targetWsId = workspace?.id || 'ws-demo';
  const companies = (db.companies || []).filter((c: any) => c.workspaceId === targetWsId);
  res.json({ companies });
});

app.post('/api/companies', async (req: Request, res: Response) => {
  const { user, workspace } = getAuthContext(req);
  const targetWsId = workspace?.id || 'ws-demo';

  const newComp = {
    id: `comp-${Date.now()}`,
    workspaceId: targetWsId,
    name: req.body.name || 'New Company',
    domain: req.body.domain || 'example.com',
    tier: req.body.tier || 'Growth',
    arr: Number(req.body.arr) || 25000,
    dealCount: 1,
    city: req.body.city || 'San Francisco',
    country: req.body.country || 'USA',
    employees: Number(req.body.employees) || 10,
    primaryContact: req.body.primaryContact || 'Lead Contact',
    owner: user?.name || 'Admin',
    status: req.body.status || 'Prospect',
    notes: req.body.notes || 'Created in custom workspace.',
    tags: req.body.tags || ['Inbound'],
    techStack: req.body.techStack || ['TypeScript', 'React'],
    aiHealthScore: 85,
  };

  db.companies.unshift(newComp);
  db.activities.unshift({
    id: `act-${Date.now()}`,
    workspaceId: targetWsId,
    companyId: newComp.id,
    type: 'note',
    title: 'Account Provisioned',
    description: `Company "${newComp.name}" added to workspace "${workspace?.name}".`,
    timestamp: 'Just now',
    author: user?.name || 'Admin',
  });

  addNotification(targetWsId, 'Company added', `${newComp.name} was added to the workspace.`);
  if (!await saveDb(db, res)) return;
  res.status(201).json({ company: newComp });
});

app.patch('/api/companies/:id', async (req: Request, res: Response) => {
  const { workspace } = getAuthContext(req);
  const comp = db.companies.find((c: any) => c.id === req.params.id && c.workspaceId === workspace?.id);
  if (!comp) return res.status(404).json({ error: 'Company not found' });

  Object.assign(comp, req.body);
  if (!await saveDb(db, res)) return;
  res.json({ company: comp });
});

app.delete('/api/companies/:id', async (req: Request, res: Response) => {
  const { workspace } = getAuthContext(req);
  const targetWsId = workspace?.id || 'ws-demo';
  const index = db.companies.findIndex((company: any) => company.id === req.params.id && company.workspaceId === targetWsId);
  if (index < 0) return res.status(404).json({ error: 'Company not found' });
  const [company] = db.companies.splice(index, 1);
  moveToTrash('company', company, targetWsId);
  const relatedDeals = db.opportunities.filter((deal: any) => deal.companyId === company.id && deal.workspaceId === targetWsId);
  relatedDeals.forEach((deal: any) => moveToTrash('deal', deal, targetWsId));
  db.opportunities = db.opportunities.filter((deal: any) => !(deal.companyId === company.id && deal.workspaceId === targetWsId));
  addNotification(targetWsId, 'Company moved to trash', `${company.name} can be restored from Trash.`);
  if (!await saveDb(db, res)) return;
  res.json({ success: true, deletedId: req.params.id });
});

app.post('/api/companies/bulk-delete', async (req: Request, res: Response) => {
  const { workspace } = getAuthContext(req);
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== 'string')) {
    return res.status(400).json({ error: 'ids must be an array of record IDs' });
  }
  const targetWsId = workspace?.id || 'ws-demo';
  const toTrash = db.companies.filter((company: any) => ids.includes(company.id) && company.workspaceId === targetWsId);
  toTrash.forEach((company: any) => moveToTrash('company', company, targetWsId));
  const companyIds = new Set(toTrash.map((company: any) => company.id));
  const relatedDeals = db.opportunities.filter((deal: any) => companyIds.has(deal.companyId) && deal.workspaceId === targetWsId);
  relatedDeals.forEach((deal: any) => moveToTrash('deal', deal, targetWsId));
  db.opportunities = db.opportunities.filter((deal: any) => !(companyIds.has(deal.companyId) && deal.workspaceId === targetWsId));
  db.companies = db.companies.filter((company: any) => !(ids.includes(company.id) && company.workspaceId === targetWsId));
  if (toTrash.length) {
    addNotification(targetWsId, 'Companies moved to trash', `${toTrash.length} ${toTrash.length === 1 ? 'company was' : 'companies were'} moved to Trash.`);
  }
  if (!await saveDb(db, res)) return;
  res.json({ success: true, deletedCount: toTrash.length });
});

app.post('/api/import/companies', async (req: Request, res: Response) => {
  const { user, workspace } = getAuthContext(req);
  const targetWsId = workspace?.id || 'ws-demo';
  const rows = req.body?.rows;
  if (!Array.isArray(rows) || rows.length === 0 || rows.length > 500) {
    return res.status(400).json({ error: 'rows must contain between 1 and 500 companies' });
  }

  const allowedTiers = ['Enterprise', 'Mid-Market', 'Growth', 'Seed'];
  const allowedStatuses = ['Active', 'Churn Risk', 'Prospect', 'Onboarding'];
  const errors: string[] = [];
  const imported: any[] = [];
  rows.forEach((row: any, index: number) => {
    const name = typeof row?.name === 'string' ? row.name.trim() : '';
    if (!name) {
      errors.push(`Row ${index + 2}: company name is required.`);
      return;
    }
    if (name.length > 200) {
      errors.push(`Row ${index + 2}: company name must be 200 characters or fewer.`);
      return;
    }
    if (typeof row.domain === 'string' && row.domain.trim().length > 255) {
      errors.push(`Row ${index + 2}: domain must be 255 characters or fewer.`);
      return;
    }
    const tierValue = typeof row.tier === 'string' ? row.tier.trim().toLowerCase() : '';
    const tier = allowedTiers.find((value) => value.toLowerCase() === tierValue) || 'Growth';
    const statusValue = typeof row.status === 'string' ? row.status.trim().toLowerCase() : '';
    const status = allowedStatuses.find((value) => value.toLowerCase() === statusValue) || 'Prospect';
    const rawArr = row.arr === undefined || row.arr === '' ? 0 : Number(String(row.arr).replace(/[$,]/g, ''));
    if (!Number.isFinite(rawArr) || rawArr < 0) {
      errors.push(`Row ${index + 2}: ARR must be a non-negative number.`);
      return;
    }
    const company = {
      id: `comp-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
      workspaceId: targetWsId,
      name,
      domain: typeof row.domain === 'string' && row.domain.trim() ? row.domain.trim() : `${name.toLowerCase().replace(/[^a-z0-9]+/g, '')}.com`,
      tier,
      arr: rawArr,
      dealCount: 0,
      city: typeof row.city === 'string' ? row.city.trim().slice(0, 100) : '',
      country: typeof row.country === 'string' ? row.country.trim().slice(0, 100) : '',
      employees: 0,
      primaryContact: '',
      owner: typeof row.owner === 'string' && row.owner.trim() ? row.owner.trim().slice(0, 100) : user?.name || 'Admin',
      status,
      notes: 'Imported from CSV.',
      tags: [],
      aiHealthScore: 0,
    };
    imported.push(company);
  });

  db.companies.unshift(...imported);
  if (imported.length) {
    addNotification(targetWsId, 'Company CSV import complete', `${imported.length} ${imported.length === 1 ? 'company was' : 'companies were'} imported.`);
  }
  if (!await saveDb(db, res)) return;
  res.status(201).json({ importedCount: imported.length, errors, companies: imported });
});

app.get('/api/trash', (req: Request, res: Response) => {
  const { workspace } = getAuthContext(req);
  const targetWsId = workspace?.id || 'ws-demo';
  res.json({ records: (db.trash || []).filter((item: any) => item.workspaceId === targetWsId) });
});

app.post('/api/trash/:id/restore', async (req: Request, res: Response) => {
  const { workspace } = getAuthContext(req);
  const targetWsId = workspace?.id || 'ws-demo';
  const index = db.trash.findIndex((item: any) => item.id === req.params.id && item.workspaceId === targetWsId);
  if (index < 0) return res.status(404).json({ error: 'Trashed record not found' });
  const [item] = db.trash.splice(index, 1);
  const collectionByType: Record<string, string> = { company: 'companies', deal: 'opportunities' };
  const collection = collectionByType[item.entityType];
  if (!collection || !Array.isArray(db[collection])) {
    db.trash.splice(index, 0, item);
    return res.status(400).json({ error: 'This record type cannot be restored' });
  }
  db[collection].unshift(item.record);
  if (item.entityType === 'company') {
    const dealTrashRecords = db.trash.filter((trashed: any) =>
      trashed.workspaceId === targetWsId && trashed.entityType === 'deal' && trashed.record.companyId === item.record.id
    );
    dealTrashRecords.forEach((trashed: any) => db.opportunities.unshift(trashed.record));
    const restoredDealTrashIds = new Set(dealTrashRecords.map((trashed: any) => trashed.id));
    db.trash = db.trash.filter((trashed: any) => !restoredDealTrashIds.has(trashed.id));
  }
  addNotification(targetWsId, 'Record restored', `${item.record.name || item.record.title || 'Record'} was restored from Trash.`);
  if (!await saveDb(db, res)) return;
  res.json({ success: true, record: item.record });
});

app.delete('/api/trash/:id', async (req: Request, res: Response) => {
  const { workspace } = getAuthContext(req);
  const targetWsId = workspace?.id || 'ws-demo';
  const index = db.trash.findIndex((item: any) => item.id === req.params.id && item.workspaceId === targetWsId);
  if (index < 0) return res.status(404).json({ error: 'Trashed record not found' });
  db.trash.splice(index, 1);
  if (!await saveDb(db, res)) return;
  res.json({ success: true });
});

// OPPORTUNITIES / DEALS
app.get('/api/opportunities', (req: Request, res: Response) => {
  const { workspace } = getAuthContext(req);
  const opportunities = (db.opportunities || []).filter((o: any) => o.workspaceId === workspace?.id);
  res.json({ opportunities });
});

app.post('/api/opportunities', async (req: Request, res: Response) => {
  const { user, workspace } = getAuthContext(req);
  const targetWsId = workspace?.id || 'ws-demo';

  const newDeal = {
    id: `deal-${Date.now()}`,
    workspaceId: targetWsId,
    title: req.body.title || 'New Deal',
    companyId: req.body.companyId,
    companyName: req.body.companyName || 'Acme',
    amount: Number(req.body.amount) || 50000,
    stage: req.body.stage || 'prospect',
    probability: Number(req.body.probability) || 20,
    closeDate: req.body.closeDate || '2026-11-30',
    owner: user?.name || 'Admin',
  };

  db.opportunities.unshift(newDeal);
  if (!await saveDb(db, res)) return;
  res.status(201).json({ deal: newDeal });
});

app.patch('/api/opportunities/:id/stage', async (req: Request, res: Response) => {
  const { user, workspace } = getAuthContext(req);
  const deal = db.opportunities.find((d: any) => d.id === req.params.id && d.workspaceId === workspace?.id);
  if (!deal) return res.status(404).json({ error: 'Deal not found' });

  const oldStage = deal.stage;
  deal.stage = req.body.stage;

  db.activities.unshift({
    id: `act-${Date.now()}`,
    workspaceId: workspace?.id,
    companyId: deal.companyId,
    type: 'stage_change',
    title: `Stage Changed: ${oldStage.toUpperCase()} → ${deal.stage.toUpperCase()}`,
    description: `Deal "${deal.title}" moved to ${deal.stage} stage.`,
    timestamp: 'Just now',
    author: user?.name || 'Admin',
  });

  if (deal.stage === 'won' && oldStage !== 'won') {
    db.tasks.unshift({
      id: `tsk-${Date.now()}`,
      workspaceId: workspace?.id,
      title: `Kickoff Onboarding for ${deal.companyName}`,
      completed: false,
      dueDate: 'In 3 days',
      assignedTo: user?.name || 'Admin',
      priority: 'high',
      relatedEntity: deal.companyName,
      entityId: deal.companyId,
    });
    addNotification(workspace?.id || 'ws-demo', 'Deal won', `${deal.title} was marked closed won.`);
  }

  if (!await saveDb(db, res)) return;
  res.json({ deal });
});

// PEOPLE / CONTACTS
app.get('/api/people', (req: Request, res: Response) => {
  const { workspace } = getAuthContext(req);
  const people = (db.people || []).filter((p: any) => p.workspaceId === workspace?.id);
  res.json({ people });
});

app.post('/api/people', async (req: Request, res: Response) => {
  const { workspace } = getAuthContext(req);
  const newPerson = {
    id: `peo-${Date.now()}`,
    workspaceId: workspace?.id,
    name: req.body.name || 'New Contact',
    email: req.body.email || 'contact@example.com',
    title: req.body.title || 'Manager',
    companyId: req.body.companyId,
    companyName: req.body.companyName || 'Target Company',
    phone: req.body.phone || '+1 (555) 0199',
    status: req.body.status || 'Lead',
    lastActivity: 'Just now',
  };

  db.people.unshift(newPerson);
  if (!await saveDb(db, res)) return;
  res.status(201).json({ person: newPerson });
});

// TASKS
app.get('/api/tasks', (req: Request, res: Response) => {
  const { workspace } = getAuthContext(req);
  const tasks = (db.tasks || []).filter((t: any) => t.workspaceId === workspace?.id);
  res.json({ tasks });
});

app.post('/api/tasks', async (req: Request, res: Response) => {
  const { user, workspace } = getAuthContext(req);
  const newTask = {
    id: `tsk-${Date.now()}`,
    workspaceId: workspace?.id,
    title: req.body.title || 'New Task',
    completed: false,
    dueDate: req.body.dueDate || 'Tomorrow',
    assignedTo: req.body.assignedTo || user?.name || 'Admin',
    priority: req.body.priority || 'medium',
    relatedEntity: req.body.relatedEntity || 'General',
    entityId: req.body.entityId || null,
  };

  db.tasks.unshift(newTask);
  if (!await saveDb(db, res)) return;
  res.status(201).json({ task: newTask });
});

app.patch('/api/tasks/:id/toggle', async (req: Request, res: Response) => {
  const { workspace } = getAuthContext(req);
  const task = db.tasks.find((t: any) => t.id === req.params.id && t.workspaceId === workspace?.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  task.completed = !task.completed;
  if (!await saveDb(db, res)) return;
  res.json({ task });
});

// CALENDAR MEETINGS
app.get('/api/meetings', (req: Request, res: Response) => {
  const { workspace } = getAuthContext(req);
  const targetWsId = workspace?.id || 'ws-demo';
  const meetings = (db.meetings || []).filter((meeting: any) => meeting.workspaceId === targetWsId);
  res.json({ meetings });
});

app.post('/api/meetings', async (req: Request, res: Response) => {
  const { user, workspace } = getAuthContext(req);
  const targetWsId = workspace?.id || 'ws-demo';
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
  const startsAt = new Date(req.body?.startsAt);
  const endsAt = new Date(req.body?.endsAt);
  if (!title || Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
    return res.status(400).json({ error: 'A title and valid start/end times are required.' });
  }
  const meeting = {
    id: `mtg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    workspaceId: targetWsId,
    title,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    attendees: typeof req.body.attendees === 'string' ? req.body.attendees.trim() : '',
    notes: typeof req.body.notes === 'string' ? req.body.notes.trim() : '',
    createdBy: user?.name || 'Admin',
    createdAt: new Date().toISOString(),
  };
  db.meetings.unshift(meeting);
  addNotification(targetWsId, 'Meeting scheduled', `${meeting.title} is scheduled for ${startsAt.toLocaleString()}.`, 'meeting');
  if (!await saveDb(db, res)) return;
  res.status(201).json({ meeting });
});

// NOTIFICATION CENTER
app.get('/api/notifications', (req: Request, res: Response) => {
  const { workspace } = getAuthContext(req);
  const targetWsId = workspace?.id || 'ws-demo';
  const notifications = (db.notifications || [])
    .filter((item: any) => item.workspaceId === targetWsId)
    .sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 100);
  res.json({ notifications, unreadCount: notifications.filter((item: any) => !item.read).length });
});

app.patch('/api/notifications/read-all', async (req: Request, res: Response) => {
  const { workspace } = getAuthContext(req);
  const targetWsId = workspace?.id || 'ws-demo';
  (db.notifications || []).forEach((item: any) => {
    if (item.workspaceId === targetWsId) item.read = true;
  });
  if (!await saveDb(db, res)) return;
  res.json({ success: true });
});

app.patch('/api/notifications/:id/read', async (req: Request, res: Response) => {
  const { workspace } = getAuthContext(req);
  const targetWsId = workspace?.id || 'ws-demo';
  const notification = (db.notifications || []).find((item: any) => item.id === req.params.id && item.workspaceId === targetWsId);
  if (!notification) return res.status(404).json({ error: 'Notification not found' });
  notification.read = true;
  if (!await saveDb(db, res)) return;
  res.json({ notification });
});

// ACTIVITIES & NOTES
app.get('/api/activities', (req: Request, res: Response) => {
  const { workspace } = getAuthContext(req);
  const companyId = req.query.companyId as string;
  let items = (db.activities || []).filter((a: any) => a.workspaceId === workspace?.id);
  if (companyId) {
    items = items.filter((a: any) => a.companyId === companyId);
  }
  res.json({ activities: items });
});

app.post('/api/activities', async (req: Request, res: Response) => {
  const { user, workspace } = getAuthContext(req);
  const newAct = {
    id: `act-${Date.now()}`,
    workspaceId: workspace?.id,
    companyId: req.body.companyId,
    type: req.body.type || 'note',
    title: req.body.title || 'New Note',
    description: req.body.description || '',
    timestamp: 'Just now',
    author: user?.name || 'Admin',
  };

  db.activities.unshift(newAct);
  if (!await saveDb(db, res)) return;
  res.status(201).json({ activity: newAct });
});

// WORKFLOWS & AUTOMATIONS
app.get('/api/workflows', (req: Request, res: Response) => {
  const { workspace } = getAuthContext(req);
  const workflows = (db.workflows || []).filter((w: any) => w.workspaceId === workspace?.id);
  res.json({ workflows });
});

app.patch('/api/workflows/:id/toggle', async (req: Request, res: Response) => {
  const { workspace } = getAuthContext(req);
  const wf = db.workflows.find((w: any) => w.id === req.params.id && w.workspaceId === workspace?.id);
  if (!wf) return res.status(404).json({ error: 'Workflow not found' });
  wf.enabled = !wf.enabled;
  if (!await saveDb(db, res)) return;
  res.json({ workflow: wf });
});

// CUSTOM OBJECTS & SCHEMA
app.get('/api/custom-objects', (req: Request, res: Response) => {
  const { workspace } = getAuthContext(req);
  const customObjects = (db.customObjects || []).filter((co: any) => co.workspaceId === workspace?.id);
  res.json({ customObjects });
});

app.post('/api/custom-objects', async (req: Request, res: Response) => {
  const { workspace } = getAuthContext(req);
  if (!workspace) return res.status(401).json({ error: 'Unauthenticated' });
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  if (!name) return res.status(400).json({ error: 'Object name is required.' });
  if (name.length > 60) return res.status(400).json({ error: 'Object name must be 60 characters or fewer.' });
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  if (!slug) return res.status(400).json({ error: 'Object name must include letters or numbers.' });
  if ((db.customObjects || []).some((object: any) => object.workspaceId === workspace.id && object.slug === slug)) {
    return res.status(409).json({ error: 'An object with that name already exists.' });
  }
  const newObj = {
    id: `co-${Date.now()}`,
    workspaceId: workspace.id,
    name,
    slug,
    description: 'Custom relational object',
    fields: ['name', 'status', 'created_at'],
  };

  if (!Array.isArray(db.customObjects)) db.customObjects = [];
  db.customObjects.push(newObj);
  if (!await saveDb(db, res)) return;
  res.status(201).json({ customObject: newObj });
});

// CSV EXPORT FOR CURRENT WORKSPACE
app.get('/api/export/companies/csv', (req: Request, res: Response) => {
  const { workspace } = getAuthContext(req);
  const companies = (db.companies || []).filter((c: any) => c.workspaceId === workspace?.id);
  const headers = ['Name', 'Domain', 'Tier', 'ARR', 'Primary Contact', 'Status', 'Owner'];
  const rows = companies.map((c: any) => [
    `"${c.name}"`,
    `"${c.domain}"`,
    `"${c.tier}"`,
    c.arr,
    `"${c.primaryContact}"`,
    `"${c.status}"`,
    `"${c.owner}"`,
  ]);

  const csv = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=${workspace?.name?.toLowerCase().replace(/\s+/g, '_')}_companies.csv`);
  res.send(csv);
});

// JSON EXPORT FOR CURRENT WORKSPACE (FOR AI CODERS)
app.get('/api/export/full-database', (req: Request, res: Response) => {
  const { workspace } = getAuthContext(req);
  const targetWsId = workspace?.id || 'ws-demo';

  const exportData = {
    workspace,
    exportedAt: new Date().toISOString(),
    companies: (db.companies || []).filter((c: any) => c.workspaceId === targetWsId),
    opportunities: (db.opportunities || []).filter((o: any) => o.workspaceId === targetWsId),
    people: (db.people || []).filter((p: any) => p.workspaceId === targetWsId),
    tasks: (db.tasks || []).filter((t: any) => t.workspaceId === targetWsId),
    activities: (db.activities || []).filter((a: any) => a.workspaceId === targetWsId),
    workflows: (db.workflows || []).filter((w: any) => w.workspaceId === targetWsId),
    customObjects: (db.customObjects || []).filter((co: any) => co.workspaceId === targetWsId),
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=${workspace?.name?.toLowerCase().replace(/\s+/g, '_')}_backup.json`);
  res.send(JSON.stringify(exportData, null, 2));
});

// MCP CONFIGURATION EXPORT (FOR CURSOR & CLAUDE)
app.get('/api/export/mcp-config', (req: Request, res: Response) => {
  const origin = `${req.protocol}://${req.get('host')}`;
  const mcpConfig = {
    mcpServers: {
      'nexus-crm': {
        name: 'Nexus CRM (MCP Server)',
        url: `${origin}/api/ai/mcp`,
        type: 'http-json-rpc',
        description: 'Connects your local AI coder (Cursor, Windsurf, Claude) to Nexus CRM database',
        tools: ['find_deals', 'log_activity', 'enrich_company', 'deal_health'],
      },
    },
  };

  res.json(mcpConfig);
});

// ==========================================
// 3. TWENTY CRM AI CAPABILITIES (GEMINI POWERED)
// ==========================================

// AI Copilot Natural Language Query Runner (MCP Agent)
app.post('/api/ai/copilot', async (req: Request, res: Response) => {
  try {
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    const { user, workspace } = getAuthContext(req);
    if (!workspace) return res.status(401).json({ error: 'Unauthenticated' });

    const wsCompanies = (db.companies || []).filter((c: any) => c.workspaceId === workspace?.id);
    const wsDeals = (db.opportunities || []).filter((d: any) => d.workspaceId === workspace?.id);
    const wsActivities = (db.activities || []).filter((a: any) => a.workspaceId === workspace?.id).slice(0, 6);

    if (!hasGeminiApiKey()) {
      if (/\b(pipeline|opportunit(?:y|ies)|deal(?:s)?|risk|forecast)\b/i.test(message)) {
        return res.json({
          reply: buildPipelineSummary(workspace),
          source: 'local-crm-data',
          timestamp: new Date().toLocaleTimeString(),
        });
      }
      return res.status(503).json({
        error: 'Gemini AI is not configured. Set GEMINI_API_KEY in your server .env file and restart Nexus. Pipeline summaries are available from saved CRM data without Gemini.',
      });
    }

    const systemPrompt = `You are Nexus AI, the built-in intelligent copilot for Nexus CRM (the modern open-source alternative to Salesforce, pioneering native Model Context Protocol).
Current Workspace: "${workspace?.name || 'Custom Workspace'}"
Current User: "${user?.name || 'Admin'}" (${user?.email || 'user@example.com'})

Live Workspace Database:
Companies: ${JSON.stringify(wsCompanies)}
Deals: ${JSON.stringify(wsDeals)}
Recent Activities: ${JSON.stringify(wsActivities)}

Your capabilities:
1. Deep pipeline analysis: evaluate deal momentum, flag slipped deadlines, calculate ARR sums for ${workspace?.name}.
2. Account diagnosis: detect churn risks and recommend customer retention plans.
3. Model Context Protocol tool execution simulation: provide exact tool commands and parameter payloads.
4. Draft sales emails and suggest next best actions for account executives.

Format response in crisp markdown with bold metrics and bullet points.`;

    const response = await generateContentResilient({
      contents: message || 'Analyze our highest value pipeline opportunities and flag any deal risks.',
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    res.json({
      reply: response.text,
      timestamp: new Date().toLocaleTimeString(),
    });
  } catch (err: any) {
    console.error('AI Copilot error:', err);
    if (/default credentials|could not load.*credentials|application default credentials/i.test(String(err?.message || ''))) {
      if (/\b(pipeline|opportunit(?:y|ies)|deal(?:s)?|risk|forecast)\b/i.test(String(req.body?.message || ''))) {
        return res.json({
          reply: buildPipelineSummary(getAuthContext(req).workspace),
          source: 'local-crm-data',
          timestamp: new Date().toLocaleTimeString(),
        });
      }
      return res.status(503).json({
        error: 'Gemini AI could not authenticate. Set a valid GEMINI_API_KEY in your server .env file and restart Nexus. Pipeline summaries remain available from saved CRM data.',
      });
    }
    res.status(500).json({ error: 'AI Copilot failed to process query: ' + err.message });
  }
});

// AI Company Enrichment
app.post('/api/ai/enrich-company', async (req: Request, res: Response) => {
  try {
    if (!hasGeminiApiKey()) {
      return res.status(503).json({ error: 'Company enrichment requires Gemini. Set GEMINI_API_KEY in your server .env file and restart Nexus.' });
    }
    const { domain, companyName } = req.body;
    const { workspace } = getAuthContext(req);

    const response = await generateContentResilient({
      contents: `Perform high-precision B2B sales intelligence research on domain: "${domain}" (Company: "${companyName}"). Extract tech stack, estimated employee range, funding or scale status, and elevator pitch.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            estimatedEmployees: { type: Type.INTEGER },
            techStack: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            fundingOrTier: { type: Type.STRING },
            elevatorPitch: { type: Type.STRING },
            recommendedBuyerPersona: { type: Type.STRING },
            strategicFitScore: { type: Type.INTEGER, description: 'Score out of 100' },
          },
          required: [
            'name',
            'estimatedEmployees',
            'techStack',
            'fundingOrTier',
            'elevatorPitch',
            'recommendedBuyerPersona',
            'strategicFitScore',
          ],
        },
      },
    });

    const enriched = JSON.parse(response.text || '{}');

    // Update company in database if exists
    const match = db.companies.find(
      (c: any) =>
        c.workspaceId === workspace?.id &&
        (c.domain.toLowerCase() === domain.toLowerCase() || c.name.toLowerCase() === companyName?.toLowerCase())
    );
    if (match) {
      match.techStack = enriched.techStack;
      match.employees = enriched.estimatedEmployees || match.employees;
      match.aiSummary = enriched.elevatorPitch;
      match.aiHealthScore = enriched.strategicFitScore || match.aiHealthScore;
      if (!await saveDb(db, res)) return;
    }

    res.json({ enriched, updatedCompany: match });
  } catch (err: any) {
    console.error('Enrichment error:', err);
    res.status(500).json({ error: 'AI Enrichment failed: ' + err.message });
  }
});

// AI Deal Health & Risk Scoring
app.post('/api/ai/deal-health', async (req: Request, res: Response) => {
  try {
    if (!hasGeminiApiKey()) {
      return res.status(503).json({ error: 'AI deal-health analysis requires Gemini. Set GEMINI_API_KEY in your server .env file and restart Nexus.' });
    }
    const { dealId } = req.body;
    const { workspace } = getAuthContext(req);

    const wsDeals = (db.opportunities || []).filter((d: any) => d.workspaceId === workspace?.id);
    const deal = wsDeals.find((d: any) => d.id === dealId) || wsDeals[0];
    const company = db.companies.find((c: any) => c.id === deal?.companyId);

    const prompt = `Analyze this sales deal for win probability and key deal risks:
Deal Title: ${deal?.title}
Amount: $${deal?.amount?.toLocaleString()}
Stage: ${deal?.stage}
Company Status: ${company?.status || 'Active'}
Notes: ${company?.notes || 'No recent notes'}

Provide:
1. Health Score (0-100)
2. Win Probability Percentage
3. Key Deal Risks (bullet points)
4. Recommended Next Action for the Account Executive`;

    const response = await generateContentResilient({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            healthScore: { type: Type.INTEGER },
            winProbability: { type: Type.INTEGER },
            risks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            nextBestAction: { type: Type.STRING },
          },
          required: ['healthScore', 'winProbability', 'risks', 'nextBestAction'],
        },
      },
    });

    res.json(JSON.parse(response.text || '{}'));
  } catch (err: any) {
    console.error('Deal health error:', err);
    res.status(500).json({ error: 'Deal analysis failed: ' + err.message });
  }
});

// AI Context-Aware Email Drafter
app.post('/api/ai/draft-email', async (req: Request, res: Response) => {
  try {
    if (!hasGeminiApiKey()) {
      return res.status(503).json({ error: 'AI email drafting requires Gemini. Set GEMINI_API_KEY in your server .env file and restart Nexus.' });
    }
    const { companyName, recipientName, context, goal } = req.body;
    const { user } = getAuthContext(req);

    const prompt = `Write a high-converting, concise B2B follow-up email from ${user?.name || 'Alex Vance'} at Nexus CRM.
Recipient: ${recipientName || 'Executive'} at ${companyName || 'Target Account'}
Context of conversation: ${context || 'Following up on our product demo and pricing review.'}
Goal: ${goal || 'Confirm contract sign-off or address final security questions.'}

Tone: Modern, professional, non-salesy, respectful of time.
Return JSON with subject and body.`;

    const response = await generateContentResilient({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            body: { type: Type.STRING },
          },
          required: ['subject', 'body'],
        },
      },
    });

    res.json(JSON.parse(response.text || '{}'));
  } catch (err: any) {
    console.error('Email drafting error:', err);
    res.status(500).json({ error: 'Email generator failed: ' + err.message });
  }
});

// Model Context Protocol (MCP) Simulator Endpoint
app.post('/api/ai/mcp', async (req: Request, res: Response) => {
  const { tool, arguments: args } = req.body;
  const { workspace } = getAuthContext(req);

  if (tool === 'find_deals') {
    const minAmount = args?.minAmount || 0;
    const stage = args?.stage;
    let matches = (db.opportunities || []).filter((d: any) => d.workspaceId === workspace?.id);
    if (stage) matches = matches.filter((d: any) => d.stage === stage);
    if (minAmount) matches = matches.filter((d: any) => d.amount >= minAmount);
    return res.json({ result: matches });
  }

  if (tool === 'log_activity') {
    const newAct = {
      id: `act-${Date.now()}`,
      workspaceId: workspace?.id,
      companyId: args?.companyId || db.companies[0]?.id,
      type: args?.type || 'note',
      title: args?.title || 'MCP Automated Activity',
      description: args?.description || 'Logged via Model Context Protocol tool call',
      timestamp: 'Just now',
      author: 'Claude / MCP Agent',
    };
    db.activities.unshift(newAct);
    if (!await saveDb(db, res)) return;
    return res.json({ result: newAct });
  }

  res.json({ result: 'Tool execution acknowledged', tool, args });
});

// ==========================================
// 4. VITE DEV SERVER MIDDLEWARE MOUNT
// ==========================================
async function startServer() {
  await initializePersistence();
  app.use((err: unknown, _req: Request, res: Response, _next: express.NextFunction) => {
    console.error('Unhandled API error:', err);
    if (!res.headersSent) res.status(500).json({ error: 'An unexpected server error occurred.' });
  });

  if (process.env.NODE_ENV === 'production') {
    const indexFile = path.join(DIST_DIR, 'index.html');
    if (!fs.existsSync(indexFile)) {
      throw new Error('Production frontend build not found. Run `npm run build` before starting Nexus.');
    }
    app.use(express.static(DIST_DIR));
    app.get('*', (req: Request, res: Response, next) => {
      if (req.path.startsWith('/api/')) return next();
      res.sendFile(indexFile, (err) => {
        if (err) next(err);
      });
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nexus Multi-Tenant Server with Persistent DB & Gemini AI running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Nexus server failed to start:', err);
  process.exitCode = 1;
});

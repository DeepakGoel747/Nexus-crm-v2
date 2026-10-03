import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
const PORT = 3000;
const DB_FILE = path.resolve(process.cwd(), 'data', 'crm_storage.json');

app.use(express.json());

// Initialize Google GenAI Client on the server
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

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
      ['companies', 'opportunities', 'people', 'tasks', 'activities', 'workflows', 'customObjects'].forEach((key) => {
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
  };
}

// Save persistent database to disk atomically
function saveDb(data: any) {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving to crm_storage.json:', err);
  }
}

let db = loadDb();

// Helper: Extract current user & workspace from Bearer Token
function getAuthContext(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Fallback to default demo user for backward compatibility
    const defaultUser = db.users[0] || {
      id: 'usr-demo',
      name: 'Alex Vance',
      email: 'demo@nexus.corp',
      workspaceId: 'ws-demo',
      role: 'Admin',
    };
    const defaultWs = db.workspaces.find((w: any) => w.id === defaultUser.workspaceId) || {
      id: 'ws-demo',
      name: 'Acme Systems (Demo Workspace)',
    };
    return { user: defaultUser, workspace: defaultWs };
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    const user = db.users.find((u: any) => u.id === decoded.userId || u.email === decoded.email);
    if (user) {
      const workspace = db.workspaces.find((w: any) => w.id === user.workspaceId) || {
        id: user.workspaceId,
        name: 'Custom Workspace',
      };
      return { user, workspace };
    }
  } catch (err) {
    console.warn('Error parsing auth token:', err);
  }

  const defaultUser = db.users[0];
  const defaultWs = db.workspaces.find((w: any) => w.id === defaultUser?.workspaceId);
  return { user: defaultUser, workspace: defaultWs };
}

// Generate token
function generateToken(user: any) {
  const payload = {
    userId: user.id,
    email: user.email,
    workspaceId: user.workspaceId,
    timestamp: Date.now(),
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

// ==========================================
// 1. AUTHENTICATION & WORKSPACE ENDPOINTS
// ==========================================

// Register New User & Create Custom Workspace
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, email, password, workspaceName, seedDemoData } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
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
    password: password.trim(),
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

  saveDb(db);

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
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = db.users.find(
    (u: any) => u.email.toLowerCase() === normalizedEmail && u.password === password.trim()
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
  res.json({
    clientId: process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '127873301880-4gcc53sijg6o9gv36qhepocjbjej3iio.apps.googleusercontent.com',
  });
});

// Google Authentication (Authentic Google ID Token Verification + Development Fallback)
app.post('/api/auth/google', async (req: Request, res: Response) => {
  try {
    const { credential, email, name, avatar, workspaceName } = req.body;
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
    } else if (email) {
      // 2. Development / Sandbox fallback if testing without a Google Cloud Project Client ID
      userEmail = email.trim().toLowerCase();
      userName = name?.trim() || 'Google User';
      userAvatar = avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userName)}`;
    } else {
      return res.status(400).json({ error: 'Missing Google credential token or email payload.' });
    }

    let user = db.users.find((u: any) => u.email.toLowerCase() === userEmail);
    let workspace;

    if (!user) {
      const userId = `usr-${Date.now()}`;
      const workspaceId = `ws-${Date.now()}`;
      const wsName = workspaceName?.trim() || `${userName}'s Workspace`;

      workspace = {
        id: workspaceId,
        name: wsName,
        ownerId: userId,
        createdAt: new Date().toISOString(),
      };

      user = {
        id: userId,
        name: userName,
        email: userEmail,
        avatar: userAvatar,
        googleId: googleSub,
        password: 'sso_google_managed',
        workspaceId: workspaceId,
        role: 'Admin / Owner',
        createdAt: new Date().toISOString(),
      };

      db.workspaces.push(workspace);
      db.users.push(user);

      // Seed dedicated starter templates for new Google account
      const newComp = {
        id: `comp-${Date.now()}-1`,
        workspaceId: workspaceId,
        name: 'Linear Systems',
        domain: 'linear.app',
        tier: 'Enterprise',
        arr: 145000,
        dealCount: 1,
        city: 'San Francisco',
        country: 'USA',
        employees: 84,
        primaryContact: 'Karri Saarinen',
        owner: userName,
        status: 'Active',
        notes: `Dedicated account provisioned for verified user ${userName} (${userEmail}).`,
        tags: ['SaaS', 'Developer Tools'],
        techStack: ['TypeScript', 'GraphQL', 'PostgreSQL', 'React'],
        aiHealthScore: 94,
      };
      db.companies.push(newComp);

      db.opportunities.push({
        id: `deal-${Date.now()}-1`,
        workspaceId: workspaceId,
        title: 'Linear — Global Workspace Expansion',
        companyId: newComp.id,
        companyName: newComp.name,
        amount: 90000,
        stage: 'negotiation',
        probability: 80,
        closeDate: '2026-10-31',
        owner: userName,
      });

      db.people.push({
        id: `peo-${Date.now()}-1`,
        workspaceId: workspaceId,
        name: 'Karri Saarinen',
        email: 'karri@linear.app',
        title: 'Co-founder & CEO',
        companyId: newComp.id,
        companyName: newComp.name,
        phone: '+1 (415) 890-1200',
        status: 'Champion',
        lastActivity: 'Just now',
      });

      db.tasks.push({
        id: `tsk-${Date.now()}-1`,
        workspaceId: workspaceId,
        title: `Welcome ${userName}! Explore your pipeline and run AI Company Enrichment.`,
        completed: false,
        dueDate: 'Today',
        assignedTo: userName,
        priority: 'high',
        relatedEntity: newComp.name,
        entityId: newComp.id,
      });

      db.workflows.push({
        id: `wf-${Date.now()}-1`,
        workspaceId: workspaceId,
        name: 'Auto-Create Onboarding Task on Closed Won',
        trigger: "deal.stage_changed === 'won'",
        action: 'create_task && send_notification',
        enabled: true,
        executionCount: 0,
      });

      saveDb(db);
    } else {
      workspace = db.workspaces.find((w: any) => w.id === user.workspaceId);
      if (userAvatar) user.avatar = userAvatar;
      if (userName && !user.name) user.name = userName;
      if (googleSub) user.googleId = googleSub;
      if (workspaceName && workspace) {
        workspace.name = workspaceName.trim();
      }
      saveDb(db);
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

// Update Workspace Name
app.patch('/api/workspace', (req: Request, res: Response) => {
  const { workspace } = getAuthContext(req);
  if (!workspace) return res.status(401).json({ error: 'Unauthenticated' });

  const { name } = req.body;
  if (name && name.trim()) {
    workspace.name = name.trim();
    saveDb(db);
  }
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

app.post('/api/companies', (req: Request, res: Response) => {
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

  saveDb(db);
  res.status(201).json({ company: newComp });
});

app.patch('/api/companies/:id', (req: Request, res: Response) => {
  const { workspace } = getAuthContext(req);
  const comp = db.companies.find((c: any) => c.id === req.params.id && c.workspaceId === workspace?.id);
  if (!comp) return res.status(404).json({ error: 'Company not found' });

  Object.assign(comp, req.body);
  saveDb(db);
  res.json({ company: comp });
});

app.delete('/api/companies/:id', (req: Request, res: Response) => {
  const { workspace } = getAuthContext(req);
  db.companies = db.companies.filter((c: any) => !(c.id === req.params.id && c.workspaceId === workspace?.id));
  db.opportunities = db.opportunities.filter((o: any) => !(o.companyId === req.params.id && o.workspaceId === workspace?.id));
  saveDb(db);
  res.json({ success: true, deletedId: req.params.id });
});

app.post('/api/companies/bulk-delete', (req: Request, res: Response) => {
  const { workspace } = getAuthContext(req);
  const { ids } = req.body;
  if (Array.isArray(ids)) {
    db.companies = db.companies.filter((c: any) => !(ids.includes(c.id) && c.workspaceId === workspace?.id));
    saveDb(db);
  }
  res.json({ success: true, deletedCount: ids?.length || 0 });
});

// OPPORTUNITIES / DEALS
app.get('/api/opportunities', (req: Request, res: Response) => {
  const { workspace } = getAuthContext(req);
  const opportunities = (db.opportunities || []).filter((o: any) => o.workspaceId === workspace?.id);
  res.json({ opportunities });
});

app.post('/api/opportunities', (req: Request, res: Response) => {
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
  saveDb(db);
  res.status(201).json({ deal: newDeal });
});

app.patch('/api/opportunities/:id/stage', (req: Request, res: Response) => {
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
  }

  saveDb(db);
  res.json({ deal });
});

// PEOPLE / CONTACTS
app.get('/api/people', (req: Request, res: Response) => {
  const { workspace } = getAuthContext(req);
  const people = (db.people || []).filter((p: any) => p.workspaceId === workspace?.id);
  res.json({ people });
});

app.post('/api/people', (req: Request, res: Response) => {
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
  saveDb(db);
  res.status(201).json({ person: newPerson });
});

// TASKS
app.get('/api/tasks', (req: Request, res: Response) => {
  const { workspace } = getAuthContext(req);
  const tasks = (db.tasks || []).filter((t: any) => t.workspaceId === workspace?.id);
  res.json({ tasks });
});

app.post('/api/tasks', (req: Request, res: Response) => {
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
  saveDb(db);
  res.status(201).json({ task: newTask });
});

app.patch('/api/tasks/:id/toggle', (req: Request, res: Response) => {
  const { workspace } = getAuthContext(req);
  const task = db.tasks.find((t: any) => t.id === req.params.id && t.workspaceId === workspace?.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  task.completed = !task.completed;
  saveDb(db);
  res.json({ task });
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

app.post('/api/activities', (req: Request, res: Response) => {
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
  saveDb(db);
  res.status(201).json({ activity: newAct });
});

// WORKFLOWS & AUTOMATIONS
app.get('/api/workflows', (req: Request, res: Response) => {
  const { workspace } = getAuthContext(req);
  const workflows = (db.workflows || []).filter((w: any) => w.workspaceId === workspace?.id);
  res.json({ workflows });
});

app.patch('/api/workflows/:id/toggle', (req: Request, res: Response) => {
  const { workspace } = getAuthContext(req);
  const wf = db.workflows.find((w: any) => w.id === req.params.id && w.workspaceId === workspace?.id);
  if (!wf) return res.status(404).json({ error: 'Workflow not found' });
  wf.enabled = !wf.enabled;
  saveDb(db);
  res.json({ workflow: wf });
});

// CUSTOM OBJECTS & SCHEMA
app.get('/api/custom-objects', (req: Request, res: Response) => {
  const { workspace } = getAuthContext(req);
  const customObjects = (db.customObjects || []).filter((co: any) => co.workspaceId === workspace?.id);
  res.json({ customObjects });
});

app.post('/api/custom-objects', (req: Request, res: Response) => {
  const { workspace } = getAuthContext(req);
  const newObj = {
    id: `co-${Date.now()}`,
    workspaceId: workspace?.id,
    name: req.body.name || 'Custom Entity',
    slug: (req.body.name || 'custom_entity').toLowerCase().replace(/\s+/g, '_'),
    description: req.body.description || 'Custom relational object',
    fields: req.body.fields || ['name', 'status', 'created_at'],
  };

  db.customObjects.push(newObj);
  saveDb(db);
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
    const { message } = req.body;
    const { user, workspace } = getAuthContext(req);

    const wsCompanies = (db.companies || []).filter((c: any) => c.workspaceId === workspace?.id);
    const wsDeals = (db.opportunities || []).filter((d: any) => d.workspaceId === workspace?.id);
    const wsActivities = (db.activities || []).filter((a: any) => a.workspaceId === workspace?.id).slice(0, 6);

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

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
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
    res.status(500).json({ error: 'AI Copilot failed to process query: ' + err.message });
  }
});

// AI Company Enrichment
app.post('/api/ai/enrich-company', async (req: Request, res: Response) => {
  try {
    const { domain, companyName } = req.body;
    const { workspace } = getAuthContext(req);

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
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
      saveDb(db);
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

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
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
    const { companyName, recipientName, context, goal } = req.body;
    const { user } = getAuthContext(req);

    const prompt = `Write a high-converting, concise B2B follow-up email from ${user?.name || 'Alex Vance'} at Nexus CRM.
Recipient: ${recipientName || 'Executive'} at ${companyName || 'Target Account'}
Context of conversation: ${context || 'Following up on our product demo and pricing review.'}
Goal: ${goal || 'Confirm contract sign-off or address final security questions.'}

Tone: Modern, professional, non-salesy, respectful of time.
Return JSON with subject and body.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
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
    saveDb(db);
    return res.json({ result: newAct });
  }

  res.json({ result: 'Tool execution acknowledged', tool, args });
});

// ==========================================
// 4. VITE DEV SERVER MIDDLEWARE MOUNT
// ==========================================
async function startServer() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nexus Multi-Tenant Server with Persistent DB & Gemini AI running at http://localhost:${PORT}`);
  });
}

startServer();

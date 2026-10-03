export type DealStage = 'prospect' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';

export interface Deal {
  id: string;
  title: string;
  companyName: string;
  companyId: string;
  amount: number;
  stage: DealStage;
  closeDate: string;
  owner: string;
  ownerAvatar?: string;
  probability: number;
}

export interface Company {
  id: string;
  name: string;
  domain: string;
  tier: 'Enterprise' | 'Mid-Market' | 'Growth' | 'Seed';
  arr: number;
  dealCount: number;
  city: string;
  country: string;
  employees: number;
  primaryContact: string;
  owner: string;
  status: 'Active' | 'Churn Risk' | 'Prospect' | 'Onboarding';
  notes: string;
  tags: string[];
  techStack?: string[];
  aiHealthScore?: number;
  aiSummary?: string;
}

export interface Person {
  id: string;
  name: string;
  email: string;
  title: string;
  companyName: string;
  companyId: string;
  phone: string;
  status: 'Lead' | 'Contact' | 'Customer' | 'Champion';
  lastActivity: string;
}

export interface Task {
  id: string;
  title: string;
  dueDate: string;
  assignedTo: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  relatedEntity: string;
}

export interface Activity {
  id: string;
  type: 'email' | 'meeting' | 'note' | 'stage_change';
  title: string;
  description: string;
  author: string;
  timestamp: string;
}

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'filter' | 'action';
  title: string;
  subtitle: string;
  iconName: string;
  config: Record<string, string>;
}

export interface McpTool {
  name: string;
  description: string;
  inputSchema: string;
  exampleCall: string;
}

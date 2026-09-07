export interface Employee {
  id: string;
  name: string;
  role: string;
  salary: number; // Monthly salary
  email: string;
  phone: string;
  joinedDate: string; // YYYY-MM-DD
}

export type ClientStatus = 'lead' | 'contacted' | 'proposal' | 'converted' | 'lost';

export interface ScopeLog {
  id: string;
  date: string;
  previousValue: number;
  addedAmount: number;
  newValue: number;
  title: string;
  notes?: string;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: ClientStatus;
  paymentType: 'monthly' | 'one-time';
  dealValue: number; // Monthly fee or total fixed contract value
  assignedEmployeeId: string; // Employee managing this client
  createdDate: string; // YYYY-MM-DD
  projectScope?: string; // Short scope description e.g. "Full Stack Web & Mobile App Development"
  scopeLogs?: ScopeLog[]; // Log of quote increases/scope revisions
}

export type PaymentType = 'monthly' | 'extra-work' | 'installment';

export interface Payment {
  id: string;
  clientId: string;
  clientName: string;
  amount: number;
  date: string; // YYYY-MM-DD
  type: PaymentType;
  workCategory?: string; // e.g., 'Video Editing', 'Branding & Design', 'Flex Work', etc.
  notes: string;
  method?: 'Wire' | 'Card' | 'Bank' | 'Cash';
  collectedByEmployeeId?: string; // Employee who collected / is holding this cash
  collectedByEmployeeName?: string;
  paidMonth?: string; // YYYY-MM (e.g., "2026-07")
}

export interface SalaryPayout {
  id: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  date: string; // YYYY-MM-DD
  notes: string;
  paidMonth?: string; // YYYY-MM (e.g., "2026-07")
}

export type ExpenseCategory = 
  | 'Rent' 
  | 'Domain & Infra' 
  | 'Software & Tools' 
  | 'Office & Supplies' 
  | 'Marketing' 
  | 'Legal & Professional' 
  | 'Utilities' 
  | 'Other';

export interface Expense {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string; // YYYY-MM-DD
  paidMonth?: string; // YYYY-MM (e.g., "2026-07")
  paymentMethod?: 'Wire' | 'Card' | 'Bank' | 'Cash';
  paidByEmployeeId?: string; // Employee who paid from their cash holding
  paidByEmployeeName?: string;
  vendor?: string;
  notes?: string;
}

export interface NoteChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export type NoteColor = 'default' | 'amber' | 'emerald' | 'teal' | 'cyan' | 'blue' | 'indigo' | 'purple' | 'rose' | 'orange';

export interface Note {
  id: string;
  title: string;
  content: string;
  color?: NoteColor;
  isPinned?: boolean;
  isArchived?: boolean;
  isChecklist?: boolean;
  checklist?: NoteChecklistItem[];
  tags?: string[];
  createdAt: string; // YYYY-MM-DD or ISO
  updatedAt?: string;
  authorName?: string;
  authorId?: string;
}

export type Tab = 'dashboard' | 'clients' | 'transactions' | 'notes' | 'payroll';

export interface CRMFilters {
  startDate: string;
  endDate: string;
  clientId: string; // "all" or specific ID
  employeeId: string; // "all" or specific ID
}

export interface CompanySettings {
  companyName: string;
  companyTagline?: string;
  logoUrl?: string; // Image URL or Base64 Data URL
  address?: string;
  email?: string;
  phone?: string;
  website?: string;
  currencySymbol?: string; // e.g. "₹" (default) or "$", "€", "£"
  cashLabel?: string; // e.g. "Cash", "Petty Cash", "Cash / UPI"
}


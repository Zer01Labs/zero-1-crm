import { Employee, Client, Payment, SalaryPayout, Expense, Note } from './types';

export const initialEmployees: Employee[] = [
  {
    id: 'emp-1',
    name: 'Sarah Jenkins',
    role: 'Senior Account Executive',
    salary: 7500,
    email: 'sarah.j@scarletcrm.com',
    phone: '+1 (555) 234-5678',
    joinedDate: '2026-01-15'
  },
  {
    id: 'emp-2',
    name: 'Michael Chen',
    role: 'Client Success Manager',
    salary: 6200,
    email: 'michael.c@scarletcrm.com',
    phone: '+1 (555) 345-6789',
    joinedDate: '2026-02-10'
  },
  {
    id: 'emp-3',
    name: 'Elena Rostova',
    role: 'Sales Director',
    salary: 9000,
    email: 'elena.r@scarletcrm.com',
    phone: '+1 (555) 456-7890',
    joinedDate: '2025-11-01'
  }
];

export const initialClients: Client[] = [
  {
    id: 'client-1',
    name: 'Alistair Vance',
    company: 'Quantum Labs LLC',
    email: 'contact@quantumlabs.io',
    phone: '+1 (555) 789-0123',
    status: 'converted',
    paymentType: 'monthly',
    dealValue: 5000,
    assignedEmployeeId: 'emp-3',
    createdDate: '2026-03-01'
  },
  {
    id: 'client-2',
    name: 'Brooke Sterling',
    company: 'Apex Digital Corp',
    email: 'b.sterling@apexdigital.com',
    phone: '+1 (555) 890-1234',
    status: 'converted',
    paymentType: 'one-time',
    dealValue: 12500,
    assignedEmployeeId: 'emp-1',
    createdDate: '2026-04-12'
  },
  {
    id: 'client-royal',
    name: 'Rajesh Varma (Royal Client)',
    company: 'Royal Tech Solutions',
    email: 'rajesh@royaltech.com',
    phone: '+91 98765 43210',
    status: 'converted',
    paymentType: 'one-time',
    dealValue: 120000, // ₹10,00,000 / $120,000 fixed contract quote
    projectScope: 'Custom Enterprise Portal & Mobile App Development (Fixed Quote ₹10L)',
    assignedEmployeeId: 'emp-3',
    createdDate: '2026-05-01',
    scopeLogs: [
      {
        id: 'scope-1',
        date: '2026-05-01',
        previousValue: 0,
        addedAmount: 120000,
        newValue: 120000,
        title: 'Initial Development Contract Sign-off (₹10 Lakh / $120,000)'
      }
    ]
  },
  {
    id: 'client-3',
    name: 'Julian Vance',
    company: 'Stellar Retail Inc',
    email: 'julian@stellarretail.co',
    phone: '+1 (555) 901-2345',
    status: 'proposal',
    paymentType: 'monthly',
    dealValue: 3200,
    assignedEmployeeId: 'emp-2',
    createdDate: '2026-05-20'
  },
  {
    id: 'client-4',
    name: 'Diana Prince',
    company: 'Helix Corp',
    email: 'diana.p@helixcorp.org',
    phone: '+1 (555) 012-3456',
    status: 'contacted',
    paymentType: 'monthly',
    dealValue: 4500,
    assignedEmployeeId: 'emp-1',
    createdDate: '2026-06-05'
  }
];

export const initialPayments: Payment[] = [
  {
    id: 'pay-1',
    clientId: 'client-1',
    clientName: 'Quantum Labs LLC',
    amount: 5000,
    date: '2026-05-01',
    type: 'monthly',
    notes: 'Invoiced monthly service fee - May 2026',
    method: 'Wire',
    paidMonth: '2026-05'
  },
  {
    id: 'pay-2',
    clientId: 'client-1',
    clientName: 'Quantum Labs LLC',
    amount: 5000,
    date: '2026-06-01',
    type: 'monthly',
    notes: 'Invoiced monthly service fee - June 2026',
    method: 'Wire',
    paidMonth: '2026-06'
  },
  {
    id: 'pay-3',
    clientId: 'client-2',
    clientName: 'Apex Digital Corp',
    amount: 12500,
    date: '2026-05-15',
    type: 'extra-work',
    workCategory: 'Flex & Strategy Consulting',
    notes: 'One-off strategic consulting service fee',
    method: 'Card',
    paidMonth: '2026-05'
  },
  {
    id: 'pay-4',
    clientId: 'client-1',
    clientName: 'Quantum Labs LLC',
    amount: 5000,
    date: '2026-07-01',
    type: 'monthly',
    notes: 'Invoiced monthly service fee - July 2026',
    method: 'Wire',
    paidMonth: '2026-07'
  },
  {
    id: 'pay-5',
    clientId: 'client-1',
    clientName: 'Quantum Labs LLC',
    amount: 1800,
    date: '2026-07-15',
    type: 'extra-work',
    workCategory: 'Extra Video Editing / Production',
    notes: 'Extra video package & brand flex deliverables',
    method: 'Wire',
    paidMonth: '2026-07'
  },
  {
    id: 'pay-royal-1',
    clientId: 'client-royal',
    clientName: 'Rajesh Varma (Royal Tech Solutions)',
    amount: 40000,
    date: '2026-05-05',
    type: 'installment',
    workCategory: '1st Installment - Advance Kickoff (33%)',
    notes: '1st Installment (33% Advance) for Development Project',
    method: 'Wire',
    paidMonth: '2026-05'
  },
  {
    id: 'pay-royal-2',
    clientId: 'client-royal',
    clientName: 'Rajesh Varma (Royal Tech Solutions)',
    amount: 30000,
    date: '2026-06-20',
    type: 'installment',
    workCategory: '2nd Installment - UI & Architecture Demo (25%)',
    notes: '2nd Installment upon UI Design & Database Approval',
    method: 'Wire',
    paidMonth: '2026-06'
  }
];

export const initialSalaryPayouts: SalaryPayout[] = [];

export const initialExpenses: Expense[] = [
  {
    id: 'exp-1',
    title: 'Headquarters Office Lease',
    category: 'Rent',
    amount: 3500,
    date: '2026-06-01',
    paidMonth: '2026-06',
    paymentMethod: 'Wire',
    vendor: 'Metropolitan Real Estate Trust',
    notes: 'Monthly office rent for HQ Suite 400'
  },
  {
    id: 'exp-2',
    title: 'Headquarters Office Lease',
    category: 'Rent',
    amount: 3500,
    date: '2026-07-01',
    paidMonth: '2026-07',
    paymentMethod: 'Wire',
    vendor: 'Metropolitan Real Estate Trust',
    notes: 'Monthly office rent for HQ Suite 400'
  },
  {
    id: 'exp-3',
    title: 'AWS Cloud Hosting & Domain Infra',
    category: 'Domain & Infra',
    amount: 850,
    date: '2026-06-15',
    paidMonth: '2026-06',
    paymentMethod: 'Card',
    vendor: 'Amazon Web Services / Cloudflare',
    notes: 'Production server instances, CDN bandwidth & domain renewals'
  },
  {
    id: 'exp-4',
    title: 'AWS Cloud Hosting & Domain Infra',
    category: 'Domain & Infra',
    amount: 920,
    date: '2026-07-15',
    paidMonth: '2026-07',
    paymentMethod: 'Card',
    vendor: 'Amazon Web Services / Cloudflare',
    notes: 'Production server instances & DNS infra bandwidth'
  },
  {
    id: 'exp-5',
    title: 'Google Workspace & GitHub Enterprise',
    category: 'Software & Tools',
    amount: 450,
    date: '2026-07-05',
    paidMonth: '2026-07',
    paymentMethod: 'Card',
    vendor: 'Google & GitHub Inc.',
    notes: 'Corporate email seats, CI/CD runners, dev licenses'
  },
  {
    id: 'exp-6',
    title: 'Acquisition & Digital Marketing Campaign',
    category: 'Marketing',
    amount: 1200,
    date: '2026-06-20',
    paidMonth: '2026-06',
    paymentMethod: 'Card',
    vendor: 'Google Ads & LinkedIn Media',
    notes: 'B2B lead generation campaign'
  }
];

export const initialNotes: Note[] = [
  {
    id: 'note-1',
    title: 'Q3 Agency Revenue Targets & Milestones',
    content: 'Targeting ₹15,00,000 net collections across retainer & custom build contracts.\n• Prioritize high-ticket enterprise contracts\n• Close Stellar Retail & Helix Corp proposals\n• Finalize 3rd installment for Royal Tech solutions portal',
    color: 'amber',
    isPinned: true,
    tags: ['Strategy', 'Revenue', 'Quarterly'],
    createdAt: '2026-08-01',
    authorName: 'Elena Rostova'
  },
  {
    id: 'note-2',
    title: 'Client Onboarding Checklist',
    content: 'Standard setup flow for all newly signed contracts:',
    color: 'emerald',
    isPinned: true,
    isChecklist: true,
    checklist: [
      { id: 'chk-1', text: 'Generate & send countersigned service agreement', completed: true },
      { id: 'chk-2', text: 'Collect 33% advance kickoff payment & issue receipt', completed: true },
      { id: 'chk-3', text: 'Create dedicated Slack / WhatsApp VIP channel', completed: true },
      { id: 'chk-4', text: 'Assign dedicated account lead & schedule kickoff call', completed: false },
      { id: 'chk-5', text: 'Share Google Drive shared folder for brand assets', completed: false }
    ],
    tags: ['Process', 'Onboarding'],
    createdAt: '2026-08-05',
    authorName: 'Sarah Jenkins'
  },
  {
    id: 'note-3',
    title: 'Meeting Notes with Rajesh Varma (Royal Tech)',
    content: 'Discussion regarding enterprise mobile app release schedule:\n1. Backend architecture and database schema approved.\n2. Payment installment 2 cleared.\n3. Next milestone: Demo UI prototypes for user testing next Tuesday.\n4. Additional video production retainer scope discussed (approx ₹35,000/mo).',
    color: 'blue',
    isPinned: false,
    tags: ['Meeting', 'Client', 'RoyalTech'],
    createdAt: '2026-08-12',
    authorName: 'Elena Rostova'
  },
  {
    id: 'note-4',
    title: 'Team Payroll & Bonus Guidelines',
    content: 'Monthly salary disbursements run between 1st - 5th of every month.\nCommission payouts for sales team are calculated at 5% of first-month retainer value.',
    color: 'purple',
    isPinned: false,
    tags: ['HR', 'Payroll'],
    createdAt: '2026-08-14',
    authorName: 'Michael Chen'
  },
  {
    id: 'note-5',
    title: 'Vendor Renewals & Tech Stack',
    content: 'Review monthly cloud infrastructure and software subscriptions:\n- AWS Cloud instances audit (scale down test servers on weekends)\n- GitHub Enterprise licenses review\n- Google Workspace annual plan savings opportunity',
    color: 'rose',
    isPinned: false,
    tags: ['Overhead', 'Infra'],
    createdAt: '2026-08-16',
    authorName: 'Operations'
  }
];


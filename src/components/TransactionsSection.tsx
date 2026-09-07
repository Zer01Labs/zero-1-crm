import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DollarSign, CreditCard, Search, Calendar, Plus, X, 
  Trash2, AlertCircle, FileText, CheckCircle2, ArrowUpRight, ArrowDownRight,
  Receipt, Download, Filter, Building2, Server, Laptop, ShoppingBag, 
  Megaphone, ShieldCheck, Zap, HelpCircle, ArrowLeftRight, Users
} from 'lucide-react';
import { Client, Payment, Expense, ExpenseCategory, PaymentType, CompanySettings, Employee, SalaryPayout } from '../types';

interface TransactionsSectionProps {
  payments: Payment[];
  expenses: Expense[];
  payouts?: SalaryPayout[];
  clients: Client[];
  employees?: Employee[];
  companySettings?: CompanySettings;
  onLogPayment: (payment: Omit<Payment, 'id' | 'date'> & { date?: string }) => void;
  onDeletePayment: (id: string) => void;
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onDeleteExpense: (id: string) => void;
  onPayEmployee?: (payout: Omit<SalaryPayout, 'id' | 'date'> & { date?: string }) => void;
  onDeletePayout?: (id: string) => void;
}

export default function TransactionsSection({
  payments,
  expenses,
  payouts = [],
  clients,
  employees = [],
  companySettings,
  onLogPayment,
  onDeletePayment,
  onAddExpense,
  onDeleteExpense,
  onPayEmployee,
  onDeletePayout,
}: TransactionsSectionProps) {
  const currSymbol = companySettings?.currencySymbol || '₹';
  const cashLabel = companySettings?.cashLabel || 'Cash';

  // Main view filters
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<'all' | 'income' | 'expense' | 'salary'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [entryType, setEntryType] = useState<'income' | 'expense' | 'salary'>('income');

  // Income Form State
  const [selectedClientId, setSelectedClientId] = useState('');
  const [incomeType, setIncomeType] = useState<PaymentType>('monthly');
  const [incomeWorkCategory, setIncomeWorkCategory] = useState('Extra Video Editing / Production');
  const [incomeCustomCategory, setIncomeCustomCategory] = useState('');
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeMethod, setIncomeMethod] = useState<'Wire' | 'Card' | 'Bank' | 'Cash'>('Wire');
  const [incomeCollectorEmpId, setIncomeCollectorEmpId] = useState('');
  const [incomeDate, setIncomeDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [incomePaidMonth, setIncomePaidMonth] = useState(() => new Date().toISOString().substring(0, 7));
  const [incomeNotes, setIncomeNotes] = useState('');

  // Expense Form State
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('Rent');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [expensePaidMonth, setExpensePaidMonth] = useState(() => new Date().toISOString().substring(0, 7));
  const [expenseMethod, setExpenseMethod] = useState<'Wire' | 'Card' | 'Bank' | 'Cash'>('Card');
  const [expenseSpenderEmpId, setExpenseSpenderEmpId] = useState('');
  const [expenseVendor, setExpenseVendor] = useState('');
  const [expenseNotes, setExpenseNotes] = useState('');

  // Salary Form State
  const [selectedSalaryEmpId, setSelectedSalaryEmpId] = useState('');
  const [salaryAmount, setSalaryAmount] = useState('');
  const [salaryDate, setSalaryDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [salaryPaidMonth, setSalaryPaidMonth] = useState(() => new Date().toISOString().substring(0, 7));
  const [salaryPaymentMethod, setSalaryPaymentMethod] = useState<'Bank Transfer' | 'Direct Deposit' | 'Wire' | 'Cash'>('Bank Transfer');
  const [salaryNotes, setSalaryNotes] = useState('');

  // General Form Error
  const [formError, setFormError] = useState('');

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'income' | 'expense' | 'salary'; name: string } | null>(null);

  // Active converted clients for income select
  const activeClients = clients.filter(c => c.status === 'converted');

  // Format month helper
  const formatMonth = (monthStr?: string) => {
    if (!monthStr) return 'N/A';
    const parts = monthStr.split('-');
    if (parts.length !== 2) return monthStr;
    const [year, month] = parts;
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    const idx = parseInt(month, 10) - 1;
    if (idx >= 0 && idx < 12) {
      return `${monthNames[idx]} ${year}`;
    }
    return monthStr;
  };

  // Standardize items into a unified list
  interface UnifiedTransaction {
    id: string;
    type: 'income' | 'expense' | 'salary';
    date: string;
    paidMonth?: string;
    title: string;
    entity: string; // Client name, Vendor, or Employee
    categoryOrType: string;
    method: string;
    notes: string;
    amount: number;
    cashPersonName?: string;
    originalPayment?: Payment;
    originalExpense?: Expense;
    originalPayout?: SalaryPayout;
  }

  const unifiedTransactions: UnifiedTransaction[] = [
    ...payments.map(p => {
      let cashPerson = p.collectedByEmployeeName;
      if (!cashPerson && p.collectedByEmployeeId) {
        cashPerson = employees.find(e => e.id === p.collectedByEmployeeId)?.name;
      }
      return {
        id: p.id,
        type: 'income' as const,
        date: p.date,
        paidMonth: p.date ? p.date.substring(0, 7) : '2026-07',
        title: p.notes || 'Client Payment',
        entity: p.clientName,
        categoryOrType: p.type === 'extra-work' ? `Extra: ${p.workCategory || 'Deliverables'}` : `Client (${p.type === 'monthly' ? 'Monthly' : 'One-time'})`,
        method: p.method || 'Wire',
        notes: p.notes,
        amount: p.amount,
        cashPersonName: cashPerson,
        originalPayment: p
      };
    }),
    ...expenses.map(e => {
      let cashPerson = e.paidByEmployeeName;
      if (!cashPerson && e.paidByEmployeeId) {
        cashPerson = employees.find(emp => emp.id === e.paidByEmployeeId)?.name;
      }
      return {
        id: e.id,
        type: 'expense' as const,
        date: e.date,
        paidMonth: e.paidMonth || e.date?.substring(0, 7) || '2026-07',
        title: e.title,
        entity: e.vendor || 'N/A Payee',
        categoryOrType: e.category,
        method: e.paymentMethod || 'Card',
        notes: e.notes || '',
        amount: e.amount,
        cashPersonName: cashPerson,
        originalExpense: e
      };
    }),
    ...payouts.map(pay => {
      const emp = employees.find(e => e.id === pay.employeeId);
      return {
        id: pay.id,
        type: 'salary' as const,
        date: pay.date,
        paidMonth: pay.paidMonth || (pay.date ? pay.date.substring(0, 7) : '2026-07'),
        title: pay.notes ? `Salary: ${pay.notes}` : `Salary Disbursement`,
        entity: emp ? `${emp.name} (${emp.role})` : pay.employeeName,
        categoryOrType: 'Payroll / Salary',
        method: 'Bank Transfer',
        notes: pay.notes || `Monthly salary for ${formatMonth(pay.paidMonth)}`,
        amount: pay.amount,
        originalPayout: pay
      };
    })
  ].sort((a, b) => b.date.localeCompare(a.date));

  // Filter unified list
  const filteredTransactions = unifiedTransactions.filter(item => {
    // 1. Type filter
    if (transactionTypeFilter === 'income' && item.type !== 'income') return false;
    if (transactionTypeFilter === 'expense' && item.type !== 'expense') return false;
    if (transactionTypeFilter === 'salary' && item.type !== 'salary') return false;

    // 2. Search query
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      item.title.toLowerCase().includes(q) ||
      item.entity.toLowerCase().includes(q) ||
      item.notes.toLowerCase().includes(q) ||
      item.categoryOrType.toLowerCase().includes(q);
    if (!matchesSearch) return false;

    // 3. Payment Method
    if (methodFilter !== 'all' && item.method !== methodFilter) return false;

    // 4. Expense Category filter
    if (categoryFilter !== 'all' && item.type === 'expense' && item.categoryOrType !== categoryFilter) {
      return false;
    }

    // 5. Date Range
    if (startDate && item.date < startDate) return false;
    if (endDate && item.date > endDate) return false;

    return true;
  });

  // KPI Computations
  const totalIncome = unifiedTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = unifiedTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSalaries = unifiedTransactions
    .filter(t => t.type === 'salary')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpense - totalSalaries;

  // Handle Submit Form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (entryType === 'income') {
      if (!selectedClientId) {
        setFormError('Please select a paying client.');
        return;
      }
      const numAmt = parseFloat(incomeAmount);
      if (isNaN(numAmt) || numAmt <= 0) {
        setFormError('Please enter a valid income amount greater than $0.');
        return;
      }

      const client = clients.find(c => c.id === selectedClientId);
      if (!client) return;

      const category = incomeType === 'extra-work'
        ? (incomeWorkCategory === 'Other Extra Deliverable' ? (incomeCustomCategory.trim() || 'Extra Deliverable') : incomeWorkCategory)
        : '';

      const defaultNotes = incomeType === 'extra-work'
        ? `Extra work payment: ${category}`
        : `Monthly client retainer revenue collection`;

      const collectorEmp = employees.find(e => e.id === incomeCollectorEmpId) || 
        employees.find(e => e.id === client.assignedEmployeeId) || 
        employees[0];

      onLogPayment({
        clientId: client.id,
        clientName: `${client.name} (${client.company})`,
        amount: numAmt,
        type: incomeType,
        workCategory: category,
        notes: incomeNotes.trim() || defaultNotes,
        method: incomeMethod,
        collectedByEmployeeId: incomeMethod === 'Cash' ? (collectorEmp?.id || '') : undefined,
        collectedByEmployeeName: incomeMethod === 'Cash' ? (collectorEmp?.name || '') : undefined,
        date: incomeDate || new Date().toISOString().split('T')[0],
        paidMonth: incomePaidMonth
      });

      // Reset
      setSelectedClientId('');
      setIncomeAmount('');
      setIncomeType('monthly');
      setIncomeWorkCategory('Extra Video Editing / Production');
      setIncomeCustomCategory('');
      setIncomeMethod('Wire');
      setIncomeCollectorEmpId('');
      setIncomeDate(new Date().toISOString().split('T')[0]);
      setIncomePaidMonth(new Date().toISOString().substring(0, 7));
      setIncomeNotes('');
      setIsModalOpen(false);
    } else if (entryType === 'expense') {
      // Expense
      if (!expenseTitle.trim()) {
        setFormError('Please enter an expense title.');
        return;
      }
      const numAmt = parseFloat(expenseAmount);
      if (isNaN(numAmt) || numAmt <= 0) {
        setFormError('Please enter a valid expense amount greater than $0.');
        return;
      }

      const spenderEmp = employees.find(e => e.id === expenseSpenderEmpId) || employees[0];

      onAddExpense({
        title: expenseTitle.trim(),
        category: expenseCategory,
        amount: numAmt,
        date: expenseDate || new Date().toISOString().split('T')[0],
        paidMonth: expensePaidMonth || new Date().toISOString().substring(0, 7),
        paymentMethod: expenseMethod,
        paidByEmployeeId: expenseMethod === 'Cash' ? (spenderEmp?.id || '') : undefined,
        paidByEmployeeName: expenseMethod === 'Cash' ? (spenderEmp?.name || '') : undefined,
        vendor: expenseVendor.trim() || 'N/A',
        notes: expenseNotes.trim()
      });

      // Reset
      setExpenseTitle('');
      setExpenseCategory('Rent');
      setExpenseAmount('');
      setExpenseDate(new Date().toISOString().split('T')[0]);
      setExpensePaidMonth(new Date().toISOString().substring(0, 7));
      setExpenseMethod('Card');
      setExpenseSpenderEmpId('');
      setExpenseVendor('');
      setExpenseNotes('');
      setIsModalOpen(false);
    } else if (entryType === 'salary') {
      // Salary Payout
      if (!selectedSalaryEmpId) {
        setFormError('Please select a recipient employee.');
        return;
      }
      const numAmt = parseFloat(salaryAmount);
      if (isNaN(numAmt) || numAmt <= 0) {
        setFormError('Please enter a valid salary amount greater than 0.');
        return;
      }

      const emp = employees.find(e => e.id === selectedSalaryEmpId);
      if (!emp) return;

      if (onPayEmployee) {
        onPayEmployee({
          employeeId: emp.id,
          employeeName: emp.name,
          amount: numAmt,
          date: salaryDate || new Date().toISOString().split('T')[0],
          paidMonth: salaryPaidMonth || new Date().toISOString().substring(0, 7),
          notes: salaryNotes.trim() || `Monthly salary disbursement for ${formatMonth(salaryPaidMonth)}`
        });
      }

      // Reset
      setSelectedSalaryEmpId('');
      setSalaryAmount('');
      setSalaryDate(new Date().toISOString().split('T')[0]);
      setSalaryPaidMonth(new Date().toISOString().substring(0, 7));
      setSalaryPaymentMethod('Bank Transfer');
      setSalaryNotes('');
      setIsModalOpen(false);
    }
  };

  // Download Voucher
  const handleDownloadVoucher = (tx: UnifiedTransaction) => {
    const isInc = tx.type === 'income';
    const isSal = tx.type === 'salary';
    const compName = companySettings?.companyName || 'ScarletCRM Operations';
    const compTagline = isSal 
      ? (companySettings?.companyTagline || 'Corporate Payroll & Compensation')
      : (companySettings?.companyTagline || 'Financial Transaction Voucher');
    const logoImg = companySettings?.logoUrl 
      ? `<img src="${companySettings.logoUrl}" alt="${compName}" style="max-height: 55px; max-width: 220px; object-fit: contain; margin-bottom: 8px; display: block;" />`
      : '';
    const compAddress = companySettings?.address || '100 Corporate Plaza, Suite 500, New York, NY 10001';
    const compEmail = companySettings?.email || (isSal ? 'payroll@company.com' : 'billing@company.com');

    const headerGradient = isInc 
      ? 'linear-gradient(to right, #10b981, #047857)' 
      : isSal 
      ? 'linear-gradient(to right, #6366f1, #4338ca)' 
      : 'linear-gradient(to right, #ef4444, #b91c1c)';

    const themeColor = isInc ? '#10b981' : isSal ? '#818cf8' : '#ef4444';
    const docTitle = isInc ? 'Income Receipt' : isSal ? 'Salary Disbursement Voucher' : 'Expense Voucher';
    const docPrefix = isInc ? 'REC' : isSal ? 'SAL' : 'EXP';
    const typeDisplayName = isInc ? 'INCOME / REVENUE' : isSal ? 'EMPLOYEE SALARY PAYROLL' : 'OPERATING EXPENSE';
    const entityFieldLabel = isInc ? 'Paying Client:' : isSal ? 'Beneficiary Employee:' : 'Payee / Vendor:';

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${docTitle} - ${tx.title} (${compName})</title>
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: #0c0a09;
      color: #e4e4e7;
      margin: 0;
      padding: 40px 20px;
      display: flex;
      justify-content: center;
    }
    .container {
      width: 100%;
      max-width: 680px;
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
      position: relative;
    }
    .header-border {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: ${headerGradient};
      border-radius: 8px 8px 0 0;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid #27272a;
      padding-bottom: 24px;
      margin-bottom: 30px;
    }
    .company-title {
      font-size: 20px;
      font-weight: 900;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #fafafa;
    }
    .company-subtitle {
      font-size: 11px;
      font-family: monospace;
      color: #a1a1aa;
      letter-spacing: 0.05em;
      margin-top: 4px;
    }
    .company-address {
      font-size: 10px;
      font-family: monospace;
      color: #71717a;
      margin-top: 4px;
      line-height: 1.4;
    }
    .document-title {
      font-size: 18px;
      font-weight: 800;
      color: #fafafa;
      text-align: right;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .document-id {
      font-size: 10px;
      font-family: monospace;
      color: ${themeColor};
      text-align: right;
      margin-top: 4px;
    }
    .grid {
      display: grid;
      grid-template-cols: 1fr 1fr;
      gap: 30px;
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 10px;
      font-family: monospace;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #a1a1aa;
      border-bottom: 1px solid #27272a;
      padding-bottom: 6px;
      margin-bottom: 12px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 12px;
    }
    .info-label {
      color: #71717a;
    }
    .info-value {
      color: #e4e4e7;
      font-weight: 500;
    }
    .info-value.mono {
      font-family: monospace;
    }
    .table-container {
      border: 1px solid #27272a;
      border-radius: 6px;
      overflow: hidden;
      margin-bottom: 30px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    th {
      background: #27272a;
      color: #a1a1aa;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 10px;
      font-family: monospace;
      letter-spacing: 0.05em;
      text-align: left;
      padding: 10px 14px;
    }
    td {
      padding: 14px;
      border-bottom: 1px solid #27272a;
    }
    .total-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px dashed #27272a;
    }
    .total-box {
      text-align: right;
    }
    .total-label {
      font-size: 10px;
      font-family: monospace;
      text-transform: uppercase;
      color: #a1a1aa;
    }
    .total-amount {
      font-size: 24px;
      font-weight: 800;
      color: ${themeColor};
      font-family: monospace;
      margin-top: 4px;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #27272a;
      font-size: 9px;
      font-family: monospace;
      color: #52525b;
      letter-spacing: 0.05em;
    }
    .seal {
      border: 1px dashed ${themeColor};
      color: ${themeColor};
      font-size: 8px;
      font-family: monospace;
      padding: 6px 12px;
      border-radius: 4px;
      display: inline-block;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      transform: rotate(-2deg);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header-border"></div>
    <div class="header">
      <div>
        ${logoImg}
        <div class="company-title">${compName}</div>
        <div class="company-subtitle">${compTagline}</div>
        <div class="company-address">${compAddress}<br>Contact: ${compEmail}</div>
      </div>
      <div>
        <div class="document-title">${docTitle}</div>
        <div class="document-id">${docPrefix}-${tx.id.substring(0, 8).toUpperCase()}</div>
      </div>
    </div>


    <div class="grid">
      <div>
        <div class="section-title">Transaction Details</div>
        <div class="info-row">
          <span class="info-label">Type:</span>
          <span class="info-value font-bold" style="color: ${themeColor}">${typeDisplayName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">${entityFieldLabel}</span>
          <span class="info-value">${tx.entity}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Classification:</span>
          <span class="info-value">${tx.categoryOrType}</span>
        </div>
      </div>
      <div>
        <div class="section-title">Audit Info</div>
        <div class="info-row">
          <span class="info-label">Transaction Date:</span>
          <span class="info-value mono">${tx.date}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Payment Method:</span>
          <span class="info-value mono">${tx.method === 'Cash' ? cashLabel : tx.method}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Payroll Month:</span>
          <span class="info-value mono">${formatMonth(tx.paidMonth)}</span>
        </div>
      </div>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Description / Note</th>
            <th style="text-align: right;">Category</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>${tx.title}</strong><br>
              <span style="font-size: 10px; color: #71717a;">${tx.notes || 'Recorded in financial ledger'}</span>
            </td>
            <td style="text-align: right; font-family: monospace;">${tx.categoryOrType}</td>
            <td style="text-align: right; font-family: monospace; font-weight: bold; color: ${themeColor};">
              ${isInc ? '+' : '-'}${currSymbol}${tx.amount.toLocaleString()}.00
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="total-section">
      <div>
        <div class="seal">AUDITED TRANSACTION APPROVED</div>
      </div>
      <div class="total-box">
        <div class="total-label">Total Net Disbursed / Collected</div>
        <div class="total-amount">${isInc ? '+' : '-'}${currSymbol}${tx.amount.toLocaleString()}.00</div>
      </div>
    </div>

    <div class="footer">
      THIS IS AN OFFICIAL ELECTRONIC FINANCIAL TRANSACTION VOUCHER.<br>
      © 2026 SCARLETCRM OPERATIONS CORP. AUDITED CORPORATE RECORD.
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voucher_${tx.type}_${tx.date}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. TOP TITLE & ACTION BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="text-brand" size={20} />
            <h1 className="text-xl font-display font-bold text-ink tracking-tight uppercase">
              Financial Operations & Ledger
            </h1>
          </div>
          <p className="text-xs text-ink-soft mt-1 font-sans">
            Unified ledger for client revenue collections, operating expenses, and employee cash custody tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEntryType('income');
              setFormError('');
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand hover:bg-brand/90 text-white font-semibold text-xs transition-all shadow-card cursor-pointer"
          >
            <Plus size={16} />
            Add Transaction
          </button>
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* TOTAL REVENUE (INCOME) */}
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-card">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-ink-faint uppercase tracking-wider font-mono block">
                Total Revenue Collected
              </span>
              <span className="text-2xl font-display font-bold text-gain mt-1 block font-mono">
                +{currSymbol}{totalIncome.toLocaleString()}
              </span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-gain-soft border border-gain/30 flex items-center justify-center text-gain">
              <ArrowUpRight size={16} />
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-[10px] text-ink-soft font-mono">
            <span>Income Records:</span>
            <strong className="text-gain">{payments.length}</strong>
          </div>
        </div>

        {/* TOTAL EXPENSES (OVERHEAD) */}
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-card">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-ink-faint uppercase tracking-wider font-mono block">
                Total Operating Overhead
              </span>
              <span className="text-2xl font-display font-bold text-warn mt-1 block font-mono">
                -{currSymbol}{totalExpense.toLocaleString()}
              </span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-warn-soft border border-warn/30 flex items-center justify-center text-warn">
              <ArrowDownRight size={16} />
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-[10px] text-ink-soft font-mono">
            <span>Expense Records:</span>
            <strong className="text-warn">{expenses.length}</strong>
          </div>
        </div>

        {/* TOTAL SALARIES PAID */}
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-card">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-ink-faint uppercase tracking-wider font-mono block">
                Employee Salaries Paid
              </span>
              <span className="text-2xl font-display font-bold text-indigo-400 mt-1 block font-mono">
                -{currSymbol}{totalSalaries.toLocaleString()}
              </span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Users size={16} />
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-[10px] text-ink-soft font-mono">
            <span>Salary Payouts:</span>
            <strong className="text-indigo-400">{payouts.length}</strong>
          </div>
        </div>

        {/* NET BALANCE */}
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-card">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-ink-faint uppercase tracking-wider font-mono block">
                Net Cash Balance
              </span>
              <span className={`text-2xl font-display font-bold mt-1 block font-mono ${
                netBalance >= 0 ? 'text-gain' : 'text-loss'
              }`}>
                {netBalance < 0 ? '-' : '+'}{currSymbol}{Math.abs(netBalance).toLocaleString()}
              </span>
            </div>
            <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${
              netBalance >= 0 
                ? 'bg-gain-soft border-gain/30 text-gain' 
                : 'bg-loss-soft border-loss/30 text-loss'
            }`}>
              <DollarSign size={16} />
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-[10px] text-ink-soft font-mono">
            <span>Total Ledger Entries:</span>
            <strong className="text-ink">{unifiedTransactions.length}</strong>
          </div>
        </div>

      </div>

      {/* 3. TYPE FILTER & SEARCH TOOLBAR */}
      <div className="bg-surface border border-border rounded-2xl p-4 space-y-3 shadow-card">
        
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* TYPE TOGGLE TABS */}
          <div className="flex items-center gap-1.5 bg-surface-2 p-1 rounded-xl border border-border flex-wrap">
            <button
              onClick={() => setTransactionTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                transactionTypeFilter === 'all'
                  ? 'bg-brand text-white font-semibold shadow-sm'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              All ({unifiedTransactions.length})
            </button>
            <button
              onClick={() => setTransactionTypeFilter('income')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                transactionTypeFilter === 'income'
                  ? 'bg-gain text-white font-semibold shadow-sm'
                  : 'text-gain hover:opacity-80'
              }`}
            >
              <ArrowUpRight size={13} />
              Income ({payments.length})
            </button>
            <button
              onClick={() => setTransactionTypeFilter('expense')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                transactionTypeFilter === 'expense'
                  ? 'bg-warn text-white font-semibold shadow-sm'
                  : 'text-warn hover:opacity-80'
              }`}
            >
              <ArrowDownRight size={13} />
              Expenses ({expenses.length})
            </button>
            <button
              onClick={() => setTransactionTypeFilter('salary')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                transactionTypeFilter === 'salary'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-indigo-400 hover:opacity-80'
              }`}
            >
              <Users size={13} />
              Salaries ({payouts.length})
            </button>
          </div>

          {/* SEARCH INPUT */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-2.5 text-ink-faint" size={14} />
            <input
              type="text"
              placeholder="Search by client, title, employee, vendor, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-ink placeholder-ink-faint focus:outline-none focus:border-brand transition-colors"
            />
          </div>

        </div>

        {/* SECONDARY FILTERS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-border">
          
          {/* Payment Method Filter */}
          <div>
            <label className="block text-[10px] text-ink-faint uppercase font-mono mb-1">Payment Method</label>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded-xl py-1.5 px-3 text-xs text-ink focus:outline-none focus:border-brand cursor-pointer font-mono"
            >
              <option value="all">All Payment Methods</option>
              <option value="Wire">Wire Transfer</option>
              <option value="Bank Transfer">Bank Transfer / ACH</option>
              <option value="Card">Credit Card</option>
              <option value="Cash">{cashLabel}</option>
            </select>
          </div>

          {/* Date Range Start */}
          <div>
            <label className="block text-[10px] text-ink-faint uppercase font-mono mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded-xl py-1 px-2.5 text-xs text-ink focus:outline-none focus:border-brand font-mono"
            />
          </div>

          {/* Date Range End */}
          <div>
            <label className="block text-[10px] text-ink-faint uppercase font-mono mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded-xl py-1 px-2.5 text-xs text-ink focus:outline-none focus:border-brand font-mono"
            />
          </div>

        </div>

      </div>

      {/* 4. UNIFIED LEDGER TABLE */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-card">
        <div className="p-4 border-b border-border flex justify-between items-center bg-surface-2">
          <div className="flex items-center gap-2">
            <h2 className="font-display font-bold text-sm text-ink uppercase tracking-wide">
              Transactions Ledger
            </h2>
            <span className="text-[10px] font-mono text-ink-soft bg-surface px-2 py-0.5 rounded-lg border border-border">
              {filteredTransactions.length} Items Displayed
            </span>
          </div>

          <div className="text-xs font-mono text-ink-soft hidden sm:block">
            Visible Surplus: <strong className="text-gain">
              {currSymbol}{filteredTransactions.reduce((sum, t) => t.type === 'income' ? sum + t.amount : sum - t.amount, 0).toLocaleString()}
            </strong>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-ink-soft font-sans">
            <ArrowLeftRight className="mx-auto text-ink-faint mb-3" size={32} />
            <p className="text-sm font-medium text-ink-soft">No transactions match your search filter criteria.</p>
            <p className="text-xs text-ink-faint mt-1">Try resetting search parameters or click "Add Transaction".</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-ink-soft">
              <thead className="bg-surface-2 text-[10px] uppercase font-mono text-ink-faint border-b border-border">
                <tr>
                  <th className="py-3 px-4">Date / Month</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Title & Client / Payee / Employee</th>
                  <th className="py-3 px-4">Category / Method</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTransactions.map((tx) => {
                  const isInc = tx.type === 'income';
                  const isSal = tx.type === 'salary';

                  return (
                    <tr key={`${tx.type}-${tx.id}`} className="hover:bg-surface-2/60 transition-colors">
                      {/* DATE */}
                      <td className="py-3.5 px-4 font-mono text-ink-soft whitespace-nowrap">
                        <div className="text-ink font-medium">{tx.date}</div>
                        <div className="text-[10px] text-ink-faint">Month: {formatMonth(tx.paidMonth)}</div>
                      </td>

                      {/* TYPE BADGE */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-mono border ${
                          isInc 
                            ? 'bg-gain-soft text-gain border-gain/30' 
                            : isSal
                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                            : 'bg-warn-soft text-warn border-warn/30'
                        }`}>
                          {isInc ? <ArrowUpRight size={12} /> : isSal ? <Users size={12} /> : <ArrowDownRight size={12} />}
                          {isInc ? 'INCOME' : isSal ? 'SALARY' : 'EXPENSE'}
                        </span>
                      </td>

                      {/* TITLE & ENTITY */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-ink">{tx.title}</div>
                        <div className="text-[11px] text-ink-soft flex items-center gap-1.5 mt-0.5">
                          <span className="text-ink-faint font-mono uppercase text-[9px]">
                            {isInc ? 'Client:' : isSal ? 'Employee:' : 'Payee/Vendor:'}
                          </span>
                          <span className="text-ink-soft">{tx.entity}</span>
                        </div>
                        {tx.notes && tx.notes !== tx.title && (
                          <div className="text-[10px] text-ink-faint italic mt-0.5 truncate max-w-md">
                            "{tx.notes}"
                          </div>
                        )}
                      </td>

                      {/* CATEGORY & METHOD */}
                      <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                        <div className="text-ink-soft text-xs">{tx.categoryOrType}</div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded-md border ${
                            tx.method === 'Cash' 
                              ? 'bg-amber-500/15 border-amber-500/30 text-amber-500 font-semibold' 
                              : isSal
                              ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
                              : 'bg-surface-2 border-border text-ink-faint'
                          }`}>
                            {tx.method === 'Cash' ? cashLabel : tx.method}
                          </span>
                          {tx.method === 'Cash' && tx.cashPersonName && (
                            <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-sans font-medium" title={isInc ? "Cash held by this employee" : "Paid from cash holding of this employee"}>
                              <Users size={10} />
                              {isInc ? 'In Hand:' : 'Paid:'} {tx.cashPersonName}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* AMOUNT */}
                      <td className={`py-3.5 px-4 text-right font-mono text-sm font-bold whitespace-nowrap ${
                        isInc ? 'text-gain' : isSal ? 'text-indigo-400' : 'text-warn'
                      }`}>
                        {isInc ? '+' : '-'}{currSymbol}{tx.amount.toLocaleString()}
                      </td>

                      {/* ACTIONS */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDownloadVoucher(tx)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-surface-2 hover:bg-surface border border-border text-[10px] text-ink-soft hover:text-ink transition-colors cursor-pointer font-mono"
                            title="Download Official Transaction Voucher"
                          >
                            <Download size={11} />
                            RECEIPT
                          </button>

                          <button
                            onClick={() => setDeleteTarget({ id: tx.id, type: tx.type, name: tx.title })}
                            className="p-1.5 rounded-lg hover:bg-loss-soft text-ink-faint hover:text-loss transition-colors cursor-pointer"
                            title="Delete Transaction Record"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. ADD TRANSACTION MODAL (PROMPTS TYPE: INCOME VS EXPENSE) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface border border-border rounded-2xl max-w-lg w-full p-6 shadow-pop relative max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-brand-soft border border-brand/30 flex items-center justify-center text-brand">
                    <ArrowLeftRight size={16} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-ink uppercase tracking-wide">
                      Record Financial Transaction
                    </h3>
                    <p className="text-[10px] text-ink-faint font-mono uppercase">
                      Select whether this entry is Income or an Operating Expense
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-ink-faint hover:text-ink cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* ENTRY TYPE SELECTION TOGGLE (ASK: INCOME VS EXPENSE VS SALARY) */}
              <div className="mb-5 bg-surface-2 p-1.5 rounded-xl border border-border grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEntryType('income');
                    setFormError('');
                  }}
                  className={`py-2.5 px-2 rounded-lg font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    entryType === 'income'
                      ? 'bg-gain text-white shadow-card border border-gain/30'
                      : 'text-ink-soft hover:text-ink bg-surface'
                  }`}
                >
                  <ArrowUpRight size={15} />
                  Income
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEntryType('expense');
                    setFormError('');
                  }}
                  className={`py-2.5 px-2 rounded-lg font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    entryType === 'expense'
                      ? 'bg-warn text-white shadow-card border border-warn/30'
                      : 'text-ink-soft hover:text-ink bg-surface'
                  }`}
                >
                  <ArrowDownRight size={15} />
                  Expense
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEntryType('salary');
                    setFormError('');
                  }}
                  className={`py-2.5 px-2 rounded-lg font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    entryType === 'salary'
                      ? 'bg-indigo-600 text-white shadow-card border border-indigo-500/30'
                      : 'text-ink-soft hover:text-ink bg-surface'
                  }`}
                >
                  <Users size={15} />
                  Salary
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-3 rounded-xl bg-loss-soft border border-loss/30 text-xs text-loss">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* FORM FIELDS FOR INCOME */}
                {entryType === 'income' && (
                  <>
                    <div>
                      <label className="block text-xs text-ink-soft mb-1 font-medium">
                        Paying Client *
                      </label>
                      <select
                        required
                        value={selectedClientId}
                        onChange={(e) => {
                          setSelectedClientId(e.target.value);
                          if (e.target.value) {
                            setIncomeType('monthly');
                          }
                        }}
                        className="w-full bg-surface-2 border border-border rounded-xl py-2 px-3 text-xs text-ink focus:outline-none focus:border-brand cursor-pointer font-mono"
                      >
                        <option value="">Select a Converted Client...</option>
                        {activeClients.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.company} — Contact: {c.name} ({currSymbol}{c.dealValue.toLocaleString()}/mo)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Revenue Type / Nature */}
                    <div>
                      <label className="block text-xs text-ink-soft mb-1 font-medium">
                        Revenue Type / Revenue Classification *
                      </label>
                      <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                        <button
                          type="button"
                          onClick={() => setIncomeType('monthly')}
                          className={`py-2 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                            incomeType === 'monthly'
                              ? 'bg-brand border-brand text-white font-semibold'
                              : 'bg-surface-2 border-border text-ink-soft hover:text-ink'
                          }`}
                        >
                          Monthly Retainer
                        </button>
                        <button
                          type="button"
                          onClick={() => setIncomeType('extra-work')}
                          className={`py-2 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                            incomeType === 'extra-work'
                              ? 'bg-brand border-brand text-white font-semibold'
                              : 'bg-surface-2 border-border text-ink-soft hover:text-ink'
                          }`}
                        >
                          ⚡ Extra Work 
                        </button>
                      </div>
                    </div>

                    {/* Extra Work Category Dropdown */}
                    {incomeType === 'extra-work' && (
                      <div className="bg-brand-soft p-3 rounded-xl border border-brand/30 space-y-3">
                        <div>
                          <label className="block text-xs text-brand font-medium font-mono uppercase mb-1">
                            Extra Deliverable / Work Category *
                          </label>
                          <select
                            value={incomeWorkCategory}
                            onChange={(e) => setIncomeWorkCategory(e.target.value)}
                            className="w-full bg-surface border border-border rounded-xl py-2 px-3 text-xs text-ink focus:outline-none focus:border-brand cursor-pointer font-mono"
                          >
                            <option value="Extra Video Editing / Production">🎬 Extra Video Editing / Production</option>
                            <option value="Branding & Visual Design">🎨 Branding & Visual Design</option>
                            <option value="Flex & Strategy Consulting">⚡ Flex & Strategy Consulting</option>
                            <option value="Website & Software Work">💻 Website & Software Work</option>
                            <option value="Marketing & Ad Campaign">📈 Marketing & Ad Campaign</option>
                            <option value="Other Extra Deliverable">✏️ Other Extra Deliverable (Custom)</option>
                          </select>
                        </div>

                        {incomeWorkCategory === 'Other Extra Deliverable' && (
                          <div>
                            <label className="block text-xs text-ink-soft mb-1 font-medium">Custom Deliverable Name *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Extra Reel Package, Audio Editing..."
                              value={incomeCustomCategory}
                              onChange={(e) => setIncomeCustomCategory(e.target.value)}
                              className="w-full bg-surface border border-border rounded-xl py-2 px-3 text-xs text-ink focus:outline-none focus:border-brand"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-ink-soft mb-1 font-medium">
                          Revenue Amount ({currSymbol}) *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-xs font-mono text-ink-faint">{currSymbol}</span>
                          <input
                            type="number"
                            step="0.01"
                            required
                            placeholder="0.00"
                            value={incomeAmount}
                            onChange={(e) => setIncomeAmount(e.target.value)}
                            className="w-full bg-surface-2 border border-border rounded-xl py-2 pl-7 pr-3 text-xs text-ink font-mono focus:outline-none focus:border-gain"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-ink-soft mb-1 font-medium">
                          Payment Method
                        </label>
                        <select
                          value={incomeMethod}
                          onChange={(e) => setIncomeMethod(e.target.value as any)}
                          className="w-full bg-surface-2 border border-border rounded-xl py-2 px-3 text-xs text-ink font-mono focus:outline-none focus:border-gain cursor-pointer"
                        >
                          <option value="Wire">Wire Transfer</option>
                          <option value="Card">Credit Card</option>
                          <option value="Bank">Bank Deposit / ACH</option>
                          <option value="Cash">{cashLabel}</option>
                        </select>
                      </div>
                    </div>

                    {/* EMPLOYEE HOLDING CASH SELECTOR (WHEN METHOD IS CASH) */}
                    {incomeMethod === 'Cash' && (
                      <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl space-y-1">
                        <div className="flex justify-between items-center">
                          <label className="block text-xs font-semibold text-amber-500 uppercase font-mono tracking-wider">
                            Cash In Hand Custodian (Holding Employee) *
                          </label>
                          <span className="text-[10px] text-amber-500/80 font-mono">
                            Logs who received the cash
                          </span>
                        </div>
                        <select
                          value={incomeCollectorEmpId}
                          onChange={(e) => setIncomeCollectorEmpId(e.target.value)}
                          className="w-full bg-surface border border-amber-500/40 rounded-xl py-2 px-3 text-xs text-ink focus:outline-none focus:border-amber-500 cursor-pointer font-medium"
                          required
                        >
                          <option value="">Select Employee Holding This Cash...</option>
                          {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>
                              {emp.name} ({emp.role})
                            </option>
                          ))}
                        </select>
                        <p className="text-[10px] text-ink-faint mt-1">
                          This cash amount will be added directly to this employee's live cash-in-hand balance.
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-ink-soft mb-1 font-medium">
                          Transaction Date *
                        </label>
                        <input
                          type="date"
                          required
                          value={incomeDate}
                          onChange={(e) => {
                            setIncomeDate(e.target.value);
                            if (e.target.value && e.target.value.length >= 7) {
                              setIncomePaidMonth(e.target.value.substring(0, 7));
                            }
                          }}
                          className="w-full bg-surface-2 border border-border rounded-xl py-2 px-3 text-xs text-ink font-mono focus:outline-none focus:border-gain"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-ink-soft mb-1 font-medium">
                          Accounting Paid Month *
                        </label>
                        <input
                          type="month"
                          required
                          value={incomePaidMonth}
                          onChange={(e) => setIncomePaidMonth(e.target.value)}
                          className="w-full bg-surface-2 border border-border rounded-xl py-2 px-3 text-xs text-ink font-mono focus:outline-none focus:border-gain"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-ink-soft mb-1 font-medium">
                        Reference Notes / Description
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Q3 Retainer payment or Milestone 2 release..."
                        value={incomeNotes}
                        onChange={(e) => setIncomeNotes(e.target.value)}
                        className="w-full bg-surface-2 border border-border rounded-xl py-2 px-3 text-xs text-ink focus:outline-none focus:border-gain"
                      />
                    </div>
                  </>
                )}

                {/* FORM FIELDS FOR EXPENSE */}
                {entryType === 'expense' && (
                  <>
                    <div>
                      <label className="block text-xs text-ink-soft mb-1 font-medium">
                        Expense Title / Description *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Headquarters Lease or AWS Infrastructure Renewal"
                        value={expenseTitle}
                        onChange={(e) => setExpenseTitle(e.target.value)}
                        className="w-full bg-surface-2 border border-border rounded-xl py-2 px-3 text-xs text-ink focus:outline-none focus:border-warn"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-ink-soft mb-1 font-medium">
                          Expense Category *
                        </label>
                        <select
                          value={expenseCategory}
                          onChange={(e) => setExpenseCategory(e.target.value as ExpenseCategory)}
                          className="w-full bg-surface-2 border border-border rounded-xl py-2 px-3 text-xs text-ink focus:outline-none focus:border-warn font-mono"
                        >
                          <option value="Rent">Building / Office Rent</option>
                          <option value="Domain & Infra">Domain & Infra Purchase</option>
                          <option value="Software & Tools">SaaS & Software Tools</option>
                          <option value="Office & Supplies">Office Supplies & Gear</option>
                          <option value="Marketing">Marketing & Advertising</option>
                          <option value="Legal & Professional">Legal & Accounting</option>
                          <option value="Utilities">Utilities & Power</option>
                          <option value="Other">Other Overhead Expense</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-ink-soft mb-1 font-medium">
                          Amount ({currSymbol}) *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-xs font-mono text-ink-faint">{currSymbol}</span>
                          <input
                            type="number"
                            step="0.01"
                            required
                            placeholder="0.00"
                            value={expenseAmount}
                            onChange={(e) => setExpenseAmount(e.target.value)}
                            className="w-full bg-surface-2 border border-border rounded-xl py-2 pl-7 pr-3 text-xs text-ink font-mono focus:outline-none focus:border-warn"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-ink-soft mb-1 font-medium">
                          Transaction Date *
                        </label>
                        <input
                          type="date"
                          required
                          value={expenseDate}
                          onChange={(e) => setExpenseDate(e.target.value)}
                          className="w-full bg-surface-2 border border-border rounded-xl py-2 px-3 text-xs text-ink font-mono focus:outline-none focus:border-warn"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-ink-soft mb-1 font-medium">
                          Accounting Paid Month *
                        </label>
                        <input
                          type="month"
                          required
                          value={expensePaidMonth}
                          onChange={(e) => setExpensePaidMonth(e.target.value)}
                          className="w-full bg-surface-2 border border-border rounded-xl py-2 px-3 text-xs text-ink font-mono focus:outline-none focus:border-warn"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-ink-soft mb-1 font-medium">
                          Vendor / Payee Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. AWS, Metropolitan Real Estate"
                          value={expenseVendor}
                          onChange={(e) => setExpenseVendor(e.target.value)}
                          className="w-full bg-surface-2 border border-border rounded-xl py-2 px-3 text-xs text-ink focus:outline-none focus:border-warn"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-ink-soft mb-1 font-medium">
                          Payment Method
                        </label>
                        <select
                          value={expenseMethod}
                          onChange={(e) => setExpenseMethod(e.target.value as any)}
                          className="w-full bg-surface-2 border border-border rounded-xl py-2 px-3 text-xs text-ink font-mono focus:outline-none focus:border-warn"
                        >
                          <option value="Card">Corporate Credit Card</option>
                          <option value="Wire">Bank Wire Transfer</option>
                          <option value="Bank">Direct Debit / ACH</option>
                          <option value="Cash">{cashLabel} / Petty Cash</option>
                        </select>
                      </div>
                    </div>

                    {/* EMPLOYEE SPENDING CASH SELECTOR (WHEN METHOD IS CASH) */}
                    {expenseMethod === 'Cash' && (
                      <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl space-y-1">
                        <div className="flex justify-between items-center">
                          <label className="block text-xs font-semibold text-amber-500 uppercase font-mono tracking-wider">
                            Paid Out of Cash in Hand of (Employee) *
                          </label>
                          <span className="text-[10px] text-amber-500/80 font-mono">
                            Deducts from employee cash balance
                          </span>
                        </div>
                        <select
                          value={expenseSpenderEmpId}
                          onChange={(e) => setExpenseSpenderEmpId(e.target.value)}
                          className="w-full bg-surface border border-amber-500/40 rounded-xl py-2 px-3 text-xs text-ink focus:outline-none focus:border-amber-500 cursor-pointer font-medium"
                          required
                        >
                          <option value="">Select Employee Who Paid This Cash...</option>
                          {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>
                              {emp.name} ({emp.role})
                            </option>
                          ))}
                        </select>
                        <p className="text-[10px] text-ink-faint mt-1">
                          This expense will be deducted directly from this employee's live cash-in-hand holding.
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs text-ink-soft mb-1 font-medium">
                        Audit Notes / Description
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Monthly office lease or domain maintenance..."
                        value={expenseNotes}
                        onChange={(e) => setExpenseNotes(e.target.value)}
                        className="w-full bg-surface-2 border border-border rounded-xl py-2 px-3 text-xs text-ink focus:outline-none focus:border-warn"
                      />
                    </div>
                  </>
                )}

                {/* FORM FIELDS FOR SALARY */}
                {entryType === 'salary' && (
                  <>
                    <div>
                      <label className="block text-xs text-ink-soft mb-1 font-medium">
                        Recipient Employee *
                      </label>
                      <select
                        required
                        value={selectedSalaryEmpId}
                        onChange={(e) => {
                          setSelectedSalaryEmpId(e.target.value);
                          const emp = employees.find(empItem => empItem.id === e.target.value);
                          if (emp) {
                            setSalaryAmount(emp.salary.toString());
                          }
                        }}
                        className="w-full bg-surface-2 border border-border rounded-xl py-2 px-3 text-xs text-ink focus:outline-none focus:border-indigo-500 cursor-pointer font-mono"
                      >
                        <option value="">Select Employee...</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} — {emp.role} (Standard: {currSymbol}{emp.salary.toLocaleString()}/mo)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-ink-soft mb-1 font-medium">
                          Salary Amount ({currSymbol}) *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-xs font-mono text-ink-faint">{currSymbol}</span>
                          <input
                            type="number"
                            required
                            min="1"
                            step="any"
                            placeholder="0.00"
                            value={salaryAmount}
                            onChange={(e) => setSalaryAmount(e.target.value)}
                            className="w-full bg-surface-2 border border-border rounded-xl py-2 pl-7 pr-3 text-xs text-ink font-mono focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-ink-soft mb-1 font-medium">
                          Disbursement Date *
                        </label>
                        <input
                          type="date"
                          required
                          value={salaryDate}
                          onChange={(e) => setSalaryDate(e.target.value)}
                          className="w-full bg-surface-2 border border-border rounded-xl py-2 px-3 text-xs text-ink font-mono focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-ink-soft mb-1 font-medium">
                          Salary Month *
                        </label>
                        <input
                          type="month"
                          required
                          value={salaryPaidMonth}
                          onChange={(e) => setSalaryPaidMonth(e.target.value)}
                          className="w-full bg-surface-2 border border-border rounded-xl py-2 px-3 text-xs text-ink font-mono focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-ink-soft mb-1 font-medium">
                          Disbursement Method
                        </label>
                        <select
                          value={salaryPaymentMethod}
                          onChange={(e) => setSalaryPaymentMethod(e.target.value as any)}
                          className="w-full bg-surface-2 border border-border rounded-xl py-2 px-3 text-xs text-ink font-mono focus:outline-none focus:border-indigo-500"
                        >
                          <option value="Bank Transfer">Direct Bank Transfer / NEFT</option>
                          <option value="Direct Deposit">Direct Deposit / ACH</option>
                          <option value="Wire">Wire Transfer</option>
                          <option value="Cash">{cashLabel} / Hand Cash</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-ink-soft mb-1 font-medium">
                        Disbursement Notes / Reference
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Monthly payroll for performance and retainer..."
                        value={salaryNotes}
                        onChange={(e) => setSalaryNotes(e.target.value)}
                        className="w-full bg-surface-2 border border-border rounded-xl py-2 px-3 text-xs text-ink focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </>
                )}

                {/* BUTTONS */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-surface-2 hover:bg-surface text-xs font-semibold text-ink-soft hover:text-ink transition-all cursor-pointer border border-border"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all cursor-pointer shadow-card ${
                      entryType === 'income' 
                        ? 'bg-gain hover:bg-gain/90' 
                        : entryType === 'salary'
                        ? 'bg-indigo-600 hover:bg-indigo-500'
                        : 'bg-warn hover:bg-warn/90'
                    }`}
                  >
                    Post {entryType === 'income' ? 'Income Revenue' : entryType === 'salary' ? 'Salary Payout' : 'Operating Expense'}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-surface border border-border w-full max-w-md rounded-2xl p-6 shadow-pop"
            >
              <div className="flex items-center gap-2.5 text-loss mb-4">
                <AlertCircle size={18} />
                <h3 className="font-display font-bold text-sm text-ink">
                  Delete {deleteTarget.type === 'income' ? 'Income' : deleteTarget.type === 'salary' ? 'Salary Payout' : 'Expense'} Record
                </h3>
              </div>

              <p className="text-xs text-ink-soft">
                Are you sure you want to delete <strong className="text-ink">"{deleteTarget.name}"</strong>? This will remove the record from the financial ledger and update company metrics.
              </p>

              <div className="pt-5 flex justify-end gap-2 text-xs font-medium">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="bg-surface-2 hover:bg-surface text-ink-soft py-1.5 px-3 rounded-xl cursor-pointer border border-border"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (deleteTarget.type === 'income') {
                      onDeletePayment(deleteTarget.id);
                    } else if (deleteTarget.type === 'salary') {
                      if (onDeletePayout) {
                        onDeletePayout(deleteTarget.id);
                      }
                    } else {
                      onDeleteExpense(deleteTarget.id);
                    }
                    setDeleteTarget(null);
                  }}
                  className="bg-loss hover:bg-loss/90 text-white py-1.5 px-4 rounded-xl cursor-pointer transition-colors shadow-card"
                >
                  Confirm Deletion
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

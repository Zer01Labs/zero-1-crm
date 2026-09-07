import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Receipt, Plus, Search, Trash2, Download, Building2, Server, 
  Laptop, ShoppingBag, Megaphone, ShieldCheck, Zap, HelpCircle,
  Calendar, CreditCard, DollarSign, X, Filter, Sparkles, CheckCircle2
} from 'lucide-react';
import { Expense, ExpenseCategory } from '../types';

interface ExpenseSectionProps {
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onDeleteExpense: (id: string) => void;
}

export default function ExpenseSection({
  expenses,
  onAddExpense,
  onDeleteExpense
}: ExpenseSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Expense Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Rent');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paidMonth, setPaidMonth] = useState(() => new Date().toISOString().substring(0, 7));
  const [paymentMethod, setPaymentMethod] = useState<'Wire' | 'Card' | 'Bank' | 'Cash'>('Card');
  const [vendor, setVendor] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Category Colors and Icons map
  const categoryConfig: Record<ExpenseCategory, { color: string; bg: string; border: string; icon: any }> = {
    'Rent': { 
      color: 'text-purple-400', 
      bg: 'bg-purple-950/40', 
      border: 'border-purple-800/50', 
      icon: Building2 
    },
    'Domain & Infra': { 
      color: 'text-cyan-400', 
      bg: 'bg-cyan-950/40', 
      border: 'border-cyan-800/50', 
      icon: Server 
    },
    'Software & Tools': { 
      color: 'text-emerald-400', 
      bg: 'bg-emerald-950/40', 
      border: 'border-emerald-800/50', 
      icon: Laptop 
    },
    'Office & Supplies': { 
      color: 'text-amber-400', 
      bg: 'bg-amber-950/40', 
      border: 'border-amber-800/50', 
      icon: ShoppingBag 
    },
    'Marketing': { 
      color: 'text-pink-400', 
      bg: 'bg-pink-950/40', 
      border: 'border-pink-800/50', 
      icon: Megaphone 
    },
    'Legal & Professional': { 
      color: 'text-blue-400', 
      bg: 'bg-blue-950/40', 
      border: 'border-blue-800/50', 
      icon: ShieldCheck 
    },
    'Utilities': { 
      color: 'text-yellow-400', 
      bg: 'bg-yellow-950/40', 
      border: 'border-yellow-800/50', 
      icon: Zap 
    },
    'Other': { 
      color: 'text-zinc-400', 
      bg: 'bg-zinc-900', 
      border: 'border-zinc-800', 
      icon: HelpCircle 
    }
  };

  // Month Utility Formatter
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

  // Computed Totals
  const totalExpensesAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const rentTotal = expenses.filter(e => e.category === 'Rent').reduce((sum, e) => sum + e.amount, 0);
  const infraTotal = expenses.filter(e => e.category === 'Domain & Infra').reduce((sum, e) => sum + e.amount, 0);
  const softwareTotal = expenses.filter(e => e.category === 'Software & Tools').reduce((sum, e) => sum + e.amount, 0);

  // Filtered Expenses List
  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = 
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.vendor && e.vendor.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.notes && e.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || e.category === selectedCategory;

    return matchesSearch && matchesCategory;
  }).sort((a, b) => b.date.localeCompare(a.date));

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Please enter an expense title / description.');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError('Please enter a valid expense amount greater than $0.');
      return;
    }

    onAddExpense({
      title: title.trim(),
      category,
      amount: numAmount,
      date: date || new Date().toISOString().split('T')[0],
      paidMonth: paidMonth || new Date().toISOString().substring(0, 7),
      paymentMethod,
      vendor: vendor.trim() || 'N/A',
      notes: notes.trim()
    });

    // Reset Form
    setTitle('');
    setCategory('Rent');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setPaidMonth(new Date().toISOString().substring(0, 7));
    setPaymentMethod('Card');
    setVendor('');
    setNotes('');
    setFormError('');
    setIsAddModalOpen(false);
  };

  // Download Voucher
  const handleDownloadVoucher = (exp: Expense) => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Expense Voucher - ${exp.title}</title>
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
      max-width: 650px;
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
      background: linear-gradient(to right, #ef4444, #78716c);
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
      font-size: 18px;
      font-weight: 900;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #fafafa;
    }
    .company-title span {
      color: #ef4444;
    }
    .company-subtitle {
      font-size: 10px;
      font-family: monospace;
      color: #71717a;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-top: 4px;
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
      color: #ef4444;
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
    tr:last-child td {
      border-bottom: none;
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
      color: #ef4444;
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
      border: 1px dashed #ef4444;
      color: #ef4444;
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
        <div class="company-title">Scarlet<span>CRM</span></div>
        <div class="company-subtitle">Corporate Expense Disburse Voucher</div>
      </div>
      <div>
        <div class="document-title">Expense Receipt</div>
        <div class="document-id">VOUCHER-${exp.id.substring(0, 8).toUpperCase()}</div>
      </div>
    </div>

    <div class="grid">
      <div>
        <div class="section-title">Expense Item Details</div>
        <div class="info-row">
          <span class="info-label">Title / Item:</span>
          <span class="info-value">${exp.title}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Category:</span>
          <span class="info-value font-bold">${exp.category}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Vendor / Payee:</span>
          <span class="info-value">${exp.vendor || 'N/A'}</span>
        </div>
      </div>
      <div>
        <div class="section-title">Accounting & Audit</div>
        <div class="info-row">
          <span class="info-label">Expense Date:</span>
          <span class="info-value mono">${exp.date}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Accounting Month:</span>
          <span class="info-value mono">${formatMonth(exp.paidMonth)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Payment Method:</span>
          <span class="info-value mono">${exp.paymentMethod || 'Card'}</span>
        </div>
      </div>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Description & Reference Notes</th>
            <th style="text-align: right;">Category</th>
            <th style="text-align: right;">Disbursed Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>${exp.title}</strong><br>
              <span style="font-size: 10px; color: #71717a;">${exp.notes || 'Operating expense transaction'}</span>
            </td>
            <td style="text-align: right; font-family: monospace;">${exp.category}</td>
            <td style="text-align: right; font-family: monospace; font-weight: bold; color: #fafafa;">$${exp.amount.toLocaleString()}.00</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="total-section">
      <div>
        <div class="seal">Corporate Audit Approved</div>
      </div>
      <div class="total-box">
        <div class="total-label">Total Overhead Disbursement</div>
        <div class="total-amount">$${exp.amount.toLocaleString()}.00</div>
      </div>
    </div>

    <div class="footer">
      THIS IS AN OFFICIAL ELECTRONIC EXPENSE DISBURSEMENT VOUCHER.<br>
      © 2026 SCARLETCRM OPERATIONS CORP. AUDITED CORPORATE RECEIPT.
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense_voucher_${exp.category}_${exp.date}.html`;
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
            <Receipt className="text-loss" size={20} />
            <h1 className="text-xl font-display font-bold text-ink tracking-tight uppercase">
              Operating Expenses & Overhead
            </h1>
          </div>
          <p className="text-xs text-ink-faint mt-1 font-sans">
            Track office rent, domain & cloud infrastructure purchases, software subscriptions, and corporate overhead.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded bg-brand hover:bg-brand-hover text-brand-contrast font-semibold text-xs transition-all shadow-xs cursor-pointer"
        >
          <Plus size={16} />
          Record New Expense
        </button>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* TOTAL EXPENSES */}
        <div className="bg-surface border border-border rounded-lg p-4 relative overflow-hidden shadow-card">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-ink-faint uppercase tracking-wider font-mono block">
                Total Overhead Expenses
              </span>
              <span className="text-2xl font-display font-bold text-loss mt-1 block font-mono">
                ${totalExpensesAmount.toLocaleString()}
              </span>
            </div>
            <div className="w-8 h-8 rounded bg-loss-faint border border-loss/30 flex items-center justify-center text-loss">
              <Receipt size={16} />
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-[10px] text-ink-faint font-mono">
            <span>Recorded Items:</span>
            <strong className="text-ink">{expenses.length}</strong>
          </div>
        </div>

        {/* RENT EXPENSES */}
        <div className="bg-surface border border-border rounded-lg p-4 shadow-card">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-ink-faint uppercase tracking-wider font-mono block">
                Office & Building Rent
              </span>
              <span className="text-2xl font-display font-bold text-brand mt-1 block font-mono">
                ${rentTotal.toLocaleString()}
              </span>
            </div>
            <div className="w-8 h-8 rounded bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
              <Building2 size={16} />
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-[10px] text-ink-faint font-mono">
            <span>Lease Entries:</span>
            <strong className="text-ink">{expenses.filter(e => e.category === 'Rent').length}</strong>
          </div>
        </div>

        {/* INFRA & DOMAINS */}
        <div className="bg-surface border border-border rounded-lg p-4 shadow-card">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-ink-faint uppercase tracking-wider font-mono block">
                Domain & Infra Purchase
              </span>
              <span className="text-2xl font-display font-bold text-brand mt-1 block font-mono">
                ${infraTotal.toLocaleString()}
              </span>
            </div>
            <div className="w-8 h-8 rounded bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
              <Server size={16} />
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-[10px] text-ink-faint font-mono">
            <span>Cloud & Domains:</span>
            <strong className="text-ink">{expenses.filter(e => e.category === 'Domain & Infra').length}</strong>
          </div>
        </div>

        {/* SOFTWARE & TOOLS */}
        <div className="bg-surface border border-border rounded-lg p-4 shadow-card">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-ink-faint uppercase tracking-wider font-mono block">
                SaaS & Software Tools
              </span>
              <span className="text-2xl font-display font-bold text-gain mt-1 block font-mono">
                ${softwareTotal.toLocaleString()}
              </span>
            </div>
            <div className="w-8 h-8 rounded bg-gain/10 border border-gain/20 flex items-center justify-center text-gain">
              <Laptop size={16} />
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-[10px] text-ink-faint font-mono">
            <span>Tool Subscriptions:</span>
            <strong className="text-ink">{expenses.filter(e => e.category === 'Software & Tools').length}</strong>
          </div>
        </div>

      </div>

      {/* 3. FILTER & SEARCH TOOLBAR */}
      <div className="bg-surface border border-border rounded-lg p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-card">
        
        {/* SEARCH INPUT */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 text-ink-faint" size={14} />
          <input
            type="text"
            placeholder="Search by title, vendor name, or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface-2 border border-border rounded pl-9 pr-3 py-2 text-xs text-ink placeholder-ink-faint focus:outline-none focus:border-brand transition-colors"
          />
        </div>

        {/* CATEGORY FILTER SELECTOR */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
          <span className="text-[10px] text-ink-faint uppercase font-mono font-semibold flex items-center gap-1">
            <Filter size={11} /> Category:
          </span>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded text-xs font-mono transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-brand text-brand-contrast font-semibold'
                : 'bg-surface-2 text-ink-soft hover:text-ink border border-border'
            }`}
          >
            All Categories
          </button>
          {Object.keys(categoryConfig).map((catKey) => {
            const cat = catKey as ExpenseCategory;
            const config = categoryConfig[cat];
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1.5 rounded text-xs font-mono transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? `${config.bg} ${config.color} border ${config.border} font-bold`
                    : 'bg-surface-2 text-ink-soft hover:text-ink border border-border'
                }`}
              >
                <config.icon size={12} />
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. EXPENSE LEDGER TABLE */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden shadow-card">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h2 className="font-display font-bold text-sm text-ink uppercase tracking-wide">
              Operating Expenses Ledger
            </h2>
            <span className="text-[10px] font-mono text-ink-faint bg-surface-2 px-2 py-0.5 rounded border border-border">
              {filteredExpenses.length} Records
            </span>
          </div>

          <div className="text-xs font-mono text-ink-soft">
            Total Displayed: <strong className="text-loss">${filteredExpenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}</strong>
          </div>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center text-ink-faint font-sans">
            <Receipt className="mx-auto text-ink-faint mb-3" size={32} />
            <p className="text-sm font-medium text-ink-soft">No expenses found matching filter criteria.</p>
            <p className="text-xs text-ink-faint mt-1">Try resetting your search query or click "Record New Expense" above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-ink-soft">
              <thead className="bg-surface-2 text-[10px] uppercase font-mono text-ink-faint border-b border-border">
                <tr>
                  <th className="py-3 px-4">Date / Month</th>
                  <th className="py-3 px-4">Expense Title & Vendor</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredExpenses.map((exp) => {
                  const config = categoryConfig[exp.category] || categoryConfig['Other'];
                  const Icon = config.icon;

                  return (
                    <tr key={exp.id} className="hover:bg-surface-2/50 transition-colors">
                      {/* DATE */}
                      <td className="py-3.5 px-4 font-mono text-ink-faint whitespace-nowrap">
                        <div className="text-ink font-medium">{exp.date}</div>
                        <div className="text-[10px] text-ink-faint">Month: {formatMonth(exp.paidMonth)}</div>
                      </td>

                      {/* TITLE & VENDOR */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-ink">{exp.title}</div>
                        <div className="text-[11px] text-ink-soft flex items-center gap-1.5 mt-0.5">
                          <span className="text-ink-faint font-mono uppercase text-[9px]">Vendor:</span>
                          <span className="text-ink-soft">{exp.vendor || 'N/A'}</span>
                        </div>
                        {exp.notes && (
                          <div className="text-[10px] text-ink-faint italic mt-0.5 truncate max-w-md">
                            "{exp.notes}"
                          </div>
                        )}
                      </td>

                      {/* CATEGORY BADGE */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono border ${config.bg} ${config.color} ${config.border}`}>
                          <Icon size={12} />
                          {exp.category}
                        </span>
                      </td>

                      {/* PAYMENT METHOD */}
                      <td className="py-3.5 px-4 font-mono text-ink-faint whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-surface-2 border border-border text-[10px] text-ink-soft">
                          {exp.paymentMethod || 'Card'}
                        </span>
                      </td>

                      {/* AMOUNT */}
                      <td className="py-3.5 px-4 text-right font-mono text-sm font-bold text-loss whitespace-nowrap">
                        ${exp.amount.toLocaleString()}
                      </td>

                      {/* ACTIONS */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDownloadVoucher(exp)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface-2 hover:bg-border border border-border text-[10px] text-ink-soft hover:text-ink transition-colors cursor-pointer font-mono"
                            title="Download official expense voucher / receipt"
                          >
                            <Download size={11} />
                            RECEIPT
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete the expense "${exp.title}"?`)) {
                                onDeleteExpense(exp.id);
                              }
                            }}
                            className="p-1.5 rounded hover:bg-loss-faint text-ink-faint hover:text-loss transition-colors cursor-pointer"
                            title="Delete Expense Record"
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

      {/* 5. ADD EXPENSE MODAL */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface border border-border rounded-lg max-w-lg w-full p-6 shadow-pop relative max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded bg-loss-faint border border-loss/30 flex items-center justify-center text-loss">
                    <Receipt size={16} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-ink uppercase tracking-wide">
                      Record Operating Expense
                    </h3>
                    <p className="text-[10px] text-ink-faint font-mono uppercase">
                      Rent, Domain Infra, Software, & Overhead
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 rounded text-ink-faint hover:text-ink hover:bg-surface-2 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-3 rounded bg-loss-faint border border-loss/30 text-xs text-loss">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* EXPENSE TITLE */}
                <div>
                  <label className="block text-xs text-ink-soft mb-1 font-medium">
                    Expense Title / Description *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Office Rent HQ Suite or AWS Infrastructure Renewal"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-surface-2 border border-border rounded py-2 px-3 text-xs text-ink focus:outline-none focus:border-brand"
                  />
                </div>

                {/* CATEGORY & AMOUNT */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-ink-soft mb-1 font-medium">
                      Expense Category *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                      className="w-full bg-surface-2 border border-border rounded py-2 px-3 text-xs text-ink focus:outline-none focus:border-brand font-mono"
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
                      Amount ($ USD) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-mono text-ink-faint">$</span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-surface-2 border border-border rounded py-2 pl-7 pr-3 text-xs text-ink font-mono focus:outline-none focus:border-brand"
                      />
                    </div>
                  </div>
                </div>

                {/* DATE & PAID MONTH */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-ink-soft mb-1 font-medium">
                      Transaction Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-surface-2 border border-border rounded py-2 px-3 text-xs text-ink font-mono focus:outline-none focus:border-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-ink-soft mb-1 font-medium">
                      Accounting Paid Month *
                    </label>
                    <input
                      type="month"
                      required
                      value={paidMonth}
                      onChange={(e) => setPaidMonth(e.target.value)}
                      className="w-full bg-surface-2 border border-border rounded py-2 px-3 text-xs text-ink font-mono focus:outline-none focus:border-brand"
                    />
                  </div>
                </div>

                {/* VENDOR & PAYMENT METHOD */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-ink-soft mb-1 font-medium">
                      Vendor / Payee Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. AWS, Metropolitan Real Estate"
                      value={vendor}
                      onChange={(e) => setVendor(e.target.value)}
                      className="w-full bg-surface-2 border border-border rounded py-2 px-3 text-xs text-ink focus:outline-none focus:border-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-ink-soft mb-1 font-medium">
                      Payment Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full bg-surface-2 border border-border rounded py-2 px-3 text-xs text-ink font-mono focus:outline-none focus:border-brand"
                    >
                      <option value="Card">Corporate Credit Card</option>
                      <option value="Wire">Bank Wire Transfer</option>
                      <option value="Bank">Direct Debit / ACH</option>
                      <option value="Cash">Cash / Petty Cash</option>
                    </select>
                  </div>
                </div>

                {/* NOTES */}
                <div>
                  <label className="block text-xs text-ink-soft mb-1 font-medium">
                    Audit Notes / Invoice Reference
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Annual domain renewal or monthly office maintenance agreement..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-surface-2 border border-border rounded py-2 px-3 text-xs text-ink focus:outline-none focus:border-brand"
                  />
                </div>

                {/* BUTTONS */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded bg-surface hover:bg-border text-xs font-semibold text-ink-soft hover:text-ink transition-all cursor-pointer border border-border"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded bg-brand hover:bg-brand-hover text-xs font-semibold text-brand-contrast transition-all cursor-pointer shadow-xs"
                  >
                    Record Expense
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, UserPlus, Briefcase, DollarSign, Calendar, Mail, Phone,
  Trash2, Award, AlertTriangle, X, Search, Coins, CreditCard, Download
} from 'lucide-react';
import { Employee, Client, SalaryPayout, CompanySettings } from '../types';

interface EmployeeSectionProps {
  employees: Employee[];
  clients: Client[];
  payouts: SalaryPayout[];
  companySettings?: CompanySettings;
  onAddEmployee: (employee: Omit<Employee, 'id'>) => void;
  onDeleteEmployee: (id: string) => void;
  onPayEmployee: (payout: Omit<SalaryPayout, 'id' | 'date'> & { date?: string }) => void;
  onDeletePayout?: (id: string) => void;
}

export default function EmployeeSection({
  employees,
  clients,
  payouts,
  companySettings,
  onAddEmployee,
  onDeleteEmployee,
  onPayEmployee,
  onDeletePayout,
}: EmployeeSectionProps) {
  const currSymbol = companySettings?.currencySymbol || '₹';

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteEmployeeId, setDeleteEmployeeId] = useState<string | null>(null);
  const [activePayoutEmployee, setActivePayoutEmployee] = useState<Employee | null>(null);
  const [isPayoutHistoryOpen, setIsPayoutHistoryOpen] = useState<Employee | null>(null);

  // Add Employee Form state
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newSalary, setNewSalary] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newJoinedDate, setNewJoinedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formError, setFormError] = useState('');

  // Pay Employee state
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutNotes, setPayoutNotes] = useState('');
  const [payoutDate, setPayoutDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [payoutMonth, setPayoutMonth] = useState(() => new Date().toISOString().substring(0, 7));

  // Month utility formatter
  const formatMonth = (monthStr: string) => {
    if (!monthStr) return 'N/A';
    const parts = monthStr.split('-');
    if (parts.length !== 2) return monthStr;
    const [year, month] = parts;
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const idx = parseInt(month, 10) - 1;
    if (idx >= 0 && idx < 12) {
      return `${monthNames[idx]} ${year}`;
    }
    return monthStr;
  };

  // Download beautiful corporate payslip HTML
  const handleDownloadPayslip = (employee: Employee, pay: SalaryPayout) => {
    const compName = companySettings?.companyName || 'ScarletCRM Operations';
    const compTagline = companySettings?.companyTagline || 'Corporate Operations Portal';
    const logoImg = companySettings?.logoUrl 
      ? `<img src="${companySettings.logoUrl}" alt="${compName}" style="max-height: 55px; max-width: 220px; object-fit: contain; margin-bottom: 8px; display: block;" />`
      : '';
    const compAddress = companySettings?.address || '100 Corporate Plaza, Suite 500, New York, NY 10001';
    const compEmail = companySettings?.email || 'payroll@company.com';
    const compPhone = companySettings?.phone || '+1 (800) 555-0199';
    const compWebsite = companySettings?.website || '';

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Payslip - ${employee.name} (${compName})</title>
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
      background: linear-gradient(to right, #dc2626, #7f1d1d);
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
      font-size: 20px;
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
      color: #10b981;
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
        ${logoImg}
        <div class="company-title">${compName}</div>
        <div class="company-subtitle">${compTagline}</div>
        <div class="company-address">${compAddress}<br>Contact: ${compEmail} | ${compPhone}</div>
      </div>
      <div>
        <div class="document-title">Salary Payslip</div>
        <div class="document-id">REF-SECURE-${pay.id.substring(0, 8).toUpperCase()}</div>
      </div>
    </div>

    <div class="grid">
      <div>
        <div class="section-title">Employee Information</div>
        <div class="info-row">
          <span class="info-label">Name:</span>
          <span class="info-value">${employee.name}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Job Title:</span>
          <span class="info-value">${employee.role}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Email:</span>
          <span class="info-value mono">${employee.email}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Phone:</span>
          <span class="info-value mono">${employee.phone}</span>
        </div>
      </div>
      <div>
        <div class="section-title">Payment Statement</div>
        <div class="info-row">
          <span class="info-label">Salary Period:</span>
          <span class="info-value font-bold" style="color: #ef4444;">${formatMonth(pay.paidMonth || '')}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Release Date:</span>
          <span class="info-value mono">${pay.date}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Joined Company:</span>
          <span class="info-value mono">${employee.joinedDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Tx Status:</span>
          <span class="info-value" style="color: #10b981;">Disbursed / Paid</span>
        </div>
      </div>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th style="text-align: right;">Contract Monthly Rate</th>
            <th style="text-align: right;">Total Release Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Base Monthly Salary Payment</strong><br>
              <span style="font-size: 10px; color: #71717a;">${pay.notes || 'Regular full-time compensation disburse'}</span>
            </td>
            <td style="text-align: right; font-family: monospace;">${currSymbol}${employee.salary.toLocaleString()}.00</td>
            <td style="text-align: right; font-family: monospace; font-weight: bold; color: #fafafa;">${currSymbol}${pay.amount.toLocaleString()}.00</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="total-section">
      <div>
        <div class="seal">${compName.toUpperCase()} CERTIFIED & PAID</div>
      </div>
      <div class="total-box">
        <div class="total-label">Net Disbursed Funds</div>
        <div class="total-amount">${currSymbol}${pay.amount.toLocaleString()}.00</div>
      </div>
    </div>

    <div class="footer">
      THIS IS AN OFFICIAL ELECTRONIC PAYSLIP GENERATED BY ${compName.toUpperCase()}.<br>
      ${compAddress} | ${compEmail} ${compWebsite ? '| ' + compWebsite : ''}
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payslip_${employee.name.replace(/\s+/g, '_')}_${pay.paidMonth || pay.date}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  // Get list of unique roles for filtering
  const uniqueRoles = Array.from(new Set(employees.map(e => e.role)));

  // Filter employees
  const filteredEmployees = employees.filter(e => {
    const nameStr = typeof e.name === 'string' ? e.name : String(e.name || '');
    const roleStr = typeof e.role === 'string' ? e.role : String(e.role || '');
    const emailStr = typeof e.email === 'string' ? e.email : String(e.email || '');

    const matchesSearch = 
      nameStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      roleStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emailStr.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || e.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getAssignedClientsCount = (empId: string) => {
    return clients.filter(c => c.assignedEmployeeId === empId).length;
  };

  const getEmployeeTotalPaid = (empId: string) => {
    return payouts
      .filter(p => p.employeeId === empId)
      .reduce((sum, p) => sum + p.amount, 0);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newRole || !newSalary) {
      setFormError('Name, Role, and Monthly Salary are required.');
      return;
    }

    onAddEmployee({
      name: newName,
      role: newRole,
      salary: parseFloat(newSalary) || 0,
      email: newEmail || 'N/A',
      phone: newPhone || 'N/A',
      joinedDate: newJoinedDate || new Date().toISOString().split('T')[0],
    });

    // Reset
    setNewName('');
    setNewRole('');
    setNewSalary('');
    setNewEmail('');
    setNewPhone('');
    setNewJoinedDate(new Date().toISOString().split('T')[0]);
    setFormError('');
    setIsAddModalOpen(false);
  };

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePayoutEmployee || !payoutAmount) return;

    onPayEmployee({
      employeeId: activePayoutEmployee.id,
      employeeName: activePayoutEmployee.name,
      amount: parseFloat(payoutAmount) || 0,
      notes: payoutNotes || `${activePayoutEmployee.role} - Regular Salary Payout`,
      date: payoutDate || new Date().toISOString().split('T')[0],
      paidMonth: payoutMonth || new Date().toISOString().substring(0, 7),
    });

    setPayoutAmount('');
    setPayoutNotes('');
    setPayoutDate(new Date().toISOString().split('T')[0]);
    setPayoutMonth(new Date().toISOString().substring(0, 7));
    setActivePayoutEmployee(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-surface p-5 rounded border border-border shadow-card">
        <div>
          <h2 className="text-lg font-display font-bold tracking-tight text-ink flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand"></span>
            Personnel Register
          </h2>
          <p className="text-xs text-ink-soft mt-0.5 font-sans">Track company salaries, pay employees, and monitor active account loads</p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-brand-contrast font-medium py-1.5 px-4 rounded text-xs transition-colors cursor-pointer self-start sm:self-center shadow-xs"
        >
          <UserPlus size={14} />
          Register Personnel
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-surface p-4 rounded border border-border shadow-card">
        <div className="relative">
          <span className="absolute inset-y-0 left-3 flex items-center text-ink-faint">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder="Search employees by name, role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-2 border border-border rounded py-1.5 pl-9 pr-4 text-xs text-ink focus:outline-none focus:border-brand transition-all placeholder:text-ink-faint"
          />
        </div>

        <div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full bg-surface-2 border border-border rounded py-1.5 px-3 text-xs text-ink focus:outline-none focus:border-brand transition-all cursor-pointer"
          >
            <option value="all">All Roles / Functions</option>
            {uniqueRoles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Employee List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredEmployees.map(emp => {
          const clientCount = getAssignedClientsCount(emp.id);
          const totalPaid = getEmployeeTotalPaid(emp.id);
          
          return (
            <motion.div
              key={emp.id}
              className="bg-surface border border-border hover:border-brand/40 rounded p-5 flex flex-col justify-between transition-all group shadow-card"
              whileHover={{ y: -2 }}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded bg-brand/10 border border-brand/20 flex items-center justify-center text-brand shrink-0">
                      <Award size={16} />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-sm text-ink group-hover:text-brand transition-colors">
                        {emp.name}
                      </h3>
                      <p className="text-[11px] text-ink-soft mt-0.5">{emp.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-ink-faint uppercase tracking-wider font-mono">Salary</p>
                    <p className="text-xs font-mono font-bold text-brand">{currSymbol}{emp.salary.toLocaleString()}/mo</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-ink-faint">Email:</span>
                    <span className="text-ink-soft font-mono">{emp.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-faint">Phone:</span>
                    <span className="text-ink-soft font-mono">{emp.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-faint">Load:</span>
                    <span className="text-brand font-medium">{clientCount} active accounts</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-faint">Joined:</span>
                    <span className="text-ink-soft font-mono">{emp.joinedDate}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-border flex items-center justify-between">
                <div>
                  <p className="text-[9px] text-ink-faint uppercase font-mono">Paid to Date</p>
                  <p className="text-xs font-mono font-bold text-gain">
                    {currSymbol}{totalPaid.toLocaleString()}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setPayoutAmount(emp.salary.toString());
                      setActivePayoutEmployee(emp);
                    }}
                    className="py-1 px-2.5 rounded bg-surface-2 hover:bg-brand text-brand hover:text-brand-contrast border border-border hover:border-brand transition-colors text-[10px] flex items-center gap-1 cursor-pointer font-mono"
                    title="Pay monthly salary"
                  >
                    <Coins size={11} />
                    Pay Salary
                  </button>
                  <button
                    onClick={() => setIsPayoutHistoryOpen(emp)}
                    className="p-1 rounded bg-surface-2 hover:bg-border text-ink-soft border border-border transition-colors cursor-pointer"
                    title="Payout History logs"
                  >
                    <CreditCard size={12} />
                  </button>
                  <button
                    onClick={() => setDeleteEmployeeId(emp.id)}
                    className="p-1 rounded bg-surface-2 hover:bg-loss-faint text-ink-faint hover:text-loss border border-border hover:border-loss/30 transition-colors cursor-pointer"
                    title="De-register Employee"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}

        {filteredEmployees.length === 0 && (
          <div className="col-span-full py-12 text-center bg-surface border border-dashed border-border rounded">
            <Users className="mx-auto text-ink-faint mb-2" size={24} />
            <p className="text-xs text-ink-soft font-sans">No personnel profiles found.</p>
          </div>
        )}
      </div>

      {/* MODAL 1: Pay Employee Form */}
      <AnimatePresence>
        {activePayoutEmployee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-surface border border-border w-full max-w-md rounded p-6 shadow-pop"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-mono font-bold text-ink flex items-center gap-2">
                  <Coins className="text-brand" size={14} />
                  Post Salary Payout
                </h3>
                <button 
                  onClick={() => setActivePayoutEmployee(null)}
                  className="text-ink-faint hover:text-ink p-1 rounded cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <form onSubmit={handlePaySubmit} className="space-y-4">
                <div className="p-3 bg-surface-2 rounded border border-border text-xs text-ink-soft font-mono">
                  <span className="block text-[9px] text-ink-faint">PAYEE:</span>
                  <strong className="text-ink text-xs">{activePayoutEmployee.name}</strong> ({activePayoutEmployee.role})
                </div>

                <div>
                  <label className="block text-xs text-ink-soft font-medium mb-1">Payout Amount ($) *</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-ink-faint font-mono text-xs">$</span>
                    <input
                      type="number"
                      required
                      placeholder={activePayoutEmployee.salary.toString()}
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      className="w-full bg-surface-2 border border-border rounded py-2 pl-7 pr-4 text-xs text-ink focus:outline-none focus:border-brand font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-ink-soft font-medium mb-1">Payout Date *</label>
                    <input
                      type="date"
                      required
                      value={payoutDate}
                      onChange={(e) => {
                        setPayoutDate(e.target.value);
                        if (e.target.value && e.target.value.length >= 7) {
                          setPayoutMonth(e.target.value.substring(0, 7));
                        }
                      }}
                      className="w-full bg-surface-2 border border-border rounded py-2 px-3 text-xs text-ink focus:outline-none focus:border-brand font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-ink-soft font-medium mb-1">Salary Month *</label>
                    <input
                      type="month"
                      required
                      value={payoutMonth}
                      onChange={(e) => setPayoutMonth(e.target.value)}
                      className="w-full bg-surface-2 border border-border rounded py-2 px-3 text-xs text-ink focus:outline-none focus:border-brand font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-ink-soft font-medium mb-1">Reference Notes</label>
                  <input
                    type="text"
                    placeholder="e.g., salary payment"
                    value={payoutNotes}
                    onChange={(e) => setPayoutNotes(e.target.value)}
                    className="w-full bg-surface-2 border border-border rounded py-2 px-3 text-xs text-ink focus:outline-none focus:border-brand"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setActivePayoutEmployee(null)}
                    className="bg-surface-2 hover:bg-border text-ink-soft py-1.5 px-3 rounded cursor-pointer border border-border"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-brand hover:bg-brand-hover text-brand-contrast py-1.5 px-4 rounded cursor-pointer transition-colors"
                  >
                    Release Funds
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Employee Payout History Logs */}
      <AnimatePresence>
        {isPayoutHistoryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-surface border border-border w-full max-w-lg rounded overflow-hidden shadow-pop"
            >
              <div className="p-4 border-b border-border flex justify-between items-center bg-surface-2">
                <div>
                  <h4 className="text-sm font-mono font-bold text-ink">Payout Ledger</h4>
                  <p className="text-xs text-ink-soft mt-0.5">{isPayoutHistoryOpen.name} — {isPayoutHistoryOpen.role}</p>
                </div>
                <button 
                  onClick={() => setIsPayoutHistoryOpen(null)}
                  className="text-ink-faint hover:text-ink p-1 rounded cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-5 max-h-[50vh] overflow-y-auto">
                <div className="border border-border rounded overflow-hidden">
                  <div className="bg-surface-2 grid grid-cols-4 p-2.5 text-[9px] uppercase font-mono text-ink-faint border-b border-border">
                    <div>Release Date</div>
                    <div>Paid Month</div>
                    <div>Amount</div>
                    <div className="text-right">Action</div>
                  </div>

                  <div className="divide-y divide-border">
                    {payouts
                       .filter(p => p.employeeId === isPayoutHistoryOpen.id)
                       .sort((a, b) => b.date.localeCompare(a.date))
                       .map(pay => (
                        <div key={pay.id} className="grid grid-cols-4 p-2.5 text-xs text-ink-soft hover:bg-surface-2/50 items-center">
                          <div className="font-mono text-ink-faint">{pay.date}</div>
                          <div className="font-mono text-ink font-semibold">{formatMonth(pay.paidMonth || '')}</div>
                          <div className="font-mono font-bold text-brand">{currSymbol}{pay.amount.toLocaleString()}</div>
                          <div className="text-right flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleDownloadPayslip(isPayoutHistoryOpen, pay)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-surface-2 hover:bg-brand border border-border hover:border-brand text-[10px] text-brand hover:text-brand-contrast transition-colors cursor-pointer font-mono"
                              title="Download professional salary payslip"
                            >
                              <Download size={10} />
                              PAYSLIP
                            </button>
                            {onDeletePayout && (
                              <button
                                onClick={() => onDeletePayout(pay.id)}
                                className="p-1 rounded hover:bg-loss-faint text-ink-faint hover:text-loss transition-colors cursor-pointer"
                                title="Delete payout log"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                    {payouts.filter(p => p.employeeId === isPayoutHistoryOpen.id).length === 0 && (
                      <div className="p-6 text-center text-ink-faint text-xs">
                        No recorded salary pay history.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-surface-2 p-4 border-t border-border flex justify-between items-center text-xs font-mono">
                <div className="text-ink-soft">
                  Career Payout: <strong className="text-gain">${getEmployeeTotalPaid(isPayoutHistoryOpen.id).toLocaleString()}</strong>
                </div>
                <button
                  onClick={() => setIsPayoutHistoryOpen(null)}
                  className="bg-surface hover:bg-border text-ink-soft py-1.5 px-3 rounded border border-border cursor-pointer"
                >
                  Close History
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: Delete Employee Confirmation */}
      <AnimatePresence>
        {deleteEmployeeId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-surface border border-border w-full max-w-md rounded p-6 shadow-pop"
            >
              <div className="flex items-center gap-2.5 text-loss mb-4">
                <AlertTriangle size={18} />
                <h3 className="font-display font-bold text-sm text-ink">De-register Employee</h3>
              </div>

              <div className="text-xs text-ink-soft space-y-2.5">
                <p>
                  You are about to remove <strong className="text-ink">
                    {employees.find(e => e.id === deleteEmployeeId)?.name || 'this employee'}
                  </strong> from the active company register.
                </p>
                {getAssignedClientsCount(deleteEmployeeId) > 0 && (
                  <p className="bg-loss-faint p-2.5 border border-loss/30 text-loss rounded">
                    <strong>Critical Alert:</strong> Managing <strong className="text-ink">{getAssignedClientsCount(deleteEmployeeId)} accounts</strong>. 
                    Deleting will leave clients unassigned! Re-assign clients before finalizing.
                  </p>
                )}
              </div>

              <div className="pt-5 flex justify-end gap-2 text-xs font-medium">
                <button
                  onClick={() => setDeleteEmployeeId(null)}
                  className="bg-surface-2 hover:bg-border text-ink-soft py-1.5 px-3 rounded cursor-pointer border border-border"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onDeleteEmployee(deleteEmployeeId);
                    setDeleteEmployeeId(null);
                  }}
                  className="bg-loss hover:bg-loss/90 text-white py-1.5 px-4 rounded cursor-pointer transition-colors"
                >
                  Confirm Removal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: Register Employee Form */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="bg-surface border border-border w-full max-w-md rounded overflow-hidden shadow-pop"
            >
              <div className="p-5 border-b border-border flex justify-between items-center bg-surface-2">
                <h3 className="text-sm font-mono font-bold text-ink flex items-center gap-2">
                  <UserPlus size={16} className="text-brand" />
                  Register Employee
                </h3>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-ink-faint hover:text-ink p-1 rounded cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleAddSubmit}>
                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                  {formError && (
                    <div className="bg-loss-faint border border-loss/30 text-loss p-3 rounded text-xs flex items-center gap-2">
                      <AlertTriangle size={14} />
                      {formError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs text-ink-soft mb-1 font-medium">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Jennifer Aniston"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full bg-surface-2 border border-border rounded py-1.5 px-3 text-xs text-ink focus:outline-none focus:border-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-ink-soft mb-1 font-medium">Job Title / Role *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Account Executive, Full Stack Developer"
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="w-full bg-surface-2 border border-border rounded py-1.5 px-3 text-xs text-ink focus:outline-none focus:border-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-ink-soft mb-1 font-medium">Monthly Contract Salary ({currSymbol}) *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g., 3800"
                      value={newSalary}
                      onChange={(e) => setNewSalary(e.target.value)}
                      className="w-full bg-surface-2 border border-border rounded py-1.5 px-3 text-xs text-ink font-mono focus:outline-none focus:border-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-ink-soft mb-1 font-medium">Joining Date *</label>
                    <input
                      type="date"
                      required
                      value={newJoinedDate}
                      onChange={(e) => setNewJoinedDate(e.target.value)}
                      className="w-full bg-surface-2 border border-border rounded py-1.5 px-3 text-xs text-ink font-mono focus:outline-none focus:border-brand"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-ink-soft mb-1">Email Address</label>
                      <input
                        type="email"
                        placeholder="jennifer@company.com"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="w-full bg-surface-2 border border-border rounded py-1.5 px-3 text-xs text-ink focus:outline-none focus:border-brand font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-ink-soft mb-1">Phone Number</label>
                      <input
                        type="text"
                        placeholder="+1 (555) 334-2200"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        className="w-full bg-surface-2 border border-border rounded py-1.5 px-3 text-xs text-ink focus:outline-none focus:border-brand font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-surface-2 p-4 border-t border-border flex justify-end gap-2 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="bg-surface hover:bg-border text-ink-soft py-1.5 px-4 rounded cursor-pointer border border-border"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-brand hover:bg-brand-hover text-brand-contrast py-1.5 px-4 rounded cursor-pointer transition-colors"
                  >
                    Register Personnel
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

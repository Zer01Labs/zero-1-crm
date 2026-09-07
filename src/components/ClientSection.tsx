import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Briefcase, Mail, Phone, Calendar, DollarSign, 
  Trash2, ShieldCheck, Plus, CheckCircle2, AlertCircle, X, Search, 
  CreditCard, TrendingUp, Sparkles, UserCheck, RefreshCw, FileText,
  Layers, PlusCircle, Edit3, Receipt, Percent, Check, Milestone, ChevronRight, Coins, Building2
} from 'lucide-react';
import { Client, Employee, Payment, ClientStatus, PaymentType, CompanySettings } from '../types';
import InstallmentVoucherModal from './InstallmentVoucherModal';

interface ClientSectionProps {
  clients: Client[];
  employees: Employee[];
  payments: Payment[];
  companySettings?: CompanySettings;
  onAddClient: (client: Omit<Client, 'id' | 'createdDate'> & { createdDate?: string }) => void;
  onDeleteClient: (id: string) => void;
  onLogPayment: (payment: Omit<Payment, 'id' | 'date'> & { date?: string }) => void;
  onUpdateClient: (client: Client) => void;
}

export default function ClientSection({
  clients,
  employees,
  payments,
  companySettings = {
    companyName: 'ScarletCRM Operations',
    companyTagline: 'Corporate Operations Portal',
    logoUrl: '',
    address: '100 Corporate Plaza, Suite 500, New York, NY 10001',
    email: 'billing@company.com',
    phone: '+1 (800) 555-0199'
  },
  onAddClient,
  onDeleteClient,
  onLogPayment,
  onUpdateClient,
}: ClientSectionProps) {
  const currSymbol = companySettings?.currencySymbol || '₹';

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ClientStatus>('all');
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteClientId, setDeleteClientId] = useState<string | null>(null);
  const [deleteSecretCode, setDeleteSecretCode] = useState('');
  const [deleteError, setDeleteError] = useState(false);
  
  const [activeDetailsClient, setActiveDetailsClient] = useState<Client | null>(null);
  const [showLogPaymentFormInDetails, setShowLogPaymentFormInDetails] = useState(false);

  // Voucher modal state
  const [selectedVoucherPayment, setSelectedVoucherPayment] = useState<Payment | null>(null);
  const [isVoucherOpen, setIsVoucherOpen] = useState(false);

  // Scope addition / Quote increase form state
  const [showAddScopeForm, setShowAddScopeForm] = useState(false);
  const [scopeAddTitle, setScopeAddTitle] = useState('');
  const [scopeAddAmount, setScopeAddAmount] = useState('');
  const [scopeAddNotes, setScopeAddNotes] = useState('');

  // Add Client Form state
  const [newClientName, setNewClientName] = useState('');
  const [newClientCompany, setNewClientCompany] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientStatus, setNewClientStatus] = useState<ClientStatus>('lead');
  const [newClientPaymentType, setNewClientPaymentType] = useState<'monthly' | 'one-time'>('monthly');
  const [newClientDealValue, setNewClientDealValue] = useState('');
  const [newClientProjectScope, setNewClientProjectScope] = useState('');
  const [newClientAssignedEmp, setNewClientAssignedEmp] = useState('');
  const [newClientStartDate, setNewClientStartDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Log Payment Form state (inside selected client dashboard)
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'Wire' | 'Card' | 'Bank' | 'Cash'>('Wire');
  const [payDate, setPayDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [payPaidMonth, setPayPaidMonth] = useState(() => new Date().toISOString().substring(0, 7));
  const [payType, setPayType] = useState<PaymentType>('monthly');
  const [payInstallmentStage, setPayInstallmentStage] = useState('1st Installment - Advance Kickoff (25%-33%)');
  const [payWorkCategory, setPayWorkCategory] = useState('Extra Video Editing / Production');
  const [payCustomCategory, setPayCustomCategory] = useState('');
  const [payNotes, setPayNotes] = useState('');

  // Form errors
  const [formError, setFormError] = useState('');

  // Helper to format month YYYY-MM to readable string (e.g. "2026-07" -> "July 2026")
  const formatMonthName = (monthStr: string) => {
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

  // Compute month-by-month cash taken and pending dues for a client, plus Extra Work collected
  const getClientMonthlyBreakdown = (client: Client, clientPayments: Payment[]) => {
    // Separate extra work payments from recurring monthly retainer payments
    const extraWorkPayments = clientPayments.filter(p => p.type === 'extra-work');
    const totalExtraPaid = extraWorkPayments.reduce((sum, p) => sum + p.amount, 0);

    if (client.paymentType !== 'monthly') {
      const retainerPayments = clientPayments.filter(p => p.type !== 'extra-work');
      const totalPaid = retainerPayments.reduce((sum, p) => sum + p.amount, 0);
      const pending = Math.max(0, client.dealValue - totalPaid);
      return {
        isMonthly: false,
        totalExpected: client.dealValue,
        totalPaid,
        totalPending: pending,
        months: [],
        extraWorkPayments,
        totalExtraPaid,
        totalLifetimeCollected: totalPaid + totalExtraPaid
      };
    }

    const currentMonthStr = new Date().toISOString().substring(0, 7);
    const startMonthStr = client.createdDate ? client.createdDate.substring(0, 7) : '2026-01';

    const months: string[] = [];
    let [currY, currM] = currentMonthStr.split('-').map(Number);
    let [startY, startM] = startMonthStr.split('-').map(Number);

    if (isNaN(startY) || isNaN(startM) || startY > currY || (startY === currY && startM > currM)) {
      startY = currY;
      startM = currM;
    }

    let y = currY;
    let m = currM;
    while (y > startY || (y === startY && m >= startM)) {
      const mStr = `${y}-${String(m).padStart(2, '0')}`;
      months.push(mStr);
      m--;
      if (m < 1) {
        m = 12;
        y--;
      }
    }

    if (months.length === 0) months.push(currentMonthStr);

    const monthDetails = months.map(month => {
      // Exclude extra-work payments from monthly retainer dues count
      const monthPayments = clientPayments.filter(p => {
        if (p.type === 'extra-work') return false;
        const pm = p.paidMonth || (p.date ? p.date.substring(0, 7) : '');
        return pm === month;
      });
      const paidAmount = monthPayments.reduce((sum, p) => sum + p.amount, 0);
      const expected = client.dealValue;
      const pendingAmount = Math.max(0, expected - paidAmount);

      let status: 'PAID' | 'PARTIAL' | 'PENDING' = 'PENDING';
      if (paidAmount >= expected) status = 'PAID';
      else if (paidAmount > 0) status = 'PARTIAL';

      return {
        month,
        monthName: formatMonthName(month),
        expected,
        paidAmount,
        pendingAmount,
        status,
        payments: monthPayments
      };
    });

    const totalExpected = monthDetails.reduce((sum, m) => sum + m.expected, 0);
    const totalPaid = monthDetails.reduce((sum, m) => sum + m.paidAmount, 0);
    const totalPending = monthDetails.reduce((sum, m) => sum + m.pendingAmount, 0);

    return {
      isMonthly: true,
      totalExpected,
      totalPaid,
      totalPending,
      months: monthDetails,
      extraWorkPayments,
      totalExtraPaid,
      totalLifetimeCollected: totalPaid + totalExtraPaid
    };
  };

  // Filtering logic
  const filteredClients = clients.filter(c => {
    const nameStr = typeof c.name === 'string' ? c.name : String(c.name || '');
    const companyStr = typeof c.company === 'string' ? c.company : String(c.company || '');
    const emailStr = typeof c.email === 'string' ? c.email : String(c.email || '');

    const matchesSearch = 
      nameStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      companyStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emailStr.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesEmployee = employeeFilter === 'all' || c.assignedEmployeeId === employeeFilter;
    
    return matchesSearch && matchesStatus && matchesEmployee;
  });

  const getEmployeeName = (id: string) => {
    return employees.find(e => e.id === id)?.name || 'Unassigned';
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newClientCompany || !newClientDealValue || !newClientAssignedEmp) {
      setFormError('Please fill in all required fields.');
      return;
    }

    onAddClient({
      name: newClientName,
      company: newClientCompany,
      email: newClientEmail || 'N/A',
      phone: newClientPhone || 'N/A',
      status: newClientStatus,
      paymentType: newClientPaymentType,
      dealValue: parseFloat(newClientDealValue) || 0,
      assignedEmployeeId: newClientAssignedEmp,
      createdDate: newClientStartDate || new Date().toISOString().split('T')[0],
      projectScope: newClientProjectScope.trim() || (newClientPaymentType === 'one-time' ? 'Fixed Contract Project' : 'Retainer Management')
    });

    // Reset Form
    setNewClientName('');
    setNewClientCompany('');
    setNewClientEmail('');
    setNewClientPhone('');
    setNewClientStatus('lead');
    setNewClientPaymentType('monthly');
    setNewClientDealValue('');
    setNewClientProjectScope('');
    setNewClientAssignedEmp('');
    setNewClientStartDate(new Date().toISOString().split('T')[0]);
    setFormError('');
    setIsAddModalOpen(false);
  };

  const handleDeleteVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteSecretCode === '3492') {
      if (deleteClientId) {
        onDeleteClient(deleteClientId);
        setDeleteClientId(null);
        setDeleteSecretCode('');
        setDeleteError(false);
        if (activeDetailsClient?.id === deleteClientId) {
          setActiveDetailsClient(null);
        }
      }
    } else {
      setDeleteError(true);
      setTimeout(() => setDeleteError(false), 2000);
    }
  };

  const handleAddScopeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDetailsClient || !scopeAddAmount || !scopeAddTitle) return;

    const addedVal = parseFloat(scopeAddAmount) || 0;
    const prevVal = activeDetailsClient.dealValue;
    const newVal = prevVal + addedVal;

    const newLog = {
      id: `scope-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      previousValue: prevVal,
      addedAmount: addedVal,
      newValue: newVal,
      title: scopeAddTitle.trim(),
      notes: scopeAddNotes.trim()
    };

    const updatedClient: Client = {
      ...activeDetailsClient,
      dealValue: newVal,
      scopeLogs: [newLog, ...(activeDetailsClient.scopeLogs || [])]
    };

    setActiveDetailsClient(updatedClient);
    onUpdateClient(updatedClient);

    setScopeAddTitle('');
    setScopeAddAmount('');
    setScopeAddNotes('');
    setShowAddScopeForm(false);
  };

  const handleLogPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDetailsClient || !payAmount) return;

    let category: string | undefined = undefined;
    if (payType === 'extra-work') {
      category = payWorkCategory === 'Other Extra Deliverable' ? (payCustomCategory.trim() || 'Extra Deliverable') : payWorkCategory;
    } else if (payType === 'installment') {
      category = payInstallmentStage;
    }

    let defaultNotes = `Payment received`;
    if (payType === 'extra-work') {
      defaultNotes = `Extra work payment: ${category}`;
    } else if (payType === 'monthly') {
      defaultNotes = `Monthly retainer (${formatMonthName(payPaidMonth)})`;
    } else if (payType === 'installment') {
      defaultNotes = `${payInstallmentStage} received for ${activeDetailsClient.company}`;
    }

    onLogPayment({
      clientId: activeDetailsClient.id,
      clientName: `${activeDetailsClient.name} (${activeDetailsClient.company})`,
      amount: parseFloat(payAmount) || 0,
      type: payType,
      workCategory: category,
      notes: payNotes.trim() || defaultNotes,
      method: payMethod,
      date: payDate || new Date().toISOString().split('T')[0],
      paidMonth: payPaidMonth,
    });

    setPayAmount('');
    setPayNotes('');
    setPayMethod('Wire');
    setPayDate(new Date().toISOString().split('T')[0]);
    setPayPaidMonth(new Date().toISOString().substring(0, 7));
    setPayWorkCategory('Extra Video Editing / Production');
    setPayCustomCategory('');
    setShowLogPaymentFormInDetails(false);
  };

  const getClientPayments = (clientId: string) => {
    return payments.filter(p => p.clientId === clientId).sort((a, b) => b.date.localeCompare(a.date));
  };

  const getClientTotalPaid = (clientId: string) => {
    return getClientPayments(clientId).reduce((sum, p) => sum + p.amount, 0);
  };

  // Get stage label and styles
  const getStageStyle = (status: ClientStatus) => {
    switch (status) {
      case 'lead':
        return 'bg-surface-2 text-ink-soft border border-border';
      case 'contacted':
        return 'bg-brand-soft text-brand border border-brand/20';
      case 'proposal':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20';
      case 'converted':
        return 'bg-gain-soft text-gain border border-gain/20';
      case 'lost':
        return 'bg-surface-2 text-ink-faint border border-border';
      default:
        return 'bg-surface-2 text-ink-soft border border-border';
    }
  };

  const getStageLabel = (status: ClientStatus) => {
    switch (status) {
      case 'lead': return 'Lead';
      case 'contacted': return 'Contacted';
      case 'proposal': return 'Proposal';
      case 'converted': return 'Converted';
      case 'lost': return 'Lost';
      default: return status;
    }
  };

  // Inline updater helper inside detail dashboard
  const handleStageChange = (newStatus: ClientStatus) => {
    if (!activeDetailsClient) return;
    const updated = { ...activeDetailsClient, status: newStatus };
    setActiveDetailsClient(updated);
    onUpdateClient(updated);
  };

  const handleManagerChange = (empId: string) => {
    if (!activeDetailsClient) return;
    const updated = { ...activeDetailsClient, assignedEmployeeId: empId };
    setActiveDetailsClient(updated);
    onUpdateClient(updated);
  };

  // Stats for Filter Pills
  const counts = {
    all: clients.length,
    lead: clients.filter(c => c.status === 'lead').length,
    contacted: clients.filter(c => c.status === 'contacted').length,
    proposal: clients.filter(c => c.status === 'proposal').length,
    converted: clients.filter(c => c.status === 'converted').length,
    lost: clients.filter(c => c.status === 'lost').length,
  };

  // Overall Financial & Due Stats across converted accounts
  const convertedClientsList = clients.filter(c => c.status === 'converted');
  const convertedClientBreakdowns = convertedClientsList.map(c => ({
    client: c,
    breakdown: getClientMonthlyBreakdown(c, getClientPayments(c.id))
  }));

  const totalOutstandingDuesAll = convertedClientBreakdowns.reduce((sum, item) => sum + item.breakdown.totalPending, 0);
  const clientsWithDuesCountAll = convertedClientBreakdowns.filter(item => item.breakdown.totalPending > 0).length;
  const totalMRRAll = convertedClientsList.filter(c => c.paymentType === 'monthly').reduce((sum, c) => sum + c.dealValue, 0);
  const totalLifetimeCashCollectedAll = clients.reduce((sum, c) => sum + getClientPayments(c.id).reduce((s, p) => s + p.amount, 0), 0);

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-surface p-5 rounded-2xl border border-border shadow-card">
        <div>
          <h2 className="text-lg font-display font-bold tracking-tight text-ink flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand"></span>
            Clients & Leads
          </h2>
          <p className="text-xs text-ink-soft mt-0.5 font-sans">Track pipeline, qualify leads, and manage billing arrangements</p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-brand hover:bg-brand/90 text-white font-medium py-2 px-4 rounded-xl text-xs transition-colors cursor-pointer self-start sm:self-center shadow-card"
        >
          <Plus size={14} />
          Register Portfolio
        </button>
      </div>

      {/* Portfolio Financial Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-surface border border-border p-3.5 rounded-2xl flex items-center justify-between shadow-card">
          <div>
            <span className="text-[10px] text-ink-faint font-mono uppercase tracking-wider block">Active Portfolio MRR</span>
            <span className="text-base font-mono font-bold text-brand mt-0.5 block">{currSymbol}{totalMRRAll.toLocaleString()}<span className="text-xs text-ink-faint font-normal">/mo</span></span>
            <span className="text-[10px] text-ink-faint">{convertedClientsList.length} converted clients</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-brand-soft text-brand flex items-center justify-center">
            <Briefcase size={18} />
          </div>
        </div>

        <div className="bg-surface border border-border p-3.5 rounded-2xl flex items-center justify-between shadow-card">
          <div>
            <span className="text-[10px] text-ink-faint font-mono uppercase tracking-wider block">Pending Accounts Due</span>
            <span className="text-base font-mono font-bold text-loss mt-0.5 block">{currSymbol}{totalOutstandingDuesAll.toLocaleString()}</span>
            <span className="text-[10px] text-loss font-medium">{clientsWithDuesCountAll} {clientsWithDuesCountAll === 1 ? 'account' : 'accounts'} with unpaid balance</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-loss-soft text-loss flex items-center justify-center">
            <AlertCircle size={18} />
          </div>
        </div>

        <div className="bg-surface border border-border p-3.5 rounded-2xl flex items-center justify-between shadow-card">
          <div>
            <span className="text-[10px] text-ink-faint font-mono uppercase tracking-wider block">Lifetime Cash Collected</span>
            <span className="text-base font-mono font-bold text-gain mt-0.5 block">{currSymbol}{totalLifetimeCashCollectedAll.toLocaleString()}</span>
            <span className="text-[10px] text-ink-faint">Invoiced & collected total</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-gain-soft text-gain flex items-center justify-center">
            <Coins size={18} />
          </div>
        </div>

        <div className="bg-surface border border-border p-3.5 rounded-2xl flex items-center justify-between shadow-card">
          <div>
            <span className="text-[10px] text-ink-faint font-mono uppercase tracking-wider block">Pipeline Conversions</span>
            <span className="text-base font-mono font-bold text-ink mt-0.5 block">{counts.converted} / {counts.all}</span>
            <span className="text-[10px] text-ink-faint">{counts.lead} open leads</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-surface-2 text-ink-soft flex items-center justify-center">
            <UserCheck size={18} />
          </div>
        </div>
      </div>

      {/* Modern Status Tabs Filter Bar */}
      <div className="flex overflow-x-auto gap-1 border-b border-border pb-1 scrollbar-none">
        {(['all', 'lead', 'contacted', 'proposal', 'converted', 'lost'] as const).map((stage) => (
          <button
            key={stage}
            onClick={() => setStatusFilter(stage)}
            className={`py-2 px-3 text-xs font-mono rounded-t-xl border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-all ${
              statusFilter === stage
                ? 'border-brand text-brand font-bold bg-surface'
                : 'border-transparent text-ink-faint hover:text-ink-soft'
            }`}
          >
            <span className="capitalize">{stage === 'all' ? 'All Pipelines' : getStageLabel(stage)}</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-sans ${
              statusFilter === stage ? 'bg-brand-soft text-brand' : 'bg-surface-2 text-ink-faint'
            }`}>
              {counts[stage]}
            </span>
          </button>
        ))}
      </div>

      {/* Secondary Filters Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-surface p-4 rounded-2xl border border-border shadow-card">
        <div className="relative">
          <span className="absolute inset-y-0 left-3 flex items-center text-ink-faint">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder="Search by client contact, email, company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-2 border border-border rounded-xl py-2 pl-9 pr-4 text-xs text-ink focus:outline-none focus:border-brand transition-all placeholder:text-ink-faint"
          />
        </div>

        <div>
          <select
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="w-full bg-surface-2 border border-border rounded-xl py-2 px-3 text-xs text-ink focus:outline-none focus:border-brand transition-all cursor-pointer"
          >
            <option value="all">All Account Managers</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => {
          const clientPayments = getClientPayments(client.id);
          const breakdown = getClientMonthlyBreakdown(client, clientPayments);
          const isFixedQuote = client.paymentType !== 'monthly';
          const remainingBalance = Math.max(0, client.dealValue - breakdown.totalPaid);
          const progressPercent = client.dealValue > 0 ? Math.min(100, Math.round((breakdown.totalPaid / client.dealValue) * 100)) : 0;
          const serviceStartDate = client.createdDate ? formatMonthName(client.createdDate.substring(0, 7)) : 'N/A';

          return (
            <motion.div
              key={client.id}
              layoutId={`client-card-${client.id}`}
              onClick={() => {
                setActiveDetailsClient(client);
                setShowLogPaymentFormInDetails(false);
              }}
              className="bg-surface border border-border hover:border-brand/40 rounded-2xl p-5 flex flex-col justify-between transition-all group cursor-pointer relative shadow-card hover:shadow-pop"
              whileHover={{ y: -2 }}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display font-bold text-sm text-ink leading-snug group-hover:text-brand transition-colors">
                      {client.company}
                    </h3>
                    <p className="text-xs text-ink-soft mt-1 flex items-center gap-1.5 font-mono">
                      <User size={11} className="text-ink-faint" />
                      {client.name}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-lg font-mono ${getStageStyle(client.status)}`}>
                      {getStageLabel(client.status)}
                    </span>
                    {isFixedQuote && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-lg bg-warn-soft text-warn border border-warn/20 font-mono flex items-center gap-1">
                        ⚡ Fixed Quote
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-2 border-t border-border pt-4 text-xs">
                  <div className="flex justify-between">
                    <span className="text-ink-faint">Contact:</span>
                    <span className="text-ink-soft font-mono truncate max-w-[150px]">{client.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-faint">Manager:</span>
                    <span className="text-ink font-medium">{getEmployeeName(client.assignedEmployeeId)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-faint">Service Start:</span>
                    <span className="text-ink-soft font-mono">{serviceStartDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-faint">Arrangement:</span>
                    <span className="text-ink">
                      {client.paymentType === 'monthly' ? (
                        <span className="text-brand font-mono font-medium">{currSymbol}{client.dealValue.toLocaleString()}/mo</span>
                      ) : (
                        <span className="text-warn font-mono font-bold">{currSymbol}{client.dealValue.toLocaleString()} Quote</span>
                      )}
                    </span>
                  </div>

                  {/* Converted Dues Breakdown Indicator */}
                  {client.status === 'converted' && (
                    <div className="flex justify-between items-center pt-2 border-t border-border-soft">
                      <span className="text-ink-faint text-[11px]">Outstanding Due:</span>
                      {breakdown.totalPending > 0 ? (
                        <span className="text-loss font-mono font-bold text-xs flex items-center gap-1 bg-loss-soft px-2 py-0.5 rounded-lg border border-loss/20">
                          <AlertCircle size={11} />
                          {currSymbol}{breakdown.totalPending.toLocaleString()}
                          {client.paymentType === 'monthly' && (
                            <span className="text-[9px] font-normal opacity-80">
                              ({breakdown.months.filter(m => m.pendingAmount > 0).length} mo)
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-gain font-mono font-semibold text-[10px] flex items-center gap-1 bg-gain-soft px-2 py-0.5 rounded-lg border border-gain/20">
                          <CheckCircle2 size={11} />
                          Settled ({currSymbol}0)
                        </span>
                      )}
                    </div>
                  )}

                  {/* Fixed Contract Progress Bar */}
                  {isFixedQuote && (
                    <div className="pt-2">
                      <div className="flex justify-between text-[10px] font-mono text-ink-soft mb-1">
                        <span>Installment Progress</span>
                        <span className="text-gain font-bold">{progressPercent}% Paid</span>
                      </div>
                      <div className="w-full bg-surface-2 rounded-full h-1.5 overflow-hidden border border-border">
                        <div className="bg-gain h-1.5 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-border flex items-center justify-between">
                <div>
                  <p className="text-[9px] text-ink-faint uppercase tracking-wider font-mono">Collected</p>
                  <p className="text-xs font-mono font-bold text-gain">
                    {currSymbol}{breakdown.totalLifetimeCollected.toLocaleString()}
                  </p>
                </div>

                <div className="flex gap-2">
                  <span 
                    className="py-1 px-2.5 rounded-xl bg-surface-2 group-hover:bg-brand group-hover:text-white text-ink-soft border border-border transition-colors text-[10px] flex items-center gap-1 font-mono cursor-pointer"
                  >
                    <CreditCard size={11} />
                    View Ledger
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Avoid opening details
                      setDeleteClientId(client.id);
                    }}
                    className="p-1.5 rounded-xl bg-surface-2 hover:bg-loss-soft text-ink-faint hover:text-loss border border-border hover:border-loss/30 transition-colors cursor-pointer"
                    title="Delete Client"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}

        {filteredClients.length === 0 && (
          <div className="col-span-full py-12 text-center bg-surface border border-dashed border-border rounded-2xl">
            <AlertCircle className="mx-auto text-ink-faint mb-2" size={24} />
            <p className="text-xs text-ink-soft font-sans">No clients found matching current filters.</p>
          </div>
        )}
      </div>

      {/* DRILL DOWN: Client specific Dashboard & Payment Manager */}
      <AnimatePresence>
        {activeDetailsClient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-surface border border-border w-full max-w-2xl rounded-2xl overflow-hidden shadow-pop"
            >
              {/* Header */}
              <div className="bg-surface-2 p-5 border-b border-border flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono uppercase bg-surface border border-border text-ink-soft px-2 py-0.5 rounded-lg">
                      Lifecycle Record
                    </span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-lg font-mono ${getStageStyle(activeDetailsClient.status)}`}>
                      {getStageLabel(activeDetailsClient.status)}
                    </span>
                  </div>
                  <h3 className="text-base font-display font-bold text-ink mt-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand"></span>
                    {activeDetailsClient.company}
                  </h3>
                </div>
                <button 
                  onClick={() => setActiveDetailsClient(null)}
                  className="text-ink-faint hover:text-ink p-1.5 rounded-xl hover:bg-surface border border-transparent hover:border-border cursor-pointer transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Grid content */}
              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                
                {/* INTERACTIVE CONTROLS (Status, Manager Assignment, and Contract Start Date on the fly) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-surface-2 p-4 rounded-xl border border-border text-xs">
                  <div>
                    <label className="block text-[10px] text-ink-faint font-mono uppercase tracking-wider mb-1">Set Pipeline Stage</label>
                    <select
                      value={activeDetailsClient.status}
                      onChange={(e) => handleStageChange(e.target.value as ClientStatus)}
                      className="w-full bg-surface border border-border rounded-xl py-1.5 px-2.5 text-xs text-ink focus:outline-none focus:border-brand cursor-pointer"
                    >
                      <option value="lead">Lead</option>
                      <option value="contacted">Contacted</option>
                      <option value="proposal">Proposal</option>
                      <option value="converted">Converted (Active)</option>
                      <option value="lost">Lost</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-ink-faint font-mono uppercase tracking-wider mb-1">Account Manager</label>
                    <select
                      value={activeDetailsClient.assignedEmployeeId}
                      onChange={(e) => handleManagerChange(e.target.value)}
                      className="w-full bg-surface border border-border rounded-xl py-1.5 px-2.5 text-xs text-ink focus:outline-none focus:border-brand cursor-pointer"
                    >
                      <option value="">Unassigned</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-ink-faint font-mono uppercase tracking-wider mb-1">Service Start Month / Date</label>
                    <input
                      type="date"
                      value={activeDetailsClient.createdDate ? activeDetailsClient.createdDate.substring(0, 10) : ''}
                      onChange={(e) => {
                        if (!e.target.value) return;
                        const updated = { ...activeDetailsClient, createdDate: e.target.value };
                        onUpdateClient(updated);
                        setActiveDetailsClient(updated);
                      }}
                      className="w-full bg-surface border border-border rounded-xl py-1.5 px-2 text-xs text-ink focus:outline-none focus:border-brand cursor-pointer font-mono"
                      title="Adjust service onboarding date to recalculate historical monthly retainer dues"
                    />
                  </div>
                </div>

                {/* PROJECT SCOPE & ADD SCOPE BANNER FOR FIXED QUOTE CONTRACTS */}
                {activeDetailsClient.paymentType !== 'monthly' && (
                  <div className="bg-warn-soft border border-warn/30 rounded-xl p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5 text-warn font-mono font-bold text-xs uppercase tracking-wider">
                          <Layers size={14} />
                          Fixed Project Scope & Contract Deliverables
                        </div>
                        <p className="text-xs text-ink mt-1 font-medium">
                          {activeDetailsClient.projectScope || 'Enterprise Development Contract & Deliverables'}
                        </p>
                      </div>

                      {activeDetailsClient.status === 'converted' && (
                        <button
                          type="button"
                          onClick={() => setShowAddScopeForm(!showAddScopeForm)}
                          className="px-3 py-1.5 rounded-xl bg-warn hover:bg-warn/90 text-white text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-center shadow-card"
                        >
                          <PlusCircle size={14} />
                          + Add Scope / Upsell (+ Quote)
                        </button>
                      )}
                    </div>

                    {/* INLINE ADD SCOPE / UPSELL FORM */}
                    <AnimatePresence>
                      {showAddScopeForm && (
                        <motion.form
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          onSubmit={handleAddScopeSubmit}
                          className="bg-surface border border-warn/40 p-4 rounded-xl text-xs space-y-3 mt-2 overflow-hidden shadow-card"
                        >
                          <p className="text-warn font-mono font-bold text-[10px] uppercase tracking-wider">
                            Increase Contract Value & Record New Deliverable Scope
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] text-ink-faint mb-1">Scope Revision Title *</label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. Added Payment Gateway & Push Notifications"
                                value={scopeAddTitle}
                                onChange={(e) => setScopeAddTitle(e.target.value)}
                                className="w-full bg-surface-2 border border-border rounded-xl py-1.5 px-2.5 text-ink focus:outline-none focus:border-warn"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-ink-faint mb-1 font-mono">Additional Amount to Add ({currSymbol}) *</label>
                              <input
                                type="number"
                                required
                                placeholder="10000"
                                value={scopeAddAmount}
                                onChange={(e) => setScopeAddAmount(e.target.value)}
                                className="w-full bg-surface-2 border border-border rounded-xl py-1.5 px-2.5 text-ink font-mono focus:outline-none focus:border-warn"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] text-ink-faint mb-1">Notes / Terms</label>
                            <input
                              type="text"
                              placeholder="e.g. Approved by client over email on July 20"
                              value={scopeAddNotes}
                              onChange={(e) => setScopeAddNotes(e.target.value)}
                              className="w-full bg-surface-2 border border-border rounded-xl py-1.5 px-2.5 text-ink focus:outline-none focus:border-warn"
                            />
                          </div>
                          <div className="flex justify-end gap-2 pt-1 font-mono text-[10px]">
                            <button
                              type="button"
                              onClick={() => setShowAddScopeForm(false)}
                              className="px-3 py-1.5 rounded-xl bg-surface-2 text-ink-soft hover:text-ink border border-border cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-1.5 rounded-xl bg-warn text-white font-bold hover:bg-warn/90 cursor-pointer shadow-card"
                            >
                              Update Contract Quote (+{currSymbol}{parseFloat(scopeAddAmount || '0').toLocaleString()})
                            </button>
                          </div>
                        </motion.form>
                      )}
                    </AnimatePresence>

                    {/* SCOPE REVISION LOGS */}
                    {activeDetailsClient.scopeLogs && activeDetailsClient.scopeLogs.length > 0 && (
                      <div className="border-t border-warn/20 pt-2.5 space-y-1.5 text-[11px] font-mono">
                        <span className="text-[9px] text-warn uppercase font-bold tracking-wider block">
                          Contract Revisions & Scope Addition History
                        </span>
                        {activeDetailsClient.scopeLogs.map(log => (
                          <div key={log.id} className="flex justify-between items-center bg-surface p-2 rounded-xl border border-border">
                            <div>
                              <span className="text-ink font-semibold">{log.title}</span>
                              <span className="text-[9px] text-ink-faint ml-2">({log.date})</span>
                            </div>
                            <div className="text-right">
                              <span className="text-warn font-bold">+{currSymbol}{log.addedAmount.toLocaleString()}</span>
                              <span className="text-[9px] text-ink-faint block">
                                Quote: {currSymbol}{log.previousValue.toLocaleString()} ➔ {currSymbol}{log.newValue.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* MINI KPI DASHBOARD FOR THIS CLIENT */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {/* KPI 1: Contract Value */}
                  <div className="bg-surface-2 p-3 rounded-xl border border-border text-center">
                    <span className="text-[9px] text-ink-faint uppercase tracking-wider font-mono">
                      {activeDetailsClient.paymentType === 'monthly' ? 'Monthly Commitment' : 'Total Fixed Quote'}
                    </span>
                    <p className="text-sm font-mono font-bold text-ink mt-1">
                      {currSymbol}{activeDetailsClient.dealValue.toLocaleString()}
                      <span className="text-[10px] text-ink-faint font-normal">
                        {activeDetailsClient.paymentType === 'monthly' ? '/mo' : ''}
                      </span>
                    </p>
                  </div>

                  {/* KPI 2: Total Collected */}
                  <div className="bg-surface-2 p-3 rounded-xl border border-border text-center">
                    <span className="text-[9px] text-ink-faint uppercase tracking-wider font-mono">Installments Collected</span>
                    <p className="text-sm font-mono font-bold text-gain mt-1">
                      {currSymbol}{getClientTotalPaid(activeDetailsClient.id).toLocaleString()}
                    </p>
                  </div>

                  {/* KPI 3: Outstanding Balance */}
                  <div className="bg-surface-2 p-3 rounded-xl border border-border text-center">
                    <span className="text-[9px] text-ink-faint uppercase tracking-wider font-mono">
                      {activeDetailsClient.paymentType === 'monthly' ? 'Monthly Value' : 'Remaining Balance'}
                    </span>
                    <p className={`text-sm font-mono font-bold mt-1 ${
                      activeDetailsClient.paymentType !== 'monthly' && (activeDetailsClient.dealValue - getClientTotalPaid(activeDetailsClient.id)) > 0
                        ? 'text-warn'
                        : 'text-gain'
                    }`}>
                      {activeDetailsClient.paymentType === 'monthly' ? (
                        `${currSymbol}${activeDetailsClient.dealValue.toLocaleString()}/mo`
                      ) : (
                        `${currSymbol}${Math.max(0, activeDetailsClient.dealValue - getClientTotalPaid(activeDetailsClient.id)).toLocaleString()}`
                      )}
                    </p>
                  </div>

                  {/* KPI 4: Progress % */}
                  <div className="bg-surface-2 p-3 rounded-xl border border-border text-center">
                    <span className="text-[9px] text-ink-faint uppercase tracking-wider font-mono">Collection Progress</span>
                    <p className="text-sm font-mono font-bold text-gain mt-1">
                      {activeDetailsClient.dealValue > 0
                        ? `${Math.min(100, Math.round((getClientTotalPaid(activeDetailsClient.id) / activeDetailsClient.dealValue) * 100))}% Paid`
                        : '100%'}
                    </p>
                  </div>
                </div>

                {/* MILESTONE PROGRESS TRACKER FOR FIXED CONTRACTS */}
                {activeDetailsClient.paymentType !== 'monthly' && (
                  <div className="bg-surface-2 border border-border p-4 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-ink-soft font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                        <Milestone size={13} className="text-warn" />
                        Project Milestone & Installment Lifecycle
                      </span>
                      <span className="text-gain font-bold">
                        {currSymbol}{getClientTotalPaid(activeDetailsClient.id).toLocaleString()} / {currSymbol}{activeDetailsClient.dealValue.toLocaleString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[10px]">
                      <div className={`p-2 rounded-xl border text-center ${
                        getClientTotalPaid(activeDetailsClient.id) > 0 ? 'bg-gain-soft border-gain/30 text-gain' : 'bg-surface border-border text-ink-faint'
                      }`}>
                        <div className="font-bold">1st Installment</div>
                        <div className="text-[9px] opacity-80">Advance / Kickoff</div>
                      </div>
                      <div className={`p-2 rounded-xl border text-center ${
                        getClientTotalPaid(activeDetailsClient.id) >= (activeDetailsClient.dealValue * 0.4) ? 'bg-gain-soft border-gain/30 text-gain' : 'bg-surface border-border text-ink-faint'
                      }`}>
                        <div className="font-bold">2nd Installment</div>
                        <div className="text-[9px] opacity-80">Alpha / Architecture</div>
                      </div>
                      <div className={`p-2 rounded-xl border text-center ${
                        getClientTotalPaid(activeDetailsClient.id) >= (activeDetailsClient.dealValue * 0.75) ? 'bg-gain-soft border-gain/30 text-gain' : 'bg-surface border-border text-ink-faint'
                      }`}>
                        <div className="font-bold">3rd Installment</div>
                        <div className="text-[9px] opacity-80">UAT / Beta Release</div>
                      </div>
                      <div className={`p-2 rounded-xl border text-center ${
                        getClientTotalPaid(activeDetailsClient.id) >= activeDetailsClient.dealValue ? 'bg-gain-soft border-gain/30 text-gain' : 'bg-surface border-border text-ink-faint'
                      }`}>
                        <div className="font-bold">Final Handover</div>
                        <div className="text-[9px] opacity-80">Full Go-Live</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* CLIENT META INFORMATION */}
                <div className="grid grid-cols-2 gap-4 bg-surface-2 p-4 rounded-xl border border-border text-xs">
                  <div>
                    <span className="text-[9px] text-ink-faint uppercase tracking-wider block font-mono">Primary Contact</span>
                    <span className="text-ink font-medium">{activeDetailsClient.name}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-ink-faint uppercase tracking-wider block font-mono">Email Address</span>
                    <span className="text-ink-soft font-mono truncate block">{activeDetailsClient.email}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-ink-faint uppercase tracking-wider block font-mono">Phone Number</span>
                    <span className="text-ink-soft font-mono">{activeDetailsClient.phone}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-ink-faint uppercase tracking-wider block font-mono">Registration Date</span>
                    <span className="text-ink-soft font-mono">{activeDetailsClient.createdDate}</span>
                  </div>
                </div>

                {/* MONTHLY VALUE & PENDING DUES BREAKDOWN LEDGER */}
                {activeDetailsClient.status === 'converted' && (() => {
                  const breakdown = getClientMonthlyBreakdown(activeDetailsClient, getClientPayments(activeDetailsClient.id));
                  return (
                    <div className="space-y-4">
                      {activeDetailsClient.paymentType === 'monthly' && (
                        <div className="bg-surface-2 border border-border rounded-xl p-4 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                            <div className="flex items-center gap-2">
                              <Calendar className="text-brand" size={15} />
                              <h4 className="font-display font-bold text-xs text-ink uppercase tracking-wide">
                                Monthly Retainer Value & Pending Dues Ledger
                              </h4>
                            </div>
                            <div className="flex items-center gap-3 text-xs font-mono">
                              <div>
                                <span className="text-ink-faint text-[10px]">Collected: </span>
                                <strong className="text-gain">{currSymbol}{breakdown.totalPaid.toLocaleString()}</strong>
                              </div>
                              <div>
                                <span className="text-ink-faint text-[10px]">Pending Dues: </span>
                                <strong className={breakdown.totalPending > 0 ? 'text-warn font-bold' : 'text-ink-faint'}>
                                  {currSymbol}{breakdown.totalPending.toLocaleString()}
                                </strong>
                              </div>
                            </div>
                          </div>

                          <div className="overflow-x-auto max-h-64 overflow-y-auto rounded-xl border border-border">
                            <table className="w-full text-left text-xs font-mono">
                              <thead className="bg-surface text-[9px] uppercase text-ink-faint border-b border-border sticky top-0 z-10">
                                <tr>
                                  <th className="py-2 px-3">Accounting Month</th>
                                  <th className="py-2 px-3">Monthly Value</th>
                                  <th className="py-2 px-3">Cash Taken</th>
                                  <th className="py-2 px-3">Pending Due</th>
                                  <th className="py-2 px-3 text-right">Status & Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border">
                                {breakdown.months.map((m) => (
                                  <tr key={m.month} className="hover:bg-surface/50 transition-colors">
                                    <td className="py-2.5 px-3 font-semibold text-ink">
                                      {m.monthName}
                                      <span className="text-[10px] text-ink-faint font-normal ml-1.5">({m.month})</span>
                                    </td>
                                    <td className="py-2.5 px-3 text-ink-soft">
                                      {currSymbol}{m.expected.toLocaleString()}
                                    </td>
                                    <td className="py-2.5 px-3 text-gain font-bold">
                                      {currSymbol}{m.paidAmount.toLocaleString()}
                                    </td>
                                    <td className={`py-2.5 px-3 font-bold ${m.pendingAmount > 0 ? 'text-warn' : 'text-ink-faint'}`}>
                                      {currSymbol}{m.pendingAmount.toLocaleString()}
                                    </td>
                                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                      <div className="flex items-center justify-end gap-2">
                                        <span className={`px-2 py-0.5 rounded-lg text-[9px] border uppercase ${
                                          m.status === 'PAID'
                                            ? 'bg-gain-soft text-gain border-gain/30'
                                            : m.status === 'PARTIAL'
                                            ? 'bg-warn-soft text-warn border-warn/30'
                                            : 'bg-loss-soft text-loss border-loss/30'
                                        }`}>
                                          {m.status === 'PAID' ? 'Paid' : m.status === 'PARTIAL' ? 'Partially Paid' : 'Pending Due'}
                                        </span>

                                        {m.pendingAmount > 0 && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setPayAmount(m.pendingAmount.toString());
                                              setPayPaidMonth(m.month);
                                              setPayType('monthly');
                                              setPayNotes(`Monthly retainer for ${m.monthName}`);
                                              setShowLogPaymentFormInDetails(true);
                                            }}
                                            className="px-2.5 py-1 rounded-xl bg-gain hover:bg-gain/90 text-white text-[10px] font-semibold transition-colors cursor-pointer shadow-card"
                                          >
                                            + Collect Cash
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* EXTRA / AD-HOC DELIVERABLES LEDGER */}
                      {breakdown.extraWorkPayments.length > 0 && (
                        <div className="bg-brand-soft border border-brand/30 rounded-xl p-4 space-y-3">
                          <div className="flex items-center justify-between border-b border-brand/20 pb-2.5">
                            <div className="flex items-center gap-2">
                              <Sparkles className="text-brand" size={15} />
                              <h4 className="font-display font-bold text-xs text-ink uppercase tracking-wide">
                                Extra / Ad-Hoc Deliverables Revenue
                              </h4>
                            </div>
                            <div className="text-xs font-mono">
                              <span className="text-ink-faint text-[10px]">Extra Cash Collected: </span>
                              <strong className="text-gain font-bold">+{currSymbol}{breakdown.totalExtraPaid.toLocaleString()}</strong>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {breakdown.extraWorkPayments.map((p) => (
                              <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-surface p-2.5 rounded-xl border border-border text-xs font-mono">
                                <div className="flex items-center gap-2.5">
                                  <span className="px-2 py-0.5 rounded-lg text-[10px] bg-brand-soft text-brand border border-brand/30 font-semibold uppercase">
                                    {p.workCategory || 'Extra Work'}
                                  </span>
                                  <span className="text-ink font-medium">{p.notes}</span>
                                </div>
                                <div className="flex items-center gap-3 text-right">
                                  <span className="text-gain font-bold text-sm">+{currSymbol}{p.amount.toLocaleString()}</span>
                                  <span className="text-[10px] text-ink-faint">
                                    {p.date} ({p.method || 'Wire'})
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* LEDGER & ADD PAYMENT IN-CONTEXT */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-mono font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard size={13} className="text-brand" />
                      Client Payment Ledger & Installments
                    </h4>
                    
                    {activeDetailsClient.status === 'converted' && (
                      <button
                        onClick={() => {
                          if (activeDetailsClient.paymentType !== 'monthly') {
                            setPayType('installment');
                          }
                          setShowLogPaymentFormInDetails(!showLogPaymentFormInDetails);
                        }}
                        className="bg-gain hover:bg-gain/90 text-white font-medium py-1.5 px-3 rounded-xl text-[10px] flex items-center gap-1 cursor-pointer transition-colors font-mono font-bold shadow-card"
                      >
                        {showLogPaymentFormInDetails ? 'Hide Payment Form' : '+ Record Installment / Payment'}
                      </button>
                    )}
                  </div>

                  {/* Toggleable Embedded Payment Form */}
                  <AnimatePresence>
                    {showLogPaymentFormInDetails && activeDetailsClient.status === 'converted' && (
                      <motion.form 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleLogPaymentSubmit}
                        className="p-4 bg-surface-2 border border-border rounded-xl space-y-3 overflow-hidden text-xs shadow-card"
                      >
                        <p className="text-[10px] text-gain font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                          <Coins size={12} />
                          Record Client Installment / Cash Inflow
                        </p>

                        {/* Payment Type Classification */}
                        <div>
                          <label className="block text-[10px] text-ink-faint mb-1 font-medium">Payment Classification *</label>
                          <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
                            {activeDetailsClient.paymentType !== 'monthly' && (
                              <button
                                type="button"
                                onClick={() => setPayType('installment')}
                                className={`py-1.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                                  payType === 'installment'
                                    ? 'bg-warn border-warn text-white font-semibold'
                                    : 'bg-surface border-border text-ink-soft hover:text-ink'
                                }`}
                              >
                                ⚡ Milestone Installment
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setPayType('monthly')}
                              className={`py-1.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                                payType === 'monthly'
                                  ? 'bg-brand border-brand text-white font-semibold'
                                  : 'bg-surface border-border text-ink-soft hover:text-ink'
                              }`}
                            >
                              Monthly Retainer
                            </button>
                            <button
                              type="button"
                              onClick={() => setPayType('extra-work')}
                              className={`py-1.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                                payType === 'extra-work'
                                  ? 'bg-purple-600 border-purple-600 text-white font-semibold'
                                  : 'bg-surface border-border text-ink-soft hover:text-ink'
                              }`}
                            >
                              Extra Deliverable
                            </button>
                          </div>
                        </div>

                        {/* Installment Milestone Dropdown */}
                        {payType === 'installment' && (
                          <div className="bg-warn-soft p-3 rounded-xl border border-warn/30 space-y-2 font-mono">
                            <label className="block text-[10px] text-warn font-medium uppercase">
                              Select Milestone Installment Preset *
                            </label>
                            <select
                              value={payInstallmentStage}
                              onChange={(e) => setPayInstallmentStage(e.target.value)}
                              className="w-full bg-surface border border-border rounded-xl py-1.5 px-2.5 text-xs text-ink focus:outline-none focus:border-warn cursor-pointer"
                            >
                              <option value="1st Installment - Advance Kickoff (25%-33%)">1st Installment - Advance Kickoff (25%-33%)</option>
                              <option value="2nd Installment - Design & Architecture Approval (25%)">2nd Installment - Design & Architecture Approval (25%)</option>
                              <option value="3rd Installment - Core Alpha Release (25%)">3rd Installment - Core Alpha Release (25%)</option>
                              <option value="4th Installment - Beta Testing & UAT (15%)">4th Installment - Beta Testing & UAT (15%)</option>
                              <option value="Final Installment - Production Handover & Launch (10%)">Final Installment - Production Handover & Launch (10%)</option>
                              <option value="Ad-hoc Milestone Payment">Ad-hoc Milestone Payment</option>
                            </select>

                            {/* Quick Amount Calculation Buttons */}
                            <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px]">
                              <span className="text-ink-faint">Quick Fill Amount:</span>
                              <button
                                type="button"
                                onClick={() => setPayAmount(Math.round(activeDetailsClient.dealValue * 0.25).toString())}
                                className="px-2 py-1 rounded-lg bg-surface border border-border hover:border-warn text-ink cursor-pointer"
                              >
                                25% Advance ({currSymbol}{Math.round(activeDetailsClient.dealValue * 0.25).toLocaleString()})
                              </button>
                              <button
                                type="button"
                                onClick={() => setPayAmount(Math.round(activeDetailsClient.dealValue * 0.33).toString())}
                                className="px-2 py-1 rounded-lg bg-surface border border-border hover:border-warn text-ink cursor-pointer"
                              >
                                33% Kickoff ({currSymbol}{Math.round(activeDetailsClient.dealValue * 0.33).toLocaleString()})
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const bal = Math.max(0, activeDetailsClient.dealValue - getClientTotalPaid(activeDetailsClient.id));
                                  setPayAmount(bal.toString());
                                }}
                                className="px-2 py-1 rounded-lg bg-warn text-white font-bold cursor-pointer hover:bg-warn/90"
                              >
                                Full Remaining Balance ({currSymbol}{Math.max(0, activeDetailsClient.dealValue - getClientTotalPaid(activeDetailsClient.id)).toLocaleString()})
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Extra Work Category Dropdown */}
                        {payType === 'extra-work' && (
                          <div className="bg-brand-soft p-3 rounded-xl border border-brand/30 space-y-2">
                            <label className="block text-[10px] text-brand font-medium font-mono uppercase">
                              Extra Deliverable / Work Category *
                            </label>
                            <select
                              value={payWorkCategory}
                              onChange={(e) => setPayWorkCategory(e.target.value)}
                              className="w-full bg-surface border border-border rounded-xl py-1.5 px-2.5 text-xs text-ink focus:outline-none focus:border-brand cursor-pointer font-mono"
                            >
                              <option value="Extra Video Editing / Production">🎬 Extra Video Editing / Production</option>
                              <option value="Branding & Visual Design">🎨 Branding & Visual Design</option>
                              <option value="Flex & Strategy Consulting">⚡ Flex & Strategy Consulting</option>
                              <option value="Website & Software Work">💻 Website & Software Work</option>
                              <option value="Marketing & Ad Campaign">📈 Marketing & Ad Campaign</option>
                              <option value="Other Extra Deliverable">✏️ Other Extra Deliverable (Custom)</option>
                            </select>

                            {payWorkCategory === 'Other Extra Deliverable' && (
                              <div>
                                <label className="block text-[10px] text-ink-faint mb-1">Custom Deliverable Name *</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. Extra Reel Package, Audio Mixing..."
                                  value={payCustomCategory}
                                  onChange={(e) => setPayCustomCategory(e.target.value)}
                                  className="w-full bg-surface border border-border rounded-xl py-1.5 px-2.5 text-xs text-ink focus:outline-none focus:border-brand"
                                />
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] text-ink-faint mb-1 font-medium font-mono">Amount Received ({currSymbol}) *</label>
                            <input
                              type="number"
                              required
                              placeholder={activeDetailsClient.dealValue.toString()}
                              value={payAmount}
                              onChange={(e) => setPayAmount(e.target.value)}
                              className="w-full bg-surface border border-border rounded-xl py-1.5 px-2.5 text-xs text-ink focus:outline-none focus:border-gain font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-ink-faint mb-1 font-medium">Payment Method</label>
                            <select
                              value={payMethod}
                              onChange={(e) => setPayMethod(e.target.value as any)}
                              className="w-full bg-surface border border-border rounded-xl py-1.5 px-2 text-xs text-ink focus:outline-none focus:border-gain cursor-pointer font-mono"
                            >
                              <option value="Wire">Wire Transfer</option>
                              <option value="Card">Credit Card</option>
                              <option value="Bank">Bank Deposit</option>
                              <option value="Cash">Cash</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[10px] text-ink-faint mb-1 font-medium">Payment Received Date *</label>
                            <input
                              type="date"
                              required
                              value={payDate}
                              onChange={(e) => {
                                setPayDate(e.target.value);
                                if (e.target.value && e.target.value.length >= 7) {
                                  setPayPaidMonth(e.target.value.substring(0, 7));
                                }
                              }}
                              className="w-full bg-surface border border-border rounded-xl py-1.5 px-2.5 text-xs text-ink focus:outline-none focus:border-gain font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-ink-faint mb-1 font-medium">Accounting Paid Month *</label>
                            <input
                              type="month"
                              required
                              value={payPaidMonth}
                              onChange={(e) => setPayPaidMonth(e.target.value)}
                              className="w-full bg-surface border border-border rounded-xl py-1.5 px-2.5 text-xs text-ink focus:outline-none focus:border-gain font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-ink-faint mb-1 font-medium font-mono">Memo / Receipt Notes</label>
                            <input
                              type="text"
                              placeholder="e.g. Received 1st Installment advance via Wire"
                              value={payNotes}
                              onChange={(e) => setPayNotes(e.target.value)}
                              className="w-full bg-surface border border-border rounded-xl py-1.5 px-2.5 text-xs text-ink focus:outline-none focus:border-gain"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 text-[10px] font-bold font-mono">
                          <button
                            type="button"
                            onClick={() => setShowLogPaymentFormInDetails(false)}
                            className="bg-surface border border-border hover:bg-surface-2 text-ink-soft py-1 px-3 rounded-xl cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="bg-gain hover:bg-gain/90 text-white py-1 px-4 rounded-xl cursor-pointer shadow-card"
                          >
                            ✓ Record Cash Receipt & Issue Voucher
                          </button>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  {activeDetailsClient.status !== 'converted' ? (
                    <div className="bg-surface-2 border border-border rounded-xl p-6 text-center text-ink-faint text-xs">
                      <AlertCircle className="mx-auto text-ink-faint mb-1" size={18} />
                      Current stage: <span className="font-semibold text-ink-soft capitalize">{activeDetailsClient.status}</span>. 
                      Promote this lead to <span className="text-brand font-bold">Converted</span> to enable collection entries.
                    </div>
                  ) : (
                    <div className="border border-border rounded-xl overflow-hidden shadow-card">
                      <div className="bg-surface-2 grid grid-cols-5 p-2.5 text-[9px] uppercase font-mono text-ink-faint border-b border-border">
                        <div>Date</div>
                        <div>Category / Milestone</div>
                        <div className="text-center">Method</div>
                        <div className="text-right">Amount</div>
                        <div className="text-right">Voucher</div>
                      </div>

                      <div className="divide-y divide-border max-h-56 overflow-y-auto font-mono text-xs">
                        {getClientPayments(activeDetailsClient.id).map(pay => (
                          <div key={pay.id} className="grid grid-cols-5 p-2.5 text-ink hover:bg-surface-2/50 items-center">
                            <div className="text-ink-faint text-[11px]">{pay.date}</div>
                            <div className="truncate pr-2">
                              <span className="text-[10px] text-ink font-semibold block truncate">
                                {pay.workCategory || (pay.type === 'installment' ? 'Installment' : 'Retainer')}
                              </span>
                              <span className="text-[9px] text-ink-faint font-sans truncate block">{pay.notes}</span>
                            </div>
                            <div className="text-center">
                              <span className="text-[9px] bg-surface-2 border border-border text-ink-soft px-1.5 py-0.5 rounded-md">
                                {pay.method || 'Wire'}
                              </span>
                            </div>
                            <div className="text-right font-bold text-gain">
                              +{currSymbol}{pay.amount.toLocaleString()}
                            </div>
                            <div className="text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedVoucherPayment(pay);
                                  setIsVoucherOpen(true);
                                }}
                                className="px-2 py-1 rounded-lg bg-surface hover:bg-gain-soft border border-border hover:border-gain/40 text-gain text-[10px] font-bold cursor-pointer transition-colors inline-flex items-center gap-1"
                              >
                                <Receipt size={11} />
                                Voucher
                              </button>
                            </div>
                          </div>
                        ))}

                        {getClientPayments(activeDetailsClient.id).length === 0 && (
                          <div className="p-6 text-center text-ink-faint text-xs">
                            No recorded cash receipts from this client yet.
                          </div>
                        )}
                      </div>

                      <div className="bg-surface-2 p-2.5 flex justify-between border-t border-border text-xs font-mono">
                        <span className="text-ink-faint">Total cash collected:</span>
                        <span className="font-bold text-gain">{currSymbol}{getClientTotalPaid(activeDetailsClient.id).toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="bg-surface-2 p-4 border-t border-border flex justify-end">
                <button
                  onClick={() => setActiveDetailsClient(null)}
                  className="bg-surface hover:bg-surface-2 text-ink-soft hover:text-ink font-medium py-1.5 px-4 rounded-xl text-xs cursor-pointer border border-border font-mono transition-colors"
                >
                  Close Dashboard
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: Secure Delete Client Confirmation */}
      <AnimatePresence>
        {deleteClientId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-surface border border-loss/40 w-full max-w-md rounded-2xl p-6 shadow-pop"
            >
              <div className="flex items-center gap-3 text-loss mb-4">
                <div className="p-2.5 bg-loss-soft border border-loss/30 rounded-xl">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-ink">Security Clearance Check</h3>
                  <p className="text-[9px] text-loss font-mono">CLIENT DELETION PROTOCOL</p>
                </div>
              </div>

              <div className="p-3 bg-loss-soft border border-loss/20 rounded-xl text-xs text-ink-soft mb-4 leading-relaxed font-sans">
                Warning: You are attempting to delete client <strong className="text-ink">
                  {clients.find(c => c.id === deleteClientId)?.company || 'this client'}
                </strong>. All associated data will be removed.
              </div>

              <form onSubmit={handleDeleteVerify} className="space-y-4">
                <div>
                  <label className="block text-[9px] text-loss font-mono mb-1.5 uppercase tracking-wide">
                    Enter Secret Code (Required)
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••"
                    value={deleteSecretCode}
                    onChange={(e) => setDeleteSecretCode(e.target.value)}
                    className={`w-full bg-surface-2 text-center border font-mono tracking-widest text-base rounded-xl py-2 px-4 focus:outline-none transition-all text-ink ${
                      deleteError 
                        ? 'border-loss animate-bounce' 
                        : 'border-border focus:border-loss'
                    }`}
                  />
                  {deleteError && (
                    <p className="text-xs text-loss font-medium text-center mt-2 flex items-center justify-center gap-1 font-mono">
                      <AlertCircle size={11} />
                      Access Denied. Code incorrect.
                    </p>
                  )}
                </div>

                <div className="pt-2 flex justify-end gap-2 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteClientId(null);
                      setDeleteSecretCode('');
                      setDeleteError(false);
                    }}
                    className="bg-surface-2 hover:bg-surface text-ink-soft py-1.5 px-4 rounded-xl cursor-pointer border border-border"
                  >
                    Abort
                  </button>
                  <button
                    type="submit"
                    className="bg-loss hover:bg-loss/90 text-white py-1.5 px-5 rounded-xl cursor-pointer transition-colors shadow-card"
                  >
                    Confirm Deletion
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: Add New Client Form */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="bg-surface border border-border w-full max-w-lg rounded-2xl overflow-hidden shadow-pop"
            >
              {/* Header */}
              <div className="p-5 border-b border-border flex justify-between items-center bg-surface-2">
                <h3 className="text-sm font-mono font-bold text-ink flex items-center gap-2">
                  <Plus size={16} className="text-brand" />
                  Add Client Portfolio
                </h3>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-ink-faint hover:text-ink p-1 rounded-lg cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form body */}
              <form onSubmit={handleAddSubmit}>
                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                  {formError && (
                    <div className="bg-loss-soft border border-loss/30 text-loss p-3 rounded-xl text-xs flex items-center gap-2">
                      <AlertCircle size={14} />
                      {formError}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-ink-soft mb-1 font-medium">Company Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Royal Tech Solutions"
                        value={newClientCompany}
                        onChange={(e) => setNewClientCompany(e.target.value)}
                        className="w-full bg-surface-2 border border-border rounded-xl py-1.5 px-3 text-xs text-ink focus:outline-none focus:border-brand"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-ink-soft mb-1 font-medium">Primary Contact *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rajesh Varma"
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        className="w-full bg-surface-2 border border-border rounded-xl py-1.5 px-3 text-xs text-ink focus:outline-none focus:border-brand"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-ink-soft mb-1">Email Address</label>
                      <input
                        type="email"
                        placeholder="contact@company.com"
                        value={newClientEmail}
                        onChange={(e) => setNewClientEmail(e.target.value)}
                        className="w-full bg-surface-2 border border-border rounded-xl py-1.5 px-3 text-xs text-ink focus:outline-none focus:border-brand font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-ink-soft mb-1">Phone Number</label>
                      <input
                        type="text"
                        placeholder="+1 (555) 939-0192"
                        value={newClientPhone}
                        onChange={(e) => setNewClientPhone(e.target.value)}
                        className="w-full bg-surface-2 border border-border rounded-xl py-1.5 px-3 text-xs text-ink focus:outline-none focus:border-brand font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-surface-2 p-3 rounded-xl border border-border">
                    <div>
                      <label className="block text-[10px] text-ink-faint mb-1 font-mono uppercase">Lifecycle Status</label>
                      <select
                        value={newClientStatus}
                        onChange={(e) => setNewClientStatus(e.target.value as any)}
                        className="w-full bg-surface border border-border rounded-xl py-1 px-2 text-xs text-ink focus:outline-none cursor-pointer"
                      >
                        <option value="lead">Sales Lead</option>
                        <option value="contacted">Contacted</option>
                        <option value="proposal">Proposal</option>
                        <option value="converted">Converted Client (Active)</option>
                        <option value="lost">Lost Lead</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-ink-faint mb-1 font-mono uppercase">Billing Type</label>
                      <select
                        value={newClientPaymentType}
                        onChange={(e) => setNewClientPaymentType(e.target.value as any)}
                        className="w-full bg-surface border border-border rounded-xl py-1 px-2 text-xs text-ink focus:outline-none cursor-pointer font-bold text-warn"
                      >
                        <option value="monthly">Monthly Recurring Retainer</option>
                        <option value="one-time">⚡ Fixed Contract / Development Quote</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-ink-soft mb-1 font-medium">
                        {newClientPaymentType === 'monthly' ? `Monthly Retainer (${currSymbol}) *` : `Total Fixed Contract Quote (${currSymbol}) *`}
                      </label>
                      <input
                        type="number"
                        required
                        placeholder={newClientPaymentType === 'monthly' ? "5000" : "120000"}
                        value={newClientDealValue}
                        onChange={(e) => setNewClientDealValue(e.target.value)}
                        className="w-full bg-surface-2 border border-border rounded-xl py-1.5 px-3 text-xs text-ink font-mono focus:outline-none focus:border-brand"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-ink-soft mb-1 font-medium">Account Manager *</label>
                      <select
                        required
                        value={newClientAssignedEmp}
                        onChange={(e) => setNewClientAssignedEmp(e.target.value)}
                        className="w-full bg-surface-2 border border-border rounded-xl py-1.5 px-3 text-xs text-ink focus:outline-none focus:border-brand cursor-pointer"
                      >
                        <option value="">Select Employee...</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* SERVICE START DATE / ONBOARDING MONTH (FOR NEW OR OLD CLIENTS) */}
                  <div className="bg-surface-2 p-3 rounded-xl border border-border">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex-1">
                        <label className="block text-xs text-ink font-semibold mb-0.5">
                          Service Start Month / Onboarding Date *
                        </label>
                        <p className="text-[10px] text-ink-faint">
                          Pick past month (e.g. 2025-01-01) for old clients to track historical retainer dues.
                        </p>
                      </div>
                      <input
                        type="date"
                        required
                        value={newClientStartDate}
                        onChange={(e) => setNewClientStartDate(e.target.value)}
                        className="bg-surface border border-border rounded-xl py-1 px-2.5 text-xs text-ink font-mono focus:outline-none focus:border-brand cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Project Scope / Deliverables input */}
                  <div>
                    <label className="block text-xs text-ink-soft mb-1 font-medium">
                      Project Deliverables & Scope Overview
                    </label>
                    <textarea
                      rows={2}
                      placeholder={newClientPaymentType === 'one-time' ? "e.g. End-to-end Enterprise App Development (10 Lakh project value with 3 installments)" : "e.g. Monthly Social Media Management & Branding"}
                      value={newClientProjectScope}
                      onChange={(e) => setNewClientProjectScope(e.target.value)}
                      className="w-full bg-surface-2 border border-border rounded-xl py-1.5 px-3 text-xs text-ink focus:outline-none focus:border-brand"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-surface-2 p-4 border-t border-border flex justify-end gap-2 text-xs font-semibold font-mono">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="bg-surface hover:bg-surface-2 text-ink-soft py-1.5 px-4 rounded-xl cursor-pointer border border-border"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-brand hover:bg-brand/90 text-white py-1.5 px-5 rounded-xl cursor-pointer transition-colors shadow-card"
                  >
                    Create Portfolio Client
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 5: Installment Voucher & Receipt */}
      <InstallmentVoucherModal
        isOpen={isVoucherOpen}
        onClose={() => setIsVoucherOpen(false)}
        client={activeDetailsClient}
        payment={selectedVoucherPayment}
        companySettings={companySettings}
        contractTotal={activeDetailsClient?.dealValue || 0}
        totalPaidSoFar={activeDetailsClient ? getClientTotalPaid(activeDetailsClient.id) : 0}
      />
    </div>
  );
}

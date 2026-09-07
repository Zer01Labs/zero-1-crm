import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DollarSign, CreditCard, Search, Calendar, Plus, X, 
  Trash2, AlertCircle, FileText, CheckCircle2, ArrowUpRight 
} from 'lucide-react';
import { Client, Payment, PaymentType, CompanySettings } from '../types';

interface PaymentSectionProps {
  payments: Payment[];
  clients: Client[];
  companySettings?: CompanySettings;
  onLogPayment: (payment: Omit<Payment, 'id' | 'date'> & { date?: string }) => void;
  onDeletePayment: (id: string) => void;
}

export default function PaymentSection({
  payments,
  clients,
  companySettings,
  onLogPayment,
  onDeletePayment,
}: PaymentSectionProps) {
  const currSymbol = companySettings?.currencySymbol || '₹';
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);

  // Form states
  const [selectedClientId, setSelectedClientId] = useState('');
  const [payType, setPayType] = useState<PaymentType>('monthly');
  const [payWorkCategory, setPayWorkCategory] = useState('Extra Video Editing / Production');
  const [payCustomCategory, setPayCustomCategory] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'Wire' | 'Card' | 'Bank' | 'Cash'>('Wire');
  const [payDate, setPayDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [payPaidMonth, setPayPaidMonth] = useState(() => new Date().toISOString().substring(0, 7));
  const [payNotes, setPayNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Converted/active clients for recording payments
  const activeClients = clients.filter(c => c.status === 'converted');

  // Filter payments
  const filteredPayments = payments.filter(p => {
    // Search query
    const clientNameStr = typeof p.clientName === 'string' ? p.clientName : String(p.clientName || '');
    const notesStr = typeof p.notes === 'string' ? p.notes : String(p.notes || '');

    const matchesSearch = 
      clientNameStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notesStr.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Method filter
    const matchesMethod = methodFilter === 'all' || p.method === methodFilter;

    // Client filter
    const matchesClient = clientFilter === 'all' || p.clientId === clientFilter;

    // Date filters
    const matchesStart = !startDate || p.date >= startDate;
    const matchesEnd = !endDate || p.date <= endDate;

    return matchesSearch && matchesMethod && matchesClient && matchesStart && matchesEnd;
  });

  // KPI Calculations (Filtered)
  const totalCollected = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const paymentsCount = filteredPayments.length;
  const averagePayment = paymentsCount > 0 ? Math.round(totalCollected / paymentsCount) : 0;

  // Handle Log Payment Submit
  const handleRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !payAmount) {
      setFormError('Please select a client and enter an amount.');
      return;
    }

    const client = clients.find(c => c.id === selectedClientId);
    if (!client) return;

    const category = payType === 'extra-work'
      ? (payWorkCategory === 'Other Extra Deliverable' ? (payCustomCategory.trim() || 'Extra Deliverable') : payWorkCategory)
      : '';

    onLogPayment({
      clientId: client.id,
      clientName: `${client.name} (${client.company})`,
      amount: parseFloat(payAmount) || 0,
      type: payType,
      workCategory: category,
      notes: payNotes || (payType === 'extra-work' ? `Extra work: ${category}` : 'Monthly retainer payment'),
      method: payMethod,
      date: payDate || new Date().toISOString().split('T')[0],
      paidMonth: payPaidMonth || new Date().toISOString().substring(0, 7)
    });

    // Reset Form
    setSelectedClientId('');
    setPayType('monthly');
    setPayWorkCategory('Extra Video Editing / Production');
    setPayCustomCategory('');
    setPayAmount('');
    setPayMethod('Wire');
    setPayDate(new Date().toISOString().split('T')[0]);
    setPayPaidMonth(new Date().toISOString().substring(0, 7));
    setPayNotes('');
    setFormError('');
    setIsRecordModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-surface p-5 rounded border border-border shadow-card">
        <div>
          <h2 className="text-lg font-display font-bold tracking-tight text-ink flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gain"></span>
            Collections & Receipts
          </h2>
          <p className="text-xs text-ink-soft mt-0.5 font-sans">Every dollar collected from active client relationships, fully itemized</p>
        </div>

        <button
          onClick={() => setIsRecordModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-brand-contrast font-medium py-1.5 px-4 rounded text-xs transition-colors cursor-pointer self-start sm:self-center shadow-xs"
        >
          <Plus size={14} />
          Record Payment
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Collected */}
        <div className="bg-surface p-5 rounded border border-border flex flex-col justify-between shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-ink-faint font-mono uppercase tracking-wider">Total Collected (Filtered)</span>
            <div className="p-1 rounded bg-gain/10 text-gain border border-gain/20">
              <DollarSign size={14} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-mono font-bold text-ink">
              {currSymbol}{totalCollected.toLocaleString()}
            </h3>
            <p className="text-[10px] text-ink-faint mt-1 flex items-center gap-1">
              <ArrowUpRight size={11} className="text-gain" />
              Aggregate cash inflow
            </p>
          </div>
        </div>

        {/* Card 2: Payments Recorded */}
        <div className="bg-surface p-5 rounded border border-border flex flex-col justify-between shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-ink-faint font-mono uppercase tracking-wider">Transactions Recorded</span>
            <div className="p-1 rounded bg-surface-2 text-ink-soft border border-border">
              <FileText size={14} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-mono font-bold text-ink">
              {paymentsCount}
            </h3>
            <p className="text-[10px] text-ink-faint mt-1">Itemized receipts in view</p>
          </div>
        </div>

        {/* Card 3: Average Payment */}
        <div className="bg-surface p-5 rounded border border-border flex flex-col justify-between shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-ink-faint font-mono uppercase tracking-wider">Avg. Transaction Value</span>
            <div className="p-1 rounded bg-brand/10 text-brand border border-brand/20">
              <CreditCard size={14} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-mono font-bold text-ink">
              {currSymbol}{averagePayment.toLocaleString()}
            </h3>
            <p className="text-[10px] text-ink-faint mt-1">Per recorded transaction</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-surface p-4 rounded border border-border space-y-4 shadow-card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search bar */}
          <div className="relative col-span-1 md:col-span-2">
            <span className="absolute inset-y-0 left-3 flex items-center text-ink-faint">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Search payments by client, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded py-1.5 pl-9 pr-4 text-xs text-ink focus:outline-none focus:border-brand transition-all placeholder:text-ink-faint"
            />
          </div>

          {/* Client Filter */}
          <div>
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded py-1.5 px-3 text-xs text-ink focus:outline-none focus:border-brand cursor-pointer"
            >
              <option value="all">All Clients</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.company} ({c.name})</option>
              ))}
            </select>
          </div>

          {/* Method Filter */}
          <div>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded py-1.5 px-3 text-xs text-ink focus:outline-none focus:border-brand cursor-pointer"
            >
              <option value="all">All Methods</option>
              <option value="Wire">Wire Transfer</option>
              <option value="Card">Credit Card</option>
              <option value="Bank">Bank Deposit</option>
              <option value="Cash">Cash</option>
            </select>
          </div>
        </div>

        {/* Date Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-ink-faint uppercase tracking-wider font-mono shrink-0">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded py-1 px-2.5 text-xs text-ink focus:outline-none focus:border-brand font-mono"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-ink-faint uppercase tracking-wider font-mono shrink-0">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded py-1 px-2.5 text-xs text-ink focus:outline-none focus:border-brand font-mono"
            />
          </div>
        </div>
      </div>

      {/* Payments Ledger Table */}
      <div className="bg-surface border border-border rounded overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-2 border-b border-border text-[10px] uppercase font-mono text-ink-faint">
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Client / Company</th>
                <th className="py-3 px-4 font-semibold text-center">Method</th>
                <th className="py-3 px-4 font-semibold">Reference / Note</th>
                <th className="py-3 px-4 font-semibold text-right">Amount</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-surface-2/50 text-xs text-ink-soft transition-colors">
                  <td className="py-3 px-4 font-mono text-ink-faint">{p.date}</td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-ink block">{p.clientName.split('(')[1]?.replace(')', '') || p.clientName}</span>
                    <span className="text-[10px] text-ink-faint block">{p.clientName.split('(')[0]?.trim()}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand/10 text-brand border border-brand/20">
                      {p.method || 'Wire'}
                    </span>
                  </td>
                  <td className="py-3 px-4 max-w-xs truncate text-ink-faint" title={p.notes}>
                    {p.notes}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-gain">
                    +{currSymbol}{p.amount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setDeletePaymentId(p.id)}
                      className="p-1 rounded bg-surface-2 hover:bg-loss-faint text-ink-faint hover:text-loss border border-border hover:border-loss/30 transition-colors cursor-pointer"
                      title="Delete Transaction"
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-ink-faint">
                    <AlertCircle className="mx-auto text-ink-faint mb-2" size={24} />
                    <p className="text-xs">No payments recorded matching current criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Bottom Total Summary */}
        <div className="bg-surface-2 p-4 border-t border-border flex justify-between items-center text-xs font-mono">
          <span className="text-ink-faint">RECORDS VISIBLE: {paymentsCount}</span>
          <div className="flex gap-4">
            <span className="text-ink-soft">Page Total Inflow:</span>
            <strong className="text-gain font-bold">{currSymbol}{totalCollected.toLocaleString()}</strong>
          </div>
        </div>
      </div>

      {/* MODAL 1: Record received payment */}
      <AnimatePresence>
        {isRecordModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-surface border border-border w-full max-w-md rounded p-6 shadow-pop"
            >
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-mono font-bold text-ink flex items-center gap-1.5">
                  <CreditCard className="text-brand" size={14} />
                  Record Collection
                </h4>
                <button 
                  onClick={() => {
                    setIsRecordModalOpen(false);
                    setFormError('');
                  }}
                  className="text-ink-faint hover:text-ink p-1 rounded cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <form onSubmit={handleRecordSubmit} className="space-y-4">
                {formError && (
                  <div className="bg-loss-faint border border-loss/30 text-loss p-2.5 rounded text-xs flex items-center gap-1.5">
                    <AlertCircle size={12} />
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block text-xs text-ink-soft font-medium mb-1">Paying Client *</label>
                  <select
                    required
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full bg-surface-2 border border-border rounded py-2 px-3 text-xs text-ink focus:outline-none focus:border-brand cursor-pointer font-mono"
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
                    Payment Classification *
                  </label>
                  <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                    <button
                      type="button"
                      onClick={() => setPayType('monthly')}
                      className={`py-2 px-2 rounded border text-center transition-all cursor-pointer ${
                        payType === 'monthly'
                          ? 'bg-brand text-brand-contrast font-semibold border-brand'
                          : 'bg-surface-2 border-border text-ink-soft hover:text-ink'
                      }`}
                    >
                      Monthly Retainer
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayType('extra-work')}
                      className={`py-2 px-2 rounded border text-center transition-all cursor-pointer ${
                        payType === 'extra-work'
                          ? 'bg-brand text-brand-contrast font-semibold border-brand'
                          : 'bg-surface-2 border-border text-ink-soft hover:text-ink'
                      }`}
                    >
                      ⚡ Extra Work (Video / Branding / Flex)
                    </button>
                  </div>
                </div>

                {/* Extra Work Category Dropdown */}
                {payType === 'extra-work' && (
                  <div className="bg-brand/10 p-3 rounded border border-brand/20 space-y-3">
                    <div>
                      <label className="block text-xs text-brand font-medium font-mono uppercase mb-1">
                        Extra Deliverable / Work Category *
                      </label>
                      <select
                        value={payWorkCategory}
                        onChange={(e) => setPayWorkCategory(e.target.value)}
                        className="w-full bg-surface-2 border border-border rounded py-2 px-3 text-xs text-ink focus:outline-none focus:border-brand cursor-pointer font-mono"
                      >
                        <option value="Extra Video Editing / Production">🎬 Extra Video Editing / Production</option>
                        <option value="Branding & Visual Design">🎨 Branding & Visual Design</option>
                        <option value="Flex & Strategy Consulting">⚡ Flex & Strategy Consulting</option>
                        <option value="Website & Software Work">💻 Website & Software Work</option>
                        <option value="Marketing & Ad Campaign">📈 Marketing & Ad Campaign</option>
                        <option value="Other Extra Deliverable">✏️ Other Extra Deliverable (Custom)</option>
                      </select>
                    </div>

                    {payWorkCategory === 'Other Extra Deliverable' && (
                      <div>
                        <label className="block text-xs text-ink-soft mb-1 font-medium">Custom Deliverable Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Extra Reel Package, Audio Editing..."
                          value={payCustomCategory}
                          onChange={(e) => setPayCustomCategory(e.target.value)}
                          className="w-full bg-surface-2 border border-border rounded py-2 px-3 text-xs text-ink focus:outline-none focus:border-brand"
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-ink-soft font-medium mb-1">Amount ({currSymbol}) *</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center text-ink-faint font-mono text-xs">{currSymbol}</span>
                      <input
                        type="number"
                        required
                        placeholder="1500"
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        className="w-full bg-surface-2 border border-border rounded py-2 pl-7 pr-3 text-xs text-ink focus:outline-none focus:border-brand font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-ink-soft font-medium mb-1">Payment Method</label>
                    <select
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value as any)}
                      className="w-full bg-surface-2 border border-border rounded py-2 px-3 text-xs text-ink focus:outline-none focus:border-brand cursor-pointer"
                    >
                      <option value="Wire">Wire Transfer</option>
                      <option value="Card">Credit Card</option>
                      <option value="Bank">Bank Deposit</option>
                      <option value="Cash">Cash</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-ink-soft font-medium mb-1">Transaction Date *</label>
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
                      className="w-full bg-surface-2 border border-border rounded py-2 px-3 text-xs text-ink focus:outline-none focus:border-brand font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-ink-soft font-medium mb-1">Accounting Paid Month *</label>
                    <input
                      type="month"
                      required
                      value={payPaidMonth}
                      onChange={(e) => setPayPaidMonth(e.target.value)}
                      className="w-full bg-surface-2 border border-border rounded py-2 px-3 text-xs text-ink focus:outline-none focus:border-brand font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-ink-soft font-medium mb-1">Reference Notes / Description</label>
                  <input
                    type="text"
                    placeholder="e.g., Q3 Project retainer"
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    className="w-full bg-surface-2 border border-border rounded py-2 px-3 text-xs text-ink focus:outline-none focus:border-brand"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRecordModalOpen(false);
                      setFormError('');
                    }}
                    className="bg-surface-2 hover:bg-border text-ink-soft py-1.5 px-3 rounded cursor-pointer border border-border"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-gain hover:bg-gain/90 text-white py-1.5 px-4 rounded cursor-pointer transition-colors"
                  >
                    Post Collection
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletePaymentId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-surface border border-border w-full max-w-md rounded p-6 shadow-pop"
            >
              <div className="flex items-center gap-2.5 text-loss mb-4">
                <AlertCircle size={18} />
                <h3 className="font-display font-bold text-sm text-ink">Delete Recorded Transaction</h3>
              </div>

              <p className="text-xs text-ink-soft">
                Are you sure you want to delete this payment transaction? This will reverse the collection record and affect the company balance. This action cannot be undone.
              </p>

              <div className="pt-5 flex justify-end gap-2 text-xs font-medium">
                <button
                  onClick={() => setDeletePaymentId(null)}
                  className="bg-surface-2 hover:bg-border text-ink-soft py-1.5 px-3 rounded cursor-pointer border border-border"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onDeletePayment(deletePaymentId);
                    setDeletePaymentId(null);
                  }}
                  className="bg-loss hover:bg-loss/90 text-white py-1.5 px-4 rounded cursor-pointer transition-colors"
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

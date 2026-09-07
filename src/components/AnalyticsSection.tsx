import React from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, BarChart, Bar, Cell
} from 'recharts';
import {
  TrendingUp, Calendar, RefreshCw, FileText, Receipt, ArrowUpRight, ArrowDownRight, Wallet,
  AlertCircle, Building2, CheckCircle2, Clock
} from 'lucide-react';
import { Client, Employee, Payment, SalaryPayout, Expense, CRMFilters, CompanySettings } from '../types';
import { Card, ProgressRing, MiniRing, Badge, StatCard } from './ui/primitives';
import { formatCurrency } from '../utils/currency';

interface AnalyticsSectionProps {
  clients: Client[];
  employees: Employee[];
  payments: Payment[];
  payouts: SalaryPayout[];
  expenses?: Expense[];
  filters: CRMFilters;
  onFilterChange: (newFilters: CRMFilters) => void;
  onResetFilters: () => void;
  greetingName?: string;
  companySettings?: CompanySettings;
}

export default function AnalyticsSection({
  clients,
  employees,
  payments,
  payouts,
  expenses = [],
  filters,
  onFilterChange,
  onResetFilters,
  greetingName,
  companySettings,
}: AnalyticsSectionProps) {
  const currSymbol = companySettings?.currencySymbol || '₹';

  const getClientManagerId = (clientId: string): string =>
    clients.find(c => c.id === clientId)?.assignedEmployeeId || '';

  const filteredPayments = payments.filter(p => {
    if (filters.startDate && p.date < filters.startDate) return false;
    if (filters.endDate && p.date > filters.endDate) return false;
    if (filters.clientId !== 'all' && p.clientId !== filters.clientId) return false;
    if (filters.employeeId !== 'all') {
      const managerId = getClientManagerId(p.clientId);
      if (managerId !== filters.employeeId) return false;
    }
    return true;
  });

  const filteredPayouts = payouts.filter(pay => {
    if (filters.startDate && pay.date < filters.startDate) return false;
    if (filters.endDate && pay.date > filters.endDate) return false;
    if (filters.employeeId !== 'all' && pay.employeeId !== filters.employeeId) return false;
    if (filters.clientId !== 'all') {
      const selectedClient = clients.find(c => c.id === filters.clientId);
      if (selectedClient && selectedClient.assignedEmployeeId !== pay.employeeId) return false;
    }
    return true;
  });

  const filteredExpenses = expenses.filter(e => {
    if (filters.startDate && e.date < filters.startDate) return false;
    if (filters.endDate && e.date > filters.endDate) return false;
    return true;
  });

  const totalCollected = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalPaidToEmployees = filteredPayouts.reduce((sum, pay) => sum + pay.amount, 0);
  const totalOperatingExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const companyBalance = totalCollected - totalPaidToEmployees - totalOperatingExpenses;

  const totalClientsCount = clients.length;
  const convertedClientsCount = clients.filter(c => c.status === 'converted').length;
  const conversionRate = totalClientsCount > 0 ? Math.round((convertedClientsCount / totalClientsCount) * 100) : 0;

  // Helper to calculate pending dues for a client
  const calculateClientPending = (client: Client) => {
    const clientPayments = payments.filter(p => p.clientId === client.id);
    const contractPayments = clientPayments.filter(p => p.type !== 'extra-work');

    if (client.paymentType !== 'monthly') {
      const totalContractPaid = contractPayments.reduce((sum, p) => sum + p.amount, 0);
      const pending = Math.max(0, client.dealValue - totalContractPaid);
      return {
        client,
        totalExpected: client.dealValue,
        totalPaid: totalContractPaid,
        pending,
        isMonthly: false
      };
    } else {
      const currentMonthStr = new Date().toISOString().substring(0, 7);
      const startMonthStr = client.createdDate ? client.createdDate.substring(0, 7) : '2026-01';

      let [currY, currM] = currentMonthStr.split('-').map(Number);
      let [startY, startM] = startMonthStr.split('-').map(Number);

      if (isNaN(startY) || isNaN(startM) || startY > currY || (startY === currY && startM > currM)) {
        startY = currY;
        startM = currM;
      }

      const months: string[] = [];
      let y = currY;
      let m = currM;
      while (y > startY || (y === startY && m >= startM)) {
        months.push(`${y}-${String(m).padStart(2, '0')}`);
        m--;
        if (m < 1) {
          m = 12;
          y--;
        }
      }
      if (months.length === 0) months.push(currentMonthStr);

      let totalExpected = 0;
      let totalPaid = 0;
      let pending = 0;

      months.forEach(month => {
        const monthPayments = contractPayments.filter(p => {
          const pm = p.paidMonth || (p.date ? p.date.substring(0, 7) : '');
          return pm === month;
        });
        const monthPaid = monthPayments.reduce((sum, p) => sum + p.amount, 0);
        const monthExpected = client.dealValue;
        totalExpected += monthExpected;
        totalPaid += monthPaid;
        pending += Math.max(0, monthExpected - monthPaid);
      });

      return {
        client,
        totalExpected,
        totalPaid,
        pending,
        isMonthly: true
      };
    }
  };

  const filteredClientsForDues = clients.filter(c => {
    if (filters.clientId !== 'all' && c.id !== filters.clientId) return false;
    if (filters.employeeId !== 'all' && c.assignedEmployeeId !== filters.employeeId) return false;
    if (c.status !== 'converted') return false; 
    return true;
  });

  const clientDuesList = filteredClientsForDues.map(calculateClientPending);
  const totalPendingDues = clientDuesList.reduce((sum, item) => sum + item.pending, 0);
  const clientsWithPendingDues = clientDuesList.filter(item => item.pending > 0);
  const totalExpectedRevenue = clientDuesList.reduce((sum, item) => sum + item.totalExpected, 0);

  // Hero ring segments — share of gross inflow consumed by payroll / overhead / kept as surplus
  const grossBase = totalCollected > 0 ? totalCollected : 1;
  const payrollShare = Math.min(totalPaidToEmployees / grossBase, 1);
  const overheadShare = Math.min(totalOperatingExpenses / grossBase, 1);
  const surplusShare = Math.max(0, 1 - payrollShare - overheadShare);

  const allMonthsSet = new Set<string>();
  const formatYearMonth = (dateStr: string | any) => {
    const safeStr = typeof dateStr === 'string' ? dateStr : String(dateStr || '');
    const d = new Date(safeStr);
    if (isNaN(d.getTime())) return safeStr ? safeStr.substring(0, 7) : new Date().toISOString().substring(0, 7);
    return d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
  };
  const getSortableMonthKey = (dateStr: string | any) => {
    const safeStr = typeof dateStr === 'string' ? dateStr : String(dateStr || '');
    return safeStr ? safeStr.substring(0, 7) : new Date().toISOString().substring(0, 7);
  };

  payments.forEach(p => allMonthsSet.add(getSortableMonthKey(p.date)));
  payouts.forEach(p => allMonthsSet.add(getSortableMonthKey(p.date)));
  expenses.forEach(e => allMonthsSet.add(getSortableMonthKey(e.date)));

  const sortedMonthKeys = Array.from(allMonthsSet).sort();

  const chartData = sortedMonthKeys.map(monthKey => {
    const monthPaymentsSum = filteredPayments.filter(p => getSortableMonthKey(p.date) === monthKey).reduce((sum, p) => sum + p.amount, 0);
    const monthPayoutsSum = filteredPayouts.filter(p => getSortableMonthKey(p.date) === monthKey).reduce((sum, p) => sum + p.amount, 0);
    const monthExpensesSum = filteredExpenses.filter(e => getSortableMonthKey(e.date) === monthKey).reduce((sum, e) => sum + e.amount, 0);
    const label = formatYearMonth(`${monthKey}-01`);
    return {
      monthKey,
      name: label,
      'Cash In (Revenue)': monthPaymentsSum,
      'Cash Out (Payroll)': monthPayoutsSum,
      'Operating Overhead': monthExpensesSum,
    };
  }).filter(data => {
    if (filters.startDate) {
      const startKey = getSortableMonthKey(filters.startDate);
      if (data.monthKey < startKey) return false;
    }
    if (filters.endDate) {
      const endKey = getSortableMonthKey(filters.endDate);
      if (data.monthKey > endKey) return false;
    }
    return true;
  });

  const clientRevenueData = clients
    .filter(c => c.status === 'converted')
    .map(c => {
      const totalClientRevenues = filteredPayments.filter(p => p.clientId === c.id).reduce((sum, p) => sum + p.amount, 0);
      return { name: c.company, value: totalClientRevenues };
    })
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);

  const unifiedLedger = [
    ...filteredPayments.map(p => ({
      id: p.id, date: p.date, type: 'payment' as const, entity: p.clientName, amount: p.amount, notes: p.notes,
      category: p.type === 'monthly' ? 'Monthly Service' : 'One-time Project'
    })),
    ...filteredPayouts.map(pay => ({
      id: pay.id, date: pay.date, type: 'payout' as const, entity: pay.employeeName, amount: pay.amount, notes: pay.notes,
      category: 'Employee Payroll'
    })),
    ...filteredExpenses.map(exp => ({
      id: exp.id, date: exp.date, type: 'expense' as const, entity: exp.vendor || exp.title, amount: exp.amount,
      notes: `${exp.title} - ${exp.notes || ''}`, category: `Overhead: ${exp.category}`
    }))
  ].sort((a, b) => b.date.localeCompare(a.date));

  // Budget-style ring cards: portfolio, pending dues, payroll, overhead
  const ringCards = [
    {
      title: 'Client Revenue',
      total: totalCollected,
      spentLabel: 'Converted', spentValue: convertedClientsCount,
      remainingLabel: 'Pipeline', remainingValue: totalClientsCount - convertedClientsCount,
      percent: totalClientsCount > 0 ? convertedClientsCount / totalClientsCount : 0,
      color: 'var(--color-brand)',
    },
    {
      title: 'Pending Dues',
      total: totalPendingDues,
      spentLabel: 'Due Accounts', spentValue: clientsWithPendingDues.length,
      remainingLabel: 'Active Accounts', remainingValue: filteredClientsForDues.length,
      percent: totalExpectedRevenue > 0 ? Math.min(totalPendingDues / totalExpectedRevenue, 1) : 0,
      color: 'var(--color-loss)',
    },
    {
      title: 'Payroll Released',
      total: totalPaidToEmployees,
      spentLabel: 'Employees', spentValue: employees.length,
      remainingLabel: 'This period', remainingValue: filteredPayouts.length,
      percent: totalCollected > 0 ? Math.min(totalPaidToEmployees / totalCollected, 1) : 0,
      color: 'var(--color-violet)',
    },
    {
      title: 'Operating Overhead',
      total: totalOperatingExpenses,
      spentLabel: 'Entries', spentValue: filteredExpenses.length,
      remainingLabel: 'Net surplus', remainingValue: companyBalance,
      percent: totalCollected > 0 ? Math.min(totalOperatingExpenses / totalCollected, 1) : 0,
      color: 'var(--color-warn)',
    },
  ];

  return (
    <div className="space-y-6">

      {/* GREETING */}
      <div>
        <h2 className="text-2xl font-display font-bold text-ink">
          Hello{greetingName ? `, ${greetingName}` : ''} 👋
        </h2>
        <p className="text-sm text-ink-soft mt-1">Here's where the books stand today.</p>
      </div>

      {/* HERO: balance ring + budget ring cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Balance ring */}
        <Card className="xl:col-span-1 p-5 flex flex-col items-center justify-center text-center">
          <p className="text-[11px] font-mono uppercase tracking-wider text-ink-faint self-start mb-3">Net Liquidity</p>
          <ProgressRing
            size={160}
            strokeWidth={14}
            segments={[
              { value: surplusShare, color: 'var(--color-gain)' },
              { value: payrollShare, color: 'var(--color-violet)' },
              { value: overheadShare, color: 'var(--color-warn)' },
            ]}
          >
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-ink-faint font-mono uppercase">Balance</span>
              <span className={`text-xl font-display font-bold ${companyBalance >= 0 ? 'text-ink' : 'text-loss'}`}>
                {companyBalance < 0 ? '-' : ''}{currSymbol}{Math.abs(companyBalance).toLocaleString()}
              </span>
            </div>
          </ProgressRing>
          <div className="grid grid-cols-3 gap-2 mt-4 w-full text-left">
            <div>
              <span className="w-2 h-2 rounded-full bg-gain inline-block mb-0.5" />
              <p className="text-[9px] text-ink-faint font-mono uppercase">Surplus</p>
            </div>
            <div>
              <span className="w-2 h-2 rounded-full bg-violet inline-block mb-0.5" />
              <p className="text-[9px] text-ink-faint font-mono uppercase">Payroll</p>
            </div>
            <div>
              <span className="w-2 h-2 rounded-full bg-warn inline-block mb-0.5" />
              <p className="text-[9px] text-ink-faint font-mono uppercase">Overhead</p>
            </div>
          </div>
        </Card>

        {/* Budget-style ring cards */}
        {ringCards.map((card) => (
          <Card key={card.title} hoverable className="p-4 sm:p-5 flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between gap-1 mb-3">
              <h3 className="text-xs sm:text-sm font-display font-bold text-ink truncate min-w-0" title={card.title}>
                {card.title}
              </h3>
              <span className="text-[10px] font-mono text-ink-faint bg-surface-2 border border-border px-1.5 py-0.5 rounded-md whitespace-nowrap shrink-0">
                {new Date().toISOString().substring(0, 7)}
              </span>
            </div>
            <div className="flex items-center gap-3 min-w-0">
              <div className="shrink-0">
                <MiniRing percent={card.percent} color={card.color} />
              </div>
              <div className="space-y-1 text-xs min-w-0 flex-1">
                <p className="text-base sm:text-lg font-mono font-bold text-ink truncate">{currSymbol}{card.total.toLocaleString()}</p>
                <div className="flex items-center gap-1.5 text-ink-soft text-[11px] truncate">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: card.color }} />
                  <span className="truncate">{card.spentLabel}: <strong className="text-ink">{card.spentValue.toLocaleString()}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-ink-faint text-[11px] truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-ink-faint shrink-0" />
                  <span className="truncate">{card.remainingLabel}: <strong className="text-ink-soft">{
                    typeof card.remainingValue === 'number' && card.remainingLabel === 'Net surplus'
                      ? (card.remainingValue < 0 
                          ? `-${currSymbol}${Math.abs(card.remainingValue).toLocaleString()}`
                          : `${currSymbol}${card.remainingValue.toLocaleString()}`)
                      : card.remainingValue.toLocaleString()
                  }</strong></span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* FILTER CONSOLE */}
      <Card className="p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-mono font-bold text-ink text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Calendar size={13} className="text-brand" />
            Filter Console
          </h3>
          {(filters.startDate || filters.endDate || filters.clientId !== 'all' || filters.employeeId !== 'all') && (
            <button
              onClick={onResetFilters}
              className="text-xs text-brand hover:opacity-70 font-medium flex items-center gap-1 transition-opacity cursor-pointer"
            >
              <RefreshCw size={11} />
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-[9px] text-ink-faint uppercase tracking-wider mb-1">Date bounds (Start)</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => onFilterChange({ ...filters, startDate: e.target.value })}
              className="w-full bg-surface-2 border border-border rounded-lg py-1.5 px-3 text-xs text-ink focus:outline-none focus:border-brand transition-colors"
            />
          </div>
          <div>
            <label className="block text-[9px] text-ink-faint uppercase tracking-wider mb-1">Date bounds (End)</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => onFilterChange({ ...filters, endDate: e.target.value })}
              className="w-full bg-surface-2 border border-border rounded-lg py-1.5 px-3 text-xs text-ink focus:outline-none focus:border-brand transition-colors"
            />
          </div>
          <div>
            <label className="block text-[9px] text-ink-faint uppercase tracking-wider mb-1">Filter by Client Account</label>
            <select
              value={filters.clientId}
              onChange={(e) => onFilterChange({ ...filters, clientId: e.target.value })}
              className="w-full bg-surface-2 border border-border rounded-lg py-1.5 px-3 text-xs text-ink focus:outline-none focus:border-brand transition-colors cursor-pointer"
            >
              <option value="all">All Client Portfolios</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.company} ({c.name})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[9px] text-ink-faint uppercase tracking-wider mb-1">Filter by Employee Owner</label>
            <select
              value={filters.employeeId}
              onChange={(e) => onFilterChange({ ...filters, employeeId: e.target.value })}
              className="w-full bg-surface-2 border border-border rounded-lg py-1.5 px-3 text-xs text-ink focus:outline-none focus:border-brand transition-colors cursor-pointer"
            >
              <option value="all">All Employee Owners</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.role})</option>)}
            </select>
          </div>
        </div>
      </Card>

      {/* KPI STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard label="Total Revenues" value={`${currSymbol}${totalCollected.toLocaleString()}`} icon={ArrowUpRight} tone="gain" caption="Client collections" />
        <StatCard
          label="Pending Client Dues"
          value={`${currSymbol}${totalPendingDues.toLocaleString()}`}
          icon={AlertCircle}
          tone="loss"
          caption={`${clientsWithPendingDues.length} clients with balance due`}
        />
        <StatCard label="Employee Payroll" value={`${currSymbol}${totalPaidToEmployees.toLocaleString()}`} icon={ArrowDownRight} tone="violet" caption="Salaries & payouts" />
        <StatCard label="Operating Expenses" value={`${currSymbol}${totalOperatingExpenses.toLocaleString()}`} icon={Receipt} tone="warn" caption="Rent, infra, tools" />
        <StatCard
          label="Client Conversion"
          value={`${conversionRate}%`}
          icon={TrendingUp}
          tone="brand"
          caption={`${convertedClientsCount} active / ${totalClientsCount} accounts`}
        />
      </div>

      {/* PENDING DUES BREAKDOWN SECTION */}
      <Card className="p-5 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border-soft">
          <div>
            <h4 className="font-display font-bold text-ink text-sm flex items-center gap-2">
              <AlertCircle size={16} className="text-loss" />
              Pending Client Dues & Accounts Receivable
            </h4>
            <p className="text-[11px] text-ink-faint mt-0.5">
              Breakdown of unpaid retainer months and installment contract balances owed by clients
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Badge tone="loss">
              {currSymbol}{totalPendingDues.toLocaleString()} Pending
            </Badge>
            <Badge tone="neutral">
              {clientsWithPendingDues.length} {clientsWithPendingDues.length === 1 ? 'Account' : 'Accounts'}
            </Badge>
          </div>
        </div>

        <div className="mt-4">
          {clientsWithPendingDues.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {clientsWithPendingDues.map(({ client, totalExpected, totalPaid, pending, isMonthly }) => {
                const managerName = employees.find(e => e.id === client.assignedEmployeeId)?.name || 'Unassigned';
                const percentPaid = totalExpected > 0 ? Math.round((totalPaid / totalExpected) * 100) : 0;
                return (
                  <div key={client.id} className="p-4 rounded-xl bg-surface-2 border border-border flex flex-col justify-between space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[9px] font-mono uppercase tracking-wider text-ink-faint flex items-center gap-1">
                          <Building2 size={10} />
                          {client.company}
                        </span>
                        <h5 className="font-display font-bold text-ink text-sm mt-0.5">{client.name}</h5>
                      </div>
                      <Badge tone={isMonthly ? 'warn' : 'loss'}>
                        {isMonthly ? 'Monthly Retainer' : 'Fixed Contract'}
                      </Badge>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-ink-faint text-[11px]">Contract Value:</span>
                        <span className="font-mono text-ink font-semibold">{currSymbol}{client.dealValue.toLocaleString()}{isMonthly ? '/mo' : ''}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-ink-faint text-[11px]">Total Billed / Expected:</span>
                        <span className="font-mono text-ink font-semibold">{currSymbol}{totalExpected.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-ink-faint text-[11px]">Collected to Date:</span>
                        <span className="font-mono text-gain font-semibold">{currSymbol}{totalPaid.toLocaleString()} ({percentPaid}%)</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-border-soft">
                        <span className="text-ink font-medium text-[11px]">Pending Balance Due:</span>
                        <span className="font-mono text-loss font-bold text-sm">{currSymbol}{pending.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border-soft flex items-center justify-between text-[10px] text-ink-faint">
                      <span>Manager: <strong className="text-ink-soft">{managerName}</strong></span>
                      <span className="text-loss font-mono font-medium flex items-center gap-1">
                        <Clock size={10} /> Payment Pending
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-ink-faint text-xs flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gain-soft text-gain flex items-center justify-center">
                <CheckCircle2 size={20} />
              </div>
              <p className="font-medium text-ink">All client accounts are fully settled!</p>
              <p className="text-[11px]">There are zero pending dues across all active accounts.</p>
            </div>
          )}
        </div>
      </Card>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4">
            <h4 className="font-display font-bold text-ink text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand" />
              Monthly Cash Flow
            </h4>
            <p className="text-[11px] text-ink-faint mt-0.5">Revenue versus payroll and overhead outflow</p>
          </div>

          <div className="h-72 w-full text-[10px] font-mono">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCashIn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-gain)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--color-gain)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCashOut" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-violet)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--color-violet)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorOverhead" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-warn)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--color-warn)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" stroke="var(--color-ink-faint)" />
                  <YAxis stroke="var(--color-ink-faint)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-surface)',
                      borderColor: 'var(--color-border)',
                      borderRadius: '10px',
                      color: 'var(--color-ink)'
                    }}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Area type="monotone" dataKey="Cash In (Revenue)" stroke="var(--color-gain)" fillOpacity={1} fill="url(#colorCashIn)" strokeWidth={2} />
                  <Area type="monotone" dataKey="Cash Out (Payroll)" stroke="var(--color-violet)" fillOpacity={1} fill="url(#colorCashOut)" strokeWidth={2} />
                  <Area type="monotone" dataKey="Operating Overhead" stroke="var(--color-warn)" fillOpacity={1} fill="url(#colorOverhead)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-ink-faint text-xs">
                No chronological ledger records matching the bounds.
              </div>
            )}
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between">
          <div>
            <h4 className="font-display font-bold text-ink text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand" />
              Client Account Revenue
            </h4>
            <p className="text-[11px] text-ink-faint mt-0.5">Aggregated payments received from accounts</p>
          </div>

          <div className="h-48 w-full my-4 text-[10px] font-mono">
            {clientRevenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clientRevenueData} layout="vertical" margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                  <XAxis type="number" stroke="var(--color-ink-faint)" />
                  <YAxis dataKey="name" type="category" stroke="var(--color-ink-faint)" width={65} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-surface)',
                      borderColor: 'var(--color-border)',
                      borderRadius: '10px',
                      color: 'var(--color-ink)'
                    }}
                  />
                  <Bar dataKey="value" name={`Revenues (${currSymbol})`} barSize={12} radius={[0, 6, 6, 0]}>
                    {clientRevenueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--color-brand)' : 'var(--color-brand-soft)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-ink-faint text-xs text-center">
                No matching client contributions recorded.
              </div>
            )}
          </div>

          <div className="border-t border-border-soft pt-3 space-y-1.5 text-[11px]">
            {clientRevenueData.slice(0, 3).map((item, idx) => (
              <div key={idx} className="flex justify-between text-ink-soft">
                <span className="flex items-center gap-1.5 truncate">
                  <span className={`w-1.5 h-1.5 rounded-full ${idx === 0 ? 'bg-brand' : 'bg-brand-soft'}`} />
                  {item.name}
                </span>
                <span className="font-mono text-ink font-bold">{currSymbol}{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* UNIFIED LEDGER */}
      <Card className="overflow-hidden">
        <div className="p-5 border-b border-border-soft flex justify-between items-center">
          <div>
            <h4 className="font-display font-bold text-ink text-sm flex items-center gap-2">
              <FileText size={15} className="text-brand" />
              Unified Operating Ledger
            </h4>
            <p className="text-[11px] text-ink-faint mt-0.5">Audit log of all registered invoices, collections, and company salaries</p>
          </div>
          <Badge tone="neutral">{unifiedLedger.length} entries</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-2 text-[9px] uppercase font-mono text-ink-faint">
                <th className="py-2.5 px-5">Date</th>
                <th className="py-2.5 px-5">Type</th>
                <th className="py-2.5 px-5">Entity Invoiced / Payee</th>
                <th className="py-2.5 px-5">Description</th>
                <th className="py-2.5 px-5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-soft)] text-xs text-ink-soft">
              {unifiedLedger.map((record) => (
                <tr key={record.id} className="hover:bg-surface-2 transition-colors">
                  <td className="py-2.5 px-5 font-mono text-ink-faint">{record.date}</td>
                  <td className="py-2.5 px-5">
                    <Badge tone={record.type === 'payment' ? 'gain' : record.type === 'expense' ? 'warn' : 'violet'}>
                      {record.type === 'payment' ? 'Client Revenue' : record.type === 'expense' ? 'Overhead Expense' : 'Employee Salary'}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-5 font-bold text-ink">{record.entity}</td>
                  <td className="py-2.5 px-5">
                    <div className="max-w-xs md:max-w-md truncate text-ink-faint" title={record.notes}>
                      <span className="text-ink-faint mr-1.5">[{record.category}]</span>
                      {record.notes}
                    </div>
                  </td>
                  <td className={`py-2.5 px-5 text-right font-mono font-bold ${
                    record.type === 'payment' ? 'text-gain' : record.type === 'expense' ? 'text-warn' : 'text-violet'
                  }`}>
                    {record.type === 'payment' ? '+' : '-'}{currSymbol}{record.amount.toLocaleString()}
                  </td>
                </tr>
              ))}

              {unifiedLedger.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-ink-faint text-xs">
                    No ledger transactions matching current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
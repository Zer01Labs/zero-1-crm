import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Sparkles, Download, CheckCircle2, ShieldAlert, RefreshCw,
  Database, Trash2, Search, Bell, Landmark
} from 'lucide-react';

import { Employee, Client, Payment, SalaryPayout, Expense, CRMFilters, CompanySettings, Tab, Note } from './types';
import {
  initialEmployees,
  initialClients,
  initialPayments,
  initialSalaryPayouts,
  initialExpenses,
  initialNotes
} from './initialData';

import AnalyticsSection from './components/AnalyticsSection';
import ClientSection from './components/ClientSection';
import EmployeeSection from './components/EmployeeSection';
import TransactionsSection from './components/TransactionsSection';
import NotesSection from './components/NotesSection';
import CompanySettingsModal from './components/CompanySettingsModal';
import LoginScreen from './components/LoginScreen';

import { firebaseAPI, sanitizeRecord, auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ThemeProvider } from './context/ThemeContext';
import { Card, ThemeToggle } from './components/ui/primitives';
import MobileTabBar from './components/MobileTabBar';
import Sidebar from './components/Sidebar';

const defaultCompanySettings: CompanySettings = {
  companyName: 'ScarletCRM Operations',
  companyTagline: 'Corporate Operations Portal',
  logoUrl: '',
  address: '100 Corporate Plaza, Suite 500, New York, NY 10001',
  email: 'billing@company.com',
  phone: '+1 (800) 555-0199',
  website: 'www.company.com',
  currencySymbol: '₹',
  cashLabel: 'Cash'
};

function BootScreen({ label }: { label: string }) {
  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col items-center justify-center font-sans p-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-brand flex items-center justify-center text-white shadow-pop animate-pulse">
          <Landmark size={24} />
        </div>
        <div>
          <h2 className="text-lg font-display font-bold tracking-tight text-ink uppercase">
            Scarlet<span className="text-brand">CRM</span>
          </h2>
          <p className="text-[10px] text-ink-faint uppercase tracking-widest font-mono mt-1">{label}</p>
        </div>
        <div className="flex gap-1.5 mt-1 justify-center">
          <span className="w-2 h-2 rounded-full bg-brand animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-brand animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-brand animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

function AppShell() {
  // 1. STATE PERSISTENCE WITH FIRESTORE & LOCAL STORAGE FALLBACK
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [payouts, setPayouts] = useState<SalaryPayout[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const [filters, setFilters] = useState<CRMFilters>({
    startDate: '',
    endDate: '',
    clientId: 'all',
    employeeId: 'all',
  });

  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [isOnboardingCompany, setIsOnboardingCompany] = useState(false);
  const [companySettings, setCompanySettings] = useState<CompanySettings>(defaultCompanySettings);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [globalSearch, setGlobalSearch] = useState('');

  const companyId = currentUser?.uid || 'guest_company';

  const fetchCompanySettings = async () => {
    try {
      const fetchedSettings = await firebaseAPI.getCompanySettings(companyId);
      if (fetchedSettings && fetchedSettings.companyName) {
        setCompanySettings(fetchedSettings);
      } else {
        const savedSettings = localStorage.getItem(`crm_${companyId}_company_settings`);
        if (savedSettings) setCompanySettings(JSON.parse(savedSettings));
      }
    } catch (err) {
      console.error("Error fetching company settings:", err);
    }
  };

  const handleSaveCompanySettings = async (newSettings: CompanySettings) => {
    setCompanySettings(newSettings);
    localStorage.setItem(`crm_${companyId}_company_settings`, JSON.stringify(newSettings));
    await firebaseAPI.saveCompanySettings(newSettings, companyId);
    setIsOnboardingCompany(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) {
      setEmployees([]);
      setClients([]);
      setPayments([]);
      setPayouts([]);
      setExpenses([]);
      setNotes([]);
      setIsLoading(false);
      return;
    }

    const fetchFirestoreData = async () => {
      setIsLoading(true);
      setSyncStatus('syncing');
      try {
        const [fetchedEmployees, fetchedClients, fetchedPayments, fetchedPayouts, fetchedExpenses, fetchedNotes, fetchedCompanySettings] = await Promise.all([
          firebaseAPI.getEmployees(companyId),
          firebaseAPI.getClients(companyId),
          firebaseAPI.getPayments(companyId),
          firebaseAPI.getSalaryPayouts(companyId),
          firebaseAPI.getExpenses(companyId),
          firebaseAPI.getNotes(companyId),
          firebaseAPI.getCompanySettings(companyId)
        ]);

        setEmployees(fetchedEmployees);
        setClients(fetchedClients);
        setPayments(fetchedPayments);
        const cleanPayouts = fetchedPayouts.filter(p => p.id !== 'payout-1' && p.id !== 'payout-2' && p.id !== 'payout-3');
        setPayouts(cleanPayouts);
        setExpenses(fetchedExpenses);
        setNotes(fetchedNotes);
        if (fetchedCompanySettings && fetchedCompanySettings.companyName) {
          setCompanySettings(fetchedCompanySettings);
        } else {
          const savedSettings = localStorage.getItem(`crm_${companyId}_company_settings`);
          if (savedSettings) {
            setCompanySettings(JSON.parse(savedSettings));
          } else {
            const defaultName = currentUser.email ? `${currentUser.email.split('@')[0].toUpperCase()} Corp` : 'ScarletCRM Operations';
            setCompanySettings({
              ...defaultCompanySettings,
              companyName: defaultName,
              email: currentUser.email || defaultCompanySettings.email
            });
          }
        }
        setSyncStatus('success');
      } catch (error) {
        console.error("Firestore loading error, falling back to empty/local storage:", error);
        setSyncStatus('error');
        const savedEmp = localStorage.getItem(`crm_${companyId}_employees`);
        const savedCli = localStorage.getItem(`crm_${companyId}_clients`);
        const savedPay = localStorage.getItem(`crm_${companyId}_payments`);
        const savedPayout = localStorage.getItem(`crm_${companyId}_payouts`);
        const savedExp = localStorage.getItem(`crm_${companyId}_expenses`);
        const savedNotes = localStorage.getItem(`crm_${companyId}_notes`);
        const savedSettings = localStorage.getItem(`crm_${companyId}_company_settings`);
        if (savedEmp) setEmployees(JSON.parse(savedEmp).map(sanitizeRecord));
        if (savedCli) setClients(JSON.parse(savedCli).map(sanitizeRecord));
        if (savedPay) setPayments(JSON.parse(savedPay).map(sanitizeRecord));
        if (savedPayout) setPayouts(JSON.parse(savedPayout).map(sanitizeRecord).filter((p: any) => p.id !== 'payout-1' && p.id !== 'payout-2' && p.id !== 'payout-3'));
        if (savedExp) setExpenses(JSON.parse(savedExp).map(sanitizeRecord));
        if (savedNotes) setNotes(JSON.parse(savedNotes).map(sanitizeRecord));
        if (savedSettings) setCompanySettings(JSON.parse(savedSettings));
      } finally {
        setIsLoading(false);
        setTimeout(() => setSyncStatus('idle'), 3000);
      }
    };

    fetchFirestoreData();
  }, [currentUser, authLoading]);

  useEffect(() => {
    if (!isLoading && currentUser) localStorage.setItem(`crm_${companyId}_employees`, JSON.stringify(employees));
  }, [employees, isLoading, companyId, currentUser]);

  useEffect(() => {
    if (!isLoading && currentUser) localStorage.setItem(`crm_${companyId}_clients`, JSON.stringify(clients));
  }, [clients, isLoading, companyId, currentUser]);

  useEffect(() => {
    if (!isLoading && currentUser) localStorage.setItem(`crm_${companyId}_payments`, JSON.stringify(payments));
  }, [payments, isLoading, companyId, currentUser]);

  useEffect(() => {
    if (!isLoading && currentUser) localStorage.setItem(`crm_${companyId}_payouts`, JSON.stringify(payouts));
  }, [payouts, isLoading, companyId, currentUser]);

  useEffect(() => {
    if (!isLoading && currentUser) localStorage.setItem(`crm_${companyId}_expenses`, JSON.stringify(expenses));
  }, [expenses, isLoading, companyId, currentUser]);

  useEffect(() => {
    if (!isLoading && currentUser) localStorage.setItem(`crm_${companyId}_notes`, JSON.stringify(notes));
  }, [notes, isLoading, companyId, currentUser]);

  const getTodayDateString = () => new Date().toISOString().split('T')[0];

  // 2. STATE TRANSFERS & ACTIONS WITH FIRESTORE SYNCHRONIZATION

  const handleAddClient = async (clientData: Omit<Client, 'id' | 'createdDate'> & { createdDate?: string }) => {
    setSyncStatus('syncing');
    const tempId = `client-${Date.now()}`;
    const newClient: Omit<Client, 'id'> = {
      ...clientData,
      createdDate: clientData.createdDate || getTodayDateString()
    };
    setClients(prev => [{ ...newClient, id: tempId }, ...prev]);
    try {
      const realId = await firebaseAPI.addClient(newClient, companyId);
      setClients(prev => prev.map(c => c.id === tempId ? { ...newClient, id: realId } : c));
      setSyncStatus('success');
    } catch (error) {
      console.error("Firestore addClient error:", error);
      setSyncStatus('error');
    } finally {
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const handleUpdateClient = async (updatedClient: Client) => {
    setSyncStatus('syncing');
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
    try {
      await firebaseAPI.updateClient(updatedClient, companyId);
      setSyncStatus('success');
    } catch (error) {
      console.error("Firestore updateClient error:", error);
      setSyncStatus('error');
    } finally {
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    setSyncStatus('syncing');
    const prevClients = [...clients];
    const prevPayments = [...payments];
    setClients(prev => prev.filter(c => c.id !== clientId));
    setPayments(prev => prev.filter(p => p.clientId !== clientId));
    try {
      await firebaseAPI.deleteClient(clientId, companyId);
      const paymentsToDelete = prevPayments.filter(p => p.clientId === clientId);
      await Promise.all(paymentsToDelete.map(p => firebaseAPI.deletePayment(p.id, companyId)));
      setSyncStatus('success');
    } catch (error) {
      console.error("Firestore deleteClient error:", error);
      setClients(prevClients);
      setPayments(prevPayments);
      setSyncStatus('error');
    } finally {
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const handleAddEmployee = async (employeeData: Omit<Employee, 'id'>) => {
    setSyncStatus('syncing');
    const tempId = `emp-${Date.now()}`;
    const newEmployee: Omit<Employee, 'id'> = { ...employeeData };
    setEmployees(prev => [{ ...newEmployee, id: tempId }, ...prev]);
    try {
      const realId = await firebaseAPI.addEmployee(newEmployee, companyId);
      setEmployees(prev => prev.map(e => e.id === tempId ? { ...newEmployee, id: realId } : e));
      setSyncStatus('success');
    } catch (error) {
      console.error("Firestore addEmployee error:", error);
      setSyncStatus('error');
    } finally {
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    setSyncStatus('syncing');
    const prevEmployees = [...employees];
    const prevClients = [...clients];
    setEmployees(prev => prev.filter(e => e.id !== employeeId));
    setClients(prev => prev.map(c => (c.assignedEmployeeId === employeeId ? { ...c, assignedEmployeeId: '' } : c)));
    try {
      await firebaseAPI.deleteEmployee(employeeId, companyId);
      const clientsToUpdate = prevClients.filter(c => c.assignedEmployeeId === employeeId);
      await Promise.all(clientsToUpdate.map(c => firebaseAPI.updateClient({ ...c, assignedEmployeeId: '' }, companyId)));
      setSyncStatus('success');
    } catch (error) {
      console.error("Firestore deleteEmployee error:", error);
      setEmployees(prevEmployees);
      setClients(prevClients);
      setSyncStatus('error');
    } finally {
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const handlePayEmployee = async (payoutData: Omit<SalaryPayout, 'id' | 'date'> & { date?: string }) => {
    setSyncStatus('syncing');
    const tempId = `payout-${Date.now()}`;
    const newPayout: Omit<SalaryPayout, 'id'> = {
      ...payoutData,
      date: payoutData.date || getTodayDateString()
    };
    setPayouts(prev => [{ ...newPayout, id: tempId }, ...prev]);
    try {
      const realId = await firebaseAPI.addSalaryPayout(newPayout, companyId);
      setPayouts(prev => prev.map(p => p.id === tempId ? { ...newPayout, id: realId } : p));
      setSyncStatus('success');
    } catch (error) {
      console.error("Firestore addSalaryPayout error:", error);
      setSyncStatus('error');
    } finally {
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const handleDeletePayout = async (payoutId: string) => {
    setSyncStatus('syncing');
    const prevPayouts = [...payouts];
    setPayouts(prev => prev.filter(p => p.id !== payoutId));
    try {
      await firebaseAPI.deleteSalaryPayout(payoutId, companyId);
      setSyncStatus('success');
    } catch (error) {
      console.error("Firestore deleteSalaryPayout error:", error);
      setPayouts(prevPayouts);
      setSyncStatus('error');
    } finally {
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const handleLogPayment = async (paymentData: Omit<Payment, 'id' | 'date'> & { date?: string }) => {
    setSyncStatus('syncing');
    const tempId = `pay-${Date.now()}`;
    const newPayment: Omit<Payment, 'id'> = {
      ...paymentData,
      date: paymentData.date || getTodayDateString()
    };
    setPayments(prev => [{ ...newPayment, id: tempId }, ...prev]);
    try {
      const realId = await firebaseAPI.addPayment(newPayment, companyId);
      setPayments(prev => prev.map(p => p.id === tempId ? { ...newPayment, id: realId } : p));
      setSyncStatus('success');
    } catch (error) {
      console.error("Firestore addPayment error:", error);
      setSyncStatus('error');
    } finally {
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    setSyncStatus('syncing');
    const prevPayments = [...payments];
    setPayments(prev => prev.filter(p => p.id !== paymentId));
    try {
      await firebaseAPI.deletePayment(paymentId, companyId);
      setSyncStatus('success');
    } catch (error) {
      console.error("Firestore deletePayment error:", error);
      setPayments(prevPayments);
      setSyncStatus('error');
    } finally {
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const handleLogExpense = async (expenseData: Omit<Expense, 'id'>) => {
    setSyncStatus('syncing');
    const tempId = `exp-${Date.now()}`;
    const newExpense: Omit<Expense, 'id'> = { ...expenseData };
    setExpenses(prev => [{ ...newExpense, id: tempId }, ...prev]);
    try {
      const realId = await firebaseAPI.addExpense(newExpense, companyId);
      setExpenses(prev => prev.map(e => e.id === tempId ? { ...newExpense, id: realId } : e));
      setSyncStatus('success');
    } catch (error) {
      console.error("Firestore addExpense error:", error);
      setSyncStatus('error');
    } finally {
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    setSyncStatus('syncing');
    const prevExpenses = [...expenses];
    setExpenses(prev => prev.filter(e => e.id !== expenseId));
    try {
      await firebaseAPI.deleteExpense(expenseId, companyId);
      setSyncStatus('success');
    } catch (error) {
      console.error("Firestore deleteExpense error:", error);
      setExpenses(prevExpenses);
      setSyncStatus('error');
    } finally {
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const handleAddNote = async (noteData: Omit<Note, 'id'>) => {
    setSyncStatus('syncing');
    const tempId = `note-${Date.now()}`;
    const newNote: Omit<Note, 'id'> = {
      ...noteData,
      createdAt: noteData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setNotes(prev => [{ ...newNote, id: tempId }, ...prev]);
    try {
      const realId = await firebaseAPI.addNote(newNote, companyId);
      setNotes(prev => prev.map(n => n.id === tempId ? { ...newNote, id: realId } : n));
      setSyncStatus('success');
    } catch (error) {
      console.error("Firestore addNote error:", error);
      setSyncStatus('error');
    } finally {
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const handleUpdateNote = async (updatedNote: Note) => {
    setSyncStatus('syncing');
    const noteWithTimestamp: Note = {
      ...updatedNote,
      updatedAt: new Date().toISOString()
    };
    const prevNotes = [...notes];
    setNotes(prev => prev.map(n => n.id === noteWithTimestamp.id ? noteWithTimestamp : n));
    try {
      await firebaseAPI.updateNote(noteWithTimestamp, companyId);
      setSyncStatus('success');
    } catch (error) {
      console.error("Firestore updateNote error:", error);
      setNotes(prevNotes);
      setSyncStatus('error');
    } finally {
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    setSyncStatus('syncing');
    const prevNotes = [...notes];
    setNotes(prev => prev.filter(n => n.id !== noteId));
    try {
      await firebaseAPI.deleteNote(noteId, companyId);
      setSyncStatus('success');
    } catch (error) {
      console.error("Firestore deleteNote error:", error);
      setNotes(prevNotes);
      setSyncStatus('error');
    } finally {
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const handleResetFilters = () => {
    setFilters({ startDate: '', endDate: '', clientId: 'all', employeeId: 'all' });
  };

  const handleClearAllData = async () => {
    setSyncStatus('syncing');
    try {
      await firebaseAPI.clearAllDatabaseData(companyId);
      setEmployees([]);
      setClients([]);
      setPayments([]);
      setPayouts([]);
      setExpenses([]);
      setNotes([]);
      setSyncStatus('success');
    } catch (error) {
      console.error("Firestore clear error:", error);
      setSyncStatus('error');
    } finally {
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const handleSeedDemoData = async () => {
    setSyncStatus('syncing');
    try {
      await firebaseAPI.seedDatabaseData(companyId);
      const [fetchedEmployees, fetchedClients, fetchedPayments, fetchedPayouts, fetchedExpenses, fetchedNotes] = await Promise.all([
        firebaseAPI.getEmployees(companyId),
        firebaseAPI.getClients(companyId),
        firebaseAPI.getPayments(companyId),
        firebaseAPI.getSalaryPayouts(companyId),
        firebaseAPI.getExpenses(companyId),
        firebaseAPI.getNotes(companyId)
      ]);
      setEmployees(fetchedEmployees);
      setClients(fetchedClients);
      setPayments(fetchedPayments);
      setPayouts(fetchedPayouts);
      setExpenses(fetchedExpenses);
      setNotes(fetchedNotes);
      setSyncStatus('success');
    } catch (error) {
      console.error("Firestore seed error:", error);
      setSyncStatus('error');
    } finally {
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const globalTotalInflow = payments.reduce((sum, p) => sum + p.amount, 0);
  const globalTotalPayroll = payouts.reduce((sum, pay) => sum + pay.amount, 0);
  const globalTotalOverhead = expenses.reduce((sum, e) => sum + e.amount, 0);
  const globalSurplus = globalTotalInflow - globalTotalPayroll - globalTotalOverhead;

  if (authLoading) return <BootScreen label="Initializing Secure Portal..." />;
  if (!currentUser) return <LoginScreen onSuccess={() => {}} />;
  if (isLoading) return <BootScreen label="Connecting to Firestore Database..." />;

  const tabTitles: Record<Tab, string> = {
    dashboard: 'Dashboard',
    clients: 'Clients & Leads',
    transactions: 'Transactions Ledger',
    notes: 'Workspace Keep Notes',
    payroll: 'Payroll & Personnel',
  };

  return (
    <div className="min-h-screen bg-canvas text-ink selection:bg-brand selection:text-white flex font-sans">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        companySettings={companySettings}
        notesCount={notes.length}
        onBrandClick={() => setShowCompanyModal(true)}
        onSignOut={async () => {
          try {
            setCurrentUser(null);
            setActiveTab('dashboard');
            await signOut(auth);
          } catch (err) {
            console.error("Sign out error:", err);
          }
        }}
        userLabel={currentUser?.email}
      />

      <div className="flex-1 min-w-0 flex flex-col pb-20 lg:pb-0">
        {/* TOP BAR */}
        <header className="sticky top-0 z-30 bg-canvas/85 backdrop-blur-md border-b border-border-soft">
          <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            <div>
              <h1 className="font-display font-bold text-lg text-ink leading-none">{tabTitles[activeTab]}</h1>
              <p className="text-[11px] text-ink-faint font-mono mt-1 hidden sm:block">2026-07-20</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative hidden sm:block">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input
                  type="text"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  placeholder="Search…"
                  className="w-52 bg-surface border border-border rounded-full py-2 pl-9 pr-4 text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:border-brand transition-colors"
                />
              </div>


              <button
                className="relative p-2.5 rounded-full bg-surface border border-border text-ink-soft hover:text-brand hover:border-brand/40 transition-colors cursor-pointer"
                title="Notifications"
              >
                <Bell size={15} />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-loss" />
              </button>

              <ThemeToggle />
            </div>
          </div>

          {/* sync status strip */}
          <div className="px-4 sm:px-6 lg:px-8 pb-2 -mt-1 flex justify-end">
            {syncStatus === 'syncing' && (
              <span className="text-[10px] text-ink-faint font-mono flex items-center gap-1">
                <RefreshCw size={10} className="animate-spin text-brand" /> SYNCING…
              </span>
            )}
            {syncStatus === 'success' && (
              <span className="text-[10px] text-gain font-mono flex items-center gap-1">
                <CheckCircle2 size={10} /> UPDATED
              </span>
            )}
            {syncStatus === 'error' && (
              <span className="text-[10px] text-loss font-mono flex items-center gap-1">
                <ShieldAlert size={10} /> SYNC ERROR
              </span>
            )}
          </div>
        </header>

        {/* MAIN CANVAS */}
        <main className="flex-grow w-full px-4 sm:px-6 lg:px-8 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'dashboard' && (
                <AnalyticsSection
                  clients={clients}
                  employees={employees}
                  payments={payments}
                  payouts={payouts}
                  expenses={expenses}
                  filters={filters}
                  onFilterChange={setFilters}
                  onResetFilters={handleResetFilters}
                  greetingName={currentUser?.email?.split('@')[0]}
                  companySettings={companySettings}
                />
              )}

              {activeTab === 'clients' && (
                <ClientSection
                  clients={clients}
                  employees={employees}
                  payments={payments}
                  companySettings={companySettings}
                  onAddClient={handleAddClient}
                  onDeleteClient={handleDeleteClient}
                  onLogPayment={handleLogPayment}
                  onUpdateClient={handleUpdateClient}
                />
              )}

              {activeTab === 'transactions' && (
                <TransactionsSection
                  payments={payments}
                  expenses={expenses}
                  payouts={payouts}
                  clients={clients}
                  employees={employees}
                  companySettings={companySettings}
                  onLogPayment={handleLogPayment}
                  onDeletePayment={handleDeletePayment}
                  onAddExpense={handleLogExpense}
                  onDeleteExpense={handleDeleteExpense}
                  onPayEmployee={handlePayEmployee}
                  onDeletePayout={handleDeletePayout}
                />
              )}

              {activeTab === 'notes' && (
                <NotesSection
                  notes={notes}
                  companySettings={companySettings}
                  onAddNote={handleAddNote}
                  onUpdateNote={handleUpdateNote}
                  onDeleteNote={handleDeleteNote}
                />
              )}

              {activeTab === 'payroll' && (
                <EmployeeSection
                  employees={employees}
                  clients={clients}
                  payouts={payouts}
                  companySettings={companySettings}
                  onAddEmployee={handleAddEmployee}
                  onDeleteEmployee={handleDeleteEmployee}
                  onPayEmployee={handlePayEmployee}
                  onDeletePayout={handleDeletePayout}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="hidden lg:flex border-t border-border-soft py-4 px-8 text-[11px] text-ink-faint font-mono justify-between items-center">
          <p>© 2026 ScarletCRM. All rights reserved.</p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-gain animate-pulse" />
            <span className="uppercase text-[10px]">Database Connected</span>
          </div>
        </footer>
      </div>

      <MobileTabBar activeTab={activeTab} onTabChange={setActiveTab} />

      <CompanySettingsModal
        isOpen={showCompanyModal}
        onClose={() => setShowCompanyModal(false)}
        currentSettings={companySettings}
        onSaveSettings={handleSaveCompanySettings}
        isOnboarding={isOnboardingCompany}
      />

      <AnimatePresence>
        {showAdminModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              <Card className="max-w-lg w-full p-6 shadow-pop">
                <div className="flex items-center gap-3 border-b border-border-soft pb-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-loss-soft flex items-center justify-center text-loss">
                    <Database size={17} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-ink">Database Administration</h3>
                    <p className="text-[10px] text-ink-faint uppercase tracking-widest font-mono">Cloud Firestore Operations</p>
                  </div>
                </div>

                <p className="text-sm text-ink-soft mb-6 leading-relaxed">
                  Choose an action below to clear or re-seed your ScarletCRM environment. These actions directly update the persistent cloud database.
                </p>

                <div className="space-y-3 mb-6">
                  <button
                    onClick={async () => { await handleSeedDemoData(); setShowAdminModal(false); }}
                    disabled={syncStatus === 'syncing'}
                    className="w-full text-left p-4 rounded-xl bg-surface-2 hover:bg-gain-soft border border-border hover:border-gain/40 transition-all group flex gap-3 cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gain-soft flex items-center justify-center text-gain shrink-0">
                      <Sparkles size={17} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-ink">Reset & Seed Fresh Demo Data</h4>
                      <p className="text-xs text-ink-faint mt-0.5 leading-relaxed">
                        Wipes existing records and loads pre-linked employees, active clients, payment history, and payroll data.
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={async () => {
                      const confirmClear = window.confirm("Are you absolutely sure you want to completely wipe all collections? This cannot be undone.");
                      if (confirmClear) { await handleClearAllData(); setShowAdminModal(false); }
                    }}
                    disabled={syncStatus === 'syncing'}
                    className="w-full text-left p-4 rounded-xl bg-surface-2 hover:bg-loss-soft border border-border hover:border-loss/40 transition-all group flex gap-3 cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-loss-soft flex items-center justify-center text-loss shrink-0">
                      <Trash2 size={17} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-ink">Clear All Data (Completely Empty)</h4>
                      <p className="text-xs text-ink-faint mt-0.5 leading-relaxed">
                        Removes every single employee, client, invoice, and salary payout. Resets the portal to a clean blank state.
                      </p>
                    </div>
                  </button>
                </div>

                <div className="flex items-center justify-between gap-4 border-t border-border-soft pt-4">
                  <span className="text-[10px] text-ink-faint font-mono uppercase tracking-wider">
                    {syncStatus === 'syncing' ? 'Syncing with Firestore...' : 'Ready'}
                  </span>
                  <button
                    onClick={() => setShowAdminModal(false)}
                    disabled={syncStatus === 'syncing'}
                    className="px-4 py-2 rounded-lg bg-surface-2 hover:bg-surface-hover border border-border text-xs font-semibold text-ink-soft hover:text-ink transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}
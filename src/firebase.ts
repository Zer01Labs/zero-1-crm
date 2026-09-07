import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc 
} from 'firebase/firestore';
import { Employee, Client, Payment, SalaryPayout, Expense, CompanySettings, Note } from './types';
import { initialEmployees, initialClients, initialPayments, initialSalaryPayouts, initialExpenses, initialNotes } from './initialData';

// Web app's Firebase configuration provided by the user
const firebaseConfig = {
  apiKey: "AIzaSyBaRzKagRANYExvfHpZKucT8ALyJOxOYvs",
  authDomain: "zero-one-c8d63.firebaseapp.com",
  projectId: "zero-one-c8d63",
  storageBucket: "zero-one-c8d63.firebasestorage.app",
  messagingSenderId: "270819640031",
  appId: "1:270819640031:web:08cc0ec2dc037c98d45f6a",
  measurementId: "G-BXXYRHSH4C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Helper to safely parse and guarantee a clean YYYY-MM-DD date string
const ensureDateString = (dateVal: any): string => {
  if (dateVal === null || dateVal === undefined) {
    return new Date().toISOString().split('T')[0];
  }

  // If it's a Firestore Timestamp (has toDate function)
  if (typeof dateVal === 'object' && typeof dateVal.toDate === 'function') {
    try {
      const d = dateVal.toDate();
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
    } catch (e) {
      console.error("Error parsing Firestore Timestamp:", e);
    }
  }

  // If it is an object representing a Timestamp with seconds/nanoseconds
  if (typeof dateVal === 'object' && 'seconds' in dateVal && typeof dateVal.seconds === 'number') {
    try {
      const d = new Date(dateVal.seconds * 1000);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
    } catch (e) {}
  }

  // If it's a Date object
  if (dateVal instanceof Date) {
    if (!isNaN(dateVal.getTime())) {
      return dateVal.toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  }

  // If it's already a string
  if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim();
    if (!trimmed) {
      return new Date().toISOString().split('T')[0];
    }
    return trimmed;
  }

  // If it's a number (timestamp)
  if (typeof dateVal === 'number') {
    try {
      const d = new Date(dateVal);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
    } catch (e) {}
  }

  // Fallback to today's date
  return new Date().toISOString().split('T')[0];
};

const ensureNumber = (val: any): number => {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const parsed = parseFloat(val);
  return isNaN(parsed) ? 0 : parsed;
};

// Traverses fields and sanitizes date, number, and string properties
export const sanitizeRecord = (data: any): any => {
  if (!data || typeof data !== 'object') return {};
  
  const result = { ...data };
  
  // 1. Sanitize string keys
  const stringKeys = [
    'name', 'role', 'email', 'phone', 
    'company', 'status', 'paymentType', 'assignedEmployeeId',
    'clientName', 'notes', 'method', 'employeeName',
    'title', 'category', 'vendor', 'paidMonth', 'paymentMethod',
    'workCategory', 'projectScope',
    'collectedByEmployeeId', 'collectedByEmployeeName',
    'paidByEmployeeId', 'paidByEmployeeName',
    'fromType', 'fromId', 'fromName', 'toType', 'toId', 'toName', 'referenceNumber'
  ];
  for (const key of stringKeys) {
    if (result[key] === null || result[key] === undefined) {
      result[key] = '';
    } else {
      result[key] = String(result[key]);
    }
  }

  // Set default status/paymentType if it is a Client
  if (result.company !== undefined) {
    if (!result.status) result.status = 'lead';
    if (!result.paymentType) result.paymentType = 'monthly';
  }

  // Set default category if Expense
  if (result.title !== undefined && !result.category) {
    result.category = 'Other';
  }

  // 2. Sanitize date keys
  const dateKeys = ['date', 'joinedDate', 'createdDate'];
  for (const key of dateKeys) {
    const isEmployee = result.role !== undefined;
    const isClient = result.company !== undefined;
    const isPayment = result.clientName !== undefined;
    const isPayout = result.employeeName !== undefined;
    const isExpense = result.title !== undefined;
    const isTransfer = result.fromType !== undefined || result.toType !== undefined;

    if (
      result[key] !== undefined ||
      (key === 'joinedDate' && isEmployee) ||
      (key === 'createdDate' && isClient) ||
      (key === 'date' && (isPayment || isPayout || isExpense || isTransfer))
    ) {
      result[key] = ensureDateString(result[key]);
    }
  }

  // 3. Sanitize number keys
  const numberKeys = ['salary', 'dealValue', 'amount'];
  for (const key of numberKeys) {
    const isEmployee = result.role !== undefined;
    const isClient = result.company !== undefined;
    const isPayment = result.clientName !== undefined;
    const isPayout = result.employeeName !== undefined;
    const isExpense = result.title !== undefined;
    const isTransfer = result.fromType !== undefined || result.toType !== undefined;

    if (
      result[key] !== undefined ||
      (key === 'salary' && isEmployee) ||
      (key === 'dealValue' && isClient) ||
      (key === 'amount' && (isPayment || isPayout || isExpense || isTransfer))
    ) {
      result[key] = ensureNumber(result[key]);
    }
  }

  return result;
};

// Helper function to recursively remove keys with undefined values for Firestore
export const cleanForFirestore = <T extends Record<string, any>>(obj: T): T => {
  if (!obj || typeof obj !== 'object') return obj;
  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      if (val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
        cleaned[key] = cleanForFirestore(val);
      } else if (Array.isArray(val)) {
        cleaned[key] = val.map(item => (item && typeof item === 'object' ? cleanForFirestore(item) : item));
      } else {
        cleaned[key] = val;
      }
    }
  }
  return cleaned as T;
};

// Helper to convert Firestore snapshots to arrays of objects
const getCollectionData = async <T>(path: string): Promise<T[]> => {
  try {
    const colRef = collection(db, path);
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(doc => {
      const rawData = doc.data();
      const sanitized = sanitizeRecord(rawData);
      return {
        id: doc.id,
        ...sanitized
      };
    }) as unknown as T[];
  } catch (error) {
    console.error(`Error fetching collection ${path}:`, error);
    return [];
  }
};

const getCompanyPath = (companyId: string | undefined, subCollection: string) => {
  const cid = companyId && companyId.trim() ? companyId.trim() : 'global_org';
  return `companies/${cid}/${subCollection}`;
};

// Firestore CRUD operations with Multi-Company Database Isolation
export const firebaseAPI = {
  // Employees
  getEmployees: (companyId?: string) => 
    getCollectionData<Employee>(getCompanyPath(companyId, 'employees')),
  addEmployee: async (employee: Omit<Employee, 'id'>, companyId?: string): Promise<string> => {
    const colRef = collection(db, getCompanyPath(companyId, 'employees'));
    const docRef = await addDoc(colRef, cleanForFirestore(employee));
    return docRef.id;
  },
  updateEmployee: async (employee: Employee, companyId?: string): Promise<void> => {
    const docRef = doc(db, getCompanyPath(companyId, 'employees'), employee.id);
    const { id, ...data } = employee;
    await setDoc(docRef, cleanForFirestore(data), { merge: true });
  },
  deleteEmployee: async (id: string, companyId?: string): Promise<void> => {
    const docRef = doc(db, getCompanyPath(companyId, 'employees'), id);
    await deleteDoc(docRef);
  },

  // Clients
  getClients: (companyId?: string) => 
    getCollectionData<Client>(getCompanyPath(companyId, 'clients')),
  addClient: async (client: Omit<Client, 'id'>, companyId?: string): Promise<string> => {
    const colRef = collection(db, getCompanyPath(companyId, 'clients'));
    const docRef = await addDoc(colRef, cleanForFirestore(client));
    return docRef.id;
  },
  updateClient: async (client: Client, companyId?: string): Promise<void> => {
    const docRef = doc(db, getCompanyPath(companyId, 'clients'), client.id);
    const { id, ...data } = client;
    await setDoc(docRef, cleanForFirestore(data), { merge: true });
  },
  deleteClient: async (id: string, companyId?: string): Promise<void> => {
    const docRef = doc(db, getCompanyPath(companyId, 'clients'), id);
    await deleteDoc(docRef);
  },

  // Payments
  getPayments: (companyId?: string) => 
    getCollectionData<Payment>(getCompanyPath(companyId, 'payments')),
  addPayment: async (payment: Omit<Payment, 'id'>, companyId?: string): Promise<string> => {
    const colRef = collection(db, getCompanyPath(companyId, 'payments'));
    const docRef = await addDoc(colRef, cleanForFirestore(payment));
    return docRef.id;
  },
  deletePayment: async (id: string, companyId?: string): Promise<void> => {
    const docRef = doc(db, getCompanyPath(companyId, 'payments'), id);
    await deleteDoc(docRef);
  },

  // Salary Payouts
  getSalaryPayouts: (companyId?: string) => 
    getCollectionData<SalaryPayout>(getCompanyPath(companyId, 'salaryPayouts')),
  addSalaryPayout: async (payout: Omit<SalaryPayout, 'id'>, companyId?: string): Promise<string> => {
    const colRef = collection(db, getCompanyPath(companyId, 'salaryPayouts'));
    const docRef = await addDoc(colRef, cleanForFirestore(payout));
    return docRef.id;
  },
  deleteSalaryPayout: async (id: string, companyId?: string): Promise<void> => {
    const docRef = doc(db, getCompanyPath(companyId, 'salaryPayouts'), id);
    await deleteDoc(docRef);
  },

  // Operating Expenses
  getExpenses: (companyId?: string) => 
    getCollectionData<Expense>(getCompanyPath(companyId, 'expenses')),
  addExpense: async (expense: Omit<Expense, 'id'>, companyId?: string): Promise<string> => {
    const colRef = collection(db, getCompanyPath(companyId, 'expenses'));
    const docRef = await addDoc(colRef, cleanForFirestore(expense));
    return docRef.id;
  },
  deleteExpense: async (id: string, companyId?: string): Promise<void> => {
    const docRef = doc(db, getCompanyPath(companyId, 'expenses'), id);
    await deleteDoc(docRef);
  },

  // Notes (Google Keep style)
  getNotes: (companyId?: string) =>
    getCollectionData<Note>(getCompanyPath(companyId, 'notes')),
  addNote: async (note: Omit<Note, 'id'>, companyId?: string): Promise<string> => {
    const colRef = collection(db, getCompanyPath(companyId, 'notes'));
    const docRef = await addDoc(colRef, cleanForFirestore(note));
    return docRef.id;
  },
  updateNote: async (note: Note, companyId?: string): Promise<void> => {
    const { id, ...data } = note;
    const docRef = doc(db, getCompanyPath(companyId, 'notes'), id);
    await setDoc(docRef, cleanForFirestore(data), { merge: true });
  },
  deleteNote: async (id: string, companyId?: string): Promise<void> => {
    const docRef = doc(db, getCompanyPath(companyId, 'notes'), id);
    await deleteDoc(docRef);
  },

  // Company Settings & Branding
  getCompanySettings: async (companyId?: string): Promise<CompanySettings | null> => {
    try {
      const docRef = doc(db, getCompanyPath(companyId, 'settings'), 'company');
      const docSnap = await getDocs(collection(db, getCompanyPath(companyId, 'settings')));
      if (!docSnap.empty) {
        return docSnap.docs[0].data() as CompanySettings;
      }
      return null;
    } catch (error) {
      console.error("Error fetching companySettings:", error);
      return null;
    }
  },
  saveCompanySettings: async (settings: CompanySettings, companyId?: string): Promise<void> => {
    try {
      const docRef = doc(db, getCompanyPath(companyId, 'settings'), 'company');
      await setDoc(docRef, cleanForFirestore(settings), { merge: true });
    } catch (error) {
      console.error("Error saving companySettings:", error);
      throw error;
    }
  },

  // Database Administration for specific company
  clearAllDatabaseData: async (companyId?: string): Promise<void> => {
    const colNames = ['employees', 'clients', 'payments', 'salaryPayouts', 'expenses', 'notes'];
    for (const name of colNames) {
      try {
        const colRef = collection(db, getCompanyPath(companyId, name));
        const snapshot = await getDocs(colRef);
        const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
        await Promise.all(deletePromises);
      } catch (error) {
        console.error(`Error clearing collection ${name}:`, error);
      }
    }
  },

  seedDatabaseData: async (companyId?: string): Promise<void> => {
    // 1. Clear first
    const colNames = ['employees', 'clients', 'payments', 'salaryPayouts', 'expenses', 'notes'];
    for (const name of colNames) {
      try {
        const colRef = collection(db, getCompanyPath(companyId, name));
        const snapshot = await getDocs(colRef);
        const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
        await Promise.all(deletePromises);
      } catch (error) {
        console.error(`Error clearing collection ${name} before seeding:`, error);
      }
    }

    // 2. Write with specified IDs to preserve relationships
    try {
      const employeesPromises = initialEmployees.map(e => {
        const { id, ...data } = e;
        return setDoc(doc(db, getCompanyPath(companyId, 'employees'), id), data);
      });
      await Promise.all(employeesPromises);

      const clientsPromises = initialClients.map(c => {
        const { id, ...data } = c;
        return setDoc(doc(db, getCompanyPath(companyId, 'clients'), id), data);
      });
      await Promise.all(clientsPromises);

      const paymentsPromises = initialPayments.map(p => {
        const { id, ...data } = p;
        return setDoc(doc(db, getCompanyPath(companyId, 'payments'), id), data);
      });
      await Promise.all(paymentsPromises);

      const payoutsPromises = initialSalaryPayouts.map(pay => {
        const { id, ...data } = pay;
        return setDoc(doc(db, getCompanyPath(companyId, 'salaryPayouts'), id), data);
      });
      await Promise.all(payoutsPromises);

      const expensesPromises = initialExpenses.map(exp => {
        const { id, ...data } = exp;
        return setDoc(doc(db, getCompanyPath(companyId, 'expenses'), id), data);
      });
      await Promise.all(expensesPromises);

      const notesPromises = initialNotes.map(note => {
        const { id, ...data } = note;
        return setDoc(doc(db, getCompanyPath(companyId, 'notes'), id), data);
      });
      await Promise.all(notesPromises);
    } catch (error) {
      console.error("Error seeding collections:", error);
      throw error;
    }
  },
};

// Types unifiés pour l'application SMT

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Transaction {
  id: string;
  type: 'recette' | 'depense';
  amount: number;
  description: string;
  category: string;
  subcategory?: string;
  accountId: string;
  date: string;
  reference?: string;
  documentId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Immobilisation {
  id: string;
  name: string;
  category: string;
  purchaseAmount: number;
  currentValue: number;
  acquisitionDate?: string;
  purchaseDate?: string; // Pour compatibilité avec mockData
  duration: number;
  amortisationRate: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Stock {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalValue: number;
  unit?: string;
  supplier?: string;
  date?: string; // Pour compatibilité avec mockData
  createdAt?: string;
  updatedAt?: string;
}

export interface CreanceEtDette {
  id: string;
  type: 'creance' | 'dette';
  title: string;
  amount: number;
  thirdParty: string;
  dueDate: string;
  status: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  transactionId?: string;
  uploadDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SMTSettings {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  currency: string;
  defaultAccountType?: string;
  autoGenerateReference?: boolean;
  enableMultiCurrency?: boolean;
  fiscalYearStart?: string;
  backupFrequency?: string;
  emailNotifications?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Types pour les réponses API
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    total: number;
    pages: number;
    current: number;
    limit: number;
  };
}

// Types pour les filtres
export interface TransactionFilters {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  type?: string;
  accountId?: string;
  category?: string;
  page?: number;
  limit?: number;
}

// Types pour l'authentification
export interface LoginResponse {
  user: User;
  token: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

// Types pour les rapports
export interface DashboardStats {
  totalBalance: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  netResult: number;
  recentTransactions: Transaction[];
  monthlyData: Array<{ month: string; recettes: number; depenses: number; }>;
}

export interface CompteResultat {
  recettes: Array<{ category: string; amount: number; }>;
  depenses: Array<{ category: string; amount: number; }>;
  totalRecettes: number;
  totalDepenses: number;
  resultat: number;
}

export interface Bilan {
  actif: Array<{ category: string; amount: number; }>;
  passif: Array<{ category: string; amount: number; }>;
  totalActif: number;
  totalPassif: number;
}
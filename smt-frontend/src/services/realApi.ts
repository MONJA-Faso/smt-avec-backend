import axios, { AxiosResponse } from 'axios';

// Configuration de base pour l'API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Instance Axios configurée
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('smt-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les réponses et erreurs
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(promise => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token!);
    }
  });
  
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Si l'erreur est 401 (non autorisé) et que nous n'avons pas déjà tenté de rafraîchir le token
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Si un rafraîchissement est déjà en cours, mettre la requête en file d'attente
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Tenter de rafraîchir le token
        const { token } = await authApi.refreshToken();
        isRefreshing = false;
        
        // Mettre à jour le header d'autorisation pour la requête originale
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        originalRequest.headers['Authorization'] = `Bearer ${token}`;
        
        // Traiter la file d'attente avec le nouveau token
        processQueue(null, token);
        
        // Réessayer la requête originale avec le nouveau token
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Échec du rafraîchissement, traiter la file d'attente avec l'erreur
        isRefreshing = false;
        processQueue(refreshError, null);
        
        // Nettoyer le localStorage et rediriger vers la page de connexion
        localStorage.removeItem('smt-token');
        localStorage.removeItem('smt-user');
        window.location.href = '/login';
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Types pour l'API
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface Immobilisation {
  id: string;
  name: string;
  category: string;
  purchaseAmount: number;
  currentValue: number;
  acquisitionDate: string;
  duration: number;
  amortisationRate: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Stock {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalValue: number;
  unit: string;
  supplier?: string;
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  transactionId?: string;
  uploadDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface SMTSettings {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  currency: string;
  defaultAccountType: string;
  autoGenerateReference: boolean;
  enableMultiCurrency: boolean;
  fiscalYearStart: string;
  backupFrequency: string;
  emailNotifications: boolean;
  createdAt: string;
  updatedAt: string;
}

// API d'authentification
export const authApi = {
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const response: AxiosResponse<{ success: boolean; data: { user: User; token: string } }> = 
      await apiClient.post('/auth/login', { email, password });
    
    if (response.data.success) {
      const { user, token } = response.data.data;
      localStorage.setItem('smt-token', token);
      localStorage.setItem('smt-user', JSON.stringify(user));
      return { user, token };
    }
    throw new Error('Échec de la connexion');
  },

  async register(userData: { name: string; email: string; password: string; role?: string }): Promise<{ user: User; token: string }> {
    const response: AxiosResponse<{ success: boolean; data: { user: User; token: string } }> = 
      await apiClient.post('/auth/register', userData);
    
    if (response.data.success) {
      const { user, token } = response.data.data;
      localStorage.setItem('smt-token', token);
      localStorage.setItem('smt-user', JSON.stringify(user));
      return { user, token };
    }
    throw new Error('Échec de l\'inscription');
  },

  async getCurrentUser(): Promise<User> {
    const response: AxiosResponse<{ success: boolean; data: { user: User } }> = 
      await apiClient.get('/auth/me');
    
    if (response.data.success) {
      return response.data.data.user;
    }
    throw new Error('Utilisateur non trouvé');
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      localStorage.removeItem('smt-token');
      localStorage.removeItem('smt-user');
    }
  },

  async updateProfile(updates: Partial<User>): Promise<User> {
    const response: AxiosResponse<{ success: boolean; data: { user: User } }> = 
      await apiClient.put('/auth/profile', updates);
    
    if (response.data.success) {
      const user = response.data.data.user;
      localStorage.setItem('smt-user', JSON.stringify(user));
      return user;
    }
    throw new Error('Échec de la mise à jour du profil');
  },
  
  async refreshToken(): Promise<{ token: string; user: User }> {
    const response: AxiosResponse<{ success: boolean; data: { token: string; user: User } }> = 
      await apiClient.post('/auth/refresh-token');
    
    if (response.data.success) {
      const { token, user } = response.data.data;
      // Mettre à jour le token dans le localStorage
      localStorage.setItem('smt-token', token);
      return { token, user };
    }
    throw new Error('Échec du rafraîchissement du token');
  }
};

// API des comptes
export const accountsApi = {
  async getAccounts(): Promise<Account[]> {
    const response: AxiosResponse<{ success: boolean; data: { accounts: Account[] } }> = 
      await apiClient.get('/accounts');
    
    if (response.data.success) {
      return response.data.data.accounts;
    }
    throw new Error('Erreur lors de la récupération des comptes');
  },

  async createAccount(accountData: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<Account> {
    const response: AxiosResponse<{ success: boolean; data: { account: Account } }> = 
      await apiClient.post('/accounts', accountData);
    
    if (response.data.success) {
      return response.data.data.account;
    }
    throw new Error('Erreur lors de la création du compte');
  },

  async updateAccount(id: string, updates: Partial<Account>): Promise<Account> {
    const response: AxiosResponse<{ success: boolean; data: { account: Account } }> = 
      await apiClient.put(`/accounts/${id}`, updates);
    
    if (response.data.success) {
      return response.data.data.account;
    }
    throw new Error('Erreur lors de la mise à jour du compte');
  },

  async deleteAccount(id: string): Promise<void> {
    const response: AxiosResponse<{ success: boolean }> = 
      await apiClient.delete(`/accounts/${id}`);
    
    if (!response.data.success) {
      throw new Error('Erreur lors de la suppression du compte');
    }
  }
};

// API des transactions
export const transactionsApi = {
  async getTransactions(filters?: {
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    type?: string;
    accountId?: string;
    category?: string;
    page?: number;
    limit?: number;
  }): Promise<{ transactions: Transaction[]; pagination: { total: number; pages: number; current: number } }> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const response: AxiosResponse<{ 
      success: boolean; 
      data: { 
        transactions: Transaction[]; 
        pagination: { total: number; pages: number; current: number } 
      } 
    }> = await apiClient.get(`/transactions?${params.toString()}`);
    
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('Erreur lors de la récupération des transactions');
  },

  async createTransaction(transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    const response: AxiosResponse<{ success: boolean; data: { transaction: Transaction } }> = 
      await apiClient.post('/transactions', transactionData);
    
    if (response.data.success) {
      return response.data.data.transaction;
    }
    throw new Error('Erreur lors de la création de la transaction');
  },

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    const response: AxiosResponse<{ success: boolean; data: { transaction: Transaction } }> = 
      await apiClient.put(`/transactions/${id}`, updates);
    
    if (response.data.success) {
      return response.data.data.transaction;
    }
    throw new Error('Erreur lors de la mise à jour de la transaction');
  },

  async deleteTransaction(id: string): Promise<void> {
    const response: AxiosResponse<{ success: boolean }> = 
      await apiClient.delete(`/transactions/${id}`);
    
    if (!response.data.success) {
      throw new Error('Erreur lors de la suppression de la transaction');
    }
  }
};

// API des immobilisations
export const immobilisationsApi = {
  async getImmobilisations(): Promise<Immobilisation[]> {
    const response: AxiosResponse<{ success: boolean; data: { immobilisations: Immobilisation[] } }> = 
      await apiClient.get('/immobilisations');
    
    if (response.data.success) {
      return response.data.data.immobilisations;
    }
    throw new Error('Erreur lors de la récupération des immobilisations');
  },

  async createImmobilisation(immobilisationData: Omit<Immobilisation, 'id' | 'currentValue' | 'amortisationRate' | 'createdAt' | 'updatedAt'>): Promise<Immobilisation> {
    const response: AxiosResponse<{ success: boolean; data: { immobilisation: Immobilisation } }> = 
      await apiClient.post('/immobilisations', immobilisationData);
    
    if (response.data.success) {
      return response.data.data.immobilisation;
    }
    throw new Error('Erreur lors de la création de l\'immobilisation');
  },

  async updateImmobilisation(id: string, updates: Partial<Immobilisation>): Promise<Immobilisation> {
    const response: AxiosResponse<{ success: boolean; data: { immobilisation: Immobilisation } }> = 
      await apiClient.put(`/immobilisations/${id}`, updates);
    
    if (response.data.success) {
      return response.data.data.immobilisation;
    }
    throw new Error('Erreur lors de la mise à jour de l\'immobilisation');
  },

  async deleteImmobilisation(id: string): Promise<void> {
    const response: AxiosResponse<{ success: boolean }> = 
      await apiClient.delete(`/immobilisations/${id}`);
    
    if (!response.data.success) {
      throw new Error('Erreur lors de la suppression de l\'immobilisation');
    }
  }
};

// API des stocks
export const stocksApi = {
  async getStocks(): Promise<Stock[]> {
    const response: AxiosResponse<{ success: boolean; data: { stocks: Stock[] } }> = 
      await apiClient.get('/stocks');
    
    if (response.data.success) {
      return response.data.data.stocks;
    }
    throw new Error('Erreur lors de la récupération des stocks');
  },

  async createStock(stockData: Omit<Stock, 'id' | 'totalValue' | 'createdAt' | 'updatedAt'>): Promise<Stock> {
    const response: AxiosResponse<{ success: boolean; data: { stock: Stock } }> = 
      await apiClient.post('/stocks', stockData);
    
    if (response.data.success) {
      return response.data.data.stock;
    }
    throw new Error('Erreur lors de la création du stock');
  },

  async updateStock(id: string, updates: Partial<Stock>): Promise<Stock> {
    const response: AxiosResponse<{ success: boolean; data: { stock: Stock } }> = 
      await apiClient.put(`/stocks/${id}`, updates);
    
    if (response.data.success) {
      return response.data.data.stock;
    }
    throw new Error('Erreur lors de la mise à jour du stock');
  },

  async deleteStock(id: string): Promise<void> {
    const response: AxiosResponse<{ success: boolean }> = 
      await apiClient.delete(`/stocks/${id}`);
    
    if (!response.data.success) {
      throw new Error('Erreur lors de la suppression du stock');
    }
  }
};

// API des créances et dettes
export const creancesEtDettesApi = {
  async getCreancesEtDettes(): Promise<CreanceEtDette[]> {
    const response: AxiosResponse<{ success: boolean; data: { creancesEtDettes: CreanceEtDette[] } }> = 
      await apiClient.get('/creances-dettes');
    
    if (response.data.success) {
      return response.data.data.creancesEtDettes;
    }
    throw new Error('Erreur lors de la récupération des créances et dettes');
  },

  async createCreanceOuDette(itemData: Omit<CreanceEtDette, 'id' | 'createdAt' | 'updatedAt'>): Promise<CreanceEtDette> {
    const response: AxiosResponse<{ success: boolean; data: { item: CreanceEtDette } }> = 
      await apiClient.post('/creances-dettes', itemData);
    
    if (response.data.success) {
      return response.data.data.item;
    }
    throw new Error('Erreur lors de la création de l\'élément');
  },

  async updateCreanceOuDette(id: string, updates: Partial<CreanceEtDette>): Promise<CreanceEtDette> {
    const response: AxiosResponse<{ success: boolean; data: { item: CreanceEtDette } }> = 
      await apiClient.put(`/creances-dettes/${id}`, updates);
    
    if (response.data.success) {
      return response.data.data.item;
    }
    throw new Error('Erreur lors de la mise à jour de l\'élément');
  },

  async deleteCreanceOuDette(id: string): Promise<void> {
    const response: AxiosResponse<{ success: boolean }> = 
      await apiClient.delete(`/creances-dettes/${id}`);
    
    if (!response.data.success) {
      throw new Error('Erreur lors de la suppression de l\'élément');
    }
  }
};

// API des documents
export const documentsApi = {
  async getDocuments(transactionId?: string): Promise<Document[]> {
    const params = transactionId ? `?transactionId=${transactionId}` : '';
    const response: AxiosResponse<{ success: boolean; data: { documents: Document[] } }> = 
      await apiClient.get(`/documents${params}`);
    
    if (response.data.success) {
      return response.data.data.documents;
    }
    throw new Error('Erreur lors de la récupération des documents');
  },

  async uploadDocument(file: File, transactionId?: string): Promise<Document> {
    const formData = new FormData();
    formData.append('document', file);
    if (transactionId) {
      formData.append('transactionId', transactionId);
    }
    
    const response: AxiosResponse<{ success: boolean; data: { document: Document } }> = 
      await apiClient.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    
    if (response.data.success) {
      return response.data.data.document;
    }
    throw new Error('Erreur lors de l\'upload du document');
  },

  async deleteDocument(id: string): Promise<void> {
    const response: AxiosResponse<{ success: boolean }> = 
      await apiClient.delete(`/documents/${id}`);
    
    if (!response.data.success) {
      throw new Error('Erreur lors de la suppression du document');
    }
  }
};

// API des paramètres
export const settingsApi = {
  async getSettings(): Promise<SMTSettings> {
    const response: AxiosResponse<{ success: boolean; data: { settings: SMTSettings } }> = 
      await apiClient.get('/settings');
    
    if (response.data.success) {
      return response.data.data.settings;
    }
    throw new Error('Erreur lors de la récupération des paramètres');
  },

  async updateSettings(updates: Partial<SMTSettings>): Promise<SMTSettings> {
    const response: AxiosResponse<{ success: boolean; data: { settings: SMTSettings } }> = 
      await apiClient.put('/settings', updates);
    
    if (response.data.success) {
      return response.data.data.settings;
    }
    throw new Error('Erreur lors de la mise à jour des paramètres');
  }
};

// API des rapports et statistiques
export const reportsApi = {
  async getDashboardStats(): Promise<{
    totalBalance: number;
    monthlyRevenue: number;
    monthlyExpenses: number;
    netResult: number;
    recentTransactions: Transaction[];
    monthlyData: Array<{ month: string; recettes: number; depenses: number; }>;
  }> {
    const response: AxiosResponse<{ 
      success: boolean; 
      data: {
        totalBalance: number;
        monthlyRevenue: number;
        monthlyExpenses: number;
        netResult: number;
        recentTransactions: Transaction[];
        monthlyData: Array<{ month: string; recettes: number; depenses: number; }>;
      } 
    }> = await apiClient.get('/reports/dashboard');
    
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('Erreur lors de la récupération des statistiques');
  },

  async getCompteResultat(dateFrom: string, dateTo: string): Promise<{
    recettes: Array<{ category: string; amount: number; }>;
    depenses: Array<{ category: string; amount: number; }>;
    totalRecettes: number;
    totalDepenses: number;
    resultat: number;
  }> {
    const response: AxiosResponse<{ 
      success: boolean; 
      data: {
        recettes: Array<{ category: string; amount: number; }>;
        depenses: Array<{ category: string; amount: number; }>;
        totalRecettes: number;
        totalDepenses: number;
        resultat: number;
      } 
    }> = await apiClient.get(`/reports/compte-resultat?dateFrom=${dateFrom}&dateTo=${dateTo}`);
    
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('Erreur lors de la récupération du compte de résultat');
  },

  async getBilan(): Promise<{
    actif: Array<{ category: string; amount: number; }>;
    passif: Array<{ category: string; amount: number; }>;
    totalActif: number;
    totalPassif: number;
  }> {
    const response: AxiosResponse<{ 
      success: boolean; 
      data: {
        actif: Array<{ category: string; amount: number; }>;
        passif: Array<{ category: string; amount: number; }>;
        totalActif: number;
        totalPassif: number;
      } 
    }> = await apiClient.get('/reports/bilan');
    
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error('Erreur lors de la récupération du bilan');
  }
};

export default apiClient;
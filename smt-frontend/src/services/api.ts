// Services API - redirection vers l'API réelle
// Ce fichier redirige vers la nouvelle API réelle pour assurer la compatibilité
import {
  authApi as realAuthApi,
  accountsApi as realAccountsApi,
  transactionsApi as realTransactionsApi,
  immobilisationsApi as realImmobilisationsApi,
  stocksApi as realStocksApi,
  creancesEtDettesApi as realCreancesEtDettesApi,
  documentsApi as realDocumentsApi,
  settingsApi as realSettingsApi,
  reportsApi as realReportsApi
} from './realApi';

// Import des types unifiés
import {
  User,
  Account,
  Transaction,
  Immobilisation,
  Stock,
  CreanceEtDette,
  Document,
  SMTSettings,
  DashboardStats,
  CompteResultat,
  Bilan
} from '../types';

// API d'authentification - redirection vers l'API réelle
export const authApi = {
  async login(email: string, password: string): Promise<User | null> {
    try {
      const { user } = await realAuthApi.login(email, password);
      return user;
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      return null;
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const user = await realAuthApi.getCurrentUser();
      return user;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      return null;
    }
  },

  async logout(): Promise<void> {
    await realAuthApi.logout();
  }
};

// API des comptes - redirection vers l'API réelle
export const accountsApi = {
  async getAccounts(): Promise<Account[]> {
    return await realAccountsApi.getAccounts();
  },

  async updateAccount(id: string, updates: Partial<Account>): Promise<Account> {
    return await realAccountsApi.updateAccount(id, updates);
  },

  async createAccount(accountData: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<Account> {
    return await realAccountsApi.createAccount(accountData);
  },

  async deleteAccount(id: string): Promise<void> {
    await realAccountsApi.deleteAccount(id);
  }
};

// API des transactions - redirection vers l'API réelle
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
  }): Promise<Transaction[]> {
    const result = await realTransactionsApi.getTransactions(filters);
    return result.transactions;
  },

  async createTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    return await realTransactionsApi.createTransaction(transaction);
  },

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    return await realTransactionsApi.updateTransaction(id, updates);
  },

  async deleteTransaction(id: string): Promise<void> {
    await realTransactionsApi.deleteTransaction(id);
  }
};

// API des immobilisations - redirection vers l'API réelle
export const immobilisationsApi = {
  async getImmobilisations(): Promise<Immobilisation[]> {
    return await realImmobilisationsApi.getImmobilisations();
  },

  async createImmobilisation(immobilisation: Omit<Immobilisation, 'id' | 'currentValue' | 'amortisationRate' | 'createdAt' | 'updatedAt'>): Promise<Immobilisation> {
    return await realImmobilisationsApi.createImmobilisation(immobilisation);
  },

  async updateImmobilisation(id: string, updates: Partial<Immobilisation>): Promise<Immobilisation> {
    return await realImmobilisationsApi.updateImmobilisation(id, updates);
  },

  async deleteImmobilisation(id: string): Promise<void> {
    await realImmobilisationsApi.deleteImmobilisation(id);
  }
};

// API des stocks - redirection vers l'API réelle
export const stocksApi = {
  async getStocks(): Promise<Stock[]> {
    return await realStocksApi.getStocks();
  },

  async createStock(stock: Omit<Stock, 'id' | 'totalValue' | 'createdAt' | 'updatedAt'>): Promise<Stock> {
    return await realStocksApi.createStock(stock);
  },

  async updateStock(id: string, updates: Partial<Stock>): Promise<Stock> {
    return await realStocksApi.updateStock(id, updates);
  },

  async deleteStock(id: string): Promise<void> {
    await realStocksApi.deleteStock(id);
  }
};

// API des créances et dettes - redirection vers l'API réelle
export const creancesEtDettesApi = {
  async getCreancesEtDettes(): Promise<CreanceEtDette[]> {
    return await realCreancesEtDettesApi.getCreancesEtDettes();
  },

  async createCreanceOuDette(item: Omit<CreanceEtDette, 'id' | 'createdAt' | 'updatedAt'>): Promise<CreanceEtDette> {
    return await realCreancesEtDettesApi.createCreanceOuDette(item);
  },

  async updateCreanceOuDette(id: string, updates: Partial<CreanceEtDette>): Promise<CreanceEtDette> {
    return await realCreancesEtDettesApi.updateCreanceOuDette(id, updates);
  },

  async deleteCreanceOuDette(id: string): Promise<void> {
    await realCreancesEtDettesApi.deleteCreanceOuDette(id);
  }
};

// API des documents - redirection vers l'API réelle
export const documentsApi = {
  async getDocuments(transactionId?: string): Promise<Document[]> {
    return await realDocumentsApi.getDocuments(transactionId);
  },

  async uploadDocument(file: File, transactionId?: string): Promise<Document> {
    return await realDocumentsApi.uploadDocument(file, transactionId);
  },

  async deleteDocument(id: string): Promise<void> {
    await realDocumentsApi.deleteDocument(id);
  }
};

// API des paramètres - redirection vers l'API réelle
export const settingsApi = {
  async getSettings(): Promise<SMTSettings> {
    return await realSettingsApi.getSettings();
  },

  async updateSettings(updates: Partial<SMTSettings>): Promise<SMTSettings> {
    return await realSettingsApi.updateSettings(updates);
  }
};

// API des rapports et statistiques - redirection vers l'API réelle
export const reportsApi = {
  async getDashboardStats(): Promise<DashboardStats> {
    return await realReportsApi.getDashboardStats();
  },

  async getCompteResultat(dateFrom: string, dateTo: string): Promise<CompteResultat> {
    return await realReportsApi.getCompteResultat(dateFrom, dateTo);
  },

  async getBilan(): Promise<Bilan> {
    return await realReportsApi.getBilan();
  }
};
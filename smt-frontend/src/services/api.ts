// Services API simulés pour SMT
import { 
  mockUsers, 
  mockAccounts, 
  mockTransactions, 
  mockImmobilisations, 
  mockStocks, 
  mockCreancesEtDettes, 
  mockDocuments, 
  mockSettings,
  User,
  Account,
  Transaction,
  Immobilisation,
  Stock,
  CreanceEtDette,
  Document,
  SMTSettings
} from '../data/mockData';

// Simulation de délai réseau
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// API d'authentification
export const authApi = {
  async login(email: string, password: string): Promise<User | null> {
    await delay(500);
    const user = mockUsers.find(u => u.email === email);
    // Simulation simple: n'importe quel mot de passe fonctionne
    return user || null;
  },

  async getCurrentUser(): Promise<User | null> {
    await delay(200);
    // Simulation: retourne l'admin par défaut
    return mockUsers[0];
  },

  async logout(): Promise<void> {
    await delay(200);
    localStorage.removeItem('smt-user');
  }
};

// API des comptes
export const accountsApi = {
  async getAccounts(): Promise<Account[]> {
    await delay(300);
    return [...mockAccounts];
  },

  async updateAccount(id: string, updates: Partial<Account>): Promise<Account> {
    await delay(400);
    const account = mockAccounts.find(a => a.id === id);
    if (!account) throw new Error('Compte non trouvé');
    Object.assign(account, updates);
    return account;
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
  }): Promise<Transaction[]> {
    await delay(400);
    let transactions = [...mockTransactions];
    
    if (filters) {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        transactions = transactions.filter(t => 
          t.description.toLowerCase().includes(searchLower) ||
          t.category?.toLowerCase().includes(searchLower) ||
          t.subcategory?.toLowerCase().includes(searchLower) ||
          t.reference?.toLowerCase().includes(searchLower)
        );
      }
      if (filters.dateFrom) {
        transactions = transactions.filter(t => t.date >= filters.dateFrom!);
      }
      if (filters.dateTo) {
        transactions = transactions.filter(t => t.date <= filters.dateTo!);
      }
      if (filters.type && filters.type !== 'all') {
        transactions = transactions.filter(t => t.type === filters.type);
      }
      if (filters.accountId && filters.accountId !== 'all') {
        transactions = transactions.filter(t => t.accountId === filters.accountId);
      }
    }
    
    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async createTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
    await delay(500);
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString()
    };
    mockTransactions.push(newTransaction);
    
    // Mise à jour du solde du compte
    const account = mockAccounts.find(a => a.id === transaction.accountId);
    if (account) {
      if (transaction.type === 'recette') {
        account.balance += transaction.amount;
      } else {
        account.balance -= transaction.amount;
      }
    }
    
    return newTransaction;
  },

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    await delay(400);
    const index = mockTransactions.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Transaction non trouvée');
    
    const oldTransaction = mockTransactions[index];
    const updatedTransaction = { ...oldTransaction, ...updates };
    mockTransactions[index] = updatedTransaction;
    
    return updatedTransaction;
  },

  async deleteTransaction(id: string): Promise<void> {
    await delay(300);
    const index = mockTransactions.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Transaction non trouvée');
    
    const transaction = mockTransactions[index];
    
    // Restaurer le solde du compte
    const account = mockAccounts.find(a => a.id === transaction.accountId);
    if (account) {
      if (transaction.type === 'recette') {
        account.balance -= transaction.amount;
      } else {
        account.balance += transaction.amount;
      }
    }
    
    mockTransactions.splice(index, 1);
  }
};

// API des immobilisations
export const immobilisationsApi = {
  async getImmobilisations(): Promise<Immobilisation[]> {
    await delay(300);
    return [...mockImmobilisations];
  },

  async createImmobilisation(immobilisation: Omit<Immobilisation, 'id' | 'currentValue' | 'amortisationRate'>): Promise<Immobilisation> {
    await delay(500);
    const newImmobilisation: Immobilisation = {
      ...immobilisation,
      id: Date.now().toString(),
      currentValue: immobilisation.purchaseAmount,
      amortisationRate: 100 / immobilisation.duration
    };
    mockImmobilisations.push(newImmobilisation);
    return newImmobilisation;
  },

  async updateImmobilisation(id: string, updates: Partial<Immobilisation>): Promise<Immobilisation> {
    await delay(400);
    const index = mockImmobilisations.findIndex(i => i.id === id);
    if (index === -1) throw new Error('Immobilisation non trouvée');
    
    const updated = { ...mockImmobilisations[index], ...updates };
    mockImmobilisations[index] = updated;
    return updated;
  },

  async deleteImmobilisation(id: string): Promise<void> {
    await delay(300);
    const index = mockImmobilisations.findIndex(i => i.id === id);
    if (index === -1) throw new Error('Immobilisation non trouvée');
    mockImmobilisations.splice(index, 1);
  }
};

// API des stocks
export const stocksApi = {
  async getStocks(): Promise<Stock[]> {
    await delay(300);
    return [...mockStocks];
  },

  async createStock(stock: Omit<Stock, 'id' | 'totalValue'>): Promise<Stock> {
    await delay(500);
    const newStock: Stock = {
      ...stock,
      id: Date.now().toString(),
      totalValue: stock.quantity * stock.unitPrice
    };
    mockStocks.push(newStock);
    return newStock;
  },

  async updateStock(id: string, updates: Partial<Stock>): Promise<Stock> {
    await delay(400);
    const index = mockStocks.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Stock non trouvé');
    
    const updated = { ...mockStocks[index], ...updates };
    if (updates.quantity !== undefined || updates.unitPrice !== undefined) {
      updated.totalValue = updated.quantity * updated.unitPrice;
    }
    mockStocks[index] = updated;
    return updated;
  },

  async deleteStock(id: string): Promise<void> {
    await delay(300);
    const index = mockStocks.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Stock non trouvé');
    mockStocks.splice(index, 1);
  }
};

// API des créances et dettes
export const creancesEtDettesApi = {
  async getCreancesEtDettes(): Promise<CreanceEtDette[]> {
    await delay(300);
    return [...mockCreancesEtDettes];
  },

  async createCreanceOuDette(item: Omit<CreanceEtDette, 'id'>): Promise<CreanceEtDette> {
    await delay(500);
    const newItem: CreanceEtDette = {
      ...item,
      id: Date.now().toString()
    };
    mockCreancesEtDettes.push(newItem);
    return newItem;
  },

  async updateCreanceOuDette(id: string, updates: Partial<CreanceEtDette>): Promise<CreanceEtDette> {
    await delay(400);
    const index = mockCreancesEtDettes.findIndex(i => i.id === id);
    if (index === -1) throw new Error('Élément non trouvé');
    
    const updated = { ...mockCreancesEtDettes[index], ...updates };
    mockCreancesEtDettes[index] = updated;
    return updated;
  },

  async deleteCreanceOuDette(id: string): Promise<void> {
    await delay(300);
    const index = mockCreancesEtDettes.findIndex(i => i.id === id);
    if (index === -1) throw new Error('Élément non trouvé');
    mockCreancesEtDettes.splice(index, 1);
  }
};

// API des documents
export const documentsApi = {
  async getDocuments(transactionId?: string): Promise<Document[]> {
    await delay(300);
    let documents = [...mockDocuments];
    if (transactionId) {
      documents = documents.filter(d => d.transactionId === transactionId);
    }
    return documents;
  },

  async uploadDocument(file: File, transactionId?: string): Promise<Document> {
    await delay(1000); // Simulation upload
    const newDocument: Document = {
      id: Date.now().toString(),
      name: file.name,
      type: file.type,
      size: file.size,
      transactionId,
      uploadDate: new Date().toISOString().split('T')[0],
      url: `/documents/${file.name}`
    };
    mockDocuments.push(newDocument);
    return newDocument;
  },

  async deleteDocument(id: string): Promise<void> {
    await delay(300);
    const index = mockDocuments.findIndex(d => d.id === id);
    if (index === -1) throw new Error('Document non trouvé');
    mockDocuments.splice(index, 1);
  }
};

// API des paramètres
export const settingsApi = {
  async getSettings(): Promise<SMTSettings> {
    await delay(200);
    return { ...mockSettings };
  },

  async updateSettings(updates: Partial<SMTSettings>): Promise<SMTSettings> {
    await delay(400);
    Object.assign(mockSettings, updates);
    return { ...mockSettings };
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
    await delay(500);
    
    const totalBalance = mockAccounts.reduce((sum, account) => sum + account.balance, 0);
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const currentMonthTransactions = mockTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
    });
    
    const monthlyRevenue = currentMonthTransactions
      .filter(t => t.type === 'recette')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const monthlyExpenses = currentMonthTransactions
      .filter(t => t.type === 'depense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const netResult = monthlyRevenue - monthlyExpenses;
    
    const recentTransactions = mockTransactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
    
    // Données des 6 derniers mois
    const monthlyData: Array<{ month: string; recettes: number; depenses: number; }> = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthTransactions = mockTransactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === date.getMonth() && 
               transactionDate.getFullYear() === date.getFullYear();
      });
      
      monthlyData.push({
        month: date.toLocaleDateString('fr', { month: 'short' }),
        recettes: monthTransactions.filter(t => t.type === 'recette').reduce((sum, t) => sum + t.amount, 0),
        depenses: monthTransactions.filter(t => t.type === 'depense').reduce((sum, t) => sum + t.amount, 0)
      });
    }
    
    return {
      totalBalance,
      monthlyRevenue,
      monthlyExpenses,
      netResult,
      recentTransactions,
      monthlyData
    };
  },

  async getCompteResultat(dateFrom: string, dateTo: string): Promise<{
    recettes: Array<{ category: string; amount: number; }>;
    depenses: Array<{ category: string; amount: number; }>;
    totalRecettes: number;
    totalDepenses: number;
    resultat: number;
  }> {
    await delay(600);
    
    const transactions = mockTransactions.filter(t => 
      t.date >= dateFrom && t.date <= dateTo
    );
    
    const recettesGrouped = transactions
      .filter(t => t.type === 'recette')
      .reduce((acc, t) => {
        const category = t.category;
        acc[category] = (acc[category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);
    
    const depensesGrouped = transactions
      .filter(t => t.type === 'depense')
      .reduce((acc, t) => {
        const category = t.category;
        acc[category] = (acc[category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);
    
    const recettes = Object.entries(recettesGrouped).map(([category, amount]) => ({ category, amount }));
    const depenses = Object.entries(depensesGrouped).map(([category, amount]) => ({ category, amount }));
    
    const totalRecettes = recettes.reduce((sum, r) => sum + r.amount, 0);
    const totalDepenses = depenses.reduce((sum, d) => sum + d.amount, 0);
    const resultat = totalRecettes - totalDepenses;
    
    return {
      recettes,
      depenses,
      totalRecettes,
      totalDepenses,
      resultat
    };
  },

  async getBilan(): Promise<{
    actif: Array<{ category: string; amount: number; }>;
    passif: Array<{ category: string; amount: number; }>;
    totalActif: number;
    totalPassif: number;
  }> {
    await delay(600);
    
    const totalTresorerie = mockAccounts.reduce((sum, account) => sum + account.balance, 0);
    const totalImmobilisations = mockImmobilisations.reduce((sum, immo) => sum + immo.currentValue, 0);
    const totalStocks = mockStocks.reduce((sum, stock) => sum + stock.totalValue, 0);
    const totalCreances = mockCreancesEtDettes
      .filter(item => item.type === 'creance')
      .reduce((sum, item) => sum + item.amount, 0);
    
    const totalDettes = mockCreancesEtDettes
      .filter(item => item.type === 'dette')
      .reduce((sum, item) => sum + item.amount, 0);
    
    const capitalSocial = mockAccounts.find(a => a.type === 'capital')?.balance || 0;
    
    const actif = [
      { category: 'Immobilisations', amount: totalImmobilisations },
      { category: 'Stocks', amount: totalStocks },
      { category: 'Créances', amount: totalCreances },
      { category: 'Trésorerie', amount: totalTresorerie }
    ];
    
    const passif = [
      { category: 'Capital social', amount: capitalSocial },
      { category: 'Dettes', amount: totalDettes }
    ];
    
    const totalActif = actif.reduce((sum, a) => sum + a.amount, 0);
    const totalPassif = passif.reduce((sum, p) => sum + p.amount, 0);
    
    return {
      actif,
      passif,
      totalActif,
      totalPassif
    };
  }
};
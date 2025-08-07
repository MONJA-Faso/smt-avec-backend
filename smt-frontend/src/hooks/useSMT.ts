// Hooks personnalisés pour l'application SMT
import { useState, useEffect } from 'react';
import { 
  Account, 
  Transaction, 
  Immobilisation, 
  Stock, 
  CreanceEtDette, 
  Document, 
  SMTSettings 
} from '../types'; // Importer depuis types au lieu de mockData
import { 
  accountsApi, 
  transactionsApi, 
  immobilisationsApi, 
  stocksApi, 
  creancesEtDettesApi, 
  documentsApi, 
  settingsApi, 
  reportsApi 
} from '../services/api';

// Hook pour les comptes
export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const data = await accountsApi.getAccounts();
      setAccounts(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des comptes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const updateAccount = async (id: string, updates: Partial<Account>) => {
    try {
      const updatedAccount = await accountsApi.updateAccount(id, updates);
      setAccounts(prev => prev.map(acc => acc.id === id ? updatedAccount : acc));
      return updatedAccount;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour du compte');
      throw err;
    }
  };

  return { accounts: accounts || [], loading, error, fetchAccounts, updateAccount };
}

// Hook pour les transactions
export function useTransactions(filters?: {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  type?: string;
  accountId?: string;
}) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const data = await transactionsApi.getTransactions(filters);
      setTransactions(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  const createTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    try {
      const newTransaction = await transactionsApi.createTransaction(transaction);
      setTransactions(prev => [newTransaction, ...prev]);
      return newTransaction;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création de la transaction');
      throw err;
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    try {
      const updatedTransaction = await transactionsApi.updateTransaction(id, updates);
      setTransactions(prev => prev.map(t => t.id === id ? updatedTransaction : t));
      return updatedTransaction;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour de la transaction');
      throw err;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await transactionsApi.deleteTransaction(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression de la transaction');
      throw err;
    }
  };

  return { 
    transactions, 
    loading, 
    error, 
    fetchTransactions, 
    createTransaction, 
    updateTransaction, 
    deleteTransaction 
  };
}

// Hook pour les immobilisations
export function useImmobilisations() {
  const [immobilisations, setImmobilisations] = useState<Immobilisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchImmobilisations = async () => {
    try {
      setLoading(true);
      const data = await immobilisationsApi.getImmobilisations();
      setImmobilisations(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des immobilisations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImmobilisations();
  }, []);

  const createImmobilisation = async (immobilisation: Omit<Immobilisation, 'id' | 'currentValue' | 'amortisationRate'>) => {
    try {
      const newImmobilisation = await immobilisationsApi.createImmobilisation(immobilisation);
      setImmobilisations(prev => [...prev, newImmobilisation]);
      return newImmobilisation;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création de l\'immobilisation');
      throw err;
    }
  };

  const updateImmobilisation = async (id: string, updates: Partial<Immobilisation>) => {
    try {
      const updatedImmobilisation = await immobilisationsApi.updateImmobilisation(id, updates);
      setImmobilisations(prev => prev.map(i => i.id === id ? updatedImmobilisation : i));
      return updatedImmobilisation;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour de l\'immobilisation');
      throw err;
    }
  };

  const deleteImmobilisation = async (id: string) => {
    try {
      await immobilisationsApi.deleteImmobilisation(id);
      setImmobilisations(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression de l\'immobilisation');
      throw err;
    }
  };

  return { 
    immobilisations, 
    loading, 
    error, 
    fetchImmobilisations, 
    createImmobilisation, 
    updateImmobilisation, 
    deleteImmobilisation 
  };
}

// Hook pour les stocks
export function useStocks() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStocks = async () => {
    try {
      setLoading(true);
      const data = await stocksApi.getStocks();
      setStocks(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des stocks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  const createStock = async (stock: Omit<Stock, 'id' | 'totalValue'>) => {
    try {
      const newStock = await stocksApi.createStock(stock);
      setStocks(prev => [...prev, newStock]);
      return newStock;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du stock');
      throw err;
    }
  };

  const updateStock = async (id: string, updates: Partial<Stock>) => {
    try {
      const updatedStock = await stocksApi.updateStock(id, updates);
      setStocks(prev => prev.map(s => s.id === id ? updatedStock : s));
      return updatedStock;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour du stock');
      throw err;
    }
  };

  const deleteStock = async (id: string) => {
    try {
      await stocksApi.deleteStock(id);
      setStocks(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression du stock');
      throw err;
    }
  };

  return { 
    stocks, 
    loading, 
    error, 
    fetchStocks, 
    createStock, 
    updateStock, 
    deleteStock 
  };
}

// Hook pour les créances et dettes
export function useCreancesEtDettes() {
  const [creancesEtDettes, setCreancesEtDettes] = useState<CreanceEtDette[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCreancesEtDettes = async () => {
    try {
      setLoading(true);
      const data = await creancesEtDettesApi.getCreancesEtDettes();
      setCreancesEtDettes(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des créances et dettes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreancesEtDettes();
  }, []);

  const createCreanceOuDette = async (item: Omit<CreanceEtDette, 'id'>) => {
    try {
      const newItem = await creancesEtDettesApi.createCreanceOuDette(item);
      setCreancesEtDettes(prev => [...prev, newItem]);
      return newItem;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création');
      throw err;
    }
  };

  const updateCreanceOuDette = async (id: string, updates: Partial<CreanceEtDette>) => {
    try {
      const updatedItem = await creancesEtDettesApi.updateCreanceOuDette(id, updates);
      setCreancesEtDettes(prev => prev.map(i => i.id === id ? updatedItem : i));
      return updatedItem;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
      throw err;
    }
  };

  const deleteCreanceOuDette = async (id: string) => {
    try {
      await creancesEtDettesApi.deleteCreanceOuDette(id);
      setCreancesEtDettes(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
      throw err;
    }
  };

  return { 
    creancesEtDettes, 
    loading, 
    error, 
    fetchCreancesEtDettes, 
    createCreanceOuDette, 
    updateCreanceOuDette, 
    deleteCreanceOuDette 
  };
}

// Hook pour les documents
export function useDocuments(transactionId?: string) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const data = await documentsApi.getDocuments(transactionId);
      setDocuments(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [transactionId]);

  const uploadDocument = async (file: File, transactionId?: string) => {
    try {
      const newDocument = await documentsApi.uploadDocument(file, transactionId);
      setDocuments(prev => [...prev, newDocument]);
      return newDocument;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'upload du document');
      throw err;
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      await documentsApi.deleteDocument(id);
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression du document');
      throw err;
    }
  };

  return { 
    documents, 
    loading, 
    error, 
    fetchDocuments, 
    uploadDocument, 
    deleteDocument 
  };
}

// Hook pour les paramètres
export function useSettings() {
  const [settings, setSettings] = useState<SMTSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsApi.getSettings();
      setSettings(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSettings = async (updates: Partial<SMTSettings>) => {
    try {
      const updatedSettings = await settingsApi.updateSettings(updates);
      setSettings(updatedSettings);
      return updatedSettings;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour des paramètres');
      throw err;
    }
  };

  return { 
    settings, 
    loading, 
    error, 
    fetchSettings, 
    updateSettings 
  };
}

// Hook pour les statistiques du tableau de bord
export function useDashboardStats() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await reportsApi.getDashboardStats();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return { stats, loading, error, fetchStats };
}

// Hook pour les rapports
export function useReports() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCompteResultat = async (dateFrom: string, dateTo: string) => {
    try {
      setLoading(true);
      const data = await reportsApi.getCompteResultat(dateFrom, dateTo);
      setError(null);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement du compte de résultat');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getBilan = async () => {
    try {
      setLoading(true);
      const data = await reportsApi.getBilan();
      setError(null);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement du bilan');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, getCompteResultat, getBilan };
}
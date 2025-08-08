import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Plus, 
  Search, 
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  Edit,
  Trash2,
  FileText,
  Table as TableIcon
} from 'lucide-react';
import { useTransactions, useAccounts } from '@/hooks/useSMT';
import { Transaction, transactionCategories } from '@/data/mockData';
import { exportTransactionsToCSV, exportToPDF } from '@/utils/exportUtils';

// Formatage des montants
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' MGA';
}

// Composant pour le formulaire de transaction
function TransactionForm({ 
  onSubmit, 
  onCancel, 
  transaction 
}: { 
  onSubmit: (data: any) => void;
  onCancel: () => void;
  transaction?: Transaction;
}) {
  const [formData, setFormData] = useState({
    type: transaction?.type || 'recette',
    amount: transaction?.amount?.toString() || '',
    description: transaction?.description || '',
    accountId: transaction?.accountId || '',
    category: transaction?.category || '',
    subcategory: transaction?.subcategory || '',
    date: transaction?.date || new Date().toISOString().split('T')[0],
    reference: transaction?.reference || ''
  });

  const { accounts = [] } = useAccounts();

  const categories = formData.type === 'recette' 
    ? transactionCategories.recettes 
    : transactionCategories.depenses;

  const selectedCategory = categories.find(cat => cat.value === formData.category);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Type de transaction</Label>
          <Select 
            value={formData.type} 
            onValueChange={(value) => setFormData({
              ...formData, 
              type: value as 'recette' | 'depense',
              category: '',
              subcategory: ''
            })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem key="recette" value="recette">Recette</SelectItem>
                <SelectItem key="depense" value="depense">Dépense</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Montant (MGA)</Label>
          <Input
            id="amount"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: e.target.value})}
            placeholder="0"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="accountId">Compte</Label>
          <Select 
            value={formData.accountId} 
            onValueChange={(value) => setFormData({...formData, accountId: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un compte" />
            </SelectTrigger>
            <SelectContent>

  <SelectItem key="all" value="all">Tous</SelectItem>
  {accounts.map((account) => (
    <SelectItem key={account.id} value={account.id}>
      {account.name}
    </SelectItem>
  ))}
</SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Catégorie</Label>
          <Select 
            value={formData.category} 
            onValueChange={(value) => setFormData({
              ...formData, 
              category: value,
              subcategory: ''
            })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une catégorie" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedCategory && (
          <div className="space-y-2">
            <Label htmlFor="subcategory">Sous-catégorie</Label>
            <Select 
              value={formData.subcategory} 
              onValueChange={(value) => setFormData({...formData, subcategory: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une sous-catégorie" />
              </SelectTrigger>
              <SelectContent>
                {selectedCategory.subcategories.map((sub) => (
                  <SelectItem key={sub} value={sub}>
                    {sub}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Description de la transaction"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reference">Référence</Label>
          <Input
            id="reference"
            value={formData.reference}
            onChange={(e) => setFormData({...formData, reference: e.target.value})}
            placeholder="REF-2024-001"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">
          {transaction ? 'Modifier' : 'Créer'} la transaction
        </Button>
      </div>
    </form>
  );
}

export function Transactions() {
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    accountId: 'all',
    dateFrom: '',
    dateTo: ''
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const { transactions, loading, error, createTransaction, updateTransaction, deleteTransaction } = useTransactions(filters);
  const { accounts } = useAccounts();

  const handleCreateTransaction = async (data: any) => {
    try {
      await createTransaction(data);
      setDialogOpen(false);
    } catch (err) {
      console.error('Erreur lors de la création:', err);
    }
  };

  const handleUpdateTransaction = async (data: any) => {
    if (!editingTransaction) return;
    try {
      await updateTransaction(editingTransaction.id, data);
      setEditingTransaction(null);
      setDialogOpen(false);
    } catch (err) {
      console.error('Erreur lors de la modification:', err);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette transaction ?')) {
      try {
        await deleteTransaction(id);
      } catch (err) {
        console.error('Erreur lors de la suppression:', err);
      }
    }
  };

  const handleExportCSV = () => {
    exportTransactionsToCSV(transactions, `transactions-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportPDF = async () => {
    try {
      await exportToPDF('transactions-table', {
        filename: `transactions-${new Date().toISOString().split('T')[0]}.pdf`,
        orientation: 'landscape'
      });
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      alert('Erreur lors de l\'export PDF');
    }
  };

  const openEditDialog = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingTransaction(null);
  };

  // Calculs des totaux
  const totalRecettes = transactions
    ? transactions.filter(t => t.type === 'recette').reduce((sum, t) => sum + t.amount, 0)
    : 0;
  
  const totalDepenses = transactions
    ? transactions.filter(t => t.type === 'depense').reduce((sum, t) => sum + t.amount, 0)
    : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
          <p className="mt-2 text-gray-600">
            Gestion des recettes et dépenses
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleExportCSV}>
                <TableIcon className="h-4 w-4 mr-2" />
                Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF}>
                <FileText className="h-4 w-4 mr-2" />
                Export PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingTransaction(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingTransaction ? 'Modifier' : 'Créer'} une transaction
                </DialogTitle>
              </DialogHeader>
              <TransactionForm
                transaction={editingTransaction || undefined}
                onSubmit={editingTransaction ? handleUpdateTransaction : handleCreateTransaction}
                onCancel={closeDialog}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Recettes
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalRecettes)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Dépenses
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalDepenses)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Solde Net
            </CardTitle>
            <TrendingUp className={`h-4 w-4 ${
              totalRecettes - totalDepenses >= 0 ? 'text-green-600' : 'text-red-600'
            }`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              totalRecettes - totalDepenses >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(totalRecettes - totalDepenses)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="pl-10"
              />
            </div>
            
            <Select 
              value={filters.type} 
              onValueChange={(value) => setFilters({...filters, type: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                    <SelectItem key="all" value="all">Tous</SelectItem>
                    <SelectItem key="recette" value="recette">Recettes</SelectItem>
                    <SelectItem key="depense" value="depense">Dépenses</SelectItem>
                  </SelectContent>

            </Select>

            <Select 
              value={filters.accountId} 
              onValueChange={(value) => setFilters({...filters, accountId: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Compte" />
              </SelectTrigger>
              <SelectContent>

                  <SelectItem key="all" value="all">Tous</SelectItem>
                  {accounts && accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="Date début"
              value={filters.dateFrom}
              onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
            />

            <Input
              type="date"
              placeholder="Date fin"
              value={filters.dateTo}
              onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
            />
          </div>
        </CardContent>
      </Card>

      {/* Liste des transactions */}
      <Card id="transactions-table">
        <CardHeader>
          <CardTitle>
            Liste des transactions ({transactions ? transactions.length : 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-red-600 text-center py-4">
              Erreur: {error}
            </div>
          )}
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Compte</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Référence</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions && transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {new Date(transaction.date).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={transaction.type === 'recette' ? 'default' : 'destructive'}>
                        {transaction.type === 'recette' ? 'Recette' : 'Dépense'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {transaction.description}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{transaction.category}</div>
                        {transaction.subcategory && (
                          <div className="text-gray-500">{transaction.subcategory}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {accounts.find(a => a.id === transaction.accountId)?.name || transaction.accountId}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-medium ${
                      transaction.type === 'recette' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'recette' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {transaction.reference || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(transaction)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTransaction(transaction.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {Array.isArray(transactions) && transactions.length === 0 && !loading && (
  <div className="text-center py-8 text-gray-500">
    Aucune transaction trouvée
  </div>
)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
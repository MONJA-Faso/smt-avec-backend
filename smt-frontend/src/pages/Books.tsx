import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Download, Filter, Search, BookOpen, TrendingUp, TrendingDown, FileText, Table as TableIcon } from 'lucide-react';
import { useTransactions } from '@/hooks/useSMT';
import { exportBooksToCSV, exportToPDF } from '@/utils/exportUtils';

// Formatage des montants
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' MGA';
}

export function Books() {
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    type: 'all'
  });

  const { transactions, loading, error } = useTransactions(filters);

  const handleExportCSV = () => {
    exportBooksToCSV(transactions, `livre-recettes-depenses-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportPDF = async () => {
    try {
      await exportToPDF('books-table', {
        filename: `livre-recettes-depenses-${new Date().toISOString().split('T')[0]}.pdf`,
        orientation: 'landscape'
      });
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      alert('Erreur lors de l\'export PDF');
    }
  };

  // Calculs pour le livre recettes-dépenses
  const safeTransactions = transactions ?? [];

  const recettes = safeTransactions.filter(t => t.type === 'recette');
  const depenses = safeTransactions.filter(t => t.type === 'depense');
  const totalRecettes = recettes.reduce((sum, t) => sum + t.amount, 0);
  const totalDepenses = depenses.reduce((sum, t) => sum + t.amount, 0);
  const solde = totalRecettes - totalDepenses;


  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="h-96 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Livres comptables</h1>
          <p className="mt-2 text-gray-600">
            Livre des recettes et dépenses selon les normes OHADA
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Exporter le livre
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
        </div>
      </div>

      {/* Résumé */}
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
            <p className="text-xs text-gray-500 mt-1">
              {recettes.length} transactions
            </p>
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
            <p className="text-xs text-gray-500 mt-1">
              {depenses.length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Solde
            </CardTitle>
            <BookOpen className={`h-4 w-4 ${solde >= 0 ? 'text-green-600' : 'text-red-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${solde >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(solde)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Résultat apparent
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtres de période
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Date début</label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Date fin</label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Type</label>
              <Select value={filters.type} onValueChange={(value) => setFilters({...filters, type: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="all" value="all">Tous</SelectItem>
                  <SelectItem key="recette" value="recette">Recettes uniquement</SelectItem>
                  <SelectItem key="depense" value="depense">Dépenses uniquement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => setFilters({dateFrom: '', dateTo: '', type: 'all'})}
              >
                Réinitialiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Livre recettes-dépenses */}
      <Card id="books-table">
        <CardHeader>
          <CardTitle>Livre des recettes et dépenses</CardTitle>
          <p className="text-sm text-gray-600">
            Enregistrement chronologique des opérations (Art. 17 Acte uniforme OHADA)
          </p>
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
                  <TableHead>N° Pièce</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Compte</TableHead>
                  <TableHead className="text-right">Recettes</TableHead>
                  <TableHead className="text-right">Dépenses</TableHead>
                  <TableHead className="text-right">Solde</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(transactions?.length ?? 0) === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      Aucune transaction trouvée pour la période sélectionnée
                    </TableCell>
                  </TableRow>
                ) : (
                  (() => {
                    let cumulSolde = 0;
                    return transactions.map((transaction) => {
                      if (transaction.type === 'recette') {
                        cumulSolde += transaction.amount;
                      } else {
                        cumulSolde -= transaction.amount;
                      }

                      return (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            {new Date(transaction.date).toLocaleDateString('fr-FR')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {transaction.reference || '-'}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="truncate">{transaction.description}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">{transaction.category}</div>
                              {transaction.subcategory && (
                                <div className="text-gray-500 text-xs">{transaction.subcategory}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {transaction.accountId}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {transaction.type === 'recette' ? (
                              <span className="font-medium text-green-600">
                                {formatCurrency(transaction.amount)}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {transaction.type === 'depense' ? (
                              <span className="font-medium text-red-600">
                                {formatCurrency(transaction.amount)}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className={`text-right font-medium ${
                            cumulSolde >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(cumulSolde)}
                          </TableCell>
                        </TableRow>
                      );
                    });
                  })()
                )}
              </TableBody>
            </Table>
          </div>

          {/* Totaux */}
          {(transactions?.length ?? 0) > 0 && (
            <div className="mt-6 border-t pt-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <p className="text-gray-600">Total Recettes</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(totalRecettes)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600">Total Dépenses</p>
                  <p className="text-lg font-bold text-red-600">
                    {formatCurrency(totalDepenses)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600">Solde Final</p>
                  <p className={`text-lg font-bold ${solde >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(solde)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information OHADA */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Conformité OHADA</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Obligations du livre :</h4>
              <ul className="text-sm space-y-1">
                <li>• Enregistrement chronologique</li>
                <li>• Numérotation des pièces</li>
                <li>• Conservation 10 ans minimum</li>
                <li>• Écriture sans blanc ni rature</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Pièces justificatives :</h4>
              <ul className="text-sm space-y-1">
                <li>• Factures de vente</li>
                <li>• Reçus d'achat</li>
                <li>• Bordereaux de remise</li>
                <li>• Pièces de caisse</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
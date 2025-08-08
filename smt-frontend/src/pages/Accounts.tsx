import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  CreditCard, 
  Banknote,
  Building2,
  CircleDollarSign,
  ArrowUpDown
} from 'lucide-react';
import { useAccounts } from '@/hooks/useSMT';

// Formatage des montants
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' MGA';
}

// Icônes par type de compte
const accountIcons = {
  caisse: Banknote,
  banque: Building2,
  ccp: CreditCard,
  capital: CircleDollarSign
};

// Couleurs par type de compte
const accountColors = {
  caisse: 'bg-green-50 text-green-600 border-green-200',
  banque: 'bg-blue-50 text-blue-600 border-blue-200',
  ccp: 'bg-purple-50 text-purple-600 border-purple-200',
  capital: 'bg-yellow-50 text-yellow-600 border-yellow-200'
};

// Formulaire de virement
function TransferForm({ 
  accounts, 
  onSubmit, 
  onCancel 
}: { 
  accounts: any[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    fromAccountId: 'none',
    toAccountId: 'none',
    amount: '',
    description: ''
  });

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
          <Label htmlFor="fromAccount">Compte débiteur</Label>
          <select
            id="fromAccount"
            value={formData.fromAccountId}
            onChange={(e) => setFormData({...formData, fromAccountId: e.target.value})}
            className="w-full p-2 border rounded-md"
            required
          >
            <option value="none">Sélectionner le compte source</option>
            {accounts && accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} ({formatCurrency(account.balance)})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="toAccount">Compte créditeur</Label>
          <select
            id="toAccount"
            value={formData.toAccountId}
            onChange={(e) => setFormData({...formData, toAccountId: e.target.value})}
            className="w-full p-2 border rounded-md"
            required
          >
            <option value="none">Sélectionner le compte destination</option>
            {accounts && accounts
              .filter(account => account.id !== formData.fromAccountId)
              .map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({formatCurrency(account.balance)})
                </option>
              ))}
          </select>
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
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Motif du virement"
            required
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">
          Effectuer le virement
        </Button>
      </div>
    </form>
  );
}

export function Accounts() {
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const { accounts, loading, error, transferBetweenAccounts } = useAccounts();

  const handleTransfer = async (data: any) => {
    try {
      const result = await transferBetweenAccounts({
        fromAccountId: data.fromAccountId,
        toAccountId: data.toAccountId,
        amount: data.amount,
        description: data.description
      });
      
      alert(`Virement réussi !\nMontant: ${formatCurrency(result.amount)}\nRéférence: ${result.reference}`);
      setTransferDialogOpen(false);
    } catch (err) {
      console.error('Erreur lors du virement:', err);
      alert('Erreur lors du virement. Veuillez réessayer.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-red-600">Erreur lors du chargement des comptes: {error}</p>
        </div>
      </div>
    );
  }

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Comptes de trésorerie</h1>
          <p className="mt-2 text-gray-600">
            Gestion des comptes et virements internes
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Nouveau virement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Virement entre comptes</DialogTitle>
              </DialogHeader>
              <TransferForm
                accounts={accounts}
                onSubmit={handleTransfer}
                onCancel={() => setTransferDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Solde total */}
      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <p className="text-sm font-medium text-gray-600">Solde total de trésorerie</p>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalBalance)}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-full">
            <CreditCard className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      {/* Cartes des comptes */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {accounts && accounts.map((account) => {
          const Icon = accountIcons[account.type as keyof typeof accountIcons];
          const colorClass = accountColors[account.type as keyof typeof accountColors];
          
          return (
            <Card key={account.id} className={`border-2 ${colorClass}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {account.name}
                </CardTitle>
                <Icon className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">
                  {formatCurrency(account.balance)}
                </div>
                <Badge variant="outline" className="text-xs">
                  {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tableau détaillé */}
      <Card>
        <CardHeader>
          <CardTitle>Détail des comptes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Compte</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Solde</TableHead>
                <TableHead>Devise</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts && accounts.map((account) => {
                const Icon = accountIcons[account.type as keyof typeof accountIcons];
                
                return (
                  <TableRow key={account.id}>
                    <TableCell className="flex items-center space-x-3">
                      <Icon className="h-5 w-5 text-gray-500" />
                      <span className="font-medium">{account.name}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(account.balance)}
                    </TableCell>
                    <TableCell>{account.currency}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={account.balance >= 0 ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {account.balance >= 0 ? 'Créditeur' : 'Débiteur'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Informations OHADA */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Information OHADA</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Comptes obligatoires SMT :</h4>
              <ul className="text-sm space-y-1">
                <li>• Caisse (espèces)</li>
                <li>• Banque (comptes bancaires)</li>
                <li>• CCP (compte postal)</li>
                <li>• Capital (apports initiaux)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Contrôles à effectuer :</h4>
              <ul className="text-sm space-y-1">
                <li>• Rapprochement bancaire mensuel</li>
                <li>• Vérification de caisse</li>
                <li>• Suivi des virements internes</li>
                <li>• Justification des écarts</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
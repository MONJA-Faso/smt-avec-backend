import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users, 
  Plus, 
  UserCheck, 
  UserX, 
  AlertTriangle,
  Download,
  FileText,
  Calculator,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportToPDF } from '@/utils/exportUtils';
import { useCreancesEtDettes } from '@/hooks/useSMT';
import { CreanceEtDette } from '@/types';

// Formatage des montants
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' MGA';
}

export function DebtsCredits() {
  const { creancesEtDettes, loading, error, createCreanceOuDette } = useCreancesEtDettes();
  const [selectedExercice, setSelectedExercice] = useState('2024');
  const [filteredCreances, setFilteredCreances] = useState<CreanceEtDette[]>([]);
  const [filteredDettes, setFilteredDettes] = useState<CreanceEtDette[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [newCreance, setNewCreance] = useState({
    name: '',
    thirdParty: '',
    amount: '',
    dueDate: '',
    description: ''
  });
  const [newDette, setNewDette] = useState({
    name: '',
    thirdParty: '',
    amount: '',
    dueDate: '',
    description: ''
  });
  const [isCreanceDialogOpen, setIsCreanceDialogOpen] = useState(false);
  const [isDetteDialogOpen, setIsDetteDialogOpen] = useState(false);

  // Filtrage
  useEffect(() => {
    let filteredC = (creancesEtDettes || []).filter(c => c.type === 'creance');
    let filteredD = (creancesEtDettes || []).filter(d => d.type === 'dette');
    
    if (statusFilter !== 'all') {
      filteredC = filteredC.filter(c => c.status === statusFilter);
      filteredD = filteredD.filter(d => d.status === statusFilter);
    }
    
    setFilteredCreances(filteredC);
    setFilteredDettes(filteredD);
  }, [creancesEtDettes, selectedExercice, statusFilter]);

  // Ajout d'une nouvelle créance
  const handleAddCreance = async () => {
    try {
      const amount = parseFloat(newCreance.amount);
      
      const creanceData = {
        type: 'creance' as const,
        name: newCreance.name,
        amount: amount,
        thirdParty: newCreance.thirdParty,
        dueDate: newCreance.dueDate,
        status: new Date(newCreance.dueDate) < new Date() ? 'echu' : 'en_cours',
        description: newCreance.description
      };

      await createCreanceOuDette(creanceData);
      
      setNewCreance({
        name: '',
        thirdParty: '',
        amount: '',
        dueDate: '',
        description: ''
      });
      setIsCreanceDialogOpen(false);
    } catch (err) {
      console.error('Erreur lors de la création de la créance:', err);
      alert('Erreur lors de la création de la créance');
    }
  };

  // Ajout d'une nouvelle dette
  const handleAddDette = async () => {
    try {
      const amount = parseFloat(newDette.amount);
      
      const detteData = {
        type: 'dette' as const,
        name: newDette.name,
        amount: amount,
        thirdParty: newDette.thirdParty,
        dueDate: newDette.dueDate,
        status: new Date(newDette.dueDate) < new Date() ? 'echu' : 'en_cours',
        description: newDette.description
      };

      await createCreanceOuDette(detteData);
      
      setNewDette({
        name: '',
        thirdParty: '',
        amount: '',
        dueDate: '',
        description: ''
      });
      setIsDetteDialogOpen(false);
    } catch (err) {
      console.error('Erreur lors de la création de la dette:', err);
      alert('Erreur lors de la création de la dette');
    }
  };

  // Export PDF
  const handleExportPDF = async () => {
    try {
      await exportToPDF('creances-dettes-content', {
        filename: `creances-dettes-${selectedExercice}.pdf`,
        orientation: 'landscape'
      });
    } catch (error) {
      console.error('Erreur export PDF:', error);
    }
  };

  // Statistiques
  const totalCreances = filteredCreances.reduce((sum, c) => sum + c.amount, 0);
  const totalDettes = filteredDettes.reduce((sum, d) => sum + d.amount, 0);
  const soldeNet = totalCreances - totalDettes;
  
  const creancesEchues = filteredCreances.filter(c => c.status === 'echu');
  const dettesEchues = filteredDettes.filter(d => d.status === 'echu');
  const creancesLitigieuses = filteredCreances.filter(c => c.status === 'litigieux');
  const dettesLitigieuses = filteredDettes.filter(d => d.status === 'litigieux');

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
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
          <h1 className="text-3xl font-bold text-gray-900">Créances & Dettes</h1>
          <p className="mt-2 text-gray-600">
            Suivi des créances clients et dettes fournisseurs (impact sur résultat SMT)
          </p>
          {error && (
            <p className="mt-2 text-red-600">Erreur: {error}</p>
          )}
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <Select value={selectedExercice} onValueChange={setSelectedExercice}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
            </SelectContent>
          </Select>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportPDF}>
                <FileText className="h-4 w-4 mr-2" />
                Télécharger PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Créances</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalCreances)}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Dettes</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalDettes)}</p>
              </div>
              <UserX className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Solde net</p>
                <p className={`text-2xl font-bold ${
                  soldeNet >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(soldeNet)}
                </p>
              </div>
              {soldeNet >= 0 ? 
                <TrendingUp className="h-8 w-8 text-green-500" /> :
                <TrendingDown className="h-8 w-8 text-red-500" />
              }
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Échéances</p>
                <p className="text-2xl font-bold text-orange-600">{creancesEchues.length + dettesEchues.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertes */}
      {(creancesEchues.length > 0 || dettesEchues.length > 0 || creancesLitigieuses.length > 0) && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <h3 className="font-medium text-red-900 mb-2 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Alertes - Actions requises
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {creancesEchues.length > 0 && (
                <div className="text-red-800">
                  <p className="font-medium">Créances échues: {creancesEchues.length}</p>
                  <p>Montant: {formatCurrency(creancesEchues.reduce((sum, c) => sum + c.amount, 0))}</p>
                </div>
              )}
              {dettesEchues.length > 0 && (
                <div className="text-red-800">
                  <p className="font-medium">Dettes échues: {dettesEchues.length}</p>
                  <p>Montant: {formatCurrency(dettesEchues.reduce((sum, d) => sum + d.amount, 0))}</p>
                </div>
              )}
              {creancesLitigieuses.length > 0 && (
                <div className="text-red-800">
                  <p className="font-medium">Litiges: {creancesLitigieuses.length}</p>
                  <p>Montant: {formatCurrency(creancesLitigieuses.reduce((sum, c) => sum + c.amount, 0))}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="creances" className="space-y-4">
        <TabsList>
          <TabsTrigger value="creances">Créances clients</TabsTrigger>
          <TabsTrigger value="dettes">Dettes fournisseurs</TabsTrigger>
          <TabsTrigger value="impact">Impact SMT</TabsTrigger>
        </TabsList>

        {/* Créances */}
        <TabsContent value="creances">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Créances clients - Exercice {selectedExercice}</CardTitle>
              <Dialog open={isCreanceDialogOpen} onOpenChange={setIsCreanceDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle créance
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Ajouter une créance client</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nom de la créance</Label>
                      <Input
                        id="name"
                        value={newCreance.name}
                        onChange={(e) => setNewCreance({...newCreance, name: e.target.value})}
                        placeholder="Ex: Facture services"
                      />
                    </div>
                    <div>
                      <Label htmlFor="thirdParty">Client</Label>
                      <Input
                        id="thirdParty"
                        value={newCreance.thirdParty}
                        onChange={(e) => setNewCreance({...newCreance, thirdParty: e.target.value})}
                        placeholder="Nom du client"
                      />
                    </div>
                    <div>
                      <Label htmlFor="amount">Montant (MGA)</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={newCreance.amount}
                        onChange={(e) => setNewCreance({...newCreance, amount: e.target.value})}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dueDate">Date d'échéance</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={newCreance.dueDate}
                        onChange={(e) => setNewCreance({...newCreance, dueDate: e.target.value})}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newCreance.description}
                        onChange={(e) => setNewCreance({...newCreance, description: e.target.value})}
                        placeholder="Description de la prestation/vente"
                      />
                    </div>
                    <div className="col-span-2">
                      <Button onClick={handleAddCreance} className="w-full">
                        Ajouter la créance
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {/* Filtres */}
              <div className="mb-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrer par statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="en_cours">En cours</SelectItem>
                    <SelectItem value="echu">Echues</SelectItem>
                    <SelectItem value="paye">Payées</SelectItem>
                    <SelectItem value="litigieux">Litigieuses</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div id="creances-content">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Créance</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Echéance</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead className="text-center">Statut</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCreances.map((creance) => (
                      <TableRow key={creance.id}>
                        <TableCell className="font-medium">{creance.name}</TableCell>
                        <TableCell>{creance.thirdParty}</TableCell>
                        <TableCell>{new Date(creance.dueDate).toLocaleDateString('fr-FR')}</TableCell>
                        <TableCell className="text-right">{formatCurrency(creance.amount)}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={
                            creance.status === 'paye' ? 'default' :
                            creance.status === 'en_cours' ? 'secondary' :
                            creance.status === 'echu' ? 'destructive' : 'outline'
                          }>
                            {creance.status === 'paye' ? 'Payée' :
                             creance.status === 'en_cours' ? 'En cours' :
                             creance.status === 'echu' ? 'Échue' : 'Litige'}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{creance.description}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="border-t-2 font-bold">
                      <TableCell colSpan={3}>TOTAL CRÉANCES</TableCell>
                      <TableCell className="text-right">{formatCurrency(totalCreances)}</TableCell>
                      <TableCell colSpan={2}></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dettes */}
        <TabsContent value="dettes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Dettes fournisseurs - Exercice {selectedExercice}</CardTitle>
              <Dialog open={isDetteDialogOpen} onOpenChange={setIsDetteDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle dette
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Ajouter une dette fournisseur</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nom de la dette</Label>
                      <Input
                        id="name"
                        value={newDette.name}
                        onChange={(e) => setNewDette({...newDette, name: e.target.value})}
                        placeholder="Ex: Facture électricité"
                      />
                    </div>
                    <div>
                      <Label htmlFor="thirdParty">Fournisseur</Label>
                      <Input
                        id="thirdParty"
                        value={newDette.thirdParty}
                        onChange={(e) => setNewDette({...newDette, thirdParty: e.target.value})}
                        placeholder="Nom du fournisseur"
                      />
                    </div>
                    <div>
                      <Label htmlFor="amount">Montant (MGA)</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={newDette.amount}
                        onChange={(e) => setNewDette({...newDette, amount: e.target.value})}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dueDate">Date d'échéance</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={newDette.dueDate}
                        onChange={(e) => setNewDette({...newDette, dueDate: e.target.value})}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newDette.description}
                        onChange={(e) => setNewDette({...newDette, description: e.target.value})}
                        placeholder="Description de l'achat/service"
                      />
                    </div>
                    <div className="col-span-2">
                      <Button onClick={handleAddDette} className="w-full">
                        Ajouter la dette
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div id="dettes-content">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dette</TableHead>
                      <TableHead>Fournisseur</TableHead>
                      <TableHead>Echéance</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead className="text-center">Statut</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDettes.map((dette) => (
                      <TableRow key={dette.id}>
                        <TableCell className="font-medium">{dette.name}</TableCell>
                        <TableCell>{dette.thirdParty}</TableCell>
                        <TableCell>{new Date(dette.dueDate).toLocaleDateString('fr-FR')}</TableCell>
                        <TableCell className="text-right">{formatCurrency(dette.amount)}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={
                            dette.status === 'paye' ? 'default' :
                            dette.status === 'en_cours' ? 'secondary' :
                            dette.status === 'echu' ? 'destructive' : 'outline'
                          }>
                            {dette.status === 'paye' ? 'Payée' :
                             dette.status === 'en_cours' ? 'En cours' :
                             dette.status === 'echu' ? 'Échue' : 'Litige'}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{dette.description}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="border-t-2 font-bold">
                      <TableCell colSpan={3}>TOTAL DETTES</TableCell>
                      <TableCell className="text-right text-red-600">{formatCurrency(totalDettes)}</TableCell>
                      <TableCell colSpan={2}></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Impact SMT */}
        <TabsContent value="impact">
          <Card>
            <CardHeader>
              <CardTitle>Impact des créances et dettes sur le résultat SMT</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Ajustement SMT</h3>
                  <p className="text-sm text-blue-800">
                    Les créances et dettes sont ajoutées au résultat de l'exercice pour corriger l'effet des décalages de trésorerie selon les normes OHADA.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-green-900 mb-2">Créances clients</h4>
                      <p className="text-2xl font-bold text-green-600 mb-2">
                        +{formatCurrency(totalCreances)}
                      </p>
                      <p className="text-sm text-green-800">
                        Ventes non encore encaissées (produit à recevoir)
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-red-50 border-red-200">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-red-900 mb-2">Dettes fournisseurs</h4>
                      <p className="text-2xl font-bold text-red-600 mb-2">
                        -{formatCurrency(totalDettes)}
                      </p>
                      <p className="text-sm text-red-800">
                        Achats non encore décaissés (charge à payer)
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className={`${soldeNet >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <CardContent className="p-4">
                      <h4 className={`font-medium mb-2 ${soldeNet >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                        Impact net
                      </h4>
                      <p className={`text-2xl font-bold mb-2 ${soldeNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {soldeNet >= 0 ? '+' : ''}{formatCurrency(soldeNet)}
                      </p>
                      <p className={`text-sm ${soldeNet >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                        {soldeNet >= 0 ? 'Améliore' : 'Réduit'} le résultat de l'exercice
                      </p>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-4">Compte de résultat ajusté</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nature</TableHead>
                        <TableHead className="text-right">Montant encaissé/décaissé</TableHead>
                        <TableHead className="text-right">Ajustement SMT</TableHead>
                        <TableHead className="text-right">Total ajusté</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Ventes/Prestations</TableCell>
                        <TableCell className="text-right">45 000 000</TableCell>
                        <TableCell className="text-right text-green-600">+{formatCurrency(totalCreances)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(45000000 + totalCreances)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Achats/Charges</TableCell>
                        <TableCell className="text-right">32 000 000</TableCell>
                        <TableCell className="text-right text-red-600">+{formatCurrency(totalDettes)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(32000000 + totalDettes)}</TableCell>
                      </TableRow>
                      <TableRow className="border-t-2 font-bold">
                        <TableCell>IMPACT NET SUR RÉSULTAT</TableCell>
                        <TableCell className="text-right">13 000 000</TableCell>
                        <TableCell className={`text-right ${soldeNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {soldeNet >= 0 ? '+' : ''}{formatCurrency(soldeNet)}
                        </TableCell>
                        <TableCell className="text-right font-bold">{formatCurrency(13000000 + soldeNet)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Information OHADA */}
      <Card className="bg-purple-50 border-purple-200">
        <CardHeader>
          <CardTitle className="text-purple-900">Règles SMT - Créances & Dettes</CardTitle>
        </CardHeader>
        <CardContent className="text-purple-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Obligation de suivi :</h4>
              <ul className="text-sm space-y-1">
                <li>• Enregistrement de toutes les créances/dettes</li>
                <li>• Ajustement obligatoire en fin d'exercice</li>
                <li>• Justification par pièces probantes</li>
                <li>• État détaillé obligatoire</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Impact comptable :</h4>
              <ul className="text-sm space-y-1">
                <li>• Créances = Produits à recevoir (+)</li>
                <li>• Dettes = Charges à payer (-)</li>
                <li>• Correction base encaissement/décaissement</li>
                <li>• Rapprochement avec bilan</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
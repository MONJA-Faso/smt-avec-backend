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

interface Creance {
  id: string;
  clientNom: string;
  facture: string;
  dateFacture: string;
  dateEcheance: string;
  montant: number;
  montantPaye: number;
  montantRestant: number;
  statut: 'en_cours' | 'echu' | 'paye' | 'litigieux';
  description: string;
  exercice: string;
}

interface Dette {
  id: string;
  fournisseurNom: string;
  facture: string;
  dateFacture: string;
  dateEcheance: string;
  montant: number;
  montantPaye: number;
  montantRestant: number;
  statut: 'en_cours' | 'echu' | 'paye' | 'litigieux';
  description: string;
  exercice: string;
}

// Mock data
const mockCreances: Creance[] = [
  {
    id: '1',
    clientNom: 'SARL TECH SOLUTIONS',
    facture: 'F-2024-001',
    dateFacture: '2024-11-15',
    dateEcheance: '2024-12-15',
    montant: 2500000,
    montantPaye: 1000000,
    montantRestant: 1500000,
    statut: 'en_cours',
    description: 'Prestation services informatiques',
    exercice: '2024'
  },
  {
    id: '2',
    clientNom: 'ENTREPRISE MAMADOU & FILS',
    facture: 'F-2024-002',
    dateFacture: '2024-10-20',
    dateEcheance: '2024-11-20',
    montant: 1800000,
    montantPaye: 0,
    montantRestant: 1800000,
    statut: 'echu',
    description: 'Vente marchandises',
    exercice: '2024'
  },
  {
    id: '3',
    clientNom: 'COOPERATIVE AGRICOLE',
    facture: 'F-2024-003',
    dateFacture: '2024-12-01',
    dateEcheance: '2025-01-01',
    montant: 3200000,
    montantPaye: 3200000,
    montantRestant: 0,
    statut: 'paye',
    description: 'Fourniture équipements',
    exercice: '2024'
  },
  {
    id: '4',
    clientNom: 'SOCIETE IMPORT-EXPORT',
    facture: 'F-2024-004',
    dateFacture: '2024-09-10',
    dateEcheance: '2024-10-10',
    montant: 4500000,
    montantPaye: 2000000,
    montantRestant: 2500000,
    statut: 'litigieux',
    description: 'Livraison produits - litige qualité',
    exercice: '2024'
  }
];

const mockDettes: Dette[] = [
  {
    id: '1',
    fournisseurNom: 'FOURNISSEUR ABC',
    facture: 'FA-2024-101',
    dateFacture: '2024-11-20',
    dateEcheance: '2024-12-20',
    montant: 1200000,
    montantPaye: 0,
    montantRestant: 1200000,
    statut: 'en_cours',
    description: 'Achat matières premières',
    exercice: '2024'
  },
  {
    id: '2',
    fournisseurNom: 'ELECTRICITE NATIONALE',
    facture: 'ELE-2024-11',
    dateFacture: '2024-11-30',
    dateEcheance: '2024-12-30',
    montant: 850000,
    montantPaye: 850000,
    montantRestant: 0,
    statut: 'paye',
    description: 'Facture d’électricité novembre',
    exercice: '2024'
  },
  {
    id: '3',
    fournisseurNom: 'GARAGE MODERNE',
    facture: 'GM-2024-055',
    dateFacture: '2024-10-15',
    dateEcheance: '2024-11-15',
    montant: 650000,
    montantPaye: 200000,
    montantRestant: 450000,
    statut: 'echu',
    description: 'Réparation véhicule',
    exercice: '2024'
  },
  {
    id: '4',
    fournisseurNom: 'BUREAU COMPTABLE EXPERT',
    facture: 'BCE-2024-Q4',
    dateFacture: '2024-12-01',
    dateEcheance: '2025-01-31',
    montant: 500000,
    montantPaye: 0,
    montantRestant: 500000,
    statut: 'en_cours',
    description: 'Honoraires expertise comptable Q4',
    exercice: '2024'
  }
];

// Formatage des montants
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' MGA';
}

export function DebtsCredits() {
  const [creances, setCreances] = useState<Creance[]>(mockCreances);
  const [dettes, setDettes] = useState<Dette[]>(mockDettes);
  const [selectedExercice, setSelectedExercice] = useState('2024');
  const [filteredCreances, setFilteredCreances] = useState<Creance[]>(mockCreances);
  const [filteredDettes, setFilteredDettes] = useState<Dette[]>(mockDettes);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [newCreance, setNewCreance] = useState({
    clientNom: '',
    facture: '',
    dateFacture: '',
    dateEcheance: '',
    montant: '',
    montantPaye: '',
    description: ''
  });
  const [newDette, setNewDette] = useState({
    fournisseurNom: '',
    facture: '',
    dateFacture: '',
    dateEcheance: '',
    montant: '',
    montantPaye: '',
    description: ''
  });
  const [isCreanceDialogOpen, setIsCreanceDialogOpen] = useState(false);
  const [isDetteDialogOpen, setIsDetteDialogOpen] = useState(false);

  // Filtrage
  useEffect(() => {
    let filteredC = creances.filter(c => c.exercice === selectedExercice);
    let filteredD = dettes.filter(d => d.exercice === selectedExercice);
    
    if (statusFilter !== 'all') {
      filteredC = filteredC.filter(c => c.statut === statusFilter);
      filteredD = filteredD.filter(d => d.statut === statusFilter);
    }
    
    setFilteredCreances(filteredC);
    setFilteredDettes(filteredD);
  }, [creances, dettes, selectedExercice, statusFilter]);

  // Ajout d'une nouvelle créance
  const handleAddCreance = () => {
    const montant = parseFloat(newCreance.montant);
    const montantPaye = parseFloat(newCreance.montantPaye || '0');
    const montantRestant = montant - montantPaye;
    
    const nouvelleCreance: Creance = {
      id: (creances.length + 1).toString(),
      clientNom: newCreance.clientNom,
      facture: newCreance.facture,
      dateFacture: newCreance.dateFacture,
      dateEcheance: newCreance.dateEcheance,
      montant: montant,
      montantPaye: montantPaye,
      montantRestant: montantRestant,
      statut: montantRestant === 0 ? 'paye' : 
               new Date(newCreance.dateEcheance) < new Date() ? 'echu' : 'en_cours',
      description: newCreance.description,
      exercice: selectedExercice
    };

    setCreances([...creances, nouvelleCreance]);
    setNewCreance({
      clientNom: '',
      facture: '',
      dateFacture: '',
      dateEcheance: '',
      montant: '',
      montantPaye: '',
      description: ''
    });
    setIsCreanceDialogOpen(false);
  };

  // Ajout d'une nouvelle dette
  const handleAddDette = () => {
    const montant = parseFloat(newDette.montant);
    const montantPaye = parseFloat(newDette.montantPaye || '0');
    const montantRestant = montant - montantPaye;
    
    const nouvelleDette: Dette = {
      id: (dettes.length + 1).toString(),
      fournisseurNom: newDette.fournisseurNom,
      facture: newDette.facture,
      dateFacture: newDette.dateFacture,
      dateEcheance: newDette.dateEcheance,
      montant: montant,
      montantPaye: montantPaye,
      montantRestant: montantRestant,
      statut: montantRestant === 0 ? 'paye' : 
               new Date(newDette.dateEcheance) < new Date() ? 'echu' : 'en_cours',
      description: newDette.description,
      exercice: selectedExercice
    };

    setDettes([...dettes, nouvelleDette]);
    setNewDette({
      fournisseurNom: '',
      facture: '',
      dateFacture: '',
      dateEcheance: '',
      montant: '',
      montantPaye: '',
      description: ''
    });
    setIsDetteDialogOpen(false);
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
  const totalCreances = filteredCreances.reduce((sum, c) => sum + c.montantRestant, 0);
  const totalDettes = filteredDettes.reduce((sum, d) => sum + d.montantRestant, 0);
  const soldeNet = totalCreances - totalDettes;
  
  const creancesEchues = filteredCreances.filter(c => c.statut === 'echu');
  const dettesEchues = filteredDettes.filter(d => d.statut === 'echu');
  const creancesLitigieuses = filteredCreances.filter(c => c.statut === 'litigieux');
  const dettesLitigieuses = filteredDettes.filter(d => d.statut === 'litigieux');

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Créances & Dettes</h1>
          <p className="mt-2 text-gray-600">
            Suivi des créances clients et dettes fournisseurs (impact sur résultat SMT)
          </p>
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
                  <p>Montant: {formatCurrency(creancesEchues.reduce((sum, c) => sum + c.montantRestant, 0))}</p>
                </div>
              )}
              {dettesEchues.length > 0 && (
                <div className="text-red-800">
                  <p className="font-medium">Dettes échues: {dettesEchues.length}</p>
                  <p>Montant: {formatCurrency(dettesEchues.reduce((sum, d) => sum + d.montantRestant, 0))}</p>
                </div>
              )}
              {creancesLitigieuses.length > 0 && (
                <div className="text-red-800">
                  <p className="font-medium">Litiges: {creancesLitigieuses.length}</p>
                  <p>Montant: {formatCurrency(creancesLitigieuses.reduce((sum, c) => sum + c.montantRestant, 0))}</p>
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
                      <Label htmlFor="clientNom">Nom du client</Label>
                      <Input
                        id="clientNom"
                        value={newCreance.clientNom}
                        onChange={(e) => setNewCreance({...newCreance, clientNom: e.target.value})}
                        placeholder="Nom du client"
                      />
                    </div>
                    <div>
                      <Label htmlFor="facture">N° Facture</Label>
                      <Input
                        id="facture"
                        value={newCreance.facture}
                        onChange={(e) => setNewCreance({...newCreance, facture: e.target.value})}
                        placeholder="F-2024-XXX"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dateFacture">Date facture</Label>
                      <Input
                        id="dateFacture"
                        type="date"
                        value={newCreance.dateFacture}
                        onChange={(e) => setNewCreance({...newCreance, dateFacture: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dateEcheance">Date échéance</Label>
                      <Input
                        id="dateEcheance"
                        type="date"
                        value={newCreance.dateEcheance}
                        onChange={(e) => setNewCreance({...newCreance, dateEcheance: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="montant">Montant total (MGA)</Label>
                      <Input
                        id="montant"
                        type="number"
                        value={newCreance.montant}
                        onChange={(e) => setNewCreance({...newCreance, montant: e.target.value})}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="montantPaye">Montant payé (MGA)</Label>
                      <Input
                        id="montantPaye"
                        type="number"
                        value={newCreance.montantPaye}
                        onChange={(e) => setNewCreance({...newCreance, montantPaye: e.target.value})}
                        placeholder="0"
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
                      <TableHead>Client</TableHead>
                      <TableHead>Facture</TableHead>
                      <TableHead>Date facture</TableHead>
                      <TableHead>Echéance</TableHead>
                      <TableHead className="text-right">Montant total</TableHead>
                      <TableHead className="text-right">Payé</TableHead>
                      <TableHead className="text-right">Restant</TableHead>
                      <TableHead className="text-center">Statut</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCreances.map((creance) => (
                      <TableRow key={creance.id}>
                        <TableCell className="font-medium">{creance.clientNom}</TableCell>
                        <TableCell>{creance.facture}</TableCell>
                        <TableCell>{new Date(creance.dateFacture).toLocaleDateString('fr-FR')}</TableCell>
                        <TableCell>{new Date(creance.dateEcheance).toLocaleDateString('fr-FR')}</TableCell>
                        <TableCell className="text-right">{formatCurrency(creance.montant)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(creance.montantPaye)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(creance.montantRestant)}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={
                            creance.statut === 'paye' ? 'default' :
                            creance.statut === 'en_cours' ? 'secondary' :
                            creance.statut === 'echu' ? 'destructive' : 'outline'
                          }>
                            {creance.statut === 'paye' ? 'Payée' :
                             creance.statut === 'en_cours' ? 'En cours' :
                             creance.statut === 'echu' ? 'Échue' : 'Litige'}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{creance.description}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="border-t-2 font-bold">
                      <TableCell colSpan={6}>TOTAL CRÉANCES</TableCell>
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
                      <Label htmlFor="fournisseurNom">Nom du fournisseur</Label>
                      <Input
                        id="fournisseurNom"
                        value={newDette.fournisseurNom}
                        onChange={(e) => setNewDette({...newDette, fournisseurNom: e.target.value})}
                        placeholder="Nom du fournisseur"
                      />
                    </div>
                    <div>
                      <Label htmlFor="facture">N° Facture</Label>
                      <Input
                        id="facture"
                        value={newDette.facture}
                        onChange={(e) => setNewDette({...newDette, facture: e.target.value})}
                        placeholder="FA-2024-XXX"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dateFacture">Date facture</Label>
                      <Input
                        id="dateFacture"
                        type="date"
                        value={newDette.dateFacture}
                        onChange={(e) => setNewDette({...newDette, dateFacture: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dateEcheance">Date échéance</Label>
                      <Input
                        id="dateEcheance"
                        type="date"
                        value={newDette.dateEcheance}
                        onChange={(e) => setNewDette({...newDette, dateEcheance: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="montant">Montant total (MGA)</Label>
                      <Input
                        id="montant"
                        type="number"
                        value={newDette.montant}
                        onChange={(e) => setNewDette({...newDette, montant: e.target.value})}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="montantPaye">Montant payé (MGA)</Label>
                      <Input
                        id="montantPaye"
                        type="number"
                        value={newDette.montantPaye}
                        onChange={(e) => setNewDette({...newDette, montantPaye: e.target.value})}
                        placeholder="0"
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
                      <TableHead>Fournisseur</TableHead>
                      <TableHead>Facture</TableHead>
                      <TableHead>Date facture</TableHead>
                      <TableHead>Echéance</TableHead>
                      <TableHead className="text-right">Montant total</TableHead>
                      <TableHead className="text-right">Payé</TableHead>
                      <TableHead className="text-right">Restant</TableHead>
                      <TableHead className="text-center">Statut</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDettes.map((dette) => (
                      <TableRow key={dette.id}>
                        <TableCell className="font-medium">{dette.fournisseurNom}</TableCell>
                        <TableCell>{dette.facture}</TableCell>
                        <TableCell>{new Date(dette.dateFacture).toLocaleDateString('fr-FR')}</TableCell>
                        <TableCell>{new Date(dette.dateEcheance).toLocaleDateString('fr-FR')}</TableCell>
                        <TableCell className="text-right">{formatCurrency(dette.montant)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(dette.montantPaye)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(dette.montantRestant)}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={
                            dette.statut === 'paye' ? 'default' :
                            dette.statut === 'en_cours' ? 'secondary' :
                            dette.statut === 'echu' ? 'destructive' : 'outline'
                          }>
                            {dette.statut === 'paye' ? 'Payée' :
                             dette.statut === 'en_cours' ? 'En cours' :
                             dette.statut === 'echu' ? 'Échue' : 'Litige'}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{dette.description}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="border-t-2 font-bold">
                      <TableCell colSpan={6}>TOTAL DETTES</TableCell>
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
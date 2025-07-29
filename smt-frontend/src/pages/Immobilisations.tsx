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
import { 
  Building, 
  Plus, 
  Calculator, 
  TrendingDown, 
  Edit, 
  Trash2,
  Download,
  FileText
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportToPDF } from '@/utils/exportUtils';

interface Immobilisation {
  id: string;
  designation: string;
  dateAcquisition: string;
  valeurOriginale: number;
  dureeAmortissement: number;
  tauxAmortissement: number;
  amortissementCumule: number;
  valeurNette: number;
  categorie: string;
  statut: 'active' | 'cedee' | 'obsolete';
  dateCession?: string;
  prixCession?: number;
}

// Mock data
const mockImmobilisations: Immobilisation[] = [
  {
    id: '1',
    designation: 'Véhicule utilitaire Toyota',
    dateAcquisition: '2022-01-15',
    valeurOriginale: 12000000,
    dureeAmortissement: 5,
    tauxAmortissement: 20,
    amortissementCumule: 4800000,
    valeurNette: 7200000,
    categorie: 'Matériel de transport',
    statut: 'active'
  },
  {
    id: '2',
    designation: 'Ordinateurs (lot de 5)',
    dateAcquisition: '2023-06-20',
    valeurOriginale: 2500000,
    dureeAmortissement: 3,
    tauxAmortissement: 33.33,
    amortissementCumule: 833333,
    valeurNette: 1666667,
    categorie: 'Matériel informatique',
    statut: 'active'
  },
  {
    id: '3',
    designation: 'Machine industrielle',
    dateAcquisition: '2020-03-10',
    valeurOriginale: 25000000,
    dureeAmortissement: 10,
    tauxAmortissement: 10,
    amortissementCumule: 12500000,
    valeurNette: 12500000,
    categorie: 'Matériel industriel',
    statut: 'active'
  },
  {
    id: '4',
    designation: 'Ancien véhicule',
    dateAcquisition: '2019-01-01',
    valeurOriginale: 8000000,
    dureeAmortissement: 5,
    tauxAmortissement: 20,
    amortissementCumule: 8000000,
    valeurNette: 0,
    categorie: 'Matériel de transport',
    statut: 'cedee',
    dateCession: '2024-01-15',
    prixCession: 500000
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

export function Immobilisations() {
  const [immobilisations, setImmobilisations] = useState<Immobilisation[]>(mockImmobilisations);
  const [filteredImmos, setFilteredImmos] = useState<Immobilisation[]>(mockImmobilisations);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [newImmo, setNewImmo] = useState({
    designation: '',
    dateAcquisition: '',
    valeurOriginale: '',
    dureeAmortissement: '',
    categorie: ''
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Calcul automatique de l'amortissement
  const calculateAmortissement = (immo: Immobilisation) => {
    const dateAcq = new Date(immo.dateAcquisition);
    const today = new Date();
    const moisEcoules = (today.getFullYear() - dateAcq.getFullYear()) * 12 + (today.getMonth() - dateAcq.getMonth());
    const anneesEcoulees = moisEcoules / 12;
    
    const amortissementAnnuel = immo.valeurOriginale * (immo.tauxAmortissement / 100);
    const amortissementCumule = Math.min(amortissementAnnuel * anneesEcoulees, immo.valeurOriginale);
    const valeurNette = immo.valeurOriginale - amortissementCumule;
    
    return {
      amortissementCumule: Math.round(amortissementCumule),
      valeurNette: Math.round(valeurNette)
    };
  };

  // Filtrage
  useEffect(() => {
    let filtered = immobilisations;
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(immo => immo.statut === statusFilter);
    }
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(immo => immo.categorie === categoryFilter);
    }
    
    setFilteredImmos(filtered);
  }, [immobilisations, statusFilter, categoryFilter]);

  // Ajout d'une nouvelle immobilisation
  const handleAddImmobilisation = () => {
    if (parseFloat(newImmo.valeurOriginale) < 500000) {
      alert('Seules les immobilisations > 500 000 MGA sont enregistrées dans le SMT');
      return;
    }

    const tauxAmortissement = 100 / parseFloat(newImmo.dureeAmortissement);
    const newId = (immobilisations.length + 1).toString();
    
    const nouvelleImmo: Immobilisation = {
      id: newId,
      designation: newImmo.designation,
      dateAcquisition: newImmo.dateAcquisition,
      valeurOriginale: parseFloat(newImmo.valeurOriginale),
      dureeAmortissement: parseFloat(newImmo.dureeAmortissement),
      tauxAmortissement: parseFloat(tauxAmortissement.toFixed(2)),
      amortissementCumule: 0,
      valeurNette: parseFloat(newImmo.valeurOriginale),
      categorie: newImmo.categorie,
      statut: 'active'
    };

    const calculs = calculateAmortissement(nouvelleImmo);
    nouvelleImmo.amortissementCumule = calculs.amortissementCumule;
    nouvelleImmo.valeurNette = calculs.valeurNette;

    setImmobilisations([...immobilisations, nouvelleImmo]);
    setNewImmo({
      designation: '',
      dateAcquisition: '',
      valeurOriginale: '',
      dureeAmortissement: '',
      categorie: ''
    });
    setIsDialogOpen(false);
  };

  // Export PDF
  const handleExportPDF = async () => {
    try {
      await exportToPDF('immobilisations-content', {
        filename: `immobilisations-${new Date().toISOString().split('T')[0]}.pdf`,
        orientation: 'landscape'
      });
    } catch (error) {
      console.error('Erreur export PDF:', error);
    }
  };

  // Statistiques
  const totalValeurOriginale = filteredImmos.reduce((sum, immo) => sum + immo.valeurOriginale, 0);
  const totalAmortissement = filteredImmos.reduce((sum, immo) => sum + immo.amortissementCumule, 0);
  const totalValeurNette = filteredImmos.reduce((sum, immo) => sum + immo.valeurNette, 0);
  const categories = [...new Set(immobilisations.map(immo => immo.categorie))];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Immobilisations</h1>
          <p className="mt-2 text-gray-600">
            Gestion des immobilisations et amortissements (seuil SMT: 500 000 MGA)
          </p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
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
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle immobilisation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Ajouter une immobilisation</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="designation">Désignation</Label>
                  <Input
                    id="designation"
                    value={newImmo.designation}
                    onChange={(e) => setNewImmo({...newImmo, designation: e.target.value})}
                    placeholder="Ex: Véhicule, Ordinateur..."
                  />
                </div>
                <div>
                  <Label htmlFor="categorie">Catégorie</Label>
                  <Select onValueChange={(value) => setNewImmo({...newImmo, categorie: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Matériel de transport">Matériel de transport</SelectItem>
                      <SelectItem value="Matériel informatique">Matériel informatique</SelectItem>
                      <SelectItem value="Matériel industriel">Matériel industriel</SelectItem>
                      <SelectItem value="Mobilier de bureau">Mobilier de bureau</SelectItem>
                      <SelectItem value="Installations">Installations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dateAcquisition">Date d'acquisition</Label>
                  <Input
                    id="dateAcquisition"
                    type="date"
                    value={newImmo.dateAcquisition}
                    onChange={(e) => setNewImmo({...newImmo, dateAcquisition: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="valeurOriginale">Valeur d'acquisition (MGA)</Label>
                  <Input
                    id="valeurOriginale"
                    type="number"
                    min="500000"
                    value={newImmo.valeurOriginale}
                    onChange={(e) => setNewImmo({...newImmo, valeurOriginale: e.target.value})}
                    placeholder="Minimum 500 000 MGA"
                  />
                </div>
                <div>
                  <Label htmlFor="dureeAmortissement">Durée d'amortissement (années)</Label>
                  <Select onValueChange={(value) => setNewImmo({...newImmo, dureeAmortissement: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner la durée" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 ans (Informatique)</SelectItem>
                      <SelectItem value="5">5 ans (Véhicules, mobilier)</SelectItem>
                      <SelectItem value="10">10 ans (Matériel industriel)</SelectItem>
                      <SelectItem value="20">20 ans (Bâtiments)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddImmobilisation} className="w-full">
                  Ajouter
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Valeur totale</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalValeurOriginale)}</p>
              </div>
              <Building className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Amortissements</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalAmortissement)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Valeur nette</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalValeurNette)}</p>
              </div>
              <Calculator className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Nb immobilisations</p>
                <p className="text-2xl font-bold text-gray-700">{filteredImmos.length}</p>
              </div>
              <Building className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div>
              <Label>Statut</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="active">Actives</SelectItem>
                  <SelectItem value="cedee">Cédées</SelectItem>
                  <SelectItem value="obsolete">Obsolètes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Catégorie</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des immobilisations */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des immobilisations</CardTitle>
        </CardHeader>
        <CardContent>
          <div id="immobilisations-content">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Désignation</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Date acquisition</TableHead>
                  <TableHead className="text-right">Valeur originale</TableHead>
                  <TableHead className="text-center">Durée (ans)</TableHead>
                  <TableHead className="text-right">Amortissement</TableHead>
                  <TableHead className="text-right">Valeur nette</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredImmos.map((immo) => {
                  const calculs = calculateAmortissement(immo);
                  return (
                    <TableRow key={immo.id}>
                      <TableCell className="font-medium">{immo.designation}</TableCell>
                      <TableCell>{immo.categorie}</TableCell>
                      <TableCell>{new Date(immo.dateAcquisition).toLocaleDateString('fr-FR')}</TableCell>
                      <TableCell className="text-right">{formatCurrency(immo.valeurOriginale)}</TableCell>
                      <TableCell className="text-center">{immo.dureeAmortissement}</TableCell>
                      <TableCell className="text-right">{formatCurrency(calculs.amortissementCumule)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(calculs.valeurNette)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={
                          immo.statut === 'active' ? 'default' :
                          immo.statut === 'cedee' ? 'secondary' : 'destructive'
                        }>
                          {immo.statut === 'active' ? 'Active' :
                           immo.statut === 'cedee' ? 'Cédée' : 'Obsolète'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Information OHADA */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="text-yellow-900">Règles SMT - Immobilisations</CardTitle>
        </CardHeader>
        <CardContent className="text-yellow-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Seuil d'enregistrement :</h4>
              <ul className="text-sm space-y-1">
                <li>• Valeur minimale : 500 000 MGA</li>
                <li>• Durée d'utilisation &gt; 1 an</li>
                <li>• Amortissement linéaire obligatoire</li>
                <li>• Suivi individuel requis</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Durées d'amortissement :</h4>
              <ul className="text-sm space-y-1">
                <li>• Matériel informatique : 3 ans</li>
                <li>• Véhicules, mobilier : 5 ans</li>
                <li>• Matériel industriel : 10 ans</li>
                <li>• Bâtiments : 20 ans</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
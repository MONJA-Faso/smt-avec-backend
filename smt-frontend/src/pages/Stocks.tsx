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
  Package, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  Download,
  FileText,
  Calculator,
  Calendar
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportToPDF } from '@/utils/exportUtils';

interface Stock {
  id: string;
  designation: string;
  categorie: string;
  unite: string;
  stockInitial: number;
  prixUnitaireInitial: number;
  valeurInitiale: number;
  stockFinal: number;
  prixUnitaireFinal: number;
  valeurFinale: number;
  variation: number;
  dateInventaire: string;
  exercice: string;
}

interface InventaireStock {
  exercice: string;
  dateDebut: string;
  dateFin: string;
  dateInventaire: string;
  statut: 'ouvert' | 'clot' | 'valide';
  stocksInitial: number;
  stocksFinal: number;
  variation: number;
}

// Mock data
const mockInventaires: InventaireStock[] = [
  {
    exercice: '2024',
    dateDebut: '2024-01-01',
    dateFin: '2024-12-31',
    dateInventaire: '2024-12-31',
    statut: 'ouvert',
    stocksInitial: 15000000,
    stocksFinal: 18500000,
    variation: 3500000
  },
  {
    exercice: '2023',
    dateDebut: '2023-01-01',
    dateFin: '2023-12-31',
    dateInventaire: '2023-12-31',
    statut: 'valide',
    stocksInitial: 12000000,
    stocksFinal: 15000000,
    variation: 3000000
  }
];

const mockStocks: Stock[] = [
  {
    id: '1',
    designation: 'Marchandises - Article A',
    categorie: 'Marchandises',
    unite: 'Pièces',
    stockInitial: 100,
    prixUnitaireInitial: 50000,
    valeurInitiale: 5000000,
    stockFinal: 150,
    prixUnitaireFinal: 55000,
    valeurFinale: 8250000,
    variation: 3250000,
    dateInventaire: '2024-12-31',
    exercice: '2024'
  },
  {
    id: '2',
    designation: 'Matières premières - Type B',
    categorie: 'Matières premières',
    unite: 'Kg',
    stockInitial: 500,
    prixUnitaireInitial: 8000,
    valeurInitiale: 4000000,
    stockFinal: 450,
    prixUnitaireFinal: 9000,
    valeurFinale: 4050000,
    variation: 50000,
    dateInventaire: '2024-12-31',
    exercice: '2024'
  },
  {
    id: '3',
    designation: 'Produits finis - Modèle C',
    categorie: 'Produits finis',
    unite: 'Unités',
    stockInitial: 75,
    prixUnitaireInitial: 80000,
    valeurInitiale: 6000000,
    stockFinal: 90,
    prixUnitaireFinal: 85000,
    valeurFinale: 7650000,
    variation: 1650000,
    dateInventaire: '2024-12-31',
    exercice: '2024'
  },
  {
    id: '4',
    designation: 'Fournitures - Type D',
    categorie: 'Fournitures',
    unite: 'Lots',
    stockInitial: 25,
    prixUnitaireInitial: 20000,
    valeurInitiale: 500000,
    stockFinal: 15,
    prixUnitaireFinal: 22000,
    valeurFinale: 330000,
    variation: -170000,
    dateInventaire: '2024-12-31',
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

export function Stocks() {
  const [stocks, setStocks] = useState<Stock[]>(mockStocks);
  const [inventaires, setInventaires] = useState<InventaireStock[]>(mockInventaires);
  const [selectedExercice, setSelectedExercice] = useState('2024');
  const [filteredStocks, setFilteredStocks] = useState<Stock[]>(mockStocks);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [newStock, setNewStock] = useState({
    designation: '',
    categorie: '',
    unite: '',
    stockInitial: '',
    prixUnitaireInitial: '',
    stockFinal: '',
    prixUnitaireFinal: ''
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('stocks');

  // Filtrage
  useEffect(() => {
    let filtered = stocks.filter(stock => stock.exercice === selectedExercice);
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(stock => stock.categorie === categoryFilter);
    }
    
    setFilteredStocks(filtered);
  }, [stocks, selectedExercice, categoryFilter]);

  // Ajout d'un nouveau stock
  const handleAddStock = () => {
    const valeurInitiale = parseFloat(newStock.stockInitial) * parseFloat(newStock.prixUnitaireInitial);
    const valeurFinale = parseFloat(newStock.stockFinal) * parseFloat(newStock.prixUnitaireFinal);
    const variation = valeurFinale - valeurInitiale;
    
    const nouveauStock: Stock = {
      id: (stocks.length + 1).toString(),
      designation: newStock.designation,
      categorie: newStock.categorie,
      unite: newStock.unite,
      stockInitial: parseFloat(newStock.stockInitial),
      prixUnitaireInitial: parseFloat(newStock.prixUnitaireInitial),
      valeurInitiale: valeurInitiale,
      stockFinal: parseFloat(newStock.stockFinal),
      prixUnitaireFinal: parseFloat(newStock.prixUnitaireFinal),
      valeurFinale: valeurFinale,
      variation: variation,
      dateInventaire: new Date().toISOString().split('T')[0],
      exercice: selectedExercice
    };

    setStocks([...stocks, nouveauStock]);
    setNewStock({
      designation: '',
      categorie: '',
      unite: '',
      stockInitial: '',
      prixUnitaireInitial: '',
      stockFinal: '',
      prixUnitaireFinal: ''
    });
    setIsDialogOpen(false);
  };

  // Export PDF
  const handleExportPDF = async () => {
    try {
      await exportToPDF('stocks-content', {
        filename: `stocks-${selectedExercice}.pdf`,
        orientation: 'landscape'
      });
    } catch (error) {
      console.error('Erreur export PDF:', error);
    }
  };

  // Statistiques
  const inventaireActuel = inventaires.find(inv => inv.exercice === selectedExercice);
  const totalValeurInitiale = filteredStocks.reduce((sum, stock) => sum + stock.valeurInitiale, 0);
  const totalValeurFinale = filteredStocks.reduce((sum, stock) => sum + stock.valeurFinale, 0);
  const totalVariation = filteredStocks.reduce((sum, stock) => sum + stock.variation, 0);
  const categories = [...new Set(stocks.map(stock => stock.categorie))];
  
  const stocksEnHausse = filteredStocks.filter(s => s.variation > 0).length;
  const stocksEnBaisse = filteredStocks.filter(s => s.variation < 0).length;
  const stocksStables = filteredStocks.filter(s => s.variation === 0).length;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des stocks</h1>
          <p className="mt-2 text-gray-600">
            Inventaire et variations de stocks (impact sur le résultat SMT)
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
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvel article
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Ajouter un article de stock</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="designation">Désignation</Label>
                  <Input
                    id="designation"
                    value={newStock.designation}
                    onChange={(e) => setNewStock({...newStock, designation: e.target.value})}
                    placeholder="Ex: Marchandises A"
                  />
                </div>
                <div>
                  <Label htmlFor="categorie">Catégorie</Label>
                  <Select onValueChange={(value) => setNewStock({...newStock, categorie: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Marchandises">Marchandises</SelectItem>
                      <SelectItem value="Matières premières">Matières premières</SelectItem>
                      <SelectItem value="Produits finis">Produits finis</SelectItem>
                      <SelectItem value="Fournitures">Fournitures</SelectItem>
                      <SelectItem value="Emballages">Emballages</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="unite">Unité</Label>
                  <Input
                    id="unite"
                    value={newStock.unite}
                    onChange={(e) => setNewStock({...newStock, unite: e.target.value})}
                    placeholder="Ex: Pièces, Kg, Litres"
                  />
                </div>
                <div></div>
                <div className="col-span-2">
                  <h4 className="font-medium mb-2">Stock initial (début d'exercice)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="stockInitial">Quantité</Label>
                      <Input
                        id="stockInitial"
                        type="number"
                        value={newStock.stockInitial}
                        onChange={(e) => setNewStock({...newStock, stockInitial: e.target.value})}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="prixUnitaireInitial">Prix unitaire (MGA)</Label>
                      <Input
                        id="prixUnitaireInitial"
                        type="number"
                        value={newStock.prixUnitaireInitial}
                        onChange={(e) => setNewStock({...newStock, prixUnitaireInitial: e.target.value})}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
                <div className="col-span-2">
                  <h4 className="font-medium mb-2">Stock final (fin d'exercice)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="stockFinal">Quantité</Label>
                      <Input
                        id="stockFinal"
                        type="number"
                        value={newStock.stockFinal}
                        onChange={(e) => setNewStock({...newStock, stockFinal: e.target.value})}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="prixUnitaireFinal">Prix unitaire (MGA)</Label>
                      <Input
                        id="prixUnitaireFinal"
                        type="number"
                        value={newStock.prixUnitaireFinal}
                        onChange={(e) => setNewStock({...newStock, prixUnitaireFinal: e.target.value})}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
                <div className="col-span-2">
                  <Button onClick={handleAddStock} className="w-full">
                    Ajouter
                  </Button>
                </div>
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
                <p className="text-sm text-gray-600">Stock initial</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalValeurInitiale)}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Stock final</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalValeurFinale)}</p>
              </div>
              <Package className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Variation</p>
                <p className={`text-2xl font-bold ${
                  totalVariation >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(totalVariation)}
                </p>
              </div>
              {totalVariation >= 0 ? 
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
                <p className="text-sm text-gray-600">Articles</p>
                <p className="text-2xl font-bold text-gray-700">{filteredStocks.length}</p>
              </div>
              <Calculator className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="stocks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="stocks">Détail des stocks</TabsTrigger>
          <TabsTrigger value="impact">Impact sur résultat</TabsTrigger>
          <TabsTrigger value="historique">Historique</TabsTrigger>
        </TabsList>

        {/* Détail des stocks */}
        <TabsContent value="stocks">
          {/* Filtres */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
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
                <div className="flex items-end">
                  <div className="text-sm text-gray-600">
                    <div>En hausse: <Badge variant="default">{stocksEnHausse}</Badge></div>
                    <div>En baisse: <Badge variant="destructive">{stocksEnBaisse}</Badge></div>
                    <div>Stables: <Badge variant="secondary">{stocksStables}</Badge></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inventaire des stocks - Exercice {selectedExercice}</CardTitle>
            </CardHeader>
            <CardContent>
              <div id="stocks-content">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Désignation</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Unité</TableHead>
                      <TableHead className="text-center">Qty Initial</TableHead>
                      <TableHead className="text-right">Prix Unit. Init.</TableHead>
                      <TableHead className="text-right">Valeur Init.</TableHead>
                      <TableHead className="text-center">Qty Final</TableHead>
                      <TableHead className="text-right">Prix Unit. Final</TableHead>
                      <TableHead className="text-right">Valeur Finale</TableHead>
                      <TableHead className="text-right">Variation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStocks.map((stock) => (
                      <TableRow key={stock.id}>
                        <TableCell className="font-medium">{stock.designation}</TableCell>
                        <TableCell>{stock.categorie}</TableCell>
                        <TableCell>{stock.unite}</TableCell>
                        <TableCell className="text-center">{stock.stockInitial}</TableCell>
                        <TableCell className="text-right">{formatCurrency(stock.prixUnitaireInitial)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(stock.valeurInitiale)}</TableCell>
                        <TableCell className="text-center">{stock.stockFinal}</TableCell>
                        <TableCell className="text-right">{formatCurrency(stock.prixUnitaireFinal)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(stock.valeurFinale)}</TableCell>
                        <TableCell className={`text-right font-medium ${
                          stock.variation >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {stock.variation >= 0 ? '+' : ''}{formatCurrency(stock.variation)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="border-t-2 font-bold">
                      <TableCell colSpan={5}>TOTAUX</TableCell>
                      <TableCell className="text-right">{formatCurrency(totalValeurInitiale)}</TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell className="text-right">{formatCurrency(totalValeurFinale)}</TableCell>
                      <TableCell className={`text-right ${
                        totalVariation >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {totalVariation >= 0 ? '+' : ''}{formatCurrency(totalVariation)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Impact sur résultat */}
        <TabsContent value="impact">
          <Card>
            <CardHeader>
              <CardTitle>Impact des variations de stocks sur le résultat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Principe comptable SMT</h3>
                  <p className="text-sm text-blue-800">
                    Les variations de stocks sont intégrées au compte de résultat pour corriger les achats et ventes de la période.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-green-900 mb-2">Augmentation des stocks</h4>
                      <p className="text-2xl font-bold text-green-600 mb-2">
                        +{formatCurrency(Math.max(0, totalVariation))}
                      </p>
                      <p className="text-sm text-green-800">
                        Améliore le résultat (produit supplémentaire)
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-red-50 border-red-200">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-red-900 mb-2">Diminution des stocks</h4>
                      <p className="text-2xl font-bold text-red-600 mb-2">
                        {formatCurrency(Math.min(0, totalVariation))}
                      </p>
                      <p className="text-sm text-red-800">
                        Réduit le résultat (charge supplémentaire)
                      </p>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-4">Détail par catégorie</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Catégorie</TableHead>
                        <TableHead className="text-right">Stock initial</TableHead>
                        <TableHead className="text-right">Stock final</TableHead>
                        <TableHead className="text-right">Variation</TableHead>
                        <TableHead className="text-center">Impact</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map(categorie => {
                        const stocksCategorie = filteredStocks.filter(s => s.categorie === categorie);
                        const initiale = stocksCategorie.reduce((sum, s) => sum + s.valeurInitiale, 0);
                        const finale = stocksCategorie.reduce((sum, s) => sum + s.valeurFinale, 0);
                        const variation = finale - initiale;
                        
                        return (
                          <TableRow key={categorie}>
                            <TableCell className="font-medium">{categorie}</TableCell>
                            <TableCell className="text-right">{formatCurrency(initiale)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(finale)}</TableCell>
                            <TableCell className={`text-right font-medium ${
                              variation >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {variation >= 0 ? '+' : ''}{formatCurrency(variation)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={variation >= 0 ? 'default' : 'destructive'}>
                                {variation >= 0 ? 'Positif' : 'Négatif'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Historique */}
        <TabsContent value="historique">
          <Card>
            <CardHeader>
              <CardTitle>Historique des inventaires</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exercice</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>Date inventaire</TableHead>
                    <TableHead className="text-right">Stock initial</TableHead>
                    <TableHead className="text-right">Stock final</TableHead>
                    <TableHead className="text-right">Variation</TableHead>
                    <TableHead className="text-center">Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventaires.map((inv) => (
                    <TableRow key={inv.exercice}>
                      <TableCell className="font-medium">{inv.exercice}</TableCell>
                      <TableCell>
                        {new Date(inv.dateDebut).toLocaleDateString('fr-FR')} - {new Date(inv.dateFin).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>{new Date(inv.dateInventaire).toLocaleDateString('fr-FR')}</TableCell>
                      <TableCell className="text-right">{formatCurrency(inv.stocksInitial)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(inv.stocksFinal)}</TableCell>
                      <TableCell className={`text-right font-medium ${
                        inv.variation >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {inv.variation >= 0 ? '+' : ''}{formatCurrency(inv.variation)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={
                          inv.statut === 'valide' ? 'default' :
                          inv.statut === 'ouvert' ? 'secondary' : 'outline'
                        }>
                          {inv.statut === 'valide' ? 'Validé' :
                           inv.statut === 'ouvert' ? 'Ouvert' : 'Clôturé'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Information OHADA */}
      <Card className="bg-orange-50 border-orange-200">
        <CardHeader>
          <CardTitle className="text-orange-900">Règles SMT - Stocks</CardTitle>
        </CardHeader>
        <CardContent className="text-orange-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Obligation d'inventaire :</h4>
              <ul className="text-sm space-y-1">
                <li>• Inventaire physique annuel obligatoire</li>
                <li>• Évaluation au coût d'achat ou de production</li>
                <li>• Correction des encaissements/décaissements</li>
                <li>• Intégration au compte de résultat</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Méthodes autorisées :</h4>
              <ul className="text-sm space-y-1">
                <li>• Méthode du premier entré, premier sorti (PEPS)</li>
                <li>• Coût moyen pondéré</li>
                <li>• Valeur de réalisation nette si inférieure</li>
                <li>• Documentation des dépréciations</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
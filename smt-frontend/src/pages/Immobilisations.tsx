import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building, 
  Plus, 
  Calculator, 
  TrendingDown, 
  Download,
  FileText,
  Loader2
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Immobilisation {
  _id: string;
  designation?: string;
  name?: string;
  dateAcquisition?: string;
  acquisitionDate?: string;
  purchaseDate?: string;
  valeurOriginale?: number;
  purchaseAmount?: number;
  dureeAmortissement?: number;
  duration?: number;
  tauxAmortissement?: number;
  amortisationRate?: number;
  amortissementCumule?: number;
  valeurNette?: number;
  categorie?: string;
  category?: string;
  statut?: 'active' | 'cedee' | 'obsolete';
  status?: 'active' | 'cedee' | 'obsolete';
  dateCession?: string;
  prixCession?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Configuration de l'API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Fonction pour obtenir les headers avec ou sans authentification
const getHeaders = (includeAuth: boolean = true) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    // Utiliser la même clé que dans le reste de l'application
    const token = localStorage.getItem('smt-token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

// Service API pour les immobilisations
const immobilisationService = {
  // Récupérer toutes les immobilisations
  getAll: async (): Promise<Immobilisation[]> => {
    try {
      // Première tentative avec authentification
      let response = await fetch(`${API_BASE_URL}/immobilisations`, {
        method: 'GET',
        headers: getHeaders(true)
      });
      
      // Si échec d'authentification, essayer sans token
      if (response.status === 401) {
        console.warn('Tentative sans authentification...');
        response = await fetch(`${API_BASE_URL}/immobilisations`, {
          method: 'GET',
          headers: getHeaders(false)
        });
      }
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data || data.immobilisations || data || []; // Adaptez selon la structure de votre réponse
    } catch (error) {
      console.error('Erreur lors de la récupération des immobilisations:', error);
      throw error;
    }
  },

  // Créer une nouvelle immobilisation
  create: async (immobilisation: Partial<Immobilisation>): Promise<Immobilisation> => {
    try {
      let response = await fetch(`${API_BASE_URL}/immobilisations`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify(immobilisation)
      });
      
      // Si échec d'authentification, essayer sans token
      if (response.status === 401) {
        response = await fetch(`${API_BASE_URL}/immobilisations`, {
          method: 'POST',
          headers: getHeaders(false),
          body: JSON.stringify(immobilisation)
        });
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => response.text());
        console.error('Détails de l\'erreur:', errorData);
        throw new Error(`Erreur HTTP: ${response.status} - ${JSON.stringify(errorData)}`);
      }
      
      const data = await response.json();
      return data.data || data.immobilisation || data;
    } catch (error) {
      console.error('Erreur lors de la création de l\'immobilisation:', error);
      throw error;
    }
  },

  // Mettre à jour une immobilisation
  update: async (id: string, immobilisation: Partial<Immobilisation>): Promise<Immobilisation> => {
    try {
      let response = await fetch(`${API_BASE_URL}/immobilisations/${id}`, {
        method: 'PUT',
        headers: getHeaders(true),
        body: JSON.stringify(immobilisation)
      });
      
      if (response.status === 401) {
        response = await fetch(`${API_BASE_URL}/immobilisations/${id}`, {
          method: 'PUT',
          headers: getHeaders(false),
          body: JSON.stringify(immobilisation)
        });
      }
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'immobilisation:', error);
      throw error;
    }
  },

  // Supprimer une immobilisation
  delete: async (id: string): Promise<void> => {
    try {
      let response = await fetch(`${API_BASE_URL}/immobilisations/${id}`, {
        method: 'DELETE',
        headers: getHeaders(true)
      });
      
      if (response.status === 401) {
        response = await fetch(`${API_BASE_URL}/immobilisations/${id}`, {
          method: 'DELETE',
          headers: getHeaders(false)
        });
      }
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'immobilisation:', error);
      throw error;
    }
  }
};

// Hook personnalisé pour gérer les immobilisations
const useImmobilisations = () => {
  const [immobilisations, setImmobilisations] = useState<Immobilisation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les immobilisations
  const fetchImmobilisations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await immobilisationService.getAll();
      setImmobilisations(data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des immobilisations');
    } finally {
      setLoading(false);
    }
  };

  // Créer une immobilisation
  const createImmobilisation = async (data: Partial<Immobilisation>) => {
    try {
      const newImmobilisation = await immobilisationService.create(data);
      setImmobilisations(prev => [...prev, newImmobilisation]);
      return newImmobilisation;
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création');
      throw err;
    }
  };

  // Mettre à jour une immobilisation
  const updateImmobilisation = async (id: string, data: Partial<Immobilisation>) => {
    try {
      const updatedImmobilisation = await immobilisationService.update(id, data);
      setImmobilisations(prev => 
        prev.map(item => item._id === id ? updatedImmobilisation : item)
      );
      return updatedImmobilisation;
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour');
      throw err;
    }
  };

  // Supprimer une immobilisation
  const deleteImmobilisation = async (id: string) => {
    try {
      await immobilisationService.delete(id);
      setImmobilisations(prev => prev.filter(item => item._id !== id));
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression');
      throw err;
    }
  };

  // Charger les données au montage du composant
  useEffect(() => {
    fetchImmobilisations();
  }, []);

  return {
    immobilisations,
    loading,
    error,
    fetchImmobilisations,
    createImmobilisation,
    updateImmobilisation,
    deleteImmobilisation
  };
};

// Formatage des montants
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' MGA';
}

export function Immobilisations() {
  const { immobilisations, loading, error, createImmobilisation, fetchImmobilisations } = useImmobilisations();
  const [filteredImmos, setFilteredImmos] = useState<Immobilisation[]>([]);
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calcul automatique de l'amortissement
  const calculateAmortissement = (immo: Immobilisation) => {
    const dateAcq = new Date(immo.dateAcquisition || immo.acquisitionDate || immo.purchaseDate || '');
    const today = new Date();
    const moisEcoules = (today.getFullYear() - dateAcq.getFullYear()) * 12 + (today.getMonth() - dateAcq.getMonth());
    const anneesEcoulees = Math.max(0, moisEcoules / 12);
    
    const valeurOriginale = immo.valeurOriginale || immo.purchaseAmount || 0;
    const tauxAmortissement = immo.tauxAmortissement || immo.amortisationRate || 0;
    
    const amortissementAnnuel = valeurOriginale * (tauxAmortissement / 100);
    const amortissementCumule = Math.min(amortissementAnnuel * anneesEcoulees, valeurOriginale);
    const valeurNette = valeurOriginale - amortissementCumule;
    
    return {
      amortissementCumule: Math.round(amortissementCumule),
      valeurNette: Math.round(valeurNette)
    };
  };

  // Filtrage
  useEffect(() => {
    if (!immobilisations || !Array.isArray(immobilisations)) {
      setFilteredImmos([]);
      return;
    }
    
    let filtered = immobilisations;
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(immo => 
        (immo.statut || immo.status) === statusFilter
      );
    }
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(immo => 
        (immo.categorie || immo.category) === categoryFilter
      );
    }
    
    setFilteredImmos(filtered);
  }, [immobilisations, statusFilter, categoryFilter]);

  // Ajout d'une nouvelle immobilisation
  const handleAddImmobilisation = async () => {
    if (parseFloat(newImmo.valeurOriginale) < 500000) {
      alert('Seules les immobilisations > 500 000 MGA sont enregistrées dans le SMT');
      return;
    }

    if (!newImmo.designation || !newImmo.categorie || !newImmo.dateAcquisition || !newImmo.valeurOriginale || !newImmo.dureeAmortissement) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const tauxAmortissement = 100 / parseFloat(newImmo.dureeAmortissement);

    try {
      setIsSubmitting(true);
      const valeurOriginale = parseFloat(newImmo.valeurOriginale);
      const dureeAmortissement = parseFloat(newImmo.dureeAmortissement);
      const tauxAmortissement = 100 / dureeAmortissement;
      
      const immobilisationData = {
        name: newImmo.designation,
        purchaseDate: newImmo.dateAcquisition,
        purchaseAmount: valeurOriginale,
        duration: dureeAmortissement,
        category: newImmo.categorie,
        amortisationRate: tauxAmortissement,
        currentValue: valeurOriginale,
        status: 'en_service'
      };
      
      console.log('Données envoyées:', immobilisationData);
      
      await createImmobilisation(immobilisationData);
      
      setNewImmo({
        designation: '',
        dateAcquisition: '',
        valeurOriginale: '',
        dureeAmortissement: '',
        categorie: ''
      });
      
      setIsDialogOpen(false);
    } catch (err) {
      console.error('Erreur lors de l\'ajout de l\'immobilisation:', err);
      alert('Erreur lors de l\'ajout de l\'immobilisation');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export PDF (fonction à implémenter selon vos besoins)
  const handleExportPDF = async () => {
    try {
      console.log('Export PDF - à implémenter selon vos besoins');
      alert('Export PDF - fonctionnalité à implémenter');
    } catch (error) {
      console.error('Erreur export PDF:', error);
    }
  };

  // Calcul des statistiques
  const adaptedImmobilisations = filteredImmos.map(immo => {
    const calculs = calculateAmortissement(immo);
    return {
      ...immo,
      id: immo._id, // Utilisation de _id MongoDB comme id
      designation: immo.designation || immo.name || '',
      dateAcquisition: immo.dateAcquisition || immo.acquisitionDate || immo.purchaseDate || '',
      valeurOriginale: immo.valeurOriginale || immo.purchaseAmount || 0,
      dureeAmortissement: immo.dureeAmortissement || immo.duration || 0,
      tauxAmortissement: immo.tauxAmortissement || immo.amortisationRate || 0,
      amortissementCumule: calculs.amortissementCumule,
      valeurNette: calculs.valeurNette,
      categorie: immo.categorie || immo.category || '',
      statut: immo.statut || immo.status || 'active'
    };
  });

  const totalValeurOriginale = adaptedImmobilisations.reduce((sum, immo) => sum + (immo.valeurOriginale || 0), 0);
  const totalAmortissement = adaptedImmobilisations.reduce((sum, immo) => sum + (immo.amortissementCumule || 0), 0);
  const totalValeurNette = adaptedImmobilisations.reduce((sum, immo) => sum + (immo.valeurNette || 0), 0);
  const categories = [...new Set(immobilisations?.map(immo => immo.categorie || immo.category).filter(Boolean) || [])];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement des immobilisations...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-500">
        <p className="text-lg font-semibold mb-2">Erreur de chargement</p>
        <p className="text-sm mb-4">{error}</p>
        <Button onClick={fetchImmobilisations} variant="outline">
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
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
                  <Label htmlFor="designation">Désignation *</Label>
                  <Input
                    id="designation"
                    value={newImmo.designation}
                    onChange={(e) => setNewImmo({...newImmo, designation: e.target.value})}
                    placeholder="Ex: Véhicule, Ordinateur..."
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="categorie">Catégorie *</Label>
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
                  <Label htmlFor="dateAcquisition">Date d'acquisition *</Label>
                  <Input
                    id="dateAcquisition"
                    type="date"
                    value={newImmo.dateAcquisition}
                    onChange={(e) => setNewImmo({...newImmo, dateAcquisition: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="valeurOriginale">Valeur d'acquisition (MGA) *</Label>
                  <Input
                    id="valeurOriginale"
                    type="number"
                    min="500000"
                    value={newImmo.valeurOriginale}
                    onChange={(e) => setNewImmo({...newImmo, valeurOriginale: e.target.value})}
                    placeholder="Minimum 500 000 MGA"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="dureeAmortissement">Durée d'amortissement (années) *</Label>
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
                <Button 
                  onClick={handleAddImmobilisation} 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Ajout en cours...
                    </>
                  ) : (
                    'Ajouter'
                  )}
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
          <CardTitle>Liste des immobilisations ({adaptedImmobilisations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {adaptedImmobilisations.length === 0 ? (
            <div className="text-center py-8">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucune immobilisation trouvée</p>
              <p className="text-sm text-gray-400 mt-2">
                {statusFilter !== 'all' || categoryFilter !== 'all' 
                  ? 'Essayez de modifier les filtres' 
                  : 'Ajoutez votre première immobilisation'}
              </p>
            </div>
          ) : (
            <div id="immobilisations-content" className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">Désignation</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Catégorie</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Date acquisition</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">Valeur originale</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Durée (ans)</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">Amortissement</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">Valeur nette</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {adaptedImmobilisations.map((immo) => (
                    <tr key={immo.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-medium">{immo.designation}</td>
                      <td className="border border-gray-300 px-4 py-2">{immo.categorie}</td>
                      <td className="border border-gray-300 px-4 py-2">
                        {immo.dateAcquisition ? 
                          new Date(immo.dateAcquisition).toLocaleDateString('fr-FR') : 
                          'N/A'
                        }
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(immo.valeurOriginale || 0)}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{immo.dureeAmortissement || 0}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(immo.amortissementCumule || 0)}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right font-medium">{formatCurrency(immo.valeurNette || 0)}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        <Badge variant={
                          immo.statut === 'active' ? 'default' :
                          immo.statut === 'cedee' ? 'secondary' : 'destructive'
                        }>
                          {immo.statut === 'active' ? 'Active' :
                           immo.statut === 'cedee' ? 'Cédée' : 'Obsolète'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
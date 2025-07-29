import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Download, FileText, BarChart3, PieChart, Table as TableIcon } from 'lucide-react';
import { useReports } from '@/hooks/useSMT';
import { exportToPDF, generateIncomeStatementPDF, generateBalanceSheetPDF } from '@/utils/exportUtils';

// Formatage des montants
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' MGA';
}

export function Reports() {
  const [dateFrom, setDateFrom] = useState('2024-01-01');
  const [dateTo, setDateTo] = useState('2024-12-31');
  const [compteResultat, setCompteResultat] = useState<any>(null);
  const [bilan, setBilan] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const { getCompteResultat, getBilan } = useReports();

  // Fonctions d'export PDF
  const handleExportIncomeStatementPDF = async () => {
    if (!compteResultat) return;
    try {
      await exportToPDF('compte-resultat-content', {
        filename: `compte-resultat-${dateFrom}-${dateTo}.pdf`,
        orientation: 'portrait'
      });
    } catch (error) {
      console.error('Erreur export PDF:', error);
    }
  };

  const handleExportBalanceSheetPDF = async () => {
    if (!bilan) return;
    try {
      await exportToPDF('bilan-content', {
        filename: `bilan-${dateTo}.pdf`,
        orientation: 'portrait'
      });
    } catch (error) {
      console.error('Erreur export PDF:', error);
    }
  };

  const handleGenerateCompteResultat = async () => {
    setLoading(true);
    try {
      const data = await getCompteResultat(dateFrom, dateTo);
      setCompteResultat(data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBilan = async () => {
    setLoading(true);
    try {
      const data = await getBilan();
      setBilan(data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">États financiers</h1>
          <p className="mt-2 text-gray-600">
            Rapports et analyses conformes aux normes OHADA
          </p>
        </div>
      </div>

      {/* Paramètres de période */}
      <Card>
        <CardHeader>
          <CardTitle>Paramètres des rapports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Date début</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Date fin</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleGenerateCompteResultat} disabled={loading}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Compte de résultat
              </Button>
              <Button onClick={handleGenerateBilan} disabled={loading} variant="outline">
                <PieChart className="h-4 w-4 mr-2" />
                Bilan
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Onglets des rapports */}
      <Tabs defaultValue="compte-resultat" className="space-y-4">
        <TabsList>
          <TabsTrigger value="compte-resultat">Compte de résultat</TabsTrigger>
          <TabsTrigger value="bilan">Bilan</TabsTrigger>
          <TabsTrigger value="variation-avoir">Variation de l'avoir</TabsTrigger>
        </TabsList>

        {/* Compte de résultat */}
        <TabsContent value="compte-resultat">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Compte de résultat SMT</CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={!compteResultat}>
                    <Download className="h-4 w-4 mr-2" />
                    Exporter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportIncomeStatementPDF}>
                    <FileText className="h-4 w-4 mr-2" />
                    Télécharger PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              {compteResultat ? (
                <div id="compte-resultat-content" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Recettes */}
                    <div>
                      <h3 className="text-lg font-semibold text-green-600 mb-4">RECETTES</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Catégorie</TableHead>
                            <TableHead className="text-right">Montant</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {compteResultat.recettes.map((item: any) => (
                            <TableRow key={item.category}>
                              <TableCell>{item.category}</TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(item.amount)}
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="border-t-2">
                            <TableCell className="font-bold">TOTAL RECETTES</TableCell>
                            <TableCell className="text-right font-bold text-green-600">
                              {formatCurrency(compteResultat.totalRecettes)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>

                    {/* Dépenses */}
                    <div>
                      <h3 className="text-lg font-semibold text-red-600 mb-4">DÉPENSES</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Catégorie</TableHead>
                            <TableHead className="text-right">Montant</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {compteResultat.depenses.map((item: any) => (
                            <TableRow key={item.category}>
                              <TableCell>{item.category}</TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(item.amount)}
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="border-t-2">
                            <TableCell className="font-bold">TOTAL DÉPENSES</TableCell>
                            <TableCell className="text-right font-bold text-red-600">
                              {formatCurrency(compteResultat.totalDepenses)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Résultat */}
                  <div className="border-t-2 pt-4">
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <span className="text-xl font-bold">RÉSULTAT DE L'EXERCICE</span>
                      <span className={`text-2xl font-bold ${
                        compteResultat.resultat >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(compteResultat.resultat)}
                      </span>
                    </div>
                    <div className="mt-2 text-center">
                      <Badge variant={compteResultat.resultat >= 0 ? 'default' : 'destructive'}>
                        {compteResultat.resultat >= 0 ? 'BÉNÉFICE' : 'PERTE'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Cliquez sur "Compte de résultat" pour générer le rapport</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bilan */}
        <TabsContent value="bilan">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Bilan SMT</CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={!bilan}>
                    <Download className="h-4 w-4 mr-2" />
                    Exporter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportBalanceSheetPDF}>
                    <FileText className="h-4 w-4 mr-2" />
                    Télécharger PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              {bilan ? (
                <div id="bilan-content" className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Actif */}
                  <div>
                    <h3 className="text-lg font-semibold text-blue-600 mb-4">ACTIF</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Éléments</TableHead>
                          <TableHead className="text-right">Montant</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bilan.actif.map((item: any) => (
                          <TableRow key={item.category}>
                            <TableCell>{item.category}</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(item.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="border-t-2">
                          <TableCell className="font-bold">TOTAL ACTIF</TableCell>
                          <TableCell className="text-right font-bold text-blue-600">
                            {formatCurrency(bilan.totalActif)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Passif */}
                  <div>
                    <h3 className="text-lg font-semibold text-purple-600 mb-4">PASSIF</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Éléments</TableHead>
                          <TableHead className="text-right">Montant</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bilan.passif.map((item: any) => (
                          <TableRow key={item.category}>
                            <TableCell>{item.category}</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(item.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="border-t-2">
                          <TableCell className="font-bold">TOTAL PASSIF</TableCell>
                          <TableCell className="text-right font-bold text-purple-600">
                            {formatCurrency(bilan.totalPassif)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <PieChart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Cliquez sur "Bilan" pour générer le rapport</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Variation de l'avoir */}
        <TabsContent value="variation-avoir">
          <Card>
            <CardHeader>
              <CardTitle>Variation de l'avoir net</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Fonctionnalité en cours de développement</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Information OHADA */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">États financiers OHADA</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">États obligatoires SMT :</h4>
              <ul className="text-sm space-y-1">
                <li>• Compte de résultat</li>
                <li>• Bilan simplifié</li>
                <li>• Variation de l'avoir net</li>
                <li>• État des créances et dettes</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Fréquence :</h4>
              <ul className="text-sm space-y-1">
                <li>• Établissement annuel obligatoire</li>
                <li>• Consultation mensuelle recommandée</li>
                <li>• Conservation 10 ans minimum</li>
                <li>• Dépôt au greffe si requis</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  Banknote,
  Plus,
  Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDashboardStats } from '@/hooks/useSMT';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

// Formatage des montants en MGA
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' MGA';
}

// Composant pour les cartes de statistiques
function StatCard({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: Icon,
  color = 'blue'
}: {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative';
  icon: any;
  color?: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600'
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-full ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">
          {value}
        </div>
        {change && (
          <div className="flex items-center mt-1">
            {changeType === 'positive' ? (
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
            )}
            <span className={`text-sm ${
              changeType === 'positive' ? 'text-green-600' : 'text-red-600'
            }`}>
              {change}
            </span>
            <span className="text-xs text-gray-500 ml-1">vs mois dernier</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function Dashboard() {
  const { stats, loading, error } = useDashboardStats();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-red-600">Erreur lors du chargement du tableau de bord: {error}</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="mt-2 text-gray-600">
            Vue d'ensemble de votre trésorerie et activité
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Link to="/transactions">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle transaction
            </Button>
          </Link>
          <Link to="/reports">
            <Button variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Voir les rapports
            </Button>
          </Link>
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Solde Total"
          value={formatCurrency(stats.totalBalance)}
          change="+2.1%"
          changeType="positive"
          icon={DollarSign}
          color="blue"
        />
        <StatCard
          title="Recettes du mois"
          value={formatCurrency(stats.monthlyRevenue)}
          change="+12.5%"
          changeType="positive"
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Dépenses du mois"
          value={formatCurrency(stats.monthlyExpenses)}
          change="-3.2%"
          changeType="positive"
          icon={TrendingDown}
          color="red"
        />
        <StatCard
          title="Résultat du mois"
          value={formatCurrency(stats.netResult)}
          change={stats.netResult >= 0 ? "+8.3%" : "-15.1%"}
          changeType={stats.netResult >= 0 ? "positive" : "negative"}
          icon={stats.netResult >= 0 ? TrendingUp : TrendingDown}
          color={stats.netResult >= 0 ? "green" : "red"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Graphique des recettes/dépenses */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Évolution Recettes/Dépenses</CardTitle>
            <p className="text-sm text-gray-600">6 derniers mois</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="recettes" fill="#10B981" name="Recettes" />
                <Bar dataKey="depenses" fill="#EF4444" name="Dépenses" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Transactions récentes */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Transactions récentes</CardTitle>
            <Link to="/transactions">
              <Button variant="outline" size="sm">
                Voir tout
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentTransactions.map((transaction: any) => (
                <div key={transaction.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      transaction.type === 'recette' 
                        ? 'bg-green-50 text-green-600' 
                        : 'bg-red-50 text-red-600'
                    }`}>
                      {transaction.type === 'recette' ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-48">
                        {transaction.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(transaction.date).toLocaleDateString('fr-FR')} - {transaction.category}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${
                      transaction.type === 'recette' 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {transaction.type === 'recette' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {transaction.accountId}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertes et notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Alertes & Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-1 bg-yellow-100 rounded-full">
                  <Banknote className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Seuil SMT : Attention
                  </p>
                  <p className="text-xs text-yellow-600">
                    Votre chiffre d'affaires approche des seuils OHADA
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                Important
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-1 bg-blue-100 rounded-full">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Déclaration fiscale
                  </p>
                  <p className="text-xs text-blue-600">
                    Échéance dans 15 jours - Préparez vos documents
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                À venir
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
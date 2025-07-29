import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout/Layout';
import { ProtectedRoute } from '@/components/Auth/ProtectedRoute';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { Transactions } from '@/pages/Transactions';

// Import des autres pages (à créer)
import { Accounts } from '@/pages/Accounts';
import { Books } from '@/pages/Books';
import { Reports } from '@/pages/Reports';
import { Immobilisations } from '@/pages/Immobilisations';
import { Stocks } from '@/pages/Stocks';
import { DebtsCredits } from '@/pages/DebtsCredits';
import { Documents } from '@/pages/Documents';
import { Settings } from '@/pages/Settings';
import { Profile } from '@/pages/Profile';

// Page d'erreur 404
function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <p className="text-xl text-gray-600 mt-4">Page non trouvée</p>
        <p className="text-gray-500 mt-2">La page que vous cherchez n'existe pas.</p>
        <a href="/dashboard" className="mt-6 inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
          Retour au tableau de bord
        </a>
      </div>
    </div>
  );
}

// Page d'accès non autorisé
function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">403</h1>
        <p className="text-xl text-gray-600 mt-4">Accès non autorisé</p>
        <p className="text-gray-500 mt-2">Vous n'avez pas les permissions pour accéder à cette page.</p>
        <a href="/dashboard" className="mt-6 inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
          Retour au tableau de bord
        </a>
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  // Redirection de la racine vers le dashboard
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />
  },
  
  // Page de connexion (publique)
  {
    path: '/login',
    element: <Login />
  },
  
  // Pages protégées avec layout
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Layout>
          <Dashboard />
        </Layout>
      </ProtectedRoute>
    )
  },
  {
    path: '/transactions',
    element: (
      <ProtectedRoute>
        <Layout>
          <Transactions />
        </Layout>
      </ProtectedRoute>
    )
  },
  {
    path: '/accounts',
    element: (
      <ProtectedRoute>
        <Layout>
          <Accounts />
        </Layout>
      </ProtectedRoute>
    )
  },
  {
    path: '/books',
    element: (
      <ProtectedRoute>
        <Layout>
          <Books />
        </Layout>
      </ProtectedRoute>
    )
  },
  {
    path: '/reports',
    element: (
      <ProtectedRoute>
        <Layout>
          <Reports />
        </Layout>
      </ProtectedRoute>
    )
  },
  {
    path: '/immobilisations',
    element: (
      <ProtectedRoute>
        <Layout>
          <Immobilisations />
        </Layout>
      </ProtectedRoute>
    )
  },
  {
    path: '/stocks',
    element: (
      <ProtectedRoute>
        <Layout>
          <Stocks />
        </Layout>
      </ProtectedRoute>
    )
  },
  {
    path: '/debts',
    element: (
      <ProtectedRoute>
        <Layout>
          <DebtsCredits />
        </Layout>
      </ProtectedRoute>
    )
  },
  {
    path: '/documents',
    element: (
      <ProtectedRoute>
        <Layout>
          <Documents />
        </Layout>
      </ProtectedRoute>
    )
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <Layout>
          <Profile />
        </Layout>
      </ProtectedRoute>
    )
  },
  {
    path: '/settings',
    element: (
      <ProtectedRoute requiredRole="admin">
        <Layout>
          <Settings />
        </Layout>
      </ProtectedRoute>
    )
  },
  
  // Pages d'erreur
  {
    path: '/unauthorized',
    element: <Unauthorized />
  },
  {
    path: '*',
    element: <NotFound />
  }
]);
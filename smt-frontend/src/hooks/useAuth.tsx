import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, AuthContextType } from '../types';
import { authApi } from '../services/realApi';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('smt-token');
        if (token) {
          // Vérifier si le token est valide en récupérant l'utilisateur actuel
          const currentUser = await authApi.getCurrentUser();
          setUser(currentUser);
          // Rafraîchir le token si nécessaire
          if (currentUser) {
            try {
              const { user: refreshedUser } = await authApi.refreshToken();
              // Mettre à jour l'utilisateur avec les données les plus récentes
              setUser(refreshedUser);
            } catch (refreshError) {
              console.warn('Impossible de rafraîchir le token:', refreshError);
              // Si le rafraîchissement échoue mais que l'utilisateur est toujours valide,
              // on continue avec le token actuel
            }
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'utilisateur:', error);
        // Token invalide, nettoyer le localStorage
        localStorage.removeItem('smt-token');
        localStorage.removeItem('smt-user');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const { user } = await authApi.login(email, password);
      setUser(user);
      return true;
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      setUser(null);
    }
  };

  const updateUser = async (updates: Partial<User>): Promise<void> => {
    try {
      const updatedUser = await authApi.updateProfile(updates);
      setUser(updatedUser);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
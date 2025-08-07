ealApi.ts
// Amélioration de l'intercepteur de réponse
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Gestion des erreurs spécifiques
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem('smt-token');
      localStorage.removeItem('smt-user');
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      // Accès non autorisé
      console.error('Accès non autorisé:', error.response.data.message);
    } else if (error.response?.status === 404) {
      // Ressource non trouvée
      console.error('Ressource non trouvée:', error.response.data.message);
    } else if (error.response?.status === 500) {
      // Erreur serveur
      console.error('Erreur serveur:', error.response.data.message);
    } else if (!error.response) {
      // Erreur réseau
      console.error('Erreur réseau, serveur inaccessible');
    }
    
    return Promise.reject(error);
  }
);
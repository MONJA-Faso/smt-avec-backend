# SMT Backend - API REST

Backend Express.js pour l'application SMT (Système de Management des Transactions) avec intégration MongoDB Atlas.

## 🚀 Fonctionnalités

### Modules principaux
- **Authentification & Autorisation** - JWT, gestion des rôles et permissions
- **Gestion des comptes** - Plan comptable, comptes débiteurs/créditeurs
- **Transactions** - Écritures comptables, validation, rapprochement
- **Immobilisations** - Gestion des actifs, amortissements automatiques
- **Stocks** - Inventaire, mouvements, alertes de stock faible
- **Créances & Dettes** - Suivi des paiements, échéanciers, relances
- **Documents** - Upload, gestion et archivage de documents
- **Paramètres** - Configuration entreprise, comptabilité, système
- **Rapports** - Bilan, compte de résultat, flux de trésorerie

## ⚙️ Installation

1. **Installer les dépendances**
   ```bash
   npm install
   ```

2. **Configuration de l'environnement**
   ```bash
   cp .env.example .env
   ```

3. **Configurer MongoDB Atlas** (voir section détaillée ci-dessous)

4. **Démarrer le serveur**
   ```bash
   npm run dev
   ```

## 🗄️ Configuration MongoDB Atlas

### 1. Créer un cluster
1. Aller sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Créer un compte et un nouveau cluster
3. Configurer l'accès réseau (0.0.0.0/0 pour le développement)
4. Créer un utilisateur de base de données

### 2. Chaîne de connexion
Exemple dans `.env`:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/smt-database
JWT_SECRET=your-super-secret-jwt-key
PORT=5000
```

## 📡 API Endpoints

### Authentification
- `POST /api/auth/login` - Connexion
- `POST /api/auth/register` - Inscription
- `GET /api/auth/me` - Profil utilisateur

### Comptes
- `GET /api/accounts` - Liste des comptes
- `POST /api/accounts` - Créer un compte
- `PUT /api/accounts/:id` - Modifier un compte

### Transactions
- `GET /api/transactions` - Liste des transactions
- `POST /api/transactions` - Créer une transaction
- `PUT /api/transactions/:id` - Modifier une transaction

### Stocks
- `GET /api/stocks` - Liste des articles
- `POST /api/stocks` - Créer un article
- `PUT /api/stocks/:id/quantity` - Ajuster quantité

### Rapports
- `POST /api/reports/balance-sheet` - Générer bilan
- `POST /api/reports/income-statement` - Compte de résultat

## 🔐 Authentification

Toutes les routes nécessitent un token JWT:
```
Authorization: Bearer <token>
```

## 🛠️ Intégration Frontend

Configurez l'URL de l'API dans votre frontend:

```javascript
const API_BASE_URL = 'http://localhost:5000/api';

// Exemple d'appel avec Axios
const login = async (email, password) => {
  const response = await axios.post(`${API_BASE_URL}/auth/login`, {
    email,
    password
  });
  return response.data;
};
```

## 📁 Structure du projet

```
smt-backend/
├── src/
│   ├── controllers/     # Logique métier
│   ├── models/         # Modèles MongoDB
│   ├── routes/         # Routes API
│   ├── middleware/     # Middlewares
│   └── config/         # Configuration
├── uploads/            # Fichiers uploadés
└── .env               # Variables d'environnement
```
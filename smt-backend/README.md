# SMT Backend - Système de Management des Transactions

Backend Express.js pour l'application SMT (Système de Management des Transactions) avec MongoDB Atlas.

## Fonctionnalités

- **Authentification** : JWT avec rôles (admin/user)
- **Comptes** : Gestion des comptes (caisse, banque, CCP, capital)
- **Transactions** : Gestion des recettes et dépenses
- **Immobilisations** : Gestion des biens avec amortissement
- **Stocks** : Gestion des produits et marchandises
- **Créances et Dettes** : Suivi des créances et dettes
- **Documents** : Upload et gestion de documents
- **Paramètres** : Configuration de l'entreprise
- **Rapports** : Génération de rapports comptables

## Installation

```bash
cd smt-backend
npm install
```

## Configuration

Copier `.env.example` vers `.env` et configurer les variables :

```bash
cp .env.example .env
```

## Démarrage

```bash
# Développement
npm run dev

# Production
npm start
```

## API Endpoints

- `POST /api/auth/login` - Connexion
- `GET /api/accounts` - Liste des comptes
- `GET /api/transactions` - Liste des transactions
- `GET /api/immobilisations` - Liste des immobilisations
- `GET /api/stocks` - Liste des stocks
- `GET /api/creances-dettes` - Liste des créances/dettes

## Structure du projet

```
src/
├── controllers/     # Contrôleurs API
├── models/         # Modèles MongoDB
├── routes/         # Routes Express
├── middleware/     # Middlewares
├── config/         # Configuration
├── utils/          # Utilitaires
└── services/       # Services métier
```
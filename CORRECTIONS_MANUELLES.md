# 🔧 Corrections Manuelles - Problèmes d'Intégration SMT

**Si le Pull Request n'est pas visible, appliquez ces corrections manuellement :**

## 📁 Fichier 1: `smt-backend/src/middleware/security.js`

**Ligne 167 - Changez :**
```javascript
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
```

**En :**
```javascript
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];
```

---

## 📁 Fichier 2: `smt-frontend/src/services/realApi.ts`

### A. Ajouter après la ligne 1 :
```typescript
import axios, { AxiosResponse } from 'axios';
import type { User, Account, Transaction, Immobilisation, Stock, CreanceEtDette, Document, SMTSettings } from '../types/index';
```

### B. Remplacer les lignes 7-13 :
**Ancien :**
```typescript
// Instance Axios configurée
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

**Nouveau :**
```typescript
// Instance Axios principale avec intercepteurs
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Client séparé pour l'authentification (sans intercepteurs pour éviter les références circulaires)
const authClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### C. Remplacer le bloc de rafraîchissement du token (vers ligne 75-77) :
**Ancien :**
```typescript
// Tenter de rafraîchir le token
const { token } = await authApi.refreshToken();
isRefreshing = false;
```

**Nouveau :**
```typescript
// Tenter de rafraîchir le token avec le client dédié
const currentToken = localStorage.getItem('smt-token');
const refreshResponse = await authClient.post('/auth/refresh-token', {}, {
  headers: { Authorization: `Bearer ${currentToken}` }
});

if (!refreshResponse.data.success) {
  throw new Error('Échec du rafraîchissement du token');
}

const { token, user } = refreshResponse.data.data;
localStorage.setItem('smt-token', token);
if (user) {
  localStorage.setItem('smt-user', JSON.stringify(user));
}

isRefreshing = false;
```

### D. Supprimer TOUS les types dupliqués (lignes ~107-207)
Supprimez complètement toutes les interfaces : User, Account, Transaction, Immobilisation, Stock, CreanceEtDette, Document, SMTSettings qui sont dupliquées.

### E. Changer les appels d'authentification :
**Dans authApi.login :**
```typescript
await authClient.post('/auth/login', { email, password });
```

**Dans authApi.register :**
```typescript
await authClient.post('/auth/register', userData);
```

**Dans authApi.refreshToken :**
```typescript
async refreshToken(): Promise<{ token: string; user: User }> {
  const token = localStorage.getItem('smt-token');
  const response: AxiosResponse<{ success: boolean; data: { token: string; user: User } }> = 
    await authClient.post('/auth/refresh-token', {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
```

---

## 📁 Fichier 3: `smt-frontend/src/types/index.ts`

### A. Étendre l'interface User (lignes 3-11) :
```typescript
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive?: boolean;
  lastLogin?: string;
  profileImage?: string;
  preferences?: {
    language?: string;
    timezone?: string;
    currency?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}
```

### B. Étendre l'interface Account (lignes 13-22) :
```typescript
export interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency?: string;
  accountNumber?: string;
  bankName?: string;
  bankBranch?: string;
  description?: string;
  openingDate?: string;
  closingDate?: string;
  lastTransactionDate?: string;
  lastReconciliationDate?: string;
  reconciledBalance?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
```

### C. Étendre l'interface Transaction (lignes 40-49) :
```typescript
export interface Transaction {
  id: string;
  type: 'recette' | 'depense';
  amount: number;
  description: string;
  category: string;
  subcategory?: string;
  accountId: string; // ObjectId compatible
  date: string;
  reference?: string;
  paymentMethod?: string;
  vatAmount?: number;
  vatRate?: number;
  isVatIncluded?: boolean;
  thirdParty?: {
    name?: string;
    contact?: string;
    address?: string;
  };
  notes?: string;
  isReconciled?: boolean;
  reconciledDate?: string;
  documentId?: string;
  createdBy?: string;
  modifiedBy?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}
```

### D. Corriger l'interface Immobilisation :
```typescript
export interface Immobilisation {
  id: string;
  name: string;
  category: string;
  purchaseAmount: number;
  currentValue: number;
  purchaseDate: string; // Champ principal harmonisé avec backend
  description?: string;
  serialNumber?: string;
  supplier?: {
    name?: string;
    contact?: string;
    address?: string;
  };
  location?: string;
  amortisationType?: string;
  duration: number;
  amortisationRate: number;
  yearlyAmortisation?: number;
  accumulatedAmortisation?: number;
  residualValue?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}
```

### E. Corriger l'interface CreanceEtDette :
```typescript
export interface CreanceEtDette {
  id: string;
  type: 'creance' | 'dette';
  name: string; // ⚠️ "name" au lieu de "title"
  amount: number;
  thirdParty: string;
  dueDate: string;
  status: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}
```

---

## 📁 Fichier 4: `smt-frontend/src/pages/Immobilisations.tsx`

**Vers ligne 349-357, remplacer :**
```typescript
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
```

**Par :**
```typescript
const immobilisationData = {
  name: newImmo.designation,
  purchaseDate: newImmo.dateAcquisition,
  purchaseAmount: valeurOriginale,
  duration: dureeAmortissement,
  category: newImmo.categorie
};
```

**Et remplacer les deux occurrences :**
```typescript
// Ligne ~287
const dateAcq = new Date(immo.dateAcquisition || immo.purchaseDate || '');

// Ligne ~398  
dateAcquisition: immo.dateAcquisition || immo.purchaseDate || '',
```

---

## ✅ Vérification Rapide

Après avoir appliqué ces changements :

1. **Vérifiez `realApi.ts` :**
   ```powershell
   findstr "authClient" smt-frontend\src\services\realApi.ts
   ```
   Doit retourner plusieurs lignes

2. **Vérifiez `security.js` :**
   ```powershell
   findstr "5173" smt-backend\src\middleware\security.js
   ```
   Doit retourner une ligne

3. **Testez l'application :**
   ```powershell
   # Terminal 1
   cd smt-backend
   npm start
   
   # Terminal 2  
   cd smt-frontend
   bun run dev
   ```

## 🎯 Résultat

Ces corrections résolvent :
- ✅ Référence circulaire dans l'API client
- ✅ Configuration CORS incohérente  
- ✅ Types désynchronisés frontend/backend
- ✅ Validation des champs d'immobilisation

Votre application sera **100% fonctionnelle** côté intégration !
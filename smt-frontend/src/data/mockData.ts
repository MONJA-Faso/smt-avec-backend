// Types pour l'application SMT
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

export interface Account {
  id: string;
  name: string;
  type: 'caisse' | 'banque' | 'ccp' | 'capital';
  balance: number;
  currency: string;
}

export interface Transaction {
  id: string;
  date: string;
  type: 'recette' | 'depense';
  amount: number;
  description: string;
  accountId: string;
  category: string;
  subcategory?: string;
  reference?: string;
  documentId?: string;
}

export interface Immobilisation {
  id: string;
  name: string;
  purchaseDate: string;
  purchaseAmount: number;
  duration: number; // en années
  currentValue: number;
  amortisationRate: number;
  category: string;
}

export interface Stock {
  id: string;
  name: string;
  category: 'produits' | 'marchandises' | 'matieres_premieres';
  quantity: number;
  unitPrice: number;
  totalValue: number;
  date: string;
}

export interface CreanceEtDette {
  id: string;
  type: 'creance' | 'dette';
  name: string;
  amount: number;
  date: string;
  dueDate: string;
  status: 'en_cours' | 'regle' | 'en_retard';
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  transactionId?: string;
  uploadDate: string;
  url: string;
}

export interface SMTSettings {
  seuils: {
    seuil30M: number;
    seuil20M: number;
    seuil10M: number;
  };
  exercice: {
    dateDebut: string;
    dateFin: string;
  };
  tva: {
    taux: number;
    incluse: boolean;
  };
  entreprise: {
    nom: string;
    adresse: string;
    telephone: string;
    email: string;
  };
}

// Données mock
export const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@smt.com',
    name: 'Administrateur SMT',
    role: 'admin'
  },
  {
    id: '2',
    email: 'user@smt.com',
    name: 'Utilisateur SMT',
    role: 'user'
  }
];

export const mockAccounts: Account[] = [
  {
    id: 'caisse',
    name: 'Caisse',
    type: 'caisse',
    balance: 2500000,
    currency: 'MGA'
  },
  {
    id: 'banque',
    name: 'Banque Principale',
    type: 'banque',
    balance: 15750000,
    currency: 'MGA'
  },
  {
    id: 'ccp',
    name: 'Compte Postal',
    type: 'ccp',
    balance: 500000,
    currency: 'MGA'
  },
  {
    id: 'capital',
    name: 'Capital Social',
    type: 'capital',
    balance: 5000000,
    currency: 'MGA'
  }
];

export const mockTransactions: Transaction[] = [
  {
    id: '1',
    date: '2024-01-15',
    type: 'recette',
    amount: 1250000,
    description: 'Vente de marchandises - Client ABC',
    accountId: 'banque',
    category: 'Ventes',
    subcategory: 'Marchandises',
    reference: 'VT-2024-001'
  },
  {
    id: '2',
    date: '2024-01-16',
    type: 'depense',
    amount: 350000,
    description: 'Achat fournitures bureau',
    accountId: 'caisse',
    category: 'Charges',
    subcategory: 'Fournitures',
    reference: 'AC-2024-001'
  },
  {
    id: '3',
    date: '2024-01-18',
    type: 'recette',
    amount: 2100000,
    description: 'Prestation de services - Client XYZ',
    accountId: 'banque',
    category: 'Services',
    subcategory: 'Consulting',
    reference: 'VT-2024-002'
  },
  {
    id: '4',
    date: '2024-01-20',
    type: 'depense',
    amount: 750000,
    description: 'Salaires janvier',
    accountId: 'banque',
    category: 'Personnel',
    subcategory: 'Salaires',
    reference: 'SA-2024-001'
  },
  {
    id: '5',
    date: '2024-01-22',
    type: 'depense',
    amount: 125000,
    description: 'Carburant véhicule',
    accountId: 'caisse',
    category: 'Transport',
    subcategory: 'Carburant',
    reference: 'TR-2024-001'
  }
];

export const mockImmobilisations: Immobilisation[] = [
  {
    id: '1',
    name: 'Ordinateur Dell',
    purchaseDate: '2023-01-15',
    purchaseAmount: 750000,
    duration: 3,
    currentValue: 500000,
    amortisationRate: 33.33,
    category: 'Matériel informatique'
  },
  {
    id: '2',
    name: 'Véhicule Peugeot 208',
    purchaseDate: '2022-06-10',
    purchaseAmount: 8500000,
    duration: 5,
    currentValue: 5100000,
    amortisationRate: 20,
    category: 'Matériel de transport'
  }
];

export const mockStocks: Stock[] = [
  {
    id: '1',
    name: 'Produit A',
    category: 'produits',
    quantity: 150,
    unitPrice: 25000,
    totalValue: 3750000,
    date: '2024-01-31'
  },
  {
    id: '2',
    name: 'Marchandise B',
    category: 'marchandises',
    quantity: 75,
    unitPrice: 45000,
    totalValue: 3375000,
    date: '2024-01-31'
  }
];

export const mockCreancesEtDettes: CreanceEtDette[] = [
  {
    id: '1',
    type: 'creance',
    name: 'Client ABC SARL',
    amount: 1800000,
    date: '2024-01-10',
    dueDate: '2024-02-10',
    status: 'en_cours'
  },
  {
    id: '2',
    type: 'dette',
    name: 'Fournisseur XYZ',
    amount: 650000,
    date: '2024-01-15',
    dueDate: '2024-02-15',
    status: 'en_cours'
  },
  {
    id: '3',
    type: 'creance',
    name: 'Client DEF',
    amount: 450000,
    date: '2023-12-20',
    dueDate: '2024-01-20',
    status: 'en_retard'
  }
];

export const mockDocuments: Document[] = [
  {
    id: '1',
    name: 'Facture VT-2024-001.pdf',
    type: 'application/pdf',
    size: 245760,
    transactionId: '1',
    uploadDate: '2024-01-15',
    url: '/documents/facture-vt-2024-001.pdf'
  },
  {
    id: '2',
    name: 'Recu AC-2024-001.jpg',
    type: 'image/jpeg',
    size: 156823,
    transactionId: '2',
    uploadDate: '2024-01-16',
    url: '/documents/recu-ac-2024-001.jpg'
  }
];

export const mockSettings: SMTSettings = {
  seuils: {
    seuil30M: 30000000,
    seuil20M: 20000000,
    seuil10M: 10000000
  },
  exercice: {
    dateDebut: '2024-01-01',
    dateFin: '2024-12-31'
  },
  tva: {
    taux: 18,
    incluse: false
  },
  entreprise: {
    nom: 'Ma Petite Entreprise SARL',
    adresse: '123 Rue de la Paix, Abidjan',
    telephone: '+225 20 30 40 50',
    email: 'contact@monentreprise.ci'
  }
};

// Catégories pour les transactions
export const transactionCategories = {
  recettes: [
    { value: 'Ventes', label: 'Ventes', subcategories: ['Marchandises', 'Produits', 'Services'] },
    { value: 'Services', label: 'Prestations de services', subcategories: ['Consulting', 'Formation', 'Maintenance'] },
    { value: 'Autres', label: 'Autres recettes', subcategories: ['Subventions', 'Intérêts', 'Divers'] }
  ],
  depenses: [
    { value: 'Achats', label: 'Achats', subcategories: ['Marchandises', 'Matières premières', 'Fournitures'] },
    { value: 'Charges', label: 'Charges externes', subcategories: ['Loyer', 'Électricité', 'Fournitures', 'Entretien'] },
    { value: 'Personnel', label: 'Charges de personnel', subcategories: ['Salaires', 'Charges sociales', 'Formation'] },
    { value: 'Transport', label: 'Transport', subcategories: ['Carburant', 'Entretien véhicule', 'Assurance'] },
    { value: 'Autres', label: 'Autres charges', subcategories: ['Impôts', 'Intérêts', 'Divers'] }
  ]
};
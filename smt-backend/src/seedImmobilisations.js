require('dotenv').config();
const mongoose = require('mongoose');
const { Immobilisation, User } = require('./models');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smt_monja_faso';

// Catégories d'immobilisations disponibles
const categories = [
  'Matériel informatique',
  'Matériel de transport',
  'Mobilier de bureau',
  'Machines et équipements',
  'Installations techniques',
  'Constructions',
  'Terrains',
  'Autres immobilisations'
];

// Statuts possibles
const statuses = ['en_service', 'hors_service', 'en_reparation', 'cede', 'detruit'];

// Types d'amortissement
const amortisationTypes = ['lineaire', 'degressif', 'progressif'];

// Fonction pour générer une date aléatoire entre deux dates
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Fonction pour générer un nombre aléatoire entre min et max
function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// Fonction pour générer un élément aléatoire d'un tableau
function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Fonction pour générer des données d'immobilisation aléatoires
function generateRandomImmobilisation(userId) {
  const category = randomElement(categories);
  const purchaseDate = randomDate(new Date(2018, 0, 1), new Date());
  const purchaseAmount = randomNumber(100000, 50000000); // Entre 100 000 et 50 000 000 Ar
  const duration = randomNumber(1, 20); // Entre 1 et 20 ans
  const amortisationType = randomElement(amortisationTypes);
  const residualValue = Math.round(purchaseAmount * 0.1); // 10% de la valeur d'achat
  
  // Calcul du taux d'amortissement
  const amortisationRate = 100 / duration;
  
  // Calcul de l'amortissement annuel
  const yearlyAmortisation = (purchaseAmount - residualValue) / duration;
  
  // Calcul de l'âge en années
  const now = new Date();
  const ageInYears = Math.floor((now - purchaseDate) / (365.25 * 24 * 60 * 60 * 1000));
  
  // Calcul de l'amortissement cumulé
  const accumulatedAmortisation = Math.min(yearlyAmortisation * ageInYears, purchaseAmount - residualValue);
  
  // Calcul de la valeur actuelle
  const currentValue = purchaseAmount - accumulatedAmortisation;
  
  // Déterminer si l'immobilisation est complètement amortie
  const isFullyAmortised = currentValue <= residualValue;
  
  // Déterminer le statut en fonction de l'amortissement
  let status;
  if (isFullyAmortised) {
    status = randomElement(['hors_service', 'cede', 'detruit']);
  } else {
    status = randomElement(['en_service', 'en_service', 'en_service', 'en_reparation']); // Plus de chances d'être en service
  }
  
  // Générer des noms d'immobilisations en fonction de la catégorie
  let name;
  switch (category) {
    case 'Matériel informatique':
      name = randomElement(['Ordinateur portable', 'Serveur', 'Imprimante', 'Scanner', 'Écran', 'Tablette', 'Routeur', 'Switch réseau']);
      break;
    case 'Matériel de transport':
      name = randomElement(['Voiture de service', 'Camionnette', 'Moto', 'Vélo électrique', 'Camion']);
      break;
    case 'Mobilier de bureau':
      name = randomElement(['Bureau', 'Chaise ergonomique', 'Armoire', 'Table de réunion', 'Canapé d\'accueil', 'Lampe de bureau']);
      break;
    case 'Machines et équipements':
      name = randomElement(['Machine de production', 'Groupe électrogène', 'Climatiseur', 'Système d\'alarme', 'Équipement de laboratoire']);
      break;
    case 'Installations techniques':
      name = randomElement(['Installation électrique', 'Système de plomberie', 'Système de ventilation', 'Réseau informatique', 'Système de sécurité']);
      break;
    case 'Constructions':
      name = randomElement(['Bâtiment administratif', 'Entrepôt', 'Local commercial', 'Hangar', 'Atelier']);
      break;
    case 'Terrains':
      name = randomElement(['Terrain constructible', 'Terrain agricole', 'Terrain industriel', 'Parking']);
      break;
    default:
      name = randomElement(['Licence logiciel', 'Brevet', 'Œuvre d\'art', 'Équipement spécialisé']);
  }
  
  // Ajouter un identifiant unique au nom
  name += ` #${randomNumber(1000, 9999)}`;
  
  return {
    name,
    purchaseDate,
    purchaseAmount,
    duration,
    currentValue,
    amortisationRate,
    category,
    description: `Description de ${name} acquis le ${purchaseDate.toLocaleDateString()}`,
    serialNumber: `SN-${randomNumber(10000, 99999)}`,
    supplier: {
      name: randomElement(['Fournisseur A', 'Fournisseur B', 'Fournisseur C', 'Fournisseur D']),
      contact: `+261 ${randomNumber(30, 39)} ${randomNumber(100, 999)} ${randomNumber(10, 99)}`,
      address: 'Antananarivo, Madagascar'
    },
    location: randomElement(['Siège social', 'Agence Nord', 'Agence Sud', 'Entrepôt principal', 'Site de production']),
    amortisationType,
    yearlyAmortisation,
    accumulatedAmortisation,
    residualValue,
    status,
    isFullyAmortised,
    createdBy: userId
  };
}

async function seedImmobilisations() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Trouver un utilisateur admin pour l'associer aux immobilisations
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('❌ Aucun utilisateur admin trouvé. Veuillez d\'abord créer un admin.');
      return;
    }

    // Supprimer toutes les immobilisations existantes
    await Immobilisation.deleteMany({});
    console.log('🗑️ Toutes les immobilisations existantes ont été supprimées');

    // Nombre d'immobilisations à créer
    const numberOfImmobilisations = 50;
    const immobilisations = [];

    // Générer des immobilisations aléatoires
    for (let i = 0; i < numberOfImmobilisations; i++) {
      immobilisations.push(generateRandomImmobilisation(admin._id));
    }

    // Insérer les immobilisations dans la base de données
    await Immobilisation.insertMany(immobilisations);

    console.log(`✅ ${numberOfImmobilisations} immobilisations ont été créées avec succès`);

    // Afficher quelques statistiques
    const stats = await Immobilisation.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalValue: { $sum: '$purchaseAmount' },
          currentValue: { $sum: '$currentValue' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    console.log('\n📊 Statistiques par catégorie:');
    stats.forEach(stat => {
      console.log(`${stat._id}: ${stat.count} immobilisations - Valeur d'achat: ${stat.totalValue.toLocaleString()} Ar - Valeur actuelle: ${stat.currentValue.toLocaleString()} Ar`);
    });

    mongoose.disconnect();
  } catch (err) {
    console.error('❌ Erreur lors de la création des immobilisations :', err);
    mongoose.disconnect();
  }
}

seedImmobilisations();
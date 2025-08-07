#!/usr/bin/env node

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';
const FRONTEND_URL = 'http://localhost:5173';

console.log('🧪 Test d\'intégration SMT MONJA-Faso\n');

let authToken = null;
let testUserId = null;

async function testHealth() {
  console.log('1. Test de l\'API de santé...');
  try {
    const response = await axios.get('http://localhost:5000/health');
    console.log('✅ Backend API:', response.data.message);
    return true;
  } catch (error) {
    console.log('❌ Backend inaccessible:', error.message);
    return false;
  }
}

async function testFrontend() {
  console.log('2. Test du frontend...');
  try {
    const response = await axios.get(FRONTEND_URL);
    console.log('✅ Frontend accessible');
    return true;
  } catch (error) {
    console.log('❌ Frontend inaccessible:', error.message);
    return false;
  }
}

async function testUserRegistration() {
  console.log('3. Test de création d\'utilisateur...');
  try {
    const userData = {
      name: 'Utilisateur Test',
      email: 'test@monja-faso.com',
      password: 'testpassword123',
      role: 'user'
    };

    const response = await axios.post(`${API_BASE}/auth/register`, userData);
    console.log('✅ Utilisateur créé:', response.data.user?.name || 'OK');
    testUserId = response.data.user?.id;
    return true;
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.message?.includes('existe déjà')) {
      console.log('⚠️ Utilisateur existe déjà, test de connexion...');
      return true;
    }
    console.log('❌ Erreur création utilisateur:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testUserLogin() {
  console.log('4. Test de connexion...');
  try {
    const loginData = {
      email: 'test@monja-faso.com',
      password: 'testpassword123'
    };

    const response = await axios.post(`${API_BASE}/auth/login`, loginData);
    authToken = response.data.token;
    console.log('✅ Connexion réussie');
    return true;
  } catch (error) {
    console.log('❌ Erreur connexion:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testAuthenticatedEndpoint() {
  console.log('5. Test endpoint authentifié...');
  try {
    const response = await axios.get(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log('✅ Profil utilisateur récupéré:', response.data.user?.name || 'OK');
    return true;
  } catch (error) {
    console.log('❌ Erreur endpoint authentifié:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testAccounts() {
  console.log('6. Test des comptes...');
  try {
    const accountData = {
      name: 'Compte Test',
      type: 'caisse',
      balance: 1000,
      currency: 'MGA',
      description: 'Compte de test'
    };

    const response = await axios.post(`${API_BASE}/accounts`, accountData, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log('✅ Compte créé:', response.data.account?.name || 'OK');
    
    // Test récupération des comptes
    const getResponse = await axios.get(`${API_BASE}/accounts`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log('✅ Comptes récupérés:', getResponse.data.accounts?.length || 0, 'compte(s)');
    return true;
  } catch (error) {
    console.log('❌ Erreur gestion comptes:', error.response?.data?.message || error.message);
    return false;
  }
}

async function runTests() {
  const tests = [
    testHealth,
    testFrontend,
    testUserRegistration,
    testUserLogin,
    testAuthenticatedEndpoint,
    testAccounts
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await test();
    if (result) {
      passed++;
    } else {
      failed++;
    }
    console.log(''); // Ligne vide
  }

  console.log('📊 Résultats des tests:');
  console.log(`✅ Tests réussis: ${passed}`);
  console.log(`❌ Tests échoués: ${failed}`);
  console.log(`📈 Taux de réussite: ${Math.round((passed / tests.length) * 100)}%`);

  if (failed === 0) {
    console.log('\n🎉 Intégration frontend-backend réussie !');
    console.log('💡 L\'application SMT MONJA-Faso est prête à être utilisée');
  } else {
    console.log('\n⚠️ Quelques problèmes détectés, vérifiez les logs ci-dessus');
  }
}

runTests().catch(console.error);
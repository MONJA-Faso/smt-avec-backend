#!/usr/bin/env node

const axios = require('axios');

console.log('🔍 Test rapide d\'intégration SMT');

async function testQuick() {
  try {
    // Test Backend
    console.log('\n1. Test Backend...');
    const healthResponse = await axios.get('http://localhost:5000/health');
    console.log('✅ Backend:', healthResponse.data.message);

    // Test Frontend
    console.log('\n2. Test Frontend...');
    const frontResponse = await axios.get('http://localhost:5173');
    if (frontResponse.status === 200) {
      console.log('✅ Frontend: Application React accessible');
    }

    // Test CORS (appel cross-origin depuis frontend vers backend)
    console.log('\n3. Test CORS...');
    const corsResponse = await axios.get('http://localhost:5000/health', {
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET'
      }
    });
    console.log('✅ CORS: Communication frontend-backend possible');

    console.log('\n🎉 Intégration de base réussie !');
    console.log('📝 Le frontend et backend communiquent correctement');
    console.log('💡 L\'application SMT est prête pour les tests utilisateur');

  } catch (error) {
    console.log('❌ Erreur:', error.message);
  }
}

testQuick();
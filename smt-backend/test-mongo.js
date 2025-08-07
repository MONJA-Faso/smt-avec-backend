const mongoose = require('mongoose');

async function testMongoDB() {
  try {
    console.log('🔌 Test de connexion MongoDB...');
    
    const uri = 'mongodb://localhost:27017/smt_monja_faso';
    console.log('URI:', uri);
    
    await mongoose.connect(uri);
    console.log('✅ Connexion MongoDB réussie');
    
    // Test simple d'insertion
    const testSchema = new mongoose.Schema({ name: String });
    const TestModel = mongoose.model('Test', testSchema);
    
    const test = new TestModel({ name: 'Test connexion' });
    await test.save();
    console.log('✅ Test d\'écriture réussi');
    
    // Nettoyage
    await TestModel.deleteMany({});
    console.log('✅ Test de suppression réussi');
    
  } catch (error) {
    console.log('❌ Erreur:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connexion fermée');
  }
}

testMongoDB();
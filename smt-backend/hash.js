const bcrypt = require('bcryptjs');

async function hashPassword() {
  const hashed = await bcrypt.hash('admin123*', 10);
  console.log('Mot de passe hashé :', hashed);
}

hashPassword();

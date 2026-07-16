const bcrypt = require('bcryptjs');
const { User } = require('./src/models');

async function creer() {
  const hash = await bcrypt.hash('Admin1234!', 12);
  console.log('Hash genere:', hash.length, 'chars');
  await User.upsert({ email: 'admin@lescoccinelles.fr', password: hash, role: 'admin', prenom: 'Marie', nom: 'Dupont', actif: true, email_verifie: true });
  await User.upsert({ email: 'super@lescoccinelles.fr', password: hash, role: 'super_admin', prenom: 'Sabah', nom: 'Al-Azzawi', actif: true, email_verifie: true });
  console.log('OK - Comptes crees');
  process.exit(0);
}
creer().catch(e => { console.error('ERREUR:', e.message); process.exit(1); });

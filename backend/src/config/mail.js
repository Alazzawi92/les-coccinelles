// Configuration Nodemailer pour l'envoi d'emails
const nodemailer = require('nodemailer');

// Créer le transporteur SMTP
const transporteur = nodemailer.createTransport({
  host:   process.env.MAIL_HOST || 'smtp.gmail.com', // Serveur SMTP
  port:   process.env.MAIL_PORT || 587,              // Port SMTP (587 = TLS)
  secure: false,                                      // false pour TLS, true pour SSL
  auth: {
    user: process.env.MAIL_USER, // Adresse email d'envoi
    pass: process.env.MAIL_PASS  // Mot de passe ou App Password
  }
});

// Vérifier la connexion au démarrage
transporteur.verify((error) => {
  if (error) {
    console.warn('⚠️  Email non configuré :', error.message);
  } else {
    console.log('✅ Serveur email connecté');
  }
});

module.exports = transporteur; // Exporter pour utiliser dans les services

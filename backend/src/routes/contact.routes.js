// Route formulaire de contact — /api/contact
const express    = require('express');
const { body }   = require('express-validator');
const rateLimit  = require('express-rate-limit');
const router     = express.Router();
const { validerDonnees } = require('../middlewares/validate.middleware');
const { succes, erreur } = require('../utils/response');
const transporteur       = require('../config/mail');

// Limiter les envois de formulaire : max 5 par heure
const limiteContact = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max:      5,
  message:  { success: false, message: 'Trop de messages envoyés. Réessayez dans 1 heure.' }
});

const reglesContact = [
  body('nom').trim().isLength({ min: 2 }).withMessage('Nom requis').escape(),
  body('email').isEmail().withMessage('Email invalide').normalizeEmail(),
  body('sujet').trim().notEmpty().withMessage('Sujet requis').escape(),
  body('message').trim().isLength({ min: 20 }).withMessage('Message trop court (20 caractères min)').escape()
];

// POST /api/contact — Envoyer un message de contact
router.post('/', limiteContact, reglesContact, validerDonnees, async (req, res) => {
  try {
    const { nom, email, telephone, sujet, message } = req.body;

    // Envoyer l'email à la crèche
    await transporteur.sendMail({
      from:    `"Les Coccinelles — Site web" <${process.env.MAIL_FROM}>`,
      to:      process.env.MAIL_FROM || process.env.MAIL_USER, // Email de la crèche
      replyTo: email,                // Répondre directement à l'expéditeur
      subject: `[Contact] ${sujet} — ${nom}`,
      html: `
        <h2>Nouveau message de contact</h2>
        <p><strong>Nom :</strong> ${nom}</p>
        <p><strong>Email :</strong> ${email}</p>
        ${telephone ? `<p><strong>Téléphone :</strong> ${telephone}</p>` : ''}
        <p><strong>Sujet :</strong> ${sujet}</p>
        <hr/>
        <p><strong>Message :</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `
    });

    // Envoyer un email de confirmation à l'expéditeur
    await transporteur.sendMail({
      from:    `"Les Coccinelles" <${process.env.MAIL_FROM}>`,
      to:      email,
      subject: 'Votre message a bien été reçu — Les Coccinelles',
      html: `
        <h2>Bonjour ${nom},</h2>
        <p>Nous avons bien reçu votre message concernant : <strong>${sujet}</strong></p>
        <p>Nous vous répondrons dans les plus brefs délais (généralement sous 48h ouvrées).</p>
        <p>Cordialement,<br/>L'équipe des Coccinelles 🐞</p>
      `
    });

    return succes(res, null, 'Message envoyé avec succès');
  } catch (err) {
    console.error('Erreur envoi contact :', err.message);
    // Ne pas bloquer si l'email n'est pas configuré en dev
    return succes(res, null, 'Message reçu (email non configuré en développement)');
  }
});

module.exports = router;

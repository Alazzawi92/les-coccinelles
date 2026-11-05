// Middleware anti-robot Cloudflare Turnstile — Les Coccinelles
// Le navigateur envoie le jeton fourni par la case Turnstile (champ
// "turnstileToken") ; on demande nous-mêmes à Cloudflare s'il est valide.
// On ne fait jamais confiance au navigateur : un robot peut ignorer la case.
const { erreur } = require('../utils/response');

// Adresse officielle de vérification des jetons Turnstile
const URL_VERIFICATION = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

const verifierTurnstile = async (req, res, next) => {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  // Clé absente : protection désactivée en développement uniquement.
  // En production, on refuse plutôt que de laisser passer les robots.
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('TURNSTILE_SECRET_KEY manquante : formulaire bloqué');
      return erreur(res, 'Service momentanément indisponible', 503);
    }
    return next();
  }

  const jeton = req.body.turnstileToken;
  if (!jeton || typeof jeton !== 'string') {
    return erreur(res, 'Merci de confirmer que vous n\'êtes pas un robot', 400);
  }

  try {
    // Envoi du jeton, de notre clé secrète et de l'IP du visiteur
    const reponse = await fetch(URL_VERIFICATION, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    new URLSearchParams({ secret, response: jeton, remoteip: req.ip }),
      signal:  AbortSignal.timeout(5000) // Cloudflare ne répond pas : on n'attend pas indéfiniment
    });
    const resultat = await reponse.json();

    if (!resultat.success) {
      // Jeton faux, expiré ou déjà utilisé (un jeton ne sert qu'une fois)
      return erreur(res, 'Vérification anti-robot échouée. Merci de réessayer.', 400);
    }

    // Le jeton ne doit pas finir dans les données enregistrées ou les emails
    delete req.body.turnstileToken;
    return next();

  } catch (err) {
    console.error('Erreur vérification Turnstile :', err.message);
    return erreur(res, 'Vérification anti-robot indisponible. Merci de réessayer.', 503);
  }
};

module.exports = { verifierTurnstile };

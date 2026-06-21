// ============================================================
// FICHIER  : Contact.jsx
// ROUTE    : /contact
// RÔLE     : Page de contact public de la crèche.
//            Formulaire de message (nom, email, sujet, message)
//            avec validation côté client avant envoi à l'API.
//            Affiche un écran de confirmation après envoi.
// ============================================================

import { useState } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import './Contact.css';

const Contact = () => {

  // ── État du formulaire ────────────────────────────────────
  const [formData, setFormData] = useState({
    nom: '', email: '', telephone: '', sujet: '', message: ''
  });
  const [envoi,   setEnvoi]   = useState(false);  // Envoi en cours
  const [envoye,  setEnvoye]  = useState(false);  // Message envoyé avec succès
  const [erreurs, setErreurs] = useState({});     // Erreurs de validation par champ

  // ── Validation côté client ────────────────────────────────
  const valider = () => {
    const e = {};
    if (!formData.nom.trim())     e.nom     = 'Le nom est requis';
    if (!formData.email.trim())   e.email   = "L'email est requis";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Email invalide';
    if (!formData.sujet.trim())   e.sujet   = 'Le sujet est requis';
    if (!formData.message.trim()) e.message = 'Le message est requis';
    if (formData.message.trim().length < 20)
      e.message = 'Le message doit faire au moins 20 caractères';
    return e;
  };

  // ── Gestion des changements de champ ─────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Efface l'erreur du champ modifié au fur et à mesure de la frappe
    if (erreurs[name]) setErreurs(prev => ({ ...prev, [name]: '' }));
  };

  // ── Soumission du formulaire ──────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation avant d'appeler l'API
    const e_val = valider();
    if (Object.keys(e_val).length > 0) { setErreurs(e_val); return; }

    setEnvoi(true);
    try {
      await api.post('/contact', formData); // POST vers le backend
      setEnvoye(true);
      toast.success('Message envoyé avec succès !');
    } catch {
      toast.error("Erreur lors de l'envoi. Veuillez réessayer.");
    }
    setEnvoi(false);
  };

  return (
    <div className="contact-page">

      {/* ── EN-TÊTE HERO ──────────────────────────────────────── */}
      <section className="page-hero page-hero--bleu">
        <div className="container">
          <p className="page-hero__tag">✉️ Contact</p>
          <h1 className="page-hero__titre">Nous <span>contacter</span></h1>
          <p className="page-hero__sous">Vous avez une question ? Nous sommes là pour vous répondre</p>
        </div>
      </section>

      <section className="section-blanche">
        {/* Layout 2 colonnes : formulaire | infos de contact */}
        <div className="container contact-grille">

          {/* ── FORMULAIRE ──────────────────────────────────── */}
          <div className="contact-formulaire-wrapper">
            <h2 className="titre-section">Envoyer un message</h2>

            {/* Après envoi réussi : écran de confirmation */}
            {envoye ? (
              <div className="envoi-succes">
                <span>✅</span>
                <h3>Message envoyé !</h3>
                <p>Merci pour votre message. Nous vous répondrons dans les plus brefs délais (généralement sous 48h).</p>
                {/* Réinitialise le formulaire pour un nouveau message */}
                <button className="btn btn--outline btn--sm" onClick={() => {
                  setEnvoye(false);
                  setFormData({ nom: '', email: '', telephone: '', sujet: '', message: '' });
                }}>
                  Envoyer un nouveau message
                </button>
              </div>
            ) : (

              // Formulaire de contact : noValidate = validation JS uniquement
              <form className="contact-form" onSubmit={handleSubmit} noValidate>

                {/* Ligne Nom + Email côte à côte */}
                <div className="form-row">
                  <div className="form-groupe">
                    <label htmlFor="nom" className="form-label">
                      Nom complet <span className="requis">*</span>
                    </label>
                    <input id="nom" name="nom" type="text"
                      className={`form-input ${erreurs.nom ? 'form-input--erreur' : ''}`}
                      placeholder="Marie Dupont" value={formData.nom} onChange={handleChange} />
                    {erreurs.nom && <p className="form-erreur">{erreurs.nom}</p>}
                  </div>
                  <div className="form-groupe">
                    <label htmlFor="email" className="form-label">
                      Adresse email <span className="requis">*</span>
                    </label>
                    <input id="email" name="email" type="email"
                      className={`form-input ${erreurs.email ? 'form-input--erreur' : ''}`}
                      placeholder="marie@exemple.fr" value={formData.email} onChange={handleChange} />
                    {erreurs.email && <p className="form-erreur">{erreurs.email}</p>}
                  </div>
                </div>

                {/* Ligne Téléphone (optionnel) + Sujet (select) */}
                <div className="form-row">
                  <div className="form-groupe">
                    <label htmlFor="telephone" className="form-label">Téléphone</label>
                    <input id="telephone" name="telephone" type="tel" className="form-input"
                      placeholder="06 XX XX XX XX" value={formData.telephone} onChange={handleChange} />
                  </div>
                  <div className="form-groupe">
                    <label htmlFor="sujet" className="form-label">
                      Sujet <span className="requis">*</span>
                    </label>
                    <select id="sujet" name="sujet"
                      className={`form-input ${erreurs.sujet ? 'form-input--erreur' : ''}`}
                      value={formData.sujet} onChange={handleChange}>
                      <option value="">Choisir un sujet...</option>
                      <option value="inscription">Demande d'inscription</option>
                      <option value="visite">Demande de visite</option>
                      <option value="information">Demande d'information</option>
                      <option value="autre">Autre</option>
                    </select>
                    {erreurs.sujet && <p className="form-erreur">{erreurs.sujet}</p>}
                  </div>
                </div>

                {/* Textarea message + compteur de caractères */}
                <div className="form-groupe">
                  <label htmlFor="message" className="form-label">
                    Message <span className="requis">*</span>
                  </label>
                  <textarea id="message" name="message" rows={6}
                    className={`form-input form-textarea ${erreurs.message ? 'form-input--erreur' : ''}`}
                    placeholder="Décrivez votre demande..." value={formData.message} onChange={handleChange} />
                  {erreurs.message && <p className="form-erreur">{erreurs.message}</p>}
                  {/* Compteur : {nb}/500 caractères */}
                  <p className="form-aide">{formData.message.length}/500 caractères</p>
                </div>

                <button type="submit" className="btn btn--primary btn--lg" disabled={envoi}>
                  {envoi ? 'Envoi en cours...' : 'Envoyer le message'}
                </button>
              </form>
            )}
          </div>

          {/* ── INFOS DE CONTACT ────────────────────────────── */}
          <aside className="contact-infos">
            <h2 className="titre-section">Retrouvez-nous</h2>
            <div className="contact-infos__liste">
              {[
                { icone: '📍', titre: 'Adresse',   contenu: 'Rue des Coccinelles\n17138 Puilboreau' },
                { icone: '📞', titre: 'Téléphone', contenu: '05 46 XX XX XX\n(Lun–Ven, 9h–17h)'    },
                { icone: '✉️', titre: 'Email',     contenu: 'contact@lescoccinelles.fr'              },
                { icone: '🕐', titre: 'Horaires',  contenu: 'Lun–Ven : 8h30–18h00\nFermé jours fériés' }
              ].map(({ icone, titre, contenu }) => (
                <div key={titre} className="contact-info-item">
                  <span className="contact-info-icone">{icone}</span>
                  <div>
                    <p className="contact-info-titre">{titre}</p>
                    <p className="contact-info-contenu">{contenu}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Placeholder carte (pas d'API Maps pour éviter les coûts) */}
            <div className="contact-carte">
              <div className="carte-placeholder">
                <span>🗺️</span>
                <p>Puilboreau, 17138<br />Charente-Maritime</p>
              </div>
            </div>
          </aside>

        </div>
      </section>
    </div>
  );
};

export default Contact;

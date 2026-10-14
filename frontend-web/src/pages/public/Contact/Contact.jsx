// ============================================================
// FICHIER  : Contact.jsx
// ROUTE    : /contact
// RÔLE     : Page de contact public de la crèche.
//            Formulaire de message (nom, email, sujet, message)
//            avec validation côté client avant envoi à l'API.
//            Affiche un écran de confirmation après envoi.
// ============================================================

import { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import './Contact.css';

const Contact = () => {

  const { t } = useTranslation(); // Fonction de traduction FR / EN

  // ── État du formulaire ────────────────────────────────────
  const [formData, setFormData] = useState({
    nom: '', email: '', telephone: '', sujet: '', message: ''
  });
  const [envoi,   setEnvoi]   = useState(false);  // Envoi en cours
  const [envoye,  setEnvoye]  = useState(false);  // Message envoyé avec succès
  // Erreurs de validation par champ : on stocke la CLÉ de traduction (et non le
  // texte) pour que le message suive la langue si l'utilisateur en change
  const [erreurs, setErreurs] = useState({});

  // ── Validation côté client ────────────────────────────────
  const valider = () => {
    const e = {};
    if (!formData.nom.trim())     e.nom     = 'nomRequis';
    if (!formData.email.trim())   e.email   = 'emailRequis';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'emailInvalide';
    if (!formData.sujet.trim())   e.sujet   = 'sujetRequis';
    if (!formData.message.trim()) e.message = 'messageRequis';
    if (formData.message.trim().length < 20)
      e.message = 'messageCourt';
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
      toast.success(t('public.contact.toastSucces'));
    } catch {
      toast.error(t('public.contact.toastErreur'));
    }
    setEnvoi(false);
  };

  return (
    <div className="contact-page">

      {/* ── EN-TÊTE HERO ──────────────────────────────────────── */}
      <section className="page-hero page-hero--bleu">
        <div className="container">
          <p className="page-hero__tag">✉️ {t('public.contact.tag')}</p>
          <h1 className="page-hero__titre"><Trans i18nKey="public.contact.titre" components={{ s: <span /> }} /></h1>
          <p className="page-hero__sous">{t('public.contact.sousTitre')}</p>
        </div>
      </section>

      <section className="section-blanche">
        {/* Layout 2 colonnes : formulaire | infos de contact */}
        <div className="container contact-grille">

          {/* ── FORMULAIRE ──────────────────────────────────── */}
          <div className="contact-formulaire-wrapper">
            <h2 className="titre-section">{t('public.contact.formTitre')}</h2>

            {/* Après envoi réussi : écran de confirmation */}
            {envoye ? (
              <div className="envoi-succes">
                <span>✅</span>
                <h3>{t('public.contact.envoyeTitre')}</h3>
                <p>{t('public.contact.envoyeTexte')}</p>
                {/* Réinitialise le formulaire pour un nouveau message */}
                <button className="btn btn--outline btn--sm" onClick={() => {
                  setEnvoye(false);
                  setFormData({ nom: '', email: '', telephone: '', sujet: '', message: '' });
                }}>
                  {t('public.contact.nouveau')}
                </button>
              </div>
            ) : (

              // Formulaire de contact : noValidate = validation JS uniquement
              <form className="contact-form" onSubmit={handleSubmit} noValidate>

                {/* Ligne Nom + Email côte à côte */}
                <div className="form-row">
                  <div className="form-groupe">
                    <label htmlFor="nom" className="form-label">
                      {t('public.contact.nom')} <span className="requis">*</span>
                    </label>
                    <input id="nom" name="nom" type="text"
                      className={`form-input ${erreurs.nom ? 'form-input--erreur' : ''}`}
                      placeholder={t('public.contact.nomPlaceholder')} value={formData.nom} onChange={handleChange} />
                    {erreurs.nom && <p className="form-erreur">{t(`public.contact.erreurs.${erreurs.nom}`)}</p>}
                  </div>
                  <div className="form-groupe">
                    <label htmlFor="email" className="form-label">
                      {t('public.contact.email')} <span className="requis">*</span>
                    </label>
                    <input id="email" name="email" type="email"
                      className={`form-input ${erreurs.email ? 'form-input--erreur' : ''}`}
                      placeholder={t('public.contact.emailPlaceholder')} value={formData.email} onChange={handleChange} />
                    {erreurs.email && <p className="form-erreur">{t(`public.contact.erreurs.${erreurs.email}`)}</p>}
                  </div>
                </div>

                {/* Ligne Téléphone (optionnel) + Sujet (select) */}
                <div className="form-row">
                  <div className="form-groupe">
                    <label htmlFor="telephone" className="form-label">{t('public.contact.telephone')}</label>
                    <input id="telephone" name="telephone" type="tel" className="form-input"
                      placeholder={t('public.contact.telephonePlaceholder')} value={formData.telephone} onChange={handleChange} />
                  </div>
                  <div className="form-groupe">
                    <label htmlFor="sujet" className="form-label">
                      {t('public.contact.sujet')} <span className="requis">*</span>
                    </label>
                    <select id="sujet" name="sujet"
                      className={`form-input ${erreurs.sujet ? 'form-input--erreur' : ''}`}
                      value={formData.sujet} onChange={handleChange}>
                      <option value="">{t('public.contact.sujetChoisir')}</option>
                      {/* La valeur envoyée à l'API reste identique quelle que soit la langue */}
                      {['inscription', 'visite', 'information', 'autre'].map(s => (
                        <option key={s} value={s}>{t(`public.contact.sujets.${s}`)}</option>
                      ))}
                    </select>
                    {erreurs.sujet && <p className="form-erreur">{t(`public.contact.erreurs.${erreurs.sujet}`)}</p>}
                  </div>
                </div>

                {/* Textarea message + compteur de caractères */}
                <div className="form-groupe">
                  <label htmlFor="message" className="form-label">
                    {t('public.contact.message')} <span className="requis">*</span>
                  </label>
                  <textarea id="message" name="message" rows={6}
                    className={`form-input form-textarea ${erreurs.message ? 'form-input--erreur' : ''}`}
                    placeholder={t('public.contact.messagePlaceholder')} value={formData.message} onChange={handleChange} />
                  {erreurs.message && <p className="form-erreur">{t(`public.contact.erreurs.${erreurs.message}`)}</p>}
                  {/* Compteur : {nb}/500 caractères */}
                  <p className="form-aide">{t('public.contact.caracteres', { n: formData.message.length })}</p>
                </div>

                <button type="submit" className="btn btn--primary btn--lg" disabled={envoi}>
                  {envoi ? t('public.contact.envoi') : t('public.contact.envoyer')}
                </button>
              </form>
            )}
          </div>

          {/* ── INFOS DE CONTACT ────────────────────────────── */}
          <aside className="contact-infos">
            <h2 className="titre-section">{t('public.contact.retrouvez')}</h2>
            <div className="contact-infos__liste">
              {/* cle : clé de traduction (public.contact.infos.*) */}
              {[
                { icone: '📍', cle: 'adresse' },
                { icone: '📞', cle: 'telephone' },
                { icone: '✉️', cle: 'email' },
                { icone: '🕐', cle: 'horaires' },
                { icone: '👶', cle: 'communes' }
              ].map(({ icone, cle }) => (
                <div key={cle} className="contact-info-item">
                  <span className="contact-info-icone">{icone}</span>
                  <div>
                    <p className="contact-info-titre">{t(`public.contact.infos.${cle}.titre`)}</p>
                    <p className="contact-info-contenu">{t(`public.contact.infos.${cle}.contenu`)}</p>
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

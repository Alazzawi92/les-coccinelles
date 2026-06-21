// ============================================================
// FICHIER  : MentionsLegales.jsx
// ROUTE    : /mentions-legales
// RÔLE     : Page des mentions légales et conformité RGPD.
//            9 sections : éditeur, responsable, hébergement,
//            collecte de données, durées de conservation (table),
//            droits RGPD (grille 5 items), consentement photo,
//            cookies JWT, propriété intellectuelle.
//            Date de mise à jour dynamique via new Date().
//            Page entièrement statique (aucun appel API).
// ============================================================

import './MentionsLegales.css';

// Composant statique en expression fléchée directe
const MentionsLegales = () => (
  <div className="mentions">

    {/* ── EN-TÊTE HERO ──────────────────────────────────────── */}
    <section className="page-hero page-hero--bleu">
      <div className="container">
        <p className="page-hero__tag">📋 Légal</p>
        <h1 className="page-hero__titre">Mentions <span>légales</span></h1>
        <p className="page-hero__sous">Conformité RGPD et mentions légales obligatoires</p>
      </div>
    </section>

    <section className="section-blanche">
      <div className="container mentions-contenu">

        {/* ── 1. ÉDITEUR DU SITE ──────────────────────────────── */}
        <div className="mentions-section">
          <h2>1. Éditeur du site</h2>
          <p>Association Les Coccinelles<br />Rue des Coccinelles, 17138 Puilboreau<br />Téléphone : 05 46 XX XX XX<br />Email : contact@lescoccinelles.fr<br />SIRET : XXX XXX XXX XXXXX</p>
        </div>

        {/* ── 2. RESPONSABLE DE PUBLICATION ───────────────────── */}
        <div className="mentions-section">
          <h2>2. Responsable de la publication</h2>
          <p>La directrice de la crèche Les Coccinelles est responsable de la publication de ce site.</p>
        </div>

        {/* ── 3. HÉBERGEMENT ──────────────────────────────────── */}
        <div className="mentions-section">
          <h2>3. Hébergement</h2>
          <p>Ce site est hébergé par un prestataire certifié sur le territoire européen.</p>
        </div>

        {/* ── 4. COLLECTE DE DONNÉES PERSONNELLES (RGPD) ──────── */}
        {/* Liste des catégories de données traitées par la plateforme */}
        <div className="mentions-section">
          <h2>4. Collecte de données personnelles (RGPD)</h2>
          <p>Dans le cadre de l'utilisation de la plateforme, les données suivantes sont collectées :</p>
          <ul>
            <li><strong>Données d'identification :</strong> nom, prénom, adresse email, téléphone</li>
            <li><strong>Données de l'enfant :</strong> prénom, nom, date de naissance, informations de santé</li>
            <li><strong>Communications :</strong> messages échangés avec la crèche</li>
            <li><strong>Documents :</strong> fichiers uploadés dans le cadre du dossier d'inscription</li>
          </ul>
          <p>Ces données sont utilisées exclusivement pour la gestion des inscriptions et le suivi des enfants. Elles ne sont jamais cédées à des tiers.</p>
        </div>

        {/* ── 5. DURÉE DE CONSERVATION ────────────────────────── */}
        {/* Tableau : type de donnée → durée de conservation RGPD */}
        <div className="mentions-section">
          <h2>5. Durée de conservation des données</h2>
          <div className="mentions-tableau-wrapper">
            <table className="mentions-tableau">
              <thead><tr><th>Type de donnée</th><th>Durée de conservation</th></tr></thead>
              <tbody>
                {[
                  ['Données du compte parent',    "Durée de l'inscription + 1 an"],
                  ["Données de l'enfant",          "Durée de l'inscription + 1 an"],
                  ["Photos de l'enfant",           "Jusqu'au retrait du consentement"],
                  ['Messages',                     '2 ans après le dernier échange'],
                  ['Documents administratifs',     "Durée de l'inscription + 3 ans"]
                ].map(([type, duree]) => (
                  <tr key={type}><td>{type}</td><td>{duree}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── 6. VOS DROITS (RGPD) ────────────────────────────── */}
        {/* Grille 5 droits : accès, rectification, effacement, opposition, portabilité */}
        <div className="mentions-section">
          <h2>6. Vos droits (RGPD)</h2>
          <p>Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :</p>
          <div className="droits-grille">
            {[
              { icone: '👁️', droit: "Droit d'accès",        desc: "Consulter l'ensemble de vos données personnelles" },
              { icone: '✏️', droit: 'Droit de rectification', desc: 'Modifier vos données si elles sont inexactes' },
              { icone: '🗑️', droit: "Droit à l'effacement",  desc: 'Demander la suppression de votre compte et vos données' },
              { icone: '🚫', droit: "Droit d'opposition",    desc: 'Refuser le traitement de vos données (notamment pour les photos)' },
              { icone: '📦', droit: 'Droit à la portabilité', desc: 'Recevoir vos données dans un format lisible par machine' }
            ].map(({ icone, droit, desc }) => (
              <div key={droit} className="droit-item">
                <span>{icone}</span>
                <div><strong>{droit}</strong><p>{desc}</p></div>
              </div>
            ))}
          </div>
          <p>Pour exercer vos droits, contactez-nous par email : <strong>rgpd@lescoccinelles.fr</strong></p>
        </div>

        {/* ── 7. CONSENTEMENT PHOTOGRAPHIQUE ──────────────────── */}
        {/* Explique que le consentement est modifiable à tout moment */}
        <div className="mentions-section">
          <h2>7. Consentement photographique</h2>
          <p>La publication de photos d'enfants nécessite le consentement explicite des parents ou tuteurs légaux. Ce consentement peut être retiré à tout moment depuis votre espace parent. Sans consentement, aucune photo de votre enfant ne sera visible sur la plateforme.</p>
        </div>

        {/* ── 8. COOKIES ──────────────────────────────────────── */}
        {/* Uniquement cookies techniques JWT — pas de traçage */}
        <div className="mentions-section">
          <h2>8. Cookies</h2>
          <p>Ce site utilise uniquement des cookies techniques nécessaires au fonctionnement de l'authentification (tokens JWT). Aucun cookie publicitaire ou de traçage n'est utilisé.</p>
        </div>

        {/* ── 9. PROPRIÉTÉ INTELLECTUELLE ─────────────────────── */}
        <div className="mentions-section">
          <h2>9. Propriété intellectuelle</h2>
          <p>L'ensemble du contenu de ce site (textes, images, logos, design) est la propriété exclusive de l'association Les Coccinelles. Toute reproduction sans autorisation est interdite.</p>
        </div>

        {/* Date de mise à jour générée dynamiquement au rendu */}
        <p className="mentions-date">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

      </div>
    </section>

  </div>
);

export default MentionsLegales;

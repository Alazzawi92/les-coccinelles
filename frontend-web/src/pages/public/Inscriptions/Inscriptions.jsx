// ============================================================
// FICHIER  : Inscriptions.jsx
// ROUTE    : /conditions-inscription
// RÔLE     : Page d'information sur les conditions d'inscription.
//            Contenu fidèle au site actuel de la crèche :
//            conditions générales, bouton Pirouette, inclusion
//            handicap et fiche de pré-inscription à télécharger.
// ============================================================

import { Link } from 'react-router-dom';
import './Inscriptions.css';

const Inscriptions = () => {
  return (
    <div className="page-inscriptions">

      {/* ── EN-TÊTE HERO ──────────────────────────────────────── */}
      <section className="page-hero page-hero--orange">
        <div className="container">
          <p className="page-hero__tag">📝 Inscription</p>
          <h1 className="page-hero__titre">Conditions <span>d'inscription</span></h1>
          <p className="page-hero__sous">Tout ce que vous devez savoir pour inscrire votre enfant à la crèche Les Coccinelles</p>
        </div>
      </section>

      {/* ── CONDITIONS D'INSCRIPTION ──────────────────────────── */}
      <section className="section-blanche">
        <div className="container">
          <h2 className="titre-section">Les conditions d'inscription</h2>

          <div className="insc-paragraphes">
            <p>Les enfants accueillis doivent habiter prioritairement les communes de Puilboreau, Saint-Xandre ou Esnandes.</p>
            <p>Afin de pré inscrire votre enfant à la crèche, veuillez nous envoyer la fiche de pré inscription ci-dessous.</p>
            <p>Pour l'accueil régulier ou occasionnel, un dossier d'inscription complet est obligatoire. Les parents doivent respecter la date prévue d'entrée de l'enfant.</p>
            <p>Le cas échéant, les jours d'absence seront facturés comme si l'enfant était présent dans la structure.</p>
            <p>Pour ce faire, les familles souhaitant inscrire leur enfant au multi accueil doivent compléter la fiche de préinscription.</p>
            <p>La place de l'enfant n'est réservée qu'après la signature du contrat et de l'inscription sur le site de la crèche « Pirouette ».</p>
          </div>

          {/* Bouton vers Pirouette (plateforme d'inscription CAF) */}
          <div className="insc-pirouette">
            <a
              href="https://www.mon-enfant.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-pirouette"
            >
              Cliquez ici pour accéder à Pirouette
            </a>
          </div>
        </div>
      </section>

      {/* ── INCLUSION HANDICAP ────────────────────────────────── */}
      <section className="section-grise">
        <div className="container">
          <div className="insc-handicap">
            <span className="insc-handicap__icone">♿</span>
            <div>
              <h3 className="insc-handicap__titre">Accueil des enfants en situation de handicap</h3>
              <p>L'établissement met en œuvre un projet autour de l'inclusion d'enfants en situation de handicap. Un projet spécifique sera réalisé avec la directrice, l'équipe éducative, le référent santé et les différents partenaires accompagnant l'enfant et sa famille.</p>
              <p style={{ marginTop: '0.75rem' }}>Les conditions d'inscription seront les mêmes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── DOCUMENTS NÉCESSAIRES ─────────────────────────────── */}
      <section className="section-blanche">
        <div className="container">
          <h2 className="titre-section text-center">Documents nécessaires</h2>
          <div className="documents-liste">
            {[
              { icone: '🪪', doc: "Numéro d'assuré social dont dépend l'enfant + photocopie justificative" },
              { icone: '💼', doc: "Profession et nom de l'employeur de chacun des parents" },
              { icone: '💳', doc: "Numéro d'Allocations Familiales (CAF PRO) + photocopie justificative" },
              { icone: '💉', doc: "Carnet de santé de l'enfant : vaccinations obligatoires et à jour" },
              { icone: '🏥', doc: "Nom et coordonnées du médecin traitant" },
              { icone: '📋', doc: "Certificat d'aptitude à la vie en collectivité" },
              { icone: '🛡️', doc: "Attestation de responsabilité civile à jour" },
              { icone: '📞', doc: "Nom, prénom, adresse et téléphone des personnes susceptibles de reprendre l'enfant" },
              { icone: '✍️', doc: "Les différents protocoles à signer" },
            ].map(({ icone, doc }) => (
              <div key={doc} className="document-item">
                <span>{icone}</span>
                <span>{doc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FICHE DE PRÉ-INSCRIPTION ──────────────────────────── */}
      <section className="section-grise">
        <div className="container">
          <h2 className="titre-section text-center">Fiche de pré-inscription</h2>
          <p className="text-center" style={{ color: 'var(--text-gray)', marginBottom: 'var(--space-xl)' }}>
            Téléchargez ci-dessous la fiche de pré-inscription et retournez-la complétée à la crèche.
          </p>

          {/* Aperçu + bouton de téléchargement */}
          <div className="insc-fiche">
            <div className="insc-fiche__apercu">
              {/* Remplacez /fiche-preinscription.jpg par le vrai fichier dans public/ */}
              <img
                src="/fiche-preinscription.jpg"
                alt="Fiche de pré-inscription Les Coccinelles"
                className="insc-fiche__img"
                onError={e => { e.target.style.display = 'none'; }}
              />
            </div>
            <div className="insc-fiche__actions">
              <a
                href="/fiche-preinscription.pdf"
                download="Fiche-preinscription-Les-Coccinelles.pdf"
                className="btn btn--primary btn--lg"
              >
                ⬇️ Télécharger la fiche (PDF)
              </a>
              <p className="insc-fiche__hint">
                Complétez la fiche et envoyez-la par email à{' '}
                <a href="mailto:contact@lescoccinelles.fr">contact@lescoccinelles.fr</a>
                {' '}ou déposez-la directement à la crèche.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CRITÈRES D'ADMISSION ──────────────────────────────── */}
      <section className="section-blanche">
        <div className="container">
          <h2 className="titre-section text-center">Critères d'admission</h2>
          <div className="espaces-grille">
            {[
              { icone: '🎂', titre: 'Âge',       texte: "Enfants de 10 semaines à 3 ans (jusqu'à l'entrée en maternelle)." },
              { icone: '📍', titre: 'Résidence', texte: 'Priorité aux habitants de Puilboreau, Saint-Xandre et Esnandes.' },
              { icone: '📊', titre: 'Priorités', texte: 'Selon le règlement CAF : enfant en situation de handicap, parents en insertion professionnelle, fratrie.' }
            ].map(({ icone, titre, texte }) => (
              <div key={titre} className="espace-carte">
                <span className="espace-carte__icone">{icone}</span>
                <h3 className="espace-carte__titre">{titre}</h3>
                <p className="espace-carte__texte">{texte}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── APPEL À L'ACTION ──────────────────────────────────── */}
      <section className="cta-bas">
        <div className="container cta-bas__contenu">
          <p>Prêt(e) à inscrire votre enfant ?</p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/creer-un-compte" className="btn btn--primary btn--lg">
              Créer un compte parent
            </Link>
            <Link to="/contact" className="btn btn--outline btn--lg"
              style={{ borderColor: 'white', color: 'white' }}>
              Nous contacter d'abord
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Inscriptions;

// ============================================================
// FICHIER  : Inscriptions.jsx
// ROUTE    : /conditions-inscription
// RÔLE     : Page d'information sur les conditions d'inscription.
//            Étapes et documents chargés depuis le CMS si disponible.
// ============================================================

import { Link } from 'react-router-dom';
import usePageCMS from '../../../hooks/usePageCMS';
import './Inscriptions.css';

const Inscriptions = () => {
  const { contenu } = usePageCMS('conditions-inscription');

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

      {/* ── PROCESSUS (CMS ou fallback statique) ─────────────── */}
      <section className="section-blanche">
        <div className="container">
          {contenu
            ? (
              <>
                <h2 className="titre-section text-center">Comment inscrire votre enfant ?</h2>
                <div className="cms-html" dangerouslySetInnerHTML={{ __html: contenu }} />
              </>
            )
            : (
              <>
                <h2 className="titre-section text-center">Comment inscrire votre enfant ?</h2>
                <div className="etapes-grille">
                  {[
                    { numero: '01', titre: 'Contactez-nous',        texte: 'Prenez contact par email ou téléphone pour vérifier les disponibilités et obtenir un rendez-vous.' },
                    { numero: '02', titre: 'Visite de la crèche',   texte: "Venez visiter nos locaux avec votre enfant pour découvrir l'équipe et les espaces." },
                    { numero: '03', titre: "Dossier d'inscription", texte: 'Remplissez le dossier en ligne ou en papier et fournissez les documents demandés.' },
                    { numero: '04', titre: 'Adaptation progressive', texte: "Une période d'adaptation de 1 à 2 semaines est prévue pour que votre enfant s'habitue en douceur." }
                  ].map(({ numero, titre, texte }) => (
                    <div key={numero} className="etape-carte">
                      <div className="etape-numero">{numero}</div>
                      <h3 className="etape-titre">{titre}</h3>
                      <p className="etape-texte">{texte}</p>
                    </div>
                  ))}
                </div>
              </>
            )
          }
        </div>
      </section>

      {/* ── DOCUMENTS NÉCESSAIRES — masqué si l'admin a saisi le contenu dans le CMS ── */}
      {!contenu && (
        <section className="section-grise">
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
      )}

      {/* ── CRITÈRES D'ADMISSION ──────────────────────────────── */}
      <section className="section-blanche">
        <div className="container">
          <h2 className="titre-section text-center">Critères d'admission</h2>
          <div className="espaces-grille">
            {[
              { icone: '🎂', titre: 'Âge',       texte: "Enfants de 10 semaines à 3 ans (jusqu'à l'entrée en maternelle). Toutes les situations sont étudiées." },
              { icone: '📍', titre: 'Résidence', texte: 'Priorité donnée aux habitants de Puilboreau et des communes limitrophes.' },
              { icone: '📊', titre: 'Priorités', texte: 'Selon le règlement de la CAF : enfant en situation de handicap, parents en insertion professionnelle, fratrie.' }
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

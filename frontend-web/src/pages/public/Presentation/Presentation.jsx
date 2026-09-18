// ============================================================
// FICHIER  : Presentation.jsx
// ROUTE    : /presentation
// RÔLE     : Page de présentation de la crèche Les Coccinelles.
//            Sections : Qui sommes-nous → Nos espaces →
//            Informations pratiques → CTA contact.
//            Page statique (pas d'appel API).
// ============================================================

import { Link } from 'react-router-dom';
import usePageCMS from '../../../hooks/usePageCMS';
import './Presentation.css';

const Presentation = () => {
  const { contenu } = usePageCMS('presentation');

  return (
    <div className="presentation">

      {/* ── EN-TÊTE HERO ──────────────────────────────────────── */}
      <section className="page-hero page-hero--vert">
        <div className="container">
          <p className="page-hero__tag">🐞 Notre crèche</p>
          <h1 className="page-hero__titre">Présentation de <span>la crèche</span></h1>
          <p className="page-hero__sous">Découvrez les Coccinelles, une crèche associative au cœur de Puilboreau</p>
        </div>
      </section>

      {/* ── QUI SOMMES-NOUS ? ────────────────────────────────── */}
      <section className="section-blanche">
        <div className="container contenu-deux-colonnes">
          <div className="contenu-texte">
            <h2 className="titre-section">Qui sommes-nous ?</h2>
            {contenu
              ? <div className="cms-html" dangerouslySetInnerHTML={{ __html: contenu }} />
              : <>
                  <p>La crèche Les Coccinelles est une structure d'accueil associative implantée à Puilboreau, en Charente-Maritime. Ouverte depuis plusieurs années, elle accueille les enfants de <strong>0 à 3 ans</strong> dans un cadre bienveillant et sécurisant.</p>
                  <p>Gérée par une association de parents, notre crèche fonctionne en étroite collaboration avec les familles. Nous croyons fermement que la confiance entre parents et professionnels est la clé d'un accueil réussi pour chaque enfant.</p>
                  <p>Notre capacité d'accueil est de <strong>30 places</strong>, réparties entre temps plein, temps partiel et accueil occasionnel, afin de répondre aux besoins variés des familles.</p>
                </>
            }
          </div>
          <div className="contenu-visuel">
            <div className="visuel-emoji-grand">🏡</div>
            <div className="info-bulle">
              <strong>30 places</strong>
              <span>enfants de 0 à 3 ans</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── HISTORIQUE ───────────────────────────────────────── */}
      <section className="section-grise">
        <div className="container">
          <h2 className="titre-section text-center">Historique</h2>
          <div className="historique-contenu">
            <p>Le multi-accueil a ouvert ses portes le 2 février 2004 suite à un travail mené par un groupe de parents et des élus des quatre communes afin de répondre à un besoin de garde collective sur le territoire.</p>
            <p>Au bout de six mois, il atteint sa capacité maximum d'utilisation avec des taux qui oscillent tous les ans autour de <strong>85 % de fréquentation</strong>.</p>
            <p>Il répond à un besoin évident de garde collective puisque les listes d'attente sont longues.</p>
            <p>Il fonctionne en système associatif avec délégation des communes pour sa gestion.</p>
            <p>Sa capacité est passée au 1<sup>er</sup> septembre 2015 à <strong>28 enfants</strong> dans des locaux réaménagés et agrandis.</p>

            <div className="historique-repartitions">
              <div className="historique-repartition">
                <h3 className="gouvernance-question">Participations par commune (jusqu'en 2022)</h3>
                <ul className="gouvernance-liste">
                  <li>39 demi-journées en accueil permanent pour Puilboreau</li>
                  <li>39 demi-journées en accueil permanent pour St Xandre</li>
                  <li>11 demi-journées en accueil permanent pour Marsilly</li>
                  <li>11 demi-journées en accueil permanent pour Esnandes</li>
                </ul>
              </div>

              <div className="historique-repartition">
                <h3 className="gouvernance-question">Depuis le 1<sup>er</sup> janvier 2023 (retrait de Marsilly)</h3>
                <ul className="gouvernance-liste">
                  <li>44,5 demi-journées en accueil permanent pour Puilboreau</li>
                  <li>44,5 demi-journées en accueil permanent pour St Xandre</li>
                  <li>11 demi-journées en accueil permanent pour Esnandes</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── NOS ESPACES ───────────────────────────────────────── */}
      {/* Grille de 6 cartes décrivant chaque zone de la crèche */}
      <section className="section-blanche">
        <div className="container">
          <h2 className="titre-section text-center">Nos espaces</h2>
          <div className="espaces-grille">
            {[
              { icone: '🍼', titre: 'Section bébés',      texte: "Espace dédié aux tout-petits (0-12 mois), avec zones de repos adaptées, tapis d'éveil et mobilier sécurisé." },
              { icone: '🎠', titre: 'Salle de jeux',      texte: 'Grande salle lumineuse avec coins jeux thématiques, bibliothèque, espace imitation et zone créative.' },
              { icone: '🌿', titre: 'Jardin pédagogique', texte: 'Espace extérieur aménagé pour les sorties quotidiennes, le jeu en plein air et les activités nature.' },
              { icone: '🍽️', titre: 'Salle de repas',     texte: "Espace convivial pour les repas, favorisant l'autonomie et la socialisation autour de la table." },
              { icone: '😴', titre: 'Salles de sieste',   texte: "Salles calmes et sécurisées avec lits adaptés à chaque tranche d'âge pour des siestes de qualité." },
              { icone: '🚿', titre: 'Espace changes',     texte: 'Plan de change surélevé et sécurisé, avec tout le matériel nécessaire aux soins quotidiens.' }
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

      {/* ── INFORMATIONS PRATIQUES ───────────────────────────── */}
      {/* 4 cartes : adresse, horaires, téléphone, email */}
      <section className="section-grise">
        <div className="container">
          <h2 className="titre-section text-center">Informations pratiques</h2>
          <div className="infos-grille">
            <div className="info-carte">
              <span className="info-carte__icone">📍</span>
              <h3>Adresse</h3>
              <p>10 rue Saint Vincent<br />17138 Puilboreau</p>
            </div>
            <div className="info-carte">
              <span className="info-carte__icone">🕐</span>
              <h3>Horaires</h3>
              <p>Lundi au vendredi<br />7h30 — 18h30</p>
            </div>
            <div className="info-carte">
              <span className="info-carte__icone">📞</span>
              <h3>Téléphone</h3>
              <p>05 46 69 68 25</p>
            </div>
            <div className="info-carte">
              <span className="info-carte__icone">✉️</span>
              <h3>Email</h3>
              <p>les.coccinelles17@orange.fr</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── GOUVERNANCE ASSOCIATIVE ──────────────────────────── */}
      {/* Fonctionnement de l'association : Assemblée générale,
          Conseil d'Administration, Bureau. Contenu statique
          (règles de gouvernance, pas de données CMS/API). */}
      <section className="section-blanche">
        <div className="container">
          <h2 className="titre-section text-center">Notre fonctionnement associatif</h2>
          <p className="gouvernance-intro">
            Le multi-accueil Les Coccinelles est une association Loi 1901, à but non lucratif.
            Il est géré par des parents bénévoles regroupés en Conseil d'Administration, dans lequel un bureau est constitué.
            Une Directrice gère l'établissement au quotidien, applique les décisions prises par le Conseil d'Administration et lui rend des comptes.
          </p>

          <div className="gouvernance-grille">

            {/* ── Assemblée générale ──────────────────────── */}
            <div className="espace-carte">
              <span className="espace-carte__icone">🗳️</span>
              <h3 className="espace-carte__titre">L'assemblée générale</h3>
              <p className="gouvernance-question">Qu'est-ce qu'une assemblée générale ?</p>
              <ul className="gouvernance-liste">
                <li>Elle est informée de la gestion de l'association lors de sa réunion annuelle.</li>
                <li>Elle examine en détail l'activité et le bilan de l'année écoulée.</li>
                <li>Elle élit les membres du Conseil d'Administration.</li>
              </ul>
            </div>

            {/* ── Conseil d'Administration ────────────────── */}
            <div className="espace-carte">
              <span className="espace-carte__icone">🤝</span>
              <h3 className="espace-carte__titre">Le Conseil d'Administration</h3>
              <p className="gouvernance-question">Qu'est-ce qu'un Conseil d'Administration ?</p>
              <ul className="gouvernance-liste">
                <li>C'est un groupe de 12 parents bénévoles, se portant volontaires lors de l'assemblée générale, élu pour un an (de mai à mai).</li>
                <li>Il se réunit tous les 2 mois (de 20h30 à 22h30 environ), en présence de la Directrice du multi-accueil et des élus des 3 communes (Puilboreau, Saint-Xandre et Esnandes).</li>
                <li>Il représente l'association dans les actes de la vie civile et assure les actes de la vie courante.</li>
                <li>Il entérine, par son vote, les décisions prises par le bureau.</li>
              </ul>
            </div>

            {/* ── Bureau ───────────────────────────────────── */}
            <div className="espace-carte">
              <span className="espace-carte__icone">🗂️</span>
              <h3 className="espace-carte__titre">Le bureau</h3>
              <p className="gouvernance-question">Qu'est-ce qu'un bureau ?</p>
              <ul className="gouvernance-liste">
                <li>C'est un groupe de 6 parents bénévoles, faisant partie du Conseil d'Administration, élu pour un an (de mai à mai), réparti selon les postes suivants : Président + vice-Président, Trésorier + vice-Trésorier, Secrétaire + vice-Secrétaire.</li>
                <li>Il se réunit une fois par mois pendant 2 heures environ, en présence de la Directrice du multi-accueil.</li>
                <li>Son but est d'aider la Directrice dans la gestion journalière du multi-accueil : personnel, budget, administratif…</li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* ── TRAVAIL MENÉ AVEC LES PARENTS ────────────────────── */}
      <section className="section-grise">
        <div className="container contenu-deux-colonnes">
          <div className="contenu-texte">
            <h2 className="titre-section">Travail mené avec les parents</h2>
            <p>Au quotidien, le temps de transmissions est un moment privilégié de dialogue entre les professionnelles et les parents.</p>
            <p>Ainsi, s'instaure un climat de confiance, d'écoute des besoins et de partage des idées.</p>
            <p>L'équipe donne une place importante aux parents qui le souhaitent, elle les sollicite lors des animations, des sorties ou des fêtes organisées.</p>
            <p>Sans la participation des parents, les propositions seraient moins nombreuses. Il en est de même quant à l'investissement des familles au niveau de l'association.</p>
            <p><strong>Grâce à vous, la crèche peut exister !</strong></p>
          </div>
          <div className="contenu-visuel">
            <div className="visuel-emoji-grand">🤝</div>
            <div className="info-bulle">
              <strong>Ensemble</strong>
              <span>professionnelles &amp; familles</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── APPEL À L'ACTION ─────────────────────────────────── */}
      <section className="cta-bas">
        <div className="container cta-bas__contenu">
          <p>Vous souhaitez visiter la crèche ou en savoir plus ?</p>
          <Link to="/contact" className="btn btn--primary btn--lg">Nous contacter</Link>
        </div>
      </section>

    </div>
  );
};

export default Presentation;

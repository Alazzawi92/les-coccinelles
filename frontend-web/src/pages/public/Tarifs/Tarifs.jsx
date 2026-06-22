// ============================================================
// FICHIER  : Tarifs.jsx
// ROUTE    : /tarifs
// RÔLE     : Page publique d'information sur la grille tarifaire.
//            Explication chargée depuis le CMS, tableau PSU statique.
// ============================================================

import usePageCMS from '../../../hooks/usePageCMS';
import './Tarifs.css';

const Tarifs = () => {
  const { contenu } = usePageCMS('tarifs');

  return (
    <div className="tarifs">

      {/* ── EN-TÊTE HERO ──────────────────────────────────────── */}
      <section className="page-hero page-hero--vert">
        <div className="container">
          <p className="page-hero__tag">💶 Tarifs</p>
          <h1 className="page-hero__titre">Grille <span>tarifaire</span></h1>
          <p className="page-hero__sous">Des tarifs calculés selon votre quotient familial CAF, pour une crèche accessible à toutes les familles</p>
        </div>
      </section>

      {/* ── EXPLICATION (CMS ou fallback) ────────────────────── */}
      <section className="section-blanche">
        <div className="container">
          <h2 className="titre-section text-center">Comment sont calculés les tarifs ?</h2>
          {contenu
            ? <div className="cms-html" dangerouslySetInnerHTML={{ __html: contenu }} />
            : (
              <div className="tarifs-explication">
                <div className="explication-carte">
                  <span className="explication-icone">🏛️</span>
                  <h3>Tarif PSU</h3>
                  <p>La crèche applique le <strong>tarif PSU (Prestation de Service Unique)</strong> fixé par la CAF. Ce tarif est le même dans toutes les crèches qui appliquent ce système.</p>
                </div>
                <div className="explication-carte">
                  <span className="explication-icone">📊</span>
                  <h3>Basé sur vos revenus</h3>
                  <p>Votre participation est calculée sur la base de vos <strong>revenus imposables N-2</strong> et du nombre d'enfants à charge. Plus vos revenus sont faibles, moins vous payez.</p>
                </div>
                <div className="explication-carte">
                  <span className="explication-icone">💳</span>
                  <h3>Complément CAF</h3>
                  <p>La CAF prend en charge une grande partie du coût réel de la place. Votre participation représente généralement entre <strong>0,06% et 0,36%</strong> de votre revenu plancher mensuel.</p>
                </div>
              </div>
            )
          }
        </div>
      </section>

      {/* ── TABLEAU TARIFAIRE ─────────────────────────────────── */}
      <section className="section-grise">
        <div className="container">
          <h2 className="titre-section text-center">Exemples de tarifs horaires 2024</h2>
          <div className="tarifs-tableau-wrapper">
            <table className="tarifs-tableau">
              <thead>
                <tr>
                  <th>Revenu mensuel net du foyer</th>
                  <th>Tarif horaire (1 enfant)</th>
                  <th>Tarif horaire (2 enfants)</th>
                  <th>Tarif horaire (3 enfants+)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { revenu: '< 1 000 €',         t1: '0,06 €', t2: '0,05 €', t3: '0,04 €' },
                  { revenu: '1 000 € — 2 000 €', t1: '0,13 €', t2: '0,10 €', t3: '0,09 €' },
                  { revenu: '2 000 € — 3 000 €', t1: '0,20 €', t2: '0,16 €', t3: '0,14 €' },
                  { revenu: '3 000 € — 4 000 €', t1: '0,27 €', t2: '0,22 €', t3: '0,19 €' },
                  { revenu: '> 4 000 €',         t1: '0,36 €', t2: '0,29 €', t3: '0,25 €' }
                ].map(({ revenu, t1, t2, t3 }) => (
                  <tr key={revenu}>
                    <td>{revenu}</td>
                    <td className="tarif-montant">{t1}</td>
                    <td className="tarif-montant">{t2}</td>
                    <td className="tarif-montant">{t3}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="tarifs-note">* Ces tarifs sont donnés à titre indicatif. Votre tarif exact sera calculé lors de l'admission en fonction de votre situation réelle.</p>
        </div>
      </section>

      {/* ── CE QUI EST INCLUS ─────────────────────────────────── */}
      <section className="section-blanche">
        <div className="container">
          <h2 className="titre-section text-center">Ce qui est inclus</h2>
          <div className="espaces-grille">
            {[
              { icone: '🍽️', titre: 'Repas et goûters', texte: 'Les repas de midi et les goûters sont fournis par la crèche, préparés à partir de produits frais et équilibrés.' },
              { icone: '🧴', titre: 'Produits de soin',  texte: "Couches, crème de soin, lingettes... Tous les produits d'hygiène sont fournis par la crèche." },
              { icone: '🎨', titre: 'Activités',         texte: "Toutes les activités d'éveil, sorties et ateliers sont inclus dans le tarif journalier." }
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

    </div>
  );
};

export default Tarifs;

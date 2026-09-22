// ============================================================
// FICHIER  : MentionsLegales.jsx
// ROUTE    : /mentions-legales
// RÔLE     : Mentions légales et conformité RGPD.
//            Contenu chargé depuis le CMS si disponible,
//            sinon affichage du contenu statique de référence.
// ============================================================

import usePageCMS from '../../../hooks/usePageCMS';
import './MentionsLegales.css';

const MentionsLegales = () => {
  const { contenu } = usePageCMS('mentions-legales');

  return (
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

          {contenu
            ? <div className="cms-html" dangerouslySetInnerHTML={{ __html: contenu }} />
            : (
              <>
                {/* ── SOMMAIRE ──────────────────────────────────── */}
                <nav className="mentions-sommaire">
                  <p className="mentions-sommaire__titre">Sommaire</p>
                  <ol>
                    <li><a href="#editeur">Éditeur du site</a></li>
                    <li><a href="#publication">Directeur de la publication</a></li>
                    <li><a href="#hebergement">Hébergement</a></li>
                    <li><a href="#propriete">Propriété intellectuelle</a></li>
                    <li><a href="#donnees">Données personnelles collectées</a></li>
                    <li><a href="#base-legale">Base légale des traitements</a></li>
                    <li><a href="#sante">Données de santé des enfants</a></li>
                    <li><a href="#destinataires">Destinataires et sous-traitants</a></li>
                    <li><a href="#conservation">Durée de conservation</a></li>
                    <li><a href="#securite">Sécurité des données</a></li>
                    <li><a href="#droits">Vos droits</a></li>
                    <li><a href="#reclamation">Réclamation auprès de la CNIL</a></li>
                    <li><a href="#photos">Consentement photographique</a></li>
                    <li><a href="#cookies">Cookies et traceurs</a></li>
                    <li><a href="#mineurs">Protection des données des mineurs</a></li>
                    <li><a href="#droit-applicable">Droit applicable</a></li>
                  </ol>
                </nav>

                <div className="mentions-section" id="editeur">
                  <h2>1. Éditeur du site</h2>
                  <p>
                    Le présent site est édité par l'association <strong>Les Coccinelles</strong>, association loi 1901 à but non lucratif,
                    gérant un multi-accueil (crèche associative) à Puilboreau (Charente-Maritime).
                  </p>
                  <ul>
                    <li><strong>Siège social :</strong> 10 rue Saint Vincent, 17138 Puilboreau</li>
                    <li><strong>Téléphone :</strong> 05 46 69 68 25</li>
                    <li><strong>Email :</strong> les.coccinelles17@orange.fr</li>
                    <li><strong>SIRET :</strong> à compléter par l'association</li>
                    <li><strong>Numéro RNA (Répertoire National des Associations) :</strong> à compléter par l'association</li>
                  </ul>
                </div>

                <div className="mentions-section" id="publication">
                  <h2>2. Directeur de la publication</h2>
                  <p>
                    La directrice du multi-accueil Les Coccinelles est responsable de la publication du présent site,
                    en sa qualité de représentante de l'association auprès du Conseil d'Administration.
                  </p>
                </div>

                <div className="mentions-section" id="hebergement">
                  <h2>3. Hébergement</h2>
                  <p>Le site est hébergé sur deux infrastructures distinctes :</p>
                  <ul>
                    <li>
                      <strong>Partie publique et espace parent/admin (frontend) :</strong> Vercel Inc.,
                      440 N Barranca Ave #4133, Covina, CA 91723, États-Unis — <em>vercel.com</em>
                    </li>
                    <li>
                      <strong>API et base de données (backend) :</strong> Alwaysdata SAS,
                      91 rue du Faubourg Saint-Honoré, 75008 Paris, France — <em>alwaysdata.com</em>
                    </li>
                  </ul>
                  <p>
                    Les données personnelles des familles (comptes, enfants, documents) sont stockées exclusivement
                    sur les serveurs de l'hébergeur français Alwaysdata. Certaines ressources statiques du site
                    public (pages, images non confidentielles) peuvent transiter par le réseau de diffusion de
                    contenu de Vercel, sans donnée personnelle associée.
                  </p>
                </div>

                <div className="mentions-section" id="propriete">
                  <h2>4. Propriété intellectuelle</h2>
                  <p>
                    L'ensemble des éléments composant ce site (textes, structure, identité visuelle, logo, illustrations,
                    photographies libres de droits) est la propriété exclusive de l'association Les Coccinelles,
                    sauf mention contraire. Toute reproduction, représentation, modification ou exploitation, totale ou
                    partielle, sans autorisation écrite préalable, est interdite et pourrait constituer une contrefaçon
                    sanctionnée par les articles L.335-2 et suivants du Code de la propriété intellectuelle.
                  </p>
                </div>

                <div className="mentions-section" id="donnees">
                  <h2>5. Données personnelles collectées</h2>
                  <p>
                    Conformément au Règlement (UE) 2016/679 du 27 avril 2016 (« RGPD ») et à la loi n°78-17 du 6 janvier 1978
                    modifiée relative à l'informatique, aux fichiers et aux libertés, l'association Les Coccinelles,
                    en qualité de responsable de traitement, collecte et traite les catégories de données suivantes :
                  </p>
                  <div className="mentions-tableau-wrapper">
                    <table className="mentions-tableau">
                      <thead><tr><th>Catégorie</th><th>Données concernées</th><th>Finalité</th></tr></thead>
                      <tbody>
                        {[
                          ['Identification du parent', 'Nom, prénom, email, téléphone, adresse postale, mot de passe (chiffré)', 'Création et gestion du compte utilisateur'],
                          ["Dossier de l'enfant", 'Nom, prénom, date de naissance, sexe, groupe, médecin traitant, allergies, traitements', "Suivi de l'inscription et de l'accueil quotidien"],
                          ['Suivi quotidien', 'Repas, sieste, humeur, notes des éducatrices', 'Compte-rendu transmis aux parents'],
                          ['Documents', "Pièces d'identité, carnet de santé, justificatifs, attestations CAF", "Constitution et instruction du dossier d'inscription"],
                          ['Photographies', "Photos de l'enfant prises à la crèche", 'Partage avec la famille, sous réserve de consentement'],
                          ['Messagerie', 'Contenu des messages et pièces jointes échangés avec l’équipe', 'Communication entre les familles et la crèche'],
                          ['Connexion', 'Identifiants de session (jeton JWT), journal technique de connexion', "Authentification et sécurité de l'accès à l'espace personnel"]
                        ].map(([cat, don, fin]) => (
                          <tr key={cat}><td>{cat}</td><td>{don}</td><td>{fin}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p>Ces données sont strictement nécessaires au fonctionnement de la structure et ne sont jamais revendues, louées ou cédées à des fins commerciales.</p>
                </div>

                <div className="mentions-section" id="base-legale">
                  <h2>6. Base légale des traitements</h2>
                  <ul>
                    <li><strong>Exécution du contrat</strong> (art. 6.1.b RGPD) : gestion de l'inscription et de l'accueil de l'enfant, une fois le contrat d'accueil signé avec l'association.</li>
                    <li><strong>Consentement</strong> (art. 6.1.a et 9.2.a RGPD) : publication de photographies de l'enfant, communication de données de santé sensibles (allergies, traitements).</li>
                    <li><strong>Obligation légale</strong> (art. 6.1.c RGPD) : conservation de certains documents administratifs et comptables imposée par la réglementation applicable aux établissements d'accueil du jeune enfant (EAJE).</li>
                    <li><strong>Intérêt légitime</strong> (art. 6.1.f RGPD) : sécurisation de la plateforme et prévention des fraudes (journalisation technique des connexions).</li>
                  </ul>
                </div>

                <div className="mentions-alerte" id="sante">
                  <h2>7. Données de santé des enfants</h2>
                  <p>
                    Les informations relatives à la santé des enfants (allergies, traitements médicaux, coordonnées du
                    médecin traitant, observations du personnel encadrant) constituent des <strong>données sensibles</strong>
                    {' '}au sens de l'article 9 du RGPD. Elles font l'objet d'un traitement renforcé :
                  </p>
                  <ul>
                    <li>Collecte limitée aux strictes informations nécessaires à la sécurité et au bien-être de l'enfant ;</li>
                    <li>Accès restreint à la direction et à l'équipe éducative en charge de l'enfant concerné ;</li>
                    <li>Aucune transmission à un tiers en dehors des professionnels de santé intervenant sur demande de la famille ou en cas d'urgence médicale ;</li>
                    <li>Suppression des données de santé dans le mois suivant la fin de l'accueil de l'enfant, sauf obligation légale contraire.</li>
                  </ul>
                </div>

                <div className="mentions-section" id="destinataires">
                  <h2>8. Destinataires et sous-traitants</h2>
                  <p>Les données personnelles sont destinées exclusivement :</p>
                  <ul>
                    <li>À la direction et à l'équipe éducative de la crèche, dans la limite de leurs fonctions respectives ;</li>
                    <li>Aux membres du Conseil d'Administration et du bureau, pour les seules données nécessaires à la gestion administrative et financière ;</li>
                    <li>Aux prestataires techniques hébergeant la plateforme (Vercel Inc. et Alwaysdata SAS, cf. section « Hébergement »), en qualité de sous-traitants au sens de l'article 28 du RGPD ;</li>
                    <li>Aux organismes publics compétents (CAF, PMI, communes de Puilboreau, Saint-Xandre et Esnandes) lorsque la loi ou une convention de financement l'exige.</li>
                  </ul>
                  <p>Aucune donnée n'est cédée, vendue ou transmise à des fins commerciales ou publicitaires.</p>
                </div>

                <div className="mentions-section" id="conservation">
                  <h2>9. Durée de conservation des données</h2>
                  <div className="mentions-tableau-wrapper">
                    <table className="mentions-tableau">
                      <thead><tr><th>Type de donnée</th><th>Durée de conservation</th></tr></thead>
                      <tbody>
                        {[
                          ['Compte parent (identité, contact)', "Durée de l'inscription + 1 an"],
                          ["Dossier de l'enfant (hors santé)", "Durée de l'inscription + 1 an"],
                          ["Données de santé de l'enfant", "1 mois après la fin de l'accueil"],
                          ["Photos de l'enfant", "Jusqu'au retrait du consentement, 1 an maximum après la fin de l'accueil"],
                          ['Messagerie', '2 ans après le dernier échange'],
                          ['Documents administratifs et comptables', 'Durée légale de 5 à 10 ans selon la nature du document'],
                          ['Journal de connexion (sécurité)', '1 an']
                        ].map(([type, duree]) => (
                          <tr key={type}><td>{type}</td><td>{duree}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mentions-section" id="securite">
                  <h2>10. Sécurité des données</h2>
                  <p>L'association Les Coccinelles met en œuvre les mesures techniques et organisationnelles suivantes pour protéger vos données :</p>
                  <ul>
                    <li>Chiffrement des mots de passe (algorithme bcrypt, non réversible) ;</li>
                    <li>Connexion sécurisée par jetons d'authentification à durée de vie limitée (JWT), sans cookie de suivi ;</li>
                    <li>Chiffrement des échanges entre votre navigateur et nos serveurs (HTTPS/TLS) ;</li>
                    <li>Contrôle d'accès par rôle : parent, éducatrice/admin, direction (super-admin), chacun n'accédant qu'aux données nécessaires à sa fonction ;</li>
                    <li>Sauvegardes régulières et hébergement sur des infrastructures professionnelles sécurisées.</li>
                  </ul>
                  <p>En cas de violation de données susceptible d'engendrer un risque pour vos droits et libertés, l'association s'engage à en informer la CNIL et les personnes concernées dans les délais prévus par le RGPD (72 heures).</p>
                </div>

                <div className="mentions-section" id="droits">
                  <h2>11. Vos droits</h2>
                  <p>Conformément aux articles 15 à 22 du RGPD, vous disposez des droits suivants sur vos données et celles de votre enfant :</p>
                  <div className="droits-grille">
                    {[
                      { icone: '👁️', droit: "Droit d'accès",         desc: "Consulter l'ensemble des données vous concernant" },
                      { icone: '✏️', droit: 'Droit de rectification',  desc: 'Corriger des données inexactes ou incomplètes' },
                      { icone: '🗑️', droit: "Droit à l'effacement",   desc: 'Demander la suppression de vos données, sauf obligation légale de conservation' },
                      { icone: '⏸️', droit: 'Droit à la limitation',   desc: "Demander la suspension temporaire d'un traitement contesté" },
                      { icone: '🚫', droit: "Droit d'opposition",     desc: "S'opposer à un traitement, notamment la publication de photos" },
                      { icone: '📦', droit: 'Droit à la portabilité',  desc: 'Recevoir vos données dans un format structuré et réutilisable' },
                      { icone: '🧭', droit: 'Directives post-mortem',  desc: 'Organiser le sort de vos données après votre décès' }
                    ].map(({ icone, droit, desc }) => (
                      <div key={droit} className="droit-item">
                        <span>{icone}</span>
                        <div><strong>{droit}</strong><p>{desc}</p></div>
                      </div>
                    ))}
                  </div>
                  <p>
                    Pour exercer l'un de ces droits, contactez la direction de la crèche par email à
                    {' '}<strong>les.coccinelles17@orange.fr</strong> ou par courrier à l'adresse du siège social
                    (10 rue Saint Vincent, 17138 Puilboreau), en joignant un justificatif d'identité.
                    Une réponse vous sera apportée dans un délai maximum d'un mois.
                  </p>
                </div>

                <div className="mentions-section" id="reclamation">
                  <h2>12. Réclamation auprès de la CNIL</h2>
                  <p>
                    Si vous estimez, après nous avoir contactés, que vos droits ne sont pas respectés, vous pouvez
                    introduire une réclamation auprès de la Commission Nationale de l'Informatique et des Libertés (CNIL) :
                  </p>
                  <ul>
                    <li>En ligne : <em>cnil.fr/fr/plaintes</em></li>
                    <li>Par courrier : CNIL — 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07</li>
                  </ul>
                </div>

                <div className="mentions-section" id="photos">
                  <h2>13. Consentement photographique</h2>
                  <p>
                    La prise et la publication de photographies de votre enfant (sur l'espace parent et, le cas échéant,
                    sur les supports de communication de la crèche) nécessitent votre consentement explicite et préalable,
                    recueilli lors de l'inscription. Ce consentement :
                  </p>
                  <ul>
                    <li>est spécifique à chaque enfant et peut différer entre les deux parents ;</li>
                    <li>peut être retiré à tout moment, gratuitement, depuis votre espace parent ou par simple demande écrite ;</li>
                    <li>entraîne, en cas de retrait, le retrait et la non-publication de toute nouvelle photo de l'enfant.</li>
                  </ul>
                </div>

                <div className="mentions-section" id="cookies">
                  <h2>14. Cookies et traceurs</h2>
                  <p>
                    Ce site n'utilise <strong>aucun cookie</strong>, qu'il soit publicitaire, de mesure d'audience ou de
                    traçage. L'authentification à votre espace personnel repose sur un jeton technique (JWT) conservé
                    dans le stockage local de votre navigateur (<em>localStorage</em>), qui n'est ni transmis à des tiers,
                    ni utilisé à des fins de suivi publicitaire, et qui est supprimé à la déconnexion.
                  </p>
                </div>

                <div className="mentions-section" id="mineurs">
                  <h2>15. Protection des données des mineurs</h2>
                  <p>
                    Les données relatives aux enfants accueillis sont traitées avec une vigilance particulière, conformément
                    aux recommandations de la CNIL concernant les données des mineurs. Elles ne sont jamais utilisées à des
                    fins de profilage, de prospection ou de décision automatisée, et leur accès est strictement limité aux
                    personnes habilitées (parents, équipe éducative, direction).
                  </p>
                </div>

                <div className="mentions-section" id="droit-applicable">
                  <h2>16. Droit applicable et litiges</h2>
                  <p>
                    Les présentes mentions légales sont soumises au droit français. En cas de litige et à défaut de
                    résolution amiable, les tribunaux du ressort de La Rochelle seront seuls compétents, sous réserve
                    des règles impératives de compétence applicables en matière de consommation.
                  </p>
                </div>
              </>
            )
          }

          <p className="mentions-date">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

        </div>
      </section>

    </div>
  );
};

export default MentionsLegales;

// ============================================================
// FICHIER  : CoccinelleSvg.jsx
// ROUTE    : Composant utilisé par CoccinelleDefilement et Chargement
// RÔLE     : Dessin SVG de la coccinelle de la crèche (vue de dessus,
//            tête en haut), en 3 étapes :
//              - 'fermee' : carapace fermée, ailes rangées
//              - 'mi'     : carapace entrouverte, ailes à moitié sorties
//              - 'ouverte': carapace levée, grandes ailes orange déployées
//            Les passages d'une étape à l'autre sont animés en CSS.
// ============================================================

import './CoccinelleSvg.css';

/**
 * Props :
 * - etat      : 'fermee' (défaut), 'mi' ou 'ouverte'
 * - battement : true = les ailes battent (entre 'mi' et 'ouverte')
 * - className : classe CSS supplémentaire (taille, position...)
 */
const CoccinelleSvg = ({ etat = 'fermee', battement = false, className = '' }) => (
  <svg
    viewBox="0 0 100 100"
    className={`coccinelle-svg coccinelle-svg--${etat} ${battement ? 'coccinelle-svg--battement' : ''} ${className}`}
    aria-hidden="true"   // Dessin décoratif : ignoré par les lecteurs d'écran
    focusable="false"
  >
    {/* Antennes terminées par une petite boule */}
    <path className="coccinelle-svg__trait" d="M45 25 Q42 17 39 13 M55 25 Q58 17 61 13" />
    <circle className="coccinelle-svg__brun" cx="39" cy="12.5" r="2.8" />
    <circle className="coccinelle-svg__brun" cx="61" cy="12.5" r="2.8" />

    {/* Ailes orange avec nervures (rangées sous la carapace au repos) */}
    <g className="coccinelle-svg__aile coccinelle-svg__aile--g">
      <path className="coccinelle-svg__membrane" d="M48 62 C28 53 2 58 -3 71 C2 84 28 86 48 75 Z" />
      <path className="coccinelle-svg__nervure" d="M46 65 Q25 58 6 63 M46 68 Q24 69 2 71 M46 71 Q25 79 7 79" />
    </g>
    <g className="coccinelle-svg__aile coccinelle-svg__aile--d">
      <path className="coccinelle-svg__membrane" d="M52 62 C72 53 98 58 103 71 C98 84 72 86 52 75 Z" />
      <path className="coccinelle-svg__nervure" d="M54 65 Q75 58 94 63 M54 68 Q76 69 98 71 M54 71 Q75 79 93 79" />
    </g>

    {/* Abdomen rayé (visible quand la carapace s'ouvre) */}
    <ellipse className="coccinelle-svg__brun-clair" cx="50" cy="65" rx="15" ry="19" />
    <path className="coccinelle-svg__rayure" d="M37 60 Q50 64 63 60 M36 69 Q50 73 64 69 M39 77 Q50 81 61 77" />

    {/* Thorax et tête */}
    <ellipse className="coccinelle-svg__brun" cx="50" cy="43" rx="13" ry="9" />
    <ellipse className="coccinelle-svg__brun" cx="50" cy="32" rx="15" ry="11" />

    {/* Élytre gauche : moitié de carapace rouge et ses points */}
    <g className="coccinelle-svg__elytre coccinelle-svg__elytre--g">
      <path className="coccinelle-svg__rouge" d="M50 33 A30 30 0 0 0 50 93 Z" />
      <circle className="coccinelle-svg__brun" cx="38" cy="50" r="4.2" />
      <circle className="coccinelle-svg__brun" cx="28" cy="65" r="3.6" />
      <circle className="coccinelle-svg__brun" cx="38" cy="80" r="3.8" />
    </g>

    {/* Élytre droit (symétrique) */}
    <g className="coccinelle-svg__elytre coccinelle-svg__elytre--d">
      <path className="coccinelle-svg__rouge" d="M50 33 A30 30 0 0 1 50 93 Z" />
      <circle className="coccinelle-svg__brun" cx="62" cy="50" r="4.2" />
      <circle className="coccinelle-svg__brun" cx="72" cy="65" r="3.6" />
      <circle className="coccinelle-svg__brun" cx="62" cy="80" r="3.8" />
    </g>

    {/* Ligne centrale et point du milieu : seulement carapace fermée */}
    <g className="coccinelle-svg__couture">
      <path className="coccinelle-svg__trait" d="M50 34 L50 92" />
      <path className="coccinelle-svg__brun" d="M50 59 L53 63 L50 67 L47 63 Z" />
    </g>
  </svg>
);

export default CoccinelleSvg;

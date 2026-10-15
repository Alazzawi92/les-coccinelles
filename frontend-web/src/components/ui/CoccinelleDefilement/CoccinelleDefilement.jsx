// ============================================================
// FICHIER  : CoccinelleDefilement.jsx
// ROUTE    : Composant global du site public (PublicLayout)
// RÔLE     : Coccinelle "retour en haut" sur le bord droit de l'écran.
//            - Au repos : carapace fermée.
//            - Pendant le défilement, elle ouvre ses ailes, les bat et se
//              déplace : en haut de l'écran = début de la page, en bas = fin.
//            - Quand le défilement s'arrête, elle se pose et referme ses ailes.
//            - Tête vers le bas quand on descend, vers le haut quand on monte.
//            - Au clic, ailes grandes ouvertes, elle ramène en haut de la page.
//            C'est un vrai bouton : accessible au clavier et aux
//            lecteurs d'écran ("Retour en haut de la page").
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import CoccinelleSvg from '../CoccinelleSvg/CoccinelleSvg';
import { useMouvementReduit } from '../../../utils/mouvement';
import './CoccinelleDefilement.css';

// Défilement minimal (px) avant de faire apparaître la coccinelle
const SEUIL_APPARITION = 150;

// Délai sans défilement (ms) au bout duquel on considère que l'on s'est arrêté
const DELAI_ARRET = 150;

// Marges de la piste verticale (px) : sous la barre de navigation, au-dessus du bas
const MARGE_HAUT = 96;
const MARGE_BAS = 100;

// Zigzag : une ondulation gauche / droite tous les ~565 px défilés (2π × 90)
const LONGUEUR_ZIGZAG = 90;
const INCLINAISON_MAX = 18;   // Inclinaison de la tête dans le zigzag (degrés)

const CoccinelleDefilement = () => {

  const { t } = useTranslation();
  const reduit = useMouvementReduit();

  // Bouton déplacé directement (sans re-rendu React à chaque défilement)
  const boutonRef = useRef(null);

  const [visible, setVisible] = useState(false);    // Affichée après un peu de défilement
  const [enVol, setEnVol] = useState(false);        // true pendant le défilement
  const [versLeBas, setVersLeBas] = useState(true); // Sens du défilement (orientation de la tête)
  const [retour, setRetour] = useState(false);      // true pendant le retour en haut (ailes ouvertes)

  useEffect(() => {
    let dernierY = window.scrollY;
    let minuteurArret = null;
    let image = null;

    // Place la coccinelle selon la progression dans la page (0 = début, 1 = fin)
    const placer = () => {
      image = null;
      const bouton = boutonRef.current;
      if (!bouton) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progression = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      const piste = window.innerHeight - MARGE_HAUT - MARGE_BAS;

      // Zigzag lié à la position de défilement : elle ondule quand on défile
      // et reste immobile quand on s'arrête
      const phase = window.scrollY / LONGUEUR_ZIGZAG;
      const amplitude = window.innerWidth < 768 ? 10 : 18;     // Moins large sur mobile
      const x = Math.sin(phase) * amplitude;
      // La tête penche du côté où elle se dirige (même formule en montée et en descente)
      const inclinaison = -Math.cos(phase) * INCLINAISON_MAX;

      bouton.style.transform =
        `translate(${x}px, ${MARGE_HAUT + progression * piste}px) rotate(${inclinaison}deg)`;
    };

    const auDefilement = () => {
      const y = window.scrollY;
      if (y !== dernierY) setVersLeBas(y > dernierY);
      dernierY = y;

      setVisible(y > SEUIL_APPARITION);
      setEnVol(true);
      if (y < 5) setRetour(false);          // Arrivée en haut : on replie les ailes

      // Elle se pose quand le défilement s'arrête
      clearTimeout(minuteurArret);
      minuteurArret = setTimeout(() => setEnVol(false), DELAI_ARRET);

      // Une seule mise à jour de position par image affichée (fluide et léger)
      if (!image) image = requestAnimationFrame(placer);
    };

    placer();
    setVisible(window.scrollY > SEUIL_APPARITION);
    window.addEventListener('scroll', auDefilement, { passive: true });
    window.addEventListener('resize', placer);

    return () => {
      window.removeEventListener('scroll', auDefilement);
      window.removeEventListener('resize', placer);
      clearTimeout(minuteurArret);
      cancelAnimationFrame(image);
    };
  }, []);

  // Clic : retour en haut de la page (instantané si "Réduire les animations")
  const remonter = () => {
    setRetour(true);
    window.scrollTo({ top: 0, behavior: reduit ? 'auto' : 'smooth' });
  };

  // Classes d'état : visible, sens de la tête (vers le haut pendant le retour)
  const classes = [
    'coccinelle-defil',
    visible && 'coccinelle-defil--visible',
    (versLeBas && !retour) && 'coccinelle-defil--bas'
  ].filter(Boolean).join(' ');

  // Étape du dessin : fermée au repos, ailes qui battent en vol,
  // grandes ouvertes pendant le retour en haut
  const etat = retour ? 'ouverte' : enVol ? 'mi' : 'fermee';

  return (
    <button
      ref={boutonRef}
      type="button"
      className={classes}
      onClick={remonter}
      aria-label={t('common.retourHaut')}
      title={t('common.retourHaut')}
    >
      <span className="coccinelle-defil__corps">
        <CoccinelleSvg etat={etat} battement={enVol || retour} />
      </span>
    </button>
  );
};

export default CoccinelleDefilement;

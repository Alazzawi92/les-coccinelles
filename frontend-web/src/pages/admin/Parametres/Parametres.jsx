// ============================================================
// FICHIER  : Parametres.jsx (admin)
// ROUTE    : /admin/parametres (super admin uniquement)
// RÔLE     : Deux interrupteurs du site :
//             1. Espace parents : connexion des parents
//             2. Création de comptes et nouvelles inscriptions
//                (sans effet si l'espace parents est fermé)
//            Chaque changement demande une confirmation, puis le
//            site public est mis à jour sans recharger la page.
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import { getLocale } from '../../../i18n';
import { useParametres } from '../../../context/ParametresContext';
import Chargement from '../../../components/ui/Chargement/Chargement';
import '../../../styles/admin.css';
import './Parametres.css';

// Préfixe des clés de traduction de la page
const P = 'admin.parametres';

// Interrupteurs affichés : clé en base + préfixe de traduction + icône
const INTERRUPTEURS = [
  { cle: 'espace_parents_ouvert',    trad: 'espace',   icone: '👨‍👩‍👧' },
  { cle: 'creation_comptes_ouverte', trad: 'creation', icone: '📝' }
];

const Parametres = () => {
  const { t } = useTranslation(); // Fonction de traduction FR / EN
  const { recharger } = useParametres(); // Met à jour le site public après un changement

  // reglages : { cle: { ouvert, modifie_le, modifie_par } } ; null = chargement
  const [reglages, setReglages] = useState(null);
  const [envoi,    setEnvoi]    = useState(null); // Clé en cours d'enregistrement

  const charger = useCallback(() => {
    api.get('/parametres')
      .then(res => setReglages(res.data.data || {}))
      .catch(() => { setReglages({}); toast.error(t(`${P}.erreurChargement`)); });
  }, [t]);

  useEffect(() => { charger(); }, [charger]);

  // Bascule un interrupteur après confirmation
  const basculer = async (cle, trad) => {
    const nouvelleValeur = !reglages[cle]?.ouvert;
    const question = t(`${P}.${trad}.${nouvelleValeur ? 'confirmerOuvrir' : 'confirmerFermer'}`);
    if (!window.confirm(question)) return;

    setEnvoi(cle);
    try {
      await api.put('/parametres', { [cle]: nouvelleValeur });
      toast.success(t(`${P}.enregistre`));
      charger();     // Date et auteur de la modification
      recharger();   // Boutons du site public
    } catch (err) {
      toast.error(err.response?.data?.message || t(`${P}.erreur`));
    }
    setEnvoi(null);
  };

  if (!reglages) return <Chargement />;

  // La création de comptes ne compte que si l'espace parents est ouvert
  const espaceOuvert = Boolean(reglages.espace_parents_ouvert?.ouvert);

  return (
    <div>
      <div className="admin-page-entete">
        <h1 className="admin-page-titre"><Trans i18nKey={`${P}.titre`} components={{ s: <span /> }} /></h1>
      </div>
      <p className="parametres-intro">{t(`${P}.intro`)}</p>

      <div className="parametres-liste">
        {INTERRUPTEURS.map(({ cle, trad, icone }) => {
          const reglage  = reglages[cle] || {};
          const ouvert   = Boolean(reglage.ouvert);
          const sansEffet = cle === 'creation_comptes_ouverte' && !espaceOuvert;
          const idTitre  = `parametre-${cle}`;

          return (
            <div key={cle} className={`a-card parametre-carte${sansEffet ? ' parametre-carte--inactive' : ''}`}>
              <div className="parametre-carte__texte">
                <h2 id={idTitre} className="parametre-carte__titre">{icone} {t(`${P}.${trad}.titre`)}</h2>
                <p className="parametre-carte__description">{t(`${P}.${trad}.texte`)}</p>
                {sansEffet && <p className="parametre-carte__alerte">⚠️ {t(`${P}.creation.sansEffet`)}</p>}
                {/* Dernière modification (date + super admin) */}
                {reglage.modifie_le && (
                  <p className="parametre-carte__modifie">
                    {t(reglage.modifie_par ? `${P}.modifie` : `${P}.modifieSansNom`, {
                      date: new Date(reglage.modifie_le).toLocaleString(getLocale(), { dateStyle: 'long', timeStyle: 'short' }),
                      nom:  reglage.modifie_par
                    })}
                  </p>
                )}
              </div>

              {/* Interrupteur : role="switch" annonce l'état ouvert / fermé */}
              <button
                type="button"
                role="switch"
                aria-checked={ouvert}
                aria-labelledby={idTitre}
                className={`parametre-switch${ouvert ? ' parametre-switch--ouvert' : ''}`}
                onClick={() => basculer(cle, trad)}
                disabled={envoi !== null || sansEffet}
              >
                <span className="parametre-switch__piste" aria-hidden="true"><span className="parametre-switch__bouton" /></span>
                <span className="parametre-switch__etat">{t(ouvert ? `${P}.ouvert` : `${P}.ferme`)}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Parametres;

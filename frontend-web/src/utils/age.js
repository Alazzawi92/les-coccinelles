// ============================================================
// FICHIER  : age.js
// RÔLE     : Âge d'un enfant, UNIQUE fonction utilisée partout
//            (Mes enfants, tableau de bord parent, liste admin).
//            "7 mois", "1 an", "2 ans et 7 mois" (traduit FR / EN).
//            Appelée pendant le rendu : i18n.t suit la langue active.
// ============================================================

import i18n from '../i18n';

export const calculerAge = (dateNaissance) => {
  if (!dateNaissance) return '';
  const naissance  = new Date(dateNaissance);
  const maintenant = new Date();
  // Mois entiers écoulés (un mois n'est compté que si le jour est atteint)
  let mois = (maintenant.getFullYear() - naissance.getFullYear()) * 12 + (maintenant.getMonth() - naissance.getMonth());
  if (maintenant.getDate() < naissance.getDate()) mois -= 1;
  mois = Math.max(0, mois);
  const ans   = Math.floor(mois / 12);   // Années complètes
  const reste = mois % 12;               // Mois en plus des années
  if (ans === 0)   return i18n.t('common.age.mois', { count: reste });
  if (reste === 0) return i18n.t('common.age.ans',  { count: ans });
  return i18n.t('common.age.ansEtMois', {
    ans:  i18n.t('common.age.ans',  { count: ans }),
    mois: i18n.t('common.age.mois', { count: reste })
  });
};

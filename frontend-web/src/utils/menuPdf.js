// ============================================================
// FICHIER  : menuPdf.js
// RÔLE     : Génère et télécharge le menu d'une semaine au format
//            PDF (A4 paysage), dans l'esprit du menu imprimé de la
//            crèche, en plus soigné :
//             - en-tête : titre rose « SEMAINE DU … AU … » encadré
//               de deux coccinelles dessinées, nom de la crèche dessous
//             - 5 colonnes (lundi → vendredi) : cadre arrondi teinté,
//               nom du jour dans une étiquette de la couleur du jour,
//               un plat par ligne, séparateur « Goûter »
//             - sous chaque jour : encart des 14 allergènes
//               (rouge + pastille = présent, gris = absent)
//             - pied de page : légende + nom de la crèche
//            Polices du site (Fredoka, Nunito) chargées au clic depuis
//            /fonts ; si elles ne se chargent pas → Helvetica.
//            jsPDF est chargé uniquement au clic pour ne pas alourdir
//            le chargement du site.
// ============================================================

// ── Mise en page (en mm, A4 paysage = 297 × 210) ─────────────
const MARGE         = 9;     // Marge gauche / droite
const ECART         = 5;     // Espace entre deux colonnes
const Y_TITRE       = 17;    // Ligne de base du titre
const Y_SOUS_TITRE  = 24;    // Ligne de base du sous-titre
const Y_CADRE       = 37;    // Haut des cadres des jours
const H_CADRE       = 87;    // Hauteur des cadres des jours
const EPAISSEUR     = 1.4;   // Épaisseur de la bordure des cadres
const RAYON         = 6;     // Arrondi des cadres
const H_ETIQUETTE   = 9;     // Hauteur de l'étiquette du jour
const Y_CONTENU     = Y_CADRE + H_ETIQUETTE / 2 + 3; // Début de la zone des plats
const BAS_CONTENU   = Y_CADRE + H_CADRE - 4;         // Fin de la zone des plats
const Y_ENCART      = Y_CADRE + H_CADRE + 4;         // Haut de l'encart allergènes
const H_ENCART      = 70;    // Hauteur de l'encart allergènes
const LIGNE_ALLERG  = 4.15;  // Hauteur d'une ligne d'allergène
const Y_PIED        = 204;   // Ligne de base du pied de page
const ECART_PLATS   = 1.6;   // Espace supplémentaire entre deux plats
const PT_EN_MM      = 0.3528; // 1 point typographique = 0,3528 mm

// ── Couleurs (RVB) : PDF → pas de variables CSS possibles ────
const BLANC      = [255, 255, 255];
const NOIR       = [0, 0, 0];
const ROSE_TITRE = [244, 81, 167];
const TEXTE      = [45, 52, 54];    // Même valeur que --text-dark
const GRIS       = [150, 158, 162]; // Allergène absent, textes secondaires
const FOND_ENCART = [247, 246, 243];
const ROUGE      = [229, 57, 53];   // Allergène présent (même valeur que --error)
const ROUGE_COCCINELLE = [255, 45, 85]; // Même valeur que --accent-2
// Couleur de chaque jour, de lundi à vendredi (reprend le menu imprimé)
const COULEURS_JOURS = [
  [255, 102, 196], // Lundi : rose
  [120, 200, 80],  // Mardi : vert
  [70, 180, 192],  // Mercredi : turquoise
  [255, 128, 48],  // Jeudi : orange
  [255, 200, 40]   // Vendredi : jaune
];

// Mélange deux couleurs : part = 0 → couleur a, part = 1 → couleur b
const melanger = (a, b, part) => a.map((v, i) => Math.round(v + (b[i] - v) * part));
const teinte   = (c) => melanger(c, BLANC, 0.9);   // Fond très clair du cadre
const fonce    = (c) => melanger(c, NOIR, 0.35);   // Texte « Goûter » lisible
// Texte de l'étiquette : foncé sur le jaune (contraste), blanc sinon
const texteEtiquette = (c) => (c[0] * 0.299 + c[1] * 0.587 + c[2] * 0.114 > 186 ? fonce(c) : BLANC);

// Hauteur (mm) d'une ligne de texte pour une taille de police donnée
const hauteurLigne = (taille) => taille * PT_EN_MM * 1.2;

// ── Polices ──────────────────────────────────────────────────
const POLICES = [
  { fichier: 'Fredoka-SemiBold.ttf', nom: 'Fredoka' }, // Titres
  { fichier: 'Nunito-Bold.ttf',      nom: 'Nunito' }   // Textes
];

// Fichier binaire → base64 (format attendu par jsPDF), par paquets
// pour ne pas dépasser la taille maximale d'appel de fonction
const versBase64 = (buffer) => {
  const octets = new Uint8Array(buffer);
  let binaire = '';
  for (let i = 0; i < octets.length; i += 0x8000) {
    binaire += String.fromCharCode.apply(null, octets.subarray(i, i + 0x8000));
  }
  return btoa(binaire);
};

// Ajoute Fredoka et Nunito au document. Renvoie les noms de polices à
// utiliser : celles du site, ou Helvetica si le chargement échoue.
const chargerPolices = async (doc) => {
  try {
    const fichiers = await Promise.all(POLICES.map(async ({ fichier }) => {
      const reponse = await fetch(`${process.env.PUBLIC_URL || ''}/fonts/${fichier}`);
      if (!reponse.ok) throw new Error(`Police introuvable : ${fichier}`);
      return reponse.arrayBuffer();
    }));
    POLICES.forEach(({ fichier, nom }, i) => {
      doc.addFileToVFS(fichier, versBase64(fichiers[i]));
      doc.addFont(fichier, nom, 'normal');
    });
    return { titre: ['Fredoka', 'normal'], texte: ['Nunito', 'normal'] };
  } catch {
    return { titre: ['helvetica', 'bold'], texte: ['helvetica', 'bold'] }; // Repli : PDF quand même lisible
  }
};

// ── Coccinelle dessinée (décor de l'en-tête) ─────────────────
// x, y : centre du corps ; r : rayon ; sens : 1 = tête à gauche, -1 = à droite
const dessinerCoccinelle = (doc, x, y, r, sens) => {
  doc.setFillColor(...TEXTE);
  doc.circle(x - sens * r * 0.95, y, r * 0.5, 'F');            // Tête
  doc.setFillColor(...ROUGE_COCCINELLE);
  doc.circle(x, y, r, 'F');                                      // Corps rouge
  doc.setDrawColor(...TEXTE);
  doc.setLineWidth(0.5);
  doc.line(x - sens * r, y, x + sens * r, y);                    // Séparation des ailes
  doc.setFillColor(...TEXTE);
  [[-0.35, -0.5], [0.35, -0.5], [-0.4, 0.5], [0.4, 0.5], [0.05, -0.15]].forEach(([dx, dy]) => {
    doc.circle(x + dx * r, y + dy * r, r * 0.17, 'F');           // Points noirs
  });
  doc.setFillColor(...BLANC);
  doc.circle(x - sens * r * 1.15, y - r * 0.2, r * 0.1, 'F');    // Yeux
  doc.circle(x - sens * r * 1.15, y + r * 0.2, r * 0.1, 'F');
};

// titre      : titre du document (propriétés du PDF)
// enTete     : « Semaine du 2 au 6 novembre » (affiché en majuscules)
// jours      : [{ nom, midi: [plats], gouter: [plats], allergenes: [{ libelle, present }] }]
//              du lundi au vendredi, plats en texte simple (un élément par plat)
// labels     : { sousTitre, gouter, allergenes, nonRenseigne, legende, pied }
// nomFichier : nom du fichier téléchargé
export const telechargerMenuPdf = async ({ titre, enTete, jours, labels, nomFichier }) => {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ format: 'a4', unit: 'mm', orientation: 'landscape' });
  doc.setProperties({ title: titre });
  const police = await chargerPolices(doc);

  const largeurPage    = doc.internal.pageSize.getWidth();
  const largeurColonne = (largeurPage - 2 * MARGE - 4 * ECART) / 5;
  const largeurTexte   = largeurColonne - 8;

  // ── En-tête : titre rose + sous-titre + 2 coccinelles ──────
  doc.setFont(...police.titre);
  doc.setFontSize(27);
  doc.setTextColor(...ROSE_TITRE);
  const texteTitre = enTete.toUpperCase();
  doc.text(texteTitre, largeurPage / 2, Y_TITRE, { align: 'center' });

  doc.setFont(...police.texte);
  doc.setFontSize(10);
  doc.setTextColor(...GRIS);
  doc.text(labels.sousTitre, largeurPage / 2, Y_SOUS_TITRE, { align: 'center' });

  // Coccinelles de part et d'autre du titre, tournées vers lui
  doc.setFont(...police.titre);
  doc.setFontSize(27);
  const demiTitre = doc.getTextWidth(texteTitre) / 2;
  dessinerCoccinelle(doc, largeurPage / 2 - demiTitre - 14, Y_TITRE - 3.5, 5, -1);
  dessinerCoccinelle(doc, largeurPage / 2 + demiTitre + 14, Y_TITRE - 3.5, 5, 1);

  jours.forEach((jour, i) => {
    const couleur = COULEURS_JOURS[i % COULEURS_JOURS.length];
    const x       = MARGE + i * (largeurColonne + ECART); // Bord gauche de la colonne
    const xCentre = x + largeurColonne / 2;

    // ── Cadre arrondi : fond teinté + bordure de la couleur du jour ─
    doc.setFillColor(...teinte(couleur));
    doc.setDrawColor(...couleur);
    doc.setLineWidth(EPAISSEUR);
    doc.roundedRect(x, Y_CADRE, largeurColonne, H_CADRE, RAYON, RAYON, 'FD');

    // ── Étiquette du jour, à cheval sur le haut du cadre ─────
    doc.setFont(...police.titre);
    doc.setFontSize(15);
    const largeurEtiquette = doc.getTextWidth(jour.nom) + 14;
    doc.setFillColor(...couleur);
    doc.roundedRect(xCentre - largeurEtiquette / 2, Y_CADRE - H_ETIQUETTE / 2, largeurEtiquette, H_ETIQUETTE, H_ETIQUETTE / 2, H_ETIQUETTE / 2, 'F');
    doc.setTextColor(...texteEtiquette(couleur));
    doc.text(jour.nom, xCentre, Y_CADRE + 1.9, { align: 'center' });

    // ── Plats : taille réduite pas à pas jusqu'à ce que tout tienne ─
    const midi   = jour.midi.length   ? jour.midi   : [labels.nonRenseigne];
    const gouter = jour.gouter.length ? jour.gouter : [labels.nonRenseigne];
    const H_SEPARATEUR = 13; // Place du séparateur « Goûter »
    let taille = 12.5;
    let platsMidi, platsGouter, hauteurTotale;
    doc.setFont(...police.texte);
    do {
      doc.setFontSize(taille);
      // Chaque plat → ses lignes (un plat long passe sur plusieurs lignes)
      platsMidi   = midi.map(p => doc.splitTextToSize(p, largeurTexte));
      platsGouter = gouter.map(p => doc.splitTextToSize(p, largeurTexte));
      const hauteurPlats = (plats) =>
        plats.reduce((h, lignes) => h + lignes.length * hauteurLigne(taille), 0) + (plats.length - 1) * ECART_PLATS;
      hauteurTotale = hauteurPlats(platsMidi) + H_SEPARATEUR + hauteurPlats(platsGouter);
      taille -= 0.5;
    } while (hauteurTotale > BAS_CONTENU - Y_CONTENU && taille > 6);
    taille += 0.5; // Dernière taille essayée (celle qui tient)

    // Écrit une liste de plats centrés à partir de y, renvoie le y suivant
    const ecrirePlats = (plats, y) => {
      doc.setFont(...police.texte);
      doc.setFontSize(taille);
      doc.setTextColor(...TEXTE);
      plats.forEach(lignes => {
        lignes.forEach(ligne => {
          doc.text(ligne, xCentre, y + hauteurLigne(taille) * 0.8, { align: 'center' });
          y += hauteurLigne(taille);
        });
        y += ECART_PLATS;
      });
      return y - ECART_PLATS;
    };

    // Contenu centré verticalement dans la zone des plats
    let y = Y_CONTENU + (BAS_CONTENU - Y_CONTENU - hauteurTotale) / 2;
    y = ecrirePlats(platsMidi, y);

    // ── Séparateur « Goûter » : texte entre deux traits ──────
    const ySep = y + H_SEPARATEUR / 2;
    doc.setFont(...police.titre);
    doc.setFontSize(16);
    doc.setTextColor(...fonce(couleur));
    doc.text(labels.gouter, xCentre, ySep + 2, { align: 'center' });
    const demiGouter = doc.getTextWidth(labels.gouter) / 2;
    doc.setDrawColor(...couleur);
    doc.setLineWidth(0.6);
    doc.line(x + 5, ySep, xCentre - demiGouter - 3, ySep);
    doc.line(xCentre + demiGouter + 3, ySep, x + largeurColonne - 5, ySep);

    ecrirePlats(platsGouter, y + H_SEPARATEUR);

    // ── Encart des allergènes sous le cadre ──────────────────
    doc.setFillColor(...FOND_ENCART);
    doc.roundedRect(x, Y_ENCART, largeurColonne, H_ENCART, 4, 4, 'F');

    doc.setFont(...police.titre);
    doc.setFontSize(11);
    doc.setTextColor(...TEXTE);
    doc.text(labels.allergenes, xCentre, Y_ENCART + 6, { align: 'center' });

    // Présent → rouge + pastille ; absent → gris discret
    doc.setFont(...police.texte);
    doc.setFontSize(8.5);
    jour.allergenes.forEach(({ libelle, present }, n) => {
      const yLigne = Y_ENCART + 11.3 + n * LIGNE_ALLERG;
      doc.setTextColor(...(present ? ROUGE : GRIS));
      doc.text(libelle, xCentre, yLigne, { align: 'center' });
      if (present) {
        doc.setFillColor(...ROUGE);
        doc.circle(xCentre - doc.getTextWidth(libelle) / 2 - 2.2, yLigne - 1, 0.9, 'F');
      }
    });
  });

  // ── Pied de page : légende à gauche, crèche à droite ───────
  doc.setFont(...police.texte);
  doc.setFontSize(8);
  doc.setFillColor(...ROUGE);
  doc.circle(MARGE + 1, Y_PIED - 1, 0.9, 'F');
  doc.setTextColor(...ROUGE);
  doc.text(labels.legende, MARGE + 3.5, Y_PIED);
  doc.setTextColor(...GRIS);
  doc.text(labels.pied, largeurPage - MARGE, Y_PIED, { align: 'right' });

  doc.save(nomFichier);
};

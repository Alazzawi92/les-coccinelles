// ============================================================
// FICHIER  : menuPdf.js
// RÔLE     : Génère et télécharge le menu d'une semaine au format
//            PDF (A4 portrait), directement dans le navigateur.
//            jsPDF est chargé uniquement au clic pour ne pas alourdir
//            le chargement du site.
// ============================================================

const MARGE          = 18;   // Marge de la page, en mm
const LARGEUR_LABEL  = 24;   // Colonne "Déjeuner" / "Goûter", en mm
const INTERLIGNE     = 5.5;  // Hauteur d'une ligne de texte, en mm
const ORANGE         = [255, 122, 69]; // Couleur principale de la crèche (--primary), en RVB
const GRIS_FONCE     = [45, 52, 54];
const GRIS_CLAIR     = [224, 224, 224];

// titre, sousTitre : textes de l'en-tête
// jours            : [{ nom, midi, gouter }] en texte simple, lundi en premier
// labels           : { dejeuner, gouter, nonRenseigne }
// nomFichier       : nom du fichier téléchargé
export const telechargerMenuPdf = async ({ titre, sousTitre, jours, labels, nomFichier }) => {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });

  const largeurPage = doc.internal.pageSize.getWidth();
  const basDePage   = doc.internal.pageSize.getHeight() - MARGE;
  const largeurTexte = largeurPage - 2 * MARGE - LARGEUR_LABEL;

  // ── En-tête ────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...ORANGE);
  doc.text(titre, MARGE, MARGE + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(...GRIS_FONCE);
  doc.text(sousTitre, MARGE, MARGE + 14);

  let y = MARGE + 26;

  // ── Un bloc par jour, l'un sous l'autre ────────────────────
  jours.forEach(({ nom, midi, gouter }) => {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    // Découpe chaque repas en lignes qui tiennent dans la largeur disponible
    const lignesMidi   = doc.splitTextToSize(midi   || labels.nonRenseigne, largeurTexte);
    const lignesGouter = doc.splitTextToSize(gouter || labels.nonRenseigne, largeurTexte);
    const hauteurBloc  = 10 + (lignesMidi.length + lignesGouter.length) * INTERLIGNE + 8;

    // Le bloc ne tient plus : il passe entier sur une nouvelle page
    if (y + hauteurBloc > basDePage) {
      doc.addPage();
      y = MARGE + 6;
    }

    // Nom du jour souligné
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...ORANGE);
    doc.text(nom, MARGE, y);
    doc.setDrawColor(...GRIS_CLAIR);
    doc.line(MARGE, y + 2, largeurPage - MARGE, y + 2);
    y += 9;

    // Déjeuner puis goûter : libellé à gauche, contenu à droite
    [[labels.dejeuner, lignesMidi], [labels.gouter, lignesGouter]].forEach(([label, lignes]) => {
      doc.setFontSize(11);
      doc.setTextColor(...GRIS_FONCE);
      doc.setFont('helvetica', 'bold');
      doc.text(label, MARGE, y);
      doc.setFont('helvetica', 'normal');
      doc.text(lignes, MARGE + LARGEUR_LABEL, y, { lineHeightFactor: INTERLIGNE / (11 * 0.3528) });
      y += lignes.length * INTERLIGNE;
    });

    y += 8; // Espace avant le jour suivant
  });

  doc.save(nomFichier);
};

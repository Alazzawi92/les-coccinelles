// ============================================================
// FICHIER : generer-guide.mjs
// RÔLE    : Régénère backend/assets/guide-inscription.pdf :
//           1. guide-inscription.html → PDF (pages 1 et 2) avec Chrome
//              en mode sans fenêtre (« headless »)
//           2. ajout de la page 3 : annexe-fiche-unique.pdf, telle quelle
// UTILISATION (voir LISEZMOI.md) :
//   npm install --no-save pdf-lib      (une seule fois, dans ce dossier)
//   node generer-guide.mjs [cheminChrome]
// ============================================================

import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath, pathToFileURL } from 'url';
import { PDFDocument } from 'pdf-lib';

const dossier = path.dirname(fileURLToPath(import.meta.url));         // Dossier source du guide
const sortie  = path.resolve(dossier, '..', 'guide-inscription.pdf');  // PDF servi par l'API

// Chrome : chemin passé en argument, sinon emplacement Windows habituel
const chrome = process.argv[2] || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

// ── 1. HTML → PDF (pages 1 et 2) ──────────────────────────────
const pagesGuide = path.join(os.tmpdir(), `guide-pages-${Date.now()}.pdf`);
execFileSync(chrome, [
  '--headless=new',
  '--disable-gpu',
  '--no-pdf-header-footer',          // Pas de date / adresse ajoutées par Chrome
  '--virtual-time-budget=5000',      // Laisse le temps aux polices et au logo de se charger
  `--print-to-pdf=${pagesGuide}`,
  pathToFileURL(path.join(dossier, 'guide-inscription.html')).href
], { stdio: 'ignore' });

// ── 2. Assemblage : pages 1-2 + annexe scannée ───────────────
const guide  = await PDFDocument.load(fs.readFileSync(pagesGuide));
const annexe = await PDFDocument.load(fs.readFileSync(path.join(dossier, 'annexe-fiche-unique.pdf')));
const final  = await PDFDocument.create();
for (const source of [guide, annexe]) {
  const pages = await final.copyPages(source, source.getPageIndices());
  pages.forEach(page => final.addPage(page));
}
final.setTitle('Guide pratique d\'inscription — Crèche Les Coccinelles');
final.setAuthor('Crèche Les Coccinelles');

fs.writeFileSync(sortie, await final.save());
fs.unlinkSync(pagesGuide); // Fichier intermédiaire supprimé
console.log(`Guide généré (${final.getPageCount()} pages) : ${sortie}`);

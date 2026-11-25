/**
 * Formilair — enregistrement des inscriptions dans Google Sheets.
 * À coller dans Extensions > Apps Script d'un Google Sheet, puis
 * Déployer > Nouveau déploiement > Application Web
 *   (Exécuter en tant que : Moi / Accès : Tout le monde).
 */
const SHEET_NAME = "Inscriptions";
const HEADERS = ["Date d'inscription", "ID", "Prénom", "Nom", "Téléphone", "Série",
                 "Études à l'étranger", "Université", "Bourse"];

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const d = JSON.parse(e.postData.contents);
    const clean = (v) => {
      let s = String(v == null ? "" : v).trim().slice(0, 100);
      if (/^[=+\-@]/.test(s)) s = "'" + s;          // neutralise l'injection de formules
      return s;
    };
    const rec = { id: clean(d.id), prenom: clean(d.prenom), nom: clean(d.nom),
      telephone: String(d.telephone || "").trim().slice(0, 20), serie: clean(d.serie), etudes: clean(d.etudes),
      universite: clean(d.universite), bourse: clean(d.bourse) };
    if (!/^[A-Z0-9]{2,6}-[A-Z0-9]{4,10}$/.test(rec.id) || !rec.prenom || !rec.nom ||
        !/^\+?[0-9 .()-]{8,20}$/.test(rec.telephone))
      return out({ ok: false, error: "Données invalides" });

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sh.getLastRow() === 0) { sh.appendRow(HEADERS); sh.setFrozenRows(1); }

    const rows = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 5).getValues() : [];
    const digits = (s) => String(s).replace(/\D/g, "");
    const ids = new Set(rows.map((r) => r[1]));

    // Même numéro de téléphone = déjà inscrit : on renvoie le ticket existant
    const known = rows.find((r) => digits(r[4]) === digits(rec.telephone));
    if (known) return out({ ok: true, id: known[1], duplicate: true });

    // Garantit l'unicité de l'ID
    while (ids.has(rec.id)) rec.id = rec.id.split("-")[0] + "-" + Utilities.getUuid().slice(0, 6).toUpperCase();

    sh.appendRow([new Date(), rec.id, rec.prenom, rec.nom, "", rec.serie,
                  rec.etudes, rec.universite, rec.bourse]);
    sh.getRange(sh.getLastRow(), 5).setNumberFormat("@").setValue(rec.telephone); // garde le + et les 0
    return out({ ok: true, id: rec.id });
  } catch (err) {
    return out({ ok: false, error: "Erreur serveur" });
  } finally {
    lock.releaseLock();
  }
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

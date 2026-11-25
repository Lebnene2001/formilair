# Changelog

## [2.0.0] — 2026-11-24

### Ajouté
- Enregistrement des inscriptions dans Google Sheets (Google Apps Script, fichier `Code.gs`).
- Détection des doublons par numéro de téléphone : la personne retrouve son ticket existant.
- Validation des champs avec messages d'erreur clairs et accessibles.
- Champ piège anti-robots, nettoyage anti-injection de formules côté Sheets.
- `config.js` : nom, date de l'événement et URL Sheets modifiables sans toucher au code.
- Bouton de téléchargement du ticket (`ticket-<ID>.png`) et ticket en haute définition.

### Modifié
- Refonte complète du design : mobile d'abord, focus clavier visible, contrastes renforcés.
- Identifiant généré avec `crypto.getRandomValues` (`BM-XXXXXX`, sans caractères ambigus) au lieu de `Math.random()` à 4 chiffres (collisions fréquentes).
- La date du ticket est la date de l'événement (et non la date du jour).
- Le QR code est dessiné directement sur le canvas, avec prise en charge des accents.
- Librairie QR embarquée dans le dépôt (`qrcode.js`) (plus de dépendance à un CDN).
- `formulaire.html` renommé `index.html` (compatible GitHub Pages) ; CSS déplacé dans `style.css`.
- Choix « Peut-être » de la question université remplacé par « Peu importe ».

### Supprimé
- Image du bandeau hébergée sur un site tiers.
- Commentaire avec chemin local dans `script.js`.

## [1.0.0] — 2025-08-07
- Première version : formulaire, ticket avec QR code, envoi WhatsApp.

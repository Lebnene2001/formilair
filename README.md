# Formilair

Formulaire d'inscription à la **Semaine d'orientation post-Bac**. À la validation, la personne reçoit un ticket d'accès (PNG) avec QR code, qu'elle peut télécharger ou envoyer sur WhatsApp. Les inscriptions sont enregistrées dans un Google Sheet.

Site statique : HTML, CSS et JavaScript, sans build ni dépendance à installer.

## Démarrage rapide

```bash
git clone https://github.com/<votre-compte>/formilair.git
cd formilair
python3 -m http.server 8000   # puis ouvrir http://localhost:8000
```

Sans configuration, le formulaire fonctionne en **mode hors-ligne** : le ticket est généré mais rien n'est enregistré.

## Configuration

Tout se règle dans `config.js` :

| Clé | Rôle |
| --- | --- |
| `eventName` | Nom affiché sur le formulaire et le ticket |
| `eventDate` | Date de l'événement, au format `AAAA-MM-JJ` |
| `idPrefix` | Préfixe des identifiants (`BM` → `BM-7K3QXA`) |
| `sheetsUrl` | URL du web app Google Apps Script (voir ci-dessous) |

## Enregistrer les inscriptions dans Google Sheets

1. Créez un Google Sheet vide.
2. **Extensions > Apps Script**, collez le contenu de `Code.gs`.
3. **Déployer > Nouveau déploiement > Application Web** : *Exécuter en tant que* **Moi**, *Accès* **Tout le monde**. Autorisez l'accès.
4. Copiez l'URL du déploiement (elle finit par `/exec`) dans `sheetsUrl` de `config.js`.
5. À chaque modification de `Code.gs`, refaites un déploiement (nouvelle version).

Une feuille « Inscriptions » est créée automatiquement. Un numéro de téléphone déjà inscrit ne crée pas de doublon : la personne récupère son ticket existant.

## Publier sur GitHub Pages

Dépôt > **Settings > Pages** > *Deploy from a branch* > `main` / `(root)`. Le site est servi à `https://<votre-compte>.github.io/formilair/`.

## Structure

```
index.html   page et formulaire
style.css    design
script.js    validation, ticket, envoi
config.js    réglages de l'événement
Code.gs      backend Google Sheets (à coller dans Apps Script)
qrcode.js    qrcode-generator 1.4.4 (MIT)
```

## Notes de sécurité

- L'URL du web app est publique par nature : elle n'accepte que des inscriptions validées côté serveur (format, longueur, anti-formules).
- Le Sheet contient des données personnelles (nom, téléphone) : ne le partagez qu'avec l'équipe d'organisation.

## Licence

À définir par le propriétaire du dépôt. La librairie `qrcode.js` est sous licence MIT (Kazuhiko Arase).

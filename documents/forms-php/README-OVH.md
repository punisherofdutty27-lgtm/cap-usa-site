# Formulaires CAP USA : endpoint PHP sur OVH (remplace Formspree)

État : **développé et testé en local, non déployé**. Formspree reste actif tant que chaque formulaire n'a pas été basculé et validé.

## Ce qui est livré
| Fichier | Rôle |
|---|---|
| `site/api/forms.php` | Endpoint unique (POST) : origine, jeton, champ piège, limitation, validation, consentement, envoi SMTP, file d'attente |
| `site/api/token.php` | Délivre un jeton signé à durée limitée (anti-robot) |
| `site/api/_core.php` | Fonctions internes (SMTP, limitation, journal) ; accès direct refusé par `.htaccess` |
| `site/api/.htaccess` | Refuse `_*.php`, journaux et fichiers `.eml` |
| `site/forms-guard.js` | Ajoute champ piège, jeton et identifiant d'envoi aux formulaires |
| `documents/forms-php/config.sample.php` | **Modèle** de configuration (sans secret) |
| `tests/forms-php/` | Tests locaux avec faux serveur SMTP (aucun envoi réel) |

## Installation sur OVH (à faire par vous, une seule fois)
1. **Client SFTP** (identifiant `hellocx`, dossier d'accueil `/home/hellocx`). Créer le dossier **`/home/hellocx/cap-usa-private/`**, au même niveau que `www/` (donc **hors** de l'espace public). Droits `0700`.
2. Copier `config.sample.php` dedans, le renommer **`config.php`** (droits `0600`) et remplir :
   - `smtp_pass` : mot de passe de la boîte `leads@hellocapusa.net` (à saisir vous-même ; ne jamais l'envoyer par message ni le mettre dans le dépôt) ;
   - `secret` : 64 caractères aléatoires (`php -r "echo bin2hex(random_bytes(32));"` ou un générateur de mots de passe).
3. Dans l'espace client OVH : **Hébergements > hellocapusa.net > Informations générales > Version PHP globale** : passer de 8.2 à 8.4 ou 8.5.
4. Le déploiement du site (GitHub → OVH) dépose `www/api/*` et `www/forms-guard.js`. Le dossier privé n'est **jamais** déployé par le dépôt.
5. DNS (recommandé) : ajouter un enregistrement DMARC pour `hellocapusa.net` (la zone et DKIM de ce domaine sont gérés par OVH).

## Sécurité
- Secrets uniquement dans `cap-usa-private/config.php`, jamais dans le HTML, le JavaScript ou le dépôt.
- Aucune pièce jointe ; refus des corps > 64 Ko ; champs en liste blanche par formulaire ; consentement obligatoire.
- Objet et en-têtes construits par le serveur ; sauts de ligne supprimés ; destinataire fixe (`mail_to`) : le client ne peut ni changer le destinataire ni ajouter de copie.
- Limitation : 5 envois / 10 min et 20 / jour par visiteur (empreinte HMAC de l'IP, l'IP n'est pas stockée) ; plafond global 60 / heure.
- Le journal (`logs/forms.log`) ne contient que : date, formulaire, code d'erreur. Jamais le contenu d'une demande.
- **File d'attente** (`queue/`) : si l'envoi SMTP échoue, le message complet est gardé (fichier `.eml`, droits 0600) et renvoyé automatiquement à l'envoi suivant ; supprimé après envoi ou après 14 jours. À mentionner dans la politique de confidentialité.
- Le visiteur ne voit jamais d'erreur technique : seulement le message générique déjà prévu par chaque page.

## Basculer un formulaire (étape ultérieure, formulaire par formulaire)
1. Remplacer `action="https://formspree.io/f/..."` par `action="/api/forms.php"`.
2. Ajouter `<script src="forms-guard.js" defer></script>` à la page.
3. Guide uniquement : ajouter `<input type="hidden" name="source" value="guide_page">`.
4. Retour arrière : remettre l'ancienne `action`.

## Tests locaux
`PHP_BIN=<chemin vers php> node tests/forms-php/run.js` : lance PHP et un faux SMTP sur `127.0.0.1`, puis exécute les scénarios (soumissions valides, champs manquants, consentement, robots, jeton, origine, limitation, injection d'en-têtes, erreurs SMTP + file d'attente, double envoi, secrets).

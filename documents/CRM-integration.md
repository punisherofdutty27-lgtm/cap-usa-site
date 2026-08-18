# Intégration CRM — structure de données et options de branchement

**Statut :** aucun CRM n'est connecté. Ce document décrit la structure de
données déjà envoyée par le site (prête à être consommée) et les options
pour brancher HubSpot ou Pipedrive **quand la décision sera prise** — rien
ici n'a été activé.

## 1. Ce que le site envoie déjà à chaque soumission

Chaque soumission de `qualForm` (`#diagnostic`) ou `leadForm` (`#contact`)
part vers Formspree avec, en plus des champs propres à chaque formulaire,
les 7 champs normalisés suivants (ajoutés en Phase 1, mêmes noms des deux
formulaires) :

| Champ | Exemple de valeur | Toujours rempli ? |
|---|---|---|
| `lead_status` | `nouveau` | Oui (constante à l'envoi ; à faire évoluer côté CRM) |
| `lead_score` | `6` | Seulement via `qualForm` (voir `lead-scoring-architecture.md`) |
| `project_type` | `societe`, `immigration`, `rappel`, … | Oui |
| `timeline` | `maintenant`, `3_6_mois`, … | Seulement via `qualForm` |
| `investment_range` | `100_250k`, `pas_necessaire`, … | Seulement via `qualForm`, branche immigration |
| `country` | valeur de « où résidez-vous » | Seulement via `qualForm` |
| `contact_preference` | `email`, `telephone`, `whatsapp` | `qualForm` : oui. `leadForm` : `telephone` en mode rappel, sinon vide |

Les champs non collectés par `leadForm` (formulaire court) partent vides —
ce n'est pas un bug, ce formulaire ne pose pas ces questions (voir la limite
notée dans `lead-scoring-architecture.md`, §4).

**Attribution marketing (ajoutée en Phase 5, sur les 3 formulaires du site,
y compris le lead magnet) :** `utm_source`, `utm_medium`, `utm_campaign`,
`utm_term`, `utm_content`, `gclid`, `fbclid`. Toujours présents dans l'envoi
mais vides si le visiteur n'est pas venu d'un lien publicitaire/tracké, ou
si le consentement "Publicité" n'a pas été donné (capture soumise au
consentement — voir `consent.js`). Utiles pour relier un lead reçu à la
campagne Google Ads qui l'a produit une fois le CRM branché.

`lead_label` (`HOT`/`WARM`/`COLD`) existe séparément, uniquement sur
`qualForm` — champ historique, non renommé.

## 2. Option A — Zapier / Make entre Formspree et le CRM (recommandé pour démarrer)

Formspree propose une intégration Zapier native. Le plus rapide à mettre en
place sans toucher au code du site :

1. Créer un compte Zapier (ou Make).
2. Trigger : *New Submission* sur le formulaire Formspree concerné
   (`xvkpapoq` = `qualForm` + `leadForm`, `xkjwrnzl` = lead magnet).
3. Action : *Create/Update Contact* (HubSpot) ou *Create Person/Deal*
   (Pipedrive), en mappant les champs ci-dessus vers les champs du CRM.
4. Filtrer par `lead_status`/`lead_label` si on veut un Zap distinct pour les
   leads HOT (ex. notification Slack en plus de la création CRM).

Avantage : zéro déploiement, réversible en un clic, pas de secret à gérer
côté site statique. Inconvénient : dépendance à un abonnement Zapier/Make au
volume suffisant.

## 3. Option B — Webhook natif

HubSpot et Pipedrive acceptent tous les deux des leads entrants par API
(HubSpot Forms API / Pipedrive Web Forms ou API REST). Techniquement, cela
demanderait soit :

- de pointer directement le `action` des formulaires vers l'endpoint du CRM
  (perd l'historique Formspree, plus risqué), soit
- un petit relais serveur (une fonction cloud légère) qui reçoit le webhook
  Formspree et le retransmet au CRM — Formspree propose des webhooks
  sortants sur les plans payants.

Recommandé seulement une fois le volume de leads justifiant d'éviter les
frais Zapier/Make, pas comme point de départ.

## 4. Ce qui reste à décider avant de connecter quoi que ce soit

- **Quel CRM** (HubSpot vs Pipedrive) — dépend d'outils déjà utilisés en
  interne, non tranché ici.
- **Le plan Formspree actuel supporte-t-il les webhooks/Zapier** (fonctionnalité
  liée au plan payant) — à vérifier dans la console Formspree.
- **Qui reçoit les notifications HOT** une fois un CRM branché (Slack ? SMS ?
  e-mail dédié ?) — question d'organisation interne, pas technique.

Tant que ces points ne sont pas tranchés, le site continue de fonctionner
exactement comme avant côté utilisateur — cette phase n'a fait qu'ajouter les
champs nécessaires pour que le branchement, le jour venu, soit une
configuration Zapier/Make d'une heure plutôt qu'un nouveau chantier de dev.

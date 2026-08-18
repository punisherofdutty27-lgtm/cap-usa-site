# Architecture du scoring de leads (HOT / WARM / COLD)

**Statut :** le calcul du score existe déjà et n'a pas été modifié. Ce document
explique son fonctionnement actuel et l'architecture de routage ajoutée en
Phase 1 (notification), en préparation d'un CRM (Phase 2+).

## 1. Où vit le scoring aujourd'hui

Uniquement dans le formulaire de qualification `#diagnostic` (`qualForm`),
`site/index.html`, fonctions `computeLeadScore()` / `computeLeadLabel()` :

- `timeline` (urgence du projet) : 0 à 3 points selon la réponse
- `project_stage` (où en est la personne) : 0 à 3 points
- `investment_range` renseigné : +1 point
- besoin déjà identifié (`hasClearNeed()`, dépend de la branche du projet) : +1 point
- **Score max : ~8. Seuils : HOT ≥ 5, WARM ≥ 2, COLD < 2.**

Le formulaire court `#contact` (`leadForm`) **ne calcule aucun score** : il ne
collecte pas les données nécessaires (délai, montant, stade du projet). Un
lead soumis directement via ce formulaire reçoit `lead_status=nouveau` mais
pas de `lead_score`/`lead_label` — c'est une limite connue, pas un bug (voir
§4).

## 2. Ce qui a été ajouté en Phase 1 : la notification prioritaire

Sans CRM connecté, le seul canal de notification actuel est l'e-mail
Formspree. Le score est maintenant utilisé pour **préfixer dynamiquement le
sujet de cet e-mail** (champ spécial Formspree `_subject`, envoyé au moment
du submit dans `qualForm`) :

- `🔥 LEAD HOT — CAP USA · <project_type>`
- `Nouveau lead (WARM) — CAP USA · <project_type>`
- `Nouveau lead (COLD) — CAP USA · <project_type>`

Concrètement : quiconque surveille la boîte mail peut trier par priorité
d'un coup d'œil, sans ouvrir chaque e-mail. C'est un mécanisme réel, actif
dès maintenant, sans dépendance nouvelle — mais c'est un pis-aller manuel,
pas une vraie notification prioritaire (pas de SMS/push, pas de délai de
traitement garanti).

## 3. Architecture cible (une fois un CRM branché)

```
Formulaire (qualForm / leadForm)
        │  POST (Formspree, aujourd'hui)
        ▼
  Formspree ──(à ajouter : Zapier/Make, ou webhook natif Formspree)──▶ CRM
        │
        ▼
  E-mail (sujet préfixé HOT/WARM/COLD — actuel)
```

Une fois le CRM branché (voir `CRM-integration.md`), le routage recommandé
par statut :

| Statut | Traitement recommandé |
|---|---|
| **HOT**  | Notification immédiate (Slack/SMS via le CRM ou Zapier), objectif de premier contact < 1h ouvrée |
| **WARM** | File de traitement normale, premier contact sous 24-48h (déjà la promesse affichée sur le site) |
| **COLD** | Séquence de nurturing automatisée (e-mails espacés, pas d'appel immédiat) plutôt qu'un traitement manuel individuel |

Le champ `lead_status` (voir `CRM-integration.md`) est distinct de
`lead_score`/`lead_label` : le score qualifie *l'intention*, le statut
qualifie *où en est le traitement du dossier* (nouveau → contacté → mis en
relation → etc.). Le site n'initialise aujourd'hui que `lead_status=nouveau`
— la suite du cycle de vie se gère côté CRM, pas côté site.

## 4. Limite connue à trancher en Phase 2

Pour que **tous** les leads (pas seulement ceux passés par le diagnostic)
aient un score, il faudrait ajouter au formulaire court `#contact` les mêmes
questions (délai, stade, montant) que `#diagnostic` — donc une modification
de formulaire visible, explicitement hors du périmètre de cette phase
(« ne pas modifier le design »). Recommandation pour la Phase 2 : soit
ajouter ces questions au formulaire court, soit le supprimer au profit d'un
renvoi systématique vers `#diagnostic`.

# Mapping HubSpot — préparation de connexion

**Statut : document de préparation. Aucun compte HubSpot n'est connecté, aucun
code n'a été modifié.** Ce document sert de référence unique au moment où la
connexion sera décidée (voir `CRM-integration.md` pour les options de
branchement — Zapier/Make recommandé pour démarrer).

Objets HubSpot utilisés : **Contact** (la personne — stable dans le temps) et
**Deal/Affaire** (le projet et son avancement dans le pipeline — propre à
chaque soumission). Un même contact pourrait en théorie soumettre plusieurs
projets ; séparer Contact/Deal évite d'écraser des données si ça arrive.

---

## 1. Mapping des champs site → HubSpot

### Informations personnelles (objet **Contact**)

| Champ site | Propriété HubSpot | Type HubSpot | Exemple |
|---|---|---|---|
| `first_name` (diagnostic) | `firstname` *(native)* | Texte simple | `Camille` |
| `last_name` (diagnostic) / `nom` (contact, nom complet) | `lastname` *(native)* | Texte simple | `Dupont` — pour `nom` (contact court, nom complet non séparé), saisir tel quel dans `lastname` ou séparer manuellement si besoin |
| `email` (diagnostic) / `email` (contact, champ `id="mail"`) | `email` *(native)* | E-mail | `camille.dupont@example.com` |
| `phone` (diagnostic) / `telephone` (contact) | `phone` *(native)* | Téléphone | `+33600000000` |
| `preferred_contact` (diagnostic) / — (absent du formulaire contact hors mode rappel) | `capusa_contact_preference` | Liste déroulante : `email` / `telephone` / `whatsapp` | `whatsapp` |

### Projet (objet **Deal**)

| Champ site | Propriété HubSpot | Type HubSpot | Exemple |
|---|---|---|---|
| `project_type` (valeurs : `societe`/`immigration`/`existante`/`ein_itin`/`banque`/`achat`/`rappel`/`autre`, ou `indecis`) | `capusa_project_type` | Liste déroulante | `societe` |
| `timeline` (valeurs diffèrent selon branche société/immigration — ex. `maintenant`, `3_6_mois`, `dsp`) | `capusa_timeline` | Liste déroulante | `maintenant` |
| `investment_range` (branche immigration uniquement) | `capusa_investment_range` | Liste déroulante | `100_250k` |
| `country` (Phase 1 : dérivé de `residency`, repli sur `nationality`) | `country` *(native Contact)* | Texte simple / liste native | `france` |
| `nationality` | `capusa_nationality` | Liste déroulante | `francaise` |
| `services_needed` (case à cocher multiple, valeurs multiples possibles) | `capusa_services_needed` | Case à cocher multiple | `creation;ein` |

### Qualification (objet **Deal**)

| Champ site | Propriété HubSpot | Type HubSpot | Exemple |
|---|---|---|---|
| `lead_score` | `capusa_lead_score` | Nombre | `6` |
| `lead_label` | `capusa_lead_label` | Liste déroulante : `HOT`/`WARM`/`COLD` | `HOT` |
| `project_stage` | `capusa_project_stage` | Liste déroulante | `urgent` |

### Attribution (objet **Deal** — propre à cette soumission, pas à la personne)

| Champ site | Propriété HubSpot | Type HubSpot | Exemple |
|---|---|---|---|
| `utm_source` | `capusa_utm_source` | Texte simple | `google` |
| `utm_medium` | `capusa_utm_medium` | Texte simple | `cpc` |
| `utm_campaign` | `capusa_utm_campaign` | Texte simple | `test_llc` |
| `utm_term` | `capusa_utm_term` | Texte simple | `creer llc` |
| `utm_content` | `capusa_utm_content` | Texte simple | *(vide si non renseigné)* |
| `gclid` | `capusa_gclid` | Texte simple | `Cj0KCQi...` |
| `fbclid` | `capusa_fbclid` | Texte simple | *(vide si non renseigné)* |
| `landing_page` *(ajouté par `consent.js`, pas un champ de formulaire)* | `capusa_landing_page` | Texte simple / URL | `/index.html` |

**Ne pas utiliser les propriétés natives HubSpot `hs_analytics_source` /
`hs_analytics_source_data_1-2`** — elles ne se remplissent qu'avec le script
de tracking natif HubSpot installé sur le site, qui n'existe pas ici (le site
n'utilise que GA4/Ads/Meta, et cette phase n'ajoute aucun nouveau script).
D'où le choix de propriétés custom alimentées via Zapier depuis Formspree.

### Commercial (objet **Deal**, sauf mention contraire)

| Champ site | Propriété HubSpot | Type HubSpot | Exemple |
|---|---|---|---|
| `lead_status` (le site envoie toujours `nouveau`) | **`dealstage`** *(native, pas une propriété custom)* — voir §2 | Étape de pipeline | `Nouveau lead` |
| *(n'existe pas côté site)* | `capusa_lawyer_assigned` | Texte simple *(ou liste déroulante si le nombre d'avocats partenaires reste limité et stable)* | `Me [Nom]` |
| *(n'existe pas côté site)* | `capusa_first_contact_date` | Sélecteur de date | `19/08/2026` |
| *(n'existe pas côté site)* | `capusa_consultation_date` | Sélecteur de date | `25/08/2026` |
| *(n'existe pas côté site)* | `capusa_lost_reason` | Liste déroulante : `injoignable`/`n'a pas engagé l'avocat`/`hors budget`/`projet abandonné`/`autre` | `injoignable` |

**`lead_status` n'a pas de propriété custom dédiée** : dès l'import Zapier,
la valeur `nouveau` sert uniquement à placer le deal sur la première étape du
pipeline. Toute la suite du cycle de vie est gérée nativement par `dealstage`
— créer une propriété custom séparée créerait deux sources de vérité
divergentes.

---

## 2. Pipeline HubSpot recommandé

| Étape | Objectif | Action attendue | Responsable |
|---|---|---|---|
| **Nouveau lead** | Accuser réception | Aucune — création automatique du deal | Automatisation |
| **À contacter** | Trier par priorité | Vérifier le score HOT/WARM/COLD, respecter le délai correspondant | Commercial |
| **Contact tenté** | Tracer les tentatives sans réponse | Consigner la tentative (appel/e-mail), programmer une relance | Commercial |
| **Contact effectué** | Confirmer un échange réel | Renseigner `capusa_first_contact_date` | Commercial |
| **Qualifié** | Confirmer le besoin humainement | Compléter/corriger les infos issues du formulaire si besoin | Commercial |
| **Avocat identifié** | Choisir le partenaire adapté | Renseigner `capusa_lawyer_assigned` | Commercial |
| **Mise en relation effectuée** | Transmettre le dossier | Envoyer les coordonnées au partenaire | Commercial |
| **Consultation réalisée** | Confirmer le rendez-vous tenu | Renseigner `capusa_consultation_date` (à obtenir via retour du partenaire ou du client) | Commercial |
| **Client gagné** | Clore favorablement | Marquer le deal gagné | Commercial |
| **Perdu** | Clore et documenter | Renseigner `capusa_lost_reason` obligatoirement | Commercial |

---

## 3. Automatisations recommandées

- **Création automatique de contact + deal** — déclenchée par une nouvelle soumission Formspree (`qualForm`, `leadForm` ou lead magnet) ; Zapier crée/retrouve le contact par e-mail, crée un deal sur l'étape « Nouveau lead », et remplit tous les champs du mapping ci-dessus en une seule fois.
- **Notification HOT** — déclenchée à la création d'un deal avec `capusa_lead_label = HOT` ; envoie une alerte (Slack ou e-mail dédié) distincte de la simple réception Formspree, pour un traitement sous 1h ouvrée.
- **Rappel SLA** — déclenché si un deal reste sur « À contacter » au-delà du délai propre à son score (HOT : 1h ouvrée, WARM : 24-48h) ; envoie un rappel au commercial concerné.
- **Nurturing COLD** — déclenché à la création d'un deal avec `capusa_lead_label = COLD` ; inscrit le contact dans une séquence e-mail automatisée plutôt qu'un appel individuel immédiat.

---

## 4. Données existantes vs à ajouter manuellement

**Déjà produit automatiquement par le site** (aucune ressaisie nécessaire une fois Zapier branché) : toutes les colonnes « Informations personnelles », « Projet », « Qualification » et « Attribution » du §1, plus `source` (indique quel formulaire a produit le lead) et `resume_qualification` (résumé texte déjà généré par le site, à mapper en note ou description libre du deal).

**À ajouter manuellement dans HubSpot, à chaque étape du traitement** : `capusa_lawyer_assigned`, `capusa_first_contact_date`, `capusa_consultation_date`, `capusa_lost_reason`, et la progression de `dealstage` au-delà de « Nouveau lead ». Ces champs n'existent nulle part côté site — c'est attendu, ce sont des décisions humaines postérieures à la soumission.

---

## 5. Checklist avant connexion

- [ ] Compte HubSpot créé (CRM gratuit)
- [ ] Propriétés custom créées (toutes les lignes `capusa_*` du §1)
- [ ] Pipeline à 10 étapes créé (§2)
- [ ] Outil d'intégration choisi — Zapier ou Make (aucun des deux encore sélectionné à ce jour)
- [ ] Test lead effectué de bout en bout (soumission réelle → apparition correcte du contact + deal dans HubSpot, tous champs remplis)
- [ ] Attribution UTM vérifiée (un lead soumis avec des paramètres UTM/gclid de test doit les retrouver dans les propriétés du deal)

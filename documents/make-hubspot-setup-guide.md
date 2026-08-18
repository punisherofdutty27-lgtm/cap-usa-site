# Guide d'installation opérationnel — Make + HubSpot (V1 CAP USA)

**Statut : documentation uniquement.** Aucun compte n'est connecté, aucune automatisation
n'est exécutée. Ce guide remplace la version précédente du même fichier (pipeline à 10
étapes, choix Make/Zapier non tranché) — décisions désormais figées après les Phases CRM
1 à 3 : **Make** (pas Zapier), pipeline à **7 étapes**, alerte HOT vers **`leads@hellocapusa.net`**
uniquement, **aucune notification automatisée vers le partenaire**.

**Règle d'exécution pour toute cette phase : une étape à la fois, validation explicite
après chaque étape avant de passer à la suivante.** Ce guide est structuré en conséquence
— chaque section se termine par un point de validation.

Je n'ai accès à aucun de ces comptes et ne dois jamais recevoir de mot de passe ou de clé
API en clair. Si un écran ne correspond pas exactement à ce qui est décrit ici (les
interfaces évoluent), le contenu à saisir (noms de champs, valeurs) reste la référence
fiable.

---

## Étape 0 — Pré-requis

- [ ] **Vérification Formspree** (plan actuel, webhooks disponibles, champs transmis,
      conservation UTM) — **en cours côté CAP USA à ce jour**. Bloquant : ne pas passer à
      l'étape 1 tant que ce point n'est pas confirmé.
- [ ] Accès administrateur disponible pour créer un compte HubSpot
- [ ] Accès administrateur disponible pour créer un compte Make
- [ ] Accès au tableau de bord Formspree (2 endpoints utilisés : `xvkpapoq` pour le
      diagnostic et le contact, `xkjwrnzl` pour le lead magnet)
- [ ] Confirmation que l'adresse **`leads@hellocapusa.net`** existe, ou création de cette
      adresse avant l'étape 4

**⏸ Validation requise avant de continuer : confirmer que l'étape 0 est complète.**

---

## Étape 1 — Ordre de création des comptes

1. Créer le compte **HubSpot** (CRM gratuit suffit pour cette V1 — aucune fonction payante
   nécessaire, l'automatisation passe entièrement par Make).
2. Créer le compte **Make**.
3. Ne rien connecter entre les deux à ce stade — cette étape ne fait que provisionner les
   comptes.

- [ ] Compte HubSpot créé
- [ ] Compte Make créé

**⏸ Validation requise avant de continuer.**

---

## Étape 2 — Créer les propriétés HubSpot

Dans HubSpot : **Paramètres → Propriétés**.

### Objet Contact

| Propriété | Type | Valeurs possibles |
|---|---|---|
| `firstname` *(natif, rien à créer)* | Texte simple | libre |
| `lastname` *(natif)* | Texte simple | libre |
| `email` *(natif)* | E-mail | libre |
| `phone` *(natif)* | Téléphone | libre |
| `country` *(natif)* | Texte simple | France, Belgique, Suisse, Canada, USA, Autre |
| `capusa_contact_preference` **(à créer)** | Liste déroulante | email / telephone / whatsapp |

### Objet Deal (Affaire) — toutes à créer

| Propriété | Type | Valeurs possibles |
|---|---|---|
| `capusa_project_type` | Liste déroulante | societe / immigration / existante / ein_itin / banque / achat / rappel / autre / indecis |
| `capusa_services_needed` | Case à cocher multiple | creation / ein / itin / registered_agent / banque / contrats / fiscalite / visa / modification / annual_report / fermeture / indecis |
| `capusa_timeline` | Liste déroulante | maintenant / 3_6_mois / prochainement / renseigne / dsp / moins_3_mois / 6_12_mois / plus_1_an / indecis |
| `capusa_investment_range` | Liste déroulante | moins_50k / 50_100k / 100_250k / 250_500k / plus_500k / indecis / pas_necessaire |
| `capusa_lead_score` | Nombre | 0 à 8 |
| `capusa_lead_label` | Liste déroulante | HOT / WARM / COLD *(vide si non scoré — voir Étape 4, Module 4)* |
| `capusa_utm_source` / `capusa_utm_medium` / `capusa_utm_campaign` / `capusa_utm_term` / `capusa_utm_content` | Texte simple ×5 | libre, vide si non renseigné |
| `capusa_gclid` / `capusa_fbclid` | Texte simple | libre, vide si non renseigné |
| `capusa_landing_page` | Texte / URL | libre |
| `capusa_source_formulaire` | Liste déroulante | questionnaire_qualification / contact_direct / homepage_lead_magnet |
| `capusa_partenaire_assigne` | Liste déroulante | Zouaghi Law PLLC *(une seule valeur réelle pour l'instant)* |
| `capusa_date_mise_en_relation` | Sélecteur de date | — |
| `capusa_date_consultation` | Sélecteur de date | — |
| `capusa_resultat` | Liste déroulante | converti / perdu_injoignable / perdu_pas_engage / perdu_hors_budget / perdu_abandonne / perdu_autre |

- [ ] Propriété Contact créée (`capusa_contact_preference`)
- [ ] Les 14 propriétés Deal créées

**⏸ Validation requise avant de continuer.**

---

## Étape 3 — Créer le pipeline

Dans HubSpot : **Paramètres → Objets → Affaires → Pipelines** → créer un pipeline
« CAP USA — Mise en relation » avec, dans l'ordre, ces 7 étapes :

1. Nouveau lead
2. Qualification
3. Appel CAP USA
4. Mise en relation expert
5. Consultation partenaire
6. Converti *(étape « gagnée »)*
7. Perdu *(étape « perdue »)*

**Important :** « Converti » et « Perdu » doivent être deux étapes finales distinctes, pas
fusionnées — sinon le taux de transformation devient incalculable.

- [ ] Pipeline créé avec les 7 étapes dans le bon ordre
- [ ] « Converti » marquée comme étape gagnée, « Perdu » comme étape perdue

**⏸ Validation requise avant de continuer.**

---

## Étape 4 — Configurer le scénario Make, module par module

### Module 1 — Webhook (déclencheur)

Nouveau scénario Make → module **Webhooks → Custom webhook**. Make génère une URL.

Dans **Formspree** (tableau de bord → formulaire concerné → *Integrations*/*Webhooks*),
ajouter cette URL comme destination sortante, pour les **2 endpoints** (`xvkpapoq` et
`xkjwrnzl`). L'e-mail Formspree habituel continue d'être envoyé en parallèle — rien n'est
retiré.

### Module 2 — Create or Update Contact (HubSpot)

Rechercher/créer par `email`. Mapper : `first_name`/`nom` → `firstname`, `last_name` →
`lastname`, `email`/`mail` → `email`, `phone`/`telephone` → `phone`, `country` → `country`,
`preferred_contact` → `capusa_contact_preference`. Attention : le nom du champ source varie
selon le formulaire d'origine (`email` vs `mail`, `phone` vs `telephone`).

### Module 3 — Create Deal (HubSpot)

Associer au contact du Module 2. Étape initiale **toujours « Nouveau lead »**, jamais une
autre — la progression dans le pipeline est une décision humaine. Mapper tous les champs
Deal de l'Étape 2 ci-dessus, y compris les 7 champs UTM/gclid/fbclid et
`capusa_landing_page`.

### Module 4 — Router conditionnel sur `capusa_lead_label`

Ajouter un **Router** juste après la création du deal, avec ces branches :

- **HOT** → Module 5 (notification e-mail)
- **WARM** → aucune action automatique, le deal suit le pipeline normalement
- **COLD** → aucune action automatisée en V1 (nurturing explicitement hors périmètre)
- **Vide** (formulaire court `leadForm`, lead magnet — ces formulaires ne produisent pas de
  score) → traiter comme WARM par défaut, ne jamais laisser sans branche

### Module 5 — Envoi e-mail (branche HOT uniquement)

Module **Email → Send an email**, destinataire **`leads@hellocapusa.net`** — adresse fixe
unique, saisie en dur dans ce module. Objet suggéré :
`🔥 LEAD HOT — [prénom] [nom] — [type de projet]`. Corps : résumé du besoin + lien direct
vers la fiche Deal HubSpot.

> **Garde-fou impératif, à vérifier sur chaque module avant activation :** aucun module de
> ce scénario n'envoie de donnée ni de notification vers une adresse liée au partenaire
> juridique (Zouaghi Law). Le partenaire n'est informé que manuellement, par un commercial
> CAP USA, à l'étape « Mise en relation expert » du pipeline — jamais par une
> automatisation. Pas de module Slack en V1 (email uniquement).

- [ ] Module 1 (Webhook) configuré, connecté à Formspree
- [ ] Module 2 (Contact) configuré
- [ ] Module 3 (Deal) configuré, étape initiale vérifiée = « Nouveau lead »
- [ ] Module 4 (Router) configuré avec les 4 branches (HOT/WARM/COLD/vide→WARM)
- [ ] Module 5 (e-mail HOT) configuré vers `leads@hellocapusa.net` uniquement
- [ ] Relecture des 5 modules : aucune adresse ou champ lié au partenaire n'apparaît nulle part

**⏸ Validation requise avant de continuer. Ne pas activer le scénario à ce stade.**

---

## Étape 5 — Procédure de test

**Avant tout test réel : le scénario Make reste en mode brouillon/désactivé jusqu'à
validation explicite de passer en test.**

| # | Scénario | Données d'entrée | Résultat attendu |
|---|---|---|---|
| 1 | Diagnostic HOT | `#diagnostic`, délai « maintenant » + stade « urgent » (score ≥ 5) | Contact + Deal créés, étape « Nouveau lead », `capusa_lead_label = HOT`, e-mail reçu sur `leads@hellocapusa.net` |
| 2 | Diagnostic WARM | `#diagnostic`, profil intermédiaire (score 2 à 4) | Contact + Deal créés, `capusa_lead_label = WARM`, aucune notification immédiate |
| 3 | Formulaire contact simple | `#contact` (`leadForm`), mode « Être mis en relation » | Contact + Deal créés, `capusa_lead_label` vide à la source, routé en WARM par défaut (Module 4) |
| 4 | Lead magnet | Formulaire de capture e-mail (guides gratuits) | Contact créé/retrouvé, Deal créé avec champs projet vides (normal — ce formulaire ne les collecte pas) |
| 5 | Isolation du partenaire (test négatif) | Inspecter les 5 modules après le Test 1 | Aucune trace d'envoi vers une adresse liée à Zouaghi Law, dans aucun module |

Pour chaque test : noter statut (à faire / réussi / échec), qui l'a exécuté, la date.

Après les 5 tests validés :

- [ ] Supprimer/archiver tous les contacts et deals de test dans HubSpot
- [ ] Confirmer qu'aucun test n'a déclenché d'envoi vers le partenaire

**⏸ Validation requise avant toute activation en production — cette validation est
distincte de la checklist elle-même : même tous les tests réussis, l'activation attend un
accord explicite.**

---

## Ce que ce guide ne couvre pas (hors périmètre V1, volontairement)

- Nurturing e-mail avancé pour les leads COLD
- Séquences marketing HubSpot
- Campagnes publicitaires
- Objet « Entreprise » HubSpot pour les partenaires (à construire seulement si un 2ᵉ
  partenaire réel rejoint le réseau)
- Mise à jour de la politique de confidentialité (`politique-confidentialite.html`) — clause
  déjà rédigée en brouillon ailleurs, publication à traiter comme une phase séparée, avec
  validation de l'avocat/déontologue avant toute action sur le site

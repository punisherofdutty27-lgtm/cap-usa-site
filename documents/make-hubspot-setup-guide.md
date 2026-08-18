# Guide de configuration — Formspree → Make → HubSpot

**À suivre vous-même dans vos comptes.** Je n'ai accès à aucun de ces
comptes et ne dois jamais recevoir de mot de passe ou de clé API en clair.
Ce guide s'appuie sur le mapping déjà défini dans `hubspot-mapping.md` (noms
de propriétés, pipeline) et sur les priorités de `sales-playbook.md`
(notifications HOT/WARM/COLD) — gardez ces deux documents ouverts en
parallèle.

Si un écran ne correspond pas exactement à ce qui est décrit ici (les
interfaces évoluent), le contenu à saisir (noms de champs, valeurs) reste la
référence fiable — dites-le-moi et je réajuste ce guide.

---

## Étape 0 — Prérequis

- [ ] Compte HubSpot créé (CRM gratuit suffit pour démarrer), avec accès administrateur
- [ ] Compte Make créé
- [ ] Accès à votre compte Formspree (les 2 endpoints utilisés par le site : `xvkpapoq` pour le diagnostic et le contact, `xkjwrnzl` pour le lead magnet)
- [ ] Vérifier le plan Formspree actuel et sa limite de soumissions (point déjà signalé dans `ads-launch-checklist.md`, à confirmer maintenant si ce n'est pas déjà fait)

---

## Étape 1 — Créer les propriétés custom dans HubSpot

Dans HubSpot : **Paramètres → Propriétés**.

Pour l'objet **Contact**, créer :
- `capusa_contact_preference` (liste déroulante : email / telephone / whatsapp)

*(`firstname`, `lastname`, `email`, `phone`, `country` sont déjà natifs — rien à créer pour ceux-là.)*

Pour l'objet **Deal (Affaire)**, créer toutes les propriétés `capusa_*` listées dans `hubspot-mapping.md` §1 :
`capusa_project_type`, `capusa_timeline`, `capusa_investment_range`,
`capusa_nationality`, `capusa_services_needed`, `capusa_lead_score`,
`capusa_lead_label`, `capusa_project_stage`, `capusa_utm_source`,
`capusa_utm_medium`, `capusa_utm_campaign`, `capusa_utm_term`,
`capusa_utm_content`, `capusa_gclid`, `capusa_fbclid`,
`capusa_landing_page`, `capusa_lawyer_assigned`,
`capusa_first_contact_date`, `capusa_consultation_date`,
`capusa_lost_reason`.

Reprenez le type de champ indiqué dans le tableau du mapping pour chacune (liste déroulante, texte simple, nombre, date, case à cocher multiple).

- [ ] Toutes les propriétés Contact créées
- [ ] Toutes les propriétés Deal créées

---

## Étape 2 — Créer le pipeline à 10 étapes

Dans HubSpot : **Paramètres → Objets → Affaires → Pipelines** → créer un pipeline « CAP USA — Mise en relation » avec, dans l'ordre, les 10 étapes de `sales-playbook.md` / `hubspot-mapping.md` §2 :

1. Nouveau lead
2. À contacter
3. Contact tenté
4. Contact effectué
5. Qualifié
6. Avocat identifié
7. Mise en relation effectuée
8. Consultation réalisée
9. Client gagné *(étape « gagnée »)*
10. Perdu *(étape « perdue »)*

- [ ] Pipeline créé avec les 10 étapes dans le bon ordre

---

## Étape 3 — Connecter Formspree à Make

Dans Make : créer un nouveau scénario, module déclencheur = **Webhooks → Custom webhook**.

Make génère une URL de webhook. Dans **Formspree** (tableau de bord du formulaire concerné → *Integrations* ou *Webhooks*), ajoutez cette URL comme destination d'intégration sortante — Formspree enverra alors chaque soumission à Make en plus de l'e-mail habituel (l'envoi e-mail existant n'est pas supprimé, les deux coexistent).

À répéter pour les **2 endpoints** (`xvkpapoq` et `xkjwrnzl`), ou router les deux vers le même webhook Make si l'outil le permet (le scénario peut ensuite distinguer via le champ `source` déjà présent dans chaque soumission).

- [ ] Webhook Make créé
- [ ] Formspree `xvkpapoq` connecté
- [ ] Formspree `xkjwrnzl` connecté

---

## Étape 4 — Construire le scénario Make

Après le module Webhook, enchaîner :

**4.1 — Create or Update Contact (HubSpot)**
Rechercher/créer par `email`. Mapper : `first_name`/`nom`→`firstname`, `last_name`→`lastname`, `email`→`email`, `phone`/`telephone`→`phone`, `country`→`country`, `preferred_contact`→`capusa_contact_preference` (voir `hubspot-mapping.md` pour les cas où le champ source diffère selon le formulaire d'origine — `email` vs `mail`, `phone` vs `telephone`).

**4.2 — Create Deal (HubSpot)**
Associer au contact créé/trouvé en 4.1. Stage initial : **« Nouveau lead »** — jamais une autre étape à la création (voir la note de `hubspot-mapping.md` : `lead_status` du site initialise uniquement cette première étape, la suite se gère dans HubSpot). Mapper tous les champs `capusa_*` selon le tableau du mapping, y compris les 7 champs UTM/gclid/fbclid et `capusa_landing_page`.

**4.3 — Router conditionnel sur `lead_label`**
Ajouter un **Router** Make juste après la création du deal, avec 3 branches :

- **Branche HOT** (`capusa_lead_label = HOT`) → module de notification immédiate (e-mail dédié ou Slack, au choix) — objet du message : rappeler le délai maximum de contact d'1h ouvrée (voir `sales-playbook.md` §1)
- **Branche WARM** (`capusa_lead_label = WARM`) → aucune action automatique supplémentaire ; le deal suit le traitement normal du pipeline (délai 24-48h)
- **Branche COLD** (`capusa_lead_label = COLD`) → ajouter le contact à une liste HubSpot dédiée au nurturing (ou déclencher une séquence e-mail HubSpot si disponible sur votre plan) plutôt qu'une notification commerciale

Les leads sans score (`leadForm`, `leadMagnet` — voir la limite déjà documentée dans `lead-scoring-architecture.md` §4) n'ont pas de `capusa_lead_label` : les router par défaut vers un traitement WARM standard plutôt que de les laisser sans branche.

- [ ] Module Contact configuré et testé
- [ ] Module Deal configuré et testé
- [ ] Router HOT/WARM/COLD configuré
- [ ] Notification HOT connectée à un canal réel (e-mail ou Slack)

---

## Étape 5 — Vérification complète (à exécuter avant activation en production)

1. **Test HOT** : soumettre le diagnostic sur le site avec des réponses produisant un score ≥ 5 (ex. délai « maintenant », stade « urgent »). Vérifier : le contact et le deal apparaissent dans HubSpot, `capusa_lead_label = HOT`, l'étape est « Nouveau lead », la notification immédiate est bien reçue.
2. **Test COLD** : même test avec des réponses produisant un score < 2. Vérifier l'ajout à la liste/séquence de nurturing plutôt qu'une notification commerciale.
3. **Test attribution** : soumettre avec une URL contenant `?utm_source=test&utm_medium=test&utm_campaign=test&gclid=TEST123`, en acceptant le consentement « Publicité » sur la bannière cookies (rappel : sans ce consentement, les champs UTM restent vides — comportement RGPD attendu, voir `ads-launch-checklist.md`). Vérifier que `capusa_utm_source`, `capusa_utm_campaign` et `capusa_gclid` arrivent correctement sur le deal.
4. **Test formulaire court** (`leadForm`, mode « relation » et mode « rappel ») : vérifier que le contact/deal se créent aussi depuis ce second endpoint, avec les champs disponibles pour ce formulaire (certains resteront vides — normal, voir `hubspot-mapping.md`).
5. **Nettoyage** : une fois les tests validés, supprimer ou archiver les contacts/deals de test dans HubSpot avant l'activation réelle.

- [ ] Lead test HOT traversé de bout en bout
- [ ] Lead test COLD traversé de bout en bout
- [ ] Attribution marketing vérifiée (UTM + gclid)
- [ ] Formulaire court testé
- [ ] Données de test nettoyées
- [ ] Scénario Make activé en production

---

## Après activation

Reprendre les KPI de `sales-playbook.md` §5 devenus mesurables dès cette connexion (délai de premier contact, taux de mise en relation, taux consultation, taux client gagné, coût par dossier qualifié) — désormais calculables directement depuis les propriétés et dates du pipeline HubSpot.

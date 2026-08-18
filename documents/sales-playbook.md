# Playbook commercial — traitement des leads CAP USA

**Statut :** préparation opérationnelle, à appliquer dès que le CRM (voir
`hubspot-mapping.md`) sera connecté. Utilisable dès aujourd'hui même sans
CRM, en s'appuyant sur le score déjà présent dans chaque e-mail Formspree
(`lead_label` HOT/WARM/COLD, sujet préfixé — voir `lead-scoring-architecture.md`).

**Règle transversale, valable pour tout ce document :** CAP USA qualifie,
coordonne et suit. CAP USA ne conseille jamais sur le fond juridique et ne
promet jamais un résultat (visa obtenu, société validée, délai garanti).
Voir §6.

---

## 1. Règles de priorité

### HOT
- **Critères** : score ≥ 5 (ex. délai « maintenant »/« dès que possible » + stade « urgent »/« prêt à commencer » + besoin clairement identifié)
- **Délai maximum de contact** : 1h ouvrée
- **Action attendue** : appel téléphonique direct en priorité (pas d'e-mail d'abord), sur le canal préféré s'il est renseigné (téléphone/WhatsApp)

### WARM
- **Critères** : score entre 2 et 4 — projet réel mais moins urgent ou moins avancé
- **Délai** : 24-48h (cohérent avec la promesse déjà affichée publiquement sur le site — à ne jamais dépasser)
- **Action** : contact sur le canal préféré, proposer un créneau d'échange plutôt qu'exiger une réponse immédiate

### COLD
- **Traitement recommandé** : pas d'appel individuel immédiat. Intégration dans une séquence de nurturing e-mail (envoi des guides gratuits déjà existants sur le site — création de société, visa E-2). Contact humain déclenché seulement si le lead réagit (ouvre un e-mail, revient sur le site) ou après un délai de réchauffement.

---

## 2. Process nouveau lead

1. **Réception lead** — arrivée automatique (e-mail Formspree aujourd'hui, CRM demain). La boîte de réception doit être surveillée en continu pendant les heures ouvrées, en priorité pour les sujets préfixés HOT.
2. **Vérification informations** — contrôle rapide : e-mail valide, téléphone au bon format, cohérence du besoin décrit (`resume_qualification`). Objectif : écarter les tests/spam avant d'investir du temps commercial.
3. **Premier contact** — selon la règle de priorité (§1) et le canal préféré.
4. **Qualification humaine** — confirmer à l'oral ce que le score automatique a estimé ; ajuster si l'échange révèle une réalité différente du formulaire (ex. quelqu'un ayant répondu « je ne sais pas encore » partout mais qui a en fait un projet précis).
5. **Choix avocat** — sélectionner le partenaire pertinent selon le type de projet (société / immigration / banque) et, si plusieurs partenaires sont disponibles, la spécialité et la langue.
6. **Mise en relation** — transmettre les coordonnées du lead au partenaire (dans le cadre du consentement déjà recueilli dans le formulaire), et informer le lead que l'avocat va le contacter.
7. **Suivi** — vérifier que l'échange avec l'avocat a bien eu lieu, relancer si nécessaire (§4), documenter le résultat.

---

## 3. Scripts de premier contact

Tous les scripts ci-dessous respectent strictement §6 : aucune promesse de résultat, aucun avis sur le fond juridique, l'avocat reste toujours désigné comme l'interlocuteur pour le conseil.

### E-mail — nouveau lead

> **Objet :** Votre projet [société / visa] aux États-Unis — CAP USA
>
> Bonjour [Prénom],
>
> Merci pour votre demande concernant [résumé court du besoin]. Nous avons bien reçu les informations transmises.
>
> Pour avancer, nous aimerions échanger quelques minutes avec vous afin de mieux comprendre votre projet et de vous orienter vers l'avocat partenaire le plus adapté à votre situation.
>
> Êtes-vous disponible [proposer 2 créneaux] ? Vous pouvez aussi nous répondre directement à ce message.
>
> Cordialement,
> [Prénom] — CAP USA

### E-mail — relance sans réponse

> **Objet :** On reste disponibles pour votre projet aux États-Unis
>
> Bonjour [Prénom],
>
> Nous n'avons pas encore réussi à échanger avec vous suite à votre demande. Si votre projet est toujours d'actualité, nous restons disponibles pour vous mettre en relation avec l'avocat partenaire adapté.
>
> Un simple mot ou un appel suffit pour reprendre l'échange.
>
> Cordialement,
> CAP USA

### WhatsApp — premier contact

> Bonjour [Prénom], c'est [Prénom] de CAP USA 👋 Nous avons bien reçu votre demande concernant votre projet aux États-Unis. Je peux vous appeler dans les prochaines minutes, ou on peut échanger ici si vous préférez — comme vous voulez.

### WhatsApp — confirmation de rendez-vous

> C'est confirmé : votre échange avec [Nom de l'avocat], avocat partenaire, est prévu le [date] à [heure] [en visioconférence : lien / par téléphone]. Il pourra répondre à vos questions sur votre dossier. N'hésitez pas si vous avez besoin de reprogrammer.

---

## 4. Gestion des relances

| | J0 | J+2 | J+7 | J+30 |
|---|---|---|---|---|
| **HOT** | Appel immédiat (<1h) ; si pas de réponse, 2ᵉ essai le jour même + SMS/WhatsApp | Dernier essai avant bascule en traitement WARM | — | — |
| **WARM** | Premier contact (sous 24-48h) | Relance si pas de réponse | Dernière relance avant bascule en nurturing COLD | — |
| **COLD** | E-mail d'accueil + guide gratuit (pas d'appel) | — | E-mail de contenu utile lié à son projet | E-mail de réactivation (« toujours dans vos projets ? ») |

Un lead HOT sans réponse après J+2 redescend en traitement WARM plutôt que d'être abandonné — l'urgence déclarée à J0 ne justifie plus un traitement prioritaire indéfini. Le droit à la désinscription (déjà géré par la politique de confidentialité du site) prime toujours sur ce calendrier.

---

## 5. Mesures importantes (KPI)

| KPI | Calcul | Mesurable aujourd'hui ? |
|---|---|---|
| Nombre de leads | Total reçu sur la période, par source (`source`) et campagne (`utm_campaign`) | Oui (via les e-mails Formspree) |
| Taux HOT | % de leads avec `lead_label = HOT` (diagnostic uniquement) | Oui |
| Délai premier contact | Date de premier contact − date de réception | Non — nécessite le CRM (`capusa_first_contact_date`) |
| Taux de mise en relation | % atteignant « Mise en relation effectuée » / total reçu | Non — nécessite le pipeline CRM |
| Taux consultation avocat | % atteignant « Consultation réalisée » / mis en relation | Non — nécessite le pipeline CRM |
| Taux client gagné | % « Client gagné » / total reçu (ou / mis en relation, à choisir selon l'angle voulu) | Non — nécessite le pipeline CRM |
| Coût par lead | Dépense Ads / nombre de leads, par campagne | Dès que l'ID de conversion Google Ads est branché (voir `ads-launch-checklist.md`) |
| Coût par dossier qualifié | Dépense Ads / nombre de leads à l'étape « Qualifié » | Nécessite CRM + attribution UTM déjà en place |

La majorité de ces KPI ne devient mesurable qu'une fois le CRM connecté — c'est la limite actuelle la plus importante à corriger en priorité.

---

## 6. Responsabilités — ne jamais mélanger les rôles

**CAP USA**
- Qualification (comprendre et structurer le besoin)
- Coordination (organiser les échanges, transmettre l'information, faciliter la communication en français)
- Suivi (s'assurer que les étapes avancent, relancer)

**Avocat partenaire indépendant**
- Conseil juridique (analyse de la situation, recommandations sur le fond)
- Prestation juridique (rédaction, dépôt de dossier, représentation, ses propres honoraires)

**Règle stricte pour toute personne traitant un lead** : ne jamais, dans un e-mail, un appel ou un message, donner un avis sur la légalité d'une situation, indiquer un délai garanti d'obtention (visa, immatriculation), ou répondre à la place de l'avocat sur le fond d'un dossier. Toute question de fond se renvoie systématiquement par : « c'est une excellente question pour l'avocat partenaire, il pourra y répondre précisément lors de votre échange. »

# Brief pSEO — Extension du glossaire visas (phase 1)

**Playbook :** Glossaire (« qu'est-ce que le visa X ») — même gabarit que les 3 articles
existants (`blog-e2-ou-l1.html`, `blog-creer-societe-usa.html`, `blog-green-card-voies.html`).
**Statut :** brief de contenu — rien n'est encore construit. Chaque page doit être validée
par l'avocat/déontologue avant publication (chiffres, délais, conditions d'éligibilité).
**Portée :** 3 pages. Bien en dessous des seuils d'alerte pSEO (30+ pages).

---

## Gabarit commun (à répliquer sur les 3 pages)

Structure technique identique aux articles existants :
- Même `<style>` (variables `--ink`/`--brass`/`--paper`/`--line`, classes `.kicker`,
  `.meta`, `.disc`, `.cta`, `.related`, `.hero-img`, `.cmp-wrap`/`table.cmp`)
- Ribbon + header sticky + emblème SVG (`#cap-emblem`) identiques
- Encadré `.disc` avec la même formule de conformité déjà en place :
  > « Cet article est informatif et ne constitue pas un conseil juridique. Les règles et
  > montants évoluent : votre situation doit être examinée par un avocat. CAP USA est une
  > société de mise en relation, non un cabinet d'avocats ; nous vous orientons vers un
  > avocat au barreau de New York. Contenu préparé par l'équipe éditoriale CAP USA, éclairé
  > par les pratiques observées auprès de notre réseau d'avocats indépendants inscrits au
  > barreau de New York. »
- `<p class="meta">Lecture ~X min · Informatif · Mis à jour le [date de publication réelle]</p>`
- Image hero 1200×630 dédiée (voir §5, brief image par page) + `og:image`/`twitter:card`
- Schema `Article` avec `image`, `dateModified` (date réelle), `author`/`publisher`
  Organization — cohérent avec les 3 pages existantes
- Bloc `.related` en pied d'article, liens croisés vers les 3 articles existants + les
  2 autres nouvelles pages
- CTA final identique : « Un projet aux États-Unis ? Nous vous mettons en relation avec
  des avocats indépendants au barreau de New York, en français. Mise en relation gratuite. »
- `<h2>` **toujours formulés en question**, cohérent avec l'harmonisation déjà faite sur
  les 3 articles existants

---

## Page 1 — Visa O-1 (profils à réalisations exceptionnelles)

**Fichier :** `blog-visa-o1.html`
**Title :** `Visa O-1 : le visa pour profils exceptionnels aux États-Unis | CAP USA`
**Meta description :** « Le visa O-1 s'adresse aux profils reconnus pour leurs
réalisations exceptionnelles (recherche, tech, sport, arts). Conditions, durée,
différences avec les autres visas. Article informatif. »
**og:image :** `og-blog-visa-o1.jpg` (brief image ci-dessous)
**Kicker :** `Immigration · Visas`
**H1 :** `Visa O-1 : le visa pour profils exceptionnels`

**Intro (~60-80 mots)** — doit répondre dès le premier paragraphe (optimisation
citabilité IA) : qu'est-ce que le O-1, à qui il s'adresse, en une phrase avant de
développer.

**Plan `<h2>` :**
1. **Qu'est-ce que le visa O-1 ?** — définition : visa pour ressortissant étranger ayant
   une reconnaissance nationale ou internationale dans son domaine (sciences, arts,
   éducation, sport, industrie du spectacle). *Fait à vérifier avec l'avocat : durée
   initiale (source secondaire trouvée : jusqu'à 3 ans, renouvelable).*
2. **Qui peut prétendre au O-1 ?** — nature des preuves généralement demandées (prix
   majeurs, couverture médiatique, publications, impact dans le secteur) — rester
   descriptif, ne pas lister de seuils chiffrés non vérifiés.
3. **O-1 vs E-2 vs L-1 : quelle différence ?** — tableau comparatif (voir §4), pour capter
   les recherches comparatives et créer un maillage naturel vers les 2 autres articles
   visas déjà en ligne.
4. **Comment se déroule une demande de O-1 ?** — étapes générales (dossier de preuves,
   dépôt, délai USCIS) — formulé prudemment, sans promesse de délai.

**CTA + related :** liens vers `blog-e2-ou-l1.html` et la nouvelle page EB-2 NIW.

---

## Page 2 — EB-2 NIW (dispense d'intérêt national)

**Fichier :** `blog-eb2-niw.html`
**Title :** `EB-2 NIW : la Green Card par dispense d'intérêt national | CAP USA`
**Meta description :** « EB-2 NIW : comment obtenir la résidence permanente américaine
sans employeur ni offre d'emploi, par dispense d'intérêt national. Conditions et délais.
Article informatif. »
**og:image :** `og-blog-eb2-niw.jpg`
**Kicker :** `Immigration · Résidence`
**H1 :** `EB-2 NIW : la Green Card par dispense d'intérêt national`

Cette page **prolonge directement** la section « Par l'investissement »/« Par l'emploi »
de `blog-green-card-voies.html` (déjà en ligne, un lien croisé fort est naturel dans les
deux sens — mettre à jour le bloc `.related` de l'article Green Card existant pour
pointer vers cette nouvelle page une fois publiée).

**Plan `<h2>` :**
1. **Qu'est-ce que l'EB-2 NIW ?** — définition : catégorie EB-2 (diplôme avancé ou
   capacité exceptionnelle) avec dispense de l'exigence habituelle d'offre d'emploi et de
   certification du travail, quand le projet sert « l'intérêt national » des États-Unis.
2. **Qui peut demander une dispense d'intérêt national ?** — profils typiques (recherche,
   santé, tech à fort impact) — rester générique, renvoyer l'appréciation à l'avocat.
3. **EB-2 NIW vs visa de travail classique : quelle différence ?** — pas besoin
   d'employeur ni de sponsor, contrairement à l'EB-2 standard — point de différenciation
   clair et vérifiable.
4. **Combien de temps prend une demande EB-2 NIW ?** — *Fait trouvé en recherche
   externe à vérifier/dater avec l'avocat avant publication : délai standard généralement
   annoncé entre 8 et 12 mois ; une procédure accélérée payante (« premium processing »)
   existe pour un traitement en 15 jours calendaires. Ces délais et montants USCIS
   changent régulièrement — ne jamais publier sans revalidation à la date de mise en
   ligne.*

**CTA + related :** lien fort vers `blog-green-card-voies.html` (et retour), lien vers la
page O-1.

---

## Page 3 — Visa E-1 (le commerçant international)

**Fichier :** `blog-visa-e1.html`
**Title :** `Visa E-1 : le visa commerçant pour les États-Unis | CAP USA`
**Meta description :** « Le visa E-1 s'adresse aux entreprises dont l'essentiel du
commerce se fait avec les États-Unis. Conditions, différence avec le E-2. Article
informatif. »
**og:image :** `og-blog-visa-e1.jpg`
**Kicker :** `Immigration · Visas`
**H1 :** `Visa E-1 : le visa commerçant international`

Complète naturellement `blog-e2-ou-l1.html` (E-1 et E-2 reposent tous deux sur un traité
de commerce et sont fréquemment confondus) — mettre à jour le `.related` de l'article
E-2/L-1 existant pour inclure cette page une fois publiée.

**Plan `<h2>` :**
1. **Qu'est-ce que le visa E-1 ?** — définition : pour les ressortissants d'un pays lié
   aux États-Unis par un traité de commerce (comme le E-2), mais fondé sur un commerce
   substantiel et continu entre les deux pays plutôt que sur un investissement.
2. **E-1 ou E-2 : quelle différence ?** — tableau comparatif (voir §4) : le E-1 est basé
   sur le volume d'échanges commerciaux existants, le E-2 sur un investissement dans une
   entreprise à créer ou développer. *Le seuil de « commerce majoritaire » (>50 % des
   échanges internationaux de l'entreprise avec les USA, selon la source trouvée en
   recherche externe) est à confirmer avec l'avocat avant publication.*
3. **Qui peut prétendre au E-1 ?** — profil type : entreprise déjà active à l'international
   avec un flux commercial établi vers/depuis les USA (marchandises, services, transport,
   assurance, technologie), pas une entreprise en démarrage.
4. **Comment se déroule une demande de E-1 ?** — étapes générales, même prudence que
   pour les autres pages.

**CTA + related :** lien fort vers `blog-e2-ou-l1.html`, lien vers O-1.

---

## 4. Tableaux comparatifs à prévoir

Même style que les tableaux déjà en place (`.cmp-wrap` / `table.cmp`), données tirées
**uniquement** de ce qui est écrit dans le texte de chaque page (pas de chiffre ajouté
seulement dans le tableau) :

**Sur la page O-1** — O-1 / E-2 / L-1 :
| Critère | O-1 | E-2 | L-1 |
|---|---|---|---|
| Fondement | Réalisations exceptionnelles reconnues | Investissement dans une entreprise US | Transfert intra-groupe |
| Nationalité requise | Aucune restriction de traité | Pays à traité de commerce avec les USA | Aucune restriction de traité |
| Structure requise | Aucune | Entreprise américaine active | Structure de groupe des deux côtés |

**Sur la page E-1** — E-1 / E-2 :
| Critère | E-1 | E-2 |
|---|---|---|
| Fondement | Commerce substantiel existant avec les USA | Investissement dans une entreprise à développer |
| Type de profil | Entreprise déjà active à l'international | Entrepreneur qui investit et dirige |
| Nationalité requise | Pays à traité de commerce avec les USA | Pays à traité de commerce avec les USA |

---

## 5. Briefs images (même format que les 3 images déjà générées : 1200×630, style
photographique éditorial, palette bordeaux `#9b2f3b` / bleu marine `#14243a`)

**`og-blog-visa-o1.jpg`**
> Photographie éditoriale d'un décor évoquant la reconnaissance professionnelle : sur un
> bureau en bois sombre, un trophée sobre ou une médaille discrète à côté d'un ordinateur
> portable ouvert et de coupures de presse floues en arrière-plan, lumière chaude
> directionnelle façon spot d'exposition. Pas de visage, pas de texte lisible. Touches de
> bordeaux (#9b2f3b) dans un objet, reste en tons chauds neutres et bois sombre.

**`og-blog-eb2-niw.jpg`**
> Photographie éditoriale : une main tenant un dossier de candidature ouvert avec des
> graphiques/schémas flous (non lisibles), devant une fenêtre avec vue floue sur
> Washington D.C. ou un bâtiment institutionnel américain générique, lumière naturelle
> douce de milieu de journée. Palette bleu marine (#14243a) dominant, touche de bordeaux
> sur un objet (stylo, trombone, couverture de dossier).

**`og-blog-visa-e1.jpg`**
> Photographie éditoriale évoquant le commerce international : conteneurs d'expédition
> ou porte-conteneurs flous en arrière-plan dans un port, au premier plan une mallette ou
> un dossier professionnel posé sur une rambarde métallique, lumière de fin d'après-midi.
> Palette bleu marine et tons métalliques froids, touche de bordeaux sur un accessoire.

---

## 6. Maillage interne à mettre à jour lors de la publication

- `blog.html` — ajouter 3 nouvelles `.pcard` dans la grille (même style que les 3
  existantes)
- `sitemap.xml` — ajouter les 3 URLs (priority ~0.6, changefreq monthly, comme les
  articles existants)
- `.related` de `blog-e2-ou-l1.html` → ajouter un lien vers `blog-visa-e1.html`
- `.related` de `blog-green-card-voies.html` → ajouter un lien vers `blog-eb2-niw.html`
- `index.html` — la liste `hlist` de la bande immigration mentionne déjà « Visa E-2, L-1,
  O-1, EB-2 NIW… » : une fois ces pages en ligne, ces mentions peuvent devenir des liens
  directs vers les nouveaux articles (actuellement du texte simple, pas de lien)

---

## 7. Points à faire valider par l'avocat/déontologue avant publication

Chaque page contient au moins une affirmation factuelle (délai, seuil, condition) tirée
de recherche externe et non vérifiée par un professionnel — listées explicitement dans
chaque section ci-dessus avec la mention *« à vérifier »*. Ne pas publier une page tant
que ses affirmations chiffrées n'ont pas été confirmées ou corrigées.

---

*Brief de contenu — aucune page HTML n'a été créée à ce stade. Prochaine étape sur
demande : rédaction complète d'une des 3 pages selon ce plan.*

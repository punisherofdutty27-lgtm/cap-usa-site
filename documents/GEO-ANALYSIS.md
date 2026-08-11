# GEO / IA générative — Analyse CAP USA (pré-lancement)

**Méthode :** analyse manuelle du code source de `site/` (pas d'URL en ligne, runtime
`claude-seo` non installé dans cet environnement). Les scores ci-dessous sont des
estimations qualitatives fondées sur les critères du skill `seo-geo`, pas des mesures
live (aucune donnée de citation réelle n'existe encore puisque le site n'est pas publié).

## 1. GEO Readiness Score : **~52/100**

| Catégorie | Poids | Estimation | Contribution |
|---|---|---|---|
| Citabilité (passages) | 25% | 55/100 | 13.8 |
| Lisibilité structurelle | 20% | 60/100 | 12.0 |
| Contenu multi-modal | 15% | 40/100 | 6.0 |
| Autorité & signaux de marque | 20% | 15/100 | 3.0 |
| Accessibilité technique | 20% | 85/100 | 17.0 |

Le socle technique est solide (site 100% statique, aucune dépendance JS pour le
contenu). Le point faible net est l'autorité/fraîcheur — attendu pour un site pas
encore publié, mais à corriger avant lancement.

## 2. Répartition par plateforme

Aucune plateforme n'a encore de donnée de citation réelle (site non indexé). Lecture
qualitative de préparation :
- **Google AI Overviews** — dépend du classement classique : contenu actuel trop mince
  pour rivaliser sur des requêtes E-2/L-1/Green Card disputées.
- **Google AI Mode** — pool plus large, favorise fraîcheur + autorité d'entité : le site
  n'a ni dates ni auteur identifié, donc mal positionné pour cette surface.
- **ChatGPT / Perplexity** — s'appuient fortement sur Wikipedia/Reddit : aucune présence
  de marque hors site pour l'instant (normal en pré-lancement).

## 3. Accès des crawlers IA — ✅ OK

`robots.txt` actuel :
```
User-agent: *
Allow: /
Sitemap: https://votre-domaine.com/sitemap.xml
```
Le wildcard `Allow: /` autorise déjà implicitement GPTBot, OAI-SearchBot, ClaudeBot,
PerplexityBot — rien à débloquer. Si vous voulez bloquer spécifiquement les crawlers
d'entraînement (CCBot, anthropic-ai) tout en gardant les crawlers de recherche IA
autorisés, il faudra des règles `User-agent` explicites — optionnel, pas prioritaire.

## 4. Statut `llms.txt` — Absent

Pas de `/llms.txt`. Google indique explicitement que ce fichier n'a aucun effet sur
Google Search (ignoré). Il peut avoir un effet marginal pour d'autres crawlers IA, mais
ce n'est pas un levier prioritaire — à faire seulement une fois le domaine réel connu.

## 5. Signaux de marque hors site — Non applicable

Aucune présence Wikipedia/Reddit/YouTube/LinkedIn à date car le site n'est pas publié.
Pas un défaut de code — juste un chantier post-lancement (voir §8).

## 6. Citabilité au niveau des passages

Bloc-cible optimal : 134-167 mots, réponse autonome. État actuel :
- Les réponses de la FAQ (index.html) sont courtes (35-45 mots) — correct pour une FAQ,
  mais trop courtes pour être citées comme passage autonome complet.
- Les sections `<h2>` des articles de blog (ex. « Le visa E-2 : l'investisseur » dans
  [blog-e2-ou-l1.html](../site/blog-e2-ou-l1.html)) font ~60-70 mots — en dessous de la
  cible, et n'ouvrent pas par une définition explicite du type « Le E-2 est... ».

## 7. Rendu côté serveur — ✅ OK

Tout le contenu textuel (hero, articles, FAQ) est présent directement dans le HTML
source, aucune dépendance JavaScript pour l'afficher. Les crawlers IA (qui n'exécutent
pas JS) voient donc le contenu complet. Rien à corriger.

## 8. Top 5 changements à plus fort impact

1. **Dates de publication/mise à jour manquantes** — ni visibles, ni dans le schema
   `Article` (`datePublished`/`dateModified` absents). La fraîcheur pèse ~3x sur la
   probabilité de citation IA ; un contenu non daté est structurellement désavantagé.
2. **Aucun auteur nommé avec crédentiels** — déjà signalé dans l'audit SEO classique,
   encore plus pénalisant ici : l'autorité d'auteur est un signal GEO fort (20% du score).
3. **Articles de blog 100% texte, zéro visuel** — un comparatif E-2 vs L-1 est un candidat
   naturel pour un tableau (le contenu multi-modal a un taux de sélection +156%).
4. **Titres de section non formulés en question** — « Le visa E-2 : l'investisseur »
   plutôt que « Qu'est-ce que le visa E-2 ? » — les IA font correspondre les requêtes
   aux titres de section.
5. **Pas de tableau comparatif E-2/L-1** malgré un contenu qui s'y prête exactement —
   gain de citabilité et de lisibilité en même temps.

## 9. Recommandations de schema

- Ajouter `datePublished` / `dateModified` (ISO 8601) au schema `Article` des 3 articles
  dès la date réelle de mise en ligne connue — placeholder invalide à éviter en JSON-LD.
- Passer `"author":{"@type":"Organization"}` à `"author":{"@type":"Person", "name":"...",
  "jobTitle":"Avocat, Barreau de New York", ...}` dès que l'avocat partenaire est confirmé
  (déjà noté dans l'audit SEO classique, §1).

## 10. Passages à reformuler (exemples concrets)

**Avant** (blog-e2-ou-l1.html) :
> « Le E-2 s'adresse au ressortissant d'un pays lié aux États-Unis par un traité de
> commerce... »

**Suggestion de structure** (à valider par l'avocat avant publication — aucune donnée
factuelle nouvelle n'est inventée ici, seulement la formulation) :
> « Qu'est-ce que le visa E-2 ? Le visa E-2 est un visa d'investisseur pour les
> ressortissants de pays ayant un traité de commerce avec les États-Unis (dont la
> France). [reste du paragraphe existant, inchangé] »

Ce patron — question en tête de section + définition en une phrase — est reproductible
sur les autres `<h2>` des 3 articles.

---

*Généré manuellement (pas de subagents ni scripts `claude-seo` disponibles dans cet
environnement) en cohérence avec les critères du skill `seo-geo` et les règles déjà
appliquées dans l'audit `/seo` précédent.*

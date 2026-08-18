# Checklist de lancement — Google Ads

**Statut technique (Phase 5) :** tracking funnel, scoring, fiabilité des
formulaires et capture d'attribution (UTM/gclid/fbclid) sont en place côté
site. Les points ci-dessous sont ceux qui restent à faire **côté compte**
(Google Ads, Formspree) — aucun ne se résout par du code supplémentaire.

---

## Avant lancement

- [ ] **ID Google Ads configuré** — remplacer `AW-XXXXXXXXXX` par l'ID réel
  dans `site/consent.js` (ligne `ADS_ID`)
- [ ] **Labels de conversion configurés** — dans `site/index.html`, objet
  `ADS_LABELS` : remplacer `REPLACE_FORM_LABEL` (soumission de lead) et
  `REPLACE_PHONE_LABEL` (clic sur le numéro) par les vrais labels créés dans
  Google Ads (Outils > Conversions). Tant qu'un label reste sur sa valeur
  `REPLACE_*`, l'événement correspondant part vers GA4 mais jamais vers
  Google Ads — aucun risque d'envoyer une conversion mal configurée.
- [ ] **Formspree vérifié** — confirmer le plan actuel et sa limite de
  soumissions mensuelles ; l'augmenter si le volume attendu avec Ads dépasse
  le quota du plan actuel.
- [ ] **Test lead effectué** — soumettre un vrai lead de test sur chacun des
  3 formulaires (diagnostic, contact, lead magnet) et vérifier sa réception.
- [ ] **UTM vérifiés** — voir la procédure de test ci-dessous.

## Après lancement

- [ ] **Vérifier les premiers leads** — confirmer que les soumissions
  réelles arrivent bien (email Formspree), avec des données cohérentes
  (`lead_status`, `lead_score` pour le diagnostic, champs UTM renseignés).
- [ ] **Vérifier les conversions dans Google Ads** — sous *Conversions*,
  confirmer que des conversions "Soumission de lead" remontent bien dans les
  24-48h suivant les premiers leads (délai normal de Google Ads).
- [ ] **Vérifier l'attribution** — dans les leads reçus, confirmer que
  `utm_source`/`utm_campaign`/`gclid` correspondent bien aux campagnes
  actives, pas de champs vides sur du trafic qui devrait être tracé.

---

## Tests obligatoires (à refaire à chaque changement de tracking)

1. **Test URL avec paramètres UTM** — ouvrir le site avec une URL du type
   `?utm_source=google&utm_medium=cpc&utm_campaign=test&gclid=TEST123`
2. **Vérifier la conservation jusqu'au formulaire** — accepter les cookies
   (catégorie "Publicité"), naviguer sur une autre page du site, revenir sur
   la page d'accueil, remplir un formulaire, et confirmer via les outils de
   développement que `utm_source`, `utm_campaign` et `gclid` sont bien
   présents dans les données envoyées à Formspree
3. **Test de soumission de lead** — un envoi réel de bout en bout sur
   chacun des 3 formulaires
4. **Vérifier l'absence d'erreur console** — sur desktop et mobile
5. **Vérifier le mobile** — parcours complet à 375px de large

**Point d'attention connu :** l'attribution n'est capturée qu'après
consentement "Publicité" accepté (RGPD — ces identifiants ne sont pas des
cookies "nécessaires"). Un test avec la bannière refusée ou ignorée doit
montrer des champs UTM vides dans le formulaire, pas une erreur — c'est le
comportement attendu, pas un bug.

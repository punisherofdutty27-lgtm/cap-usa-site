# Guides reconstruits — changements et points à valider

Reconstruction en HTML (`build.js`) puis export PDF par Chrome (`export.sh`). Les PDF publics actuels (`site/guide-*.pdf`) sont **inchangés**.
Le rendu n'est pas une copie exacte de l'original (même structure et mêmes informations, charte CAP USA). Ce n'est **pas** une validation juridique du contenu.

## Mentions supprimées ou reformulées (identiques dans les deux guides, sauf mention)
| Ancien texte | Nouveau texte |
|---|---|
| Bandeau « GUIDE OFFERT · PARIS — NEW YORK » | « GUIDE OFFERT » (bandeau Paris — New York supprimé) |
| « société de mise en relation avec un avocat au barreau de New York » (couverture) | « société de mise en relation avec des professionnels indépendants » |
| « préparer… votre échange avec un avocat » (introduction) | « …avec un professionnel indépendant adapté à votre projet » |
| « nous vous mettons en relation avec un avocat au barreau de New York » (encadré Important) | « CAP USA peut, lorsque c'est pertinent, faciliter la mise en relation avec un professionnel indépendant adapté à votre projet » |
| « À préparer avant d'en parler à un avocat » | « …à un professionnel » |
| « un échange avec un avocat au barreau de New York vous permettra de valider la faisabilité / choisir la bonne structure… Nous organisons cette mise en relation — gratuitement pour vous » | « un échange avec un professionnel indépendant adapté à votre projet peut vous aider à apprécier la faisabilité / choisir la structure adaptée… CAP USA peut faciliter cette mise en relation ; les services de CAP USA sont gratuits pour les porteurs de projets » |
| Page finale : « Parlez de votre projet à un avocat au barreau de New York » / « Lancez votre société avec un avocat au barreau de New York » | « Parlez de votre projet à un professionnel indépendant » / « Préparez le lancement de votre société avec un professionnel indépendant » |
| « …premier échange en visioconférence, en français. La mise en relation est gratuite ; les honoraires éventuels de l'avocat vous sont communiqués avant tout engagement. » | Supprimé. Remplacé par : « Chaque professionnel indépendant définit ses propres prestations, conditions et honoraires. » |
| « CAP USA est une société de conseil et de mise en relation, non un cabinet d'avocats… Les prestations juridiques sont assurées par un avocat indépendant au barreau de New York » | « CAP USA est une société de mise en relation avec des professionnels indépendants. Elle ne fournit pas de conseil juridique [ni fiscal] et ne garantit aucun résultat… » |
| « Contact : [email] · [téléphone] · [https://votre-domaine.com/] » (placeholders) | « Contact : +33 4 22 13 23 48 · hellocapusa.com » (e-mail non publié) |
| Lien du bouton `file:///home/claude/[https://hellocapusa.com/]#contact` (cassé) | `https://hellocapusa.com/#diagnostic`, libellé « Présenter mon projet gratuitement → » |
| Société, p.3 : « L'immigration (visa)… que l'avocat pourra aussi aborder avec vous » | « …qu'un professionnel compétent pourra aborder avec vous » |

Mentions conservées volontairement (le mot « avocat » explique qu'une question relève de son analyse, sans qualification attribuée) : « qui relèvent de l'avocat », « c'est là qu'un avocat apporte le plus de valeur », « seul un avocat peut l'apprécier », « ils ne remplacent pas l'analyse de l'avocat », « avis professionnel (avocat et, souvent, fiscaliste) ».

## Points nécessitant une validation humaine (contenu repris tel quel de l'original)
**Guide E-2 :** définition du E-2 (« investisseur de traité », France éligible) ; renouvelable « en pratique durablement » ; conjoint pouvant « en général » demander une autorisation de travail ; enfants mineurs ; absence de « montant minimum officiel » ; critères « substantiel », « à risque », « entreprise réelle / non marginale » ; **détention d'au moins 50 % ou contrôle opérationnel** ; étapes (consulat ou changement de statut) ; réponse « le E-2 ne donne pas directement la Green Card » ; reprise d'une entreprise existante.
**Guide Société :** descriptions LLC / C-Corp et fiscalité ; Delaware « réputé… pas toujours optimal » ; enregistrement « étranger » dans un autre État ; étapes (agent enregistré, EIN, compte bancaire) ; **« un Français peut détenir 100 % »** ; **ouverture de compte bancaire à distance** ; « accompagnement fiscal vivement recommandé » ; création possible à distance.
**Mentions CAP USA :** « les services de CAP USA sont gratuits pour les porteurs de projets » (cohérent avec la FAQ du site, à confirmer pour le PDF) ; « CAP USA peut faciliter la mise en relation » ; absence d'engagement de délai, de langue ou de prestation (volontaire).
**Fraîcheur :** aucune date de mise à jour n'apparaît dans les guides ; les règles E-2 / fiscales évoluent — prévoir une date de révision.

---
# Révision 2 — corrections éditoriales appliquées (validées sur le principe, non validées juridiquement)
**Guide E-2 :** conjoint (autorisation de travail du fait du statut selon l'USCIS, justificatifs, « à confirmer avec un professionnel ») et enfants célibataires de moins de 21 ans ; **séjour (statut) et validité du visa consulaire distingués** — les périodes de 2 ans (source USCIS) concernent le séjour et ne sont pas généralisées à la validité des visas ; statut non-immigrant et intention de départ ; « pas de montant chiffré unique » ; Green Card : « statut non-immigrant, d'autres catégories à étudier avec un professionnel » ; reprise d'entreprise « possible, sous réserve ».
**Guide Société :** EIN (« généralement demandé pour les obligations fiscales… souvent exigé par les banques ; la demande auprès de l'IRS est gratuite ») ; détention à 100 % (« possible selon la structure ; restrictions possibles ») ; conformité courante en termes **généraux** (aucune référence au formulaire 5472).
**Gratuité (confirmée par CAP USA) :** limitée à la mise en relation, une seule occurrence par guide (page finale) : « La mise en relation proposée par CAP USA est gratuite pour le porteur de projet. Chaque professionnel indépendant fixe ses propres prestations, conditions et honoraires. CAP USA n'encaisse pas ces honoraires. » Le bouton du PDF devient « Présenter mon projet → » (sans « gratuitement »).
*Variante sans promesse de gratuité (au cas où la confirmation serait retirée) :* « CAP USA peut faciliter la mise en relation avec un professionnel indépendant adapté à votre projet. Chaque professionnel indépendant fixe ses propres prestations, conditions et honoraires. »
**Avertissements :** informatif / ni conseil juridique ni fiscal / pas de garantie conservés ; ajout « Les règles évoluent : vérifiez l'information auprès des sources officielles ».
**Date d'édition :** paramètre `EDITION_DATE` (ligne omise tant qu'il est vide) — à renseigner à la mise en ligne.

## Affirmations encore à faire valider (juridique / fiscal)
E-2 : statut vs validité du visa (durées selon pays/réciprocité) ; intention de départ ; conjoint (autorisation du fait du statut) et enfants < 21 ans ; critères substantiel / à risque / non marginal ; 50 % ou contrôle ; changement de statut vs consulat ; « pas de montant chiffré unique ».
Société : LLC / C-Corp et fiscalité (résident français) ; Delaware et enregistrement dans un autre État ; détention à 100 % ; **« souvent exigé par les banques » (EIN, non sourcé)** ; compte bancaire à distance ; obligations déclaratives (formulaire 5472 volontairement non cité) ; « création à distance ».
Sources officielles lues le 19/10/2026 : USCIS (E-2, mise à jour affichée 20/08/2026), IRS (EIN, 16/10/2026), FinCEN (BOI, 11/08/2026). Non consultées : Department of State (accès refusé), sources fiscales françaises, États (Delaware…).

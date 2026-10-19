// Génère les deux guides (HTML) à partir du contenu ci-dessous ; l\x27export PDF se fait avec Chrome (voir export.sh).
// Reconstruction des guides publiés : texte repris tel quel, sauf mentions de qualification, coordonnées et placeholders (voir CHANGEMENTS.md).
const fs = require('fs');
const path = require('path');
const NAV = '#14243a', IVORY = '#f4f1ea', GOLD = '#876823', GOLD_L = '#c9a44f';
const SITE = 'https://hellocapusa.com';
const TEL = '+33 4 22 13 23 48';
// Date d\x27édition = date réelle de mise en ligne, à fournir à la publication : EDITION_DATE="JJ mois AAAA" sh export.sh (vide = ligne omise)
const EDITION = (process.env.EDITION_DATE || '').trim();
const ED_LINE = EDITION ? ` Édition du ${EDITION}.` : '';

const CSS = `
@page{size:A4;margin:0}
*{box-sizing:border-box}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{margin:0;font-family:"Segoe UI",Arial,Helvetica,sans-serif;color:${NAV};font-size:11.6pt;line-height:1.6}
h1,h2,h3{font-family:Georgia,"Times New Roman",serif;font-weight:700;line-height:1.2;margin:0}
a{color:${GOLD};text-decoration:none}
.page{width:210mm;height:297mm;padding:24mm 21mm 20mm;position:relative;overflow:hidden;page-break-after:always;break-after:page;background:#fff}
.page:last-child{page-break-after:auto;break-after:auto}
.hd{display:flex;align-items:baseline;gap:12px;border-bottom:1.5px solid ${GOLD_L};padding-bottom:9px;margin-bottom:20px}
.hd .n{font-family:Georgia,serif;font-size:20pt;color:${GOLD};font-weight:700}
.hd .t{font-size:8.6pt;letter-spacing:.14em;text-transform:uppercase;color:#57626f;font-weight:600}
h2{font-size:20pt;margin:0 0 14px}
h3{font-size:13.2pt;margin:20px 0 6px}
p{margin:0 0 10px}
.cover{background:${NAV};color:#eef2f7;padding:0}
.cover .in{position:absolute;left:24mm;right:24mm;top:62mm}
.cover .mark{width:34px;height:34px;border:2.5px solid ${GOLD_L};transform:rotate(45deg);margin:0 0 38px 8px}
.cover .kick{font-size:9.4pt;letter-spacing:.24em;text-transform:uppercase;color:${GOLD_L};font-weight:700;margin:0 0 22px}
.cover h1{font-size:38pt;color:#fff;margin:0 0 22px}
.cover .sub{font-size:13.6pt;color:#c9d2de;max-width:128mm;line-height:1.5}
.cover .foot{position:absolute;left:24mm;right:24mm;bottom:22mm;border-top:1px solid #2c405c;padding-top:12px;font-size:9.2pt;color:#aebbcc;line-height:1.55}
.cover .foot b{color:#fff}
.intro-tag{font-size:8.6pt;letter-spacing:.16em;text-transform:uppercase;color:${GOLD};font-weight:700;margin-bottom:6px}
.note{background:${IVORY};border-left:3px solid ${GOLD_L};padding:14px 16px;margin:20px 0;font-size:10.8pt}
.note b{color:${NAV}}
.key{background:${NAV};color:#eef2f7;padding:15px 18px;border-radius:4px;margin:22px 0;font-size:11.2pt}
.key b{color:${GOLD_L}}
ul.pl{list-style:none;padding:0;margin:8px 0 12px}
ul.pl li{position:relative;padding:0 0 11px 20px}
ul.pl li:before{content:"";position:absolute;left:0;top:.6em;width:7px;height:7px;background:${GOLD_L};transform:rotate(45deg)}
ul.pl li b{color:${NAV}}
.cond{border-top:1px solid #e3ddd0;padding:14px 0}
.cond h3{margin:0 0 4px;font-size:12.8pt}
.cond p{margin:0;color:#3b4a5f}
ol.steps{list-style:none;padding:0;margin:10px 0 14px;counter-reset:s}
ol.steps li{counter-increment:s;position:relative;padding:9px 0 9px 44px;border-top:1px solid #e3ddd0}
ol.steps li:before{content:counter(s);position:absolute;left:0;top:7px;width:26px;height:26px;border-radius:50%;background:${NAV};color:${GOLD_L};font-family:Georgia,serif;font-weight:700;text-align:center;line-height:26px;font-size:10.5pt}
ol.steps li b{display:block;color:${NAV}}
.faq p{margin:0 0 10px;font-size:11pt;line-height:1.5}
.faq b{color:${NAV}}
ul.chk{list-style:none;padding:0;margin:10px 0 14px}
ul.chk li{position:relative;padding:9px 0 9px 30px;border-bottom:1px solid #eee8db}
ul.chk li:before{content:"";position:absolute;left:0;top:11px;width:15px;height:15px;border:1.6px solid ${GOLD}}
.cta{background:${NAV};color:#eef2f7;padding:34px 30px;border-radius:6px;margin-top:6px}
.cta .k{font-size:8.6pt;letter-spacing:.22em;text-transform:uppercase;color:${GOLD_L};font-weight:700;margin-bottom:10px}
.cta h2{color:#fff;font-size:21pt;margin:0 0 14px}
.cta p{color:#d3dbe6;font-size:11pt}
.btn{display:inline-block;background:${GOLD_L};color:${NAV};font-weight:700;padding:11px 20px;border-radius:5px;margin-top:6px;font-size:11pt}
.legal{margin-top:30px;padding-top:14px;border-top:1px solid #e3ddd0;font-size:9.4pt;color:#57626f;line-height:1.55}
.legal b{color:${NAV}}
.pn{position:absolute;bottom:11mm;left:21mm;right:21mm;font-size:8pt;color:#8a96a6;display:flex;justify-content:space-between}
`;

const li = (a) => a.map((x) => `<li>${x}</li>`).join('');
const hd = (n, t) => `<div class="hd"><span class="n">${n}</span><span class="t">${t}</span></div>`;
const pn = (n, total, title) => `<div class="pn"><span>CAP USA · ${title}</span><span>${n} / ${total}</span></div>`;
const cover = (title, sub, foot) => `<section class="page cover"><div class="in"><div class="mark"></div><p class="kick">Guide offert</p><h1>${title}</h1><p class="sub">${sub}</p></div><div class="foot">${foot}</div></section>`;
const legal = (extra) => `<div class="legal"><b>CAP USA est une société de mise en relation avec des professionnels indépendants.</b> Elle ne fournit pas de conseil juridique${extra.fiscal ? ' ni fiscal' : ''} et ne garantit aucun résultat. Ce guide est informatif et ne constitue pas un conseil juridique${extra.fiscal ? ' ou fiscal' : ''}. Les règles évoluent : vérifiez l\x27information auprès des sources officielles.${ED_LINE}<br>Contact : ${TEL} · <a href="${SITE}">${SITE.replace('https://', '')}</a></div>`;
const cta = (k, title, body) => `<div class="cta"><div class="k">${k}</div><h2>${title}</h2><p>${body}</p><a class="btn" href="${SITE}/#diagnostic">Présenter mon projet →</a></div>`;

const IMPORTANT_E2 = `<div class="note"><b>Important.</b> Ce document est fourni à titre informatif et ne constitue pas un conseil juridique. Les règles et les pratiques évoluent, et chaque situation est unique. CAP USA est une société de mise en relation, non un cabinet d\x27avocats : pour votre cas précis, CAP USA peut, lorsque c\x27est pertinent, faciliter la mise en relation avec un professionnel indépendant adapté à votre projet.</div>`;
const IMPORTANT_SOC = `<div class="note"><b>Important.</b> Ce document est informatif et ne constitue ni un conseil juridique, ni un conseil fiscal. Les règles évoluent et chaque situation est unique. CAP USA est une société de mise en relation, non un cabinet d\x27avocats : pour votre cas, CAP USA peut, lorsque c\x27est pertinent, faciliter la mise en relation avec un professionnel indépendant adapté à votre projet.</div>`;

// ----------------------------------------------------------------- GUIDE VISA E-2
const T_E2 = 'Le visa E-2 pour les Français';
const e2 = [
  cover('Le visa E-2<br>pour les Français', 'Comprendre le visa investisseur pour vivre et développer votre entreprise aux États-Unis. Les repères essentiels, en clair.',
    '<b>Offert par CAP USA</b> — société de mise en relation avec des professionnels indépendants.<br>Document informatif — ne constitue pas un conseil juridique.'),
  `<section class="page">${hd('', 'Introduction · CAP USA')}<h2>Pourquoi ce guide ?</h2>
<p>Chaque année, de nombreux entrepreneurs français rêvent de développer une activité aux États-Unis. Le visa E-2 est l\x27une des voies les plus utilisées pour y parvenir — mais aussi l\x27une des plus mal comprises.</p>
<p>Ce guide vous donne les repères essentiels pour savoir si cette piste peut correspondre à votre projet, et pour préparer sereinement votre échange avec un professionnel indépendant adapté à votre projet. Il ne remplace pas un examen personnalisé : il vous fait gagner du temps et vous aide à poser les bonnes questions.</p>
<h3>À qui s\x27adresse ce guide ?</h3>
<ul class="pl">${li(['Vous voulez créer ou racheter une entreprise aux États-Unis et la diriger.', 'Vous envisagez de vous installer aux USA pour piloter votre activité.', 'Vous cherchez à comprendre les conditions générales avant d\'investir du temps et de l\'argent.'])}</ul>
${IMPORTANT_E2}${pn(2, 7, T_E2)}</section>`,
  `<section class="page">${hd('01', T_E2)}<h2>Qu\x27est-ce que le visa E-2 ?</h2>
<p>Le visa E-2 est un visa dit « d\x27investisseur de traité ». Il permet au ressortissant d\x27un pays lié aux États-Unis par un traité de commerce — ce qui est le cas de la France — d\x27entrer aux USA pour y investir et diriger une entreprise.</p>
<h3>Ses caractéristiques clés</h3>
<ul class="pl">${li(['<b>Investissement + direction :</b> vous investissez dans une entreprise américaine réelle et active, que vous venez développer et diriger.', '<b>Statut non-immigrant, séjour par périodes :</b> selon l\x27USCIS, le séjour initial est de 2 ans maximum et peut être prolongé par périodes pouvant atteindre 2 ans, sans limite de nombre de prolongations, mais sans prolongation garantie. L\x27intention de quitter les États-Unis à la fin du statut est requise.', '<b>Visa et séjour, deux notions distinctes :</b> la durée du séjour autorisé (le statut) ne se confond pas avec la durée de validité du visa délivré par un consulat, qui dépend notamment du pays du demandeur. Les périodes de deux ans ne s\x27appliquent donc pas automatiquement à la validité de tous les visas E-2.', '<b>La famille :</b> le conjoint et les enfants célibataires de moins de 21 ans peuvent obtenir un statut de dépendant. Selon l\x27USCIS, le conjoint titulaire d\x27un statut dépendant E-2 admissible, notamment E-2S, bénéficie en principe d\x27une autorisation de travail liée à son statut ; cette règle ne s\x27applique pas à tous les membres de la famille. La situation individuelle doit être vérifiée avec un professionnel qualifié.', '<b>Souplesse d\'activité :</b> il couvre un large éventail de secteurs, dès lors que l\'entreprise est authentique et opérationnelle.'])}</ul>
<div class="key"><b>À retenir :</b> le E-2 récompense un vrai projet d\x27entreprise que vous portez activement — pas un simple placement financier passif.</div>${pn(3, 7, T_E2)}</section>`,
  `<section class="page">${hd('02', T_E2)}<h2>Les grandes conditions</h2>
<p>Sans entrer dans les détails techniques (qui relèvent de l\x27avocat), voici les principes que les autorités américaines examinent généralement :</p>
<div class="cond"><h3>Un investissement « substantiel »</h3><p>Les textes consultés ne fixent pas de montant chiffré unique : l\x27appréciation porte sur le caractère « substantiel » de l\x27investissement au regard du coût de l\x27entreprise visée. Un petit commerce et une industrie n\x27appellent pas le même niveau d\x27engagement.</p></div>
<div class="cond"><h3>Un investissement réel et « à risque »</h3><p>Les fonds doivent être effectivement engagés dans le projet et exposés au risque commercial — pas simplement réservés sur un compte.</p></div>
<div class="cond"><h3>Une entreprise réelle et active</h3><p>L\x27entreprise doit être opérationnelle (ou en voie de l\x27être), produire des biens ou des services, et ne pas être « marginale » — c\x27est-à-dire avoir la capacité de générer plus qu\x27un revenu de simple subsistance.</p></div>
<div class="cond"><h3>Le contrôle et la direction</h3><p>Vous devez en général détenir au moins 50 % de l\x27entreprise ou en avoir le contrôle opérationnel, et venir la développer et la diriger.</p></div>
<div class="note">Chaque critère se prouve par des documents. La qualité du dossier (business plan, preuves d\x27investissement, structure…) fait souvent la différence : c\x27est là qu\x27un avocat apporte le plus de valeur.</div>${pn(4, 7, T_E2)}</section>`,
  `<section class="page">${hd('03', T_E2)}<h2>Comment ça se passe, en pratique</h2>
<ol class="steps">${li(['<b>Cadrage du projet</b> — définir l\'entreprise, la structure et le montage d\'investissement.', '<b>Constitution du dossier</b> — business plan, preuves de l\'origine et de l\'engagement des fonds, documents de l\'entreprise.', '<b>Dépôt de la demande</b> — selon votre situation, une demande de visa peut être effectuée auprès d\x27un consulat américain, ou un changement de statut peut être demandé depuis les États-Unis lorsque les conditions sont réunies. Un changement de statut accordé par l\x27USCIS ne constitue pas un visa consulaire et ne garantit pas la possibilité de revenir aux États-Unis après un voyage.', '<b>Suivi</b> — jusqu\'à la décision, puis renouvellements liés à la vie de l\'entreprise.'])}</ol>
<h2 style="margin-top:22px">Questions fréquentes</h2>
<div class="faq"><p><b>Le E-2 donne-t-il la Green Card ?</b><br>Non : le E-2 est un statut non-immigrant. D\x27autres catégories existent, à étudier avec un professionnel ; leurs conditions diffèrent.</p>
<p><b>Combien faut-il investir ?</b><br>Aucun montant unique n\x27est fixé : l\x27investissement doit être substantiel et cohérent avec l\x27entreprise visée.</p>
<p><b>Puis-je racheter une entreprise existante ?</b><br>La reprise d\x27une entreprise existante est possible, sous réserve des conditions du E-2.</p>
<p><b>Mon conjoint pourra-t-il travailler ?</b><br>Le conjoint dépendant admissible (notamment sous la classification E-2S) est en principe autorisé à travailler du fait de son statut, selon l\x27USCIS. Des documents appropriés peuvent être nécessaires pour justifier ce droit ; cela ne concerne pas tous les membres de la famille. À vérifier avec un professionnel qualifié.</p></div>${pn(5, 7, T_E2)}</section>`,
  `<section class="page">${hd('04', T_E2)}<h2>À préparer avant d\x27en parler à un professionnel</h2>
<p>Ces points ne déterminent pas votre éligibilité (seul un avocat peut l\x27apprécier) — ils vous aident à préparer un échange efficace.</p>
<ul class="chk">${li(['Une idée claire de l\'entreprise à créer ou reprendre aux USA.', 'Un ordre de grandeur de l\'investissement envisagé.', 'L\'origine des fonds (épargne, cession, prêt…) et de quoi en attester.', 'Votre rôle prévu dans l\'entreprise (direction, part détenue).', 'Un calendrier approximatif de votre projet.', 'Votre situation familiale (conjoint, enfants) pour anticiper les visas associés.'])}</ul>
<h3>L\x27étape suivante</h3>
<p>Une fois ces éléments réunis, un échange avec un professionnel indépendant adapté à votre projet peut vous aider à apprécier la faisabilité et à définir la marche à suivre. CAP USA peut faciliter cette mise en relation.</p>${pn(6, 7, T_E2)}</section>`,
  `<section class="page">${hd('', 'Passez à l\'action')}${cta('Passez à l\'action', 'Parlez de votre projet à un professionnel indépendant', 'Vous avez les repères ; place à votre situation précise. CAP USA peut, lorsque c\'est pertinent, faciliter la mise en relation avec un professionnel indépendant adapté à votre projet. La mise en relation proposée par CAP USA est gratuite pour le porteur de projet. Chaque professionnel indépendant fixe ses propres prestations, conditions et honoraires. CAP USA n\x27encaisse pas ces honoraires.')}${legal({ fiscal: false })}${pn(7, 7, T_E2)}</section>`,
];

// ----------------------------------------------------------------- GUIDE CRÉATION DE SOCIÉTÉ
const T_SOC = 'Créer votre société aux États-Unis';
const soc = [
  cover('Créer votre société<br>aux États-Unis', 'LLC ou Corporation, choix de l\'État, grandes étapes : le guide clair pour les entrepreneurs français.',
    '<b>Offert par CAP USA</b> — société de mise en relation avec des professionnels indépendants.<br>Document informatif — ne constitue pas un conseil juridique ou fiscal.'),
  `<section class="page">${hd('', 'Introduction · CAP USA')}<h2>Pourquoi ce guide ?</h2>
<p>Créer une société aux États-Unis ouvre l\x27accès au plus grand marché du monde. Mais entre la LLC, la Corporation, le choix de l\x27État et les questions bancaires et fiscales, il est facile de s\x27y perdre.</p>
<p>Ce guide vous donne les repères essentiels pour aborder votre projet avec les bonnes questions, et préparer efficacement votre échange avec un professionnel indépendant adapté à votre projet.</p>
<h3>À qui s\x27adresse ce guide ?</h3>
<ul class="pl">${li(['Vous voulez vendre ou opérer aux États-Unis (e-commerce, services, tech…).', 'Vous cherchez une structure américaine pour facturer, encaisser ou vous développer.', 'Vous voulez comprendre les choix de base avant de vous lancer.'])}</ul>
${IMPORTANT_SOC}${pn(2, 8, T_SOC)}</section>`,
  `<section class="page">${hd('01', T_SOC)}<h2>Pourquoi une société américaine ?</h2>
<ul class="pl">${li(['<b>Accès au marché :</b> vendre et contracter aux USA avec une entité locale.', '<b>Crédibilité &amp; paiements :</b> facturer en dollars, ouvrir des solutions de paiement américaines.', '<b>Image :</b> rassurer clients et partenaires américains.', '<b>Structuration :</b> séparer votre activité US du reste de vos affaires.'])}</ul>
<div class="key"><b>À ne pas confondre :</b> créer une société aux USA ne donne pas automatiquement le droit d\x27y vivre ou d\x27y travailler. L\x27immigration (visa) est un sujet distinct — qu\x27un professionnel compétent pourra aborder avec vous.</div>${pn(3, 8, T_SOC)}</section>`,
  `<section class="page">${hd('02', T_SOC)}<h2>LLC ou Corporation ?</h2>
<div class="cond"><h3>La LLC (Limited Liability Company)</h3><p>Souple à gérer, appréciée des petites structures, des indépendants et de l\x27e-commerce. Sa fiscalité peut varier selon les options retenues et votre situation personnelle.</p></div>
<div class="cond"><h3>La Corporation (souvent « C-Corp »)</h3><p>Structure plus formelle, généralement privilégiée pour lever des fonds ou accueillir des investisseurs (start-up).</p></div>
<div class="note">Le bon choix dépend de vos objectifs (activité, investisseurs, fiscalité) et a des conséquences des deux côtés de l\x27Atlantique — d\x27où l\x27intérêt d\x27un avis professionnel (avocat et, souvent, fiscaliste).</div>${pn(4, 8, T_SOC)}</section>`,
  `<section class="page">${hd('03', T_SOC)}<h2>Dans quel État s\x27immatriculer ?</h2>
<ul class="pl">${li(['Le Delaware est réputé pour son droit des sociétés et apprécié des start-up. Mais ce n\'est pas toujours le choix optimal.', 'Si vous opérez réellement dans un État précis, il est souvent pertinent de s\'y immatriculer.', 'S\'immatriculer dans un État tout en opérant dans un autre peut imposer des formalités supplémentaires (enregistrement « étranger »).', 'Fiscalité locale, coûts annuels et confidentialité varient d\'un État à l\'autre.'])}</ul>
<div class="key"><b>À retenir :</b> le « meilleur » État dépend de votre activité réelle. C\x27est un arbitrage à faire au cas par cas.</div>${pn(5, 8, T_SOC)}</section>`,
  `<section class="page">${hd('04', T_SOC)}<h2>Les grandes étapes</h2>
<ol class="steps">${li(['<b>Choix de la structure et de l\'État.</b>', '<b>Constitution</b> (statuts, immatriculation) et agent enregistré local.', '<b>Numéro d\x27identification fiscale (EIN)</b> — généralement demandé pour les obligations fiscales de la société et souvent exigé par les banques. La demande auprès de l\x27IRS est gratuite.', '<b>Compte bancaire professionnel</b> et solutions de paiement.', '<b>Conformité courante</b> — déclarations fiscales et obligations annuelles, au niveau de l\x27État et au niveau fédéral. Certaines structures détenues par des personnes étrangères peuvent également être soumises à des déclarations fiscales spécifiques auprès de l\x27IRS. Ces obligations évoluent et dépendent de la structure et de la situation des associés : à vérifier avec un professionnel.'])}</ol>
<h2 style="margin-top:22px">Questions fréquentes</h2>
<div class="faq"><p><b>Dois-je être aux États-Unis pour créer ma société ?</b><br>Non, la création peut souvent se faire à distance. Y vivre ou y travailler relève d\x27un visa, sujet distinct.</p>
<p><b>Un Français peut-il détenir 100 % d\x27une société américaine ?</b><br>C\x27est possible selon la structure choisie ; certaines structures ou régimes fiscaux peuvent comporter des restrictions : à vérifier avec un professionnel.</p>
<p><b>Et la fiscalité ?</b><br>C\x27est un point clé (des deux côtés de l\x27Atlantique). Un accompagnement fiscal est vivement recommandé.</p>
<p><b>Puis-je ouvrir un compte bancaire à distance ?</b><br>Des solutions existent ; les conditions dépendent de la banque et de votre profil.</p></div>${pn(6, 8, T_SOC)}</section>`,
  `<section class="page">${hd('05', T_SOC)}<h2>À préparer avant d\x27en parler à un professionnel</h2>
<p>Ces points vous aideront à préparer un échange efficace — ils ne remplacent pas l\x27analyse de l\x27avocat.</p>
<ul class="chk">${li(['La nature de votre activité et là où vous opérerez réellement.', 'Vos objectifs (vendre, lever des fonds, structurer…).', 'Avez-vous des investisseurs ou associés ?', 'Votre besoin de compte bancaire / paiements US.', 'Votre situation fiscale actuelle (pour anticiper l\'accompagnement).', 'Un calendrier approximatif.'])}</ul>
<h3>L\x27étape suivante</h3>
<p>Avec ces éléments, un échange avec un professionnel indépendant adapté à votre projet peut vous aider à choisir la structure adaptée et à préparer les démarches. CAP USA peut faciliter cette mise en relation.</p>${pn(7, 8, T_SOC)}</section>`,
  `<section class="page">${hd('', 'Passez à l\'action')}${cta('Passez à l\'action', 'Préparez le lancement de votre société avec un professionnel indépendant', 'Place à votre projet précis. CAP USA peut, lorsque c\'est pertinent, faciliter la mise en relation avec un professionnel indépendant adapté à votre projet. La mise en relation proposée par CAP USA est gratuite pour le porteur de projet. Chaque professionnel indépendant fixe ses propres prestations, conditions et honoraires. CAP USA n\x27encaisse pas ces honoraires.')}${legal({ fiscal: true })}${pn(8, 8, T_SOC)}</section>`,
];

const doc = (title, pages) => `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${title} — CAP USA</title><style>${CSS}</style></head><body>${pages.join('\n')}</body></html>`;
fs.writeFileSync(path.join(__dirname, 'guide-visa-e2.html'), doc('Le visa E-2 pour les Français', e2));
fs.writeFileSync(path.join(__dirname, 'guide-creer-societe-usa.html'), doc('Créer votre société aux États-Unis', soc));
console.log('HTML générés : ', e2.length, 'et', soc.length, 'pages');

// Planches d\x27aperçu (contrôle visuel page par page) : 4 pages par planche, échelle 0.62
const SC = 0.62;
const sheet = (name, pages, from) => {
  const sel = pages.slice(from, from + 4).map((p) => `<div class="w">${p}</div>`).join('');
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>${CSS}
body{background:#999;padding:8px;display:grid;grid-template-columns:${Math.round(794 * SC)}px ${Math.round(794 * SC)}px;gap:8px}
.w{width:${Math.round(794 * SC)}px;height:${Math.round(1123 * SC)}px;overflow:hidden;position:relative}
.w .page{position:absolute;left:0;top:0;transform:scale(${SC});transform-origin:0 0;width:794px;height:1123px}
</style></head><body>${sel}</body></html>`;
};
for (const [n, p] of [['e2', e2], ['soc', soc]]) {
  fs.writeFileSync(path.join(__dirname, `preview-${n}-a.html`), sheet(n, p, 0));
  fs.writeFileSync(path.join(__dirname, `preview-${n}-b.html`), sheet(n, p, 4));
}

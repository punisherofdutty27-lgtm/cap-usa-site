#!/bin/sh
# NE PAS EXÉCUTER avant : validation juridique/fiscale des guides ET accord explicite de CAP USA.
# Usage (depuis n'importe où) :  EDITION_DATE="JJ mois AAAA" sh guides-v2/publish.sh
# EDITION_DATE = date réelle de mise en ligne (aucune date de validation juridique n'est inventée).
set -e
cd "$(dirname "$0")/.."
[ -n "$EDITION_DATE" ] || { echo "EDITION_DATE requis (date réelle de mise en ligne)"; exit 1; }
sh guides-v2/export.sh
cp guides-v2/guide-visa-e2.pdf site/guide-visa-e2.pdf
cp guides-v2/guide-creer-societe-usa.pdf site/guide-creer-societe-usa.pdf
# Idempotent : ne fait rien si les liens sont déjà versionnés. Versionne les deux liens PDF de l'écran de succès du diagnostic (cache serveur de 30 jours) — liens uniquement.
node -e '
const fs=require("fs");const f="site/index.html";let t=fs.readFileSync(f,"utf8");
for(const n of ["guide-visa-e2.pdf","guide-creer-societe-usa.pdf"]){const a="href=\""+n+"\"";const v="href=\""+n+"?v=2\"";if(t.includes(v))continue;if(!t.includes(a))throw new Error("lien introuvable: "+n);t=t.replace(a,v)}
fs.writeFileSync(f,t);'
git diff --stat -- site

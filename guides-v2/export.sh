#!/bin/sh
# Génère les HTML (node build.js) puis exporte les PDF avec Chrome headless.
# Échoue (code ≠ 0) si un PDF n'est pas généré ; les PDF existants ne sont jamais conservés en cas d'échec.
cd "$(dirname "$0")" || exit 1
node build.js || exit 1
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
DIR="C:/Users/Punisher/Desktop/CAP USA FINAL/CAP-USA-projet-complet/guides-v2"
for n in guide-visa-e2 guide-creer-societe-usa; do
  rm -f "$n.pdf"
  "$CHROME" --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="$DIR/$n.pdf" "file:///$DIR/$n.html" >/dev/null || { echo "ERREUR: Chrome a échoué pour $n" >&2; exit 1; }
  [ -s "$n.pdf" ] || { echo "ERREUR: $n.pdf absent ou vide" >&2; exit 1; }
  ls -la "$n.pdf" | awk '{print $5, $9}'
done

// Tests de l'endpoint PHP des formulaires, en local, avec un faux serveur SMTP : aucun envoi réel.
// Usage : PHP_BIN=<chemin php> node tests/forms-php/run.js
const { spawn } = require("child_process");
const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");

const ROOT = path.resolve(__dirname, "../../site");
const PHP = process.env.PHP_BIN || "php";
const WEB = 8081, SMTP = 2525;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "capforms-"));
const priv = path.join(tmp, "cap-usa-private"), mailDir = path.join(tmp, "mails");
fs.mkdirSync(priv, { recursive: true });
const SECRET = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const PASS = "mot-de-passe-de-test-123";

function writeConfig(extra = {}) {
  const cfg = Object.assign({
    smtp_host: "127.0.0.1", smtp_port: SMTP, smtp_secure: "none", smtp_user: "leads@hellocapusa.net", smtp_pass: PASS,
    mail_from: "leads@hellocapusa.net", mail_to: ["leads@hellocapusa.net"], secret: SECRET,
    allowed_hosts: ["hellocapusa.com", "www.hellocapusa.com", "127.0.0.1"], queue_on_failure: true,
    rate_per_10min: 1000, rate_per_day: 1000, rate_global_per_hour: 1000, token_min_age: 1,
  }, extra);
  // la configuration réelle est un tableau PHP ; ici on la génère à partir de JSON (base64) pour éviter tout souci d'échappement
  fs.writeFileSync(path.join(priv, "config.php"), "<?php\nreturn json_decode(base64_decode('" + Buffer.from(JSON.stringify(cfg)).toString("base64") + "'), true);\n");
}
function reset(extra) { for (const d of ["rl", "sent", "queue", "logs"]) fs.rmSync(path.join(priv, d), { recursive: true, force: true }); writeConfig(extra); fs.rmSync(mailDir, { recursive: true, force: true }); fs.mkdirSync(mailDir, { recursive: true }); }
const setMode = (m) => fs.writeFileSync(path.join(mailDir, "mode.txt"), m);
const mails = () => fs.readdirSync(mailDir).filter((f) => f.endsWith(".eml")).sort().map((f) => fs.readFileSync(path.join(mailDir, f), "utf8"));
const queued = () => (fs.existsSync(path.join(priv, "queue")) ? fs.readdirSync(path.join(priv, "queue")).length : 0);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function req(method, p, { body, headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? new URLSearchParams(body).toString() : null;
    const h = Object.assign({ Origin: "https://hellocapusa.com", Accept: "application/json" }, headers);
    if (data !== null) { h["Content-Type"] = "application/x-www-form-urlencoded"; h["Content-Length"] = Buffer.byteLength(data); }
    for (const k of Object.keys(h)) if (h[k] === null) delete h[k];
    const r = http.request({ host: "127.0.0.1", port: WEB, path: p, method, headers: h }, (res) => {
      let t = ""; res.on("data", (c) => (t += c)); res.on("end", () => { let j = null; try { j = JSON.parse(t); } catch {} resolve({ status: res.statusCode, json: j, text: t }); });
    });
    r.on("error", reject); if (data !== null) r.write(data); r.end();
  });
}
const token = async () => (await req("GET", "/api/token.php")).json.t;
async function post(fields, { wait = true, headers } = {}) { const t = await token(); if (wait) await sleep(1150); return req("POST", "/api/forms.php", { body: Object.assign({ _t: t, _sid: "sid-" + Math.random().toString(36).slice(2) + "xxxxxxxx" }, fields), headers }); }

const F = {
  rappel: { source: "landing_google_ads", first_name: "Test", last_name: "Local", email: "test@example.invalid", phone: "0612345678", project_type_label: "Création de LLC", message: "Bonjour", consentement_traitement: "oui", utm_source: "google", gclid: "G1" },
  diag: { source: "questionnaire_diagnostic", first_name: "Test", last_name: "Diag", email: "diag@example.invalid", description_projet: "Je veux créer une LLC.", consentement_traitement: "oui", lead_label: "A", project_type: "societe", lead_score: "80" },
  service: { source: "page_ein", projet: "EIN", nom: "Test Service", email: "ein@example.invalid", telephone: "0612345678", message: "Besoin d'un EIN", consentement_mise_en_relation: "oui" },
  guide: { source: "guide_page", prenom: "Test", email: "guide@example.invalid", guide: "visa-e2", consentement_mise_en_relation: "oui" },
  lead: { source: "homepage_lead_magnet", email: "lm@example.invalid" },
  cj: { source: "consultation_juridique", first_name: "Test", last_name: "Cabinet", email: "cj@example.invalid", country: "France", contact_preference: "email", domain_label: "Droit des sociétés (LLC, Corporation)", domain_code: "societes", message: "Question générale de test.", consentement_transmission_cabinet: "oui" },
};

let pass = 0, fail = 0;
function check(name, cond, extra = "") { if (cond) { pass++; console.log("  ok   " + name); } else { fail++; console.log("  ECHEC " + name + (extra ? " -> " + extra : "")); } }

(async () => {
  const procs = [];
  const sm = spawn("node", [path.join(__dirname, "smtp-mock.js"), String(SMTP), mailDir], { stdio: "ignore" }); procs.push(sm);
  const php = spawn(PHP, ["-S", "127.0.0.1:" + WEB, "-t", ROOT], { env: Object.assign({}, process.env, { CAP_PRIVATE_DIR: priv }), stdio: "ignore" }); procs.push(php);
  const stop = () => procs.forEach((p) => { try { p.kill(); } catch {} });
  process.on("exit", stop);
  await sleep(1500);
  try {
    console.log("\n[0] Empreinte du visiteur (IPv6 regroupé par bloc /64)");
    const ipt = require("child_process").spawnSync(PHP, [path.join(__dirname, "ip-test.php")], { encoding: "utf8" });
    const ipOut = (ipt.stdout || "").trim().split("\n").filter(Boolean);
    ipOut.forEach((l) => { console.log(l); if (/ECHEC/.test(l)) fail++; else pass++; });
    check("ip-test.php terminé sans erreur", ipt.status === 0, (ipt.stderr || "").slice(0, 200));
    reset();
    console.log("\n[1] Soumissions valides (4 catégories + guides)");
    for (const [k, f] of Object.entries(F)) {
      const r = await post(f);
      check(k + " : 200 {ok:true}", r.status === 200 && r.json && r.json.ok === true, r.status + " " + r.text.slice(0, 120));
    }
    const all = mails();
    check("6 e-mails reçus par le faux SMTP", all.length === 6, "reçus : " + all.length);
    const dec = (m) => { const [h, b] = m.split("\r\n\r\n"); return { h, body: Buffer.from(b.replace(/\r\n/g, ""), "base64").toString("utf8") }; };
    const rp = dec(all[0]);
    check("Reply-To = e-mail du visiteur", /Reply-To: .*<test@example\.invalid>/.test(rp.h), rp.h.slice(0, 300));
    check("From = leads@hellocapusa.net, To = leads@hellocapusa.net", /From: .*<leads@hellocapusa\.net>/.test(rp.h) && /To: <leads@hellocapusa\.net>/.test(rp.h));
    check("corps contient la source et les champs", rp.body.includes("landing_google_ads") && rp.body.includes("gclid : G1") && rp.body.includes("project_type_label"));
    check("aucun champ technique (_t, _sid) dans le corps", !/_t :|_sid :|_gotcha/.test(rp.body));
    check("objet diagnostic prioritaire (A) avec emoji encodé", /Subject: =\?UTF-8\?B\?/.test(dec(all[1]).h));
    check("identifiants SMTP transmis au serveur (compte leads)", fs.readFileSync(path.join(mailDir, "mail-1.auth"), "utf8").startsWith("leads@hellocapusa.net"));

    console.log("\n[2] Champs manquants / invalides");
    reset();
    let r = await post(Object.assign({}, F.rappel, { email: "pas-un-email" })); check("e-mail invalide -> 422", r.status === 422 && r.json.fields.includes("email"));
    r = await post({ source: "landing_google_ads", email: "a@b.co" }); check("champs requis absents -> 422", r.status === 422 && r.json.fields.length >= 4);
    r = await post(Object.assign({}, F.service, { message: "" })); check("message vide -> 422", r.status === 422);
    r = await post(Object.assign({}, F.cj, { contact_preference: "whatsapp", phone: "" })); check("WhatsApp sans téléphone -> 422", r.status === 422 && r.json.fields.includes("phone"));
    r = await post(Object.assign({}, F.cj, { domain_code: "nimporte" })); check("domaine hors liste -> 422", r.status === 422);
    r = await post({ source: "inconnue" }); check("formulaire inconnu -> 400", r.status === 400);
    const nd = Object.assign({}, F.diag); delete nd.description_projet; r = await post(nd);
    check("diagnostic sans description (champ conditionnel) accepté", r.status === 200);
    const np = Object.assign({}, F.diag); delete np.project_type; r = await post(np);
    check("diagnostic sans type de projet -> 422", r.status === 422);
    reset();
    check("aucun e-mail envoyé pour ces cas", mails().length === 0);

    console.log("\n[3] Consentement");
    reset();
    r = await post(Object.assign({}, F.cj, { consentement_transmission_cabinet: "" })); check("consultation sans consentement -> 422", r.status === 422 && r.json.fields.includes("consentement_transmission_cabinet"));
    const nc = Object.assign({}, F.cj); delete nc.consentement_transmission_cabinet; r = await post(nc); check("consultation, champ de consentement absent -> 422", r.status === 422);
    r = await post(Object.assign({}, F.rappel, { consentement_traitement: "non" })); check("rappel avec consentement « non » -> 422", r.status === 422);
    check("aucun e-mail envoyé", mails().length === 0);

    console.log("\n[4] Soumissions automatisées");
    reset();
    r = await post(Object.assign({}, F.rappel, { _gotcha: "bot" })); check("champ piège rempli : 200 mais rien envoyé", r.status === 200 && mails().length === 0);
    r = await req("POST", "/api/forms.php", { body: F.rappel }); check("sans jeton -> 403", r.status === 403 && r.json.code === "token");
    r = await req("POST", "/api/forms.php", { body: Object.assign({ _t: "1.abc.def" }, F.rappel) }); check("jeton falsifié -> 403", r.status === 403);
    const t0 = await token(); r = await req("POST", "/api/forms.php", { body: Object.assign({ _t: t0 }, F.rappel) }); check("jeton trop récent (<1 s) -> 403", r.status === 403);
    reset({ token_max_age: 1 }); const t1 = await token(); await sleep(2300); r = await req("POST", "/api/forms.php", { body: Object.assign({ _t: t1 }, F.rappel) }); check("jeton expiré -> 403", r.status === 403);
    reset();
    r = await post(F.rappel, { headers: { Origin: "https://evil.example" } }); check("origine étrangère -> 403", r.status === 403 && r.json.code === "origin");
    r = await post(F.rappel, { headers: { Origin: null, Referer: null } }); check("sans Origin ni Referer -> 403", r.status === 403);
    r = await req("GET", "/api/forms.php"); check("GET -> 405", r.status === 405);
    r = await req("POST", "/api/forms.php", { body: { source: "page_ein", big: "x".repeat(70000) } }); check("corps trop gros -> 413", r.status === 413);
    check("aucun e-mail envoyé", mails().length === 0);

    console.log("\n[5] Limitation de fréquence");
    reset({ rate_per_10min: 3 });
    const codes = []; for (let i = 0; i < 5; i++) codes.push((await post(F.lead)).status);
    check("3 envois acceptés puis 429", codes.join(",") === "200,200,200,429,429", codes.join(","));
    reset({ rate_global_per_hour: 2 }); const g = []; for (let i = 0; i < 4; i++) g.push((await post(F.lead)).status);
    check("plafond global respecté", g.join(",") === "200,200,429,429", g.join(","));

    console.log("\n[6] Injection d'en-têtes e-mail");
    reset();
    r = await post(Object.assign({}, F.rappel, { first_name: "Bob\r\nBcc: pirate@example.invalid", last_name: "X\nSubject: faux", email: "ok@example.invalid" }));
    const inj = mails()[0] || ""; const hdr = inj.split("\r\n\r\n")[0];
    check("aucun en-tête Bcc injecté", r.status === 200 && !/^Bcc:/im.test(hdr), hdr.slice(0, 400));
    check("un seul en-tête Subject", (hdr.match(/^Subject:/gim) || []).length === 1);
    r = await post(Object.assign({}, F.rappel, { email: "ok@example.invalid\r\nBcc: pirate@example.invalid" })); check("e-mail avec saut de ligne rejeté", r.status === 422);
    r = await post(Object.assign({}, F.rappel, { _subject: "Objet imposé par le client\r\nBcc: x@y.z" })); check("objet fourni par le client ignoré", /Subject: Landing Google Ads/.test(mails().slice(-1)[0] || ""));

    console.log("\n[7] Erreurs SMTP et file d'attente");
    reset(); setMode("auth_fail");
    r = await post(F.cj); check("échec SMTP (authentification) -> demande mise en file, 200", r.status === 200 && queued() === 1 && mails().length === 0, r.status + " q=" + queued());
    const log = fs.existsSync(path.join(priv, "logs", "forms.log")) ? fs.readFileSync(path.join(priv, "logs", "forms.log"), "utf8") : "";
    check("journal : code d'erreur sans contenu de demande", /consultation_juridique\|smtp_535/.test(log) && !/Question générale|cj@example/.test(log), log.slice(0, 200));
    setMode("ok"); r = await post(F.lead);
    check("envoi suivant réussi : la file est vidée automatiquement", r.status === 200 && queued() === 0 && mails().length === 2, "q=" + queued() + " mails=" + mails().length);
    reset({ queue_on_failure: false }); setMode("rcpt_fail"); r = await post(F.cj);
    check("file désactivée + erreur destinataire -> 502 générique", r.status === 502 && r.json.code === "mail" && !/smtp|550|leads@/i.test(r.text), r.text);
    setMode("drop"); r = await post(F.cj); check("connexion coupée -> 502", r.status === 502);
    setMode("data_fail"); r = await post(F.cj); check("refus à l'envoi du message -> 502", r.status === 502);
    reset(); fs.rmSync(path.join(priv, "config.php")); r = await req("GET", "/api/token.php");
    check("configuration absente -> 500 générique, sans chemin ni détail", r.status === 500 && r.json.code === "server" && !/cap-usa-private|config/i.test(r.text), r.text);
    reset(); writeConfig({ smtp_secure: "ssl", smtp_host: "smtp.mail.ovh.net" }); // protection : « none » refusé hors local
    writeConfig({ smtp_secure: "none", smtp_host: "smtp.mail.ovh.net" }); r = await post(F.lead);
    check("SMTP en clair vers un hôte distant refusé (mise en file)", r.status === 200 && mails().length === 0 && queued() === 1);

    console.log("\n[8] Double envoi et secrets");
    reset(); const t = await token(); await sleep(1150); const same = Object.assign({ _t: t, _sid: "double-clic-0123456789abcdef" }, F.service);
    const [a, b] = await Promise.all([req("POST", "/api/forms.php", { body: same }), req("POST", "/api/forms.php", { body: same })]);
    await sleep(300); const c = await req("POST", "/api/forms.php", { body: same });
    check("même _sid, requêtes simultanées : un seul e-mail, 3 réponses 200", a.status === 200 && b.status === 200 && c.status === 200 && mails().length === 1, "mails=" + mails().length);
    await req("POST", "/api/forms.php", { body: same }); check("renvoi ultérieur ignoré (pas de doublon)", mails().length === 1);
    reset(); setMode("rcpt_fail"); writeConfig({ queue_on_failure: false }); const t2 = await token(); await sleep(1150);
    const retry = Object.assign({ _t: t2, _sid: "reessai-apres-echec-0123456" }, F.service);
    const f1 = await req("POST", "/api/forms.php", { body: retry }); setMode("ok"); const f2 = await req("POST", "/api/forms.php", { body: retry });
    check("échec puis nouvelle tentative avec le même _sid : accepté et envoyé", f1.status === 502 && f2.status === 200 && mails().length === 1, f1.status + "/" + f2.status + " mails=" + mails().length);
    check("aucune réponse ne contient le mot de passe SMTP ni la clé secrète", ![a, b, c].some((x) => x.text.includes(PASS) || x.text.includes(SECRET)));
    r = await req("GET", "/api/token.php"); check("jeton délivré (GET) au format signé", r.status === 200 && /^\d+\.[a-f0-9]{12}\.[a-f0-9]{64}$/.test(r.json.t));
    r = await req("POST", "/api/token.php"); check("token.php refuse POST", r.status === 405);
  } catch (e) { fail++; console.log("ERREUR DE TEST", e); }
  stop();
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log("\nRésultat : " + pass + " réussis, " + fail + " échecs");
  process.exit(fail ? 1 : 0);
})();

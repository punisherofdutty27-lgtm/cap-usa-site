// Faux serveur SMTP local (tests uniquement). Modes : ok | auth_fail | rcpt_fail | data_fail | drop
// Usage : node smtp-mock.js <port> <dossier-sortie> [mode]   (le mode peut être changé en écrivant dans <dossier>/mode.txt)
const net = require("net");
const fs = require("fs");
const path = require("path");
const port = Number(process.argv[2] || 2525);
const out = process.argv[3] || ".";
const defMode = process.argv[4] || "ok";
fs.mkdirSync(out, { recursive: true });
let n = 0;
const mode = () => { try { return fs.readFileSync(path.join(out, "mode.txt"), "utf8").trim() || defMode; } catch { return defMode; } };

net.createServer((s) => {
  let state = "cmd", buf = "", msg = "", auth = 0, user = "", pass = "";
  const send = (t) => s.write(t + "\r\n");
  send("220 mock ESMTP");
  s.on("error", () => {});
  s.on("data", (d) => {
    buf += d.toString("utf8");
    let i;
    while ((i = buf.indexOf("\r\n")) >= 0) {
      const line = buf.slice(0, i); buf = buf.slice(i + 2);
      if (state === "data") {
        if (line === ".") {
          if (mode() === "data_fail") { send("554 transaction failed"); state = "cmd"; msg = ""; continue; }
          n++;
          fs.writeFileSync(path.join(out, "mail-" + n + ".eml"), msg);
          fs.writeFileSync(path.join(out, "mail-" + n + ".auth"), user + "\n" + (pass ? "password-received" : ""));
          send("250 queued"); state = "cmd"; msg = "";
        } else msg += (line.startsWith("..") ? line.slice(1) : line) + "\r\n";
        continue;
      }
      if (auth === 1) { user = Buffer.from(line, "base64").toString(); auth = 2; send("334 UGFzc3dvcmQ6"); continue; }
      if (auth === 2) { pass = Buffer.from(line, "base64").toString(); auth = 0; if (mode() === "auth_fail") send("535 authentication failed"); else send("235 ok"); continue; }
      const c = line.toUpperCase();
      if (mode() === "drop" && c.startsWith("AUTH")) { s.destroy(); return; }
      if (c.startsWith("EHLO")) send("250-mock\r\n250 AUTH LOGIN");
      else if (c.startsWith("AUTH LOGIN")) { auth = 1; send("334 VXNlcm5hbWU6"); }
      else if (c.startsWith("MAIL FROM")) send("250 ok");
      else if (c.startsWith("RCPT TO")) send(mode() === "rcpt_fail" ? "550 no such user" : "250 ok");
      else if (c === "DATA") { state = "data"; send("354 go"); }
      else if (c === "QUIT") { send("221 bye"); s.end(); }
      else send("250 ok");
    }
  });
}).listen(port, "127.0.0.1", () => console.log("mock smtp sur 127.0.0.1:" + port));

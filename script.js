(() => {
  "use strict";
  const CFG = window.FORMILAIR_CONFIG;
  const $ = (id) => document.getElementById(id);
  const form = $("inscriptionForm");
  const FIELDS = ["prenom", "nom", "telephone", "serie", "etudes", "universite", "bourse"];
  const ID_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // sans 0/O/1/I pour éviter les confusions

  // QR : accepte les accents (UTF-8)
  qrcode.stringToBytes = (str) => Array.from(new TextEncoder().encode(str));

  const eventDate = new Date(CFG.eventDate + "T00:00:00");
  const eventDateLabel = isNaN(eventDate)
    ? "" : eventDate.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  $("eventDateText").textContent = eventDateLabel ? `Inscription · ${eventDateLabel}` : "Inscription";

  // ---------- Identifiant (aléatoire sécurisé ; l'unicité finale est vérifiée côté Sheets) ----------
  function generateId() {
    const bytes = crypto.getRandomValues(new Uint8Array(6));
    return CFG.idPrefix + "-" + Array.from(bytes, (b) => ID_ALPHABET[b % ID_ALPHABET.length]).join("");
  }

  // ---------- Validation ----------
  function validate(data) {
    const errors = {};
    const nameRe = /^[\p{L}][\p{L}' .-]{0,59}$/u;
    if (!nameRe.test(data.prenom)) errors.prenom = "Entrez votre prénom (lettres uniquement).";
    if (!nameRe.test(data.nom)) errors.nom = "Entrez votre nom (lettres uniquement).";
    const digits = data.telephone.replace(/\D/g, "");
    if (!/^\+?[0-9 .()-]+$/.test(data.telephone) || digits.length < 8 || digits.length > 15)
      errors.telephone = "Entrez un numéro valide, par exemple +227 90 00 00 00.";
    ["serie", "etudes", "universite", "bourse"].forEach((k) => {
      if (!data[k]) errors[k] = "Choisissez une réponse.";
    });
    return errors;
  }

  function showErrors(errors) {
    FIELDS.forEach((k) => {
      const msg = errors[k] || "";
      document.querySelector(`.err[data-for="${k}"]`).textContent = msg;
      $(k).setAttribute("aria-invalid", msg ? "true" : "false");
      if (msg) $(k).setAttribute("aria-describedby", `err-${k}`); else $(k).removeAttribute("aria-describedby");
    });
    const first = FIELDS.find((k) => errors[k]);
    if (first) $(first).focus();
  }

  // ---------- Envoi à Google Sheets ----------
  async function saveRegistration(data) {
    if (!CFG.sheetsUrl) return { ok: true, id: data.id, offline: true };
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res = await fetch(CFG.sheetsUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" }, // évite le préflight CORS
        body: JSON.stringify(data),
        signal: ctrl.signal
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Réponse invalide du serveur.");
      return json; // { ok, id, duplicate }
    } finally {
      clearTimeout(timer);
    }
  }

  // ---------- Ticket (canvas) ----------
  function fitText(ctx, text, maxWidth, size, weight) {
    let s = size;
    do { ctx.font = `${weight} ${s}px "Plus Jakarta Sans", system-ui, sans-serif`; s -= 2; }
    while (ctx.measureText(text).width > maxWidth && s > 20);
  }

  async function drawTicket({ prenom, nom, id }) {
    try { await document.fonts.load('700 20px "Plus Jakarta Sans"'); } catch (_) { /* police de secours */ }
    const c = $("ticketCanvas"), ctx = c.getContext("2d"), W = c.width, H = c.height, SPLIT = 700;
    const INK = "#14213D", SOFT = "#4A5878", SAFFRON = "#F2B01E";
    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.roundRect(0, 0, W, H, 28); ctx.fill();

    // bandeau titre
    ctx.save(); ctx.beginPath(); ctx.roundRect(0, 0, SPLIT, H, [28, 0, 0, 28]); ctx.clip();
    ctx.fillStyle = INK; ctx.fillRect(0, 0, SPLIT, 110);
    ctx.fillStyle = SAFFRON; ctx.fillRect(0, 110, SPLIT, 10);
    ctx.restore();
    ctx.fillStyle = "#fff"; fitText(ctx, "Ticket d’accès", 620, 40, 800); ctx.fillText("Ticket d’accès", 40, 52);
    ctx.fillStyle = "#D6DDEB"; fitText(ctx, CFG.eventName, 620, 26, 400); ctx.fillText(CFG.eventName, 40, 88);

    // infos participant
    ctx.fillStyle = SOFT; ctx.font = '600 22px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText("Participant", 40, 175);
    ctx.fillStyle = INK; const fullName = `${prenom} ${nom}`; fitText(ctx, fullName, 620, 44, 800); ctx.fillText(fullName, 40, 222);
    ctx.fillStyle = SOFT; ctx.font = '600 22px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText("Date", 40, 285); ctx.fillText("Identifiant", 360, 285);
    ctx.fillStyle = INK; ctx.font = '700 30px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText(eventDateLabel || "—", 40, 325); ctx.fillText(id, 360, 325);

    // QR code dessiné module par module (net à toute taille)
    const qr = qrcode(0, "M"); qr.addData(`Nom: ${fullName}\nID: ${id}`); qr.make();
    const n = qr.getModuleCount(), size = 220, cell = Math.floor(size / (n + 4)), qrSize = cell * n;
    const qx = SPLIT + (W - SPLIT - qrSize) / 2, qy = (H - qrSize) / 2;
    ctx.fillStyle = INK;
    for (let r = 0; r < n; r++) for (let col = 0; col < n; col++)
      if (qr.isDark(r, col)) ctx.fillRect(qx + col * cell, qy + r * cell, cell, cell);

    // pointillés + encoches (vrais trous transparents)
    ctx.save(); ctx.strokeStyle = "#B7C0D2"; ctx.lineWidth = 3; ctx.setLineDash([10, 10]);
    ctx.beginPath(); ctx.moveTo(SPLIT, 24); ctx.lineTo(SPLIT, H - 24); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = "destination-out";
    [0, H].forEach((y) => { ctx.beginPath(); ctx.arc(SPLIT, y, 22, 0, Math.PI * 2); ctx.fill(); });
    ctx.restore();
  }

  function downloadTicket(id) {
    $("ticketCanvas").toBlob((blob) => {
      const url = URL.createObjectURL(blob), a = document.createElement("a");
      a.href = url; a.download = `ticket-${id}.png`; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  }

  // ---------- Flux principal ----------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    $("formError").textContent = "";
    if ($("site").value) return; // robot détecté : on ignore silencieusement

    const data = {};
    FIELDS.forEach((k) => { data[k] = $(k).value.trim().replace(/\s+/g, " "); });
    const errors = validate(data);
    showErrors(errors);
    if (Object.keys(errors).length) return;

    data.id = generateId();
    const btn = $("submitBtn"); btn.disabled = true; btn.textContent = "Envoi en cours…";
    try {
      const result = await saveRegistration(data);
      const id = result.id || data.id;
      await drawTicket({ prenom: data.prenom, nom: data.nom, id });

      $("confirmation").textContent = result.duplicate
        ? "Vous êtes déjà inscrit(e) : voici votre ticket."
        : "Merci pour votre inscription, voici votre ticket.";
      $("offlineNote").hidden = !result.offline;
      $("downloadBtn").onclick = () => downloadTicket(id);
      const msg = `Bonjour, voici mon ticket d’accès à l’événement :\nNom : ${data.prenom} ${data.nom}\nID : ${id}`;
      $("whatsappLink").href = "https://wa.me/?text=" + encodeURIComponent(msg);

      $("formView").hidden = true; $("ticketView").hidden = false;
      $("confirmation").focus(); window.scrollTo(0, 0);
    } catch (err) {
      $("formError").textContent = err.name === "AbortError"
        ? "Le serveur ne répond pas. Vérifiez votre connexion et réessayez."
        : "L’inscription n’a pas pu être enregistrée. Réessayez dans un instant.";
    } finally {
      btn.disabled = false; btn.textContent = "Obtenir mon ticket";
    }
  });

  $("retourBtn").addEventListener("click", () => {
    form.reset(); showErrors({});
    $("ticketView").hidden = true; $("formView").hidden = false; $("prenom").focus();
  });
})();

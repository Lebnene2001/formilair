document.getElementById("inscriptionForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const prenom = document.getElementById("prenom").value;
  const nom = document.getElementById("nom").value;
  const telephone = document.getElementById("telephone").value;
  const serie = document.getElementById("serie").value;
  

  // Générer ID unique
  const identifiant = "BM-" + Math.floor(1000 + Math.random() * 9000);
  const dateEvenement = new Date().toLocaleDateString();

  // QR Code contenu
  const qrContent = `Nom: ${prenom} ${nom}\nID: ${identifiant}`;
  const qr = qrcode(0, 'L');
  qr.addData(qrContent);
  qr.make();

  // Masquer le formulaire
  document.getElementById("inscriptionForm").style.display = "none";
  document.getElementById("ticketForm").style.display = "block";

  // Dessiner sur canvas
  const canvas = document.getElementById("ticketCanvas");
  const ctx = canvas.getContext("2d");
  canvas.style.display = "block";
  ctx.fillStyle = "#e7eaeee3"; // bleu très clair
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#000";
  ctx.font = "16px Arial";
  ctx.fillText("Ticket d'accès à la semaine d’orientation post-Bac", 60, 30);
  ctx.fillText(`Nom: ${prenom} ${nom}`, 30, 80);
  ctx.fillText(`ID: ${identifiant}`, 30, 110);
  ctx.fillText(`Date: ${dateEvenement}`, 30, 140);

  // QR Code HTML to Image
  const qrImg = new Image();
  qrImg.onload = function () {
    ctx.drawImage(qrImg, 350, 60, 100, 100);
    // Activer téléchargement
    const link = document.getElementById("downloadLink");
    link.href = canvas.toDataURL("image/png");
    link.style.display = "inline-block";

    // Message confirmation
    document.getElementById("confirmation").innerHTML =
      "✅ Merci pour votre inscription, voici votre ticket !";

    // Lien WhatsApp (texte pré-rempli)
    const messageWhatsApp = `Bonjour, voici mon ticket d'accès à l'événement:\nNom: ${prenom} ${nom}\nID: ${identifiant}`;
    const whatsappLink = document.getElementById("whatsappLink");
    whatsappLink.href = `https://wa.me/?text=${encodeURIComponent(messageWhatsApp)}`;
    whatsappLink.style.display = "inline-block";
    whatsappLink.textContent = "Envoyer sur WhatsApp";
  };

  const qrHtml = qr.createImgTag(4);
  const parser = new DOMParser();
  const doc = parser.parseFromString(qrHtml, 'text/html');
  const imgTag = doc.querySelector("img").src;
  qrImg.src = imgTag;
});
// filepath: c:\Users\DELL\Desktop\exercice pour mon recritement\Mon site web\formulaire d'incruption\script.js
window.addEventListener("DOMContentLoaded", function() {
  var retourBtn = document.getElementById("retourBtn");
  if (retourBtn) {
    retourBtn.addEventListener("click", function () {
      document.getElementById("ticketForm").style.display = "none";
      document.getElementById("inscriptionForm").style.display = "block";
    });
  }
});
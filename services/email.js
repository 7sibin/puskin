// services/email.js — Zlatar Stars
// Nodemailer: potvrda gostu + notifikacija vlasniku

const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ── Formatiranje datuma ─────────────────────────
function fmtDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('sr-Latn-RS', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

// ── Email gostu (potvrda zahteva) ───────────────
async function sendGuestConfirmation(res) {
  const html = `
<!DOCTYPE html>
<html lang="sr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body { margin:0; padding:0; background:#f5f5f0; font-family:'Georgia',serif; color:#1a1a1a; }
  .wrap { max-width:600px; margin:40px auto; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,.08); }
  .header { background:#0e0e0e; padding:40px 32px; text-align:center; }
  .logo { color:#c9a96e; font-size:22px; letter-spacing:3px; font-weight:300; }
  .star { color:#c9a96e; margin-right:6px; }
  .body { padding:40px 32px; }
  h1 { font-size:26px; color:#0e0e0e; margin:0 0 8px; font-weight:400; }
  .subtitle { color:#666; font-size:15px; margin:0 0 32px; }
  .ref { display:inline-block; background:#f5f5f0; border:1px solid #e0d5c5; border-radius:4px; padding:10px 20px; font-size:18px; letter-spacing:2px; color:#c9a96e; font-weight:600; margin-bottom:32px; }
  .card { background:#fafaf8; border:1px solid #e8e0d0; border-radius:6px; padding:24px; margin-bottom:24px; }
  .card-title { font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#999; margin:0 0 16px; }
  .row { display:flex; justify-content:space-between; margin-bottom:10px; font-size:14px; }
  .label { color:#666; }
  .val { color:#1a1a1a; font-weight:500; text-align:right; }
  .total-row { border-top:1px solid #e8e0d0; margin-top:12px; padding-top:12px; }
  .total-label { font-size:15px; font-weight:600; }
  .total-val { font-size:18px; color:#c9a96e; font-weight:700; }
  .notice { background:#fff8ee; border-left:3px solid #c9a96e; padding:16px 20px; border-radius:0 4px 4px 0; font-size:13px; color:#555; margin-bottom:24px; }
  .cta { text-align:center; margin:32px 0 16px; }
  .btn { background:#c9a96e; color:#fff; text-decoration:none; padding:14px 32px; border-radius:4px; font-size:14px; letter-spacing:1px; display:inline-block; }
  .footer { background:#0e0e0e; padding:24px 32px; text-align:center; }
  .footer p { color:#666; font-size:12px; margin:4px 0; }
  .footer a { color:#c9a96e; text-decoration:none; }
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <div class="logo"><span class="star">✦</span> ZLATAR STARS</div>
  </div>
  <div class="body">
    <h1>Hvala, ${res.first_name}!</h1>
    <p class="subtitle">Vaš zahtev za rezervaciju je primljen i biće potvrđen u roku od 2 sata.</p>

    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-size:12px;letter-spacing:2px;color:#999;text-transform:uppercase;margin-bottom:8px;">Referentni broj</div>
      <div class="ref">${res.ref_code}</div>
    </div>

    <div class="card">
      <div class="card-title">Detalji rezervacije</div>
      <div class="row"><span class="label">Apartman</span><span class="val">${res.apartment_name}</span></div>
      <div class="row"><span class="label">Datum dolaska</span><span class="val">${fmtDate(res.check_in)}</span></div>
      <div class="row"><span class="label">Datum odlaska</span><span class="val">${fmtDate(res.check_out)}</span></div>
      <div class="row"><span class="label">Broj noći</span><span class="val">${res.nights}</span></div>
      <div class="row"><span class="label">Broj gostiju</span><span class="val">${res.guests}</span></div>
      ${res.special_requests ? `<div class="row"><span class="label">Posebni zahtevi</span><span class="val">${res.special_requests}</span></div>` : ''}
      <div class="row total-row"><span class="label total-label">Ukupno</span><span class="val total-val">€${res.total_eur}</span></div>
    </div>

    <div class="notice">
      📋 <strong>Napomena:</strong> Plaćanje se vrši pri prijavi (keš ili kartica). Za boravke duže od 7 noći tražimo avans od 30%.
      <br><br>
      🕐 <strong>Check-in:</strong> od 14:00 &nbsp;|&nbsp; <strong>Check-out:</strong> do 12:00
    </div>

    <div class="cta">
      <a href="https://www.zlatarstars.rs" class="btn">Poseti naš sajt</a>
    </div>
    <p style="text-align:center;font-size:13px;color:#999;">Pitanja? Pišite nam na <a href="mailto:info@zlatarstars.rs" style="color:#c9a96e;">info@zlatarstars.rs</a> ili pozovite <a href="tel:+381642498980" style="color:#c9a96e;">+381 64 249 8980</a></p>
  </div>
  <div class="footer">
    <p>© 2025 Zlatar Stars · Akmačići, Zlatar, Srbija</p>
    <p><a href="https://www.zlatarstars.rs">www.zlatarstars.rs</a></p>
  </div>
</div>
</body>
</html>`;

  return transporter.sendMail({
    from: `"Zlatar Stars" <${process.env.EMAIL_USER}>`,
    to: res.email,
    subject: `✦ Potvrda zahteva — Ref. ${res.ref_code} | Zlatar Stars`,
    html,
  });
}

// ── Email vlasniku (nova rezervacija) ───────────
async function sendOwnerNotification(res) {
  const html = `
<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  body { font-family:Arial,sans-serif; background:#f5f5f0; margin:0; padding:20px; color:#1a1a1a; }
  .wrap { max-width:560px; margin:0 auto; background:#fff; border-radius:8px; padding:32px; }
  h2 { color:#c9a96e; margin-top:0; }
  table { width:100%; border-collapse:collapse; font-size:14px; }
  td { padding:8px 0; border-bottom:1px solid #f0ebe0; }
  td:first-child { color:#666; width:140px; }
  td:last-child { font-weight:500; }
  .total { font-size:18px; color:#c9a96e; font-weight:700; }
  .btn { display:inline-block; margin-top:20px; background:#0e0e0e; color:#fff; padding:12px 24px; border-radius:4px; text-decoration:none; font-size:13px; }
</style>
</head>
<body>
<div class="wrap">
  <h2>✦ Nova rezervacija — ${res.ref_code}</h2>
  <table>
    <tr><td>Gost</td><td>${res.first_name} ${res.last_name}</td></tr>
    <tr><td>Email</td><td><a href="mailto:${res.email}">${res.email}</a></td></tr>
    <tr><td>Telefon</td><td><a href="tel:${res.phone}">${res.phone}</a></td></tr>
    <tr><td>Apartman</td><td>${res.apartment_name}</td></tr>
    <tr><td>Check-in</td><td>${fmtDate(res.check_in)}</td></tr>
    <tr><td>Check-out</td><td>${fmtDate(res.check_out)}</td></tr>
    <tr><td>Noći</td><td>${res.nights}</td></tr>
    <tr><td>Gostiju</td><td>${res.guests}</td></tr>
    ${res.special_requests ? `<tr><td>Zahtevi</td><td>${res.special_requests}</td></tr>` : ''}
    <tr><td>Ukupno</td><td class="total">€${res.total_eur}</td></tr>
  </table>
  <a href="${process.env.FRONTEND_URL}/admin" class="btn">Otvori Admin Panel →</a>
</div>
</body>
</html>`;

  return transporter.sendMail({
    from: `"Zlatar Stars Sistem" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER,
    subject: `🔔 Nova rezervacija: ${res.first_name} ${res.last_name} — ${res.apartment_name} (${res.ref_code})`,
    html,
  });
}

// ── Email potvrde od strane vlasnika ───────────
async function sendConfirmedEmail(res) {
  const html = `
<!DOCTYPE html>
<html lang="sr"><head><meta charset="UTF-8">
<style>
  body { margin:0; background:#f5f5f0; font-family:'Georgia',serif; }
  .wrap { max-width:600px; margin:40px auto; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,.08); }
  .header { background:#0e0e0e; padding:40px 32px; text-align:center; }
  .logo { color:#c9a96e; font-size:22px; letter-spacing:3px; font-weight:300; }
  .body { padding:40px 32px; }
  h1 { font-size:26px; color:#0e0e0e; margin:0 0 8px; font-weight:400; }
  .badge { display:inline-block; background:#e8f5e9; color:#2e7d32; border-radius:20px; padding:6px 16px; font-size:13px; font-weight:600; margin-bottom:24px; }
  .card { background:#fafaf8; border:1px solid #e8e0d0; border-radius:6px; padding:24px; margin-bottom:24px; }
  .row { display:flex; justify-content:space-between; margin-bottom:10px; font-size:14px; }
  .label { color:#666; }
  .val { font-weight:500; }
  .footer { background:#0e0e0e; padding:24px; text-align:center; }
  .footer p { color:#666; font-size:12px; margin:4px 0; }
</style>
</head>
<body>
<div class="wrap">
  <div class="header"><div class="logo">✦ ZLATAR STARS</div></div>
  <div class="body">
    <h1>Rezervacija potvrđena! 🎉</h1>
    <div class="badge">✓ POTVRĐENO</div>
    <p style="color:#555;margin-bottom:24px;">Dragi/a ${res.first_name}, vaša rezervacija je zvanično potvrđena. Jedva čekamo vaš dolazak!</p>
    <div class="card">
      <div class="row"><span class="label">Ref. broj</span><span class="val" style="color:#c9a96e;font-weight:700;">${res.ref_code}</span></div>
      <div class="row"><span class="label">Apartman</span><span class="val">${res.apartment_name}</span></div>
      <div class="row"><span class="label">Check-in</span><span class="val">${fmtDate(res.check_in)} od 14:00</span></div>
      <div class="row"><span class="label">Check-out</span><span class="val">${fmtDate(res.check_out)} do 12:00</span></div>
      <div class="row"><span class="label">Gostiju</span><span class="val">${res.guests}</span></div>
      <div class="row" style="border-top:1px solid #e8e0d0;margin-top:8px;padding-top:12px;">
        <span class="label" style="font-size:15px;font-weight:600;">Ukupno</span>
        <span class="val" style="font-size:18px;color:#c9a96e;font-weight:700;">€${res.total_eur}</span>
      </div>
    </div>
    <p style="font-size:13px;color:#999;text-align:center;">Pitanja? <a href="mailto:info@zlatarstars.rs" style="color:#c9a96e;">info@zlatarstars.rs</a> | <a href="tel:+381642498980" style="color:#c9a96e;">+381 64 249 8980</a></p>
  </div>
  <div class="footer"><p>© 2025 Zlatar Stars</p></div>
</div>
</body>
</html>`;

  return transporter.sendMail({
    from: `"Zlatar Stars" <${process.env.EMAIL_USER}>`,
    to: res.email,
    subject: `✅ Rezervacija potvrđena — ${res.ref_code} | Zlatar Stars`,
    html,
  });
}

module.exports = { sendGuestConfirmation, sendOwnerNotification, sendConfirmedEmail };

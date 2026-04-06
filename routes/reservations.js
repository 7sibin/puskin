// routes/reservations.js — Zlatar Stars

const express = require('express');
const router  = express.Router();
const { supabase } = require('../db/supabase');
const { sendGuestConfirmation, sendOwnerNotification } = require('../services/email');

// ── Generiši ref kod ───────────────────────────
function genRefCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'ZS-';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ── Validacija ─────────────────────────────────
function validateReservation(body) {
  const errors = [];
  const { apartment_id, check_in, check_out, guests, first_name, last_name, email, phone } = body;

  if (!apartment_id) errors.push('Apartman je obavezan.');
  if (!check_in)     errors.push('Datum dolaska je obavezan.');
  if (!check_out)    errors.push('Datum odlaska je obavezan.');
  if (!guests)       errors.push('Broj gostiju je obavezan.');
  if (!first_name)   errors.push('Ime je obavezno.');
  if (!last_name)    errors.push('Prezime je obavezno.');
  if (!email || !/\S+@\S+\.\S+/.test(email)) errors.push('Email adresa nije validna.');
  if (!phone)        errors.push('Telefon je obavezan.');

  if (check_in && check_out) {
    const ci = new Date(check_in);
    const co = new Date(check_out);
    const now = new Date(); now.setHours(0,0,0,0);
    if (ci < now)  errors.push('Datum dolaska ne može biti u prošlosti.');
    if (co <= ci)  errors.push('Datum odlaska mora biti posle datuma dolaska.');
    const nights = Math.ceil((co - ci) / 86400000);
    if (nights > 30) errors.push('Maksimalan boravak je 30 noći.');
  }

  return errors;
}

// ══════════════════════════════════════════════════════
// POST /api/reservations — kreiranje rezervacije
// ══════════════════════════════════════════════════════
router.post('/', async (req, res) => {
  try {
    const errors = validateReservation(req.body);
    if (errors.length) return res.status(400).json({ success: false, errors });

    const { apartment_id, check_in, check_out, guests, first_name, last_name, email, phone, special_requests } = req.body;

    // 1. Dohvati apartman
    const { data: apt, error: aptErr } = await supabase
      .from('apartments')
      .select('*')
      .eq('id', apartment_id)
      .single();

    if (aptErr || !apt) return res.status(404).json({ success: false, errors: ['Apartman nije pronađen.'] });

    // 2. Provjera broja gostiju
    if (parseInt(guests) > apt.max_guests) {
      return res.status(400).json({ success: false, errors: [`Maksimalan broj gostiju za ovaj apartman je ${apt.max_guests}.`] });
    }

    // 3. Provjera dostupnosti
    const { data: conflicts } = await supabase
      .from('reservations')
      .select('id')
      .eq('apartment_id', apartment_id)
      .neq('status', 'cancelled')
      .lt('check_in', check_out)
      .gt('check_out', check_in);

    if (conflicts && conflicts.length > 0) {
      return res.status(409).json({ success: false, errors: ['Apartman nije dostupan za izabrane datume. Molimo izaberite druge datume.'] });
    }

    // 4. Izračunaj cenu
    const nights = Math.ceil((new Date(check_out) - new Date(check_in)) / 86400000);
    const total_eur = (nights * apt.price_eur).toFixed(2);

    // 5. Kreiraj rezervaciju
    const ref_code = genRefCode();
    const { data: newRes, error: insertErr } = await supabase
      .from('reservations')
      .insert({
        ref_code,
        apartment_id,
        first_name: first_name.trim(),
        last_name:  last_name.trim(),
        email:      email.trim().toLowerCase(),
        phone:      phone.trim(),
        check_in,
        check_out,
        guests:     parseInt(guests),
        special_requests: special_requests?.trim() || null,
        total_eur,
        nights,
        status: 'pending',
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    // 6. Pošalji emailove (async, ne blokiraj odgovor)
    const emailData = { ...newRes, apartment_name: apt.name };
    Promise.all([
      sendGuestConfirmation(emailData),
      sendOwnerNotification(emailData),
    ]).catch(err => console.error('Email greška:', err.message));

    return res.status(201).json({
      success: true,
      ref_code,
      message: 'Rezervacija uspešno kreirana! Proverite email za potvrdu.',
      data: {
        ref_code,
        apartment: apt.name,
        check_in,
        check_out,
        nights,
        guests: parseInt(guests),
        total_eur: parseFloat(total_eur),
      },
    });

  } catch (err) {
    console.error('POST /reservations greška:', err);
    return res.status(500).json({ success: false, errors: ['Interna greška servera. Pokušajte ponovo.'] });
  }
});

// ══════════════════════════════════════════════════════
// GET /api/reservations/availability?apartment_id=sunce&check_in=2025-07-01&check_out=2025-07-05
// ══════════════════════════════════════════════════════
router.get('/availability', async (req, res) => {
  try {
    const { apartment_id, check_in, check_out } = req.query;
    if (!apartment_id || !check_in || !check_out) {
      return res.status(400).json({ success: false, error: 'Nedostaju parametri.' });
    }

    const { data: conflicts } = await supabase
      .from('reservations')
      .select('id')
      .eq('apartment_id', apartment_id)
      .neq('status', 'cancelled')
      .lt('check_in', check_out)
      .gt('check_out', check_in);

    return res.json({ success: true, available: !conflicts || conflicts.length === 0 });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Greška servera.' });
  }
});

// ══════════════════════════════════════════════════════
// GET /api/reservations/booked-dates?apartment_id=sunce
// Vraća sve zauzete datume za kalendar na frontendu
// ══════════════════════════════════════════════════════
router.get('/booked-dates', async (req, res) => {
  try {
    const { apartment_id } = req.query;
    if (!apartment_id) return res.status(400).json({ success: false, error: 'apartment_id je obavezan.' });

    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('reservations')
      .select('check_in, check_out')
      .eq('apartment_id', apartment_id)
      .neq('status', 'cancelled')
      .gte('check_out', today);

    if (error) throw error;

    // Generiši sve zauzete datume
    const bookedDates = [];
    (data || []).forEach(({ check_in, check_out }) => {
      const ci = new Date(check_in);
      const co = new Date(check_out);
      for (let d = new Date(ci); d < co; d.setDate(d.getDate() + 1)) {
        bookedDates.push(d.toISOString().split('T')[0]);
      }
    });

    return res.json({ success: true, apartment_id, booked_dates: [...new Set(bookedDates)] });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Greška servera.' });
  }
});

module.exports = router;

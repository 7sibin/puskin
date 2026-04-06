// routes/admin.js — Zlatar Stars
// Zaštićene admin rute (token auth)

const express = require('express');
const router  = express.Router();
const { supabase } = require('../db/supabase');
const { sendConfirmedEmail } = require('../services/email');
require('dotenv').config();

// ── Admin auth middleware ──────────────────────
function adminAuth(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ success: false, error: 'Neovlašćen pristup.' });
  }
  next();
}

// ══════════════════════════════════════════════════════
// GET /api/admin/reservations — sve rezervacije
// ══════════════════════════════════════════════════════
router.get('/reservations', adminAuth, async (req, res) => {
  try {
    const { status, apartment_id, from, to, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('reservations')
      .select(`
        *,
        apartments(name, price_eur)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (status)       query = query.eq('status', status);
    if (apartment_id) query = query.eq('apartment_id', apartment_id);
    if (from)         query = query.gte('check_in', from);
    if (to)           query = query.lte('check_out', to);

    const { data, count, error } = await query;
    if (error) throw error;

    return res.json({ success: true, total: count, page: parseInt(page), data });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ══════════════════════════════════════════════════════
// GET /api/admin/reservations/:id — jedna rezervacija
// ══════════════════════════════════════════════════════
router.get('/reservations/:id', adminAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reservations')
      .select('*, apartments(name, price_eur, description)')
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ success: false, error: 'Rezervacija nije pronađena.' });
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ══════════════════════════════════════════════════════
// PATCH /api/admin/reservations/:id/status — promeni status
// Body: { status: 'confirmed' | 'cancelled' }
// ══════════════════════════════════════════════════════
router.patch('/reservations/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['confirmed', 'cancelled', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Nevažeći status.' });
    }

    // Dohvati rezervaciju
    const { data: existing } = await supabase
      .from('reservations')
      .select('*, apartments(name)')
      .eq('id', req.params.id)
      .single();

    if (!existing) return res.status(404).json({ success: false, error: 'Rezervacija nije pronađena.' });

    // Update status
    const { data, error } = await supabase
      .from('reservations')
      .update({ status })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    // Pošalji email gostu ako je potvrđena
    if (status === 'confirmed') {
      sendConfirmedEmail({
        ...existing,
        apartment_name: existing.apartments?.name,
      }).catch(err => console.error('Email greška:', err.message));
    }

    return res.json({ success: true, data, message: `Status promenjen u "${status}".` });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ══════════════════════════════════════════════════════
// DELETE /api/admin/reservations/:id — brisanje
// ══════════════════════════════════════════════════════
router.delete('/reservations/:id', adminAuth, async (req, res) => {
  try {
    const { error } = await supabase.from('reservations').delete().eq('id', req.params.id);
    if (error) throw error;
    return res.json({ success: true, message: 'Rezervacija obrisana.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ══════════════════════════════════════════════════════
// GET /api/admin/stats — statistike za dashboard
// ══════════════════════════════════════════════════════
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [all, pending, confirmed, active, revenue] = await Promise.all([
      supabase.from('reservations').select('id', { count: 'exact', head: true }),
      supabase.from('reservations').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('reservations').select('id', { count: 'exact', head: true }).eq('status', 'confirmed'),
      supabase.from('reservations').select('id', { count: 'exact', head: true })
        .neq('status', 'cancelled').lte('check_in', today).gte('check_out', today),
      supabase.from('reservations').select('total_eur').eq('status', 'confirmed'),
    ]);

    const totalRevenue = (revenue.data || []).reduce((s, r) => s + parseFloat(r.total_eur), 0);

    return res.json({
      success: true,
      stats: {
        total: all.count || 0,
        pending: pending.count || 0,
        confirmed: confirmed.count || 0,
        active_now: active.count || 0,
        total_revenue_eur: totalRevenue.toFixed(2),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ══════════════════════════════════════════════════════
// GET /api/admin/apartments — pregled apartmana
// ══════════════════════════════════════════════════════
router.get('/apartments', adminAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('apartments').select('*').order('price_eur');
    if (error) throw error;
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ══════════════════════════════════════════════════════
// PATCH /api/admin/apartments/:id — izmena cene apartmana
// ══════════════════════════════════════════════════════
router.patch('/apartments/:id', adminAuth, async (req, res) => {
  try {
    const { price_eur, description } = req.body;
    const updates = {};
    if (price_eur !== undefined) updates.price_eur = parseFloat(price_eur);
    if (description !== undefined) updates.description = description;

    const { data, error } = await supabase
      .from('apartments')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

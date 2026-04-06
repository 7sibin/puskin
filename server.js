// server.js — Zlatar Stars Backend
// Node.js + Express + Supabase

require('dotenv').config();
const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const rateLimit   = require('express-rate-limit');
const path        = require('path');
const { testConnection } = require('./db/supabase');

const reservationsRouter = require('./routes/reservations');
const adminRouter        = require('./routes/admin');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Security headers ───────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));

// ── CORS ───────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://127.0.0.1:5500',   // Live Server
  'http://localhost:5500',
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('CORS: origin nije dozvoljen — ' + origin));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-admin-token'],
}));

// ── Body parser ────────────────────────────────
app.use(express.json({ limit: '16kb' }));

// ── Rate limiting ──────────────────────────────
app.use('/api/reservations', rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 min
  max: 20,
  message: { success: false, error: 'Previše zahteva. Pokušajte za 15 minuta.' },
  standardHeaders: true,
  legacyHeaders: false,
}));

app.use('/api/admin', rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
}));

// ── Static fajlovi (frontend) ──────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ══════════════════════════════════════════════════════
// API RUTE
// ══════════════════════════════════════════════════════
app.use('/api/reservations', reservationsRouter);
app.use('/api/admin',        adminRouter);

// ── Health check ───────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    await testConnection();
    res.json({ status: 'ok', service: 'Zlatar Stars API', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: 'error', message: err.message });
  }
});

// ── Apartmani — javna ruta ─────────────────────
app.get('/api/apartments', async (req, res) => {
  try {
    const { supabase } = require('./db/supabase');
    const { data, error } = await supabase.from('apartments').select('id, name, max_guests, price_eur, size_m2, bedrooms, description').order('price_eur');
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── SPA fallback — sve nepoznate rute → frontend
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, error: 'Ruta nije pronađena.' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Global error handler ───────────────────────
app.use((err, req, res, next) => {
  console.error('Greška:', err.message);
  res.status(err.status || 500).json({ success: false, error: err.message || 'Interna greška servera.' });
});

// ── Start ──────────────────────────────────────
async function start() {
  try {
    await testConnection();
    app.listen(PORT, () => {
      console.log(`
╔══════════════════════════════════════╗
║        ZLATAR STARS BACKEND          ║
╠══════════════════════════════════════╣
║  Server:  http://localhost:${PORT}      ║
║  Health:  /api/health                ║
║  API:     /api/reservations          ║
║  Admin:   /api/admin/reservations    ║
╚══════════════════════════════════════╝
      `);
    });
  } catch (err) {
    console.error('❌ Pokretanje neuspešno:', err.message);
    console.error('Proverite .env fajl (SUPABASE_URL, SUPABASE_SERVICE_KEY)');
    process.exit(1);
  }
}

start();

// db/supabase.js — Zlatar Stars
// Supabase klijent + SQL schema za setup

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ══════════════════════════════════════════════════════
// SQL SCHEMA — pokrenite ovo jednom u Supabase SQL editoru
// ══════════════════════════════════════════════════════
const SCHEMA_SQL = `
-- Apartmani
CREATE TABLE IF NOT EXISTS apartments (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  max_guests INTEGER NOT NULL,
  price_eur  NUMERIC(10,2) NOT NULL,
  size_m2    INTEGER,
  bedrooms   INTEGER,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed apartmana
INSERT INTO apartments (id, name, max_guests, price_eur, size_m2, bedrooms, description)
VALUES
  ('sunce',   'Apartman 1 — Sunce',   5, 120.00, 51, 2, 'Prostran porodični apartman sa jugoistočnim osvetljenjem i panoramskim prozorima.'),
  ('zvezda',  'Apartman 2 — Zvezda',  4,  90.00, 43, 1, 'Romantični apartman sa ogromnom terasom i pogledom na zvezde.'),
  ('planina', 'Apartman 3 — Planina', 3, 150.00, 41, 3, 'Rustičan luksuz sa kaminskim ložištem, visokim gredama i panoramskim pogledom.')
ON CONFLICT (id) DO NOTHING;

-- Rezervacije
CREATE TABLE IF NOT EXISTS reservations (
  id               BIGSERIAL PRIMARY KEY,
  ref_code         TEXT UNIQUE NOT NULL,
  apartment_id     TEXT NOT NULL REFERENCES apartments(id),
  first_name       TEXT NOT NULL,
  last_name        TEXT NOT NULL,
  email            TEXT NOT NULL,
  phone            TEXT NOT NULL,
  check_in         DATE NOT NULL,
  check_out        DATE NOT NULL,
  guests           INTEGER NOT NULL,
  special_requests TEXT,
  total_eur        NUMERIC(10,2) NOT NULL,
  nights           INTEGER NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','confirmed','cancelled')),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Index za brze upite dostupnosti
CREATE INDEX IF NOT EXISTS idx_res_apartment_dates
  ON reservations(apartment_id, check_in, check_out)
  WHERE status != 'cancelled';

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS: blokira direktan pristup sa frontend-a (koristimo service key samo na backend-u)
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE apartments   ENABLE ROW LEVEL SECURITY;

-- Dozvolite service_role sve
CREATE POLICY "service_role_all_reservations" ON reservations
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_apartments" ON apartments
  FOR ALL USING (auth.role() = 'service_role');
`;

async function testConnection() {
  const { data, error } = await supabase.from('apartments').select('id').limit(1);
  if (error) throw new Error('Supabase konekcija neuspešna: ' + error.message);
  console.log('✅ Supabase konekcija OK');
  return true;
}

module.exports = { supabase, SCHEMA_SQL, testConnection };

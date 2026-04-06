# ✦ Zlatar Stars — Backend API

Node.js + Express + Supabase backend za rezervacioni sistem.

---

## 📁 Struktura

```
zlatarstars/
├── server.js                  # Entry point
├── .env.example               # Primer env varijabli
├── db/
│   └── supabase.js            # Supabase klijent + SQL schema
├── routes/
│   ├── reservations.js        # Javne rute za rezervacije
│   └── admin.js               # Admin rute (zaštićene)
├── services/
│   └── email.js               # Nodemailer — emailovi gostima i vlasniku
├── public/
│   ├── index.html             # Frontend (kopirati vaše fajlove ovde)
│   ├── rezervacija.html
│   ├── style.css
│   ├── script.js
│   └── admin.html             # Admin panel
└── package.json
```

---

## 🚀 Pokretanje

### 1. Supabase setup

1. Idite na [supabase.com](https://supabase.com) → novi projekat
2. Otvorite **SQL Editor** i pokrenite ceo sadržaj iz `db/supabase.js` (promenljiva `SCHEMA_SQL`)
3. Iz **Project Settings → API** kopirajte:
   - `Project URL` → `SUPABASE_URL`
   - `service_role` ključ → `SUPABASE_SERVICE_KEY`

### 2. .env fajl

```bash
cp .env.example .env
# Popunite sve vrednosti
```

```env
PORT=3000
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGci...
EMAIL_USER=info@zlatarstars.rs
EMAIL_PASS=vaš-gmail-app-password
ADMIN_TOKEN=dugacak-random-string-min-32-karaktera
FRONTEND_URL=https://www.zlatarstars.rs
```

> **Gmail App Password:** Google nalog → Bezbednost → Dvostepena verifikacija → App Passwords

### 3. Frontend fajlovi

Kopirajte sve vaše HTML/CSS/JS fajlove u `public/` folder.

### 4. Pokretanje

```bash
npm install
npm start
# ili za development:
npm run dev
```

---

## 📡 API Rute

### Javne

| Metod | Ruta | Opis |
|-------|------|------|
| `GET`  | `/api/health` | Health check |
| `GET`  | `/api/apartments` | Lista apartmana sa cenama |
| `POST` | `/api/reservations` | Kreiranje rezervacije |
| `GET`  | `/api/reservations/availability` | Provjera dostupnosti |
| `GET`  | `/api/reservations/booked-dates` | Zauzeti datumi (za kalendar) |

### Admin (header: `x-admin-token: VAŠ_TOKEN`)

| Metod | Ruta | Opis |
|-------|------|------|
| `GET`    | `/api/admin/stats` | Statistike |
| `GET`    | `/api/admin/reservations` | Sve rezervacije (filter, paginacija) |
| `GET`    | `/api/admin/reservations/:id` | Jedna rezervacija |
| `PATCH`  | `/api/admin/reservations/:id/status` | Promeni status |
| `DELETE` | `/api/admin/reservations/:id` | Obriši rezervaciju |
| `GET`    | `/api/admin/apartments` | Lista apartmana |
| `PATCH`  | `/api/admin/apartments/:id` | Izmeni cenu/opis |

---

## 📋 POST /api/reservations — Body

```json
{
  "apartment_id": "sunce",
  "check_in": "2025-07-01",
  "check_out": "2025-07-05",
  "guests": 3,
  "first_name": "Marko",
  "last_name": "Petrović",
  "email": "marko@email.com",
  "phone": "+381 64 123 4567",
  "special_requests": "Krevet za bebu"
}
```

### Odgovor (201)

```json
{
  "success": true,
  "ref_code": "ZS-K7MN2P",
  "message": "Rezervacija uspešno kreirana! Proverite email za potvrdu.",
  "data": {
    "ref_code": "ZS-K7MN2P",
    "apartment": "Apartman 1 — Sunce",
    "check_in": "2025-07-01",
    "check_out": "2025-07-05",
    "nights": 4,
    "guests": 3,
    "total_eur": 480.00
  }
}
```

---

## 🔧 Frontend integracija

Dodajte u `script.js` slanje forme:

```javascript
const form = document.getElementById('reservationForm');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = {
    apartment_id: document.getElementById('apartment').value,
    check_in:     document.getElementById('checkIn').value,
    check_out:    document.getElementById('checkOut').value,
    guests:       document.getElementById('guests').value,
    first_name:   document.getElementById('firstName').value,
    last_name:    document.getElementById('lastName').value,
    email:        document.getElementById('email').value,
    phone:        document.getElementById('phone').value,
    special_requests: document.getElementById('specialRequests').value,
  };
  const res = await fetch('/api/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.success) {
    showToast(`✓ Rezervacija kreirana! Ref: ${data.ref_code}`);
  } else {
    showToast(data.errors.join('\n'));
  }
});
```

---

## 🌍 Deploy (Render.com — besplatno)

1. Push kod na GitHub
2. Render → New Web Service → Connect repo
3. Build command: `npm install`
4. Start command: `node server.js`
5. Environment Variables: dodajte sve iz `.env`

---

## 🗄️ Supabase SQL Schema

Pokrenite u Supabase SQL Editoru:

```sql
-- (ceo sadržaj je u db/supabase.js, promenljiva SCHEMA_SQL)
```

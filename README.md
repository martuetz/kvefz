# EFZ-Prüfungsvorbereitung

Prüfungsvorbereitung für **Kaufleute EFZ** – Qualifikationsverfahren (QV).  
React + Express + Supabase PWA.

## Features

- 📝 Multiple-Choice-Quizze (250+ Fragen)
- ⏱️ Prüfungssimulationen mit Timer & Schweizer Note
- 🃏 Lernkarten mit Flip-Animation
- 📊 Fortschrittsverfolgung mit Charts & Heatmap
- 🌙 Dark/Light Mode
- 📱 PWA mit Offline-Support
- ⚙️ Admin-Panel für Fragen-CRUD
- 💳 Stripe-Premium (CHF 79 einmalig)

## Voraussetzungen

- Node.js 18+
- [Supabase](https://supabase.com) Projekt (Free Tier)
- (Optional) Stripe Account für Zahlungen

## Setup

### 1. Repository klonen & Abhängigkeiten installieren

```bash
cd client && npm install
cd ../server && npm install
```

### 2. Supabase-Projekt erstellen

1. Erstelle ein Projekt auf [supabase.com](https://supabase.com)
2. Gehe zu **SQL Editor** und führe `server/schema.sql` aus
3. Kopiere URL + Anon Key + Service Key

### 3. Umgebungsvariablen konfigurieren

```bash
cp .env.example .env
```

Trage deine Werte ein:
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
```

Erstelle AUCH eine `.env` in `client/`:
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 4. Datenbank mit Fragen füllen

```bash
cd server && npm run seed
```

### 5. Starten

Terminal 1 (Backend):
```bash
cd server && npm run dev
```

Terminal 2 (Frontend):
```bash
cd client && npm run dev
```

App öffnen: [http://localhost:5173](http://localhost:5173)

### 6. Admin-Nutzer

Nach der Registrierung, setze in Supabase → Table Editor → profiles:
```sql
UPDATE profiles SET role = 'admin' WHERE id = 'DEINE-USER-ID';
```

## Deployment

### Frontend (Vercel/Netlify)
- Build: `cd client && npm run build`
- Publish Dir: `client/dist`
- Env Vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

### Backend (Railway / Render)
- Start: `cd server && npm start`
- Env Vars: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `STRIPE_SECRET_KEY`

## Technologie-Stack

| Bereich | Technologie |
|---------|------------|
| Frontend | React 18, Vite, Chart.js |
| Backend | Express, Node.js |
| Datenbank | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Payment | Stripe |
| PWA | Workbox (vite-plugin-pwa) |

## Lizenz

Privat – Alle Rechte vorbehalten.

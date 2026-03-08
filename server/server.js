import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import questionsRouter from './routes/questions.js';
import sessionsRouter from './routes/sessions.js';
import progressRouter from './routes/progress.js';
import paymentRouter from './routes/payment.js';
import usersRouter from './routes/users.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// Check if Supabase is configured
const isSupabaseConfigured = process.env.SUPABASE_URL &&
    process.env.SUPABASE_URL !== 'https://placeholder.supabase.co' &&
    process.env.SUPABASE_SERVICE_KEY &&
    process.env.SUPABASE_SERVICE_KEY !== 'placeholder-key';

// Supabase admin client (service role) – only if configured
export const supabaseAdmin = isSupabaseConfigured
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
    : null;

// In-memory store for demo mode
export const demoStore = {
    questions: [],
    sessions: [],
    profiles: [
        { id: 'demo-user-001', name: 'Michael Uetz', email: 'michael@uetz.com', role: 'admin', is_premium: true, streak: 5, last_active: new Date().toISOString() },
        { id: 'demo-user-002', name: 'Anna Müller', email: 'anna@example.ch', role: 'user', is_premium: false, streak: 12, last_active: new Date().toISOString() },
    ],
    flashcard_decks: [],
};

// Load questions from JSON for demo mode
if (!isSupabaseConfigured) {
    try {
        const raw = readFileSync(join(__dirname, 'data', 'questions.json'), 'utf-8');
        demoStore.questions = JSON.parse(raw).map((q, i) => ({ ...q, id: `q-${i + 1}` }));
        console.log(`📦 Demo-Modus: ${demoStore.questions.length} Fragen aus JSON geladen`);
    } catch (e) {
        console.error('Fehler beim Laden der Fragen:', e.message);
    }
}

export const isDemo = !isSupabaseConfigured;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', mode: isDemo ? 'demo' : 'production', time: new Date().toISOString() });
});

// Routes
app.use('/api/questions', questionsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/progress', progressRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/users', usersRouter);

app.listen(PORT, () => {
    console.log(`✅ EFZ Server läuft auf Port ${PORT}`);
    if (isDemo) {
        console.log(`🎮 Demo-Modus aktiv (kein Supabase konfiguriert)`);
        console.log(`   Login: michael@uetz.com / admin`);
    }
});

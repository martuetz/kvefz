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

import { createClient as createTursoClient } from '@libsql/client';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// Database Configuration
export const db = createTursoClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

console.log('🔗 Turso Database verbunden');

// Supabase (legacy support if needed, but we'll prefer Turso)
const isSupabaseConfigured = process.env.SUPABASE_URL &&
    process.env.SUPABASE_URL !== 'https://placeholder.supabase.co';

export const supabaseAdmin = isSupabaseConfigured
    ? createSupabaseClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
    : null;

export const isDemo = false; // We are now in persistent DB mode with Turso

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

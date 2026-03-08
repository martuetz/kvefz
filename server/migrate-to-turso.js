import 'dotenv/config';
import { createClient } from '@libsql/client';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function migrate() {
    console.log('🚀 Starting migration to Turso...');

    // 1. Migrate Questions
    const questionsRaw = readFileSync(join(__dirname, 'data', 'questions.json'), 'utf-8');
    const questions = JSON.parse(questionsRaw);

    console.log(`📝 Inserting ${questions.length} questions...`);

    // We insert in batches to be safe and efficient
    const BATCH_SIZE = 50;
    for (let i = 0; i < questions.length; i += BATCH_SIZE) {
        const batch = questions.slice(i, i + BATCH_SIZE);
        const statements = batch.map((q, index) => {
            const id = q.id || `q-${i + index + 1}`;
            return {
                sql: `INSERT INTO questions (id, text, type, options, correct_answer, explanation, topic, subtopic, difficulty) 
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                      ON CONFLICT(id) DO UPDATE SET
                      text=excluded.text, options=excluded.options, correct_answer=excluded.correct_answer, 
                      explanation=excluded.explanation, topic=excluded.topic, subtopic=excluded.subtopic, 
                      difficulty=excluded.difficulty`,
                args: [
                    id,
                    q.text,
                    q.type || 'mcq',
                    JSON.stringify(q.options || []),
                    q.correct_answer,
                    q.explanation || '',
                    q.topic,
                    q.subtopic || '',
                    q.difficulty || 'mittel'
                ]
            };
        });

        try {
            await client.batch(statements, "write");
            console.log(`✅ Batch ${i + 1}-${Math.min(i + BATCH_SIZE, questions.length)} done`);
        } catch (err) {
            console.error(`❌ Error in batch ${i}:`, err.message);
        }
    }

    // 2. Migrate Flashcards (from seed.js data)
    const decks = [
        {
            topic: 'Rechnungswesen',
            title: 'Grundbegriffe Rechnungswesen',
            cards: [
                { front: 'Was ist die Bilanz?', back: 'Eine Gegenüberstellung von Vermögen (Aktiven) und Schulden + Eigenkapital (Passiven) zu einem bestimmten Zeitpunkt.' },
                { front: 'Aktiven', back: 'Vermögenswerte eines Unternehmens: Umweltvermögen (Kasse, Bank, Debitoren, Vorräte) und Anlagevermögen (Maschinen, Immobilien).' },
                { front: 'Passiven', back: 'Herkunft des Kapitals: Fremdkapital (Kreditoren, Bankschulden) und Eigenkapital (Aktienkapital, Gewinnreserven).' },
                { front: 'Doppelte Buchhaltung', back: 'Jede Buchung hat eine Soll- und eine Habenseite. Soll = Mittelverwendung, Haben = Mittelherkunft.' },
                { front: 'Abschreibung', back: 'Planmässige Wertminderung von Anlagevermögen über die Nutzungsdauer.' },
                { front: 'Liquidität', back: 'Fähigkeit, fällige Zahlungen fristgerecht zu leisten. Liquiditätsgrade: L1 (Cash), L2 (+Forderungen), L3 (+Vorräte).' },
            ]
        },
        {
            topic: 'Recht',
            title: 'Rechtliche Grundlagen',
            cards: [
                { front: 'OR (Obligationenrecht)', back: 'Regelt Verträge, Kaufverträge, Arbeitsverträge, Gesellschaftsrecht in der Schweiz.' },
                { front: 'Kaufvertrag', back: 'Pflichten: Verkäufer liefert Ware, Käufer bezahlt Preis. Geregelt in OR Art. 184 ff.' },
                { front: 'Mängelrüge', back: 'Bei fehlerhafter Ware: sofortige Prüfung + unverzügliche Rüge. Wahlrecht: Wandlung, Minderung, Ersatzlieferung.' },
                { front: 'Arbeitsvertrag', back: 'OR Art. 319 ff. Probezeit max. 3 Monate, Kündigung während Probezeit: 7 Tage.' },
            ]
        },
        {
            topic: 'Betriebswirtschaft',
            title: 'BWL Grundlagen',
            cards: [
                { front: 'SWOT-Analyse', back: 'Strengths, Weaknesses, Opportunities, Threats – strategisches Planungsinstrument.' },
                { front: 'Break-Even-Point', back: 'Gewinnschwelle: Fixkosten / (Verkaufspreis - variable Kosten pro Stück).' },
                { front: 'Unternehmensformen CH', back: 'Einzelfirma, GmbH (CHF 20\'000), AG (CHF 100\'000), Kollektivgesellschaft.' },
            ]
        },
        {
            topic: 'Marketing',
            title: 'Marketing Grundbegriffe',
            cards: [
                { front: '4P des Marketing', back: 'Product, Price, Place, Promotion.' },
                { front: 'USP', back: 'Unique Selling Proposition – Alleinstellungsmerkmal.' },
                { front: 'AIDA-Modell', back: 'Attention → Interest → Desire → Action.' },
            ]
        },
        {
            topic: 'Logistik',
            title: 'Logistik & Supply Chain',
            cards: [
                { front: 'Just-in-Time', back: 'Materialien werden genau dann geliefert, wenn sie benötigt werden.' },
                { front: 'ABC-Analyse', back: 'A (80% Wert, 20% Menge), B (15%), C (5% Wert, 70% Menge).' },
                { front: 'Incoterms', back: 'Internationale Lieferbedingungen: EXW, FOB, CIF, DDP.' },
            ]
        },
    ];

    console.log(`🃏 Inserting ${decks.length} flashcard decks...`);
    for (const deck of decks) {
        const id = `deck-${deck.topic.toLowerCase().replace(/\s+/g, '-')}`;
        try {
            await client.execute({
                sql: `INSERT INTO flashcard_decks (id, topic, title, cards) VALUES (?, ?, ?, ?)
                      ON CONFLICT(id) DO UPDATE SET topic=excluded.topic, title=excluded.title, cards=excluded.cards`,
                args: [id, deck.topic, deck.title, JSON.stringify(deck.cards)]
            });
            console.log(`✅ Deck ${deck.title} done`);
        } catch (err) {
            console.error(`❌ Error inserting deck ${deck.title}:`, err.message);
        }
    }

    // 3. Insert Demo Users
    const users = [
        { id: 'demo-user-001', name: 'Michael Uetz', email: 'michael@uetz.com', role: 'admin', is_premium: 1 },
        { id: 'demo-user-002', name: 'Anna Müller', email: 'anna@example.ch', role: 'user', is_premium: 0 },
    ];

    console.log(`👤 Inserting ${users.length} demo users...`);
    for (const user of users) {
        try {
            await client.execute({
                sql: `INSERT INTO profiles (id, name, email, role, is_premium) VALUES (?, ?, ?, ?, ?)
                      ON CONFLICT(id) DO UPDATE SET name=excluded.name, email=excluded.email, role=excluded.role, is_premium=excluded.is_premium`,
                args: [user.id, user.name, user.email, user.role, user.is_premium]
            });
            console.log(`✅ User ${user.name} done`);
        } catch (err) {
            console.error(`❌ Error inserting user ${user.name}:`, err.message);
        }
    }

    console.log('\n🎉 Migration finished successfully!');
}

migrate().catch(console.error);

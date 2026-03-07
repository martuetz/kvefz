import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function seed() {
    console.log('🌱 Starte Seeding...');

    // Seed questions
    const questionsRaw = readFileSync(join(__dirname, 'data', 'questions.json'), 'utf-8');
    const questions = JSON.parse(questionsRaw);

    console.log(`📝 ${questions.length} Fragen werden eingefügt...`);
    const { error: qErr } = await supabase.from('questions').upsert(questions, { onConflict: 'text' });
    if (qErr) {
        // Try inserting in batches if upsert fails
        console.log('Versuche Batch-Insert...');
        for (let i = 0; i < questions.length; i += 50) {
            const batch = questions.slice(i, i + 50);
            const { error } = await supabase.from('questions').insert(batch);
            if (error) console.error(`Batch ${i}-${i + 50} Fehler:`, error.message);
            else console.log(`✅ Batch ${i + 1}-${Math.min(i + 50, questions.length)} eingefügt`);
        }
    } else {
        console.log('✅ Alle Fragen eingefügt');
    }

    // Seed flashcard decks
    const decks = [
        {
            topic: 'Rechnungswesen',
            title: 'Grundbegriffe Rechnungswesen',
            cards: [
                { front: 'Was ist die Bilanz?', back: 'Eine Gegenüberstellung von Vermögen (Aktiven) und Schulden + Eigenkapital (Passiven) zu einem bestimmten Zeitpunkt.' },
                { front: 'Aktiven', back: 'Vermögenswerte eines Unternehmens: Umlaufvermögen (Kasse, Bank, Debitoren, Vorräte) und Anlagevermögen (Maschinen, Immobilien).' },
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

    console.log(`🃏 ${decks.length} Lernkarten-Decks werden eingefügt...`);
    const { error: fErr } = await supabase.from('flashcard_decks').insert(decks);
    if (fErr) console.error('Flashcard Fehler:', fErr.message);
    else console.log('✅ Lernkarten-Decks eingefügt');

    console.log('\n🎉 Seeding abgeschlossen!');
    console.log(`   📝 ${questions.length} Fragen`);
    console.log(`   🃏 ${decks.length} Lernkarten-Decks`);
}

seed().catch(console.error);

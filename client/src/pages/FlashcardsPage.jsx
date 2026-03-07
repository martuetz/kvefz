import { useState, useEffect } from 'react';
import { supabase } from '../api/supabase';

const DEMO_DECKS = [
    {
        topic: 'Rechnungswesen',
        title: 'Grundbegriffe Rechnungswesen',
        cards: [
            { front: 'Was ist die Bilanz?', back: 'Eine Gegenüberstellung von Vermögen (Aktiven) und Schulden + Eigenkapital (Passiven) zu einem bestimmten Zeitpunkt.' },
            { front: 'Aktiven', back: 'Vermögenswerte eines Unternehmens: Umlaufvermögen (Kasse, Bank, Debitoren, Vorräte) und Anlagevermögen (Maschinen, Immobilien).' },
            { front: 'Passiven', back: 'Herkunft des Kapitals: Fremdkapital (Kreditoren, Bankschulden) und Eigenkapital (Aktienkapital, Gewinnreserven).' },
            { front: 'Erfolgsrechnung (GuV)', back: 'Gegenüberstellung von Ertrag und Aufwand einer Periode. Ertrag - Aufwand = Gewinn oder Verlust.' },
            { front: 'Doppelte Buchhaltung', back: 'Jede Buchung hat eine Soll- und eine Habenseite. Soll = Mittelverwendung, Haben = Mittelherkunft.' },
            { front: 'Abschreibung', back: 'Planmässige Wertminderung von Anlagevermögen über die Nutzungsdauer. Direkte oder indirekte Methode.' },
            { front: 'Debitor vs. Kreditor', back: 'Debitor = Kunde, dem wir Ware auf Rechnung verkauft haben (Forderung). Kreditor = Lieferant, dem wir noch Geld schulden (Verbindlichkeit).' },
            { front: 'Liquidität', back: 'Fähigkeit, fällige Zahlungen fristgerecht zu leisten. Liquiditätsgrade: L1 (Cash), L2 (+Forderungen), L3 (+Vorräte).' },
        ]
    },
    {
        topic: 'Recht',
        title: 'Rechtliche Grundlagen',
        cards: [
            { front: 'OR (Obligationenrecht)', back: 'Regelt Verträge, Kaufverträge, Arbeitsverträge, Gesellschaftsrecht in der Schweiz. Teil des ZGB.' },
            { front: 'Vertragsfähigkeit', back: 'Voraussetzungen: Handlungsfähig (18+, urteilsfähig), übereinstimmende Willensäusserung, erlaubter Inhalt.' },
            { front: 'Kaufvertrag', back: 'Pflichten: Verkäufer liefert Ware, Käufer bezahlt Preis. Geregelt in OR Art. 184 ff.' },
            { front: 'Mängelrüge', back: 'Bei fehlerhafter Ware: sofortige Prüfung + unverzügliche Rüge nötig. Wahlrecht: Wandlung, Minderung, Ersatzlieferung.' },
            { front: 'Verjährung', back: 'Bewegliche Sachen: 2 Jahre. Allgemeine Forderungen: 10 Jahre. Die Frist beginnt bei Fälligkeit.' },
            { front: 'Arbeitsvertrag', back: 'OR Art. 319 ff. Pflichten: Arbeitnehmer leistet Arbeit, Arbeitgeber zahlt Lohn. Probezeit max. 3 Monate.' },
        ]
    },
    {
        topic: 'Betriebswirtschaft',
        title: 'BWL Grundlagen',
        cards: [
            { front: 'Stakeholder', back: 'Alle Anspruchsgruppen eines Unternehmens: Eigentümer, Mitarbeiter, Kunden, Lieferanten, Staat, Gesellschaft.' },
            { front: 'SWOT-Analyse', back: 'Strengths (Stärken), Weaknesses (Schwächen), Opportunities (Chancen), Threats (Risiken) – strategisches Planungsinstrument.' },
            { front: 'Break-Even-Point', back: 'Gewinnschwelle: Umsatz = Gesamtkosten. Formel: Fixkosten / (Verkaufspreis - variable Stückkosten).' },
            { front: 'Produktlebenszyklus', back: 'Phasen: Einführung → Wachstum → Reife → Sättigung → Rückgang. Jede Phase erfordert andere Strategien.' },
            { front: 'Unternehmensformen CH', back: 'Einzelfirma, GmbH (CHF 20\'000), AG (CHF 100\'000), Kollektivgesellschaft, Genossenschaft.' },
        ]
    },
    {
        topic: 'Marketing',
        title: 'Marketing Mix',
        cards: [
            { front: '4P des Marketing', back: 'Product (Produkt), Price (Preis), Place (Distribution), Promotion (Kommunikation) – die vier Marketinginstrumente.' },
            { front: 'USP', back: 'Unique Selling Proposition – das Alleinstellungsmerkmal, das ein Produkt von der Konkurrenz abhebt.' },
            { front: 'Marktsegmentierung', back: 'Aufteilung des Gesamtmarktes in homogene Teilmärkte nach: Geografie, Demografie, Psychografie, Verhalten.' },
            { front: 'AIDA-Modell', back: 'Werbewirkungsmodell: Attention (Aufmerksamkeit) → Interest (Interesse) → Desire (Wunsch) → Action (Handlung).' },
            { front: 'Preiselastizität', back: 'Misst die Reaktion der Nachfrage auf Preisänderungen. Elastisch: >1, Unelastisch: <1.' },
        ]
    },
    {
        topic: 'Logistik',
        title: 'Logistik & Supply Chain',
        cards: [
            { front: 'Just-in-Time (JIT)', back: 'Materialien werden genau dann geliefert, wenn sie benötigt werden. Minimiert Lagerkosten, erfordert zuverlässige Lieferanten.' },
            { front: 'ABC-Analyse', back: 'Einteilung von Gütern nach Wertanteil: A (70-80% Wert, 10-20% Menge), B (15-20% Wert), C (5-10% Wert, 60-70% Menge).' },
            { front: 'Incoterms', back: 'Internationale Lieferbedingungen: EXW, FOB, CIF, DDP etc. Regeln wer Kosten und Risiken des Transports trägt.' },
            { front: 'Lagerumschlagshäufigkeit', back: 'Formel: Wareneinsatz / ∅ Lagerbestand. Zeigt wie oft das Lager pro Jahr umgeschlagen wird.' },
        ]
    },
];

export default function FlashcardsPage() {
    const [decks, setDecks] = useState(DEMO_DECKS);
    const [selectedDeck, setSelectedDeck] = useState(null);
    const [cardIdx, setCardIdx] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [known, setKnown] = useState(new Set());

    useEffect(() => {
        // Try to load from Supabase
        supabase.from('flashcard_decks').select('*').then(({ data }) => {
            if (data?.length > 0) setDecks(data);
        });
    }, []);

    // Deck selection
    if (!selectedDeck) {
        return (
            <div className="page">
                <div className="container">
                    <div className="page-header animate-fade-in">
                        <h1>🃏 Lernkarten</h1>
                        <p>Wähle ein Thema und lerne mit Karteikarten</p>
                    </div>

                    <div className="grid-3">
                        {decks.map((deck, i) => (
                            <div key={i} className="card card-glow animate-slide-up" style={{ cursor: 'pointer', animationDelay: `${i * 0.1}s` }}
                                onClick={() => { setSelectedDeck(deck); setCardIdx(0); setFlipped(false); setKnown(new Set()); }}>
                                <div style={{ fontSize: '2rem', marginBottom: 'var(--space-3)' }}>
                                    {deck.topic === 'Rechnungswesen' ? '📊' :
                                        deck.topic === 'Recht' ? '⚖️' :
                                            deck.topic === 'Betriebswirtschaft' ? '🏢' :
                                                deck.topic === 'Marketing' ? '📢' :
                                                    deck.topic === 'Logistik' ? '🚛' : '📚'}
                                </div>
                                <h3 style={{ marginBottom: 'var(--space-2)' }}>{deck.title}</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                                    {deck.cards.length} Karten • {deck.topic}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Card view
    const card = selectedDeck.cards[cardIdx];
    const progress = ((cardIdx + 1) / selectedDeck.cards.length) * 100;

    return (
        <div className="page">
            <div className="container" style={{ maxWidth: 600 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                    <button className="btn btn-secondary" onClick={() => setSelectedDeck(null)}>
                        ← Zurück
                    </button>
                    <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                        {cardIdx + 1} / {selectedDeck.cards.length} • {known.size} gewusst
                    </span>
                </div>

                <div className="progress-bar" style={{ marginBottom: 'var(--space-5)' }}>
                    <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                </div>

                {/* Flashcard */}
                <div className="flashcard-container" style={{ marginBottom: 'var(--space-5)' }}>
                    <div className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(!flipped)}>
                        <div className="flashcard-face flashcard-front">
                            <div>
                                <div style={{ fontSize: 'var(--font-size-sm)', opacity: 0.7, marginBottom: 'var(--space-3)' }}>
                                    Klicke zum Umdrehen
                                </div>
                                {card.front}
                            </div>
                        </div>
                        <div className="flashcard-face flashcard-back">
                            <div>{card.back}</div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
                    <button className="btn btn-secondary btn-lg" onClick={() => {
                        setFlipped(false);
                        setCardIdx(Math.max(0, cardIdx - 1));
                    }} disabled={cardIdx === 0}>← Zurück</button>

                    {flipped && (
                        <>
                            <button className="btn btn-lg" style={{
                                background: 'rgba(231,111,81,0.15)', color: 'var(--color-danger)',
                                border: 'none', cursor: 'pointer',
                            }} onClick={() => {
                                known.delete(cardIdx);
                                setKnown(new Set(known));
                                setFlipped(false);
                                if (cardIdx < selectedDeck.cards.length - 1) setCardIdx(cardIdx + 1);
                            }}>
                                🔄 Nochmal
                            </button>
                            <button className="btn btn-success btn-lg" onClick={() => {
                                setKnown(new Set([...known, cardIdx]));
                                setFlipped(false);
                                if (cardIdx < selectedDeck.cards.length - 1) setCardIdx(cardIdx + 1);
                            }}>
                                ✅ Gewusst
                            </button>
                        </>
                    )}

                    {!flipped && (
                        <button className="btn btn-secondary btn-lg" onClick={() => {
                            setFlipped(false);
                            if (cardIdx < selectedDeck.cards.length - 1) setCardIdx(cardIdx + 1);
                        }} disabled={cardIdx === selectedDeck.cards.length - 1}>Weiter →</button>
                    )}
                </div>

                {/* Completion */}
                {cardIdx === selectedDeck.cards.length - 1 && known.size > 0 && (
                    <div className="card" style={{ textAlign: 'center', marginTop: 'var(--space-5)' }}>
                        <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>🎉</div>
                        <p style={{ fontWeight: 600 }}>
                            {known.size}/{selectedDeck.cards.length} Karten gewusst!
                        </p>
                        <button className="btn btn-primary" style={{ marginTop: 'var(--space-3)' }}
                            onClick={() => { setCardIdx(0); setFlipped(false); setKnown(new Set()); }}>
                            Nochmal üben
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

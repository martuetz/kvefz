export default function TipsPage() {
    const tips = [
        {
            icon: '⏱️',
            title: 'Zeitmanagement',
            content: [
                'Lies zuerst ALLE Fragen durch und markiere einfache Fragen.',
                'Beantworte zuerst die Fragen, die du sicher weisst.',
                'Plane ca. 1-2 Minuten pro Multiple-Choice-Frage ein.',
                'Behalte die Uhr im Auge – nutze die letzten 10 Minuten zum Überprüfen.',
            ],
        },
        {
            icon: '🧠',
            title: 'Lernstrategie',
            content: [
                'Nutze das Spaced-Repetition-Prinzip: Wiederhole schwierige Themen in zunehmenden Abständen.',
                'Lerne in kurzen Einheiten (25 Min. lernen, 5 Min. Pause – Pomodoro).',
                'Erkläre Konzepte laut einer anderen Person oder dir selbst.',
                'Erstelle eigene Zusammenfassungen zu jedem Thema.',
            ],
        },
        {
            icon: '⚠️',
            title: 'Häufige Fehler',
            content: [
                'Nicht genau lesen: Achte auf Wörter wie "NICHT", "IMMER", "NIE".',
                'Voreilige Antworten: Lies alle Optionen, bevor du antwortest.',
                'Zu viel Zeit bei einer Frage: Markiere und komme später zurück.',
                'Rechnungswesen: Vergiss nie die doppelte Buchführung – Soll und Haben!',
            ],
        },
        {
            icon: '📊',
            title: 'Rechnungswesen-Tipps',
            content: [
                'Merke: Aktiven = Soll-Konto, Passiven = Haben-Konto',
                'Erfolgsrechnung: Aufwand im Soll, Ertrag im Haben',
                'Bilanzgleichung: Aktiven = Passiven (FK + EK)',
                'Kenne die wichtigsten Kontengruppen auswendig (Umlauf-/Anlagevermögen, FK, EK)',
                'Übe mit realen Geschäftsfällen und schreibe die Buchungssätze auf.',
            ],
        },
        {
            icon: '⚖️',
            title: 'Recht-Tipps',
            content: [
                'Lerne die OR-Artikelnummern der wichtigsten Vertragsarten.',
                'Kaufvertrag: Merke die Käufer- und Verkäuferpflichten.',
                'Mängelrüge: Prüfen → Rügen → Fordern (Wandlung/Minderung/Ersatz).',
                'Verjährungsfristen: 2 Jahre (bew. Sachen), 5 Jahre (Miete), 10 Jahre (allgemein).',
            ],
        },
        {
            icon: '🎯',
            title: 'Am Prüfungstag',
            content: [
                'Genug schlafen in der Nacht vor der Prüfung.',
                'Frühstück nicht vergessen – dein Hirn braucht Energie!',
                'Materialien am Vorabend vorbereiten (Taschenrechner, Stifte, Ausweis).',
                'Komme 15 Minuten früher an, um dich zu beruhigen.',
                'Positive Einstellung: Du hast dich vorbereitet!',
            ],
        },
    ];

    const resources = [
        { title: 'Offizieller Bildungsplan Kaufleute EFZ', url: 'https://www.skkab.ch', type: 'Link' },
        { title: 'Prüfungsbeispiele IGKG', url: 'https://www.igkg.ch', type: 'Link' },
        { title: 'Lernplattform Konvink', url: 'https://www.konvink.ch', type: 'Plattform' },
    ];

    return (
        <div className="page">
            <div className="container">
                <div className="page-header animate-fade-in">
                    <h1>💡 Prüfungstipps</h1>
                    <p>Strategien und Tipps für dein QV – von erfahrenen Prüflingen</p>
                </div>

                <div className="grid-2" style={{ marginBottom: 'var(--space-6)' }}>
                    {tips.map((tip, i) => (
                        <div key={i} className="card animate-slide-up" style={{ animationDelay: `${i * 0.08}s` }}>
                            <div style={{ fontSize: '2rem', marginBottom: 'var(--space-3)' }}>{tip.icon}</div>
                            <h3 style={{ marginBottom: 'var(--space-3)' }}>{tip.title}</h3>
                            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                {tip.content.map((item, j) => (
                                    <li key={j} style={{
                                        padding: 'var(--space-2) var(--space-3)',
                                        background: 'var(--bg-input)',
                                        borderRadius: 'var(--border-radius-sm)',
                                        fontSize: 'var(--font-size-sm)',
                                        lineHeight: 1.5,
                                    }}>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Resources */}
                <div className="card animate-slide-up" style={{ animationDelay: '0.4s' }}>
                    <h3 style={{ marginBottom: 'var(--space-4)' }}>📎 Weiterführende Ressourcen</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                        {resources.map((r, i) => (
                            <a key={i} href={r.url} target="_blank" rel="noreferrer"
                                style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: 'var(--space-3) var(--space-4)',
                                    background: 'var(--bg-input)', borderRadius: 'var(--border-radius-sm)',
                                    textDecoration: 'none', color: 'var(--text-primary)',
                                    transition: 'background 0.2s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--border-color)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-input)'}>
                                <span style={{ fontWeight: 500 }}>{r.title}</span>
                                <span className="badge badge-primary">{r.type} ↗</span>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

const TOPICS = [
    {
        id: 'Rechnungswesen',
        icon: '📊',
        title: 'Rechnungswesen',
        desc: 'Bilanz, Erfolgsrechnung, Buchhaltung, Abschreibungen, Kontenrahmen',
        subtopics: ['Bilanzanalyse', 'Erfolgsrechnung', 'Buchungssätze', 'Abschreibungen', 'Mehrwertsteuer'],
        area: 'Schulisches QV',
    },
    {
        id: 'Recht',
        icon: '⚖️',
        title: 'Recht & Staat',
        desc: 'Obligationenrecht, Kaufvertrag, Arbeitsrecht, Staatsrecht, Betreibung',
        subtopics: ['Vertragsrecht', 'Arbeitsrecht', 'Betreibung & Konkurs', 'Gesellschaftsrecht'],
        area: 'Schulisches QV',
    },
    {
        id: 'Betriebswirtschaft',
        icon: '🏢',
        title: 'Betriebswirtschaft',
        desc: 'Unternehmensführung, Organisation, Personalwesen, Strategie',
        subtopics: ['Unternehmensformen', 'Organisation', 'Personalwesen', 'Strategie', 'Finanzierung'],
        area: 'Schulisches QV',
    },
    {
        id: 'Marketing',
        icon: '📢',
        title: 'Marketing',
        desc: 'Marketing-Mix, Marktforschung, Kundenkommunikation, Werbung',
        subtopics: ['Marketing-Mix (4P)', 'Marktforschung', 'Preispolitik', 'Kommunikation'],
        area: 'Praktische Arbeit (VPA)',
    },
    {
        id: 'Logistik',
        icon: '🚛',
        title: 'Logistik & Supply Chain',
        desc: 'Beschaffung, Lagerhaltung, Transport, Materialwirtschaft',
        subtopics: ['Beschaffung', 'Lagerhaltung', 'Transport', 'Materialwirtschaft'],
        area: 'Praktische Arbeit (VPA)',
    },
    {
        id: 'Kaufmannswissen',
        icon: '📚',
        title: 'Kaufmännisches Wissen',
        desc: 'Kommunikation, Korrespondenz, Büroorganisation, IT-Grundlagen',
        subtopics: ['Geschäftskorrespondenz', 'Büroorganisation', 'Informationsmanagement', 'Volkswirtschaft'],
        area: 'Schulisches QV',
    },
];

export default function TopicsPage() {
    const [stats, setStats] = useState(null);

    useEffect(() => {
        api.getProgress().then(setStats).catch(() => { });
    }, []);

    const getMastery = (topicId) => {
        if (!stats?.topicStats) return null;
        return stats.topicStats.find(t => t.topic === topicId);
    };

    return (
        <div className="page">
            <div className="container">
                <div className="page-header animate-fade-in">
                    <h1>📖 Themenübersicht</h1>
                    <p>Basierend auf dem offiziellen EFZ Qualifikationsverfahren (QV)</p>
                </div>

                {/* QV Structure info */}
                <div className="card" style={{ marginBottom: 'var(--space-6)', borderLeft: '4px solid var(--color-primary)' }}>
                    <h3 style={{ marginBottom: 'var(--space-2)' }}>🎓 Aufbau Qualifikationsverfahren</h3>
                    <div className="grid-2" style={{ gap: 'var(--space-4)' }}>
                        <div>
                            <strong>Schulisches QV</strong>
                            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                                Fallstudien, Berechnungen (Bilanz, GuV), schriftliche Prüfungen
                            </p>
                        </div>
                        <div>
                            <strong>Vorgegebene Praktische Arbeit (VPA)</strong>
                            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                                Praxisszenarien, Kundenkontakt, Büroprozesse
                            </p>
                        </div>
                    </div>
                </div>

                {/* Topic cards */}
                <div className="grid-2">
                    {TOPICS.map((topic, i) => {
                        const mastery = getMastery(topic.id);
                        return (
                            <div key={topic.id} className="card card-glow animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--space-3)' }}>
                                    <div style={{ fontSize: '2rem' }}>{topic.icon}</div>
                                    <span className={`badge ${topic.area.includes('Praktische') ? 'badge-warning' : 'badge-primary'}`}>
                                        {topic.area}
                                    </span>
                                </div>

                                <h3 style={{ marginBottom: 'var(--space-2)' }}>{topic.title}</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-4)' }}>
                                    {topic.desc}
                                </p>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)', marginBottom: 'var(--space-4)' }}>
                                    {topic.subtopics.map(st => (
                                        <span key={st} style={{
                                            fontSize: 'var(--font-size-xs)', padding: '2px 8px',
                                            background: 'var(--bg-input)', borderRadius: 999, color: 'var(--text-secondary)',
                                        }}>{st}</span>
                                    ))}
                                </div>

                                {mastery && (
                                    <div style={{ marginBottom: 'var(--space-3)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-1)' }}>
                                            <span>Fortschritt</span>
                                            <span style={{ fontWeight: 600, color: mastery.percentage >= 70 ? 'var(--color-success)' : 'var(--text-primary)' }}>
                                                {mastery.percentage}%
                                            </span>
                                        </div>
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{ width: `${mastery.percentage}%` }}></div>
                                        </div>
                                    </div>
                                )}

                                <Link to={`/quiz?topic=${topic.id}`} className="btn btn-primary" style={{ width: '100%' }}>
                                    Quiz starten
                                </Link>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

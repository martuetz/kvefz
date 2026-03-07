import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function DashboardPage() {
    const { profile } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getProgress().then(setStats).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Guten Morgen';
        if (hour < 18) return 'Guten Nachmittag';
        return 'Guten Abend';
    };

    return (
        <div className="page">
            <div className="container">
                <div className="page-header animate-fade-in">
                    <h1>{greeting()}, <span className="gradient-text">{profile?.name || 'Lernende/r'}</span> 👋</h1>
                    <p>Bereit für die EFZ-Prüfung? Hier ist dein Überblick.</p>
                </div>

                {/* Stats Grid */}
                <div className="grid-4" style={{ marginBottom: 'var(--space-6)' }}>
                    <div className="card stat-card card-glow animate-slide-up">
                        <div className="stat-icon">📝</div>
                        <div className="stat-value">{loading ? '–' : stats?.totalSessions || 0}</div>
                        <div className="stat-label">Tests absolviert</div>
                    </div>
                    <div className="card stat-card card-glow animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        <div className="stat-icon">📊</div>
                        <div className="stat-value">{loading ? '–' : stats?.avgScore ? `${stats.avgScore}%` : '–'}</div>
                        <div className="stat-label">∅ Punktzahl</div>
                    </div>
                    <div className="card stat-card card-glow animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <div className="stat-icon">🎯</div>
                        <div className="stat-value">{loading ? '–' : stats?.avgGrade || '–'}</div>
                        <div className="stat-label">∅ Note</div>
                    </div>
                    <div className="card stat-card card-glow animate-slide-up" style={{ animationDelay: '0.3s' }}>
                        <div className="stat-icon"><span className="streak-fire">🔥</span></div>
                        <div className="stat-value">{loading ? '–' : stats?.streak || 0}</div>
                        <div className="stat-label">Tage Streak</div>
                    </div>
                </div>

                {/* Quick Actions */}
                <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
                    Jetzt üben
                </h2>
                <div className="grid-3" style={{ marginBottom: 'var(--space-6)' }}>
                    <Link to="/quiz" className="card card-glow" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-3)' }}>🧠</div>
                        <h3 style={{ marginBottom: 'var(--space-2)' }}>Quiz starten</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                            Wähle ein Thema und beantworte Multiple-Choice-Fragen
                        </p>
                    </Link>
                    <Link to="/exam" className="card card-glow" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-3)' }}>⏱️</div>
                        <h3 style={{ marginBottom: 'var(--space-2)' }}>Prüfungssimulation</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                            Simuliere eine echte QV-Prüfung mit Zeitlimit
                        </p>
                    </Link>
                    <Link to="/flashcards" className="card card-glow" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-3)' }}>🃏</div>
                        <h3 style={{ marginBottom: 'var(--space-2)' }}>Lernkarten</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                            Begriffe und Formeln mit Karteikarten lernen
                        </p>
                    </Link>
                </div>

                {/* Weak Areas */}
                {stats?.topicStats?.length > 0 && (
                    <>
                        <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
                            Fokus-Bereiche
                        </h2>
                        <div className="grid-3">
                            {stats.topicStats
                                .sort((a, b) => a.percentage - b.percentage)
                                .slice(0, 3)
                                .map(t => (
                                    <div key={t.topic} className="card" style={{ borderLeft: `4px solid ${t.percentage < 50 ? 'var(--color-danger)' : t.percentage < 75 ? 'var(--color-warning)' : 'var(--color-success)'}` }}>
                                        <h4 style={{ marginBottom: 'var(--space-2)' }}>{t.topic}</h4>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                                            <span className="badge badge-primary">{t.correct}/{t.total} richtig</span>
                                            <span style={{ fontWeight: 700, color: t.percentage < 50 ? 'var(--color-danger)' : 'var(--text-primary)' }}>
                                                {t.percentage}%
                                            </span>
                                        </div>
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{ width: `${t.percentage}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

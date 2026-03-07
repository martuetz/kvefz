import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function PremiumPage() {
    const { isPremium } = useAuth();
    const [loading, setLoading] = useState(false);

    async function handleCheckout() {
        setLoading(true);
        try {
            const { url } = await api.createCheckout();
            if (url) window.location.href = url;
        } catch (err) {
            alert(err.message);
        }
        setLoading(false);
    }

    if (isPremium) {
        return (
            <div className="page">
                <div className="container" style={{ maxWidth: 600 }}>
                    <div className="card animate-slide-up" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                        <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>⭐</div>
                        <h1 style={{ marginBottom: 'var(--space-3)' }}>Premium aktiv!</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Du hast vollen Zugang zu allen Fragen, Prüfungssimulationen und Lernkarten.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const features = [
        { free: '50 Übungsfragen', premium: '1000+ Übungsfragen' },
        { free: 'Basis-Quiz', premium: 'Unbegrenzte Quizze' },
        { free: '—', premium: 'Prüfungssimulationen' },
        { free: '—', premium: 'Alle Lernkarten-Decks' },
        { free: '—', premium: 'Detaillierte Statistiken' },
        { free: '—', premium: 'Kein Werbe-Banner' },
    ];

    return (
        <div className="page">
            <div className="container" style={{ maxWidth: 800 }}>
                <div className="page-header animate-fade-in" style={{ textAlign: 'center' }}>
                    <h1>🚀 Premium freischalten</h1>
                    <p>Maximale Vorbereitung für dein QV – einmalige Zahlung, kein Abo</p>
                </div>

                <div className="grid-2" style={{ marginBottom: 'var(--space-6)' }}>
                    {/* Free Plan */}
                    <div className="card animate-slide-up">
                        <div style={{ textAlign: 'center', marginBottom: 'var(--space-5)' }}>
                            <h3 style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>Gratis</h3>
                            <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800 }}>CHF 0</div>
                        </div>
                        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                            {features.map((f, i) => (
                                <li key={i} style={{
                                    padding: 'var(--space-2) var(--space-3)',
                                    fontSize: 'var(--font-size-sm)',
                                    color: f.free === '—' ? 'var(--text-muted)' : 'var(--text-primary)',
                                    background: 'var(--bg-input)',
                                    borderRadius: 'var(--border-radius-sm)',
                                }}>
                                    {f.free === '—' ? '✗' : '✓'} {f.free === '—' ? features[i].premium : f.free}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Premium Plan */}
                    <div className="card card-glow animate-slide-up" style={{
                        border: '2px solid var(--color-primary)',
                        position: 'relative',
                        animationDelay: '0.1s',
                    }}>
                        <div style={{
                            position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                            background: 'var(--color-primary)', color: 'white',
                            padding: '4px 16px', borderRadius: 999, fontSize: 'var(--font-size-xs)',
                            fontWeight: 700, textTransform: 'uppercase',
                        }}>
                            Empfohlen
                        </div>
                        <div style={{ textAlign: 'center', marginBottom: 'var(--space-5)' }}>
                            <h3 style={{ color: 'var(--color-primary)', marginBottom: 'var(--space-2)' }}>Premium</h3>
                            <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800 }}>
                                CHF 79
                                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', fontWeight: 400 }}> einmalig</span>
                            </div>
                        </div>
                        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
                            {features.map((f, i) => (
                                <li key={i} style={{
                                    padding: 'var(--space-2) var(--space-3)',
                                    fontSize: 'var(--font-size-sm)',
                                    color: 'var(--color-success)',
                                    fontWeight: 500,
                                    background: 'rgba(42,157,143,0.08)',
                                    borderRadius: 'var(--border-radius-sm)',
                                }}>
                                    ✓ {f.premium}
                                </li>
                            ))}
                        </ul>
                        <button className="btn btn-primary btn-lg" style={{ width: '100%' }}
                            onClick={handleCheckout} disabled={loading}>
                            {loading ? 'Wird geladen...' : 'Jetzt freischalten 💳'}
                        </button>
                    </div>
                </div>

                {/* Trust section */}
                <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                    <p>🔒 Sichere Zahlung via Stripe • 🇨🇭 Schweizer Datenschutz (DSG-konform) • Kein Abo, kein Risiko</p>
                </div>
            </div>
        </div>
    );
}

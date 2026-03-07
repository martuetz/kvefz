import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn, signInWithGoogle } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await signIn(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message === 'Invalid login credentials'
                ? 'Ungültige Anmeldedaten. Bitte überprüfe E-Mail und Passwort.'
                : err.message);
        }
        setLoading(false);
    }

    return (
        <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="card animate-slide-up" style={{ maxWidth: 440, width: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 'var(--space-3)' }}>📚</div>
                    <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800 }}>
                        Willkommen zurück
                    </h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: 'var(--space-2)' }}>
                        Melde dich an, um weiterzulernen
                    </p>
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(231,111,81,0.1)', color: 'var(--color-danger)',
                        padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--border-radius-sm)',
                        fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-4)',
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="input-group" style={{ marginBottom: 'var(--space-4)' }}>
                        <label htmlFor="email">E-Mail</label>
                        <input id="email" type="email" className="input" placeholder="deine@email.ch"
                            value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>

                    <div className="input-group" style={{ marginBottom: 'var(--space-5)' }}>
                        <label htmlFor="password">Passwort</label>
                        <input id="password" type="password" className="input" placeholder="••••••••"
                            value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg" disabled={loading}
                        style={{ width: '100%', marginBottom: 'var(--space-4)' }}>
                        {loading ? 'Wird angemeldet...' : 'Anmelden'}
                    </button>
                </form>

                <button className="btn btn-secondary btn-lg" onClick={signInWithGoogle}
                    style={{ width: '100%', marginBottom: 'var(--space-5)' }}>
                    🔑 Mit Google anmelden
                </button>

                <p style={{ textAlign: 'center', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                    Noch kein Konto? <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Registrieren</Link>
                </p>
            </div>
        </div>
    );
}

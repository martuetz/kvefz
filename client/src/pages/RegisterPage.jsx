import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const { signUp, signInWithGoogle } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        if (password.length < 6) {
            setError('Passwort muss mindestens 6 Zeichen lang sein.');
            return;
        }
        setLoading(true);
        try {
            await signUp(email, password, name);
            setSuccess(true);
        } catch (err) {
            setError(err.message);
        }
        setLoading(false);
    }

    if (success) {
        return (
            <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="card animate-slide-up" style={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 'var(--space-3)' }}>✅</div>
                    <h2>Registrierung erfolgreich!</h2>
                    <p style={{ color: 'var(--text-secondary)', margin: 'var(--space-4) 0' }}>
                        Bitte überprüfe deine E-Mail, um dein Konto zu bestätigen.
                    </p>
                    <Link to="/login" className="btn btn-primary btn-lg">Zur Anmeldung</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="card animate-slide-up" style={{ maxWidth: 440, width: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 'var(--space-3)' }}>🎓</div>
                    <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800 }}>
                        Konto erstellen
                    </h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: 'var(--space-2)' }}>
                        Starte jetzt mit deiner Prüfungsvorbereitung
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
                        <label htmlFor="name">Name</label>
                        <input id="name" type="text" className="input" placeholder="Dein Name"
                            value={name} onChange={e => setName(e.target.value)} required />
                    </div>

                    <div className="input-group" style={{ marginBottom: 'var(--space-4)' }}>
                        <label htmlFor="email">E-Mail</label>
                        <input id="email" type="email" className="input" placeholder="deine@email.ch"
                            value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>

                    <div className="input-group" style={{ marginBottom: 'var(--space-5)' }}>
                        <label htmlFor="password">Passwort</label>
                        <input id="password" type="password" className="input" placeholder="Min. 6 Zeichen"
                            value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg" disabled={loading}
                        style={{ width: '100%', marginBottom: 'var(--space-4)' }}>
                        {loading ? 'Wird erstellt...' : 'Registrieren'}
                    </button>
                </form>

                <button className="btn btn-secondary btn-lg" onClick={signInWithGoogle}
                    style={{ width: '100%', marginBottom: 'var(--space-5)' }}>
                    🔑 Mit Google registrieren
                </button>

                <p style={{ textAlign: 'center', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                    Bereits ein Konto? <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Anmelden</Link>
                </p>
            </div>
        </div>
    );
}

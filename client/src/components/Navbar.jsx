import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user, signOut, isAdmin } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const location = useLocation();

    const isActive = (path) => location.pathname === path ? 'active' : '';

    return (
        <nav className="navbar">
            <div className="container">
                <Link to="/dashboard" className="nav-brand">
                    📚 <span>KV</span> EFZ
                </Link>

                {user && (
                    <>
                        <ul className={`nav-links ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(false)}>
                            <li><Link to="/dashboard" className={isActive('/dashboard')}>Dashboard</Link></li>
                            <li><Link to="/quiz" className={isActive('/quiz')}>Quiz</Link></li>
                            <li><Link to="/exam" className={isActive('/exam')}>Prüfung</Link></li>
                            <li><Link to="/flashcards" className={isActive('/flashcards')}>Lernkarten</Link></li>
                            <li><Link to="/topics" className={isActive('/topics')}>Themen</Link></li>
                            <li><Link to="/progress" className={isActive('/progress')}>Fortschritt</Link></li>
                            <li><Link to="/tips" className={isActive('/tips')}>Tipps</Link></li>
                            {isAdmin && <li><Link to="/admin/questions" className={isActive('/admin/questions')}>Fragen</Link></li>}
                            {isAdmin && <li><Link to="/admin/users" className={isActive('/admin/users')}>User</Link></li>}
                            <li>
                                <button className="btn btn-outline" onClick={signOut} style={{ fontSize: '0.8rem' }}>
                                    Abmelden
                                </button>
                            </li>
                        </ul>

                        <button className="nav-hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menü">
                            <span></span><span></span><span></span>
                        </button>
                    </>
                )}

                {!user && (
                    <Link to="/login" className="btn btn-primary">Anmelden</Link>
                )}
            </div>
        </nav>
    );
}

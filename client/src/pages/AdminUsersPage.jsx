import { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [updating, setUpdating] = useState(null);

    const [creating, setCreating] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user', is_premium: false });

    useEffect(() => { loadUsers(); }, []);

    async function loadUsers() {
        setLoading(true);
        try {
            const data = await api.getUsers();
            setUsers(data.users || []);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    }

    async function toggleRole(user) {
        const newRole = user.role === 'admin' ? 'user' : 'admin';
        setUpdating(user.id);
        try {
            await api.updateUser(user.id, { role: newRole });
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
        } catch (err) {
            alert('Fehler: ' + err.message);
        }
        setUpdating(null);
    }

    async function togglePremium(user) {
        const newPremium = !user.is_premium;
        setUpdating(user.id);
        try {
            await api.updateUser(user.id, { is_premium: newPremium });
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_premium: newPremium } : u));
        } catch (err) {
            alert('Fehler: ' + err.message);
        }
        setUpdating(null);
    }

    async function handleCreateUser(e) {
        e.preventDefault();
        setSubmitting(true);
        try {
            const data = await api.createUser(newUser);
            setUsers([{ ...data.user, id: data.user.id }, ...users]);
            setCreating(false);
            setNewUser({ name: '', email: '', password: '', role: 'user', is_premium: false });
        } catch (err) {
            alert('Fehler: ' + err.message);
        }
        setSubmitting(false);
    }

    async function handleDeleteUser(user) {
        if (!window.confirm(`Möchtest du den Benutzer "${user.name || user.email}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
            return;
        }
        setUpdating(user.id);
        try {
            await api.deleteUser(user.id);
            setUsers(prev => prev.filter(u => u.id !== user.id));
        } catch (err) {
            alert('Fehler beim Löschen: ' + err.message);
        }
        setUpdating(null);
    }

    const filtered = users.filter(u =>
        !search || u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="page">
            <div className="container">
                <div className="page-header animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1>👥 Benutzer verwalten</h1>
                        <p>{users.length} registrierte Benutzer</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => setCreating(true)}>
                        + NEUER BENUTZER
                    </button>
                </div>

                {creating && (
                    <div className="card" style={{ marginBottom: 'var(--space-5)', borderLeft: '4px solid var(--color-primary)' }}>
                        <h2 style={{ fontSize: '1.2rem', marginBottom: 'var(--space-3)' }}>Neuen Benutzer anlegen</h2>
                        <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                                <div style={{ flex: '1 1 200px' }}>
                                    <label className="label">Name</label>
                                    <input className="input" required value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
                                </div>
                                <div style={{ flex: '1 1 200px' }}>
                                    <label className="label">E-Mail</label>
                                    <input type="email" className="input" required value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
                                </div>
                                <div style={{ flex: '1 1 200px' }}>
                                    <label className="label">Passwort</label>
                                    <input type="password" className="input" required value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} minLength={6} placeholder="Mind. 6 Zeichen" />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
                                <div>
                                    <label className="label">Rolle</label>
                                    <select className="input" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} style={{ width: 'auto' }}>
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <label style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer', marginTop: '1.5rem' }}>
                                    <input type="checkbox" checked={newUser.is_premium} onChange={e => setNewUser({ ...newUser, is_premium: e.target.checked })} />
                                    <span>Premium Zugang</span>
                                </label>
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    {submitting ? 'Wird erstellt...' : 'Speichern'}
                                </button>
                                <button type="button" className="btn btn-outline" onClick={() => setCreating(false)}>
                                    Abbrechen
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Search */}
                <div className="card" style={{
                    display: 'flex', gap: 'var(--space-3)', alignItems: 'center',
                    marginBottom: 'var(--space-5)',
                }}>
                    <input
                        className="input"
                        placeholder="Benutzer suchen..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ maxWidth: 320 }}
                    />
                    <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                        {filtered.length} von {users.length} angezeigt
                    </span>
                </div>

                {/* Users Table */}
                {loading ? (
                    [1, 2, 3].map(i => <div key={i} className="card skeleton" style={{ height: 60, marginBottom: 'var(--space-3)' }}></div>)
                ) : filtered.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-muted)' }}>
                        Keine Benutzer gefunden.
                    </div>
                ) : (
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{
                                    background: 'var(--color-primary)',
                                    color: 'var(--text-inverse)',
                                }}>
                                    <th style={thStyle}>Name</th>
                                    <th style={thStyle}>E-Mail</th>
                                    <th style={thStyle}>Rolle</th>
                                    <th style={thStyle}>Premium</th>
                                    <th style={thStyle}>Streak</th>
                                    <th style={thStyle}>Aktionen</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((user, i) => (
                                    <tr key={user.id} style={{
                                        background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)',
                                        transition: 'background var(--transition-fast)',
                                    }}>
                                        <td style={tdStyle}>
                                            <span style={{ fontWeight: 600 }}>{user.name || '—'}</span>
                                        </td>
                                        <td style={tdStyle}>
                                            <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                                                {user.email || '—'}
                                            </span>
                                        </td>
                                        <td style={tdStyle}>
                                            <span className={`badge ${user.role === 'admin' ? 'badge-primary' : 'badge-success'}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td style={tdStyle}>
                                            <span className={`badge ${user.is_premium ? 'badge-warning' : 'badge-danger'}`}>
                                                {user.is_premium ? '⭐ Premium' : 'Free'}
                                            </span>
                                        </td>
                                        <td style={tdStyle}>
                                            <span style={{ fontWeight: 600 }}>🔥 {user.streak || 0}</span>
                                        </td>
                                        <td style={tdStyle}>
                                            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                                <button
                                                    className="btn btn-secondary"
                                                    style={{ fontSize: 'var(--font-size-xs)', padding: '6px 14px' }}
                                                    onClick={() => toggleRole(user)}
                                                    disabled={updating === user.id}
                                                >
                                                    {user.role === 'admin' ? '↓ User' : '↑ Admin'}
                                                </button>
                                                <button
                                                    className="btn btn-secondary"
                                                    style={{ fontSize: 'var(--font-size-xs)', padding: '6px 14px' }}
                                                    onClick={() => togglePremium(user)}
                                                    disabled={updating === user.id}
                                                >
                                                    {user.is_premium ? '✕ Free' : '⭐ Premium'}
                                                </button>
                                                <button
                                                    className="btn btn-outline"
                                                    style={{ fontSize: 'var(--font-size-xs)', padding: '6px 14px', borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
                                                    onClick={() => handleDeleteUser(user)}
                                                    disabled={updating === user.id}
                                                    title="Benutzer löschen"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

const thStyle = {
    fontFamily: 'var(--font-body)',
    fontWeight: 700,
    fontSize: 'var(--font-size-sm)',
    padding: '12px 16px',
    textAlign: 'left',
};

const tdStyle = {
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--font-size-sm)',
    padding: '12px 16px',
    borderBottom: '1px solid var(--border-color)',
};

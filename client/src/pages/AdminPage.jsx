import { useState, useEffect } from 'react';
import { api } from '../api/client';

const TOPICS = ['Rechnungswesen', 'Recht', 'Betriebswirtschaft', 'Marketing', 'Logistik', 'Kaufmannswissen'];
const TYPES = ['mcq', 'truefalse', 'fillblank'];
const DIFFICULTIES = ['leicht', 'mittel', 'schwer'];

const emptyQuestion = {
    text: '', type: 'mcq', options: ['', '', '', ''],
    correct_answer: '', explanation: '', topic: 'Rechnungswesen',
    subtopic: '', difficulty: 'mittel',
};

export default function AdminPage() {
    const [questions, setQuestions] = useState([]);
    const [total, setTotal] = useState(0);
    const [filter, setFilter] = useState({ topic: '', type: '', search: '' });
    const [editing, setEditing] = useState(null); // null or question object
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [page, setPage] = useState(0);
    const LIMIT = 20;

    useEffect(() => { loadQuestions(); }, [filter, page]);

    async function loadQuestions() {
        setLoading(true);
        try {
            const params = { limit: LIMIT, offset: page * LIMIT };
            if (filter.topic) params.topic = filter.topic;
            if (filter.type) params.type = filter.type;
            const data = await api.getQuestions(params);
            setQuestions(data.questions || []);
            setTotal(data.total || 0);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    }

    async function saveQuestion() {
        setSaving(true);
        try {
            if (editing.id) {
                await api.updateQuestion(editing.id, editing);
            } else {
                await api.createQuestion(editing);
            }
            setEditing(null);
            loadQuestions();
        } catch (err) {
            alert('Fehler: ' + err.message);
        }
        setSaving(false);
    }

    async function deleteQuestion(id) {
        if (!confirm('Frage wirklich löschen?')) return;
        try {
            await api.deleteQuestion(id);
            loadQuestions();
        } catch (err) {
            alert('Fehler: ' + err.message);
        }
    }

    function updateOption(idx, val) {
        const opts = [...editing.options];
        opts[idx] = val;
        setEditing({ ...editing, options: opts });
    }

    return (
        <div className="page">
            <div className="container">
                <div className="page-header animate-fade-in">
                    <h1>⚙️ Admin Panel</h1>
                    <p>Fragen verwalten • {total} Fragen im System</p>
                </div>

                {/* Toolbar */}
                <div className="card" style={{
                    display: 'flex', gap: 'var(--space-3)', alignItems: 'center',
                    flexWrap: 'wrap', marginBottom: 'var(--space-5)',
                }}>
                    <select className="input" style={{ maxWidth: 180 }} value={filter.topic}
                        onChange={e => { setFilter({ ...filter, topic: e.target.value }); setPage(0); }}>
                        <option value="">Alle Themen</option>
                        {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <select className="input" style={{ maxWidth: 150 }} value={filter.type}
                        onChange={e => { setFilter({ ...filter, type: e.target.value }); setPage(0); }}>
                        <option value="">Alle Typen</option>
                        {TYPES.map(t => <option key={t} value={t}>{t === 'mcq' ? 'Multiple Choice' : t === 'truefalse' ? 'Wahr/Falsch' : 'Lückentext'}</option>)}
                    </select>
                    <div style={{ flex: 1 }}></div>
                    <button className="btn btn-primary" onClick={() => setEditing({ ...emptyQuestion })}>
                        + Neue Frage
                    </button>
                </div>

                {/* Question List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
                    {loading ? (
                        [1, 2, 3].map(i => <div key={i} className="card skeleton" style={{ height: 60 }}></div>)
                    ) : questions.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--text-muted)' }}>
                            Keine Fragen gefunden.
                        </div>
                    ) : (
                        questions.map(q => (
                            <div key={q.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontWeight: 500, marginBottom: 'var(--space-1)', lineHeight: 1.4 }}>
                                        {q.text.length > 100 ? q.text.slice(0, 100) + '...' : q.text}
                                    </p>
                                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                        <span className="badge badge-primary">{q.topic}</span>
                                        <span className="badge badge-warning">{q.difficulty}</span>
                                        <span className="badge badge-success">{q.type}</span>
                                    </div>
                                </div>
                                <button className="btn btn-secondary" onClick={() => setEditing({ ...q })}>✏️</button>
                                <button className="btn btn-secondary" onClick={() => deleteQuestion(q.id)}
                                    style={{ color: 'var(--color-danger)' }}>🗑️</button>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {total > LIMIT && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-3)' }}>
                        <button className="btn btn-secondary" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>← Zurück</button>
                        <span style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                            Seite {page + 1} von {Math.ceil(total / LIMIT)}
                        </span>
                        <button className="btn btn-secondary" onClick={() => setPage(p => p + 1)}
                            disabled={(page + 1) * LIMIT >= total}>Weiter →</button>
                    </div>
                )}

                {/* Edit Modal */}
                {editing && (
                    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEditing(null)}>
                        <div className="modal-content" style={{ maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}>
                            <h2 style={{ marginBottom: 'var(--space-5)' }}>
                                {editing.id ? 'Frage bearbeiten' : 'Neue Frage erstellen'}
                            </h2>

                            <div className="input-group" style={{ marginBottom: 'var(--space-4)' }}>
                                <label>Frage</label>
                                <textarea className="input" rows={3} value={editing.text}
                                    onChange={e => setEditing({ ...editing, text: e.target.value })}
                                    placeholder="Frage eingeben..." style={{ resize: 'vertical' }} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                                <div className="input-group">
                                    <label>Typ</label>
                                    <select className="input" value={editing.type}
                                        onChange={e => setEditing({ ...editing, type: e.target.value })}>
                                        {TYPES.map(t => <option key={t} value={t}>{t === 'mcq' ? 'Multiple Choice' : t === 'truefalse' ? 'Wahr/Falsch' : 'Lückentext'}</option>)}
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label>Thema</label>
                                    <select className="input" value={editing.topic}
                                        onChange={e => setEditing({ ...editing, topic: e.target.value })}>
                                        {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label>Schwierigkeit</label>
                                    <select className="input" value={editing.difficulty}
                                        onChange={e => setEditing({ ...editing, difficulty: e.target.value })}>
                                        {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                            </div>

                            {editing.type === 'mcq' && (
                                <div style={{ marginBottom: 'var(--space-4)' }}>
                                    <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-2)', display: 'block' }}>
                                        Antwortmöglichkeiten
                                    </label>
                                    {editing.options.map((opt, i) => (
                                        <div key={i} style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', fontWeight: 700, width: 24 }}>
                                                {String.fromCharCode(65 + i)})
                                            </span>
                                            <input className="input" value={opt} onChange={e => updateOption(i, e.target.value)}
                                                placeholder={`Option ${String.fromCharCode(65 + i)}`} />
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="input-group" style={{ marginBottom: 'var(--space-4)' }}>
                                <label>Richtige Antwort</label>
                                {editing.type === 'mcq' ? (
                                    <select className="input" value={editing.correct_answer}
                                        onChange={e => setEditing({ ...editing, correct_answer: e.target.value })}>
                                        <option value="">— Wählen —</option>
                                        {editing.options.filter(o => o).map((opt, i) => (
                                            <option key={i} value={opt}>{String.fromCharCode(65 + i)}) {opt}</option>
                                        ))}
                                    </select>
                                ) : editing.type === 'truefalse' ? (
                                    <select className="input" value={editing.correct_answer}
                                        onChange={e => setEditing({ ...editing, correct_answer: e.target.value })}>
                                        <option value="">— Wählen —</option>
                                        <option value="Wahr">Wahr</option>
                                        <option value="Falsch">Falsch</option>
                                    </select>
                                ) : (
                                    <input className="input" value={editing.correct_answer}
                                        onChange={e => setEditing({ ...editing, correct_answer: e.target.value })}
                                        placeholder="Richtige Antwort" />
                                )}
                            </div>

                            <div className="input-group" style={{ marginBottom: 'var(--space-5)' }}>
                                <label>Erklärung</label>
                                <textarea className="input" rows={3} value={editing.explanation || ''}
                                    onChange={e => setEditing({ ...editing, explanation: e.target.value })}
                                    placeholder="Detaillierte Erklärung der richtigen Antwort..." style={{ resize: 'vertical' }} />
                            </div>

                            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                                <button className="btn btn-secondary" onClick={() => setEditing(null)}>Abbrechen</button>
                                <button className="btn btn-primary" onClick={saveQuestion} disabled={saving || !editing.text || !editing.correct_answer}>
                                    {saving ? 'Wird gespeichert...' : 'Speichern'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

import { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';

export default function ExamPage() {
    const [phase, setPhase] = useState('setup'); // setup | exam | results
    const [duration, setDuration] = useState(90); // minutes
    const [questionCount, setQuestionCount] = useState(60);
    const [session, setSession] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const timerRef = useRef(null);

    // Timer
    useEffect(() => {
        if (phase !== 'exam') return;
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    submitExam();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [phase]);

    const formatTime = (s) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };

    const timerClass = timeLeft < 300 ? 'danger' : timeLeft < 900 ? 'warning' : '';

    async function startExam() {
        setLoading(true);
        try {
            const data = await api.createSession({
                type: 'exam', topic: 'all',
                question_count: questionCount, duration: duration * 60,
            });
            setSession(data.session);
            setQuestions(data.questions);
            setTimeLeft(duration * 60);
            setAnswers({});
            setPhase('exam');
        } catch (err) {
            alert('Fehler: ' + err.message);
        }
        setLoading(false);
    }

    function selectAnswer(questionId, answer) {
        setAnswers(prev => ({
            ...prev,
            [questionId]: { question_id: questionId, answer }
        }));
    }

    async function submitExam() {
        clearInterval(timerRef.current);
        setLoading(true);
        try {
            const elapsed = duration * 60 - timeLeft;
            const data = await api.submitSession(session.id, {
                answers: Object.values(answers), duration: elapsed,
            });
            setResults(data.results);
            setPhase('results');
        } catch (err) {
            alert('Fehler: ' + err.message);
        }
        setLoading(false);
    }

    // Setup
    if (phase === 'setup') {
        return (
            <div className="page">
                <div className="container" style={{ maxWidth: 600 }}>
                    <div className="page-header animate-fade-in">
                        <h1>⏱️ Prüfungssimulation</h1>
                        <p>Simuliere eine echte QV-Prüfung unter Zeitdruck</p>
                    </div>

                    <div className="card animate-slide-up">
                        <div style={{
                            background: 'rgba(230,57,70,0.08)', borderRadius: 'var(--border-radius-sm)',
                            padding: 'var(--space-4)', marginBottom: 'var(--space-5)', lineHeight: 1.7,
                        }}>
                            <strong>📋 Prüfungsbedingungen:</strong><br />
                            • Zeitlimit – der Timer läuft!<br />
                            • Alle Themen gemischt<br />
                            • Bewertung nach Schweizer Notensystem (1-6)<br />
                            • Bestanden ab Note 4.0
                        </div>

                        <div className="input-group" style={{ marginBottom: 'var(--space-4)' }}>
                            <label>Prüfungsdauer</label>
                            <select className="input" value={duration} onChange={e => setDuration(Number(e.target.value))}>
                                <option value={30}>30 Minuten (Kurz)</option>
                                <option value={60}>60 Minuten</option>
                                <option value={90}>90 Minuten (Standard QV)</option>
                                <option value={120}>120 Minuten (Erweitert)</option>
                            </select>
                        </div>

                        <div className="input-group" style={{ marginBottom: 'var(--space-5)' }}>
                            <label>Anzahl Fragen</label>
                            <select className="input" value={questionCount} onChange={e => setQuestionCount(Number(e.target.value))}>
                                <option value={30}>30 Fragen</option>
                                <option value={50}>50 Fragen</option>
                                <option value={60}>60 Fragen (Standard QV)</option>
                                <option value={80}>80 Fragen (Erweitert)</option>
                            </select>
                        </div>

                        <button className="btn btn-primary btn-lg" style={{ width: '100%' }}
                            onClick={startExam} disabled={loading}>
                            {loading ? 'Wird vorbereitet...' : 'Prüfung starten 🏁'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Exam
    if (phase === 'exam') {
        const q = questions[currentIdx];
        const answeredCount = Object.keys(answers).length;

        return (
            <div className="page">
                <div className="container" style={{ maxWidth: 800 }}>
                    {/* Header bar */}
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        marginBottom: 'var(--space-5)', position: 'sticky', top: 'var(--nav-height)',
                        background: 'var(--bg-primary)', padding: 'var(--space-3) 0',
                        borderBottom: '1px solid var(--border-color)', zIndex: 10,
                    }}>
                        <span className={`timer ${timerClass}`}>⏱ {formatTime(timeLeft)}</span>
                        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                            {answeredCount}/{questions.length} beantwortet
                        </span>
                        <button className="btn btn-primary" onClick={submitExam} disabled={loading}>
                            Prüfung abgeben ✓
                        </button>
                    </div>

                    {/* Question navigation */}
                    <div style={{
                        display: 'flex', flexWrap: 'wrap', gap: '4px',
                        marginBottom: 'var(--space-4)', padding: 'var(--space-3)',
                        background: 'var(--bg-card)', borderRadius: 'var(--border-radius-sm)',
                        border: '1px solid var(--border-color)',
                    }}>
                        {questions.map((q, i) => (
                            <button key={i} onClick={() => setCurrentIdx(i)} style={{
                                width: 32, height: 32, fontSize: 'var(--font-size-xs)', fontWeight: 600,
                                border: 'none', borderRadius: 4, cursor: 'pointer',
                                background: i === currentIdx ? 'var(--color-primary)' :
                                    answers[q.id] ? 'var(--color-success)' : 'var(--bg-input)',
                                color: i === currentIdx || answers[q.id] ? 'white' : 'var(--text-primary)',
                            }}>
                                {i + 1}
                            </button>
                        ))}
                    </div>

                    {/* Question */}
                    {q && (
                        <div className="card">
                            <div style={{ marginBottom: 'var(--space-2)' }}>
                                <span className="badge badge-primary">{q.topic}</span>
                                <span style={{ float: 'right', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                                    Frage {currentIdx + 1}/{questions.length}
                                </span>
                            </div>

                            <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-5)', lineHeight: 1.5 }}>
                                {q.text}
                            </h2>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                                {(q.options || []).map((opt, i) => (
                                    <button key={i} onClick={() => selectAnswer(q.id, opt)} style={{
                                        padding: 'var(--space-4)', textAlign: 'left',
                                        border: `2px solid ${answers[q.id]?.answer === opt ? 'var(--color-secondary)' : 'var(--border-color)'}`,
                                        borderRadius: 'var(--border-radius-sm)', cursor: 'pointer',
                                        background: answers[q.id]?.answer === opt ? 'rgba(69,123,157,0.1)' : 'var(--bg-input)',
                                        fontSize: 'var(--font-size-base)',
                                    }}>
                                        <strong>{String.fromCharCode(65 + i)})</strong> {opt}
                                    </button>
                                ))}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-5)' }}>
                                <button className="btn btn-secondary" onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
                                    disabled={currentIdx === 0}>← Zurück</button>
                                <button className="btn btn-secondary" onClick={() => setCurrentIdx(Math.min(questions.length - 1, currentIdx + 1))}
                                    disabled={currentIdx === questions.length - 1}>Weiter →</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Results
    if (phase === 'results' && results) {
        const passed = results.grade >= 4.0;
        return (
            <div className="page">
                <div className="container" style={{ maxWidth: 600 }}>
                    <div className="card animate-slide-up" style={{ textAlign: 'center', marginBottom: 'var(--space-5)' }}>
                        <div style={{ fontSize: '5rem', marginBottom: 'var(--space-3)' }}>
                            {passed ? '🏆' : '📚'}
                        </div>
                        <h1 style={{ fontSize: 'var(--font-size-3xl)', marginBottom: 'var(--space-2)' }}>
                            Prüfungsergebnis
                        </h1>
                        <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-5)' }}>
                            {passed ? 'Herzlichen Glückwunsch – bestanden!' : 'Noch nicht bestanden – weiter üben!'}
                        </p>

                        <div style={{
                            display: 'inline-block', padding: 'var(--space-4) var(--space-6)',
                            borderRadius: 'var(--border-radius-lg)', marginBottom: 'var(--space-5)',
                            background: passed ? 'rgba(42,157,143,0.1)' : 'rgba(231,111,81,0.1)',
                            border: `2px solid ${passed ? 'var(--color-success)' : 'var(--color-danger)'}`,
                        }}>
                            <div style={{ fontSize: 'var(--font-size-4xl)', fontWeight: 800, color: passed ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                Note {results.grade}
                            </div>
                            <div style={{ color: 'var(--text-muted)' }}>
                                {results.correct}/{results.total} richtig ({Math.round(results.percentage)}%)
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button className="btn btn-primary btn-lg" onClick={() => setPhase('setup')}>
                                Neue Prüfung 🔄
                            </button>
                            <a href="/dashboard" className="btn btn-secondary btn-lg">Dashboard</a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}

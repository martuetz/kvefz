import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const TOPICS = [
    { value: 'all', label: 'Alle Themen' },
    { value: 'Rechnungswesen', label: 'Rechnungswesen' },
    { value: 'Recht', label: 'Recht & Staat' },
    { value: 'Betriebswirtschaft', label: 'Betriebswirtschaft' },
    { value: 'Marketing', label: 'Marketing' },
    { value: 'Logistik', label: 'Logistik & Supply Chain' },
    { value: 'Kaufmannswissen', label: 'Kaufmännisches Wissen' },
];

export default function QuizPage() {
    const { isPremium } = useAuth();
    const [phase, setPhase] = useState('setup'); // setup | quiz | results
    const [topic, setTopic] = useState('all');
    const [count, setCount] = useState(10);
    const [session, setSession] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState({});
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [showExplanation, setShowExplanation] = useState(false);
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);

    const FREE_LIMIT = 50;
    const totalAnswered = Object.keys(answers).length;

    async function startQuiz() {
        setLoading(true);
        try {
            const data = await api.createSession({ type: 'quiz', topic, question_count: count });
            setSession(data.session);
            setQuestions(data.questions);
            setPhase('quiz');
            setCurrentIdx(0);
            setAnswers({});
        } catch (err) {
            alert('Fehler: ' + err.message);
        }
        setLoading(false);
    }

    function selectAnswer(answer) {
        if (showExplanation) return;
        setSelectedAnswer(answer);
        setShowExplanation(true);

        const q = questions[currentIdx];
        setAnswers(prev => ({
            ...prev,
            [q.id]: { question_id: q.id, answer }
        }));
    }

    function nextQuestion() {
        setSelectedAnswer(null);
        setShowExplanation(false);
        if (currentIdx < questions.length - 1) {
            setCurrentIdx(currentIdx + 1);
        } else {
            submitQuiz();
        }
    }

    async function submitQuiz() {
        setLoading(true);
        try {
            const data = await api.submitSession(session.id, {
                answers: Object.values(answers),
            });
            setResults(data.results);
            setPhase('results');
        } catch (err) {
            alert('Fehler: ' + err.message);
        }
        setLoading(false);
    }

    // Setup phase
    if (phase === 'setup') {
        return (
            <div className="page">
                <div className="container" style={{ maxWidth: 600 }}>
                    <div className="page-header animate-fade-in">
                        <h1>🧠 Quiz starten</h1>
                        <p>Wähle ein Thema und die Anzahl Fragen</p>
                    </div>

                    <div className="card animate-slide-up">
                        <div className="input-group" style={{ marginBottom: 'var(--space-4)' }}>
                            <label>Thema</label>
                            <select className="input" value={topic} onChange={e => setTopic(e.target.value)}>
                                {TOPICS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                        </div>

                        <div className="input-group" style={{ marginBottom: 'var(--space-5)' }}>
                            <label>Anzahl Fragen</label>
                            <select className="input" value={count} onChange={e => setCount(Number(e.target.value))}>
                                <option value={5}>5 Fragen (Schnell)</option>
                                <option value={10}>10 Fragen</option>
                                <option value={20}>20 Fragen</option>
                                <option value={30}>30 Fragen</option>
                            </select>
                        </div>

                        {!isPremium && (
                            <div style={{
                                background: 'rgba(244,162,97,0.1)', borderRadius: 'var(--border-radius-sm)',
                                padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)',
                                fontSize: 'var(--font-size-sm)', color: 'var(--color-accent)',
                            }}>
                                ⭐ Kostenlos: {FREE_LIMIT} Fragen verfügbar. <a href="/premium" style={{ color: 'var(--color-primary)' }}>Premium freischalten</a> für vollen Zugang.
                            </div>
                        )}

                        <button className="btn btn-primary btn-lg" style={{ width: '100%' }}
                            onClick={startQuiz} disabled={loading}>
                            {loading ? 'Wird geladen...' : 'Quiz starten 🚀'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Quiz phase
    if (phase === 'quiz') {
        const q = questions[currentIdx];
        const isCorrect = selectedAnswer === q?.correct_answer;
        const progress = ((currentIdx + 1) / questions.length) * 100;

        return (
            <div className="page">
                <div className="container" style={{ maxWidth: 700 }}>
                    {/* Progress */}
                    <div style={{ marginBottom: 'var(--space-5)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                            <span>Frage {currentIdx + 1} von {questions.length}</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>

                    {/* Question */}
                    <div className="card animate-fade-in" key={currentIdx}>
                        <div style={{ marginBottom: 'var(--space-2)' }}>
                            <span className="badge badge-primary">{q.topic}</span>
                            {q.difficulty && <span className="badge badge-warning" style={{ marginLeft: 'var(--space-2)' }}>{q.difficulty}</span>}
                        </div>

                        <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-5)', lineHeight: 1.5 }}>
                            {q.text}
                        </h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                            {(q.options || []).map((opt, i) => {
                                let style = {
                                    padding: 'var(--space-4)',
                                    border: '2px solid var(--border-color)',
                                    borderRadius: 'var(--border-radius-sm)',
                                    cursor: showExplanation ? 'default' : 'pointer',
                                    transition: 'all 0.2s',
                                    fontSize: 'var(--font-size-base)',
                                    textAlign: 'left',
                                    background: 'var(--bg-input)',
                                    color: 'var(--text-primary)',
                                    lineHeight: 1.5,
                                };

                                if (showExplanation) {
                                    if (opt === q.correct_answer) {
                                        style.borderColor = '#2a9d8f';
                                        style.background = 'rgba(42,157,143,0.2)';
                                        style.color = '#5ee6d5';
                                    } else if (opt === selectedAnswer && !isCorrect) {
                                        style.borderColor = '#e76f51';
                                        style.background = 'rgba(231,111,81,0.2)';
                                        style.color = '#ff9a85';
                                    } else {
                                        style.opacity = 0.5;
                                    }
                                } else if (selectedAnswer === opt) {
                                    style.borderColor = 'var(--color-secondary)';
                                    style.background = 'rgba(69,123,157,0.15)';
                                }

                                return (
                                    <button key={i} style={style} onClick={() => selectAnswer(opt)} disabled={showExplanation}>
                                        <strong style={{ marginRight: 'var(--space-2)', color: 'inherit' }}>{String.fromCharCode(65 + i)})</strong>
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Explanation */}
                        {showExplanation && (
                            <div style={{
                                marginTop: 'var(--space-5)', padding: 'var(--space-4)',
                                borderRadius: 'var(--border-radius-sm)', lineHeight: 1.7,
                                background: isCorrect ? 'rgba(42,157,143,0.08)' : 'rgba(231,111,81,0.08)',
                                borderLeft: `4px solid ${isCorrect ? 'var(--color-success)' : 'var(--color-danger)'}`,
                            }}>
                                <strong>{isCorrect ? '✅ Richtig!' : '❌ Falsch!'}</strong>
                                {q.explanation && <p style={{ marginTop: 'var(--space-2)' }}>{q.explanation}</p>}
                            </div>
                        )}

                        {showExplanation && (
                            <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 'var(--space-4)' }}
                                onClick={nextQuestion}>
                                {currentIdx < questions.length - 1 ? 'Nächste Frage →' : 'Ergebnisse anzeigen 🎯'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Results phase
    if (phase === 'results' && results) {
        const passed = results.grade >= 4.0;
        return (
            <div className="page">
                <div className="container" style={{ maxWidth: 600 }}>
                    <div className="card animate-slide-up" style={{ textAlign: 'center', marginBottom: 'var(--space-5)' }}>
                        <div style={{ fontSize: '4rem', marginBottom: 'var(--space-3)' }}>
                            {passed ? '🎉' : '💪'}
                        </div>
                        <h1 style={{ marginBottom: 'var(--space-4)' }}>
                            {passed ? 'Bestanden!' : 'Weiter üben!'}
                        </h1>

                        <div className="grid-3" style={{ marginBottom: 'var(--space-5)' }}>
                            <div>
                                <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800, color: passed ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                    {results.grade}
                                </div>
                                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>Note</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800 }}>{results.correct}/{results.total}</div>
                                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>Richtig</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 800 }}>{Math.round(results.percentage)}%</div>
                                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>Prozent</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button className="btn btn-primary btn-lg" onClick={() => setPhase('setup')}>
                                Neues Quiz 🔄
                            </button>
                            <a href="/progress" className="btn btn-secondary btn-lg">Fortschritt 📊</a>
                        </div>
                    </div>

                    {/* Review answers */}
                    <h2 style={{ marginBottom: 'var(--space-4)' }}>Antworten im Detail</h2>
                    {results.answers.map((a, i) => {
                        const q = questions.find(q => q.id === a.question_id);
                        return (
                            <div key={i} className="card" style={{
                                marginBottom: 'var(--space-3)',
                                borderLeft: `4px solid ${a.correct ? 'var(--color-success)' : 'var(--color-danger)'}`,
                            }}>
                                <p style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                                    {a.correct ? '✅' : '❌'} {q?.text}
                                </p>
                                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                                    Deine Antwort: <strong>{a.answer}</strong>
                                    {!a.correct && <> | Richtig: <strong style={{ color: 'var(--color-success)' }}>{q?.correct_answer}</strong></>}
                                </p>
                                {a.explanation && (
                                    <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-2)', color: 'var(--text-secondary)' }}>
                                        💡 {a.explanation}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    return null;
}

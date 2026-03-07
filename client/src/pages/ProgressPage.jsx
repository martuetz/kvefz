import { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function ProgressPage() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getProgress().then(setStats).catch(() => { }).finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="page"><div className="container">
                <div className="page-header"><h1>📈 Fortschritt</h1></div>
                <div className="card skeleton" style={{ height: 300 }}></div>
            </div></div>
        );
    }

    if (!stats || stats.totalSessions === 0) {
        return (
            <div className="page"><div className="container">
                <div className="page-header animate-fade-in">
                    <h1>📈 Fortschritt</h1>
                    <p>Absolviere dein erstes Quiz, um deinen Fortschritt zu sehen!</p>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                    <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>📝</div>
                    <h2>Noch keine Daten</h2>
                    <p style={{ color: 'var(--text-muted)', margin: 'var(--space-3) 0 var(--space-5)' }}>
                        Starte ein Quiz oder eine Prüfungssimulation, um deinen Fortschritt zu verfolgen.
                    </p>
                    <a href="/quiz" className="btn btn-primary btn-lg">Erstes Quiz starten</a>
                </div>
            </div></div>
        );
    }

    // Chart data
    const chartData = {
        labels: stats.recentScores.map(s => new Date(s.date).toLocaleDateString('de-CH', { day: '2-digit', month: 'short' })),
        datasets: [{
            label: 'Punktzahl (%)',
            data: stats.recentScores.map(s => s.score),
            borderColor: '#e63946',
            backgroundColor: 'rgba(230,57,70,0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
        }, {
            label: 'Note',
            data: stats.recentScores.map(s => s.grade * 20), // Scale 1-6 to 20-120 for visibility
            borderColor: '#457b9d',
            backgroundColor: 'rgba(69,123,157,0.05)',
            fill: false,
            tension: 0.4,
            pointRadius: 3,
            borderDash: [5, 5],
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top', labels: { color: 'var(--text-primary)', usePointStyle: true } },
            tooltip: { backgroundColor: '#1a1a2e', titleColor: '#fff', bodyColor: '#fff' },
        },
        scales: {
            x: { grid: { color: 'rgba(128,128,128,0.1)' }, ticks: { color: 'var(--text-muted)' } },
            y: { grid: { color: 'rgba(128,128,128,0.1)' }, ticks: { color: 'var(--text-muted)' }, min: 0, max: 100 },
        },
    };

    const getMasteryColor = (pct) => {
        if (pct >= 75) return 'heatmap-green';
        if (pct >= 50) return 'heatmap-yellow';
        return 'heatmap-red';
    };

    return (
        <div className="page">
            <div className="container">
                <div className="page-header animate-fade-in">
                    <h1>📈 Dein Fortschritt</h1>
                    <p>{stats.totalSessions} Tests absolviert • ∅ Note {stats.avgGrade}</p>
                </div>

                {/* Score Chart */}
                <div className="card animate-slide-up" style={{ marginBottom: 'var(--space-6)' }}>
                    <h3 style={{ marginBottom: 'var(--space-4)' }}>Punktzahl über Zeit</h3>
                    <div style={{ height: 300 }}>
                        <Line data={chartData} options={chartOptions} />
                    </div>
                </div>

                {/* Topic Heatmap */}
                <div className="card animate-slide-up" style={{ marginBottom: 'var(--space-6)', animationDelay: '0.15s' }}>
                    <h3 style={{ marginBottom: 'var(--space-4)' }}>Themen-Heatmap</h3>
                    <div className="heatmap-grid">
                        {stats.topicStats.map(t => (
                            <div key={t.topic} className={`heatmap-cell ${getMasteryColor(t.percentage)}`}>
                                <div style={{ fontSize: '1.2rem', marginBottom: 'var(--space-1)' }}>
                                    {t.percentage >= 75 ? '✅' : t.percentage >= 50 ? '⚡' : '🔴'}
                                </div>
                                <div>{t.topic}</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{t.percentage}%</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Stats Table */}
                <div className="card animate-slide-up" style={{ animationDelay: '0.25s' }}>
                    <h3 style={{ marginBottom: 'var(--space-4)' }}>Detailstatistik</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                    <th style={{ textAlign: 'left', padding: 'var(--space-3)', color: 'var(--text-muted)' }}>Thema</th>
                                    <th style={{ textAlign: 'center', padding: 'var(--space-3)', color: 'var(--text-muted)' }}>Richtig</th>
                                    <th style={{ textAlign: 'center', padding: 'var(--space-3)', color: 'var(--text-muted)' }}>Total</th>
                                    <th style={{ textAlign: 'center', padding: 'var(--space-3)', color: 'var(--text-muted)' }}>Quote</th>
                                    <th style={{ textAlign: 'center', padding: 'var(--space-3)', color: 'var(--text-muted)' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.topicStats.sort((a, b) => a.percentage - b.percentage).map(t => (
                                    <tr key={t.topic} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: 'var(--space-3)', fontWeight: 600 }}>{t.topic}</td>
                                        <td style={{ textAlign: 'center', padding: 'var(--space-3)' }}>{t.correct}</td>
                                        <td style={{ textAlign: 'center', padding: 'var(--space-3)' }}>{t.total}</td>
                                        <td style={{ textAlign: 'center', padding: 'var(--space-3)', fontWeight: 700 }}>{t.percentage}%</td>
                                        <td style={{ textAlign: 'center', padding: 'var(--space-3)' }}>
                                            <span className={`badge ${t.percentage >= 75 ? 'badge-success' : t.percentage >= 50 ? 'badge-warning' : 'badge-danger'}`}>
                                                {t.percentage >= 75 ? 'Stark' : t.percentage >= 50 ? 'OK' : 'Schwach'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

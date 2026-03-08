import { Router } from 'express';
import { db } from '../server.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// GET /api/progress - overall stats
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user?.id || req.userId;

        // 1. Get all completed sessions for the user
        const sResult = await db.execute({
            sql: 'SELECT * FROM sessions WHERE user_id = ? AND completed = 1 ORDER BY completed_at ASC',
            args: [userId]
        });

        const sessions = sResult.rows.map(s => ({
            ...s,
            answers: typeof s.answers === 'string' ? JSON.parse(s.answers) : s.answers,
            questions: typeof s.questions === 'string' ? JSON.parse(s.questions) : s.questions
        }));

        if (sessions.length === 0) {
            return res.json({ totalSessions: 0, avgScore: 0, avgGrade: 0, streak: 0, topicStats: [], recentScores: [] });
        }

        const totalSessions = sessions.length;
        const avgScore = Math.round(sessions.reduce((s, x) => s + (x.score || 0), 0) / totalSessions);
        const avgGrade = Math.round((sessions.reduce((s, x) => s + (x.grade || 0), 0) / totalSessions) * 10) / 10;

        const recentScores = sessions.slice(-20).map(s => ({
            date: s.completed_at, score: s.score, grade: s.grade, type: s.type,
        }));

        // 2. Calculate topic stats
        const topicStats = {};

        // Optimization: Get all questions to map topics
        const qResult = await db.execute('SELECT id, topic FROM questions');
        const topicMap = {};
        qResult.rows.forEach(q => { topicMap[q.id] = q.topic; });

        sessions.forEach(s => {
            (s.answers || []).forEach(a => {
                const topic = topicMap[a.question_id] || 'Sonstige';
                if (!topicStats[topic]) topicStats[topic] = { correct: 0, total: 0 };
                topicStats[topic].total++;
                if (a.correct) topicStats[topic].correct++;
            });
        });

        const topicStatsArr = Object.entries(topicStats).map(([topic, s]) => ({
            topic, correct: s.correct, total: s.total,
            percentage: Math.round((s.correct / s.total) * 100),
        }));

        // 3. Get profile for streak
        const pResult = await db.execute({
            sql: 'SELECT streak FROM profiles WHERE id = ?',
            args: [userId]
        });
        const streak = pResult.rows[0]?.streak || 0;

        res.json({ totalSessions, avgScore, avgGrade, streak, topicStats: topicStatsArr, recentScores });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/progress/streak
router.get('/streak', authMiddleware, async (req, res) => {
    try {
        const userId = req.user?.id || req.userId;
        const result = await db.execute({
            sql: 'SELECT streak, last_active FROM profiles WHERE id = ?',
            args: [userId]
        });
        const data = result.rows[0];
        res.json({ streak: data?.streak || 0, lastActive: data?.last_active });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

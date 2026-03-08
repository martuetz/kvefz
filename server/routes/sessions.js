import { Router } from 'express';
import { db } from '../server.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Helper to format session
function formatSession(s) {
    if (!s) return null;
    return {
        ...s,
        questions: typeof s.questions === 'string' ? JSON.parse(s.questions) : s.questions,
        answers: typeof s.answers === 'string' ? JSON.parse(s.answers) : s.answers,
        completed: Boolean(s.completed)
    };
}

// POST /api/sessions - create new quiz/exam session
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { type, topic, question_count = 10, duration } = req.body;
        const userId = req.user?.id || req.userId;

        // 1. Get random questions from Turso
        let qSql = 'SELECT * FROM questions WHERE 1=1';
        const qArgs = [];

        if (topic && topic !== 'all') {
            qSql += ' AND topic = ?';
            qArgs.push(topic);
        }

        qSql += ' ORDER BY RANDOM() LIMIT ?';
        qArgs.push(Number(question_count));

        const qResult = await db.execute({ sql: qSql, args: qArgs });
        const selectedQuestions = qResult.rows.map(q => {
            const parsedOptions = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;

            // Shuffle options to prevent correct answer always being first
            if (Array.isArray(parsedOptions)) {
                for (let i = parsedOptions.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [parsedOptions[i], parsedOptions[j]] = [parsedOptions[j], parsedOptions[i]];
                }
            }

            return {
                ...q,
                options: parsedOptions
            };
        });

        // 2. Create session in Turso
        const sessionId = `s-${Date.now()}`;
        const sessionData = {
            id: sessionId,
            user_id: userId,
            type: type || 'quiz',
            questions: JSON.stringify(selectedQuestions.map(q => q.id)),
            answers: JSON.stringify([]),
            score: null,
            duration: duration || null,
            completed: 0,
            created_at: new Date().toISOString()
        };

        await db.execute({
            sql: `INSERT INTO sessions (id, user_id, type, questions, answers, score, duration, completed, created_at) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                sessionData.id, sessionData.user_id, sessionData.type,
                sessionData.questions, sessionData.answers, sessionData.score,
                sessionData.duration, sessionData.completed, sessionData.created_at
            ]
        });

        res.status(201).json({
            session: formatSession(sessionData),
            questions: selectedQuestions
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT /api/sessions/:id - submit answers
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { answers, duration } = req.body;
        const userId = req.user?.id || req.userId;

        // 1. Get session from Turso
        const sResult = await db.execute({
            sql: 'SELECT * FROM sessions WHERE id = ?',
            args: [req.params.id]
        });

        if (sResult.rows.length === 0) {
            return res.status(404).json({ error: 'Sitzung nicht gefunden' });
        }

        const session = formatSession(sResult.rows[0]);

        // 2. Get questions to grade
        const qIds = session.questions;
        const qResult = await db.execute({
            sql: `SELECT * FROM questions WHERE id IN (${qIds.map(() => '?').join(',')})`,
            args: qIds
        });
        const questions = qResult.rows;

        // 3. Grade answers
        let correct = 0;
        const graded = answers.map(a => {
            const q = questions.find(q => q.id === a.question_id);
            const isCorrect = q && q.correct_answer === a.answer;
            if (isCorrect) correct++;
            return {
                ...a,
                correct: isCorrect,
                explanation: q?.explanation || ''
            };
        });

        const total = session.questions.length;
        const percentage = total > 0 ? (correct / total) * 100 : 0;
        const grade = Math.round((1 + (percentage / 100) * 5) * 10) / 10;

        // 4. Update session in Turso
        await db.execute({
            sql: `UPDATE sessions SET 
                  answers = ?, score = ?, grade = ?, duration = ?, 
                  completed = 1, completed_at = ?
                  WHERE id = ?`,
            args: [
                JSON.stringify(graded), percentage, grade, duration || null,
                new Date().toISOString(), req.params.id
            ]
        });

        // 5. Update streak
        await updateStreak(userId);

        const updatedResult = await db.execute({
            sql: 'SELECT * FROM sessions WHERE id = ?',
            args: [req.params.id]
        });

        res.json({
            session: formatSession(updatedResult.rows[0]),
            results: { correct, total, percentage, grade, passed: grade >= 4.0, answers: graded }
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// GET /api/sessions - user's sessions
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user?.id || req.userId;
        const result = await db.execute({
            sql: 'SELECT * FROM sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
            args: [userId]
        });

        res.json({ sessions: result.rows.map(formatSession) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

async function updateStreak(userId) {
    try {
        const result = await db.execute({
            sql: 'SELECT streak, last_active FROM profiles WHERE id = ?',
            args: [userId]
        });

        if (result.rows.length === 0) return;
        const profile = result.rows[0];

        const today = new Date().toISOString().split('T')[0];
        const lastActive = profile.last_active ? new Date(profile.last_active).toISOString().split('T')[0] : null;

        let newStreak = profile.streak || 0;
        if (lastActive !== today) {
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            newStreak = lastActive === yesterday ? newStreak + 1 : 1;
        }

        await db.execute({
            sql: 'UPDATE profiles SET streak = ?, last_active = ? WHERE id = ?',
            args: [newStreak, new Date().toISOString(), userId]
        });
    } catch (err) {
        console.error('Streak Update Fehler:', err.message);
    }
}

export default router;

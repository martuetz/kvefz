import { Router } from 'express';
import { db } from '../server.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = Router();

// Helper to format question from DB
function formatQuestion(q) {
    if (!q) return null;
    return {
        ...q,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
        is_premium: Boolean(q.is_premium)
    };
}

// GET /api/questions - list with filters
router.get('/', async (req, res) => {
    try {
        const { topic, difficulty, type, limit = 50, offset = 0 } = req.query;

        let sql = 'SELECT * FROM questions WHERE 1=1';
        const args = [];

        if (topic) {
            sql += ' AND topic = ?';
            args.push(topic);
        }
        if (difficulty) {
            sql += ' AND difficulty = ?';
            args.push(difficulty);
        }
        if (type) {
            sql += ' AND type = ?';
            args.push(type);
        }

        const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
        const countRes = await db.execute({ sql: countSql, args });
        const total = countRes.rows[0].total;

        sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        args.push(Number(limit), Number(offset));

        const result = await db.execute({ sql, args });
        const questions = result.rows.map(formatQuestion);

        res.json({ questions, total });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/questions/random - random questions for quiz
router.get('/random', async (req, res) => {
    try {
        const { topic, count = 10, type } = req.query;

        let sql = 'SELECT * FROM questions WHERE 1=1';
        const args = [];

        if (topic && topic !== 'all') {
            sql += ' AND topic = ?';
            args.push(topic);
        }
        if (type) {
            sql += ' AND type = ?';
            args.push(type);
        }

        sql += ' ORDER BY RANDOM() LIMIT ?';
        args.push(Number(count));

        const result = await db.execute({ sql, args });
        const questions = result.rows.map(formatQuestion);

        res.json({ questions });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/questions/:id
router.get('/:id', async (req, res) => {
    try {
        const result = await db.execute({
            sql: 'SELECT * FROM questions WHERE id = ?',
            args: [req.params.id]
        });

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Frage nicht gefunden' });
        }

        res.json(formatQuestion(result.rows[0]));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/questions - admin only
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { text, type, options, correct_answer, explanation, topic, subtopic, difficulty } = req.body;
        const id = `q-${Date.now()}`;

        await db.execute({
            sql: `INSERT INTO questions (id, text, type, options, correct_answer, explanation, topic, subtopic, difficulty) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                id, text, type || 'mcq', JSON.stringify(options || []),
                correct_answer, explanation, topic, subtopic, difficulty || 'mittel'
            ]
        });

        const result = await db.execute({ sql: 'SELECT * FROM questions WHERE id = ?', args: [id] });
        res.status(201).json(formatQuestion(result.rows[0]));
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT /api/questions/:id - admin only
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { text, type, options, correct_answer, explanation, topic, subtopic, difficulty } = req.body;

        await db.execute({
            sql: `UPDATE questions SET 
                  text = ?, type = ?, options = ?, correct_answer = ?, 
                  explanation = ?, topic = ?, subtopic = ?, difficulty = ?
                  WHERE id = ?`,
            args: [
                text, type, JSON.stringify(options), correct_answer,
                explanation, topic, subtopic, difficulty, req.params.id
            ]
        });

        const result = await db.execute({ sql: 'SELECT * FROM questions WHERE id = ?', args: [req.params.id] });
        if (result.rows.length === 0) return res.status(404).json({ error: 'Frage nicht gefunden' });

        res.json(formatQuestion(result.rows[0]));
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE /api/questions/:id - admin only
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await db.execute({
            sql: 'DELETE FROM questions WHERE id = ?',
            args: [req.params.id]
        });
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

export default router;

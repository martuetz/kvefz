import { Router } from 'express';
import { supabaseAdmin, isDemo, demoStore } from '../server.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = Router();

// GET /api/questions - list with filters
router.get('/', async (req, res) => {
    try {
        const { topic, difficulty, type, limit = 50, offset = 0 } = req.query;

        if (isDemo) {
            let questions = [...demoStore.questions];
            if (topic) questions = questions.filter(q => q.topic === topic);
            if (difficulty) questions = questions.filter(q => q.difficulty === difficulty);
            if (type) questions = questions.filter(q => q.type === type);
            const total = questions.length;
            questions = questions.slice(Number(offset), Number(offset) + Number(limit));
            return res.json({ questions, total });
        }

        let query = supabaseAdmin.from('questions').select('*', { count: 'exact' });
        if (topic) query = query.eq('topic', topic);
        if (difficulty) query = query.eq('difficulty', difficulty);
        if (type) query = query.eq('type', type);
        query = query.range(Number(offset), Number(offset) + Number(limit) - 1).order('created_at', { ascending: false });
        const { data, error, count } = await query;
        if (error) throw error;
        res.json({ questions: data, total: count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/questions/random - random questions for quiz
router.get('/random', async (req, res) => {
    try {
        const { topic, count = 10, type } = req.query;

        if (isDemo) {
            let questions = [...demoStore.questions];
            if (topic && topic !== 'all') questions = questions.filter(q => q.topic === topic);
            if (type) questions = questions.filter(q => q.type === type);
            const shuffled = questions.sort(() => 0.5 - Math.random());
            return res.json({ questions: shuffled.slice(0, Number(count)) });
        }

        let query = supabaseAdmin.from('questions').select('*');
        if (topic && topic !== 'all') query = query.eq('topic', topic);
        if (type) query = query.eq('type', type);
        const { data, error } = await query;
        if (error) throw error;
        const shuffled = data.sort(() => 0.5 - Math.random());
        res.json({ questions: shuffled.slice(0, Number(count)) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/questions/:id
router.get('/:id', async (req, res) => {
    try {
        if (isDemo) {
            const q = demoStore.questions.find(q => q.id === req.params.id);
            return q ? res.json(q) : res.status(404).json({ error: 'Frage nicht gefunden' });
        }
        const { data, error } = await supabaseAdmin.from('questions').select('*').eq('id', req.params.id).single();
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(404).json({ error: 'Frage nicht gefunden' });
    }
});

// POST /api/questions - admin only
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { text, type, options, correct_answer, explanation, topic, subtopic, difficulty } = req.body;

        if (isDemo) {
            const newQ = { id: `q-${Date.now()}`, text, type, options, correct_answer, explanation, topic, subtopic, difficulty, created_at: new Date().toISOString() };
            demoStore.questions.unshift(newQ);
            return res.status(201).json(newQ);
        }

        const { data, error } = await supabaseAdmin.from('questions').insert({
            text, type, options, correct_answer, explanation, topic, subtopic, difficulty
        }).select().single();
        if (error) throw error;
        res.status(201).json(data);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT /api/questions/:id - admin only
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { text, type, options, correct_answer, explanation, topic, subtopic, difficulty } = req.body;

        if (isDemo) {
            const idx = demoStore.questions.findIndex(q => q.id === req.params.id);
            if (idx === -1) return res.status(404).json({ error: 'Frage nicht gefunden' });
            demoStore.questions[idx] = { ...demoStore.questions[idx], text, type, options, correct_answer, explanation, topic, subtopic, difficulty };
            return res.json(demoStore.questions[idx]);
        }

        const { data, error } = await supabaseAdmin.from('questions').update({
            text, type, options, correct_answer, explanation, topic, subtopic, difficulty
        }).eq('id', req.params.id).select().single();
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE /api/questions/:id - admin only
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        if (isDemo) {
            demoStore.questions = demoStore.questions.filter(q => q.id !== req.params.id);
            return res.json({ success: true });
        }
        const { error } = await supabaseAdmin.from('questions').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

export default router;

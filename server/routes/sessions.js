import { Router } from 'express';
import { supabaseAdmin, isDemo, demoStore } from '../server.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// POST /api/sessions - create new quiz/exam session
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { type, topic, question_count = 10, duration } = req.body;

        if (isDemo) {
            let questions = [...demoStore.questions];
            if (topic && topic !== 'all') questions = questions.filter(q => q.topic === topic);
            const shuffled = questions.sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, Number(question_count));

            const session = {
                id: `s-${Date.now()}`,
                user_id: req.userId,
                type: type || 'quiz',
                questions: selected.map(q => q.id),
                answers: [],
                score: null,
                duration: duration || null,
                completed: false,
                created_at: new Date().toISOString(),
            };
            demoStore.sessions.push(session);
            return res.status(201).json({ session, questions: selected });
        }

        // Supabase mode
        let query = supabaseAdmin.from('questions').select('*');
        if (topic && topic !== 'all') query = query.eq('topic', topic);
        const { data: allQuestions, error: qErr } = await query;
        if (qErr) throw qErr;

        const shuffled = allQuestions.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, Number(question_count));

        const { data, error } = await supabaseAdmin.from('sessions').insert({
            user_id: req.user.id,
            type: type || 'quiz',
            questions: selected.map(q => q.id),
            answers: [],
            score: null,
            duration: duration || null,
            completed: false,
        }).select().single();

        if (error) throw error;
        res.status(201).json({ session: data, questions: selected });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT /api/sessions/:id - submit answers
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { answers, duration } = req.body;

        if (isDemo) {
            const session = demoStore.sessions.find(s => s.id === req.params.id);
            if (!session) return res.status(404).json({ error: 'Sitzung nicht gefunden' });

            let correct = 0;
            const graded = answers.map(a => {
                const q = demoStore.questions.find(q => q.id === a.question_id);
                const isCorrect = q && q.correct_answer === a.answer;
                if (isCorrect) correct++;
                return { ...a, correct: isCorrect, explanation: q?.explanation || '' };
            });

            const total = session.questions.length;
            const percentage = total > 0 ? (correct / total) * 100 : 0;
            const grade = Math.round((1 + (percentage / 100) * 5) * 10) / 10;

            session.answers = graded;
            session.score = percentage;
            session.grade = grade;
            session.duration = duration || null;
            session.completed = true;
            session.completed_at = new Date().toISOString();

            return res.json({
                session,
                results: { correct, total, percentage, grade, passed: grade >= 4.0, answers: graded }
            });
        }

        // Supabase mode
        const { data: session, error: sErr } = await supabaseAdmin
            .from('sessions').select('*').eq('id', req.params.id).single();
        if (sErr) throw sErr;

        const { data: questions } = await supabaseAdmin
            .from('questions').select('*').in('id', session.questions);

        let correct = 0;
        const graded = answers.map(a => {
            const q = questions.find(q => q.id === a.question_id);
            const isCorrect = q && q.correct_answer === a.answer;
            if (isCorrect) correct++;
            return { ...a, correct: isCorrect, explanation: q?.explanation || '' };
        });

        const total = session.questions.length;
        const percentage = total > 0 ? (correct / total) * 100 : 0;
        const grade = Math.round((1 + (percentage / 100) * 5) * 10) / 10;

        const { data, error } = await supabaseAdmin.from('sessions').update({
            answers: graded, score: percentage, grade, duration: duration || null,
            completed: true, completed_at: new Date().toISOString(),
        }).eq('id', req.params.id).select().single();

        if (error) throw error;
        await updateStreak(req.user.id);
        res.json({ session: data, results: { correct, total, percentage, grade, passed: grade >= 4.0, answers: graded } });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// GET /api/sessions - user's sessions
router.get('/', authMiddleware, async (req, res) => {
    try {
        if (isDemo) {
            const sessions = demoStore.sessions.filter(s => s.user_id === req.userId);
            return res.json({ sessions });
        }

        const { data, error } = await supabaseAdmin
            .from('sessions').select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false })
            .limit(50);
        if (error) throw error;
        res.json({ sessions: data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

async function updateStreak(userId) {
    if (isDemo) return;
    const { data: profile } = await supabaseAdmin
        .from('profiles').select('streak, last_active').eq('id', userId).single();
    if (!profile) return;
    const today = new Date().toISOString().split('T')[0];
    const lastActive = profile.last_active ? new Date(profile.last_active).toISOString().split('T')[0] : null;
    let newStreak = profile.streak || 0;
    if (lastActive !== today) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        newStreak = lastActive === yesterday ? newStreak + 1 : 1;
    }
    await supabaseAdmin.from('profiles').update({
        streak: newStreak, last_active: new Date().toISOString(),
    }).eq('id', userId);
}

export default router;

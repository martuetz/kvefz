import { Router } from 'express';
import { supabaseAdmin, isDemo, demoStore } from '../server.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// GET /api/progress - overall stats
router.get('/', authMiddleware, async (req, res) => {
    try {
        if (isDemo) {
            const sessions = demoStore.sessions.filter(s => s.user_id === req.userId && s.completed);
            if (sessions.length === 0) {
                return res.json({ totalSessions: 0, avgScore: 0, avgGrade: 0, streak: 5, topicStats: [], recentScores: [] });
            }

            const totalSessions = sessions.length;
            const avgScore = Math.round(sessions.reduce((s, x) => s + (x.score || 0), 0) / totalSessions);
            const avgGrade = Math.round((sessions.reduce((s, x) => s + (x.grade || 0), 0) / totalSessions) * 10) / 10;
            const recentScores = sessions.slice(-20).map(s => ({
                date: s.completed_at, score: s.score, grade: s.grade, type: s.type,
            }));

            const topicStats = {};
            sessions.forEach(s => {
                (s.answers || []).forEach(a => {
                    const q = demoStore.questions.find(q => q.id === a.question_id);
                    const topic = q?.topic || 'Sonstige';
                    if (!topicStats[topic]) topicStats[topic] = { correct: 0, total: 0 };
                    topicStats[topic].total++;
                    if (a.correct) topicStats[topic].correct++;
                });
            });

            const topicStatsArr = Object.entries(topicStats).map(([topic, s]) => ({
                topic, correct: s.correct, total: s.total,
                percentage: Math.round((s.correct / s.total) * 100),
            }));

            const profile = demoStore.profiles.find(p => p.id === req.userId);
            return res.json({ totalSessions, avgScore, avgGrade, streak: profile?.streak || 0, topicStats: topicStatsArr, recentScores });
        }

        // Supabase mode
        const userId = req.user.id;
        const { data: sessions } = await supabaseAdmin.from('sessions').select('*')
            .eq('user_id', userId).eq('completed', true).order('completed_at', { ascending: true });

        if (!sessions || sessions.length === 0) {
            return res.json({ totalSessions: 0, avgScore: 0, avgGrade: 0, streak: 0, topicStats: [], recentScores: [] });
        }

        const totalSessions = sessions.length;
        const avgScore = Math.round(sessions.reduce((s, x) => s + (x.score || 0), 0) / totalSessions);
        const avgGrade = Math.round((sessions.reduce((s, x) => s + (x.grade || 0), 0) / totalSessions) * 10) / 10;
        const recentScores = sessions.slice(-20).map(s => ({
            date: s.completed_at, score: s.score, grade: s.grade, type: s.type,
        }));

        const { data: questions } = await supabaseAdmin.from('questions').select('id, topic');
        const topicMap = {};
        (questions || []).forEach(q => { topicMap[q.id] = q.topic; });

        const topicStats = {};
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

        const { data: profile } = await supabaseAdmin.from('profiles').select('streak').eq('id', userId).single();
        res.json({ totalSessions, avgScore, avgGrade, streak: profile?.streak || 0, topicStats: topicStatsArr, recentScores });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/progress/streak
router.get('/streak', authMiddleware, async (req, res) => {
    try {
        if (isDemo) {
            const profile = demoStore.profiles.find(p => p.id === req.userId);
            return res.json({ streak: profile?.streak || 0, lastActive: profile?.last_active });
        }
        const { data } = await supabaseAdmin
            .from('profiles').select('streak, last_active').eq('id', req.user.id).single();
        res.json({ streak: data?.streak || 0, lastActive: data?.last_active });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

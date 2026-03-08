import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { supabaseAdmin, isDemo, demoStore } from '../server.js';

const router = Router();

// All user routes require admin
router.use(authMiddleware, adminMiddleware);

// GET /api/users — list all users/profiles
router.get('/', async (req, res) => {
    try {
        if (isDemo) {
            return res.json({ users: demoStore.profiles });
        }

        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ users: data || [] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/users/:id — update user role/premium
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { role, is_premium } = req.body;

    try {
        if (isDemo) {
            const user = demoStore.profiles.find(p => p.id === id);
            if (!user) return res.status(404).json({ error: 'Benutzer nicht gefunden' });
            if (role !== undefined) user.role = role;
            if (is_premium !== undefined) user.is_premium = is_premium;
            return res.json({ user });
        }

        const updates = {};
        if (role !== undefined) updates.role = role;
        if (is_premium !== undefined) updates.is_premium = is_premium;

        const { data, error } = await supabaseAdmin
            .from('profiles')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json({ user: data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

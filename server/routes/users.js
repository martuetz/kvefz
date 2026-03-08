import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { db } from '../server.js';

const router = Router();

// All user routes require admin
router.use(authMiddleware, adminMiddleware);

// GET /api/users — list all users/profiles
router.get('/', async (req, res) => {
    try {
        const result = await db.execute({
            sql: 'SELECT * FROM profiles ORDER BY created_at DESC',
            args: []
        });

        const users = result.rows.map(user => ({
            ...user,
            is_premium: Boolean(user.is_premium)
        }));

        res.json({ users: users || [] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/users/:id — update user role/premium
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { role, is_premium } = req.body;

    try {
        const updates = [];
        const args = [];

        if (role !== undefined) {
            updates.push('role = ?');
            args.push(role);
        }
        if (is_premium !== undefined) {
            updates.push('is_premium = ?');
            args.push(is_premium ? 1 : 0);
        }

        if (updates.length > 0) {
            args.push(id);
            await db.execute({
                sql: `UPDATE profiles SET ${updates.join(', ')} WHERE id = ?`,
                args
            });
        }

        const result = await db.execute({
            sql: 'SELECT * FROM profiles WHERE id = ?',
            args: [id]
        });

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Benutzer nicht gefunden' });
        }

        const user = {
            ...result.rows[0],
            is_premium: Boolean(result.rows[0].is_premium)
        };

        res.json({ user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

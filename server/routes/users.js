import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { db, isDemo, supabaseAdmin } from '../server.js';

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

// POST /api/users — create a new user
router.post('/', async (req, res) => {
    const { name, email, password, role, is_premium } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'E-Mail und Passwort sind erforderlich' });
    }

    try {
        let userId;

        if (supabaseAdmin) {
            // 1. Create user in Supabase Auth
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { name }
            });

            if (authError) throw authError;
            userId = authData.user.id;
        } else {
            // Local fallback without Supabase Auth keys
            userId = 'dev-' + Date.now();
        }

        // 2. Insert profile into Turso
        try {
            await db.execute({
                sql: `
                    INSERT INTO profiles (id, name, role, is_premium, streak, created_at)
                    VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
                    ON CONFLICT(id) DO UPDATE SET
                        role = excluded.role,
                        is_premium = excluded.is_premium
                `,
                args: [userId, name || email, role || 'user', is_premium ? 1 : 0]
            });

            // Note: Since Turso schema might not have an email column for profiles,
            // we will add it dynamically in the response or try to update if it exists.
            try {
                // Try to store email if the column exists (might fail if it doesn't, we ignore it)
                await db.execute({
                    sql: 'UPDATE profiles SET email = ? WHERE id = ?',
                    args: [email, userId]
                });
            } catch (ignore) { }

        } catch (dbError) {
            console.error("Error creating profile in Turso:", dbError);
            throw new Error('Benutzer (Auth) wurde erstellt, aber das Profil konnte nicht in der Datenbank (Turso) angelegt werden.');
        }

        const result = await db.execute({
            sql: 'SELECT * FROM profiles WHERE id = ?',
            args: [userId]
        });

        const userProfile = {
            ...result.rows[0],
            email, // Let's append email for the UI
            is_premium: Boolean(result.rows[0].is_premium)
        };

        res.status(201).json({ user: userProfile });
    } catch (err) {
        // Map common Supabase errors
        if (err.message && err.message.includes('User already registered')) {
            return res.status(400).json({ error: 'Ein Benutzer mit dieser E-Mail existiert bereits.' });
        }
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

// DELETE /api/users/:id — delete a user
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        if (isDemo) {
            return res.status(400).json({ error: 'Im Demo-Modus können keine Benutzer gelöscht werden.' });
        }

        // 1. Delete from Supabase Auth if it's configured
        if (supabaseAdmin) {
            const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
            if (authError) {
                console.error("Error deleting user from Auth:", authError);
                // We might still want to proceed to delete the profile, but usually they are linked.
                // Let's throw if it fails, unless it's a "user not found" error.
                if (!authError.message.includes('not found')) {
                    throw authError;
                }
            }
        }

        // 2. Delete from Turso DB
        await db.execute({
            sql: 'DELETE FROM profiles WHERE id = ?',
            args: [id]
        });

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

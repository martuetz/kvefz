import { supabaseAdmin, db } from '../server.js';

export async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Kein Zugriffstoken' });
    }

    const token = authHeader.split(' ')[1];

    // 1. Support for Demo/Test token in Turso mode
    if (token === 'demo-token') {
        req.userId = 'demo-user-001';
        try {
            const result = await db.execute({
                sql: 'SELECT * FROM profiles WHERE id = ?',
                args: [req.userId]
            });
            req.profile = result.rows[0];
            return next();
        } catch (err) {
            console.error('Demo Auth Fehler:', err.message);
        }
    }

    // 2. Supabase Auth + Turso Profile
    if (supabaseAdmin) {
        try {
            const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
            if (error || !user) return res.status(401).json({ error: 'Ungültiges Token' });
            req.user = user;

            // Fetch profile from Turso
            const result = await db.execute({
                sql: 'SELECT * FROM profiles WHERE id = ?',
                args: [user.id]
            });

            if (result.rows.length === 0) {
                // Auto-create profile in Turso if it doesn't exist yet (first time login)
                const name = user.user_metadata?.name || user.email;
                await db.execute({
                    sql: 'INSERT INTO profiles (id, email, name, role) VALUES (?, ?, ?, ?)',
                    args: [user.id, user.email, name, 'user']
                });
                const newProfile = await db.execute({
                    sql: 'SELECT * FROM profiles WHERE id = ?',
                    args: [user.id]
                });
                req.profile = newProfile.rows[0];
            } else {
                req.profile = result.rows[0];
            }

            return next();
        } catch (err) {
            console.error('Supabase Auth-Integration Fehler:', err.message);
            return res.status(401).json({ error: 'Authentifizierung fehlgeschlagen' });
        }
    }

    return res.status(401).json({ error: 'Authentifizierung fehlgeschlagen oder nicht konfiguriert' });
}

export function adminMiddleware(req, res, next) {
    if (req.profile?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin-Rechte erforderlich' });
    }
    next();
}

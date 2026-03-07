import { supabaseAdmin, isDemo, demoStore } from '../server.js';

export async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Kein Zugriffstoken' });
    }

    const token = authHeader.split(' ')[1];

    // Demo mode: accept demo tokens
    if (isDemo) {
        if (token === 'demo-token') {
            req.userId = 'demo-user-001';
            req.profile = demoStore.profiles.find(p => p.id === 'demo-user-001');
            return next();
        }
        return res.status(401).json({ error: 'Ungültiges Demo-Token' });
    }

    // Supabase mode
    try {
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        if (error || !user) return res.status(401).json({ error: 'Ungültiges Token' });
        req.user = user;

        const { data: profile } = await supabaseAdmin
            .from('profiles').select('*').eq('id', user.id).single();
        req.profile = profile;
        next();
    } catch {
        res.status(401).json({ error: 'Authentifizierung fehlgeschlagen' });
    }
}

export function adminMiddleware(req, res, next) {
    if (req.profile?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin-Rechte erforderlich' });
    }
    next();
}

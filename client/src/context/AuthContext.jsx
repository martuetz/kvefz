import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../api/supabase';

const AuthContext = createContext(null);

// Demo users for local development (no Supabase needed)
const DEMO_USERS = {
    'michael@uetz.com': {
        password: 'admin',
        id: 'demo-user-001',
        email: 'michael@uetz.com',
        name: 'Michael Uetz',
        role: 'admin',
        is_premium: true,
        streak: 5,
    }
};

const isDemo = !import.meta.env.VITE_SUPABASE_URL ||
    import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isDemo) {
            // Check for saved demo session
            const saved = localStorage.getItem('demo_user');
            if (saved) {
                const parsed = JSON.parse(saved);
                setUser(parsed);
                setProfile(parsed);
            }
            setLoading(false);
            return;
        }

        // Real Supabase auth
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                localStorage.setItem('access_token', session.access_token);
                fetchProfile(session.user.id);
            }
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                localStorage.setItem('access_token', session.access_token);
                fetchProfile(session.user.id);
            } else {
                localStorage.removeItem('access_token');
                setProfile(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    async function fetchProfile(userId) {
        const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
        setProfile(data);
    }

    async function signUp(email, password, name) {
        if (isDemo) {
            const demoUser = { id: 'demo-' + Date.now(), email, name, role: 'user', is_premium: false, streak: 0 };
            DEMO_USERS[email] = { password, ...demoUser };
            return { user: demoUser };
        }
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
        if (error) throw error;
        return data;
    }

    async function signIn(email, password) {
        if (isDemo) {
            const demoUser = DEMO_USERS[email];
            if (!demoUser || demoUser.password !== password) {
                throw new Error('Ungültige Anmeldedaten. Bitte überprüfe E-Mail und Passwort.');
            }
            const userData = { ...demoUser };
            delete userData.password;
            setUser(userData);
            setProfile(userData);
            localStorage.setItem('demo_user', JSON.stringify(userData));
            localStorage.setItem('access_token', 'demo-token');
            return { user: userData };
        }
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    }

    async function signInWithGoogle() {
        if (isDemo) {
            alert('Google-Login ist im Demo-Modus nicht verfügbar. Nutze E-Mail/Passwort.');
            return;
        }
        const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
        if (error) throw error;
        return data;
    }

    async function signOut() {
        if (isDemo) {
            setUser(null);
            setProfile(null);
            localStorage.removeItem('demo_user');
            localStorage.removeItem('access_token');
            return;
        }
        await supabase.auth.signOut();
    }

    const value = {
        user,
        profile,
        loading,
        isDemo,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        isAdmin: profile?.role === 'admin',
        isPremium: profile?.is_premium || false,
        refreshProfile: () => user && !isDemo && fetchProfile(user.id),
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};

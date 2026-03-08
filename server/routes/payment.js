import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { db } from '../server.js';

const router = Router();

// POST /api/payment/checkout - create Stripe checkout session
router.post('/checkout', authMiddleware, async (req, res) => {
    try {
        const userId = req.user?.id || req.userId;

        // Stripe is optional – check if configured
        if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_your-stripe-key') {
            return res.status(503).json({
                error: 'Stripe ist noch nicht konfiguriert. Bitte Stripe API-Keys in .env setzen.',
            });
        }

        const stripe = (await import('stripe')).default(process.env.STRIPE_SECRET_KEY);
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'chf',
                    product_data: {
                        name: 'EFZ-Prüfungsvorbereitung Premium',
                        description: 'Voller Zugang zu allen Fragen, Prüfungssimulationen und Lernkarten',
                    },
                    unit_amount: 7900, // CHF 79.00
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${req.headers.origin || 'http://localhost:5173'}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.origin || 'http://localhost:5173'}/premium`,
            metadata: { user_id: userId },
        });

        res.json({ url: session.url });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/payment/webhook - Stripe webhook
router.post('/webhook', async (req, res) => {
    try {
        const event = req.body;
        if (event.type === 'checkout.session.completed') {
            const userId = event.data?.object?.metadata?.user_id;
            if (userId) {
                await db.execute({
                    sql: 'UPDATE profiles SET is_premium = 1 WHERE id = ?',
                    args: [userId]
                });
                console.log(`✅ User ${userId} upgraded to premium via Turso`);
            }
        }
        res.json({ received: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

export default router;

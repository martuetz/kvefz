const API_BASE = '/api';

async function request(endpoint, options = {}) {
    const token = localStorage.getItem('access_token');
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Netzwerkfehler' }));
        throw new Error(err.error || `Fehler ${res.status}`);
    }
    return res.json();
}

export const api = {
    // Questions
    getQuestions: (params = {}) => {
        const q = new URLSearchParams(params).toString();
        return request(`/questions${q ? `?${q}` : ''}`);
    },
    getQuestion: (id) => request(`/questions/${id}`),
    createQuestion: (data) => request('/questions', { method: 'POST', body: JSON.stringify(data) }),
    updateQuestion: (id, data) => request(`/questions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteQuestion: (id) => request(`/questions/${id}`, { method: 'DELETE' }),

    // Sessions
    createSession: (data) => request('/sessions', { method: 'POST', body: JSON.stringify(data) }),
    submitSession: (id, data) => request(`/sessions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    getSessions: () => request('/sessions'),

    // Progress
    getProgress: () => request('/progress'),
    getStreak: () => request('/progress/streak'),

    // Payment
    createCheckout: () => request('/payment/checkout', { method: 'POST' }),
};

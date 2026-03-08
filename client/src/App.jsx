import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { lazy, Suspense } from 'react';
import Navbar from './components/Navbar';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy-loaded pages for code splitting
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const QuizPage = lazy(() => import('./pages/QuizPage'));
const ExamPage = lazy(() => import('./pages/ExamPage'));
const FlashcardsPage = lazy(() => import('./pages/FlashcardsPage'));
const TopicsPage = lazy(() => import('./pages/TopicsPage'));
const ProgressPage = lazy(() => import('./pages/ProgressPage'));
const TipsPage = lazy(() => import('./pages/TipsPage'));
const AdminQuestionsPage = lazy(() => import('./pages/AdminQuestionsPage'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));
const PremiumPage = lazy(() => import('./pages/PremiumPage'));

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <LoadingSpinner />;
    return user ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
    const { user, isAdmin, loading } = useAuth();
    if (loading) return <LoadingSpinner />;
    if (!user) return <Navigate to="/login" />;
    return isAdmin ? children : <Navigate to="/dashboard" />;
}

export default function App() {
    return (
        <>
            <Navbar />
            <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                    <Route path="/quiz" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
                    <Route path="/exam" element={<ProtectedRoute><ExamPage /></ProtectedRoute>} />
                    <Route path="/flashcards" element={<ProtectedRoute><FlashcardsPage /></ProtectedRoute>} />
                    <Route path="/topics" element={<ProtectedRoute><TopicsPage /></ProtectedRoute>} />
                    <Route path="/progress" element={<ProtectedRoute><ProgressPage /></ProtectedRoute>} />
                    <Route path="/tips" element={<ProtectedRoute><TipsPage /></ProtectedRoute>} />
                    <Route path="/premium" element={<ProtectedRoute><PremiumPage /></ProtectedRoute>} />
                    <Route path="/admin/questions" element={<AdminRoute><AdminQuestionsPage /></AdminRoute>} />
                    <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
                    <Route path="/admin" element={<Navigate to="/admin/questions" />} />
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                </Routes>
            </Suspense>
        </>
    );
}

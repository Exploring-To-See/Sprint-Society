import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { PageTransition } from './components/ui/PageTransition';
import { HomePage } from './pages/HomePage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { CoachingPage } from './pages/CoachingPage';
import { RunHistoryPage } from './pages/RunHistoryPage';
import { SharePage } from './pages/SharePage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';
import { StravaCallbackPage } from './pages/StravaCallbackPage';
import { TrainingPage } from './pages/TrainingPage';
import { TrainPage } from './pages/TrainPage';
import { ProgressPage } from './pages/ProgressPage';
import { HRZonesPage } from './pages/HRZonesPage';
import { RecordsPage } from './pages/RecordsPage';
import { FeedPage } from './pages/FeedPage';
import { ChatPage } from './pages/ChatPage';
import { EventsPage } from './pages/EventsPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { CommunitiesPage } from './pages/CommunitiesPage';
import { CommunityDetailPage } from './pages/CommunityDetailPage';
import { CreateCommunityPage } from './pages/CreateCommunityPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { SubscriptionPage } from './pages/SubscriptionPage';
import { AIProfilingPage } from './pages/AIProfilingPage';
import { AIProfilePage } from './pages/AIProfilePage';
import { LandingPage } from './pages/LandingPage';

const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));

function ProtectedRoute({ children, skipProfilingCheck }: { children: React.ReactNode; skipProfilingCheck?: boolean }) {
  const { user, loading } = useAuth();
  const location = window.location.pathname;
  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="animate-pulse text-4xl">⚡</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="animate-pulse text-4xl">⚡</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;
  if ((user as any).role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="animate-pulse text-4xl">⚡</div>
      </div>
    );
  }
  if (user) {
    if ((user as any).role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PublicRoute><PageTransition><HomePage /></PageTransition></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><PageTransition><RegisterPage /></PageTransition></PublicRoute>} />
        <Route path="/forgot-password" element={<PageTransition><Suspense fallback={null}><ForgotPasswordPage /></Suspense></PageTransition>} />
        <Route path="/reset-password/:token" element={<PageTransition><Suspense fallback={null}><ResetPasswordPage /></Suspense></PageTransition>} />
        <Route path="/join" element={<PageTransition><LandingPage /></PageTransition>} />
        <Route path="/founding" element={<PageTransition><LandingPage /></PageTransition>} />
        <Route path="/strava/callback" element={<StravaCallbackPage />} />
        <Route path="/admin" element={<AdminRoute><PageTransition><AdminPage /></PageTransition></AdminRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><PageTransition><DashboardPage /></PageTransition></ProtectedRoute>} />
        <Route path="/coaching" element={<ProtectedRoute><PageTransition><CoachingPage /></PageTransition></ProtectedRoute>} />
        <Route path="/training" element={<ProtectedRoute><PageTransition><TrainingPage /></PageTransition></ProtectedRoute>} />
        <Route path="/train" element={<ProtectedRoute><PageTransition><TrainPage /></PageTransition></ProtectedRoute>} />
        <Route path="/progress" element={<ProtectedRoute><PageTransition><ProgressPage /></PageTransition></ProtectedRoute>} />
        <Route path="/runs" element={<ProtectedRoute><PageTransition><RunHistoryPage /></PageTransition></ProtectedRoute>} />
        <Route path="/share" element={<ProtectedRoute><PageTransition><SharePage /></PageTransition></ProtectedRoute>} />
        <Route path="/heart-rate" element={<ProtectedRoute><PageTransition><HRZonesPage /></PageTransition></ProtectedRoute>} />
        <Route path="/records" element={<ProtectedRoute><PageTransition><RecordsPage /></PageTransition></ProtectedRoute>} />
        <Route path="/feed" element={<ProtectedRoute><PageTransition><FeedPage /></PageTransition></ProtectedRoute>} />
        <Route path="/events" element={<ProtectedRoute><PageTransition><EventsPage /></PageTransition></ProtectedRoute>} />
        <Route path="/events/:id" element={<ProtectedRoute><PageTransition><EventDetailPage /></PageTransition></ProtectedRoute>} />
        <Route path="/communities" element={<ProtectedRoute><PageTransition><CommunitiesPage /></PageTransition></ProtectedRoute>} />
        <Route path="/communities/create" element={<ProtectedRoute><PageTransition><CreateCommunityPage /></PageTransition></ProtectedRoute>} />
        <Route path="/communities/:id" element={<ProtectedRoute><PageTransition><CommunityDetailPage /></PageTransition></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><PageTransition><ChatPage /></PageTransition></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><PageTransition><NotificationsPage /></PageTransition></ProtectedRoute>} />
        <Route path="/subscription" element={<ProtectedRoute><PageTransition><SubscriptionPage /></PageTransition></ProtectedRoute>} />
        <Route path="/profiling" element={<ProtectedRoute><PageTransition><AIProfilingPage /></PageTransition></ProtectedRoute>} />
        <Route path="/ai-profile" element={<ProtectedRoute><PageTransition><AIProfilePage /></PageTransition></ProtectedRoute>} />
        <Route path="/user/:id" element={<ProtectedRoute><PageTransition><UserProfilePage /></PageTransition></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><PageTransition><ProfilePage /></PageTransition></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ErrorBoundary>
  );
}

import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
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
  return (
    <Routes>
      <Route path="/" element={<PublicRoute><HomePage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<Suspense fallback={null}><ForgotPasswordPage /></Suspense>} />
      <Route path="/reset-password/:token" element={<Suspense fallback={null}><ResetPasswordPage /></Suspense>} />
      <Route path="/join" element={<LandingPage />} />
      <Route path="/founding" element={<LandingPage />} />
      <Route path="/strava/callback" element={<StravaCallbackPage />} />
      <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/coaching" element={<ProtectedRoute><CoachingPage /></ProtectedRoute>} />
      <Route path="/training" element={<ProtectedRoute><TrainingPage /></ProtectedRoute>} />
      <Route path="/train" element={<ProtectedRoute><TrainPage /></ProtectedRoute>} />
      <Route path="/progress" element={<ProtectedRoute><ProgressPage /></ProtectedRoute>} />
      <Route path="/runs" element={<ProtectedRoute><RunHistoryPage /></ProtectedRoute>} />
      <Route path="/share" element={<ProtectedRoute><SharePage /></ProtectedRoute>} />
      <Route path="/heart-rate" element={<ProtectedRoute><HRZonesPage /></ProtectedRoute>} />
      <Route path="/records" element={<ProtectedRoute><RecordsPage /></ProtectedRoute>} />
      <Route path="/feed" element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
      <Route path="/events" element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
      <Route path="/events/:id" element={<ProtectedRoute><EventDetailPage /></ProtectedRoute>} />
      <Route path="/communities" element={<ProtectedRoute><CommunitiesPage /></ProtectedRoute>} />
      <Route path="/communities/create" element={<ProtectedRoute><CreateCommunityPage /></ProtectedRoute>} />
      <Route path="/communities/:id" element={<ProtectedRoute><CommunityDetailPage /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      <Route path="/subscription" element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />
      <Route path="/profiling" element={<ProtectedRoute><AIProfilingPage /></ProtectedRoute>} />
      <Route path="/ai-profile" element={<ProtectedRoute><AIProfilePage /></ProtectedRoute>} />
      <Route path="/user/:id" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
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

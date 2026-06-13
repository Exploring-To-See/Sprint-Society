import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { ErrorToast } from './components/ui/ErrorToast';
import { PageTransition } from './components/ui/PageTransition';
import { HomePage } from './pages/HomePage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { LandingPage } from './pages/LandingPage';

// Lazy-loaded pages (code splitting)
const RunHistoryPage = lazy(() => import('./pages/RunHistoryPage').then(m => ({ default: m.RunHistoryPage })));
const SharePage = lazy(() => import('./pages/SharePage').then(m => ({ default: m.SharePage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })));
const TrainPage = lazy(() => import('./pages/TrainPage').then(m => ({ default: m.TrainPage })));
const ProgressPage = lazy(() => import('./pages/ProgressPage').then(m => ({ default: m.ProgressPage })));
const HRZonesPage = lazy(() => import('./pages/HRZonesPage').then(m => ({ default: m.HRZonesPage })));
const RecordsPage = lazy(() => import('./pages/RecordsPage').then(m => ({ default: m.RecordsPage })));
const CoachPage = lazy(() => import('./pages/CoachPage').then(m => ({ default: m.CoachPage })));
const SocialPage = lazy(() => import('./pages/SocialPage').then(m => ({ default: m.SocialPage })));
const SetGoalPage = lazy(() => import('./pages/SetGoalPage').then(m => ({ default: m.SetGoalPage })));
const PlanPage = lazy(() => import('./pages/PlanPage').then(m => ({ default: m.PlanPage })));
const EventsPage = lazy(() => import('./pages/EventsPage').then(m => ({ default: m.EventsPage })));
const EventDetailPage = lazy(() => import('./pages/EventDetailPage').then(m => ({ default: m.EventDetailPage })));
const CommunitiesPage = lazy(() => import('./pages/CommunitiesPage').then(m => ({ default: m.CommunitiesPage })));
const CommunityDetailPage = lazy(() => import('./pages/CommunityDetailPage').then(m => ({ default: m.CommunityDetailPage })));
const CreateCommunityPage = lazy(() => import('./pages/CreateCommunityPage').then(m => ({ default: m.CreateCommunityPage })));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const UserProfilePage = lazy(() => import('./pages/UserProfilePage').then(m => ({ default: m.UserProfilePage })));
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage').then(m => ({ default: m.SubscriptionPage })));
const AIProfilingPage = lazy(() => import('./pages/AIProfilingPage').then(m => ({ default: m.AIProfilingPage })));
const AIProfilePage = lazy(() => import('./pages/AIProfilePage').then(m => ({ default: m.AIProfilePage })));
const RunTrackerPage = lazy(() => import('./pages/RunTrackerPage').then(m => ({ default: m.RunTrackerPage })));
const ChallengesPage = lazy(() => import('./pages/ChallengesPage'));
const RewardsPage = lazy(() => import('./pages/RewardsPage').then(m => ({ default: m.RewardsPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));

function LazyLoad({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg-primary">
        <div className="max-w-lg mx-auto px-4 pt-16 space-y-4 animate-pulse">
          <div className="h-5 w-32 bg-bg-tertiary rounded" />
          <div className="h-[120px] w-full bg-bg-tertiary/50 rounded-xl" />
          <div className="h-[80px] w-full bg-bg-tertiary/50 rounded-xl" />
          <div className="h-[80px] w-full bg-bg-tertiary/50 rounded-xl" />
        </div>
      </div>
    }>
      {children}
    </Suspense>
  );
}

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
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
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
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
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
        <Route path="/forgot-password" element={<PageTransition><LazyLoad><ForgotPasswordPage /></LazyLoad></PageTransition>} />
        <Route path="/reset-password/:token" element={<PageTransition><LazyLoad><ResetPasswordPage /></LazyLoad></PageTransition>} />
        <Route path="/join" element={<PageTransition><LandingPage /></PageTransition>} />
        <Route path="/founding" element={<PageTransition><LandingPage /></PageTransition>} />
        <Route path="/run/track" element={<ProtectedRoute><PageTransition><LazyLoad><RunTrackerPage /></LazyLoad></PageTransition></ProtectedRoute>} />
        <Route path="/admin" element={<AdminRoute><PageTransition><LazyLoad><AdminPage /></LazyLoad></PageTransition></AdminRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><PageTransition><DashboardPage /></PageTransition></ProtectedRoute>} />
        <Route path="/coach" element={<ProtectedRoute><PageTransition><LazyLoad><CoachPage /></LazyLoad></PageTransition></ProtectedRoute>} />
        <Route path="/social" element={<ProtectedRoute><PageTransition><LazyLoad><SocialPage /></LazyLoad></PageTransition></ProtectedRoute>} />
        <Route path="/set-goal" element={<ProtectedRoute><PageTransition><LazyLoad><SetGoalPage /></LazyLoad></PageTransition></ProtectedRoute>} />
        <Route path="/plan" element={<ProtectedRoute><PageTransition><LazyLoad><PlanPage /></LazyLoad></PageTransition></ProtectedRoute>} />
        {/* Redirects for old routes */}
        <Route path="/coaching" element={<Navigate to="/coach" replace />} />
        <Route path="/training" element={<Navigate to="/coach" replace />} />
        <Route path="/train" element={<Navigate to="/coach" replace />} />
        <Route path="/progress" element={<ProtectedRoute><PageTransition><LazyLoad><ProgressPage /></LazyLoad></PageTransition></ProtectedRoute>} />
        <Route path="/runs" element={<ProtectedRoute><PageTransition><LazyLoad><RunHistoryPage /></LazyLoad></PageTransition></ProtectedRoute>} />
        <Route path="/share" element={<ProtectedRoute><PageTransition><LazyLoad><SharePage /></LazyLoad></PageTransition></ProtectedRoute>} />
        <Route path="/heart-rate" element={<ProtectedRoute><PageTransition><LazyLoad><HRZonesPage /></LazyLoad></PageTransition></ProtectedRoute>} />
        <Route path="/records" element={<ProtectedRoute><PageTransition><LazyLoad><RecordsPage /></LazyLoad></PageTransition></ProtectedRoute>} />
        <Route path="/feed" element={<Navigate to="/social" replace />} />
        <Route path="/events" element={<ProtectedRoute><PageTransition><LazyLoad><EventsPage /></LazyLoad></PageTransition></ProtectedRoute>} />
        <Route path="/events/:id" element={<ProtectedRoute><PageTransition><LazyLoad><EventDetailPage /></LazyLoad></PageTransition></ProtectedRoute>} />
        <Route path="/communities" element={<ProtectedRoute><PageTransition><LazyLoad><CommunitiesPage /></LazyLoad></PageTransition></ProtectedRoute>} />
        <Route path="/communities/create" element={<ProtectedRoute><PageTransition><LazyLoad><CreateCommunityPage /></LazyLoad></PageTransition></ProtectedRoute>} />
        <Route path="/communities/:id" element={<ProtectedRoute><PageTransition><LazyLoad><CommunityDetailPage /></LazyLoad></PageTransition></ProtectedRoute>} />
        <Route path="/chat" element={<Navigate to="/coach" replace />} />
        <Route path="/challenges" element={<ProtectedRoute><PageTransition><LazyLoad><ChallengesPage /></LazyLoad></PageTransition></ProtectedRoute>} />
        <Route path="/rewards" element={<ProtectedRoute><PageTransition><LazyLoad><RewardsPage /></LazyLoad></PageTransition></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><PageTransition><LazyLoad><NotificationsPage /></LazyLoad></PageTransition></ProtectedRoute>} />
        <Route path="/subscription" element={<ProtectedRoute><PageTransition><LazyLoad><SubscriptionPage /></LazyLoad></PageTransition></ProtectedRoute>} />
        <Route path="/profiling" element={<ProtectedRoute><PageTransition><LazyLoad><AIProfilingPage /></LazyLoad></PageTransition></ProtectedRoute>} />
        <Route path="/ai-profile" element={<ProtectedRoute><PageTransition><LazyLoad><AIProfilePage /></LazyLoad></PageTransition></ProtectedRoute>} />
        <Route path="/user/:id" element={<ProtectedRoute><PageTransition><LazyLoad><UserProfilePage /></LazyLoad></PageTransition></ProtectedRoute>} />
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
        <ErrorToast />
        <AppRoutes />
      </AuthProvider>
    </ErrorBoundary>
  );
}

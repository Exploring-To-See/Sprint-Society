// Home (/dashboard) — the redesigned home screen on ss-base: greeting + stat strip,
// tier bar, today's-session hero (readiness orb), instrument stats, pace trend,
// recent runs, athlete card and challenges. All data hooks preserved from the old
// Dashboard (batch /dashboard + per-tile queries).
import { Dashboard } from '../components/dashboard/Dashboard';
import { SSScreen } from '../components/ss/SSScreen';

export function DashboardPage() {
  return (
    <SSScreen active="home" bodyLabel="Home">
      <Dashboard />
    </SSScreen>
  );
}

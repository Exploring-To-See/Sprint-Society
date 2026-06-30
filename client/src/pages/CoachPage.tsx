// AI Coach (/coach) — the locked shell + a single segmented sub-tab control
// (Chat · Plan · Insights · Zones · Records). Look from Home/ss-base; data/behavior from
// the real routes wired inside each sub-tab component. Readiness is the centerpiece of Insights.
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { SSScreen } from '../components/ss/SSScreen';
import { SSSeg } from '../components/ss/SSSeg';
import { CoachChat } from '../components/coach/CoachChat';
import { CoachPlan } from '../components/coach/CoachPlan';
import { CoachInsights } from '../components/coach/CoachInsights';
import { CoachZones } from '../components/coach/CoachZones';
import { CoachRecords } from '../components/coach/CoachRecords';
import { CoachRecovery } from '../components/coach/CoachRecovery';

type CoachSubTab = 'chat' | 'plan' | 'insights' | 'zones' | 'records' | 'recovery';

const TABS: { key: CoachSubTab; label: string }[] = [
  { key: 'chat', label: 'Chat' },
  { key: 'plan', label: 'Plan' },
  { key: 'insights', label: 'Insights' },
  { key: 'recovery', label: 'Recovery' },
  { key: 'zones', label: 'Zones' },
  { key: 'records', label: 'Records' },
];

export function CoachPage() {
  const location = useLocation();
  const initial = ((location.state as { tab?: CoachSubTab } | null)?.tab) || 'chat';
  const [tab, setTab] = useState<CoachSubTab>(initial);

  return (
    <SSScreen active="coach" flush={tab === 'chat'} bodyLabel="AI Coach">
      <div
        style={{ position: 'sticky', top: 50, zIndex: 15, padding: '6px 16px 10px', background: 'linear-gradient(180deg,var(--bg) 58%,transparent)' }}
      >
        <SSSeg items={TABS} value={tab} onChange={setTab} layoutId="coach-subtab" ariaLabel="Coach sections" testid="coach-tab" />
      </div>

      {tab === 'chat' && <CoachChat />}
      {tab === 'plan' && <CoachPlan />}
      {tab === 'insights' && <CoachInsights />}
      {tab === 'recovery' && <CoachRecovery />}
      {tab === 'zones' && <CoachZones />}
      {tab === 'records' && <CoachRecords />}
    </SSScreen>
  );
}

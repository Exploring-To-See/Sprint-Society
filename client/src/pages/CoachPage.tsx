import { useState, lazy, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { TrainTab } from '../components/coach/TrainTab';
import { ChatTab } from '../components/coach/ChatTab';
import { AIAnalyticsTab } from '../components/coach/AIAnalyticsTab';

const HRZonesPage = lazy(() => import('./HRZonesPage').then(m => ({ default: m.HRZonesPage })));
const RecordsPage = lazy(() => import('./RecordsPage').then(m => ({ default: m.RecordsPage })));

type CoachSubTab = 'chat' | 'plan' | 'insights' | 'zones' | 'records';

const TABS: { key: CoachSubTab; label: string }[] = [
  { key: 'chat', label: 'Chat' },
  { key: 'plan', label: 'Plan' },
  { key: 'insights', label: 'Insights' },
  { key: 'zones', label: 'Zones' },
  { key: 'records', label: 'Records' },
];

export function CoachPage() {
  const location = useLocation();
  const initialTab = (location.state as any)?.tab || 'chat';
  const [activeTab, setActiveTab] = useState<CoachSubTab>(initialTab);

  return (
    <AppShell>
      {/* Sub-tabs — horizontally scrollable on small screens */}
      <div className="flex gap-1 overflow-x-auto scrollbar-none -mx-4 px-4 pb-2 mb-3">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`shrink-0 px-4 py-2 text-[12px] font-bold rounded-lg transition-all ${
              activeTab === tab.key
                ? 'bg-accent text-white'
                : 'bg-bg-secondary border border-bg-tertiary text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'chat' && <ChatTab />}
      {activeTab === 'plan' && <TrainTab />}
      {activeTab === 'insights' && <AIAnalyticsTab />}
      {activeTab === 'zones' && (
        <Suspense fallback={<div className="h-[200px] rounded-xl bg-bg-secondary animate-pulse" />}>
          <div className="-mx-4 -mt-2"><HRZonesPage embedded /></div>
        </Suspense>
      )}
      {activeTab === 'records' && (
        <Suspense fallback={<div className="h-[200px] rounded-xl bg-bg-secondary animate-pulse" />}>
          <div className="-mx-4 -mt-2"><RecordsPage embedded /></div>
        </Suspense>
      )}
    </AppShell>
  );
}

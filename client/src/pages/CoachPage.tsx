import { useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { TrainTab } from '../components/coach/TrainTab';
import { ChatTab } from '../components/coach/ChatTab';
import { AIAnalyticsTab } from '../components/coach/AIAnalyticsTab';

type CoachSubTab = 'train' | 'chat' | 'analytics';

export function CoachPage() {
  const [activeTab, setActiveTab] = useState<CoachSubTab>('train');

  return (
    <AppShell>
      {/* Sub-tabs */}
      <div className="flex bg-bg-secondary rounded-lg p-[3px] border border-bg-tertiary mb-4">
        {(['train', 'chat', 'analytics'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-center text-[11px] font-bold rounded-md transition-all ${
              activeTab === tab
                ? 'bg-accent text-white'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab === 'train' ? 'Train' : tab === 'chat' ? 'Chat' : 'AI Analytics'}
          </button>
        ))}
      </div>

      {activeTab === 'train' && <TrainTab />}
      {activeTab === 'chat' && <ChatTab />}
      {activeTab === 'analytics' && <AIAnalyticsTab />}
    </AppShell>
  );
}

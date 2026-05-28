import { useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { FeedTab } from '../components/social/FeedTab';
import { CommunitiesTab } from '../components/social/CommunitiesTab';

type SocialSubTab = 'feed' | 'communities';

export function SocialPage() {
  const [activeTab, setActiveTab] = useState<SocialSubTab>('feed');

  return (
    <AppShell>
      {/* Sub-tabs */}
      <div className="flex bg-bg-secondary rounded-lg p-[3px] border border-bg-tertiary mb-4">
        <button
          onClick={() => setActiveTab('feed')}
          className={`flex-1 py-2 text-center text-[11px] font-bold rounded-md transition-all ${
            activeTab === 'feed' ? 'bg-accent text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Feed
        </button>
        <button
          onClick={() => setActiveTab('communities')}
          className={`flex-1 py-2 text-center text-[11px] font-bold rounded-md transition-all ${
            activeTab === 'communities' ? 'bg-accent text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Communities
        </button>
      </div>

      {activeTab === 'feed' && <FeedTab />}
      {activeTab === 'communities' && <CommunitiesTab />}
    </AppShell>
  );
}

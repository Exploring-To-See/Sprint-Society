import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-primary pb-20">
      <main className="max-w-lg mx-auto px-5 pt-5 pb-4">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

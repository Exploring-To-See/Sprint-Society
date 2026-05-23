import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { ChatFAB } from '../chat/ChatFAB';
import { FeedbackButton } from '../FeedbackButton';

interface AppShellProps {
  children: ReactNode;
  hideNav?: boolean;
}

export function AppShell({ children, hideNav }: AppShellProps) {
  return (
    <div className={`min-h-screen bg-bg-primary ${hideNav ? '' : 'pb-20'}`}>
      <main className="max-w-lg mx-auto px-4 pt-5 pb-4">
        {children}
      </main>
      {!hideNav && (
        <>
          <FeedbackButton />
          <ChatFAB />
          <BottomNav />
        </>
      )}
    </div>
  );
}

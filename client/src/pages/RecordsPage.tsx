// /records — standalone Records page. Reuses the Coach Records content inside the locked shell.
import { SSScreen } from '../components/ss/SSScreen';
import { CoachRecords } from '../components/coach/CoachRecords';

export function RecordsPage({ embedded }: { embedded?: boolean } = {}) {
  if (embedded) return <CoachRecords />;
  return (
    <SSScreen active="coach" bodyLabel="Personal records">
      <div className="ss-pad" style={{ marginBottom: 6 }}>
        <p className="tlbl">Performance</p>
        <h1 style={{ font: '600 22px var(--head)', letterSpacing: '-.02em', marginTop: 2 }}>Personal Records</h1>
      </div>
      <CoachRecords />
    </SSScreen>
  );
}

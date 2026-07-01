// /heart-rate — standalone Zones page. Reuses the Coach Zones content inside the locked shell.
import { SSScreen } from '../components/ss/SSScreen';
import { CoachZones } from '../components/coach/CoachZones';

export function HRZonesPage({ embedded }: { embedded?: boolean } = {}) {
  if (embedded) return <CoachZones />;
  return (
    <SSScreen active="coach" bodyLabel="Heart rate zones">
      <div className="ss-pad" style={{ marginBottom: 6 }}>
        <p className="tlbl">Training intelligence</p>
        <h1 style={{ font: '600 22px var(--head)', letterSpacing: '-.02em', marginTop: 2 }}>Heart Rate Zones</h1>
      </div>
      <CoachZones />
    </SSScreen>
  );
}

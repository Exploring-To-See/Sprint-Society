// AI Coach · Records — personal bests. Data from records.routes.ts (GET /records,
// GET /records/timeline). Rank/recency shown via mono numerals + amber PR tag (never
// emoji medals, §15). Most recent race PR is the screen's hero; the rest are list rows.
import { useQuery } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';
import api from '../../lib/api';
import { SSSkeleton, SSEmpty, SSError } from '../ss/SSStates';
import { Medal, Trophy } from '../ss/icons';

interface PR { id: number | string; category: string; formatted?: string; date?: string; improvement?: { formatted?: string } }
interface RecordsData { total_count?: number; race_prs?: PR[]; effort_prs?: PR[] }
interface TimelineEntry { category?: string; value?: string; improvement?: string; date?: string }

function isRecent(date?: string): boolean {
  if (!date) return false;
  return Date.now() - new Date(date).getTime() < 14 * 86400000;
}
function fmtDate(d?: string, withYear = false): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(withYear ? { year: 'numeric' } : {}) });
}

export function CoachRecords() {
  const reduce = useReducedMotion();
  const { data, isLoading, isError, refetch } = useQuery<RecordsData>({ queryKey: ['records'], queryFn: () => api.get('/records').then((r) => r.data) });
  const { data: timeline } = useQuery<{ timeline?: TimelineEntry[] } | null>({ queryKey: ['records-timeline'], queryFn: () => api.get('/records/timeline').then((r) => r.data).catch(() => null) });

  if (isLoading) {
    return (
      <div className="ss-pad" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SSSkeleton height={120} style={{ borderRadius: 22 }} />
        {[0, 1, 2].map((i) => <SSSkeleton key={i} height={66} style={{ borderRadius: 16 }} />)}
      </div>
    );
  }
  if (isError) return <div className="ss-pad"><SSError onRetry={() => refetch()} testid="coach-records-error" /></div>;

  const racePrs = data?.race_prs || [];
  const effortPrs = data?.effort_prs || [];

  if (!data || (data.total_count === 0 && racePrs.length === 0)) {
    return (
      <div className="ss-pad">
        <SSEmpty icon={<Trophy width={22} height={22} />} title="Your records are waiting" body="Log a few runs and your personal bests across 1K to the marathon will appear here automatically." testid="coach-records-empty" />
      </div>
    );
  }

  const [hero, ...rest] = racePrs;

  return (
    <div className="ss-pad" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* HERO PR — centerpiece */}
      {hero && (
        <section className="ss-surface ss-hero ss-rise" style={{ borderRadius: 22, padding: 16, display: 'flex', alignItems: 'center', gap: 16 }} data-testid="coach-records-hero">
          <div className="ticon" style={{ width: 54, height: 54, borderRadius: 16, background: 'rgba(251,191,36,.14)', borderColor: 'rgba(251,191,36,.28)', color: 'var(--amber)' }}>
            <Medal width={26} height={26} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="slbl">{hero.category.replace('Best ', '')} best</span>
              {isRecent(hero.date) && <span className="ss-prtag">New</span>}
            </div>
            <div style={{ font: '700 30px var(--mono)', color: '#fff', fontVariantNumeric: 'tabular-nums', lineHeight: 1.05, marginTop: 4 }}>{hero.formatted}</div>
            <div style={{ font: '500 11px var(--mono)', color: 'var(--muted)', marginTop: 4 }}>
              {fmtDate(hero.date, true)}{hero.improvement?.formatted ? <span style={{ color: 'var(--green)' }}> · −{hero.improvement.formatted}</span> : null}
            </div>
          </div>
        </section>
      )}

      {/* RACE PRs LIST */}
      {rest.length > 0 && (
        <section className="ss-rise" style={{ animationDelay: '.1s' }}>
          <p className="tlbl" style={{ marginBottom: 9, paddingLeft: 2 }}>Race distances</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rest.map((pr, i) => (
              <motion.div
                key={pr.id}
                className="ss-surface ss-recess"
                style={{ borderRadius: 16, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}
                initial={reduce ? false : { opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 + i * 0.05, type: 'spring', stiffness: 240, damping: 26 }}
                data-testid="coach-record-row"
              >
                <span className="runico" style={{ flex: 'none' }}><Medal width={15} height={15} style={{ color: 'var(--muted)' }} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ font: '600 13px var(--body)', color: 'var(--fg)' }}>{pr.category.replace('Best ', '')}</span>
                    {isRecent(pr.date) && <span className="ss-prtag">New</span>}
                  </div>
                  <span style={{ font: '500 10.5px var(--mono)', color: 'var(--muted-2)' }}>{fmtDate(pr.date, true)}</span>
                </div>
                <div style={{ textAlign: 'right', flex: 'none' }}>
                  <div style={{ font: '700 15px var(--mono)', color: 'var(--fg)', fontVariantNumeric: 'tabular-nums' }}>{pr.formatted}</div>
                  {pr.improvement?.formatted && <div style={{ font: '600 10px var(--mono)', color: 'var(--green)', marginTop: 1 }}>−{pr.improvement.formatted}</div>}
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* EFFORT PRs */}
      {effortPrs.length > 0 && (
        <section className="ss-rise" style={{ animationDelay: '.16s' }}>
          <p className="tlbl" style={{ marginBottom: 9, paddingLeft: 2 }}>Effort records</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {effortPrs.map((pr) => (
              <div key={pr.id} className="ss-surface ss-recess" style={{ borderRadius: 16, padding: 13 }}>
                <p style={{ font: '600 9.5px var(--body)', textTransform: 'uppercase', letterSpacing: 'var(--trk-sm)', color: 'var(--muted-2)', marginBottom: 5 }}>{pr.category}</p>
                <p style={{ font: '700 15px var(--mono)', color: 'var(--fg)', fontVariantNumeric: 'tabular-nums' }}>{pr.formatted}</p>
                <p style={{ font: '500 10px var(--mono)', color: 'var(--muted-2)', marginTop: 3 }}>{fmtDate(pr.date)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TIMELINE */}
      {timeline?.timeline && timeline.timeline.length > 0 && (
        <section className="ss-rise" style={{ animationDelay: '.22s' }}>
          <p className="tlbl" style={{ marginBottom: 10, paddingLeft: 2 }}>PR timeline</p>
          <div style={{ position: 'relative', paddingLeft: 18 }}>
            <div style={{ position: 'absolute', left: 6, top: 4, bottom: 4, width: 1, background: 'var(--hair)' }} aria-hidden="true" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {timeline.timeline.slice(0, 8).map((e, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: -18, top: 3, width: 13, height: 13, borderRadius: '50%', background: 'var(--bg2)', border: '2px solid var(--accent)' }} aria-hidden="true" />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ font: '500 12px var(--body)', color: 'var(--fg)' }}>{e.category}: <span style={{ fontFamily: 'var(--mono)', fontVariantNumeric: 'tabular-nums' }}>{e.value}</span></span>
                    {e.improvement && <span style={{ font: '600 10px var(--mono)', color: 'var(--green)' }}>{e.improvement}</span>}
                  </div>
                  <p style={{ font: '500 10px var(--mono)', color: 'var(--muted-2)', marginTop: 2 }}>{fmtDate(e.date, true)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

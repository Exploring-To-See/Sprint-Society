interface Attendee {
  user_id: number;
  name: string;
  profile_image_url?: string;
}

interface AttendeeAvatarsProps {
  attendees: Attendee[];
  totalCount: number;
  maxShow?: number;
}

export function AttendeeAvatars({ attendees, totalCount, maxShow = 5 }: AttendeeAvatarsProps) {
  const shown = attendees.slice(0, maxShow);
  const remaining = totalCount - shown.length;

  if (shown.length === 0) return null;

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {shown.map((a, i) => (
          <div
            key={a.user_id}
            className="w-7 h-7 rounded-full border-2 border-bg-primary bg-bg-tertiary overflow-hidden flex items-center justify-center"
            style={{ zIndex: maxShow - i }}
          >
            {a.profile_image_url ? (
              <img src={a.profile_image_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[11px] font-bold text-zinc-500">
                {a.name?.[0]?.toUpperCase()}
              </span>
            )}
          </div>
        ))}
        {remaining > 0 && (
          <div className="w-7 h-7 rounded-full border-2 border-bg-primary bg-bg-secondary flex items-center justify-center">
            <span className="text-[11px] font-bold text-zinc-500">+{remaining}</span>
          </div>
        )}
      </div>
    </div>
  );
}

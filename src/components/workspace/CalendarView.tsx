import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Video } from 'lucide-react';

export interface CrmMeeting {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  attendees?: string;
  notes?: string;
}

interface CalendarViewProps {
  meetings: CrmMeeting[];
  isDark: boolean;
  defaultView?: 'month' | 'week';
  weekStartsOn?: 'sunday' | 'monday';
  onCreate: (meeting: Omit<CrmMeeting, 'id'>) => Promise<void>;
}

const toDateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const startOfWeek = (date: Date, weekStartsOn: 'sunday' | 'monday') => {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const firstDay = weekStartsOn === 'monday' ? 1 : 0;
  start.setDate(start.getDate() - ((start.getDay() - firstDay + 7) % 7));
  return start;
};

export function CalendarView({ meetings, isDark, defaultView = 'month', weekStartsOn = 'sunday', onCreate }: CalendarViewProps) {
  const [visibleDate, setVisibleDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>(defaultView);
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('10:00');
  const [attendees, setAttendees] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setViewMode(defaultView);
  }, [defaultView]);

  const dates = useMemo(() => {
    if (viewMode === 'week') {
      const first = startOfWeek(visibleDate, weekStartsOn);
      return Array.from({ length: 7 }, (_, index) => {
        const date = new Date(first);
        date.setDate(first.getDate() + index);
        return date;
      });
    }
    const first = new Date(visibleDate.getFullYear(), visibleDate.getMonth(), 1);
    const firstDay = weekStartsOn === 'monday' ? 1 : 0;
    first.setDate(first.getDate() - ((first.getDay() - firstDay + 7) % 7));
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(first);
      date.setDate(first.getDate() + index);
      return date;
    });
  }, [viewMode, visibleDate, weekStartsOn]);
  const weekdayLabels = weekStartsOn === 'monday'
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const rangeLabel = viewMode === 'month'
    ? visibleDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : `${dates[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${dates[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
  const panel = `rounded-xl border ${isDark ? 'border-neutral-800 bg-[#0c0d10]' : 'border-neutral-200 bg-white'} shadow-sm`;

  const shiftRange = (direction: number) => {
    setVisibleDate((current) => {
      const next = new Date(current);
      if (viewMode === 'month') next.setMonth(next.getMonth() + direction);
      else next.setDate(next.getDate() + direction * 7);
      return next;
    });
  };

  const submitMeeting = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    setError(null);
    setIsSaving(true);
    const startsAt = new Date(`${selectedDate}T${time}`);
    const endsAt = new Date(startsAt.getTime() + 30 * 60 * 1000);
    try {
      await onCreate({ title: title.trim(), startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString(), attendees: attendees.trim(), notes: notes.trim() });
      setTitle('');
      setAttendees('');
      setNotes('');
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create meeting.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">Calendar & Meetings</h1>
          <p className="mt-1 text-xs text-neutral-500">Schedule and keep track of customer meetings.</p>
        </div>
        <button onClick={() => { setSelectedDate(toDateKey(new Date())); setShowForm(true); }} className="inline-flex items-center gap-1.5 rounded-md bg-neutral-950 px-3 py-2 text-xs font-bold text-white dark:bg-white dark:text-black">
          <Plus className="h-3.5 w-3.5" /> Schedule meeting
        </button>
      </div>
      <div className={`${panel} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <button aria-label="Previous date range" onClick={() => shiftRange(-1)} className="rounded border border-neutral-200 p-1.5 dark:border-neutral-700"><ChevronLeft className="h-4 w-4" /></button>
            <button aria-label="Next date range" onClick={() => shiftRange(1)} className="rounded border border-neutral-200 p-1.5 dark:border-neutral-700"><ChevronRight className="h-4 w-4" /></button>
            <button onClick={() => setVisibleDate(new Date())} className="rounded border border-neutral-200 px-2 py-1.5 text-xs dark:border-neutral-700">Today</button>
            <h2 className="ml-2 text-sm font-bold">{rangeLabel}</h2>
          </div>
          <div className="flex rounded-md border border-neutral-200 p-0.5 text-xs dark:border-neutral-700">
            {(['month', 'week'] as const).map((mode) => (
              <button key={mode} onClick={() => setViewMode(mode)} className={`rounded px-2.5 py-1 capitalize ${viewMode === mode ? 'bg-neutral-900 text-white dark:bg-white dark:text-black' : 'text-neutral-500'}`}>{mode}</button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
        <div className="grid min-w-[560px] grid-cols-7">
          {weekdayLabels.map((day) => (
            <div key={day} className="border-b border-neutral-200 px-2 py-2 text-center text-[10px] font-semibold uppercase text-neutral-500 dark:border-neutral-800">{day}</div>
          ))}
          {dates.map((date) => {
            const key = toDateKey(date);
            const dayMeetings = meetings.filter((meeting) => toDateKey(new Date(meeting.startsAt)) === key);
            const inCurrentMonth = date.getMonth() === visibleDate.getMonth();
            return (
              <button
                type="button"
                key={key}
                onClick={() => { setSelectedDate(key); if (viewMode === 'month' && !inCurrentMonth) setVisibleDate(date); setShowForm(true); }}
                className={`min-h-24 border-b border-r border-neutral-100 p-1.5 text-left align-top hover:bg-neutral-50 dark:border-neutral-800/70 dark:hover:bg-white/[0.03] ${viewMode === 'month' && !inCurrentMonth ? 'opacity-40' : ''} ${key === toDateKey(new Date()) ? 'bg-sky-50/70 dark:bg-sky-500/[0.06]' : ''}`}
              >
                <span className={`ml-0.5 text-[11px] ${key === toDateKey(new Date()) ? 'font-bold text-sky-600' : 'text-neutral-500'}`}>{date.getDate()}</span>
                <div className="mt-1 space-y-1">
                  {dayMeetings.slice(0, 2).map((meeting) => (
                    <div key={meeting.id} className="truncate rounded bg-indigo-100 px-1.5 py-1 text-[10px] font-medium text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-200">
                      {new Date(meeting.startsAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} {meeting.title}
                    </div>
                  ))}
                  {dayMeetings.length > 2 && <p className="px-1 text-[9px] text-neutral-500">+{dayMeetings.length - 2} more</p>}
                </div>
              </button>
            );
          })}
        </div>
        </div>
      </div>
      <div className={`${panel} p-4`}>
        <h2 className="mb-3 text-sm font-bold">Upcoming meetings</h2>
        {meetings.filter((meeting) => new Date(meeting.startsAt).getTime() >= Date.now()).sort((a, b) => a.startsAt.localeCompare(b.startsAt)).slice(0, 6).length === 0 ? (
          <p className="text-xs text-neutral-500">No upcoming meetings. Select a date or schedule one to get started.</p>
        ) : (
          <div className="space-y-2">
            {meetings.filter((meeting) => new Date(meeting.startsAt).getTime() >= Date.now()).sort((a, b) => a.startsAt.localeCompare(b.startsAt)).slice(0, 6).map((meeting) => (
              <div key={meeting.id} className="flex items-center gap-3 rounded-lg bg-neutral-50 p-3 dark:bg-white/[0.03]">
                <Video className="h-4 w-4 text-indigo-500" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold">{meeting.title}</p>
                  <p className="mt-0.5 text-[10px] text-neutral-500">{new Date(meeting.startsAt).toLocaleString()}{meeting.attendees ? ` · ${meeting.attendees}` : ''}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(event) => { if (event.target === event.currentTarget && !isSaving) setShowForm(false); }}>
          <form onSubmit={submitMeeting} className={`${panel} w-full max-w-md space-y-3 p-5`}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold">Schedule meeting</h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-xs text-neutral-500">Close</button>
            </div>
            {error && <p role="alert" className="rounded bg-red-50 p-2 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p>}
            <label className="block text-xs">Title<input required autoFocus value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 w-full rounded border border-neutral-300 bg-transparent p-2 dark:border-neutral-700" placeholder="Quarterly business review" /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs">Date<input required type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="mt-1 w-full rounded border border-neutral-300 bg-transparent p-2 dark:border-neutral-700" /></label>
              <label className="block text-xs">Start time<input required type="time" value={time} onChange={(event) => setTime(event.target.value)} className="mt-1 w-full rounded border border-neutral-300 bg-transparent p-2 dark:border-neutral-700" /></label>
            </div>
            <label className="block text-xs">Attendees<input value={attendees} onChange={(event) => setAttendees(event.target.value)} className="mt-1 w-full rounded border border-neutral-300 bg-transparent p-2 dark:border-neutral-700" placeholder="Names or email addresses" /></label>
            <label className="block text-xs">Notes<textarea rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-1 w-full rounded border border-neutral-300 bg-transparent p-2 dark:border-neutral-700" /></label>
            <button disabled={isSaving} className="w-full rounded bg-neutral-950 px-3 py-2 text-xs font-bold text-white disabled:opacity-50 dark:bg-white dark:text-black">{isSaving ? 'Saving…' : 'Save meeting'}</button>
          </form>
        </div>
      )}
    </section>
  );
}

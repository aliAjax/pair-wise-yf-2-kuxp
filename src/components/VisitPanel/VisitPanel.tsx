import { useState } from 'react';
import { CalendarCheck, Flame, PencilLine, CheckCircle2 } from 'lucide-react';
import { useBenchStore } from '@/store/useBenchStore';
import type { Bench } from '@/types';
import {
  todayKey,
  toDateKey,
  getVisits,
  getVisitCount,
  getCurrentStreak,
  sortVisitsDesc,
  formatRelativeVisit,
} from '@/utils/visits';

interface VisitPanelProps {
  bench: Bench;
}

export default function VisitPanel({ bench }: VisitPanelProps) {
  const upsertVisit = useBenchStore((state) => state.upsertVisit);

  const visits = getVisits(bench);
  const visitCount = getVisitCount(bench);
  const streak = getCurrentStreak(bench);
  const showStreak = streak >= 3;

  const today = todayKey();
  const minDate = toDateKey(new Date(bench.createdAt));

  const [date, setDate] = useState(today);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [justSaved, setJustSaved] = useState(false);

  // 当前选中日期已有的记录（同一天可再次提交以覆盖备注）
  const existingVisit = visits.find((v) => v.date === date);

  const handleDateChange = (value: string) => {
    setDate(value);
    setError('');
    setJustSaved(false);
    const found = visits.find((v) => v.date === value);
    setNote(found ? found.note : '');
  };

  const handleQuickToday = () => {
    handleDateChange(today);
  };

  const handleSubmit = () => {
    const result = upsertVisit(bench.id, date, note);
    if (result.ok === true) {
      setError('');
      setJustSaved(true);
      setNote('');
    } else {
      setJustSaved(false);
      setError(result.reason);
    }
  };

  const sortedVisits = sortVisitsDesc(visits);

  return (
    <div className="paper-texture rounded-xl shadow-paper p-6 fade-in opacity-0 stagger-3">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-lg font-semibold text-deep-brown flex items-center gap-2">
          <CalendarCheck className="w-5 h-5 text-moss-green" />
          到访记录
        </h2>
        {showStreak && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-orange-600 text-xs font-medium rounded-full border border-orange-200/60">
            <Flame className="w-3.5 h-3.5" />
            连续到访 {streak} 天
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-3xl font-bold font-serif text-moss-green">{visitCount}</span>
        <span className="text-sm text-ink-light">次到访</span>
        {existingVisit && (
          <span className="ml-auto text-xs text-ochre flex items-center gap-1">
            <PencilLine className="w-3 h-3" />
            当天已有记录，提交将覆盖备注
          </span>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="block text-xs text-ink-light mb-1">到访日期</label>
            <input
              type="date"
              value={date}
              min={minDate}
              max={today}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white/60 border border-deep-brown/10 rounded-lg text-deep-brown focus:bg-white transition-colors"
            />
          </div>
          <button
            type="button"
            onClick={handleQuickToday}
            className="px-3 py-2 text-sm text-moss-green bg-moss-green/10 hover:bg-moss-green/20 rounded-lg transition-colors whitespace-nowrap h-[38px]"
          >
            今天坐过
          </button>
        </div>

        <div>
          <label className="block text-xs text-ink-light mb-1">一句感受</label>
          <textarea
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setJustSaved(false);
            }}
            placeholder="今天坐在这儿感觉如何？"
            rows={2}
            maxLength={100}
            className="w-full px-3 py-2 text-sm bg-white/60 border border-deep-brown/10 rounded-lg text-deep-brown placeholder:text-ink-light/60 focus:bg-white resize-none"
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}
        {justSaved && (
          <p className="text-xs text-moss-green flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {existingVisit ? '当天备注已更新' : '到访已记录'}
          </p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          className="w-full px-4 py-2.5 bg-moss-green text-white text-sm font-medium rounded-lg hover:bg-moss-light transition-colors shadow-sm"
        >
          {existingVisit ? '更新当天备注' : '记一笔到访'}
        </button>
      </div>

      {sortedVisits.length > 0 && (
        <div className="mt-5 pt-4 border-t border-deep-brown/10">
          <h3 className="text-xs font-medium text-ink-light mb-3">历史到访</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {sortedVisits.map((visit) => (
              <button
                key={visit.date}
                type="button"
                onClick={() => handleDateChange(visit.date)}
                className="w-full text-left p-3 bg-warm-cream/50 rounded-lg hover:bg-warm-cream transition-colors"
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-sm font-medium text-deep-brown">
                    {formatRelativeVisit(visit.date)}
                  </span>
                  <span className="text-xs text-ink-light/60">{visit.date}</span>
                </div>
                {visit.note && (
                  <p className="text-xs text-ink-light leading-relaxed line-clamp-2">
                    {visit.note}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

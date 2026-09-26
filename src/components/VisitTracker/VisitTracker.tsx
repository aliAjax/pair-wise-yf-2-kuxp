import { useEffect, useState } from 'react';
import { CalendarCheck, Flame, History, Trash2 } from 'lucide-react';
import type { Bench } from '@/types';
import { useBenchStore } from '@/store/useBenchStore';
import {
  getVisits,
  getVisitCount,
  getVisitStreak,
  getTodayKey,
  getVisitByDate,
  formatVisitDate,
} from '@/utils/visits';

interface VisitTrackerProps {
  bench: Bench;
}

export default function VisitTracker({ bench }: VisitTrackerProps) {
  const recordVisit = useBenchStore((state) => state.recordVisit);
  const deleteVisit = useBenchStore((state) => state.deleteVisit);

  const [visitDate, setVisitDate] = useState(getTodayKey());
  const [visitNote, setVisitNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const visits = getVisits(bench);
  const visitCount = getVisitCount(bench);
  const streak = getVisitStreak(bench);
  const today = getTodayKey();
  const existingForDate = getVisitByDate(bench, visitDate);
  const minDate = bench.createdAt.slice(0, 10);

  // 切换日期时，自动带出当天已有的备注（同一天再提交即覆盖）
  useEffect(() => {
    const record = getVisitByDate(bench, visitDate);
    setVisitNote(record?.note ?? '');
    setError(null);
    setHint(record ? '这一天已经有记录，保存会覆盖当天的备注' : null);
  }, [bench, visitDate]);

  const sortedVisits = [...visits].sort((a, b) => (a.date < b.date ? 1 : -1));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const result = recordVisit(bench.id, visitDate, visitNote);
    if (result) {
      setError(result);
      return;
    }

    setError(null);
    // 回到“今天”，便于连续记录；备注与提示由日期联动 effect 更新
    setVisitDate(today);
  };

  const handleDelete = (date: string) => {
    deleteVisit(bench.id, date);
    setPendingDelete(null);
    if (date === visitDate) {
      setVisitNote('');
      setHint(null);
    }
  };

  return (
    <div className="paper-texture rounded-xl shadow-paper p-6 fade-in opacity-0 stagger-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-lg font-semibold text-deep-brown flex items-center gap-2">
          <CalendarCheck className="w-5 h-5 text-moss-green" />
          到访记录
        </h2>
        {streak >= 3 && (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-500/10 text-orange-600 rounded-full text-xs font-medium">
            <Flame className="w-3.5 h-3.5" />
            连续 {streak} 天
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="text-center p-3 bg-moss-green/5 rounded-lg">
          <div className="text-xl font-bold text-moss-green font-serif">{visitCount}</div>
          <div className="text-xs text-ink-light mt-0.5 flex items-center justify-center gap-1">
            <History className="w-3 h-3" />
            累计到访
          </div>
        </div>
        <div className="text-center p-3 bg-ochre/5 rounded-lg">
          <div className="text-xl font-bold text-ochre font-serif">{streak}</div>
          <div className="text-xs text-ink-light mt-0.5 flex items-center justify-center gap-1">
            <Flame className="w-3 h-3" />
            连续天数
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 mb-5">
        <div>
          <label className="block text-xs font-medium text-deep-brown mb-1.5">
            到访日期
          </label>
          <input
            type="date"
            value={visitDate}
            max={today}
            min={minDate}
            onChange={(e) => setVisitDate(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white/50 border border-deep-brown/10 rounded-lg text-deep-brown focus:bg-white transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-deep-brown mb-1.5">
            一句感受（选填）
          </label>
          <textarea
            value={visitNote}
            onChange={(e) => setVisitNote(e.target.value)}
            placeholder="今天在这张长椅上感觉如何？"
            rows={2}
            maxLength={200}
            className="w-full px-3 py-2 text-sm bg-white/50 border border-deep-brown/10 rounded-lg text-deep-brown placeholder:text-ink-light/60 focus:bg-white transition-colors resize-none"
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}
        {!error && hint && <p className="text-xs text-moss-green">{hint}</p>}

        <button
          type="submit"
          className="w-full px-4 py-2.5 bg-moss-green text-white rounded-lg text-sm font-medium hover:bg-moss-light transition-colors"
        >
          {visitDate === today ? '记录今天坐过' : '保存到访记录'}
        </button>
        {existingForDate && (
          <p className="text-xs text-ochre text-center">
            这一天已有记录，保存将覆盖当天备注
          </p>
        )}
      </form>

      <div>
        <h3 className="text-xs font-semibold text-ink-light mb-2">历史到访</h3>
        {sortedVisits.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {sortedVisits.map((visit) => (
              <div
                key={visit.date}
                className="group p-3 bg-warm-cream/50 rounded-lg hover:bg-warm-cream transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-deep-brown whitespace-nowrap">
                    {visit.date === today ? '今天' : formatVisitDate(visit.date)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(visit.date)}
                    className="p-1 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                    aria-label="删除该天到访记录"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {visit.note && (
                  <p className="text-xs text-ink-light leading-relaxed mt-1">{visit.note}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-ink-light/70 text-center py-4">
            还没有到访记录，散步回来记一笔吧
          </p>
        )}
      </div>

      {pendingDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="paper-texture rounded-xl shadow-paper-hover p-6 max-w-sm w-full fade-in">
            <h3 className="font-serif text-lg font-semibold text-deep-brown mb-2">
              删除到访记录
            </h3>
            <p className="text-ink-light text-sm mb-6">
              确定要删除 {pendingDelete === today ? '今天' : formatVisitDate(pendingDelete)} 的到访记录吗？
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setPendingDelete(null)}
                className="flex-1 px-4 py-2 text-sm text-deep-brown bg-warm-beige hover:bg-warm-beige/80 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(pendingDelete)}
                className="flex-1 px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

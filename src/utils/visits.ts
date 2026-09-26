import type { Bench, BenchVisit } from '@/types';

/** 将 Date 按本地时区转为 YYYY-MM-DD */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 今天的日期键（本地时区） */
export function getTodayKey(): string {
  return toDateKey(new Date());
}

/** 解析 YYYY-MM-DD 为本地日期；月日超出范围时返回 Invalid Date */
function parseDateKey(key: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return new Date(NaN);
  const [, yStr, mStr, dStr] = match;
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);
  if (m < 1 || m > 12 || d < 1 || d > 31) return new Date(NaN);

  const date = new Date(y, m - 1, d);
  // 拒绝 2 月 30 日这类 JS 会自动进位的日期
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    return new Date(NaN);
  }
  return date;
}

/** 偏移 n 天的日期键，n 为负数表示往前 */
export function shiftDateKey(key: string, days: number): string {
  const date = parseDateKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

/** 安全取到访列表：旧档案没有记录时按空（零次）处理 */
export function getVisits(bench: Bench): BenchVisit[] {
  return Array.isArray(bench.visits) ? bench.visits : [];
}

/** 累计到访次数（同一天只算一次） */
export function getVisitCount(bench: Bench): number {
  return new Set(getVisits(bench).map((visit) => visit.date)).size;
}

/** 最近到访日期，没有记录返回 null */
export function getLatestVisitKey(bench: Bench): string | null {
  const dates = getVisits(bench).map((visit) => visit.date);
  if (dates.length === 0) return null;
  return dates.reduce((latest, cur) => (cur > latest ? cur : latest));
}

/** 取某一天的到访记录 */
export function getVisitByDate(bench: Bench, dateKey: string): BenchVisit | undefined {
  return getVisits(bench).find((visit) => visit.date === dateKey);
}

/**
 * 到访日期校验：
 * - 必须是合法日期
 * - 不接受未来日期
 * - 不接受早于档案创建日的时间（按天比较，创建当天可以记录）
 * 返回错误提示文案，合法时返回 null。
 */
export function validateVisitDate(dateKey: string, bench: Bench): string | null {
  const selected = parseDateKey(dateKey);
  if (Number.isNaN(selected.getTime())) {
    return '请选择有效的日期';
  }

  const today = parseDateKey(getTodayKey());
  if (selected.getTime() > today.getTime()) {
    return '不能记录未来的到访日期';
  }

  const created = new Date(bench.createdAt);
  const createdDay = new Date(created.getFullYear(), created.getMonth(), created.getDate());
  if (selected.getTime() < createdDay.getTime()) {
    return `不能早于档案创建日期（${toDateKey(createdDay)}）`;
  }

  return null;
}

/**
 * 截至今天的连续到访天数：从今天往前数，遇到没有到访记录的日期即停止。
 * 今天没来过则为 0。
 */
export function getVisitStreak(bench: Bench): number {
  const visited = new Set(getVisits(bench).map((v) => v.date));
  if (visited.size === 0) return 0;

  let streak = 0;
  let cursor = getTodayKey();
  while (visited.has(cursor)) {
    streak += 1;
    cursor = shiftDateKey(cursor, -1);
  }
  return streak;
}

/** 是否满足“连续三天到访”的持续标记 */
export function hasStreakBadge(bench: Bench): boolean {
  return getVisitStreak(bench) >= 3;
}

/** YYYY-MM-DD -> M月D日 */
export function formatVisitDate(dateKey: string): string {
  const [, m, d] = dateKey.split('-').map(Number);
  return `${m}月${d}日`;
}

/** 最近到访的相对描述，如“今天 / 昨天 / 3天前 / 9月20日” */
export function formatLatestVisit(bench: Bench): string | null {
  const latest = getLatestVisitKey(bench);
  if (!latest) return null;

  const today = getTodayKey();
  if (latest === today) return '今天来过';
  if (latest === shiftDateKey(today, -1)) return '昨天来过';
  if (latest === shiftDateKey(today, -2)) return '前天来过';

  const dayDiff = Math.round(
    (parseDateKey(today).getTime() - parseDateKey(latest).getTime()) / 86400000
  );
  if (dayDiff > 2 && dayDiff <= 7) return `${dayDiff}天前来过`;
  return formatVisitDate(latest);
}

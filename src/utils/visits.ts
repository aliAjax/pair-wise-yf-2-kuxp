import type { Bench, Visit } from '@/types';

/**
 * 把 Date 转成本地时区的日期键 YYYY-MM-DD。
 * toISOString 是 UTC 时间，直接截取会在东八区把晚上算成后一天，所以用本地分量拼接。
 */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

/** 日期键加减天数，返回新的日期键 */
export function shiftDateKey(key: string, deltaDays: number): string {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d + deltaDays);
  return toDateKey(date);
}

/** 取得访记录列表，旧档案没有 visits 字段时按零次处理 */
export function getVisits(bench: Bench): Visit[] {
  return Array.isArray(bench.visits) ? bench.visits : [];
}

/** 累计到访次数（一天至多一条） */
export function getVisitCount(bench: Bench): number {
  return getVisits(bench).length;
}

/** 最近到访日期键，无记录返回 null */
export function getLatestVisitKey(bench: Bench): string | null {
  const visits = getVisits(bench);
  if (visits.length === 0) return null;
  return visits.reduce((max, v) => (v.date > max ? v.date : max), visits[0].date);
}

/** 日期键转中文展示，如 2026年9月26日 */
export function formatVisitDate(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return `${y}年${m}月${d}日`;
}

/**
 * 相对今天的友好描述：今天 / 昨天 / 前天，否则返回中文日期。
 */
export function formatRelativeVisit(key: string | null): string {
  if (!key) return '';
  const today = todayKey();
  if (key === today) return '今天';
  if (key === shiftDateKey(today, -1)) return '昨天';
  if (key === shiftDateKey(today, -2)) return '前天';
  return formatVisitDate(key);
}

/**
 * 连续到访天数：以最近一次到访（今天或昨天）为起点往前数连续的天数。
 * 最近一次记录早于昨天则连续已中断，返回 0。
 */
export function getCurrentStreak(bench: Bench): number {
  const latest = getLatestVisitKey(bench);
  if (!latest) return 0;

  const today = todayKey();
  let anchor: string;
  if (latest === today || latest === shiftDateKey(today, -1)) {
    anchor = latest;
  } else {
    return 0;
  }

  const dates = new Set(getVisits(bench).map((v) => v.date));
  let streak = 0;
  let cursor = anchor;
  while (dates.has(cursor)) {
    streak += 1;
    cursor = shiftDateKey(cursor, -1);
  }
  return streak;
}

/** 是否满足“连续三天到访”的持续标记 */
export function hasThreeDayStreak(bench: Bench): boolean {
  return getCurrentStreak(bench) >= 3;
}

export type VisitValidationResult =
  | { valid: true }
  | { valid: false; reason: string };

/**
 * 校验到访日期：
 * - 不能是未来日期
 * - 不能早于档案创建日期
 * - 必须是合法的 YYYY-MM-DD
 */
export function validateVisitDate(
  dateKey: string,
  bench: Bench,
): VisitValidationResult {
  const value = dateKey.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return { valid: false, reason: '请选择到访日期' };
  }
  const [y, m, d] = value.split('-').map(Number);
  const parsed = new Date(y, m - 1, d);
  if (
    parsed.getFullYear() !== y ||
    parsed.getMonth() !== m - 1 ||
    parsed.getDate() !== d
  ) {
    return { valid: false, reason: '到访日期不合法' };
  }

  if (value > todayKey()) {
    return { valid: false, reason: '不能记录未来的到访日期' };
  }

  const createdKey = toDateKey(new Date(bench.createdAt));
  if (value < createdKey) {
    return {
      valid: false,
      reason: `到访日期不能早于档案创建日期（${formatVisitDate(createdKey)}）`,
    };
  }

  return { valid: true };
}

/** 按日期倒序排列到访记录，最近的在前 */
export function sortVisitsDesc(visits: Visit[]): Visit[] {
  return [...visits].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

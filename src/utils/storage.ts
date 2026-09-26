import type { Bench } from '@/types';
import { getVisits } from '@/utils/visits';

const STORAGE_KEY = 'bench-archive-data';

/**
 * 兼容旧档案：补齐缺失字段。旧档案没有到访记录时 visits 置为空数组（按零次处理），
 * 这样后续逻辑不必到处判空，旧数据也能自然获得新功能。
 */
function normalizeBench(bench: Bench): Bench {
  return {
    ...bench,
    experiences: Array.isArray(bench.experiences) ? bench.experiences : [],
    visits: getVisits(bench),
  };
}

export function loadBenches(): Bench[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed: unknown = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return (parsed as Bench[]).map(normalizeBench);
      }
    }
  } catch (error) {
    console.error('Failed to load benches from localStorage:', error);
  }
  return [];
}

export function saveBenches(benches: Bench[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(benches));
  } catch (error) {
    console.error('Failed to save benches to localStorage:', error);
  }
}

export function clearBenches(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear benches from localStorage:', error);
  }
}

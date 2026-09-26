export type MaterialType = 'wood' | 'metal' | 'stone' | 'plastic' | 'mixed';
export type OrientationType = 'east' | 'south' | 'west' | 'north' | 'southeast' | 'northeast' | 'southwest' | 'northwest';
export type ShadeLevelType = 'none' | 'partial' | 'full';
export type NoiseLevelType = 'quiet' | 'moderate' | 'noisy';
export type StayDurationType = 'short' | 'medium' | 'long' | 'verylong';
export type TimePeriodType = 'morning' | 'noon' | 'afternoon' | 'evening' | 'night';

export interface BenchExperience {
  id: string;
  benchId: string;
  timePeriod: TimePeriodType;
  notes: string;
  rating: number;
}

export interface Visit {
  /** 到访日期，本地时区 YYYY-MM-DD，同一长椅同一天唯一 */
  date: string;
  /** 当天的一句感受 */
  note: string;
  /** 首次创建该日期记录的时间，ISO 字符串；覆盖备注时保持不变 */
  createdAt: string;
  /** 最近一次更新（覆盖备注）的时间，ISO 字符串 */
  updatedAt: string;
}

export interface Bench {
  id: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  material: MaterialType;
  orientation: OrientationType;
  hasBackrest: boolean;
  shadeLevel: ShadeLevelType;
  noiseLevel: NoiseLevelType;
  stayDuration: StayDurationType;
  rating: number;
  review: string;
  experiences: BenchExperience[];
  /** 到访记录；旧档案可能缺失，读取时按空数组（零次）处理 */
  visits?: Visit[];
  createdAt: string;
  updatedAt: string;
}

export const MATERIAL_LABELS: Record<MaterialType, string> = {
  wood: '木质',
  metal: '金属',
  stone: '石质',
  plastic: '塑料',
  mixed: '混合材质',
};

export const ORIENTATION_LABELS: Record<OrientationType, string> = {
  east: '东',
  south: '南',
  west: '西',
  north: '北',
  southeast: '东南',
  northeast: '东北',
  southwest: '西南',
  northwest: '西北',
};

export const SHADE_LABELS: Record<ShadeLevelType, string> = {
  none: '无遮阴',
  partial: '部分遮阴',
  full: '完全遮阴',
};

export const NOISE_LABELS: Record<NoiseLevelType, string> = {
  quiet: '安静',
  moderate: '一般',
  noisy: '嘈杂',
};

export const STAY_DURATION_LABELS: Record<StayDurationType, string> = {
  short: '少于15分钟',
  medium: '15-30分钟',
  long: '30-60分钟',
  verylong: '1小时以上',
};

export const TIME_PERIOD_LABELS: Record<TimePeriodType, string> = {
  morning: '早晨',
  noon: '中午',
  afternoon: '下午',
  evening: '傍晚',
  night: '夜晚',
};

export const TIME_PERIOD_ICONS: Record<TimePeriodType, string> = {
  morning: 'sunrise',
  noon: 'sun',
  afternoon: 'cloud-sun',
  evening: 'sunset',
  night: 'moon',
};

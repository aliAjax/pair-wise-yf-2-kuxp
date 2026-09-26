import { create } from 'zustand';
import type { Bench, BenchExperience, MaterialType, OrientationType, ShadeLevelType, NoiseLevelType, Visit } from '@/types';
import { loadBenches, saveBenches } from '@/utils/storage';
import { generateId } from '@/utils/comfort';
import { getVisits, validateVisitDate } from '@/utils/visits';
import { mockBenches } from '@/data/mockBenches';

/** 旧档案（含内置 mock 数据）没有到访记录时按零次补齐 */
function withVisits(bench: Bench): Bench {
  return { ...bench, visits: getVisits(bench) };
}

interface BenchState {
  benches: Bench[];
  searchQuery: string;
  materialFilter: MaterialType | null;
  orientationFilter: OrientationType | null;
  shadeFilter: ShadeLevelType | null;
  noiseFilter: NoiseLevelType | null;
  initialized: boolean;
}

interface BenchActions {
  initialize: () => void;
  setSearchQuery: (query: string) => void;
  setMaterialFilter: (material: MaterialType | null) => void;
  setOrientationFilter: (orientation: OrientationType | null) => void;
  setShadeFilter: (shade: ShadeLevelType | null) => void;
  setNoiseFilter: (noise: NoiseLevelType | null) => void;
  clearFilters: () => void;
  addBench: (bench: Omit<Bench, 'id' | 'createdAt' | 'updatedAt' | 'experiences' | 'visits'>) => void;
  updateBench: (id: string, updates: Partial<Bench>) => void;
  deleteBench: (id: string) => void;
  getBenchById: (id: string) => Bench | undefined;
  addExperience: (benchId: string, experience: Omit<BenchExperience, 'id' | 'benchId'>) => void;
  updateExperience: (benchId: string, expId: string, updates: Partial<BenchExperience>) => void;
  deleteExperience: (benchId: string, expId: string) => void;
  /**
   * 记录一次到访：同一长椅同一天只保留一条，晚提交的会覆盖当天备注。
   * 日期不合法（未来 / 早于档案创建）时返回失败原因，不修改数据。
   */
  upsertVisit: (benchId: string, date: string, note: string) => { ok: true } | { ok: false; reason: string };
  getFilteredBenches: () => Bench[];
}

const initialState: BenchState = {
  benches: [],
  searchQuery: '',
  materialFilter: null,
  orientationFilter: null,
  shadeFilter: null,
  noiseFilter: null,
  initialized: false,
};

export const useBenchStore = create<BenchState & BenchActions>((set, get) => ({
  ...initialState,

  initialize: () => {
    const stored = loadBenches();
    if (stored.length > 0) {
      set({ benches: stored, initialized: true });
    } else {
      const seeded = mockBenches.map(withVisits);
      set({ benches: seeded, initialized: true });
      saveBenches(seeded);
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setMaterialFilter: (material) => set({ materialFilter: material }),
  setOrientationFilter: (orientation) => set({ orientationFilter: orientation }),
  setShadeFilter: (shade) => set({ shadeFilter: shade }),
  setNoiseFilter: (noise) => set({ noiseFilter: noise }),

  clearFilters: () => set({
    searchQuery: '',
    materialFilter: null,
    orientationFilter: null,
    shadeFilter: null,
    noiseFilter: null,
  }),

  addBench: (benchData) => {
    const now = new Date().toISOString();
    const newBench: Bench = {
      ...benchData,
      id: generateId(),
      experiences: [],
      visits: [],
      createdAt: now,
      updatedAt: now,
    };
    const newBenches = [newBench, ...get().benches];
    set({ benches: newBenches });
    saveBenches(newBenches);
  },

  updateBench: (id, updates) => {
    const newBenches = get().benches.map((bench) =>
      bench.id === id
        ? { ...bench, ...updates, updatedAt: new Date().toISOString() }
        : bench
    );
    set({ benches: newBenches });
    saveBenches(newBenches);
  },

  deleteBench: (id) => {
    const newBenches = get().benches.filter((bench) => bench.id !== id);
    set({ benches: newBenches });
    saveBenches(newBenches);
  },

  getBenchById: (id) => {
    return get().benches.find((bench) => bench.id === id);
  },

  addExperience: (benchId, experienceData) => {
    const newExperience: BenchExperience = {
      ...experienceData,
      id: generateId(),
      benchId,
    };
    const newBenches = get().benches.map((bench) =>
      bench.id === benchId
        ? {
            ...bench,
            experiences: [...bench.experiences, newExperience],
            updatedAt: new Date().toISOString(),
          }
        : bench
    );
    set({ benches: newBenches });
    saveBenches(newBenches);
  },

  updateExperience: (benchId, expId, updates) => {
    const newBenches = get().benches.map((bench) =>
      bench.id === benchId
        ? {
            ...bench,
            experiences: bench.experiences.map((exp) =>
              exp.id === expId ? { ...exp, ...updates } : exp
            ),
            updatedAt: new Date().toISOString(),
          }
        : bench
    );
    set({ benches: newBenches });
    saveBenches(newBenches);
  },

  deleteExperience: (benchId, expId) => {
    const newBenches = get().benches.map((bench) =>
      bench.id === benchId
        ? {
            ...bench,
            experiences: bench.experiences.filter((exp) => exp.id !== expId),
            updatedAt: new Date().toISOString(),
          }
        : bench
    );
    set({ benches: newBenches });
    saveBenches(newBenches);
  },

  upsertVisit: (benchId, date, note) => {
    const bench = get().benches.find((b) => b.id === benchId);
    if (!bench) {
      return { ok: false, reason: '未找到该长椅档案' };
    }

    const dateKey = date.trim();
    const validation = validateVisitDate(dateKey, bench);
    if (validation.valid === false) {
      return { ok: false, reason: validation.reason };
    }

    const trimmedNote = note.trim();
    const now = new Date().toISOString();
    const existing = getVisits(bench).find((v) => v.date === dateKey);
    const visit: Visit = existing
      ? // 同一天晚提交：覆盖当天备注，保留首次创建时间
        { ...existing, note: trimmedNote, updatedAt: now }
      : { date: dateKey, note: trimmedNote, createdAt: now, updatedAt: now };

    const visits = existing
      ? getVisits(bench).map((v) => (v.date === dateKey ? visit : v))
      : [...getVisits(bench), visit];

    const newBenches = get().benches.map((b) =>
      b.id === benchId ? { ...b, visits, updatedAt: now } : b,
    );
    set({ benches: newBenches });
    saveBenches(newBenches);
    return { ok: true };
  },

  getFilteredBenches: () => {
    const { benches, searchQuery, materialFilter, orientationFilter, shadeFilter, noiseFilter } = get();
    
    return benches.filter((bench) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchName = bench.name.toLowerCase().includes(query);
        const matchLocation = bench.location.toLowerCase().includes(query);
        const matchReview = bench.review.toLowerCase().includes(query);
        if (!matchName && !matchLocation && !matchReview) return false;
      }
      
      if (materialFilter && bench.material !== materialFilter) return false;
      if (orientationFilter && bench.orientation !== orientationFilter) return false;
      if (shadeFilter && bench.shadeLevel !== shadeFilter) return false;
      if (noiseFilter && bench.noiseLevel !== noiseFilter) return false;
      
      return true;
    });
  },
}));

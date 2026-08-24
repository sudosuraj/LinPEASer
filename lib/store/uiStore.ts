import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Confidence, FindingCategory, Severity } from '@/types';

export type ReportView = 'overview' | 'findings' | 'sections' | 'raw';
export type Theme = 'light' | 'dark';

interface UiState {
  activeView: ReportView;
  activeSectionId: string | null;
  theme: Theme;
  sidebarCollapsed: boolean;
  /** Off-canvas sidebar drawer state on small screens; never persisted. */
  mobileNavOpen: boolean;
  lineWrap: boolean;
  severityFilter: Severity[];
  categoryFilter: FindingCategory[];
  confidenceFilter: Confidence[];
  sectionFilterId: string | null;
  findingsQuery: string;
  commandPaletteOpen: boolean;
  readSectionIds: Set<string>;
  expandedSectionIds: Set<string>;
  /** Line index the raw output view should scroll to next, then clear. */
  pendingRawLineJump: number | null;

  setActiveView: (view: ReportView) => void;
  setActiveSectionId: (id: string | null) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  /** Sets the active section and expands its ancestor chain in one step. */
  navigateToSection: (id: string, ancestorIds: string[]) => void;
  toggleSectionExpanded: (id: string) => void;
  toggleSidebarCollapsed: () => void;
  setMobileNavOpen: (open: boolean) => void;
  toggleLineWrap: () => void;
  setSeverityFilter: (severities: Severity[]) => void;
  setCategoryFilter: (categories: FindingCategory[]) => void;
  setConfidenceFilter: (levels: Confidence[]) => void;
  setSectionFilterId: (id: string | null) => void;
  setFindingsQuery: (query: string) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setPendingRawLineJump: (index: number | null) => void;
  markSectionRead: (id: string) => void;
  resetFilters: () => void;
  resetForNewScan: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      activeView: 'overview',
      activeSectionId: null,
      theme: 'light',
      sidebarCollapsed: false,
      mobileNavOpen: false,
      lineWrap: true,
      severityFilter: [],
      categoryFilter: [],
      confidenceFilter: [],
      sectionFilterId: null,
      findingsQuery: '',
      commandPaletteOpen: false,
      readSectionIds: new Set<string>(),
      expandedSectionIds: new Set<string>(),
      pendingRawLineJump: null,

      setActiveView: (activeView) => set({ activeView }),
      setActiveSectionId: (activeSectionId) => set({ activeSectionId }),
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      navigateToSection: (id, ancestorIds) =>
        set((s) => {
          const next = new Set(s.expandedSectionIds);
          next.add(id);
          for (const ancestorId of ancestorIds) next.add(ancestorId);
          return { activeSectionId: id, expandedSectionIds: next };
        }),
      toggleSectionExpanded: (id) =>
        set((s) => {
          const next = new Set(s.expandedSectionIds);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return { expandedSectionIds: next };
        }),
      toggleSidebarCollapsed: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
      toggleLineWrap: () => set((s) => ({ lineWrap: !s.lineWrap })),
      setSeverityFilter: (severityFilter) => set({ severityFilter }),
      setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
      setConfidenceFilter: (confidenceFilter) => set({ confidenceFilter }),
      setSectionFilterId: (sectionFilterId) => set({ sectionFilterId }),
      setFindingsQuery: (findingsQuery) => set({ findingsQuery }),
      setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
      setPendingRawLineJump: (pendingRawLineJump) => set({ pendingRawLineJump }),
      markSectionRead: (id) =>
        set((s) => {
          const next = new Set(s.readSectionIds);
          next.add(id);
          return { readSectionIds: next };
        }),
      resetFilters: () =>
        set({ severityFilter: [], categoryFilter: [], confidenceFilter: [], sectionFilterId: null, findingsQuery: '' }),
      resetForNewScan: () =>
        set({
          activeView: 'overview',
          activeSectionId: null,
          severityFilter: [],
          categoryFilter: [],
          confidenceFilter: [],
          sectionFilterId: null,
          findingsQuery: '',
          readSectionIds: new Set<string>(),
          expandedSectionIds: new Set<string>(),
        }),
    }),
    {
      name: 'linpeaser-ui-prefs',
      // Only true UI chrome preferences are persisted — never scan content,
      // filters, or anything derived from an uploaded report.
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed, lineWrap: state.lineWrap, theme: state.theme }),
    }
  )
);

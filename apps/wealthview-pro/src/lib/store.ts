// App store — JAMOPS dashboard-store pattern: boards of widgets with
// per-breakpoint layouts, persisted; plus saved ledger views.
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Layouts } from 'react-grid-layout'

export interface Widget {
  id: string
  kind: 'kpi-burn' | 'kpi-income' | 'kpi-net' | 'kpi-recurring' | 'chart-cashflow' | 'top-vendors' | 'chart-groups'
}

export interface Board {
  id: string
  name: string
  widgets: Widget[]
  layouts: Layouts
}

export interface LedgerView {
  id: string
  name: string
  search: string
  kind: string
  group: string
  year: string
}

const defaultBoard: Board = {
  id: 'overview',
  name: 'Overview',
  widgets: [
    { id: 'w1', kind: 'kpi-burn' },
    { id: 'w2', kind: 'kpi-income' },
    { id: 'w3', kind: 'kpi-net' },
    { id: 'w4', kind: 'kpi-recurring' },
    { id: 'w5', kind: 'chart-cashflow' },
    { id: 'w6', kind: 'top-vendors' },
    { id: 'w7', kind: 'chart-groups' },
  ],
  layouts: {
    lg: [
      { i: 'w1', x: 0, y: 0, w: 3, h: 2 },
      { i: 'w2', x: 3, y: 0, w: 3, h: 2 },
      { i: 'w3', x: 6, y: 0, w: 3, h: 2 },
      { i: 'w4', x: 9, y: 0, w: 3, h: 2 },
      { i: 'w5', x: 0, y: 2, w: 8, h: 5 },
      { i: 'w6', x: 8, y: 2, w: 4, h: 5 },
      { i: 'w7', x: 0, y: 7, w: 12, h: 4 },
    ],
  },
}

interface AppState {
  page: string
  setPage: (p: string) => void
  boards: Board[]
  activeBoard: string
  editing: boolean
  setEditing: (e: boolean) => void
  updateLayouts: (boardId: string, layouts: Layouts) => void
  addWidget: (boardId: string, kind: Widget['kind']) => void
  removeWidget: (boardId: string, id: string) => void
  ledgerViews: LedgerView[]
  saveLedgerView: (v: LedgerView) => void
  deleteLedgerView: (id: string) => void
}

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      page: 'dashboard',
      setPage: (page) => set({ page }),
      boards: [defaultBoard],
      activeBoard: 'overview',
      editing: false,
      setEditing: (editing) => set({ editing }),
      updateLayouts: (boardId, layouts) =>
        set((s) => ({ boards: s.boards.map((b) => (b.id === boardId ? { ...b, layouts } : b)) })),
      addWidget: (boardId, kind) =>
        set((s) => ({
          boards: s.boards.map((b) =>
            b.id === boardId
              ? { ...b, widgets: [...b.widgets, { id: 'w' + Math.random().toString(36).slice(2, 8), kind }] }
              : b,
          ),
        })),
      removeWidget: (boardId, id) =>
        set((s) => ({
          boards: s.boards.map((b) =>
            b.id === boardId
              ? {
                  ...b,
                  widgets: b.widgets.filter((w) => w.id !== id),
                  layouts: Object.fromEntries(
                    Object.entries(b.layouts).map(([k, arr]) => [k, (arr ?? []).filter((l) => l.i !== id)]),
                  ) as Layouts,
                }
              : b,
          ),
        })),
      ledgerViews: [],
      saveLedgerView: (v) => set((s) => ({ ledgerViews: [...s.ledgerViews.filter((x) => x.id !== v.id), v] })),
      deleteLedgerView: (id) => set((s) => ({ ledgerViews: s.ledgerViews.filter((x) => x.id !== id) })),
    }),
    { name: 'wvpro', partialize: (s) => ({ boards: s.boards, ledgerViews: s.ledgerViews, activeBoard: s.activeBoard }) },
  ),
)

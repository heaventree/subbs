import { api } from "@/lib/api";
import pb from "@/lib/pb";
import type {
  BBDetected,
  BBDetectedStatus,
  BBImportPayload,
  BBSettings,
  BBStatus,
  BBSyncResult,
  BBWalletsResponse,
} from "@/types";

export const budgetbakersService = {
  // ── Connection ────────────────────────────────────────────────────────────

  connect: (email: string, password: string) =>
    api.post<{ connected: boolean }>("/api/budgetbakers/connect", { email, password }),

  disconnect: () =>
    api.del<{ disconnected: boolean }>("/api/budgetbakers/disconnect"),

  getStatus: () =>
    api.get<BBStatus>("/api/budgetbakers/status"),

  // ── Settings record (for selected wallets, auto-sync flag) ────────────────

  getSettings: async (userId: string): Promise<BBSettings | null> => {
    try {
      const result = await pb
        .collection("bb_settings")
        .getList<BBSettings>(1, 1, {
          filter: pb.filter("user = {:userId}", { userId }),
        });
      return result.items[0] ?? null;
    } catch {
      return null;
    }
  },

  // ── Wallets ───────────────────────────────────────────────────────────────

  getWallets: () =>
    api.get<BBWalletsResponse>("/api/budgetbakers/wallets"),

  saveWalletSelection: (selectedWalletIds: string[]) =>
    api.post<{ saved: boolean }>("/api/budgetbakers/wallets", {
      selected_wallet_ids: selectedWalletIds,
    }),

  // ── Sync ──────────────────────────────────────────────────────────────────

  sync: () =>
    api.post<BBSyncResult>("/api/budgetbakers/sync", {}),

  // ── Detected subscriptions ────────────────────────────────────────────────

  getDetected: async (
    userId: string,
    status?: BBDetectedStatus | "all",
  ): Promise<BBDetected[]> => {
    const filter =
      !status || status === "all"
        ? pb.filter("user = {:userId}", { userId })
        : pb.filter("user = {:userId} && status = {:status}", { userId, status });

    const result = await pb
      .collection("bb_detected")
      .getList<BBDetected>(1, 200, {
        filter,
        sort: "-confidence",
      });
    return result.items;
  },

  importDetected: (id: string, payload: BBImportPayload) =>
    api.post<{ subscription_id: string; imported: boolean }>(
      `/api/budgetbakers/import/${id}`,
      payload,
    ),

  dismissDetected: (id: string) =>
    api.post<{ dismissed: boolean }>(`/api/budgetbakers/dismiss/${id}`, {}),

  restoreDetected: (id: string) =>
    api.post<{ restored: boolean }>(`/api/budgetbakers/restore/${id}`, {}),
};

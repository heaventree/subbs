import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, RefreshCw, Unlink, Wallet, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/lib/toast";
import { budgetbakersService } from "@/services/budgetbakers";
import type { BBWallet } from "@/types";

export function BudgetBakersTab() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedWallets, setSelectedWallets] = useState<string[]>([]);

  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ["bb_status"],
    queryFn: () => budgetbakersService.getStatus(),
    enabled: !!user?.id,
    refetchOnWindowFocus: false,
  });

  const { data: walletsData, isLoading: walletsLoading } = useQuery({
    queryKey: ["bb_wallets"],
    queryFn: () => budgetbakersService.getWallets(),
    enabled: status?.connected === true,
  });

  useEffect(() => {
    if (walletsData?.selected_wallet_ids) {
      setSelectedWallets(walletsData.selected_wallet_ids);
    }
  }, [walletsData]);

  const connectMut = useMutation({
    mutationFn: () => budgetbakersService.connect(email, password),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bb_status"] });
      qc.invalidateQueries({ queryKey: ["bb_wallets"] });
      setPassword("");
      toast.success(t("bb.connected_success"));
    },
    onError: (err: Error) => toast.error(err.message || t("error")),
  });

  const disconnectMut = useMutation({
    mutationFn: () => budgetbakersService.disconnect(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bb_status"] });
      qc.invalidateQueries({ queryKey: ["bb_wallets"] });
      toast.success(t("bb.disconnected"));
    },
    onError: () => toast.error(t("error")),
  });

  const walletsMut = useMutation({
    mutationFn: () => budgetbakersService.saveWalletSelection(selectedWallets),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bb_wallets"] });
      toast.success(t("success_update"));
    },
    onError: () => toast.error(t("error")),
  });

  const syncMut = useMutation({
    mutationFn: () => budgetbakersService.sync(),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["bb_status"] });
      toast.success(
        t("bb.sync_complete", {
          count: data.subscriptions_detected,
          new: data.new,
        }),
      );
    },
    onError: (err: Error) => toast.error(err.message || t("error")),
  });

  const toggleWallet = (id: string) => {
    setSelectedWallets((prev) =>
      prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id],
    );
  };

  const isConnected = status?.connected;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
          <Wallet className="w-8 h-8 text-primary" />
          {t("bb.title")}
        </h2>
        <p className="text-muted-foreground">{t("bb.subtitle")}</p>
      </div>

      <Separator />

      {/* Connection status badge */}
      {!statusLoading && (
        <div className="flex items-center gap-3">
          {isConnected ? (
            <Badge variant="outline" className="gap-1.5 text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {t("bb.status_connected")}
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1.5 text-muted-foreground">
              <XCircle className="w-3.5 h-3.5" />
              {t("bb.status_disconnected")}
            </Badge>
          )}
          {isConnected && status?.last_synced && (
            <span className="text-xs text-muted-foreground">
              {t("bb.last_synced")}: {new Date(status.last_synced).toLocaleString()}
            </span>
          )}
        </div>
      )}

      {/* Login form (shown when not connected) */}
      {!isConnected && (
        <div className="space-y-4 max-w-md">
          <p className="text-sm text-muted-foreground">{t("bb.connect_hint")}</p>
          <div className="space-y-2">
            <Label htmlFor="bb-email">{t("email")}</Label>
            <Input
              id="bb-email"
              type="email"
              value={email}
              autoComplete="username"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bb-password">{t("password")}</Label>
            <Input
              id="bb-password"
              type="password"
              value={password}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <Button
            onClick={() => connectMut.mutate()}
            disabled={connectMut.isPending || !email || !password}
          >
            {connectMut.isPending ? t("bb.connecting") : t("bb.connect")}
          </Button>
        </div>
      )}

      {/* Wallet selection (shown when connected) */}
      {isConnected && (
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="font-semibold">{t("bb.wallets_title")}</h3>
            <p className="text-sm text-muted-foreground">{t("bb.wallets_hint")}</p>

            {walletsLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="w-4 h-4 animate-spin" />
                {t("loading")}
              </div>
            )}

            {walletsData && walletsData.wallets.length > 0 && (
              <div className="space-y-2">
                {walletsData.wallets.map((wallet: BBWallet) => (
                  <label
                    key={wallet.id}
                    className="flex items-center gap-3 rounded-xl border border-border p-4 cursor-pointer hover:bg-accent/40 transition-colors"
                  >
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={selectedWallets.includes(wallet.id)}
                      onChange={() => toggleWallet(wallet.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{wallet.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {wallet.currency} · {t("bb.balance")}: {wallet.balance?.toFixed(2)}
                      </p>
                    </div>
                  </label>
                ))}

                <div className="pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => walletsMut.mutate()}
                    disabled={walletsMut.isPending}
                  >
                    {t("save")}
                  </Button>
                </div>
              </div>
            )}

            {walletsData && walletsData.wallets.length === 0 && (
              <p className="text-sm text-muted-foreground">{t("bb.no_wallets")}</p>
            )}
          </div>

          <Separator />

          {/* Sync + Disconnect actions */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => syncMut.mutate()}
              disabled={syncMut.isPending}
              className="gap-2"
            >
              <RefreshCw className={syncMut.isPending ? "animate-spin w-4 h-4" : "w-4 h-4"} />
              {syncMut.isPending ? t("bb.syncing") : t("bb.sync_now")}
            </Button>

            <Button
              variant="outline"
              className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30"
              onClick={() => disconnectMut.mutate()}
              disabled={disconnectMut.isPending}
            >
              <Unlink className="w-4 h-4" />
              {t("bb.disconnect")}
            </Button>
          </div>

          {status?.pending_count !== undefined && status.pending_count > 0 && (
            <p className="text-sm text-muted-foreground bg-muted/50 rounded-xl p-3">
              {t("bb.pending_hint", { count: status.pending_count })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

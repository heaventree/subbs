import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Hash,
  RefreshCw,
  RotateCcw,
  Settings,
  Trash2,
  TrendingDown,
  Wallet,
  X,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { budgetbakersService } from "@/services/budgetbakers";
import type { BBDetected, BBDetectedStatus, BBImportPayload } from "@/types";

// ── Confidence badge ──────────────────────────────────────────────────────────

function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const variant =
    pct >= 80 ? "high" : pct >= 55 ? "medium" : "low";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        variant === "high"   && "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
        variant === "medium" && "bg-amber-100   text-amber-700   dark:bg-amber-950/40   dark:text-amber-400",
        variant === "low"    && "bg-slate-100   text-slate-600   dark:bg-slate-800       dark:text-slate-400",
      )}
    >
      {pct}%
    </span>
  );
}

// ── Cycle label ────────────────────────────────────────────────────────────────

function CycleLabel({ cycle, frequency }: { cycle: string; frequency: number }) {
  const map: Record<string, string> = {
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    yearly: "Yearly",
  };
  const label = frequency > 1 ? `Every ${frequency} ${cycle}` : (map[cycle] ?? cycle);
  return <span className="capitalize text-xs text-muted-foreground">{label}</span>;
}

// ── Import dialog ─────────────────────────────────────────────────────────────

interface ImportDialogProps {
  item: BBDetected | null;
  onClose: () => void;
  onImported: () => void;
}

function ImportDialog({ item, onClose, onImported }: ImportDialogProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(item?.name ?? "");
  const [price, setPrice] = useState(String(item?.amount ?? ""));
  const [cycle, setCycle] = useState<string>(item?.cycle ?? "monthly");

  const importMut = useMutation({
    mutationFn: () => {
      const payload: BBImportPayload = {
        name:         name.trim() || item!.name,
        price:        parseFloat(price) || item!.amount,
        currency_code: item!.currency_code,
        cycle:        cycle.charAt(0).toUpperCase() + cycle.slice(1),
        next_payment: item!.next_expected,
        start_date:   item!.last_charged,
      };
      return budgetbakersService.importDetected(item!.id, payload);
    },
    onSuccess: () => {
      toast.success(t("bb.imported_success", { name: name || item?.name }));
      onImported();
      onClose();
    },
    onError: (err: Error) => toast.error(err.message || t("error")),
  });

  // Keep form in sync when item changes
  if (!item) return null;

  return (
    <Dialog open={!!item} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("bb.import_as_subscription")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>{t("name")}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={item.name}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("price")}</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("cycle")}</Label>
              <Select value={cycle} onValueChange={setCycle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">{t("bb.cycle_daily")}</SelectItem>
                  <SelectItem value="weekly">{t("bb.cycle_weekly")}</SelectItem>
                  <SelectItem value="monthly">{t("bb.cycle_monthly")}</SelectItem>
                  <SelectItem value="yearly">{t("bb.cycle_yearly")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
            <p><span className="font-medium">{t("bb.last_charged_label")}:</span> {item.last_charged}</p>
            <p><span className="font-medium">{t("bb.next_expected_label")}:</span> {item.next_expected}</p>
            <p><span className="font-medium">{t("bb.seen_times")}:</span> {item.transaction_count}×</p>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose} disabled={importMut.isPending}>
              {t("cancel")}
            </Button>
            <Button onClick={() => importMut.mutate()} disabled={importMut.isPending}>
              {importMut.isPending ? t("bb.importing") : t("bb.import_btn")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Detected item card ─────────────────────────────────────────────────────────

interface DetectedCardProps {
  item: BBDetected;
  onImport: (item: BBDetected) => void;
  onDismiss: (id: string) => void;
  onRestore: (id: string) => void;
  isActing: boolean;
}

function DetectedCard({ item, onImport, onDismiss, onRestore, isActing }: DetectedCardProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const isDismissed = item.status === "dismissed";
  const isImported = item.status === "imported";

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-card transition-all duration-200",
        isDismissed && "opacity-50",
        isImported  && "opacity-60 border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/10",
      )}
    >
      <div className="flex items-start gap-4 p-4">
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <TrendingDown className="w-5 h-5 text-primary" />
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className={cn("font-semibold truncate", isImported && "line-through text-muted-foreground")}>
                {item.name}
              </p>
              <div className="flex items-center flex-wrap gap-2 mt-1">
                <span className="text-sm font-medium">
                  {item.currency_code} {Math.abs(item.amount).toFixed(2)}
                </span>
                <CycleLabel cycle={item.cycle} frequency={item.frequency} />
                <ConfidenceBadge value={item.confidence} />
                {isImported && (
                  <Badge variant="outline" className="text-emerald-600 border-emerald-300 text-xs gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {t("bb.status_imported")}
                  </Badge>
                )}
              </div>
            </div>

            {/* Actions */}
            {!isImported && (
              <div className="flex items-center gap-1 flex-shrink-0">
                {isDismissed ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 gap-1.5 text-xs"
                    onClick={() => onRestore(item.id)}
                    disabled={isActing}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    {t("bb.restore")}
                  </Button>
                ) : (
                  <>
                    <Button
                      size="sm"
                      className="h-8 gap-1.5 text-xs"
                      onClick={() => onImport(item)}
                      disabled={isActing}
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      {t("bb.import_btn")}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => onDismiss(item.id)}
                      disabled={isActing}
                      title={t("bb.dismiss")}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Expand toggle */}
          <button
            className="flex items-center gap-1 mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            {t("bb.details")}
          </button>

          {expanded && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                <span><span className="font-medium">{t("bb.last_charged_label")}:</span> {item.last_charged}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
                <span><span className="font-medium">{t("bb.next_expected_label")}:</span> {item.next_expected}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Hash className="w-3.5 h-3.5 flex-shrink-0" />
                <span><span className="font-medium">{t("bb.seen_times")}:</span> {item.transaction_count}×</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function BudgetBakersPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();

  const [filter, setFilter] = useState<BBDetectedStatus | "all">("pending");
  const [importItem, setImportItem] = useState<BBDetected | null>(null);
  const [actingIds, setActingIds] = useState<Set<string>>(new Set());

  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ["bb_status"],
    queryFn: () => budgetbakersService.getStatus(),
    enabled: !!user?.id,
  });

  const { data: detected = [], isLoading: detectedLoading, refetch: refetchDetected } = useQuery({
    queryKey: ["bb_detected", filter],
    queryFn: () => budgetbakersService.getDetected(user!.id, filter),
    enabled: !!user?.id,
  });

  const syncMut = useMutation({
    mutationFn: () => budgetbakersService.sync(),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["bb_status"] });
      qc.invalidateQueries({ queryKey: ["bb_detected"] });
      toast.success(
        t("bb.sync_complete", {
          count: data.subscriptions_detected,
          new: data.new,
        }),
      );
    },
    onError: (err: Error) => toast.error(err.message || t("error")),
  });

  const dismissMut = useMutation({
    mutationFn: (id: string) => budgetbakersService.dismissDetected(id),
    onSuccess: (_, id) => {
      setActingIds((s) => { const n = new Set(s); n.delete(id); return n; });
      qc.invalidateQueries({ queryKey: ["bb_detected"] });
      qc.invalidateQueries({ queryKey: ["bb_status"] });
    },
    onError: (_, id) => {
      setActingIds((s) => { const n = new Set(s); n.delete(id); return n; });
      toast.error(t("error"));
    },
  });

  const restoreMut = useMutation({
    mutationFn: (id: string) => budgetbakersService.restoreDetected(id),
    onSuccess: (_, id) => {
      setActingIds((s) => { const n = new Set(s); n.delete(id); return n; });
      qc.invalidateQueries({ queryKey: ["bb_detected"] });
    },
    onError: (_, id) => {
      setActingIds((s) => { const n = new Set(s); n.delete(id); return n; });
      toast.error(t("error"));
    },
  });

  function handleDismiss(id: string) {
    setActingIds((s) => new Set(s).add(id));
    dismissMut.mutate(id);
  }

  function handleRestore(id: string) {
    setActingIds((s) => new Set(s).add(id));
    restoreMut.mutate(id);
  }

  const isLoading = statusLoading || detectedLoading;
  const isConnected = status?.connected;

  // ── Not connected state ──────────────────────────────────────────────────
  if (!statusLoading && !isConnected) {
    return (
      <div className="space-y-8">
        <PageHeader />
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Wallet className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{t("bb.not_connected_title")}</h3>
            <p className="text-muted-foreground mt-1 max-w-sm mx-auto">{t("bb.not_connected_desc")}</p>
          </div>
          <Link to="/settings" search={{ tab: "budgetbakers" }}>
            <Button className="gap-2">
              <Settings className="w-4 h-4" />
              {t("bb.go_to_settings")}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const pendingCount = detected.filter((d) => d.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader />
        <div className="flex items-center gap-2">
          {status?.last_synced && (
            <span className="text-xs text-muted-foreground hidden sm:block">
              {t("bb.last_synced")}: {new Date(status.last_synced).toLocaleString()}
            </span>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => syncMut.mutate()}
            disabled={syncMut.isPending}
            className="gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", syncMut.isPending && "animate-spin")} />
            {syncMut.isPending ? t("bb.syncing") : t("bb.sync_now")}
          </Button>
          <Link to="/settings" search={{ tab: "budgetbakers" }}>
            <Button size="sm" variant="ghost" className="gap-2">
              <Settings className="w-4 h-4" />
              {t("settings")}
            </Button>
          </Link>
        </div>
      </div>

      <Separator />

      {/* Summary stats */}
      {!isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label={t("bb.stat_pending")}
            value={detected.filter((d) => d.status === "pending").length}
            accent="primary"
          />
          <StatCard
            label={t("bb.stat_imported")}
            value={detected.filter((d) => d.status === "imported").length}
            accent="emerald"
          />
          <StatCard
            label={t("bb.stat_dismissed")}
            value={detected.filter((d) => d.status === "dismissed").length}
            accent="slate"
          />
          <StatCard
            label={t("bb.stat_total")}
            value={detected.length}
            accent="slate"
          />
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 bg-muted/50 rounded-xl p-1 w-fit">
        {(["pending", "all", "dismissed", "imported"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
              filter === f
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t(`bb.filter_${f}`)}
          </button>
        ))}
      </div>

      {/* Empty states */}
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
          <RefreshCw className="w-4 h-4 animate-spin" />
          {t("loading")}
        </div>
      )}

      {!isLoading && detected.length === 0 && filter === "pending" && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-12 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500/70" />
          <div>
            <h3 className="font-semibold">{t("bb.empty_pending_title")}</h3>
            <p className="text-sm text-muted-foreground mt-1">{t("bb.empty_pending_desc")}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => syncMut.mutate()}
            disabled={syncMut.isPending}
            className="gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", syncMut.isPending && "animate-spin")} />
            {t("bb.sync_now")}
          </Button>
        </div>
      )}

      {!isLoading && detected.length === 0 && filter !== "pending" && (
        <div className="text-sm text-muted-foreground py-6 text-center">
          {t("bb.empty_filter")}
        </div>
      )}

      {/* First-sync nudge (connected but never synced) */}
      {!isLoading && !status?.last_synced && isConnected && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20 p-4 text-sm">
          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-400">{t("bb.first_sync_title")}</p>
            <p className="text-amber-700 dark:text-amber-500 mt-0.5">{t("bb.first_sync_desc")}</p>
          </div>
        </div>
      )}

      {/* Cards */}
      {!isLoading && detected.length > 0 && (
        <div className="space-y-3">
          {detected.map((item) => (
            <DetectedCard
              key={item.id}
              item={item}
              onImport={setImportItem}
              onDismiss={handleDismiss}
              onRestore={handleRestore}
              isActing={actingIds.has(item.id)}
            />
          ))}
        </div>
      )}

      {/* Import dialog */}
      <ImportDialog
        item={importItem}
        onClose={() => setImportItem(null)}
        onImported={() => {
          qc.invalidateQueries({ queryKey: ["bb_detected"] });
          qc.invalidateQueries({ queryKey: ["bb_status"] });
          refetchDetected();
        }}
      />
    </div>
  );
}

function PageHeader() {
  const { t } = useTranslation();
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
        <Wallet className="w-8 h-8 text-primary" />
        {t("bb.page_title")}
      </h1>
      <p className="text-muted-foreground mt-1">{t("bb.page_subtitle")}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "primary" | "emerald" | "slate";
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

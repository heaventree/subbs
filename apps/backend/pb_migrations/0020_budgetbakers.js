/// <reference path="../pb_data/types.d.ts" />

/**
 * Migration 0020 — BudgetBakers Wallet integration
 *
 * Creates three collections:
 *   bb_settings     — per-user connection credentials (token hidden)
 *   bb_transactions — cached transactions fetched from Wallet
 *   bb_detected     — recurring payments detected from transaction history
 */
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    const subscriptions = app.findCollectionByNameOrId("subscriptions");
    const ownerRule = "@request.auth.id = user.id";

    // ── bb_settings ──────────────────────────────────────────────────────────
    const bbSettings = new Collection({
      name: "bb_settings",
      type: "base",
      listRule: ownerRule,
      viewRule: ownerRule,
      createRule: "@request.auth.id != ''",
      updateRule: ownerRule,
      deleteRule: ownerRule,
      fields: [
        new RelationField({ name: "user", collectionId: users.id, required: true, maxSelect: 1 }),
        new TextField({ name: "token", hidden: true }),
        new DateField({ name: "token_expires" }),
        new JSONField({ name: "selected_wallet_ids" }),
        new DateField({ name: "last_synced" }),
        new BoolField({ name: "auto_sync" }),
        new BoolField({ name: "connected" }),
      ],
    });
    app.save(bbSettings);

    // ── bb_transactions ───────────────────────────────────────────────────────
    const bbTransactions = new Collection({
      name: "bb_transactions",
      type: "base",
      listRule: ownerRule,
      viewRule: ownerRule,
      createRule: null,
      updateRule: null,
      deleteRule: ownerRule,
      fields: [
        new RelationField({ name: "user", collectionId: users.id, required: true, maxSelect: 1 }),
        new TextField({ name: "bb_id", required: true }),
        new TextField({ name: "wallet_id" }),
        new TextField({ name: "wallet_name" }),
        new NumberField({ name: "amount" }),
        new TextField({ name: "category_name" }),
        new TextField({ name: "note" }),
        new DateField({ name: "record_date" }),
        new TextField({ name: "record_type" }),
        new TextField({ name: "currency_code" }),
        new TextField({ name: "payee" }),
      ],
    });
    app.save(bbTransactions);

    // ── bb_detected ───────────────────────────────────────────────────────────
    const bbDetected = new Collection({
      name: "bb_detected",
      type: "base",
      listRule: ownerRule,
      viewRule: ownerRule,
      createRule: null,
      updateRule: ownerRule,
      deleteRule: ownerRule,
      fields: [
        new RelationField({ name: "user", collectionId: users.id, required: true, maxSelect: 1 }),
        new TextField({ name: "name" }),
        new TextField({ name: "normalized_name" }),
        new NumberField({ name: "amount" }),
        new TextField({ name: "currency_code" }),
        new TextField({ name: "cycle" }),
        new NumberField({ name: "frequency" }),
        new DateField({ name: "last_charged" }),
        new DateField({ name: "next_expected" }),
        new SelectField({
          name: "status",
          values: ["pending", "confirmed", "dismissed", "imported"],
          maxSelect: 1,
        }),
        new NumberField({ name: "transaction_count" }),
        new NumberField({ name: "confidence" }),
        new RelationField({
          name: "subscription",
          collectionId: subscriptions.id,
          required: false,
          maxSelect: 1,
        }),
        new JSONField({ name: "transaction_ids" }),
      ],
    });
    app.save(bbDetected);
  },

  (app) => {
    for (const name of ["bb_detected", "bb_transactions", "bb_settings"]) {
      try {
        const col = app.findCollectionByNameOrId(name);
        app.delete(col);
      } catch (_) {}
    }
  }
);

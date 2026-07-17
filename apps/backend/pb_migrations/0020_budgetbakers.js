/// <reference path="../pb_data/types.d.ts" />

/**
 * Migration 0020 — BudgetBakers Wallet integration
 *
 * Three-phase pattern (matches existing migrations):
 *   Phase 1: Create collections without relations, permissive rules
 *   Phase 2: Add relation fields (needs collectionId references)
 *   Phase 3: Apply owner-scoped access rules
 */
migrate(
  (app) => {
    const authOnly = "@request.auth.id != ''";

    // ── Phase 1: bare collections ─────────────────────────────────────────────

    app.save(new Collection({
      name: "bb_settings",
      type: "base",
      listRule: authOnly, viewRule: authOnly,
      createRule: authOnly, updateRule: authOnly, deleteRule: authOnly,
      fields: [
        new TextField({ name: "token", hidden: true }),
        new DateField({ name: "token_expires" }),
        new JSONField({ name: "selected_wallet_ids" }),
        new DateField({ name: "last_synced" }),
        new BoolField({ name: "auto_sync" }),
        new BoolField({ name: "connected" }),
      ],
    }));

    app.save(new Collection({
      name: "bb_transactions",
      type: "base",
      listRule: authOnly, viewRule: authOnly,
      createRule: null, updateRule: null, deleteRule: authOnly,
      fields: [
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
    }));

    app.save(new Collection({
      name: "bb_detected",
      type: "base",
      listRule: authOnly, viewRule: authOnly,
      createRule: null, updateRule: authOnly, deleteRule: authOnly,
      fields: [
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
        new JSONField({ name: "transaction_ids" }),
      ],
    }));

    // ── Phase 2: add relation fields ──────────────────────────────────────────

    const users        = app.findCollectionByNameOrId("users");
    const subscriptions = app.findCollectionByNameOrId("subscriptions");

    const bbSettings     = app.findCollectionByNameOrId("bb_settings");
    const bbTransactions = app.findCollectionByNameOrId("bb_transactions");
    const bbDetected     = app.findCollectionByNameOrId("bb_detected");

    bbSettings.fields.add(
      new RelationField({ name: "user", collectionId: users.id, required: true, maxSelect: 1 })
    );
    app.save(bbSettings);

    bbTransactions.fields.add(
      new RelationField({ name: "user", collectionId: users.id, required: true, maxSelect: 1 })
    );
    app.save(bbTransactions);

    bbDetected.fields.add(
      new RelationField({ name: "user", collectionId: users.id, required: true, maxSelect: 1 })
    );
    bbDetected.fields.add(
      new RelationField({ name: "subscription", collectionId: subscriptions.id, required: false, maxSelect: 1 })
    );
    app.save(bbDetected);

    // ── Phase 3: tighten access rules ─────────────────────────────────────────

    const ownerRule = "@request.auth.id = user.id";

    bbSettings.listRule   = ownerRule;
    bbSettings.viewRule   = ownerRule;
    bbSettings.updateRule = ownerRule;
    bbSettings.deleteRule = ownerRule;
    app.save(bbSettings);

    bbTransactions.listRule   = ownerRule;
    bbTransactions.viewRule   = ownerRule;
    bbTransactions.deleteRule = ownerRule;
    app.save(bbTransactions);

    bbDetected.listRule   = ownerRule;
    bbDetected.viewRule   = ownerRule;
    bbDetected.updateRule = ownerRule;
    bbDetected.deleteRule = ownerRule;
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

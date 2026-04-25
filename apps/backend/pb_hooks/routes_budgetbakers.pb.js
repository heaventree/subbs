/// <reference path="../pb_data/types.d.ts" />

// ================================================================
// BudgetBakers Wallet integration routes
//
// POST /api/budgetbakers/connect      – authenticate with BB and store token
// DELETE /api/budgetbakers/disconnect – remove stored credentials
// GET  /api/budgetbakers/wallets      – list wallets from BB
// POST /api/budgetbakers/sync         – fetch transactions and run detector
// GET  /api/budgetbakers/status       – connection status + last sync info
// POST /api/budgetbakers/import/:id   – import detected item as subscription
// POST /api/budgetbakers/dismiss/:id  – dismiss a detected item
//
// BudgetBakers REST API auth:
//   GET https://api.budgetbakers.com/api/v1/user/login
//   Headers: X-User: <email>, X-Auth: <password>
//   Response header X-Token contains the session token.
// ================================================================

var BB_BASE = "https://api.budgetbakers.com/api/v1";

function requireAuth(e) {
  if (!e.auth) throw new ForbiddenError("Authentication required");
  return e.auth.id;
}

function getBBSettings(userId) {
  var rows = $app.findRecordsByFilter("bb_settings", "user = {:u}", "", 1, 0, { u: userId });
  return rows.length > 0 ? rows[0] : null;
}

function bbRequest(method, path, token, body) {
  var headers = { "X-Token": token, "Content-Type": "application/json" };
  var opts = { url: BB_BASE + path, method: method, headers: headers };
  if (body) opts.body = JSON.stringify(body);
  return $http.send(opts);
}

// ── POST /api/budgetbakers/connect ────────────────────────────────────────────
routerAdd("POST", "/api/budgetbakers/connect", function (e) {
  var userId = requireAuth(e);
  var body = e.body();

  var email    = String(body.email    || "").trim();
  var password = String(body.password || "").trim();

  if (!email || !password) {
    return e.json(400, { error: "email and password are required" });
  }

  // Authenticate with BudgetBakers
  var authRes = $http.send({
    url: BB_BASE + "/user/login",
    method: "GET",
    headers: { "X-User": email, "X-Auth": password },
  });

  if (authRes.statusCode !== 200) {
    return e.json(401, {
      error: "BudgetBakers authentication failed. Check your email and password.",
    });
  }

  var token = authRes.headers["X-Token"] || authRes.headers["x-token"];
  if (!token) {
    return e.json(502, { error: "BudgetBakers did not return an auth token." });
  }

  // Store / update settings record
  var settings = getBBSettings(userId);
  if (!settings) {
    var col = $app.findCollectionByNameOrId("bb_settings");
    settings = new Record(col);
    settings.set("user", userId);
  }
  settings.set("token", token);
  settings.set("connected", true);
  // Token expires after ~30 days; store a soft expiry 28 days from now
  var expires = new Date();
  expires.setDate(expires.getDate() + 28);
  settings.set("token_expires", expires.toISOString());
  $app.save(settings);

  return e.json(200, { connected: true });
});

// ── DELETE /api/budgetbakers/disconnect ───────────────────────────────────────
routerAdd("DELETE", "/api/budgetbakers/disconnect", function (e) {
  var userId = requireAuth(e);
  var settings = getBBSettings(userId);
  if (settings) {
    settings.set("token", "");
    settings.set("connected", false);
    $app.save(settings);
  }
  return e.json(200, { disconnected: true });
});

// ── GET /api/budgetbakers/status ──────────────────────────────────────────────
routerAdd("GET", "/api/budgetbakers/status", function (e) {
  var userId = requireAuth(e);
  var settings = getBBSettings(userId);
  if (!settings || !settings.get("connected")) {
    return e.json(200, { connected: false, last_synced: null });
  }

  var pending = $app.findRecordsByFilter(
    "bb_detected", "user = {:u} && status = 'pending'", "", 0, 0, { u: userId }
  );

  return e.json(200, {
    connected:   true,
    last_synced: settings.get("last_synced"),
    pending_count: pending.length,
  });
});

// ── GET /api/budgetbakers/wallets ─────────────────────────────────────────────
routerAdd("GET", "/api/budgetbakers/wallets", function (e) {
  var userId = requireAuth(e);
  var settings = getBBSettings(userId);
  if (!settings || !settings.get("connected")) {
    return e.json(400, { error: "Not connected to BudgetBakers" });
  }

  var token = settings.get("token");
  var res = bbRequest("GET", "/wallets", token);
  if (res.statusCode !== 200) {
    return e.json(502, { error: "Failed to fetch wallets from BudgetBakers (HTTP " + res.statusCode + ")" });
  }

  var wallets = res.json || [];
  var selectedRaw = settings.get("selected_wallet_ids");
  var selected = [];
  try { selected = typeof selectedRaw === "string" ? JSON.parse(selectedRaw) : (selectedRaw || []); } catch (_) {}

  return e.json(200, {
    wallets: wallets.map(function (w) {
      return {
        id:           w.id,
        name:         w.name,
        currency:     w.currencyCode || w.currency,
        balance:      w.balance,
        is_selected:  selected.indexOf(w.id) !== -1,
      };
    }),
    selected_wallet_ids: selected,
  });
});

// ── POST /api/budgetbakers/wallets ────────────────────────────────────────────
routerAdd("POST", "/api/budgetbakers/wallets", function (e) {
  var userId = requireAuth(e);
  var settings = getBBSettings(userId);
  if (!settings) return e.json(400, { error: "Not connected" });

  var body = e.body();
  var ids = body.selected_wallet_ids || [];
  settings.set("selected_wallet_ids", JSON.stringify(ids));
  $app.save(settings);
  return e.json(200, { saved: true });
});

// ── POST /api/budgetbakers/sync ───────────────────────────────────────────────
routerAdd("POST", "/api/budgetbakers/sync", function (e) {
  var detector = require(__hooks + "/lib/pure/bb-detector.js");
  var userId = requireAuth(e);
  var settings = getBBSettings(userId);
  if (!settings || !settings.get("connected")) {
    return e.json(400, { error: "Not connected to BudgetBakers" });
  }

  var token = settings.get("token");

  // Determine date range: last 13 months to catch yearly subscriptions
  var since = new Date();
  since.setMonth(since.getMonth() - 13);
  var sinceTs = Math.floor(since.getTime() / 1000);

  // Fetch all records (BB paginates; keep fetching until empty)
  var allRecords = [];
  var page = 0;
  var pageSize = 200;
  while (true) {
    var url = "/records?since=" + sinceTs + "&limit=" + pageSize + "&offset=" + (page * pageSize);
    var res = bbRequest("GET", url, token);
    if (res.statusCode !== 200) {
      return e.json(502, { error: "BudgetBakers records fetch failed (HTTP " + res.statusCode + ")" });
    }
    var batch = res.json || [];
    if (!Array.isArray(batch) || batch.length === 0) break;
    allRecords = allRecords.concat(batch);
    if (batch.length < pageSize) break;
    page++;
    if (page > 50) break; // safety cap at 10k records
  }

  // Fetch wallet metadata for names
  var walletNames = {};
  var walletsRes = bbRequest("GET", "/wallets", token);
  if (walletsRes.statusCode === 200 && Array.isArray(walletsRes.json)) {
    walletsRes.json.forEach(function (w) { walletNames[w.id] = w.name; });
  }

  // Fetch categories for names
  var categoryNames = {};
  var catsRes = bbRequest("GET", "/categories", token);
  if (catsRes.statusCode === 200 && Array.isArray(catsRes.json)) {
    catsRes.json.forEach(function (c) { categoryNames[c.id] = c.name; });
  }

  // Filter by selected wallets if configured
  var selectedRaw = settings.get("selected_wallet_ids");
  var selectedWallets = [];
  try {
    selectedWallets = typeof selectedRaw === "string"
      ? JSON.parse(selectedRaw)
      : (selectedRaw || []);
  } catch (_) {}
  if (selectedWallets.length > 0) {
    allRecords = allRecords.filter(function (r) {
      return selectedWallets.indexOf(r.walletId || r.wallet_id || "") !== -1;
    });
  }

  // Upsert transactions into bb_transactions
  var col = $app.findCollectionByNameOrId("bb_transactions");
  var upserted = 0;
  allRecords.forEach(function (r) {
    var bbId = String(r.id || r._id || "");
    if (!bbId) return;

    var existing = $app.findRecordsByFilter(
      "bb_transactions", "user = {:u} && bb_id = {:id}", "", 1, 0,
      { u: userId, id: bbId }
    );

    var rec = existing.length > 0 ? existing[0] : new Record(col);
    rec.set("user",          userId);
    rec.set("bb_id",         bbId);
    rec.set("wallet_id",     r.walletId  || r.wallet_id  || "");
    rec.set("wallet_name",   walletNames[r.walletId || r.wallet_id] || "");
    rec.set("amount",        typeof r.amount === "number" ? r.amount : parseFloat(r.amount) || 0);
    rec.set("category_name", categoryNames[r.categoryId || r.category_id] || "");
    rec.set("note",          r.note || "");
    rec.set("record_date",   r.date ? r.date.split("T")[0] : "");
    rec.set("record_type",   r.type || "expense");
    rec.set("currency_code", r.currencyCode || r.currency_code || "");
    rec.set("payee",         r.payee || r.partner || "");
    $app.save(rec);
    upserted++;
  });

  // Load all stored transactions for this user to run detection on full history
  var storedTxs = $app.findRecordsByFilter(
    "bb_transactions", "user = {:u}", "-record_date", 0, 0, { u: userId }
  );
  var txData = storedTxs.map(function (tx) {
    return {
      bb_id:         tx.get("bb_id"),
      payee:         tx.get("payee"),
      note:          tx.get("note"),
      amount:        tx.get("amount"),
      currency_code: tx.get("currency_code"),
      record_date:   tx.get("record_date"),
      record_type:   tx.get("record_type"),
    };
  });

  // Run detection
  var candidates = detector.detectSubscriptions(txData);

  // Sync detected records: update existing pending items, add new ones
  var detectedCol = $app.findCollectionByNameOrId("bb_detected");
  var newCount = 0;
  var updatedCount = 0;

  candidates.forEach(function (c) {
    var existing = $app.findRecordsByFilter(
      "bb_detected",
      "user = {:u} && normalized_name = {:n} && status = 'pending'",
      "", 1, 0,
      { u: userId, n: c.normalized_name }
    );

    // Skip if already imported or dismissed
    var nonPending = $app.findRecordsByFilter(
      "bb_detected",
      "user = {:u} && normalized_name = {:n} && (status = 'imported' || status = 'dismissed')",
      "", 1, 0,
      { u: userId, n: c.normalized_name }
    );
    if (nonPending.length > 0) return;

    var det = existing.length > 0 ? existing[0] : new Record(detectedCol);
    det.set("user",              userId);
    det.set("name",              c.name);
    det.set("normalized_name",   c.normalized_name);
    det.set("amount",            c.amount);
    det.set("currency_code",     c.currency_code);
    det.set("cycle",             c.cycle);
    det.set("frequency",         c.frequency);
    det.set("last_charged",      c.last_charged);
    det.set("next_expected",     c.next_expected);
    det.set("status",            "pending");
    det.set("transaction_count", c.transaction_count);
    det.set("confidence",        c.confidence);
    det.set("transaction_ids",   JSON.stringify(c.transaction_ids));
    $app.save(det);

    if (existing.length > 0) updatedCount++; else newCount++;
  });

  // Update last_synced
  settings.set("last_synced", new Date().toISOString());
  $app.save(settings);

  return e.json(200, {
    transactions_synced: upserted,
    subscriptions_detected: candidates.length,
    new: newCount,
    updated: updatedCount,
  });
});

// ── POST /api/budgetbakers/import/:id ─────────────────────────────────────────
routerAdd("POST", "/api/budgetbakers/import/:id", function (e) {
  var userId = requireAuth(e);
  var detId = e.request.pathValue("id");

  var det = $app.findRecordById("bb_detected", detId);
  if (!det || det.get("user") !== userId) {
    return e.json(404, { error: "Not found" });
  }
  if (det.get("status") === "imported") {
    return e.json(400, { error: "Already imported" });
  }

  var body = e.body();

  // Resolve cycle ID from name
  var cycleName = body.cycle || capitalise(det.get("cycle")) || "Monthly";
  var cycles = $app.findRecordsByFilter("cycles", "name = {:n}", "", 1, 0, { n: cycleName });
  var cycleId = cycles.length > 0 ? cycles[0].id : null;

  // Resolve or create currency
  var currencyCode = String(body.currency_code || det.get("currency_code") || "").toUpperCase();
  var currencies = $app.findRecordsByFilter(
    "currencies", "user = {:u} && code = {:c}", "", 1, 0,
    { u: userId, c: currencyCode }
  );
  var currencyId = currencies.length > 0 ? currencies[0].id : null;
  if (!currencyId && currencyCode) {
    var currCol = $app.findCollectionByNameOrId("currencies");
    var newCurr = new Record(currCol);
    newCurr.set("user",    userId);
    newCurr.set("name",    currencyCode);
    newCurr.set("code",    currencyCode);
    newCurr.set("symbol",  currencyCode);
    newCurr.set("rate",    1);
    newCurr.set("is_main", false);
    $app.save(newCurr);
    currencyId = newCurr.id;
  }

  // Create subscription
  var subCol = $app.findCollectionByNameOrId("subscriptions");
  var sub = new Record(subCol);
  sub.set("user",         userId);
  sub.set("name",         body.name || det.get("name"));
  sub.set("price",        body.price !== undefined ? body.price : det.get("amount"));
  sub.set("currency",     currencyId || "");
  sub.set("cycle",        cycleId    || "");
  sub.set("frequency",    det.get("frequency") || 1);
  sub.set("next_payment", body.next_payment || det.get("next_expected") || "");
  sub.set("start_date",   body.start_date    || det.get("last_charged")  || "");
  sub.set("auto_renew",   true);
  sub.set("notify",       false);
  sub.set("notify_days_before", 3);
  sub.set("inactive",     false);
  if (body.notes) sub.set("notes", body.notes);
  if (body.category) sub.set("category", body.category);
  if (body.payment_method) sub.set("payment_method", body.payment_method);
  $app.save(sub);

  // Mark detected entry as imported, link to the subscription
  det.set("status",       "imported");
  det.set("subscription", sub.id);
  $app.save(det);

  return e.json(200, { subscription_id: sub.id, imported: true });
});

// ── POST /api/budgetbakers/dismiss/:id ────────────────────────────────────────
routerAdd("POST", "/api/budgetbakers/dismiss/:id", function (e) {
  var userId = requireAuth(e);
  var detId = e.request.pathValue("id");

  var det = $app.findRecordById("bb_detected", detId);
  if (!det || det.get("user") !== userId) {
    return e.json(404, { error: "Not found" });
  }

  det.set("status", "dismissed");
  $app.save(det);

  return e.json(200, { dismissed: true });
});

// ── POST /api/budgetbakers/restore/:id ────────────────────────────────────────
routerAdd("POST", "/api/budgetbakers/restore/:id", function (e) {
  var userId = requireAuth(e);
  var detId = e.request.pathValue("id");

  var det = $app.findRecordById("bb_detected", detId);
  if (!det || det.get("user") !== userId) {
    return e.json(404, { error: "Not found" });
  }
  if (det.get("status") !== "dismissed") {
    return e.json(400, { error: "Only dismissed items can be restored" });
  }

  det.set("status", "pending");
  $app.save(det);

  return e.json(200, { restored: true });
});

function capitalise(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

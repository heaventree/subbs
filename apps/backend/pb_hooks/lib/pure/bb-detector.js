/**
 * BudgetBakers recurring-payment detector.
 *
 * Takes a flat array of transactions and returns a list of detected
 * subscription candidates ranked by confidence.
 */

var CYCLE_CONFIGS = [
  { name: "daily",    days: 1,   tolerancePct: 0.5  },
  { name: "weekly",   days: 7,   tolerancePct: 0.30 },
  { name: "monthly",  days: 30,  tolerancePct: 0.25 },
  { name: "yearly",   days: 365, tolerancePct: 0.15 },
];

function normalizeName(raw) {
  if (!raw) return "";
  return String(raw)
    .toLowerCase()
    .replace(/https?:\/\/[^\s]*/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(www|com|net|org|co|ltd|inc|gmbh|llc|sas|bv|ag|pty|aps)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stdDev(values) {
  if (values.length < 2) return 0;
  var mean = values.reduce(function (s, v) { return s + v; }, 0) / values.length;
  var variance = values.reduce(function (s, v) { return s + Math.pow(v - mean, 2); }, 0) / values.length;
  return Math.sqrt(variance);
}

function mean(values) {
  if (!values.length) return 0;
  return values.reduce(function (s, v) { return s + v; }, 0) / values.length;
}

function classifyCycle(avgDays) {
  var best = null;
  var bestDiff = Infinity;
  for (var i = 0; i < CYCLE_CONFIGS.length; i++) {
    var cfg = CYCLE_CONFIGS[i];
    var diff = Math.abs(avgDays - cfg.days);
    var withinTolerance = diff <= cfg.days * cfg.tolerancePct;
    if (withinTolerance && diff < bestDiff) {
      best = cfg;
      bestDiff = diff;
    }
  }
  return best;
}

/**
 * Detect recurring payments.
 *
 * @param {Array} transactions  Array of objects with:
 *   { bb_id, payee, note, amount, currency_code, record_date, record_type }
 * @param {Object} [options]
 *   minOccurrences  – minimum number of hits required (default 2)
 *   minConfidence   – minimum confidence threshold 0-1 (default 0.40)
 * @returns {Array} Detected subscription candidates, sorted by confidence desc.
 */
function detectSubscriptions(transactions, options) {
  var opts = options || {};
  var minOccurrences = opts.minOccurrences || 2;
  var minConfidence  = opts.minConfidence  || 0.40;

  // Only look at expense-type records
  var expenses = transactions.filter(function (tx) {
    return tx.record_type !== "income" && tx.record_type !== "transfer" && tx.amount < 0;
  });

  // Group by normalised name (prefer payee, fall back to note)
  var groups = {};
  for (var i = 0; i < expenses.length; i++) {
    var tx = expenses[i];
    var rawName = (tx.payee && tx.payee.trim()) ? tx.payee : (tx.note || "");
    var key = normalizeName(rawName);
    if (!key || key.length < 2) continue;
    if (!groups[key]) groups[key] = [];
    groups[key].push(tx);
  }

  var detected = [];

  var keys = Object.keys(groups);
  for (var gi = 0; gi < keys.length; gi++) {
    var key = keys[gi];
    var txs = groups[key];
    if (txs.length < minOccurrences) continue;

    // Sort ascending by date
    txs.sort(function (a, b) {
      return new Date(a.record_date).getTime() - new Date(b.record_date).getTime();
    });

    // Intervals in days between consecutive transactions
    var intervals = [];
    for (var ti = 1; ti < txs.length; ti++) {
      var days = (new Date(txs[ti].record_date).getTime() - new Date(txs[ti - 1].record_date).getTime())
        / (1000 * 60 * 60 * 24);
      intervals.push(days);
    }

    var avgInterval = mean(intervals);
    var cycle = classifyCycle(avgInterval);
    if (!cycle) continue;

    var intervalSd = stdDev(intervals);

    // Regularity score: lower deviation relative to expected = better
    var regularityScore = Math.max(0, 1 - (intervalSd / cycle.days));

    // Amount consistency score
    var amounts = txs.map(function (tx) { return Math.abs(tx.amount); });
    var avgAmount = mean(amounts);
    var amountSd = stdDev(amounts);
    var amountScore = avgAmount > 0 ? Math.max(0, 1 - (amountSd / avgAmount)) : 0;

    // Count score: 6+ occurrences gets full marks
    var countScore = Math.min(1, txs.length / 6);

    // Weighted confidence
    var confidence = (regularityScore * 0.50) + (amountScore * 0.30) + (countScore * 0.20);
    confidence = Math.round(confidence * 1000) / 1000;

    if (confidence < minConfidence) continue;

    var lastTx = txs[txs.length - 1];
    var nextDate = new Date(lastTx.record_date);
    nextDate.setDate(nextDate.getDate() + cycle.days);

    // Best display name: most common raw payee/note in the group
    var nameCounts = {};
    for (var ni = 0; ni < txs.length; ni++) {
      var raw = (txs[ni].payee && txs[ni].payee.trim()) ? txs[ni].payee : (txs[ni].note || "");
      nameCounts[raw] = (nameCounts[raw] || 0) + 1;
    }
    var bestName = Object.keys(nameCounts).reduce(function (a, b) {
      return nameCounts[a] >= nameCounts[b] ? a : b;
    });

    detected.push({
      name:             bestName || key,
      normalized_name:  key,
      amount:           Math.round(avgAmount * 100) / 100,
      currency_code:    txs[0].currency_code || "",
      cycle:            cycle.name,
      frequency:        1,
      last_charged:     lastTx.record_date,
      next_expected:    nextDate.toISOString().split("T")[0],
      status:           "pending",
      transaction_count: txs.length,
      confidence:       confidence,
      transaction_ids:  txs.map(function (tx) { return tx.bb_id; }),
    });
  }

  detected.sort(function (a, b) { return b.confidence - a.confidence; });
  return detected;
}

module.exports = { detectSubscriptions, normalizeName };

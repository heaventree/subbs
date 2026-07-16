# Wealthview Enterprise — Product Requirements Document

**Version:** 1.0  
**Date:** 16 July 2026  
**Owner:** Sean O'Byrne / Heaventree  
**Status:** Product definition  
**Product type:** Private, multi-entity financial intelligence and wealth-health platform  

---

## 1. Executive summary

Wealthview must become Sean's private financial operating system: one trusted view across personal finances, sole-trader activity, and two Heaventree companies without flattening legally distinct entities into one misleading total.

Current product is useful spending analysis. It already handles transaction exploration, vendor normalisation, recurring-cost review, net-worth snapshots, cash-flow history, basic rules, and lifetime software purchases. It does not yet provide accounting-grade controls, entity separation, reliable forecasts, tax awareness, anomaly detection, scenario planning, or secure multi-device operation.

Target product must answer five questions at any moment:

1. What do I own, owe, earn, spend, and have committed?
2. Which person or business entity does each amount belong to?
3. What changed, why did it change, and does it need attention?
4. What will cash, tax, profit, and net worth look like over coming weeks, months, and years?
5. What action should I take now?

Wealthview is not intended to replace statutory accounts, payroll, banking, or tax filing in first release. It must reconcile to those systems, preserve evidence, expose differences, and produce accountant-ready exports.

---

## 2. Current-state assessment

### 2.1 What current product does well

- Strong historical transaction coverage from June 2023.
- Detailed vendor-level analysis with typical monthly cost, lifetime average, frequency, and transaction drill-down.
- Vendor normalisation reduces noisy bank descriptions.
- Good recurring-cost and subscription review workflow.
- Useful ledger filters, category drill-down, exports, and monthly cash-flow history.
- Net-worth asset and liability register with snapshots.
- Rules engine gives foundation for automated classification.
- AppSumo/lifetime-deal separation avoids distorting monthly operating cost.
- Local calculations reduce privacy exposure.

### 2.2 Why it feels off-the-shelf

Current model centres on transactions, vendors, categories, and dashboard charts. Serious finance management needs additional dimensions and controls:

- **Entity:** Sean personally, sole trader, Company A, Company B.
- **Account:** bank, card, cash, loan, mortgage, investment, payment processor.
- **Ownership:** legal owner, economic beneficiary, shared/private/business allocation.
- **Counterparty:** supplier, client, employee/director, tax authority, lender.
- **Purpose:** operational cost, capital expenditure, drawings, director loan, reimbursement, transfer, tax, payroll, investment.
- **Evidence:** receipt, invoice, contract, statement, note, approval.
- **Accounting treatment:** tax category, VAT treatment, allowable/non-allowable, capital/revenue, accrual/prepayment.
- **Confidence:** verified, inferred, unresolved, disputed.
- **Time:** transaction date, settlement date, invoice date, due date, service period.

Without these dimensions, app can show where money went but cannot reliably explain financial position, distinguish profit from cash, or forecast obligations.

### 2.3 Critical missing capabilities

#### Foundation and control

- Multi-entity hierarchy and consolidated/group views.
- Account-level ingestion, balances, reconciliation, and data lineage.
- Transfer matching to stop double counting.
- Split transactions across entities, categories, clients, projects, and tax treatments.
- Duplicate detection and correction workflow.
- Closing balances, opening balances, pending transactions, and balance history.
- Audit log, review queue, locks, approvals, and reversible changes.
- Secure server-side database, authentication, encryption, backups, and recovery.

#### Financial intelligence

- Granular budgets by entity, category, account, project, vendor, and period.
- Bills, invoices, receivables, payables, due dates, and committed cash.
- Rolling 13-week cash forecast plus 12-, 24-, and 36-month projections.
- Scenario planning and sensitivity analysis.
- Profit, cash, tax, liquidity, debt, and wealth-health metrics.
- Tax/VAT reserves, deadlines, estimated liabilities, and safe-to-spend cash.
- Business-to-person and intercompany loan/current-account tracking.
- Client/project profitability and revenue concentration.
- Investment performance, pension, property, debt, and net-worth attribution.

#### AI and automation

- Probabilistic transaction classification with visible confidence.
- Anomaly, fraud, duplicate, price-rise, new-charge, and cash-risk alerts.
- Natural-language analysis grounded in traceable calculations.
- Forecast explanations and driver analysis.
- Receipt/invoice extraction and transaction matching.
- Suggested actions, never silent financial changes.
- Learning from corrections per entity and counterparty.

#### Reporting

- Entity P&L-style management reporting.
- Consolidated view with inter-entity eliminations.
- Cash-flow statement, budget variance, tax exposure, subscription exposure, client concentration, debt schedule, and net-worth movement.
- Accountant/auditor evidence packs and export mappings.
- Scheduled reports with period locking and annotations.

---

## 3. Product vision

Create private financial command centre combining personal wealth management, business management accounts, spending intelligence, forecasting, and an explainable AI finance copilot.

### 3.1 Product principles

1. **One view, distinct books.** Consolidate visibility without erasing legal boundaries.
2. **Every number traceable.** KPI must drill to calculation, records, source, and evidence.
3. **Cash is not profit.** Present cash flow, profitability, commitments, tax, and wealth separately.
4. **No silent AI.** AI proposes; user reviews; material changes create audit event.
5. **Uncertainty visible.** Estimates and low-confidence classifications carry labels and ranges.
6. **Exceptions first.** Surface items needing action, not endless passive charts.
7. **Privacy by design.** Minimum data movement, strong encryption, configurable AI exposure.
8. **Accountant compatible.** Imports and exports preserve original values and mappings.
9. **Personalised baseline.** Compare Sean to own history, targets, seasonality, and commitments.
10. **Reversible automation.** Bulk changes preview impact and support rollback.

---

## 4. Goals and non-goals

### 4.1 Goals

- Build accurate daily financial position across all scoped entities.
- Reduce uncategorised or uncertain transactions below 2% by value monthly.
- Produce reliable 13-week cash forecast and tax-reserve estimate.
- Detect overspend, cost creep, duplicates, missed income, unusual activity, and liquidity threats early.
- Show business and personal financial health independently and together.
- Cut monthly financial review time to under 60 minutes after initial setup.
- Produce accountant-ready evidence and exports without spreadsheet reconstruction.
- Support decisions: cancel cost, move cash, chase debtor, reserve tax, reduce debt, invest, or delay spend.

### 4.2 Non-goals for initial release

- Filing statutory accounts or tax returns.
- Acting as regulated financial adviser.
- Initiating bank payments.
- Replacing full double-entry accounting package.
- Payroll calculation or submission.
- Public multi-tenant SaaS billing and onboarding.
- Autonomous investment trading.

---

## 5. Users and operating context

### 5.1 Primary user

Sean: owner/director/sole trader managing interwoven personal and Heaventree finances. Needs comprehensive detail but low-friction workflows, plain English, reliable automation, and clear actions.

### 5.2 Secondary users

- Accountant/bookkeeper: reviews classifications, reconciliations, tax mappings, evidence, and exports.
- Trusted finance administrator: imports documents, resolves exceptions, and prepares reports.
- Read-only adviser: views selected entities, periods, or reports.

### 5.3 Entity model

Initial workspace must support:

- Personal household/person.
- Sole-trader business activity.
- Heaventree Company A.
- Heaventree Company B.
- Optional consolidated Heaventree group view.
- Future trusts, pensions, properties, projects, or additional companies.

Each entity holds own accounts, base currency, tax profile, reporting year, category mapping, budgets, rules, users, documents, and reports.

---

## 6. Information architecture

Primary navigation:

1. **Command Centre** — financial health, exceptions, actions, forecast.
2. **Money** — transactions, accounts, transfers, reconciliation.
3. **Spend** — categories, vendors, subscriptions, budgets, commitments.
4. **Income** — clients, invoices, recurring income, receivables.
5. **Plan** — cash forecast, scenarios, goals, tax calendar.
6. **Wealth** — assets, liabilities, investments, property, net worth.
7. **Reports** — business, personal, group, tax, audit packs.
8. **Documents** — receipts, invoices, statements, contracts.
9. **Assistant** — questions, investigations, briefings, suggested actions.
10. **Control Centre** — entities, accounts, mappings, rules, integrations, security.

Global controls:

- Entity selector: one, several, personal, business, or consolidated.
- Period selector and comparison period.
- Currency/view mode: transaction currency, entity currency, reporting currency.
- Data-quality indicator.
- Universal search and command palette.
- Notifications and review inbox.

---

## 7. Functional requirements

### 7.1 Entity, account, and ownership management

**FR-ENT-001 — Entity registry**  
Create entity with legal/display name, type, ownership, reporting year, base currency, tax identifiers, VAT status, and accountant details.

**FR-ENT-002 — Consolidation groups**  
Combine selected entities for management view while retaining source entity and eliminating matched inter-entity transfers.

**FR-ENT-003 — Account registry**  
Support current, savings, card, cash, loan, mortgage, payment processor, investment, pension, property, and manual accounts.

**FR-ENT-004 — Account ownership**  
Every account belongs to entity or has explicit shared ownership/allocation rule.

**FR-ENT-005 — Personal/business allocation**  
Split mixed costs by fixed percentage, transaction-specific amount, or recurring rule. Preserve gross source transaction plus allocations.

**FR-ENT-006 — Director/current accounts**  
Track money paid personally for company, company-paid personal items, drawings, capital introduced, director loans, reimbursements, and settlements.

**FR-ENT-007 — Intercompany balances**  
Match intercompany movements and maintain amount owed between entities.

**Acceptance:** consolidated totals exclude internal transfers; each entity remains independently reportable; allocations sum exactly to source amount.

### 7.2 Data ingestion and normalisation

- Connect BudgetBakers MCP records/accounts/categories where stable.
- Import CSV, OFX, QIF, CAMT.053, MT940, and spreadsheet templates.
- Accept bank statement PDF as evidence; parsing marked lower-confidence unless verified.
- Support manual entry and opening-balance setup.
- Maintain immutable raw record and separate normalised record.
- Store source name, source ID, import batch, import time, checksum, original description, and original currency.
- Incremental sync using cursor/date windows.
- Idempotent import: same source record cannot create duplicate.
- Fuzzy duplicate engine for overlapping CSV/API imports.
- Pending-to-settled transaction matching.
- Vendor/merchant normalisation with alias registry.
- Counterparty enrichment without overwriting bank description.
- Multi-currency amounts with transaction-date FX rate, source, and manual override.
- Data health report after every import.

### 7.3 Ledger and transaction workbench

Each transaction must support:

- Account, entity, date, settlement date, amount, currency, FX rate.
- Direction and transaction type.
- Normalised counterparty and original description.
- Group, category, subcategory, tags.
- Client, project, department/cost centre, person, property, asset.
- Business/personal designation.
- Tax/VAT code and allowable percentage.
- Capital/revenue classification.
- Recurring schedule or one-off status.
- Receipt/invoice/document links.
- Notes, review state, confidence, verification status.
- Split lines with independent dimensions.

Required workflows:

- Spreadsheet-speed inline editing.
- Keyboard navigation and bulk edit.
- Preview before bulk rules.
- Undo/rollback per operation or import batch.
- Similar-transaction panel.
- “Explain this classification” panel.
- Unresolved-items inbox prioritised by value and risk.
- Lock reconciled/closed periods, with controlled reopen.

### 7.4 Transfer and reconciliation engine

- Detect transfers using amount, currency, FX, dates, descriptions, and account ownership.
- Support one-to-one, one-to-many, card-payment, cash withdrawal, payment-processor settlement, and FX conversion chains.
- Distinguish internal transfers from income/expense.
- Suggest matches with confidence and explanation.
- Reconcile imported balance to statement closing balance.
- Display opening balance + inflows − outflows = expected close versus bank close.
- Track unreconciled value and age.
- Allow reconciliation statement upload and sign-off.
- Prevent edits to reconciled record without controlled exception.

### 7.5 Spending intelligence

- Hierarchical group/category/subcategory taxonomy by entity.
- Vendor dossier with aliases, contracts, price history, charge schedule, spend trend, owner, renewal, cancellation terms, and documents.
- Spend cube: entity × account × vendor × category × client/project × time.
- Fixed, variable, discretionary, essential, debt, tax, investment, and pass-through classifications.
- Recurring-cost detection with non-monthly cadence: weekly, monthly, quarterly, annual, irregular.
- Price-creep detection comparing expected and actual charge.
- Duplicate-service taxonomy for overlapping tools/vendors.
- Unit economics where data exists: cost per client, project, employee, website, or revenue euro.
- Budget envelopes and annual/quarterly/monthly limits.
- Budget pace: elapsed period versus consumed budget.
- Variance breakdown into volume, price, timing, and new-vendor effects where possible.
- Savings opportunity register with owner, action, expected saving, due date, and realised saving.

### 7.6 Income, receivables, and commercial health

- Import or enter invoices, credit notes, expected recurring income, and payment dates.
- Match deposits to invoices and clients.
- Track unpaid, part-paid, overdue, disputed, written-off, and collected states.
- Debtor ageing: current, 1–30, 31–60, 61–90, 90+ days.
- Flag expected income missing or late.
- Revenue by entity, client, service, project, recurring/non-recurring, and period.
- Client concentration and dependency risk.
- Revenue retention/churn for recurring clients.
- Gross contribution and project profitability when costs allocated.
- Pipeline inputs may be manual or integrated later; forecast separates contracted, probable, and speculative income.

### 7.7 Bills, payables, commitments, and renewals

- Bills inbox from upload/email forwarding/integration.
- OCR extraction: supplier, number, date, due date, net, tax, gross, currency, line items.
- Match bill to bank transaction and flag mismatch.
- Track due, scheduled, paid, overdue, disputed, and cancelled.
- Contract/renewal calendar for SaaS, insurance, hosting, domains, loans, leases, utilities, and professional services.
- Commitment register for signed but not yet paid obligations.
- Upcoming cash obligations shown in forecasts.
- Renewal alerts based on notice deadline, not only charge date.

### 7.8 Budgets, goals, and controls

- Budgets by entity, category, vendor, project, cost centre, or account.
- Monthly, quarterly, annual, rolling, and custom-period budgets.
- Rollover or use-it-or-lose-it behaviour.
- Base, target, and hard-limit thresholds.
- Personal sinking funds: tax, holidays, home work, annual insurance, equipment replacement.
- Business reserves: VAT, income/corporation tax, payroll, refunds, emergency cash.
- Goals: emergency fund, debt reduction, pension, investment, property, revenue, margin.
- Goal dependency and priority.
- Budget changes require reason and create version history.

### 7.9 Forecasting engine

Forecast layers:

1. Opening cash from reconciled/current balances.
2. Known receivables and payables.
3. Detected recurring income and costs.
4. Tax/VAT and debt schedules.
5. Seasonal baseline from history.
6. User assumptions and scenarios.
7. Confidence range based on source certainty and historical error.

Required outputs:

- Daily 30-day cash projection.
- Weekly rolling 13-week cash projection.
- Monthly 12-, 24-, and 36-month projection.
- Lowest cash point and date by entity/account.
- Runway at current and stressed burn.
- Safe-to-spend balance after committed spend and reserves.
- Forecast versus actual tracking and model error.
- Driver waterfall explaining change since prior forecast.

Scenarios:

- Base, conservative, severe, and custom.
- Toggle client loss, payment delay, revenue change, cost inflation, staff/vendor addition, debt repayment, tax change, asset purchase, and personal withdrawal.
- Compare scenarios side by side.
- Save, name, clone, and annotate assumptions.
- No scenario alters actual records.

### 7.10 Tax and compliance intelligence

Tax module must be configuration-driven and reviewed with Irish accountant before reliance.

- Entity-specific tax profiles and financial years.
- VAT rate/treatment, input/output VAT estimates, reverse charge, exempt/out-of-scope flags.
- Income/corporation tax estimate inputs and reserve targets.
- Preliminary tax/provisional liability calendar.
- Allowable/non-allowable and mixed-use percentage.
- Capital expenditure register and depreciation/capital-allowance data fields.
- Director/current-account exposure.
- Personal drawings and business capital introduced.
- Tax reserve: estimated liability, cash reserved, funding gap.
- Deadline calendar with escalating reminders.
- Accountant adjustment mechanism; never overwrite source transaction.
- Disclaimer and confidence status on all estimates.

### 7.11 Net worth and asset intelligence

- Asset register: cash, property, business interest, investments, pension, vehicles, equipment, receivables, other.
- Liability register: mortgage, loan, card, tax liability, director/intercompany balance, other.
- Ownership share and entity ownership.
- Valuation source, date, method, confidence, supporting evidence.
- Automatic balance-based valuation where available; manual snapshots elsewhere.
- Debt amortisation schedule, interest rate, fixed term, reset date, overpayment allowance.
- Investment metrics: contributions, withdrawals, income, fees, gain, time-weighted return where data supports it.
- Net-worth movement bridge: earnings, spending, contributions, market movement, debt reduction, valuation change, FX.
- Liquid, semi-liquid, and illiquid net worth.
- Personal versus business net worth; avoid counting company cash and company equity twice.
- Estate/beneficiary metadata optional, access restricted.

### 7.12 AI finance copilot

AI must use tool-based, retrieval-grounded access to authorised financial data. Model must not calculate material totals from free text when deterministic query can calculate them.

Capabilities:

- Answer questions with entity, period, currency, and basis stated.
- Show formula and link every answer to source transactions/reports.
- Classify transactions and documents with confidence score.
- Learn vendor/category preferences from accepted corrections.
- Detect unusual amount, cadence, location, vendor, account, or category patterns.
- Explain month-on-month/year-on-year changes and rank drivers.
- Forecast risks and explain assumptions.
- Find avoidable cost, overlap, dormant subscriptions, and price increases.
- Draft monthly finance briefing.
- Run “what changed since last login?” summary.
- Create proposed rules, budgets, scenario assumptions, or reports through preview/approval workflow.
- Maintain investigation threads with saved evidence.

AI safeguards:

- Read-only default.
- Explicit confirmation for data mutations.
- No bank payment initiation.
- Restricted fields redacted from external models.
- Per-entity and per-user access enforced before retrieval.
- Prompt-injection defence for uploaded documents.
- Model/provider, prompt version, source set, and output logged.
- Hallucination check: unsupported claims labelled or rejected.
- Deterministic recalculation validates totals before display.
- User can select local/private model route where practical.

### 7.13 Warning and alert engine

Severity levels: information, review, warning, critical.

Alert families:

- Balance or runway below threshold.
- Forecasted cash shortfall.
- Tax reserve gap.
- Unusual, duplicate, or unexpectedly large charge.
- Subscription price rise, reactivation, or charge after cancellation.
- New recurring commitment.
- Budget pace or hard-limit breach.
- Client payment late or expected income missing.
- Revenue/client concentration increase.
- Debt interest-rate reset or payment due.
- Renewal/cancellation window approaching.
- Account sync failure, stale data, unreconciled balance, or import anomaly.
- Mixed personal/business transaction requiring treatment.
- Inter-entity imbalance or unreimbursed personal expense.
- Missing receipt/invoice above threshold.
- Category/vendor spend trend outside personal baseline.

Every alert includes why triggered, monetary exposure, supporting data, recommended action, confidence, owner, due date, snooze, resolve, and false-positive feedback.

### 7.14 Reporting suite

#### Command reports

- Daily financial position.
- Weekly exceptions and 13-week cash outlook.
- Monthly wealth-health briefing.
- Annual personal and business review.

#### Business reports

- Management P&L-style income and expenditure.
- Cash movement and closing liquidity.
- Budget versus actual with variance drivers.
- Vendor and category spend.
- Recurring revenue/cost and committed spend.
- Receivables/payables ageing.
- Client concentration and project profitability.
- VAT/tax estimate and reserve coverage.
- Director/current account and intercompany balances.

#### Personal reports

- Household cash flow and savings rate.
- Essential versus discretionary spend.
- Lifestyle inflation.
- Debt and interest schedule.
- Assets, liabilities, liquidity, and net-worth movement.
- Goal progress and retirement/investment contribution tracking.

#### Consolidated reports

- Combined cash visibility.
- Wealth position without double counting.
- Entity contribution to income, spend, cash, and wealth movement.
- Internal transfer eliminations and reconciliation report.

#### Report controls

- Cash/accrual-like management basis clearly labelled.
- Period, entity, account, currency, category, client, and project filters.
- Comparison to prior period, prior year, budget, and forecast.
- Drill-through from chart to ledger.
- Notes, commentary, and period sign-off.
- PDF, XLSX, CSV, and accountant mapping export.
- Saved templates and scheduled generation.
- “As of” timestamp and data freshness on every report.

### 7.15 Documents and evidence

- Upload receipt, invoice, contract, statement, valuation, tax letter, and warranty.
- Email-forwarding address for finance documents in later phase.
- OCR plus original file retention.
- Many-to-many links between documents and transactions/assets/vendors.
- Duplicate-document detection.
- Expiry/renewal reminders.
- Retention policy by document type/entity.
- Full-text search with access controls.
- Export evidence pack by period/vendor/category/transaction.

### 7.16 Search and command centre

Global search across transactions, vendors, clients, accounts, documents, notes, and reports.

Command Centre must show:

- Total net worth and movement.
- Liquid cash and safe-to-spend cash.
- Current-month income, spend, net cash, and budget variance.
- 13-week lowest forecast cash point.
- Tax reserve coverage.
- Business health by entity.
- Personal financial health.
- Top five changes and top five actions.
- Data freshness and unresolved/reconciliation status.

Dashboard must avoid false precision. Estimated numbers use estimate marker and confidence range.

---

## 8. Wealth Health Score

Single headline score is optional; component scores are mandatory. Avoid opaque gamification.

Components, each 0–100:

- Liquidity and emergency runway.
- Cash-flow stability.
- Savings/investment rate.
- Debt burden and interest exposure.
- Tax/reserve readiness.
- Income diversity and client concentration.
- Cost control and recurring commitment.
- Net-worth trajectory.
- Data quality and reconciliation.

Score rules must be visible, configurable, and entity-specific. Display trend, drivers, and actions. Never compare personal and limited-company ratios without context.

---

## 9. Data model

Core objects:

- Workspace
- User, role, permission, session
- Entity, consolidation group, ownership interest
- Account, account balance, institution, connection
- Import batch, source record, sync cursor
- Transaction, transaction split, transfer match
- Counterparty, vendor alias, client
- Category, tag, cost centre, project
- Rule, rule version, rule execution
- Invoice, bill, payment allocation, commitment
- Budget, budget line, goal, sinking fund
- Forecast, forecast line, assumption, scenario
- Tax profile, tax code, tax estimate, deadline
- Asset, liability, valuation, debt schedule
- Document, extraction, document link
- Alert, action, review item
- Report, report snapshot, annotation, sign-off
- AI conversation, tool call, citation, suggestion
- Audit event, reconciliation, period lock
- FX rate and FX provider

Design rules:

- Monetary values stored as integer minor units or fixed-precision decimal, never binary floating point.
- Store original amount/currency and reporting amount/rate.
- Soft delete financial objects; preserve audit history.
- Raw imported data immutable.
- Derived values reproducible from versioned logic.
- Timezone stored per account/entity; timestamps in UTC.
- Every record carries workspace, entity where relevant, created/updated provenance.

---

## 10. Roles and permissions

- **Owner:** all entities, security, integrations, exports, destructive actions.
- **Finance admin:** transactions, documents, reconciliation, reports; no ownership/security changes.
- **Accountant:** scoped review, adjustments, exports, period sign-off.
- **Contributor:** upload and code assigned transactions/documents.
- **Viewer:** read-only scoped reports.

Permissions must support entity, account, feature, action, and field scope. Personal data can be hidden from business accountant except approved reports. Sensitive documents require separate permission.

---

## 11. Non-functional requirements

### 11.1 Security

- Strong authentication with MFA/passkey support.
- Session/device management and forced logout.
- Encryption in transit and at rest.
- Secrets stored server-side; never embedded in SPA.
- Row-level workspace/entity authorisation.
- Least-privilege integration tokens.
- Tamper-evident audit events for material actions.
- Rate limiting, CSRF/XSS/SQL injection protection, secure headers.
- Dependency, secret, and vulnerability scanning in CI.
- Regular backups with tested restore.
- Configurable data export and complete account deletion.
- Security review before live financial integrations; annual penetration test and after major architecture/auth changes.

### 11.2 Privacy

- Data minimisation and configurable retention.
- External AI off by default for sensitive fields until authorised.
- Provider/data-use policy shown before AI activation.
- Redaction/pseudonymisation layer.
- No training on user financial data without explicit opt-in.
- GDPR export, correction, deletion, and processing records.

### 11.3 Reliability and integrity

- Target 99.9% availability once hosted production-grade.
- RPO ≤ 24 hours initially, target ≤ 1 hour after live sync.
- RTO ≤ 8 hours initially, target ≤ 2 hours.
- Import operations idempotent.
- Reconciliation and report totals tested using golden datasets.
- Failed sync cannot silently mark data current.
- Background jobs retry safely and expose status.

### 11.4 Performance

- Command Centre interactive in under 2 seconds for cached current period.
- Ledger search/filter under 1 second for 100,000 transactions under normal load.
- Import 10,000 CSV rows in under 60 seconds excluding user review.
- Long reports and AI investigations run asynchronously with progress state.

### 11.5 Accessibility and UX

- WCAG 2.2 AA target.
- Full keyboard use for ledger and controls.
- Visible focus, semantic labels, non-colour status cues.
- Responsive desktop/tablet; mobile optimised for alerts, review, capture, and quick position.
- UK English, Irish date/number defaults, configurable.
- Dense mode and comfortable mode.
- Plain-English explanations beside accounting terms.

### 11.6 Observability

- Structured application and job logs without leaking full financial data.
- Sync health, job failure, latency, import quality, AI error, and security dashboards.
- User-visible status page for integrations.
- Correlation ID for every import, report, and AI investigation.

---

## 12. Technical architecture

Current single-file SPA/localStorage approach must be treated as prototype only.

Recommended architecture:

- **Frontend:** React + TypeScript + Vite; accessible component system; TanStack Query/Table; chart library with drill-through.
- **API:** TypeScript service layer using Fastify/NestJS or equivalent; OpenAPI contract.
- **Database:** PostgreSQL with strict migrations; row-level controls where suitable.
- **Jobs:** durable queue for imports, sync, OCR, forecasts, reports, alerts.
- **Object storage:** encrypted documents and generated reports.
- **Search:** PostgreSQL full-text initially; dedicated search only when justified.
- **Analytics:** versioned SQL/materialised views; semantic metric definitions.
- **AI gateway:** model-agnostic tool layer, redaction, prompt/version registry, usage limits, evaluation harness.
- **Authentication:** mature managed identity or audited implementation with MFA/passkeys.
- **Deployment:** isolated production/staging; encrypted backups; infrastructure-as-code.

Architectural boundaries:

- Connector layer converts source data to canonical records.
- Ledger layer owns classification, splits, and transfers.
- Finance intelligence layer owns metrics, forecasts, alerts, and reports.
- AI layer can call authorised finance tools but cannot query raw database freely.
- UI never contains API credentials or authoritative calculation logic alone.

Local-first option may retain encrypted offline cache, but backend remains source of truth for multi-device, audit, backup, and jobs.

---

## 13. Integration requirements

Priority integrations:

1. BudgetBakers account and record sync.
2. Per-account CSV/OFX fallback.
3. Irish/UK-compatible Open Banking aggregator if BudgetBakers reliability or terms limit production use.
4. Accounting export/import mapping for accountant's chosen package.
5. Receipt/invoice upload and OCR.
6. Currency-rate source with stored historical rates.
7. Optional payment processors: Stripe, PayPal, GoCardless.
8. Optional invoicing/CRM source.

Each integration requires:

- Read/write scope declaration.
- Last successful sync, coverage dates, and health.
- Revocation and reconnect.
- Source priority rules.
- Duplicate strategy.
- Rate-limit/backoff behaviour.
- Test/sandbox support.
- Data deletion behaviour.

---

## 14. Key workflows

### 14.1 Initial setup

1. Create workspace and entities.
2. Define entity ownership, base currencies, tax years, VAT settings.
3. Add accounts and assign legal owner.
4. Import/sync transactions and balances.
5. Review duplicates and transfer matches.
6. Map categories and vendors.
7. Set mixed-use and inter-entity rules.
8. Reconcile opening/closing balances.
9. Add recurring income, bills, tax reserves, assets, liabilities.
10. Confirm baseline forecast and health thresholds.

### 14.2 Weekly review

1. Check sync/data freshness.
2. Resolve critical alerts.
3. Review high-value/low-confidence transactions.
4. Confirm transfers and missing documents.
5. Review overdue income and upcoming obligations.
6. Check 13-week forecast and tax reserve.
7. Assign savings/risk actions.

### 14.3 Monthly close

1. Reconcile all accounts.
2. Resolve uncategorised, mixed-use, and inter-entity items.
3. Match bills/invoices and update outstanding balances.
4. Review forecast versus actual.
5. Generate entity and consolidated reports.
6. Add commentary and adjustments.
7. Sign off and lock period.
8. Export accountant pack.

---

## 15. Metrics and definitions

Metric dictionary must define formula, grain, filters, currency, source, exclusions, owner, and version.

Core metrics:

- Gross income and collected income.
- Operating spend and total cash outflow.
- Net cash movement.
- Management surplus/deficit.
- Savings rate.
- Fixed/committed monthly cost.
- Discretionary spend.
- Liquid cash.
- Restricted/reserved cash.
- Safe-to-spend cash.
- 13-week minimum cash.
- Runway.
- Receivables/payables and ageing.
- Tax reserve coverage.
- Debt service and interest burden.
- Net worth, liquid net worth, and change attribution.
- Revenue/client concentration.
- Budget variance.
- Forecast accuracy.
- Reconciliation coverage.
- Classification confidence/coverage.

No dashboard metric ships without definition and drill-through test.

---

## 16. Product analytics and success measures

- Percentage accounts synced within expected interval.
- Percentage transaction value reconciled.
- Percentage transaction value fully classified.
- Transfer match precision and user acceptance.
- AI suggestion acceptance and correction rate.
- Forecast error by 1-, 4-, and 13-week horizon.
- Alerts acted on, dismissed, and marked false positive.
- Identified versus realised annual savings.
- Time to complete weekly review and monthly close.
- Number of manual spreadsheet adjustments needed for accountant handoff.
- Security incidents: target zero.

---

## 17. Delivery plan

### Phase 0 — Financial model and controls

- Confirm exact legal entities, accounts, currencies, tax status, year ends, and accountant workflow.
- Create metric dictionary and category/tax mapping.
- Define source-of-truth hierarchy.
- Build anonymised golden test dataset covering transfers, splits, FX, refunds, mixed use, and intercompany activity.

**Exit:** accountant reviews model; test cases agreed.

### Phase 1 — Trusted ledger

- PostgreSQL backend, authentication, entity/account model.
- Robust imports, raw-data lineage, dedupe.
- Granular ledger, splits, transfer matching.
- Reconciliation, review queue, audit history.
- Migrate current vendor/category overrides and asset snapshots.

**Exit:** each account reconciles; consolidated figures eliminate transfers; no localStorage dependency for authoritative data.

### Phase 2 — Spending and operating control

- Advanced vendor dossiers and recurring schedules.
- Budgets, commitments, subscriptions, renewal windows.
- Price creep, duplicate service, unusual spend alerts.
- Savings action register.

**Exit:** monthly spend report traceable; alerts meet agreed precision threshold.

### Phase 3 — Cash, income, and tax readiness

- Invoices/receivables, bills/payables.
- 13-week cash forecast and scenario engine.
- Tax/VAT reserve estimates and deadlines.
- Director/current and intercompany account views.

**Exit:** forecast back-tested; tax logic reviewed by accountant; known commitments represented.

### Phase 4 — Wealth and decision reporting

- Asset/liability/debt schedules.
- Net-worth attribution and double-count protection.
- Full reporting suite, period close, evidence packs.
- Goals and long-range scenarios.

**Exit:** personal, entity, and consolidated monthly packs signed off.

### Phase 5 — AI copilot

- Tool-grounded assistant.
- AI classification, anomaly detection, driver analysis.
- Monthly briefings, investigations, suggested rules/actions.
- AI evaluations, privacy controls, and audit.

**Exit:** calculation accuracy verified; unsupported-answer rate within agreed limit; mutation confirmation proven.

### Phase 6 — Hardening

- Security review and penetration test.
- Backup/restore drill.
- Accessibility audit.
- Performance and recovery tests.
- Operational runbook.

---

## 18. Prioritisation

### Must have before “fit for purpose”

- Multi-entity/account model.
- Secure persistent backend.
- Import lineage, dedupe, transfer matching, splits.
- Reconciliation and audit trail.
- Granular ledger dimensions.
- Recurring/committed spending and budgets.
- Receivables/payables basics.
- 13-week forecast and scenarios.
- Tax/VAT reserve framework.
- Inter-entity/director account tracking.
- Explainable alerts.
- Entity and consolidated reports.
- Reliable exports and backup/restore.

### Should have

- Document OCR and matching.
- Advanced client/project profitability.
- Net-worth attribution.
- AI classification, anomaly detection, and briefings.
- Long-range forecasts and goals.
- Scheduled reports.

### Could have

- Mobile receipt capture app.
- Local LLM option.
- Benchmarking against external peer data.
- Automated investment feeds.
- Email ingestion.
- Shared household user.

---

## 19. Acceptance criteria for product release

Product considered fit for purpose when:

1. Every active account maps to correct entity and displays current balance freshness.
2. Imported totals reconcile to source statements for closed period.
3. Internal transfers do not inflate income or spending.
4. Mixed transactions can split across personal/business, entity, category, project, and tax treatment.
5. Personal, sole-trader, company, and consolidated reports agree with underlying ledger.
6. Consolidated view prevents double counting of inter-entity balances and company equity/cash.
7. 13-week forecast includes known bills, expected receipts, recurring items, tax reserves, and scenario assumptions.
8. Every KPI and AI claim drills to evidence and formula.
9. Alerts state cause, exposure, confidence, and action.
10. Period can reconcile, sign off, lock, export, and later reopen with audit record.
11. Authoritative data survives device loss and tested restore.
12. Access rules prevent business users/accountant from seeing unauthorised personal data.
13. App passes agreed security, accessibility, calculation, and recovery tests.

---

## 20. Risks and mitigations

- **Mixed finances create false reporting.** Mitigation: entity ownership, splits, director/current accounts, mandatory unresolved queue.
- **BudgetBakers data lacks or changes identifiers.** Mitigation: connector abstraction, immutable source records, CSV/OFX fallback, source health monitoring.
- **AI gives convincing wrong answer.** Mitigation: deterministic calculation tools, citations, confidence, evaluations, read-only default.
- **Tax estimates treated as filings.** Mitigation: accountant-reviewed rules, clear estimate status, adjustments, disclaimers.
- **Duplicate feeds inflate figures.** Mitigation: idempotency, fingerprinting, import overlap checks, reconciliation.
- **Net worth double counts company value.** Mitigation: ownership graph and consolidation/elimination logic.
- **Feature density overwhelms user.** Mitigation: exceptions-first Command Centre, progressive disclosure, saved views, plain-English modes.
- **Sensitive data exposed through browser/API keys.** Mitigation: server-side secrets, scoped access, encryption, redaction.
- **Forecast inspires false certainty.** Mitigation: ranges, confidence, assumptions, forecast-versus-actual tracking.
- **Prototype becomes unmaintainable.** Mitigation: modular architecture, tests, migrations, metric registry, release gates.

---

## 21. Decisions needed before build

1. Exact legal names/types of two companies and which Heaventree activity belongs to each.
2. Whether sole-trader activity remains active and which accounts are mixed.
3. Full bank/card/payment-processor account inventory and currencies.
4. Accounting package and accountant export requirements.
5. VAT registration/status and reporting cadence for each business entity.
6. Whether invoices/bills live in another system and can integrate.
7. Preferred authoritative bank-data path: BudgetBakers, direct Open Banking, or hybrid.
8. Required mobile/offline behaviour.
9. External cloud AI tolerance versus private/local model preference.
10. Hosting preference and acceptable monthly operating budget.

---

## 22. Recommended immediate next step

Do not add more dashboard tiles to current single-file SPA first. Run financial data-modelling workshop and build trusted multi-entity ledger foundation. First concrete deliverable should be entity/account map plus sample month reconciled across every account, including transfers, mixed costs, director/current-account movements, refunds, FX, and taxes. Once sample month balances, reporting and forecast layers gain reliable base.


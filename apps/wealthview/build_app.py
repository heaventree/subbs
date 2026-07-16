#!/usr/bin/env python3
"""Build Wealthview — full personal accounting companion (Spendly design kit)."""
import json

with open('/tmp/spendly2_data.json') as f:
    data_json = f.read()

BFKEY = ''  # set your Brandfetch API key here (do not commit)

TEMPLATE = r'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Wealthview</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --canvas:#0B0E14;--surface:#141926;--raised:#1A2030;--border:#232B3B;
  --text:#E6E9EF;--muted:#8A93A6;--dimmed:#5B6373;
  --accent:#6366F1;--accent-h:#818CF8;--accent-12:rgba(99,102,241,.12);--accent-8:rgba(99,102,241,.08);
  --income:#22C55E;--income-t:#34D399;--expense:#EF4444;--expense-t:#F87171;
  --warn:#F59E0B;--cyan:#06B6D4;
}
html,body{height:100%;overflow:hidden;background:var(--canvas);color:var(--text);
  font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  font-size:14px;line-height:1.5;-webkit-font-smoothing:antialiased}
.mono{font-family:'JetBrains Mono','Fira Code','Consolas','Courier New',monospace;font-variant-numeric:tabular-nums}
#app{display:flex;height:100vh;overflow:hidden}
#sidebar{width:232px;flex-shrink:0;background:var(--canvas);border-right:1px solid var(--border);display:flex;flex-direction:column}
.sb-logo{height:64px;display:flex;align-items:center;gap:12px;padding:0 20px;border-bottom:1px solid var(--border);flex-shrink:0}
.sb-mark{width:32px;height:32px;border-radius:8px;background:var(--accent);display:flex;align-items:center;justify-content:center;color:#fff;font-size:15px;font-weight:700}
.sb-name{font-size:17px;font-weight:700;letter-spacing:-.4px}
#sidebar nav{flex:1;padding:14px 12px;display:flex;flex-direction:column;gap:2px;overflow-y:auto}
.nav-sec{font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--dimmed);padding:0 12px;margin:12px 0 6px}
.nav-sec:first-child{margin-top:0}
.nav-item{display:flex;align-items:center;gap:10px;height:34px;padding:0 12px;border-radius:8px;color:var(--muted);font-size:13.5px;cursor:pointer;transition:.15s;user-select:none;white-space:nowrap}
.nav-item:hover{background:var(--surface);color:var(--text)}
.nav-item.active{background:var(--accent-12);color:var(--text);font-weight:500}
.nav-item.active .ni{color:var(--accent-h)}
.ni{width:16px;text-align:center;font-size:13px;flex-shrink:0}
.sb-user{padding:12px;border-top:1px solid var(--border)}
.sb-user-in{display:flex;align-items:center;gap:10px;padding:8px;border-radius:8px;cursor:pointer}
.sb-user-in:hover{background:var(--surface)}
.av-user{width:30px;height:30px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;flex-shrink:0}
#main{flex:1;min-width:0;display:flex;flex-direction:column;overflow:hidden}
.topbar{height:64px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;padding:0 28px;flex-shrink:0}
.tb-sub{font-size:11px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.tb-title{font-size:18px;font-weight:600;line-height:1.2}
.tb-actions{display:flex;align-items:center;gap:10px}
#content{flex:1;overflow-y:auto;overflow-x:hidden}
.view{display:none;padding:28px}
.view.active{display:block}
.btn{display:inline-flex;align-items:center;gap:7px;height:36px;padding:0 15px;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;border:none;transition:.15s;white-space:nowrap;color:var(--text)}
.btn-primary{background:var(--accent);color:#fff}.btn-primary:hover{background:var(--accent-h)}
.btn-sec{background:var(--surface);border:1px solid var(--border)}.btn-sec:hover{border-color:var(--accent)}
.btn-ghost{background:transparent;color:var(--muted)}.btn-ghost:hover{background:var(--raised);color:var(--text)}
.btn-danger{background:transparent;border:1px solid rgba(239,68,68,.4);color:var(--expense-t)}.btn-danger:hover{background:rgba(239,68,68,.1)}
.btn-sm{height:28px;padding:0 10px;font-size:12px;border-radius:6px}
.kpi-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:22px}
.kpi{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:15px}
.kpi.accent{background:var(--accent-8);border-color:rgba(99,102,241,.4)}
.kpi-l{font-size:10.5px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);display:flex;align-items:center;justify-content:space-between;gap:6px}
.kpi-v{font-size:22px;font-weight:600;margin-top:7px}
.kpi-s{font-size:11.5px;color:var(--dimmed);margin-top:5px}
.kpi-bar{margin-top:7px;height:4px;border-radius:2px;background:var(--canvas);overflow:hidden}
.kpi-fill{height:100%;border-radius:2px;background:var(--income)}
.card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:20px}
.badge{display:inline-flex;align-items:center;gap:5px;height:21px;padding:0 8px;border-radius:99px;font-size:11px;font-weight:500;flex-shrink:0;white-space:nowrap}
.bdot{width:6px;height:6px;border-radius:50%}
.b-active{background:rgba(34,197,94,.12);color:var(--income-t)}.b-active .bdot{background:var(--income-t)}
.b-review{background:rgba(245,158,11,.12);color:var(--warn)}.b-review .bdot{background:var(--warn)}
.b-cancelled{background:rgba(239,68,68,.12);color:var(--expense-t)}.b-cancelled .bdot{background:var(--expense-t)}
.b-paused{background:rgba(99,102,241,.12);color:var(--accent-h)}.b-paused .bdot{background:var(--accent-h)}
.b-lapsed{background:rgba(91,99,115,.2);color:var(--dimmed)}.b-lapsed .bdot{background:var(--dimmed)}
.b-cycle{background:var(--accent-12);color:var(--accent-h);border-radius:6px}
.av{display:flex;align-items:center;justify-content:center;font-weight:700;flex-shrink:0;overflow:hidden}
.av img{width:100%;height:100%;object-fit:contain;padding:3px}
.filter-bar{display:flex;align-items:center;gap:9px;margin-bottom:18px;flex-wrap:wrap}
.srch{position:relative}
.srch .si{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:var(--dimmed);font-size:12px;pointer-events:none}
.srch input{height:34px;padding:0 12px 0 32px;background:var(--surface);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:13px;outline:none;transition:.15s;min-width:210px;width:100%}
.srch input:focus{border-color:var(--accent)}
.srch input::placeholder{color:var(--dimmed)}
select.flt{height:34px;padding:0 9px;background:var(--surface);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:12.5px;outline:none;cursor:pointer;max-width:180px}
select.flt:focus{border-color:var(--accent)}
input.flt-n{height:34px;width:84px;padding:0 9px;background:var(--surface);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:12.5px;outline:none}
input.flt-n:focus{border-color:var(--accent)}
.res-ct{margin-left:auto;font-size:12px;color:var(--dimmed);white-space:nowrap}
.sec-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.sec-t{font-size:15px;font-weight:600}
.sec-s{font-size:12px;color:var(--muted);margin-top:2px}
/* charts */
.chart-row{display:grid;grid-template-columns:2fr 1fr;gap:20px;margin-bottom:22px}
.chart-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:22px}
.bar-chart{position:relative;padding-left:38px;margin-top:4px}
.bar-y{position:absolute;left:0;top:0;bottom:20px;display:flex;flex-direction:column;justify-content:space-between;width:34px}
.bar-y span{font-size:10px;color:var(--dimmed);text-align:right;line-height:1}
.bar-area{position:relative}
.bar-grid{position:absolute;inset:0;bottom:20px;display:flex;flex-direction:column;justify-content:space-between;pointer-events:none}
.bar-grid .gl{border-top:1px solid rgba(35,43,59,.6)}
.bars-row{display:flex;align-items:flex-end;justify-content:space-between;gap:4px;height:200px}
.bar-grp{display:flex;align-items:flex-end;justify-content:center;gap:2px;flex:1;height:100%;cursor:pointer;border-radius:4px}
.bar-grp:hover{background:rgba(99,102,241,.06)}
.bar{border-radius:2px 2px 0 0;min-height:2px}
.bi{background:var(--income)}.be{background:var(--accent)}
.bar-xl{display:flex;justify-content:space-between;margin-top:4px;gap:4px}
.bar-xl span{flex:1;text-align:center;font-size:9.5px;color:var(--dimmed);overflow:hidden;white-space:nowrap}
.seg{display:inline-flex;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:2px}
.seg button{height:26px;padding:0 11px;border-radius:6px;border:none;font-size:12px;cursor:pointer;background:transparent;color:var(--muted);transition:.15s}
.seg button.active{background:var(--accent);color:#fff}
.donut-ctr{position:absolute;text-align:center}
.dl-item{display:flex;align-items:center;justify-content:space-between;font-size:12px;gap:6px;padding:2px 0;cursor:pointer;border-radius:5px}
.dl-item:hover{background:var(--raised)}
.dl-dot{width:8px;height:8px;border-radius:2px;flex-shrink:0}
.dl-nm{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--muted)}
/* tables */
.tbl{width:100%;border-collapse:collapse;font-size:13px}
.tbl th{text-align:left;padding:8px 11px;font-size:10.5px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);border-bottom:1px solid var(--border);position:sticky;top:0;background:var(--canvas);z-index:1;cursor:pointer;user-select:none;white-space:nowrap}
.tbl th:hover{color:var(--text)}
.tbl td{padding:9px 11px;border-bottom:1px solid rgba(35,43,59,.4)}
.tbl tr.rowh:hover td{background:rgba(26,32,48,.55);cursor:pointer}
.pgn{display:flex;align-items:center;gap:6px;margin-top:16px;justify-content:flex-end}
.pg-b{height:29px;min-width:29px;padding:0 8px;border-radius:6px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:12px;cursor:pointer;transition:.15s}
.pg-b:hover,.pg-b.active{background:var(--accent);border-color:var(--accent);color:#fff}
.pg-b:disabled{opacity:.3;cursor:default}
/* subs cards */
.cards-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.sub-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:18px;transition:.15s}
.sub-card:hover{border-color:rgba(99,102,241,.5)}
.status-menu{position:relative}
.status-btn{cursor:pointer}
.status-dd{position:absolute;right:0;top:calc(100% + 4px);background:var(--raised);border:1px solid var(--border);border-radius:10px;padding:4px;z-index:100;min-width:140px;box-shadow:0 8px 32px rgba(0,0,0,.5)}
.status-dd .opt{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:6px;cursor:pointer;font-size:13px;white-space:nowrap}
.status-dd .opt:hover{background:var(--border)}
/* modal */
.modal-bg{position:fixed;inset:0;background:rgba(4,6,10,.7);z-index:500;display:none;align-items:flex-start;justify-content:center;padding:5vh 20px;backdrop-filter:blur(2px)}
.modal-bg.open{display:flex}
.modal{background:var(--surface);border:1px solid var(--border);border-radius:16px;width:100%;max-width:760px;max-height:88vh;display:flex;flex-direction:column;box-shadow:0 24px 80px rgba(0,0,0,.6)}
.modal-hd{padding:20px 24px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:14px;flex-shrink:0}
.modal-bd{padding:20px 24px;overflow-y:auto}
.modal-x{margin-left:auto;background:none;border:none;color:var(--muted);font-size:18px;cursor:pointer;padding:6px;border-radius:6px}
.modal-x:hover{background:var(--raised);color:var(--text)}
.stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px}
.stat{background:var(--raised);border:1px solid var(--border);border-radius:9px;padding:11px}
.stat .l{font-size:10px;letter-spacing:.07em;text-transform:uppercase;color:var(--muted);font-weight:500}
.stat .v{font-size:16px;font-weight:600;margin-top:4px}
.spark{display:flex;align-items:flex-end;gap:2px;height:56px;margin:14px 0 4px}
.spark .sb{flex:1;background:var(--accent);border-radius:2px 2px 0 0;min-height:1px;opacity:.85}
.spark .sb:hover{opacity:1}
/* forms */
.form-grp{display:flex;flex-direction:column;gap:5px;margin-bottom:12px}
.form-l{font-size:12px;font-weight:500;color:var(--muted)}
.form-in{height:36px;padding:0 12px;background:var(--raised);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:13px;outline:none;width:100%}
.form-in:focus{border-color:var(--accent)}
select.form-in{cursor:pointer}
/* net worth */
.nw-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.asset-row{display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--raised);border:1px solid var(--border);border-radius:10px;margin-bottom:8px}
.asset-ic{width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
.asset-info{flex:1;min-width:0}
.asset-nm{font-size:13px;font-weight:600}
.asset-ty{font-size:11px;color:var(--muted)}
.asset-val{font-size:15px;font-weight:600}
.asset-val input{width:120px;height:30px;padding:0 8px;background:var(--canvas);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:13px;text-align:right;outline:none}
.asset-val input:focus{border-color:var(--accent)}
.a-del{color:var(--dimmed);background:none;border:none;cursor:pointer;font-size:14px;padding:4px;border-radius:5px}
.a-del:hover{color:var(--expense-t);background:rgba(239,68,68,.1)}
/* rules */
.rule-item{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:13px 15px;display:flex;align-items:center;gap:12px;margin-bottom:9px}
.rule-bd{flex:1;min-width:0}
/* assistant */
.asst-wrap{display:flex;flex-direction:column;height:calc(100vh - 64px)}
.asst-log{flex:1;overflow-y:auto;padding:24px 28px;display:flex;flex-direction:column;gap:14px}
.msg{max-width:78%;padding:12px 15px;border-radius:14px;font-size:13.5px;line-height:1.55}
.msg.user{align-self:flex-end;background:var(--accent);color:#fff;border-bottom-right-radius:4px}
.msg.bot{align-self:flex-start;background:var(--surface);border:1px solid var(--border);border-bottom-left-radius:4px}
.msg.bot table{border-collapse:collapse;margin:8px 0;font-size:12.5px;width:100%}
.msg.bot td,.msg.bot th{padding:4px 10px 4px 0;text-align:left;border-bottom:1px solid var(--border)}
.msg.bot th{color:var(--muted);font-size:10.5px;text-transform:uppercase;letter-spacing:.05em}
.msg.bot .hl{color:var(--accent-h);font-weight:600}
.msg.bot .inc{color:var(--income-t)}.msg.bot .exp{color:var(--expense-t)}
.asst-input{border-top:1px solid var(--border);padding:14px 28px;display:flex;gap:10px;align-items:center;flex-shrink:0;background:var(--canvas)}
.asst-input input{flex:1;height:42px;padding:0 16px;background:var(--surface);border:1px solid var(--border);border-radius:11px;color:var(--text);font-size:14px;outline:none}
.asst-input input:focus{border-color:var(--accent)}
.chips{display:flex;gap:8px;padding:0 28px 12px;flex-wrap:wrap;flex-shrink:0}
.chip{height:28px;padding:0 12px;border-radius:99px;background:var(--surface);border:1px solid var(--border);color:var(--muted);font-size:12px;cursor:pointer;transition:.15s;display:inline-flex;align-items:center;gap:5px}
.chip:hover{border-color:var(--accent);color:var(--text)}
.toast{position:fixed;bottom:22px;right:22px;background:var(--raised);border:1px solid var(--border);border-radius:10px;padding:12px 16px;font-size:13px;z-index:9999;display:none;box-shadow:0 8px 32px rgba(0,0,0,.5);align-items:center;gap:10px}
.toast.show{display:flex;animation:fu .2s ease}
@keyframes fu{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:44px 20px;color:var(--muted);text-align:center;gap:10px}
.empty-ic{font-size:30px;opacity:.4}
::-webkit-scrollbar{width:6px;height:6px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px}
::-webkit-scrollbar-thumb:hover{background:var(--dimmed)}
@media(max-width:920px){#sidebar{display:none}.kpi-grid{grid-template-columns:repeat(2,1fr)}.chart-row,.nw-grid{grid-template-columns:1fr}.cards-grid{grid-template-columns:1fr 1fr}}
</style>
</head>
<body>
<div id="app">
  <aside id="sidebar">
    <div class="sb-logo"><div class="sb-mark">W</div><span class="sb-name">Wealthview</span></div>
    <nav>
      <div class="nav-sec">Analytics</div>
      <div class="nav-item active" data-v="dashboard" onclick="nav('dashboard')"><span class="ni">&#9783;</span>Dashboard</div>
      <div class="nav-item" data-v="networth" onclick="nav('networth')"><span class="ni">&#9670;</span>Net Worth</div>
      <div class="nav-item" data-v="cashflow" onclick="nav('cashflow')"><span class="ni">&#8646;</span>Cash Flow</div>
      <div class="nav-item" data-v="running" onclick="nav('running')"><span class="ni">&#9201;</span>Running Costs</div>
      <div class="nav-sec">Money</div>
      <div class="nav-item" data-v="subs" onclick="nav('subs')"><span class="ni">&#8635;</span>Subscriptions</div>
      <div class="nav-item" data-v="tx" onclick="nav('tx')"><span class="ni">&#9776;</span>Transactions</div>
      <div class="nav-item" data-v="cats" onclick="nav('cats')"><span class="ni">&#9635;</span>Categories</div>
      <div class="nav-sec">Tools</div>
      <div class="nav-item" data-v="rules" onclick="nav('rules')"><span class="ni">&#9881;</span>Rules Engine</div>
      <div class="nav-item" data-v="asst" onclick="nav('asst')"><span class="ni">&#10022;</span>Assistant</div>
    </nav>
    <div class="sb-user"><div class="sb-user-in"><div class="av-user">SO</div><div style="min-width:0"><div style="font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">Sean O&#39;Byrne</div><div style="font-size:11px;color:var(--muted)">Heaventree Ltd.</div></div></div></div>
  </aside>
  <div id="main">
    <div class="topbar">
      <div><div class="tb-sub" id="tb-sub">Overview</div><div class="tb-title" id="tb-title">Dashboard</div></div>
      <div class="tb-actions" id="tb-actions"></div>
    </div>
    <div id="content">
      <div class="view active" id="view-dashboard"></div>
      <div class="view" id="view-networth"></div>
      <div class="view" id="view-cashflow"></div>
      <div class="view" id="view-running"></div>
      <div class="view" id="view-subs"></div>
      <div class="view" id="view-tx"></div>
      <div class="view" id="view-cats"></div>
      <div class="view" id="view-rules"></div>
      <div class="view" id="view-asst" style="padding:0"></div>
    </div>
  </div>
</div>
<div class="modal-bg" id="modal-bg" onclick="if(event.target===this)closeModal()"><div class="modal" id="modal"></div></div>
<div class="toast" id="toast"></div>
<script>
'use strict';
// ═════════════ DATA ═════════════
const RAW=__DATA__;
const BFKEY=localStorage.getItem('wv_bfkey')||'__BFKEY__';
const LOGOC={};

// Expand compact tx: [date, vendorIdx, amount, catIdx, type, recurring]
const V=RAW.vendors, CATS=RAW.cats, GROUPS=RAW.groups;
const GC={}; GROUPS.forEach(g=>GC[g.name]=g.color);
const TX=RAW.tx.map(t=>({d:t[0],v:t[1],a:t[2],c:t[3],t:t[4],r:t[5]===1,
  get vendor(){return V[this.v]},get cat(){return CATS[this.c]}}));
V.forEach((v,i)=>{v.idx=i;v.color=GC[v.group]||'#6B7280';
  v.abbrev=v.name.replace(/[^A-Za-z0-9 ]/g,'').split(' ').filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase()||'?';});

// Vendor tx index
const VTX={}; TX.forEach((t,i)=>{(VTX[t.v]=VTX[t.v]||[]).push(i);});

// Month series (all months in range)
const MONTHS=[...new Set(TX.map(t=>t.d.slice(0,7)))].sort();
const MSER={}; MONTHS.forEach(m=>MSER[m]={inc:0,exp:0});
TX.forEach(t=>{const m=MSER[t.d.slice(0,7)];if(t.t==='i')m.inc+=t.a;else m.exp+=t.a;});
const CURM=MONTHS[MONTHS.length-1];

// ═════════════ STATE ═════════════
const S={view:'dashboard',range:12,
  ov:JSON.parse(localStorage.getItem('wv_ov')||'{}'),         // vendor status overrides
  rec:JSON.parse(localStorage.getItem('wv_rec')||'{}'),       // vendor recurring overrides
  rules:JSON.parse(localStorage.getItem('wv_rules')||'[]'),
  assets:JSON.parse(localStorage.getItem('wv_assets')||'[]'),
  nwHist:JSON.parse(localStorage.getItem('wv_nwhist')||'[]'),
  rSearch:'',rGroup:'',rMin:3,rSort:'avg',rDir:-1,
  sSearch:'',sGroup:'',sStatus:'',
  tSearch:'',tType:'all',tGroup:'',tCat:'',tYear:'',tMin:'',tMax:'',tRec:'',tPage:1,tSort:'d',tDir:-1,
  cfYear:'',
};
function save(){['ov','rec','rules','assets','nwHist'].forEach(k=>localStorage.setItem('wv_'+(k==='nwHist'?'nwhist':k),JSON.stringify(S[k])));}

// ═════════════ HELPERS ═════════════
const fmt=n=>new Intl.NumberFormat('en-IE',{style:'currency',currency:'EUR',minimumFractionDigits:2}).format(n);
const fmt0=n=>new Intl.NumberFormat('en-IE',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n);
const fmtD=s=>{if(!s)return'—';const d=new Date(s+'T00:00:00');return d.toLocaleDateString('en-IE',{day:'2-digit',month:'short',year:'2-digit'})};
const fmtM=m=>{const d=new Date(m+'-15');return d.toLocaleDateString('en-IE',{month:'short',year:'2-digit'})};
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
function toast(m,c){const e=document.getElementById('toast');e.innerHTML=`<span style="color:${c||'#34D399'}">&#9679;</span> ${m}`;e.classList.add('show');clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove('show'),2600);}

function isRecurring(v){ if(S.rec[v.id]!==undefined)return S.rec[v.id]; return v.recurring; }
function vStatus(v){
  if(S.ov[v.id])return S.ov[v.id];
  const days=(new Date(CURM+'-28')-new Date(v.last))/864e5;
  if(days<50)return'active'; if(days<100)return'review'; return'lapsed';
}
// 3-month actual average for a vendor
function avg3(v){
  const cut=MONTHS.slice(-3);
  let t=0;(VTX[v.idx]||[]).forEach(i=>{if(cut.includes(TX[i].d.slice(0,7))&&TX[i].t==='e')t+=TX[i].a;});
  return t/3;
}
function avHtml(v,sz,idp){
  sz=sz||38;const br=sz<=28?7:sz<=34?8:10;
  return `<div class="av" id="${idp||'av'}_${v.id}" data-dom="${v.domain||''}" style="width:${sz}px;height:${sz}px;border-radius:${br}px;background:${v.color}1F;color:${v.color};font-size:${Math.round(sz*.3)}px">${v.abbrev}</div>`;
}
function loadLogos(prefix,list){
  if(!BFKEY)return;
  setTimeout(()=>{list.forEach(v=>{
    if(!v.domain)return;
    const el=document.getElementById(`${prefix}_${v.id}`);
    if(!el)return;
    if(LOGOC[v.domain]===false)return;
    if(LOGOC[v.domain]){el.innerHTML=`<img src="${LOGOC[v.domain]}" alt="">`;return;}
    fetch('https://api.brandfetch.io/v2/brands/'+v.domain,{headers:{Authorization:'Bearer '+BFKEY}})
      .then(r=>r.ok?r.json():null).then(d=>{
        const lg=d&&d.logos&&d.logos[0]&&d.logos[0].formats&&d.logos[0].formats[0]&&d.logos[0].formats[0].src;
        LOGOC[v.domain]=lg||false;
        if(lg&&el.isConnected)el.innerHTML=`<img src="${lg}" alt="">`;
      }).catch(()=>{LOGOC[v.domain]=false;});
  });},60);
}
function sum(arr,f){return arr.reduce((a,x)=>a+f(x),0);}

// ═════════════ NAV ═════════════
const TITLES={dashboard:['Overview','Dashboard'],networth:['Wealth','Net Worth'],cashflow:['Money In / Out','Cash Flow'],
  running:['Burn Rate','Running Costs'],subs:['Recurring','Subscriptions'],tx:['Ledger','Transactions'],
  cats:['Breakdown','Categories'],rules:['Automation','Rules Engine'],asst:['AI','Assistant']};
const RENDER={};
function nav(v){
  S.view=v;
  document.querySelectorAll('.nav-item').forEach(el=>el.classList.toggle('active',el.dataset.v===v));
  document.querySelectorAll('.view').forEach(el=>el.classList.remove('active'));
  document.getElementById('view-'+v).classList.add('active');
  document.getElementById('tb-sub').textContent=TITLES[v][0];
  document.getElementById('tb-title').textContent=TITLES[v][1];
  const ac=document.getElementById('tb-actions');
  if(v==='tx')ac.innerHTML=`<button class="btn btn-sec" onclick="xTx()">&#8615; Export CSV</button>`;
  else if(v==='running')ac.innerHTML=`<button class="btn btn-sec" onclick="xRun()">&#8615; Export CSV</button>`;
  else if(v==='rules')ac.innerHTML=`<button class="btn btn-primary" onclick="applyRules()">&#9658; Apply rules</button>`;
  else if(v==='networth')ac.innerHTML=`<button class="btn btn-primary" onclick="addAssetModal()">+ Add asset / liability</button>`;
  else ac.innerHTML='';
  RENDER[v]();
}

// ═════════════ DASHBOARD ═════════════
RENDER.dashboard=function(){
  const el=document.getElementById('view-dashboard');
  const mo=MONTHS.slice(-S.range);
  // Life running cost: avg expenses over last 3 COMPLETE months (exclude current partial)
  const compl=MONTHS.slice(-4,-1);
  const burn3=sum(compl,m=>MSER[m].exp)/compl.length;
  const inc3=sum(compl,m=>MSER[m].inc)/compl.length;
  const cur=MSER[CURM];
  const nw=nwTotal();
  const recV=V.filter(v=>v.type==='e'&&isRecurring(v)&&vStatus(v)!=='lapsed'&&vStatus(v)!=='cancelled');
  const recMo=sum(recV,v=>avg3(v));

  const maxB=Math.max(...mo.map(m=>Math.max(MSER[m].inc,MSER[m].exp)));
  const maxY=Math.ceil(maxB/2000)*2000;const H=200;
  const bw=mo.length>18?5:9;
  const bars=mo.map(m=>{
    const s=MSER[m];
    return `<div class="bar-grp" onclick="monthModal('${m}')" title="${fmtM(m)} — in ${fmt0(s.inc)} / out ${fmt0(s.exp)}"><div class="bar bi" style="height:${Math.round(s.inc/maxY*H)}px;width:${bw}px"></div><div class="bar be" style="height:${Math.round(s.exp/maxY*H)}px;width:${bw}px"></div></div>`;
  }).join('');
  const ylb=[maxY,maxY*.75,maxY/2,maxY*.25,0].map(v=>`<span>${v>=1000?Math.round(v/1e3)+'k':v}</span>`).join('');
  const xlb=mo.map((m,i)=>`<span class="${m===CURM?'cur':''}" style="${m===CURM?'color:var(--accent-h);font-weight:600':''}">${mo.length>18?(i%3===0?fmtM(m):''):fmtM(m)}</span>`).join('');

  // Donut: expense by group (selected range)
  const gTot={};
  TX.forEach(t=>{if(t.t==='e'&&mo.includes(t.d.slice(0,7))){const g=t.cat.group;gTot[g]=(gTot[g]||0)+t.a;}});
  const gl=Object.entries(gTot).sort((a,b)=>b[1]-a[1]);
  const gsum=sum(gl,x=>x[1]);
  let off=0;const CIRC=2*Math.PI*66;
  const arcs=gl.slice(0,9).map(([g,t])=>{const len=t/gsum*CIRC;
    const a=`<circle cx="86" cy="86" r="66" fill="none" stroke="${GC[g]||'#6B7280'}" stroke-width="19" stroke-dasharray="${len.toFixed(1)} ${CIRC.toFixed(1)}" stroke-dashoffset="${(-off).toFixed(1)}"/>`;off+=len;return a;}).join('');
  const dlg=gl.slice(0,9).map(([g,t])=>`<div class="dl-item" onclick="S.tGroup='${esc(g)}';S.tPage=1;nav('tx')"><div class="dl-dot" style="background:${GC[g]||'#6B7280'}"></div><span class="dl-nm">${g}</span><span class="mono" style="font-size:12px">${fmt0(t)}</span></div>`).join('');

  // Top running costs (active recurring by 3-mo avg)
  const top=recV.map(v=>({v,m:avg3(v)})).filter(x=>x.m>1).sort((a,b)=>b.m-a.m).slice(0,8);
  const topH=top.map(({v,m})=>`<div class="asset-row" style="margin-bottom:7px;cursor:pointer" onclick="vendorModal(${v.idx})">${avHtml(v,34,'dtv')}<div class="asset-info"><div class="asset-nm">${esc(v.name)}</div><div class="asset-ty">${v.group} · ${v.count}× lifetime</div></div><div class="mono" style="font-size:13px;font-weight:600;color:var(--expense-t)">${fmt(m)}<span style="font-size:10px;color:var(--dimmed);font-weight:400">/mo</span></div></div>`).join('');

  // Recent
  const rec12=TX.slice(0,11);
  const recH=rec12.map(t=>{const v=t.vendor;
    return `<div class="asset-row" style="margin-bottom:6px;padding:9px 12px;cursor:pointer" onclick="vendorModal(${v.idx})">${avHtml(v,30,'drx'+Math.random().toString(36).slice(2,6))}<div class="asset-info"><div class="asset-nm" style="font-size:12.5px">${esc(v.name)}</div><div class="asset-ty">${esc(t.cat.name)}</div></div><div style="text-align:right"><div class="mono" style="font-size:12.5px;font-weight:600;color:${t.t==='i'?'var(--income-t)':'var(--expense-t)'}">${t.t==='i'?'+':'-'}${fmt(t.a)}</div><div style="font-size:10.5px;color:var(--dimmed)">${fmtD(t.d)}</div></div></div>`;}).join('');

  el.innerHTML=`
<div class="kpi-grid">
  <div class="kpi accent"><div class="kpi-l" style="color:var(--accent-h)">Net Worth</div><div class="kpi-v mono">${nw.assets||nw.liab?fmt0(nw.net):'—'}</div><div class="kpi-s">${nw.assets||nw.liab?`${fmt0(nw.assets)} assets − ${fmt0(nw.liab)} debt`:'Add assets to track'}</div></div>
  <div class="kpi"><div class="kpi-l">Life Running Cost <span style="color:var(--expense-t)">&#9201;</span></div><div class="kpi-v mono">${fmt0(burn3)}</div><div class="kpi-s">avg monthly spend · last 3 mo</div></div>
  <div class="kpi"><div class="kpi-l">Avg Income / mo <span style="color:var(--income-t)">&#8599;</span></div><div class="kpi-v mono">${fmt0(inc3)}</div><div class="kpi-s">last 3 complete months</div></div>
  <div class="kpi"><div class="kpi-l">Recurring / mo <span>&#8635;</span></div><div class="kpi-v mono">${fmt0(recMo)}</div><div class="kpi-s">${recV.length} active recurring vendors</div></div>
  <div class="kpi"><div class="kpi-l">${fmtM(CURM)} so far</div><div class="kpi-v mono" style="color:${cur.inc-cur.exp>=0?'var(--income-t)':'var(--expense-t)'}">${cur.inc-cur.exp>=0?'+':''}${fmt0(cur.inc-cur.exp)}</div><div class="kpi-s">in ${fmt0(cur.inc)} · out ${fmt0(cur.exp)}</div></div>
</div>
<div class="chart-row">
  <div class="chart-card">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px">
      <div><div class="sec-t">Income vs Expenses</div><div class="sec-s">Click a month to drill in · EUR</div></div>
      <div style="display:flex;align-items:center;gap:12px">
        <div class="seg"><button class="${S.range===12?'active':''}" onclick="S.range=12;RENDER.dashboard()">12m</button><button class="${S.range===24?'active':''}" onclick="S.range=24;RENDER.dashboard()">24m</button><button class="${S.range===99?'active':''}" onclick="S.range=99;RENDER.dashboard()">All</button></div>
        <div style="display:flex;gap:12px;font-size:11.5px;color:var(--muted)"><span style="display:flex;align-items:center;gap:5px"><span style="width:9px;height:9px;border-radius:3px;background:var(--income);display:inline-block"></span>In</span><span style="display:flex;align-items:center;gap:5px"><span style="width:9px;height:9px;border-radius:3px;background:var(--accent);display:inline-block"></span>Out</span></div>
      </div>
    </div>
    <div class="bar-chart">
      <div class="bar-y">${ylb}</div>
      <div class="bar-area">
        <div class="bar-grid"><div class="gl"></div><div class="gl"></div><div class="gl"></div><div class="gl"></div><div class="gl"></div></div>
        <div class="bars-row">${bars}</div>
        <div class="bar-xl">${xlb}</div>
      </div>
    </div>
  </div>
  <div class="chart-card" style="display:flex;flex-direction:column">
    <div class="sec-t">Spend by Group</div>
    <div class="sec-s" style="margin-bottom:6px">${S.range===99?'All time':'Last '+S.range+' months'} · click to filter</div>
    <div style="display:flex;align-items:center;justify-content:center;position:relative;margin:2px 0">
      <svg width="172" height="172" viewBox="0 0 172 172" style="transform:rotate(-90deg)"><circle cx="86" cy="86" r="66" fill="none" stroke="var(--raised)" stroke-width="19"/>${arcs}</svg>
      <div class="donut-ctr"><div class="mono" style="font-size:18px;font-weight:700">${fmt0(gsum)}</div><div style="font-size:10.5px;color:var(--muted)">total out</div></div>
    </div>
    <div style="overflow-y:auto;flex:1;margin-top:4px">${dlg}</div>
  </div>
</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
  <div><div class="sec-hdr"><div><div class="sec-t">Top Running Costs</div><div class="sec-s">3-month actual average</div></div><button class="btn btn-ghost btn-sm" onclick="nav('running')">View all &#8594;</button></div>${topH}</div>
  <div><div class="sec-hdr"><div><div class="sec-t">Recent Activity</div><div class="sec-s">Latest transactions</div></div><button class="btn btn-ghost btn-sm" onclick="nav('tx')">View all &#8594;</button></div>${recH}</div>
</div>`;
  loadLogos('dtv',top.map(x=>x.v));
};

// ═════════════ NET WORTH ═════════════
function nwTotal(){
  const a=sum(S.assets.filter(x=>x.kind==='asset'),x=>x.value);
  const l=sum(S.assets.filter(x=>x.kind==='liability'),x=>x.value);
  return{assets:a,liab:l,net:a-l};
}
function snapNW(){
  const t=nwTotal();const today=new Date().toISOString().slice(0,10);
  S.nwHist=S.nwHist.filter(h=>h.d!==today);
  S.nwHist.push({d:today,a:t.assets,l:t.liab,n:t.net});
  S.nwHist.sort((x,y)=>x.d<y.d?-1:1);
  if(S.nwHist.length>400)S.nwHist=S.nwHist.slice(-400);
  save();
}
const AICONS={property:'&#127968;',cash:'&#128176;',investment:'&#128200;',vehicle:'&#128663;',business:'&#127970;',pension:'&#127793;',other:'&#128188;',mortgage:'&#127974;',loan:'&#128179;',credit:'&#128181;'};
RENDER.networth=function(){
  const el=document.getElementById('view-networth');
  const t=nwTotal();
  const assets=S.assets.filter(x=>x.kind==='asset');
  const liabs=S.assets.filter(x=>x.kind==='liability');
  const row=x=>`<div class="asset-row"><div class="asset-ic" style="background:${x.kind==='asset'?'rgba(34,197,94,.12)':'rgba(239,68,68,.12)'}">${AICONS[x.cls]||'&#128188;'}</div><div class="asset-info"><div class="asset-nm">${esc(x.name)}</div><div class="asset-ty">${x.cls} · updated ${fmtD(x.updated)}</div></div><div class="asset-val"><input type="number" value="${x.value}" onchange="updAsset('${x.id}',this.value)"></div><button class="a-del" onclick="delAsset('${x.id}')">&#10005;</button></div>`;
  // history chart
  let histH='';
  if(S.nwHist.length>1){
    const hs=S.nwHist;const mx=Math.max(...hs.map(h=>h.n),1);const mn=Math.min(...hs.map(h=>h.n),0);
    const rng=mx-mn||1;
    const pts=hs.map((h,i)=>`${(i/(hs.length-1)*100).toFixed(1)},${(100-(h.n-mn)/rng*90-5).toFixed(1)}`).join(' ');
    histH=`<div class="card" style="margin-top:18px"><div class="sec-t" style="margin-bottom:4px">Net Worth Over Time</div><div class="sec-s" style="margin-bottom:12px">${hs.length} snapshots — auto-saved on every change</div>
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style="width:100%;height:130px;display:block"><polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="1.2" vector-effect="non-scaling-stroke"/><polygon points="0,100 ${pts} 100,100" fill="rgba(99,102,241,.12)"/></svg>
    <div style="display:flex;justify-content:space-between;font-size:10.5px;color:var(--dimmed);margin-top:4px"><span>${fmtD(hs[0].d)}</span><span>${fmtD(hs[hs.length-1].d)}</span></div></div>`;
  }
  el.innerHTML=`
<div class="kpi-grid" style="grid-template-columns:repeat(3,1fr)">
  <div class="kpi accent"><div class="kpi-l" style="color:var(--accent-h)">Net Worth</div><div class="kpi-v mono" style="font-size:26px">${fmt0(t.net)}</div></div>
  <div class="kpi"><div class="kpi-l">Total Assets</div><div class="kpi-v mono" style="color:var(--income-t)">${fmt0(t.assets)}</div><div class="kpi-s">${assets.length} items</div></div>
  <div class="kpi"><div class="kpi-l">Total Liabilities</div><div class="kpi-v mono" style="color:var(--expense-t)">${fmt0(t.liab)}</div><div class="kpi-s">${liabs.length} items</div></div>
</div>
<div class="nw-grid">
  <div><div class="sec-hdr"><div class="sec-t" style="color:var(--income-t)">Assets</div></div>${assets.map(row).join('')||'<div class="empty"><div class="empty-ic">&#127968;</div><div>No assets yet — add your house value, savings, investments…</div></div>'}</div>
  <div><div class="sec-hdr"><div class="sec-t" style="color:var(--expense-t)">Liabilities</div></div>${liabs.map(row).join('')||'<div class="empty"><div class="empty-ic">&#127974;</div><div>No liabilities — add mortgage, loans, credit balances…</div></div>'}</div>
</div>
${histH}`;
};
function addAssetModal(){
  openModal(`<div class="modal-hd"><div class="sec-t">Add asset or liability</div><button class="modal-x" onclick="closeModal()">&#10005;</button></div>
<div class="modal-bd">
  <div class="form-grp"><div class="form-l">Type</div><select class="form-in" id="a-kind"><option value="asset">Asset</option><option value="liability">Liability</option></select></div>
  <div class="form-grp"><div class="form-l">Class</div><select class="form-in" id="a-cls"><option value="property">Property / House</option><option value="cash">Cash & Savings</option><option value="investment">Investments</option><option value="pension">Pension</option><option value="vehicle">Vehicle</option><option value="business">Business equity</option><option value="mortgage">Mortgage</option><option value="loan">Loan</option><option value="credit">Credit / Flexi</option><option value="other">Other</option></select></div>
  <div class="form-grp"><div class="form-l">Name</div><input class="form-in" id="a-name" placeholder="e.g. Home (Galway), AIB Savings, PTSB Mortgage"></div>
  <div class="form-grp"><div class="form-l">Current value (EUR)</div><input class="form-in" id="a-val" type="number" placeholder="e.g. 385000"></div>
  <button class="btn btn-primary" onclick="addAsset()">Add</button>
</div>`);
}
function addAsset(){
  const name=document.getElementById('a-name').value.trim();
  const val=parseFloat(document.getElementById('a-val').value);
  if(!name||isNaN(val)){toast('Name and value required','#F59E0B');return;}
  S.assets.push({id:'a'+Math.random().toString(36).slice(2,9),kind:document.getElementById('a-kind').value,
    cls:document.getElementById('a-cls').value,name,value:val,updated:new Date().toISOString().slice(0,10)});
  snapNW();closeModal();RENDER.networth();toast('Added — net worth updated');
}
function updAsset(id,val){const x=S.assets.find(a=>a.id===id);if(!x)return;x.value=parseFloat(val)||0;x.updated=new Date().toISOString().slice(0,10);snapNW();RENDER.networth();toast('Value updated');}
function delAsset(id){S.assets=S.assets.filter(a=>a.id!==id);snapNW();RENDER.networth();toast('Removed','#F87171');}

// ═════════════ CASH FLOW ═════════════
RENDER.cashflow=function(){
  const el=document.getElementById('view-cashflow');
  const years=[...new Set(MONTHS.map(m=>m.slice(0,4)))].sort().reverse();
  const mo=(S.cfYear?MONTHS.filter(m=>m.startsWith(S.cfYear)):MONTHS).slice().reverse();
  const maxN=Math.max(...mo.map(m=>Math.max(MSER[m].inc,MSER[m].exp)),1);
  const rows=mo.map(m=>{const s=MSER[m];const n=s.inc-s.exp;
    return `<tr class="rowh" onclick="monthModal('${m}')">
<td style="font-weight:600">${fmtM(m)}${m===CURM?' <span style="font-size:10px;color:var(--accent-h)">(current)</span>':''}</td>
<td><div style="display:flex;align-items:center;gap:8px"><div style="flex:1;max-width:180px;height:7px;border-radius:4px;background:var(--raised);overflow:hidden"><div style="height:100%;width:${(s.inc/maxN*100).toFixed(1)}%;background:var(--income);border-radius:4px"></div></div><span class="mono" style="color:var(--income-t);font-size:12.5px">${fmt0(s.inc)}</span></div></td>
<td><div style="display:flex;align-items:center;gap:8px"><div style="flex:1;max-width:180px;height:7px;border-radius:4px;background:var(--raised);overflow:hidden"><div style="height:100%;width:${(s.exp/maxN*100).toFixed(1)}%;background:var(--accent);border-radius:4px"></div></div><span class="mono" style="color:var(--expense-t);font-size:12.5px">${fmt0(s.exp)}</span></div></td>
<td class="mono" style="font-weight:600;color:${n>=0?'var(--income-t)':'var(--expense-t)'}">${n>=0?'+':''}${fmt0(n)}</td>
<td class="mono" style="font-size:11.5px;color:var(--dimmed)">${s.inc>0?Math.round((n)/s.inc*100)+'%':'—'}</td></tr>`;
  }).join('');
  const ti=sum(mo,m=>MSER[m].inc),te=sum(mo,m=>MSER[m].exp);
  el.innerHTML=`
<div class="filter-bar">
  <div class="seg"><button class="${!S.cfYear?'active':''}" onclick="S.cfYear='';RENDER.cashflow()">All</button>${years.map(y=>`<button class="${S.cfYear===y?'active':''}" onclick="S.cfYear='${y}';RENDER.cashflow()">${y}</button>`).join('')}</div>
  <span class="res-ct">In ${fmt0(ti)} · Out ${fmt0(te)} · Net <span style="color:${ti-te>=0?'var(--income-t)':'var(--expense-t)'}">${ti-te>=0?'+':''}${fmt0(ti-te)}</span></span>
</div>
<table class="tbl"><thead><tr><th>Month</th><th>Income</th><th>Expenses</th><th>Net</th><th>Save %</th></tr></thead><tbody>${rows}</tbody></table>`;
};

// ═════════════ RUNNING COSTS ═════════════
function runList(){
  let l=V.filter(v=>v.type==='e'&&v.count>=S.rMin);
  if(S.rSearch){const q=S.rSearch.toLowerCase();l=l.filter(v=>v.name.toLowerCase().includes(q)||v.group.toLowerCase().includes(q));}
  if(S.rGroup)l=l.filter(v=>v.group===S.rGroup);
  const key={avg:v=>v.avgMonthly,total:v=>v.total,count:v=>v.count,last:v=>v.last,name:v=>v.name};
  const f=key[S.rSort]||key.avg;
  l.sort((a,b)=>{const x=f(a),y=f(b);return(x<y?-1:x>y?1:0)*S.rDir;});
  return l;
}
RENDER.running=function(){
  const el=document.getElementById('view-running');
  const l=runList();
  const groups=[...new Set(V.filter(v=>v.type==='e').map(v=>v.group))].sort();
  const compl=MONTHS.slice(-4,-1);
  const burn=sum(compl,m=>MSER[m].exp)/compl.length;
  const active=l.filter(v=>vStatus(v)==='active');
  const rows=l.slice(0,300).map(v=>{
    const st=vStatus(v);const rec=isRecurring(v);
    return `<tr class="rowh" onclick="vendorModal(${v.idx})">
<td><div style="display:flex;align-items:center;gap:10px">${avHtml(v,30,'rv')}<div style="min-width:0"><div style="font-weight:500;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:220px">${esc(v.name)}</div><div style="font-size:10.5px;color:var(--dimmed)">${v.group}</div></div></div></td>
<td>${rec?'<span class="badge b-cycle">&#8635; recurring</span>':'<span style="font-size:11px;color:var(--dimmed)">one-off</span>'}</td>
<td class="mono" style="font-size:12px">${v.count}&times;</td>
<td class="mono" style="font-size:11.5px;color:var(--muted)">${fmtD(v.first)} &#8594; ${fmtD(v.last)}</td>
<td class="mono" style="font-weight:600;color:var(--expense-t)">${fmt(v.avgMonthly)}</td>
<td class="mono" style="font-size:12.5px">${fmt0(v.total)}</td>
<td><span class="badge b-${st}"><span class="bdot"></span>${st}</span></td></tr>`;
  }).join('');
  el.innerHTML=`
<div class="kpi-grid" style="grid-template-columns:repeat(4,1fr)">
  <div class="kpi accent"><div class="kpi-l" style="color:var(--accent-h)">Life Running Cost</div><div class="kpi-v mono">${fmt0(burn)}/mo</div><div class="kpi-s">actual avg · last 3 complete months</div></div>
  <div class="kpi"><div class="kpi-l">Vendors shown</div><div class="kpi-v mono">${l.length}</div><div class="kpi-s">min ${S.rMin} charges</div></div>
  <div class="kpi"><div class="kpi-l">Still active</div><div class="kpi-v mono" style="color:var(--income-t)">${active.length}</div><div class="kpi-s">charged in last 50 days</div></div>
  <div class="kpi"><div class="kpi-l">Combined avg</div><div class="kpi-v mono">${fmt0(sum(l,v=>v.avgMonthly))}/mo</div><div class="kpi-s">sum of listed vendor averages</div></div>
</div>
<div class="filter-bar">
  <div class="srch"><span class="si">&#128269;</span><input placeholder="Search vendors…" value="${esc(S.rSearch)}" oninput="S.rSearch=this.value;RENDER.running()"></div>
  <select class="flt" onchange="S.rGroup=this.value;RENDER.running()"><option value="">All groups</option>${groups.map(g=>`<option ${S.rGroup===g?'selected':''}>${g}</option>`).join('')}</select>
  <select class="flt" onchange="S.rMin=+this.value;RENDER.running()"><option value="1"${S.rMin===1?' selected':''}>Min 1 charge</option><option value="2"${S.rMin===2?' selected':''}>Min 2</option><option value="3"${S.rMin===3?' selected':''}>Min 3</option><option value="6"${S.rMin===6?' selected':''}>Min 6</option><option value="12"${S.rMin===12?' selected':''}>Min 12</option></select>
  <select class="flt" onchange="const[k,d]=this.value.split(':');S.rSort=k;S.rDir=+d;RENDER.running()">
    <option value="avg:-1">Avg/mo: high &#8594; low</option><option value="total:-1"${S.rSort==='total'?' selected':''}>Lifetime total</option>
    <option value="count:-1"${S.rSort==='count'?' selected':''}>Most charges</option><option value="last:-1"${S.rSort==='last'?' selected':''}>Recently charged</option>
    <option value="name:1"${S.rSort==='name'?' selected':''}>Name A&#8211;Z</option></select>
  <span class="res-ct">${l.length} vendors${l.length>300?' (showing 300)':''}</span>
</div>
<table class="tbl"><thead><tr><th>Vendor</th><th>Type</th><th>Charges</th><th>Active period</th><th>Avg / month</th><th>Lifetime</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`;
  loadLogos('rv',l.slice(0,300));
};

// ═════════════ SUBSCRIPTIONS ═════════════
function subsList(){
  let l=V.filter(v=>v.type==='e'&&isRecurring(v));
  if(S.sSearch){const q=S.sSearch.toLowerCase();l=l.filter(v=>v.name.toLowerCase().includes(q));}
  if(S.sGroup)l=l.filter(v=>v.group===S.sGroup);
  if(S.sStatus)l=l.filter(v=>vStatus(v)===S.sStatus);
  l.sort((a,b)=>avg3(b)-avg3(a));
  return l;
}
RENDER.subs=function(){
  const el=document.getElementById('view-subs');
  const all=V.filter(v=>v.type==='e'&&isRecurring(v));
  const l=subsList();
  const act=all.filter(v=>['active','review'].includes(vStatus(v)));
  const mo=sum(act,v=>avg3(v));
  const groups=[...new Set(all.map(v=>v.group))].sort();
  const cards=l.slice(0,120).map(v=>{
    const st=vStatus(v);const m3=avg3(v);
    return `<div class="sub-card">
<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
  <div style="display:flex;align-items:center;gap:11px;min-width:0">${avHtml(v,38,'sv')}
    <div style="min-width:0"><div style="font-size:13.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(v.name)}</div><div style="font-size:10.5px;color:var(--muted);margin-top:1px">${v.group}</div></div></div>
  <div class="status-menu"><div class="status-btn badge b-${st}" onclick="event.stopPropagation();togSM('${v.id}')"><span class="bdot"></span>${st} &#9662;</div>
    <div class="status-dd" id="sm_${v.id}" style="display:none">
      ${['active','review','paused','cancelled'].map(s=>`<div class="opt" onclick="setSt('${v.id}','${s}')"><span style="color:var(--${s==='active'?'income-t':s==='review'?'warn':s==='paused'?'accent-h':'expense-t'})">&#9679;</span> ${s.charAt(0).toUpperCase()+s.slice(1)}</div>`).join('')}
      <div class="opt" style="border-top:1px solid var(--border);margin-top:3px;padding-top:8px" onclick="setRec('${v.id}',false)"><span style="color:var(--dimmed)">&#8856;</span> Not recurring</div>
    </div></div>
</div>
<div style="margin-top:14px;display:flex;align-items:flex-end;justify-content:space-between">
  <div><div class="mono" style="font-size:21px;font-weight:600">${fmt(m3||v.avgMonthly)}</div><div style="font-size:10.5px;color:var(--dimmed)">per month (3-mo actual)</div></div>
  <span class="badge b-cycle">${v.count}&times; lifetime</span>
</div>
<div style="margin-top:13px;padding-top:13px;border-top:1px solid var(--border);display:flex;flex-direction:column;gap:5px;font-size:12px">
  <div style="display:flex;justify-content:space-between"><span style="color:var(--muted)">Last charge</span><span class="mono">${fmtD(v.last)}</span></div>
  <div style="display:flex;justify-content:space-between"><span style="color:var(--muted)">Lifetime spend</span><span class="mono" style="color:var(--expense-t)">${fmt0(v.total)}</span></div>
  <div style="display:flex;justify-content:space-between"><span style="color:var(--muted)">History</span><span style="color:var(--accent-h);cursor:pointer;font-size:12px" onclick="vendorModal(${v.idx})">View all ${v.count} &#8594;</span></div>
</div></div>`;
  }).join('');
  el.innerHTML=`
<div class="kpi-grid" style="grid-template-columns:repeat(4,1fr)">
  <div class="kpi"><div class="kpi-l">Monthly recurring</div><div class="kpi-v mono">${fmt0(mo)}</div><div class="kpi-s">active + review, 3-mo actual</div></div>
  <div class="kpi"><div class="kpi-l">Annual projection</div><div class="kpi-v mono">${fmt0(mo*12)}</div></div>
  <div class="kpi"><div class="kpi-l">Recurring vendors</div><div class="kpi-v mono">${all.length}</div><div class="kpi-s">${act.length} currently active</div></div>
  <div class="kpi"><div class="kpi-l">Need review</div><div class="kpi-v mono" style="color:var(--warn)">${all.filter(v=>vStatus(v)==='review').length}</div><div class="kpi-s">not charged in 50–100 days</div></div>
</div>
<div class="filter-bar">
  <div class="srch"><span class="si">&#128269;</span><input placeholder="Search…" value="${esc(S.sSearch)}" oninput="S.sSearch=this.value;RENDER.subs()"></div>
  <select class="flt" onchange="S.sGroup=this.value;RENDER.subs()"><option value="">All groups</option>${groups.map(g=>`<option ${S.sGroup===g?'selected':''}>${g}</option>`).join('')}</select>
  <select class="flt" onchange="S.sStatus=this.value;RENDER.subs()"><option value="">All statuses</option>${['active','review','paused','cancelled','lapsed'].map(s=>`<option ${S.sStatus===s?'selected':''}>${s}</option>`).join('')}</select>
  <span class="res-ct">${l.length} of ${all.length}</span>
</div>
<div class="cards-grid">${cards||'<div class="empty" style="grid-column:span 3"><div class="empty-ic">&#128269;</div><div>Nothing matches</div></div>'}</div>`;
  loadLogos('sv',l.slice(0,120));
};
function togSM(id){const dd=document.getElementById('sm_'+id);if(!dd)return;const o=dd.style.display!=='none';document.querySelectorAll('.status-dd').forEach(d=>d.style.display='none');if(!o)dd.style.display='block';}
document.addEventListener('click',e=>{if(!e.target.closest('.status-menu'))document.querySelectorAll('.status-dd').forEach(d=>d.style.display='none');});
function setSt(id,st){S.ov[id]=st;save();RENDER[S.view]();toast('Status &#8594; '+st);}
function setRec(id,val){S.rec[id]=val;save();RENDER[S.view]();toast(val?'Marked recurring':'Marked not recurring');}

// ═════════════ TRANSACTIONS ═════════════
function txList(){
  let l=TX;
  const q=S.tSearch.toLowerCase();
  if(q)l=l.filter(t=>t.vendor.name.toLowerCase().includes(q)||t.cat.name.toLowerCase().includes(q));
  if(S.tType!=='all')l=l.filter(t=>t.t===(S.tType==='income'?'i':'e'));
  if(S.tGroup)l=l.filter(t=>t.cat.group===S.tGroup);
  if(S.tCat)l=l.filter(t=>t.cat.name===S.tCat);
  if(S.tYear)l=l.filter(t=>t.d.startsWith(S.tYear));
  if(S.tMin)l=l.filter(t=>t.a>=+S.tMin);
  if(S.tMax)l=l.filter(t=>t.a<=+S.tMax);
  if(S.tRec==='rec')l=l.filter(t=>t.r);
  if(S.tRec==='one')l=l.filter(t=>!t.r);
  if(S.tSort==='a')l=[...l].sort((x,y)=>(x.a-y.a)*S.tDir);
  else if(S.tSort==='d'&&S.tDir===1)l=[...l].reverse();
  return l;
}
RENDER.tx=function(){
  const el=document.getElementById('view-tx');
  const l=txList();
  const years=[...new Set(MONTHS.map(m=>m.slice(0,4)))].sort().reverse();
  const groups=[...new Set(CATS.map(c=>c.group))].sort();
  const catsIn=S.tGroup?CATS.filter(c=>c.group===S.tGroup):CATS;
  const pc=Math.ceil(l.length/100)||1;
  if(S.tPage>pc)S.tPage=pc;
  const pg=l.slice((S.tPage-1)*100,S.tPage*100);
  const ti=sum(l.filter(t=>t.t==='i'),t=>t.a),te=sum(l.filter(t=>t.t==='e'),t=>t.a);
  const rows=pg.map(t=>{const v=t.vendor;
    return `<tr class="rowh" onclick="vendorModal(${v.idx})">
<td><div style="display:flex;align-items:center;gap:9px"><div class="av" style="width:26px;height:26px;border-radius:7px;background:${v.color}1F;color:${v.color};font-size:10px;font-weight:700;flex-shrink:0">${v.abbrev}</div><span style="font-weight:500;font-size:12.5px;max-width:230px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:inline-block;vertical-align:middle">${esc(v.name)}</span></div></td>
<td style="font-size:11.5px;color:var(--muted)">${esc(t.cat.name)}</td>
<td class="mono" style="font-size:11.5px;color:var(--muted)">${fmtD(t.d)}</td>
<td class="mono" style="font-weight:600;font-size:12.5px;color:${t.t==='i'?'var(--income-t)':'var(--expense-t)'}">${t.t==='i'?'+':'-'}${fmt(t.a)}</td>
<td>${t.r?'<span style="font-size:11px;color:var(--accent-h)" title="recurring">&#8635;</span>':''}</td></tr>`;
  }).join('');
  const pag=pc>1?`<div class="pgn"><button class="pg-b" onclick="tp(${S.tPage-1})" ${S.tPage<=1?'disabled':''}>&#171;</button>${pgBtns(S.tPage,pc)}<button class="pg-b" onclick="tp(${S.tPage+1})" ${S.tPage>=pc?'disabled':''}>&#187;</button></div>`:'';
  el.innerHTML=`
<div class="filter-bar">
  <div class="srch" style="flex:1;max-width:280px"><span class="si">&#128269;</span><input placeholder="Search payee or category…" value="${esc(S.tSearch)}" oninput="S.tSearch=this.value;S.tPage=1;RENDER.tx()"></div>
  <div class="seg"><button class="${S.tType==='all'?'active':''}" onclick="S.tType='all';S.tPage=1;RENDER.tx()">All</button><button class="${S.tType==='expense'?'active':''}" onclick="S.tType='expense';S.tPage=1;RENDER.tx()">Out</button><button class="${S.tType==='income'?'active':''}" onclick="S.tType='income';S.tPage=1;RENDER.tx()">In</button></div>
  <select class="flt" onchange="S.tGroup=this.value;S.tCat='';S.tPage=1;RENDER.tx()"><option value="">All groups</option>${groups.map(g=>`<option ${S.tGroup===g?'selected':''}>${g}</option>`).join('')}</select>
  <select class="flt" onchange="S.tCat=this.value;S.tPage=1;RENDER.tx()"><option value="">All categories</option>${[...new Set(catsIn.map(c=>c.name))].sort().map(c=>`<option ${S.tCat===c?'selected':''}>${c}</option>`).join('')}</select>
  <select class="flt" onchange="S.tYear=this.value;S.tPage=1;RENDER.tx()"><option value="">All years</option>${years.map(y=>`<option ${S.tYear===y?'selected':''}>${y}</option>`).join('')}</select>
  <select class="flt" onchange="S.tRec=this.value;S.tPage=1;RENDER.tx()"><option value="">Rec + one-off</option><option value="rec"${S.tRec==='rec'?' selected':''}>Recurring only</option><option value="one"${S.tRec==='one'?' selected':''}>One-off only</option></select>
  <input class="flt-n" type="number" placeholder="Min €" value="${S.tMin}" oninput="S.tMin=this.value;S.tPage=1;RENDER.tx()">
  <input class="flt-n" type="number" placeholder="Max €" value="${S.tMax}" oninput="S.tMax=this.value;S.tPage=1;RENDER.tx()">
  <span class="res-ct">${l.length.toLocaleString()} tx · in <span style="color:var(--income-t)">${fmt0(ti)}</span> · out <span style="color:var(--expense-t)">${fmt0(te)}</span></span>
</div>
<table class="tbl"><thead><tr>
<th onclick="tsort('v')">Payee</th><th>Category</th><th onclick="tsort('d')">Date ${S.tSort==='d'?(S.tDir===-1?'&#9662;':'&#9652;'):''}</th><th onclick="tsort('a')">Amount ${S.tSort==='a'?(S.tDir===-1?'&#9662;':'&#9652;'):''}</th><th></th></tr></thead>
<tbody>${rows}</tbody></table>${pag}`;
};
function pgBtns(p,pc){
  const out=[];const push=i=>out.push(`<button class="pg-b ${i===p?'active':''}" onclick="tp(${i})">${i}</button>`);
  if(pc<=9){for(let i=1;i<=pc;i++)push(i);}
  else{push(1);if(p>4)out.push('<span style="color:var(--dimmed)">…</span>');
    for(let i=Math.max(2,p-2);i<=Math.min(pc-1,p+2);i++)push(i);
    if(p<pc-3)out.push('<span style="color:var(--dimmed)">…</span>');push(pc);}
  return out.join('');
}
function tp(p){S.tPage=Math.max(1,p);RENDER.tx();document.getElementById('content').scrollTop=0;}
function tsort(k){if(k==='v')return;if(S.tSort===k)S.tDir*=-1;else{S.tSort=k;S.tDir=-1;}RENDER.tx();}

// ═════════════ CATEGORIES ═════════════
RENDER.cats=function(){
  const el=document.getElementById('view-cats');
  const yr=S.tYear||'';
  const gTot={},cTot={};
  TX.forEach(t=>{if(t.t!=='e')return;if(yr&&!t.d.startsWith(yr))return;
    gTot[t.cat.group]=(gTot[t.cat.group]||0)+t.a;cTot[t.cat.name]=(cTot[t.cat.name]||0)+t.a;});
  const gl=Object.entries(gTot).sort((a,b)=>b[1]-a[1]);
  const mx=gl[0]?.[1]||1;const tot=sum(gl,x=>x[1]);
  const years=[...new Set(MONTHS.map(m=>m.slice(0,4)))].sort().reverse();
  const bars=gl.map(([g,t])=>{
    const catsIn=Object.entries(cTot).filter(([c])=>CATS.find(x=>x.name===c)?.group===g).sort((a,b)=>b[1]-a[1]);
    return `<div style="margin-bottom:15px">
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px;font-size:13px;cursor:pointer" onclick="this.parentNode.querySelector('.catsub').style.display=this.parentNode.querySelector('.catsub').style.display==='none'?'block':'none'">
  <div style="display:flex;align-items:center;gap:7px;font-weight:500"><div style="width:9px;height:9px;border-radius:3px;background:${GC[g]}"></div>${g} <span style="font-size:11px;color:var(--dimmed)">(${catsIn.length} cats)</span></div>
  <div class="mono">${fmt0(t)} <span style="font-size:11px;color:var(--dimmed)">${(t/tot*100).toFixed(1)}%</span></div></div>
<div style="height:8px;border-radius:4px;background:var(--raised);overflow:hidden"><div style="height:100%;width:${(t/mx*100).toFixed(1)}%;background:${GC[g]};border-radius:4px"></div></div>
<div class="catsub" style="display:none;margin-top:8px;padding-left:16px">${catsIn.map(([c,ct])=>`<div style="display:flex;justify-content:space-between;font-size:12px;padding:4px 0;border-bottom:1px solid rgba(35,43,59,.4);cursor:pointer" onclick="S.tCat='${esc(c)}';S.tGroup='';S.tPage=1;nav('tx')"><span style="color:var(--muted)">${esc(c)}</span><span class="mono">${fmt0(ct)}</span></div>`).join('')}</div></div>`;
  }).join('');
  el.innerHTML=`
<div class="filter-bar">
  <div class="seg"><button class="${!S.tYear?'active':''}" onclick="S.tYear='';RENDER.cats()">All time</button>${years.map(y=>`<button class="${S.tYear===y?'active':''}" onclick="S.tYear='${y}';RENDER.cats()">${y}</button>`).join('')}</div>
  <span class="res-ct">Total spend: ${fmt0(tot)}</span>
</div>
<div class="card" style="max-width:860px">${bars}</div>`;
};

// ═════════════ VENDOR / MONTH MODALS ═════════════
function openModal(html){document.getElementById('modal').innerHTML=html;document.getElementById('modal-bg').classList.add('open');}
function closeModal(){document.getElementById('modal-bg').classList.remove('open');}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});
function vendorModal(idx){
  const v=V[idx];const ids=VTX[idx]||[];
  const txs=ids.map(i=>TX[i]);
  // monthly series last 24
  const mo=MONTHS.slice(-24);const per={};mo.forEach(m=>per[m]=0);
  txs.forEach(t=>{const m=t.d.slice(0,7);if(per[m]!==undefined&&t.t==='e')per[m]+=t.a;});
  const mxm=Math.max(...Object.values(per),1);
  const spark=mo.map(m=>`<div class="sb" style="height:${Math.max(2,per[m]/mxm*54)}px" title="${fmtM(m)}: ${fmt(per[m])}"></div>`).join('');
  const rows=txs.slice(0,250).map(t=>`<tr><td class="mono" style="font-size:11.5px;color:var(--muted)">${fmtD(t.d)}</td><td style="font-size:12px;color:var(--muted)">${esc(t.cat.name)}</td><td class="mono" style="font-weight:600;font-size:12.5px;color:${t.t==='i'?'var(--income-t)':'var(--expense-t)'}">${t.t==='i'?'+':'-'}${fmt(t.a)}</td><td>${t.r?'<span style="color:var(--accent-h);font-size:11px">&#8635;</span>':''}</td></tr>`).join('');
  const rec=isRecurring(v);const st=vStatus(v);
  openModal(`<div class="modal-hd">${avHtml(v,44,'mv')}
<div style="min-width:0"><div style="font-size:17px;font-weight:700">${esc(v.name)}</div><div style="font-size:12px;color:var(--muted)">${v.group} · ${esc(v.category)}</div></div>
<span class="badge b-${st}" style="margin-left:8px"><span class="bdot"></span>${st}</span>
<button class="modal-x" onclick="closeModal()">&#10005;</button></div>
<div class="modal-bd">
<div class="stat-grid">
  <div class="stat"><div class="l">Avg / month</div><div class="v mono" style="color:var(--expense-t)">${fmt(v.avgMonthly)}</div></div>
  <div class="stat"><div class="l">3-mo actual</div><div class="v mono">${fmt(avg3(v))}</div></div>
  <div class="stat"><div class="l">Lifetime</div><div class="v mono">${fmt0(v.total)}</div></div>
  <div class="stat"><div class="l">Charges</div><div class="v mono">${v.count}&times; over ${v.spanMonths} mo</div></div>
</div>
<div style="display:flex;gap:8px;margin-bottom:6px">
  <button class="btn btn-sm ${rec?'btn-sec':'btn-primary'}" onclick="setRec('${v.id}',${!rec});vendorModal(${idx})">${rec?'&#8856; Mark not recurring':'&#8635; Mark as recurring'}</button>
  ${['active','review','cancelled'].map(s=>`<button class="btn btn-sm btn-sec" onclick="setSt('${v.id}','${s}');vendorModal(${idx})">Set ${s}</button>`).join('')}
</div>
<div style="font-size:11px;color:var(--dimmed);margin:10px 0 2px">Monthly spend · last 24 months</div>
<div class="spark">${spark}</div>
<div style="font-size:11px;color:var(--dimmed);margin:14px 0 6px">All transactions (${txs.length}${txs.length>250?', showing 250':''})</div>
<table class="tbl"><thead><tr><th>Date</th><th>Category</th><th>Amount</th><th></th></tr></thead><tbody>${rows}</tbody></table>
</div>`);
  loadLogos('mv',[v]);
}
function monthModal(m){
  const txs=TX.filter(t=>t.d.slice(0,7)===m);
  const s=MSER[m];const n=s.inc-s.exp;
  const byV={};txs.forEach(t=>{if(t.t==='e')byV[t.v]=(byV[t.v]||0)+t.a;});
  const top=Object.entries(byV).sort((a,b)=>b[1]-a[1]).slice(0,12);
  const rows=top.map(([vi,amt])=>{const v=V[+vi];
    return `<tr class="rowh" onclick="vendorModal(${vi})"><td><div style="display:flex;align-items:center;gap:9px"><div class="av" style="width:26px;height:26px;border-radius:7px;background:${v.color}1F;color:${v.color};font-size:10px;font-weight:700">${v.abbrev}</div>${esc(v.name)}</div></td><td class="mono" style="font-weight:600;color:var(--expense-t)">${fmt(amt)}</td></tr>`;}).join('');
  openModal(`<div class="modal-hd"><div><div style="font-size:17px;font-weight:700">${fmtM(m)}</div><div style="font-size:12px;color:var(--muted)">${txs.length} transactions</div></div><button class="modal-x" onclick="closeModal()">&#10005;</button></div>
<div class="modal-bd">
<div class="stat-grid" style="grid-template-columns:repeat(3,1fr)">
  <div class="stat"><div class="l">Income</div><div class="v mono" style="color:var(--income-t)">${fmt0(s.inc)}</div></div>
  <div class="stat"><div class="l">Expenses</div><div class="v mono" style="color:var(--expense-t)">${fmt0(s.exp)}</div></div>
  <div class="stat"><div class="l">Net</div><div class="v mono" style="color:${n>=0?'var(--income-t)':'var(--expense-t)'}">${n>=0?'+':''}${fmt0(n)}</div></div>
</div>
<div style="font-size:11px;color:var(--dimmed);margin:8px 0 6px">Top spend this month</div>
<table class="tbl"><tbody>${rows}</tbody></table>
<button class="btn btn-sec" style="margin-top:14px" onclick="closeModal();S.tYear='';S.tSearch='';S.tGroup='';S.tCat='';S.tPage=1;nav('tx');S.tSearch='';">Open full ledger &#8594;</button>
</div>`);
}

// ═════════════ RULES ═════════════
function matchRule(v,r){
  const val=(r.value||'').toLowerCase();
  if(r.field==='name')return applyOp(v.name.toLowerCase(),r.op,val);
  if(r.field==='group')return applyOp(v.group.toLowerCase(),r.op,val);
  if(r.field==='count')return v.count>=(+r.value||0);
  if(r.field==='avg')return v.avgMonthly>=(+r.value||0);
  return false;
}
function applyOp(f,op,v){if(op==='contains')return f.includes(v);if(op==='starts')return f.startsWith(v);return f===v;}
function ruleDesc(r){
  const acts={rec:'mark recurring',notrec:'mark NOT recurring',active:'status active',review:'status review',cancelled:'status cancelled'};
  const fld={name:'vendor name',group:'group',count:'charge count ≥',avg:'avg €/mo ≥'};
  return `If ${fld[r.field]} ${['count','avg'].includes(r.field)?'':r.op+' '}"${r.value}" → ${acts[r.action]}`;
}
RENDER.rules=function(){
  const el=document.getElementById('view-rules');
  const rs=S.rules;
  const ovCt=Object.keys(S.ov).length+Object.keys(S.rec).length;
  const rl=rs.length===0?`<div class="empty"><div class="empty-ic">&#9881;</div><div>No rules yet. Example: "vendor name contains <b>enix</b> → mark recurring"</div></div>`
    :rs.map((r,i)=>{const mx=V.filter(v=>v.type==='e'&&matchRule(v,r));
      return `<div class="rule-item"><div style="width:34px;height:34px;border-radius:9px;background:var(--accent-12);display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0">${r.icon||'&#9889;'}</div><div class="rule-bd"><div style="font-size:13px;font-weight:600">${esc(r.name)}</div><div style="font-size:12px;color:var(--muted);margin-top:2px">${esc(ruleDesc(r))}</div><div style="font-size:11px;color:var(--accent-h);margin-top:3px">${mx.length} vendors match</div></div><button class="a-del" onclick="delRule(${i})">&#10005;</button></div>`;}).join('');
  const ovRows=[...Object.entries(S.ov).map(([id,st])=>({id,txt:'status: '+st})),
    ...Object.entries(S.rec).map(([id,r])=>({id,txt:r?'recurring: yes':'recurring: no'}))].map(o=>{
    const v=V.find(x=>x.id===o.id);if(!v)return'';
    return `<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)"><span style="font-size:13px">${esc(v.name)}</span><span style="font-size:11.5px;color:var(--accent-h)">${o.txt}</span></div>`;}).join('');
  el.innerHTML=`
<div class="nw-grid">
<div>
  <div class="sec-hdr"><div class="sec-t">Create Rule</div></div>
  <div class="card">
    <div class="form-grp"><div class="form-l">Rule name</div><input class="form-in" id="r-name" placeholder="e.g. Enix / Brixly is a subscription"></div>
    <div class="form-grp"><div class="form-l">Condition</div>
      <select class="form-in" id="r-field" style="margin-bottom:7px" onchange="prv()"><option value="name">Vendor name</option><option value="group">Group</option><option value="count">Charge count ≥</option><option value="avg">Avg €/month ≥</option></select>
      <select class="form-in" id="r-op" style="margin-bottom:7px" onchange="prv()"><option value="contains">contains</option><option value="starts">starts with</option><option value="equals">equals</option></select>
      <input class="form-in" id="r-value" placeholder="e.g. enix, paddle, 6, 50…" oninput="prv()"></div>
    <div class="form-grp"><div class="form-l">Action</div>
      <select class="form-in" id="r-action"><option value="rec">Mark recurring</option><option value="notrec">Mark NOT recurring</option><option value="active">Set status active</option><option value="review">Set status review</option><option value="cancelled">Set status cancelled</option></select></div>
    <div id="r-prev" style="margin:10px 0"></div>
    <button class="btn btn-primary" onclick="addRule()">+ Add rule</button>
  </div>
</div>
<div>
  <div class="sec-hdr"><div class="sec-t">Active Rules (${rs.length})</div></div>${rl}
  <div class="sec-hdr" style="margin-top:20px"><div class="sec-t">Manual Overrides (${ovCt})</div>${ovCt?'<button class="btn btn-sm btn-danger" onclick="clearOv()">Clear all</button>':''}</div>
  <div class="card">${ovRows||'<span style="color:var(--muted);font-size:13px">No overrides yet — change a status or recurring flag anywhere in the app.</span>'}</div>
</div>
</div>`;
};
function prv(){
  const f=document.getElementById('r-field').value,op=document.getElementById('r-op').value,v=document.getElementById('r-value').value;
  if(!v){document.getElementById('r-prev').innerHTML='';return;}
  const mx=V.filter(x=>x.type==='e'&&matchRule(x,{field:f,op,value:v}));
  document.getElementById('r-prev').innerHTML=mx.length?`<div style="background:var(--accent-8);border:1px solid rgba(99,102,241,.3);border-radius:8px;padding:11px;font-size:12px"><span style="color:var(--accent-h);font-weight:600">${mx.length} match${mx.length!==1?'es':''}:</span> <span style="color:var(--muted)">${mx.slice(0,6).map(x=>esc(x.name)).join(', ')}${mx.length>6?' +'+(mx.length-6)+' more':''}</span></div>`:'<div style="color:var(--muted);font-size:12px">No matches.</div>';
}
function addRule(){
  const name=document.getElementById('r-name').value.trim();
  const value=document.getElementById('r-value').value.trim();
  if(!name||!value){toast('Name and value required','#F59E0B');return;}
  S.rules.push({name,field:document.getElementById('r-field').value,op:document.getElementById('r-op').value,value,action:document.getElementById('r-action').value,icon:'&#9889;'});
  save();toast('Rule added');RENDER.rules();
}
function delRule(i){S.rules.splice(i,1);save();toast('Rule deleted','#F87171');RENDER.rules();}
function applyRules(){
  let ct=0;
  S.rules.forEach(r=>{V.forEach(v=>{if(v.type!=='e'||!matchRule(v,r))return;
    if(r.action==='rec'&&S.rec[v.id]!==true){S.rec[v.id]=true;ct++;}
    else if(r.action==='notrec'&&S.rec[v.id]!==false){S.rec[v.id]=false;ct++;}
    else if(['active','review','cancelled'].includes(r.action)&&S.ov[v.id]!==r.action){S.ov[v.id]=r.action;ct++;}});});
  save();toast(`Applied ${S.rules.length} rules → ${ct} changes`);RENDER.rules();
}
function clearOv(){S.ov={};S.rec={};save();toast('All overrides cleared','#F87171');RENDER.rules();}

// ═════════════ ASSISTANT ═════════════
let ASST_BOOTED=false;
RENDER.asst=function(){
  const el=document.getElementById('view-asst');
  if(!el.dataset.built){
    el.dataset.built='1';
    el.innerHTML=`<div class="asst-wrap">
<div class="asst-log" id="a-log"></div>
<div class="chips">
  <div class="chip" onclick="ask('monthly burn')">&#9201; Monthly burn</div>
  <div class="chip" onclick="ask('top 10 vendors')">&#127942; Top vendors</div>
  <div class="chip" onclick="ask('top categories 2026')">&#9635; Categories 2026</div>
  <div class="chip" onclick="ask('net worth')">&#9670; Net worth</div>
  <div class="chip" onclick="ask('subscriptions')">&#8635; Subscriptions</div>
  <div class="chip" onclick="ask('sync wallet')">&#128260; Sync BudgetBakers</div>
  <div class="chip" onclick="ask('help')">? Help</div>
</div>
<div class="asst-input">
  <input id="a-in" placeholder='Try: "find replit" · "total amazon 2026" · "report June 2026" · "add asset House 385000"' onkeydown="if(event.key==='Enter')ask(this.value)">
  <button class="btn btn-primary" onclick="ask(document.getElementById('a-in').value)">Send</button>
</div></div>`;
  }
  if(!ASST_BOOTED){ASST_BOOTED=true;
    botSay(`Hi Sean — I'm your Wealthview assistant. I can search your <span class="hl">7,540 transactions</span>, run totals and reports, manage assets, and pull fresh data from BudgetBakers.<br><br>Try the chips below or type <span class="hl">help</span>.`);}
};
function addMsg(html,who){
  const log=document.getElementById('a-log');
  const d=document.createElement('div');d.className='msg '+who;d.innerHTML=html;
  log.appendChild(d);log.scrollTop=log.scrollHeight;
}
function botSay(h){addMsg(h,'bot');}
function ask(q){
  q=(q||'').trim();if(!q)return;
  const inp=document.getElementById('a-in');if(inp)inp.value='';
  addMsg(esc(q),'user');
  setTimeout(()=>answer(q.toLowerCase(),q),80);
}
function vtable(list,valFn,valHdr){
  return `<table><tr><th>Vendor</th><th>${valHdr||'Amount'}</th></tr>${list.map(x=>`<tr><td>${esc(x.name)}</td><td class="mono exp">${fmt0(valFn(x))}</td></tr>`).join('')}</table>`;
}
function answer(q,raw){
  // help
  if(/^(help|\?)/.test(q)){
    botSay(`I understand:<br>
&#8226; <span class="hl">find &lt;term&gt;</span> — search vendors & transactions<br>
&#8226; <span class="hl">total &lt;vendor&gt; [year]</span> — e.g. "total amazon 2026"<br>
&#8226; <span class="hl">top [N] vendors|categories [year]</span><br>
&#8226; <span class="hl">monthly burn</span> — your life running cost<br>
&#8226; <span class="hl">report &lt;month year&gt;</span> — e.g. "report June 2026"<br>
&#8226; <span class="hl">subscriptions</span> — recurring summary<br>
&#8226; <span class="hl">net worth</span> / <span class="hl">add asset House 385000</span> / <span class="hl">add liability Mortgage 210000</span><br>
&#8226; <span class="hl">mark &lt;vendor&gt; recurring</span> — e.g. "mark brixly recurring"<br>
&#8226; <span class="hl">sync wallet</span> — pull latest from BudgetBakers`);return;}
  // sync wallet
  if(/sync|budgetbakers|wallet|draw down|pull/.test(q)&&/sync|wallet|bakers|pull|draw/.test(q)){syncWallet();return;}
  // net worth
  if(/net ?worth/.test(q)){const t=nwTotal();
    botSay(`Your net worth is <span class="hl mono">${fmt0(t.net)}</span><br>Assets <span class="inc mono">${fmt0(t.assets)}</span> − Liabilities <span class="exp mono">${fmt0(t.liab)}</span><br><br>${S.assets.length?S.assets.map(a=>`${a.kind==='asset'?'&#9650;':'&#9660;'} ${esc(a.name)}: <span class="mono">${fmt0(a.value)}</span>`).join('<br>'):'No assets added yet — try "add asset House 385000".'}`);return;}
  // add asset/liability
  let m=q.match(/add (asset|liability)\s+(.+?)\s+([\d,.]+k?)\s*$/);
  if(m){let val=m[3].replace(/,/g,'');if(val.endsWith('k'))val=parseFloat(val)*1000;else val=parseFloat(val);
    const name=raw.match(/add (?:asset|liability)\s+(.+?)\s+[\d,.]+k?\s*$/i)[1];
    S.assets.push({id:'a'+Math.random().toString(36).slice(2,9),kind:m[1],cls:m[1]==='asset'?'other':'loan',name,value:val,updated:new Date().toISOString().slice(0,10)});
    snapNW();botSay(`Added ${m[1]} <span class="hl">${esc(name)}</span> at <span class="mono">${fmt0(val)}</span>. Net worth is now <span class="hl mono">${fmt0(nwTotal().net)}</span>.`);return;}
  // mark vendor recurring
  m=q.match(/mark\s+(.+?)\s+(not\s+)?recurring/);
  if(m){const v=findVendor(m[1]);if(!v){botSay(`Couldn't find a vendor matching "<span class="hl">${esc(m[1])}</span>".`);return;}
    S.rec[v.id]=!m[2];save();
    botSay(`Done — <span class="hl">${esc(v.name)}</span> is now marked ${m[2]?'NOT ':''}recurring. (${v.count} charges, avg ${fmt(v.avgMonthly)}/mo)`);return;}
  // monthly burn
  if(/burn|running cost|life cost|monthly cost|spend per month/.test(q)){
    const compl=MONTHS.slice(-4,-1);
    const burn=sum(compl,x=>MSER[x].exp)/compl.length;
    const inc=sum(compl,x=>MSER[x].inc)/compl.length;
    const gT={};TX.forEach(t=>{if(t.t==='e'&&compl.includes(t.d.slice(0,7)))gT[t.cat.group]=(gT[t.cat.group]||0)+t.a;});
    const top=Object.entries(gT).sort((a,b)=>b[1]-a[1]).slice(0,6);
    botSay(`Your life runs at <span class="hl mono">${fmt0(burn)}/month</span> (avg of ${compl.map(fmtM).join(', ')}).<br>Income averaged <span class="inc mono">${fmt0(inc)}/mo</span> → net <span class="mono ${inc-burn>=0?'inc':'exp'}">${inc-burn>=0?'+':''}${fmt0(inc-burn)}/mo</span><br><br>Where it goes:<br>${top.map(([g,t])=>`&#8226; ${g}: <span class="mono">${fmt0(t/3)}/mo</span>`).join('<br>')}`);return;}
  // subscriptions
  if(/subscriptions?$|recurring summary/.test(q)){
    const subs=V.filter(v=>v.type==='e'&&isRecurring(v)&&['active','review'].includes(vStatus(v)));
    const mo=sum(subs,v=>avg3(v));
    const top=subs.map(v=>({v,m:avg3(v)})).sort((a,b)=>b.m-a.m).slice(0,10);
    botSay(`You have <span class="hl">${subs.length} active recurring vendors</span> costing <span class="hl mono">${fmt0(mo)}/month</span> (${fmt0(mo*12)}/yr).<br>${vtable(top.map(x=>x.v),v=>avg3(v),'€/mo (3-mo avg)')}`);return;}
  // report month year
  m=q.match(/report\s+(\w+)\s*(\d{4})?/);
  if(m&&m[1]!=='for'){
    const MN=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
    const mi=MN.findIndex(x=>m[1].startsWith(x));
    if(mi>=0){const y=m[2]||CURM.slice(0,4);const key=`${y}-${String(mi+1).padStart(2,'0')}`;
      if(!MSER[key]){botSay(`No data for ${m[1]} ${y}.`);return;}
      const s=MSER[key];const txs=TX.filter(t=>t.d.slice(0,7)===key&&t.t==='e');
      const byV={};txs.forEach(t=>byV[t.v]=(byV[t.v]||0)+t.a);
      const top=Object.entries(byV).sort((a,b)=>b[1]-a[1]).slice(0,8);
      botSay(`<b>${fmtM(key)} report</b><br>In <span class="inc mono">${fmt0(s.inc)}</span> · Out <span class="exp mono">${fmt0(s.exp)}</span> · Net <span class="mono ${s.inc-s.exp>=0?'inc':'exp'}">${s.inc-s.exp>=0?'+':''}${fmt0(s.inc-s.exp)}</span> · ${txs.length} expense tx<br>${vtable(top.map(([vi])=>V[+vi]),x=>byV[x.idx],'Spent')}`);return;}
    if(/\d{4}/.test(m[1])){yearReport(m[1]);return;}
  }
  m=q.match(/report\s+for\s+(\d{4})/)||q.match(/^report\s+(\d{4})/);
  if(m){yearReport(m[1]);return;}
  // top N vendors/categories
  m=q.match(/top\s*(\d+)?\s*(vendors?|categories|cats|groups?)\s*(\d{4})?/);
  if(m){const n=+(m[1]||10);const y=m[3]||'';
    if(/vendor/.test(m[2])){
      const vT={};TX.forEach(t=>{if(t.t!=='e')return;if(y&&!t.d.startsWith(y))return;vT[t.v]=(vT[t.v]||0)+t.a;});
      const top=Object.entries(vT).sort((a,b)=>b[1]-a[1]).slice(0,n);
      botSay(`Top ${n} vendors by spend${y?' in '+y:''}:${vtable(top.map(([vi])=>V[+vi]),x=>vT[x.idx],'Total')}`);
    }else{
      const gT={};TX.forEach(t=>{if(t.t!=='e')return;if(y&&!t.d.startsWith(y))return;gT[t.cat.group]=(gT[t.cat.group]||0)+t.a;});
      const top=Object.entries(gT).sort((a,b)=>b[1]-a[1]).slice(0,n);
      botSay(`Top spend groups${y?' in '+y:''}:<br>${top.map(([g,t])=>`&#8226; ${g}: <span class="mono exp">${fmt0(t)}</span>`).join('<br>')}`);}
    return;}
  // total X [year]
  m=q.match(/(?:total|how much|spend on|spent on)\s+(?:did i spend on\s+)?(.+?)(?:\s+in)?\s*(\d{4})?\s*\??$/);
  if(m&&m[1]){
    const v=findVendor(m[1].replace(/^(on|for)\s+/,''));
    if(v){const y=m[2]||'';
      const txs=(VTX[v.idx]||[]).map(i=>TX[i]).filter(t=>!y||t.d.startsWith(y));
      const tot=sum(txs.filter(t=>t.t==='e'),t=>t.a);
      const mos=[...new Set(txs.map(t=>t.d.slice(0,7)))].length;
      botSay(`<span class="hl">${esc(v.name)}</span>${y?' in '+y:''}: <span class="exp mono">${fmt0(tot)}</span> across ${txs.length} charges${mos>1?` (~${fmt0(tot/mos)}/active month)`:''}.<br>Lifetime: ${fmt0(v.total)} · ${v.count} charges · avg ${fmt(v.avgMonthly)}/mo<br><span style="font-size:12px;color:var(--muted)">Click to inspect:</span> <span class="hl" style="cursor:pointer" onclick="vendorModal(${v.idx})">open ${esc(v.name)} &#8594;</span>`);return;}
  }
  // find X
  m=q.match(/(?:find|search|show me|where.*is)\s+(.+?)\??$/);
  if(m){
    const term=m[1].trim();
    const vs=V.filter(v=>v.name.toLowerCase().includes(term)).sort((a,b)=>b.total-a.total).slice(0,8);
    if(!vs.length){botSay(`Nothing found for "<span class="hl">${esc(term)}</span>". Try a shorter fragment.`);return;}
    botSay(`Found ${vs.length} vendor${vs.length>1?'s':''} matching "<span class="hl">${esc(term)}</span>":<br>${vs.map(v=>`&#8226; <span class="hl" style="cursor:pointer" onclick="vendorModal(${v.idx})">${esc(v.name)}</span> — ${v.count}× · ${fmt0(v.total)} lifetime · ${isRecurring(v)?'&#8635; recurring':'one-off'}`).join('<br>')}`);return;}
  // fallback: try vendor match
  const v=findVendor(q);
  if(v){vendorModal(v.idx);botSay(`Opened <span class="hl">${esc(v.name)}</span> — ${v.count} charges, ${fmt0(v.total)} lifetime.`);return;}
  botSay(`Not sure what you mean. Type <span class="hl">help</span> to see what I can do.`);
}
function yearReport(y){
  const mo=MONTHS.filter(m=>m.startsWith(y));
  if(!mo.length){botSay(`No data for ${y}.`);return;}
  const ti=sum(mo,m=>MSER[m].inc),te=sum(mo,m=>MSER[m].exp);
  const gT={};TX.forEach(t=>{if(t.t==='e'&&t.d.startsWith(y))gT[t.cat.group]=(gT[t.cat.group]||0)+t.a;});
  const top=Object.entries(gT).sort((a,b)=>b[1]-a[1]).slice(0,8);
  botSay(`<b>${y} report</b> (${mo.length} months)<br>In <span class="inc mono">${fmt0(ti)}</span> · Out <span class="exp mono">${fmt0(te)}</span> · Net <span class="mono ${ti-te>=0?'inc':'exp'}">${ti-te>=0?'+':''}${fmt0(ti-te)}</span><br><br>${top.map(([g,t])=>`&#8226; ${g}: <span class="mono">${fmt0(t)}</span>`).join('<br>')}`);
}
function findVendor(term){
  term=term.trim().toLowerCase();if(!term)return null;
  return V.find(v=>v.name.toLowerCase()===term)||V.find(v=>v.norm===term)||
    V.filter(v=>v.name.toLowerCase().includes(term)).sort((a,b)=>b.count-a.count)[0]||null;
}

// ═════════════ WALLET MCP SYNC ═════════════
async function syncWallet(){
  if(!window.claude||!window.claude.mcp){
    botSay(`&#9888; Live sync only works when this page is opened as a <span class="hl">claude.ai Artifact</span> (where your BudgetBakers connector lives). In this copy, the embedded snapshot (to 15 Jul 2026) is used.`);return;}
  botSay(`Checking your connectors…`);
  try{
    const lt=await window.claude.mcp.listTools();
    const srv=lt.servers.find(s=>/wallet|budget/i.test(s.server)&&s.tools.length>0);
    if(!srv){
      const any=lt.servers.map(s=>s.server).join(', ')||'none';
      botSay(`&#9888; I can't see a BudgetBakers/Wallet connector for your account (visible: ${esc(any)}). Add it in claude.ai Settings → Connectors, then try again.`);return;}
    if(srv.authStatus==='needs_reauth'){botSay(`&#9888; Your <span class="hl">${esc(srv.server)}</span> connector needs re-authentication. Reconnect it in claude.ai Settings → Connectors.`);return;}
    const recTool=srv.tools.find(t=>/record|transaction/i.test(t.name))||srv.tools[0];
    botSay(`Found <span class="hl">${esc(srv.server)}</span> — calling <span class="mono">${esc(recTool.name)}</span>…`);
    const res=await window.claude.mcp.callTool(srv.server,recTool.name,{},{cache:false});
    let p=res.payload;
    let count='';
    if(Array.isArray(p))count=p.length+' records';
    else if(p&&typeof p==='object'){const arr=Object.values(p).find(x=>Array.isArray(x));count=arr?arr.length+' records':'data received';}
    else count='response received';
    botSay(`&#10003; Live data pulled from ${esc(srv.server)}: <span class="hl">${esc(String(count))}</span>.<br><span style="font-size:12px;color:var(--muted)">Live merge into the ledger is coming next — for now this confirms the pipe works. The embedded snapshot covers up to 15 Jul 2026.</span>`);
  }catch(e){
    const code=e&&e.code;
    if(code==='needs_reauth')botSay(`&#9888; Connector needs re-auth — reconnect BudgetBakers in claude.ai Settings → Connectors.`);
    else if(code==='server_not_connected')botSay(`&#9888; No BudgetBakers connector found. Add it in claude.ai Settings → Connectors.`);
    else if(code==='not_in_manifest')botSay(`&#9888; This page version doesn't have permission for that tool — ask Claude to republish with the right manifest.`);
    else if(code==='server_unavailable')botSay(`&#9888; BudgetBakers is unreachable right now — try again in a minute.`);
    else if(code==='not_granted'||code==='capability_disabled')botSay(`&#9888; This view doesn't have connector access granted. Reload the artifact and approve the connector prompt.`);
    else botSay(`&#9888; Sync failed (${esc(code||'unknown')}): ${esc(e&&e.message||'')}`);
  }
}

// ═════════════ EXPORT ═════════════
function dl(rows,fn){const csv=rows.map(r=>r.map(v=>`"${String(v==null?'':v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const a=Object.assign(document.createElement('a'),{href:'data:text/csv;charset=utf-8,'+encodeURIComponent(csv),download:fn});a.click();toast(`Exported ${rows.length-1} rows`);}
function xTx(){const l=txList();dl([['Date','Payee','Category','Group','Amount','Type','Recurring']].concat(l.map(t=>[t.d,t.vendor.name,t.cat.name,t.cat.group,t.a,t.t==='i'?'income':'expense',t.r?'Y':'N'])),'wealthview-transactions.csv');}
function xRun(){const l=runList();dl([['Vendor','Group','Charges','First','Last','AvgPerMonth','Lifetime','Recurring','Status']].concat(l.map(v=>[v.name,v.group,v.count,v.first,v.last,v.avgMonthly,v.total,isRecurring(v)?'Y':'N',vStatus(v)])),'wealthview-running-costs.csv');}

// ═════════════ BOOT ═════════════
nav('dashboard');
</script>
</body>
</html>'''

html = TEMPLATE.replace('__DATA__', data_json).replace('__BFKEY__', BFKEY)
out = '/tmp/claude-0/-home-user-subbs/b079a466-7434-53d3-8f62-638a5f604b40/scratchpad/wealthview.html'
with open(out, 'w') as f:
    f.write(html)
print(f"Written {len(html)//1024}KB -> {out}")

# Repo-safe copy (no API key)
html_repo = TEMPLATE.replace('__DATA__', data_json).replace('__BFKEY__', '')
with open('/tmp/claude-0/-home-user-subbs/b079a466-7434-53d3-8f62-638a5f604b40/scratchpad/wealthview-repo.html', 'w') as f:
    f.write(html_repo)
print("Repo-safe copy written (no Brandfetch key)")

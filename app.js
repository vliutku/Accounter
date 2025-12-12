// ====== Accounter v1.0 (TRY income/expense, USD net worth with manual FX, simple investments) ======

const SUMMARY_KEY = "summary.v3";          // { cashTry, fxTryPerUsd }
const NETWORTH_KEY = "networth.history.v2"; // [{month, netWorthUsd}]

const RI_MASTER_KEY = "ri.master.v1";
const RI_MONTH_KEY  = "ri.month.v1";
const EXTRA_INCOME_KEY = "income.extra.v1";

const BUDGET_MASTER_KEY = "budget.master.v1";
const BUDGET_MONTH_KEY  = "budget.month.v1";
const BUDGET_EXP_KEY    = "budget.expenses.v1";
const UNEXP_EXP_KEY     = "expense.unexpected.v1";

// Simple investments
const INST_KEY = "inv.simple.instruments.v1"; // [{id,name,valueUsd,pnlUsd}]
const GOAL_KEY = "goal.usd.v1";               // { goalUsd }

// Notes
const NOTES_KEY = "notes.monthly.v1";      // [{month,text,updatedAt}]

const els = {
  tabs: () => document.querySelectorAll(".tab"),
  pages: () => document.querySelectorAll(".tabPage"),

  // dashboard
  cashTryNow: document.getElementById("cashTryNow"),
  invUsdNow: document.getElementById("invUsdNow"),
  netWorthUsd: document.getElementById("netWorthUsd"),
  mIncomeTry: document.getElementById("mIncomeTry"),
  mExpenseTry: document.getElementById("mExpenseTry"),
  mNetTry: document.getElementById("mNetTry"),

  cashTryInput: document.getElementById("cashTryInput"),
  fxTryPerUsdInput: document.getElementById("fxTryPerUsdInput"),
  saveSummary: document.getElementById("saveSummary"),
  netWorthChart: document.getElementById("netWorthChart"),

  exportMonthBtn: document.getElementById("exportMonthBtn"),
  exportAllBtn: document.getElementById("exportAllBtn"),

  // shared month
  activeMonth: document.getElementById("activeMonth"),

  // transactions subtabs/pages
  subtabs: () => document.querySelectorAll("#tab-transactions .subtab"),
  subpages: () => document.querySelectorAll("#tab-transactions .subPage"),

  // income recurring
  riForm: document.getElementById("riForm"),
  riName: document.getElementById("riName"),
  riAmount: document.getElementById("riAmount"),
  riDay: document.getElementById("riDay"),
  riActive: document.getElementById("riActive"),
  riBody: document.getElementById("riBody"),
  incomeCal: document.getElementById("incomeCal"),
  selectedDayLabel: document.getElementById("selectedDayLabel"),
  dayDetails: document.getElementById("dayDetails"),

  // extra income
  eiForm: document.getElementById("eiForm"),
  eiDate: document.getElementById("eiDate"),
  eiAmount: document.getElementById("eiAmount"),
  eiNote: document.getElementById("eiNote"),
  eiBody: document.getElementById("eiBody"),

  // budgets
  bmForm: document.getElementById("bmForm"),
  bmName: document.getElementById("bmName"),
  bmBudget: document.getElementById("bmBudget"),
  bmActive: document.getElementById("bmActive"),
  bmBody: document.getElementById("bmBody"),

  beForm: document.getElementById("beForm"),
  beBudgetId: document.getElementById("beBudgetId"),
  beDate: document.getElementById("beDate"),
  beAmount: document.getElementById("beAmount"),
  beNote: document.getElementById("beNote"),
  beBody: document.getElementById("beBody"),

  ueForm: document.getElementById("ueForm"),
  ueDate: document.getElementById("ueDate"),
  ueAmount: document.getElementById("ueAmount"),
  ueNote: document.getElementById("ueNote"),
  ueBody: document.getElementById("ueBody"),

  // net
  netIncome: document.getElementById("netIncome"),
  netExpense: document.getElementById("netExpense"),
  netLeft: document.getElementById("netLeft"),
  netInsight: document.getElementById("netInsight"),

  // investments (simple)
  invTotalUsd: document.getElementById("invTotalUsd"),
  invTotalPnlUsd: document.getElementById("invTotalPnlUsd"),
  invNetWorthUsd: document.getElementById("invNetWorthUsd"),

  goalUsd: document.getElementById("goalUsd"),
  saveGoal: document.getElementById("saveGoal"),
  goalInfo: document.getElementById("goalInfo"),
  goalBar: document.getElementById("goalBar"),

  instForm: document.getElementById("instForm"),
  instName: document.getElementById("instName"),
  instValue: document.getElementById("instValue"),
  instPnl: document.getElementById("instPnl"),
  instBody: document.getElementById("instBody"),
  instPie: document.getElementById("instPie"),
  instLegend: document.getElementById("instLegend"),

  // notes
  noteMonth: document.getElementById("noteMonth"),
  noteText: document.getElementById("noteText"),
  saveNote: document.getElementById("saveNote"),
  clearNote: document.getElementById("clearNote"),
  noteMeta: document.getElementById("noteMeta"),
  exportMonthBtn2: document.getElementById("exportMonthBtn2"),
  exportAllBtn2: document.getElementById("exportAllBtn2"),
};

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);
}
function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) ?? fallback;
  } catch { return fallback; }
}
function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function formatTRY(n) {
  return Number(n || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" });
}
function formatUSD(n) {
  return Number(n || 0).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  return `${yyyy}-${mm}-${dd}`;
}
function monthKey(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,"0");
  return `${yyyy}-${mm}`;
}
function parseMonth(monthStr) {
  const [yyyy, mm] = String(monthStr).split("-").map(Number);
  return { yyyy, mm };
}
function daysInMonth(yyyy, mm1to12) {
  return new Date(yyyy, mm1to12, 0).getDate();
}

// ===== Summary / FX =====
function loadSummary() { return loadJSON(SUMMARY_KEY, { cashTry: 0, fxTryPerUsd: 0 }); }
function saveSummary(s) { saveJSON(SUMMARY_KEY, s); }

function loadNetWorthHistory() { return loadJSON(NETWORTH_KEY, []); }
function upsertNetWorthHistory(month, netWorthUsd) {
  const list = loadNetWorthHistory();
  const idx = list.findIndex(x => x.month === month);
  const item = { month, netWorthUsd: Number(netWorthUsd||0) };
  if (idx >= 0) list[idx] = item; else list.push(item);
  list.sort((a,b)=>a.month.localeCompare(b.month));
  saveJSON(NETWORTH_KEY, list);
}

// ===== Export =====
function exportJSON(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function exportAllData() {
  const keys = [
    SUMMARY_KEY, NETWORTH_KEY,
    RI_MASTER_KEY, RI_MONTH_KEY, EXTRA_INCOME_KEY,
    BUDGET_MASTER_KEY, BUDGET_MONTH_KEY, BUDGET_EXP_KEY, UNEXP_EXP_KEY,
    INST_KEY, GOAL_KEY,
    NOTES_KEY
  ];
  const data = {};
  for (const k of keys) data[k] = loadJSON(k, null);
  const stamp = new Date().toISOString();
  exportJSON(`accounter-backup-all-${stamp.slice(0,10)}.json`, { version: "1.0", exportedAt: stamp, data });
}

function exportMonthData(month) {
  const stamp = new Date().toISOString();
  exportJSON(`accounter-backup-${month}-${stamp.slice(11,19).replaceAll(":","")}.json`, {
    version: "1.0",
    exportedAt: stamp,
    month,
    monthView: {
      month,
      income: {
        recurringMonth: loadJSON(RI_MONTH_KEY, []).filter(x=>x.month===month),
        extra: loadJSON(EXTRA_INCOME_KEY, []).filter(x=>(x.date||"").startsWith(month)),
      },
      expense: {
        budgetMonth: loadJSON(BUDGET_MONTH_KEY, []).filter(x=>x.month===month),
        budgetExpenses: loadJSON(BUDGET_EXP_KEY, []).filter(x=>x.month===month),
        unexpected: loadJSON(UNEXP_EXP_KEY, []).filter(x=>(x.date||"").startsWith(month)),
      },
      note: loadJSON(NOTES_KEY, []).find(x=>x.month===month) || null
    },
    data: {
      [SUMMARY_KEY]: loadJSON(SUMMARY_KEY, null),
      [INST_KEY]: loadJSON(INST_KEY, null),
      [GOAL_KEY]: loadJSON(GOAL_KEY, null),
      [NETWORTH_KEY]: loadJSON(NETWORTH_KEY, null),
    }
  });
}

// ===== Simple Investments =====
function loadInstruments(){ return loadJSON(INST_KEY, []); }
function saveInstruments(list){ saveJSON(INST_KEY, list); }
function getInvTotalsUsd() {
  const list = loadInstruments();
  const totalValue = list.reduce((s,x)=>s + Number(x.valueUsd||0), 0);
  const totalPnl = list.reduce((s,x)=>s + Number(x.pnlUsd||0), 0);
  return { totalValue, totalPnl, list };
}
function loadGoal(){ return loadJSON(GOAL_KEY, { goalUsd: 0 }); }
function saveGoalObj(o){ saveJSON(GOAL_KEY, o); }

function cashUsdFromTry(cashTry, fxTryPerUsd) {
  const fx = Number(fxTryPerUsd||0);
  if (fx <= 0) return 0;
  return Number(cashTry||0) / fx;
}
function computeNetWorthUsd() {
  const s = loadSummary();
  const cashUsd = cashUsdFromTry(s.cashTry, s.fxTryPerUsd);
  const inv = getInvTotalsUsd().totalValue;
  return { netWorthUsd: cashUsd + inv, cashUsd, invUsd: inv };
}

// ===== Income (extra) =====
function loadExtraIncome() { return loadJSON(EXTRA_INCOME_KEY, []); }
function saveExtraIncome(list) { saveJSON(EXTRA_INCOME_KEY, list); }
function extraIncomeForMonth(month) {
  return loadExtraIncome().filter(x => (x.date || "").startsWith(month));
}
function renderExtraIncome() {
  if (!els.eiBody) return;
  const month = els.activeMonth?.value || monthKey(new Date());
  const list = extraIncomeForMonth(month).sort((a,b)=> (a.date < b.date ? 1 : -1));

  els.eiBody.innerHTML = list.map(x => `
    <tr>
      <td>${x.date}</td>
      <td class="right">${formatTRY(x.amount)}</td>
      <td>${escapeHtml(x.note || "")}</td>
      <td class="right"><button type="button" class="secondary" data-eidel="${x.id}">Sil</button></td>
    </tr>
  `).join("");

  els.eiBody.querySelectorAll("button[data-eidel]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-eidel");
      saveExtraIncome(loadExtraIncome().filter(x => x.id !== id));
      renderAll();
    });
  });
}

// ===== Recurring Income =====
function loadRIMaster() { return loadJSON(RI_MASTER_KEY, []); }
function saveRIMaster(list) { saveJSON(RI_MASTER_KEY, list); }
function loadRIMonth() { return loadJSON(RI_MONTH_KEY, []); }
function saveRIMonth(list) { saveJSON(RI_MONTH_KEY, list); }

function ensureMonthInstances(month) {
  const master = loadRIMaster();
  let inst = loadRIMonth();
  for (const m of master) {
    if (!m.active) continue;
    const exists = inst.some(x => x.month === month && x.masterId === m.id);
    if (!exists) {
      inst.push({
        id: uid(),
        masterId: m.id,
        month,
        name: m.name,
        amount: Number(m.defaultAmount),
        day: Number(m.day),
        status: "pending",
        skipped: false,
        type: "income"
      });
    }
  }
  saveRIMonth(inst);
}
function getMonthInstance(masterId, month) {
  return loadRIMonth().find(x => x.masterId === masterId && x.month === month) || null;
}
function setMonthInstancePatch(masterId, month, patch) {
  let inst = loadRIMonth();
  const idx = inst.findIndex(x => x.masterId === masterId && x.month === month);
  if (idx >= 0) inst[idx] = { ...inst[idx], ...patch };
  else {
    const master = loadRIMaster().find(m => m.id === masterId);
    if (!master) return;
    inst.push({
      id: uid(),
      masterId,
      month,
      name: master.name,
      amount: Number(master.defaultAmount),
      day: Number(master.day),
      status: "pending",
      skipped: false,
      type: "income",
      ...patch
    });
  }
  saveRIMonth(inst);
}
function autoStatusFor(instance, month) {
  if (!instance || instance.skipped) return instance?.status || "pending";
  if (instance.status === "received") return "received";
  const [yyyy, mm] = month.split("-").map(Number);
  const dueDate = new Date(yyyy, mm - 1, Number(instance.day));
  const now = new Date();
  if (monthKey(now) === month && now > dueDate) return "missed";
  return "pending";
}

let selectedDay = null;

function renderRIMasterTable() {
  if (!els.riBody) return;
  const month = els.activeMonth?.value || monthKey(new Date());
  ensureMonthInstances(month);

  const master = loadRIMaster().sort((a,b)=>a.name.localeCompare(b.name,"tr"));
  const inst = loadRIMonth();

  els.riBody.innerHTML = master.map(m => {
    const mi = inst.find(x => x.month === month && x.masterId === m.id) || null;
    const effectiveAmount = mi ? mi.amount : m.defaultAmount;
    const skipped = mi ? mi.skipped : false;
    const st = mi ? autoStatusFor(mi, month) : "pending";
    const statusEmoji = skipped ? "⏸️" : (st === "received" ? "🟢" : (st === "missed" ? "🔴" : "⚪"));

    return `
      <tr>
        <td>${escapeHtml(m.name)}</td>
        <td class="right">${formatTRY(m.defaultAmount)}</td>
        <td class="right">${Number(m.day)}</td>
        <td>${m.active ? "✅" : "—"}</td>
        <td>
          <div class="row" style="gap:8px;">
            <span>${statusEmoji}</span>
            <input data-ovr="${m.id}" type="number" inputmode="decimal" min="0" step="0.01"
                   value="${Number(effectiveAmount)}" style="width:120px;" />
            <button type="button" class="secondary" data-toggle="${m.id}">${m.active ? "Pasif" : "Aktif"}</button>
            <button type="button" class="secondary" data-pause="${m.id}">${skipped ? "Bu ay aç" : "Bu ay kapat"}</button>
            <button type="button" class="danger" data-del="${m.id}">Sil</button>
          </div>
        </td>
        <td></td>
      </tr>
    `;
  }).join("");

  els.riBody.querySelectorAll("button[data-toggle]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-toggle");
      saveRIMaster(loadRIMaster().map(x => x.id === id ? { ...x, active: !x.active } : x));
      ensureMonthInstances(month);
      renderAll();
    });
  });

  els.riBody.querySelectorAll("button[data-pause]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-pause");
      const mi = getMonthInstance(id, month);
      setMonthInstancePatch(id, month, { skipped: !(mi?.skipped === true) });
      renderAll();
    });
  });

  els.riBody.querySelectorAll("button[data-del]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-del");
      if (!confirm("Bu sürekli geliri tamamen silmek istiyor musun?")) return;
      saveRIMaster(loadRIMaster().filter(x => x.id !== id));
      saveRIMonth(loadRIMonth().filter(x => x.masterId !== id));
      renderAll();
    });
  });

  els.riBody.querySelectorAll("input[data-ovr]").forEach(inp => {
    inp.addEventListener("change", () => {
      const id = inp.getAttribute("data-ovr");
      setMonthInstancePatch(id, month, { amount: Number(inp.value || 0) });
      renderAll();
    });
  });
}

function renderIncomeCalendar() {
  if (!els.incomeCal) return;
  const month = els.activeMonth?.value || monthKey(new Date());
  ensureMonthInstances(month);

  const { yyyy, mm } = parseMonth(month);
  const dim = daysInMonth(yyyy, mm);
  const firstDow = new Date(yyyy, mm - 1, 1).getDay();
  const offset = (firstDow + 6) % 7;

  const inst = loadRIMonth().filter(x => x.month === month && x.type === "income" && !x.skipped);

  const dueByDay = new Map();
  for (const it of inst) {
    const d = Number(it.day);
    if (!dueByDay.has(d)) dueByDay.set(d, []);
    dueByDay.get(d).push(it);
  }

  const cells = [];
  for (let i=0;i<offset;i++) cells.push({ empty:true });

  for (let d=1; d<=dim; d++) {
    const list = dueByDay.get(d) || [];
    let state = "pending";
    if (list.length) {
      let hasMissed=false, hasPending=false, allReceived=true;
      for (const it of list) {
        const st = autoStatusFor(it, month);
        if (st === "missed") hasMissed = true;
        if (st === "pending") hasPending = true;
        if (st !== "received") allReceived = false;
      }
      if (hasMissed) state = "bad";
      else if (hasPending) state = "pending";
      else if (allReceived) state = "ok";
    }
    const badge = list.length ? (state==="ok"?"🟢":state==="bad"?"🔴":"⚪") : "";
    cells.push({ empty:false, day:d, state, badge, count:list.length });
  }

  els.incomeCal.innerHTML = cells.map(c => {
    if (c.empty) return `<div class="calCell" style="opacity:.25; cursor:default;"></div>`;
    return `
      <div class="calCell ${c.state}" data-day="${c.day}">
        <div class="dayNum">${c.day}</div>
        <div class="badge">${c.badge} ${c.count ? `${c.count} gelir` : ""}</div>
      </div>
    `;
  }).join("");

  els.incomeCal.querySelectorAll(".calCell[data-day]").forEach(cell => {
    cell.addEventListener("click", () => {
      const d = Number(cell.getAttribute("data-day"));
      selectedDay = `${month}-${String(d).padStart(2,"0")}`;
      renderSelectedDayDetails();
    });
  });

  const t = todayISO();
  if (!selectedDay || !selectedDay.startsWith(month)) {
    selectedDay = t.startsWith(month) ? t : `${month}-01`;
  }
  renderSelectedDayDetails();
}

function renderSelectedDayDetails() {
  if (!els.dayDetails || !els.selectedDayLabel) return;
  const month = els.activeMonth?.value || monthKey(new Date());
  const inst = loadRIMonth().filter(x => x.month === month && x.type === "income" && !x.skipped);

  els.selectedDayLabel.textContent = selectedDay || "—";
  if (!selectedDay) {
    els.dayDetails.textContent = "Takvimden bir gün seç.";
    return;
  }

  const day = Number(selectedDay.slice(-2));
  const due = inst.filter(x => Number(x.day) === day);
  if (!due.length) {
    els.dayDetails.innerHTML = `<div class="muted">Bu güne tanımlı sürekli gelir yok.</div>`;
    return;
  }

  els.dayDetails.innerHTML = due.map(it => {
    const st = autoStatusFor(it, month);
    const emoji = st==="received"?"🟢":st==="missed"?"🔴":"⚪";
    return `
      <div class="row" style="justify-content:space-between; margin:8px 0;">
        <div>
          <div><strong>${escapeHtml(it.name)}</strong> — ${formatTRY(it.amount)}</div>
          <div class="muted small">Durum: ${emoji} ${st}</div>
        </div>
        <div class="row">
          <button type="button" class="secondary" data-setst="${it.masterId}" data-st="pending">Bekliyor</button>
          <button type="button" class="secondary" data-setst="${it.masterId}" data-st="received">Geldi</button>
          <button type="button" class="secondary" data-setst="${it.masterId}" data-st="missed">Gelmedi</button>
        </div>
      </div>
      <hr />
    `;
  }).join("");

  els.dayDetails.querySelectorAll("button[data-setst]").forEach(btn => {
    btn.addEventListener("click", () => {
      setMonthInstancePatch(btn.getAttribute("data-setst"), month, { status: btn.getAttribute("data-st") });
      renderAll();
    });
  });
}

// ===== Expenses =====
function loadBudgetMaster(){ return loadJSON(BUDGET_MASTER_KEY, []); }
function saveBudgetMaster(list){ saveJSON(BUDGET_MASTER_KEY, list); }

function loadBudgetMonth(){ return loadJSON(BUDGET_MONTH_KEY, []); }
function saveBudgetMonth(list){ saveJSON(BUDGET_MONTH_KEY, list); }

function ensureBudgetMonth(month){
  const master = loadBudgetMaster();
  let bm = loadBudgetMonth();
  for (const m of master) {
    if (!m.active) continue;
    const exists = bm.some(x => x.masterId === m.id && x.month === month);
    if (!exists) bm.push({ id: uid(), masterId: m.id, month, budget: Number(m.defaultBudget) });
  }
  saveBudgetMonth(bm);
}
function setBudgetForMonth(masterId, month, budget){
  let bm = loadBudgetMonth();
  const idx = bm.findIndex(x => x.masterId === masterId && x.month === month);
  if (idx >= 0) bm[idx] = { ...bm[idx], budget: Number(budget) };
  else bm.push({ id: uid(), masterId, month, budget: Number(budget) });
  saveBudgetMonth(bm);
}
function getBudgetForMonth(masterId, month){
  const bm = loadBudgetMonth();
  const row = bm.find(x => x.masterId === masterId && x.month === month);
  if (row) return Number(row.budget || 0);
  const m = loadBudgetMaster().find(x => x.id === masterId);
  return Number(m?.defaultBudget || 0);
}

function loadBudgetExpenses(){ return loadJSON(BUDGET_EXP_KEY, []); }
function saveBudgetExpenses(list){ saveJSON(BUDGET_EXP_KEY, list); }
function budgetExpensesForMonth(month){ return loadBudgetExpenses().filter(x => x.month === month); }

function loadUnexpected(){ return loadJSON(UNEXP_EXP_KEY, []); }
function saveUnexpected(list){ saveJSON(UNEXP_EXP_KEY, list); }
function unexpectedForMonth(month){ return loadUnexpected().filter(x => (x.date||"").startsWith(month)); }

function renderBudgets(){
  if (!els.bmBody) return;
  const month = els.activeMonth?.value || monthKey(new Date());
  ensureBudgetMonth(month);

  const master = loadBudgetMaster().sort((a,b)=>a.name.localeCompare(b.name,"tr"));
  const exp = budgetExpensesForMonth(month);

  if (els.beBudgetId){
    const activeMasters = master.filter(m=>m.active);
    els.beBudgetId.innerHTML = activeMasters.map(m=>`<option value="${m.id}">${escapeHtml(m.name)}</option>`).join("");
  }

  function spentFor(masterId){
    return exp.filter(x=>x.budgetId===masterId).reduce((s,x)=>s+Number(x.amount||0),0);
  }

  els.bmBody.innerHTML = master.map(m=>{
    const budget = getBudgetForMonth(m.id, month);
    const spent = spentFor(m.id);
    const left = budget - spent;

    return `
      <tr>
        <td>${escapeHtml(m.name)}</td>
        <td class="right">
          <input data-bud="${m.id}" type="number" inputmode="decimal" min="0" step="0.01"
                 value="${Number(budget)}" style="width:120px;" />
        </td>
        <td class="right">${formatTRY(spent)}</td>
        <td class="right">${formatTRY(left)}</td>
        <td>${m.active ? "✅" : "—"}</td>
        <td class="right">
          <button type="button" class="secondary" data-btoggle="${m.id}">${m.active ? "Pasif" : "Aktif"}</button>
          <button type="button" class="danger" data-bdel="${m.id}">Sil</button>
        </td>
      </tr>
    `;
  }).join("");

  els.bmBody.querySelectorAll("input[data-bud]").forEach(inp=>{
    inp.addEventListener("change", ()=>{
      const id = inp.getAttribute("data-bud");
      setBudgetForMonth(id, month, Number(inp.value||0));
      renderAll();
    });
  });

  els.bmBody.querySelectorAll("button[data-btoggle]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-btoggle");
      saveBudgetMaster(loadBudgetMaster().map(x=>x.id===id?{...x,active:!x.active}:x));
      ensureBudgetMonth(month);
      renderAll();
    });
  });

  els.bmBody.querySelectorAll("button[data-bdel]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-bdel");
      if(!confirm("Bu kategoriyi tamamen silmek istiyor musun?")) return;
      saveBudgetMaster(loadBudgetMaster().filter(x=>x.id!==id));
      saveBudgetMonth(loadBudgetMonth().filter(x=>x.masterId!==id));
      saveBudgetExpenses(loadBudgetExpenses().filter(x=>x.budgetId!==id));
      renderAll();
    });
  });
}

function renderBudgetExpenseList(){
  if (!els.beBody) return;
  const month = els.activeMonth?.value || monthKey(new Date());
  const masterMap = new Map(loadBudgetMaster().map(m=>[m.id,m.name]));
  const list = budgetExpensesForMonth(month).sort((a,b)=>(a.date < b.date ? 1 : -1));

  els.beBody.innerHTML = list.map(x=>`
    <tr>
      <td>${x.date}</td>
      <td>${escapeHtml(masterMap.get(x.budgetId) || "—")}</td>
      <td class="right">${formatTRY(x.amount)}</td>
      <td>${escapeHtml(x.note||"")}</td>
      <td class="right"><button type="button" class="secondary" data-bedel="${x.id}">Sil</button></td>
    </tr>
  `).join("");

  els.beBody.querySelectorAll("button[data-bedel]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-bedel");
      saveBudgetExpenses(loadBudgetExpenses().filter(x=>x.id!==id));
      renderAll();
    });
  });
}

function renderUnexpected(){
  if (!els.ueBody) return;
  const month = els.activeMonth?.value || monthKey(new Date());
  const list = unexpectedForMonth(month).sort((a,b)=>(a.date < b.date ? 1 : -1));

  els.ueBody.innerHTML = list.map(x=>`
    <tr>
      <td>${x.date}</td>
      <td class="right">${formatTRY(x.amount)}</td>
      <td>${escapeHtml(x.note||"")}</td>
      <td class="right"><button type="button" class="secondary" data-uedel="${x.id}">Sil</button></td>
    </tr>
  `).join("");

  els.ueBody.querySelectorAll("button[data-uedel]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-uedel");
      saveUnexpected(loadUnexpected().filter(x=>x.id!==id));
      renderAll();
    });
  });
}

// ===== Monthly totals (TRY) =====
function computeMonthlyIncomeTry(month){
  ensureMonthInstances(month);
  const inst = loadRIMonth().filter(x => x.month === month && x.type === "income" && x.skipped !== true);
  let total = 0;
  for (const it of inst) if (it.status === "received") total += Number(it.amount || 0);
  total += extraIncomeForMonth(month).reduce((s,x)=>s+Number(x.amount||0),0);
  return total;
}
function computeMonthlyExpenseTry(month){
  ensureBudgetMonth(month);
  const budgetSpent = budgetExpensesForMonth(month).reduce((s,x)=>s+Number(x.amount||0),0);
  const unexpSpent = unexpectedForMonth(month).reduce((s,x)=>s+Number(x.amount||0),0);
  return { total: budgetSpent + unexpSpent, budgetSpent, unexpSpent };
}
function renderNetPanel(){
  if (!els.netIncome || !els.netExpense || !els.netLeft) return;
  const month = els.activeMonth?.value || monthKey(new Date());
  const income = computeMonthlyIncomeTry(month);
  const exp = computeMonthlyExpenseTry(month);
  const left = income - exp.total;

  els.netIncome.textContent = formatTRY(income);
  els.netExpense.textContent = formatTRY(exp.total);
  els.netLeft.textContent = formatTRY(left);

  const msg = `Bütçe giderleri: ${formatTRY(exp.budgetSpent)} • Beklenmedik: ${formatTRY(exp.unexpSpent)}. ` +
              (left >= 0 ? `Bu ay artıdasın ✅` : `Bu ay açık var ⚠️`);
  if (els.netInsight) els.netInsight.textContent = msg;
}

// ===== Charts =====
function drawLineChart(canvas, series, valueKey) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width = canvas.clientWidth;
  const h = canvas.height = canvas.clientHeight || 220;

  ctx.clearRect(0,0,w,h);

  if (!series || series.length < 2) {
    ctx.fillStyle = "rgba(255,255,255,.6)";
    ctx.font = "12px system-ui";
    ctx.fillText("Grafik için en az 2 farklı ayda kayıt gerekir.", 10, 20);
    return;
  }

  const values = series.map(x => Number(x[valueKey]||0));
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const pad = 16;
  const left = pad, right = w - pad, top = pad, bottom = h - pad;
  const span = (maxV - minV) || 1;
  const n = series.length;

  const xPos = (i)=> left + (i*(right-left))/(n-1);
  const yPos = (v)=> bottom - ((v - minV) * (bottom-top))/span;

  ctx.strokeStyle = "rgba(255,255,255,.10)";
  ctx.beginPath();
  ctx.moveTo(left, top);
  ctx.lineTo(left, bottom);
  ctx.lineTo(right, bottom);
  ctx.stroke();

  ctx.strokeStyle = "rgba(110,168,254,.85)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  series.forEach((p,i)=>{
    const x = xPos(i);
    const y = yPos(Number(p[valueKey]||0));
    if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  });
  ctx.stroke();

  ctx.fillStyle = "rgba(110,168,254,.95)";
  series.forEach((p,i)=>{
    const x = xPos(i);
    const y = yPos(Number(p[valueKey]||0));
    ctx.beginPath();
    ctx.arc(x,y,3,0,Math.PI*2);
    ctx.fill();
  });
}

function drawNetWorthChart() {
  const canvas = els.netWorthChart;
  const hist = loadNetWorthHistory().map(x=>({ month:x.month, v:x.netWorthUsd }));
  drawLineChart(canvas, hist, "v");
}

function drawPie(canvas, items) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width = canvas.clientWidth;
  const h = canvas.height = canvas.clientHeight || 240;
  ctx.clearRect(0,0,w,h);

  const total = items.reduce((s,x)=>s + Number(x.value||0), 0);
  if (total <= 0) {
    ctx.fillStyle = "rgba(255,255,255,.6)";
    ctx.font = "12px system-ui";
    ctx.fillText("Pasta için en az 1 enstrüman ve değer gerekir.", 10, 20);
    return;
  }

  const cx = w/2, cy = h/2;
  const r = Math.min(w,h)*0.35;
  let ang = -Math.PI/2;

  items.forEach((it, i) => {
    const frac = Number(it.value)/total;
    const a2 = ang + frac * Math.PI*2;
    const hue = (i * 47) % 360;
    ctx.fillStyle = `hsla(${hue}, 70%, 55%, 0.9)`;
    ctx.beginPath();
    ctx.moveTo(cx,cy);
    ctx.arc(cx,cy,r,ang,a2);
    ctx.closePath();
    ctx.fill();
    ang = a2;
  });

  // center hole (donut)
  ctx.fillStyle = "rgba(15,18,25,1)";
  ctx.beginPath();
  ctx.arc(cx,cy,r*0.55,0,Math.PI*2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,.85)";
  ctx.font = "12px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("Total", cx, cy - 4);
  ctx.font = "bold 14px system-ui";
  ctx.fillText(formatUSD(total), cx, cy + 16);
}

// ===== Notes =====
function loadNotes(){ return loadJSON(NOTES_KEY, []); }
function saveNotes(list){ saveJSON(NOTES_KEY, list); }
function getNote(month){
  return loadNotes().find(x=>x.month===month) || null;
}
function upsertNote(month, text){
  const list = loadNotes();
  const idx = list.findIndex(x=>x.month===month);
  const row = { month, text: String(text||""), updatedAt: new Date().toISOString() };
  if (idx>=0) list[idx]=row; else list.push(row);
  list.sort((a,b)=>a.month.localeCompare(b.month));
  saveNotes(list);
}
function renderNotes(){
  if (!els.noteMonth || !els.noteText) return;
  const m = els.noteMonth.value || monthKey(new Date());
  const n = getNote(m);
  els.noteText.value = n?.text || "";
  els.noteMeta.textContent = n?.updatedAt ? `Son güncelleme: ${n.updatedAt}` : "Henüz kayıt yok.";
}

// ===== UI Tabs =====
function initTabs() {
  els.tabs().forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      els.tabs().forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const tab = btn.getAttribute("data-tab");
      els.pages().forEach(sec => sec.classList.add("hidden"));
      const target = document.getElementById(`tab-${tab}`);
      if (target) target.classList.remove("hidden");
    });
  });
}
function initSubTabs(scopeRootSelector) {
  const root = document.querySelector(scopeRootSelector);
  if (!root) return;
  const tabs = root.querySelectorAll(".subtab");
  const pages = root.querySelectorAll(".subPage");
  tabs.forEach(btn=>{
    btn.addEventListener("click",(e)=>{
      e.preventDefault();
      tabs.forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      const key = btn.getAttribute("data-subtab");
      pages.forEach(p=>p.classList.add("hidden"));
      const target = document.getElementById(`sub-${key}`);
      if (target) target.classList.remove("hidden");
    });
  });
}

// ===== Render Dashboard =====
function renderDashboard() {
  const s = loadSummary();
  const inv = getInvTotalsUsd().totalValue;
  const net = computeNetWorthUsd();

  els.cashTryNow.textContent = formatTRY(s.cashTry);
  els.invUsdNow.textContent = formatUSD(inv);
  els.netWorthUsd.textContent = formatUSD(net.netWorthUsd);

  const mk = monthKey(new Date());
  const incomeTry = computeMonthlyIncomeTry(mk);
  const expTry = computeMonthlyExpenseTry(mk);

  els.mIncomeTry.textContent = formatTRY(incomeTry);
  els.mExpenseTry.textContent = formatTRY(expTry.total);
  els.mNetTry.textContent = formatTRY(incomeTry - expTry.total);

  if (els.cashTryInput) els.cashTryInput.value = Number(s.cashTry || 0);
  if (els.fxTryPerUsdInput) els.fxTryPerUsdInput.value = Number(s.fxTryPerUsd || 0);

  drawNetWorthChart();
}

// ===== Render Investments (Simple) =====
function renderInvestmentsSimple() {
  const { totalValue, totalPnl, list } = getInvTotalsUsd();
  const net = computeNetWorthUsd();

  if (els.invTotalUsd) els.invTotalUsd.textContent = formatUSD(totalValue);
  if (els.invTotalPnlUsd) els.invTotalPnlUsd.textContent = formatUSD(totalPnl);
  if (els.invNetWorthUsd) els.invNetWorthUsd.textContent = formatUSD(net.netWorthUsd);

  if (els.instBody) {
    els.instBody.innerHTML = list
      .slice()
      .sort((a,b)=>String(a.name||"").localeCompare(String(b.name||""),"en"))
      .map(it => `
        <tr>
          <td><strong>${escapeHtml(it.name)}</strong></td>
          <td class="right">
            <input data-val="${it.id}" type="number" inputmode="decimal" min="0" step="0.01" value="${Number(it.valueUsd||0)}" style="width:140px;" />
          </td>
          <td class="right">
            <input data-pnl="${it.id}" type="number" inputmode="decimal" step="0.01" value="${Number(it.pnlUsd||0)}" style="width:140px;" />
          </td>
          <td class="right">
            <button type="button" class="danger" data-del="${it.id}">Sil</button>
          </td>
        </tr>
      `).join("");

    // update fields
    els.instBody.querySelectorAll("input[data-val]").forEach(inp=>{
      inp.addEventListener("change", ()=>{
        const id = inp.getAttribute("data-val");
        const v = Number(inp.value||0);
        saveInstruments(loadInstruments().map(x=>x.id===id?{...x,valueUsd:v}:x));
        renderAll();
      });
    });
    els.instBody.querySelectorAll("input[data-pnl]").forEach(inp=>{
      inp.addEventListener("change", ()=>{
        const id = inp.getAttribute("data-pnl");
        const v = Number(inp.value||0);
        saveInstruments(loadInstruments().map(x=>x.id===id?{...x,pnlUsd:v}:x));
        renderAll();
      });
    });
    els.instBody.querySelectorAll("button[data-del]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const id = btn.getAttribute("data-del");
        saveInstruments(loadInstruments().filter(x=>x.id!==id));
        renderAll();
      });
    });
  }

  // pie
  const pieItems = list.filter(x=>Number(x.valueUsd||0)>0).map(x=>({ label: x.name, value: Number(x.valueUsd||0) }));
  drawPie(els.instPie, pieItems);

  if (els.instLegend) {
    if (!pieItems.length) {
      els.instLegend.textContent = "—";
    } else {
      const total = pieItems.reduce((s,x)=>s+x.value,0);
      els.instLegend.innerHTML = pieItems
        .slice()
        .sort((a,b)=>b.value-a.value)
        .map((x,i)=>{
          const pct = total>0 ? (x.value/total*100) : 0;
          return `<div>• ${escapeHtml(x.label)} — ${formatUSD(x.value)} (${pct.toFixed(1)}%)</div>`;
        }).join("");
    }
  }

  // goal
  const g = loadGoal();
  if (els.goalUsd) els.goalUsd.value = Number(g.goalUsd||0) || "";
  if (els.goalInfo && els.goalBar) {
    const goal = Number(g.goalUsd||0);
    if (goal > 0) {
      const pct = Math.max(0, Math.min(100, (net.netWorthUsd/goal)*100));
      els.goalInfo.textContent = `Şu an: ${formatUSD(net.netWorthUsd)} / Hedef: ${formatUSD(goal)} (${pct.toFixed(1)}%)`;
      els.goalBar.style.width = `${pct}%`;
    } else {
      els.goalInfo.textContent = "Hedef girersen progress bar dolar.";
      els.goalBar.style.width = "0%";
    }
  }
}

// ===== Monthly Net Worth save =====
function saveCurrentMonthSnapshot() {
  const m = monthKey(new Date());
  const net = computeNetWorthUsd().netWorthUsd;
  upsertNetWorthHistory(m, net);
}

// ===== Render All =====
function renderAll() {
  renderDashboard();
  renderRIMasterTable();
  renderExtraIncome();
  renderIncomeCalendar();

  renderBudgets();
  renderBudgetExpenseList();
  renderUnexpected();
  renderNetPanel();

  renderInvestmentsSimple();
  renderNotes();
}

// ===== Init =====
function init() {
  initTabs();
  initSubTabs("#tab-transactions");

  const nowM = monthKey(new Date());
  if (els.activeMonth) els.activeMonth.value = nowM;
  if (els.noteMonth) els.noteMonth.value = nowM;

  const t = todayISO();
  if (els.eiDate) els.eiDate.value = t;
  if (els.beDate) els.beDate.value = t;
  if (els.ueDate) els.ueDate.value = t;

  els.activeMonth?.addEventListener("input", () => { selectedDay = null; renderAll(); });
  els.noteMonth?.addEventListener("input", () => { renderNotes(); });

  // dashboard save
  els.saveSummary?.addEventListener("click", () => {
    const cashTry = Number(els.cashTryInput?.value || 0);
    const fxTryPerUsd = Number(els.fxTryPerUsdInput?.value || 0);
    saveSummary({ cashTry, fxTryPerUsd });

    saveCurrentMonthSnapshot();
    renderAll();
  });

  // export
  const exportMonth = () => exportMonthData(els.activeMonth?.value || monthKey(new Date()));
  els.exportMonthBtn?.addEventListener("click", exportMonth);
  els.exportAllBtn?.addEventListener("click", exportAllData);
  els.exportMonthBtn2?.addEventListener("click", exportMonth);
  els.exportAllBtn2?.addEventListener("click", exportAllData);

  // recurring income add
  els.riForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = els.riName.value.trim();
    const amount = Number(els.riAmount.value || 0);
    const day = Number(els.riDay.value || 1);
    const active = !!els.riActive.checked;

    if (!name) return alert("Gelir adı yaz.");
    if (amount <= 0) return alert("Miktar 0'dan büyük olmalı.");
    if (day < 1 || day > 31) return alert("Gün 1-31 olmalı.");

    const master = loadRIMaster();
    master.push({ id: uid(), name, defaultAmount: amount, day, active });
    saveRIMaster(master);

    els.riName.value = "";
    els.riAmount.value = "";
    els.riDay.value = "5";
    els.riActive.checked = true;

    renderAll();
  });

  // extra income add
  els.eiForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const date = els.eiDate.value;
    const amount = Number(els.eiAmount.value || 0);
    const note = (els.eiNote?.value || "").trim();
    if (!date) return alert("Tarih gerekli.");
    if (amount <= 0) return alert("Miktar 0'dan büyük olmalı.");

    const all = loadExtraIncome();
    all.push({ id: uid(), date, amount, note });
    saveExtraIncome(all);

    els.eiAmount.value = "";
    if (els.eiNote) els.eiNote.value = "";

    renderAll();
  });

  // budget master add
  els.bmForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = els.bmName.value.trim();
    const budget = Number(els.bmBudget.value || 0);
    const active = !!els.bmActive.checked;
    if (!name) return alert("Kategori yaz.");
    if (budget < 0) return alert("Bütçe negatif olamaz.");

    const master = loadBudgetMaster();
    master.push({ id: uid(), name, defaultBudget: budget, active });
    saveBudgetMaster(master);

    els.bmName.value = "";
    els.bmBudget.value = "";
    els.bmActive.checked = true;

    renderAll();
  });

  // budget expense add
  els.beForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const month = els.activeMonth?.value || monthKey(new Date());
    const budgetId = els.beBudgetId?.value;
    const date = els.beDate?.value;
    const amount = Number(els.beAmount?.value || 0);
    const note = (els.beNote?.value || "").trim();
    if (!budgetId) return alert("Kategori seç.");
    if (!date) return alert("Tarih gerekli.");
    if (amount <= 0) return alert("Miktar 0'dan büyük olmalı.");

    const list = loadBudgetExpenses();
    list.push({ id: uid(), month, budgetId, date, amount, note });
    saveBudgetExpenses(list);

    if (els.beAmount) els.beAmount.value = "";
    if (els.beNote) els.beNote.value = "";

    renderAll();
  });

  // unexpected add
  els.ueForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const date = els.ueDate?.value;
    const amount = Number(els.ueAmount?.value || 0);
    const note = (els.ueNote?.value || "").trim();
    if (!date) return alert("Tarih gerekli.");
    if (amount <= 0) return alert("Miktar 0'dan büyük olmalı.");

    const list = loadUnexpected();
    list.push({ id: uid(), date, amount, note });
    saveUnexpected(list);

    if (els.ueAmount) els.ueAmount.value = "";
    if (els.ueNote) els.ueNote.value = "";

    renderAll();
  });

  // instruments add
  els.instForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = String(els.instName?.value || "").trim().toUpperCase();
    const valueUsd = Number(els.instValue?.value || 0);
    const pnlUsd = Number(els.instPnl?.value || 0);

    if (!name) return alert("Enstrüman adı yaz.");
    if (valueUsd < 0) return alert("Değer negatif olamaz.");

    const list = loadInstruments();
    list.push({ id: uid(), name, valueUsd, pnlUsd });
    saveInstruments(list);

    els.instName.value = "";
    els.instValue.value = "";
    els.instPnl.value = "";

    renderAll();
  });

  // goal
  els.saveGoal?.addEventListener("click", () => {
    const goalUsd = Number(els.goalUsd?.value || 0);
    saveGoalObj({ goalUsd });
    renderAll();
  });

  // notes
  els.saveNote?.addEventListener("click", ()=>{
    const m = els.noteMonth?.value || monthKey(new Date());
    upsertNote(m, els.noteText?.value || "");
    renderNotes();
  });
  els.clearNote?.addEventListener("click", ()=>{
    els.noteText.value = "";
    const m = els.noteMonth?.value || monthKey(new Date());
    upsertNote(m, "");
    renderNotes();
  });

  // defaults
  const s = loadSummary();
  if (!s.fxTryPerUsd || s.fxTryPerUsd <= 0) {
    // leave empty for manual; but keep stable defaults
    saveSummary({ cashTry: Number(s.cashTry||0), fxTryPerUsd: Number(s.fxTryPerUsd||0) });
  }

  renderAll();
}

init();
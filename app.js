// ====== Accounter v0.5 (LocalStorage) ======

const SUMMARY_KEY = "summary.v1";
const NETWORTH_KEY = "networth.history.v1";

const RI_MASTER_KEY = "ri.master.v1";
const RI_MONTH_KEY  = "ri.month.v1";

const EXTRA_INCOME_KEY = "income.extra.v1"; // [{id,date,amount,note}]

// Expense
const BUDGET_MASTER_KEY = "budget.master.v1";     // [{id,name,defaultBudget,active}]
const BUDGET_MONTH_KEY  = "budget.month.v1";      // [{id,masterId,month,budget}]
const BUDGET_EXP_KEY    = "budget.expenses.v1";   // [{id,month,budgetId,date,amount,note}]
const UNEXP_EXP_KEY     = "expense.unexpected.v1";// [{id,date,amount,note}]

const INVENTORY_KEY = "inventory.v1";

const els = {
  // tabs
  tabs: () => document.querySelectorAll(".tab"),
  pages: () => document.querySelectorAll(".tabPage"),

  // dashboard
  cashNow: document.getElementById("cashNow"),
  invNow: document.getElementById("invNow"),
  netWorth: document.getElementById("netWorth"),
  mIncome: document.getElementById("mIncome"),
  mExpense: document.getElementById("mExpense"),
  mNet: document.getElementById("mNet"),
  cashInput: document.getElementById("cashInput"),
  invInput: document.getElementById("invInput"),
  saveSummary: document.getElementById("saveSummary"),
  netWorthChart: document.getElementById("netWorthChart"),

  // transactions
  activeMonth: document.getElementById("activeMonth"),
  subtabs: () => document.querySelectorAll(".subtab"),
  subpages: () => document.querySelectorAll(".subPage"),

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

  // budgets (standard)
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

  // unexpected
  ueForm: document.getElementById("ueForm"),
  ueDate: document.getElementById("ueDate"),
  ueAmount: document.getElementById("ueAmount"),
  ueNote: document.getElementById("ueNote"),
  ueBody: document.getElementById("ueBody"),

  // net panel
  netIncome: document.getElementById("netIncome"),
  netExpense: document.getElementById("netExpense"),
  netLeft: document.getElementById("netLeft"),
  netInsight: document.getElementById("netInsight"),

  // inventory
  invForm: document.getElementById("invForm"),
  invName: document.getElementById("invName"),
  invQty: document.getElementById("invQty"),
  invUnit: document.getElementById("invUnit"),
  invLow: document.getElementById("invLow"),
  invBody: document.getElementById("invBody"),
};

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);
}
function formatTRY(n) {
  return Number(n || 0).toLocaleString("tr-TR", { style: "currency", currency: "TRY" });
}
function escapeHtml(str) {
  return String(str)
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
function daysInMonth(yyyy, mm1to12) {
  return new Date(yyyy, mm1to12, 0).getDate();
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

// ====== Summary + NetWorth history ======
function loadSummary() { return loadJSON(SUMMARY_KEY, { cashNow: 0, invNow: 0 }); }
function saveSummary(s) { saveJSON(SUMMARY_KEY, s); }

function loadNetWorthHistory() { return loadJSON(NETWORTH_KEY, []); }
function upsertNetWorthHistory(month, cashNow, invNow) {
  const list = loadNetWorthHistory();
  const netWorth = (Number(cashNow)||0) + (Number(invNow)||0);
  const idx = list.findIndex(x => x.month === month);
  const item = { month, cashNow, invNow, netWorth };
  if (idx >= 0) list[idx] = item; else list.push(item);
  list.sort((a,b)=>a.month.localeCompare(b.month));
  saveJSON(NETWORTH_KEY, list);
}

// ====== Extra Income ======
function loadExtraIncome() { return loadJSON(EXTRA_INCOME_KEY, []); }
function saveExtraIncome(list) { saveJSON(EXTRA_INCOME_KEY, list); }
function extraIncomeForMonth(month) {
  return loadExtraIncome().filter(x => (x.date || "").startsWith(month));
}
function renderExtraIncome() {
  if (!els.eiBody) return;
  const month = els.activeMonth.value || monthKey(new Date());
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

// ====== Recurring Income ======
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
  const month = els.activeMonth.value || monthKey(new Date());
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
  const month = els.activeMonth.value || monthKey(new Date());
  ensureMonthInstances(month);

  const [yyyy, mm] = month.split("-").map(Number);
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
  const month = els.activeMonth.value || monthKey(new Date());
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

// ====== Budgets (Standard Expenses) ======
function loadBudgetMaster(){ return loadJSON(BUDGET_MASTER_KEY, []); }
function saveBudgetMaster(list){ saveJSON(BUDGET_MASTER_KEY, list); }

function loadBudgetMonth(){ return loadJSON(BUDGET_MONTH_KEY, []); } // [{id,masterId,month,budget}]
function saveBudgetMonth(list){ saveJSON(BUDGET_MONTH_KEY, list); }

function ensureBudgetMonth(month){
  const master = loadBudgetMaster();
  let bm = loadBudgetMonth();
  for (const m of master) {
    if (!m.active) continue;
    const exists = bm.some(x => x.masterId === m.id && x.month === month);
    if (!exists) {
      bm.push({ id: uid(), masterId: m.id, month, budget: Number(m.defaultBudget) });
    }
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

// expenses under budgets
function loadBudgetExpenses(){ return loadJSON(BUDGET_EXP_KEY, []); }
function saveBudgetExpenses(list){ saveJSON(BUDGET_EXP_KEY, list); }
function budgetExpensesForMonth(month){
  return loadBudgetExpenses().filter(x => x.month === month);
}

// unexpected
function loadUnexpected(){ return loadJSON(UNEXP_EXP_KEY, []); }
function saveUnexpected(list){ saveJSON(UNEXP_EXP_KEY, list); }
function unexpectedForMonth(month){
  return loadUnexpected().filter(x => (x.date||"").startsWith(month));
}

function renderBudgets(){
  if (!els.bmBody) return;
  const month = els.activeMonth.value || monthKey(new Date());
  ensureBudgetMonth(month);

  const master = loadBudgetMaster().sort((a,b)=>a.name.localeCompare(b.name,"tr"));
  const exp = budgetExpensesForMonth(month);

  // dropdown for adding expense
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

  // budget change (month override)
  els.bmBody.querySelectorAll("input[data-bud]").forEach(inp=>{
    inp.addEventListener("change", ()=>{
      const id = inp.getAttribute("data-bud");
      setBudgetForMonth(id, month, Number(inp.value||0));
      renderAll();
    });
  });

  // toggle master active
  els.bmBody.querySelectorAll("button[data-btoggle]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-btoggle");
      saveBudgetMaster(loadBudgetMaster().map(x=>x.id===id?{...x,active:!x.active}:x));
      ensureBudgetMonth(month);
      renderAll();
    });
  });

  // delete category (and its expenses)
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
  const month = els.activeMonth.value || monthKey(new Date());
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
  const month = els.activeMonth.value || monthKey(new Date());
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

// ====== Net computations ======
function computeMonthlyIncome(month){
  ensureMonthInstances(month);
  const inst = loadRIMonth().filter(x => x.month === month && x.type === "income" && x.skipped !== true);
  let total = 0;
  for (const it of inst) if (it.status === "received") total += Number(it.amount || 0);
  total += extraIncomeForMonth(month).reduce((s,x)=>s+Number(x.amount||0),0);
  return total;
}

function computeMonthlyExpense(month){
  ensureBudgetMonth(month);
  const budgetSpent = budgetExpensesForMonth(month).reduce((s,x)=>s+Number(x.amount||0),0);
  const unexpSpent = unexpectedForMonth(month).reduce((s,x)=>s+Number(x.amount||0),0);
  return { total: budgetSpent + unexpSpent, budgetSpent, unexpSpent };
}

function renderNetPanel(){
  if (!els.netIncome || !els.netExpense || !els.netLeft) return;
  const month = els.activeMonth.value || monthKey(new Date());
  const income = computeMonthlyIncome(month);
  const exp = computeMonthlyExpense(month);
  const left = income - exp.total;

  els.netIncome.textContent = formatTRY(income);
  els.netExpense.textContent = formatTRY(exp.total);
  els.netLeft.textContent = formatTRY(left);

  // insight: top category
  const master = loadBudgetMaster();
  const monthExp = budgetExpensesForMonth(month);
  const byCat = new Map();
  for (const e of monthExp) byCat.set(e.budgetId, (byCat.get(e.budgetId)||0) + Number(e.amount||0));
  let topId=null, topVal=0;
  for (const [k,v] of byCat.entries()) if (v>topVal){ topVal=v; topId=k; }
  const topName = master.find(x=>x.id===topId)?.name;

  const msg = [
    `Bütçe giderleri: ${formatTRY(exp.budgetSpent)} • Beklenmedik: ${formatTRY(exp.unexpSpent)}.`,
    topName ? `En çok harcama: ${topName} (${formatTRY(topVal)}).` : `Henüz standart gider harcaması yok.`,
    left >= 0 ? `Bu ay artıdasın ✅` : `Bu ay açık var ⚠️`
  ].join(" ");

  if (els.netInsight) els.netInsight.textContent = msg;
}

// ====== Tabs ======
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
function initSubTabs() {
  els.subtabs().forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      els.subtabs().forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const sub = btn.getAttribute("data-subtab");
      els.subpages().forEach(sec => sec.classList.add("hidden"));
      const target = document.getElementById(`sub-${sub}`);
      if (target) target.classList.remove("hidden");
    });
  });
}

// ====== Dashboard render + chart ======
function drawNetWorthChart() {
  const canvas = els.netWorthChart;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width = canvas.clientWidth;
  const h = canvas.height = canvas.height;

  ctx.clearRect(0,0,w,h);

  const data = loadNetWorthHistory();
  if (data.length < 2) {
    ctx.fillStyle = "rgba(255,255,255,.6)";
    ctx.font = "12px system-ui";
    ctx.fillText("Grafik için en az 2 farklı ayda Kaydet yap.", 10, 20);
    return;
  }

  const values = data.map(x => Number(x.netWorth||0));
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const pad = 16;
  const left = pad, right = w - pad, top = pad, bottom = h - pad;

  const span = (maxV - minV) || 1;
  const n = data.length;

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
  data.forEach((p,i)=>{
    const x = xPos(i);
    const y = yPos(Number(p.netWorth||0));
    if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  });
  ctx.stroke();

  ctx.fillStyle = "rgba(110,168,254,.95)";
  data.forEach((p,i)=>{
    const x = xPos(i);
    const y = yPos(Number(p.netWorth||0));
    ctx.beginPath();
    ctx.arc(x,y,3,0,Math.PI*2);
    ctx.fill();
  });
}

function renderDashboard() {
  const s = loadSummary();
  if (els.cashNow) els.cashNow.textContent = formatTRY(s.cashNow);
  if (els.invNow) els.invNow.textContent = formatTRY(s.invNow);
  if (els.netWorth) els.netWorth.textContent = formatTRY((Number(s.cashNow)||0) + (Number(s.invNow)||0));

  const mk = monthKey(new Date());
  const income = computeMonthlyIncome(mk);
  const exp = computeMonthlyExpense(mk);
  if (els.mIncome) els.mIncome.textContent = formatTRY(income);
  if (els.mExpense) els.mExpense.textContent = formatTRY(exp.total);
  if (els.mNet) els.mNet.textContent = formatTRY(income - exp.total);

  if (els.cashInput) els.cashInput.value = s.cashNow ?? 0;
  if (els.invInput) els.invInput.value = s.invNow ?? 0;

  drawNetWorthChart();
}

// ====== Inventory (aynı) ======
function loadInventory() { return loadJSON(INVENTORY_KEY, []); }
function saveInventory(list) { saveJSON(INVENTORY_KEY, list); }
let inventory = loadInventory();

function renderInventory() {
  if (!els.invBody) return;
  inventory.sort((a,b)=>a.name.localeCompare(b.name,"tr"));

  els.invBody.innerHTML = inventory.map(it => {
    const isLow = Number(it.qty) <= Number(it.low);
    return `
      <tr>
        <td>${escapeHtml(it.name)}</td>
        <td class="right">${Number(it.qty)}</td>
        <td>${escapeHtml(it.unit)}</td>
        <td class="right">${Number(it.low)}</td>
        <td>${isLow ? "⚠️ Az kaldı" : "✅ Normal"}</td>
        <td class="right"><button class="secondary" data-invdel="${it.id}">Sil</button></td>
      </tr>
    `;
  }).join("");

  els.invBody.querySelectorAll("button[data-invdel]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-invdel");
      inventory = inventory.filter(x => x.id !== id);
      saveInventory(inventory);
      renderInventory();
    });
  });
}

// ====== Render All ======
function renderAll() {
  renderDashboard();
  renderRIMasterTable();
  renderExtraIncome();
  renderIncomeCalendar();

  renderBudgets();
  renderBudgetExpenseList();
  renderUnexpected();
  renderNetPanel();

  renderInventory();
}

// ====== Init ======
function init() {
  initTabs();
  initSubTabs();

  // default month
  if (els.activeMonth) els.activeMonth.value = monthKey(new Date());
  els.activeMonth?.addEventListener("input", () => {
    selectedDay = null;
    renderAll();
  });

  // default dates
  if (els.eiDate) els.eiDate.value = todayISO();
  if (els.beDate) els.beDate.value = todayISO();
  if (els.ueDate) els.ueDate.value = todayISO();

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
    const month = els.activeMonth.value || monthKey(new Date());
    const budgetId = els.beBudgetId.value;
    const date = els.beDate.value;
    const amount = Number(els.beAmount.value || 0);
    const note = (els.beNote?.value || "").trim();
    if (!budgetId) return alert("Kategori seç.");
    if (!date) return alert("Tarih gerekli.");
    if (amount <= 0) return alert("Miktar 0'dan büyük olmalı.");

    const list = loadBudgetExpenses();
    list.push({ id: uid(), month, budgetId, date, amount, note });
    saveBudgetExpenses(list);

    els.beAmount.value = "";
    if (els.beNote) els.beNote.value = "";
    renderAll();
  });

  // unexpected add
  els.ueForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const date = els.ueDate.value;
    const amount = Number(els.ueAmount.value || 0);
    const note = (els.ueNote?.value || "").trim();
    if (!date) return alert("Tarih gerekli.");
    if (amount <= 0) return alert("Miktar 0'dan büyük olmalı.");

    const list = loadUnexpected();
    list.push({ id: uid(), date, amount, note });
    saveUnexpected(list);

    els.ueAmount.value = "";
    if (els.ueNote) els.ueNote.value = "";
    renderAll();
  });

  // dashboard save
  els.saveSummary?.addEventListener("click", () => {
    const cashNow = Number(els.cashInput.value || 0);
    const invNow = Number(els.invInput.value || 0);
    saveSummary({ cashNow, invNow });
    upsertNetWorthHistory(monthKey(new Date()), cashNow, invNow);
    renderDashboard();
  });

  // inventory
  els.invForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const item = {
      id: uid(),
      name: els.invName.value.trim(),
      qty: Number(els.invQty.value),
      unit: els.invUnit.value,
      low: Number(els.invLow.value),
    };
    if (!item.name) return;
    inventory.push(item);
    saveInventory(inventory);
    els.invName.value = "";
    els.invQty.value = "";
    renderInventory();
  });

  renderAll();
}

init();
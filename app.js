// ===== Accounter v1.0 (USD) =====
// - Transactions (income/expense/net)
// - Investments (USD-only, manual prices)
// - Inventory forecast (USD)
// - Monthly notes
// - Export JSON (selected month or all)

const SUMMARY_KEY = "summary.usd.v1";
const NETWORTH_KEY = "networth.history.usd.v1";

// Income
const RI_MASTER_KEY = "ri.master.v1";
const RI_MONTH_KEY  = "ri.month.v1";
const EXTRA_INCOME_KEY = "income.extra.v1";

// Expense
const BUDGET_MASTER_KEY = "budget.master.v1";
const BUDGET_MONTH_KEY  = "budget.month.v1";
const BUDGET_EXP_KEY    = "budget.expenses.v1";
const UNEXP_EXP_KEY     = "expense.unexpected.v1";

// Inventory
const INVENTORY_KEY = "inventory.v1";

// Investments
const ASSETS_KEY = "inv.assets.usd.v1";     // [{id,symbol,name,category,priceUsd}]
const INV_TX_KEY = "inv.tx.usd.v1";         // [{id,date,month,assetId,side,qty,priceUsd,feeUsd,note}]

// Notes
const NOTES_KEY = "notes.monthly.v1";       // [{month,text,updatedAt}]

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
  saveSummary: document.getElementById("saveSummary"),
  netWorthChart: document.getElementById("netWorthChart"),

  // transactions
  activeMonth: document.getElementById("activeMonth"),
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
  invDaily: document.getElementById("invDaily"),
  invPrice: document.getElementById("invPrice"),
  invPriceUnit: document.getElementById("invPriceUnit"),
  invBody: document.getElementById("invBody"),
  foodMonthLabel: document.getElementById("foodMonthLabel"),
  foodForecastTotal: document.getElementById("foodForecastTotal"),
  foodForecastDaily: document.getElementById("foodForecastDaily"),
  foodForecastBudget: document.getElementById("foodForecastBudget"),
  foodForecastDiff: document.getElementById("foodForecastDiff"),
  foodShoppingList: document.getElementById("foodShoppingList"),

  // investments
  invMonth: document.getElementById("invMonth"),
  invSubtabs: () => document.querySelectorAll("#tab-investments .subtab"),
  invSubpages: () => document.querySelectorAll("#tab-investments .subPage"),

  pfValue: document.getElementById("pfValue"),
  pfCost: document.getElementById("pfCost"),
  pfPnl: document.getElementById("pfPnl"),
  assetForm: document.getElementById("assetForm"),
  assetSymbol: document.getElementById("assetSymbol"),
  assetName: document.getElementById("assetName"),
  assetCategory: document.getElementById("assetCategory"),
  pfBody: document.getElementById("pfBody"),

  invTxForm: document.getElementById("invTxForm"),
  invTxDate: document.getElementById("invTxDate"),
  invTxAsset: document.getElementById("invTxAsset"),
  invTxSide: document.getElementById("invTxSide"),
  invTxQty: document.getElementById("invTxQty"),
  invTxPrice: document.getElementById("invTxPrice"),
  invTxFee: document.getElementById("invTxFee"),
  invTxNote: document.getElementById("invTxNote"),
  invTxBody: document.getElementById("invTxBody"),
  invTxInfo: document.getElementById("invTxInfo"),

  invBuySum: document.getElementById("invBuySum"),
  invSellSum: document.getElementById("invSellSum"),
  invNetFlow: document.getElementById("invNetFlow"),
  invValueChart: document.getElementById("invValueChart"),

  // notes
  notesMonth: document.getElementById("notesMonth"),
  notesText: document.getElementById("notesText"),
  saveNotes: document.getElementById("saveNotes"),
  clearNotes: document.getElementById("clearNotes"),
  exportMonthBtn: document.getElementById("exportMonthBtn"),
  exportAllBtn: document.getElementById("exportAllBtn"),
};

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);
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
function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function saveJSON(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}
function formatUSD(n) {
  return Number(n || 0).toLocaleString("en-US", { style: "currency", currency: "USD" });
}
function downloadJSON(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 800);
}

// ===== Summary + NetWorth history =====
function loadSummary() { return loadJSON(SUMMARY_KEY, { cashNow: 0 }); }
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

// ===== Income =====
function loadExtraIncome(){ return loadJSON(EXTRA_INCOME_KEY, []); }
function saveExtraIncome(list){ saveJSON(EXTRA_INCOME_KEY, list); }
function extraIncomeForMonth(month){ return loadExtraIncome().filter(x => (x.date||"").startsWith(month)); }

function loadRIMaster(){ return loadJSON(RI_MASTER_KEY, []); }
function saveRIMaster(list){ saveJSON(RI_MASTER_KEY, list); }
function loadRIMonth(){ return loadJSON(RI_MONTH_KEY, []); }
function saveRIMonth(list){ saveJSON(RI_MONTH_KEY, list); }

function ensureMonthInstances(month){
  const master = loadRIMaster();
  let inst = loadRIMonth();
  for(const m of master){
    if(!m.active) continue;
    const exists = inst.some(x => x.month===month && x.masterId===m.id);
    if(!exists){
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
function getMonthInstance(masterId, month){
  return loadRIMonth().find(x => x.masterId===masterId && x.month===month) || null;
}
function setMonthInstancePatch(masterId, month, patch){
  let inst = loadRIMonth();
  const idx = inst.findIndex(x => x.masterId===masterId && x.month===month);
  if(idx >= 0) inst[idx] = { ...inst[idx], ...patch };
  else {
    const master = loadRIMaster().find(m => m.id===masterId);
    if(!master) return;
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
function autoStatusFor(instance, month){
  if(!instance || instance.skipped) return instance?.status || "pending";
  if(instance.status==="received") return "received";
  const [yyyy, mm] = month.split("-").map(Number);
  const dueDate = new Date(yyyy, mm-1, Number(instance.day));
  const now = new Date();
  if(monthKey(now)===month && now > dueDate) return "missed";
  return "pending";
}

let selectedDay = null;

// ===== Expenses =====
function loadBudgetMaster(){ return loadJSON(BUDGET_MASTER_KEY, []); }
function saveBudgetMaster(list){ saveJSON(BUDGET_MASTER_KEY, list); }
function loadBudgetMonth(){ return loadJSON(BUDGET_MONTH_KEY, []); }
function saveBudgetMonth(list){ saveJSON(BUDGET_MONTH_KEY, list); }
function ensureBudgetMonth(month){
  const master = loadBudgetMaster();
  let bm = loadBudgetMonth();
  for(const m of master){
    if(!m.active) continue;
    const exists = bm.some(x => x.masterId===m.id && x.month===month);
    if(!exists) bm.push({ id: uid(), masterId: m.id, month, budget: Number(m.defaultBudget) });
  }
  saveBudgetMonth(bm);
}
function setBudgetForMonth(masterId, month, budget){
  let bm = loadBudgetMonth();
  const idx = bm.findIndex(x => x.masterId===masterId && x.month===month);
  if(idx>=0) bm[idx] = { ...bm[idx], budget: Number(budget) };
  else bm.push({ id: uid(), masterId, month, budget: Number(budget) });
  saveBudgetMonth(bm);
}
function getBudgetForMonth(masterId, month){
  const row = loadBudgetMonth().find(x => x.masterId===masterId && x.month===month);
  if(row) return Number(row.budget||0);
  const m = loadBudgetMaster().find(x => x.id===masterId);
  return Number(m?.defaultBudget||0);
}

function loadBudgetExpenses(){ return loadJSON(BUDGET_EXP_KEY, []); }
function saveBudgetExpenses(list){ saveJSON(BUDGET_EXP_KEY, list); }
function budgetExpensesForMonth(month){ return loadBudgetExpenses().filter(x => x.month===month); }

function loadUnexpected(){ return loadJSON(UNEXP_EXP_KEY, []); }
function saveUnexpected(list){ saveJSON(UNEXP_EXP_KEY, list); }
function unexpectedForMonth(month){ return loadUnexpected().filter(x => (x.date||"").startsWith(month)); }

// ===== Inventory (USD forecast) =====
function loadInventory(){ return loadJSON(INVENTORY_KEY, []); }
function saveInventory(list){ saveJSON(INVENTORY_KEY, list); }
function normUnit(u){
  const x = String(u||"").trim().toLowerCase();
  if(x==="gr") return "g";
  if(x==="kilogram") return "kg";
  if(x==="litre") return "l";
  return x;
}
function unitKind(u){
  const x = normUnit(u);
  if(x==="g"||x==="kg") return "mass";
  if(x==="ml"||x==="l") return "volume";
  return "count";
}
function toBaseQty(qty, unit){
  const x = Number(qty||0);
  const u = normUnit(unit);
  const kind = unitKind(u);
  if(kind==="mass") return (u==="kg") ? x*1000 : x;
  if(kind==="volume") return (u==="l") ? x*1000 : x;
  return x;
}
function pricePerBase(price, priceUnit){
  const p = Number(price||0);
  const u = normUnit(priceUnit);
  const kind = unitKind(u);
  if(p<=0) return 0;
  if(kind==="mass") return (u==="kg") ? p/1000 : p; // $/g
  if(kind==="volume") return (u==="l") ? p/1000 : p; // $/ml
  return p; // $/adet/paket
}
function estimateDaysLeft(item){
  const daily = Number(item.dailyUse||0);
  if(!daily || daily<=0) return null;
  const stockBase = toBaseQty(item.qty, item.unit);
  const dailyBase = toBaseQty(daily, item.unit);
  if(dailyBase<=0) return null;
  return stockBase / dailyBase;
}
function estimateMonthlyCost(item, monthDays){
  const daily = Number(item.dailyUse||0);
  const price = Number(item.price||0);
  if(!daily || daily<=0 || !price || price<=0) return 0;
  const dailyBase = toBaseQty(daily, item.unit);
  const ppb = pricePerBase(price, item.priceUnit || item.unit);
  if(dailyBase<=0 || ppb<=0) return 0;
  return dailyBase * Number(monthDays||30) * ppb;
}
function findNutritionBudgetForMonth(month){
  ensureBudgetMonth(month);
  const master = loadBudgetMaster();
  const bes = master.find(x => String(x.name||"").toLowerCase().includes("beslenme"));
  if(!bes) return null;
  return getBudgetForMonth(bes.id, month);
}

// ===== Investments (USD) =====
function loadAssets(){ return loadJSON(ASSETS_KEY, []); }
function saveAssets(list){ saveJSON(ASSETS_KEY, list); }
function loadInvTx(){ return loadJSON(INV_TX_KEY, []); }
function saveInvTx(list){ saveJSON(INV_TX_KEY, list); }

function computeHoldingsAndCost(assets, txList){
  // average cost using buy-only weighted (sell reduces qty and removes cost at avg)
  const state = new Map(); // assetId -> {qty, cost}
  for(const a of assets) state.set(a.id, { qty: 0, cost: 0 });

  const txSorted = [...txList].sort((a,b)=> (a.date < b.date ? -1 : 1));
  for(const t of txSorted){
    const s = state.get(t.assetId) || { qty:0, cost:0 };
    const qty = Number(t.qty||0);
    const px  = Number(t.priceUsd||0);
    const fee = Number(t.feeUsd||0);

    if(t.side==="buy"){
      const addCost = qty * px + fee;
      s.qty += qty;
      s.cost += addCost;
    } else {
      // sell: remove cost at current avg cost
      const sellQty = qty;
      const avg = (s.qty>0) ? (s.cost / s.qty) : 0;
      const removed = avg * sellQty;
      s.qty -= sellQty;
      s.cost -= removed;
      if(s.qty < 0) { s.qty = 0; s.cost = 0; } // safety
    }
    state.set(t.assetId, s);
  }

  return state;
}

function portfolioValueUSD(){
  const assets = loadAssets();
  const tx = loadInvTx();
  const st = computeHoldingsAndCost(assets, tx);

  let totalValue = 0;
  let totalCost = 0;

  for(const a of assets){
    const s = st.get(a.id) || { qty:0, cost:0 };
    const px = Number(a.priceUsd||0);
    totalValue += s.qty * px;
    totalCost  += s.cost;
  }

  return { totalValue, totalCost, pnl: totalValue-totalCost };
}

// ===== Monthly computations (Income/Expense) =====
function computeMonthlyIncome(month){
  ensureMonthInstances(month);
  const inst = loadRIMonth().filter(x => x.month===month && x.type==="income" && x.skipped !== true);
  let total = 0;
  for(const it of inst) if(it.status==="received") total += Number(it.amount||0);
  total += extraIncomeForMonth(month).reduce((s,x)=>s+Number(x.amount||0),0);
  return total;
}
function computeMonthlyExpense(month){
  ensureBudgetMonth(month);
  const budgetSpent = budgetExpensesForMonth(month).reduce((s,x)=>s+Number(x.amount||0),0);
  const unexpSpent  = unexpectedForMonth(month).reduce((s,x)=>s+Number(x.amount||0),0);
  return { total: budgetSpent + unexpSpent, budgetSpent, unexpSpent };
}

// ===== Render helpers =====
function initTabs(){
  els.tabs().forEach(btn=>{
    btn.addEventListener("click",(e)=>{
      e.preventDefault();
      els.tabs().forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      const tab = btn.getAttribute("data-tab");
      els.pages().forEach(sec=>sec.classList.add("hidden"));
      document.getElementById(`tab-${tab}`)?.classList.remove("hidden");
    });
  });
}
function initSubTabs(containerTabs, containerPages){
  containerTabs().forEach(btn=>{
    btn.addEventListener("click",(e)=>{
      e.preventDefault();
      containerTabs().forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      const key = btn.getAttribute("data-subtab");
      containerPages().forEach(p=>p.classList.add("hidden"));
      document.getElementById(`sub-${key}`)?.classList.remove("hidden");
    });
  });
}

function renderDashboard(){
  const s = loadSummary();
  const { totalValue } = portfolioValueUSD();
  const invNow = totalValue;

  if(els.cashNow) els.cashNow.textContent = formatUSD(s.cashNow);
  if(els.invNow)  els.invNow.textContent  = formatUSD(invNow);
  if(els.netWorth) els.netWorth.textContent = formatUSD((Number(s.cashNow)||0) + invNow);

  const mk = monthKey(new Date());
  const income = computeMonthlyIncome(mk);
  const exp = computeMonthlyExpense(mk);
  if(els.mIncome) els.mIncome.textContent = formatUSD(income);
  if(els.mExpense) els.mExpense.textContent = formatUSD(exp.total);
  if(els.mNet) els.mNet.textContent = formatUSD(income - exp.total);

  if(els.cashInput) els.cashInput.value = s.cashNow ?? 0;

  drawNetWorthChart();
}

function drawLineChart(canvas, points){
  if(!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width = canvas.clientWidth;
  const h = canvas.height = 220;
  ctx.clearRect(0,0,w,h);

  if(!points || points.length<2){
    ctx.fillStyle = "rgba(255,255,255,.6)";
    ctx.font = "12px system-ui";
    ctx.fillText("Grafik için en az 2 nokta gerekir.", 10, 20);
    return;
  }

  const vals = points.map(p=>Number(p.value||0));
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);
  const pad = 16;
  const left = pad, right = w-pad, top = pad, bottom = h-pad;
  const span = (maxV-minV)||1;
  const n = points.length;

  const xPos = (i)=> left + (i*(right-left))/(n-1);
  const yPos = (v)=> bottom - ((v-minV)*(bottom-top))/span;

  ctx.strokeStyle = "rgba(255,255,255,.12)";
  ctx.beginPath();
  ctx.moveTo(left, top);
  ctx.lineTo(left, bottom);
  ctx.lineTo(right, bottom);
  ctx.stroke();

  ctx.strokeStyle = "rgba(110,168,254,.85)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  points.forEach((p,i)=>{
    const x=xPos(i), y=yPos(p.value);
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  });
  ctx.stroke();

  ctx.fillStyle = "rgba(110,168,254,.95)";
  points.forEach((p,i)=>{
    const x=xPos(i), y=yPos(p.value);
    ctx.beginPath(); ctx.arc(x,y,3,0,Math.PI*2); ctx.fill();
  });
}

function drawNetWorthChart(){
  const data = loadNetWorthHistory();
  const pts = data.map(x=>({ label:x.month, value:Number(x.netWorth||0) }));
  drawLineChart(els.netWorthChart, pts);
}

// ===== Income render =====
function renderExtraIncome(){
  if(!els.eiBody) return;
  const month = els.activeMonth?.value || monthKey(new Date());
  const list = extraIncomeForMonth(month).sort((a,b)=> (a.date < b.date ? 1 : -1));

  els.eiBody.innerHTML = list.map(x=>`
    <tr>
      <td>${x.date}</td>
      <td class="right">${formatUSD(x.amount)}</td>
      <td>${escapeHtml(x.note||"")}</td>
      <td class="right"><button type="button" class="secondary" data-eidel="${x.id}">Sil</button></td>
    </tr>
  `).join("");

  els.eiBody.querySelectorAll("button[data-eidel]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-eidel");
      saveExtraIncome(loadExtraIncome().filter(x=>x.id!==id));
      renderAll();
    });
  });
}

function renderRIMasterTable(){
  if(!els.riBody) return;
  const month = els.activeMonth?.value || monthKey(new Date());
  ensureMonthInstances(month);

  const master = loadRIMaster().sort((a,b)=>a.name.localeCompare(b.name,"tr"));
  const inst = loadRIMonth();

  els.riBody.innerHTML = master.map(m=>{
    const mi = inst.find(x => x.month===month && x.masterId===m.id) || null;
    const effectiveAmount = mi ? mi.amount : m.defaultAmount;
    const skipped = mi ? mi.skipped : false;
    const st = mi ? autoStatusFor(mi, month) : "pending";
    const emoji = skipped ? "⏸️" : (st==="received"?"🟢":(st==="missed"?"🔴":"⚪"));

    return `
      <tr>
        <td>${escapeHtml(m.name)}</td>
        <td class="right">${formatUSD(m.defaultAmount)}</td>
        <td class="right">${Number(m.day)}</td>
        <td>${m.active ? "✅" : "—"}</td>
        <td>
          <div class="row" style="gap:8px;">
            <span>${emoji}</span>
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

  els.riBody.querySelectorAll("button[data-toggle]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-toggle");
      saveRIMaster(loadRIMaster().map(x=>x.id===id?{...x,active:!x.active}:x));
      ensureMonthInstances(month);
      renderAll();
    });
  });

  els.riBody.querySelectorAll("button[data-pause]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-pause");
      const mi = getMonthInstance(id, month);
      setMonthInstancePatch(id, month, { skipped: !(mi?.skipped===true) });
      renderAll();
    });
  });

  els.riBody.querySelectorAll("button[data-del]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-del");
      if(!confirm("Bu sürekli geliri tamamen silmek istiyor musun?")) return;
      saveRIMaster(loadRIMaster().filter(x=>x.id!==id));
      saveRIMonth(loadRIMonth().filter(x=>x.masterId!==id));
      renderAll();
    });
  });

  els.riBody.querySelectorAll("input[data-ovr]").forEach(inp=>{
    inp.addEventListener("change", ()=>{
      const id = inp.getAttribute("data-ovr");
      setMonthInstancePatch(id, month, { amount: Number(inp.value||0) });
      renderAll();
    });
  });
}

function renderIncomeCalendar(){
  if(!els.incomeCal) return;
  const month = els.activeMonth?.value || monthKey(new Date());
  ensureMonthInstances(month);

  const { yyyy, mm } = parseMonth(month);
  const dim = daysInMonth(yyyy, mm);
  const firstDow = new Date(yyyy, mm-1, 1).getDay();
  const offset = (firstDow + 6) % 7;

  const inst = loadRIMonth().filter(x => x.month===month && x.type==="income" && !x.skipped);
  const dueByDay = new Map();
  for(const it of inst){
    const d = Number(it.day);
    if(!dueByDay.has(d)) dueByDay.set(d, []);
    dueByDay.get(d).push(it);
  }

  const cells = [];
  for(let i=0;i<offset;i++) cells.push({ empty:true });

  for(let d=1; d<=dim; d++){
    const list = dueByDay.get(d) || [];
    let state = "pending";
    if(list.length){
      let hasMissed=false, hasPending=false, allReceived=true;
      for(const it of list){
        const st = autoStatusFor(it, month);
        if(st==="missed") hasMissed=true;
        if(st==="pending") hasPending=true;
        if(st!=="received") allReceived=false;
      }
      if(hasMissed) state="bad";
      else if(hasPending) state="pending";
      else if(allReceived) state="ok";
    }
    const badge = list.length ? (state==="ok"?"🟢":state==="bad"?"🔴":"⚪") : "";
    cells.push({ empty:false, day:d, state, badge, count:list.length });
  }

  els.incomeCal.innerHTML = cells.map(c=>{
    if(c.empty) return `<div class="calCell" style="opacity:.25; cursor:default;"></div>`;
    return `
      <div class="calCell ${c.state}" data-day="${c.day}">
        <div class="dayNum">${c.day}</div>
        <div class="badge">${c.badge} ${c.count ? `${c.count} gelir` : ""}</div>
      </div>
    `;
  }).join("");

  els.incomeCal.querySelectorAll(".calCell[data-day]").forEach(cell=>{
    cell.addEventListener("click", ()=>{
      const d = Number(cell.getAttribute("data-day"));
      selectedDay = `${month}-${String(d).padStart(2,"0")}`;
      renderSelectedDayDetails();
    });
  });

  const t = todayISO();
  if(!selectedDay || !selectedDay.startsWith(month)){
    selectedDay = t.startsWith(month) ? t : `${month}-01`;
  }
  renderSelectedDayDetails();
}

function renderSelectedDayDetails(){
  if(!els.dayDetails || !els.selectedDayLabel) return;
  const month = els.activeMonth?.value || monthKey(new Date());
  const inst = loadRIMonth().filter(x => x.month===month && x.type==="income" && !x.skipped);

  els.selectedDayLabel.textContent = selectedDay || "—";
  if(!selectedDay){
    els.dayDetails.textContent = "Takvimden bir gün seç.";
    return;
  }

  const day = Number(selectedDay.slice(-2));
  const due = inst.filter(x => Number(x.day)===day);
  if(!due.length){
    els.dayDetails.innerHTML = `<div class="muted">Bu güne tanımlı sürekli gelir yok.</div>`;
    return;
  }

  els.dayDetails.innerHTML = due.map(it=>{
    const st = autoStatusFor(it, month);
    const emoji = st==="received"?"🟢":st==="missed"?"🔴":"⚪";
    return `
      <div class="row" style="justify-content:space-between; margin:8px 0;">
        <div>
          <div><strong>${escapeHtml(it.name)}</strong> — ${formatUSD(it.amount)}</div>
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

  els.dayDetails.querySelectorAll("button[data-setst]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      setMonthInstancePatch(btn.getAttribute("data-setst"), month, { status: btn.getAttribute("data-st") });
      renderAll();
    });
  });
}

// ===== Expenses render =====
function renderBudgets(){
  if(!els.bmBody) return;
  const month = els.activeMonth?.value || monthKey(new Date());
  ensureBudgetMonth(month);

  const master = loadBudgetMaster().sort((a,b)=>a.name.localeCompare(b.name,"tr"));
  const exp = budgetExpensesForMonth(month);

  if(els.beBudgetId){
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
        <td class="right">${formatUSD(spent)}</td>
        <td class="right">${formatUSD(left)}</td>
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
  if(!els.beBody) return;
  const month = els.activeMonth?.value || monthKey(new Date());
  const masterMap = new Map(loadBudgetMaster().map(m=>[m.id,m.name]));
  const list = budgetExpensesForMonth(month).sort((a,b)=>(a.date < b.date ? 1 : -1));

  els.beBody.innerHTML = list.map(x=>`
    <tr>
      <td>${x.date}</td>
      <td>${escapeHtml(masterMap.get(x.budgetId) || "—")}</td>
      <td class="right">${formatUSD(x.amount)}</td>
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
  if(!els.ueBody) return;
  const month = els.activeMonth?.value || monthKey(new Date());
  const list = unexpectedForMonth(month).sort((a,b)=>(a.date < b.date ? 1 : -1));

  els.ueBody.innerHTML = list.map(x=>`
    <tr>
      <td>${x.date}</td>
      <td class="right">${formatUSD(x.amount)}</td>
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

function renderNetPanel(){
  if(!els.netIncome || !els.netExpense || !els.netLeft) return;
  const month = els.activeMonth?.value || monthKey(new Date());
  const income = computeMonthlyIncome(month);
  const exp = computeMonthlyExpense(month);
  const left = income - exp.total;

  els.netIncome.textContent = formatUSD(income);
  els.netExpense.textContent = formatUSD(exp.total);
  els.netLeft.textContent = formatUSD(left);

  const master = loadBudgetMaster();
  const monthExp = budgetExpensesForMonth(month);
  const byCat = new Map();
  for(const e of monthExp) byCat.set(e.budgetId, (byCat.get(e.budgetId)||0) + Number(e.amount||0));
  let topId=null, topVal=0;
  for(const [k,v] of byCat.entries()) if(v>topVal){ topVal=v; topId=k; }
  const topName = master.find(x=>x.id===topId)?.name;

  const msg = [
    `Bütçe giderleri: ${formatUSD(exp.budgetSpent)} • Beklenmedik: ${formatUSD(exp.unexpSpent)}.`,
    topName ? `En çok harcama: ${topName} (${formatUSD(topVal)}).` : `Henüz standart gider harcaması yok.`,
    left >= 0 ? `Bu ay artıdasın ✅` : `Bu ay açık var ⚠️`
  ].join(" ");

  if(els.netInsight) els.netInsight.textContent = msg;
}

// ===== Inventory render =====
function renderInventory(){
  if(!els.invBody) return;
  const month = els.activeMonth?.value || monthKey(new Date());
  const { yyyy, mm } = parseMonth(month);
  const dim = daysInMonth(yyyy, mm);

  const inv = loadInventory();
  const sorted = [...inv].sort((a,b)=>{
    const da = estimateDaysLeft(a); const db = estimateDaysLeft(b);
    const aa = (da==null)?99999:da; const bb=(db==null)?99999:db;
    if(aa!==bb) return aa-bb;
    return String(a.name||"").localeCompare(String(b.name||""),"tr");
  });

  els.invBody.innerHTML = sorted.map(it=>{
    const daysLeft = estimateDaysLeft(it);
    const isLow = Number(it.qty) <= Number(it.low);
    const traffic = daysLeft==null ? "" : (daysLeft<=2?"🔴":(daysLeft<=6?"🟠":"🟢"));
    const mCost = estimateMonthlyCost(it, dim);

    return `
      <tr>
        <td>${escapeHtml(it.name)}</td>
        <td class="right">${Number(it.qty)}</td>
        <td>${escapeHtml(normUnit(it.unit))}</td>
        <td class="right">${Number(it.low)}</td>
        <td>
          ${traffic} ${isLow ? "Az kaldı" : "Normal"}
          ${daysLeft==null ? `<div class="muted small">Gün hesabı için günlük tüketim gir.</div>` : `<div class="muted small">${daysLeft.toFixed(1)} gün yeter</div>`}
          ${mCost>0 ? `<div class="muted small">Aylık ~ ${formatUSD(mCost)}</div>` : `<div class="muted small">Aylık: —</div>`}
        </td>
        <td class="right"><button type="button" class="secondary" data-invdel="${it.id}">Sil</button></td>
      </tr>
    `;
  }).join("");

  els.invBody.querySelectorAll("button[data-invdel]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-invdel");
      saveInventory(loadInventory().filter(x=>x.id!==id));
      renderAll();
    });
  });

  // Forecast panel
  if(els.foodMonthLabel && els.foodForecastTotal && els.foodForecastDaily){
    const total = loadInventory().reduce((s,it)=> s + estimateMonthlyCost(it, dim), 0);
    const dailyAvg = dim ? total/dim : 0;
    els.foodMonthLabel.textContent = `${month} (${dim} gün)`;
    els.foodForecastTotal.textContent = formatUSD(total);
    els.foodForecastDaily.textContent = formatUSD(dailyAvg);

    const bud = findNutritionBudgetForMonth(month);
    if(els.foodForecastBudget) els.foodForecastBudget.textContent = bud==null ? "—" : formatUSD(bud);

    if(els.foodForecastDiff){
      if(bud==null) els.foodForecastDiff.textContent = "Beslenme bütçesi yok. Gider → Standart Giderler'e 'Beslenme' ekleyebilirsin.";
      else {
        const diff = Number(bud) - Number(total);
        els.foodForecastDiff.textContent = diff>=0 ? `Bütçeye göre +${formatUSD(diff)} alan var ✅` : `Bütçeyi ${formatUSD(Math.abs(diff))} aşıyorsun ⚠️`;
      }
    }

    if(els.foodShoppingList){
      const urgent = loadInventory().map(it=>{
        const d = estimateDaysLeft(it);
        const isLow = Number(it.qty)<=Number(it.low);
        if(isLow || (d!=null && d<=3)) return { name: it.name, daysLeft: d };
        return null;
      }).filter(Boolean).sort((a,b)=> ( (a.daysLeft??9999) - (b.daysLeft??9999) ));

      els.foodShoppingList.innerHTML = urgent.length
        ? urgent.map(x=>`<div>🛒 <strong>${escapeHtml(x.name)}</strong> — ${x.daysLeft==null ? "—" : `${x.daysLeft.toFixed(1)} gün`}</div>`).join("")
        : `<div class="muted">Acil alınacak yok ✅</div>`;
    }
  }
}

// ===== Investments render =====
function renderInvAssetSelect(){
  if(!els.invTxAsset) return;
  const assets = loadAssets().sort((a,b)=>a.symbol.localeCompare(b.symbol));
  els.invTxAsset.innerHTML = assets.map(a=>`<option value="${a.id}">${escapeHtml(a.symbol)}</option>`).join("");
}
function renderPortfolio(){
  if(!els.pfBody) return;

  const assets = loadAssets().sort((a,b)=>a.symbol.localeCompare(b.symbol));
  const tx = loadInvTx();
  const st = computeHoldingsAndCost(assets, tx);

  let totalValue=0, totalCost=0;

  els.pfBody.innerHTML = assets.map(a=>{
    const s = st.get(a.id) || { qty:0, cost:0 };
    const qty = Number(s.qty||0);
    const cost = Number(s.cost||0);
    const avg = qty>0 ? (cost/qty) : 0;

    const px = Number(a.priceUsd||0);
    const value = qty * px;
    const pnl = value - cost;

    totalValue += value;
    totalCost += cost;

    return `
      <tr>
        <td>${escapeHtml(a.symbol)}</td>
        <td class="right">${qty.toFixed(8).replace(/\.?0+$/,"")}</td>
        <td class="right">${formatUSD(avg)}</td>
        <td class="right">
          <input data-px="${a.id}" type="number" inputmode="decimal" min="0" step="0.01"
                 value="${px || ""}" placeholder="0.00" style="width:120px;" />
        </td>
        <td class="right">${formatUSD(value)}</td>
        <td class="right">${formatUSD(pnl)}</td>
        <td class="right">
          <button type="button" class="danger" data-adel="${a.id}">Sil</button>
        </td>
      </tr>
    `;
  }).join("");

  const pnlTotal = totalValue-totalCost;
  if(els.pfValue) els.pfValue.textContent = formatUSD(totalValue);
  if(els.pfCost)  els.pfCost.textContent  = formatUSD(totalCost);
  if(els.pfPnl)   els.pfPnl.textContent   = formatUSD(pnlTotal);

  // price change
  els.pfBody.querySelectorAll("input[data-px]").forEach(inp=>{
    inp.addEventListener("change", ()=>{
      const id = inp.getAttribute("data-px");
      const v = Number(inp.value||0);
      saveAssets(loadAssets().map(a=>a.id===id?{...a,priceUsd:v}:a));
      renderAll();
    });
  });

  // delete asset (also deletes tx)
  els.pfBody.querySelectorAll("button[data-adel]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-adel");
      if(!confirm("Varlığı ve tüm işlemlerini silmek istiyor musun?")) return;
      saveAssets(loadAssets().filter(a=>a.id!==id));
      saveInvTx(loadInvTx().filter(t=>t.assetId!==id));
      renderAll();
    });
  });
}

function renderInvTx(){
  if(!els.invTxBody || !els.invTxInfo) return;
  const month = els.invMonth?.value || monthKey(new Date());
  const assets = loadAssets();
  const map = new Map(assets.map(a=>[a.id,a.symbol]));
  const list = loadInvTx().filter(t=>t.month===month).sort((a,b)=> (a.date < b.date ? 1 : -1));

  const buySum = list.filter(x=>x.side==="buy").reduce((s,x)=>s + (Number(x.qty||0)*Number(x.priceUsd||0) + Number(x.feeUsd||0)), 0);
  const sellSum = list.filter(x=>x.side==="sell").reduce((s,x)=>s + (Number(x.qty||0)*Number(x.priceUsd||0) - Number(x.feeUsd||0)), 0);

  els.invTxInfo.textContent = `Alım: ${formatUSD(buySum)} • Satım: ${formatUSD(sellSum)} • Kayıt: ${list.length}`;

  els.invTxBody.innerHTML = list.map(x=>`
    <tr>
      <td>${x.date}</td>
      <td>${escapeHtml(map.get(x.assetId) || "—")}</td>
      <td>${x.side==="buy" ? "Alım" : "Satım"}</td>
      <td class="right">${Number(x.qty||0)}</td>
      <td class="right">${formatUSD(x.priceUsd)}</td>
      <td class="right">${formatUSD(x.feeUsd||0)}</td>
      <td>${escapeHtml(x.note||"")}</td>
      <td class="right"><button type="button" class="secondary" data-txdel="${x.id}">Sil</button></td>
    </tr>
  `).join("");

  els.invTxBody.querySelectorAll("button[data-txdel]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.getAttribute("data-txdel");
      saveInvTx(loadInvTx().filter(t=>t.id!==id));
      renderAll();
    });
  });

  if(els.invBuySum) els.invBuySum.textContent = formatUSD(buySum);
  if(els.invSellSum) els.invSellSum.textContent = formatUSD(sellSum);
  if(els.invNetFlow) els.invNetFlow.textContent = formatUSD(buySum - sellSum);
}

function renderInvPerfChart(){
  // Uses NetWorth history investment field; if missing, derives from snapshot.
  const hist = loadNetWorthHistory();
  const pts = hist.map(x=>({ label:x.month, value:Number(x.invNow||0) }));
  drawLineChart(els.invValueChart, pts);
}

// ===== Notes =====
function loadNotes(){ return loadJSON(NOTES_KEY, []); }
function saveNotes(list){ saveJSON(NOTES_KEY, list); }
function getNote(month){
  return loadNotes().find(n=>n.month===month) || null;
}
function upsertNote(month, text){
  const list = loadNotes();
  const idx = list.findIndex(n=>n.month===month);
  const item = { month, text, updatedAt: new Date().toISOString() };
  if(idx>=0) list[idx]=item; else list.push(item);
  list.sort((a,b)=>a.month.localeCompare(b.month));
  saveNotes(list);
}
function deleteNote(month){
  saveNotes(loadNotes().filter(n=>n.month!==month));
}

// ===== Export =====
function exportAll(){
  const payload = {
    exportedAt: new Date().toISOString(),
    currency: "USD",
    data: {
      summary: loadJSON(SUMMARY_KEY, null),
      networthHistory: loadJSON(NETWORTH_KEY, []),
      income: {
        recurringMaster: loadJSON(RI_MASTER_KEY, []),
        recurringMonth: loadJSON(RI_MONTH_KEY, []),
        extra: loadJSON(EXTRA_INCOME_KEY, [])
      },
      expense: {
        budgetMaster: loadJSON(BUDGET_MASTER_KEY, []),
        budgetMonth: loadJSON(BUDGET_MONTH_KEY, []),
        budgetExpenses: loadJSON(BUDGET_EXP_KEY, []),
        unexpected: loadJSON(UNEXP_EXP_KEY, [])
      },
      inventory: loadJSON(INVENTORY_KEY, []),
      investments: {
        assets: loadJSON(ASSETS_KEY, []),
        tx: loadJSON(INV_TX_KEY, [])
      },
      notes: loadJSON(NOTES_KEY, [])
    }
  };
  downloadJSON(`accounter_all_${todayISO()}.json`, payload);
}

function exportMonth(month){
  const payload = {
    exportedAt: new Date().toISOString(),
    currency: "USD",
    month,
    snapshot: {
      income: computeMonthlyIncome(month),
      expense: computeMonthlyExpense(month),
      investments: portfolioValueUSD()
    },
    data: {
      summary: loadJSON(SUMMARY_KEY, null),
      income: {
        recurringMonth: loadJSON(RI_MONTH_KEY, []).filter(x=>x.month===month),
        extra: loadJSON(EXTRA_INCOME_KEY, []).filter(x=>(x.date||"").startsWith(month))
      },
      expense: {
        budgetMonth: loadJSON(BUDGET_MONTH_KEY, []).filter(x=>x.month===month),
        budgetExpenses: loadJSON(BUDGET_EXP_KEY, []).filter(x=>x.month===month),
        unexpected: loadJSON(UNEXP_EXP_KEY, []).filter(x=>(x.date||"").startsWith(month))
      },
      inventory: loadJSON(INVENTORY_KEY, []), // inventory is current-state; still useful
      investments: {
        assets: loadJSON(ASSETS_KEY, []),
        tx: loadJSON(INV_TX_KEY, []).filter(x=>x.month===month)
      },
      note: getNote(month)
    }
  };
  downloadJSON(`accounter_${month}_${todayISO()}.json`, payload);
}

// ===== Render all =====
function renderAll(){
  renderDashboard();

  renderRIMasterTable();
  renderExtraIncome();
  renderIncomeCalendar();
  renderBudgets();
  renderBudgetExpenseList();
  renderUnexpected();
  renderNetPanel();

  renderInventory();

  renderInvAssetSelect();
  renderPortfolio();
  renderInvTx();
  renderInvPerfChart();

  renderNotesUI();
}

function renderBudgetExpenseList(){
  if(!els.beBody) return;
  const month = els.activeMonth?.value || monthKey(new Date());
  const masterMap = new Map(loadBudgetMaster().map(m=>[m.id,m.name]));
  const list = budgetExpensesForMonth(month).sort((a,b)=>(a.date < b.date ? 1 : -1));

  els.beBody.innerHTML = list.map(x=>`
    <tr>
      <td>${x.date}</td>
      <td>${escapeHtml(masterMap.get(x.budgetId) || "—")}</td>
      <td class="right">${formatUSD(x.amount)}</td>
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

function renderNotesUI(){
  if(!els.notesMonth || !els.notesText) return;
  const month = els.notesMonth.value || monthKey(new Date());
  const n = getNote(month);
  els.notesText.value = n?.text || "";
}

// ===== Init =====
function init(){
  initTabs();
  initSubTabs(els.subtabs, els.subpages);
  initSubTabs(els.invSubtabs, els.invSubpages);

  // defaults
  const m = monthKey(new Date());
  if(els.activeMonth) els.activeMonth.value = m;
  if(els.invMonth) els.invMonth.value = m;
  if(els.notesMonth) els.notesMonth.value = m;

  if(els.eiDate) els.eiDate.value = todayISO();
  if(els.beDate) els.beDate.value = todayISO();
  if(els.ueDate) els.ueDate.value = todayISO();
  if(els.invTxDate) els.invTxDate.value = todayISO();

  // month changes
  els.activeMonth?.addEventListener("input", ()=>{ selectedDay=null; renderAll(); });
  els.invMonth?.addEventListener("input", ()=>{ renderAll(); });
  els.notesMonth?.addEventListener("input", ()=>{ renderNotesUI(); });

  // summary save (also snapshot networth)
  els.saveSummary?.addEventListener("click", ()=>{
    const cashNow = Number(els.cashInput?.value||0);
    saveSummary({ cashNow });

    const { totalValue } = portfolioValueUSD();
    upsertNetWorthHistory(monthKey(new Date()), cashNow, totalValue);
    renderAll();
  });

  // income add
  els.riForm?.addEventListener("submit",(e)=>{
    e.preventDefault();
    const name = els.riName.value.trim();
    const amount = Number(els.riAmount.value||0);
    const day = Number(els.riDay.value||1);
    const active = !!els.riActive.checked;
    if(!name) return alert("Gelir adı yaz.");
    if(amount<=0) return alert("Miktar 0'dan büyük olmalı.");
    if(day<1||day>31) return alert("Gün 1-31 olmalı.");

    const master = loadRIMaster();
    master.push({ id: uid(), name, defaultAmount: amount, day, active });
    saveRIMaster(master);

    els.riName.value="";
    els.riAmount.value="";
    els.riDay.value="5";
    els.riActive.checked=true;
    renderAll();
  });

  // extra income add
  els.eiForm?.addEventListener("submit",(e)=>{
    e.preventDefault();
    const date = els.eiDate.value;
    const amount = Number(els.eiAmount.value||0);
    const note = (els.eiNote?.value||"").trim();
    if(!date) return alert("Tarih gerekli.");
    if(amount<=0) return alert("Miktar 0'dan büyük olmalı.");

    const all = loadExtraIncome();
    all.push({ id: uid(), date, amount, note });
    saveExtraIncome(all);

    els.eiAmount.value="";
    if(els.eiNote) els.eiNote.value="";
    renderAll();
  });

  // budget master add
  els.bmForm?.addEventListener("submit",(e)=>{
    e.preventDefault();
    const name = els.bmName.value.trim();
    const budget = Number(els.bmBudget.value||0);
    const active = !!els.bmActive.checked;
    if(!name) return alert("Kategori yaz.");
    if(budget<0) return alert("Bütçe negatif olamaz.");

    const master = loadBudgetMaster();
    master.push({ id: uid(), name, defaultBudget: budget, active });
    saveBudgetMaster(master);

    els.bmName.value="";
    els.bmBudget.value="";
    els.bmActive.checked=true;
    renderAll();
  });

  // budget expense add
  els.beForm?.addEventListener("submit",(e)=>{
    e.preventDefault();
    const month = els.activeMonth?.value || monthKey(new Date());
    const budgetId = els.beBudgetId?.value;
    const date = els.beDate?.value;
    const amount = Number(els.beAmount?.value||0);
    const note = (els.beNote?.value||"").trim();
    if(!budgetId) return alert("Kategori seç.");
    if(!date) return alert("Tarih gerekli.");
    if(amount<=0) return alert("Miktar 0'dan büyük olmalı.");

    const list = loadBudgetExpenses();
    list.push({ id: uid(), month, budgetId, date, amount, note });
    saveBudgetExpenses(list);

    if(els.beAmount) els.beAmount.value="";
    if(els.beNote) els.beNote.value="";
    renderAll();
  });

  // unexpected add
  els.ueForm?.addEventListener("submit",(e)=>{
    e.preventDefault();
    const date = els.ueDate?.value;
    const amount = Number(els.ueAmount?.value||0);
    const note = (els.ueNote?.value||"").trim();
    if(!date) return alert("Tarih gerekli.");
    if(amount<=0) return alert("Miktar 0'dan büyük olmalı.");

    const list = loadUnexpected();
    list.push({ id: uid(), date, amount, note });
    saveUnexpected(list);

    if(els.ueAmount) els.ueAmount.value="";
    if(els.ueNote) els.ueNote.value="";
    renderAll();
  });

  // inventory add
  els.invForm?.addEventListener("submit",(e)=>{
    e.preventDefault();
    const item = {
      id: uid(),
      name: els.invName.value.trim(),
      qty: Number(els.invQty.value||0),
      unit: els.invUnit.value,
      low: Number(els.invLow.value||0),
      dailyUse: Number(els.invDaily?.value||0),
      price: Number(els.invPrice?.value||0),
      priceUnit: els.invPriceUnit?.value || els.invUnit.value
    };
    if(!item.name) return;
    const list = loadInventory();
    list.push(item);
    saveInventory(list);

    els.invName.value="";
    els.invQty.value="";
    if(els.invDaily) els.invDaily.value="";
    if(els.invPrice) els.invPrice.value="";
    renderAll();
  });

  // investments: add asset
  els.assetForm?.addEventListener("submit",(e)=>{
    e.preventDefault();
    const symbol = els.assetSymbol.value.trim().toUpperCase();
    const name = (els.assetName?.value||"").trim();
    const category = els.assetCategory.value;
    if(!symbol) return alert("Sembol gerekli.");

    const assets = loadAssets();
    if(assets.some(a=>a.symbol===symbol)) return alert("Bu sembol zaten var.");
    assets.push({ id: uid(), symbol, name, category, priceUsd: 0 });
    saveAssets(assets);

    els.assetSymbol.value="";
    if(els.assetName) els.assetName.value="";
    renderAll();
  });

  // investments: add tx
  els.invTxForm?.addEventListener("submit",(e)=>{
    e.preventDefault();
    const date = els.invTxDate.value;
    const month = (els.invMonth?.value || monthKey(new Date()));
    const assetId = els.invTxAsset.value;
    const side = els.invTxSide.value;
    const qty = Number(els.invTxQty.value||0);
    const priceUsd = Number(els.invTxPrice.value||0);
    const feeUsd = Number(els.invTxFee?.value||0);
    const note = (els.invTxNote?.value||"").trim();

    if(!date) return alert("Tarih gerekli.");
    if(!assetId) return alert("Varlık seç.");
    if(qty<=0) return alert("Miktar 0'dan büyük olmalı.");
    if(priceUsd<=0) return alert("Fiyat 0'dan büyük olmalı.");

    const tx = loadInvTx();
    tx.push({ id: uid(), date, month, assetId, side, qty, priceUsd, feeUsd, note });
    saveInvTx(tx);

    els.invTxQty.value="";
    els.invTxPrice.value="";
    if(els.invTxFee) els.invTxFee.value="";
    if(els.invTxNote) els.invTxNote.value="";
    renderAll();
  });

  // notes save/clear
  els.saveNotes?.addEventListener("click", ()=>{
    const month = els.notesMonth?.value || monthKey(new Date());
    upsertNote(month, els.notesText?.value || "");
    renderNotesUI();
    alert("Not kaydedildi.");
  });
  els.clearNotes?.addEventListener("click", ()=>{
    const month = els.notesMonth?.value || monthKey(new Date());
    if(!confirm("Bu ayın notunu silmek istiyor musun?")) return;
    deleteNote(month);
    renderNotesUI();
  });

  // export buttons
  els.exportMonthBtn?.addEventListener("click", ()=>{
    const month = els.notesMonth?.value || monthKey(new Date());
    exportMonth(month);
  });
  els.exportAllBtn?.addEventListener("click", ()=>{
    exportAll();
  });

  renderAll();
}

init();
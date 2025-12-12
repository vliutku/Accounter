// ====== Accounter v0.31 (LocalStorage) ======

const SUMMARY_KEY = "summary.v1";
const NETWORTH_KEY = "networth.history.v1";

const RI_MASTER_KEY = "ri.master.v1";     // recurring income master list
const RI_MONTH_KEY  = "ri.month.v1";      // monthly instances (per month)

const EXTRA_INCOME_KEY = "income.extra.v1"; // [{id,date,amount,note}]

const INVENTORY_KEY = "inventory.v1";

const els = {
  // top tabs
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

  // income recurring form
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
  const x = Number(n || 0);
  return x.toLocaleString("tr-TR", { style: "currency", currency: "TRY" });
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

// ====== Storage helpers ======
function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const v = JSON.parse(raw);
    return v ?? fallback;
  } catch { return fallback; }
}
function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ====== Dashboard data ======
function loadSummary() {
  return loadJSON(SUMMARY_KEY, { cashNow: 0, invNow: 0 });
}
function saveSummary(s) {
  saveJSON(SUMMARY_KEY, s);
}

function loadNetWorthHistory() {
  return loadJSON(NETWORTH_KEY, []); // [{month:"YYYY-MM", cashNow, invNow, netWorth}]
}
function upsertNetWorthHistory(month, cashNow, invNow) {
  const list = loadNetWorthHistory();
  const netWorth = (Number(cashNow)||0) + (Number(invNow)||0);
  const idx = list.findIndex(x => x.month === month);
  const item = { month, cashNow, invNow, netWorth };
  if (idx >= 0) list[idx] = item;
  else list.push(item);
  list.sort((a,b)=>a.month.localeCompare(b.month));
  saveJSON(NETWORTH_KEY, list);
}

// ====== Extra Income ======
function loadExtraIncome() {
  return loadJSON(EXTRA_INCOME_KEY, []);
}
function saveExtraIncome(list) {
  saveJSON(EXTRA_INCOME_KEY, list);
}
function extraIncomeForMonth(month) {
  const all = loadExtraIncome();
  return all.filter(x => (x.date || "").startsWith(month));
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
      const all = loadExtraIncome().filter(x => x.id !== id);
      saveExtraIncome(all);
      renderAll();
    });
  });
}

// ====== Recurring Income (Master + Monthly Instances) ======
// Master: [{id,name,defaultAmount,day,active}]
function loadRIMaster() {
  return loadJSON(RI_MASTER_KEY, []);
}
function saveRIMaster(list) {
  saveJSON(RI_MASTER_KEY, list);
}

// Month instances: [{id,masterId,month,name,amount,day,status,skipped,type:"income"}]
function loadRIMonth() {
  return loadJSON(RI_MONTH_KEY, []);
}
function saveRIMonth(list) {
  saveJSON(RI_MONTH_KEY, list);
}

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
        status: "pending", // pending | received | missed
        skipped: false,
        type: "income"
      });
    }
  }

  saveRIMonth(inst);
}

function getMonthInstance(masterId, month) {
  const inst = loadRIMonth();
  return inst.find(x => x.masterId === masterId && x.month === month) || null;
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

// Dashboard monthly income: received recurring + extra
function computeMonthlyIncomeFor(month) {
  const inst = loadRIMonth();
  const items = inst.filter(x => x.month === month && x.type === "income" && x.skipped !== true);
  let total = 0;
  for (const it of items) {
    if (it.status === "received") total += Number(it.amount || 0);
  }

  const extra = extraIncomeForMonth(month).reduce((s,x)=> s + Number(x.amount||0), 0);
  return total + extra;
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

// ====== Income UI render ======
let selectedDay = null; // "YYYY-MM-DD"

function renderRIMasterTable() {
  const month = els.activeMonth.value || monthKey(new Date());
  ensureMonthInstances(month);

  const master = loadRIMaster();
  const inst = loadRIMonth();

  master.sort((a,b)=>a.name.localeCompare(b.name,"tr"));

  if (!els.riBody) return;

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
          <div class="muted small">Bu ay miktarı: değiştirip dışarı tıklayınca kaydeder.</div>
        </td>
        <td></td>
      </tr>
    `;
  }).join("");

  els.riBody.querySelectorAll("button[data-toggle]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-toggle");
      let master = loadRIMaster();
      master = master.map(x => x.id === id ? { ...x, active: !x.active } : x);
      saveRIMaster(master);
      ensureMonthInstances(month);
      renderAll();
    });
  });

  els.riBody.querySelectorAll("button[data-pause]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-pause");
      const mi = getMonthInstance(id, month);
      const next = !(mi?.skipped === true);
      setMonthInstancePatch(id, month, { skipped: next });
      renderAll();
    });
  });

  els.riBody.querySelectorAll("button[data-del]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-del");
      const ok = confirm("Bu sürekli geliri tamamen silmek istiyor musun?");
      if (!ok) return;
      let master = loadRIMaster().filter(x => x.id !== id);
      saveRIMaster(master);
      let inst = loadRIMonth().filter(x => x.masterId !== id);
      saveRIMonth(inst);
      renderAll();
    });
  });

  els.riBody.querySelectorAll("input[data-ovr]").forEach(inp => {
    inp.addEventListener("change", () => {
      const id = inp.getAttribute("data-ovr");
      const val = Number(inp.value || 0);
      setMonthInstancePatch(id, month, { amount: val });
      renderAll();
    });
  });
}

function renderIncomeCalendar() {
  const month = els.activeMonth.value || monthKey(new Date());
  ensureMonthInstances(month);

  const [yyyy, mm] = month.split("-").map(Number);
  const dim = daysInMonth(yyyy, mm);
  const firstDow = new Date(yyyy, mm - 1, 1).getDay(); // 0 Sun ... 6 Sat
  const offset = (firstDow + 6) % 7; // Pazartesi başlangıç için shift

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
    if (list.length === 0) state = "pending";
    else {
      let hasMissed = false, hasPending = false, allReceived = true;
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

    const badge = list.length === 0 ? "" : (
      state === "ok" ? "🟢" : (state === "bad" ? "🔴" : "⚪")
    );

    cells.push({ empty:false, day:d, state, badge, count:list.length });
  }

  if (!els.incomeCal) return;

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
      const dd = String(d).padStart(2, "0");
      selectedDay = `${month}-${dd}`;
      renderSelectedDayDetails();
    });
  });

  const t = todayISO();
  if (!selectedDay || !selectedDay.startsWith(month)) {
    if (t.startsWith(month)) selectedDay = t;
    else selectedDay = `${month}-01`;
  }
  renderSelectedDayDetails();
}

function renderSelectedDayDetails() {
  const month = els.activeMonth.value || monthKey(new Date());
  const inst = loadRIMonth().filter(x => x.month === month && x.type === "income" && !x.skipped);

  if (!els.selectedDayLabel || !els.dayDetails) return;

  if (!selectedDay) {
    els.selectedDayLabel.textContent = "—";
    els.dayDetails.textContent = "Takvimden bir gün seç.";
    return;
  }

  els.selectedDayLabel.textContent = selectedDay;

  const day = Number(selectedDay.slice(-2));
  const due = inst.filter(x => Number(x.day) === day);

  if (due.length === 0) {
    els.dayDetails.innerHTML = `<div class="muted">Bu güne tanımlı sürekli gelir yok.</div>`;
    return;
  }

  const rows = due.map(it => {
    const st = autoStatusFor(it, month);
    const color = st === "received" ? "🟢" : (st === "missed" ? "🔴" : "⚪");
    return `
      <div class="row" style="justify-content:space-between; margin:8px 0;">
        <div>
          <div><strong>${escapeHtml(it.name)}</strong> — ${formatTRY(it.amount)}</div>
          <div class="muted small">Durum: ${color} ${st}</div>
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

  els.dayDetails.innerHTML = rows;

  els.dayDetails.querySelectorAll("button[data-setst]").forEach(btn => {
    btn.addEventListener("click", () => {
      const masterId = btn.getAttribute("data-setst");
      const st = btn.getAttribute("data-st");
      setMonthInstancePatch(masterId, month, { status: st });
      renderAll();
    });
  });
}

// ====== Dashboard render + chart ======
function renderDashboard() {
  const s = loadSummary();

  if (els.cashNow) els.cashNow.textContent = formatTRY(s.cashNow);
  if (els.invNow) els.invNow.textContent = formatTRY(s.invNow);
  if (els.netWorth) els.netWorth.textContent = formatTRY((Number(s.cashNow)||0) + (Number(s.invNow)||0));

  const mk = monthKey(new Date());
  const income = computeMonthlyIncomeFor(mk);
  const expense = 0; // gider sonraki adım
  if (els.mIncome) els.mIncome.textContent = formatTRY(income);
  if (els.mExpense) els.mExpense.textContent = formatTRY(expense);
  if (els.mNet) els.mNet.textContent = formatTRY(income - expense);

  if (els.cashInput) els.cashInput.value = s.cashNow ?? 0;
  if (els.invInput) els.invInput.value = s.invNow ?? 0;

  drawNetWorthChart();
}

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

  function xPos(i){ return left + (i*(right-left))/(n-1); }
  function yPos(v){ return bottom - ((v - minV) * (bottom-top))/span; }

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
    if (i===0) ctx.moveTo(x,y);
    else ctx.lineTo(x,y);
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

  ctx.fillStyle = "rgba(255,255,255,.65)";
  ctx.font = "11px system-ui";
  ctx.fillText(data[0].month, left, top + 10);
  ctx.fillText(data[n-1].month, right - 54, top + 10);
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
  renderInventory();
}

// ====== Init ======
function init() {
  initTabs();
  initSubTabs();

  if (els.activeMonth) els.activeMonth.value = monthKey(new Date());
  els.activeMonth?.addEventListener("input", () => {
    selectedDay = null;
    renderAll();
  });

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
    master.push({
      id: uid(),
      name,
      defaultAmount: amount,
      day,
      active
    });
    saveRIMaster(master);

    els.riName.value = "";
    els.riAmount.value = "";
    els.riDay.value = "5";
    els.riActive.checked = true;

    renderAll();
  });

  // extra income add
  if (els.eiDate) els.eiDate.value = todayISO();
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

    if (els.eiAmount) els.eiAmount.value = "";
    if (els.eiNote) els.eiNote.value = "";

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

  // first render
  renderAll();
}

init();
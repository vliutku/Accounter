// ====== Accounter v0.2 (LocalStorage) ======

const STORAGE_KEY = "tx.v1";
const SUMMARY_KEY = "summary.v1";
const INVENTORY_KEY = "inventory.v1";

const DEFAULT_CATEGORIES = {
  income: ["Maaş", "Burs", "Harçlık", "Freelance", "Yatırım Geliri", "Diğer"],
  expense: ["Kira", "Fatura", "Market", "Ulaşım", "Sağlık", "Eğlence", "Eğitim", "Diğer"]
};

const els = {
  // transactions
  form: document.getElementById("txForm"),
  type: document.getElementById("type"),
  amount: document.getElementById("amount"),
  category: document.getElementById("category"),
  date: document.getElementById("date"),
  note: document.getElementById("note"),
  month: document.getElementById("month"),
  filterCategory: document.getElementById("filterCategory"),
  q: document.getElementById("q"),
  clearFilters: document.getElementById("clearFilters"),
  tbody: document.getElementById("tbody"),
  countInfo: document.getElementById("countInfo"),
  exportBtn: document.getElementById("exportBtn"),
  seedBtn: document.getElementById("seedBtn"),
  resetBtn: document.getElementById("resetBtn"),

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

  // inventory
  invForm: document.getElementById("invForm"),
  invName: document.getElementById("invName"),
  invQty: document.getElementById("invQty"),
  invUnit: document.getElementById("invUnit"),
  invLow: document.getElementById("invLow"),
  invBody: document.getElementById("invBody"),
};

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

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);
}

// ====== Transactions storage ======
function loadTx() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
function saveTx(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

let tx = loadTx();

function setCategoryOptions() {
  const t = els.type.value;
  const cats = DEFAULT_CATEGORIES[t];

  els.category.innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join("");

  const allCats = Array.from(new Set([...DEFAULT_CATEGORIES.income, ...DEFAULT_CATEGORIES.expense]))
    .sort((a,b)=>a.localeCompare(b,"tr"));

  els.filterCategory.innerHTML = [
    `<option value="all">Hepsi</option>`,
    ...allCats.map(c => `<option value="${c}">${c}</option>`)
  ].join("");
}

function applyFilters(list) {
  let out = [...list];

  const m = els.month.value?.trim();
  if (m) out = out.filter(x => x.date.startsWith(m));

  const fc = els.filterCategory.value;
  if (fc && fc !== "all") out = out.filter(x => x.category === fc);

  const q = els.q.value.trim().toLowerCase();
  if (q) out = out.filter(x => (x.note || "").toLowerCase().includes(q));

  out.sort((a,b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return out;
}

function addTx({ type, amount, category, date, note }) {
  const item = {
    id: uid(),
    type,
    amount: Number(amount),
    category,
    date,
    note: note?.trim() || "",
    createdAt: Date.now()
  };
  tx.push(item);
  saveTx(tx);
}

function computeMonthly(list, yyyyMM) {
  let income = 0, expense = 0;
  for (const x of list) {
    if (!x.date?.startsWith(yyyyMM)) continue;
    const amt = Number(x.amount) || 0;
    if (x.type === "income") income += amt;
    else expense += amt;
  }
  return { income, expense, net: income - expense };
}

function renderTransactions() {
  const filtered = applyFilters(tx);
  els.countInfo.textContent = `${filtered.length} kayıt`;

  els.tbody.innerHTML = filtered.map(x => {
    const sign = x.type === "income" ? "+" : "-";
    return `
      <tr>
        <td>${x.date}</td>
        <td>${x.type === "income" ? "Gelir" : "Gider"}</td>
        <td>${x.category}</td>
        <td class="right">${sign} ${formatTRY(x.amount)}</td>
        <td>${escapeHtml(x.note || "")}</td>
        <td class="right">
          <button class="secondary" data-del="${x.id}">Sil</button>
        </td>
      </tr>
    `;
  }).join("");

  els.tbody.querySelectorAll("button[data-del]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-del");
      tx = tx.filter(x => x.id !== id);
      saveTx(tx);
      renderAll();
    });
  });
}

function toCSV(list) {
  const header = ["date","type","category","amount","note"];
  const lines = [header.join(",")];

  for (const x of list) {
    const row = [
      x.date,
      x.type,
      x.category,
      String(Number(x.amount || 0)),
      `"${String(x.note||"").replaceAll('"','""')}"`
    ];
    lines.push(row.join(","));
  }
  return lines.join("\n");
}

function download(filename, text) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ====== Dashboard storage ======
function loadSummary() {
  try {
    return JSON.parse(localStorage.getItem(SUMMARY_KEY)) || { cashNow: 0, invNow: 0 };
  } catch {
    return { cashNow: 0, invNow: 0 };
  }
}
function saveSummary(s) {
  localStorage.setItem(SUMMARY_KEY, JSON.stringify(s));
}

function renderDashboard() {
  const s = loadSummary();

  els.cashNow.textContent = formatTRY(s.cashNow);
  els.invNow.textContent = formatTRY(s.invNow);
  els.netWorth.textContent = formatTRY((Number(s.cashNow)||0) + (Number(s.invNow)||0));

  const mk = monthKey(new Date());
  const m = computeMonthly(tx, mk);
  els.mIncome.textContent = formatTRY(m.income);
  els.mExpense.textContent = formatTRY(m.expense);
  els.mNet.textContent = formatTRY(m.net);

  els.cashInput.value = s.cashNow ?? 0;
  els.invInput.value = s.invNow ?? 0;
}

// ====== Inventory storage ======
function loadInventory() {
  try { return JSON.parse(localStorage.getItem(INVENTORY_KEY)) || []; }
  catch { return []; }
}
function saveInventory(list) {
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(list));
}
let inventory = loadInventory();

function renderInventory() {
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

// ====== Tabs ======
function initTabs() {
  document.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const tab = btn.getAttribute("data-tab");
      document.querySelectorAll(".tabPage").forEach(sec => sec.classList.add("hidden"));
      document.getElementById(`tab-${tab}`).classList.remove("hidden");
    });
  });
}

// ====== Render all ======
function renderAll() {
  renderDashboard();
  renderTransactions();
  renderInventory();
}

// ====== Wire events ======
function init() {
  // Güvenlik: eksik element varsa çökme
if (!els.form || !els.tbody) {
  console.warn("Gelir-Gider bölümü henüz tam değil");
}
  // defaults
  if (els.date) els.date.value = todayISO();
  setCategoryOptions();
  initTabs();

  // tx form
  els.type.addEventListener("change", setCategoryOptions);

  els.form.addEventListener("submit", (e) => {
    e.preventDefault();

    const type = els.type.value;
    const amount = els.amount.value;
    const category = els.category.value;
    const date = els.date.value;
    const note = els.note.value;

    if (!amount || Number(amount) <= 0) {
      alert("Tutar 0'dan büyük olmalı.");
      return;
    }
    if (!date) {
      alert("Tarih gerekli.");
      return;
    }

    addTx({ type, amount, category, date, note });

    els.amount.value = "";
    els.note.value = "";
    els.amount.focus();

    renderAll();
  });

  [els.month, els.filterCategory, els.q].forEach(el => {
    el.addEventListener("input", renderTransactions);
  });

  els.clearFilters.addEventListener("click", () => {
    els.month.value = "";
    els.filterCategory.value = "all";
    els.q.value = "";
    renderTransactions();
  });

  els.exportBtn.addEventListener("click", () => {
    const filtered = applyFilters(tx);
    const csv = toCSV(filtered);
    const stamp = new Date().toISOString().slice(0,10);
    download(`gelir-gider-${stamp}.csv`, csv);
  });

  els.seedBtn.addEventListener("click", () => {
    const base = todayISO().slice(0,7);
    const samples = [
      { type:"income", amount: 15000, category:"Harçlık", date:`${base}-01`, note:"Aile" },
      { type:"expense", amount: 4200, category:"Kira", date:`${base}-03`, note:"Ev" },
      { type:"expense", amount: 950, category:"Market", date:`${base}-05`, note:"Protein + sebze" },
      { type:"expense", amount: 380, category:"Ulaşım", date:`${base}-07`, note:"Otobüs" },
      { type:"income", amount: 750, category:"Yatırım Geliri", date:`${base}-10`, note:"Faiz/PPF" },
    ];
    for (const s of samples) addTx(s);
    renderAll();
  });

  els.resetBtn.addEventListener("click", () => {
    const ok = confirm("Tüm gelir-gider kayıtları silinecek. Emin misin?");
    if (!ok) return;
    tx = [];
    saveTx(tx);
    renderAll();
  });

  // dashboard
  els.saveSummary.addEventListener("click", () => {
    const cashNow = Number(els.cashInput.value || 0);
    const invNow = Number(els.invInput.value || 0);
    saveSummary({ cashNow, invNow });
    renderDashboard();
  });

  // inventory
  els.invForm.addEventListener("submit", (e) => {
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
    els.invName.focus();

    renderInventory();
  });

  // first render
  renderAll();
}

init();
// ====== Basit Gelir-Gider App (LocalStorage) ======

const STORAGE_KEY = "tx.v1";

const DEFAULT_CATEGORIES = {
  income: ["Maaş", "Burs", "Harçlık", "Freelance", "Yatırım Geliri", "Diğer"],
  expense: ["Kira", "Fatura", "Market", "Ulaşım", "Sağlık", "Eğlence", "Eğitim", "Diğer"]
};

const els = {
  form: document.getElementById("txForm"),
  type: document.getElementById("type"),
  amount: document.getElementById("amount"),
  category: document.getElementById("category"),
  date: document.getElementById("date"),
  note: document.getElementById("note"),

  sumIncome: document.getElementById("sumIncome"),
  sumExpense: document.getElementById("sumExpense"),
  sumNet: document.getElementById("sumNet"),

  month: document.getElementById("month"),
  filterCategory: document.getElementById("filterCategory"),
  q: document.getElementById("q"),
  clearFilters: document.getElementById("clearFilters"),

  tbody: document.getElementById("tbody"),
  countInfo: document.getElementById("countInfo"),

  exportBtn: document.getElementById("exportBtn"),
  seedBtn: document.getElementById("seedBtn"),
  resetBtn: document.getElementById("resetBtn"),
};

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatTRY(n) {
  const x = Number(n || 0);
  return x.toLocaleString("tr-TR", { style: "currency", currency: "TRY" });
}

function loadTx() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data;
  } catch {
    return [];
  }
}

function saveTx(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);
}

let tx = loadTx();

function setCategoryOptions() {
  const t = els.type.value;
  const cats = DEFAULT_CATEGORIES[t];

  els.category.innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join("");

  // filter kategorileri: income + expense birleşik
  const allCats = Array.from(new Set([...DEFAULT_CATEGORIES.income, ...DEFAULT_CATEGORIES.expense])).sort((a,b)=>a.localeCompare(b,"tr"));
  els.filterCategory.innerHTML = [
    `<option value="all">Hepsi</option>`,
    ...allCats.map(c => `<option value="${c}">${c}</option>`)
  ].join("");
}

function applyFilters(list) {
  let out = [...list];

  // Ay filtresi (YYYY-MM)
  const m = els.month.value?.trim();
  if (m) out = out.filter(x => x.date.startsWith(m));

  // Kategori filtresi
  const fc = els.filterCategory.value;
  if (fc && fc !== "all") out = out.filter(x => x.category === fc);

  // Not araması
  const q = els.q.value.trim().toLowerCase();
  if (q) out = out.filter(x => (x.note || "").toLowerCase().includes(q));

  // Tarihe göre (desc)
  out.sort((a,b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return out;
}

function computeSummary(list) {
  let income = 0, expense = 0;
  for (const x of list) {
    const amt = Number(x.amount) || 0;
    if (x.type === "income") income += amt;
    else expense += amt;
  }
  const net = income - expense;
  return { income, expense, net };
}

function render() {
  const filtered = applyFilters(tx);
  const s = computeSummary(filtered);

  els.sumIncome.textContent = formatTRY(s.income);
  els.sumExpense.textContent = formatTRY(s.expense);
  els.sumNet.textContent = formatTRY(s.net);

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

  // Sil butonları
  els.tbody.querySelectorAll("button[data-del]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-del");
      tx = tx.filter(x => x.id !== id);
      saveTx(tx);
      render();
    });
  });
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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

// ====== Event wiring ======

els.date.value = todayISO();
setCategoryOptions();
render();

els.type.addEventListener("change", () => {
  setCategoryOptions();
});

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

  // hızlı giriş için
  els.amount.value = "";
  els.note.value = "";
  els.amount.focus();

  render();
});

[els.month, els.filterCategory, els.q].forEach(el => {
  el.addEventListener("input", render);
});

els.clearFilters.addEventListener("click", () => {
  els.month.value = "";
  els.filterCategory.value = "all";
  els.q.value = "";
  render();
});

els.exportBtn.addEventListener("click", () => {
  const filtered = applyFilters(tx);
  const csv = toCSV(filtered);
  const stamp = new Date().toISOString().slice(0,10);
  download(`gelir-gider-${stamp}.csv`, csv);
});

els.seedBtn.addEventListener("click", () => {
  const base = todayISO().slice(0,7); // YYYY-MM
  const samples = [
    { type:"income", amount: 15000, category:"Harçlık", date:`${base}-01`, note:"Aile" },
    { type:"expense", amount: 4200, category:"Kira", date:`${base}-03`, note:"Ev" },
    { type:"expense", amount: 950, category:"Market", date:`${base}-05`, note:"Protein + sebze" },
    { type:"expense", amount: 380, category:"Ulaşım", date:`${base}-07`, note:"Otobüs" },
    { type:"income", amount: 750, category:"Yatırım Geliri", date:`${base}-10`, note:"Faiz/PPF" },
  ];
  for (const s of samples) addTx(s);
  render();
});

els.resetBtn.addEventListener("click", () => {
  const ok = confirm("Tüm kayıtlar silinecek. Emin misin?");
  if (!ok) return;
  tx = [];
  saveTx(tx);
  render();
});

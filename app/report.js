const report = JSON.parse(
  sessionStorage.getItem("btk.dailyReport.v1") || localStorage.getItem("btk.dailyReport.v1") || "null"
);

function decimal(value) {
  return Number(value || 0).toLocaleString("sv-SE", { maximumFractionDigits: 1 });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function css() {
  return `
    :root { color-scheme: light; --ink: #26342b; --muted: #667166; --line: #d9decd; --leaf: #2f6f4e; --paper: #fffdf7; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #f7f2e8; color: var(--ink); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.45; }
    main { width: min(980px, calc(100% - 32px)); margin: 28px auto; background: var(--paper); border: 1px solid var(--line); border-radius: 14px; padding: 24px; }
    header { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; border-bottom: 1px solid var(--line); padding-bottom: 18px; margin-bottom: 20px; }
    h1 { margin: 0; font-size: 1.8rem; }
    h2 { margin: 24px 0 10px; font-size: 1.15rem; }
    .meta { margin: 6px 0 0; color: var(--muted); }
    button { border: 0; border-radius: 8px; background: var(--leaf); color: white; padding: 10px 14px; font-weight: 700; cursor: pointer; }
    .summary { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; }
    .summary div { border: 1px solid var(--line); border-radius: 10px; padding: 12px; background: #fbfaf3; }
    .summary span { display: block; color: var(--muted); font-size: .82rem; }
    .summary strong { display: block; margin-top: 4px; font-size: 1rem; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border-bottom: 1px solid var(--line); padding: 10px 8px; text-align: left; vertical-align: top; }
    thead th, tfoot th, tfoot td { font-weight: 700; background: #f2f0e7; }
    tbody th { width: 140px; }
    td:nth-child(n+3), th:nth-child(n+3) { text-align: right; white-space: nowrap; }
    .weekly-table { table-layout: fixed; }
    .weekly-table col:first-child { width: 28%; }
    .weekly-table col:nth-child(2) { width: 13%; }
    .weekly-table col:nth-child(n+3) { width: 14.75%; }
    .weekly-table .num { text-align: right; white-space: nowrap; }
    .weekly-table .summary-label { text-align: left; }
    .note, .empty { color: var(--muted); font-size: .9rem; margin-top: 14px; }
    @media (max-width: 720px) {
      main { width: min(100% - 20px, 980px); margin: 10px auto; padding: 16px; }
      header { display: block; }
      button { margin-top: 12px; width: 100%; }
      .summary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      table { font-size: .86rem; }
    }
    @media print {
      body { background: white; }
      main { width: 100%; margin: 0; border: 0; border-radius: 0; padding: 0; }
      button { display: none; }
    }`;
}

function render() {
  const style = document.createElement("style");
  style.textContent = css();
  document.head.append(style);

  const root = document.querySelector("#reportRoot");
  if (!report || !Array.isArray(report.rows)) {
    root.innerHTML = `<p class="empty">Ingen rapportdata hittades. Gå tillbaka till appen och tryck på rapportknappen igen.</p>`;
    return;
  }

  if (report.kind === "weekly") {
    renderWeekly(root);
    return;
  }

  renderDaily(root);
}

function renderDaily(root) {
  const { entry, rows, totals } = report;
  document.title = `Keto-rapport ${entry.date}`;
  const mealRows = rows
    .map(
      (row) => `
        <tr>
          <th scope="row">${escapeHtml(row.label)}</th>
          <td>${escapeHtml(row.text || "Ej angivet")}</td>
          <td>${decimal(row.fat)}</td>
          <td>${decimal(row.carbs)}</td>
          <td>${decimal(row.protein)}</td>
          <td>${Math.round(row.kcal || 0)}</td>
        </tr>`
    )
    .join("");

  root.innerHTML = `
    <header>
      <div>
        <h1>Keto-rapport ${escapeHtml(entry.date)}</h1>
        <p class="meta">Genererad ${escapeHtml(report.generatedAt || "")}</p>
      </div>
      <button type="button" id="printButton">Skriv ut / spara som PDF</button>
    </header>
    <section class="summary" aria-label="Dagens basdata">
      <div><span>Dagens vikt</span><strong>${entry.weight ? `${decimal(entry.weight)} kg` : "--"}</strong></div>
      <div><span>Sömn</span><strong>${escapeHtml(entry.sleep || "--")}</strong></div>
      <div><span>Vatten</span><strong>${escapeHtml(entry.water || "--")}</strong></div>
      <div><span>Kaffe</span><strong>${escapeHtml(entry.coffee || "--")}</strong></div>
      <div><span>Promenad</span><strong>${escapeHtml(entry.walk || "--")}</strong></div>
      <div><span>Blodsocker</span><strong>${entry.bloodGlucose ? `${decimal(entry.bloodGlucose)} mmol/L` : "--"}</strong></div>
      <div><span>Ketoner</span><strong>${entry.ketones ? `${decimal(entry.ketones)} mmol/L` : "--"}</strong></div>
    </section>
    <section>
      <h2>Måltider och makron</h2>
      <table>
        <thead>
          <tr>
            <th>Måltid</th>
            <th>Text</th>
            <th>Fett g</th>
            <th>Kolh. g</th>
            <th>Protein g</th>
            <th>kcal</th>
          </tr>
        </thead>
        <tbody>${mealRows}</tbody>
        <tfoot>
          <tr>
            <th scope="row" colspan="2">Summa uppskattat</th>
            <td>${decimal(totals?.fat)}</td>
            <td>${decimal(totals?.carbs)}</td>
            <td>${decimal(totals?.protein)}</td>
            <td>${Math.round(totals?.kcal || 0)}</td>
          </tr>
        </tfoot>
      </table>
      <p class="note">Makron är appens schablonberäkning utifrån den text som står i respektive måltidsfält.</p>
    </section>`;

  document.querySelector("#printButton").addEventListener("click", () => window.print());
}

function renderWeekly(root) {
  document.title = `Keto-veckorapport ${report.year}-v${String(report.week).padStart(2, "0")}`;
  const totals = report.totals || report.rows.reduce(
    (sum, row) => ({
      kcal: sum.kcal + (row.kcal || 0),
      fat: sum.fat + (row.fat || 0),
      carbs: sum.carbs + (row.carbs || 0),
      protein: sum.protein + (row.protein || 0),
    }),
    { kcal: 0, fat: 0, carbs: 0, protein: 0 }
  );
  const mealRows = report.rows
    .map(
      (row) => `
        <tr>
          <th scope="row">${escapeHtml(row.label)}</th>
          <td class="num">${row.count || 0}</td>
          <td class="num">${row.fat === null ? "--" : decimal(row.fat)}</td>
          <td class="num">${row.carbs === null ? "--" : decimal(row.carbs)}</td>
          <td class="num">${row.protein === null ? "--" : decimal(row.protein)}</td>
          <td class="num">${row.kcal === null ? "--" : Math.round(row.kcal || 0)}</td>
        </tr>`
    )
    .join("");

  root.innerHTML = `
    <header>
      <div>
        <h1>Keto-veckorapport v${String(report.week).padStart(2, "0")}, ${report.year}</h1>
        <p class="meta">${escapeHtml(report.range?.start || "")} till ${escapeHtml(report.range?.end || "")} · genererad ${escapeHtml(report.generatedAt || "")}</p>
      </div>
      <button type="button" id="printButton">Skriv ut / spara som PDF</button>
    </header>
    <section class="summary" aria-label="Veckans basdata">
      <div><span>Loggade dagar</span><strong>${report.days || 0}</strong></div>
      <div><span>Typvärde sömn</span><strong>${escapeHtml(report.sleepMode || "--")}</strong></div>
      <div><span>Typvärde promenad</span><strong>${escapeHtml(report.walkMode || "--")}</strong></div>
      <div><span>Vatten/dag</span><strong>${report.waterAverage === null ? "--" : `${decimal(report.waterAverage)} liter`}</strong></div>
      <div><span>Kaffe/dag</span><strong>${report.coffeeAverage === null ? "--" : `${decimal(report.coffeeAverage)} koppar`}</strong></div>
      <div><span>Blodsocker snitt</span><strong>${report.bloodGlucoseAverage === null ? "--" : `${decimal(report.bloodGlucoseAverage)} mmol/L`}</strong></div>
      <div><span>Ketoner snitt</span><strong>${report.ketonesAverage === null ? "--" : `${decimal(report.ketonesAverage)} mmol/L`}</strong></div>
    </section>
    <section>
      <h2>Medelvärde per måltid</h2>
      <table class="weekly-table">
        <colgroup>
          <col />
          <col />
          <col />
          <col />
          <col />
          <col />
        </colgroup>
        <thead>
          <tr>
            <th>Måltid</th>
            <th class="num">Antal</th>
            <th class="num">Fett g</th>
            <th class="num">Kolh. g</th>
            <th class="num">Protein g</th>
            <th class="num">kcal</th>
          </tr>
        </thead>
        <tbody>${mealRows}</tbody>
        <tfoot>
          <tr>
            <th class="summary-label" scope="row" colspan="2">Veckomedel för makro/kcal per dag</th>
            <td class="num">${decimal(totals.fat)}</td>
            <td class="num">${decimal(totals.carbs)}</td>
            <td class="num">${decimal(totals.protein)}</td>
            <td class="num">${Math.round(totals.kcal || 0)}</td>
          </tr>
        </tfoot>
      </table>
      <p class="note">Måltidsmedelvärden räknas på de dagar i veckan där respektive måltidsfält har text. Vatten och kaffe räknas som medel per dag där värde är angivet.</p>
    </section>`;

  document.querySelector("#printButton").addEventListener("click", () => window.print());
}

render();

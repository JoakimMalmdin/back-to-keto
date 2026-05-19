const storageKey = "btk.keto.entries.v1";
const goalKey = "btk.keto.goal.v1";
let activeDate = "";

const foodSignals = [
  { match: /ägg|agg/i, kcal: 70, protein: 6.2, fat: 5, carbs: 0.5, keto: 2 },
  { match: /makrill/i, kcal: 238, protein: 15, fat: 17.5, carbs: 4.9, keto: 2 },
  { match: /majonnäs|majonnas/i, kcal: 105, protein: 0, fat: 11.5, carbs: 0.2, keto: 2 },
  { match: /pulled pork/i, kcal: 375, protein: 34, fat: 25, carbs: 3, keto: 1 },
  { match: /falukorv/i, kcal: 260, protein: 10, fat: 23, carbs: 4, keto: 0 },
  { match: /gräddfil|graddfil/i, kcal: 70, protein: 1.5, fat: 6, carbs: 2, keto: 1 },
  { match: /yoghurt|yogurt/i, kcal: 90, protein: 5, fat: 4.5, carbs: 7, keto: -1 },
  { match: /bär|bar|jordgubb|hallon|blåbär/i, kcal: 25, protein: 0.4, fat: 0.2, carbs: 5.5, keto: -1 },
  { match: /tomat|tomatsås|tomatsas|ketchup/i, kcal: 20, protein: 0.7, fat: 0.1, carbs: 4, keto: -1 },
];

const form = document.querySelector("#entryForm");
const saveButton = document.querySelector("#saveButton");
const fields = {
  date: document.querySelector("#dateInput"),
  weight: document.querySelector("#weightInput"),
  sleep: document.querySelector("#sleepInput"),
  breakfast: document.querySelector("#breakfastInput"),
  lunch: document.querySelector("#lunchInput"),
  dinner: document.querySelector("#dinnerInput"),
  extras: document.querySelector("#extrasInput"),
  fat: document.querySelector("#fatInput"),
  protein: document.querySelector("#proteinInput"),
  carbs: document.querySelector("#carbsInput"),
  water: document.querySelector("#waterInput"),
  coffee: document.querySelector("#coffeeInput"),
  notes: document.querySelector("#notesInput"),
};
const goalInput = document.querySelector("#goalInput");

function decimal(value) {
  return Number(value).toLocaleString("sv-SE", { maximumFractionDigits: 1 });
}

function todayIso() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Stockholm" });
}

function emptyEntry(date = todayIso()) {
  return {
    date,
    weight: "",
    sleep: "",
    breakfast: "",
    lunch: "",
    dinner: "",
    extras: "",
    fat: "",
    protein: "",
    carbs: "",
    water: "",
    coffee: "",
    notes: "",
  };
}

function getEntries() {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return [emptyEntry()];
  try {
    const stored = JSON.parse(raw);
    return Array.isArray(stored) ? stored : [emptyEntry()];
  } catch {
    return [emptyEntry()];
  }
}

function saveEntries(entries) {
  localStorage.setItem(storageKey, JSON.stringify(entries));
}

function getGoalWeight() {
  const goal = Number(localStorage.getItem(goalKey));
  return Number.isFinite(goal) && goal > 0 ? goal : null;
}

function saveGoalWeight(value) {
  const goal = Number(value);
  if (Number.isFinite(goal) && goal > 0) {
    localStorage.setItem(goalKey, String(goal));
    return goal;
  }
  localStorage.removeItem(goalKey);
  return null;
}

function hasEntryContent(entry) {
  return Object.entries(entry).some(([key, value]) => key !== "date" && value !== "" && value !== null && value !== undefined);
}

function findEntry(date) {
  return getEntries().find((entry) => entry.date === date);
}

function baselineWeight(entries) {
  const firstWeightedEntry = entries.find((entry) => Number(entry.weight) > 0);
  return firstWeightedEntry ? Number(firstWeightedEntry.weight) : null;
}

function mealText(entry) {
  return [entry.breakfast, entry.lunch, entry.dinner, entry.extras, entry.notes].filter(Boolean).join(" ");
}

function estimateMacros(entry) {
  const manualFat = Number(entry.fat);
  const manualProtein = Number(entry.protein);
  const manualCarbs = Number(entry.carbs);
  const hasManualMacros = [manualFat, manualProtein, manualCarbs].some((value) => Number.isFinite(value) && value > 0);
  if (hasManualMacros) {
    const fat = Number.isFinite(manualFat) ? manualFat : 0;
    const protein = Number.isFinite(manualProtein) ? manualProtein : 0;
    const carbs = Number.isFinite(manualCarbs) ? manualCarbs : 0;
    const macroCalories = { protein: protein * 4, fat: fat * 9, carbs: carbs * 4 };
    const macroTotal = macroCalories.protein + macroCalories.fat + macroCalories.carbs || 1;
    return {
      kcal: Math.round(macroTotal),
      protein,
      fat,
      carbs,
      score: 0,
      source: "manual",
      proteinPct: Math.round((macroCalories.protein / macroTotal) * 100),
      fatPct: Math.round((macroCalories.fat / macroTotal) * 100),
      carbPct: Math.round((macroCalories.carbs / macroTotal) * 100),
    };
  }

  const text = mealText(entry);
  const totals = { kcal: 0, protein: 0, fat: 0, carbs: 0, score: 0 };

  for (const signal of foodSignals) {
    const matches = text.match(new RegExp(signal.match.source, "gi")) || [];
    const count = Math.max(1, matches.length);
    if (matches.length > 0) {
      totals.kcal += signal.kcal * count;
      totals.protein += signal.protein * count;
      totals.fat += signal.fat * count;
      totals.carbs += signal.carbs * count;
      totals.score += signal.keto * count;
    }
  }

  if (totals.kcal === 0) {
    totals.kcal = 1;
  }

  const macroCalories = {
    protein: totals.protein * 4,
    fat: totals.fat * 9,
    carbs: totals.carbs * 4,
  };
  const macroTotal = macroCalories.protein + macroCalories.fat + macroCalories.carbs || 1;

  return {
    ...totals,
    source: "estimate",
    proteinPct: Math.round((macroCalories.protein / macroTotal) * 100),
    fatPct: Math.round((macroCalories.fat / macroTotal) * 100),
    carbPct: Math.round((macroCalories.carbs / macroTotal) * 100),
  };
}

function classify(entry, macros) {
  if (macros.carbs <= 20 && macros.fatPct >= 65) return "strikt keto";
  if (macros.carbs <= 30 && macros.fatPct >= 55) return "keto-ish";
  return "riskzon";
}

function coach(entry, macros, kind) {
  const notes = [];
  if (kind === "strikt keto") notes.push("Stark keto-dag: låg kolhydratnivå och bra fettbas.");
  if (kind === "keto-ish") notes.push("Bra riktning, men håll koll på yoghurt, bär, tomat och processat.");
  if (kind === "riskzon") notes.push("Här behöver nästa måltid bli enklare: protein plus tydlig fettkälla, minimalt med kolhydrater.");
  if (entry.sleep === "-6 timmar") notes.push("Kort sömn kan öka hunger, så prioritera salt, vatten och enkel mat idag.");
  if (/1 liter/i.test(entry.water || "")) notes.push("Vattenintaget var lågt; sikta hellre runt 2,5-3 liter.");
  return notes.join(" ");
}

function render(selectedDate = activeDate) {
  const entries = getEntries().sort((a, b) => a.date.localeCompare(b.date));
  const latest = entries.find((entry) => entry.date === selectedDate) || entries.at(-1) || emptyEntry();
  activeDate = latest.date;
  const hasContent = hasEntryContent(latest);
  const macros = estimateMacros(latest);
  const kind = hasContent ? classify(latest, macros) : "ny logg";
  const startWeight = baselineWeight(entries);
  const delta = latest.weight && startWeight ? latest.weight - startWeight : 0;
  const goalWeight = getGoalWeight();
  const toGoal = latest.weight && goalWeight ? latest.weight - goalWeight : 0;

  document.querySelector("#todayDate").textContent = latest.date;
  document.querySelector("#currentWeight").textContent = latest.weight ? decimal(latest.weight) : "--";
  document.querySelector("#deltaWeight").textContent =
    latest.weight && startWeight ? `${delta > 0 ? "+" : ""}${decimal(delta)} kg` : "--";
  document.querySelector("#toGoal").textContent = latest.weight && goalWeight ? `${decimal(toGoal)} kg` : "--";
  goalInput.value = goalWeight ? goalWeight : "";
  const marker = macros.source === "manual" ? "" : "~";
  document.querySelector("#carbMetric").textContent = hasContent ? `${marker}${decimal(macros.carbs)} g` : "--";
  document.querySelector("#fatMetric").textContent = hasContent ? `${marker}${macros.fatPct}%` : "--";
  document.querySelector("#coachLine").textContent = hasContent
    ? coach(latest, macros, kind)
    : "Fyll i dagens mat, vikt, sömn och vätska så börjar coachningen.";

  const badge = document.querySelector("#strictnessBadge");
  badge.textContent = kind;
  badge.className = `badge ${kind === "strikt keto" ? "strict" : kind === "riskzon" ? "risk" : ""}`;

  document.querySelector("#fatBar").style.width = `${Math.min(macros.fatPct, 100)}%`;
  document.querySelector("#proteinBar").style.width = `${Math.min(macros.proteinPct, 100)}%`;
  document.querySelector("#carbBar").style.width = `${Math.min(macros.carbPct, 100)}%`;
  document.querySelector("#fatGramBar").style.width = `${Math.min((macros.fat / 200) * 100, 100)}%`;
  document.querySelector("#carbGramBar").style.width = `${Math.min((macros.carbs / 20) * 100, 100)}%`;
  document.querySelector("#fatText").textContent = hasContent ? `${macros.fatPct}%` : "--";
  document.querySelector("#proteinText").textContent = hasContent ? `${macros.proteinPct}%` : "--";
  document.querySelector("#carbText").textContent = hasContent ? `${macros.carbPct}%` : "--";
  document.querySelector("#fatGramText").textContent = hasContent ? `${decimal(macros.fat)} g` : "--";
  document.querySelector("#carbGramText").textContent = hasContent ? `${decimal(macros.carbs)} g` : "--";
  document.querySelector("#macroNote").textContent =
    macros.source === "manual"
      ? "Makron bygger på manuellt inmatade gram för fett, protein och kolhydrater."
      : "Övre staplarna visar kaloriprocent. Nedre staplarna visar gram mot praktiska riktmärken: 200 g fett och 20 g kolhydrater.";

  const history = document.querySelector("#historyList");
  history.innerHTML = "";
  for (const entry of entries.slice(-7).reverse()) {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "day-row";
    row.innerHTML = `<time>${entry.date}</time><span>${entry.sleep || "sömn saknas"}</span><strong>${entry.weight ? `${decimal(entry.weight)} kg` : "--"}</strong>`;
    row.addEventListener("click", () => fillForm(entry));
    history.append(row);
  }
}

function fillForm(entry) {
  activeDate = entry.date || activeDate || todayIso();
  for (const [key, input] of Object.entries(fields)) {
    if (!input) continue;
    input.value = entry[key] ?? "";
  }
  goalInput.value = getGoalWeight() || "";
}

function setSaveStatus(message, isError = false) {
  const status = document.querySelector("#saveStatus");
  status.textContent = message;
  status.classList.toggle("error", isError);
}

function saveCurrentEntry() {
  const entry = {};
  for (const [key, input] of Object.entries(fields)) {
    if (!input) continue;
    const value = input.value.trim();
    entry[key] = ["weight", "fat", "protein", "carbs"].includes(key) && value ? Number(value) : value;
  }
  saveGoalWeight(goalInput.value.trim());
  entry.date ||= todayIso();
  activeDate = entry.date;
  const entries = getEntries().filter((item) => item.date !== entry.date);
  entries.push(entry);
  saveEntries(entries);
  render(entry.date);
  fillForm(entry);
  setSaveStatus(`Sparat ${entry.date} kl. ${new Date().toLocaleTimeString("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
  })}`);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  saveCurrentEntry();
});

saveButton.addEventListener("click", saveCurrentEntry);

window.addEventListener("error", (event) => {
  setSaveStatus(`Appfel: ${event.message}`, true);
});

document.querySelector("#todayButton").addEventListener("click", () => {
  const today = todayIso();
  const existing = findEntry(today);
  fillForm(existing || emptyEntry(today));
  render(today);
  setSaveStatus(existing ? `Visar sparad rad för ${today}` : `Ny rad för ${today}`);
});

fields.date.addEventListener("change", () => {
  const date = fields.date.value || todayIso();
  const existing = findEntry(date);
  fillForm(existing || emptyEntry(date));
  render(date);
  setSaveStatus(existing ? `Visar sparad rad för ${date}` : `Ny tom rad för ${date}`);
});

goalInput.addEventListener("change", () => {
  const goal = saveGoalWeight(goalInput.value.trim());
  render(activeDate);
  setSaveStatus(goal ? `Målvikt sparad: ${decimal(goal)} kg` : "Målvikt rensad");
});

goalInput.addEventListener("input", () => {
  saveGoalWeight(goalInput.value.trim());
});

document.querySelector("#blankLinkButton").addEventListener("click", async () => {
  const appUrl = `${window.location.origin}${window.location.pathname}`;
  await navigator.clipboard.writeText(appUrl);
  document.querySelector("#toolsNote").textContent = "App-länk kopierad. Lokala loggar och inställningar följer inte med länken.";
});

document.querySelector("#importButton").addEventListener("click", () => {
  const input = document.querySelector("#importInput");
  try {
    const imported = JSON.parse(input.value);
    const importedEntries = Array.isArray(imported) ? imported : imported.entries;
    if (!Array.isArray(importedEntries)) throw new Error("Expected entries");
    const cleaned = importedEntries
      .filter((entry) => entry && entry.date)
      .map((entry) => ({ ...emptyEntry(entry.date), ...entry }));
    if (cleaned.length === 0) throw new Error("No dated entries");
    saveEntries(cleaned);
    if (imported.goalWeight) saveGoalWeight(imported.goalWeight);
    fillForm(cleaned.sort((a, b) => a.date.localeCompare(b.date)).at(-1));
    render();
    document.querySelector("#toolsNote").textContent = "Importerad data sparad i den här browsern.";
  } catch {
    document.querySelector("#toolsNote").textContent = "Importen fungerade inte. Kontrollera att du klistrat in exporterad data.";
  }
});

document.querySelector("#resetButton").addEventListener("click", () => {
  if (!window.confirm("Rensa din lokala data i den här browsern?")) return;
  localStorage.removeItem(storageKey);
  localStorage.removeItem(goalKey);
  fillForm(emptyEntry());
  render();
});

document.querySelector("#exportButton").addEventListener("click", async () => {
  const payload = JSON.stringify({ entries: getEntries(), goalWeight: getGoalWeight() }, null, 2);
  await navigator.clipboard.writeText(payload);
  document.querySelector("#coachLine").textContent = "Data kopierad. Den kan importeras i appen på en annan enhet.";
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  });
}

const initialEntry = getEntries().at(-1) || emptyEntry();
fillForm(initialEntry);
render(initialEntry.date);

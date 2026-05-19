const storageKey = "btk.keto.entries.v1";
const goalKey = "btk.keto.goal.v1";
const syncCodeKey = "btk.keto.syncCode.v1";
const appVersion = "44";
let activeDate = "";
let supabaseClient = null;
let cloudSyncTimer = null;
let applyingRemoteData = false;

const foodSignals = [
  { match: /(^|[^a-zåäö])(?:ägg|agg)(?:[^a-zåäö]|$)/i, quantity: /(\d+(?:[,.]\d+)?)\s*(?:st\s*)?(?:ägg|agg)/gi, kcal: 70, protein: 6.2, fat: 5, carbs: 0.5, keto: 2 },
  { match: /makrill/i, kcal: 238, protein: 15, fat: 17.5, carbs: 4.9, servingGrams: 125, keto: 2 },
  { match: /majonnäs|majonnas/i, kcal: 105, protein: 0, fat: 11.5, carbs: 0.2, servingGrams: 15, keto: 2 },
  { match: /ost|cheddar|brie|gouda|gruyere|parmesan/i, kcal: 120, protein: 7, fat: 10, carbs: 0.5, servingGrams: 30, keto: 2 },
  { match: /smör|smor/i, kcal: 75, protein: 0.1, fat: 8.2, carbs: 0.1, servingGrams: 10, keto: 2 },
  { match: /grädde|gradde/i, kcal: 100, protein: 0.6, fat: 10, carbs: 0.9, servingGrams: 30, keto: 2 },
  { match: /baconlindad(?:e)?\s+(?:köttfärs|kottfars)?(?:bit|bitar|biff|biffar)/i, quantity: /(\d+(?:[,.]\d+)?)\s*(?:st\s*)?baconlindad(?:e)?\s+(?:köttfärs|kottfars)?(?:bit|bitar|biff|biffar)/gi, kcal: 220, protein: 16.5, fat: 17.5, carbs: 0.8, keto: 2 },
  { match: /bacon/i, exclude: /baconlindad/i, quantity: [/(\d+(?:[,.]\d+)?)\s*(?:skivor?|st)\s*bacon/gi, /bacon\s*(?:ca\s*)?(\d+(?:[,.]\d+)?)\s*(?:skivor?|st)/gi], kcal: 55, protein: 3.5, fat: 4.5, carbs: 0.1, keto: 2 },
  { match: /bearnaise(?:sås|sas)?|bea|bea-?sås|bea-?sas|bearnie(?:sås|sas)?/i, quantity: [/(\d+(?:[,.]\d+)?)\s*msk\s*(?:bearnaise(?:sås|sas)?|bea|bea-?sås|bea-?sas|bearnie(?:sås|sas)?)/gi, /(?:bearnaise(?:sås|sas)?|bea|bea-?sås|bea-?sas|bearnie(?:sås|sas)?)\s*(?:ca|minst)?\s*(\d+(?:[,.]\d+)?)\s*msk/gi], kcal: 85, protein: 0.2, fat: 9, carbs: 0.4, keto: 2 },
  { match: /salami/i, kcal: 120, protein: 7, fat: 10, carbs: 0.5, servingGrams: 30, keto: 1 },
  { match: /hamburgare\s*90\s*g/i, kcal: 230, protein: 17, fat: 18, carbs: 0, keto: 2 },
  { match: /hamburgare\s*150\s*g/i, kcal: 385, protein: 28, fat: 30, carbs: 0, keto: 2 },
  { match: /grillkorv\s*85\s*%?\s*(?:kött|kott)?/i, kcal: 260, protein: 12, fat: 23, carbs: 2, servingGrams: 100, keto: 1 },
  { match: /korv\s*75\s*%?\s*(?:kött|kott)?/i, kcal: 250, protein: 11, fat: 22, carbs: 4, servingGrams: 100, keto: 0 },
  { match: /gräddfil\s*12\s*%|graddfil\s*12\s*%/i, kcal: 135, protein: 3, fat: 12, carbs: 3.5, servingGrams: 100, keto: 1 },
  { match: /grekisk\s+(?:yoghurt|youghurt|yogurt)\s*10\s*%/i, kcal: 130, protein: 4, fat: 10, carbs: 4, servingGrams: 100, keto: 1 },
  { match: /mozzarella/i, kcal: 150, protein: 10, fat: 11, carbs: 1.5, servingGrams: 60, keto: 2 },
  { match: /entrecote|entrecôte/i, kcal: 430, protein: 30, fat: 34, carbs: 0, servingGrams: 150, keto: 2 },
  { match: /nötfärs|notfars|köttfärs|kottfars/i, exclude: /baconlindad/i, kcal: 190, protein: 20, fat: 12, carbs: 0, servingGrams: 100, keto: 2 },
  { match: /kycklingfil[eé]|kyckling\s*\(?\s*fil[eé](?:\s+utan\s+skinn)?\s*\)?|kycklingbröst|kycklingbrost/i, kcal: 165, protein: 31, fat: 3.6, carbs: 0, servingGrams: 100, keto: 1 },
  { match: /torsk/i, kcal: 82, protein: 18, fat: 0.7, carbs: 0, servingGrams: 100, keto: 1 },
  { match: /leverpastej/i, kcal: 95, protein: 3, fat: 8, carbs: 2.5, servingGrams: 30, keto: 0 },
  { match: /cashewnötter\s*saltade|cashewnotter\s*saltade/i, kcal: 175, protein: 5.5, fat: 13, carbs: 9, servingGrams: 30, keto: -1 },
  { match: /cashewnötter\s*osaltade|cashewnotter\s*osaltade|cashewnötter|cashewnotter/i, exclude: /cashewnötter\s*saltade|cashewnotter\s*saltade/i, kcal: 175, protein: 5.5, fat: 13, carbs: 9, servingGrams: 30, keto: -1 },
  { match: /jordnötter\s*saltade|jordnotter\s*saltade|jordnötter|jordnotter/i, kcal: 180, protein: 8, fat: 15, carbs: 4.5, servingGrams: 30, keto: 0 },
  { match: /(?:1\s*glas\s*)?chianti\s*(?:15\s*cl)?/i, kcal: 125, protein: 0, fat: 0, carbs: 3, alcohol: 113, keto: 0 },
  { match: /lätt\s*öl|latt\s*ol/i, kcal: 90, protein: 1, fat: 0, carbs: 10, alcohol: 28, keto: -1 },
  { match: /laxfilé\s*125\s*g|laxfile\s*125\s*g/i, kcal: 260, protein: 25, fat: 17, carbs: 0, keto: 2 },
  { match: /avokado|avocado/i, kcal: 160, protein: 2, fat: 15, carbs: 2, servingGrams: 100, keto: 2 },
  { match: /olivolja|olive oil/i, kcal: 120, protein: 0, fat: 13.5, carbs: 0, servingGrams: 15, keto: 2 },
  { match: /(^|[^a-zåäö])(?:nötter|notter|mandel|valnöt|valnot|macadamia)(?:[^a-zåäö]|$)/i, kcal: 180, protein: 5, fat: 17, carbs: 3, servingGrams: 30, keto: 1 },
  { match: /påläggsskinka|palaggsskinka|skinka|kalkonpålägg|kalkonpalagg|kycklingpålägg|kycklingpalagg/i, kcal: 30, protein: 5, fat: 1, carbs: 0.3, keto: 1 },
  { match: /pulled pork/i, kcal: 375, protein: 34, fat: 25, carbs: 3, servingGrams: 150, keto: 1 },
  { match: /falukorv/i, kcal: 260, protein: 10, fat: 23, carbs: 4, servingGrams: 100, keto: 0 },
  { match: /gräddfil|graddfil/i, exclude: /gräddfil\s*12|graddfil\s*12/i, kcal: 70, protein: 1.5, fat: 6, carbs: 2, servingGrams: 50, keto: 1 },
  { match: /yoghurt|youghurt|yogurt/i, exclude: /grekisk\s+(?:yoghurt|youghurt|yogurt)\s*10/i, kcal: 90, protein: 5, fat: 4.5, carbs: 7, servingGrams: 150, keto: -1 },
  { match: /bär|bar|jordgubb|hallon|blåbär/i, kcal: 25, protein: 0.4, fat: 0.2, carbs: 5.5, keto: -1 },
  { match: /äpple|apple/i, kcal: 70, protein: 0.3, fat: 0.2, carbs: 17, keto: -2 },
  { match: /apelsin/i, kcal: 62, protein: 1.2, fat: 0.2, carbs: 15, keto: -2 },
  { match: /spetskål|spetskal/i, kcal: 30, protein: 1.5, fat: 0.2, carbs: 5, servingGrams: 100, keto: 1 },
  { match: /broccoli/i, kcal: 35, protein: 3, fat: 0.4, carbs: 4, servingGrams: 100, keto: 1 },
  { match: /blomkål|blomkal/i, kcal: 25, protein: 2, fat: 0.3, carbs: 3, servingGrams: 100, keto: 1 },
  { match: /vitkål|vitkal/i, kcal: 30, protein: 1.5, fat: 0.2, carbs: 5, servingGrams: 100, keto: 1 },
  { match: /zucchini/i, kcal: 17, protein: 1.2, fat: 0.3, carbs: 3, servingGrams: 100, keto: 1 },
  { match: /sparris/i, kcal: 20, protein: 2.2, fat: 0.1, carbs: 2, servingGrams: 100, keto: 1 },
  { match: /svamp|champinjon/i, kcal: 22, protein: 3, fat: 0.3, carbs: 3, servingGrams: 100, keto: 1 },
  { match: /bladgrönt|bladgront|spenat|sallad|ruccola/i, kcal: 20, protein: 2, fat: 0.3, carbs: 1.5, servingGrams: 100, keto: 1 },
  { match: /gurka/i, kcal: 15, protein: 0.7, fat: 0.1, carbs: 3, servingGrams: 100, keto: 1 },
  { match: /balsamico/i, kcal: 18, protein: 0, fat: 0, carbs: 4, keto: -1 },
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
const syncCodeInput = document.querySelector("#syncCodeInput");
const syncStatus = document.querySelector("#syncStatus");
const saveSyncCodeButton = document.querySelector("#saveSyncCodeButton");
const clearSyncCodeButton = document.querySelector("#clearSyncCodeButton");
const syncNowButton = document.querySelector("#syncNowButton");
let autosaveTimer = null;

function stableAppUrl() {
  return `${window.location.origin}${window.location.pathname}`;
}

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
  queueCloudSync();
}

function getGoalWeight() {
  const goal = Number(localStorage.getItem(goalKey));
  return Number.isFinite(goal) && goal > 0 ? goal : null;
}

function saveGoalWeight(value) {
  const goal = Number(value);
  if (Number.isFinite(goal) && goal > 0) {
    localStorage.setItem(goalKey, String(goal));
    queueCloudSync();
    return goal;
  }
  localStorage.removeItem(goalKey);
  queueCloudSync();
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

function gramMultiplier(text, signal) {
  if (!signal.servingGrams) return null;
  const matcher = new RegExp(signal.match.source, signal.match.flags.includes("g") ? signal.match.flags : `${signal.match.flags}g`);
  for (const match of text.matchAll(matcher)) {
    const start = match.index ?? 0;
    const end = start + match[0].length;
    const before = text.slice(Math.max(0, start - 24), start);
    const after = text.slice(end, Math.min(text.length, end + 24));
    const beforeAmount = before.match(/(\d+(?:[,.]\d+)?)\s*g(?:ram)?(?:\s|[a-zåäö%])*$/i);
    const afterAmount = after.match(/^(?:\s|[a-zåäö%]){0,18}(\d+(?:[,.]\d+)?)\s*g(?:ram)?/i);
    const amount = beforeAmount?.[1] || afterAmount?.[1];
    if (!amount) continue;
    const grams = Number(amount.replace(",", "."));
    if (Number.isFinite(grams) && grams > 0) return grams / signal.servingGrams;
  }
  return null;
}

function countSignal(text, signal) {
  if (signal.exclude?.test(text)) return 0;
  if (signal.quantity) {
    const quantityPatterns = Array.isArray(signal.quantity) ? signal.quantity : [signal.quantity];
    const quantities = quantityPatterns.flatMap((pattern) =>
      [...text.matchAll(pattern)].map((match) => {
        const amount = match.find((part, index) => index > 0 && part);
        return Number(amount?.replace(",", "."));
      })
    );
    const total = quantities.reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0);
    if (total > 0) return total;
  }
  const grams = gramMultiplier(text, signal);
  if (grams) return grams;
  return (text.match(new RegExp(signal.match.source, "gi")) || []).length;
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
  const totals = { kcal: 0, protein: 0, fat: 0, carbs: 0, alcohol: 0, score: 0 };

  for (const signal of foodSignals) {
    const count = countSignal(text, signal);
    if (count > 0) {
      totals.kcal += signal.kcal * count;
      totals.protein += signal.protein * count;
      totals.fat += signal.fat * count;
      totals.carbs += signal.carbs * count;
      totals.alcohol += (signal.alcohol || 0) * count;
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
  const macroTotal = macroCalories.protein + macroCalories.fat + macroCalories.carbs + totals.alcohol || 1;

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
  document.querySelector("#goalMetricLabel").textContent = goalWeight ? `Till målvikt ${decimal(goalWeight)} kg` : "Till målvikt";
  document.querySelector("#toGoal").textContent = latest.weight && goalWeight ? `${decimal(toGoal)} kg` : "--";
  if (goalInput) goalInput.value = goalWeight ? goalWeight : "";
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
      : macros.alcohol > 0
        ? "Övre staplarna visar kaloriprocent. Alkohol ger energi men visas inte som fett, protein eller kolhydrater."
        : "Automatisk uppskattning: om gram anges räknar appen på gram, annars på normalportioner.";

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
  if (goalInput) goalInput.value = getGoalWeight() || "";
}

function setSaveStatus(message, isError = false) {
  const status = document.querySelector("#saveStatus");
  status.textContent = message;
  status.classList.toggle("error", isError);
}

function saveCurrentEntry(options = {}) {
  const entry = {};
  for (const [key, input] of Object.entries(fields)) {
    if (!input) continue;
    const value = input.value.trim();
    entry[key] = ["weight", "fat", "protein", "carbs"].includes(key) && value ? Number(value) : value;
  }
  if (goalInput) saveGoalWeight(goalInput.value.trim());
  entry.date ||= todayIso();
  activeDate = entry.date;
  const entries = getEntries().filter((item) => item.date !== entry.date);
  entries.push(entry);
  saveEntries(entries);
  render(entry.date);
  fillForm(entry);
  if (options.silent) return;
  setSaveStatus(`Sparat ${entry.date} kl. ${new Date().toLocaleTimeString("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
  })}`);
}

function queueAutosave() {
  window.clearTimeout(autosaveTimer);
  autosaveTimer = window.setTimeout(() => {
    saveCurrentEntry({ silent: true });
    setSaveStatus(`Autosparat ${activeDate || todayIso()}`);
  }, 800);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  saveCurrentEntry();
});

saveButton.addEventListener("click", saveCurrentEntry);

saveButton.addEventListener("pointerup", () => {
  window.clearTimeout(autosaveTimer);
  saveCurrentEntry();
});

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

form.addEventListener("input", (event) => {
  if (event.target === goalInput) return;
  queueAutosave();
});

if (goalInput) {
  goalInput.addEventListener("change", () => {
    const goal = saveGoalWeight(goalInput.value.trim());
    render(activeDate);
    setSaveStatus(goal ? `Målvikt sparad: ${decimal(goal)} kg` : "Målvikt rensad");
  });

  goalInput.addEventListener("input", () => {
    saveGoalWeight(goalInput.value.trim());
    render(activeDate);
  });
}

document.querySelector("#blankLinkButton").addEventListener("click", async () => {
  const appUrl = `${stableAppUrl()}?v=${appVersion}`;
  await navigator.clipboard.writeText(appUrl);
  document.querySelector("#toolsNote").textContent = "App-länk kopierad. Lokala loggar och inställningar följer inte med länken.";
});

function setSyncStatus(message, isError = false) {
  if (!syncStatus) return;
  syncStatus.textContent = message;
  syncStatus.classList.toggle("error", isError);
}

function getSyncCode() {
  return localStorage.getItem(syncCodeKey) || "";
}

function saveSyncCode(value) {
  const code = value.trim();
  if (code.length < 8) {
    setSyncStatus("Välj en synkkod med minst 8 tecken.", true);
    return "";
  }
  localStorage.setItem(syncCodeKey, code);
  if (syncCodeInput) syncCodeInput.value = code;
  setSyncStatus("Synkkod sparad. Tryck Synka nu för att hämta eller skicka molndata.");
  return code;
}

function queueCloudSync() {
  if (applyingRemoteData || !supabaseClient || !getSyncCode()) return;
  window.clearTimeout(cloudSyncTimer);
  cloudSyncTimer = window.setTimeout(() => {
    pushCloudData({ silent: true });
  }, 900);
}

async function pushCloudData({ silent = false } = {}) {
  const syncCode = getSyncCode();
  if (!supabaseClient || !syncCode) return;
  const { error } = await supabaseRpc("keto_sync_push", {
    sync_key: syncCode,
    profile_entries: getEntries(),
    profile_goal_weight: getGoalWeight(),
  });
  if (error) {
    setSyncStatus(`Synkfel: ${error.message}`, true);
    return;
  }
  if (!silent) setSyncStatus(`Synkat ${new Date().toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}`);
}

async function pullCloudData() {
  const syncCode = getSyncCode();
  if (!supabaseClient || !syncCode) return false;
  const { data, error } = await supabaseRpc("keto_sync_pull", { sync_key: syncCode });
  if (error) {
    setSyncStatus(`Synkfel: ${error.message}`, true);
    return false;
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    await pushCloudData({ silent: true });
    setSyncStatus("Molnprofil skapad från den här enheten.");
    return true;
  }
  applyingRemoteData = true;
  localStorage.setItem(storageKey, JSON.stringify(Array.isArray(row.entries) ? row.entries : [emptyEntry()]));
  if (row.goal_weight) {
    localStorage.setItem(goalKey, String(row.goal_weight));
  } else {
    localStorage.removeItem(goalKey);
  }
  applyingRemoteData = false;
  const nextEntry = getEntries().at(-1) || emptyEntry();
  fillForm(nextEntry);
  render(nextEntry.date);
  setSyncStatus(`Synkat från molnet ${new Date(row.updated_at).toLocaleString("sv-SE")}`);
  return true;
}

async function supabaseRpc(functionName, payload) {
  const response = await fetch(`${supabaseClient.url}/rest/v1/rpc/${functionName}`, {
    method: "POST",
    headers: {
      apikey: supabaseClient.anonKey,
      authorization: `Bearer ${supabaseClient.anonKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    return { data: null, error: { message: data?.message || response.statusText } };
  }
  return { data, error: null };
}

async function syncNow() {
  if (!supabaseClient) {
    setSyncStatus("Supabase är inte konfigurerat ännu.", true);
    return;
  }
  if (!getSyncCode()) {
    setSyncStatus("Skriv och spara en synkkod först.", true);
    return;
  }
  setSyncStatus("Synkar...");
  await pullCloudData();
}

async function initSync() {
  if (!syncStatus) return;
  try {
    const { supabaseConfig } = await import(`./supabase-config.js?v=${appVersion}`);
    if (!supabaseConfig?.url || !supabaseConfig?.anonKey) {
      setSyncStatus("Synk är redo i appen, men Supabase-url och anon key saknas.");
      return;
    }
    supabaseClient = {
      url: supabaseConfig.url.replace(/\/$/, ""),
      anonKey: supabaseConfig.anonKey,
    };
    const savedCode = getSyncCode();
    if (savedCode) {
      if (syncCodeInput) syncCodeInput.value = savedCode;
      setSyncStatus("Synk är redo. Tryck Synka nu.");
    } else {
      setSyncStatus("Synk är redo. Skriv samma synkkod på varje enhet som ska dela data.");
    }
  } catch (error) {
    setSyncStatus(`Synk kunde inte laddas: ${error.message}`, true);
  }
}

saveSyncCodeButton?.addEventListener("click", () => {
  saveSyncCode(syncCodeInput?.value || "");
});

clearSyncCodeButton?.addEventListener("click", () => {
  localStorage.removeItem(syncCodeKey);
  if (syncCodeInput) syncCodeInput.value = "";
  setSyncStatus("Kopplad från molnsynk på den här enheten. Lokal data finns kvar.");
});

syncNowButton?.addEventListener("click", syncNow);

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
initSync();

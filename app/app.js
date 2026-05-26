import { parseNutritionText } from "./nutrition-parser.mjs?v=191";
import { NUTRITION_CATALOG, NUTRITION_CATEGORIES, categoryName, foodName } from "./nutrition-catalog.mjs?v=191";

const storageKey = "btk.keto.entries.v1";
const goalKey = "btk.keto.goal.v1";
const syncCodeKey = "btk.keto.syncCode.v1";
const macroTargetsKey = "btk.keto.macroTargets.v1";
const weeklyCheckinsKey = "btk.keto.weeklyCheckins.v1";
const defaultMacroTargets = {
  proteinMin: 145,
  proteinMax: 145,
  fatMin: 130,
  fatMax: 130,
  carbsMin: 15,
  carbsMax: 15,
  kcalTarget: 1810,
  kcalMax: 1900,
};
const legacyDefaultMacroTargets = {
  proteinMin: 140,
  proteinMax: 140,
  fatMin: 140,
  fatMax: 150,
  carbsMin: 16,
  carbsMax: 16,
  kcalTarget: 1900,
  kcalMax: 2000,
};
const appVersion = "191";
const appDisplayVersion = `v1.1 beta · build ${appVersion}`;
let activeDate = "";
let supabaseClient = null;
let cloudSyncTimer = null;
let applyingRemoteData = false;

const electrolyteTargetPhases = [
  { label: "Vecka 1", days: 7, sodiumMg: [4500, 5000], potassiumMg: [3000, 3500], magnesiumMg: [350, 400] },
  { label: "Vecka 2", days: 14, sodiumMg: [4000, 4000], potassiumMg: [2800, 3200], magnesiumMg: [350, 350] },
  { label: "Vecka 3", days: 21, sodiumMg: [3500, 4000], potassiumMg: [2800, 3000], magnesiumMg: [350, 350] },
  { label: "Vecka 4+", days: Infinity, sodiumMg: [3000, 3000], potassiumMg: [2800, 2800], magnesiumMg: [350, 350] },
];

const electrolyteKeywords = {
  sodium: [
    "salt",
    "saltar",
    "saltat",
    "buljong",
    "seltin",
    "pansalt",
    "natrium",
    "feta",
    "fetaost",
    "halloumi",
    "bacon",
    "skinka",
    "lax",
    "sill",
    "kaviar",
    "kalamata",
    "oliver",
    "salami",
    "korv",
  ],
  potassium: [
    "kalium",
    "seltin",
    "pansalt",
    "avokado",
    "avocado",
    "spenat",
    "lax",
    "nötkött",
    "notkott",
    "nötfärs",
    "notfars",
    "köttfärs",
    "kottfars",
    "entrecote",
    "svamp",
    "champinjon",
    "tomat",
    "broccoli",
  ],
  magnesium: [
    "magnesium",
    "magnesiumglycinat",
    "magnesiumcitrat",
    "pumpakärnor",
    "pumpakarnor",
    "mandel",
    "spenat",
    "avokado",
    "avocado",
    "lax",
  ],
};

const symptomKeywords = ["huvudvärk", "huvudvark", "kramp", "yrsel", "trött", "trott", "seg", "orkeslös", "orkeslos", "hjärtklappning", "hjartklappning"];

const electrolyteSuggestions = {
  sodium: "natrium: buljong/salta maten, feta, halloumi, bacon, skinka, lax eller sill",
  potassium: "kalium: avokado, spenat, lax, nötkött, svamp, tomat eller broccoli",
  magnesium: "magnesium: pumpakärnor, mandel, spenat, avokado, lax eller tillskott",
};

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
  walk: document.querySelectorAll('input[name="walk"]'),
  motion: document.querySelectorAll('input[name="motion"]'),
  trainingDay: document.querySelector("#legacyTrainingDayInput"),
  bloodGlucose: document.querySelector("#bloodGlucoseInput"),
  ketones: document.querySelector("#ketonesInput"),
  waist: document.querySelector("#waistInput"),
  belly: document.querySelector("#bellyInput"),
  notes: document.querySelector("#notesInput"),
};
const goalInput = document.querySelector("#goalInput");
const omegaRatioOutput = document.querySelector("#omegaRatioOutput");
const macroTargetInputs = {
  proteinMin: document.querySelector("#targetProteinMinInput"),
  proteinMax: document.querySelector("#targetProteinMaxInput"),
  fatMin: document.querySelector("#targetFatMinInput"),
  fatMax: document.querySelector("#targetFatMaxInput"),
  carbsMin: document.querySelector("#targetCarbsMinInput"),
  carbsMax: document.querySelector("#targetCarbsMaxInput"),
  kcalTarget: document.querySelector("#targetKcalInput"),
  kcalMax: document.querySelector("#maxKcalInput"),
};
const syncCodeInput = document.querySelector("#syncCodeInput");
const syncStatus = document.querySelector("#syncStatus");
const quickSyncStatus = document.querySelector("#quickSyncStatus");
const saveSyncCodeButton = document.querySelector("#saveSyncCodeButton");
const clearSyncCodeButton = document.querySelector("#clearSyncCodeButton");
const syncNowButton = document.querySelector("#syncNowButton");
const quickSyncButton = document.querySelector("#quickSyncButton");
const reportButton = document.querySelector("#reportButton");
const weekReportButton = document.querySelector("#weekReportButton");
const weeklyCheckinButton = document.querySelector("#weeklyCheckinButton");
const saveWeeklyCheckinButton = document.querySelector("#saveWeeklyCheckinButton");
const weeklyCheckinPanel = document.querySelector("#weeklyCheckinPanel");
const weeklyCheckinStatus = document.querySelector("#weeklyCheckinStatus");
const weeklyCheckinInputs = {
  averageWeight: document.querySelector("#checkinAverageWeightInput"),
  waist: document.querySelector("#checkinWaistInput"),
  belly: document.querySelector("#checkinBellyInput"),
  bloodGlucose: document.querySelector("#checkinBloodGlucoseInput"),
  ketones: document.querySelector("#checkinKetonesInput"),
  energy: document.querySelector("#checkinEnergyInput"),
  craving: document.querySelector("#checkinCravingInput"),
  notes: document.querySelector("#checkinNotesInput"),
};
const printTrendButton = document.querySelector("#printTrendButton");
const saveTrendPngButton = document.querySelector("#saveTrendPngButton");
const trendModeInput = document.querySelector("#trendModeInput");
const trendStartWeekInput = document.querySelector("#trendStartWeekInput");
const trendEndWeekInput = document.querySelector("#trendEndWeekInput");
const electrolyteInfoButton = document.querySelector("#electrolyteInfoButton");
let autosaveTimer = null;

function stableAppUrl() {
  return `${window.location.origin}${window.location.pathname}`;
}

function decimal(value) {
  return Number(value).toLocaleString("sv-SE", { maximumFractionDigits: 1 });
}

function omegaRatioLabel(macros) {
  const omega3 = Number(macros.omega3) || 0;
  const omega6 = Number(macros.omega6) || 0;
  if (omega3 <= 0) return "--";
  return `${decimal(omega6 / omega3)}:1`;
}

function catalogUnitLabel(unit, amount = 1) {
  const labels = {
    ml: "ml",
    cl: "cl",
    dl: "dl",
    litre: "liter",
    tablespoon: "msk",
    teaspoon: "tsk",
    pinch: "krm",
    piece: amount === 1 ? "st" : "st",
    portion: "portion",
    tin: amount === 1 ? "burk" : "burkar",
    glass: "glas",
    bottle: amount === 1 ? "flaska" : "flaskor",
    tablet: amount === 1 ? "tablett" : "tabletter",
    slice: amount === 1 ? "skiva" : "skivor",
    cube: amount === 1 ? "tärning" : "tärningar",
    leaf: "blad",
    cup: amount === 1 ? "kopp" : "koppar",
  };
  return labels[unit] || unit;
}

function catalogMeasureLabel(measure) {
  return `${decimal(measure.amount)} ${catalogUnitLabel(measure.unit, measure.amount)} = ${decimal(measure.grams)} g`;
}

function renderFoodList() {
  const container = document.querySelector("#foodListGrid");
  if (!container) return;
  container.innerHTML = Object.keys(NUTRITION_CATEGORIES)
    .map((categoryId) => {
      const foods = NUTRITION_CATALOG
        .filter((food) => food.category === categoryId)
        .sort((a, b) => foodName(a).localeCompare(foodName(b), "sv"));
      if (!foods.length) return "";
      const rows = foods
        .map((food) => {
          if (food.requiresVariant) {
            return `<li><strong>${foodName(food)}</strong>: Beräknas först när fetthalt anges.</li>`;
          }
          const nutrient = food.nutrientsPer100g;
          const measures = food.measures
            .filter((measure) => !["g", "kg"].includes(measure.unit))
            .map(catalogMeasureLabel)
            .join(", ");
          const standardMeasure = food.defaultMeasure
            ? food.measures.find((measure) => measure.unit === food.defaultMeasure.unit)
            : null;
          const standard = standardMeasure
            ? ` Standard: ${catalogMeasureLabel({
                ...standardMeasure,
                amount: food.defaultMeasure.amount,
                grams: (standardMeasure.grams / standardMeasure.amount) * food.defaultMeasure.amount,
              })}.`
            : "";
          const milligrams = (value) => (Number.isFinite(value) ? `${Math.round(value)} mg` : "--");
          const electrolytes = [nutrient.sodiumMg, nutrient.potassiumMg, nutrient.magnesiumMg].some(Number.isFinite)
            ? ` Na ${milligrams(nutrient.sodiumMg)}, Ka ${milligrams(nutrient.potassiumMg)}, Mg ${milligrams(nutrient.magnesiumMg)}.`
            : "";
          const fiber = Number.isFinite(nutrient.fiber) ? `${decimal(nutrient.fiber)} g` : "--";
          const omega3 = Number.isFinite(nutrient.omega3) ? `${decimal(nutrient.omega3)} g` : "--";
          const omega6 = Number.isFinite(nutrient.omega6) ? `${decimal(nutrient.omega6)} g` : "--";
          const sourceMark = food.macroSource?.type === "proxy" ? " (schablon)" : "";
          return `<li><strong>${foodName(food)}${sourceMark}</strong>: ${decimal(nutrient.kcal || 0)} kcal, P ${decimal(nutrient.protein || 0)} g, F ${decimal(nutrient.fat || 0)} g, K ${decimal(nutrient.carbs || 0)} g, Fiber ${fiber}, O3 ${omega3}, O6 ${omega6}.${electrolytes}${measures ? ` Mått: ${measures}.` : ""}${standard}</li>`;
        })
        .join("");
      return `<div><h3>${categoryName(categoryId)}</h3><ul>${rows}</ul></div>`;
    })
    .join("");
}

function todayIso() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Stockholm" });
}

function nowStamp() {
  const now = new Date();
  const date = now.toLocaleDateString("sv-SE", { timeZone: "Europe/Stockholm" });
  const time = now.toLocaleTimeString("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Stockholm",
  });
  return `${date} kl. ${time}`;
}

function isoWeekInfo(dateText) {
  const [year, month, day] = String(dateText || todayIso()).split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const dayOfWeek = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayOfWeek);
  const weekYear = date.getUTCFullYear();
  const yearStart = new Date(Date.UTC(weekYear, 0, 1));
  const week = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  return { year: weekYear, week };
}

function isoDateFromUtc(date) {
  return date.toISOString().slice(0, 10);
}

function weekRange(year, week) {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - jan4Day + 1 + (week - 1) * 7);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return { start: isoDateFromUtc(monday), end: isoDateFromUtc(sunday) };
}

function dateDistanceDays(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  return Math.floor((end - start) / 86400000);
}

function shiftIsoDate(dateText, days) {
  const date = new Date(`${dateText}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return isoDateFromUtc(date);
}

function shortSwedishDate(dateText) {
  const [year, month, day] = dateText.split("-").map(Number);
  const months = ["jan", "feb", "mar", "apr", "maj", "juni", "juli", "aug", "sep", "okt", "nov", "dec"];
  return `${day} ${months[month - 1]}`;
}

function phaseRangeText(startDate, firstDay, lastDay) {
  const start = shiftIsoDate(startDate, firstDay);
  if (lastDay === null) return `från ${shortSwedishDate(start)}`;
  const end = shiftIsoDate(startDate, lastDay);
  const [startYear, startMonth, startDay] = start.split("-").map(Number);
  const [endYear, endMonth, endDay] = end.split("-").map(Number);
  if (startYear === endYear && startMonth === endMonth) {
    return `${startDay}-${shortSwedishDate(end)}`;
  }
  return `${shortSwedishDate(start)}-${shortSwedishDate(end)}`;
}

function weekInputFromDate(dateText) {
  const { year, week } = isoWeekInfo(dateText);
  return `${year}-${String(week).padStart(2, "0")}`;
}

function parseWeekInput(value) {
  const match = String(value || "").trim().match(/^(\d{4})\s*[- ]?\s*(?:v|vecka|w)?\s*(\d{1,2})$/i);
  if (!match) return null;
  const year = Number(match[1]);
  const week = Number(match[2]);
  if (!Number.isInteger(year) || !Number.isInteger(week) || week < 1 || week > 53) return null;
  return { year, week };
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
    walk: "",
    motion: "",
    trainingDay: "",
    bloodGlucose: "",
    ketones: "",
    waist: "",
    belly: "",
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

function getWeeklyCheckins() {
  try {
    const stored = JSON.parse(localStorage.getItem(weeklyCheckinsKey) || "{}");
    return stored && typeof stored === "object" && !Array.isArray(stored) ? stored : {};
  } catch {
    return {};
  }
}

function saveWeeklyCheckins(checkins) {
  localStorage.setItem(weeklyCheckinsKey, JSON.stringify(checkins || {}));
  queueCloudSync();
}

function currentWeekKey() {
  return weekInputFromDate(fields.date?.value || activeDate || todayIso());
}

function numberInputValue(input) {
  const value = input?.value?.trim() || "";
  return value ? Number(value) : "";
}

function weeklyAverageField(field, weekKey = currentWeekKey()) {
  const parsed = parseWeekInput(weekKey);
  if (!parsed) return null;
  const { entries } = entriesForWeek(parsed.year, parsed.week);
  return average(entries.map((entry) => (Number(entry[field]) > 0 ? Number(entry[field]) : NaN)));
}

function weeklyAverageWeight(weekKey = currentWeekKey()) {
  return weeklyAverageField("weight", weekKey);
}

function fillWeeklyCheckin(weekKey = currentWeekKey()) {
  const checkin = getWeeklyCheckins()[weekKey] || {};
  const averageWeight = weeklyAverageWeight(weekKey);
  const averageWaist = weeklyAverageField("waist", weekKey);
  const averageBelly = weeklyAverageField("belly", weekKey);
  if (weeklyCheckinInputs.averageWeight) weeklyCheckinInputs.averageWeight.value = averageWeight === null ? "" : decimal(averageWeight);
  if (weeklyCheckinInputs.waist) weeklyCheckinInputs.waist.value = averageWaist === null ? (checkin.waist ?? "") : decimal(averageWaist);
  if (weeklyCheckinInputs.belly) weeklyCheckinInputs.belly.value = averageBelly === null ? (checkin.belly ?? "") : decimal(averageBelly);
  if (weeklyCheckinInputs.bloodGlucose) weeklyCheckinInputs.bloodGlucose.value = checkin.bloodGlucose ?? "";
  if (weeklyCheckinInputs.ketones) weeklyCheckinInputs.ketones.value = checkin.ketones ?? "";
  if (weeklyCheckinInputs.energy) weeklyCheckinInputs.energy.value = checkin.energy ?? "";
  if (weeklyCheckinInputs.craving) weeklyCheckinInputs.craving.value = checkin.craving ?? "";
  if (weeklyCheckinInputs.notes) weeklyCheckinInputs.notes.value = checkin.notes ?? "";
  if (weeklyCheckinStatus) {
    const weightText = averageWeight === null ? " Ingen vikt registrerad ännu." : ` Medelvikt: ${decimal(averageWeight)} kg.`;
    const measurementText = averageWaist === null && averageBelly === null ? "" : " Kroppsmått är medelvärden av dagarna i veckan.";
    weeklyCheckinStatus.textContent = `Veckoincheckning för vecka ${weekKey}.${weightText}${measurementText}`;
  }
}

function saveCurrentWeeklyCheckin() {
  const weekKey = currentWeekKey();
  const checkins = getWeeklyCheckins();
  const averageWaist = weeklyAverageField("waist", weekKey);
  const averageBelly = weeklyAverageField("belly", weekKey);
  checkins[weekKey] = {
    week: weekKey,
    waist: averageWaist === null ? "" : averageWaist,
    belly: averageBelly === null ? "" : averageBelly,
    bloodGlucose: numberInputValue(weeklyCheckinInputs.bloodGlucose),
    ketones: numberInputValue(weeklyCheckinInputs.ketones),
    energy: numberInputValue(weeklyCheckinInputs.energy),
    craving: numberInputValue(weeklyCheckinInputs.craving),
    notes: weeklyCheckinInputs.notes?.value?.trim() || "",
    savedAt: nowStamp(),
  };
  saveWeeklyCheckins(checkins);
  const averageWeight = weeklyAverageWeight(weekKey);
  if (weeklyCheckinStatus) {
    const weightText = averageWeight === null ? "" : ` Medelvikt: ${decimal(averageWeight)} kg.`;
    weeklyCheckinStatus.textContent = `Veckoincheckning sparad för vecka ${weekKey}.${weightText}`;
  }
  setSaveStatus(`Veckoincheckning sparad för vecka ${weekKey}`);
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

function normalizeMacroTargets(targets = {}) {
  const legacyMacroKeys = ["proteinMin", "proteinMax", "fatMin", "fatMax", "carbsMin", "carbsMax"];
  const isLegacyDefault = legacyMacroKeys
    .every((key) => Number(targets[key]) === legacyDefaultMacroTargets[key]);
  if (isLegacyDefault) return { ...defaultMacroTargets };
  const migrated = {
    ...targets,
    proteinMin: targets.proteinMin ?? targets.protein,
    proteinMax: targets.proteinMax ?? targets.protein,
    carbsMin: targets.carbsMin ?? targets.carbs,
    carbsMax: targets.carbsMax ?? targets.carbs,
  };
  const next = { ...defaultMacroTargets };
  for (const key of Object.keys(next)) {
    const value = Number(migrated[key]);
    if (Number.isFinite(value) && value > 0) next[key] = value;
  }
  if (next.proteinMax < next.proteinMin) {
    [next.proteinMin, next.proteinMax] = [next.proteinMax, next.proteinMin];
  }
  if (next.fatMax < next.fatMin) {
    [next.fatMin, next.fatMax] = [next.fatMax, next.fatMin];
  }
  if (next.carbsMax < next.carbsMin) {
    [next.carbsMin, next.carbsMax] = [next.carbsMax, next.carbsMin];
  }
  if (next.kcalMax < next.kcalTarget) {
    [next.kcalTarget, next.kcalMax] = [next.kcalMax, next.kcalTarget];
  }
  return next;
}

function getMacroTargets() {
  try {
    return normalizeMacroTargets(JSON.parse(localStorage.getItem(macroTargetsKey) || "{}"));
  } catch {
    return { ...defaultMacroTargets };
  }
}

function saveMacroTargets(targets) {
  const normalized = normalizeMacroTargets(targets);
  localStorage.setItem(macroTargetsKey, JSON.stringify(normalized));
  queueCloudSync();
  return normalized;
}

function macroKcalRange(targets = getMacroTargets()) {
  const min = targets.proteinMin * 4 + targets.fatMin * 9 + targets.carbsMin * 4;
  const max = targets.proteinMax * 4 + targets.fatMax * 9 + targets.carbsMax * 4;
  return { min, max };
}

function roundedKcal(value) {
  return Math.round(value / 10) * 10;
}

function fatEnergyShareLabel(targets, kcalRange) {
  const minShare = Math.round(((targets.fatMin * 9) / kcalRange.min) * 100);
  const maxShare = Math.round(((targets.fatMax * 9) / kcalRange.max) * 100);
  if (Number(targets.fatMin) === Number(targets.fatMax)) return `${minShare} %`;
  return minShare === maxShare ? `${minShare} %` : `${minShare}-${maxShare} %`;
}

function targetRangeLabel(min, max) {
  return Number(min) === Number(max) ? decimal(min) : `${decimal(min)}-${decimal(max)}`;
}

function hasEntryContent(entry) {
  return Object.entries(entry).some(([key, value]) => key !== "date" && value !== "" && value !== null && value !== undefined);
}

function electrolyteStartDate(entries) {
  return entries
    .filter((entry) => entry.date && hasEntryContent(entry))
    .map((entry) => entry.date)
    .sort((a, b) => a.localeCompare(b))[0] || todayIso();
}

function electrolyteTargetsForDate(date, entries, trainingDay = false) {
  const startDate = electrolyteStartDate(entries);
  const elapsedDays = Math.max(0, dateDistanceDays(startDate, date || startDate));
  const phase = electrolyteTargetPhases.find((candidate) => elapsedDays < candidate.days) || electrolyteTargetPhases.at(-1);
  const trainingAddition = trainingDay && elapsedDays >= 7 ? 500 : 0;
  return {
    label: phase.label,
    startDate,
    sodiumMg: [phase.sodiumMg[0] + trainingAddition, phase.sodiumMg[1] + trainingAddition],
    potassiumMg: phase.potassiumMg,
    magnesiumMg: phase.magnesiumMg,
    trainingAddition,
  };
}

function isTrainingEntry(entry) {
  return ["+30 min", "+60 min"].includes(entry?.motion) || entry?.trainingDay === "Ja";
}

function electrolyteRangeLabel(range) {
  return Number(range[0]) === Number(range[1]) ? `${range[0]}` : `${range[0]}-${range[1]}`;
}

function findEntry(date) {
  return getEntries().find((entry) => entry.date === date);
}

function baselineWeight(entries) {
  const firstWeightedEntry = entries.find((entry) => Number(entry.weight) > 0);
  return firstWeightedEntry ? Number(firstWeightedEntry.weight) : null;
}

function mealText(entry) {
  return [entry.breakfast, entry.lunch, entry.dinner, entry.extras, entry.notes].filter(Boolean).join("\n");
}

function formEntry() {
  const entry = {};
  for (const [key, input] of Object.entries(fields)) {
    if (!input) continue;
    const value =
      input instanceof NodeList
        ? [...input].find((option) => option.checked)?.value || ""
        : input.value.trim();
    entry[key] = ["weight", "fat", "protein", "carbs", "bloodGlucose", "ketones", "waist", "belly"].includes(key) && value ? Number(value) : value;
  }
  entry.date ||= todayIso();
  return entry;
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
      fiber: 0,
      omega3: 0,
      omega6: 0,
      sodiumMg: 0,
      potassiumMg: 0,
      magnesiumMg: 0,
      score: 0,
      source: "manual",
      items: [],
      proteinPct: Math.round((macroCalories.protein / macroTotal) * 100),
      fatPct: Math.round((macroCalories.fat / macroTotal) * 100),
      carbPct: Math.round((macroCalories.carbs / macroTotal) * 100),
    };
  }

  return estimateMasterMacros(entry);
}

function masterAmountLabel(item) {
  const labels = {
    g: "g",
    kg: "kg",
    ml: "ml",
    cl: "cl",
    dl: "dl",
    litre: "liter",
    tablespoon: "msk",
    teaspoon: "tsk",
    pinch: "krm",
    piece: "st",
    portion: "portion",
    tin: "burk",
    glass: "glas",
    bottle: "flaska",
    tablet: "tablett",
    slice: "skiva",
    cube: "tärning",
    cup: "kopp",
  };
  const standard = item.assumption?.includes("standardportion") ? " (standard)" : "";
  return `${decimal(item.amount)} ${labels[item.unit] || item.unit}${standard}`;
}

function estimateMasterMacros(entry) {
  const parsed = parseNutritionText(mealText(entry), {
    defaultFoodAliases: { "grädde": "vispgradde-40", gradde: "vispgradde-40" },
  });
  const totals = {
    kcal: parsed.totals.kcal || 0,
    protein: parsed.totals.protein || 0,
    fat: parsed.totals.fat || 0,
    carbs: parsed.totals.carbs || 0,
    fiber: parsed.totals.fiber || 0,
    omega3: parsed.totals.omega3 || 0,
    omega6: parsed.totals.omega6 || 0,
    alcohol: parsed.totals.alcoholKcal || 0,
    sodiumMg: parsed.totals.sodiumMg || 0,
    potassiumMg: parsed.totals.potassiumMg || 0,
    magnesiumMg: parsed.totals.magnesiumMg || 0,
    score: 0,
  };
  const macroCalories = {
    protein: totals.protein * 4,
    fat: totals.fat * 9,
    carbs: totals.carbs * 4,
  };
  const macroTotal = macroCalories.protein + macroCalories.fat + macroCalories.carbs || 1;
  const items = parsed.items.map((item) => ({
    foodId: item.foodId,
    label: item.label,
    count: item.grams / 100,
    amountLabel: masterAmountLabel(item),
    kcal: item.nutrients.kcal || 0,
    protein: item.nutrients.protein || 0,
    fat: item.nutrients.fat || 0,
    carbs: item.nutrients.carbs || 0,
    fiber: item.nutrients.fiber,
    omega3: item.nutrients.omega3 || 0,
    omega6: item.nutrients.omega6 || 0,
    sodiumMg: item.nutrients.sodiumMg || 0,
    potassiumMg: item.nutrients.potassiumMg || 0,
    magnesiumMg: item.nutrients.magnesiumMg || 0,
    assumption: item.assumption,
  }));
  const coffeeCups = numberFromFreeText(entry.coffee);
  const coffeeParsed = coffeeCups > 0 ? parseNutritionText(`${decimal(coffeeCups)} kopp kaffe`) : null;
  const coffeeElectrolyteItem = coffeeParsed?.items?.[0]
    ? {
        foodId: coffeeParsed.items[0].foodId,
        label: coffeeParsed.items[0].label,
        count: coffeeParsed.items[0].grams / 100,
        amountLabel: `${decimal(coffeeCups)} kopp${coffeeCups === 1 ? "" : "ar"}`,
        kcal: 0,
        protein: 0,
        fat: 0,
        carbs: 0,
        fiber: 0,
        sodiumMg: coffeeParsed.items[0].nutrients.sodiumMg || 0,
        potassiumMg: coffeeParsed.items[0].nutrients.potassiumMg || 0,
        magnesiumMg: coffeeParsed.items[0].nutrients.magnesiumMg || 0,
      }
    : null;
  if (coffeeElectrolyteItem) {
    totals.sodiumMg += coffeeElectrolyteItem.sodiumMg;
    totals.potassiumMg += coffeeElectrolyteItem.potassiumMg;
    totals.magnesiumMg += coffeeElectrolyteItem.magnesiumMg;
  }
  const unresolvedMeasures = parsed.unresolved.map((item) => {
    if (item.reason === "unsupported_measure") return `${item.label} (${item.unit})`;
    if (item.reason === "variant_required") return item.label.includes("(ange fetthalt)") ? item.label : `${item.label} (ange fetthalt)`;
    return `${item.label} (mängd saknas)`;
  });
  return {
    ...totals,
    items,
    electrolyteItems: coffeeElectrolyteItem ? [...items, coffeeElectrolyteItem] : items,
    unresolvedMeasures: [...new Set(unresolvedMeasures)],
    unresolved: parsed.unresolved,
    source: "master",
    proteinPct: Math.round((macroCalories.protein / macroTotal) * 100),
    fatPct: Math.round((macroCalories.fat / macroTotal) * 100),
    carbPct: Math.round((macroCalories.carbs / macroTotal) * 100),
  };
}

function partialEntry(entry, keys) {
  const partial = emptyEntry(entry.date || todayIso());
  for (const key of keys) {
    partial[key] = entry[key] || "";
  }
  return partial;
}

function fullProtein(macros) {
  if (macros.source === "manual") return macros.protein || 0;
  return (macros.items || [])
    .filter((item) => item.label !== "Collagen")
    .reduce((sum, item) => sum + item.protein, 0);
}

function collagenProtein(macros) {
  if (macros.source === "manual") return 0;
  return (macros.items || [])
    .filter((item) => item.label === "Collagen")
    .reduce((sum, item) => sum + item.protein, 0);
}

function parseLiters(text = "") {
  const match = text.match(/(\d+(?:[,.]\d+)?)/);
  if (!match) return null;
  const value = Number(match[1].replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

function hasKeywordSignal(text = "", keywords = []) {
  const normalized = ` ${String(text).toLowerCase()} `;
  return keywords.some((keyword) => normalized.includes(keyword.toLowerCase()));
}

function hasSymptomSignal(entry) {
  return hasKeywordSignal(entry.notes || "", symptomKeywords);
}

function hasElectrolyteSignal(text, type) {
  return hasKeywordSignal(text, electrolyteKeywords[type] || []);
}

function dinnerGaps(macros, entry, macroTargets) {
  const electrolyteTargets = electrolyteTargetsForDate(entry.date, getEntries(), isTrainingEntry(entry));
  return {
    protein: Math.max(0, macroTargets.proteinMin - fullProtein(macros)),
    fat: Math.max(0, macroTargets.fatMin - macros.fat),
    carbs: Math.max(0, macroTargets.carbsMax - macros.carbs),
    sodium: Math.max(0, electrolyteTargets.sodiumMg[0] - (macros.sodiumMg || 0)),
    potassium: Math.max(0, electrolyteTargets.potassiumMg[0] - (macros.potassiumMg || 0)),
    magnesium: Math.max(0, electrolyteTargets.magnesiumMg[0] - (macros.magnesiumMg || 0)),
    kcalTarget: Math.max(0, macroTargets.kcalTarget - macros.kcal),
    kcalMax: Math.max(0, macroTargets.kcalMax - macros.kcal),
    kcalCurrent: macros.kcal,
    kcalTargetTotal: macroTargets.kcalTarget,
    kcalMaxTotal: macroTargets.kcalMax,
  };
}

function roundUp(value, step) {
  return Math.ceil(value / step) * step;
}

function proposalMacros(items, date) {
  const proposal = emptyEntry(date);
  proposal.dinner = items.join(", ");
  return estimateMasterMacros(proposal);
}

function addProposalItemIfWithinEnergy(items, item, entry, gaps) {
  const current = proposalMacros(items, entry.date);
  const energyLimit = Math.max(gaps.kcalTarget, current.kcal);
  const candidate = proposalMacros([...items, item], entry.date);
  if (candidate.kcal > energyLimit + 0.5) return null;
  items.push(item);
  return candidate;
}

function buildDinnerProposal(entry, gaps, title, food, favorAvocado = false) {
  const items = [];
  const baseMacros = proposalMacros([`100 g ${food}`], entry.date);
  const proteinPerGram = baseMacros.protein > 0 ? baseMacros.protein / 100 : 0.2;
  const proteinGrams = Math.min(550, Math.max(125, roundUp(Math.max(gaps.protein, 25) / proteinPerGram, 25)));
  items.push(`${proteinGrams} g ${food}`);
  let macros = proposalMacros(items, entry.date);

  const potassiumStillNeeded = Math.max(0, gaps.potassium - macros.potassiumMg);
  const carbsAfterAvocado = macros.carbs + 3.3;
  if (favorAvocado && potassiumStillNeeded >= 350 && carbsAfterAvocado <= gaps.carbs) {
    macros = addProposalItemIfWithinEnergy(items, "1 avokado", entry, gaps) || macros;
  }

  const fatStillNeeded = Math.max(0, gaps.fat - macros.fat);
  let mayonnaiseTablespoons = Math.min(5, Math.ceil((fatStillNeeded / 11.85) * 2) / 2);
  while (mayonnaiseTablespoons >= 0.5) {
    const candidate = addProposalItemIfWithinEnergy(items, `${decimal(mayonnaiseTablespoons)} msk majonnäs`, entry, gaps);
    if (candidate) {
      macros = candidate;
      break;
    }
    mayonnaiseTablespoons -= 0.5;
  }

  let sodiumStillNeeded = Math.max(0, gaps.sodium - macros.sodiumMg);
  if (sodiumStillNeeded >= 700 && macros.carbs + 2.3 <= gaps.carbs) {
    const candidate = addProposalItemIfWithinEnergy(items, "1 glas buljong", entry, gaps);
    if (candidate) {
      macros = candidate;
      sodiumStillNeeded = Math.max(0, gaps.sodium - macros.sodiumMg);
    }
  }

  const potassiumAfterMeal = Math.max(0, gaps.potassium - macros.potassiumMg);
  if (potassiumAfterMeal >= 180) {
    const seltinPinches = Math.min(4, Math.ceil(potassiumAfterMeal / 252));
    items.push(`${seltinPinches} krm seltin`);
    macros = proposalMacros(items, entry.date);
    sodiumStillNeeded = Math.max(0, gaps.sodium - macros.sodiumMg);
  }

  if (sodiumStillNeeded >= 300) {
    const saltPinches = Math.max(1, Math.min(5, Math.round(sodiumStillNeeded / 472)));
    items.push(`${saltPinches} krm salt`);
    macros = proposalMacros(items, entry.date);
  }

  if (Math.max(0, gaps.magnesium - macros.magnesiumMg) >= 100) {
    items.push("1 magnesiumtablett 200 mg");
    macros = proposalMacros(items, entry.date);
  }

  return {
    title,
    meal: items.join(", "),
    macros,
    dayKcal: gaps.kcalCurrent + macros.kcal,
    kcalTarget: gaps.kcalTargetTotal,
    kcalMax: gaps.kcalMaxTotal,
  };
}

function dinnerCompassMarkup(compass) {
  const proposals = compass.proposals
    .map(({ title, meal, macros, dayKcal, kcalTarget, kcalMax }) => `
      <div class="dinner-proposal">
        <strong>${title}</strong>
        <p>${meal}</p>
        <p class="proposal-macros">Ger ca ${decimal(macros.protein)} g protein · ${decimal(macros.fat)} g fett · ${decimal(macros.carbs)} g kolhydrater · ${Math.round(macros.kcal)} kcal</p>
        <p class="proposal-electrolytes">Na ${Math.round(macros.sodiumMg)} mg · Ka ${Math.round(macros.potassiumMg)} mg · Mg ${Math.round(macros.magnesiumMg)} mg</p>
        <p class="proposal-day-total${dayKcal > kcalMax ? " over-limit" : ""}">Dagen totalt: ca ${Math.round(dayKcal)} kcal (${dayKcal <= kcalTarget ? "inom mål" : dayKcal <= kcalMax ? "inom maxgräns" : "över maxgräns"})</p>
      </div>`)
    .join("");
  return `<p class="dinner-balance">${compass.balance}</p>${proposals}${compass.note ? `<p class="dinner-note">${compass.note}</p>` : ""}`;
}

function dinnerCompass(entry) {
  if (!entry.lunch?.trim() || entry.dinner?.trim()) {
    return null;
  }

  const targets = getMacroTargets();
  const beforeDinnerEntry = partialEntry(entry, ["breakfast", "lunch", "extras"]);
  const macros = estimateMacros(beforeDinnerEntry);
  const collagen = collagenProtein(macros);
  const gaps = dinnerGaps(macros, entry, targets);
  const balance =
    `Kvar mot dagens mål: ca ${Math.round(gaps.protein)} g protein, ${Math.round(gaps.fat)} g fett och högst ${decimal(gaps.carbs)} g kolhydrater. ` +
    `Energi kvar: ca ${Math.round(gaps.kcalTarget)} kcal till målet ${targets.kcalTarget} kcal, högst ${Math.round(gaps.kcalMax)} kcal till gränsen ${targets.kcalMax} kcal. ` +
    `Elektrolyter kvar: Na ${Math.round(gaps.sodium)} mg, Ka ${Math.round(gaps.potassium)} mg, Mg ${Math.round(gaps.magnesium)} mg.`;
  const note = collagen > 0 ? `Kollagen (${decimal(collagen)} g) räknas inte in som fullvärdigt protein.` : "";

  return {
    balance,
    proposals: [
      buildDinnerProposal(entry, gaps, "Laxförslag", "laxfilé", true),
      buildDinnerProposal(entry, gaps, "Kycklingförslag", "kycklingfilé utan skinn", true),
    ],
    note,
  };
}

function classify(entry, macros) {
  const targets = getMacroTargets();
  if (macros.carbs <= targets.carbsMax && macros.fatPct >= 65) return "strikt keto";
  if (macros.carbs <= targets.carbsMax + 10 && macros.fatPct >= 55) return "keto-ish";
  return "riskzon";
}

function coach(entry, macros, kind) {
  const notes = [];
  const targets = getMacroTargets();
  const isToday = entry.date === todayIso();
  if (macros.kcal > targets.kcalMax) {
    notes.push(`Energi: ${Math.round(macros.kcal)} kcal, över din övre gräns på ${targets.kcalMax} kcal.`);
  } else if (macros.kcal >= targets.kcalTarget) {
    notes.push(`Energi: ${Math.round(macros.kcal)} kcal, inom accepterat spann men över målet ${targets.kcalTarget} kcal.`);
  }
  if (kind === "strikt keto") notes.push("Stark keto-dag: låg kolhydratnivå och bra fettbas.");
  if (kind === "keto-ish") notes.push("Bra riktning, men håll koll på yoghurt, bär, tomat och processat.");
  if (kind === "riskzon") notes.push("Här behöver nästa måltid bli enklare: protein plus tydlig fettkälla, minimalt med kolhydrater.");
  if (entry.sleep === "-6 timmar") notes.push("Kort sömn kan öka hunger, så prioritera salt, vatten och enkel mat idag.");
  if (/1 liter/i.test(entry.water || "")) {
    notes.push(isToday ? "Vatten hittills: fyll gärna på mot 2,5-3 liter under dagen." : "Vattenintaget var lågt; sikta hellre runt 2,5-3 liter.");
  }
  if (entry.walk === "+60 min") notes.push("Stark promenadbonus idag: bra stöd för blodsocker, energi och fettförbränning.");
  if (entry.walk === "+30 min") notes.push("Promenad registrerad: snyggt stöd för rutinen utan att behöva krångla till maten.");
  return notes.join(" ");
}

function foodItemSort(a, b) {
  return b.fat - a.fat || b.protein - a.protein || a.label.localeCompare(b.label, "sv");
}

function aggregateBreakdownItems(items = []) {
  const aggregated = new Map();
  for (const item of items) {
    const key = item.foodId || item.label;
    const current = aggregated.get(key);
    if (!current) {
      aggregated.set(key, { ...item, amountLabels: [item.amountLabel].filter(Boolean) });
      continue;
    }
    for (const nutrient of ["count", "kcal", "protein", "fat", "carbs", "sodiumMg", "potassiumMg", "magnesiumMg"]) {
      current[nutrient] = (current[nutrient] || 0) + (item[nutrient] || 0);
    }
    current.amountLabels.push(item.amountLabel);
  }
  return [...aggregated.values()].map((item) => {
    const amountLabels = item.amountLabels.filter(Boolean);
    const unit = amountLabels[0]?.replace(/^[\d,.]+\s*/, "");
    const sameUnit = unit && amountLabels.every((label) => label.replace(/^[\d,.]+\s*/, "") === unit);
    if (sameUnit) {
      const amount = amountLabels.reduce((sum, label) => sum + (Number(label.match(/^[\d,.]+/)?.[0].replace(",", ".")) || 0), 0);
      item.amountLabel = `${decimal(amount)} ${unit}`;
    } else if (amountLabels.length > 1) {
      item.amountLabel = `${decimal(item.count * 100)} g totalt`;
    }
    return item;
  });
}

function renderMacroBreakdown(macros, hasContent) {
  const breakdown = document.querySelector("#macroBreakdown");
  if (!breakdown) return;
  if (!hasContent) {
    breakdown.textContent = "Inga matposter beräknade ännu.";
    return;
  }
  if (macros.source === "manual") {
    breakdown.textContent = "Makron är manuellt ifyllda för hela dagen.";
    return;
  }
  const unresolvedText = macros.unresolvedMeasures?.length
    ? `Inte beräknat: ${macros.unresolvedMeasures.join("; ")}. Ange gram eller ett mått som finns i livsmedelslistan.`
    : "";
  if (!macros.items?.length) {
    breakdown.textContent = unresolvedText || "Inga kända livsmedel hittades i dagens text.";
    return;
  }
  const rows = aggregateBreakdownItems(macros.items)
    .sort(foodItemSort)
    .map((item) => {
      const count = Number.isInteger(item.count) ? item.count : decimal(item.count);
      return `<div><strong>${item.label}</strong><span class="macro-count">${item.amountLabel || `x ${count}`}</span><span class="macro-value">${decimal(item.fat)} g F</span><span class="macro-value">${decimal(item.protein)} g P</span><span class="macro-value">${decimal(item.carbs)} g K</span></div>`;
    })
    .join("");
  breakdown.innerHTML = `${unresolvedText ? `<p class="measure-warning">${unresolvedText}</p>` : ""}${rows}`;
}

function renderElectrolyteBreakdown(macros, hasContent) {
  const breakdown = document.querySelector("#electrolyteBreakdown");
  if (!breakdown) return;
  if (!hasContent) {
    breakdown.textContent = "Inga matposter beräknade ännu.";
    return;
  }
  if (macros.source === "manual") {
    breakdown.textContent = "Elektrolyter beräknas inte från manuella makron.";
    return;
  }
  const electrolyteItems = macros.electrolyteItems || macros.items || [];
  if (!electrolyteItems.length) {
    breakdown.textContent = "Inga matposter beräknade ännu.";
    return;
  }
  const rows = aggregateBreakdownItems(electrolyteItems)
    .sort(foodItemSort)
    .map((item) => {
      const count = Number.isInteger(item.count) ? item.count : decimal(item.count);
      const sodium = item.sodiumMg > 0 ? Math.round(item.sodiumMg) : "--";
      const potassium = item.potassiumMg > 0 ? Math.round(item.potassiumMg) : "--";
      const magnesium = item.magnesiumMg > 0 ? Math.round(item.magnesiumMg) : "--";
      return `<div><strong>${item.label}</strong><span class="macro-count">${item.amountLabel || `x ${count}`}</span><span class="macro-value">Na ${sodium}</span><span class="macro-value">Ka ${potassium}</span><span class="macro-value">Mg ${magnesium}</span></div>`;
    })
    .join("");
  breakdown.innerHTML = rows;
}

function chartPath(points) {
  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
}

function trendSelection(entries) {
  const mode = trendModeInput?.value || "all";
  const sorted = entries.sort((a, b) => a.date.localeCompare(b.date));
  if (mode === "all") {
    return {
      entries: sorted,
      badge: `${sorted[0]?.date || todayIso()}--${todayIso()}`,
      notePrefix: "",
    };
  }
  const startWeek = parseWeekInput(trendStartWeekInput?.value || weekInputFromDate(fields.date.value || todayIso()));
  const endWeek = mode === "weeks" ? parseWeekInput(trendEndWeekInput?.value || trendStartWeekInput?.value) : startWeek;
  if (!startWeek || !endWeek) {
    return { entries: [], badge: "Välj vecka", notePrefix: "Ange vecka som ÅÅÅÅ-VV." };
  }
  const startRange = weekRange(startWeek.year, startWeek.week);
  const endRange = weekRange(endWeek.year, endWeek.week);
  const start = startRange.start <= endRange.start ? startRange.start : endRange.start;
  const end = startRange.start <= endRange.start ? endRange.end : startRange.end;
  const label =
    mode === "week"
      ? `${startWeek.year} v${String(startWeek.week).padStart(2, "0")}`
      : `${startWeek.year} v${String(startWeek.week).padStart(2, "0")}--${endWeek.year} v${String(endWeek.week).padStart(2, "0")}`;
  return {
    entries: sorted.filter((entry) => entry.date >= start && entry.date <= end),
    badge: label,
    notePrefix: `${start}--${end}. `,
  };
}

function isIncludedInTrendAverages(entry) {
  if (entry.date < todayIso()) return true;
  if (entry.date !== todayIso()) return false;
  return [entry.breakfast, entry.lunch, entry.dinner].every((meal) => String(meal || "").trim().length > 0);
}

function renderTrendChart(entries) {
  const chart = document.querySelector("#trendChart");
  const note = document.querySelector("#trendNote");
  if (!chart || !note) return;

  const selection = trendSelection(entries);
  document.querySelector("#trendRange").textContent = selection.badge;

  const completedMacros = selection.entries
    .filter(isIncludedInTrendAverages)
    .map((entry) => estimateMacros(entry))
    .filter((macros) => macros.source === "manual" || macros.items.length > 0);
  const todayIncluded = selection.entries.some((entry) => entry.date === todayIso() && isIncludedInTrendAverages(entry));
  const updateTrendAverage = (selector, values, unit, round = false) => {
    const element = document.querySelector(selector);
    const value = average(values);
    if (!element) return;
    element.textContent = value === null ? "--" : `${round ? Math.round(value) : decimal(value)} ${unit}`;
  };
  updateTrendAverage("#trendAvgCarbs", completedMacros.map((macros) => macros.carbs), "g");
  updateTrendAverage("#trendAvgProtein", completedMacros.map((macros) => macros.protein), "g");
  updateTrendAverage("#trendAvgFat", completedMacros.map((macros) => macros.fat), "g");
  updateTrendAverage("#trendAvgKcal", completedMacros.map((macros) => macros.kcal), "kcal", true);
  const averageNote =
    completedMacros.length > 0
      ? ` Medelvärden baseras på ${completedMacros.length} loggdagar${todayIncluded ? "; idag ingår eftersom tre måltider är loggade" : ""}.`
      : " Medelvärden visas när en tidigare dag har matdata eller när dagens tre måltider är loggade.";

  const rows = selection.entries
    .map((entry) => {
      const macros = estimateMacros(entry);
      return {
        date: entry.date,
        weight: Number(entry.weight),
        fat: hasEntryContent(entry) ? macros.fat : null,
        protein: hasEntryContent(entry) ? macros.protein : null,
        carbs: hasEntryContent(entry) ? macros.carbs : null,
      };
    })
    .filter((row) => Number.isFinite(row.weight) || Number.isFinite(row.fat) || Number.isFinite(row.protein) || Number.isFinite(row.carbs));

  if (rows.length < 2) {
    chart.innerHTML = '<p class="empty-chart">Diagrammet visas när minst två dagar har data.</p>';
    note.textContent = `${selection.notePrefix || "Spara minst två dagar med vikt eller matposter för att se utvecklingen."}${averageNote}`;
    return;
  }

  const width = 640;
  const height = 276;
  const pad = { top: 34, right: 48, bottom: 42, left: 48 };
  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;
  const xFor = (index) => pad.left + (rows.length === 1 ? plotWidth / 2 : (index / (rows.length - 1)) * plotWidth);

  const weightMin = 80;
  const weightMax = 92;
  const gramMax = 200;
  const yWeight = (value) => pad.top + ((weightMax - value) / (weightMax - weightMin)) * plotHeight;
  const yGram = (value) => pad.top + ((gramMax - value) / gramMax) * plotHeight;

  const weightPoints = rows
    .map((row, index) => (Number.isFinite(row.weight) ? { x: xFor(index), y: yWeight(row.weight), value: row.weight } : null))
    .filter(Boolean);
  const fatPoints = rows
    .map((row, index) => (Number.isFinite(row.fat) ? { x: xFor(index), y: yGram(row.fat), value: row.fat } : null))
    .filter(Boolean);
  const proteinPoints = rows
    .map((row, index) => (Number.isFinite(row.protein) ? { x: xFor(index), y: yGram(row.protein), value: row.protein } : null))
    .filter(Boolean);
  const carbPoints = rows
    .map((row, index) => (Number.isFinite(row.carbs) ? { x: xFor(index), y: yGram(row.carbs), value: row.carbs } : null))
    .filter(Boolean);
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const y = pad.top + ratio * plotHeight;
    const leftValue = weightMax - ratio * (weightMax - weightMin);
    const rightValue = gramMax - ratio * gramMax;
    return { y, leftValue, rightValue };
  });
  const carbLimitY = yGram(20);
  const labelIndexes = rows.length <= 5 ? rows.map((_, index) => index) : [0, Math.floor((rows.length - 1) / 2), rows.length - 1];
  const chartDateLabel = (index, labelPosition) => {
    const [, , monthText, dayText] = rows[index].date.match(/^(\d{4})-(\d{2})-(\d{2})$/) || [];
    if (!monthText || !dayText) return rows[index].date.slice(5);
    const month = Number(monthText);
    const day = Number(dayText);
    const previousLabelIndex = labelIndexes[labelPosition - 1];
    const previousLabelMonth = Number(rows[previousLabelIndex]?.date.slice(5, 7));
    return labelPosition === 0 || month !== previousLabelMonth ? `${day}/${month}` : `${day}`;
  };
  const latest = rows.at(-1);

  chart.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" aria-hidden="true">
      <g class="chart-grid">
        ${gridLines
          .map(
            (line) => `
              <line x1="${pad.left}" y1="${line.y.toFixed(1)}" x2="${width - pad.right}" y2="${line.y.toFixed(1)}"></line>
              <text x="${pad.left - 8}" y="${(line.y + 4).toFixed(1)}" text-anchor="end">${decimal(line.leftValue)}</text>
              <text x="${width - pad.right + 8}" y="${(line.y + 4).toFixed(1)}">${Math.round(line.rightValue)}</text>
            `
          )
          .join("")}
      </g>
      <line class="carb-limit-line" x1="${pad.left}" y1="${carbLimitY.toFixed(1)}" x2="${width - pad.right}" y2="${carbLimitY.toFixed(1)}"></line>
      <text class="carb-limit-label" x="${width - pad.right + 8}" y="${(carbLimitY + 4).toFixed(1)}">20</text>
      <line class="chart-axis" x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${height - pad.bottom}"></line>
      <line class="chart-axis" x1="${width - pad.right}" y1="${pad.top}" x2="${width - pad.right}" y2="${height - pad.bottom}"></line>
      <line class="chart-axis" x1="${pad.left}" y1="${height - pad.bottom}" x2="${width - pad.right}" y2="${height - pad.bottom}"></line>
      <path class="chart-line weight-line" d="${chartPath(weightPoints)}"></path>
      <path class="chart-line fat-line" d="${chartPath(fatPoints)}"></path>
      <path class="chart-line protein-line" d="${chartPath(proteinPoints)}"></path>
      <path class="chart-line carb-line" d="${chartPath(carbPoints)}"></path>
      ${weightPoints.map((point) => `<circle class="weight-dot" cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="2.2"></circle>`).join("")}
      ${fatPoints.map((point) => `<circle class="fat-dot" cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="2"></circle>`).join("")}
      ${proteinPoints.map((point) => `<circle class="protein-dot" cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="2"></circle>`).join("")}
      ${carbPoints.map((point) => `<circle class="carb-dot" cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="2"></circle>`).join("")}
      ${labelIndexes
        .map(
          (index, labelPosition) =>
            `<text class="chart-date" x="${xFor(index).toFixed(1)}" y="${height - 14}" text-anchor="middle">${chartDateLabel(index, labelPosition)}</text>`
        )
        .join("")}
      <text class="axis-label" x="${pad.left - 8}" y="22" text-anchor="end">kg</text>
      <text class="axis-label" x="${width - pad.right + 8}" y="22">gram</text>
    </svg>
  `;
  note.textContent = `${selection.notePrefix}Senast i urvalet: ${latest.weight ? `${decimal(latest.weight)} kg, ` : ""}${decimal(latest.fat || 0)} g fett, ${decimal(latest.protein || 0)} g protein, ${decimal(latest.carbs || 0)} g kolhydrater.${averageNote}`;
}

function render(selectedDate = activeDate) {
  const entries = getEntries().sort((a, b) => a.date.localeCompare(b.date));
  const latest = entries.find((entry) => entry.date === selectedDate) || entries.at(-1) || emptyEntry();
  activeDate = latest.date;
  const hasContent = hasEntryContent(latest);
  const macros = estimateMacros(latest);
  const kind = hasContent ? classify(latest, macros) : "ny logg";
  const startWeight = baselineWeight(entries);
  const startDate = entries[0]?.date || latest.date || todayIso();
  const delta = latest.weight && startWeight ? latest.weight - startWeight : 0;
  const goalWeight = getGoalWeight();
  const targets = getMacroTargets();
  const electrolyteTargets = electrolyteTargetsForDate(latest.date, entries, isTrainingEntry(latest));
  const kcalRange = macroKcalRange(targets);
  const toGoal = latest.weight && goalWeight ? latest.weight - goalWeight : 0;

  document.querySelector("#todayDate").textContent = latest.date;
  document.querySelector("#currentWeight").textContent = latest.weight ? decimal(latest.weight) : "--";
  document.querySelector("#deltaWeight").textContent =
    latest.weight && startWeight ? `${delta > 0 ? "+" : ""}${decimal(delta)} kg` : "--";
  document.querySelector("#goalMetricLabel").textContent = goalWeight ? `Till målvikt ${decimal(goalWeight)} kg` : "Till målvikt";
  document.querySelector("#toGoal").textContent = latest.weight && goalWeight ? `${decimal(toGoal)} kg` : "--";
  if (goalInput) goalInput.value = goalWeight ? goalWeight : "";
  if (macroTargetInputs.proteinMin) macroTargetInputs.proteinMin.value = targets.proteinMin;
  if (macroTargetInputs.proteinMax) macroTargetInputs.proteinMax.value = targets.proteinMax;
  if (macroTargetInputs.fatMin) macroTargetInputs.fatMin.value = targets.fatMin;
  if (macroTargetInputs.fatMax) macroTargetInputs.fatMax.value = targets.fatMax;
  if (macroTargetInputs.carbsMin) macroTargetInputs.carbsMin.value = targets.carbsMin;
  if (macroTargetInputs.carbsMax) macroTargetInputs.carbsMax.value = targets.carbsMax;
  if (macroTargetInputs.kcalTarget) macroTargetInputs.kcalTarget.value = targets.kcalTarget;
  if (macroTargetInputs.kcalMax) macroTargetInputs.kcalMax.value = targets.kcalMax;
  const macroTargetKcalNote = document.querySelector("#macroTargetKcalNote");
  if (macroTargetKcalNote) {
    macroTargetKcalNote.textContent =
      `Dessa makron ger ett uppskattat kaloriintag på ${roundedKcal(kcalRange.min)} till ${roundedKcal(kcalRange.max)} kcal och ${fatEnergyShareLabel(targets, kcalRange)} av det totala kaloriintaget utgörs av fett. Dagens energimål är ${targets.kcalTarget} kcal; ${targets.kcalMax} kcal är övre gräns.`;
  }
  const marker = macros.source === "manual" ? "" : "~";
  document.querySelector("#carbMetric").textContent = hasContent ? `${marker}${decimal(macros.carbs)} g` : "--";
  document.querySelector("#fatMetric").textContent = hasContent ? `${marker}${macros.fatPct}%` : "--";
  const alcoholKcal = Math.round(macros.alcohol || 0);
  const energyMetricLabel = document.querySelector("#energyMetricLabel");
  if (energyMetricLabel) {
    energyMetricLabel.textContent = hasContent
      ? `Dagens energiintag (varav alkh. ${alcoholKcal} kcal)`
      : "Dagens energiintag";
  }
  document.querySelector("#energyMetric").textContent = hasContent ? `${marker}${Math.round(macros.kcal)} kcal` : "--";
  if (omegaRatioOutput) {
    omegaRatioOutput.textContent = hasContent ? omegaRatioLabel(macros) : "--";
  }
  const measureWarning = macros.unresolvedMeasures?.length
    ? `Kontrollera mängd: ${macros.unresolvedMeasures.join("; ")} kunde inte beräknas och ingår inte i summeringen.`
    : "";
  document.querySelector("#coachLine").textContent = hasContent
    ? measureWarning || coach(latest, macros, kind)
    : "Fyll i dagens mat, vikt, sömn och vätska så börjar coachningen.";
  const compass = document.querySelector("#dinnerCompass");
  const compassText = document.querySelector("#dinnerCompassText");
  if (compass) {
    const compassMessage = hasContent ? dinnerCompass(latest) : null;
    compass.hidden = !compassMessage;
    if (compassText) compassText.innerHTML = compassMessage ? dinnerCompassMarkup(compassMessage) : "";
  }

  const badge = document.querySelector("#strictnessBadge");
  badge.textContent = kind;
  badge.className = `badge ${kind === "strikt keto" ? "strict" : kind === "riskzon" ? "risk" : ""}`;
  document.querySelector("#fatBar").style.width = `${Math.min(macros.fatPct, 100)}%`;
  document.querySelector("#proteinBar").style.width = `${Math.min(macros.proteinPct, 100)}%`;
  document.querySelector("#carbBar").style.width = `${Math.min(macros.carbPct, 100)}%`;
  document.querySelector("#proteinGramBar").style.width = `${Math.min((macros.protein / targets.proteinMax) * 100, 100)}%`;
  document.querySelector("#fatGramBar").style.width = `${Math.min((macros.fat / targets.fatMax) * 100, 100)}%`;
  document.querySelector("#carbGramBar").style.width = `${Math.min((macros.carbs / targets.carbsMax) * 100, 100)}%`;
  document.querySelector("#proteinTargetLabel").textContent = `Protein mot ${targetRangeLabel(targets.proteinMin, targets.proteinMax)} g`;
  document.querySelector("#fatTargetLabel").textContent = `Fett mot ${targetRangeLabel(targets.fatMin, targets.fatMax)} g`;
  document.querySelector("#carbTargetLabel").textContent = `Kolhydrater mot ${targetRangeLabel(targets.carbsMin, targets.carbsMax)} g`;
  document.querySelector("#fatText").textContent = hasContent ? `${macros.fatPct}%` : "--";
  document.querySelector("#proteinText").textContent = hasContent ? `${macros.proteinPct}%` : "--";
  document.querySelector("#carbText").textContent = hasContent ? `${macros.carbPct}%` : "--";
  document.querySelector("#proteinGramText").textContent = hasContent ? `${decimal(macros.protein)} g` : "--";
  document.querySelector("#fatGramText").textContent = hasContent ? `${decimal(macros.fat)} g` : "--";
  document.querySelector("#carbGramText").textContent = hasContent ? `${decimal(macros.carbs)} g` : "--";
  document.querySelector("#sodiumTargetLabel").textContent = `Natrium mot ${electrolyteRangeLabel(electrolyteTargets.sodiumMg)} mg`;
  document.querySelector("#potassiumTargetLabel").textContent = `Kalium mot ${electrolyteRangeLabel(electrolyteTargets.potassiumMg)} mg`;
  document.querySelector("#magnesiumTargetLabel").textContent = `Magnesium mot ${electrolyteRangeLabel(electrolyteTargets.magnesiumMg)} mg`;
  document.querySelector("#sodiumBar").style.width = `${Math.min((macros.sodiumMg / electrolyteTargets.sodiumMg[0]) * 100, 100)}%`;
  document.querySelector("#potassiumBar").style.width = `${Math.min((macros.potassiumMg / electrolyteTargets.potassiumMg[0]) * 100, 100)}%`;
  document.querySelector("#magnesiumBar").style.width = `${Math.min((macros.magnesiumMg / electrolyteTargets.magnesiumMg[0]) * 100, 100)}%`;
  document.querySelector("#sodiumText").textContent = hasContent ? `${Math.round(macros.sodiumMg)} mg` : "--";
  document.querySelector("#potassiumText").textContent = hasContent ? `${Math.round(macros.potassiumMg)} mg` : "--";
  document.querySelector("#magnesiumText").textContent = hasContent ? `${Math.round(macros.magnesiumMg)} mg` : "--";
  const phaseExtra = electrolyteTargets.trainingAddition ? " Motion: +500 mg natrium." : "";
  document.querySelector("#electrolyteNote").textContent = hasContent
    ? `${electrolyteTargets.label} från start ${electrolyteTargets.startDate}.${phaseExtra} Elektrolyter uppskattas från kända poster.`
    : `${electrolyteTargets.label} från start ${electrolyteTargets.startDate}.${phaseExtra} Fyll i mat och dryck för uppskattad elektrolytbild.`;
  document.querySelectorAll("[data-electrolyte-phase]").forEach((row) => {
    row.classList.toggle("active-phase", row.dataset.electrolytePhase === electrolyteTargets.label);
  });
  const phasePeriods = [
    phaseRangeText(electrolyteTargets.startDate, 0, 6),
    phaseRangeText(electrolyteTargets.startDate, 7, 13),
    phaseRangeText(electrolyteTargets.startDate, 14, 20),
    phaseRangeText(electrolyteTargets.startDate, 21, null),
  ];
  document.querySelectorAll(".phase-period").forEach((period, index) => {
    period.textContent = phasePeriods[index] || "";
  });
  document.querySelector("#macroNote").textContent =
    macros.source === "manual"
      ? "Makron bygger på manuellt inmatade gram för fett, protein och kolhydrater."
      : measureWarning
        ? measureWarning
      : macros.alcohol > 0
        ? "Övre staplarna visar kaloriprocent. Alkohol ger energi men visas inte som fett, protein eller kolhydrater."
        : `Automatisk uppskattning. Personligt mål: ${targetRangeLabel(targets.proteinMin, targets.proteinMax)} g protein, ${targetRangeLabel(targets.fatMin, targets.fatMax)} g fett, ${targetRangeLabel(targets.carbsMin, targets.carbsMax)} g kolhydrater (${roundedKcal(kcalRange.min)}-${roundedKcal(kcalRange.max)} kcal). Energimål ${targets.kcalTarget} kcal, max ${targets.kcalMax} kcal.`;
  renderMacroBreakdown(macros, hasContent);
  renderElectrolyteBreakdown(macros, hasContent);
  renderTrendChart(entries);

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
    if (input instanceof NodeList) {
      input.forEach((option) => {
        option.checked = option.value === (entry[key] ?? "");
      });
    } else {
      input.value = entry[key] ?? "";
    }
  }
  if (goalInput) goalInput.value = getGoalWeight() || "";
  const targets = getMacroTargets();
  if (macroTargetInputs.proteinMin) macroTargetInputs.proteinMin.value = targets.proteinMin;
  if (macroTargetInputs.proteinMax) macroTargetInputs.proteinMax.value = targets.proteinMax;
  if (macroTargetInputs.fatMin) macroTargetInputs.fatMin.value = targets.fatMin;
  if (macroTargetInputs.fatMax) macroTargetInputs.fatMax.value = targets.fatMax;
  if (macroTargetInputs.carbsMin) macroTargetInputs.carbsMin.value = targets.carbsMin;
  if (macroTargetInputs.carbsMax) macroTargetInputs.carbsMax.value = targets.carbsMax;
  if (macroTargetInputs.kcalTarget) macroTargetInputs.kcalTarget.value = targets.kcalTarget;
  if (macroTargetInputs.kcalMax) macroTargetInputs.kcalMax.value = targets.kcalMax;
}

function setSaveStatus(message, isError = false) {
  const status = document.querySelector("#saveStatus");
  status.textContent = message;
  status.classList.toggle("error", isError);
}

function saveCurrentEntry(options = {}) {
  const entry = formEntry();
  if (goalInput) saveGoalWeight(goalInput.value.trim());
  if (Object.values(macroTargetInputs).some(Boolean)) saveMacroTargets(currentMacroTargetInputs());
  activeDate = entry.date;
  const entries = getEntries().filter((item) => item.date !== entry.date);
  entries.push(entry);
  saveEntries(entries);
  render(entry.date);
  fillForm(entry);
  if (weeklyCheckinPanel && !weeklyCheckinPanel.hidden) fillWeeklyCheckin();
  if (options.silent) return;
  setSaveStatus(`Sparat ${nowStamp()} · dag ${entry.date}`);
}

function queueAutosave() {
  window.clearTimeout(autosaveTimer);
  autosaveTimer = window.setTimeout(() => {
    saveCurrentEntry({ silent: true });
    setSaveStatus(`Autosparat ${nowStamp()} · dag ${activeDate || todayIso()}`);
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

function mealReportRows(entry) {
  const meals = [
    ["Frukost", "breakfast"],
    ["Lunch", "lunch"],
    ["Middag", "dinner"],
    ["Övrigt matintag", "extras"],
  ];
  return meals.map(([label, key]) => {
    const text = entry[key] || "";
    const mealEntry = emptyEntry(entry.date);
    mealEntry[key] = text;
    const macros = text.trim() ? estimateMacros(mealEntry) : { kcal: 0, fat: 0, carbs: 0, protein: 0 };
    return { label, text, macros };
  });
}

function dailyReportData(entry) {
  const rows = mealReportRows(entry).map((row) => ({
    label: row.label,
    text: row.text,
    kcal: row.macros.kcal,
    fat: row.macros.fat,
    carbs: row.macros.carbs,
    protein: row.macros.protein,
  }));
  const totals = rows.reduce(
    (sum, row) => ({
      kcal: sum.kcal + row.kcal,
      fat: sum.fat + row.fat,
      carbs: sum.carbs + row.carbs,
      protein: sum.protein + row.protein,
    }),
    { kcal: 0, fat: 0, carbs: 0, protein: 0 }
  );
  return { kind: "daily", entry, rows, totals, generatedAt: nowStamp(), version: appDisplayVersion };
}

function openDailyReport() {
  const entry = formEntry();
  openReport(dailyReportData(entry), { date: entry.date });
  setSaveStatus(`Rapport skapad för ${entry.date}`);
}

function numberFromFreeText(text) {
  const match = String(text || "").replace(",", ".").match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : NaN;
}

function mode(values) {
  const counts = new Map();
  for (const value of values.filter(Boolean)) {
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] || "--";
}

function sleepMode(values) {
  return mode(values.map((value) => (value === "-6 timmar" || value === "+6 timmar" ? "6 timmar" : value)));
}

function average(values) {
  const valid = values.filter((value) => Number.isFinite(value));
  if (valid.length === 0) return null;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function entriesForWeek(year, week) {
  const range = weekRange(year, week);
  const current = formEntry();
  const entries = getEntries().filter((entry) => entry.date !== current.date);
  entries.push(current);
  return {
    range,
    entries: entries
      .filter((entry) => entry.date >= range.start && entry.date <= range.end && hasEntryContent(entry))
      .sort((a, b) => a.date.localeCompare(b.date)),
  };
}

function weeklyReportData(year, week) {
  const { range, entries } = entriesForWeek(year, week);
  const weekKey = `${year}-${String(week).padStart(2, "0")}`;
  const checkin = getWeeklyCheckins()[weekKey] || null;
  const weightAverage = average(entries.map((entry) => (Number(entry.weight) > 0 ? Number(entry.weight) : NaN)));
  const waistAverage = average(entries.map((entry) => (Number(entry.waist) > 0 ? Number(entry.waist) : NaN)));
  const bellyAverage = average(entries.map((entry) => (Number(entry.belly) > 0 ? Number(entry.belly) : NaN)));
  const meals = [
    ["Frukost", "breakfast"],
    ["Lunch", "lunch"],
    ["Middag", "dinner"],
    ["Övrigt matintag", "extras"],
  ];
  const rows = meals.map(([label, key]) => {
    const macros = entries
      .filter((entry) => (entry[key] || "").trim())
      .map((entry) => {
        const mealEntry = emptyEntry(entry.date);
        mealEntry[key] = entry[key];
        return estimateMacros(mealEntry);
      });
    return {
      label,
      count: macros.length,
      kcal: average(macros.map((item) => item.kcal)),
      fat: average(macros.map((item) => item.fat)),
      carbs: average(macros.map((item) => item.carbs)),
      protein: average(macros.map((item) => item.protein)),
    };
  });
  const waterAverage = average(entries.map((entry) => numberFromFreeText(entry.water)));
  const coffeeAverage = average(entries.map((entry) => numberFromFreeText(entry.coffee)));
  const bloodGlucoseAverage = average(entries.map((entry) => (entry.bloodGlucose === "" ? NaN : Number(entry.bloodGlucose))));
  const ketonesAverage = average(entries.map((entry) => (entry.ketones === "" ? NaN : Number(entry.ketones))));
  const totals = rows.reduce(
    (sum, row) => ({
      kcal: sum.kcal + (row.kcal || 0),
      fat: sum.fat + (row.fat || 0),
      carbs: sum.carbs + (row.carbs || 0),
      protein: sum.protein + (row.protein || 0),
    }),
    { kcal: 0, fat: 0, carbs: 0, protein: 0 }
  );
  return {
    kind: "weekly",
    year,
    week,
    checkin,
    weightAverage,
    waistAverage,
    bellyAverage,
    range,
    days: entries.length,
    rows,
    totals,
    sleepMode: sleepMode(entries.map((entry) => entry.sleep)),
    walkMode: mode(entries.map((entry) => entry.walk || "Ingen")),
    motionMode: mode(entries.map((entry) => entry.motion || "Ingen")),
    waterAverage,
    coffeeAverage,
    bloodGlucoseAverage,
    ketonesAverage,
    generatedAt: nowStamp(),
    version: appDisplayVersion,
  };
}

function openReport(data, params = {}) {
  const reportPayload = JSON.stringify(data);
  localStorage.setItem("btk.dailyReport.v1", reportPayload);
  sessionStorage.setItem("btk.dailyReport.v1", reportPayload);
  const reportUrl = new URL("report.html", window.location.href);
  for (const [key, value] of Object.entries(params)) {
    reportUrl.searchParams.set(key, value);
  }
  reportUrl.searchParams.set("v", appVersion);
  window.location.assign(reportUrl.toString());
}

function openWeekReport() {
  const suggested = weekInputFromDate(fields.date.value || todayIso());
  const answer = window.prompt("Ange vecka som ÅÅÅÅ-VV, t.ex. 2026-21", suggested);
  if (answer === null) return;
  const parsed = parseWeekInput(answer);
  if (!parsed) {
    setSaveStatus("Veckan kunde inte tolkas. Använd formatet ÅÅÅÅ-VV, t.ex. 2026-21.", true);
    return;
  }
  const report = weeklyReportData(parsed.year, parsed.week);
  openReport(report, { week: `${parsed.year}-${String(parsed.week).padStart(2, "0")}` });
  setSaveStatus(`Veckorapport skapad för vecka ${parsed.week}, ${parsed.year}`);
}

reportButton?.addEventListener("click", openDailyReport);
weekReportButton?.addEventListener("click", openWeekReport);
weeklyCheckinButton?.addEventListener("click", () => {
  if (!weeklyCheckinPanel) return;
  const willOpen = weeklyCheckinPanel.hidden;
  weeklyCheckinPanel.hidden = !willOpen;
  weeklyCheckinButton?.classList.toggle("active", willOpen);
  if (willOpen) fillWeeklyCheckin();
});
saveWeeklyCheckinButton?.addEventListener("click", saveCurrentWeeklyCheckin);
electrolyteInfoButton?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
});

function printTrendChart() {
  document.querySelector(".trend-panel details")?.setAttribute("open", "");
  document.body.classList.add("print-trend");
  const cleanup = () => document.body.classList.remove("print-trend");
  window.addEventListener("afterprint", cleanup, { once: true });
  window.print();
  window.setTimeout(cleanup, 1500);
}

async function saveTrendPng() {
  const svg = document.querySelector("#trendChart svg");
  if (!svg) {
    setSaveStatus("Det finns inget tidsseriediagram att spara ännu.", true);
    return;
  }
  const clone = svg.cloneNode(true);
  const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
  style.textContent = `
    .chart-grid line{stroke:#e9dfcf;stroke-width:1}
    .chart-grid text,.carb-limit-label,.chart-date,.axis-label{fill:#69736d;font-size:13px;font-weight:400;stroke:none}
    .carb-limit-line{stroke:#d9cfbf;stroke-width:1;stroke-dasharray:4 5}
    .chart-axis{stroke:#d5cabb;stroke-width:1.4}
    .chart-line{fill:none;stroke-linecap:round;stroke-linejoin:round;stroke-width:2.4}
    .weight-line{stroke:#2563eb}.fat-line{stroke:#274a3c;stroke-dasharray:7 5}.protein-line{stroke:#8d3756;stroke-dasharray:7 5}.carb-line{stroke:#c9953d;stroke-dasharray:7 5}
    .weight-dot{fill:transparent;stroke:#2563eb;stroke-width:1.15}.fat-dot{fill:transparent;stroke:#274a3c;stroke-width:1.05}.protein-dot{fill:transparent;stroke:#8d3756;stroke-width:1.05}.carb-dot{fill:transparent;stroke:#c9953d;stroke-width:1.05}
  `;
  clone.insertBefore(style, clone.firstChild);
  const serialized = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([serialized], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const image = new Image();
  const width = Number(svg.viewBox.baseVal.width || 640);
  const height = Number(svg.viewBox.baseVal.height || 276);
  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = width * 2;
    canvas.height = height * 2;
    const context = canvas.getContext("2d");
    context.fillStyle = "#fffaf2";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.scale(2, 2);
    context.drawImage(image, 0, 0, width, height);
    canvas.toBlob((pngBlob) => {
      URL.revokeObjectURL(url);
      if (!pngBlob) {
        setSaveStatus("PNG-exporten fungerade inte i den här browsern.", true);
        return;
      }
      const link = document.createElement("a");
      const datePart = activeDate || todayIso();
      link.href = URL.createObjectURL(pngBlob);
      link.download = `btk-tidsserie-${datePart}.png`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      setSaveStatus("Tidsseriediagram sparat som PNG.");
    }, "image/png");
  };
  image.onerror = () => {
    URL.revokeObjectURL(url);
    setSaveStatus("PNG-exporten fungerade inte i den här browsern.", true);
  };
  image.src = url;
}

printTrendButton?.addEventListener("click", printTrendChart);
saveTrendPngButton?.addEventListener("click", saveTrendPng);

function updateTrendFilterState() {
  const suggestedWeek = weekInputFromDate(fields.date.value || activeDate || todayIso());
  if (trendStartWeekInput && !trendStartWeekInput.value) trendStartWeekInput.value = suggestedWeek;
  if (trendEndWeekInput && !trendEndWeekInput.value) trendEndWeekInput.value = suggestedWeek;
  if (trendEndWeekInput) {
    trendEndWeekInput.disabled = trendModeInput?.value !== "weeks";
  }
}

function rerenderTrendFilter() {
  updateTrendFilterState();
  render(activeDate);
}

trendModeInput?.addEventListener("change", rerenderTrendFilter);
trendStartWeekInput?.addEventListener("change", rerenderTrendFilter);
trendEndWeekInput?.addEventListener("change", rerenderTrendFilter);

fields.date.addEventListener("change", () => {
  const date = fields.date.value || todayIso();
  const existing = findEntry(date);
  fillForm(existing || emptyEntry(date));
  if (weeklyCheckinPanel && !weeklyCheckinPanel.hidden) fillWeeklyCheckin();
  updateTrendFilterState();
  render(date);
  setSaveStatus(existing ? `Visar sparad rad för ${date}` : `Ny tom rad för ${date}`);
});

form.addEventListener("input", (event) => {
  if (event.target === goalInput) return;
  if (Object.values(macroTargetInputs).includes(event.target)) return;
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

function currentMacroTargetInputs() {
  return {
    proteinMin: macroTargetInputs.proteinMin?.value,
    proteinMax: macroTargetInputs.proteinMax?.value,
    fatMin: macroTargetInputs.fatMin?.value,
    fatMax: macroTargetInputs.fatMax?.value,
    carbsMin: macroTargetInputs.carbsMin?.value,
    carbsMax: macroTargetInputs.carbsMax?.value,
    kcalTarget: macroTargetInputs.kcalTarget?.value,
    kcalMax: macroTargetInputs.kcalMax?.value,
  };
}

for (const input of Object.values(macroTargetInputs)) {
  input?.addEventListener("change", () => {
    const targets = saveMacroTargets(currentMacroTargetInputs());
    render(activeDate);
    setSaveStatus(
      `Makromål sparade: ${targetRangeLabel(targets.proteinMin, targets.proteinMax)} g protein, ${targetRangeLabel(targets.fatMin, targets.fatMax)} g fett, ${targetRangeLabel(targets.carbsMin, targets.carbsMax)} g kolhydrater; energimål ${targets.kcalTarget} kcal, max ${targets.kcalMax} kcal`
    );
  });

  input?.addEventListener("input", () => {
    saveMacroTargets(currentMacroTargetInputs());
    render(activeDate);
  });
}

document.querySelector("#blankLinkButton").addEventListener("click", async () => {
  const appUrl = stableAppUrl();
  await navigator.clipboard.writeText(appUrl);
  document.querySelector("#toolsNote").textContent = "App-länk kopierad. Den öppnar senaste publicerade versionen; lokala loggar och inställningar följer inte med länken.";
});

function setSyncStatus(message, isError = false) {
  if (syncStatus) {
    syncStatus.textContent = message;
    syncStatus.classList.toggle("error", isError);
  }
  if (quickSyncStatus) {
    quickSyncStatus.textContent = message;
    quickSyncStatus.classList.toggle("error", isError);
  }
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
  const payload = {
    sync_key: syncCode,
    profile_entries: getEntries(),
    profile_goal_weight: getGoalWeight(),
    profile_macro_targets: getMacroTargets(),
    profile_weekly_checkins: getWeeklyCheckins(),
  };
  let { error } = await supabaseRpc("keto_sync_push", payload);
  if (error && /profile_macro_targets|profile_weekly_checkins|function public\.keto_sync_push|Could not find the function/i.test(error.message || "")) {
    const fallback = await supabaseRpc("keto_sync_push", {
      sync_key: payload.sync_key,
      profile_entries: payload.profile_entries,
      profile_goal_weight: payload.profile_goal_weight,
    });
    error = fallback.error;
  }
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
  if (row.macro_targets) {
    localStorage.setItem(macroTargetsKey, JSON.stringify(normalizeMacroTargets(row.macro_targets)));
  }
  if (row.weekly_checkins) {
    saveWeeklyCheckins(row.weekly_checkins);
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

async function checkForAppUpdate() {
  try {
    const response = await fetch(`./version.json?ts=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) return;
    const latest = await response.json();
    const latestVersion = Number(latest?.version);
    const currentVersion = Number(appVersion);
    if (!latestVersion || latestVersion <= currentVersion) return;
    const currentCacheVersion = Number(new URL(window.location.href).searchParams.get("cache"));
    if (currentCacheVersion === latestVersion) {
      document.querySelector(".version-pill").textContent = `${appDisplayVersion} · ladda om appen`;
      return;
    }
    const target = new URL("./", window.location.href);
    target.searchParams.set("cache", String(latestVersion));
    document.querySelector(".version-pill").textContent = `${appDisplayVersion} -> build ${latestVersion}`;
    window.setTimeout(() => {
      window.location.replace(target.toString());
    }, 700);
  } catch {
    // Version checks should never interrupt logging.
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
quickSyncButton?.addEventListener("click", syncNow);

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
    if (imported.macroTargets) saveMacroTargets(imported.macroTargets);
    if (imported.weeklyCheckins) saveWeeklyCheckins(imported.weeklyCheckins);
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
  localStorage.removeItem(macroTargetsKey);
  localStorage.removeItem(weeklyCheckinsKey);
  fillForm(emptyEntry());
  render();
});

document.querySelector("#exportButton").addEventListener("click", async () => {
  const payload = JSON.stringify({ entries: getEntries(), goalWeight: getGoalWeight(), macroTargets: getMacroTargets(), weeklyCheckins: getWeeklyCheckins() }, null, 2);
  await navigator.clipboard.writeText(payload);
  document.querySelector("#coachLine").textContent = "Data kopierad. Den kan importeras i appen på en annan enhet.";
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  });
}

const initialEntry = getEntries().at(-1) || emptyEntry();
renderFoodList();
fillForm(initialEntry);
updateTrendFilterState();
render(initialEntry.date);
initSync();
checkForAppUpdate();

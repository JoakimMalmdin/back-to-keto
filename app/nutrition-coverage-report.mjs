import {
  DEFAULT_LOCALE,
  NUTRITION_CATALOG,
  UNIT_DEFINITIONS,
  categoryName,
  foodName,
} from "./nutrition-catalog.mjs";
import {
  NUTRITION_SELECTION,
  SELECTION_STATUSES,
  SOURCE_INTENTS,
} from "./nutrition-selection.mjs";
import { pathToFileURL } from "node:url";

const STATUS_LABELS = Object.freeze({
  covered: "Klar",
  needsOfficialMatch: "SLV-matchning krävs",
  needsLabel: "Etikett krävs",
  missing: "Saknas",
});

function catalogueMap() {
  return new Map(NUTRITION_CATALOG.map((food) => [food.id, food]));
}

function rowStatus(selection, food) {
  if (food) return "covered";
  if (selection.sourceIntent === SOURCE_INTENTS.livsmedelsverket) return "needsOfficialMatch";
  if (
    selection.status === SELECTION_STATUSES.labelNeeded ||
    selection.status === SELECTION_STATUSES.labelToMigrate
  ) {
    return "needsLabel";
  }
  return "missing";
}

function measuresForFood(food, locale) {
  if (!food) return "-";
  const declared = food.measures.map((entry) => UNIT_DEFINITIONS[entry.unit].labels[locale]);
  return ["g", ...declared].filter((entry, index, entries) => entries.indexOf(entry) === index).join(", ");
}

export function nutritionCoverageRows(locale = DEFAULT_LOCALE) {
  const catalogue = catalogueMap();
  return NUTRITION_SELECTION.map((selection) => {
    const food = selection.existingCatalogId ? catalogue.get(selection.existingCatalogId) : null;
    const status = rowStatus(selection, food);
    return Object.freeze({
      id: selection.id,
      name: food ? foodName(food, locale) : selection.names[locale],
      category: categoryName(selection.category, locale),
      priority: selection.priority,
      status,
      statusLabel: STATUS_LABELS[status],
      source: food?.macroSource?.type || selection.sourceIntent,
      measures: measuresForFood(food, locale),
      note: selection.note || "",
    });
  });
}

export function nutritionCoverageSummary(locale = DEFAULT_LOCALE) {
  const rows = nutritionCoverageRows(locale);
  return [1, 2, 3].map((priority) => {
    const cohort = rows.filter((row) => row.priority === priority);
    const covered = cohort.filter((row) => row.status === "covered");
    return Object.freeze({
      priority,
      total: cohort.length,
      covered: covered.length,
      remaining: cohort.length - covered.length,
      missingIds: cohort.filter((row) => row.status !== "covered").map((row) => row.id),
    });
  });
}

function markdownRow(values) {
  return `| ${values.map((value) => String(value).replaceAll("|", "\\|")).join(" | ")} |`;
}

export function renderNutritionCoverageMarkdown(locale = DEFAULT_LOCALE) {
  const rows = nutritionCoverageRows(locale);
  const summary = nutritionCoverageSummary(locale);
  const output = [
    "# Täckningsrapport för mastermotorn",
    "",
    "Rapporten jämför migreringsurvalet med den kanoniska livsmedelskatalogen.",
    "Livsmedel som inte är klara ska inte påverka publika beräkningar.",
    "",
    "## Sammanfattning",
    "",
    markdownRow(["Prioritet", "Klara", "Totalt", "Kvar"]),
    markdownRow(["---", "---:", "---:", "---:"]),
    ...summary.map((entry) => markdownRow([entry.priority, entry.covered, entry.total, entry.remaining])),
  ];

  for (const priority of [1, 2, 3]) {
    output.push("", `## Prioritet ${priority}`, "");
    output.push(markdownRow(["Livsmedel", "Status", "Källa", "Mått", "Kommentar"]));
    output.push(markdownRow(["---", "---", "---", "---", "---"]));
    for (const row of rows.filter((entry) => entry.priority === priority)) {
      output.push(markdownRow([row.name, row.statusLabel, row.source, row.measures, row.note]));
    }
  }

  return `${output.join("\n")}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.stdout.write(renderNutritionCoverageMarkdown());
}

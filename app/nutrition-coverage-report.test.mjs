import { nutritionCoverageRows, nutritionCoverageSummary } from "./nutrition-coverage-report.mjs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const summary = nutritionCoverageSummary();
const core = summary.find((entry) => entry.priority === 1);
assert(core.total === 35, "Kärnurvalets storlek ska vara stabil under migreringen.");
assert(core.covered === 34, "Kärnurvalet ska bara ha en kvarvarande lucka efter köttfärsbiff.");
assert(core.missingIds.length === 1 && core.missingIds[0] === "notfars", "Nötfärs ska vara synlig kärnblockering tills fetthalt har valts.");

const patty = nutritionCoverageRows().find((entry) => entry.id === "kottfarsbiff");
assert(patty.status === "covered", "Köttfärsbiff ska redovisas som katalogtäckt.");
assert(patty.measures.includes("st"), "Rapporten ska visa att köttfärsbiff kan anges styckevis.");

console.log("Nutrition coverage report verified: core blockers and measure readiness are visible.");

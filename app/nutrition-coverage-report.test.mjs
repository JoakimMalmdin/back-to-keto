import { nutritionCoverageRows, nutritionCoverageSummary } from "./nutrition-coverage-report.mjs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const summary = nutritionCoverageSummary();
const core = summary.find((entry) => entry.priority === 1);
assert(core.total === 39, "Kärnurvalet ska särredovisa färsvarianter med olika fetthalt.");
assert(core.covered === 37, "Kärnurvalet ska ha officiella 10/15%-färser och aktiv inmatningsspärr.");
assert(core.missingIds.join(",") === "notfars-12,notfars-20", "Färsvarianter utan verifierad källa ska förbli synliga luckor.");

const mincedBeef = nutritionCoverageRows().find((entry) => entry.id === "notfars-fat-required");
assert(mincedBeef.status === "inputRule", "Rapporten ska visa att färsspärren är en regel, inte en näringspost.");
assert(mincedBeef.note.includes("inte beräknas"), "Rapporten ska påminna om att färsfett inte får gissas.");

const patty = nutritionCoverageRows().find((entry) => entry.id === "kottfarsbiff");
assert(patty.status === "covered", "Köttfärsbiff ska redovisas som katalogtäckt.");
assert(patty.measures.includes("st"), "Rapporten ska visa att köttfärsbiff kan anges styckevis.");

console.log("Nutrition coverage report verified: core blockers and measure readiness are visible.");

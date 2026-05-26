import { nutritionCoverageRows, nutritionCoverageSummary } from "./nutrition-coverage-report.mjs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const summary = nutritionCoverageSummary();
const core = summary.find((entry) => entry.priority === 1);
assert(core.total === 41, "Kärnurvalet ska särredovisa verifierade produktposter och färsvarianter.");
assert(core.covered === 40, "Kärnurvalet ska ha aktiv inmatningsspärr samt beräkningsbar, markerad 12%-schablon.");
assert(core.missingIds.join(",") === "notfars-20", "Endast färsvariant som ännu saknar beräkningspost ska förbli synlig lucka.");

const mincedBeef = nutritionCoverageRows().find((entry) => entry.id === "notfars-fat-required");
assert(mincedBeef.status === "inputRule", "Rapporten ska visa att färsspärren är en regel, inte en näringspost.");
assert(mincedBeef.note.includes("inte beräknas"), "Rapporten ska påminna om att färsfett inte får gissas.");

const patty = nutritionCoverageRows().find((entry) => entry.id === "kottfarsbiff");
assert(patty.status === "covered", "Köttfärsbiff ska redovisas som katalogtäckt.");
assert(patty.measures.includes("st"), "Rapporten ska visa att köttfärsbiff kan anges styckevis.");

const meatballs = nutritionCoverageRows().find((entry) => entry.id === "matriket-svenska-kottbullar-73");
assert(meatballs.status === "covered", "Matriket-köttbullar ska redovisas som etikettverifierade.");
assert(meatballs.measures === "g", "Matriket-köttbullar ska inte visa ett obekräftat styckmått.");

console.log("Nutrition coverage report verified: core blockers and measure readiness are visible.");

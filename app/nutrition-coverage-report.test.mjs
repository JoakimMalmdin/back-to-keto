import { nutritionCoverageRows, nutritionCoverageSummary } from "./nutrition-coverage-report.mjs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const summary = nutritionCoverageSummary();
const core = summary.find((entry) => entry.priority === 1);
assert(core.total === 40, "Kärnurvalet ska särredovisa verifierade produktposter och färsvarianter.");
assert(core.covered === 38, "Kärnurvalet ska ha etikettverifierade köttbullar, officiella 10/15%-färser och aktiv inmatningsspärr.");
assert(core.missingIds.join(",") === "notfars-12,notfars-20", "Färsvarianter utan verifierad källa ska förbli synliga luckor.");

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

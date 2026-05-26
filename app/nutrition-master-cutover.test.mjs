import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const appSource = await readFile(new URL("./app.js", import.meta.url), "utf8");
const htmlSource = await readFile(new URL("./index.html", import.meta.url), "utf8");

assert.ok(appSource.includes("return estimateMasterMacros(entry);"), "Daily calculations must use the master engine.");
assert.ok(appSource.includes("renderFoodList();"), "The visible food list must be generated from master data.");
assert.ok(htmlSource.includes('id="foodListGrid"'), "The master catalogue container must be present.");
assert.ok(appSource.includes("function isIncludedInTrendAverages(entry)"), "Trend averages must have an explicit same-day completion rule.");
assert.ok(appSource.includes("[entry.breakfast, entry.lunch, entry.dinner].every"), "Today's trend average must require three logged meals.");
assert.ok(htmlSource.includes("idag när frukost, lunch och middag är loggade"), "The trend average explanation must describe when today is counted.");

for (const legacyFragment of ["const foodSignals", "electrolyteSignalUpdates", "additionalFoodSignals", "masterComparison"]) {
  assert.ok(!appSource.includes(legacyFragment), `Legacy calculation fragment remains in app.js: ${legacyFragment}`);
}

assert.ok(!htmlSource.includes("Matriket svenska köttbullar 73% kött:"), "The food list must not be duplicated as static HTML.");

console.log("Master cutover verified: calculations and catalogue display have one data source.");

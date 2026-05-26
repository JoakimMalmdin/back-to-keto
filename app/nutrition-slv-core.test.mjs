import { NUTRITION_SELECTION, SOURCE_INTENTS } from "./nutrition-selection.mjs";
import { SLV_CORE_RESOLVED, SLV_CORE_REVIEW, SLV_SOURCE } from "./nutrition-slv-core.mjs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const expected = NUTRITION_SELECTION.filter((food) => food.priority === 1 && food.sourceIntent === SOURCE_INTENTS.livsmedelsverket);
const coveredIds = new Set([...SLV_CORE_RESOLVED, ...SLV_CORE_REVIEW].map((food) => food.selectionId));

assert(SLV_SOURCE.authority.includes("Livsmedelsverket"), "Officiell källangivelse saknas.");
assert(SLV_SOURCE.licence === "CC BY 4.0", "API-licens ska anges.");
assert(new Set(SLV_CORE_RESOLVED.map((food) => food.selectionId)).size === SLV_CORE_RESOLVED.length, "Dubbel SLV-matchning finns.");

for (const item of expected) {
  assert(coveredIds.has(item.id), `Kärnpost saknar SLV-beslut: ${item.id}`);
}

for (const food of SLV_CORE_RESOLVED) {
  assert(Number.isInteger(food.slvFoodNumber), `Livsmedelsnummer saknas: ${food.selectionId}`);
  for (const key of ["kcal", "fat", "protein", "carbs", "fiber", "sodiumMg", "potassiumMg", "magnesiumMg"]) {
    assert(Number.isFinite(food.nutrientsPer100g[key]), `${key} saknas: ${food.selectionId}`);
  }
}

const avocado = SLV_CORE_RESOLVED.find((food) => food.selectionId === "avokado");
assert(avocado.slvFoodNumber === 320, "Avokado ska matcha officiell post 320.");
assert(avocado.nutrientsPer100g.potassiumMg === 600, "Avokado ska använda SLV:s kaliumvärde.");
assert(avocado.nutrientsPer100g.fiber === 4.8, "Avokado ska använda SLV:s fibervärde.");
const mincedBeef10 = SLV_CORE_RESOLVED.find((food) => food.selectionId === "notfars-10");
const mincedBeef15 = SLV_CORE_RESOLVED.find((food) => food.selectionId === "notfars-15");
assert(mincedBeef10.slvFoodNumber === 951 && mincedBeef10.nutrientsPer100g.fat === 11.3, "Nötfärs 10% ska använda officiell post 951.");
assert(mincedBeef15.slvFoodNumber === 963 && mincedBeef15.nutrientsPer100g.fat === 15, "Nötfärs 15% ska använda officiell post 963.");
assert(SLV_CORE_REVIEW.some((food) => food.selectionId === "fetaost"), "Fetaost får inte automatiskt ersättas av salladsost.");

console.log(`SLV core mapping verified: ${SLV_CORE_RESOLVED.length} resolved and ${SLV_CORE_REVIEW.length} held for review.`);

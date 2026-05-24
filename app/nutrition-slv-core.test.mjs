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
  for (const key of ["kcal", "fat", "protein", "carbs", "sodiumMg", "potassiumMg", "magnesiumMg"]) {
    assert(Number.isFinite(food.nutrientsPer100g[key]), `${key} saknas: ${food.selectionId}`);
  }
}

const avocado = SLV_CORE_RESOLVED.find((food) => food.selectionId === "avokado");
assert(avocado.slvFoodNumber === 320, "Avokado ska matcha officiell post 320.");
assert(avocado.nutrientsPer100g.potassiumMg === 600, "Avokado ska använda SLV:s kaliumvärde.");
assert(SLV_CORE_REVIEW.some((food) => food.selectionId === "fetaost"), "Fetaost får inte automatiskt ersättas av salladsost.");

console.log(`SLV core mapping verified: ${SLV_CORE_RESOLVED.length} resolved and ${SLV_CORE_REVIEW.length} held for review.`);


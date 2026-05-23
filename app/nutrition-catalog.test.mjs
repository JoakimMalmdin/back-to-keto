import {
  CONFIDENCE_LEVELS,
  NUTRITION_CATALOG,
  NUTRITION_CATEGORIES,
  SOURCE_TYPES,
  findFoodById,
} from "./nutrition-catalog.mjs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const categoryIds = new Set(Object.keys(NUTRITION_CATEGORIES));
const ids = new Set();

for (const food of NUTRITION_CATALOG) {
  assert(!ids.has(food.id), `Dubblett-id: ${food.id}`);
  ids.add(food.id);
  assert(categoryIds.has(food.category), `Okänd kategori för ${food.id}: ${food.category}`);
  assert(food.macroSource?.type, `Makrokälla saknas för ${food.id}`);
  assert(food.macroSource?.verifiedDate, `Verifieringsdatum saknas för ${food.id}`);
  assert(Number.isFinite(food.nutrientsPer100g.kcal), `kcal saknas for ${food.id}`);
  assert(Array.isArray(food.measures), `Måttform saknas för ${food.id}`);
}

const seltin = findFoodById("seltin");
assert(seltin.electrolyteSource.type === SOURCE_TYPES.productLabel, "Seltin ska läsa elektrolyter från etiketten.");
assert(seltin.electrolyteSource.confidence === CONFIDENCE_LEVELS.label, "Seltin ska vara etikettverifierad.");
assert(seltin.measures.some((entry) => entry.unit === "krm"), "Seltin ska stödja krm.");

const tuna = findFoodById("ica-tonfisk-i-vatten");
assert(tuna.measures.some((entry) => entry.unit === "burk"), "Tonfisk i vatten ska stödja burk.");

const yoghurt = findFoodById("grekisk-yoghurt-10");
assert(yoghurt.measures.some((entry) => entry.unit === "dl"), "Grekisk yoghurt ska stödja dl.");

console.log(`Nutrition catalog foundation verified: ${NUTRITION_CATALOG.length} labelled products, ${categoryIds.size} categories.`);

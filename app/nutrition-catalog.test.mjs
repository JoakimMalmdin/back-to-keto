import {
  CONFIDENCE_LEVELS,
  NUTRITION_CATALOG,
  NUTRITION_CATEGORIES,
  SOURCE_TYPES,
  SUPPORTED_LOCALES,
  UNIT_DEFINITIONS,
  categoryName,
  findFoodById,
  foodAliases,
  foodName,
} from "./nutrition-catalog.mjs";
import { UI_LOCALES, uiText } from "./locales.mjs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const categoryIds = new Set(Object.keys(NUTRITION_CATEGORIES));
const unitIds = new Set(Object.keys(UNIT_DEFINITIONS));
const ids = new Set();

for (const locale of SUPPORTED_LOCALES) {
  assert(UI_LOCALES[locale], `UI-språk saknas: ${locale}`);
  assert(categoryName("seafood", locale), `Översättning saknas för fiskkategori: ${locale}`);
}

for (const food of NUTRITION_CATALOG) {
  assert(!ids.has(food.id), `Dubblett-id: ${food.id}`);
  ids.add(food.id);
  assert(categoryIds.has(food.category), `Okänd kategori för ${food.id}: ${food.category}`);
  assert(food.macroSource?.type, `Makrokälla saknas för ${food.id}`);
  assert(food.macroSource?.verifiedDate, `Verifieringsdatum saknas för ${food.id}`);
  assert(Number.isFinite(food.nutrientsPer100g.kcal), `kcal saknas för ${food.id}`);
  assert(Array.isArray(food.measures), `Måttform saknas för ${food.id}`);
  for (const locale of SUPPORTED_LOCALES) {
    assert(foodName(food, locale), `Visningsnamn saknas för ${food.id}: ${locale}`);
    assert((food.aliases[locale] || []).length > 0, `Alias saknas för ${food.id}: ${locale}`);
  }
  for (const entry of food.measures) {
    assert(unitIds.has(entry.unit), `Okänd måttenhet för ${food.id}: ${entry.unit}`);
  }
}

const seltin = findFoodById("seltin");
assert(seltin.electrolyteSource.type === SOURCE_TYPES.productLabel, "Seltin ska läsa elektrolyter från etiketten.");
assert(seltin.electrolyteSource.confidence === CONFIDENCE_LEVELS.label, "Seltin ska vara etikettverifierad.");
assert(seltin.measures.some((entry) => entry.unit === "pinch"), "Seltin ska stödja krm/pinch.");
assert(foodAliases(seltin).includes("reduced-sodium salt"), "Seltin ska kunna kännas igen på engelska.");

const tuna = findFoodById("ica-tonfisk-i-vatten");
assert(tuna.measures.some((entry) => entry.unit === "tin"), "Tonfisk i vatten ska stödja burk/tin.");
assert(foodAliases(tuna).includes("tuna in water"), "Tonfisk i vatten ska kunna kännas igen på engelska.");

const yoghurt = findFoodById("grekisk-yoghurt-10");
assert(yoghurt.measures.some((entry) => entry.unit === "dl"), "Grekisk yoghurt ska stödja dl.");
assert(foodName(yoghurt, "en-GB") === "Greek yoghurt 10%", "Brittisk stavning ska använda yoghurt.");

assert(uiText("sv-SE", "currentMacros") === "Aktuell makrobild", "Svensk UI-text saknas.");
assert(uiText("en-GB", "currentMacros") === "Current macros", "Engelsk UI-text saknas.");

console.log(`Nutrition catalogue foundation verified: ${NUTRITION_CATALOG.length} labelled products, ${categoryIds.size} categories, ${SUPPORTED_LOCALES.length} locales.`);
